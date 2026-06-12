import { Router } from 'express';
import { ReportController } from './reports.controller';
import { authMiddleware, checkRole } from '../middleware/auth.middleware';

const router = Router();
const reportController = new ReportController();

router.use(authMiddleware);
router.use(checkRole(['Staff Produksi', 'Super Admin']));

router.get('/operator-performance', reportController.getOperatorPerformanceReport);
router.get('/merit-misconduct', reportController.getMeritMisconductReport);
router.get('/department', reportController.getDepartmentReport);
router.get('/blockchain-audit', reportController.getBlockchainAuditReport);

export default router;
