import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import gsap from "gsap";
import type { SubRole } from "../../../api/admin.api";
import { clearAuth } from "../../../utils/authStorage";
import ConfirmModal from "../ConfirmModal";

export type AdminSidebarUser = {
    fullName: string;
    userId: string;
    role: "ADMIN" | "MANAGER" | "PLAYER" | "MEMBER";
    subRoles?: SubRole[];
    clubName: string;
    clubId?: string;
};

function cx(...s: Array<string | false | undefined>) {
    return s.filter(Boolean).join(" ");
}

function initials(name: string) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "A";
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (a + b).toUpperCase();
}

const cardBorder = "rgba(var(--primary-2), .14)";

const adminNav = [
    { label: "Overview", to: "/admin" },
    { label: "Members", to: "/admin/members" },
    { label: "Squads", to: "/admin/squads" },
    { label: "Matches", to: "/admin/matches" },
    { label: "Operations", to: "/admin/operations" },
    { label: "Analytics", to: "/admin/analytics" },
    { label: "Settings", to: "/admin/settings" },
];

export default function AdminSidebar({
    open,
    onClose,
    user,
    navItems,
    canManageClubData,
    clubs,
    clubId,
    onChangeClub,
    stats,
}: {
    open: boolean;
    onClose: () => void;
    user: AdminSidebarUser;
    navItems?: Array<{ label: string; to: string }>;
    canManageClubData?: boolean;
    clubs: Array<{ id: string; name: string; slug: string }>;
    clubId: string;
    onChangeClub: (id: string) => void;
    stats: { players: number; squads: number; matches: number };
}) {
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const mobileRef = useRef<HTMLDivElement | null>(null);
    const loc = useLocation();
    const navigate = useNavigate();

    const [copied, setCopied] = useState(false);
    const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

    useLayoutEffect(() => {
        if (open) onClose();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loc.pathname]);

    // âœ… FIXED GSAP effect: cleanup returns void (ctx.revert)
    useLayoutEffect(() => {
        if (!overlayRef.current || !mobileRef.current) return;

        const overlayEl = overlayRef.current;
        const drawerEl = mobileRef.current;

        const ctx = gsap.context(() => {
            if (open) {
                gsap.set(overlayEl, { pointerEvents: "auto" });
                gsap.set(drawerEl, { pointerEvents: "auto" });

                gsap.fromTo(
                    overlayEl,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.18, ease: "power2.out" }
                );

                gsap.fromTo(
                    drawerEl,
                    { x: -18, opacity: 0 },
                    { x: 0, opacity: 1, duration: 0.25, ease: "power3.out" }
                );
            } else {
                gsap.to(overlayEl, {
                    opacity: 0,
                    duration: 0.14,
                    ease: "power2.in",
                    onComplete: () => {
                        gsap.set(overlayEl, { pointerEvents: "none" }); // âœ… no return
                    },
                });

                gsap.to(drawerEl, {
                    x: -18,
                    opacity: 0,
                    duration: 0.14,
                    ease: "power2.in",
                    onComplete: () => {
                        gsap.set(drawerEl, { pointerEvents: "none" }); // âœ… no return
                    },
                });
            }
        });

        return () => {
            ctx.revert(); //returns void
        };
    }, [open]);

    const canManage = typeof canManageClubData === "boolean"
        ? canManageClubData
        : user.role === "ADMIN" || user.role === "MANAGER";
    const effectiveNav = navItems?.length ? navItems : adminNav;

    const shortId = useMemo(() => {
        const id = String(user.userId || "");
        if (id.length <= 10) return id;
        return `${id.slice(0, 6)}â€¦${id.slice(-4)}`;
    }, [user.userId]);

    const copyId = async () => {
        try {
            await navigator.clipboard.writeText(String(user.userId || ""));
            setCopied(true);
            window.setTimeout(() => setCopied(false), 900);
        } catch {
            // Ignore clipboard failures.
        }
    };

    const handleLogout = () => {
        setLogoutConfirmOpen(true);
    };

    const confirmLogout = () => {
        setLogoutConfirmOpen(false);
        clearAuth();
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
    };

    const NavRow = ({ label, to }: { label: string; to: string }) => (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cx(
                    "group relative flex items-center justify-between rounded-xl border px-3 py-3 text-sm",
                    "bg-white/55 backdrop-blur-md transition",
                    "hover:bg-white/70",
                    isActive && "font-extrabold"
                )
            }
            style={({ isActive }) => ({
                borderColor: cardBorder,
                background: isActive ? "rgba(var(--primary), .16)" : "rgba(255,255,255,0.55)",
            })}
        >
            {({ isActive }) => (
                <>
                    <span
                        className={cx(
                            "absolute left-0 top-1/2 -translate-y-1/2 rounded-full transition-all",
                            isActive ? "h-8 w-1" : "h-0 w-1"
                        )}
                        style={{ background: "rgb(var(--primary))" }}
                    />
                    <span className="relative">{label}</span>
                    <span className="relative text-xs text-[rgb(var(--muted))] transition group-hover:translate-x-[1px]">
                        â†’
                    </span>
                </>
            )}
        </NavLink>
    );

    const ProfileBlock = () => (
        <div className="mb-4">
            <p className="text-xs text-[rgb(var(--muted))]">Club Admin</p>

            <div className="mt-2 flex items-center gap-3">
                <div
                    className="grid h-10 w-10 place-items-center rounded-full border bg-white/60 text-xs font-extrabold"
                    style={{ borderColor: cardBorder }}
                    title={user.fullName}
                >
                    {initials(user.fullName)}
                </div>

                <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold leading-tight">{user.fullName}</p>

                    <div className="mt-0.5 flex items-center gap-2">
                        <p className="truncate text-[11px] text-[rgb(var(--muted))]" title={user.userId}>
                            {shortId}
                        </p>
                        <button
                            onClick={copyId}
                            className="rounded-full border bg-white/70 px-2 py-0.5 text-[10px] font-semibold hover:bg-white/85"
                            style={{ borderColor: cardBorder }}
                            title="Copy user id"
                        >
                            {copied ? "Copied" : "Copy"}
                        </button>
                    </div>

                    <p className="truncate text-[11px] text-[rgb(var(--muted))]">{user.clubName}</p>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border bg-white/55 px-2.5 py-1 text-[10px] font-semibold" style={{ borderColor: cardBorder }}>
                    Role: <span className="font-extrabold">{user.role}</span>
                </span>

                <span className="rounded-full border bg-white/55 px-2.5 py-1 text-[10px] font-semibold" style={{ borderColor: cardBorder }}>
                    Players: <span className="font-extrabold">{stats.players}</span>
                </span>
                <span className="rounded-full border bg-white/55 px-2.5 py-1 text-[10px] font-semibold" style={{ borderColor: cardBorder }}>
                    Squads: <span className="font-extrabold">{stats.squads}</span>
                </span>
                <span className="rounded-full border bg-white/55 px-2.5 py-1 text-[10px] font-semibold" style={{ borderColor: cardBorder }}>
                    Matches: <span className="font-extrabold">{stats.matches}</span>
                </span>
            </div>

            <div className="mt-3">
                <select
                    value={clubId}
                    onChange={(e) => onChangeClub(e.target.value)}
                    className="w-full rounded-xl border bg-white/70 px-3 py-2 text-sm font-semibold outline-none"
                    style={{ borderColor: cardBorder }}
                    disabled={!canManage}
                    title={!canManage ? "No permission to manage club data" : "Select club"}
                >
                    {clubs.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );

    const BottomActions = () => (
        <div className="mt-auto grid gap-2">
            <button
                onClick={() => navigate("/")}
                className="w-full rounded-xl border bg-white/55 px-3 py-2 text-sm font-semibold backdrop-blur-md transition hover:bg-white/70"
                style={{ borderColor: cardBorder }}
            >
                Home
            </button>

            <button
                onClick={handleLogout}
                className="w-full rounded-xl px-3 py-2 text-sm font-extrabold transition hover:opacity-95"
                style={{ background: "rgb(var(--primary))", color: "rgb(var(--primary-2))" }}
            >
                Logout
            </button>
        </div>
    );

    return (
        <>
            <aside
                className={cx(
                    "hidden md:flex flex-col shrink-0",
                    "w-[240px] min-w-[240px] max-w-[240px]",
                    "rounded-2xl border bg-white/55 p-4",
                    "backdrop-blur-xl",
                    "shadow-[0_18px_55px_rgba(20,24,32,0.14)]"
                )}
                style={{ borderColor: cardBorder }}
            >
                <ProfileBlock />

                <nav className="mb-4 flex flex-col gap-2">
                    {effectiveNav.map((it) => (
                        <NavRow key={it.to} label={it.label} to={it.to} />
                    ))}
                </nav>

                <BottomActions />
            </aside>

            <div
                ref={overlayRef}
                onClick={onClose}
                className="fixed inset-0 z-[80] bg-black/20 opacity-0 pointer-events-none md:hidden"
            />

            <aside
                ref={mobileRef}
                className={cx(
                    "fixed left-0 top-0 z-[90] h-full w-[300px] border-r bg-white/92 p-4 backdrop-blur-xl md:hidden",
                    open ? "block" : "hidden"
                )}
                style={{ borderColor: cardBorder }}
            >
                <div className="flex h-full flex-col">
                    <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-extrabold">Admin Menu</p>
                        <button
                            onClick={onClose}
                            className="rounded-full border bg-white/60 px-3 py-2 text-xs font-semibold"
                            style={{ borderColor: cardBorder }}
                        >
                            Close
                        </button>
                    </div>

                    <ProfileBlock />

                    <nav className="mb-4 flex flex-col gap-2">
                        {effectiveNav.map((it) => (
                            <NavRow key={it.to} label={it.label} to={it.to} />
                        ))}
                    </nav>

                    <BottomActions />
                </div>
            </aside>

            <ConfirmModal
                open={logoutConfirmOpen}
                title="Log out?"
                message="You will need to sign in again to access the admin area."
                confirmText="Logout"
                cancelText="Cancel"
                onCancel={() => setLogoutConfirmOpen(false)}
                onConfirm={confirmLogout}
            />
        </>
    );
}

