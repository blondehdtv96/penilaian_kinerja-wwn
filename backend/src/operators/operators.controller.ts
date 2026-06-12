import { Request, Response } from 'express';
import { OperatorService } from './operators.service';

export class OperatorController {
  private operatorService = new OperatorService();

  createOperator = async (req: Request, res: Response) => {
    try {
      const operator = await this.operatorService.createOperator(req.body);

      res.status(201).json({
        success: true,
        data: operator
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  getOperator = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const operator = await this.operatorService.getOperatorById(id);

      if (!operator) {
        return res.status(404).json({
          success: false,
          message: 'Operator not found'
        });
      }

      res.json({
        success: true,
        data: operator
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  getOperatorByEmployeeId = async (req: Request, res: Response) => {
    try {
      const employeeId = req.params.employeeId;
      const operator = await this.operatorService.getOperatorByEmployeeId(employeeId);

      if (!operator) {
        return res.status(404).json({
          success: false,
          message: 'Operator not found'
        });
      }

      res.json({
        success: true,
        data: operator
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message

      });
    }
  };

  getAllOperators = async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      const operators = await this.operatorService.getAllOperators(filters);

      res.json({
        success: true,
        data: operators
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  getOperatorRanking = async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const ranking = await this.operatorService.getOperatorRanking(limit);

      res.json({
        success: true,
        data: ranking
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  updateOperator = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const operator = await this.operatorService.updateOperator(id, req.body);

      res.json({
        success: true,
        data: operator
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  deleteOperator = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await this.operatorService.deleteOperator(id);

      res.json({
        success: true,
        message: 'Operator deleted successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };
}
