import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ScheduleService } from './schedule.service';
import { CreateScheduleEventDto } from './dto/create-schedule-event.dto';

@Controller('clubs/:clubId/schedule')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  list(@Req() req: any, @Param('clubId') clubId: string) {
    return this.scheduleService.listScheduleEvents(req.user.sub, clubId);
  }

  @Post()
  create(@Req() req: any, @Param('clubId') clubId: string, @Body() dto: CreateScheduleEventDto) {
    return this.scheduleService.createScheduleEvent(req.user.sub, clubId, dto);
  }
}
