import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { categorySchema } from '../schemas';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', (req, res, next) => categoryController.listCategories(req, res, next));

router.post(
  '/',
  requireAuth,
  requireRole([Role.ADMIN]),
  validateBody(categorySchema),
  (req, res, next) => categoryController.createCategory(req, res, next)
);

router.patch(
  '/:id',
  requireAuth,
  requireRole([Role.ADMIN]),
  validateBody(categorySchema.partial()),
  (req, res, next) => categoryController.updateCategory(req, res, next)
);

router.delete(
  '/:id',
  requireAuth,
  requireRole([Role.ADMIN]),
  (req, res, next) => categoryController.deleteCategory(req, res, next)
);

export default router;
