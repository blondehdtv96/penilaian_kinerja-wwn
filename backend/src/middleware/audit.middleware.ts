import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

const prisma = new PrismaClient();

// Field names never written to the audit trail, regardless of route (credentials
// must not end up readable by anyone with Section Manager access to /audit-logs).
const REDACTED_FIELDS = new Set(['password', 'currentPassword', 'newPassword', 'token']);

function redactBody(body: any): any {
  if (!body || typeof body !== 'object') return body;
  const clone: any = Array.isArray(body) ? [...body] : { ...body };
  for (const key of Object.keys(clone)) {
    if (REDACTED_FIELDS.has(key)) clone[key] = '[redacted]';
  }
  return clone;
}

// Append-only event log middleware
export const auditLog = (module: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Capture original res.json to log after response
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      // Only log successful mutations
      if (res.statusCode < 400 && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const user = req.user;
        prisma.eventLog.create({
          data: {
            userId: user?.userId || 0,
            action: req.method,
            module,
            details: `${req.method} ${req.originalUrl} - ${JSON.stringify(redactBody(req.body)).substring(0, 500)}`,
            ipAddress: req.ip || req.socket.remoteAddress || ''
          }
        }).catch(err => console.error('Audit log error:', err));
      }
      return originalJson(body);
    };
    next();
  };
};

// Get event logs
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { module: mod, action, userId, month, year } = req.query;
    const where: any = {};
    if (mod) where.module = mod as string;
    if (action) where.action = action as string;
    if (userId) where.userId = Number(userId);

    // Filter riwayat log berdasarkan bulan/tahun (R: Filter Data).
    const y = year !== undefined && year !== '' ? Number(year) : undefined;
    const m = month !== undefined && month !== '' ? Number(month) : undefined;
    if (y !== undefined || m !== undefined) {
      const now = new Date();
      const useYear = y ?? now.getFullYear();
      if (m !== undefined) {
        where.createdAt = {
          gte: new Date(useYear, m - 1, 1, 0, 0, 0, 0),
          lte: new Date(useYear, m, 0, 23, 59, 59, 999),
        };
      } else {
        where.createdAt = {
          gte: new Date(useYear, 0, 1, 0, 0, 0, 0),
          lte: new Date(useYear, 11, 31, 23, 59, 59, 999),
        };
      }
    }

    const logs = await prisma.eventLog.findMany({
      where,
      include: { user: { select: { id: true, fullName: true, username: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
