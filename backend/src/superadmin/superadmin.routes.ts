import { Router } from 'express';
import { SuperAdminController } from './superadmin.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const controller = new SuperAdminController();

// All routes require authentication and Super Admin role
router.use(authMiddleware);

// Middleware to check Super Admin role
const requireSuperAdmin = (req: any, res: any, next: any) => {
  const user = req.user;
  if (!user || user.role !== 'Super Admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super Admin role required.'
    });
  }
  next();
};

router.use(requireSuperAdmin);

// ============================================================
// USER MANAGEMENT
// ============================================================
router.get('/users', controller.getAllUsers);
router.post('/users', controller.createUser);
router.put('/users/:id', controller.updateUser);
router.delete('/users/:id', controller.deleteUser);
router.patch('/users/:id/toggle-status', controller.toggleUserStatus);
router.post('/users/:id/reset-password', controller.resetPassword);

// ============================================================
// ROLE MANAGEMENT
// ============================================================
router.get('/roles', controller.getAllRoles);
router.post('/roles', controller.createRole);
router.put('/roles/:id', controller.updateRole);
router.delete('/roles/:id', controller.deleteRole);

// ============================================================
// QR LOCATION MANAGEMENT
// ============================================================
router.get('/qr-locations', controller.getAllQrLocations);
router.post('/qr-locations', controller.createQrLocation);
router.put('/qr-locations/:id', controller.updateQrLocation);
router.delete('/qr-locations/:id', controller.deleteQrLocation);

// ============================================================
// AUDIT LOGS
// ============================================================
router.get('/audit-logs', controller.getAuditLogs);
router.get('/audit-logs/export', controller.exportAuditLogs);

// ============================================================
// SYSTEM STATS
// ============================================================
router.get('/stats', controller.getSystemStats);

export default router;
