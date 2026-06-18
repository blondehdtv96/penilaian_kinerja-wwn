import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authMiddleware, checkRole } from '../middleware/auth.middleware';

const router = Router();
const controller = new DashboardController();

router.use(authMiddleware);

router.get('/kpi', checkRole(['Section Manager']), controller.getKPI);
router.get('/export/pdf', checkRole(['Section Manager']), controller.exportPDF);
router.get('/export/excel', checkRole(['Section Manager']), controller.exportExcel);

export default router;
