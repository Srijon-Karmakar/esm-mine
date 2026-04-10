import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type NotificationPayload = {
  clubId: string;
  userId: string;
  title: string;
  body: string;
  link?: string | null;
  scheduleEventId?: string | null;
};

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: NotificationPayload) {
    return this.prisma.notification.create({
      data: payload,
    });
  }

  async listForUser(userId: string, clubId?: string) {
    const where: Record<string, any> = { userId };
    if (clubId) where.clubId = clubId;

    const [notifications, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 16,
      }),
      this.prisma.notification.count({
        where: { ...where, isRead: false },
      }),
    ]);

    return { notifications, unreadCount };
  }

  async markAsRead(id: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }
}
