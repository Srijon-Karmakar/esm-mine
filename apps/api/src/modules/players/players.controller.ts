import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PlayersService } from './players.service';
import { UpsertPlayerProfileDto } from './dto';

import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class PlayersController {
  constructor(private players: PlayersService) {}

  // Player creates/updates their own profile
  @Patch('players/me')
  async upsertMe(@Req() req: any, @Body() dto: UpsertPlayerProfileDto) {
    const userId = req.user?.sub;
    return { profile: await this.players.upsertMyProfile(userId, dto) };
  }

  // Get own profile
  @Get('players/me')
  async me(@Req() req: any) {
    const userId = req.user?.sub;
    return { profile: await this.players.getMe(userId) };
  }

  // Club list players (ADMIN/MANAGER)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('players.read')
  @Get('clubs/:clubId/players')
  async clubPlayers(@Req() req: any, @Param('clubId') clubId: string) {
    return {
      players: await this.players.listClubPlayers(req.user?.sub, clubId),
    };
  }
}
