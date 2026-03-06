import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { OpponentsService } from './opponents.service';
import { CreateOpponentDto, UpdateOpponentDto } from './dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@UseGuards(JwtAuthGuard)
@Controller('clubs/:clubId/opponents')
export class OpponentsController {
  constructor(private opponents: OpponentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('opponents.write')
  create(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Body() dto: CreateOpponentDto,
  ) {
    return this.opponents.create(req.user.sub, clubId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('opponents.read')
  list(@Req() req: any, @Param('clubId') clubId: string) {
    return this.opponents.list(req.user.sub, clubId);
  }

  @Patch(':opponentId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('opponents.write')
  update(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('opponentId') opponentId: string,
    @Body() dto: UpdateOpponentDto,
  ) {
    return this.opponents.update(req.user.sub, clubId, opponentId, dto);
  }

  @Delete(':opponentId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('opponents.write')
  remove(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('opponentId') opponentId: string,
  ) {
    return this.opponents.remove(req.user.sub, clubId, opponentId);
  }
}
