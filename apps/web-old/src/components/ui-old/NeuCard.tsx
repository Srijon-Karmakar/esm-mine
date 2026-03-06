import React from "react";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  inset?: boolean;
};

export default function NeuCard({ inset, className = "", ...props }: Props) {
  return (
    <div
      className={[
        "rounded-2xl bg-[var(--neu-surface)]",
        inset
          ? "shadow-[inset_10px_10px_25px_rgba(134,144,203,0.35),inset_-10px_-10px_25px_rgba(255,255,255,0.75)]"
          : "shadow-[12px_12px_25px_rgba(134,144,203,0.35),-12px_-12px_25px_rgba(255,255,255,0.75)]",
        "border border-white/40",
        className,
      ].join(" ")}
      {...props}
    />
  );
}