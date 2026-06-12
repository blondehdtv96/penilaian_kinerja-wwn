import { PrismaClient } from '@prisma/client';
import { BlockchainService } from '../blockchain/blockchain.service';
import { io } from '../index';

const prisma = new PrismaClient();
const blockchainService = new BlockchainService();

export class MisconductService {
  async createMisconduct(data: any) {
    const misconduct = await prisma.misconductEvent.create({
      data: {
        operatorId: data.operatorId,
        productionLineId: data.productionLineId,
        misconductType: data.misconductType,
        severity: data.severity,
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

    // Real-time notification
    io.emit('misconduct:created', {
      misconductId: misconduct.id,
      operatorId: misconduct.operatorId,
      operatorName: misconduct.operator.user.fullName,
      misconductType: misconduct.misconductType,
      severity: misconduct.severity,
      points: misconduct.points,
      timestamp: misconduct.createdAt
    });

    return misconduct;
  }

  async approveMisconduct(misconductId: number, approvedBy: string) {
    const misconduct = await prisma.misconductEvent.update({
      where: { id: misconductId },
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

    // Update operator total misconduct
    await prisma.operator.update({
      where: { id: misconduct.operatorId },
      data: {
        totalMisconduct: {
          increment: misconduct.points
        }
      }
    });

    // Recalculate performance score
    await this.recalculatePerformanceScore(misconduct.operatorId);

    // Add to blockchain
    const blockchainData = {
      misconductId: misconduct.id,
      operatorId: misconduct.operatorId,
      employeeId: misconduct.operator.employeeId,
      operatorName: misconduct.operator.user.fullName,
      misconductType: misconduct.misconductType,
      severity: misconduct.severity,
      points: misconduct.points,
      description: misconduct.description,
      approvedBy,
      approvedAt: new Date().toISOString()
    };

    await blockchainService.addBlock('misconduct', misconduct.id, blockchainData);

    // Real-time notification
    io.emit('misconduct:approved', {
      misconductId: misconduct.id,
      operatorId: misconduct.operatorId,
      points: misconduct.points
    });

    // Send notification to operator
    await prisma.notification.create({
      data: {
        operatorId: misconduct.operatorId,
        title: 'Misconduct Recorded',
        message: `A misconduct for ${misconduct.misconductType} has been recorded (-${misconduct.points} points)`,
        type: 'error'
      }
    });

    return misconduct;
  }

  async rejectMisconduct(misconductId: number, approvedBy: string) {
    const misconduct = await prisma.misconductEvent.update({
      where: { id: misconductId },
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

    await prisma.notification.create({
      data: {
        operatorId: misconduct.operatorId,
        title: 'Misconduct Rejected',
        message: `The misconduct report for ${misconduct.misconductType} has been rejected`,
        type: 'info'
      }
    });

    return misconduct;
  }

  async getMisconductsByOperator(operatorId: number, status?: string) {
    const where: any = { operatorId };
    if (status) {
      where.approvalStatus = status;
    }

    return await prisma.misconductEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        productionLine: true
      }
    });
  }

  async getAllMisconducts(filters?: any) {
    const where: any = {};

    if (filters?.status) {
      where.approvalStatus = filters.status;
    }
    if (filters?.severity) {
      where.severity = filters.severity;
    }
    if (filters?.dateFrom) {
      where.eventDate = { gte: new Date(filters.dateFrom) };
    }
    if (filters?.dateTo) {
      where.eventDate = { ...where.eventDate, lte: new Date(filters.dateTo) };
    }

    return await prisma.misconductEvent.findMany({
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
