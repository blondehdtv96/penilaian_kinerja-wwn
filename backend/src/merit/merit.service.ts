import { PrismaClient } from '@prisma/client';
import { BlockchainService } from '../blockchain/blockchain.service';
import { io } from '../index';

const prisma = new PrismaClient();
const blockchainService = new BlockchainService();

export class MeritService {
  async createMerit(data: any) {
    const merit = await prisma.meritEvent.create({
      data: {
        operatorId: data.operatorId,
        productionLineId: data.productionLineId,
        meritType: data.meritType,
        points: data.points,
        description: data.description,
        approvalStatus: 'pending'
      },
      include: {
        operator: {
          include: {
            user: true,
            department: true,
            productionLine: true
          }
        },
        productionLine: true
      }
    });

    // Real-time notification via Socket.IO
    io.emit('merit:created', {
      meritId: merit.id,
      operatorId: merit.operatorId,
      operatorName: merit.operator.user.fullName,
      meritType: merit.meritType,
      points: merit.points,
      timestamp: merit.createdAt
    });

    return merit;
  }

  async approveMerit(meritId: number, approvedBy: string) {
    const merit = await prisma.meritEvent.update({
      where: { id: meritId },
      data: {
        approvalStatus: 'approved',
        approvedBy
      },
      include: {
        operator: {
          include: {
            user: true
          }
        }
      }
    });

    // Update operator total merit
    await prisma.operator.update({
      where: { id: merit.operatorId },
      data: {
        totalMerit: {
          increment: merit.points
        }
      }
    });

    // Recalculate performance score
    await this.recalculatePerformanceScore(merit.operatorId);

    // Add to blockchain
    const blockchainData = {
      meritId: merit.id,
      operatorId: merit.operatorId,
      employeeId: merit.operator.employeeId,
      operatorName: merit.operator.user.fullName,
      meritType: merit.meritType,
      points: merit.points,
      description: merit.description,
      approvedBy,
      approvedAt: new Date().toISOString()
    };

    await blockchainService.addBlock('merit', merit.id, blockchainData);

    // Real-time notification
    io.emit('merit:approved', {
      meritId: merit.id,
      operatorId: merit.operatorId,
      points: merit.points
    });

    // Send notification to operator
    await prisma.notification.create({
      data: {
        operatorId: merit.operatorId,
        title: 'Merit Approved',
        message: `Your merit for ${merit.meritType} has been approved (+${merit.points} points)`,
        type: 'success'
      }
    });

    return merit;
  }

  async rejectMerit(meritId: number, approvedBy: string) {
    const merit = await prisma.meritEvent.update({
      where: { id: meritId },
      data: {
        approvalStatus: 'rejected',
        approvedBy
      },
      include: {
        operator: {
          include: {
            user: true
          }
        }
      }
    });

    // Send notification to operator
    await prisma.notification.create({
      data: {
        operatorId: merit.operatorId,
        title: 'Merit Rejected',
        message: `Your merit for ${merit.meritType} has been rejected`,
        type: 'warning'
      }
    });

    return merit;
  }

  async getMeritsByOperator(operatorId: number, status?: string) {
    const where: any = { operatorId };
    if (status) {
      where.approvalStatus = status;
    }

    return await prisma.meritEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        productionLine: true
      }
    });
  }

  async getAllMerits(filters?: any) {
    const where: any = {};

    if (filters?.status) {
      where.approvalStatus = filters.status;
    }
    if (filters?.dateFrom) {
      where.eventDate = { gte: new Date(filters.dateFrom) };
    }
    if (filters?.dateTo) {
      where.eventDate = { ...where.eventDate, lte: new Date(filters.dateTo) };
    }

    return await prisma.meritEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        operator: {
          include: {
            user: true,
            department: true
          }
        },
        productionLine: true
      }
    });
  }

  private async recalculatePerformanceScore(operatorId: number) {
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId }
    });

    if (!operator) return;

    const performanceScore = operator.totalMerit - operator.totalMisconduct;

    await prisma.operator.update({
      where: { id: operatorId },
      data: { performanceScore }
    });

    await prisma.performanceLog.create({
      data: {
        operatorId,
        meritScore: operator.totalMerit,
        misconductScore: operator.totalMisconduct,
        totalScore: performanceScore
      }
    });
  }
}
