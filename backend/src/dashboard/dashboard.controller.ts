import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';

export class DashboardController {
  private dashboardService = new DashboardService();

  getKPIDashboard = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const roles: string[] = user?.roles || [];

      // Operators and Supervisors see their personal dashboard
      const isManagement = roles.some(r =>
        ['Super Admin', 'HRD', 'Manager'].includes(r)
      );

      let dashboard;
      if (isManagement) {
        dashboard = await this.dashboardService.getKPIDashboard();
      } else {
        // Operator / Supervisor: return personal stats
        dashboard = await this.dashboardService.getOperatorPersonalDashboard(user.userId);
      }

      res.json({
        success: true,
        data: dashboard
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  getPerformanceChart = async (req: Request, res: Response) => {
    try {
      const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'daily';
      const chart = await this.dashboardService.getPerformanceChart(period);

      res.json({
        success: true,
        data: chart
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
}
