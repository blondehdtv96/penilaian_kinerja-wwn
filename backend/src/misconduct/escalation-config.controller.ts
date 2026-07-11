import { Request, Response } from 'express';
import { EscalationConfigService } from './escalation.config';
import { toHttpError } from './errors';

const service = new EscalationConfigService();

/**
 * Escalation config controller (R4.6, R4.7). Read is available to
 * Foreman/Section Manager; write is restricted to Section Manager at the
 * route layer.
 */
export class EscalationConfigController {
  getActiveThresholds = async (_req: Request, res: Response) => {
    try {
      const result = await service.getActiveThresholds();
      res.json({ success: true, data: result });
    } catch (error) {
      const { status, body } = toHttpError(error);
      res.status(status).json(body);
    }
  };

  setThresholds = async (req: any, res: Response) => {
    try {
      const result = await service.setThresholds(req.body, req.user?.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      const { status, body } = toHttpError(error);
      res.status(status).json(body);
    }
  };
}
