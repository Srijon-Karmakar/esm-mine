import React from "react";
import { NavLink } from "react-router-dom";

export default function NeoNavItem({
  to,
  icon,
  label,
  desc,
  end,
}: {
  to: string;
  icon?: React.ReactNode;
  label: string;
  desc?: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => {
        const base =
          "block w-full rounded-2xl px-4 py-3 text-left select-none " +
          "transition-all duration-200 ease-out will-change-transform";

        const idle =
          "bg-[#E7E9FF] text-slate-700 " +
          "shadow-[8px_8px_18px_rgba(120,120,180,0.22),-8px_-8px_18px_rgba(255,255,255,0.9)]";

        const hover =
          "hover:-translate-y-[2px] " +
          "hover:shadow-[6px_6px_14px_rgba(120,120,180,0.18),-6px_-6px_14px_rgba(255,255,255,0.95)]";

        const press =
          "active:translate-y-[1px] " +
          "active:shadow-[inset_6px_6px_12px_rgba(120,120,180,0.25),inset_-6px_-6px_12px_rgba(255,255,255,0.9)]";

        const active =
          "bg-black text-white " +
          "shadow-[10px_10px_22px_rgba(80,86,160,0.35),-6px_-6px_18px_rgba(255,255,255,0.4)] " +
          "hover:-translate-y-[1px] hover:shadow-[10px_10px_20px_rgba(80,86,160,0.32),-6px_-6px_18px_rgba(255,255,255,0.38)] " +
          "active:translate-y-[1px]";

        return `${base} ${isActive ? active : `${idle} ${hover} ${press}`}`;
      }}
    >
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-2xl bg-white/40">
          {icon ?? "✦"}
        </div>

        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{label}</div>
          {desc ? (
            <div className="mt-0.5 text-[11px] opacity-80 truncate">
              {desc}
            </div>
          ) : null}
        </div>
      </div>
    </NavLink>
  );
}