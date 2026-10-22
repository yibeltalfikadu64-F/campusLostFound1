import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { updateUserStatusSchema, updateItemStatusSchema } from '../schemas';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);
router.use(requireRole([Role.ADMIN, Role.SECURITY_OFFICER]));

// Real-time calculated dashboard statistics
router.get('/stats', (req, res, next) => adminController.getStats(req, res, next));

// User management (Admin only)
router.get('/users', requireRole([Role.ADMIN]), (req, res, next) => adminController.listUsers(req, res, next));
router.patch('/users/:id/status', requireRole([Role.ADMIN]), validateBody(updateUserStatusSchema), (req, res, next) => adminController.updateUserStatus(req, res, next));

// Claims administration queue
router.get('/claims', (req, res, next) => adminController.listClaims(req, res, next));

// Moderation & reports
router.get('/reports', (req, res, next) => adminController.getReports(req, res, next));
router.patch('/items/:id/moderation', validateBody(updateItemStatusSchema), (req, res, next) => adminController.moderateItem(req, res, next));

export default router;
