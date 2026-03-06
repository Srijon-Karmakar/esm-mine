import React, { useMemo, useState } from "react";
import NeoCard from "../../ui/NeoCard";
import NeoInput from "../../ui/NeoInput";
import NeoButton from "../../ui/NeoButton";
import { neo } from "../../ui/neo";

const MOCK = [
  { id: "u1", email: "admin@test.com", fullName: "Admin" },
  { id: "u2", email: "player@test.com", fullName: "Player" },
];

export default function Users() {
  const [q, setQ] = useState("");
  const rows = useMemo(
    () => MOCK.filter((u) => `${u.email} ${u.fullName}`.toLowerCase().includes(q.toLowerCase())),
    [q]
  );

  return (
    <div className="space-y-6">
      <NeoCard className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Users</h1>
            <p className={`mt-1 text-sm ${neo.muted}`}>Global user registry across all clubs.</p>
          </div>
          <NeoButton className="w-full sm:w-auto">Export</NeoButton>
        </div>

        <div className="mt-4 max-w-md">
          <NeoInput placeholder="Search users by email/name..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </NeoCard>

      <NeoCard className="p-4">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-t border-white/40">
                  <td className="px-3 py-3 font-semibold">{u.email}</td>
                  <td className="px-3 py-3 text-slate-600">{u.fullName || "—"}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <NeoButton className="px-3 py-2">View</NeoButton>
                      <NeoButton className="px-3 py-2">Access</NeoButton>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </NeoCard>
    </div>
  );
}