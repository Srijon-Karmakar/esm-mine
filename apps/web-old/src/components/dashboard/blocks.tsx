import React from "react";
import { neu } from "./neu";

export function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="text-base sm:text-lg font-extrabold text-[#1E1F3E]">
          {title}
        </div>
        {subtitle && <div className="text-sm text-[#6B6D98]">{subtitle}</div>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}

export function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className={["rounded-3xl p-5", neu.surface, neu.soft].join(" ")}>
      <p className="text-xs sm:text-sm font-semibold text-[#4B4C7A]">{title}</p>
      <div className="mt-3 text-2xl font-black tracking-tight text-[#1D1E3B]">
        {value}
      </div>
      {hint && <p className="mt-2 text-xs text-[#6E709B]">{hint}</p>}
    </div>
  );
}

export function Panel({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={["rounded-[28px] p-5 sm:p-6", neu.surface, neu.inset].join(" ")}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm sm:text-base font-extrabold text-[#1E1F3E]">
          {title}
        </div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function SoftItem({ children }: { children: React.ReactNode }) {
  return (
    <div className={["rounded-2xl px-4 py-3 text-sm text-[#1E1F3E]", neu.surface2, neu.insetSm].join(" ")}>
      {children}
    </div>
  );
}

export function PrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      className={[
        "rounded-full px-5 py-2 text-sm font-extrabold",
        "bg-[#E9E86A] text-[#1E1F3E]",
        "shadow-[10px_10px_18px_rgba(0,0,0,0.12),-10px_-10px_18px_rgba(255,255,255,0.55)]",
        "active:scale-[0.99] transition",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      className={[
        "rounded-full px-4 py-2 text-sm font-semibold",
        "bg-[#DDE0FF] text-[#1E1F3E]",
        neu.soft,
        "active:scale-[0.99] transition",
      ].join(" ")}
    >
      {children}
    </button>
  );
}