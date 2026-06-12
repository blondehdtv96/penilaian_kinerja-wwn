import { Request, Response } from 'express';
import { UserService } from './users.service';

export class UserController {
  private userService = new UserService();

  getAllUsers = async (req: Request, res: Response) => {
    try {
      const users = await this.userService.getAllUsers();

      res.json({
        success: true,
        data: users
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  getUser = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await this.userService.getUserById(id);

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

  createUser = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.createUser(req.body);

      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  updateUser = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await this.userService.updateUser(id, req.body);

      res.json({
        success: true,
        data: user
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  deleteUser = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await this.userService.deleteUser(id);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  toggleStatus = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await this.userService.toggleUserStatus(id);

      res.json({
        success: true,
        data: user
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };
}
