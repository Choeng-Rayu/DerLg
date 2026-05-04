import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(userId: string, page = 1, perPage = 20) {
    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      items: notifications,
      unreadCount,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async createNotification(data: {
    userId: string;
    type: string;
    channel: string;
    title: string;
    body: string;
    data?: any;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as any,
        channel: data.channel as any,
        title: data.title,
        body: data.body,
        data: data.data || null,
        sentAt: new Date(),
      },
    });

    // TODO: Push via FCM/APNs/Email based on channel

    return notification;
  }
}
