# Role Management Policy (Step 1 Baseline)

This file is the baseline permission matrix for role management and current club operations.

## Primary Roles

- `ADMIN`: full club control, including member assignment and role updates.
- `MANAGER`: operational management (squads, matches, injuries, operations), no role-edit authority.
- `PLAYER`: self/profile and player-facing dashboard data.
- `MEMBER`: onboarding + assignment acceptance, limited read.

## Sub Roles

- `COACH`: training/tactical read context.
- `PHYSIO`: medical context with injury write scope.
- `AGENT`: player/stat visibility context.
- `NUTRITIONIST`: player + health/readiness visibility.
- `PITCH_MANAGER`: fixtures + operations context.

## Multi-Role Switch Authorization

- Allowed primary roles: `ADMIN`, `MANAGER`.
- Other primary roles keep a single dashboard context, even if sub roles exist.

## Source of Truth (Code)

- Frontend matrix: `apps/frontend/src/utils/rolePolicy.ts`
- Backend matrix: `apps/api/src/common/types/role-policy.ts`

## Step 2 Enforcement Status

The backend now enforces permission checks using:

- Decorator: `apps/api/src/common/decorators/permissions.decorator.ts`
- Guard: `apps/api/src/common/guards/permissions.guard.ts`

Applied on role-sensitive controllers:

- `clubs` (member assignment + role management routes)
- `invitations` (revoke/resend)
- `players` (club list)
- `squads`
- `matches`
- `injuries`
- `operations`
- `stats`
- `seasons`
- `opponents`
- `leaderboards`

## Step 3 Lifecycle Hardening Status

Implemented:

- Invitation `resend` now preserves last assigned `primary` + `subRoles` (no hardcoded fallback role).
- Invitation `revoke` now removes all active invites for `clubId + email`.
- Invitation acceptance (`accept`, `accept-assignment`) now marks all active invites for the same `clubId + email` as used.
- Pending assignment feed excludes clubs where the user is already a member.
- Pending signup list is now club-scoped (`not a member of this club`), not global no-membership only.

## Step 4 Frontend Access Hardening Status

Implemented:

- Added route-level dashboard role guards:
  - `/dashboard/player` -> `PLAYER`
  - `/dashboard/manager` -> `MANAGER`
  - `/dashboard/admin` -> `ADMIN`
  - `/dashboard/coach` -> `COACH`
  - `/dashboard/physio` -> `PHYSIO`
  - `/dashboard/agent` -> `AGENT`
  - `/dashboard/nutrition` -> `NUTRITIONIST`
  - `/dashboard/pitch` -> `PITCH_MANAGER`
- Added permission-based guards for shared dashboard tabs:
  - `training` -> `operations.read`
  - `matches` -> `matches.read`
  - `stats` -> `stats.read`
  - `medical` -> `injuries.read`
  - `messages` -> `membership.self.read`
  - `settings` -> `membership.self.read`
  - `onboarding` -> `membership.accept.assignment`
- `AdminRoute` now checks policy permission (`clubs.read`) instead of hardcoded role string checks.

## Step 5 Admin Console Permission Context Status

Implemented:

- `AdminShell` now resolves role/sub-roles per active club membership (club-scoped), not from mixed cross-club primarys.
- `AdminShell` now computes policy permissions from active membership and passes them through outlet context.
- Admin top navigation and sidebar are now permission-filtered by route capability.
- Unauthorized admin paths are auto-redirected to the first allowed admin tab (or back to `/dashboard` if none).
- `AdminDashboard` and `AdminMembers` now use policy permissions for sensitive UI actions (signup assignment, role updates, remove member, create-club CTA state).

## Step 6 Admin Module Parity Status

Implemented:

- Remaining admin modules now consume `permissions` from `AdminShell` outlet context instead of hardcoded `role === ...` checks.
- `AdminSquads` now uses:
  - `squads.read` for read access
  - `squads.write` for create/add/remove actions
  - `players.read` for member pick-list loading
- `AdminMatches` now uses:
  - `matches.read` for read access
  - `matches.write` for create/status updates
- `AdminOperations` now uses:
  - `operations.read` for data loading
  - `operations.write` for create/update actions
  - `members.read` for assignee directory fetch
- `AdminAnalytics` now gates read by `stats.read`.
- Admin sidebar club-switch control can now be policy-driven from shell (`canManageClubData`) instead of only role string assumptions.

## Multi-Club Provisioning Mode

Enabled:

- Club creation is restricted to platform-admin accounts only.
- Platform admins are configured via env:
  - `PLATFORM_ADMIN_EMAILS=email1@example.com,email2@example.com`
- Onboarding "Create Club" is shown only when:
  - user has no memberships
  - user is in `PLATFORM_ADMIN_EMAILS`

## Superadmin Phase 1 (Platform Module) Status

Implemented:

- Added database-backed platform role flag:
  - `User.isPlatformAdmin` (`Boolean`, default `false`)
- Added club-level platform governance fields:
  - `Club.isActive`
  - `Club.aiEnabled`
  - `Club.marketplaceEnabled`
  - `Club.socialEnabled`
  - `Club.billingPlan` (`FREE` default)
- Added `PlatformAdminGuard` (JWT + DB flag, with allowlist fallback).
- Added platform APIs:
  - `GET /platform/overview`
  - `GET /platform/clubs`
  - `PATCH /platform/clubs/:clubId`
  - `GET /platform/users`
  - `PATCH /platform/users/:userId/platform-admin`
- Added frontend platform dashboard route:
  - `/platform`
  - Protected by `isPlatformAdmin` from `/auth/me`.

Notes:

- `PLATFORM_ADMIN_EMAILS` is retained as bootstrap fallback.
- Run migration + Prisma generate before production use.

## Superadmin Phase 2 (Realistic Dynamic Control)

Implemented:

- Club subscription controls are now DB-backed:
  - `subscriptionStatus`: `TRIAL` | `ACTIVE` | `PAST_DUE` | `CANCELED`
  - `subscriptionMonthlyPrice`
  - `subscriptionStartAt`
  - `subscriptionNextBillingAt`
- Club role matrix is now DB-backed per club (`ClubRoleSetting`).
  - Superadmin can enable/disable each primary role + subrole for each club.
- Backend enforcement added:
  - Club APIs guarded by `PermissionsGuard` now block club access if:
    - club is deactivated
    - subscription is `PAST_DUE` or `CANCELED`
  - Role assignment and invitations now reject disabled role keys.
- Platform APIs added:
  - `GET /platform/clubs/:clubId/roles`
  - `PATCH /platform/clubs/:clubId/roles/:roleKey`
