import { Request, Response } from 'express';
import { MisconductService } from './misconduct.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { toHttpError } from './errors';

const service = new MisconductService();
const blockchain = new BlockchainService();

export class MisconductController {
  // MISCONDUCT
  createMisconduct = async (req: any, res: Response) => {
    try {
      const result = await service.createMisconduct({ ...req.body, createdById: req.user.userId });
      await blockchain.storeHash('Misconduct', result.id, result, req.user.userId, undefined, result.id);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      const { status, body } = toHttpError(error);
      res.status(status).json(body);
    }
  };

  getAllMisconducts = async (req: Request, res: Response) => {
    try {
      const result = await service.getAllMisconducts(req.query as any);
      res.json({ success: true, data: result });
    } catch (error) {
      const { status, body } = toHttpError(error);
      res.status(status).json(body);
    }
  };

  getMyMisconducts = async (req: any, res: Response) => {
    try {
      const { month, year } = req.query as any;
      const result = await service.getMyMisconducts(req.user.userId, { month, year });
      res.json({ success: true, data: result });
    } catch (error) {
      const { status, body } = toHttpError(error);
      res.status(status).json(body);
    }
  };

  // COUNSELING
  createCounseling = async (req: any, res: Response) => {
    try {
      const result = await service.createCounseling({ ...req.body, foremanId: req.user.userId });
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      const { status, body } = toHttpError(error);
      res.status(status).json(body);
    }
  };

  getAllCounselings = async (req: Request, res: Response) => {
    try {
      const operatorId = req.query.operatorId ? Number(req.query.operatorId) : undefined;
      const { month, year } = req.query as any;
      const result = await service.getAllCounselings(operatorId, { month, year });
      res.json({ success: true, data: result });
    } catch (error) {
      const { status, body } = toHttpError(error);
      res.status(status).json(body);
    }
  };

  acknowledgeCounseling = async (req: any, res: Response) => {
    try {
      const result = await service.acknowledgeCounseling(parseInt(req.params.id), req.user.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      const { status, body } = toHttpError(error);
      res.status(status).json(body);
    }
  };

  // KARTU KUNING
  createKartuKuning = async (req: any, res: Response) => {
    try {
      const result = await service.createKartuKuning({ ...req.body, issuedById: req.user.userId });
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      const { status, body } = toHttpError(error);
      res.status(status).json(body);
    }
  };

  getAllKartuKuning = async (req: Request, res: Response) => {
    try {
      const operatorId = req.query.operatorId ? Number(req.query.operatorId) : undefined;
      const { month, year } = req.query as any;
      const result = await service.getAllKartuKuning(operatorId, { month, year });
      res.json({ success: true, data: result });
    } catch (error) {
      const { status, body } = toHttpError(error);
      res.status(status).json(body);
    }
  };

  /** Self-view: only the requesting operator's kartu kuning records (R5.7). */
  getMyKartuKuning = async (req: any, res: Response) => {
    try {
      const { month, year } = req.query as any;
      const result = await service.getMyKartuKuning(req.user.userId, { month, year });
      res.json({ success: true, data: result });
    } catch (error) {
      const { status, body } = toHttpError(error);
      res.status(status).json(body);
    }
  };

  // SURAT PERINGATAN
  createSuratPeringatan = async (req: any, res: Response) => {
    try {
      const result = await service.createSuratPeringatan({ ...req.body, issuedById: req.user.userId });
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      const { status, body } = toHttpError(error);
      res.status(status).json(body);
    }
  };

  getAllSuratPeringatan = async (req: Request, res: Response) => {
    try {
      const operatorId = req.query.operatorId ? Number(req.query.operatorId) : undefined;
      const { month, year } = req.query as any;
      const result = await service.getAllSuratPeringatan(operatorId, { month, year });
      res.json({ success: true, data: result });
    } catch (error) {
      const { status, body } = toHttpError(error);
      res.status(status).json(body);
    }
  };
}
