// src/components/ui/Sidebar.tsx
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import gsap from "gsap";
import {
  BellRing,
  CalendarClock,
  Home,
  LogOut,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { clearAuth } from "../../utils/authStorage";
import { useDashboardRecent } from "../../hooks/useDashboard";
import ConfirmModal from "./ConfirmModal";

export type SidebarItem = {
  label: string;
  to: string;
  icon?: React.ReactNode;
};

export type SidebarUser = {
  fullName: string;
  userId: string;
  clubName: string;
  role?: string;
  position?: string;
  avatarUrl?: string;
  isCaptain?: boolean;
};

type MatchItem = {
  id: string;
  title?: string | null;
  opponent?: string | null;
  kickoffAt?: string | null;
  venue?: string | null;
};

function cx(...s: Array<string | false | undefined>) {
  return s.filter(Boolean).join(" ");
}

function initials(name: string) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "P";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

export default function Sidebar({
  open,
  onClose,
  items,
  user,
}: {
  open: boolean;
  onClose: () => void;
  items: SidebarItem[];
  user: SidebarUser;
}) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const mobileRef = useRef<HTMLDivElement | null>(null);
  const loc = useLocation();
  const navigate = useNavigate();

  const [copied, setCopied] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const hasActiveClub = Boolean(localStorage.getItem("activeClubId"));
  const recentQuery = useDashboardRecent(20, undefined, hasActiveClub);

  // Close drawer when route changes (mobile UX)
  useLayoutEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname]);

  // Mobile open/close animation
  useLayoutEffect(() => {
    if (!overlayRef.current || !mobileRef.current) return;

    if (open) {
      gsap.set(overlayRef.current, { pointerEvents: "auto" });
      gsap.set(mobileRef.current, { pointerEvents: "auto" });

      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.18, ease: "power2.out" }
      );

      gsap.fromTo(
        mobileRef.current,
        { x: -18, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.25, ease: "power3.out" }
      );
    } else {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.14,
        ease: "power2.in",
        onComplete: () => {
          if (!overlayRef.current) return;
          gsap.set(overlayRef.current, { pointerEvents: "none" });
        },
      });

      gsap.to(mobileRef.current, {
        x: -18,
        opacity: 0,
        duration: 0.14,
        ease: "power2.in",
        onComplete: () => {
          if (!mobileRef.current) return;
          gsap.set(mobileRef.current, { pointerEvents: "none" });
        },
      });
    }
  }, [open]);

  const handleLogout = () => {
    setLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    setLogoutConfirmOpen(false);
    clearAuth();
    navigate("/login", { replace: true });
  };

  const badge = useMemo(() => {
    const left = user.role ? user.role : "Player";
    const right = user.position ? `| ${user.position}` : "";
    return `${left} ${right}`.trim();
  }, [user.role, user.position]);

  const nextMatch = useMemo(() => {
    const data = (recentQuery.data || {}) as { matches?: MatchItem[] };
    const matches = data.matches ?? [];
    const now = Date.now();

    return (
      matches
        .filter((m) => {
          if (!m.kickoffAt) return false;
          const t = new Date(m.kickoffAt).getTime();
          return Number.isFinite(t) && t >= now;
        })
        .sort((a, b) => {
          const ta = new Date(a.kickoffAt || "").getTime();
          const tb = new Date(b.kickoffAt || "").getTime();
          return ta - tb;
        })[0] || null
    );
  }, [recentQuery.data]);

  const cardBorder = "rgba(var(--border), .92)";
  const logoutBorder = "rgba(220, 38, 38, .42)";

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(String(user.userId || ""));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback (older browsers)
      try {
        const el = document.createElement("textarea");
        el.value = String(user.userId || "");
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      } catch {
        // ignore
      }
    }
  };

  const NavRow = ({ it }: { it: SidebarItem }) => (
    <NavLink
      key={it.to}
      to={it.to}
      className={({ isActive }) =>
        cx(
          "group relative flex items-center justify-between overflow-hidden rounded-xl border px-3 py-3 text-sm",
          "backdrop-blur-md transition-all duration-200",
          "hover:bg-white/70 hover:-translate-y-[1px]",
          isActive ? "font-semibold" : "font-medium"
        )
      }
      style={({ isActive }) => ({
        borderColor: isActive ? "rgba(var(--primary), .92)" : cardBorder,
        background: isActive ? "rgb(var(--primary))" : "rgba(255,255,255,0.55)",
        boxShadow: isActive ? "0 14px 30px rgba(var(--primary), .34)" : undefined,
      })}
    >
      {({ isActive }) => (
        <>
          <span
            className={cx(
              "absolute left-2 top-1/2 -translate-y-1/2 rounded-full transition-all",
              isActive ? "h-7 w-1" : "h-0 w-1"
            )}
            style={{
              background: isActive ? "rgb(var(--primary-2))" : "rgb(var(--primary))",
            }}
          />

          <div className="relative flex items-center gap-3">
            <span
              className="grid h-9 w-9 place-items-center rounded-lg border bg-white/60 transition"
              style={{
                borderColor: isActive ? "rgba(var(--primary-2), .35)" : cardBorder,
                background: isActive ? "rgba(255,255,255,.88)" : "rgba(255,255,255,.64)",
                color: isActive ? "rgb(var(--primary-2))" : "rgb(var(--text))",
                boxShadow: isActive ? "0 10px 26px rgba(20,24,32,0.22)" : undefined,
              }}
            >
              {it.icon ?? (
                <Target size={14} />
              )}
            </span>

            <span
              className="relative"
              style={{
                color: isActive ? "rgb(var(--primary-2))" : "rgb(var(--text))",
              }}
            >
              {it.label}
            </span>
          </div>

          <span
            className="relative text-xs transition group-hover:translate-x-[1px]"
            style={{
              color: isActive ? "rgba(var(--primary-2), .86)" : "rgb(var(--muted))",
            }}
          >
            {"->"}
          </span>

          {isActive ? (
            <Sparkles
              size={12}
              className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 opacity-85"
              color="rgb(var(--primary-2))"
            />
          ) : null}
        </>
      )}
    </NavLink>
  );

  const ProfileBlock = () => (
    <div className="mb-4">
      <p className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted))]">
        <BellRing size={12} />
        EsportM
      </p>

      <div className="mt-2 flex items-center gap-3">
        <div
          className="grid h-10 w-10 place-items-center rounded-full border bg-white/60 text-xs font-extrabold"
          style={{ borderColor: cardBorder }}
          title={user.fullName}
        >
          {initials(user.fullName)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold leading-tight">
            {user.fullName}
          </p>

          {/* ID line with hover tooltip + copy button */}
          <div className="group/id mt-0.5 flex min-w-0 items-center gap-2">
            <p
              className="min-w-0 truncate text-[11px] text-[rgb(var(--muted))]"
              title={`${user.userId} | ${user.clubName}`}
            >
              <span className="font-semibold text-[rgb(var(--text))]">
                {user.userId}
              </span>{" "}
              | {user.clubName}
            </p>

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={copyId}
                className={cx(
                  "opacity-0 group-hover/id:opacity-100 transition",
                  "rounded-full border bg-white/70 px-2 py-1 text-[10px] font-semibold",
                  "hover:bg-white/85"
                )}
                style={{ borderColor: cardBorder }}
                aria-label="Copy user id"
              >
                {copied ? "Copied" : "Copy"}
              </button>

              {/* small tooltip on hover (optional) */}
              <div
                className={cx(
                  "pointer-events-none absolute right-0 top-full mt-2 w-max max-w-[260px]",
                  "opacity-0 group-hover/id:opacity-100 transition"
                )}
              >
                <div
                  className="rounded-xl border bg-white/90 px-3 py-2 text-[11px] shadow-lg backdrop-blur-md"
                  style={{ borderColor: cardBorder }}
                >
                  <div className="font-semibold text-[rgb(var(--text))]">
                    Full ID
                  </div>
                  <div className="mt-0.5 break-all text-[rgb(var(--muted))]">
                    {user.userId}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span
          className="rounded-full border bg-white/55 px-2.5 py-1 text-[10px] font-semibold"
          style={{ borderColor: cardBorder }}
        >
          {badge}
        </span>
        <span
          className="rounded-full border bg-white/55 px-2.5 py-1 text-[10px] font-semibold"
          style={{ borderColor: cardBorder }}
        >
          Season: 24/25
        </span>
        {user.isCaptain ? (
          <span
            className="rounded-full border bg-[rgba(var(--primary),.30)] px-2.5 py-1 text-[10px] font-extrabold text-[rgb(var(--text))]"
            style={{ borderColor: "rgba(var(--primary), .55)" }}
          >
            Captain
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div
          className="flex items-center justify-center gap-1 rounded-lg border bg-white/55 px-2 py-1 text-[10px] font-semibold"
          style={{ borderColor: cardBorder }}
        >
          <Sparkles size={11} />
          Live
        </div>
        <div
          className="flex items-center justify-center gap-1 rounded-lg border bg-white/55 px-2 py-1 text-[10px] font-semibold"
          style={{ borderColor: cardBorder }}
        >
          <Target size={11} />
          Focus
        </div>
        <div
          className="flex items-center justify-center gap-1 rounded-lg border bg-white/55 px-2 py-1 text-[10px] font-semibold"
          style={{ borderColor: cardBorder }}
        >
          <Trophy size={11} />
          Squad
        </div>
      </div>
    </div>
  );

  const NextMatchBlock = () => (
    <div className="mb-4">
      <p className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted))]">
        <CalendarClock size={12} />
        Next Match
      </p>
      <div className="mt-2 h-2 w-full rounded-full bg-black/5">
        <div
          className="h-2 rounded-full"
          style={{ width: "62%", background: "rgb(var(--primary))" }}
        />
      </div>
      <p className="mt-2 text-xs">
        {!hasActiveClub
          ? "No club assignment yet"
          : recentQuery.isLoading
          ? "Loading..."
          : recentQuery.isError
            ? "Unable to load"
            : nextMatch
              ? `${nextMatch.title || `vs ${nextMatch.opponent || "Opponent"}`} | ${
                  nextMatch.kickoffAt
                    ? new Date(nextMatch.kickoffAt).toLocaleString([], {
                        weekday: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "TBD"
                }${nextMatch.venue ? ` | ${nextMatch.venue}` : ""}`
              : "No upcoming match"}
      </p>
    </div>
  );

  const BottomActions = () => (
    <div className="mt-auto grid gap-2">
      <button
        onClick={() => navigate("/")}
        className="flex w-full items-center justify-center gap-2 rounded-xl border bg-white/55 px-3 py-2 text-sm font-semibold backdrop-blur-md transition hover:bg-white/70"
        style={{ borderColor: cardBorder }}
        aria-label="Go home"
      >
        <Home size={14} />
        Home
      </button>

      <button
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold text-white transition hover:opacity-95"
        style={{
          background: "linear-gradient(135deg, rgba(239,68,68,.96), rgba(185,28,28,.93))",
          borderColor: logoutBorder,
          boxShadow: "0 14px 30px rgba(239,68,68,.30)",
        }}
        aria-label="Logout"
      >
        <LogOut size={14} />
        Logout
      </button>
    </div>
  );

  return (
    <>
      {/* ===================== DESKTOP (inside canvas) ===================== */}
      <aside
        className={cx(
          "relative hidden overflow-hidden md:flex flex-col shrink-0",
          "w-[220px] min-w-[220px] max-w-[220px]",
          "max-h-[calc(100vh-11.5rem)]",
          "rounded-2xl border bg-white/55 p-4",
          "backdrop-blur-xl",
          // Stronger shadow under sidebar
          "shadow-[0_18px_55px_rgba(20,24,32,0.14)]"
        )}
        style={{ borderColor: cardBorder }}
        aria-label="Sidebar"
      >
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-[rgba(var(--primary),.22)] blur-2xl" />
          <div className="absolute -left-10 bottom-8 h-24 w-24 rounded-full bg-[rgba(var(--primary),.14)] blur-2xl" />
        </div>

        <ProfileBlock />
        <NextMatchBlock />

        <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
          <nav className="flex flex-col gap-2 pb-2">
            {items.map((it) => (
              <NavRow key={it.to} it={it} />
            ))}
          </nav>
        </div>

        <BottomActions />
      </aside>

      {/* ===================== MOBILE overlay for drawer ===================== */}
      <div
        ref={overlayRef}
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-black/20 opacity-0 pointer-events-none md:hidden"
      />

      {/* ===================== MOBILE drawer (GSAP) ===================== */}
      <aside
        ref={mobileRef}
        className={cx(
          "fixed left-0 top-0 z-[90] h-full w-[280px] overflow-hidden border-r bg-white/92 p-4 backdrop-blur-xl md:hidden",
          open ? "block" : "hidden"
        )}
        style={{ borderColor: cardBorder }}
      >
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-12 -top-14 h-32 w-32 rounded-full bg-[rgba(var(--primary),.20)] blur-2xl" />
          <div className="absolute -left-12 bottom-14 h-28 w-28 rounded-full bg-[rgba(var(--primary),.16)] blur-2xl" />
        </div>

        <div className="flex h-full flex-col">
          <div className="mb-4 flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">{user.fullName}</p>

              {/* Mobile: show full id with copy button always */}
              <div className="mt-1 flex items-center gap-2">
                <p
                  className="min-w-0 truncate text-xs text-[rgb(var(--muted))]"
                  title={`${user.userId} | ${user.clubName}`}
                >
                  <span className="font-semibold text-[rgb(var(--text))]">
                    {user.userId}
                  </span>{" "}
                  | {user.clubName}
                </p>

                <button
                  type="button"
                  onClick={copyId}
                  className="shrink-0 rounded-full border bg-white/70 px-2 py-1 text-[10px] font-semibold hover:bg-white/85"
                  style={{ borderColor: cardBorder }}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full border bg-white/60 px-3 py-2 text-xs font-semibold"
              style={{ borderColor: cardBorder }}
            >
              Close
            </button>
          </div>

          <NextMatchBlock />

          <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
            <nav className="flex flex-col gap-2 pb-2">
              {items.map((it) => (
                <NavRow key={it.to} it={it} />
              ))}
            </nav>
          </div>

          <BottomActions />
        </div>
      </aside>

      <ConfirmModal
        open={logoutConfirmOpen}
        title="Log out?"
        message="You will need to sign in again to continue."
        confirmText="Logout"
        cancelText="Cancel"
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={confirmLogout}
      />
    </>
  );
}
