import { Request, Response } from 'express';
import { PermissionService } from './permissions.service';

export class PermissionController {
  private permissionService = new PermissionService();

  getAllPermissions = async (req: Request, res: Response) => {
    try {
      const permissions = await this.permissionService.getAllPermissions();

      res.json({
        success: true,
        data: permissions
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  getPermissionsByModule = async (req: Request, res: Response) => {
    try {
      const grouped = await this.permissionService.getPermissionsByModule();

      res.json({
        success: true,
        data: grouped
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  getPermission = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const permission = await this.permissionService.getPermissionById(id);

      if (!permission) {
        return res.status(404).json({
          success: false,
          message: 'Permission not found'
        });
      }

      res.json({
        success: true,
        data: permission
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  createPermission = async (req: Request, res: Response) => {
    try {
      const permission = await this.permissionService.createPermission(req.body);

      res.status(201).json({
        success: true,
        data: permission
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  updatePermission = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const permission = await this.permissionService.updatePermission(id, req.body);

      res.json({
        success: true,
        data: permission
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  deletePermission = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await this.permissionService.deletePermission(id);

      res.json({
        success: true,
        message: 'Permission deleted successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };
}
