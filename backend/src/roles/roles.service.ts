import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class RoleService {
  async getAllRoles() {
    return await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            userRoles: true
          }
        }
      }
    });
  }

  async getRoleById(id: number) {
    return await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true
              }
            }
          }
        }
      }
    });
  }

  async createRole(data: any) {
    return await prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        rolePermissions: data.permissionIds ? {
          create: data.permissionIds.map((permissionId: number) => ({
            permissionId
          }))
        } : undefined
      },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }

  async updateRole(id: number, data: any) {
    if (data.permissionIds) {
      await prisma.rolePermission.deleteMany({
        where: { roleId: id }
      });
    }

    return await prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        rolePermissions: data.permissionIds ? {
          create: data.permissionIds.map((permissionId: number) => ({
            permissionId
          }))
        } : undefined
      },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }

  async deleteRole(id: number) {
    return await prisma.role.delete({
      where: { id }
    });
  }
}
