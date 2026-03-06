import { PrimaryRole, SubRole } from '@prisma/client';

export type PlatformRole = PrimaryRole | SubRole;

export type RolePermission =
  | 'auth.session.read'
  | 'profile.self.read'
  | 'profile.self.update'
  | 'membership.self.read'
  | 'membership.accept.assignment'
  | 'dashboard.view'
  | 'dashboard.switch.context'
  | 'clubs.read'
  | 'clubs.create'
  | 'members.read'
  | 'members.assign.signup'
  | 'members.update.primary'
  | 'members.update.subroles'
  | 'members.remove'
  | 'invitations.create'
  | 'invitations.revoke'
  | 'invitations.resend'
  | 'players.read'
  | 'squads.read'
  | 'squads.write'
  | 'matches.read'
  | 'matches.write'
  | 'injuries.read'
  | 'injuries.write'
  | 'operations.read'
  | 'operations.write'
  | 'seasons.read'
  | 'seasons.write'
  | 'opponents.read'
  | 'opponents.write'
  | 'stats.read'
  | 'stats.recompute'
  | 'leaderboards.read'
  | 'marketplace.read'
  | 'marketplace.write';

export const MULTI_ROLE_SWITCH_PRIMARY_ALLOWLIST: readonly PrimaryRole[] = [
  PrimaryRole.ADMIN,
  PrimaryRole.MANAGER,
];

export const PRIMARY_ROLE_PERMISSIONS: Record<PrimaryRole, readonly RolePermission[]> = {
  [PrimaryRole.MEMBER]: [
    'auth.session.read',
    'profile.self.read',
    'profile.self.update',
    'membership.self.read',
    'membership.accept.assignment',
    'dashboard.view',
    'seasons.read',
    'opponents.read',
  ],
  [PrimaryRole.PLAYER]: [
    'auth.session.read',
    'profile.self.read',
    'profile.self.update',
    'membership.self.read',
    'dashboard.view',
    'players.read',
    'matches.read',
    'injuries.read',
    'seasons.read',
    'opponents.read',
    'stats.read',
    'leaderboards.read',
    'marketplace.read',
  ],
  [PrimaryRole.MANAGER]: [
    'auth.session.read',
    'profile.self.read',
    'profile.self.update',
    'membership.self.read',
    'dashboard.view',
    'dashboard.switch.context',
    'clubs.read',
    'members.read',
    'players.read',
    'squads.read',
    'squads.write',
    'matches.read',
    'matches.write',
    'injuries.read',
    'injuries.write',
    'operations.read',
    'operations.write',
    'seasons.read',
    'seasons.write',
    'opponents.read',
    'opponents.write',
    'stats.read',
    'stats.recompute',
    'leaderboards.read',
    'marketplace.read',
    'marketplace.write',
  ],
  [PrimaryRole.ADMIN]: [
    'auth.session.read',
    'profile.self.read',
    'profile.self.update',
    'membership.self.read',
    'dashboard.view',
    'dashboard.switch.context',
    'clubs.read',
    'clubs.create',
    'members.read',
    'members.assign.signup',
    'members.update.primary',
    'members.update.subroles',
    'members.remove',
    'invitations.create',
    'invitations.revoke',
    'invitations.resend',
    'players.read',
    'squads.read',
    'squads.write',
    'matches.read',
    'matches.write',
    'injuries.read',
    'injuries.write',
    'operations.read',
    'operations.write',
    'seasons.read',
    'seasons.write',
    'opponents.read',
    'opponents.write',
    'stats.read',
    'stats.recompute',
    'leaderboards.read',
    'marketplace.read',
    'marketplace.write',
  ],
};

export const SUB_ROLE_PERMISSIONS: Record<SubRole, readonly RolePermission[]> = {
  [SubRole.COACH]: [
    'dashboard.view',
    'players.read',
    'squads.read',
    'matches.read',
    'stats.read',
    'leaderboards.read',
    'marketplace.read',
    'marketplace.write',
  ],
  [SubRole.PHYSIO]: [
    'dashboard.view',
    'players.read',
    'matches.read',
    'injuries.read',
    'stats.read',
  ],
  [SubRole.AGENT]: [
    'dashboard.view',
    'players.read',
    'matches.read',
    'stats.read',
    'leaderboards.read',
  ],
  [SubRole.NUTRITIONIST]: [
    'dashboard.view',
    'players.read',
    'matches.read',
    'injuries.read',
    'stats.read',
  ],
  [SubRole.PITCH_MANAGER]: [
    'dashboard.view',
    'matches.read',
    'operations.read',
  ],
};

export type RoleAccessShape = {
  primary: PrimaryRole;
  subRoles?: readonly SubRole[];
};

export function listRolePermissions(role: RoleAccessShape): RolePermission[] {
  const permissions = new Set<RolePermission>(
    PRIMARY_ROLE_PERMISSIONS[role.primary] || [],
  );

  for (const subRole of role.subRoles || []) {
    for (const permission of SUB_ROLE_PERMISSIONS[subRole] || []) {
      permissions.add(permission);
    }
  }

  return Array.from(permissions.values());
}

export function hasRolePermission(
  role: RoleAccessShape,
  permission: RolePermission,
): boolean {
  return listRolePermissions(role).includes(permission);
}
