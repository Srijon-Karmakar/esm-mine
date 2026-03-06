import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrimaryRole } from '@prisma/client';
import { StatsEngineService } from './stats-engine.service';

type Metric = 'goals' | 'assists' | 'minutes' | 'yellow' | 'red';

@Injectable()
export class StatsService {
  constructor(
    private prisma: PrismaService,
    private engine: StatsEngineService,
  ) {}

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
    if (!allowed.has(primary))
      throw new ForbiddenException('Insufficient role');
  }

  private parseRange(from?: string, to?: string) {
    const range: { gte?: Date; lte?: Date } = {};
    if (from) {
      const d = new Date(from);
      if (Number.isNaN(d.getTime()))
        throw new BadRequestException("Invalid 'from' date");
      range.gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (Number.isNaN(d.getTime()))
        throw new BadRequestException("Invalid 'to' date");
      range.lte = d;
    }
    return range;
  }

  // ✅ recompute cache for one match (ADMIN/MANAGER)
  async recomputeMatch(actorId: string, clubId: string, matchId: string) {
    const m = await this.assertClubMember(actorId, clubId);
    this.assertManageRole(m.primary);

    // ensure match exists
    const match = await this.prisma.match.findFirst({
      where: { id: matchId, clubId },
      select: { id: true },
    });
    if (!match) throw new NotFoundException('Match not found');

    return this.engine.recomputeMatchStats(clubId, matchId);
  }

  // ✅ player summary in a club (aggregated from cached stats)
  async getPlayerSummary(
    actorId: string,
    clubId: string,
    userId: string,
    from?: string,
    to?: string,
  ) {
    await this.assertClubMember(actorId, clubId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const kickoffRange = this.parseRange(from, to);

    const rows = await this.prisma.playerMatchStat.findMany({
      where: {
        clubId,
        userId,
        match:
          kickoffRange.gte || kickoffRange.lte
            ? { kickoffAt: kickoffRange }
            : undefined,
      },
      select: {
        matchId: true,
        minutes: true,
        goals: true,
        assists: true,
        yellow: true,
        red: true,
        started: true,
        side: true,
        match: {
          select: {
            kickoffAt: true,
            opponent: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: { match: { kickoffAt: 'desc' } },
    });

    const total = rows.reduce(
      (acc, r) => {
        acc.matches += 1;
        acc.starts += r.started ? 1 : 0;
        acc.minutes += r.minutes ?? 0;
        acc.goals += r.goals ?? 0;
        acc.assists += r.assists ?? 0;
        acc.yellow += r.yellow ?? 0;
        acc.red += r.red ?? 0;
        return acc;
      },
      {
        matches: 0,
        starts: 0,
        minutes: 0,
        goals: 0,
        assists: 0,
        yellow: 0,
        red: 0,
      },
    );

    const per90 = (x: number) =>
      total.minutes > 0 ? (x * 90) / total.minutes : 0;

    return {
      user,
      range: { from: from ?? null, to: to ?? null },
      total: {
        ...total,
        goalsPer90: Number(per90(total.goals).toFixed(2)),
        assistsPer90: Number(per90(total.assists).toFixed(2)),
      },
      matches: rows.map((r) => ({
        matchId: r.matchId,
        title: r.match.title,
        opponent: r.match.opponent,
        kickoffAt: r.match.kickoffAt,
        status: r.match.status,
        started: r.started,
        side: r.side,
        minutes: r.minutes,
        goals: r.goals,
        assists: r.assists,
        yellow: r.yellow,
        red: r.red,
      })),
    };
  }

  // ✅ match summary: totals + top performers
  async getMatchSummary(actorId: string, clubId: string, matchId: string) {
    await this.assertClubMember(actorId, clubId);

    const match = await this.prisma.match.findFirst({
      where: { id: matchId, clubId },
      select: {
        id: true,
        title: true,
        opponent: true,
        kickoffAt: true,
        status: true,
        homeScore: true,
        awayScore: true,
      },
    });
    if (!match) throw new NotFoundException('Match not found');

    const stats = await this.prisma.playerMatchStat.findMany({
      where: { clubId, matchId },
      select: {
        userId: true,
        side: true,
        minutes: true,
        goals: true,
        assists: true,
        yellow: true,
        red: true,
        started: true,
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: [{ goals: 'desc' }, { assists: 'desc' }, { minutes: 'desc' }],
    });

    const totals = stats.reduce(
      (acc, s) => {
        acc.players += 1;
        acc.minutes += s.minutes ?? 0;
        acc.goals += s.goals ?? 0;
        acc.assists += s.assists ?? 0;
        acc.yellow += s.yellow ?? 0;
        acc.red += s.red ?? 0;
        return acc;
      },
      { players: 0, minutes: 0, goals: 0, assists: 0, yellow: 0, red: 0 },
    );

    const topScorers = stats
      .filter((s) => (s.goals ?? 0) > 0)
      .slice(0, 5)
      .map((s) => ({ user: s.user, goals: s.goals, side: s.side }));

    const topAssists = stats
      .filter((s) => (s.assists ?? 0) > 0)
      .slice(0, 5)
      .map((s) => ({ user: s.user, assists: s.assists, side: s.side }));

    return { match, totals, topScorers, topAssists, players: stats };
  }

  // ✅ leaderboard: by metric across all cached matches
  async leaderboard(
    actorId: string,
    clubId: string,
    metric: Metric,
    limit: number,
  ) {
    await this.assertClubMember(actorId, clubId);

    // groupBy + sum metric
    const grouped = await this.prisma.playerMatchStat.groupBy({
      by: ['userId'],
      where: { clubId },
      _sum: {
        goals: true,
        assists: true,
        minutes: true,
        yellow: true,
        red: true,
      },
      orderBy: [
        metric === 'goals'
          ? { _sum: { goals: 'desc' } }
          : metric === 'assists'
            ? { _sum: { assists: 'desc' } }
            : metric === 'minutes'
              ? { _sum: { minutes: 'desc' } }
              : metric === 'yellow'
                ? { _sum: { yellow: 'desc' } }
                : { _sum: { red: 'desc' } },
      ],
      take: limit,
    });

    const userIds = grouped.map((g) => g.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return grouped.map((g, i) => ({
      rank: i + 1,
      user: userMap.get(g.userId) ?? {
        id: g.userId,
        fullName: null,
        email: '',
      },
      totals: {
        goals: g._sum.goals ?? 0,
        assists: g._sum.assists ?? 0,
        minutes: g._sum.minutes ?? 0,
        yellow: g._sum.yellow ?? 0,
        red: g._sum.red ?? 0,
      },
    }));
  }
}
