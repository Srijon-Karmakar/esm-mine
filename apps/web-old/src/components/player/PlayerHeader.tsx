import React from "react";
import NeoButton from "../ui/NeoButton";
import { neo } from "../ui/neo";

type Props = {
  onMenu: () => void;
  title?: string;
  onLogout?: () => void;
  rightSlot?: React.ReactNode;
};

export default function PlayerHeader({
  onMenu,
  title = "Page Title",
  onLogout,
  rightSlot,
}: Props) {
  return (
    <header className="sticky top-0 z-30">
      <div className="mx-auto max-w-[1500px] px-3 pt-4">
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${neo.panel}`}
          style={{ background: "#aeb3f4" }}
        >
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenu}
              className="md:hidden rounded-full px-4 py-2 text-sm font-semibold bg-white/35 border border-white/30 shadow-[8px_8px_18px_rgba(70,74,120,0.3),-8px_-8px_18px_rgba(255,255,255,0.55)] active:shadow-[inset_8px_8px_18px_rgba(70,74,120,0.22),inset_-8px_-8px_18px_rgba(255,255,255,0.55)]"
            >
              Menu
            </button>
            <div className="text-lg font-semibold text-slate-900">{title}</div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {rightSlot}
            <NeoButton onClick={onLogout} className="px-4">
              Log out
            </NeoButton>
            <NeoButton className="px-4">Home</NeoButton>
          </div>
        </div>
      </div>
    </header>
  );
}