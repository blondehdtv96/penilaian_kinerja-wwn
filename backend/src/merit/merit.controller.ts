import { Request, Response } from 'express';
import { MeritService } from './merit.service';
import { z } from 'zod';

const createMeritSchema = z.object({
  operatorId: z.number(),
  productionLineId: z.number(),
  meritType: z.string(),
  points: z.number().positive(),
  description: z.string()
});

export class MeritController {
  private meritService = new MeritService();

  createMerit = async (req: Request, res: Response) => {
    try {
      const data = createMeritSchema.parse(req.body);
      const merit = await this.meritService.createMerit(data);

      res.status(201).json({
        success: true,
        data: merit
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  approveMerit = async (req: Request, res: Response) => {
    try {
      const meritId = parseInt(req.params.id);
      const approvedBy = (req as any).user.username;

      const merit = await this.meritService.approveMerit(meritId, approvedBy);

      res.json({
        success: true,
        data: merit
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  rejectMerit = async (req: Request, res: Response) => {
    try {
      const meritId = parseInt(req.params.id);
      const approvedBy = (req as any).user.username;

      const merit = await this.meritService.rejectMerit(meritId, approvedBy);

      res.json({
        success: true,
        data: merit
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  getMeritsByOperator = async (req: Request, res: Response) => {
    try {
      const operatorId = parseInt(req.params.operatorId);
      const status = req.query.status as string;

      const merits = await this.meritService.getMeritsByOperator(operatorId, status);

      res.json({
        success: true,
        data: merits
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  getAllMerits = async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      const merits = await this.meritService.getAllMerits(filters);

      res.json({
        success: true,
        data: merits
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
}
