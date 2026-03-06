import React from "react";

export default function NeuPill({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        "rounded-full bg-[var(--neu-surface)] px-4 py-3",
        "shadow-[10px_10px_20px_rgba(134,144,203,0.35),-10px_-10px_20px_rgba(255,255,255,0.75)]",
        "border border-white/40",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}