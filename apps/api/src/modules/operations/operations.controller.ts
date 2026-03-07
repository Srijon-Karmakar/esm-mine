import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { OperationsService } from './operations.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  CreateMessageDto,
  CreateTaskDto,
  UpdateMessageDto,
  UpdateTaskDto,
} from './dto';

@Controller('clubs/:clubId/operations')
@UseGuards(JwtAuthGuard)
export class OperationsController {
  constructor(private operations: OperationsService) {}

  @Get('training')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('operations.read')
  training(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Query('range') range: string = '30d',
  ) {
    return this.operations.training(req.user.sub, clubId, range);
  }

  @Get('tasks')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('operations.read')
  tasks(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Query('limit') limit: string = '20',
  ) {
    return this.operations.tasks(req.user.sub, clubId, Number(limit));
  }

  @Post('tasks')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('operations.write')
  createTask(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.operations.createTask(req.user.sub, clubId, dto);
  }

  @Patch('tasks/:taskId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('operations.write')
  updateTask(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.operations.updateTask(req.user.sub, clubId, taskId, dto);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('operations.read')
  feed(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Query('limit') limit: string = '30',
  ) {
    return this.operations.feed(req.user.sub, clubId, Number(limit));
  }

  @Get('messages')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('membership.self.read')
  messages(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Query('limit') limit: string = '30',
    @Query('includeArchived') includeArchived: string = 'false',
  ) {
    return this.operations.messages(
      req.user.sub,
      clubId,
      Number(limit),
      String(includeArchived).toLowerCase() === 'true',
    );
  }

  @Post('messages')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('operations.write')
  createMessage(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.operations.createMessage(req.user.sub, clubId, dto);
  }

  @Patch('messages/:messageId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('operations.write')
  updateMessage(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.operations.updateMessage(req.user.sub, clubId, messageId, dto);
  }
}
