import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PlatformAdminGuard } from '../../common/guards/platform-admin.guard';
import { PlatformService } from './platform.service';
import {
  UpdatePlatformAdminDto,
  UpdatePlatformClubDto,
  UpdateRoleSettingDto,
} from './dto';

@Controller('platform')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class PlatformController {
  constructor(private platform: PlatformService) {}

  @Get('overview')
  overview() {
    return this.platform.overview();
  }

  @Get('clubs')
  clubs() {
    return this.platform.clubs();
  }

  @Patch('clubs/:clubId')
  updateClub(
    @Param('clubId') clubId: string,
    @Body() dto: UpdatePlatformClubDto,
  ) {
    return this.platform.updateClub(clubId, dto);
  }

  @Get('clubs/:clubId/roles')
  roleMatrix(@Param('clubId') clubId: string) {
    return this.platform.roleMatrix(clubId);
  }

  @Patch('clubs/:clubId/roles/:roleKey')
  updateRoleSetting(
    @Param('clubId') clubId: string,
    @Param('roleKey') roleKey: string,
    @Body() dto: UpdateRoleSettingDto,
  ) {
    return this.platform.updateRoleSetting(clubId, roleKey, dto);
  }

  @Get('users')
  users() {
    return this.platform.users();
  }

  @Patch('users/:userId/platform-admin')
  updatePlatformAdmin(
    @Param('userId') userId: string,
    @Body() dto: UpdatePlatformAdminDto,
  ) {
    return this.platform.updatePlatformAdmin(userId, dto);
  }
}
