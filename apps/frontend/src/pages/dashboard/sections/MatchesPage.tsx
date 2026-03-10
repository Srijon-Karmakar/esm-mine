import { useMemo, useState } from "react";
import { useDashboardRecent } from "../../../hooks/useDashboard";
import { useMe } from "../../../hooks/useMe";
import { createClubMatch } from "../../../api/admin.api";
import { hasRolePermission } from "../../../utils/rolePolicy";
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

const PRIMARY_ROLES = ["ADMIN", "MANAGER", "PLAYER", "MEMBER"] as const;
const SUB_ROLES = ["COACH", "PHYSIO", "AGENT", "NUTRITIONIST", "PITCH_MANAGER", "CAPTAIN"] as const;
type PrimaryRole = (typeof PRIMARY_ROLES)[number];
type SubRole = (typeof SUB_ROLES)[number];

function normalizePrimaryRole(value: unknown): PrimaryRole {
  const role = String(value || "").toUpperCase();
  if (PRIMARY_ROLES.includes(role as PrimaryRole)) return role as PrimaryRole;
  return "MEMBER";
}

function normalizeSubRoles(value: unknown): SubRole[] {
  if (!Array.isArray(value)) return [];
  const picked: SubRole[] = [];
  for (const role of SUB_ROLES) {
    if (value.includes(role)) picked.push(role);
  }
  return picked;
}

function statusTone(status?: string | null) {
  if (status === "LIVE") return "warn";
  if (status === "FINISHED") return "ok";
  if (status === "CANCELLED") return "danger";
  return "default";
}

export default function MatchesPage() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [now] = useState(() => Date.now());
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [opponent, setOpponent] = useState("");
  const [venue, setVenue] = useState("");
  const [kickoffAt, setKickoffAt] = useState(() => {
    const nextDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const pad = (value: number) => String(value).padStart(2, "0");
    const year = nextDay.getFullYear();
    const month = pad(nextDay.getMonth() + 1);
    const day = pad(nextDay.getDate());
    const hours = pad(nextDay.getHours());
    const minutes = pad(nextDay.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });
  const meQuery = useMe();
  const recentQuery = useDashboardRecent(40);
  const recent = (recentQuery.data || {}) as RecentData;
  const meData = (meQuery.data || {}) as {
    activeClubId?: string | null;
    activeMembership?: { primary?: string; subRoles?: string[] } | null;
  };
  const primaryRole = normalizePrimaryRole(meData.activeMembership?.primary);
  const subRoles = normalizeSubRoles(meData.activeMembership?.subRoles);
  const canManage = hasRolePermission(primaryRole, subRoles, "matches.write");
  const activeClubId = String(meData.activeClubId || localStorage.getItem("activeClubId") || "").trim();

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

  const onCreateMatch = async () => {
    if (!canManage) return;
    if (!activeClubId) {
      setCreateError("No active club selected.");
      return;
    }
    if (!title.trim() || !opponent.trim() || !kickoffAt) {
      setCreateError("Title, opponent, and kickoff are required.");
      return;
    }
    try {
      setCreating(true);
      setCreateError(null);
      await createClubMatch(activeClubId, {
        title: title.trim(),
        opponent: opponent.trim(),
        venue: venue.trim() || undefined,
        kickoffAt: new Date(kickoffAt).toISOString(),
      });
      setShowCreate(false);
      setTitle("");
      setOpponent("");
      setVenue("");
      await recentQuery.refetch();
    } catch (e: any) {
      setCreateError(e?.response?.data?.message || e?.message || "Failed to create match.");
    } finally {
      setCreating(false);
    }
  };

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
        right={
          <div className="flex items-center gap-2">
            <DotTag>MATCHES</DotTag>
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setCreateError(null);
                  setShowCreate((prev) => !prev);
                }}
                className="rounded-full border bg-white/80 px-3 py-1 text-xs font-semibold transition hover:bg-white"
                style={{ borderColor: adminCardBorder }}
              >
                Create Match
              </button>
            )}
          </div>
        }
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

      {canManage && showCreate && (
        <Section title="Create Match" subtitle="Add a new fixture to this club schedule.">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Match title"
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none"
              style={{ borderColor: adminCardBorder }}
            />
            <input
              value={opponent}
              onChange={(event) => setOpponent(event.target.value)}
              placeholder="Opponent"
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none"
              style={{ borderColor: adminCardBorder }}
            />
            <input
              value={venue}
              onChange={(event) => setVenue(event.target.value)}
              placeholder="Venue (optional)"
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none"
              style={{ borderColor: adminCardBorder }}
            />
            <input
              type="datetime-local"
              value={kickoffAt}
              onChange={(event) => setKickoffAt(event.target.value)}
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none"
              style={{ borderColor: adminCardBorder }}
            />
          </div>
          {createError && (
            <p className="mt-2 text-sm font-semibold text-rose-700">{createError}</p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onCreateMatch}
              disabled={creating}
              className="rounded-xl px-3 py-2 text-sm font-extrabold transition disabled:opacity-60"
              style={{
                background: "rgb(var(--primary))",
                color: "rgb(var(--primary-2))",
                border: `1px solid ${adminCardBorder}`,
              }}
            >
              {creating ? "Creating..." : "Create Match"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm font-semibold"
              style={{ borderColor: adminCardBorder }}
            >
              Cancel
            </button>
          </div>
        </Section>
      )}

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

