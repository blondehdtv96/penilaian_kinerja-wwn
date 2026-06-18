import { Request, Response } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

export class AuthController {
  login = async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password required' });
      }
      const result = await authService.login(username, password);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message });
    }
  };

  me = async (req: any, res: Response) => {
    try {
      const user = await authService.getUserById(req.user.userId);
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message });
    }
  };
}
