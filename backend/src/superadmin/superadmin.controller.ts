import { Request, Response } from 'express';
import { SuperAdminService } from './superadmin.service';

export class SuperAdminController {
  private service = new SuperAdminService();

  // ============================================================
  // USER MANAGEMENT
  // ============================================================

  getAllUsers = async (req: Request, res: Response) => {
    try {
      const users = await this.service.getAllUsers();
      res.json({ success: true, data: users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  createUser = async (req: Request, res: Response) => {
    try {
      const user = await this.service.createUser(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  updateUser = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await this.service.updateUser(id, req.body);
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  deleteUser = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await this.service.deleteUser(id);
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  toggleUserStatus = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await this.service.toggleUserStatus(id);
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { newPassword } = req.body;
      await this.service.resetPassword(id, newPassword);
      res.json({ success: true, message: 'Password reset successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  // ============================================================
  // ROLE MANAGEMENT
  // ============================================================

  getAllRoles = async (req: Request, res: Response) => {
    try {
      const roles = await this.service.getAllRoles();
      res.json({ success: true, data: roles });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  createRole = async (req: Request, res: Response) => {
    try {
      const role = await this.service.createRole(req.body);
      res.status(201).json({ success: true, data: role });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  updateRole = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const role = await this.service.updateRole(id, req.body);
      res.json({ success: true, data: role });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  deleteRole = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await this.service.deleteRole(id);
      res.json({ success: true, message: 'Role deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  // ============================================================
  // QR LOCATION MANAGEMENT
  // ============================================================

  getAllQrLocations = async (req: Request, res: Response) => {
    try {
      const locations = await this.service.getAllQrLocations();
      res.json({ success: true, data: locations });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  createQrLocation = async (req: Request, res: Response) => {
    try {
      const location = await this.service.createQrLocation(req.body);
      res.status(201).json({ success: true, data: location });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  updateQrLocation = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const location = await this.service.updateQrLocation(id, req.body);
      res.json({ success: true, data: location });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  deleteQrLocation = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await this.service.deleteQrLocation(id);
      res.json({ success: true, message: 'QR location deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  // ============================================================
  // AUDIT LOGS
  // ============================================================

  getAuditLogs = async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      const logs = await this.service.getAuditLogs(filters);
      res.json({ success: true, data: logs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  exportAuditLogs = async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      const csv = await this.service.exportAuditLogs(filters);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ============================================================
  // SYSTEM STATS
  // ============================================================

  getSystemStats = async (req: Request, res: Response) => {
    try {
      const stats = await this.service.getSystemStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
