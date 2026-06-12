import { Router } from 'express';
import { RoleController } from './roles.controller';
import { authMiddleware, checkRole } from '../middleware/auth.middleware';

const router = Router();
const roleController = new RoleController();

router.use(authMiddleware);
router.use(checkRole(['Super Admin']));

router.get('/', roleController.getAllRoles);
router.get('/:id', roleController.getRole);
router.post('/', roleController.createRole);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

export default router;
