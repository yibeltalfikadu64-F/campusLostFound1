import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { notificationService } from '../services/notification.service';
import { sendSuccess } from '../utils/response';

export class NotificationController {
  async listNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const notifications = await notificationService.getUserNotifications(req.user!.id);
      return sendSuccess(res, notifications, 'Notifications retrieved');
    } catch (error) {
      return next(error);
    }
  }

  async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.markAsRead(req.params.id, req.user!.id);
      return sendSuccess(res, null, 'Notification marked as read');
    } catch (error) {
      return next(error);
    }
  }

  async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllAsRead(req.user!.id);
      return sendSuccess(res, null, 'All notifications marked as read');
    } catch (error) {
      return next(error);
    }
  }
}

export const notificationController = new NotificationController();

