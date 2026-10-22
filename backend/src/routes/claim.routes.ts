import { Router } from 'express';
import { claimController } from '../controllers/claim.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { reviewClaimSchema, scheduleHandoverSchema } from '../schemas';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);

router.get('/mine', (req, res, next) => claimController.getMyClaims(req, res, next));
router.get('/:id', (req, res, next) => claimController.getClaimById(req, res, next));

// Staff-only endpoints
router.patch(
  '/:id/approve',
  requireRole([Role.ADMIN, Role.SECURITY_OFFICER]),
  validateBody(reviewClaimSchema),
  (req, res, next) => claimController.approveClaim(req, res, next)
);

router.patch(
  '/:id/reject',
  requireRole([Role.ADMIN, Role.SECURITY_OFFICER]),
  validateBody(reviewClaimSchema),
  (req, res, next) => claimController.rejectClaim(req, res, next)
);

router.patch(
  '/:id/handover',
  requireRole([Role.ADMIN, Role.SECURITY_OFFICER]),
  validateBody(scheduleHandoverSchema),
  (req, res, next) => claimController.scheduleHandover(req, res, next)
);

router.patch(
  '/:id/confirm-return',
  requireRole([Role.ADMIN, Role.SECURITY_OFFICER]),
  (req, res, next) => claimController.confirmReturn(req, res, next)
);

export default router;
