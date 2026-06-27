import { Request, Response } from 'express';
import { MisconductService } from './misconduct.service';
import { BlockchainService } from '../blockchain/blockchain.service';

const service = new MisconductService();
const blockchain = new BlockchainService();

export class MisconductController {
  // MISCONDUCT
  createMisconduct = async (req: any, res: Response) => {
    try {
      const result = await service.createMisconduct({ ...req.body, createdById: req.user.userId });
      await blockchain.storeHash('Misconduct', result.id, result, req.user.userId, undefined, result.id);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getAllMisconducts = async (req: Request, res: Response) => {
    try {
      const result = await service.getAllMisconducts(req.query as any);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // COUNSELING
  createCounseling = async (req: any, res: Response) => {
    try {
      const result = await service.createCounseling({ ...req.body, foremanId: req.user.userId });
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getAllCounselings = async (req: Request, res: Response) => {
    try {
      const result = await service.getAllCounselings(req.query.operatorId as string);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  acknowledgeCounseling = async (req: any, res: Response) => {
    try {
      const result = await service.acknowledgeCounseling(parseInt(req.params.id), req.user.userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // KARTU KUNING
  createKartuKuning = async (req: any, res: Response) => {
    try {
      const result = await service.createKartuKuning({ ...req.body, issuedById: req.user.userId });
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getAllKartuKuning = async (req: Request, res: Response) => {
    try {
      const result = await service.getAllKartuKuning(req.query.operatorId as string);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // SURAT PERINGATAN
  createSuratPeringatan = async (req: any, res: Response) => {
    try {
      const result = await service.createSuratPeringatan({ ...req.body, issuedById: req.user.userId });
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getAllSuratPeringatan = async (req: Request, res: Response) => {
    try {
      const result = await service.getAllSuratPeringatan(req.query.operatorId as string);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
