import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { adminService } from '../services/admin.service';
import { sendSuccess } from '../utils/response';

export class AdminController {
  async getStats(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDashboardStats();
      return sendSuccess(res, stats, 'Dashboard statistics retrieved');
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listUsers(req.query as any);
      return sendSuccess(res, result.users, 'Users retrieved', 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = await adminService.updateUserStatus(req.params.id, req.user!, req.body);
      return sendSuccess(res, updated, 'User status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async listClaims(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listAdminClaims(req.query as any);
      return sendSuccess(res, result.claims, 'Admin claims queue retrieved', 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getReports(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const result = await adminService.getAuditLogs(page, limit);
      return sendSuccess(res, result.logs, 'Audit logs retrieved', 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async moderateItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.moderateItem(req.params.id, req.user!, req.body);
      return sendSuccess(res, result, 'Item moderated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
