import { Request, Response } from 'express';
import { BlockchainService } from './blockchain.service';

export class BlockchainController {
  private blockchainService = new BlockchainService();

  getBlockchain = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await this.blockchainService.getBlockchain(page, limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  getBlock = async (req: Request, res: Response) => {
    try {
      const blockIndex = parseInt(req.params.blockIndex);
      const block = await this.blockchainService.getBlockByIndex(blockIndex);

      if (!block) {
        return res.status(404).json({
          success: false,
          message: 'Block not found'
        });
      }

      res.json({
        success: true,
        data: block
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  verifyChain = async (req: Request, res: Response) => {
    try {
      const result = await this.blockchainService.verifyChain();

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  initializeGenesis = async (req: Request, res: Response) => {
    try {
      const genesis = await this.blockchainService.createGenesisBlock();

      if (!genesis) {
        return res.json({
          success: true,
          message: 'Genesis block already exists'
        });
      }

      res.status(201).json({
        success: true,
        data: genesis,
        message: 'Genesis block created successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
}
