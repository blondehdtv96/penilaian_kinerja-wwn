import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/audit.middleware';

const router = Router();
const authController = new AuthController();

// Login isn't wrapped in auditLog: it runs pre-authMiddleware (no req.user yet, so
// the generic middleware would log userId 0), and AuthService.login() records its
// own LOGIN event with the real user id instead (see auth.service.ts).
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.me);
router.patch('/profile', authMiddleware, auditLog('auth'), authController.updateProfile);

export default router;
