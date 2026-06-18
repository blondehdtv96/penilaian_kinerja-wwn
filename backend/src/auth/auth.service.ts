import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export class AuthService {
  async login(username: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true, operator: true }
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials or account inactive');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error('Invalid credentials');

    const permissions: string[] = JSON.parse(user.role.permissions || '[]');

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role.name,
        permissions
      },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    );

    const { password: _, ...safeUser } = user;
    return {
      token,
      user: {
        ...safeUser,
        role: user.role.name,
        permissions
      }
    };
  }

  async getUserById(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, operator: true }
    });

    if (!user) throw new Error('User not found');

    const permissions: string[] = JSON.parse(user.role.permissions || '[]');
    const { password: _, ...safeUser } = user;

    return { ...safeUser, role: user.role.name, permissions };
  }
}
