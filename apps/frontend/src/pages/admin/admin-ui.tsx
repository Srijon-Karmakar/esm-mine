import { type ReactNode } from "react";

export const adminCardBorder = "rgba(var(--border), .92)";
export const adminCardBg =
  "linear-gradient(145deg, rgba(255,255,255,.70), rgba(255,255,255,.44) 62%, rgba(var(--primary), .10))";
export const adminSoftBg =
  "linear-gradient(145deg, rgba(255,255,255,.78), rgba(255,255,255,.54) 64%, rgba(var(--primary), .08))";
export const adminDarkBg =
  "radial-gradient(760px 260px at 88% 12%, rgba(var(--primary), .28), transparent 62%), linear-gradient(158deg, rgba(var(--primary-2), .95), rgba(var(--primary-2), .86))";
export const adminGlassShadow = "0 20px 55px rgba(20,24,32,0.12)";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function formatDateTime(input?: string | null) {
  if (!input) return "-";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export function formatDate(input?: string | null) {
  if (!input) return "-";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

export function formatCountdown(input?: string | null) {
  if (!input) return "No kickoff time";
  const target = new Date(input).getTime();
  if (!Number.isFinite(target)) return "No kickoff time";
  const diff = target - Date.now();
  if (diff <= 0) return "Live or completed";

  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function PageWrap({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
      <div
        className="relative overflow-hidden rounded-[32px] border px-4 py-4 sm:px-6 sm:py-5"
        style={{
          borderColor: adminCardBorder,
          background:
            "radial-gradient(1200px 460px at 8% 12%, rgba(255,255,255,.72), transparent 55%), radial-gradient(980px 400px at 92% 10%, rgba(var(--primary),.24), transparent 58%), radial-gradient(760px 420px at 94% 92%, rgba(var(--primary), .14), transparent 62%), linear-gradient(140deg, rgba(255,255,255,.60), rgba(255,255,255,.28))",
          boxShadow: adminGlassShadow,
        }}
      >
        <div
          className="pointer-events-none absolute -left-20 top-6 h-44 w-44 rounded-full blur-3xl"
          style={{ background: "rgba(255,255,255,.40)" }}
        />
        <div
          className="pointer-events-none absolute -right-20 bottom-4 h-48 w-48 rounded-full blur-3xl"
          style={{ background: "rgba(var(--primary), .26)" }}
        />
        <div className="relative z-10 space-y-4 sm:space-y-5">{children}</div>
      </div>
    </div>
  );
}

export function Hero({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: string;
  right?: ReactNode;
}) {
  return (
    <div
      className="mb-1 flex flex-col gap-3 rounded-[26px] border px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5"
      style={{
        borderColor: "rgba(var(--primary-2), .12)",
        background:
          "linear-gradient(142deg, rgba(255,255,255,.74), rgba(255,255,255,.48) 62%, rgba(var(--primary), .12))",
      }}
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">
          Dashboard
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[rgb(var(--text))] sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">{subtitle}</p>
      </div>
      {right}
    </div>
  );
}

export function Section({
  title,
  subtitle,
  right,
  children,
  dark = false,
  className,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cx("rounded-[26px] border p-4 sm:p-5", className)}
      style={{
        borderColor: dark ? "rgba(255,255,255,.18)" : adminCardBorder,
        background: dark
          ? adminDarkBg
          : "linear-gradient(145deg, rgba(255,255,255,.72), rgba(255,255,255,.44) 62%, rgba(var(--primary), .08))",
        boxShadow: adminGlassShadow,
      }}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            className={cx(
              "text-base font-extrabold",
              dark ? "text-white" : "text-[rgb(var(--text))]"
            )}
          >
            {title}
          </h2>
          {subtitle ? (
            <p
              className={cx(
                "mt-1 text-xs",
                dark ? "text-white/65" : "text-[rgb(var(--muted))]"
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <article
      className="min-w-0 rounded-2xl border px-4 py-3"
      style={{
        borderColor: adminCardBorder,
        background: adminSoftBg,
      }}
    >
      <p className="text-xs text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-[rgb(var(--text))] [overflow-wrap:anywhere] break-words">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-[rgb(var(--muted))]">{hint}</p> : null}
    </article>
  );
}

export function DotTag({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "ok" | "warn" | "danger";
}) {
  const styleByTone = {
    default: {
      bg: "rgba(255,255,255,.65)",
      border: adminCardBorder,
      text: "rgb(var(--text))",
      dot: "rgba(var(--primary), .95)",
    },
    ok: {
      bg: "rgba(16,185,129,.14)",
      border: "rgba(16,185,129,.35)",
      text: "rgb(5 120 85)",
      dot: "rgb(16 185 129)",
    },
    warn: {
      bg: "rgba(var(--primary), .20)",
      border: "rgba(var(--primary), .38)",
      text: "rgb(var(--primary-2))",
      dot: "rgb(var(--primary))",
    },
    danger: {
      bg: "rgba(244,63,94,.14)",
      border: "rgba(244,63,94,.28)",
      text: "rgb(190 24 93)",
      dot: "rgb(244 63 94)",
    },
  } as const;

  const style = styleByTone[tone];

  return (
    <span
      className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
      style={{
        background: style.bg,
        borderColor: style.border,
        color: style.text,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.dot }} />
      <span className="max-w-full break-words">{children}</span>
    </span>
  );
}

export function Divider() {
  return <div className="h-px w-full" style={{ background: "rgba(var(--primary-2), .11)" }} />;
}
