import { Router } from 'express';
import { PermissionController } from './permissions.controller';
import { authMiddleware, checkRole } from '../middleware/auth.middleware';

const router = Router();
const permissionController = new PermissionController();

router.use(authMiddleware);
router.use(checkRole(['Super Admin']));

router.get('/', permissionController.getAllPermissions);
router.get('/grouped', permissionController.getPermissionsByModule);
router.get('/:id', permissionController.getPermission);
router.post('/', permissionController.createPermission);
router.put('/:id', permissionController.updatePermission);
router.delete('/:id', permissionController.deletePermission);

export default router;
