import { Router } from 'express';
import { MeritController } from './merit.controller';
import { authMiddleware, checkRole } from '../middleware/auth.middleware';

const router = Router();
const meritController = new MeritController();

router.use(authMiddleware);

router.post('/', checkRole(['Foreman']), meritController.createMerit);
router.put('/:id/approve', checkRole(['Staff Produksi']), meritController.approveMerit);
router.put('/:id/reject', checkRole(['Staff Produksi']), meritController.rejectMerit);
router.get('/operator/:operatorId', meritController.getMeritsByOperator);
router.get('/', checkRole(['Staff Produksi', 'Foreman', 'Operator']), meritController.getAllMerits);

export default router;
