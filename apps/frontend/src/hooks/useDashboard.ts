import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard.api";

function resolveDashboardRole(explicitAs?: string) {
  if (explicitAs) return explicitAs;
  const stored = localStorage.getItem("activeDashboardRole");
  return stored || undefined;
}

export function useDashboardOverview(as?: string) {
  const effectiveAs = resolveDashboardRole(as);
  return useQuery({
    queryKey: ["dashboard", "overview", effectiveAs || "AUTO"],
    queryFn: () => dashboardApi.overview(effectiveAs),
  });
}

export function useDashboardCharts(range: string, as?: string) {
  const effectiveAs = resolveDashboardRole(as);
  return useQuery({
    queryKey: ["dashboard", "charts", range, effectiveAs || "AUTO"],
    queryFn: () => dashboardApi.charts(range, effectiveAs),
  });
}

export function useDashboardRecent(limit = 10, as?: string, enabled = true) {
  const effectiveAs = resolveDashboardRole(as);
  return useQuery({
    queryKey: ["dashboard", "recent", limit, effectiveAs || "AUTO"],
    queryFn: () => dashboardApi.recent(limit, effectiveAs),
    enabled,
  });
}
