import { Request, Response } from 'express';
import { RoleService } from './roles.service';

export class RoleController {
  private roleService = new RoleService();

  getAllRoles = async (req: Request, res: Response) => {
    try {
      const roles = await this.roleService.getAllRoles();

      res.json({
        success: true,
        data: roles
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  getRole = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const role = await this.roleService.getRoleById(id);

      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      res.json({
        success: true,
        data: role
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  createRole = async (req: Request, res: Response) => {
    try {
      const role = await this.roleService.createRole(req.body);

      res.status(201).json({
        success: true,
        data: role
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  updateRole = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const role = await this.roleService.updateRole(id, req.body);

      res.json({
        success: true,
        data: role
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  deleteRole = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await this.roleService.deleteRole(id);

      res.json({
        success: true,
        message: 'Role deleted successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };
}
