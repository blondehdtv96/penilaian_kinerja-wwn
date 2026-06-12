import { Request, Response } from 'express';
import { MisconductService } from './misconduct.service';
import { z } from 'zod';

const createMisconductSchema = z.object({
  operatorId: z.number(),
  productionLineId: z.number(),
  misconductType: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  points: z.number().positive(),
  description: z.string()
});

export class MisconductController {
  private misconductService = new MisconductService();

  createMisconduct = async (req: Request, res: Response) => {
    try {
      const data = createMisconductSchema.parse(req.body);
      const misconduct = await this.misconductService.createMisconduct(data);

      res.status(201).json({
        success: true,
        data: misconduct
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  approveMisconduct = async (req: Request, res: Response) => {
    try {
      const misconductId = parseInt(req.params.id);
      const approvedBy = (req as any).user.username;

      const misconduct = await this.misconductService.approveMisconduct(misconductId, approvedBy);

      res.json({
        success: true,
        data: misconduct
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  rejectMisconduct = async (req: Request, res: Response) => {
    try {
      const misconductId = parseInt(req.params.id);
      const approvedBy = (req as any).user.username;

      const misconduct = await this.misconductService.rejectMisconduct(misconductId, approvedBy);

      res.json({
        success: true,
        data: misconduct
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  getMisconductsByOperator = async (req: Request, res: Response) => {
    try {
      const operatorId = parseInt(req.params.operatorId);
      const status = req.query.status as string;

      const misconducts = await this.misconductService.getMisconductsByOperator(operatorId, status);

      res.json({
        success: true,
        data: misconducts
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  getAllMisconducts = async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      const misconducts = await this.misconductService.getAllMisconducts(filters);

      res.json({
        success: true,
        data: misconducts
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
}
