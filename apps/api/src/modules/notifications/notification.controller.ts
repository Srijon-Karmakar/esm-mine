import { Controller, Get, Patch, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { NotificationService } from './notification.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  list(@Req() req: any, @Query('clubId') clubId?: string) {
    const headerClubId = req.headers['x-club-id'] as string | undefined;
    return this.notifications.listForUser(req.user.sub, clubId || headerClubId);
  }

  @Patch(':id/read')
  markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.notifications.markAsRead(id, req.user.sub);
  }
}
