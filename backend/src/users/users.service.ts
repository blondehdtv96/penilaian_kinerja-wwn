import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export class UserService {
  async getAllUsers() {
    return await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        isActive: true,
        createdAt: true,
        userRoles: {
          include: {
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getUserById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
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

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async createUser(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        userRoles: {
          create: data.roleIds.map((roleId: number) => ({
            roleId
          }))
        }
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        isActive: true,
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async updateUser(id: number, data: any) {
    const updateData: any = {
      email: data.email,
      fullName: data.fullName,
      isActive: data.isActive
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    if (data.roleIds) {
      await prisma.userRole.deleteMany({
        where: { userId: id }
      });

      updateData.userRoles = {
        create: data.roleIds.map((roleId: number) => ({
          roleId
        }))
      };
    }

    return await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        isActive: true,
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async deleteUser(id: number) {
    return await prisma.user.delete({
      where: { id }
    });
  }

  async toggleUserStatus(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { isActive: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        isActive: true
      }
    });
  }
}
