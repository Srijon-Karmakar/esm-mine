# Invitation Architecture

## Goals
- Prevent global signup queue leakage across clubs.
- Keep invitation assignment auditable and role-safe.
- Support both invite-link onboarding and in-app assignment acceptance.
- Scale to large user volumes with predictable query cost.

## Current Flows

### 1) Club-Managed Assignment Flow (Primary)
1. User signs up and gets a platform account (no club membership yet).
2. Club admin opens `Signup Intake Queue`.
3. Backend returns paginated pending users with `scope=CLUB` by default.
4. Admin assigns role/sub-roles and sends assignment.
5. User logs in, sees assignment in onboarding, and accepts.
6. Membership is created/upserted and active invites are marked used.

### 2) Token Invite Flow (Secondary)
1. Admin invites by email.
2. Backend issues token + expiry and generates accept link.
3. User opens `/invitations/accept?token=...`, validates token, sets password/profile.
4. Membership is created/upserted and invite is marked used.

## Queue Access Model
- `scope=CLUB` (default): only users currently tied to that club's active pending assignments.
- `scope=GLOBAL`: explicit admin lookup for unassigned users, requires a search query (`q`) with minimum length.
- Both scopes are paginated (`page`, `pageSize`) and return metadata.

## Data/Domain Rules
- One user can belong to only one club at a time.
- Invite acceptance is blocked if user already belongs to another club.
- Assignment ownership is enforced by `userId` (fallback to email for legacy rows).
- Role/sub-role assignment is validated against club/superadmin role policy.

## Recommended Delivery Channels
- In-app inbox/onboarding list (already implemented).
- Email delivery for token invites (recommended next if SMTP/provider not wired).
- Optional realtime event/notification stream for assignment created/revoked/accepted.

## Recommended Next Step (Product-Level)
Introduce `ClubJoinRequest` so queue membership is intent-based:
- User submits join request to a specific club (by slug/link/code).
- Admin queue becomes strictly request-driven (no global user visibility by default).
- Global lookup remains an explicit, permissioned fallback path.
