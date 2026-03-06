import { Global, Module } from '@nestjs/common';
import { ClubRolesGuard } from './guards/club-roles.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { PlatformAdminGuard } from './guards/platform-admin.guard';

@Global()
@Module({
  providers: [ClubRolesGuard, RolesGuard, PermissionsGuard, PlatformAdminGuard],
  exports: [ClubRolesGuard, RolesGuard, PermissionsGuard, PlatformAdminGuard],
})
export class AuthorizationModule {}
