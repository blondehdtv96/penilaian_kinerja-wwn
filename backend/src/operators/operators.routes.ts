import { Router } from 'express';
import { OperatorController } from './operators.controller';
import { authMiddleware, checkRole } from '../middleware/auth.middleware';

const router = Router();
const operatorController = new OperatorController();

router.use(authMiddleware);

router.post('/', checkRole(['Super Admin', 'Staff Produksi']), operatorController.createOperator);
router.get('/', operatorController.getAllOperators);
router.get('/ranking', operatorController.getOperatorRanking);
router.get('/:id', operatorController.getOperator);
router.get('/employee/:employeeId', operatorController.getOperatorByEmployeeId);
router.put('/:id', checkRole(['Super Admin', 'Staff Produksi']), operatorController.updateOperator);
router.delete('/:id', checkRole(['Super Admin']), operatorController.deleteOperator);

export default router;
