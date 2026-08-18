import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

export class StaffProduksiService {
  // ============================================================
  // OPERATOR USER MANAGEMENT (scoped to role.name === 'Operator')
  // ============================================================

  async getAllOperators() {
    return await prisma.user.findMany({
      where: { role: { name: 'Operator' } },
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

  async createOperator(data: any) {
    const operatorRole = await prisma.role.findFirstOrThrow({ where: { name: 'Operator' } });

    if (!data.operatorData?.employeeId) {
      throw new Error('employeeId is required to create an Operator');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const qrData = JSON.stringify({
      employeeId: data.operatorData.employeeId,
      name: data.fullName
    });
    const qrCode = await QRCode.toDataURL(qrData);

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: data.username,
          email: data.email,
          password: hashedPassword,
          fullName: data.fullName,
          nik: data.nik ?? data.nip,
          roleId: operatorRole.id,
          isActive: data.isActive !== undefined ? data.isActive : true
        }
      });

      const operator = await tx.operator.create({
        data: {
          userId: user.id,
          employeeId: data.operatorData.employeeId,
          section: data.operatorData.section || '',
          group: data.operatorData.group || '',
          position: data.operatorData.position || 'Operator',
          qrCode
        }
      });

      return { ...user, operator };
    });
  }

  private async getOperatorRoleUserOrThrow(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true, operator: true }
    });

    if (!user) {
      throw new Error('User not found');
    }
    if (user.role.name !== 'Operator') {
      throw new Error('User is not an Operator');
    }

    return user;
  }

  async updateOperator(id: number, data: any) {
    await this.getOperatorRoleUserOrThrow(id);

    const updateData: any = {
      email: data.email,
      fullName: data.fullName,
      nik: data.nik ?? data.nip,
      isActive: data.isActive
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    if (data.operatorData) {
      updateData.operator = {
        update: {
          employeeId: data.operatorData.employeeId,
          section: data.operatorData.section,
          group: data.operatorData.group,
          position: data.operatorData.position
        }
      };
    }

    return await prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true, operator: true }
    });
  }

  async deleteOperator(id: number) {
    await this.getOperatorRoleUserOrThrow(id);

    return await prisma.user.delete({
      where: { id }
    });
  }

  async toggleStatus(id: number) {
    const user = await this.getOperatorRoleUserOrThrow(id);

    return await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      include: { role: true, operator: true }
    });
  }

  async resetPassword(id: number, newPassword: string) {
    await this.getOperatorRoleUserOrThrow(id);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });
  }
}
