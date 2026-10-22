import { NotificationType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

export class NotificationService {
  async createNotification(params: {
    userId: string;
    title: string;
    body: string;
    type?: NotificationType;
    relatedItemId?: string;
    relatedClaimId?: string;
  }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: params.userId,
          title: params.title,
          body: params.body,
          type: params.type || NotificationType.SYSTEM,
          relatedItemId: params.relatedItemId,
          relatedClaimId: params.relatedClaimId
        }
      });

      // If user has pushToken, log push notification readiness
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { pushToken: true }
      });

      if (user?.pushToken) {
        logger.info(`[Push Notification Dispatch Ready] Device: ${user.pushToken} | Title: ${params.title}`);
      }

      return notification;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      return null;
    }
  }

  async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true }
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }
}

export const notificationService = new NotificationService();
