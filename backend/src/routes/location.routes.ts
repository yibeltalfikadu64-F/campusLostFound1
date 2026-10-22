import { Router } from 'express';
import { locationController } from '../controllers/location.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { locationSchema } from '../schemas';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', (req, res, next) => locationController.listLocations(req, res, next));

router.post(
  '/',
  requireAuth,
  requireRole([Role.ADMIN]),
  validateBody(locationSchema),
  (req, res, next) => locationController.createLocation(req, res, next)
);

router.patch(
  '/:id',
  requireAuth,
  requireRole([Role.ADMIN]),
  validateBody(locationSchema.partial()),
  (req, res, next) => locationController.updateLocation(req, res, next)
);

router.delete(
  '/:id',
  requireAuth,
  requireRole([Role.ADMIN]),
  (req, res, next) => locationController.deleteLocation(req, res, next)
);

export default router;
