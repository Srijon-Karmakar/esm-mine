import type { AuthUser } from "../api/auth.api";

const SYSTEM_SLUG = "esportm-system";

export function getDefaultRouteForUser(
  user: AuthUser | null,
  systemSlug = SYSTEM_SLUG
) {
  const memberships: any[] = (user as any)?.memberships ?? [];

  const isSuperAdmin = memberships.some(
    (m) => m?.primary === "ADMIN" && m?.club?.slug === systemSlug
  );
  const isAdmin = memberships.some((m) => m?.primary === "ADMIN");
  const isPlayer = memberships.some((m) => m?.primary === "PLAYER");

  if (isSuperAdmin) return "/superadmin";
  if (isAdmin) return "/admin";
  if (isPlayer) return "/player/dashboard";
  return "/";
}