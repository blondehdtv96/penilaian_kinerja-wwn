import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(3),
  roleId: z.number()
});

export class AuthController {
  private authService = new AuthService();

  login = async (req: Request, res: Response) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const result = await this.authService.login(username, password);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed'
      });
    }
  };

  register = async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);
      const result = await this.authService.register(data);
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed'
      });
    }
  };

  logout = async (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  };

  getCurrentUser = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const user = await this.authService.getUserById(userId);
      
      res.json({
        success: true,
        data: user
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  };

  refreshToken = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      const result = await this.authService.refreshToken(refreshToken);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  };
}
