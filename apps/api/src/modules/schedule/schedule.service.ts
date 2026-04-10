import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateScheduleEventDto, ScheduleTargetGroup } from './dto/create-schedule-event.dto';
import { PrimaryRole, ScheduleEvent, SubRole } from '@prisma/client';
import { NotificationService } from '../notifications/notification.service';

type MembershipRecord = {
  userId: string;
  primary: PrimaryRole;
  subRoles: SubRole[];
};

const SUB_ROLE_GROUP_MAP: Record<SubRole, ScheduleTargetGroup> = {
  COACH: ScheduleTargetGroup.Coaches,
  PHYSIO: ScheduleTargetGroup.Physios,
  AGENT: ScheduleTargetGroup.SupportStaff,
  NUTRITIONIST: ScheduleTargetGroup.Nutritionists,
  PITCH_MANAGER: ScheduleTargetGroup.PitchManagers,
  CAPTAIN: ScheduleTargetGroup.Players,
};

const ALL_SCHEDULE_GROUPS = Object.values(ScheduleTargetGroup);

const PRIMARY_ROLE_GROUP_MAP: Partial<Record<PrimaryRole, ScheduleTargetGroup[]>> = {
  ADMIN: [ScheduleTargetGroup.SupportStaff],
  MANAGER: [ScheduleTargetGroup.SupportStaff],
  MEMBER: [ScheduleTargetGroup.SupportStaff],
  PLAYER: [ScheduleTargetGroup.Players],
};

@Injectable()
export class ScheduleService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async createScheduleEvent(userId: string, clubId: string, dto: CreateScheduleEventDto) {
    const membership = await this.assertMembership(userId, clubId);
    const eventAt = new Date(dto.eventAt);
    if (Number.isNaN(eventAt.getTime())) {
      throw new BadRequestException('Invalid event date');
    }

    const targetGroups = this.normalizeTargetGroups(dto.targetGroups, membership);

    const created = await this.prisma.scheduleEvent.create({
      data: {
        clubId,
        createdByUserId: userId,
        type: dto.type,
        title: dto.title.trim(),
        description: dto.description?.trim() ?? null,
        eventAt,
        location: dto.location?.trim() ?? null,
        targetGroups,
        privateToUserId:
          membership.primary === PrimaryRole.PLAYER ? membership.userId : null,
      },
    });

    await this.notifyMembers(created);

    return created;
  }

  async listScheduleEvents(userId: string, clubId: string) {
    const membership = await this.assertMembership(userId, clubId);
    const events = await this.prisma.scheduleEvent.findMany({
      where: { clubId },
      orderBy: { eventAt: 'asc' },
    });

    const membershipGroups = this.buildMembershipGroups(membership);

    return events.filter((event) => this.canUserSeeEvent(event, membership, membershipGroups));
  }

  private async assertMembership(userId: string, clubId: string): Promise<MembershipRecord> {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      select: { userId: true, primary: true, subRoles: true },
    });

    if (!membership) {
      throw new ForbiddenException('No club access');
    }

    return membership;
  }

  private normalizeTargetGroups(
    groups: ScheduleTargetGroup[] | undefined,
    membership: MembershipRecord,
  ): ScheduleTargetGroup[] {
    if (groups && groups.length) {
      return Array.from(new Set(groups));
    }

    return membership.primary === PrimaryRole.PLAYER
      ? [ScheduleTargetGroup.Players]
      : [...ALL_SCHEDULE_GROUPS];
  }

  private buildMembershipGroups(membership: MembershipRecord) {
    const groups = new Set<ScheduleTargetGroup>();
    for (const group of PRIMARY_ROLE_GROUP_MAP[membership.primary] || []) {
      groups.add(group);
    }
    if (membership.primary === PrimaryRole.PLAYER) {
      groups.add(ScheduleTargetGroup.Players);
    }

    membership.subRoles.forEach((role) => {
      const mapped = SUB_ROLE_GROUP_MAP[role];
      if (mapped) {
        groups.add(mapped);
      }
    });

    return groups;
  }

  private canUserSeeEvent(
    event: { targetGroups: string[]; privateToUserId: string | null; createdByUserId: string },
    membership: MembershipRecord,
    membershipGroups: Set<ScheduleTargetGroup>,
  ) {
    if (event.privateToUserId) {
      return event.privateToUserId === membership.userId;
    }

    if (event.createdByUserId === membership.userId) {
      return true;
    }

    if (!event.targetGroups.length) {
      return true;
    }

    return event.targetGroups.some((group) => membershipGroups.has(group as ScheduleTargetGroup));
  }

  private async notifyMembers(event: ScheduleEvent) {
    const memberships = await this.prisma.membership.findMany({
      where: { clubId: event.clubId },
      select: { userId: true, primary: true, subRoles: true },
    });

    const recipients = new Set<string>();
    for (const membership of memberships) {
      const membershipGroups = this.buildMembershipGroups(membership);
      if (this.canUserSeeEvent(event, membership, membershipGroups)) {
        recipients.add(membership.userId);
      }
    }
    recipients.add(event.createdByUserId);

    if (!recipients.size) return;

    const eventTime = this.formatEventDate(event.eventAt);
    const title = event.title || `New ${event.type.toLowerCase()} scheduled`;
    const bodyParts = [`${event.type} • ${eventTime}`];
    if (event.location) bodyParts.push(`Location: ${event.location}`);
    const body = bodyParts.join(' · ');
    const link = `/dashboard/schedule?date=${eventTime.slice(0, 10)}`;

    await Promise.all(
      Array.from(recipients).map((userId) =>
        this.notificationService.create({
          clubId: event.clubId,
          userId,
          title,
          body,
          link,
          scheduleEventId: event.id,
        })
      )
    );
  }

  private formatEventDate(date: Date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return new Date().toISOString();
    }
    return date.toISOString();
  }
}
