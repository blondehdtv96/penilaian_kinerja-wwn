import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PermissionService {
  async getAllPermissions() {
    return await prisma.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { name: 'asc' }
      ]
    });
  }

  async getPermissionById(id: number) {
    return await prisma.permission.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async createPermission(data: any) {
    return await prisma.permission.create({
      data: {
        name: data.name,
        description: data.description,
        module: data.module
      }
    });
  }

  async updatePermission(id: number, data: any) {
    return await prisma.permission.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        module: data.module
      }
    });
  }

  async deletePermission(id: number) {
    return await prisma.permission.delete({
      where: { id }
    });
  }

  async getPermissionsByModule() {
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { name: 'asc' }
      ]
    });

    const grouped = permissions.reduce((acc: any, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {});

    return grouped;
  }
}
