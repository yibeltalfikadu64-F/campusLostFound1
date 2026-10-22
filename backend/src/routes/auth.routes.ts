import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema, refreshSchema } from '../schemas';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), (req, res, next) => authController.register(req, res, next));
router.post('/login', authLimiter, validateBody(loginSchema), (req, res, next) => authController.login(req, res, next));
router.post('/refresh', validateBody(refreshSchema), (req, res, next) => authController.refresh(req, res, next));
router.post('/logout', (req, res, next) => authController.logout(req, res, next));

export default router;
