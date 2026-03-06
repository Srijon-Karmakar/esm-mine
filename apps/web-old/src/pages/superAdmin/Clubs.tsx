import React, { useMemo, useState } from "react";
import NeoCard from "../../ui/NeoCard";
import NeoInput from "../../ui/NeoInput";
import NeoButton from "../../ui/NeoButton";
import { neo } from "../../ui/neo";

const MOCK = [
  { id: "1", name: "EsportM System", slug: "esportm-system" },
  { id: "2", name: "EsportM", slug: "esportm" },
];

export default function Clubs() {
  const [q, setQ] = useState("");
  const rows = useMemo(
    () => MOCK.filter((c) => `${c.name} ${c.slug}`.toLowerCase().includes(q.toLowerCase())),
    [q]
  );

  return (
    <div className="space-y-6">
      <NeoCard className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Clubs</h1>
            <p className={`mt-1 text-sm ${neo.muted}`}>Create and manage clubs across the platform.</p>
          </div>

          <NeoButton variant="primary" className="w-full sm:w-auto">
            + Create Club
          </NeoButton>
        </div>

        <div className="mt-4 flex gap-3">
          <div className="w-full max-w-md">
            <NeoInput placeholder="Search by name or slug..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <NeoButton className="shrink-0">Filter</NeoButton>
        </div>
      </NeoCard>

      <NeoCard className="p-4">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Slug</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-white/40">
                  <td className="px-3 py-3 font-semibold">{c.name}</td>
                  <td className="px-3 py-3 text-slate-600">{c.slug}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <NeoButton className="px-3 py-2">View</NeoButton>
                      <NeoButton className="px-3 py-2">Edit</NeoButton>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                    No clubs found.
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