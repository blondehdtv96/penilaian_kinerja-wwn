import { Request, Response } from 'express';
import { StaffProduksiService } from './staff-produksi.service';

export class StaffProduksiController {
  private service = new StaffProduksiService();

  getAllOperators = async (req: Request, res: Response) => {
    try {
      const operators = await this.service.getAllOperators();
      res.json({ success: true, data: operators });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  createOperator = async (req: Request, res: Response) => {
    try {
      const operator = await this.service.createOperator(req.body);
      res.status(201).json({ success: true, data: operator });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  updateOperator = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const operator = await this.service.updateOperator(id, req.body);
      res.json({ success: true, data: operator });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  deleteOperator = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await this.service.deleteOperator(id);
      res.json({ success: true, message: 'Operator deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  toggleStatus = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const operator = await this.service.toggleStatus(id);
      res.json({ success: true, data: operator });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { newPassword } = req.body;
      await this.service.resetPassword(id, newPassword);
      res.json({ success: true, message: 'Password reset successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
}
