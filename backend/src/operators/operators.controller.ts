import { Request, Response } from 'express';
import { OperatorService } from './operators.service';

const service = new OperatorService();

export class OperatorController {
  getAll = async (req: Request, res: Response) => {
    try {
      const result = await service.getAll(req.query as any);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const result = await service.getById(parseInt(req.params.id));
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getMyProfile = async (req: any, res: Response) => {
    try {
      const result = await service.getByUserId(req.user.userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  scanQR = async (req: any, res: Response) => {
    try {
      const { qrData } = req.body;
      const result = await service.scanQR(qrData, req.user.userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  getRanking = async (req: Request, res: Response) => {
    try {
      const result = await service.getRanking(req.query.section as string);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
