import { Express } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
        roles: string[];
        permissions: string[];
      };
    }
  }
}
