import { Request, Response } from 'express';
import { BlockchainService } from './blockchain.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const blockchain = new BlockchainService();

export class BlockchainController {
  storeHash = async (req: any, res: Response) => {
    try {
      const { entityType, entityId, data } = req.body;
      const result = await blockchain.storeHash(entityType, entityId, data, req.user.userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  verify = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await blockchain.verifyHash(parseInt(id));
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getHashes = async (req: Request, res: Response) => {
    try {
      const { entityType, entityId } = req.query;
      const where: any = {};
      if (entityType) where.entityType = entityType;
      if (entityId) where.entityId = parseInt(entityId as string);

      const hashes = await prisma.blockchainHash.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { id: true, fullName: true, username: true } } }
      });
      res.json({ success: true, data: hashes });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  status = async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        available: blockchain.isAvailable(),
        ganacheUrl: process.env.GANACHE_URL,
        contractAddress: process.env.CONTRACT_ADDRESS
      }
    });
  };
}
