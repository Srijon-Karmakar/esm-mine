import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { LeaderboardsService } from './leaderboards.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@UseGuards(JwtAuthGuard)
@Controller('clubs/:clubId/leaderboards')
export class LeaderboardsController {
  constructor(private leaderboards: LeaderboardsService) {}

  @Get('top-scorers')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('leaderboards.read')
  topScorers(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Query('seasonId') seasonId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.leaderboards.topScorers(
      req.user.sub,
      clubId,
      seasonId,
      limit ? Number(limit) : 10,
    );
  }

  @Get('top-assists')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('leaderboards.read')
  topAssists(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Query('seasonId') seasonId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.leaderboards.topAssists(
      req.user.sub,
      clubId,
      seasonId,
      limit ? Number(limit) : 10,
    );
  }

  @Get('most-minutes')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('leaderboards.read')
  mostMinutes(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Query('seasonId') seasonId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.leaderboards.mostMinutes(
      req.user.sub,
      clubId,
      seasonId,
      limit ? Number(limit) : 10,
    );
  }
}
