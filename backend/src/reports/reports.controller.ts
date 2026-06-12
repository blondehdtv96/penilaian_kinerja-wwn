import { Request, Response } from 'express';
import { ReportService } from './reports.service';

export class ReportController {
  private reportService = new ReportService();

  getOperatorPerformanceReport = async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      const report = await this.reportService.getOperatorPerformanceReport(filters);

      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  getMeritMisconductReport = async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      const report = await this.reportService.getMeritMisconductReport(filters);

      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  getDepartmentReport = async (req: Request, res: Response) => {
    try {
      const report = await this.reportService.getDepartmentReport();

      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  getBlockchainAuditReport = async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      const report = await this.reportService.getBlockchainAuditReport(filters);

      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
}
