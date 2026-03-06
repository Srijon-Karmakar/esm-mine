import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import DashboardShell from "../../components/dashboard/DashboardShell";
import {
  GhostButton,
  Panel,
  PrimaryButton,
  SectionHeader,
  SoftItem,
  StatCard,
} from "../../components/dashboard/blocks";

export default function PlayerDashboard() {
  const { pathname } = useLocation();

  const navItems = useMemo(
    () => [
      { label: "Profile", to: "/player/profile", active: pathname.includes("/profile") || pathname.includes("/dashboard") },
      { label: "Performance", to: "/player/performance", active: pathname.includes("/performance") },
      { label: "Statistics", to: "/player/statistics", active: pathname.includes("/statistics") },
      { label: "Transfers", to: "/player/transfers", active: pathname.includes("/transfers") },
      { label: "Social", to: "/player/social", active: pathname.includes("/social") },
      { label: "Health", to: "/player/health", active: pathname.includes("/health") },
    ],
    [pathname]
  );

  return (
    <DashboardShell
      title="Page Title"
      userName="Player name"
      subTitle="associated club"
      navItems={navItems}
      rightActions={
        <>
          <GhostButton>View Profile</GhostButton>
          <PrimaryButton>Upload Media</PrimaryButton>
        </>
      }
      onLogout={() => console.log("logout")}
    >
      <SectionHeader
        title="Quick Summary"
        subtitle="Your performance snapshot & AI insights."
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Season Minutes" value="—" hint="From matches module" />
        <StatCard title="Goals / Assists" value="— / —" hint="Performance stats" />
        <StatCard title="Fitness Score" value="—" hint="Health & training" />
        <StatCard title="Market Value (AI)" value="—" hint="AI analytics" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="AI Recommendations" right={<GhostButton>Preview</GhostButton>}>
          <div className="grid gap-3">
            <SoftItem>Improve first touch under pressure</SoftItem>
            <SoftItem>Increase stamina conditioning (weekly plan)</SoftItem>
            <SoftItem>Work on left-foot finishing in training</SoftItem>
          </div>
        </Panel>

        <Panel title="Quick Tasks">
          <div className="text-sm text-[#6B6D98]">
            Keep your profile competitive.
          </div>
          <div className="mt-3 grid gap-3">
            <SoftItem>Add 2 new highlight clips</SoftItem>
            <SoftItem>Update positions & dominant foot</SoftItem>
            <SoftItem>Confirm injury status</SoftItem>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Recent Updates" right={<div className="text-xs font-semibold text-[#6B6D98]">Latest</div>}>
          <div className="grid gap-3">
            <SoftItem>Coach viewed your profile —</SoftItem>
            <SoftItem>Physio updated recovery notes —</SoftItem>
            <SoftItem>New message received —</SoftItem>
          </div>
        </Panel>

        <Panel title="Health Snapshot" right={<div className="text-xs font-semibold text-[#6B6D98]">Status</div>}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl p-4 bg-[#EEF0FF] shadow-[inset_6px_6px_12px_rgba(96,97,162,0.14),inset_-6px_-6px_12px_rgba(255,255,255,0.90)]">
              <div className="text-xs font-semibold text-[#6B6D98]">Current Injury</div>
              <div className="mt-2 text-xl font-black text-[#1E1F3E]">—</div>
            </div>
            <div className="rounded-2xl p-4 bg-[#EEF0FF] shadow-[inset_6px_6px_12px_rgba(96,97,162,0.14),inset_-6px_-6px_12px_rgba(255,255,255,0.90)]">
              <div className="text-xs font-semibold text-[#6B6D98]">Recovery ETA</div>
              <div className="mt-2 text-xl font-black text-[#1E1F3E]">—</div>
            </div>
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}