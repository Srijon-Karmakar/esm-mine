import React from "react";
import { Link } from "react-router-dom";
import { neu } from "./neu";

export type DashNavItem = {
  label: string;
  to: string;
  active?: boolean;
};

function Pill({ to, label, active }: DashNavItem) {
  return (
    <Link
      to={to}
      className={[
        "rounded-full px-5 py-3 text-sm font-semibold whitespace-nowrap",
        "transition active:scale-[0.99]",
        active
          ? "bg-[#CDD0FF] text-[#23244A] " + neu.inset
          : "bg-[#C8CBFF] text-[#24254A] " + neu.soft + " hover:brightness-[1.01]",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function DashboardShell({
  title,
  userName = "Player name",
  subTitle = "associated club",
  navItems,
  rightActions,
  onLogout,
  children,
}: {
  title: string;
  userName?: string;
  subTitle?: string;
  navItems: DashNavItem[];
  rightActions?: React.ReactNode;
  onLogout?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`min-h-screen w-full ${neu.bg}`}>
      <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-5 lg:px-8 lg:py-8">
        <div className="grid gap-5 lg:grid-cols-[320px_1fr] lg:gap-7">
          {/* SIDEBAR */}
          <aside
            className={[
              "rounded-[34px] p-5 sm:p-6",
              neu.panel,
              neu.outer,
              "lg:sticky lg:top-6 h-fit",
            ].join(" ")}
          >
            {/* Identity */}
            <div className="flex items-center gap-4">
              <div
                className={[
                  "h-14 w-14 sm:h-16 sm:w-16 rounded-full",
                  "bg-[#CBCDFF]",
                  neu.inset,
                ].join(" ")}
              />
              <div className="min-w-0">
                <div className="truncate text-base sm:text-lg font-extrabold text-[#1F203F]">
                  {userName}
                </div>
                <div className="truncate text-xs sm:text-sm text-[#2A2B55]/70">
                  {subTitle}
                </div>
              </div>
            </div>

            {/* Desktop nav */}
            <div className="mt-7 hidden lg:grid gap-4">
              {navItems.map((it) => (
                <Pill key={it.to} {...it} />
              ))}
            </div>

            {/* Mobile nav: horizontal pills */}
            <div className="mt-6 lg:hidden">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {navItems.map((it) => (
                  <Pill key={it.to} {...it} />
                ))}
              </div>
            </div>
          </aside>

          {/* MAIN */}
          <main className="min-w-0">
            {/* TOP BAR */}
            <div
              className={[
                "rounded-[24px] px-5 py-4 sm:px-6 sm:py-5",
                neu.panel2,
                neu.outer,
                "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
              ].join(" ")}
            >
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1E1F3E]">
                {title}
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-end">
                {rightActions}

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className={[
                      "rounded-full px-4 py-2 text-sm font-semibold",
                      "bg-[#D8DAFF] text-[#1E1F3E]",
                      neu.soft,
                      "active:scale-[0.99] transition",
                    ].join(" ")}
                  >
                    Log out
                  </button>
                )}

                <Link
                  to="/"
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold",
                    "bg-[#D8DAFF] text-[#1E1F3E]",
                    neu.soft,
                    "active:scale-[0.99] transition",
                  ].join(" ")}
                >
                  Home
                </Link>
              </div>
            </div>

            {/* CONTENT */}
            <div className={["mt-5 rounded-[30px] p-4 sm:p-6", neu.surface, neu.outer].join(" ")}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}