import { SetMetadata } from '@nestjs/common';
import type { RolePermission } from '../types/role-policy';

export const PERMISSIONS_KEY = 'permissions';

export const Permissions = (...permissions: RolePermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
