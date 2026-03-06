import React from "react";
import NeoCard from "../../ui/NeoCard";
import { neo } from "../../ui/neo";

const Stat = ({ label, value }: { label: string; value: string }) => (
  <NeoCard className="p-5">
    <div className={`text-xs ${neo.muted}`}>{label}</div>
    <div className="mt-2 text-2xl font-semibold">{value}</div>
    <div className="mt-3 h-1.5 w-full rounded-full bg-white/70 overflow-hidden">
      <div className="h-full w-1/3 bg-slate-400/40" />
    </div>
  </NeoCard>
);

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <NeoCard className="p-6">
        <h1 className="text-xl font-semibold">System Overview</h1>
        <p className={`mt-2 text-sm ${neo.muted}`}>
          Manage clubs, global users, and access controls across EsportM.
        </p>
      </NeoCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Clubs" value="—" />
        <Stat label="Total Users" value="—" />
        <Stat label="Club Admins" value="—" />
        <Stat label="Invitations" value="—" />
      </div>

      <NeoCard className="p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Recent activity</h2>
            <p className={`mt-1 text-xs ${neo.muted}`}>Last actions across the system.</p>
          </div>
          <div className={`${neo.inset} px-3 py-2 text-xs`}>Live</div>
        </div>

        <div className="mt-4 space-y-3">
          {["Club created", "Admin granted", "User invited"].map((t) => (
            <div key={t} className={`${neo.inset} px-4 py-3 text-sm text-slate-700`}>
              {t} <span className="text-xs text-slate-500">—</span>
            </div>
          ))}
        </div>
      </NeoCard>
    </div>
  );
}