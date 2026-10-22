import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res, next) => notificationController.listNotifications(req, res, next));
router.patch('/read-all', (req, res, next) => notificationController.markAllAsRead(req, res, next));
router.patch('/:id/read', (req, res, next) => notificationController.markAsRead(req, res, next));

export default router;
