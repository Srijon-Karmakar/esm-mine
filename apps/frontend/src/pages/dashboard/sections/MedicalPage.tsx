import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDashboardOverview, useDashboardRecent } from "../../../hooks/useDashboard";
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
  formatDateTime,
} from "../../admin/admin-ui";

type OverviewData = {
  kpis?: Array<{ key: string; label: string; value: number }>;
};
type RecentData = {
  injuries?: Array<{
    id: string;
    type?: string | null;
    severity?: string | null;
    isActive?: boolean;
    startDate?: string | null;
    endDate?: string | null;
    userId?: string;
  }>;
};

function severityKey(severity?: string | null) {
  const value = String(severity || "").toUpperCase();
  if (value === "HIGH" || value === "MEDIUM" || value === "LOW") return value;
  return "LOW";
}

function severityTone(severity?: string | null) {
  const value = String(severity || "").toUpperCase();
  if (value === "HIGH") return "danger";
  if (value === "MEDIUM") return "warn";
  return "ok";
}

export default function MedicalPage() {
  const overviewQuery = useDashboardOverview();
  const recentQuery = useDashboardRecent(40);

  const loading = overviewQuery.isLoading || recentQuery.isLoading;

  const overview = (overviewQuery.data || {}) as OverviewData;
  const recent = (recentQuery.data || {}) as RecentData;

  const injuries = useMemo(() => recent.injuries || [], [recent.injuries]);
  const activeInjuries = useMemo(() => injuries.filter((injury) => injury.isActive), [injuries]);
  const highSeverity = activeInjuries.filter(
    (injury) => String(injury.severity || "").toUpperCase() === "HIGH"
  ).length;

  const kpiInjuries =
    (overview.kpis || []).find((item) => item.key === "injuries")?.value || activeInjuries.length;

  const severityDist = useMemo(() => {
    const dist = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const injury of injuries) dist[severityKey(injury.severity)] += 1;
    return [
      { severity: "HIGH", count: dist.HIGH },
      { severity: "MEDIUM", count: dist.MEDIUM },
      { severity: "LOW", count: dist.LOW },
    ];
  }, [injuries]);

  if (loading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading medical center...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Medical Center"
        subtitle="Injury monitoring, severity distribution, and recovery timeline from live records."
        right={<DotTag>MEDICAL</DotTag>}
      />

      {(overviewQuery.isError || recentQuery.isError) && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          Unable to load full medical dataset.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Injury KPI" value={kpiInjuries} />
        <Stat label="Active Cases" value={activeInjuries.length} />
        <Stat label="High Severity Active" value={highSeverity} />
        <Stat label="Total Records" value={injuries.length} />
        <Stat label="Resolved Cases" value={injuries.length - activeInjuries.length} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section title="Severity Distribution" subtitle="All records grouped by severity." className="xl:col-span-5">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityDist}>
                <CartesianGrid stroke="rgba(20,24,32,.12)" strokeDasharray="3 3" />
                <XAxis dataKey="severity" tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
                <YAxis tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: `1px solid ${adminCardBorder}`,
                    background: "rgba(255,255,255,.92)",
                  }}
                />
                <Bar dataKey="count" fill="rgba(var(--primary), .82)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Active Recovery Queue" subtitle="Cases requiring current monitoring." className="xl:col-span-7" dark>
          {!activeInjuries.length ? (
            <p className="text-sm text-white/75">No active injuries currently.</p>
          ) : (
            <div className="space-y-3">
              {activeInjuries.map((injury) => (
                <div key={injury.id} className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-sm font-bold text-white">
                      {injury.type || "Injury"} | User {injury.userId || "-"}
                    </p>
                    <DotTag tone={severityTone(injury.severity)}>{injury.severity || "LOW"}</DotTag>
                  </div>
                  <p className="text-xs text-white/70">
                    Start {formatDateTime(injury.startDate)} | End {formatDateTime(injury.endDate)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <Section title="Medical Log" subtitle="Chronological injury feed.">
        {!injuries.length ? (
          <p className="text-sm text-[rgb(var(--muted))]">No injury records found.</p>
        ) : (
          <div className="space-y-3">
            {injuries.map((injury) => (
              <article
                key={injury.id}
                className="rounded-2xl border bg-white/72 px-3 py-3"
                style={{ borderColor: adminCardBorder }}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[rgb(var(--text))]">
                    {injury.type || "Injury"} | User {injury.userId || "-"}
                  </p>
                  <DotTag tone={severityTone(injury.severity)}>{injury.severity || "LOW"}</DotTag>
                </div>
                <p className="text-xs text-[rgb(var(--muted))]">
                  Active: {String(injury.isActive)} | Start {formatDateTime(injury.startDate)} | End{" "}
                  {formatDateTime(injury.endDate)}
                </p>
              </article>
            ))}
          </div>
        )}
      </Section>
    </PageWrap>
  );
}

