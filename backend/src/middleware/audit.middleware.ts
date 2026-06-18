import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

const prisma = new PrismaClient();

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
            details: `${req.method} ${req.originalUrl} - ${JSON.stringify(req.body).substring(0, 500)}`,
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
    const { module: mod, action, userId } = req.query;
    const where: any = {};
    if (mod) where.module = mod as string;
    if (action) where.action = action as string;
    if (userId) where.userId = Number(userId);

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
