import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { DisciplinaryHistoryService } from './disciplinary-history.service';
import { toHttpError, NotFoundError } from './errors';

const prisma = new PrismaClient();
const service = new DisciplinaryHistoryService();

/**
 * Disciplinary history controller (R7). `GET /disciplinary-history/:operatorId`
 * is reserved for Foreman/Section Manager at the route layer; the current
 * user's role is passed through so an Operator role can never reach this
 * handler (the `/my` handler below serves operators instead, R7.4).
 */
export class DisciplinaryHistoryController {
  getHistory = async (req: any, res: Response) => {
    try {
      const operatorId = Number(req.params.operatorId);
      const result = await service.getDisciplinaryHistory(operatorId, { role: req.user.role });
      res.json({ success: true, data: result });
    } catch (error) {
      const { status, body } = toHttpError(error);
      res.status(status).json(body);
    }
  };

  /** Operator self-view: resolves the requester's own operatorId (R7.4). */
  getMyHistory = async (req: any, res: Response) => {
    try {
      const operator = await prisma.operator.findUnique({ where: { userId: req.user.userId } });
      if (!operator) {
        throw new NotFoundError('No operator profile is linked to this account.');
      }
      const result = await service.getDisciplinaryHistory(operator.id, {
        role: req.user.role,
        operatorId: operator.id,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      const { status, body } = toHttpError(error);
      res.status(status).json(body);
    }
  };
}
