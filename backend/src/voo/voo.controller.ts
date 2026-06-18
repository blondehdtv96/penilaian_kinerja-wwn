import { Request, Response } from 'express';
import { VooService } from './voo.service';
import { BlockchainService } from '../blockchain/blockchain.service';

const vooService = new VooService();
const blockchain = new BlockchainService();

export class VooController {
  create = async (req: any, res: Response) => {
    try {
      const { operatorId, title, description, type, photos } = req.body;
      let submittedById = req.user.userId;

      // If foreman submitting for operator
      let actualOperatorId = operatorId;
      if (req.user.role === 'Foreman' && !operatorId) {
        return res.status(400).json({ success: false, message: 'operatorId is required' });
      }

      // If operator submitting for themselves
      if (req.user.role === 'Operator') {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const op = await prisma.operator.findUnique({ where: { userId: req.user.userId } });
        if (op) actualOperatorId = op.id;
      }

      const result = await vooService.create({
        operatorId: actualOperatorId,
        submittedById,
        title,
        description,
        type: type || 'VoO',
        photos: photos || '[]'
      });

      // Store blockchain hash
      await blockchain.storeHash('VooSubmission', result.id, result, req.user.userId, result.id);

      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getAll = async (req: Request, res: Response) => {
    try {
      const { status, operatorId, type } = req.query;
      const result = await vooService.getAll({ status: status as string, operatorId: operatorId as any, type: type as string });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const result = await vooService.getById(parseInt(req.params.id));
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getMySubmissions = async (req: any, res: Response) => {
    try {
      const result = await vooService.getForOperator(req.user.userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  approveForeman = async (req: any, res: Response) => {
    try {
      const { action, rejectionReason } = req.body;
      const result = await vooService.approveForeman(parseInt(req.params.id), req.user.userId, action, rejectionReason);
      await blockchain.storeHash('VooSubmission', result.id, result, req.user.userId, result.id);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  approveManager = async (req: any, res: Response) => {
    try {
      const { action, points, rejectionReason } = req.body;
      const result = await vooService.approveManager(parseInt(req.params.id), req.user.userId, action, points, rejectionReason);
      await blockchain.storeHash('VooSubmission', result.id, result, req.user.userId, result.id);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
}
