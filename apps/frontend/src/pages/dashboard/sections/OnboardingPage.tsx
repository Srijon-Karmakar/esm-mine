import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  acceptMyAssignment,
  createClub,
  getMe,
  getMyPendingAssignments,
  type MyPendingAssignment,
} from "../../../api/admin.api";
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  adminCardBorder,
  adminGlassShadow,
} from "../../admin/admin-ui";

const cardBorder = adminCardBorder;
const cardBg =
  "linear-gradient(145deg, rgba(255,255,255,.70), rgba(255,255,255,.44) 62%, rgba(var(--primary), .12))";
const glassShadow = adminGlassShadow;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState<MyPendingAssignment[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [canCreateClub, setCanCreateClub] = useState(false);
  const [clubName, setClubName] = useState("");
  const [clubSlug, setClubSlug] = useState("");
  const [creatingClub, setCreatingClub] = useState(false);

  const load = async () => {
    setErr(null);
    setLoading(true);
    try {
      const [rows, me] = await Promise.all([getMyPendingAssignments(), getMe()]);
      setPending(rows || []);
      const memberships = Array.isArray(me?.memberships)
        ? me.memberships
        : Array.isArray((me as any)?.user?.memberships)
          ? (me as any).user.memberships
          : [];
      setCanCreateClub(memberships.length === 0);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Unable to load assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onAccept = async (invitationId: string) => {
    try {
      setAcceptingId(invitationId);
      const res = await acceptMyAssignment(invitationId);
      const acceptedClubId = res?.membership?.clubId;
      if (acceptedClubId) {
        localStorage.setItem("activeClubId", acceptedClubId);
      }
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate("/dashboard", { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Failed to accept assignment.");
    } finally {
      setAcceptingId(null);
    }
  };

  const onCreateClub = async () => {
    if (!canCreateClub) return;
    if (!clubName.trim()) {
      setErr("Club name is required.");
      return;
    }
    try {
      setErr(null);
      setCreatingClub(true);
      const club = await createClub({
        name: clubName.trim(),
        slug: clubSlug.trim() || undefined,
      });
      if (club?.id) {
        localStorage.setItem("activeClubId", club.id);
      }
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      if (club?.id) {
        setClubName("");
        setClubSlug("");
      }
      navigate("/admin", { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Failed to create club.");
    } finally {
      setCreatingClub(false);
    }
  };

  if (loading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: cardBorder, background: "rgba(255,255,255,.60)" }}
        >
          Loading assignments...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <div className="space-y-4">
        <Hero
          title="Account Onboarding"
          subtitle="Accept your club assignment to unlock the full dashboard workspace."
          right={<DotTag>MEMBER</DotTag>}
        />

        {err && (
          <div
            className="rounded-2xl border p-4 text-sm font-semibold text-rose-700"
            style={{ borderColor: cardBorder, background: "rgba(255,255,255,.65)", boxShadow: glassShadow }}
          >
            {err}
          </div>
        )}

        {!pending.length ? (
          <Section title="Assignments" subtitle="Pending invitations from clubs.">
            <div
              className="rounded-2xl border p-4 text-sm text-[rgb(var(--muted))]"
              style={{ borderColor: cardBorder, background: cardBg, boxShadow: glassShadow }}
            >
              No club assignment yet. Please wait for an admin to assign your role.
            </div>
          </Section>
        ) : (
          <Section title="Assignments" subtitle="Accept one invitation to activate your workspace.">
            <div className="grid gap-3">
              {pending.map((p) => (
                <div
                  key={p.invitationId}
                  className="rounded-2xl border p-4 backdrop-blur-xl"
                  style={{ borderColor: cardBorder, background: cardBg, boxShadow: glassShadow }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-[rgb(var(--text))]">{p.club?.name || p.clubId}</div>
                      <div className="text-xs text-[rgb(var(--muted))]">
                        Role: {p.primary}
                        {p.subRoles?.length ? ` | Sub roles: ${p.subRoles.join(", ")}` : ""}
                      </div>
                      <div className="text-xs text-[rgb(var(--muted))]">
                        Expires: {new Date(p.expiresAt).toLocaleString()}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onAccept(p.invitationId)}
                      disabled={acceptingId === p.invitationId}
                      className="rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60"
                      style={{
                        background: "rgb(var(--primary))",
                        color: "rgb(var(--primary-2))",
                        border: `1px solid rgba(var(--primary-2), .20)`,
                      }}
                    >
                      {acceptingId === p.invitationId ? "Accepting..." : "Accept Assignment"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {canCreateClub ? (
          <Section title="Create Your Club" subtitle="No memberships found, create your first club workspace.">
            <div
              className="rounded-2xl border p-4 backdrop-blur-xl"
              style={{ borderColor: cardBorder, background: cardBg, boxShadow: glassShadow }}
            >
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  value={clubName}
                  onChange={(event) => setClubName(event.target.value)}
                  placeholder="Club name"
                  className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none"
                  style={{ borderColor: cardBorder }}
                />
                <input
                  value={clubSlug}
                  onChange={(event) => setClubSlug(event.target.value)}
                  placeholder="Slug (optional)"
                  className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none"
                  style={{ borderColor: cardBorder }}
                />
                <button
                  type="button"
                  onClick={onCreateClub}
                  disabled={creatingClub || !clubName.trim()}
                  className="rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60"
                  style={{
                    background: "rgb(var(--primary))",
                    color: "rgb(var(--primary-2))",
                    border: `1px solid rgba(var(--primary-2), .20)`,
                  }}
                >
                  {creatingClub ? "Creating..." : "Create Club"}
                </button>
              </div>
            </div>
          </Section>
        ) : null}
      </div>
    </PageWrap>
  );
}

