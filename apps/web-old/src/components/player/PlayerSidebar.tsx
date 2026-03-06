import React from "react";
import { NavLink } from "react-router-dom";
import { neo } from "../ui/neo";
import type { PlayerNavItem } from "./playerNav";

type Props = {
  open: boolean;
  onClose: () => void;
  items: PlayerNavItem[];
  playerName?: string;
  clubName?: string;
};

export default function PlayerSidebar({
  open,
  onClose,
  items,
  playerName = "Player name",
  clubName = "associated club",
}: Props) {
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity md:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-[280px] md:w-[320px] transition-transform duration-300 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:relative md:z-0`}
      >
        <div className="h-full bg-[#aeb3f4] px-6 py-7">
          <div className="flex items-center gap-4">
            <div className={`h-16 w-16 rounded-full ${neo.panel} bg-white/40`} />
            <div className="leading-tight">
              <div className="text-lg font-semibold text-slate-900">{playerName}</div>
              <div className="text-sm text-slate-700/80">{clubName}</div>
            </div>
          </div>

          <nav className="mt-10 flex flex-col gap-5">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                className={({ isActive }) =>
                  [
                    "rounded-full px-6 py-4 text-center text-lg font-medium transition",
                    "border border-white/25",
                    "shadow-[10px_10px_22px_rgba(70,74,120,0.35),-10px_-10px_22px_rgba(255,255,255,0.45)]",
                    "hover:shadow-[inset_8px_8px_18px_rgba(70,74,120,0.22),inset_-8px_-8px_18px_rgba(255,255,255,0.55)]",
                    isActive ? "bg-white/35 text-slate-900" : "bg-white/25 text-slate-900/90",
                  ].join(" ")
                }
                onClick={onClose}
              >
                {it.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}