import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { SquadsService } from './squads.service';
import { AddSquadMemberDto, CreateSquadDto } from './dto';

@UseGuards(JwtAuthGuard)
@Controller('clubs/:clubId/squads')
export class SquadsController {
  constructor(private squads: SquadsService) {}

  // Any club member can list squads (service checks membership)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('squads.read')
  @Get()
  async list(@Req() req: any, @Param('clubId') clubId: string) {
    return { squads: await this.squads.listSquads(req.user?.sub, clubId) };
  }

  // Any club member can view a squad
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('squads.read')
  @Get(':squadId')
  async one(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('squadId') squadId: string,
  ) {
    return {
      squad: await this.squads.getSquad(req.user?.sub, clubId, squadId),
    };
  }

  // ADMIN/MANAGER can create squads
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('squads.write')
  @Post()
  async create(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Body() dto: CreateSquadDto,
  ) {
    return { squad: await this.squads.createSquad(req.user?.sub, clubId, dto) };
  }

  // ADMIN/MANAGER can add members
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('squads.write')
  @Post(':squadId/members')
  async addMember(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('squadId') squadId: string,
    @Body() dto: AddSquadMemberDto,
  ) {
    return {
      member: await this.squads.addMember(req.user?.sub, clubId, squadId, dto),
    };
  }

  // ADMIN/MANAGER can remove members
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('squads.write')
  @Delete(':squadId/members/:userId')
  async removeMember(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('squadId') squadId: string,
    @Param('userId') userId: string,
  ) {
    return await this.squads.removeMember(
      req.user?.sub,
      clubId,
      squadId,
      userId,
    );
  }
}
