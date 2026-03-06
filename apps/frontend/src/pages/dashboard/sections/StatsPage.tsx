import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getLeaderboard, type LeaderboardMetric, type LeaderboardRow } from "../../../api/admin.api";
import { useDashboardCharts, useDashboardOverview } from "../../../hooks/useDashboard";
import { useMe } from "../../../hooks/useMe";
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
} from "../../admin/admin-ui";

type Range = "7d" | "30d" | "90d";
type OverviewData = {
  kpis?: Array<{ key: string; label: string; value: number }>;
};
type ChartsData = {
  series?: Array<{ name: string; points: Array<{ x: string; y: number }> }>;
};

function normalizeLabel(day: string) {
  const parsed = new Date(day);
  if (Number.isNaN(parsed.getTime())) return day;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function metricValue(row: LeaderboardRow, metric: LeaderboardMetric) {
  if (row?.totals && typeof row.totals[metric] === "number") return row.totals[metric] ?? 0;
  if (typeof row?.value === "number") return row.value;
  if (typeof row?.score === "number") return row.score;
  if (typeof row?.[metric] === "number") return row[metric] as number;
  return 0;
}

export default function StatsPage() {
  const [range, setRange] = useState<Range>("30d");
  const [metric, setMetric] = useState<LeaderboardMetric>("goals");
  const [board, setBoard] = useState<LeaderboardRow[]>([]);
  const [boardErr, setBoardErr] = useState<string | null>(null);

  const meQuery = useMe();
  const overviewQuery = useDashboardOverview();
  const chartsQuery = useDashboardCharts(range);

  const overview = (overviewQuery.data || {}) as OverviewData;
  const charts = (chartsQuery.data || {}) as ChartsData;
  const meData = (meQuery.data || {}) as { activeClubId?: string | null };
  const clubId = meData.activeClubId || localStorage.getItem("activeClubId") || "";

  useEffect(() => {
    let alive = true;
    async function loadBoard() {
      if (!clubId) return;
      try {
        setBoardErr(null);
        const rows = await getLeaderboard(clubId, metric, 10);
        if (!alive) return;
        setBoard(rows || []);
      } catch {
        if (!alive) return;
        setBoard([]);
        setBoardErr("Unable to load leaderboard");
      }
    }
    loadBoard();
    return () => {
      alive = false;
    };
  }, [clubId, metric]);

  const loading = overviewQuery.isLoading || chartsQuery.isLoading || meQuery.isLoading;

  const byKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of overview.kpis || []) map.set(item.key, Number(item.value) || 0);
    return map;
  }, [overview.kpis]);

  const chartData = useMemo(() => {
    const index = new Map<string, { matches: number; goals: number; assists: number }>();
    for (const series of charts.series || []) {
      for (const point of series.points || []) {
        if (!index.has(point.x)) index.set(point.x, { matches: 0, goals: 0, assists: 0 });
        const row = index.get(point.x)!;
        if (series.name === "Matches Played") row.matches = point.y || 0;
        if (series.name === "Goals") row.goals = point.y || 0;
        if (series.name === "Assists") row.assists = point.y || 0;
      }
    }
    return Array.from(index.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([x, row]) => ({ day: normalizeLabel(x), ...row }));
  }, [charts.series]);

  const totalGoals = chartData.reduce((sum, row) => sum + row.goals, 0);
  const totalAssists = chartData.reduce((sum, row) => sum + row.assists, 0);
  const totalMatches = chartData.reduce((sum, row) => sum + row.matches, 0);

  if (loading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading stats center...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Stats Center"
        subtitle="Club performance analytics and leaderboard insights from live data."
        right={<DotTag>STATS</DotTag>}
      />

      {(overviewQuery.isError || chartsQuery.isError) && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          Some stats modules failed to load.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Stat label="Squads" value={byKey.get("squads") || 0} />
        <Stat label="Players" value={byKey.get("players") || 0} />
        <Stat label={`Matches (${range})`} value={totalMatches} />
        <Stat label={`Goals (${range})`} value={totalGoals} />
        <Stat label={`Assists (${range})`} value={totalAssists} />
        <Stat label="Upcoming (7d)" value={byKey.get("upcoming") || 0} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Performance Trend"
          subtitle="Match volume and attacking output over selected range."
          className="xl:col-span-8"
          right={
            <div className="flex items-center gap-2">
              {(["7d", "30d", "90d"] as Range[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRange(option)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    range === option ? "bg-[rgba(var(--primary),.24)]" : "bg-white/70 hover:bg-white/90"
                  }`}
                  style={{ borderColor: adminCardBorder }}
                >
                  {option}
                </button>
              ))}
            </div>
          }
        >
          <div className="h-[300px]">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid stroke="rgba(20,24,32,.12)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: `1px solid ${adminCardBorder}`,
                      background: "rgba(255,255,255,.92)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="matches"
                    stroke="rgba(var(--primary-2), .82)"
                    fill="rgba(var(--primary-2), .18)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="goals"
                    stroke="rgba(var(--primary), .95)"
                    fill="rgba(var(--primary), .30)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="assists"
                    stroke="rgba(16,185,129,.92)"
                    fill="rgba(16,185,129,.20)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-6 text-sm text-[rgb(var(--muted))]">No chart data for selected range.</p>
            )}
          </div>
        </Section>

        <Section
          title="Leaderboard"
          subtitle="Top performers by selected metric."
          className="xl:col-span-4"
          dark
          right={
            <select
              value={metric}
              onChange={(event) => setMetric(event.target.value as LeaderboardMetric)}
              className="rounded-full border bg-white/90 px-3 py-1 text-xs font-semibold text-[rgb(var(--primary-2))] outline-none"
              style={{ borderColor: "rgba(255,255,255,.35)" }}
            >
              <option value="goals">Goals</option>
              <option value="assists">Assists</option>
              <option value="minutes">Minutes</option>
            </select>
          }
        >
          {boardErr ? <p className="text-sm text-rose-300">{boardErr}</p> : null}
          {!board.length ? (
            <p className="text-sm text-white/75">No leaderboard entries.</p>
          ) : (
            <div className="space-y-3">
              {board.slice(0, 8).map((row, index) => (
                <div key={`${row.user?.id || index}`} className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
                  <p className="truncate text-sm font-bold text-white">
                    #{index + 1} {row.user?.fullName || row.user?.email || row.user?.id}
                  </p>
                  <p className="text-xs text-white/70">
                    {metric.toUpperCase()}: {metricValue(row, metric)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </PageWrap>
  );
}

