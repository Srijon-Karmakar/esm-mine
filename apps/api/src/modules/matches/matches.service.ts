import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MatchEventType, PrimaryRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AddMatchEventDto,
  CreateMatchDto,
  SetLineupDto,
  UpdateMatchSquadDto,
  UpdateMatchStatusDto,
} from './dto';
import { StatsEngineService } from '../stats/stats-engine.service';
import { StandingsEngineService } from '../seasons/standings-engine.service';
import { buildPlayerHealthSummary } from '../players/player-health';

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private statsEngine: StatsEngineService,
    private standingsEngine: StandingsEngineService,
  ) {}

  /* ============================================================
     COMMON HELPERS
  ============================================================ */

  private async assertClubMember(userId: string, clubId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      select: { primary: true },
    });

    if (!membership) throw new ForbiddenException('No club access');
    return membership;
  }

  private assertManageRole(primary: PrimaryRole) {
    const allowed = new Set<PrimaryRole>([
      PrimaryRole.ADMIN,
      PrimaryRole.MANAGER,
    ]);
    if (!allowed.has(primary)) {
      throw new ForbiddenException('Insufficient role');
    }
  }

  private async safeRecomputeStandingsForMatch(matchId: string) {
    try {
      await this.standingsEngine.recomputeSeasonStandingsForMatch(matchId);
    } catch (error) {
      console.error('Standings recompute failed:', error);
    }
  }

  private async assertMatchExists(clubId: string, matchId: string) {
    const match = await this.prisma.match.findFirst({
      where: { id: matchId, clubId },
      select: { id: true, squadId: true },
    });
    if (!match) throw new NotFoundException('Match not found');
    return match;
  }

  private async safeRecompute(clubId: string, matchId: string) {
    try {
      await this.statsEngine.recomputeMatchStats(clubId, matchId);
    } catch (error) {
      console.error('Stats recompute failed:', error);
    }
  }

  private async clearLineupForSide(tx: any, matchId: string, side: 'HOME' | 'AWAY') {
    const existingLineups = await tx.matchLineup.findMany({
      where: { matchId, side },
      select: { id: true },
    });
    const lineupIds = existingLineups.map((lineup: { id: string }) => lineup.id);
    if (!lineupIds.length) return;

    await tx.matchLineupPlayer.deleteMany({
      where: { lineupId: { in: lineupIds } },
    });
    await tx.matchLineup.deleteMany({
      where: { id: { in: lineupIds } },
    });
  }

  private validateLineupPlayers(dto: SetLineupDto) {
    const allPlayers = [...dto.starting, ...dto.bench];
    const userIds = allPlayers.map((player) => player.userId?.trim());

    if (userIds.some((userId) => !userId)) {
      throw new BadRequestException('Each lineup player requires a valid userId');
    }

    const uniqueUserIds = new Set(userIds as string[]);
    if (uniqueUserIds.size !== userIds.length) {
      throw new BadRequestException(
        'A player cannot appear in both starting and bench lists',
      );
    }

    const captainUserId = dto.captainUserId?.trim() || null;
    if (captainUserId && !uniqueUserIds.has(captainUserId)) {
      throw new BadRequestException('Captain must be part of the selected lineup');
    }

    return {
      captainUserId,
      uniqueUserIds: Array.from(uniqueUserIds.values()),
    };
  }

  private async assertEligibleLineupPlayers(
    clubId: string,
    matchId: string,
    side: 'HOME' | 'AWAY',
    dto: SetLineupDto,
  ) {
    const match = await this.assertMatchExists(clubId, matchId);
    const normalized = this.validateLineupPlayers(dto);

    if (side === 'AWAY') {
      return normalized;
    }

    if (!match.squadId) {
      throw new BadRequestException(
        'Assign a squad to this match before saving the lineup',
      );
    }

    const eligibleMembers = await this.prisma.squadMember.findMany({
      where: {
        squadId: match.squadId,
        userId: { in: normalized.uniqueUserIds },
      },
      select: { userId: true },
    });
    const eligibleUserIds = new Set(eligibleMembers.map((member) => member.userId));
    const invalidUserIds = normalized.uniqueUserIds.filter(
      (userId) => !eligibleUserIds.has(userId),
    );
    if (invalidUserIds.length) {
      throw new BadRequestException(
        'Only players assigned to the selected match squad can be in the lineup',
      );
    }

    return normalized;
  }

  private async getLineupHealthMap(clubId: string, userIds: string[]) {
    if (!userIds.length) return new Map<string, any>();

    const [profiles, injuries] = await Promise.all([
      this.prisma.playerProfile.findMany({
        where: { userId: { in: userIds } },
      }),
      this.prisma.playerInjury.findMany({
        where: { clubId, userId: { in: userIds }, isActive: true },
        orderBy: { startDate: 'desc' },
      }),
    ]);

    const profileMap = new Map(profiles.map((profile) => [profile.userId, profile]));
    const severityRank: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const injuryMap = new Map<string, (typeof injuries)[number]>();

    for (const injury of injuries) {
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

    return new Map(
      userIds.map((userId) => {
        const profile = profileMap.get(userId) || null;
        const activeInjury = injuryMap.get(userId) || null;
        return [
          userId,
          {
            profile,
            activeInjury,
            health: buildPlayerHealthSummary(profile, activeInjury),
          },
        ];
      }),
    );
  }

  /* ============================================================
     MATCH CRUD
  ============================================================ */

  async createMatch(actorId: string, clubId: string, dto: CreateMatchDto) {
    const membership = await this.assertClubMember(actorId, clubId);
    this.assertManageRole(membership.primary);

    const kickoffAt = new Date(dto.kickoffAt);
    if (Number.isNaN(kickoffAt.getTime())) {
      throw new BadRequestException('Invalid kickoffAt');
    }

    const title = dto.title?.trim();
    const opponent = dto.opponent?.trim();
    const venue = dto.venue?.trim();

    if (!title) throw new BadRequestException('Invalid title');
    if (!opponent) throw new BadRequestException('Invalid opponent');

    if (dto.squadId) {
      const squad = await this.prisma.squad.findUnique({
        where: { id: dto.squadId },
      });

      if (!squad || squad.clubId !== clubId) {
        throw new BadRequestException('Invalid squad');
      }
    }

    return this.prisma.match.create({
      data: {
        clubId,
        squadId: dto.squadId ?? null,
        title,
        opponent,
        venue: venue || null,
        kickoffAt,
      },
      include: {
        squad: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async listMatches(actorId: string, clubId: string) {
    await this.assertClubMember(actorId, clubId);

    return this.prisma.match.findMany({
      where: { clubId },
      orderBy: { kickoffAt: 'desc' },
      include: {
        squad: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async getMatch(actorId: string, clubId: string, matchId: string) {
    await this.assertClubMember(actorId, clubId);

    const match = await this.prisma.match.findFirst({
      where: { id: matchId, clubId },
      include: {
        squad: { select: { id: true, name: true, code: true } },
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!match) throw new NotFoundException('Match not found');
    return match;
  }

  async updateStatus(
    actorId: string,
    clubId: string,
    matchId: string,
    dto: UpdateMatchStatusDto,
  ) {
    const membership = await this.assertClubMember(actorId, clubId);
    this.assertManageRole(membership.primary);

    await this.assertMatchExists(clubId, matchId);

    const updated = await this.prisma.match.update({
      where: { id: matchId },
      data: {
        status: dto.status,
        homeScore: dto.homeScore ?? undefined,
        awayScore: dto.awayScore ?? undefined,
      },
      include: {
        squad: { select: { id: true, name: true, code: true } },
      },
    });

    await this.safeRecompute(clubId, matchId);
    await this.safeRecomputeStandingsForMatch(matchId);
    return updated;
  }

  /* ============================================================
     MATCH EVENTS
  ============================================================ */

  async addEvent(
    actorId: string,
    clubId: string,
    matchId: string,
    dto: AddMatchEventDto,
  ) {
    const membership = await this.assertClubMember(actorId, clubId);
    this.assertManageRole(membership.primary);

    await this.assertMatchExists(clubId, matchId);

    const event = await this.prisma.$transaction(async (tx) => {
      const created = await tx.matchEvent.create({
        data: {
          matchId,
          clubId,
          type: dto.type,
          minute: dto.minute ?? null,
          team: dto.team ?? null,
          notes: dto.notes?.trim() ?? null,
          playerId: dto.playerId ?? null,
          assistId: dto.assistId ?? null,
        },
      });

      if (dto.type === MatchEventType.GOAL && dto.team) {
        await tx.match.update({
          where: { id: matchId },
          data:
            dto.team === 'HOME'
              ? { homeScore: { increment: 1 } }
              : { awayScore: { increment: 1 } },
        });
      }

      return created;
    });

    await this.safeRecompute(clubId, matchId);
    if (dto.type === MatchEventType.GOAL) {
      await this.safeRecomputeStandingsForMatch(matchId);
    }

    return event;
  }

  async updateMatchSquad(
    actorId: string,
    clubId: string,
    matchId: string,
    dto: UpdateMatchSquadDto,
  ) {
    await this.assertClubMember(actorId, clubId);

    const match = await this.assertMatchExists(clubId, matchId);
    const nextSquadId = dto.squadId?.trim() || null;

    if (nextSquadId) {
      const squad = await this.prisma.squad.findUnique({
        where: { id: nextSquadId },
        select: { id: true, clubId: true },
      });
      if (!squad || squad.clubId !== clubId) {
        throw new BadRequestException('Invalid squad');
      }
    }

    const didChangeSquad = match.squadId !== nextSquadId;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (didChangeSquad) {
        await this.clearLineupForSide(tx, matchId, 'HOME');
      }

      return tx.match.update({
        where: { id: matchId },
        data: { squadId: nextSquadId },
        include: {
          squad: { select: { id: true, name: true, code: true } },
        },
      });
    });

    if (didChangeSquad) {
      await this.safeRecompute(clubId, matchId);
    }

    return updated;
  }

  async getLineupWorkspace(actorId: string, clubId: string, matchId: string) {
    await this.assertClubMember(actorId, clubId);

    const [match, availableSquads, homeLineup] = await Promise.all([
      this.prisma.match.findFirst({
        where: { id: matchId, clubId },
        include: {
          squad: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.squad.findMany({
        where: { clubId },
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { members: true } },
        },
      }),
      this.prisma.matchLineup.findUnique({
        where: { matchId_side: { matchId, side: 'HOME' } },
        include: {
          players: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      }),
    ]);

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    let selectedSquad: any = null;
    if (match.squadId) {
      selectedSquad = await this.prisma.squad.findFirst({
        where: { id: match.squadId, clubId },
        include: {
          _count: { select: { members: true } },
          members: {
            orderBy: [{ jerseyNo: 'asc' }, { createdAt: 'asc' }],
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                  playerProfile: true,
                },
              },
            },
          },
        },
      });
    }

    const rosterUserIds =
      selectedSquad?.members?.map((member: { userId: string }) => member.userId) || [];
    const healthByUserId = await this.getLineupHealthMap(clubId, rosterUserIds);
    const lineupByUserId = new Map(
      (homeLineup?.players || []).map((player) => [player.userId, player]),
    );

    const roster = (selectedSquad?.members || []).map((member: any) => {
      const currentLineupPlayer = lineupByUserId.get(member.userId);
      const healthState =
        healthByUserId.get(member.userId) || {
          profile: member.user.playerProfile || null,
          activeInjury: null,
          health: buildPlayerHealthSummary(member.user.playerProfile || null, null),
        };

      return {
        squadMemberId: member.id,
        userId: member.userId,
        user: {
          id: member.user.id,
          email: member.user.email,
          fullName: member.user.fullName,
        },
        jerseyNo: currentLineupPlayer?.jerseyNo ?? member.jerseyNo ?? null,
        position:
          currentLineupPlayer?.position ??
          member.position ??
          member.user.playerProfile?.positions?.[0] ??
          null,
        profile: member.user.playerProfile || null,
        health: healthState.health,
        activeInjury: healthState.activeInjury,
        selectedSlot: currentLineupPlayer?.slot ?? null,
      };
    });

    const availability = {
      fit: 0,
      caution: 0,
      unavailable: 0,
      noData: 0,
    };

    for (const player of roster) {
      if (player.health.status === 'FIT') availability.fit += 1;
      if (player.health.status === 'CAUTION') availability.caution += 1;
      if (player.health.status === 'UNAVAILABLE') availability.unavailable += 1;
      if (player.health.status === 'NO_DATA') availability.noData += 1;
    }

    return {
      match,
      availableSquads,
      selectedSquad,
      availability,
      lineup: {
        id: homeLineup?.id ?? null,
        formation: homeLineup?.formation ?? null,
        captainUserId: homeLineup?.captainUserId ?? null,
        starting: (homeLineup?.players || []).filter(
          (player) => player.slot === 'STARTING',
        ),
        bench: (homeLineup?.players || []).filter(
          (player) => player.slot === 'BENCH',
        ),
      },
      roster,
    };
  }

  /* ============================================================
     LINEUPS
  ============================================================ */

  async setLineup(
    actorId: string,
    clubId: string,
    matchId: string,
    side: 'HOME' | 'AWAY',
    dto: SetLineupDto,
  ) {
    await this.assertClubMember(actorId, clubId);
    const { captainUserId } = await this.assertEligibleLineupPlayers(
      clubId,
      matchId,
      side,
      dto,
    );

    await this.prisma.$transaction(async (tx) => {
      await this.clearLineupForSide(tx, matchId, side);

      const lineup = await tx.matchLineup.create({
        data: {
          matchId,
          clubId,
          side,
          formation: dto.formation ?? null,
          captainUserId,
        },
      });

      const playersData = [
        ...dto.starting.map((player, index) => ({
          lineupId: lineup.id,
          userId: player.userId,
          slot: 'STARTING' as const,
          jerseyNo: player.jerseyNo ?? null,
          position: player.position ?? null,
          order: index,
        })),
        ...dto.bench.map((player, index) => ({
          lineupId: lineup.id,
          userId: player.userId,
          slot: 'BENCH' as const,
          jerseyNo: player.jerseyNo ?? null,
          position: player.position ?? null,
          order: index,
        })),
      ];

      if (playersData.length) {
        await tx.matchLineupPlayer.createMany({
          data: playersData,
        });
      }
    });

    await this.safeRecompute(clubId, matchId);

    return this.getLineup(actorId, clubId, matchId);
  }

  async getLineup(actorId: string, clubId: string, matchId: string) {
    await this.assertClubMember(actorId, clubId);

    return this.prisma.matchLineup.findMany({
      where: { matchId, clubId },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }
}
