import React from "react";
import SKCard from "../../ui/SKCard";
import { sk } from "../../ui/skeuo";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <SKCard className="p-6">
        <h1 className="text-xl font-semibold">Club Admin Dashboard</h1>
        <p className={`mt-2 text-sm ${sk.textMuted}`}>
          Manage squads, players, matches, injuries and club settings.
        </p>
      </SKCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Squads", "Players", "Upcoming Matches", "Active Injuries"].map((k) => (
          <SKCard key={k} className="p-5">
            <div className={`text-xs ${sk.textMuted}`}>{k}</div>
            <div className="mt-2 text-2xl font-semibold">—</div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200/70 overflow-hidden">
              <div className="h-full w-1/4 bg-slate-400/50" />
            </div>
          </SKCard>
        ))}
      </div>

      <SKCard className="p-6">
        <h2 className="text-base font-semibold">Quick Actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {["Create Squad", "Invite Member", "Schedule Match", "Add Injury"].map((a) => (
            <div key={a} className={`${sk.insetField} px-4 py-3 text-sm text-slate-700`}>
              {a}
            </div>
          ))}
        </div>
      </SKCard>
    </div>
  );
}