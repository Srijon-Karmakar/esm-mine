import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { neo } from "../ui/neo";
import NeoCard from "../ui/NeoCard";
import NeoButton from "../ui/NeoButton";
import { useAuth } from "../auth/AuthContext";

const links = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/team", label: "Team" },
  { to: "/admin/players", label: "Players" },
  { to: "/admin/matches", label: "Matches" },
  { to: "/admin/settings", label: "Settings" },
];

export default function AdminLayout() {
  const { logout, user } = useAuth() as any;
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  const title = useMemo(() => {
    const found = links.find((l) => l.to === loc.pathname);
    return found?.label || "Admin";
  }, [loc.pathname]);

  return (
    <div className={`min-h-screen w-full ${neo.page} ${neo.bgFx}`}>
      {/* Mobile topbar */}
      <div className="sticky top-0 z-30 lg:hidden">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <NeoCard size="sm" className="px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setOpen((p) => !p)}
                className={`grid h-10 w-10 place-items-center ${neo.btn} rounded-2xl`}
                aria-label="Toggle menu"
              >
                ☰
              </button>
              <div className="text-sm font-semibold">{title}</div>
              <button
                onClick={logout}
                className="text-xs font-semibold text-slate-700 underline underline-offset-4"
              >
                Logout
              </button>
            </div>
          </NeoCard>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
          {/* Sidebar */}
          <aside className={`${open ? "block" : "hidden"} lg:block lg:sticky lg:top-6`}>
            <NeoCard className="p-4">
              <div className="px-2 py-3">
                <div className="text-lg font-semibold">EsportM</div>
                <div className={`text-xs ${neo.muted}`}>Club Admin</div>
                <div className={`mt-3 ${neo.inset} px-3 py-2 text-xs`}>
                  {(user as any)?.email || "admin"}
                </div>
              </div>

              <nav className="mt-3 space-y-2">
                {links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        isActive ? "bg-[#5B5FA8] text-white" : "text-slate-700"
                      } ${isActive ? neo.inset : neo.btn}`
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
              </nav>

              <div className="mt-4 px-2">
                <NeoButton onClick={logout} variant="primary" className="w-full">
                  Logout
                </NeoButton>
              </div>
            </NeoCard>
          </aside>

          {/* Content */}
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}