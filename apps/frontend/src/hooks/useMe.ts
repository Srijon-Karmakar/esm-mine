import { useQuery } from "@tanstack/react-query";
import { authApi } from "../api/dashboard.api";

function resolveActiveClubId() {
  try {
    return localStorage.getItem("activeClubId") || "";
  } catch {
    return "";
  }
}

export function useMe() {
  const activeClubId = resolveActiveClubId();

  return useQuery({
    queryKey: ["me", activeClubId || "NO_CLUB"],
    queryFn: () => authApi.me(activeClubId || undefined),
    staleTime: 60_000,
  });
}
