import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateScheduleEventDto, ScheduleTargetGroup } from './dto/create-schedule-event.dto';
import { PrimaryRole, SubRole } from '@prisma/client';

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

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  async createScheduleEvent(userId: string, clubId: string, dto: CreateScheduleEventDto) {
    const membership = await this.assertMembership(userId, clubId);
    const eventAt = new Date(dto.eventAt);
    if (Number.isNaN(eventAt.getTime())) {
      throw new BadRequestException('Invalid event date');
    }

    const targetGroups = this.normalizeTargetGroups(dto.targetGroups, membership);

    return this.prisma.scheduleEvent.create({
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
    if (membership.primary === PrimaryRole.PLAYER) {
      groups.add(ScheduleTargetGroup.Players);
    } else {
      ALL_SCHEDULE_GROUPS.forEach((group) => groups.add(group));
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
    event: { targetGroups: string[]; privateToUserId: string | null },
    membership: MembershipRecord,
    membershipGroups: Set<ScheduleTargetGroup>,
  ) {
    if (event.privateToUserId) {
      return event.privateToUserId === membership.userId;
    }

    if (!event.targetGroups.length) {
      return true;
    }

    return event.targetGroups.some((group) => membershipGroups.has(group as ScheduleTargetGroup));
  }
}
