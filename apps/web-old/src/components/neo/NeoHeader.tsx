import React from "react";
import NeoCard from "../../ui/NeoCard";
import NeoPress from "../../ui/NeoPress";
import { neo } from "../../ui/neo";

export default function NeoHeader({
  title,
  subtitle,
  onHome,
  onLogout,
}: {
  title: string;
  subtitle?: string;
  onHome: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="sticky top-0 z-30">
      <div className="px-4 py-3 lg:px-6 lg:py-5">
        <NeoCard size="sm" className="px-4 py-3 lg:px-5 lg:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="truncate text-base font-semibold lg:text-lg">{title}</div>
              {subtitle ? (
                <div className={`mt-0.5 text-xs ${neo.muted} hidden sm:block`}>{subtitle}</div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <NeoPress onClick={onHome} className="px-4 py-2 text-sm font-semibold">
                Home
              </NeoPress>
              <NeoPress
                onClick={onLogout}
                variant="primary"
                className="px-4 py-2 text-sm font-semibold"
              >
                Logout
              </NeoPress>
            </div>
          </div>
        </NeoCard>
      </div>
    </div>
  );
}