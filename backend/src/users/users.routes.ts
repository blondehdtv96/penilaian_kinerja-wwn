import { Router } from 'express';
import { UserController } from './users.controller';
import { authMiddleware, checkRole } from '../middleware/auth.middleware';

const router = Router();
const userController = new UserController();

router.use(authMiddleware);
router.use(checkRole(['Super Admin']));

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUser);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.patch('/:id/toggle-status', userController.toggleStatus);
router.delete('/:id', userController.deleteUser);

export default router;
