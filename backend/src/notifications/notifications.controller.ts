import { Response } from 'express';
import { NotificationService } from './notifications.service';

const service = new NotificationService();

export class NotificationController {
  list = async (req: any, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
      const data = await service.list(req.user.userId, limit);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  markRead = async (req: any, res: Response) => {
    try {
      const unread = await service.markRead(req.user.userId, parseInt(req.params.id, 10));
      res.json({ success: true, data: { unread } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  markAllRead = async (req: any, res: Response) => {
    try {
      await service.markAllRead(req.user.userId);
      res.json({ success: true, data: { unread: 0 } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
