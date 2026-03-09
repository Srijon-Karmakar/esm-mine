import { useMemo } from "react";
import { useMe } from "../../../hooks/useMe";
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
  formatDateTime,
} from "../../admin/admin-ui";

type Membership = {
  clubId: string;
  primary: string;
  subRoles: string[];
  club?: {
    id: string;
    name: string;
    slug: string;
  };
};

type MeData = {
  user?: {
    id?: string;
    email?: string;
    fullName?: string | null;
    createdAt?: string;
  };
  memberships?: Membership[];
  activeClubId?: string | null;
  activeMembership?: Membership | null;
};

export default function SettingsPage() {
  const meQuery = useMe();
  const data = (meQuery.data || {}) as MeData;

  const memberships = useMemo(() => data.memberships || [], [data.memberships]);
  const localActiveClubId = localStorage.getItem("activeClubId");
  const activeClubId = data.activeClubId || localActiveClubId || "-";

  const currentMembership = useMemo(() => {
    return memberships.find((membership) => membership.clubId === (data.activeClubId || localActiveClubId || ""));
  }, [memberships, data.activeClubId, localActiveClubId]);

  const roleMismatch = Boolean(
    data.activeClubId &&
      localActiveClubId &&
      data.activeClubId !== localActiveClubId
  );

  const activeClubStatValue =
    activeClubId && activeClubId !== "-" ? (
      <span className="inline-block max-w-full break-all font-mono text-xs leading-5">
        {activeClubId}
      </span>
    ) : (
      "-"
    );

  if (meQuery.isLoading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading settings...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Account Settings"
        subtitle="Profile, active club context, and membership access map."
        right={<DotTag>SETTINGS</DotTag>}
      />

      {meQuery.isError && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          Unable to load account settings.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Memberships" value={memberships.length} />
        <Stat label="Active Club ID" value={activeClubStatValue} />
        <Stat label="Primary Role" value={currentMembership?.primary || data.activeMembership?.primary || "-"} />
        <Stat label="Sub Roles" value={(currentMembership?.subRoles || data.activeMembership?.subRoles || []).length} />
        <Stat label="Context Sync" value={roleMismatch ? "Mismatch" : "Synced"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section title="Profile Identity" subtitle="Signed-in account identity." className="xl:col-span-5">
          <Line label="Full Name" value={data.user?.fullName || "-"} />
          <Line label="Email" value={data.user?.email || "-"} />
          <Line label="User ID" value={data.user?.id || "-"} mono />
          <Line label="Created" value={formatDateTime(data.user?.createdAt)} />
        </Section>

        <Section title="Role Context" subtitle="Active role resolution in selected club." className="xl:col-span-7" dark>
          <LineDark label="Server activeClubId" value={data.activeClubId || "-"} />
          <LineDark label="Local activeClubId" value={localActiveClubId || "-"} />
          <LineDark
            label="Current primary"
            value={currentMembership?.primary || data.activeMembership?.primary || "-"}
          />
          <LineDark
            label="Current sub roles"
            value={(currentMembership?.subRoles || data.activeMembership?.subRoles || []).join(", ") || "-"}
          />
          {roleMismatch && (
            <p className="mt-2 text-xs font-semibold text-[rgba(var(--primary),.92)]">
              Active club mismatch detected. Refresh dashboard after selecting intended club.
            </p>
          )}
        </Section>
      </div>

      <Section title="Membership Directory" subtitle="All clubs and access roles linked to this account.">
        {!memberships.length ? (
          <p className="text-sm text-[rgb(var(--muted))]">No memberships found.</p>
        ) : (
          <div className="space-y-3">
            {memberships.map((membership) => (
              <article
                key={`${membership.clubId}-${membership.primary}`}
                className="rounded-2xl border bg-white/72 px-3 py-3"
                style={{ borderColor: adminCardBorder }}
              >
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[rgb(var(--text))]">
                    {membership.club?.name || membership.clubId}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <DotTag>{membership.primary}</DotTag>
                    <DotTag tone={membership.subRoles.length ? "warn" : "default"}>
                      {membership.subRoles.length ? membership.subRoles.join(", ") : "No sub roles"}
                    </DotTag>
                  </div>
                </div>
                <p className="text-xs text-[rgb(var(--muted))] [overflow-wrap:anywhere]">
                  Club ID: {membership.clubId} | Slug: {membership.club?.slug || "-"}
                </p>
              </article>
            ))}
          </div>
        )}
      </Section>
    </PageWrap>
  );
}

function Line({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="mb-2 rounded-2xl border bg-white/72 px-3 py-3" style={{ borderColor: adminCardBorder }}>
      <p className="text-xs text-[rgb(var(--muted))]">{label}</p>
      <p
        className={
          mono
            ? "font-mono text-xs text-[rgb(var(--text))] break-all leading-5"
            : "text-sm font-semibold text-[rgb(var(--text))] [overflow-wrap:anywhere]"
        }
      >
        {value}
      </p>
    </div>
  );
}

function LineDark({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
      <p className="text-xs text-white/60">{label}</p>
      <p className="text-sm font-semibold text-white [overflow-wrap:anywhere]">{value}</p>
    </div>
  );
}

