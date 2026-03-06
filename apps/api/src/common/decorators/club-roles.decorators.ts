import { SetMetadata } from '@nestjs/common';
import { PrimaryRole } from '@prisma/client';

export const CLUB_ROLES_KEY = 'club_roles';
export const ClubRoles = (...roles: PrimaryRole[]) =>
  SetMetadata(CLUB_ROLES_KEY, roles);
