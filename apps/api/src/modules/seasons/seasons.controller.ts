import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { SeasonsService } from './seasons.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

import {
  AddSeasonTeamDto,
  CreateSeasonDto,
  LinkSeasonMatchDto,
  CreateSeasonTeamDto,
} from './dto';

@UseGuards(JwtAuthGuard)
@Controller('clubs/:clubId/seasons')
export class SeasonsController {
  constructor(private seasons: SeasonsService) {}

  /* ============================================================
     SEASON CRUD
  ============================================================ */

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('seasons.write')
  create(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Body() dto: CreateSeasonDto,
  ) {
    return this.seasons.createSeason(req.user.sub, clubId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('seasons.read')
  list(@Req() req: any, @Param('clubId') clubId: string) {
    return this.seasons.listSeasons(req.user.sub, clubId);
  }

  @Get(':seasonId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('seasons.read')
  one(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('seasonId') seasonId: string,
  ) {
    return this.seasons.getSeason(req.user.sub, clubId, seasonId);
  }

  /* ============================================================
     SEASON TEAMS
  ============================================================ */

  @Post(':seasonId/teams')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('seasons.write')
  addTeam(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('seasonId') seasonId: string,
    // @Body() dto: AddSeasonTeamDto | CreateSeasonTeamDto
    @Body() dto: CreateSeasonTeamDto,
  ) {
    return this.seasons.addTeam(req.user.sub, clubId, seasonId, dto);
  }

  @Get(':seasonId/teams')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('seasons.read')
  listTeams(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('seasonId') seasonId: string,
  ) {
    return this.seasons.listTeams(req.user.sub, clubId, seasonId);
  }

  /* ============================================================
     MATCH LINKING
  ============================================================ */

  @Post(':seasonId/link-match')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('seasons.write')
  linkMatch(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('seasonId') seasonId: string,
    @Body() dto: LinkSeasonMatchDto,
  ) {
    return this.seasons.linkMatch(req.user.sub, clubId, seasonId, dto);
  }

  /* ============================================================
     STANDINGS
  ============================================================ */

  @Get(':seasonId/standings')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('seasons.read')
  standings(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('seasonId') seasonId: string,
  ) {
    return this.seasons.standingsForSeason(req.user.sub, clubId, seasonId);
  }

  @Post(':seasonId/recompute-standings')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('seasons.write')
  recompute(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('seasonId') seasonId: string,
  ) {
    return this.seasons.recomputeStandings(req.user.sub, clubId, seasonId);
  }
}
