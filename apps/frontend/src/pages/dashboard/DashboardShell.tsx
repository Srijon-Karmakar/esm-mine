import React, { useMemo, useState } from "react";
import { useMe } from "../../hooks/useMe";

export default function DashboardShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { data } = useMe();
  const memberships = useMemo(() => data?.memberships ?? [], [data?.memberships]);
  const activeClubId = data?.activeClubId || null;

  const [range, setRange] = useState("30d");

  const activeClub = useMemo(
    () => memberships.find((m: any) => m.clubId === activeClubId)?.club,
    [memberships, activeClubId]
  );

  return (
    <div className="p-4 sm:p-6">
      <div
        className="mx-auto max-w-7xl rounded-[30px] border p-4 sm:p-6"
        style={{
          borderColor: "rgba(var(--primary-2), .14)",
          background:
            "radial-gradient(900px 320px at 88% 8%, rgba(var(--primary), .22), transparent 58%), linear-gradient(145deg, rgba(255,255,255,.72), rgba(255,255,255,.44))",
          boxShadow: "0 20px 55px rgba(20,24,32,0.12)",
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm text-[rgb(var(--muted))]">
              {activeClub ? `${activeClub.name}` : "No club selected"}
            </div>
            <h1 className="text-2xl font-semibold text-[rgb(var(--text))]">{title}</h1>
          </div>

          <div className="flex gap-2">
            <select
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm text-[rgb(var(--text))] outline-none"
              style={{ borderColor: "rgba(var(--primary-2), .14)" }}
              value={activeClubId ?? ""}
              onChange={(e) => {
                localStorage.setItem("activeClubId", e.target.value);
                window.location.reload(); // simplest for now
              }}
            >
              {memberships.map((m: any) => (
                <option key={m.clubId} value={m.clubId}>
                  {m.club?.name || m.clubId}
                </option>
              ))}
            </select>

            <select
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm text-[rgb(var(--text))] outline-none"
              style={{ borderColor: "rgba(var(--primary-2), .14)" }}
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        <div className="mt-6">{children && React.cloneElement(children as any, { range })}</div>
      </div>
    </div>
  );
}
