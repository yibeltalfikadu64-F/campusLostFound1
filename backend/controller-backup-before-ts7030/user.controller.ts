import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/response';

export class UserController {
  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.getMe(req.user!.id);
      return sendSuccess(res, user, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = await userService.updateProfile(req.user!.id, req.body);
      return sendSuccess(res, updated, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updatePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await userService.changePassword(req.user!.id, currentPassword, newPassword);
      return sendSuccess(res, result, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  async updatePushToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { pushToken } = req.body;
      const result = await userService.updatePushToken(req.user!.id, pushToken);
      return sendSuccess(res, result, 'Push token registered');
    } catch (error) {
      next(error);
    }
  }

  async getMyItems(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const items = await userService.getMyItems(req.user!.id);
      return sendSuccess(res, items, 'Reported items retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getMyClaims(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const claims = await userService.getMyClaims(req.user!.id);
      return sendSuccess(res, claims, 'Submitted claims retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
