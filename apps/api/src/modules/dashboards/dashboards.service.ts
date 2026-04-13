import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MatchStatus, PrimaryRole, SubRole } from '@prisma/client';
import {
  CreateDashboardAnalyticsEntryDto,
  type DashboardAnalyticsCategoryValue,
} from './dto';

function daysFromRange(range: string): number {
  const r = String(range || '30d')
    .toLowerCase()
    .trim();
  if (r.endsWith('d')) return Math.max(1, parseInt(r) || 30);
  if (r.endsWith('w')) return Math.max(7, (parseInt(r) || 4) * 7);
  if (r.endsWith('m')) return Math.max(30, (parseInt(r) || 1) * 30);
  return 30;
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

const ANALYTICS_METRIC_KEYS = [
  'matchLoad',
  'trainingLoad',
  'winRate',
  'possession',
  'playerFitness',
  'playerMorale',
  'recoveryScore',
  'clubCohesion',
  'fanEngagement',
  'disciplineScore',
] as const;

type AnalyticsMetricKey = (typeof ANALYTICS_METRIC_KEYS)[number];
type AnalyticsMetrics = Partial<Record<AnalyticsMetricKey, number>>;

const PERFORMANCE_WEIGHTS: Record<
  DashboardAnalyticsCategoryValue,
  Partial<Record<AnalyticsMetricKey, number>>
> = {
  MATCH: {
    matchLoad: 0.22,
    winRate: 0.38,
    possession: 0.2,
    disciplineScore: 0.2,
  },
  PLAYER: {
    playerFitness: 0.34,
    playerMorale: 0.22,
    recoveryScore: 0.24,
    trainingLoad: 0.2,
  },
  CLUB: {
    clubCohesion: 0.34,
    fanEngagement: 0.2,
    disciplineScore: 0.18,
    winRate: 0.28,
  },
};

const READINESS_WEIGHTS: Record<
  DashboardAnalyticsCategoryValue,
  Partial<Record<AnalyticsMetricKey, number>>
> = {
  MATCH: {
    matchLoad: 0.35,
    playerFitness: 0.25,
    recoveryScore: 0.2,
    disciplineScore: 0.2,
  },
  PLAYER: {
    playerFitness: 0.42,
    recoveryScore: 0.32,
    playerMorale: 0.14,
    trainingLoad: 0.12,
  },
  CLUB: {
    clubCohesion: 0.25,
    playerFitness: 0.3,
    recoveryScore: 0.25,
    disciplineScore: 0.2,
  },
};

const MOMENTUM_WEIGHTS: Record<
  DashboardAnalyticsCategoryValue,
  Partial<Record<AnalyticsMetricKey, number>>
> = {
  MATCH: {
    winRate: 0.45,
    possession: 0.2,
    playerMorale: 0.15,
    fanEngagement: 0.2,
  },
  PLAYER: {
    playerMorale: 0.35,
    playerFitness: 0.25,
    winRate: 0.15,
    fanEngagement: 0.25,
  },
  CLUB: {
    clubCohesion: 0.3,
    fanEngagement: 0.3,
    winRate: 0.25,
    disciplineScore: 0.15,
  },
};

function clampMetric(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return undefined;
  return Math.min(100, Math.max(0, num));
}

function roundMetric(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function balanceScore(value?: number, ideal = 70) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return Math.max(0, Math.min(100, 100 - Math.abs(value - ideal) * 2));
}

function normalizeAnalyticsMetrics(input: unknown): AnalyticsMetrics {
  const source =
    input && typeof input === 'object'
      ? (input as Record<string, unknown>)
      : {};
  const metrics: AnalyticsMetrics = {};
  for (const key of ANALYTICS_METRIC_KEYS) {
    const value = clampMetric(source[key]);
    if (typeof value === 'number') metrics[key] = value;
  }
  return metrics;
}

function weightedAverage(
  metrics: AnalyticsMetrics,
  weights: Partial<Record<AnalyticsMetricKey, number>>,
) {
  let totalWeight = 0;
  let totalValue = 0;

  for (const [metricKey, weight] of Object.entries(weights) as Array<
    [AnalyticsMetricKey, number]
  >) {
    let value = metrics[metricKey];
    if (metricKey === 'trainingLoad')
      value = balanceScore(metrics.trainingLoad, 68);
    if (metricKey === 'matchLoad') value = balanceScore(metrics.matchLoad, 72);
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    totalWeight += weight;
    totalValue += value * weight;
  }

  if (!totalWeight) return 0;
  return roundMetric(totalValue / totalWeight);
}

function computeAnalyticsIndices(
  category: DashboardAnalyticsCategoryValue,
  metrics: AnalyticsMetrics,
) {
  const providedMetrics = ANALYTICS_METRIC_KEYS.filter(
    (key) => typeof metrics[key] === 'number',
  ).length;
  return {
    performanceIndex: weightedAverage(metrics, PERFORMANCE_WEIGHTS[category]),
    readinessIndex: weightedAverage(metrics, READINESS_WEIGHTS[category]),
    momentumIndex: weightedAverage(metrics, MOMENTUM_WEIGHTS[category]),
    dataCompleteness: Math.round(
      (providedMetrics / ANALYTICS_METRIC_KEYS.length) * 100,
    ),
  };
}

function metricLabel(metricKey: string) {
  switch (metricKey) {
    case 'matchLoad':
      return 'Match Load';
    case 'trainingLoad':
      return 'Training Load';
    case 'winRate':
      return 'Win Rate';
    case 'possession':
      return 'Possession';
    case 'playerFitness':
      return 'Player Fitness';
    case 'playerMorale':
      return 'Player Morale';
    case 'recoveryScore':
      return 'Recovery Score';
    case 'clubCohesion':
      return 'Club Cohesion';
    case 'fanEngagement':
      return 'Fan Engagement';
    case 'disciplineScore':
      return 'Discipline Score';
    default:
      return metricKey;
  }
}

@Injectable()
export class DashboardsService {
  constructor(private prisma: PrismaService) {}

  private emptyAnalyticsResponse(clubId: string, role: any, days: number) {
    return {
      clubId,
      role,
      rangeDays: days,
      totals: {
        entries: 0,
        averagePerformance: 0,
        averageReadiness: 0,
        averageMomentum: 0,
        averageCompleteness: 0,
        topCategory: null,
      },
      trend: [],
      metricsSummary: {
        strongest: null,
        weakest: null,
        averages: [],
      },
      latest: [],
    };
  }

  private isAnalyticsStorageUnavailable(error: any) {
    const code = String(error?.code || '');
    const message = String(error?.message || '');
    return (
      code === 'P2021' ||
      code === 'P2022' ||
      code === 'P2010' ||
      /DashboardAnalyticsEntry/i.test(message) ||
      /PlayerWellnessEntry/i.test(message) ||
      /PlayerTrainingLoadEntry/i.test(message) ||
      /dashboardAnalyticsEntry/i.test(message) ||
      /playerWellnessEntry/i.test(message) ||
      /playerTrainingLoadEntry/i.test(message) ||
      /does not exist/i.test(message) ||
      /Invalid .* invocation/i.test(message)
    );
  }

  private async getMembership(userId: string, clubId?: string) {
    if (clubId) {
      const m = await this.prisma.membership.findUnique({
        where: { userId_clubId: { userId, clubId } },
        include: { club: { select: { id: true, name: true, slug: true } } },
      });
      if (!m) throw new ForbiddenException('No access to this club');
      return m;
    }

    const first = await this.prisma.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: { club: { select: { id: true, name: true, slug: true } } },
    });

    if (!first) throw new ForbiddenException('No club membership');
    return first;
  }

  private resolveRole(m: any, asRole?: string) {
    const canAdminOverride = m.primary === PrimaryRole.ADMIN;

    if (!asRole) {
      if (String(m.primary) === 'MEMBER') {
        if (Array.isArray(m.subRoles) && m.subRoles.length > 0) {
          return {
            primary: m.primary,
            subRoles: m.subRoles,
            effective: m.subRoles[0],
          };
        }
        throw new ForbiddenException('No dashboard role assigned in this club');
      }
      return { primary: m.primary, subRoles: m.subRoles, effective: m.primary };
    }

    const wanted = String(asRole).toUpperCase();

    // primary roles
    if (Object.values(PrimaryRole).includes(wanted as any)) {
      if (m.primary !== wanted && !canAdminOverride) {
        throw new ForbiddenException('Role not allowed in this club');
      }
      return { primary: m.primary, subRoles: m.subRoles, effective: wanted };
    }

    // sub roles
    if (Object.values(SubRole).includes(wanted as any)) {
      if (!m.subRoles.includes(wanted) && !canAdminOverride) {
        throw new ForbiddenException('Role not allowed in this club');
      }
      return { primary: m.primary, subRoles: m.subRoles, effective: wanted };
    }

    // fallback
    if (String(m.primary) === 'MEMBER') {
      if (Array.isArray(m.subRoles) && m.subRoles.length > 0) {
        return {
          primary: m.primary,
          subRoles: m.subRoles,
          effective: m.subRoles[0],
        };
      }
      throw new ForbiddenException('No dashboard role assigned in this club');
    }
    return { primary: m.primary, subRoles: m.subRoles, effective: m.primary };
  }

  private serializeAnalyticsEntry(entry: any) {
    return {
      id: entry.id,
      category: entry.category,
      subjectLabel: entry.subjectLabel,
      recordedAt: entry.recordedAt,
      notes: entry.notes,
      metrics: normalizeAnalyticsMetrics(entry.metrics),
      performanceIndex: roundMetric(Number(entry.performanceIndex || 0)),
      readinessIndex: roundMetric(Number(entry.readinessIndex || 0)),
      momentumIndex: roundMetric(Number(entry.momentumIndex || 0)),
      dataCompleteness: Math.round(Number(entry.dataCompleteness || 0)),
      createdAt: entry.createdAt,
      createdBy: entry.createdBy
        ? {
            id: entry.createdBy.id,
            fullName: entry.createdBy.fullName,
            email: entry.createdBy.email,
          }
        : null,
    };
  }

  async overview(userId: string, clubId?: string, asRole?: string) {
    const m = await this.getMembership(userId, clubId);
    const role = this.resolveRole(m, asRole);
    const playerSelfLens =
      role.effective === 'PLAYER' && m.primary === PrimaryRole.PLAYER;

    const now = new Date();
    const next7 = new Date(now.getTime() + 7 * 86400000);

    const [squads, players, upcomingMatches, activeInjuries] =
      await Promise.all([
        this.prisma.squad.count({ where: { clubId: m.clubId } }),
        this.prisma.squadMember.count({
          where: { squad: { clubId: m.clubId } },
        }),
        this.prisma.match.count({
          where: {
            clubId: m.clubId,
            kickoffAt: { gte: now, lte: next7 },
            status: { in: [MatchStatus.SCHEDULED, MatchStatus.LIVE] },
          },
        }),
        this.prisma.playerInjury.count({
          where: { clubId: m.clubId, isActive: true },
        }),
      ]);

    // player-only block
    let playerBlock: any = null;
    if (role.effective === 'PLAYER') {
      if (playerSelfLens) {
        const [myAgg, myInjury] = await Promise.all([
          this.prisma.playerMatchStat.aggregate({
            where: { clubId: m.clubId, userId },
            _sum: { goals: true, assists: true, minutes: true },
            _count: { id: true },
          }),
          this.prisma.playerInjury.findFirst({
            where: { clubId: m.clubId, userId, isActive: true },
            orderBy: { startDate: 'desc' },
            select: {
              type: true,
              severity: true,
              startDate: true,
              endDate: true,
            },
          }),
        ]);

        playerBlock = {
          scope: 'SELF',
          totals: {
            matches: myAgg._count.id || 0,
            goals: myAgg._sum.goals || 0,
            assists: myAgg._sum.assists || 0,
            minutes: myAgg._sum.minutes || 0,
          },
          activeInjury: myInjury,
        };
      } else {
        const [clubAgg, clubInjuries] = await Promise.all([
          this.prisma.playerMatchStat.aggregate({
            where: { clubId: m.clubId },
            _sum: { goals: true, assists: true, minutes: true },
            _count: { id: true },
          }),
          this.prisma.playerInjury.count({
            where: { clubId: m.clubId, isActive: true },
          }),
        ]);

        playerBlock = {
          scope: 'CLUB',
          totals: {
            matches: clubAgg._count.id || 0,
            goals: clubAgg._sum.goals || 0,
            assists: clubAgg._sum.assists || 0,
            minutes: clubAgg._sum.minutes || 0,
          },
          activeInjuryCount: clubInjuries,
        };
      }
    }

    // coach/physio focus blocks
    let workBlock: any = null;
    if (role.effective === 'COACH') {
      const last30 = new Date(Date.now() - 30 * 86400000);
      const recentStats = await this.prisma.playerMatchStat.aggregate({
        where: { clubId: m.clubId, match: { kickoffAt: { gte: last30 } } },
        _sum: { goals: true, assists: true },
        _count: { id: true },
      });

      workBlock = {
        coaching: {
          last30Appearances: recentStats._count.id || 0,
          last30Goals: recentStats._sum.goals || 0,
          last30Assists: recentStats._sum.assists || 0,
        },
      };
    }

    if (role.effective === 'PHYSIO') {
      const [highSeverity, newlyAdded] = await Promise.all([
        this.prisma.playerInjury.count({
          where: { clubId: m.clubId, isActive: true, severity: 'HIGH' },
        }),
        this.prisma.playerInjury.findMany({
          where: {
            clubId: m.clubId,
            createdAt: { gte: new Date(Date.now() - 7 * 86400000) },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            type: true,
            severity: true,
            createdAt: true,
            userId: true,
          },
        }),
      ]);

      workBlock = {
        physio: { highSeverityActive: highSeverity, newThisWeek: newlyAdded },
      };
    }

    return {
      club: m.club,
      clubId: m.clubId,
      role,
      kpis: [
        { key: 'squads', label: 'Squads', value: squads },
        { key: 'players', label: 'Players', value: players },
        {
          key: 'upcoming',
          label: 'Upcoming Matches (7d)',
          value: upcomingMatches,
        },
        { key: 'injuries', label: 'Active Injuries', value: activeInjuries },
      ],
      player: playerBlock,
      work: workBlock,
    };
  }

  async charts(
    userId: string,
    clubId: string | undefined,
    range: string,
    asRole?: string,
  ) {
    const m = await this.getMembership(userId, clubId);
    const role = this.resolveRole(m, asRole);
    const playerSelfLens =
      role.effective === 'PLAYER' && m.primary === PrimaryRole.PLAYER;

    const days = daysFromRange(range);
    const from = new Date(Date.now() - days * 86400000);

    if (playerSelfLens) {
      const [stats, injuries, profile] = await Promise.all([
        this.prisma.playerMatchStat.findMany({
          where: {
            clubId: m.clubId,
            userId,
            match: { kickoffAt: { gte: from } },
          },
          select: {
            goals: true,
            assists: true,
            minutes: true,
            started: true,
            match: { select: { kickoffAt: true } },
          },
          orderBy: { match: { kickoffAt: 'asc' } },
        }),
        this.prisma.playerInjury.findMany({
          where: {
            clubId: m.clubId,
            userId,
            OR: [
              { startDate: { gte: from } },
              { endDate: { gte: from } },
              { isActive: true },
            ],
          },
          select: {
            id: true,
            type: true,
            severity: true,
            startDate: true,
            endDate: true,
            isActive: true,
          },
          orderBy: { startDate: 'asc' },
        }),
        this.prisma.playerProfile.findUnique({
          where: { userId },
          select: { readinessScore: true, healthUpdatedAt: true },
        }),
      ]);

      const wellnessRepo = (this.prisma as any).playerWellnessEntry;
      const trainingRepo = (this.prisma as any).playerTrainingLoadEntry;

      let wellnessEntries: any[] = [];
      let trainingEntries: any[] = [];

      try {
        if (wellnessRepo?.findMany) {
          wellnessEntries = await wellnessRepo.findMany({
            where: {
              clubId: m.clubId,
              userId,
              recordedAt: { gte: from },
            },
            orderBy: [{ recordedAt: 'asc' }, { createdAt: 'asc' }],
          });
        }
      } catch (error) {
        if (!this.isAnalyticsStorageUnavailable(error)) throw error;
      }

      try {
        if (trainingRepo?.findMany) {
          trainingEntries = await trainingRepo.findMany({
            where: {
              clubId: m.clubId,
              userId,
              sessionDate: { gte: from },
            },
            orderBy: [{ sessionDate: 'asc' }, { createdAt: 'asc' }],
          });
        }
      } catch (error) {
        if (!this.isAnalyticsStorageUnavailable(error)) throw error;
      }

      const minutesByDay = new Map<string, number>();
      const contributionByDay = new Map<
        string,
        { score: number; count: number }
      >();
      const readinessByDay = new Map<
        string,
        { score: number; count: number }
      >();
      const trainingLoadByDay = new Map<string, number>();
      const markerMap = new Map<
        string,
        Array<{ label: string; tone: string }>
      >();

      const addMarker = (day: string, label: string, tone: string) => {
        if (!markerMap.has(day)) markerMap.set(day, []);
        markerMap.get(day)!.push({ label, tone });
      };

      for (const row of stats) {
        const day = isoDay(new Date(row.match.kickoffAt));
        const minutes = Number(row.minutes || 0);
        const contributionScore = Math.min(
          100,
          Number(row.goals || 0) * 35 +
            Number(row.assists || 0) * 25 +
            (row.started ? 10 : 0) +
            Math.min(30, minutes / 3),
        );

        minutesByDay.set(day, (minutesByDay.get(day) || 0) + minutes);
        if (!contributionByDay.has(day))
          contributionByDay.set(day, { score: 0, count: 0 });
        const contribution = contributionByDay.get(day)!;
        contribution.score += contributionScore;
        contribution.count += 1;
      }

      for (const row of wellnessEntries) {
        if (typeof row?.readinessScore !== 'number') continue;
        const day = isoDay(new Date(row.recordedAt));
        if (!readinessByDay.has(day))
          readinessByDay.set(day, { score: 0, count: 0 });
        const current = readinessByDay.get(day)!;
        current.score += Number(row.readinessScore || 0);
        current.count += 1;
      }

      if (
        !wellnessEntries.length &&
        typeof profile?.readinessScore === 'number' &&
        profile.healthUpdatedAt &&
        new Date(profile.healthUpdatedAt).getTime() >= from.getTime()
      ) {
        const day = isoDay(new Date(profile.healthUpdatedAt));
        readinessByDay.set(day, {
          score: Number(profile.readinessScore || 0),
          count: 1,
        });
      }

      for (const row of trainingEntries) {
        const day = isoDay(new Date(row.sessionDate));
        trainingLoadByDay.set(
          day,
          (trainingLoadByDay.get(day) || 0) + Number(row.loadScore || 0),
        );
        addMarker(
          day,
          row.sessionType ? `Training: ${row.sessionType}` : 'Training load',
          'default',
        );
      }

      for (const injury of injuries) {
        if (
          injury.startDate &&
          new Date(injury.startDate).getTime() >= from.getTime()
        ) {
          addMarker(
            isoDay(new Date(injury.startDate)),
            `${injury.type || 'Injury'} started`,
            String(injury.severity || '').toUpperCase() === 'HIGH'
              ? 'danger'
              : 'warn',
          );
        }
        if (
          injury.endDate &&
          new Date(injury.endDate).getTime() >= from.getTime()
        ) {
          addMarker(
            isoDay(new Date(injury.endDate)),
            `${injury.type || 'Injury'} ended`,
            'ok',
          );
        }
      }

      const allDays = Array.from(
        new Set([
          ...minutesByDay.keys(),
          ...contributionByDay.keys(),
          ...readinessByDay.keys(),
          ...trainingLoadByDay.keys(),
          ...markerMap.keys(),
        ]),
      ).sort();

      return {
        clubId: m.clubId,
        role,
        rangeDays: days,
        series: [
          {
            name: 'Minutes',
            axis: 'volume',
            kind: 'bar',
            points: allDays.map((day) => ({
              x: day,
              y: minutesByDay.get(day) || 0,
            })),
          },
          {
            name: 'Contribution',
            axis: 'score',
            kind: 'line',
            points: allDays.map((day) => {
              const current = contributionByDay.get(day);
              return {
                x: day,
                y: current?.count
                  ? roundMetric(current.score / current.count)
                  : 0,
              };
            }),
          },
          {
            name: 'Readiness',
            axis: 'score',
            kind: 'line',
            points: allDays.map((day) => {
              const current = readinessByDay.get(day);
              return {
                x: day,
                y: current?.count
                  ? roundMetric(current.score / current.count)
                  : 0,
              };
            }),
          },
          {
            name: 'Training Load',
            axis: 'volume',
            kind: 'bar',
            points: allDays.map((day) => ({
              x: day,
              y: trainingLoadByDay.get(day) || 0,
            })),
          },
        ],
        markers: allDays
          .filter((day) => markerMap.has(day))
          .map((day) => ({
            day,
            items: markerMap.get(day),
          })),
      };
    }

    const finishedMatches = await this.prisma.match.findMany({
      where: {
        clubId: m.clubId,
        status: MatchStatus.FINISHED,
        kickoffAt: { gte: from },
      },
      select: { kickoffAt: true },
      orderBy: { kickoffAt: 'asc' },
    });

    const stats = await this.prisma.playerMatchStat.findMany({
      where: { clubId: m.clubId, match: { kickoffAt: { gte: from } } },
      select: {
        goals: true,
        assists: true,
        match: { select: { kickoffAt: true } },
        userId: true,
      },
    });

    const matchesByDay = new Map<string, number>();
    for (const mm of finishedMatches) {
      const k = isoDay(new Date(mm.kickoffAt));
      matchesByDay.set(k, (matchesByDay.get(k) || 0) + 1);
    }

    const goalsByDay = new Map<string, number>();
    const assistsByDay = new Map<string, number>();

    for (const s of stats) {
      // If actual player dashboard, only own stats.
      // Admin role-lens override keeps club aggregate to support analytics comparison.
      if (playerSelfLens && s.userId !== userId) continue;

      const k = isoDay(new Date(s.match.kickoffAt));
      goalsByDay.set(k, (goalsByDay.get(k) || 0) + (s.goals || 0));
      assistsByDay.set(k, (assistsByDay.get(k) || 0) + (s.assists || 0));
    }

    const allDays = Array.from(
      new Set([
        ...matchesByDay.keys(),
        ...goalsByDay.keys(),
        ...assistsByDay.keys(),
      ]),
    ).sort();

    return {
      clubId: m.clubId,
      role,
      rangeDays: days,
      series: [
        {
          name: 'Matches Played',
          points: allDays.map((d) => ({ x: d, y: matchesByDay.get(d) || 0 })),
        },
        {
          name: 'Goals',
          points: allDays.map((d) => ({ x: d, y: goalsByDay.get(d) || 0 })),
        },
        {
          name: 'Assists',
          points: allDays.map((d) => ({ x: d, y: assistsByDay.get(d) || 0 })),
        },
      ],
    };
  }

  async recent(
    userId: string,
    clubId: string | undefined,
    limit: number,
    asRole?: string,
  ) {
    const m = await this.getMembership(userId, clubId);
    const role = this.resolveRole(m, asRole);
    const playerSelfLens =
      role.effective === 'PLAYER' && m.primary === PrimaryRole.PLAYER;

    const matches = await this.prisma.match.findMany({
      where: { clubId: m.clubId },
      orderBy: { kickoffAt: 'desc' },
      take: Math.min(Math.max(limit || 10, 1), 50),
      select: {
        id: true,
        title: true,
        opponent: true,
        kickoffAt: true,
        status: true,
        homeScore: true,
        awayScore: true,
        venue: true,
      },
    });

    const injuries = await this.prisma.playerInjury.findMany({
      where: {
        clubId: m.clubId,
        ...(playerSelfLens ? { userId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        severity: true,
        isActive: true,
        startDate: true,
        endDate: true,
        userId: true,
      },
    });

    return { clubId: m.clubId, role, matches, injuries };
  }

  async analytics(
    userId: string,
    clubId: string | undefined,
    range: string,
    asRole?: string,
  ) {
    const m = await this.getMembership(userId, clubId);
    const role = this.resolveRole(m, asRole);
    const days = daysFromRange(range);
    const from = new Date(Date.now() - days * 86400000);
    const analyticsRepo = (this.prisma as any).dashboardAnalyticsEntry;

    if (!analyticsRepo || typeof analyticsRepo.findMany !== 'function') {
      return this.emptyAnalyticsResponse(m.clubId, role, days);
    }

    let entries: any[] = [];
    try {
      entries = await analyticsRepo.findMany({
        where: { clubId: m.clubId, recordedAt: { gte: from } },
        orderBy: [{ recordedAt: 'asc' }, { createdAt: 'asc' }],
        include: {
          createdBy: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });
    } catch (error) {
      if (this.isAnalyticsStorageUnavailable(error)) {
        return this.emptyAnalyticsResponse(m.clubId, role, days);
      }
      throw error;
    }

    const trendMap = new Map<
      string,
      {
        day: string;
        entries: number;
        performanceSum: number;
        readinessSum: number;
        momentumSum: number;
      }
    >();
    const categoryCounts = new Map<string, number>();
    const metricAverages = new Map<string, { sum: number; count: number }>();

    let totalPerformance = 0;
    let totalReadiness = 0;
    let totalMomentum = 0;
    let totalCompleteness = 0;

    for (const entry of entries) {
      const day = isoDay(new Date(entry.recordedAt));
      if (!trendMap.has(day)) {
        trendMap.set(day, {
          day,
          entries: 0,
          performanceSum: 0,
          readinessSum: 0,
          momentumSum: 0,
        });
      }

      const row = trendMap.get(day)!;
      row.entries += 1;
      row.performanceSum += Number(entry.performanceIndex || 0);
      row.readinessSum += Number(entry.readinessIndex || 0);
      row.momentumSum += Number(entry.momentumIndex || 0);

      totalPerformance += Number(entry.performanceIndex || 0);
      totalReadiness += Number(entry.readinessIndex || 0);
      totalMomentum += Number(entry.momentumIndex || 0);
      totalCompleteness += Number(entry.dataCompleteness || 0);

      categoryCounts.set(
        entry.category,
        (categoryCounts.get(entry.category) || 0) + 1,
      );

      const metrics = normalizeAnalyticsMetrics(entry.metrics);
      for (const key of ANALYTICS_METRIC_KEYS) {
        const value = metrics[key];
        if (typeof value !== 'number') continue;
        if (!metricAverages.has(key))
          metricAverages.set(key, { sum: 0, count: 0 });
        const current = metricAverages.get(key)!;
        current.sum += value;
        current.count += 1;
      }
    }

    const trend = Array.from(trendMap.values())
      .sort((a, b) => a.day.localeCompare(b.day))
      .map((item) => ({
        day: item.day,
        entries: item.entries,
        performance: roundMetric(item.performanceSum / item.entries),
        readiness: roundMetric(item.readinessSum / item.entries),
        momentum: roundMetric(item.momentumSum / item.entries),
      }));

    const metricRows = Array.from(metricAverages.entries()).map(
      ([key, value]) => ({
        key,
        label: metricLabel(key),
        average: roundMetric(value.sum / value.count),
      }),
    );
    metricRows.sort((a, b) => b.average - a.average);

    const latest = [...entries]
      .sort(
        (a, b) =>
          new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime() ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 8)
      .map((entry) => this.serializeAnalyticsEntry(entry));

    const topCategory =
      Array.from(categoryCounts.entries()).sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0] || null;

    return {
      clubId: m.clubId,
      role,
      rangeDays: days,
      totals: {
        entries: entries.length,
        averagePerformance: entries.length
          ? roundMetric(totalPerformance / entries.length)
          : 0,
        averageReadiness: entries.length
          ? roundMetric(totalReadiness / entries.length)
          : 0,
        averageMomentum: entries.length
          ? roundMetric(totalMomentum / entries.length)
          : 0,
        averageCompleteness: entries.length
          ? roundMetric(totalCompleteness / entries.length)
          : 0,
        topCategory,
      },
      trend,
      metricsSummary: {
        strongest: metricRows[0] || null,
        weakest: metricRows[metricRows.length - 1] || null,
        averages: metricRows,
      },
      latest,
    };
  }

  async createAnalytics(
    userId: string,
    clubId: string | undefined,
    dto: CreateDashboardAnalyticsEntryDto,
  ) {
    const m = await this.getMembership(userId, clubId);
    const recordedAt = new Date(dto.recordedAt);
    if (Number.isNaN(recordedAt.getTime())) {
      throw new BadRequestException('Invalid analytics timestamp');
    }

    const metrics = normalizeAnalyticsMetrics(dto.metrics);
    const metricCount = ANALYTICS_METRIC_KEYS.filter(
      (key) => typeof metrics[key] === 'number',
    ).length;
    if (!metricCount) {
      throw new BadRequestException('Provide at least one analytics metric');
    }

    const calculated = computeAnalyticsIndices(dto.category, metrics);
    const analyticsRepo = (this.prisma as any).dashboardAnalyticsEntry;

    if (!analyticsRepo || typeof analyticsRepo.create !== 'function') {
      throw new ServiceUnavailableException(
        'Dashboard analytics storage is not ready. Apply the latest Prisma migration and restart the API.',
      );
    }

    let created: any;
    try {
      created = await analyticsRepo.create({
        data: {
          clubId: m.clubId,
          createdByUserId: userId,
          category: dto.category,
          subjectLabel: dto.subjectLabel.trim(),
          recordedAt,
          notes: dto.notes?.trim() || null,
          metrics: metrics as any,
          performanceIndex: calculated.performanceIndex,
          readinessIndex: calculated.readinessIndex,
          momentumIndex: calculated.momentumIndex,
          dataCompleteness: calculated.dataCompleteness,
        },
        include: {
          createdBy: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });
    } catch (error) {
      if (this.isAnalyticsStorageUnavailable(error)) {
        throw new ServiceUnavailableException(
          'Dashboard analytics storage is not ready. Apply the latest Prisma migration and restart the API.',
        );
      }
      throw error;
    }

    return {
      clubId: m.clubId,
      entry: this.serializeAnalyticsEntry(created),
    };
  }
}
