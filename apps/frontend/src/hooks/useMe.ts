import { useQuery } from "@tanstack/react-query";
import { authApi } from "../api/dashboard.api";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: authApi.me,
    staleTime: 60_000,
  });
}