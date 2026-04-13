import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PlayersService } from './players.service';
import {
  CreatePlayerTrainingLoadDto,
  UpdateMyPlayerHealthDto,
  UpsertPlayerProfileDto,
} from './dto';

import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class PlayersController {
  constructor(private players: PlayersService) {}

  // Player can only update self-reported health data
  @Patch('players/me')
  async updateMyHealth(@Req() req: any, @Body() dto: UpdateMyPlayerHealthDto) {
    const userId = req.user?.sub;
    const clubId =
      (req.headers['x-club-id'] as string | undefined) || req.query?.clubId;
    return {
      profile: await this.players.updateMyHealthProfile(userId, clubId, dto),
    };
  }

  // Get own profile
  @Get('players/me')
  async me(@Req() req: any) {
    const userId = req.user?.sub;
    return { profile: await this.players.getMe(userId) };
  }

  @Get('players/me/history')
  async myHistory(
    @Req() req: any,
    @Query('range') range: string = '30d',
    @Query('clubId') clubId?: string,
  ) {
    const userId = req.user?.sub;
    const clubIdFromHeader = req.headers['x-club-id'] as string | undefined;
    return this.players.getMyHistory(userId, clubIdFromHeader || clubId, range);
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

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('players.write')
  @Patch('clubs/:clubId/players/:userId/profile')
  async updateClubPlayerProfile(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('userId') userId: string,
    @Body() dto: UpsertPlayerProfileDto,
  ) {
    return {
      profile: await this.players.updateClubPlayerProfile(
        req.user?.sub,
        clubId,
        userId,
        dto,
      ),
    };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('players.read')
  @Get('clubs/:clubId/players/:userId/training-loads')
  async playerTrainingLoads(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('userId') userId: string,
    @Query('range') range: string = '30d',
  ) {
    return {
      entries: await this.players.listPlayerTrainingLoads(
        req.user?.sub,
        clubId,
        userId,
        range,
      ),
    };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('players.write')
  @Post('clubs/:clubId/players/:userId/training-loads')
  async createPlayerTrainingLoad(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('userId') userId: string,
    @Body() dto: CreatePlayerTrainingLoadDto,
  ) {
    return {
      entry: await this.players.createPlayerTrainingLoad(
        req.user?.sub,
        clubId,
        userId,
        dto,
      ),
    };
  }
}
