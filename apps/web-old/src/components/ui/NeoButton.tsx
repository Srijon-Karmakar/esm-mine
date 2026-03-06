import React from "react";
import { neo } from "./neo";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "soft";
};

export default function NeoButton({
  className = "",
  variant = "soft",
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300";

  const soft =
    `${neo.surface} hover:brightness-[1.02] active:${neo.pressed}`.trim();

  const primary =
    "bg-[#D7D94A] text-slate-900 shadow-[8px_8px_18px_rgba(88,92,150,0.22),-8px_-8px_18px_rgba(255,255,255,0.85)] hover:brightness-[1.02] active:shadow-[inset_8px_8px_18px_rgba(88,92,150,0.22),inset_-8px_-8px_18px_rgba(255,255,255,0.85)]";

  return (
    <button
      {...props}
      className={`${base} ${variant === "primary" ? primary : soft} ${className}`}
    />
  );
}