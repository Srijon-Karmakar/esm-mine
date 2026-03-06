import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClubTaskStatus, MatchStatus, PrimaryRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AskAiAssistantDto } from './dto';

const DAY_MS = 24 * 60 * 60 * 1000;

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type ScheduleLoad = 'MATCHDAY' | 'RECOVERY' | 'INTENSIVE' | 'LIGHT';
type RecommendationCategory = 'MEDICAL' | 'SCHEDULE' | 'SKILL' | 'OPERATIONS';
type RecommendationPriority = 'LOW' | 'MEDIUM' | 'HIGH';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function daysFromRange(range: string): number {
  const input = String(range || '30d').toLowerCase().trim();
  if (input.endsWith('d')) return clamp(parseInt(input) || 30, 1, 365);
  if (input.endsWith('w')) return clamp((parseInt(input) || 4) * 7, 7, 365);
  if (input.endsWith('m')) return clamp((parseInt(input) || 1) * 30, 30, 365);
  return 30;
}

function normalizeDays(days: number): number {
  return Number.isFinite(days) ? clamp(Math.round(days), 3, 21) : 7;
}

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function normalizeSeverity(value?: string | null): 'LOW' | 'MEDIUM' | 'HIGH' {
  const severity = String(value || 'LOW').toUpperCase();
  if (severity === 'HIGH') return 'HIGH';
  if (severity === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
}

function toRiskLevel(score: number): RiskLevel {
  if (score >= 75) return 'CRITICAL';
  if (score >= 55) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}

@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private async assertClubAccess(userId: string, clubId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      select: {
        userId: true,
        clubId: true,
        primary: true,
        subRoles: true,
        club: { select: { id: true, name: true, slug: true, aiEnabled: true, isActive: true } },
      },
    });

    if (!membership) throw new ForbiddenException('No access to this club');
    if (membership.club?.isActive === false) throw new ForbiddenException('Club is deactivated by platform admin');
    if (membership.club?.aiEnabled === false) throw new ForbiddenException('AI module is disabled for this club');
    return membership;
  }

  private buildSkillAnalysis(players: Array<{
    userId: string;
    name: string;
    goals: number;
    assists: number;
    minutes: number;
    yellow: number;
    red: number;
    matches: number;
  }>) {
    const maxGoalsPer90 = Math.max(1, ...players.map((row) => (row.minutes ? (row.goals * 90) / row.minutes : 0)));
    const maxAssistsPer90 = Math.max(1, ...players.map((row) => (row.minutes ? (row.assists * 90) / row.minutes : 0)));
    const maxMinPerMatch = Math.max(1, ...players.map((row) => (row.matches ? row.minutes / row.matches : 0)));

    const rows = players
      .map((row) => {
        const goalsPer90 = row.minutes ? (row.goals * 90) / row.minutes : 0;
        const assistsPer90 = row.minutes ? (row.assists * 90) / row.minutes : 0;
        const minPerMatch = row.matches ? row.minutes / row.matches : 0;
        const cardsPerMatch = row.matches ? (row.yellow + row.red * 2) / row.matches : 0;
        const finishing = clamp(Math.round((goalsPer90 / maxGoalsPer90) * 100), 0, 100);
        const creation = clamp(Math.round((assistsPer90 / maxAssistsPer90) * 100), 0, 100);
        const endurance = clamp(Math.round((minPerMatch / maxMinPerMatch) * 100), 0, 100);
        const discipline = clamp(Math.round(100 - cardsPerMatch * 18), 0, 100);
        const overall = clamp(Math.round(finishing * 0.34 + creation * 0.28 + endurance * 0.24 + discipline * 0.14), 0, 100);
        return {
          userId: row.userId,
          name: row.name,
          matches: row.matches,
          totals: { goals: row.goals, assists: row.assists, minutes: row.minutes, yellow: row.yellow, red: row.red },
          per90: { goals: Number(goalsPer90.toFixed(2)), assists: Number(assistsPer90.toFixed(2)) },
          indices: { finishing, creation, endurance, discipline, overall },
        };
      })
      .sort((a, b) => b.indices.overall - a.indices.overall);

    const avg = (key: 'finishing' | 'creation' | 'endurance' | 'discipline' | 'overall') =>
      rows.length ? Math.round(rows.reduce((sum, row) => sum + row.indices[key], 0) / rows.length) : 0;

    return {
      generatedAt: new Date().toISOString(),
      players: rows,
      teamAverages: {
        finishing: avg('finishing'),
        creation: avg('creation'),
        endurance: avg('endurance'),
        discipline: avg('discipline'),
        overall: avg('overall'),
      },
      leaders: {
        overall: rows.slice(0, 5).map((row) => ({ userId: row.userId, name: row.name, value: row.indices.overall })),
      },
    };
  }

  private buildSchedulePlan(input: {
    days: number;
    now: Date;
    upcomingMatches: Array<{ id: string; title?: string | null; opponent?: string | null; kickoffAt: Date; venue?: string | null }>;
    openTasks: Array<{ dueAt: Date | null; priority: string | null }>;
    risk: { score: number };
    highInjuryCount: number;
  }) {
    const matchByDay = new Map(input.upcomingMatches.map((match) => [isoDay(match.kickoffAt), match]));
    const start = new Date(input.now);
    start.setHours(0, 0, 0, 0);

    const days = Array.from({ length: input.days }).map((_, index) => {
      const date = new Date(start.getTime() + index * DAY_MS);
      const key = isoDay(date);
      const match = matchByDay.get(key) || null;
      const tomorrow = matchByDay.get(isoDay(new Date(date.getTime() + DAY_MS)));
      const yesterday = matchByDay.get(isoDay(new Date(date.getTime() - DAY_MS)));
      const due = input.openTasks.filter((task) => task.dueAt && isoDay(task.dueAt) === key);
      const high = due.filter((task) => String(task.priority || '').toUpperCase() === 'HIGH');

      let load: ScheduleLoad = 'INTENSIVE';
      let focus = 'Technical + tactical progression';
      if (match) {
        load = 'MATCHDAY';
        focus = 'Competition execution and controlled warm-up';
      } else if (yesterday) {
        load = 'RECOVERY';
        focus = 'Medical recovery and low-intensity mobility';
      } else if (tomorrow || input.risk.score >= 65 || input.highInjuryCount >= 2) {
        load = 'LIGHT';
        focus = 'Risk-mitigated tactical tuning';
      }

      return {
        date: key,
        load,
        focus,
        taskPressure: { due: due.length, high: high.length },
        linkedMatch: match
          ? { id: match.id, title: match.title, opponent: match.opponent, kickoffAt: match.kickoffAt.toISOString(), venue: match.venue }
          : null,
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      window: {
        from: days[0]?.date || isoDay(input.now),
        to: days[days.length - 1]?.date || isoDay(input.now),
        days: input.days,
      },
      summary: {
        matchDays: days.filter((row) => row.load === 'MATCHDAY').length,
        recoveryDays: days.filter((row) => row.load === 'RECOVERY').length,
        intensiveDays: days.filter((row) => row.load === 'INTENSIVE').length,
        lightDays: days.filter((row) => row.load === 'LIGHT').length,
      },
      days,
    };
  }

  private buildRecommendations(input: {
    summary: {
      matchesInRange: number;
      upcoming7d: number;
      highSeverityInjuries: number;
      openTasks: number;
      dueSoonTasks: number;
      highPriorityTasks: number;
      messagesLast24h: number;
    };
    risk: { score: number; level: RiskLevel };
    skill: { teamAverages: { discipline: number } };
    topGoalScorer?: { name: string; value: number };
  }) {
    const rows: Array<{
      id: string;
      priority: RecommendationPriority;
      category: RecommendationCategory;
      confidence: number;
      impactScore: number;
      title: string;
      reason: string;
      action: string;
    }> = [];

    if (input.summary.matchesInRange === 0) {
      rows.push({ id: 'data-capture', priority: 'MEDIUM', category: 'OPERATIONS', confidence: 0.91, impactScore: 72, title: 'Increase match data capture', reason: 'No finished matches in selected range.', action: 'Finalize match statuses and recompute stats.' });
    }
    if (input.summary.highSeverityInjuries > 0) {
      rows.push({ id: 'medical-escalation', priority: 'HIGH', category: 'MEDICAL', confidence: 0.95, impactScore: 90, title: 'Escalate medical follow-ups', reason: `${input.summary.highSeverityInjuries} high-severity injuries active.`, action: 'Run daily check-ins and reduce high-load sessions.' });
    }
    if (input.summary.dueSoonTasks >= 3 || input.summary.highPriorityTasks >= 3) {
      rows.push({ id: 'task-pressure', priority: 'HIGH', category: 'OPERATIONS', confidence: 0.9, impactScore: 85, title: 'Reduce operational bottlenecks', reason: `${input.summary.dueSoonTasks} due-soon tasks with high priority backlog.`, action: 'Reassign overdue-critical tasks and split non-critical tasks.' });
    }
    if (input.summary.upcoming7d >= 3) {
      rows.push({ id: 'fixture-congestion', priority: 'MEDIUM', category: 'SCHEDULE', confidence: 0.88, impactScore: 78, title: 'Manage fixture congestion', reason: `${input.summary.upcoming7d} fixtures in next 7 days.`, action: 'Rotate high-minute players and enforce recovery windows.' });
    }
    if (input.topGoalScorer && input.topGoalScorer.value >= 3) {
      rows.push({ id: 'finishing-focus', priority: 'LOW', category: 'SKILL', confidence: 0.75, impactScore: 60, title: 'Scale successful attacking patterns', reason: `${input.topGoalScorer.name} is leading scoring output.`, action: "Replicate this player's chance-creation lane in drills." });
    }
    if (input.risk.score >= 75) {
      rows.push({ id: 'risk-emergency', priority: 'HIGH', category: 'SCHEDULE', confidence: 0.93, impactScore: 94, title: 'Activate high-risk protocol', reason: `Risk score ${input.risk.score}/100 (${input.risk.level}).`, action: 'Pause non-essential load and simplify tactical cycle for 48h.' });
    }
    if (input.summary.messagesLast24h === 0 && input.summary.openTasks > 0) {
      rows.push({ id: 'comms-gap', priority: 'MEDIUM', category: 'OPERATIONS', confidence: 0.8, impactScore: 66, title: 'Improve staff communications', reason: 'No recent broadcast while open tasks remain high.', action: 'Publish a short action memo with ownership and due times.' });
    }
    if (input.skill.teamAverages.discipline < 55) {
      rows.push({ id: 'discipline-reset', priority: 'MEDIUM', category: 'SKILL', confidence: 0.78, impactScore: 64, title: 'Run discipline correction block', reason: `Team discipline index ${input.skill.teamAverages.discipline}/100.`, action: 'Add decision-pressure drills to reduce avoidable cards.' });
    }

    return rows.sort((a, b) => b.impactScore - a.impactScore).slice(0, 10);
  }

  private buildRecommendationSystem(input: {
    recommendations: Array<{
      id: string;
      priority: RecommendationPriority;
      category: RecommendationCategory;
      confidence: number;
      impactScore: number;
      title: string;
      reason: string;
      action: string;
    }>;
    risk: { score: number; level: RiskLevel };
    schedule: { summary: { matchDays: number } };
    skills: { teamAverages: { overall: number } };
  }) {
    return {
      generatedAt: new Date().toISOString(),
      version: 'v2-live-rules',
      riskContext: input.risk,
      categories: {
        MEDICAL: input.recommendations.filter((row) => row.category === 'MEDICAL'),
        SCHEDULE: input.recommendations.filter((row) => row.category === 'SCHEDULE'),
        SKILL: input.recommendations.filter((row) => row.category === 'SKILL'),
        OPERATIONS: input.recommendations.filter((row) => row.category === 'OPERATIONS'),
      },
      prioritized: input.recommendations.map((row, index) => ({ rank: index + 1, ...row })),
      automationCandidates: [
        { id: 'auto-schedule', title: 'Apply AI schedule load map', eligible: input.risk.score >= 45 || input.schedule.summary.matchDays >= 2 },
        { id: 'auto-skill-program', title: 'Assign skill micro-cycles', eligible: input.skills.teamAverages.overall < 65 },
      ],
    };
  }

  private async buildInsights(userId: string, clubId: string, range: string, scheduleDaysInput: number = 7) {
    const membership = await this.assertClubAccess(userId, clubId);
    const rangeDays = daysFromRange(range);
    const scheduleDays = normalizeDays(scheduleDaysInput);
    const now = new Date();
    const from = new Date(now.getTime() - rangeDays * DAY_MS);
    const next7 = new Date(now.getTime() + 7 * DAY_MS);
    const soonCutoff = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    const [playersCount, squadsCount, finishedMatches, upcomingMatches, statRows, activeInjuries, openTasks, messagesLast24h] = await Promise.all([
      this.prisma.membership.count({ where: { clubId, primary: PrimaryRole.PLAYER } }),
      this.prisma.squad.count({ where: { clubId } }),
      this.prisma.match.findMany({
        where: { clubId, status: MatchStatus.FINISHED, kickoffAt: { gte: from, lte: now } },
        orderBy: { kickoffAt: 'asc' },
        select: { id: true, title: true, opponent: true, kickoffAt: true, venue: true, homeScore: true, awayScore: true },
      }),
      this.prisma.match.findMany({
        where: { clubId, kickoffAt: { gte: now, lte: next7 }, status: { in: [MatchStatus.SCHEDULED, MatchStatus.LIVE] } },
        orderBy: { kickoffAt: 'asc' },
        take: 12,
        select: { id: true, title: true, opponent: true, kickoffAt: true, venue: true, status: true, homeScore: true, awayScore: true },
      }),
      this.prisma.playerMatchStat.findMany({
        where: { clubId, match: { kickoffAt: { gte: from, lte: now } } },
        select: { userId: true, goals: true, assists: true, minutes: true, yellow: true, red: true, match: { select: { kickoffAt: true } } },
      }),
      this.prisma.playerInjury.findMany({
        where: { clubId, isActive: true },
        orderBy: { startDate: 'desc' },
        take: 20,
        select: { id: true, userId: true, type: true, severity: true, isActive: true, startDate: true, endDate: true, user: { select: { id: true, fullName: true, email: true } } },
      }),
      this.prisma.clubTask.findMany({
        where: { clubId, status: { in: [ClubTaskStatus.OPEN, ClubTaskStatus.PENDING] } },
        select: { id: true, title: true, priority: true, status: true, dueAt: true },
      }),
      this.prisma.clubMessage.count({ where: { clubId, isActive: true, createdAt: { gte: new Date(now.getTime() - DAY_MS) } } }),
    ]);

    const perUser = new Map<string, { goals: number; assists: number; minutes: number; yellow: number; red: number; matches: number }>();
    const trendMap = new Map<string, { day: string; matches: number; goals: number; assists: number; minutes: number }>();

    for (const match of finishedMatches) {
      const day = isoDay(new Date(match.kickoffAt));
      if (!trendMap.has(day)) trendMap.set(day, { day, matches: 0, goals: 0, assists: 0, minutes: 0 });
      trendMap.get(day)!.matches += 1;
    }

    for (const row of statRows) {
      const bucket = perUser.get(row.userId) || { goals: 0, assists: 0, minutes: 0, yellow: 0, red: 0, matches: 0 };
      bucket.goals += row.goals || 0;
      bucket.assists += row.assists || 0;
      bucket.minutes += row.minutes || 0;
      bucket.yellow += row.yellow || 0;
      bucket.red += row.red || 0;
      bucket.matches += 1;
      perUser.set(row.userId, bucket);

      const day = isoDay(new Date(row.match.kickoffAt));
      if (!trendMap.has(day)) trendMap.set(day, { day, matches: 0, goals: 0, assists: 0, minutes: 0 });
      trendMap.get(day)!.goals += row.goals || 0;
      trendMap.get(day)!.assists += row.assists || 0;
      trendMap.get(day)!.minutes += row.minutes || 0;
    }

    const ids = Array.from(perUser.keys());
    const users = ids.length ? await this.prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, fullName: true, email: true } }) : [];
    const userMap = new Map(users.map((row) => [row.id, row.fullName || row.email || row.id]));

    const rankingRows = Array.from(perUser.entries()).map(([id, totals]) => ({
      userId: id,
      name: userMap.get(id) || id,
      goals: totals.goals,
      assists: totals.assists,
      minutes: totals.minutes,
      yellow: totals.yellow,
      red: totals.red,
      matches: totals.matches,
    }));

    const topPerformers = {
      goals: rankingRows.slice().sort((a, b) => b.goals - a.goals).slice(0, 5).map((row) => ({ userId: row.userId, name: row.name, value: row.goals })),
      assists: rankingRows.slice().sort((a, b) => b.assists - a.assists).slice(0, 5).map((row) => ({ userId: row.userId, name: row.name, value: row.assists })),
      minutes: rankingRows.slice().sort((a, b) => b.minutes - a.minutes).slice(0, 5).map((row) => ({ userId: row.userId, name: row.name, value: row.minutes })),
    };

    const highSeverityInjuries = activeInjuries.filter((row) => normalizeSeverity(row.severity) === 'HIGH').length;
    const dueSoonTasks = openTasks.filter((task) => task.dueAt && new Date(task.dueAt).getTime() <= soonCutoff.getTime()).length;
    const highPriorityTasks = openTasks.filter((task) => String(task.priority || '').toUpperCase() === 'HIGH').length;

    const riskScore = clamp(Math.round(highSeverityInjuries * 12 + dueSoonTasks * 7 + highPriorityTasks * 6 + Math.max(0, upcomingMatches.length - 2) * 9), 0, 100);
    const risk = {
      score: riskScore,
      level: toRiskLevel(riskScore),
      drivers: {
        injuryPressure: highSeverityInjuries * 12,
        dueSoonPressure: dueSoonTasks * 7,
        backlogPressure: highPriorityTasks * 6,
        fixturePressure: Math.max(0, upcomingMatches.length - 2) * 9,
      },
    };

    const summary = {
      players: playersCount,
      squads: squadsCount,
      matchesInRange: finishedMatches.length,
      upcoming7d: upcomingMatches.length,
      activeInjuries: activeInjuries.length,
      highSeverityInjuries,
      openTasks: openTasks.length,
      dueSoonTasks,
      highPriorityTasks,
      messagesLast24h: messagesLast24h || 0,
      totalGoals: statRows.reduce((sum, row) => sum + (row.goals || 0), 0),
      totalAssists: statRows.reduce((sum, row) => sum + (row.assists || 0), 0),
      totalMinutes: statRows.reduce((sum, row) => sum + (row.minutes || 0), 0),
    };

    const skills = this.buildSkillAnalysis(rankingRows);
    const recommendations = this.buildRecommendations({
      summary,
      risk,
      skill: skills,
      topGoalScorer: topPerformers.goals[0],
    });
    const schedule = this.buildSchedulePlan({
      days: scheduleDays,
      now,
      upcomingMatches,
      openTasks,
      risk,
      highInjuryCount: highSeverityInjuries,
    });
    const recommendationSystem = this.buildRecommendationSystem({
      recommendations,
      risk,
      schedule,
      skills,
    });
    const trend = Array.from(trendMap.values()).sort((a, b) => a.day.localeCompare(b.day));

    return {
      club: membership.club,
      actorRole: membership.primary,
      actorSubRoles: membership.subRoles,
      generatedAt: new Date().toISOString(),
      rangeDays,
      summary,
      risk,
      trend,
      topPerformers,
      skills,
      schedule,
      recommendationSystem,
      upcomingMatches: upcomingMatches.map((row) => ({
        id: row.id,
        title: row.title,
        opponent: row.opponent,
        kickoffAt: row.kickoffAt.toISOString(),
        venue: row.venue,
        status: row.status,
        scoreline: `${row.homeScore ?? 0}-${row.awayScore ?? 0}`,
      })),
      activeInjuries: activeInjuries.map((row) => ({
        id: row.id,
        userId: row.userId,
        playerName: row.user?.fullName || row.user?.email || row.userId,
        type: row.type,
        severity: normalizeSeverity(row.severity),
        startDate: row.startDate.toISOString(),
        endDate: row.endDate ? row.endDate.toISOString() : null,
      })),
      recommendations,
      dataQuality: {
        statRows: statRows.length,
        playersWithStats: rankingRows.length,
        lastFinishedMatchAt: finishedMatches[finishedMatches.length - 1]?.kickoffAt?.toISOString() || null,
      },
    };
  }

  private buildRuleBasedAnswer(question: string, insights: Awaited<ReturnType<AiService['buildInsights']>>) {
    const topGoal = insights.topPerformers.goals[0];
    const topAssist = insights.topPerformers.assists[0];
    const skillAvg = insights.skills?.teamAverages;
    const schedule = insights.schedule?.summary;
    const recText = insights.recommendations
      .slice(0, 4)
      .map((item, index) => `${index + 1}. [${item.category}/${item.priority}] ${item.title}: ${item.action}`)
      .join('\n');

    return [
      `Question: ${question}`,
      '',
      `Live snapshot (${insights.rangeDays}d):`,
      `- Risk: ${insights.risk.score}/100 (${insights.risk.level})`,
      `- Fixtures next 7d: ${insights.summary.upcoming7d}`,
      `- Active injuries: ${insights.summary.activeInjuries} (high severity: ${insights.summary.highSeverityInjuries})`,
      `- Open tasks: ${insights.summary.openTasks} (due soon: ${insights.summary.dueSoonTasks})`,
      topGoal ? `- Top scorer: ${topGoal.name} (${topGoal.value} goals)` : '- Top scorer: not available',
      topAssist ? `- Top creator: ${topAssist.name} (${topAssist.value} assists)` : '- Top creator: not available',
      schedule ? `- AI schedule: ${schedule.matchDays} matchday, ${schedule.recoveryDays} recovery, ${schedule.intensiveDays} intensive, ${schedule.lightDays} light` : '- AI schedule: unavailable',
      skillAvg ? `- Team skill indices: overall ${skillAvg.overall}, finishing ${skillAvg.finishing}, creation ${skillAvg.creation}, endurance ${skillAvg.endurance}, discipline ${skillAvg.discipline}` : '- Team skill indices: unavailable',
      '',
      'Recommended actions:',
      recText || '1. No critical recommendation right now. Keep current monitoring cadence.',
      '',
      'This response is generated from live club data without synthetic placeholders.',
    ].join('\n');
  }

  private async runOpenAiAssistant(input: {
    question: string;
    lensRole?: string;
    insights: Awaited<ReturnType<AiService['buildInsights']>>;
  }) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY') || this.config.get<string>('AI_OPENAI_API_KEY');
    if (!apiKey) throw new ServiceUnavailableException('OPENAI_API_KEY is not configured');
    const model = this.config.get<string>('OPENAI_MODEL') || this.config.get<string>('AI_OPENAI_MODEL') || 'gpt-4.1-mini';

    const context = {
      generatedAt: input.insights.generatedAt,
      rangeDays: input.insights.rangeDays,
      summary: input.insights.summary,
      risk: input.insights.risk,
      topPerformers: input.insights.topPerformers,
      skills: input.insights.skills,
      schedule: input.insights.schedule,
      recommendationSystem: input.insights.recommendationSystem,
      recommendations: input.insights.recommendations.slice(0, 8),
      dataQuality: input.insights.dataQuality,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            { role: 'system', content: 'You are EsportM AI analyst. Use only supplied live context. Do not invent numbers. Prioritize schedule management, skill analysis and recommendation actions.' },
            { role: 'user', content: `Role lens: ${input.lensRole || 'AUTO'}\nQuestion: ${input.question}\n\nLive context JSON:\n${JSON.stringify(context)}` },
          ],
        }),
      });
      const payload = (await response.json()) as any;
      if (!response.ok) throw new ServiceUnavailableException(payload?.error?.message || payload?.message || `OpenAI request failed with status ${response.status}`);
      const answer = String(payload?.choices?.[0]?.message?.content || '').trim();
      if (!answer) throw new ServiceUnavailableException('OpenAI returned an empty response');
      return { answer, model };
    } finally {
      clearTimeout(timeout);
    }
  }

  async getInsights(userId: string, clubId: string, range: string, days: number = 7) {
    return this.buildInsights(userId, clubId, range, days);
  }

  async getSchedule(userId: string, clubId: string, range: string, days: number = 7) {
    const insights = await this.buildInsights(userId, clubId, range, days);
    return { club: insights.club, generatedAt: insights.generatedAt, rangeDays: insights.rangeDays, risk: insights.risk, schedule: insights.schedule };
  }

  async getSkills(userId: string, clubId: string, range: string) {
    const insights = await this.buildInsights(userId, clubId, range, 7);
    return { club: insights.club, generatedAt: insights.generatedAt, rangeDays: insights.rangeDays, skills: insights.skills, topPerformers: insights.topPerformers };
  }

  async getRecommendations(userId: string, clubId: string, range: string, days: number = 7) {
    const insights = await this.buildInsights(userId, clubId, range, days);
    return {
      club: insights.club,
      generatedAt: insights.generatedAt,
      rangeDays: insights.rangeDays,
      risk: insights.risk,
      summary: insights.summary,
      recommendationSystem: insights.recommendationSystem,
      recommendations: insights.recommendations,
    };
  }

  async assistant(userId: string, clubId: string, dto: AskAiAssistantDto) {
    const insights = await this.buildInsights(
      userId,
      clubId,
      dto.range || '30d',
      normalizeDays(Number(dto.days || 7)),
    );
    try {
      const openAi = await this.runOpenAiAssistant({ question: dto.question.trim(), lensRole: dto.lensRole, insights });
      return { mode: 'openai', model: openAi.model, generatedAt: new Date().toISOString(), answer: openAi.answer, insights };
    } catch {
      return { mode: 'rule-based', model: null, generatedAt: new Date().toISOString(), answer: this.buildRuleBasedAnswer(dto.question.trim(), insights), insights };
    }
  }
}
