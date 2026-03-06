export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "animate-pulse rounded-xl bg-white/40",
        "shadow-[inset_8px_8px_18px_rgba(134,144,203,0.22),inset_-8px_-8px_18px_rgba(255,255,255,0.65)]",
        className,
      ].join(" ")}
    />
  );
}