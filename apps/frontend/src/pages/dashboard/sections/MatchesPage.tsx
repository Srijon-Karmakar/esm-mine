import { useMemo, useState } from "react";
import { useDashboardRecent } from "../../../hooks/useDashboard";
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
  formatDateTime,
} from "../../admin/admin-ui";

type Filter = "ALL" | "SCHEDULED" | "LIVE" | "FINISHED" | "CANCELLED";
type RecentData = {
  matches?: Array<{
    id: string;
    title?: string | null;
    opponent?: string | null;
    kickoffAt?: string | null;
    venue?: string | null;
    status?: string | null;
    homeScore?: number | null;
    awayScore?: number | null;
  }>;
};

function statusTone(status?: string | null) {
  if (status === "LIVE") return "warn";
  if (status === "FINISHED") return "ok";
  if (status === "CANCELLED") return "danger";
  return "default";
}

export default function MatchesPage() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [now] = useState(() => Date.now());
  const recentQuery = useDashboardRecent(40);
  const recent = (recentQuery.data || {}) as RecentData;

  const matches = useMemo(() => {
    return [...(recent.matches || [])].sort(
      (a, b) => new Date(a.kickoffAt || 0).getTime() - new Date(b.kickoffAt || 0).getTime()
    );
  }, [recent.matches]);

  const counters = useMemo(() => {
    const upcoming = matches.filter((match) => {
      const kickoff = new Date(match.kickoffAt || 0).getTime();
      return Number.isFinite(kickoff) && kickoff >= now;
    }).length;
    return {
      total: matches.length,
      upcoming,
      scheduled: matches.filter((match) => String(match.status || "").toUpperCase() === "SCHEDULED").length,
      live: matches.filter((match) => String(match.status || "").toUpperCase() === "LIVE").length,
      finished: matches.filter((match) => String(match.status || "").toUpperCase() === "FINISHED").length,
      cancelled: matches.filter((match) => String(match.status || "").toUpperCase() === "CANCELLED").length,
    };
  }, [matches, now]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return matches;
    return matches.filter((match) => String(match.status || "").toUpperCase() === filter);
  }, [matches, filter]);

  if (recentQuery.isLoading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading fixture board...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Matches Hub"
        subtitle="Central fixture stream with live statuses and score updates."
        right={<DotTag>MATCHES</DotTag>}
      />

      {recentQuery.isError && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          Unable to fetch matches right now.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Stat label="All Matches" value={counters.total} />
        <Stat label="Upcoming" value={counters.upcoming} />
        <Stat label="Scheduled" value={counters.scheduled} />
        <Stat label="Live" value={counters.live} />
        <Stat label="Finished" value={counters.finished} />
        <Stat label="Cancelled" value={counters.cancelled} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Fixture Stream"
          subtitle="Filter and scan all recent fixtures."
          className="xl:col-span-8"
          right={
            <div className="flex flex-wrap items-center gap-2">
              {(["ALL", "SCHEDULED", "LIVE", "FINISHED", "CANCELLED"] as Filter[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    filter === option ? "bg-[rgba(var(--primary),.24)]" : "bg-white/70 hover:bg-white/90"
                  }`}
                  style={{ borderColor: adminCardBorder }}
                >
                  {option}
                </button>
              ))}
            </div>
          }
        >
          {!filtered.length ? (
            <p className="text-sm text-[rgb(var(--muted))]">No matches for this filter.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((match) => (
                <article
                  key={match.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white/72 px-3 py-3"
                  style={{ borderColor: adminCardBorder }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[rgb(var(--text))]">
                      {match.title || `vs ${match.opponent || "Opponent"}`}
                    </p>
                    <p className="truncate text-xs text-[rgb(var(--muted))]">
                      {formatDateTime(match.kickoffAt)} | {match.venue || "Venue TBA"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <DotTag tone={statusTone(match.status)}>{match.status || "SCHEDULED"}</DotTag>
                    <span className="text-xs font-bold text-[rgb(var(--text))]">
                      {match.homeScore != null && match.awayScore != null
                        ? `${match.homeScore} - ${match.awayScore}`
                        : "Pending"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Section>

        <Section title="Result Snapshot" subtitle="Quick status split." className="xl:col-span-4" dark>
          <div className="space-y-3">
            <LineItem label="Upcoming" value={counters.upcoming} />
            <LineItem label="Scheduled" value={counters.scheduled} />
            <LineItem label="Live" value={counters.live} />
            <LineItem label="Finished" value={counters.finished} />
            <LineItem label="Cancelled" value={counters.cancelled} />
          </div>
        </Section>
      </div>
    </PageWrap>
  );
}

function LineItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
      <p className="text-xs text-white/70">{label}</p>
      <p className="text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

