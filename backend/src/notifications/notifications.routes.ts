import { Router } from 'express';
import { NotificationController } from './notifications.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const controller = new NotificationController();

router.use(authMiddleware);
router.get('/', controller.list);
router.patch('/:id/read', controller.markRead);
router.post('/read-all', controller.markAllRead);

export default router;
