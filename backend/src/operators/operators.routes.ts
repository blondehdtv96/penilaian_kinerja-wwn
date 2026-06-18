import { Router } from 'express';
import { OperatorController } from './operators.controller';
import { authMiddleware, checkRole } from '../middleware/auth.middleware';

const router = Router();
const controller = new OperatorController();

router.use(authMiddleware);

router.get('/ranking', checkRole(['Section Manager', 'Foreman']), controller.getRanking);
router.get('/my-profile', checkRole(['Operator']), controller.getMyProfile);
router.post('/scan-qr', controller.scanQR);
router.get('/:id', checkRole(['Section Manager', 'Foreman']), controller.getById);
router.get('/', checkRole(['Section Manager', 'Foreman']), controller.getAll);

export default router;
