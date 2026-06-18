import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';

const service = new DashboardService();

export class DashboardController {
  getKPI = async (req: Request, res: Response) => {
    try {
      const result = await service.getKPI();
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  exportPDF = async (req: Request, res: Response) => {
    try {
      const data = await service.exportPDF();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  exportExcel = async (req: Request, res: Response) => {
    try {
      const workbook = await service.exportExcel();
      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=performance_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
      res.send(Buffer.from(buffer as ArrayBuffer));
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
