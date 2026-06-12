import { Router } from 'express';
import { MisconductController } from './misconduct.controller';
import { authMiddleware, checkRole } from '../middleware/auth.middleware';

const router = Router();
const misconductController = new MisconductController();

router.use(authMiddleware);

router.post('/', checkRole(['Foreman']), misconductController.createMisconduct);
router.put('/:id/approve', checkRole(['Staff Produksi']), misconductController.approveMisconduct);
router.put('/:id/reject', checkRole(['Staff Produksi']), misconductController.rejectMisconduct);
router.get('/operator/:operatorId', misconductController.getMisconductsByOperator);
router.get('/', checkRole(['Staff Produksi', 'Foreman', 'Operator']), misconductController.getAllMisconducts);

export default router;
