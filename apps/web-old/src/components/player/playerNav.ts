export type PlayerNavItem = {
  label: string;
  to: string;
};

export const PLAYER_NAV: PlayerNavItem[] = [
  { label: "Profile", to: "/player/profile" },
  { label: "Performance", to: "/player/performance" },
  { label: "Statistics", to: "/player/dashboard" },
  { label: "Transfers", to: "/player/transfers" },
  { label: "Social", to: "/player/social" },
  { label: "Health", to: "/player/health" },
];