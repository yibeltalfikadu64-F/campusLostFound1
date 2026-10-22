import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { updateProfileSchema, changePasswordSchema, pushTokenSchema } from '../schemas';

const router = Router();

router.use(requireAuth);

router.get('/me', (req, res, next) => userController.getMe(req, res, next));
router.patch('/me', validateBody(updateProfileSchema), (req, res, next) => userController.updateMe(req, res, next));
router.patch('/me/password', validateBody(changePasswordSchema), (req, res, next) => userController.updatePassword(req, res, next));
router.post('/me/push-token', validateBody(pushTokenSchema), (req, res, next) => userController.updatePushToken(req, res, next));
router.get('/me/items', (req, res, next) => userController.getMyItems(req, res, next));
router.get('/me/claims', (req, res, next) => userController.getMyClaims(req, res, next));

export default router;
