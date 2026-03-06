// src/layouts/AdminShell.tsx
import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

import AdminSidebar, { type AdminSidebarUser } from "../components/ui/admin/AdminSidebar";
import { ThemePanel } from "../theme/ThemePanel";

import {
  getMe,
  getMyClubs,
  getClubPlayers,
  getClubSquads,
  getClubMatches,
  type MeMembership,
  type PrimaryRole,
  type SubRole,
} from "../api/admin.api";
import {
  hasRolePermission,
  listRolePermissions,
  type RolePermission,
} from "../utils/rolePolicy";

type NavKey = "overview" | "members" | "squads" | "matches" | "operations" | "analytics" | "settings";
type ClubItem = { id: string; name: string; slug: string };
type ScopedMembership = {
  clubId: string;
  primary: PrimaryRole;
  subRoles: SubRole[];
};

const adminTopNav: { key: NavKey; label: string; to: string; permission: RolePermission }[] = [
  { key: "overview", label: "Overview", to: "/admin", permission: "clubs.read" },
  { key: "members", label: "Members", to: "/admin/members", permission: "members.read" },
  { key: "squads", label: "Squads", to: "/admin/squads", permission: "squads.read" },
  { key: "matches", label: "Matches", to: "/admin/matches", permission: "matches.read" },
  { key: "operations", label: "Operations", to: "/admin/operations", permission: "operations.read" },
  { key: "analytics", label: "Analytics", to: "/admin/analytics", permission: "stats.read" },
  { key: "settings", label: "Settings", to: "/admin/settings", permission: "membership.self.read" },
];

function cx(...s: Array<string | false | undefined>) {
  return s.filter(Boolean).join(" ");
}

const GLASS_BORDER = "rgba(255,255,255,0.38)";
const GLASS_BORDER_STRONG = "rgba(255,255,255,0.52)";
const GLASS_SHADOW = "0 28px 80px rgba(20,24,32,0.10)";
const GLASS_BG = "rgba(255,255,255,0.52)";

function GlassBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 520px at 15% 15%, rgba(255,255,255,.70), transparent 55%), radial-gradient(900px 520px at 85% 20%, rgba(var(--primary),.22), transparent 60%), radial-gradient(900px 520px at 92% 85%, rgba(var(--primary),.14), transparent 60%), linear-gradient(180deg, rgba(255,255,255,.25), rgba(255,255,255,0))",
        }}
      />
    </div>
  );
}

const FALLBACK_ADMIN_USER: AdminSidebarUser = {
  fullName: "Admin",
  userId: "—",
  role: "MEMBER",
  subRoles: [],
  clubName: "—",
  clubId: "",
};

function getStoredToken() {
  return localStorage.getItem("accessToken") || localStorage.getItem("token");
}

function isAuthError(error: unknown) {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 401 || status === 403;
}

function hardLogout(navigate: ReturnType<typeof useNavigate>) {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("token"); // legacy
  localStorage.removeItem("user");
  localStorage.removeItem("activeClubId");
  navigate("/login", { replace: true });
}

function normalizeMemberships(me: any): ScopedMembership[] {
  if (Array.isArray(me?.memberships)) {
    return me.memberships
      .filter((row: MeMembership) => !!row?.clubId)
      .map((row: MeMembership) => ({
        clubId: row.clubId,
        primary: row.primary,
        subRoles: Array.isArray(row.subRoles) ? row.subRoles : [],
      }));
  }

  const legacy = Array.isArray(me?.user?.memberships) ? me.user.memberships : [];
  return legacy
    .map((row: any) => ({
      clubId: row?.club?.id,
      primary: row?.primary as PrimaryRole,
      subRoles: (Array.isArray(row?.subRoles) ? row.subRoles : []) as SubRole[],
    }))
    .filter((row: ScopedMembership) => !!row.clubId);
}

export default function AdminShell() {
  const navigate = useNavigate();
  const loc = useLocation();

  const [themeOpen, setThemeOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [user, setUser] = useState<AdminSidebarUser>(FALLBACK_ADMIN_USER);
  const [loading, setLoading] = useState(true);

  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [clubId, setClubId] = useState<string>("");
  const [memberships, setMemberships] = useState<ScopedMembership[]>([]);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  const [clubStats, setClubStats] = useState({
    players: 0,
    squads: 0,
    matches: 0,
  });

  const activeNavKey: NavKey = useMemo(() => {
    const p = loc.pathname;
    if (p.startsWith("/admin/members")) return "members";
    if (p.startsWith("/admin/squads")) return "squads";
    if (p.startsWith("/admin/matches")) return "matches";
    if (p.startsWith("/admin/operations")) return "operations";
    if (p.startsWith("/admin/analytics")) return "analytics";
    if (p.startsWith("/admin/settings")) return "settings";
    return "overview";
  }, [loc.pathname]);

  const resolvedMembership = useMemo(() => {
    if (!memberships.length) return null;
    return memberships.find((row) => row.clubId === clubId) || memberships[0] || null;
  }, [memberships, clubId]);

  const permissions = useMemo<RolePermission[]>(() => {
    const primary = resolvedMembership?.primary || user.role || "MEMBER";
    const subRoles = resolvedMembership?.subRoles || user.subRoles || [];
    return listRolePermissions(primary, subRoles);
  }, [resolvedMembership?.primary, resolvedMembership?.subRoles, user.role, user.subRoles]);

  const adminNav = useMemo(() => {
    return adminTopNav.filter((item) => permissions.includes(item.permission));
  }, [permissions]);

  useEffect(() => {
    if (adminNav.some((item) => item.key === activeNavKey)) return;
    const fallback = adminNav[0]?.to;
    if (fallback) {
      navigate(fallback, { replace: true });
      return;
    }
    navigate("/dashboard", { replace: true });
  }, [activeNavKey, adminNav, navigate]);

  // ✅ Boot: ensure token exists, load me + clubs, set activeClubId
  useEffect(() => {
    let alive = true;

    async function boot() {
      try {
        setLoading(true);

        const token = getStoredToken();
        if (!token) {
          hardLogout(navigate);
          return;
        }

        const me = await getMe();
        const scopedMemberships = normalizeMemberships(me);
        setIsPlatformAdmin(!!me?.isPlatformAdmin);

        const myClubs = (await getMyClubs()) || [];
        const storedClubId = localStorage.getItem("activeClubId") || "";
        const firstClub =
          storedClubId ||
          me?.activeClubId ||
          myClubs?.[0]?.id ||
          scopedMemberships?.[0]?.clubId ||
          "";

        // sync active club
        if (firstClub) localStorage.setItem("activeClubId", firstClub);

        if (!alive) return;

        setClubs(myClubs);
        setClubId(firstClub);
        setMemberships(scopedMemberships);

        const activeMembership =
          scopedMemberships.find((row) => row.clubId === firstClub) ||
          scopedMemberships[0] ||
          null;
        const role = activeMembership?.primary || "MEMBER";
        const subRoles = activeMembership?.subRoles || [];

        const clubName =
          myClubs.find((c) => c.id === firstClub)?.name ||
          me?.user?.memberships?.[0]?.club?.name ||
          "—";

        setUser({
          fullName: me?.user?.fullName || me?.user?.email || "Admin",
          userId: me?.user?.id || "—",
          role,
          subRoles,
          clubName,
          clubId: firstClub,
        });

        localStorage.setItem("user", JSON.stringify(me?.user ?? {}));
      } catch (error) {
        if (!alive) return;
        if (isAuthError(error)) {
          hardLogout(navigate);
          return;
        }
        console.error("Admin boot failed (non-auth):", error);
      } finally {
        if (alive) setLoading(false);
      }
    }

    boot();
    return () => {
      alive = false;
    };
  }, [navigate]);

  // ✅ Keep localStorage activeClubId in sync when switching clubs
  useEffect(() => {
    if (clubId) localStorage.setItem("activeClubId", clubId);
  }, [clubId]);

  useEffect(() => {
    if (!clubId) return;
    const scoped = memberships.find((row) => row.clubId === clubId);
    if (!scoped) return;
    setUser((prev) => ({
      ...prev,
      role: scoped.primary,
      subRoles: scoped.subRoles || [],
    }));
  }, [clubId, memberships]);

  // ✅ Load club stats when clubId changes
  useEffect(() => {
    let alive = true;

    async function loadStats() {
      if (!clubId) return;

      try {
        const [p, s, m] = await Promise.all([
          getClubPlayers(clubId),
          getClubSquads(clubId),
          getClubMatches(clubId),
        ]);

        if (!alive) return;

        setClubStats({
          players: Array.isArray(p) ? p.length : 0,
          squads: Array.isArray(s) ? s.length : 0,
          matches: Array.isArray(m) ? m.length : 0,
        });

        const clubName = clubs.find((c) => c.id === clubId)?.name || user.clubName;
        const scoped = memberships.find((row) => row.clubId === clubId);
        setUser((prev) => ({
          ...prev,
          role: scoped?.primary || prev.role,
          subRoles: scoped?.subRoles || prev.subRoles || [],
          clubId,
          clubName,
        }));
      } catch {
        // keep silent (no logout on stats failure)
      }
    }

    loadStats();
    return () => {
      alive = false;
    };
  }, [clubId, clubs, memberships, user.clubName]);

  const HEADER_H = 84;

  const onClubCreated = (club: ClubItem) => {
    // Provisioning may target another owner; refresh memberships and switch only when allowed.
    void (async () => {
      try {
        const [me, myClubs] = await Promise.all([getMe(), getMyClubs()]);
        const scopedMemberships = normalizeMemberships(me);
        setClubs(myClubs || []);
        setMemberships(scopedMemberships);

        const hasMembership = scopedMemberships.some((row) => row.clubId === club.id);
        if (hasMembership) {
          setClubId(club.id);
          localStorage.setItem("activeClubId", club.id);
        }
      } catch {
        // ignore create-club follow-up refresh failures
      }
    })();
  };

  return (
    <div className="dashboard-readable min-h-screen w-full bg-[rgb(var(--bg))]">
      <ThemePanel open={themeOpen} onClose={() => setThemeOpen(false)} />

      <div className="relative">
        <GlassBackdrop />

        <div className="mx-auto max-w-[1440px] px-3 py-5 sm:px-6 sm:py-8">
          <div
            className={cx(
              "relative overflow-hidden rounded-[28px]",
              "backdrop-blur-2xl",
              "shadow-[0_28px_80px_rgba(20,24,32,0.10)]"
            )}
            style={{
              background: GLASS_BG,
              border: `1px solid ${GLASS_BORDER}`,
              boxShadow: GLASS_SHADOW,
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.70), rgba(255,255,255,0.18) 55%, rgba(255,255,255,0.30))",
                opacity: 0.55,
              }}
            />

            <div className="relative z-10 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)]">
              {/* HEADER */}
              <header
                className="sticky top-0 z-20 backdrop-blur-2xl"
                style={{
                  height: HEADER_H,
                  background: "rgba(255,255,255,0.40)",
                  borderBottom: `1px solid ${GLASS_BORDER}`,
                }}
              >
                <div className="h-full px-4 sm:px-6">
                  <div className="flex h-full items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/70"
                        style={{
                          background: "rgba(255,255,255,0.55)",
                          border: `1px solid ${GLASS_BORDER}`,
                        }}
                      >
                        Menu
                      </button>

                      <div
                        className="rounded-full px-4 py-2 text-sm font-semibold"
                        style={{
                          background: "rgba(255,255,255,0.50)",
                          border: `1px solid ${GLASS_BORDER}`,
                        }}
                      >
                        EsportM • Admin
                      </div>

                      {/* top pills */}
                      <nav
                        className="hidden items-center gap-1 rounded-full p-1 sm:flex"
                        style={{
                          background: "rgba(255,255,255,0.44)",
                          border: `1px solid ${GLASS_BORDER}`,
                        }}
                      >
                        {adminNav.map((item) => {
                          const on = item.key === activeNavKey;
                          return (
                            <button
                              key={item.key}
                              onClick={() => navigate(item.to)}
                              className="rounded-full px-3 py-2 text-xs font-semibold transition"
                              style={{
                                background: on ? "rgba(var(--primary), .70)" : "transparent",
                                color: on ? "rgb(var(--primary-2))" : "rgb(var(--text))",
                                border: on
                                  ? `1px solid ${GLASS_BORDER_STRONG}`
                                  : "1px solid transparent",
                              }}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </nav>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="hidden sm:block text-right">
                        <p className="text-sm font-semibold text-[rgb(var(--text))]">
                          {loading ? "Loading…" : `${user.clubName} • ${user.role}`}
                        </p>
                        <p className="text-xs text-[rgb(var(--muted))]">
                          Players {clubStats.players} • Squads {clubStats.squads} • Matches{" "}
                          {clubStats.matches}
                        </p>
                      </div>

                      {/* Club switch */}
                      <select
                        value={clubId}
                        onChange={(e) => setClubId(e.target.value)}
                        className="hidden sm:block rounded-full border bg-white/70 px-4 py-2 text-xs font-semibold outline-none"
                        style={{ borderColor: GLASS_BORDER }}
                        title="Select club"
                      >
                        {clubs.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>

                      {isPlatformAdmin && (
                        <button
                          onClick={() => navigate("/platform")}
                          className="rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/70"
                          style={{
                            background: "rgba(255,255,255,0.50)",
                            color: "rgb(var(--text))",
                            border: `1px solid ${GLASS_BORDER}`,
                          }}
                        >
                          Platform
                        </button>
                      )}

                      <button
                        onClick={() => setThemeOpen(true)}
                        className="rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/70"
                        style={{
                          background: "rgba(255,255,255,0.50)",
                          color: "rgb(var(--text))",
                          border: `1px solid ${GLASS_BORDER}`,
                        }}
                      >
                        Theme
                      </button>
                    </div>
                  </div>
                </div>
              </header>

              {/* BODY */}
              <div className="flex h-[calc(100%-84px)] gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-6">
                {/* Desktop sidebar */}
                <div className="hidden md:block shrink-0" style={{ width: 240 }}>
                  <div className="sticky top-[96px]">
                    <AdminSidebar
                      open={sidebarOpen}
                      onClose={() => setSidebarOpen(false)}
                      user={user}
                      navItems={adminNav}
                      canManageClubData={hasRolePermission(user.role, user.subRoles || [], "clubs.read")}
                      clubId={clubId}
                      clubs={clubs}
                      onChangeClub={setClubId}
                      stats={clubStats}
                    />
                  </div>
                </div>

                {/* Mobile drawer */}
                <div className="md:hidden">
                  <AdminSidebar
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    user={user}
                    navItems={adminNav}
                    canManageClubData={hasRolePermission(user.role, user.subRoles || [], "clubs.read")}
                    clubId={clubId}
                    clubs={clubs}
                    onChangeClub={setClubId}
                    stats={clubStats}
                  />
                </div>

                <main className="min-w-0 flex-1 overflow-y-auto pr-1">
                  <Outlet
                    context={{
                      clubId,
                      user,
                      clubs,
                      role: user.role,
                      subRoles: user.subRoles || [],
                      permissions,
                      canManageClubData: hasRolePermission(user.role, user.subRoles || [], "clubs.read"),
                      isPlatformAdmin,
                      onClubCreated,
                    }}
                  />
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

