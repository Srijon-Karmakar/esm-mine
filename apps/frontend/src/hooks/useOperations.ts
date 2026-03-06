import { useQuery } from "@tanstack/react-query";
import { operationsApi } from "../api/operations.api";

function resolveClubId(clubId?: string) {
  if (clubId) return clubId;
  return localStorage.getItem("activeClubId") || "";
}

export function useOperationsTraining(range = "30d", clubId?: string) {
  const effectiveClubId = resolveClubId(clubId);
  return useQuery({
    queryKey: ["operations", "training", effectiveClubId || "NO_CLUB", range],
    enabled: !!effectiveClubId,
    queryFn: () => operationsApi.training(effectiveClubId, range),
  });
}

export function useOperationsTasks(limit = 20, clubId?: string) {
  const effectiveClubId = resolveClubId(clubId);
  return useQuery({
    queryKey: ["operations", "tasks", effectiveClubId || "NO_CLUB", limit],
    enabled: !!effectiveClubId,
    queryFn: () => operationsApi.tasks(effectiveClubId, limit),
  });
}

export function useOperationsFeed(limit = 30, clubId?: string) {
  const effectiveClubId = resolveClubId(clubId);
  return useQuery({
    queryKey: ["operations", "feed", effectiveClubId || "NO_CLUB", limit],
    enabled: !!effectiveClubId,
    queryFn: () => operationsApi.feed(effectiveClubId, limit),
  });
}

