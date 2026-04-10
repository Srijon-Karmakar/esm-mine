import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertPlayerProfileDto } from './dto';
import { PrimaryRole, SubRole } from '@prisma/client';
import { buildPlayerHealthSummary } from './player-health';

@Injectable()
export class PlayersService {
  constructor(private prisma: PrismaService) {}

  async upsertMyProfile(userId: string, dto: UpsertPlayerProfileDto) {
    if (!userId) throw new BadRequestException('Missing user');

    const dob = dto.dob ? new Date(dto.dob) : undefined;
    const wellnessStatus = dto.wellnessStatus?.trim().toUpperCase();
    const normalizedWellnessStatus =
      wellnessStatus === 'FIT' ||
      wellnessStatus === 'LIMITED' ||
      wellnessStatus === 'UNAVAILABLE'
        ? wellnessStatus
        : dto.wellnessStatus === undefined || dto.wellnessStatus === null
          ? undefined
          : null;
    const healthNotes = dto.healthNotes?.trim();
    const shouldStampHealthUpdate =
      normalizedWellnessStatus !== undefined ||
      dto.readinessScore !== undefined ||
      dto.energyLevel !== undefined ||
      dto.sorenessLevel !== undefined ||
      dto.sleepHours !== undefined ||
      dto.healthNotes !== undefined;

    const profile = await this.prisma.playerProfile.upsert({
      where: { userId },
      update: {
        dob: dob ?? undefined,
        nationality: dto.nationality?.trim() ?? undefined,
        heightCm: dto.heightCm ?? undefined,
        weightKg: dto.weightKg ?? undefined,
        dominantFoot: dto.dominantFoot ?? undefined,
        positions: dto.positions ?? undefined,
        wellnessStatus: normalizedWellnessStatus,
        readinessScore: dto.readinessScore ?? undefined,
        energyLevel: dto.energyLevel ?? undefined,
        sorenessLevel: dto.sorenessLevel ?? undefined,
        sleepHours: dto.sleepHours ?? undefined,
        healthNotes:
          dto.healthNotes === undefined
            ? undefined
            : healthNotes || null,
        healthUpdatedAt: shouldStampHealthUpdate ? new Date() : undefined,
      },
      create: {
        userId,
        dob: dob ?? null,
        nationality: dto.nationality?.trim() || null,
        heightCm: dto.heightCm ?? null,
        weightKg: dto.weightKg ?? null,
        dominantFoot: dto.dominantFoot ?? null,
        positions: dto.positions ?? [],
        wellnessStatus: normalizedWellnessStatus ?? null,
        readinessScore: dto.readinessScore ?? null,
        energyLevel: dto.energyLevel ?? null,
        sorenessLevel: dto.sorenessLevel ?? null,
        sleepHours: dto.sleepHours ?? null,
        healthNotes: healthNotes || null,
        healthUpdatedAt: shouldStampHealthUpdate ? new Date() : null,
      },
      include: { user: { select: { id: true, email: true, fullName: true } } },
    });

    return profile;
  }

  async getMe(userId: string) {
    const profile = await this.prisma.playerProfile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, email: true, fullName: true } } },
    });

    return profile; // can be null if not created yet
  }

  private async assertClubMember(userId: string, clubId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      select: { primary: true },
    });

    if (!membership) throw new ForbiddenException('No club access');
    return membership;
  }

  // club can list players (ADMIN/MANAGER typically)
  async listClubPlayers(actorUserId: string, clubId: string) {
    await this.assertClubMember(actorUserId, clubId);

    // Only list members who are PLAYER primary role
    const memberships = await this.prisma.membership.findMany({
      where: { clubId, primary: PrimaryRole.PLAYER },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const userIds = memberships.map((m) => m.userId);

    const profiles = await this.prisma.playerProfile.findMany({
      where: { userId: { in: userIds } },
    });
    const activeInjuries = await this.prisma.playerInjury.findMany({
      where: { clubId, userId: { in: userIds }, isActive: true },
      orderBy: { startDate: 'desc' },
    });

    const profileMap = new Map(profiles.map((p) => [p.userId, p]));
    const severityRank: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const injuryMap = new Map<string, (typeof activeInjuries)[number]>();
    for (const injury of activeInjuries) {
      const current = injuryMap.get(injury.userId);
      if (!current) {
        injuryMap.set(injury.userId, injury);
        continue;
      }
      const nextRank = severityRank[String(injury.severity || '').toUpperCase()] || 0;
      const currentRank =
        severityRank[String(current.severity || '').toUpperCase()] || 0;
      if (nextRank > currentRank) {
        injuryMap.set(injury.userId, injury);
      }
    }

    return memberships.map((m) => ({
      user: m.user,
      membershipId: m.id,
      isCaptain: Array.isArray(m.subRoles)
        ? m.subRoles.includes(SubRole.CAPTAIN)
        : false,
      profile: profileMap.get(m.userId) || null,
      activeInjury: injuryMap.get(m.userId) || null,
      health: buildPlayerHealthSummary(
        profileMap.get(m.userId) || null,
        injuryMap.get(m.userId) || null,
      ),
    }));
  }
}
