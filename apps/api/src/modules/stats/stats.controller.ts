import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { StatsService } from './stats.service';
import { DateRangeQueryDto, LeaderboardQueryDto } from './dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@UseGuards(JwtAuthGuard)
@Controller('clubs/:clubId/stats')
export class StatsController {
  constructor(private stats: StatsService) {}

  // ✅ ADMIN/MANAGER recompute (service enforces role)
  @Post('matches/:matchId/recompute')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stats.recompute')
  async recompute(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('matchId') matchId: string,
  ) {
    const userId = req.user?.sub;
    const result = await this.stats.recomputeMatch(userId, clubId, matchId);
    return result;
  }

  // ✅ Match summary
  @Get('matches/:matchId/summary')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stats.read')
  async matchSummary(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('matchId') matchId: string,
  ) {
    const userId = req.user?.sub;
    const data = await this.stats.getMatchSummary(userId, clubId, matchId);
    return data;
  }

  // ✅ Player summary (optional range)
  @Get('players/:userId/summary')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stats.read')
  async playerSummary(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('userId') userId: string,
    @Query() q: DateRangeQueryDto,
  ) {
    const actorId = req.user?.sub;
    const data = await this.stats.getPlayerSummary(
      actorId,
      clubId,
      userId,
      q.from,
      q.to,
    );
    return data;
  }

  // ✅ Leaderboard
  @Get('leaderboard')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('leaderboards.read')
  async leaderboard(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Query() q: LeaderboardQueryDto,
  ) {
    const actorId = req.user?.sub;
    const metric = q.metric ?? 'goals';
    const limit = q.limit ?? 10;
    const data = await this.stats.leaderboard(actorId, clubId, metric, limit);
    return { metric, limit, leaderboard: data };
  }
}
