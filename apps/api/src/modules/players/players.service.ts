import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePlayerTrainingLoadDto,
  UpdateMyPlayerHealthDto,
  UpsertPlayerProfileDto,
} from './dto';
import { PrimaryRole, SubRole } from '@prisma/client';
import { buildPlayerHealthSummary } from './player-health';

@Injectable()
export class PlayersService {
  constructor(private prisma: PrismaService) {}

  private daysFromRange(range: string) {
    const raw = String(range || '30d')
      .toLowerCase()
      .trim();
    if (raw.endsWith('d')) return Math.max(1, parseInt(raw) || 30);
    if (raw.endsWith('w')) return Math.max(7, (parseInt(raw) || 4) * 7);
    if (raw.endsWith('m')) return Math.max(30, (parseInt(raw) || 1) * 30);
    return 30;
  }

  private isStorageUnavailable(error: any, modelName: string) {
    const code = String(error?.code || '');
    const message = String(error?.message || '');
    return (
      code === 'P2021' ||
      code === 'P2022' ||
      code === 'P2010' ||
      new RegExp(modelName, 'i').test(message) ||
      /does not exist/i.test(message) ||
      /Invalid .* invocation/i.test(message)
    );
  }

  private normalizeWellnessStatus(input?: string | null) {
    const wellnessStatus = input?.trim().toUpperCase();
    return wellnessStatus === 'FIT' ||
      wellnessStatus === 'LIMITED' ||
      wellnessStatus === 'UNAVAILABLE'
      ? wellnessStatus
      : input === undefined || input === null
        ? undefined
        : null;
  }

  private buildHealthPatch(
    dto: UpdateMyPlayerHealthDto | UpsertPlayerProfileDto,
  ) {
    const normalizedWellnessStatus = this.normalizeWellnessStatus(
      dto.wellnessStatus,
    );
    const healthNotes = dto.healthNotes?.trim();
    const shouldStampHealthUpdate =
      normalizedWellnessStatus !== undefined ||
      dto.hasInjury !== undefined ||
      dto.readinessScore !== undefined ||
      dto.energyLevel !== undefined ||
      dto.sorenessLevel !== undefined ||
      dto.sleepHours !== undefined ||
      dto.healthNotes !== undefined;

    return {
      normalizedWellnessStatus,
      healthNotes,
      shouldStampHealthUpdate,
    };
  }

  async updateMyHealthProfile(
    userId: string,
    clubId: string | undefined,
    dto: UpdateMyPlayerHealthDto,
  ) {
    if (!userId) throw new BadRequestException('Missing user');

    const { normalizedWellnessStatus, healthNotes, shouldStampHealthUpdate } =
      this.buildHealthPatch(dto);

    const profile = await this.prisma.playerProfile.upsert({
      where: { userId },
      update: {
        wellnessStatus: normalizedWellnessStatus,
        hasInjury: dto.hasInjury ?? undefined,
        readinessScore: dto.readinessScore ?? undefined,
        energyLevel: dto.energyLevel ?? undefined,
        sorenessLevel: dto.sorenessLevel ?? undefined,
        sleepHours: dto.sleepHours ?? undefined,
        healthNotes:
          dto.healthNotes === undefined ? undefined : healthNotes || null,
        healthUpdatedAt: shouldStampHealthUpdate ? new Date() : undefined,
      },
      create: {
        userId,
        dob: null,
        nationality: null,
        heightCm: null,
        weightKg: null,
        dominantFoot: null,
        positions: [],
        wellnessStatus: normalizedWellnessStatus ?? null,
        hasInjury: dto.hasInjury ?? null,
        readinessScore: dto.readinessScore ?? null,
        energyLevel: dto.energyLevel ?? null,
        sorenessLevel: dto.sorenessLevel ?? null,
        sleepHours: dto.sleepHours ?? null,
        healthNotes: healthNotes || null,
        healthUpdatedAt: shouldStampHealthUpdate ? new Date() : null,
      },
      include: { user: { select: { id: true, email: true, fullName: true } } },
    });

    const resolvedClubId =
      clubId ||
      (
        await this.prisma.membership.findFirst({
          where: { userId },
          select: { clubId: true },
          orderBy: { createdAt: 'asc' },
        })
      )?.clubId;

    const wellnessRepo = (this.prisma as any).playerWellnessEntry;
    if (resolvedClubId && wellnessRepo?.create && shouldStampHealthUpdate) {
      try {
        await wellnessRepo.create({
          data: {
            clubId: resolvedClubId,
            userId,
            wellnessStatus: normalizedWellnessStatus ?? null,
            hasInjury: dto.hasInjury ?? null,
            readinessScore: dto.readinessScore ?? null,
            energyLevel: dto.energyLevel ?? null,
            sorenessLevel: dto.sorenessLevel ?? null,
            sleepHours: dto.sleepHours ?? null,
            healthNotes: healthNotes || null,
            recordedAt: new Date(),
          },
        });
      } catch (error) {
        if (!this.isStorageUnavailable(error, 'PlayerWellnessEntry')) {
          throw error;
        }
      }
    }

    return profile;
  }

  async updateClubPlayerProfile(
    actorUserId: string,
    clubId: string,
    targetUserId: string,
    dto: UpsertPlayerProfileDto,
  ) {
    if (!actorUserId) throw new BadRequestException('Missing actor');
    if (!targetUserId?.trim())
      throw new BadRequestException('Missing target user');

    const actorMembership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId: actorUserId, clubId } },
      select: { primary: true },
    });
    if (!actorMembership) throw new ForbiddenException('No club access');
    if (actorMembership.primary !== PrimaryRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can upload player data');
    }

    const targetMembership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId: targetUserId, clubId } },
      select: { primary: true },
    });
    if (!targetMembership)
      throw new ForbiddenException('Target user is not in this club');

    const { normalizedWellnessStatus, healthNotes, shouldStampHealthUpdate } =
      this.buildHealthPatch(dto);
    const dob = dto.dob ? new Date(dto.dob) : undefined;

    return this.prisma.playerProfile.upsert({
      where: { userId: targetUserId },
      update: {
        dob: dob ?? undefined,
        nationality: dto.nationality?.trim() ?? undefined,
        heightCm: dto.heightCm ?? undefined,
        weightKg: dto.weightKg ?? undefined,
        dominantFoot: dto.dominantFoot ?? undefined,
        positions: dto.positions ?? undefined,
        wellnessStatus: normalizedWellnessStatus,
        hasInjury: dto.hasInjury ?? undefined,
        readinessScore: dto.readinessScore ?? undefined,
        energyLevel: dto.energyLevel ?? undefined,
        sorenessLevel: dto.sorenessLevel ?? undefined,
        sleepHours: dto.sleepHours ?? undefined,
        healthNotes:
          dto.healthNotes === undefined ? undefined : healthNotes || null,
        healthUpdatedAt: shouldStampHealthUpdate ? new Date() : undefined,
      },
      create: {
        userId: targetUserId,
        dob: dob ?? null,
        nationality: dto.nationality?.trim() || null,
        heightCm: dto.heightCm ?? null,
        weightKg: dto.weightKg ?? null,
        dominantFoot: dto.dominantFoot ?? null,
        positions: dto.positions ?? [],
        wellnessStatus: normalizedWellnessStatus ?? null,
        hasInjury: dto.hasInjury ?? null,
        readinessScore: dto.readinessScore ?? null,
        energyLevel: dto.energyLevel ?? null,
        sorenessLevel: dto.sorenessLevel ?? null,
        sleepHours: dto.sleepHours ?? null,
        healthNotes: healthNotes || null,
        healthUpdatedAt: shouldStampHealthUpdate ? new Date() : null,
      },
      include: { user: { select: { id: true, email: true, fullName: true } } },
    });
  }

  async getMe(userId: string) {
    const profile = await this.prisma.playerProfile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, email: true, fullName: true } } },
    });

    return profile; // can be null if not created yet
  }

  async getMyHistory(
    userId: string,
    clubId: string | undefined,
    range: string,
  ) {
    if (!userId) throw new BadRequestException('Missing user');

    const membership = clubId
      ? await this.prisma.membership.findUnique({
          where: { userId_clubId: { userId, clubId } },
          select: { clubId: true },
        })
      : await this.prisma.membership.findFirst({
          where: { userId },
          orderBy: { createdAt: 'asc' },
          select: { clubId: true },
        });

    if (!membership?.clubId) {
      return { clubId: clubId || null, wellnessEntries: [], trainingLoads: [] };
    }

    const from = new Date(Date.now() - this.daysFromRange(range) * 86400000);
    const wellnessRepo = (this.prisma as any).playerWellnessEntry;
    const trainingRepo = (this.prisma as any).playerTrainingLoadEntry;

    let wellnessEntries: any[] = [];
    let trainingLoads: any[] = [];

    try {
      if (wellnessRepo?.findMany) {
        wellnessEntries = await wellnessRepo.findMany({
          where: {
            clubId: membership.clubId,
            userId,
            recordedAt: { gte: from },
          },
          orderBy: [{ recordedAt: 'desc' }, { createdAt: 'desc' }],
          take: 30,
        });
      }
    } catch (error) {
      if (!this.isStorageUnavailable(error, 'PlayerWellnessEntry')) {
        throw error;
      }
    }

    try {
      if (trainingRepo?.findMany) {
        trainingLoads = await trainingRepo.findMany({
          where: {
            clubId: membership.clubId,
            userId,
            sessionDate: { gte: from },
          },
          orderBy: [{ sessionDate: 'desc' }, { createdAt: 'desc' }],
          take: 30,
          include: {
            createdBy: { select: { id: true, fullName: true, email: true } },
          },
        });
      }
    } catch (error) {
      if (!this.isStorageUnavailable(error, 'PlayerTrainingLoadEntry')) {
        throw error;
      }
    }

    return {
      clubId: membership.clubId,
      wellnessEntries,
      trainingLoads,
    };
  }

  private async assertClubMember(userId: string, clubId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      select: { primary: true },
    });

    if (!membership) throw new ForbiddenException('No club access');
    return membership;
  }

  async listPlayerTrainingLoads(
    actorUserId: string,
    clubId: string,
    targetUserId: string,
    range: string,
  ) {
    await this.assertClubMember(actorUserId, clubId);

    const targetMembership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId: targetUserId, clubId } },
      select: { userId: true },
    });
    if (!targetMembership) {
      throw new ForbiddenException('Target user is not in this club');
    }

    const repo = (this.prisma as any).playerTrainingLoadEntry;
    if (!repo?.findMany) return [];

    try {
      return await repo.findMany({
        where: {
          clubId,
          userId: targetUserId,
          sessionDate: {
            gte: new Date(Date.now() - this.daysFromRange(range) * 86400000),
          },
        },
        orderBy: [{ sessionDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          createdBy: { select: { id: true, fullName: true, email: true } },
        },
      });
    } catch (error) {
      if (this.isStorageUnavailable(error, 'PlayerTrainingLoadEntry')) {
        return [];
      }
      throw error;
    }
  }

  async createPlayerTrainingLoad(
    actorUserId: string,
    clubId: string,
    targetUserId: string,
    dto: CreatePlayerTrainingLoadDto,
  ) {
    if (!actorUserId) throw new BadRequestException('Missing actor');

    const actorMembership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId: actorUserId, clubId } },
      select: { primary: true },
    });
    if (!actorMembership) throw new ForbiddenException('No club access');
    if (actorMembership.primary !== PrimaryRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can upload training load');
    }

    const targetMembership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId: targetUserId, clubId } },
      select: { userId: true },
    });
    if (!targetMembership) {
      throw new ForbiddenException('Target user is not in this club');
    }

    const repo = (this.prisma as any).playerTrainingLoadEntry;
    if (!repo?.create) {
      throw new ServiceUnavailableException(
        'Training load storage is not ready. Run Prisma migrate/db push and generate in apps/api.',
      );
    }

    try {
      return await repo.create({
        data: {
          clubId,
          userId: targetUserId,
          createdByUserId: actorUserId,
          sessionDate: new Date(dto.sessionDate),
          sessionType: dto.sessionType?.trim() || null,
          durationMinutes: dto.durationMinutes,
          rpe: dto.rpe,
          loadScore: Math.max(1, dto.durationMinutes * dto.rpe),
          notes: dto.notes?.trim() || null,
        },
        include: {
          createdBy: { select: { id: true, fullName: true, email: true } },
        },
      });
    } catch (error) {
      if (this.isStorageUnavailable(error, 'PlayerTrainingLoadEntry')) {
        throw new ServiceUnavailableException(
          'Training load storage is not ready. Run Prisma migrate/db push and generate in apps/api.',
        );
      }
      throw error;
    }
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
      const nextRank =
        severityRank[String(injury.severity || '').toUpperCase()] || 0;
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
