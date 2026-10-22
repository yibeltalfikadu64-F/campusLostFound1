import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import itemRoutes from './item.routes';
import claimRoutes from './claim.routes';
import categoryRoutes from './category.routes';
import locationRoutes from './location.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';

const router = Router();

// Health check endpoint
router.get('/health', async (_req, res) => {
  let dbStatus = 'healthy';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err: any) {
    dbStatus = `unreachable: ${err?.message || 'unknown error'}`;
  }

  return sendSuccess(res, {
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Injibara Campus Lost and Found API',
    version: '1.0.0',
    database: dbStatus
  }, 'Service healthy');
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/items', itemRoutes);
router.use('/claims', claimRoutes);
router.use('/categories', categoryRoutes);
router.use('/locations', locationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

export default router;
