import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MatchStatus, PrimaryRole, SubRole } from '@prisma/client';

function daysFromRange(range: string): number {
  const r = String(range || '30d').toLowerCase().trim();
  if (r.endsWith('d')) return Math.max(1, parseInt(r) || 30);
  if (r.endsWith('w')) return Math.max(7, (parseInt(r) || 4) * 7);
  if (r.endsWith('m')) return Math.max(30, (parseInt(r) || 1) * 30);
  return 30;
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class DashboardsService {
  constructor(private prisma: PrismaService) {}

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
          return { primary: m.primary, subRoles: m.subRoles, effective: m.subRoles[0] };
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
        return { primary: m.primary, subRoles: m.subRoles, effective: m.subRoles[0] };
      }
      throw new ForbiddenException('No dashboard role assigned in this club');
    }
    return { primary: m.primary, subRoles: m.subRoles, effective: m.primary };
  }

  async overview(userId: string, clubId?: string, asRole?: string) {
    const m = await this.getMembership(userId, clubId);
    const role = this.resolveRole(m, asRole);
    const playerSelfLens =
      role.effective === 'PLAYER' && m.primary === PrimaryRole.PLAYER;

    const now = new Date();
    const next7 = new Date(now.getTime() + 7 * 86400000);

    const [squads, players, upcomingMatches, activeInjuries] = await Promise.all([
      this.prisma.squad.count({ where: { clubId: m.clubId } }),
      this.prisma.squadMember.count({ where: { squad: { clubId: m.clubId } } }),
      this.prisma.match.count({
        where: {
          clubId: m.clubId,
          kickoffAt: { gte: now, lte: next7 },
          status: { in: [MatchStatus.SCHEDULED, MatchStatus.LIVE] },
        },
      }),
      this.prisma.playerInjury.count({ where: { clubId: m.clubId, isActive: true } }),
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
          where: { clubId: m.clubId, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, type: true, severity: true, createdAt: true, userId: true },
        }),
      ]);

      workBlock = { physio: { highSeverityActive: highSeverity, newThisWeek: newlyAdded } };
    }

    return {
      club: m.club,
      clubId: m.clubId,
      role,
      kpis: [
        { key: 'squads', label: 'Squads', value: squads },
        { key: 'players', label: 'Players', value: players },
        { key: 'upcoming', label: 'Upcoming Matches (7d)', value: upcomingMatches },
        { key: 'injuries', label: 'Active Injuries', value: activeInjuries },
      ],
      player: playerBlock,
      work: workBlock,
    };
  }

  async charts(userId: string, clubId: string | undefined, range: string, asRole?: string) {
    const m = await this.getMembership(userId, clubId);
    const role = this.resolveRole(m, asRole);
    const playerSelfLens =
      role.effective === 'PLAYER' && m.primary === PrimaryRole.PLAYER;

    const days = daysFromRange(range);
    const from = new Date(Date.now() - days * 86400000);

    const finishedMatches = await this.prisma.match.findMany({
      where: { clubId: m.clubId, status: MatchStatus.FINISHED, kickoffAt: { gte: from } },
      select: { kickoffAt: true },
      orderBy: { kickoffAt: 'asc' },
    });

    const stats = await this.prisma.playerMatchStat.findMany({
      where: { clubId: m.clubId, match: { kickoffAt: { gte: from } } },
      select: { goals: true, assists: true, match: { select: { kickoffAt: true } }, userId: true },
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
      new Set([...matchesByDay.keys(), ...goalsByDay.keys(), ...assistsByDay.keys()]),
    ).sort();

    return {
      clubId: m.clubId,
      role,
      rangeDays: days,
      series: [
        { name: 'Matches Played', points: allDays.map((d) => ({ x: d, y: matchesByDay.get(d) || 0 })) },
        { name: 'Goals', points: allDays.map((d) => ({ x: d, y: goalsByDay.get(d) || 0 })) },
        { name: 'Assists', points: allDays.map((d) => ({ x: d, y: assistsByDay.get(d) || 0 })) },
      ],
    };
  }

  async recent(userId: string, clubId: string | undefined, limit: number, asRole?: string) {
    const m = await this.getMembership(userId, clubId);
    const role = this.resolveRole(m, asRole);
    const playerSelfLens =
      role.effective === 'PLAYER' && m.primary === PrimaryRole.PLAYER;

    const matches = await this.prisma.match.findMany({
      where: { clubId: m.clubId },
      orderBy: { kickoffAt: 'desc' },
      take: Math.min(Math.max(limit || 10, 1), 50),
      select: { id: true, title: true, opponent: true, kickoffAt: true, status: true, homeScore: true, awayScore: true, venue: true },
    });

    const injuries = await this.prisma.playerInjury.findMany({
      where: {
        clubId: m.clubId,
        ...(playerSelfLens ? { userId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, type: true, severity: true, isActive: true, startDate: true, endDate: true, userId: true },
    });

    return { clubId: m.clubId, role, matches, injuries };
  }
}
