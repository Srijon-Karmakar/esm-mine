import { SetMetadata } from '@nestjs/common';
import { PrimaryRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: PrimaryRole[]) => SetMetadata(ROLES_KEY, roles);
