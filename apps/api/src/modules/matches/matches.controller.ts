// import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
// import { JwtAuthGuard } from "../auth/jwt.guard";
// import { MatchesService } from "./matches.service";

// // IMPORTANT: import from dto folder index
// import {
//   AddMatchEventDto,
//   CreateMatchDto,
//   UpdateMatchStatusDto,
// } from "./dto";

// @UseGuards(JwtAuthGuard)
// @Controller("clubs/:clubId/matches")
// export class MatchesController {
//   constructor(private matches: MatchesService) {}

//   @Post()
//   async create(@Req() req: any, @Param("clubId") clubId: string, @Body() dto: CreateMatchDto) {
//     const userId = req.user?.sub;
//     const match = await this.matches.createMatch(userId, clubId, dto);
//     return { match };
//   }

//   @Get()
//   async list(@Req() req: any, @Param("clubId") clubId: string) {
//     const userId = req.user?.sub;
//     const matches = await this.matches.listMatches(userId, clubId);
//     return { matches };
//   }

//   @Get(":matchId")
//   async one(@Req() req: any, @Param("clubId") clubId: string, @Param("matchId") matchId: string) {
//     const userId = req.user?.sub;
//     const match = await this.matches.getMatch(userId, clubId, matchId);
//     return { match };
//   }

//   @Patch(":matchId/status")
//   async updateStatus(
//     @Req() req: any,
//     @Param("clubId") clubId: string,
//     @Param("matchId") matchId: string,
//     @Body() dto: UpdateMatchStatusDto
//   ) {
//     const userId = req.user?.sub;
//     const match = await this.matches.updateStatus(userId, clubId, matchId, dto);
//     return { match };
//   }

//   @Post(":matchId/events")
//   async addEvent(
//     @Req() req: any,
//     @Param("clubId") clubId: string,
//     @Param("matchId") matchId: string,
//     @Body() dto: AddMatchEventDto
//   ) {
//     const userId = req.user?.sub;
//     const event = await this.matches.addEvent(userId, clubId, matchId, dto);
//     return { event };
//   }
// }

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt.guard';
// import { RolesGuard } from "../auth/roles.guard";
// import { Roles } from "../auth/roles.decorator";
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

import { MatchesService } from './matches.service';

// DTO imports (from index.ts inside dto folder)
import {
  AddMatchEventDto,
  CreateMatchDto,
  UpdateMatchStatusDto,
  SetLineupDto,
  UpdateMatchSquadDto,
} from './dto';

@UseGuards(JwtAuthGuard) // Applied to entire controller
@Controller('clubs/:clubId/matches')
export class MatchesController {
  constructor(private matches: MatchesService) {}

  /* ============================================================
     MATCH CRUD
  ============================================================ */

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('matches.write')
  async create(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Body() dto: CreateMatchDto,
  ) {
    const userId = req.user?.sub;
    const match = await this.matches.createMatch(userId, clubId, dto);
    return { match };
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('matches.read')
  async list(@Req() req: any, @Param('clubId') clubId: string) {
    const userId = req.user?.sub;
    const matches = await this.matches.listMatches(userId, clubId);
    return { matches };
  }

  @Get(':matchId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('matches.read')
  async one(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('matchId') matchId: string,
  ) {
    const userId = req.user?.sub;
    const match = await this.matches.getMatch(userId, clubId, matchId);
    return { match };
  }

  @Patch(':matchId/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('matches.write')
  async updateStatus(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('matchId') matchId: string,
    @Body() dto: UpdateMatchStatusDto,
  ) {
    const userId = req.user?.sub;
    const match = await this.matches.updateStatus(userId, clubId, matchId, dto);
    return { match };
  }

  /* ============================================================
     MATCH EVENTS
  ============================================================ */

  @Post(':matchId/events')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('matches.write')
  async addEvent(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('matchId') matchId: string,
    @Body() dto: AddMatchEventDto,
  ) {
    const userId = req.user?.sub;
    const event = await this.matches.addEvent(userId, clubId, matchId, dto);
    return { event };
  }

  /* ============================================================
     LINEUPS
  ============================================================ */

  @Patch(':matchId/squad')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('lineups.write')
  async updateMatchSquad(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('matchId') matchId: string,
    @Body() dto: UpdateMatchSquadDto,
  ) {
    const match = await this.matches.updateMatchSquad(
      req.user.sub,
      clubId,
      matchId,
      dto,
    );
    return { match };
  }

  @Get(':matchId/lineup/workspace')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('lineups.read')
  async getLineupWorkspace(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('matchId') matchId: string,
  ) {
    return this.matches.getLineupWorkspace(req.user.sub, clubId, matchId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('lineups.write')
  @Put(':matchId/lineup/home')
  async setHomeLineup(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('matchId') matchId: string,
    @Body() dto: SetLineupDto,
  ) {
    return this.matches.setLineup(req.user.sub, clubId, matchId, 'HOME', dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('lineups.write')
  @Put(':matchId/lineup/away')
  async setAwayLineup(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('matchId') matchId: string,
    @Body() dto: SetLineupDto,
  ) {
    return this.matches.setLineup(req.user.sub, clubId, matchId, 'AWAY', dto);
  }

  @Get(':matchId/lineup')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('lineups.read')
  async getLineup(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('matchId') matchId: string,
  ) {
    return this.matches.getLineup(req.user.sub, clubId, matchId);
  }
}
