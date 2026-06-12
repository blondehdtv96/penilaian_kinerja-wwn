import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const dashboardController = new DashboardController();

// All authenticated users can access dashboard — role-based filtering done in controller
router.use(authMiddleware);

router.get('/kpi', dashboardController.getKPIDashboard);
router.get('/performance-chart', dashboardController.getPerformanceChart);

export default router;
