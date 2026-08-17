import { Router } from 'express';
import { StaffProduksiController } from './staff-produksi.controller';
import { authMiddleware, checkRole } from '../middleware/auth.middleware';

const router = Router();
const controller = new StaffProduksiController();

// All routes require authentication and Staff Produksi role
// (Super Admin bypasses checkRole automatically, see auth.middleware.ts)
router.use(authMiddleware);
router.use(checkRole(['Staff Produksi']));

// ============================================================
// OPERATOR USER MANAGEMENT
// ============================================================
router.get('/operators', controller.getAllOperators);
router.post('/operators', controller.createOperator);
router.put('/operators/:id', controller.updateOperator);
router.delete('/operators/:id', controller.deleteOperator);
router.patch('/operators/:id/toggle-status', controller.toggleStatus);
router.post('/operators/:id/reset-password', controller.resetPassword);

export default router;
