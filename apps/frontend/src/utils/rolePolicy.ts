import type { PrimaryRole, SubRole } from "../api/admin.api";

export type PlatformRole = PrimaryRole | SubRole;

export type RolePermission =
  | "auth.session.read"
  | "profile.self.read"
  | "profile.self.update"
  | "membership.self.read"
  | "membership.accept.assignment"
  | "dashboard.view"
  | "dashboard.switch.context"
  | "clubs.read"
  | "clubs.create"
  | "members.read"
  | "members.assign.signup"
  | "members.update.primary"
  | "members.update.subroles"
  | "members.remove"
  | "invitations.create"
  | "invitations.revoke"
  | "invitations.resend"
  | "players.read"
  | "squads.read"
  | "squads.write"
  | "matches.read"
  | "matches.write"
  | "injuries.read"
  | "injuries.write"
  | "operations.read"
  | "operations.write"
  | "seasons.read"
  | "seasons.write"
  | "opponents.read"
  | "opponents.write"
  | "stats.read"
  | "stats.recompute"
  | "leaderboards.read"
  | "marketplace.read"
  | "marketplace.write";

export const MULTI_ROLE_SWITCH_PRIMARY_ALLOWLIST: readonly PrimaryRole[] = [
  "ADMIN",
  "MANAGER",
];

export const PRIMARY_ROLE_PERMISSIONS: Record<PrimaryRole, readonly RolePermission[]> = {
  MEMBER: [
    "auth.session.read",
    "profile.self.read",
    "profile.self.update",
    "membership.self.read",
    "membership.accept.assignment",
    "dashboard.view",
    "seasons.read",
    "opponents.read",
  ],
  PLAYER: [
    "auth.session.read",
    "profile.self.read",
    "profile.self.update",
    "membership.self.read",
    "dashboard.view",
    "players.read",
    "matches.read",
    "injuries.read",
    "operations.read",
    "seasons.read",
    "opponents.read",
    "stats.read",
    "leaderboards.read",
    "marketplace.read",
  ],
  MANAGER: [
    "auth.session.read",
    "profile.self.read",
    "profile.self.update",
    "membership.self.read",
    "dashboard.view",
    "dashboard.switch.context",
    "clubs.read",
    "members.read",
    "players.read",
    "squads.read",
    "squads.write",
    "matches.read",
    "matches.write",
    "injuries.read",
    "injuries.write",
    "operations.read",
    "operations.write",
    "seasons.read",
    "seasons.write",
    "opponents.read",
    "opponents.write",
    "stats.read",
    "stats.recompute",
    "leaderboards.read",
    "marketplace.read",
    "marketplace.write",
  ],
  ADMIN: [
    "auth.session.read",
    "profile.self.read",
    "profile.self.update",
    "membership.self.read",
    "dashboard.view",
    "dashboard.switch.context",
    "clubs.read",
    "clubs.create",
    "members.read",
    "members.assign.signup",
    "members.update.primary",
    "members.update.subroles",
    "members.remove",
    "invitations.create",
    "invitations.revoke",
    "invitations.resend",
    "players.read",
    "squads.read",
    "squads.write",
    "matches.read",
    "matches.write",
    "injuries.read",
    "injuries.write",
    "operations.read",
    "operations.write",
    "seasons.read",
    "seasons.write",
    "opponents.read",
    "opponents.write",
    "stats.read",
    "stats.recompute",
    "leaderboards.read",
    "marketplace.read",
    "marketplace.write",
  ],
};

export const SUB_ROLE_PERMISSIONS: Record<SubRole, readonly RolePermission[]> = {
  COACH: [
    "dashboard.view",
    "players.read",
    "squads.read",
    "matches.read",
    "stats.read",
    "leaderboards.read",
    "marketplace.read",
    "marketplace.write",
  ],
  PHYSIO: [
    "dashboard.view",
    "players.read",
    "matches.read",
    "injuries.read",
    "stats.read",
  ],
  AGENT: [
    "dashboard.view",
    "players.read",
    "matches.read",
    "stats.read",
    "leaderboards.read",
  ],
  NUTRITIONIST: [
    "dashboard.view",
    "players.read",
    "matches.read",
    "injuries.read",
    "stats.read",
  ],
  PITCH_MANAGER: [
    "dashboard.view",
    "matches.read",
    "operations.read",
  ],
  CAPTAIN: [],
};

export function listRolePermissions(
  primary: PrimaryRole,
  subRoles: readonly SubRole[] = []
): RolePermission[] {
  const allowed = new Set<RolePermission>(PRIMARY_ROLE_PERMISSIONS[primary] || []);
  for (const role of subRoles) {
    for (const permission of SUB_ROLE_PERMISSIONS[role] || []) {
      allowed.add(permission);
    }
  }
  return Array.from(allowed.values());
}

export function hasRolePermission(
  primary: PrimaryRole,
  subRoles: readonly SubRole[] | undefined,
  permission: RolePermission
) {
  return listRolePermissions(primary, subRoles || []).includes(permission);
}
