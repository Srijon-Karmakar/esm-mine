// src/modules/stats/stats-engine.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MatchEventType, MatchStatus } from '@prisma/client';

type MinutesMap = Record<string, number>;

@Injectable()
export class StatsEngineService {
  constructor(private prisma: PrismaService) {}

  private normalizeMatchDuration(
    status: MatchStatus,
    maxMinute: number | null,
  ) {
    if (status === MatchStatus.FINISHED) return Math.max(90, maxMinute ?? 90);
    return 90;
  }

  private computeMinutesForMatch(args: {
    matchStatus: MatchStatus;
    maxEventMinute: number | null;
    lineupPlayers: Array<{ userId: string; slot: 'STARTING' | 'BENCH' }>;
    events: Array<{
      type: MatchEventType;
      minute: number | null;
      playerId: string | null;
    }>;
  }): MinutesMap {
    const duration = this.normalizeMatchDuration(
      args.matchStatus,
      args.maxEventMinute,
    );

    const slotByUser = new Map<string, 'STARTING' | 'BENCH'>();
    for (const p of args.lineupPlayers) slotByUser.set(p.userId, p.slot);

    const subOn = new Map<string, number>();
    const subOff = new Map<string, number>();

    for (const e of args.events) {
      if (!e.playerId) continue;
      if (typeof e.minute !== 'number') continue;

      if (e.type === MatchEventType.SUB_ON) subOn.set(e.playerId, e.minute);
      if (e.type === MatchEventType.SUB_OFF) subOff.set(e.playerId, e.minute);
    }

    const minutes: MinutesMap = {};

    for (const [userId, slot] of slotByUser.entries()) {
      if (slot === 'STARTING') {
        const off = subOff.get(userId);
        minutes[userId] = Math.max(0, Math.min(duration, off ?? duration));
      } else {
        const on = subOn.get(userId);
        if (typeof on !== 'number') {
          minutes[userId] = 0;
        } else {
          const off = subOff.get(userId) ?? duration;
          minutes[userId] = Math.max(
            0,
            Math.min(duration, off) - Math.min(duration, on),
          );
        }
      }
    }

    return minutes;
  }

  // ✅ Recompute cached stats for ONE match (safe to call multiple times)
  async recomputeMatchStats(clubId: string, matchId: string) {
    const match = await this.prisma.match.findFirst({
      where: { id: matchId, clubId },
      select: { id: true, clubId: true, status: true },
    });
    if (!match) throw new NotFoundException('Match not found');

    const events = await this.prisma.matchEvent.findMany({
      where: { matchId, clubId },
      select: { type: true, minute: true, playerId: true, assistId: true },
    });

    const maxMinute =
      events.reduce(
        (mx, e) => (typeof e.minute === 'number' ? Math.max(mx, e.minute) : mx),
        0,
      ) || null;

    const lineups = await this.prisma.matchLineup.findMany({
      where: { matchId, clubId },
      select: { id: true, side: true },
    });

    const lineupIds = lineups.map((l) => l.id);

    const lineupPlayers = lineupIds.length
      ? await this.prisma.matchLineupPlayer.findMany({
          where: { lineupId: { in: lineupIds } },
          select: { lineupId: true, userId: true, slot: true },
        })
      : [];

    const sideByLineup = new Map(lineups.map((l) => [l.id, l.side as string]));

    // For minutes calc
    const allPlayersForMinutes = lineupPlayers.map((p) => ({
      userId: p.userId,
      slot: p.slot as 'STARTING' | 'BENCH',
    }));

    const minutesMap = this.computeMinutesForMatch({
      matchStatus: match.status,
      maxEventMinute: maxMinute,
      lineupPlayers: allPlayersForMinutes,
      events: events.map((e) => ({
        type: e.type,
        minute: e.minute ?? null,
        playerId: e.playerId ?? null,
      })),
    });

    // Build quick lookup: userId -> lineupPlayer
    const lpByUser = new Map<string, (typeof lineupPlayers)[number]>();
    for (const lp of lineupPlayers) {
      if (!lpByUser.has(lp.userId)) lpByUser.set(lp.userId, lp);
    }

    const userIds = Array.from(new Set(lineupPlayers.map((p) => p.userId)));

    // Pre-count stats with maps (faster)
    const goalsByUser = new Map<string, number>();
    const assistsByUser = new Map<string, number>();
    const yellowByUser = new Map<string, number>();
    const redByUser = new Map<string, number>();

    for (const e of events) {
      if (e.type === MatchEventType.GOAL && e.playerId) {
        goalsByUser.set(e.playerId, (goalsByUser.get(e.playerId) ?? 0) + 1);
      }

      // ✅ Assist should count for assistId (not playerId)
      if (e.type === MatchEventType.ASSIST && e.assistId) {
        assistsByUser.set(e.assistId, (assistsByUser.get(e.assistId) ?? 0) + 1);
      }

      if (e.type === MatchEventType.YELLOW && e.playerId) {
        yellowByUser.set(e.playerId, (yellowByUser.get(e.playerId) ?? 0) + 1);
      }

      if (e.type === MatchEventType.RED && e.playerId) {
        redByUser.set(e.playerId, (redByUser.get(e.playerId) ?? 0) + 1);
      }
    }

    const payload = userIds.map((userId) => {
      const lp = lpByUser.get(userId);
      const side = lp ? (sideByLineup.get(lp.lineupId) ?? null) : null;
      const started = lp ? lp.slot === 'STARTING' : false;

      return {
        clubId,
        matchId,
        userId,
        side,
        started,
        minutes: minutesMap[userId] ?? 0,
        goals: goalsByUser.get(userId) ?? 0,
        assists: assistsByUser.get(userId) ?? 0,
        yellow: yellowByUser.get(userId) ?? 0,
        red: redByUser.get(userId) ?? 0,
      };
    });

    // ✅ write cache atomically
    await this.prisma.$transaction(async (tx) => {
      await tx.playerMatchStat.deleteMany({ where: { matchId, clubId } });
      if (payload.length) {
        await tx.playerMatchStat.createMany({ data: payload });
      }
    });

    return { ok: true, matchId, cached: payload.length };
  }
}
