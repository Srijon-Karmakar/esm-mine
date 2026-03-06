import React from "react";
import NeoCard from "../../ui/NeoCard";
import NeoPress from "../../ui/NeoPress";
import { neo } from "../../ui/neo";
import NeoNavItem from "./NeoNavItem";

export type SideItem = {
  to: string;
  label: string;
  desc?: string;
  icon?: React.ReactNode;
};

export default function NeoSidebar({
  title = "EsportM",
  subtitle = "Player Panel",
  items,
  onHome,
  onLogout,
}: {
  title?: string;
  subtitle?: string;
  items: SideItem[];
  onHome: () => void;
  onLogout: () => void;
}) {
  return (
    <aside className="hidden lg:block fixed left-0 top-0 h-screen w-[280px] px-5 py-6">
      <NeoCard className="h-full p-4 flex flex-col">
        {/* Brand */}
        <div className="px-2 pb-3 pt-2">
          <div className="text-lg font-semibold">{title}</div>
          <div className={`text-xs ${neo.muted}`}>{subtitle}</div>
        </div>

        {/* Nav */}
        <nav className="mt-2 space-y-2 flex-1 overflow-y-auto pr-1">
          {items.map((item) => (
            <NeoNavItem
              key={item.to}
              to={item.to}
              label={item.label}
              desc={item.desc}
              icon={item.icon}
              end={item.to === "/player"} // ✅ /player exact active only
            />
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="mt-4 px-2">
          <div className={`${neo.inset} rounded-2xl p-3`}>
            {/* <div className="text-xs font-semibold text-slate-700">Quick</div> */}

            <div className="mt-2 flex gap-2">
              <NeoPress
                onClick={onHome}
                className="flex-1 px-3 py-2 text-xs font-semibold"
              >
                Home
              </NeoPress>

              <NeoPress
                onClick={onLogout}
                variant="primary"
                className="flex-1 px-3 py-2 text-xs font-semibold"
              >
                Logout
              </NeoPress>
            </div>
          </div>
        </div>
      </NeoCard>
    </aside>
  );
}