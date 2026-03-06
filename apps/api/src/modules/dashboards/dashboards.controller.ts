import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { DashboardsService } from './dashboards.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardsController {
  constructor(private dashboards: DashboardsService) {}

  @Get('overview')
  overview(
    @Req() req: any,
    @Query('clubId') clubId?: string,
    @Query('as') asRole?: string,     // optional: COACH/PHYSIO/etc
  ) {
    const clubIdFromHeader = req.headers['x-club-id'] as string | undefined;
    return this.dashboards.overview(req.user.sub, clubIdFromHeader || clubId, asRole);
  }

  @Get('charts')
  charts(
    @Req() req: any,
    @Query('clubId') clubId?: string,
    @Query('range') range: string = '30d',
    @Query('as') asRole?: string,
  ) {
    const clubIdFromHeader = req.headers['x-club-id'] as string | undefined;
    return this.dashboards.charts(req.user.sub, clubIdFromHeader || clubId, range, asRole);
  }

  @Get('recent')
  recent(
    @Req() req: any,
    @Query('clubId') clubId?: string,
    @Query('limit') limit: string = '10',
    @Query('as') asRole?: string,
  ) {
    const clubIdFromHeader = req.headers['x-club-id'] as string | undefined;
    return this.dashboards.recent(req.user.sub, clubIdFromHeader || clubId, Number(limit), asRole);
  }
}