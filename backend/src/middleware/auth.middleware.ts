import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Not authenticated' });

    // Token usang/rusak: klaim `role` tidak ada. Paksa re-login (401) agar klien
    // membersihkan sesi lama; ini mencegah user "terjebak" pada 403 selamanya.
    if (!user.role) {
      return res.status(401).json({ success: false, message: 'Sesi tidak valid, silakan login ulang.' });
    }

    // Super Admin bypasses all role checks
    if (user.role === 'Super Admin') {
      return next();
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied: insufficient role' });
    }
    next();
  };
};

export const checkPermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Not authenticated' });

    // Token usang/rusak: klaim role/permissions tidak ada. Paksa re-login.
    if (!user.role && !user.permissions) {
      return res.status(401).json({ success: false, message: 'Sesi tidak valid, silakan login ulang.' });
    }

    // Super Admin bypasses all permission checks
    if (user.role === 'Super Admin') {
      return next();
    }

    if (!user.permissions?.includes(permission)) {
      return res.status(403).json({ success: false, message: 'Access denied: insufficient permission' });
    }
    next();
  };
};
