import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

export class SuperAdminService {
  // ============================================================
  // USER MANAGEMENT
  // ============================================================

  async getAllUsers() {
    return await prisma.user.findMany({
      include: {
        role: true,
        operator: true,
        _count: {
          select: {
            vooSubmissions: true,
            eventLogs: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createUser(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        nip: data.nip,
        roleId: data.roleId,
        isActive: data.isActive !== undefined ? data.isActive : true
      },
      include: {
        role: true
      }
    });

    // If creating an operator, create operator profile
    if (data.createOperator && data.operatorData) {
      const qrData = JSON.stringify({
        employeeId: data.operatorData.employeeId,
        name: data.fullName
      });
      const qrCode = await QRCode.toDataURL(qrData);

      await prisma.operator.create({
        data: {
          userId: user.id,
          employeeId: data.operatorData.employeeId,
          section: data.operatorData.section || '',
          line: data.operatorData.line || '',
          group: data.operatorData.group || '',
          position: data.operatorData.position || 'Operator',
          qrCode
        }
      });
    }

    return user;
  }

  async updateUser(id: number, data: any) {
    const updateData: any = {
      email: data.email,
      fullName: data.fullName,
      nip: data.nip,
      roleId: data.roleId,
      isActive: data.isActive
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
        operator: true
      }
    });
  }

  async deleteUser(id: number) {
    // Check if user is Super Admin
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true }
    });

    if (user?.role.name === 'Super Admin') {
      throw new Error('Cannot delete Super Admin user');
    }

    return await prisma.user.delete({
      where: { id }
    });
  }

  async toggleUserStatus(id: number) {
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      include: { role: true }
    });
  }

  async resetPassword(id: number, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });
  }

  // ============================================================
  // ROLE MANAGEMENT
  // ============================================================

  async getAllRoles() {
    return await prisma.role.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async createRole(data: any) {
    return await prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: JSON.stringify(data.permissions || [])
      }
    });
  }

  async updateRole(id: number, data: any) {
    // Check if system role
    const role = await prisma.role.findUnique({ where: { id } });
    const systemRoles = ['Super Admin', 'Section Manager', 'Foreman', 'Operator'];

    if (role && systemRoles.includes(role.name) && data.name && data.name !== role.name) {
      throw new Error('Cannot rename system roles');
    }

    return await prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions ? JSON.stringify(data.permissions) : undefined
      }
    });
  }

  async deleteRole(id: number) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!role) {
      throw new Error('Role not found');
    }

    const systemRoles = ['Super Admin', 'Section Manager', 'Foreman', 'Operator'];
    if (systemRoles.includes(role.name)) {
      throw new Error('Cannot delete system roles');
    }

    if (role._count.users > 0) {
      throw new Error(`Cannot delete role with ${role._count.users} assigned users`);
    }

    return await prisma.role.delete({
      where: { id }
    });
  }

  // ============================================================
  // QR LOCATION MANAGEMENT
  // ============================================================

  async getAllQrLocations() {
    return await prisma.qrLocation.findMany({
      include: {
        _count: {
          select: {
            scanLogs: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async createQrLocation(data: any) {
    const qrData = JSON.stringify({
      locationCode: data.code,
      name: data.name
    });
    const qrImage = await QRCode.toDataURL(qrData);

    return await prisma.qrLocation.create({
      data: {
        name: data.name,
        code: data.code,
        area: data.area,
        description: data.description,
        qrImage
      }
    });
  }

  async updateQrLocation(id: number, data: any) {
    const updateData: any = {
      name: data.name,
      code: data.code,
      area: data.area,
      description: data.description
    };

    // Regenerate QR if code or name changed
    if (data.regenerateQr) {
      const qrData = JSON.stringify({
        locationCode: data.code,
        name: data.name
      });
      updateData.qrImage = await QRCode.toDataURL(qrData);
    }

    return await prisma.qrLocation.update({
      where: { id },
      data: updateData
    });
  }

  async deleteQrLocation(id: number) {
    return await prisma.qrLocation.delete({
      where: { id }
    });
  }

  // ============================================================
  // AUDIT LOGS
  // ============================================================

  async getAuditLogs(filters: any) {
    const where: any = {};

    if (filters.userId) {
      where.userId = parseInt(filters.userId as string);
    }

    if (filters.module) {
      where.module = filters.module;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate as string);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate as string);
      }
    }

    return await prisma.eventLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 1000 // Limit for performance
    });
  }

  async exportAuditLogs(filters: any) {
    const logs = await this.getAuditLogs(filters);

    // Convert to CSV
    const headers = ['Date', 'User', 'Role', 'Action', 'Module', 'Details', 'IP Address'];
    const rows = logs.map(log => [
      new Date(log.createdAt).toISOString(),
      log.user.fullName,
      log.user.role.name,
      log.action,
      log.module,
      log.details || '',
      log.ipAddress || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csv;
  }

  // ============================================================
  // SYSTEM STATS
  // ============================================================

  async getSystemStats() {
    const [
      totalUsers,
      activeUsers,
      totalRoles,
      totalOperators,
      totalVooSubmissions,
      pendingVooSubmissions,
      totalMisconducts,
      totalQrLocations,
      totalQrScans,
      recentLogins
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.role.count(),
      prisma.operator.count(),
      prisma.vooSubmission.count(),
      prisma.vooSubmission.count({ where: { status: 'pending' } }),
      prisma.misconduct.count(),
      prisma.qrLocation.count(),
      prisma.qrScanLog.count(),
      prisma.eventLog.findMany({
        where: { action: 'LOGIN' },
        include: {
          user: {
            select: {
              username: true,
              fullName: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    // User distribution by role
    const usersByRole = await prisma.user.groupBy({
      by: ['roleId'],
      _count: true
    });

    const rolesWithCounts = await Promise.all(
      usersByRole.map(async (item) => {
        const role = await prisma.role.findUnique({
          where: { id: item.roleId }
        });
        return {
          role: role?.name,
          count: item._count
        };
      })
    );

    return {
      overview: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalRoles,
        totalOperators,
        totalQrLocations
      },
      voo: {
        total: totalVooSubmissions,
        pending: pendingVooSubmissions,
        approved: totalVooSubmissions - pendingVooSubmissions
      },
      misconduct: {
        total: totalMisconducts
      },
      qr: {
        totalLocations: totalQrLocations,
        totalScans: totalQrScans
      },
      usersByRole: rolesWithCounts,
      recentActivity: recentLogins
    };
  }
}
