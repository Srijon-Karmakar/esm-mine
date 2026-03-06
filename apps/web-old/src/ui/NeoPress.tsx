import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  variant?: "default" | "primary";
};

export default function NeoPress({
  className = "",
  active,
  variant = "default",
  ...props
}: Props) {
  const base =
    "rounded-2xl transition-all duration-200 ease-out will-change-transform";

  /* ───────────────────────────── */
  /* DEFAULT (sidebar buttons) */
  /* ───────────────────────────── */

  const idle =
    "bg-[#E7E9FF] shadow-[8px_8px_18px_rgba(120,120,180,0.22),-8px_-8px_18px_rgba(255,255,255,0.9)]";

  const hover =
    "hover:shadow-[6px_6px_14px_rgba(120,120,180,0.18),-6px_-6px_14px_rgba(255,255,255,0.95)] hover:-translate-y-[2px]";

  const pressed =
    "active:shadow-[inset_6px_6px_12px_rgba(120,120,180,0.25),inset_-6px_-6px_12px_rgba(255,255,255,0.9)] active:translate-y-[1px]";

  /* ───────────────────────────── */
  /* ACTIVE SIDEBAR ITEM */
  /* ───────────────────────────── */

  const activeStyle =
    "bg-[#5D5FA8] text-white shadow-[10px_10px_22px_rgba(80,86,160,0.35),-6px_-6px_18px_rgba(255,255,255,0.4)]";

  /* ───────────────────────────── */
  /* PRIMARY (yellow buttons) */
  /* ───────────────────────────── */

  const primary =
    "bg-[#E9E86A] text-slate-900 shadow-[8px_8px_18px_rgba(0,0,0,0.18),-6px_-6px_18px_rgba(255,255,255,0.5)] hover:-translate-y-[2px] hover:shadow-[6px_6px_14px_rgba(0,0,0,0.15),-6px_-6px_14px_rgba(255,255,255,0.5)] active:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.18),inset_-6px_-6px_12px_rgba(255,255,255,0.5)] active:translate-y-[1px]";

  return (
    <button
      {...props}
      className={[
        base,
        variant === "primary"
          ? primary
          : active
          ? activeStyle
          : `${idle} ${hover} ${pressed}`,
        className,
      ].join(" ")}
    />
  );
}