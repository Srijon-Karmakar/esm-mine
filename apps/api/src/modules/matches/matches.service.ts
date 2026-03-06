import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AddMatchEventDto,
  CreateMatchDto,
  UpdateMatchStatusDto,
  SetLineupDto,
} from './dto';
import { MatchEventType, PrimaryRole } from '@prisma/client';
import { StatsEngineService } from '../stats/stats-engine.service';
import { StandingsEngineService } from '../seasons/standings-engine.service';

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
    const m = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      select: { primary: true },
    });

    if (!m) throw new ForbiddenException('No club access');
    return m;
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
    } catch (e) {
      console.error('⚠️ Standings recompute failed:', e);
    }
  }

  private async assertMatchExists(clubId: string, matchId: string) {
    const match = await this.prisma.match.findFirst({
      where: { id: matchId, clubId },
      select: { id: true },
    });
    if (!match) throw new NotFoundException('Match not found');
    return match;
  }

  /** Call this after any stats-affecting write */
  private async safeRecompute(clubId: string, matchId: string) {
    try {
      await this.statsEngine.recomputeMatchStats(clubId, matchId);
    } catch (e) {
      // Don't crash match APIs if recompute fails; log and move on
      console.error('⚠️ Stats recompute failed:', e);
    }
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

    // No recompute needed here (no lineup/events yet)
    return this.prisma.match.create({
      data: {
        clubId,
        squadId: dto.squadId ?? null,
        title,
        opponent,
        venue: venue || null,
        kickoffAt,
      },
    });
  }

  async listMatches(actorId: string, clubId: string) {
    await this.assertClubMember(actorId, clubId);

    return this.prisma.match.findMany({
      where: { clubId },
      orderBy: { kickoffAt: 'desc' },
    });
  }

  async getMatch(actorId: string, clubId: string, matchId: string) {
    await this.assertClubMember(actorId, clubId);

    const match = await this.prisma.match.findFirst({
      where: { id: matchId, clubId },
      include: {
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
    });

    // ✅ status impacts duration calc (FINISHED) => recompute
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

      // Auto score update for goals
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

    // ✅ events affect stats => recompute after commit
    await this.safeRecompute(clubId, matchId);
    if (dto.type === MatchEventType.GOAL) {
      await this.safeRecomputeStandingsForMatch(matchId);
    }

    return event;
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
    const membership = await this.assertClubMember(actorId, clubId);
    this.assertManageRole(membership.primary);

    await this.assertMatchExists(clubId, matchId);

    // ✅ lineup affects minutes calc => do write first, then recompute
    await this.prisma.$transaction(async (tx) => {
      // Remove old lineup for that side
      await tx.matchLineup.deleteMany({
        where: { matchId, side },
      });

      const lineup = await tx.matchLineup.create({
        data: {
          matchId,
          clubId,
          side,
          formation: dto.formation ?? null,
          captainUserId: dto.captainUserId ?? null,
        },
      });

      const playersData = [
        ...dto.starting.map((p, i) => ({
          lineupId: lineup.id,
          userId: p.userId,
          slot: 'STARTING' as const,
          jerseyNo: p.jerseyNo ?? null,
          position: p.position ?? null,
          order: i,
        })),
        ...dto.bench.map((p, i) => ({
          lineupId: lineup.id,
          userId: p.userId,
          slot: 'BENCH' as const,
          jerseyNo: p.jerseyNo ?? null,
          position: p.position ?? null,
          order: i,
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
