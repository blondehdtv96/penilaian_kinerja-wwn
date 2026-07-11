import { Request, Response } from 'express';
import { CatalogService } from './catalog.service';
import { toHttpError } from './errors';

const service = new CatalogService();

/**
 * Catalog controller (R1). Maps typed domain errors to their HTTP status via
 * `toHttpError` instead of the previous blanket 500 responses. Authorization
 * (Section Manager for mutations; Foreman/Section Manager for reads) is
 * enforced at the route layer.
 */
export class CatalogController {
  createViolationType = async (req: Request, res: Response) => {
    try {
      const result = await service.createViolationType(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      const { status, body } = toHttpError(error);
      res.status(status).json(body);
    }
  };

  updateViolationType = async (req: Request, res: Response) => {
    try {
      const result = await service.updateViolationType(Number(req.params.id), req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      const { status, body } = toHttpError(error);
      res.status(status).json(body);
    }
  };

  deactivateViolationType = async (req: Request, res: Response) => {
    try {
      const result = await service.deactivateViolationType(Number(req.params.id));
      res.json({ success: true, data: result });
    } catch (error) {
      const { status, body } = toHttpError(error);
      res.status(status).json(body);
    }
  };

  listCatalog = async (req: Request, res: Response) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const result = await service.listCatalog({ includeInactive });
      res.json({ success: true, data: result });
    } catch (error) {
      const { status, body } = toHttpError(error);
      res.status(status).json(body);
    }
  };
}
