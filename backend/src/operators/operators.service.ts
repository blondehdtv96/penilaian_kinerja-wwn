import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

export class OperatorService {
  async createOperator(data: any) {
    // Generate QR Code
    const qrData = JSON.stringify({
      employeeId: data.employeeId,
      name: data.fullName,
      timestamp: new Date().toISOString()
    });
    
    const qrCode = await QRCode.toDataURL(qrData);

    const operator = await prisma.operator.create({
      data: {
        employeeId: data.employeeId,
        userId: data.userId,
        departmentId: data.departmentId,
        shiftId: data.shiftId,
        productionLineId: data.productionLineId,
        qrCode,
        position: data.position
      },
      include: {
        user: true,
        department: {
          include: {
            division: true
          }
        },
        shift: true,
        productionLine: true
      }
    });

    return operator;
  }

  async getOperatorById(id: number) {
    return await prisma.operator.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            fullName: true
          }
        },
        department: {
          include: {
            division: true
          }
        },
        shift: true,
        productionLine: true,
        meritEvents: {
          where: { approvalStatus: 'approved' },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        misconductEvents: {
          where: { approvalStatus: 'approved' },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
  }

  async getOperatorByEmployeeId(employeeId: string) {
    return await prisma.operator.findUnique({
      where: { employeeId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            fullName: true
          }
        },
        department: true,
        shift: true,
        productionLine: true
      }
    });
  }

  async getAllOperators(filters?: any) {
    const where: any = {};

    if (filters?.departmentId) {
      where.departmentId = parseInt(filters.departmentId);
    }
    if (filters?.shiftId) {
      where.shiftId = parseInt(filters.shiftId);
    }
    if (filters?.productionLineId) {
      where.productionLineId = parseInt(filters.productionLineId);
    }

    return await prisma.operator.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            fullName: true
          }
        },
        department: true,
        shift: true,
        productionLine: true
      },
      orderBy: { performanceScore: 'desc' }
    });
  }

  async getOperatorRanking(limit: number = 10) {
    return await prisma.operator.findMany({
      orderBy: { performanceScore: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            fullName: true,
            username: true
          }
        },
        department: true,
        productionLine: true
      }
    });
  }

  async updateOperator(id: number, data: any) {
    return await prisma.operator.update({
      where: { id },
      data: {
        departmentId: data.departmentId,
        shiftId: data.shiftId,
        productionLineId: data.productionLineId,
        position: data.position
      },
      include: {
        user: true,
        department: true,
        shift: true,
        productionLine: true
      }
    });
  }

  async deleteOperator(id: number) {
    return await prisma.operator.delete({
      where: { id }
    });
  }
}
