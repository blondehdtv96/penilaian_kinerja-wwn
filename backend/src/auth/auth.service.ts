import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export class AuthService {
  async login(username: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        },
        operator: {
          include: {
            department: true,
            shift: true,
            productionLine: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials or account inactive');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const roles = user.userRoles.map(ur => ur.role.name);
    const permissions = user.userRoles.flatMap(ur => 
      ur.role.rolePermissions.map(rp => rp.permission.name)
    );

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        roles,
        permissions
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: {
        ...userWithoutPassword,
        roles,
        permissions
      }
    };
  }

  async register(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        userRoles: {
          create: {
            roleId: data.roleId
          }
        }
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserById(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        },
        operator: {
          include: {
            department: {
              include: {
                division: true
              }
            },
            shift: true,
            productionLine: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const roles = user.userRoles.map(ur => ur.role.name);
    const permissions = user.userRoles.flatMap(ur => 
      ur.role.rolePermissions.map(rp => rp.permission.name)
    );

    const { password: _, ...userWithoutPassword } = user;
    
    return {
      ...userWithoutPassword,
      roles,
      permissions
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      
      const newToken = jwt.sign(
        {
          userId: decoded.userId,
          username: decoded.username,
          roles: decoded.roles,
          permissions: decoded.permissions
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return { token: newToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}
