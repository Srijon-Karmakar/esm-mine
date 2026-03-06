import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MatchStatus } from '@prisma/client';

type TableRow = {
  seasonId: string;
  teamId: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

@Injectable()
export class StandingsEngineService {
  constructor(private prisma: PrismaService) {}

  private emptyRow(seasonId: string, teamId: string): TableRow {
    return {
      seasonId,
      teamId,
      played: 0,
      won: 0,
      draw: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
    };
  }

  // ✅ Recompute standings for a season from ALL finished matches linked via SeasonMatch
  async recomputeSeasonStandings(seasonId: string) {
    const season = await this.prisma.season.findUnique({
      where: { id: seasonId },
      select: { id: true, clubId: true },
    });
    if (!season) return { ok: false, reason: 'Season not found' };

    const seasonMatches = await this.prisma.seasonMatch.findMany({
      where: { seasonId },
      select: { matchId: true, homeTeamId: true, awayTeamId: true },
    });

    if (seasonMatches.length === 0) {
      // nothing linked => clear standings
      await this.prisma.seasonStanding.deleteMany({ where: { seasonId } });
      return { ok: true, seasonId, updated: 0 };
    }

    const matchIds = seasonMatches.map((sm) => sm.matchId);

    const matches = await this.prisma.match.findMany({
      where: { id: { in: matchIds } },
      select: { id: true, status: true, homeScore: true, awayScore: true },
    });

    const matchById = new Map(matches.map((m) => [m.id, m]));

    const table = new Map<string, TableRow>(); // teamId -> row
    const getRow = (teamId: string) => {
      if (!table.has(teamId))
        table.set(teamId, this.emptyRow(seasonId, teamId));
      return table.get(teamId)!;
    };

    for (const sm of seasonMatches) {
      const m = matchById.get(sm.matchId);
      if (!m) continue;
      if (m.status !== MatchStatus.FINISHED) continue;

      const home = getRow(sm.homeTeamId);
      const away = getRow(sm.awayTeamId);

      const hs = m.homeScore ?? 0;
      const as = m.awayScore ?? 0;

      home.played += 1;
      away.played += 1;

      home.goalsFor += hs;
      home.goalsAgainst += as;

      away.goalsFor += as;
      away.goalsAgainst += hs;

      if (hs > as) {
        home.won += 1;
        away.lost += 1;
        home.points += 3;
      } else if (hs < as) {
        away.won += 1;
        home.lost += 1;
        away.points += 3;
      } else {
        home.draw += 1;
        away.draw += 1;
        home.points += 1;
        away.points += 1;
      }
    }

    for (const row of table.values()) {
      row.goalDiff = row.goalsFor - row.goalsAgainst;
    }

    const rows = Array.from(table.values());

    await this.prisma.$transaction(async (tx) => {
      await tx.seasonStanding.deleteMany({ where: { seasonId } });
      if (rows.length) {
        await tx.seasonStanding.createMany({ data: rows });
      }
    });

    return { ok: true, seasonId, updated: rows.length };
  }

  // ✅ Helper: matchId -> recompute its season (if linked)
  async recomputeSeasonStandingsForMatch(matchId: string) {
    const sm = await this.prisma.seasonMatch.findUnique({
      where: { matchId },
      select: { seasonId: true },
    });
    if (!sm) return { ok: true, skipped: true };
    return this.recomputeSeasonStandings(sm.seasonId);
  }
}
