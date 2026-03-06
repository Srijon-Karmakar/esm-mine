import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "soft" | "primary";
};

export default function NeuButton({ variant = "soft", className = "", ...props }: Props) {
  const isPrimary = variant === "primary";
  return (
    <button
      className={[
        "rounded-full px-4 py-2 text-sm font-medium transition active:scale-[0.98]",
        "border border-white/40",
        isPrimary
          ? "bg-[#d9de7a] text-[#1b1f2a] shadow-[10px_10px_20px_rgba(134,144,203,0.35),-10px_-10px_20px_rgba(255,255,255,0.75)]"
          : "bg-[var(--neu-surface)] text-[#1b1f2a] shadow-[10px_10px_20px_rgba(134,144,203,0.35),-10px_-10px_20px_rgba(255,255,255,0.75)]",
        "hover:brightness-[1.02]",
        className,
      ].join(" ")}
      {...props}
    />
  );
}