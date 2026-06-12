import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DashboardService {

  // Full company-wide KPI for Manager, HRD, Super Admin
  async getKPIDashboard() {
    const [
      totalOperators,
      totalMerits,
      totalMisconducts,
      pendingApprovals,
      topPerformers,
      recentEvents,
      blockchainStatus
    ] = await Promise.all([
      prisma.operator.count(),

      prisma.meritEvent.count({
        where: { approvalStatus: 'approved' }
      }),

      prisma.misconductEvent.count({
        where: { approvalStatus: 'approved' }
      }),

      Promise.all([
        prisma.meritEvent.count({ where: { approvalStatus: 'pending' } }),
        prisma.misconductEvent.count({ where: { approvalStatus: 'pending' } })
      ]),

      prisma.operator.findMany({
        take: 5,
        orderBy: { performanceScore: 'desc' },
        include: {
          user: { select: { fullName: true } },
          department: true,
          productionLine: true
        }
      }),

      Promise.all([
        prisma.meritEvent.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            operator: {
              include: { user: { select: { fullName: true } } }
            }
          }
        }),
        prisma.misconductEvent.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            operator: {
              include: { user: { select: { fullName: true } } }
            }
          }
        })
      ]),

      prisma.blockchainLog.count()
    ]);

    return {
      dashboardType: 'kpi',
      summary: {
        totalOperators,
        totalMerits,
        totalMisconducts,
        pendingMerits: pendingApprovals[0],
        pendingMisconducts: pendingApprovals[1],
        totalBlocks: blockchainStatus
      },
      topPerformers,
      recentMerits: recentEvents[0],
      recentMisconducts: recentEvents[1]
    };
  }

  // Operator's personal dashboard — their own merit/misconduct/score data
  async getOperatorPersonalDashboard(userId: number) {
    // Find the operator record linked to this user
    const operator = await prisma.operator.findUnique({
      where: { userId },
      include: {
        user: { select: { fullName: true, email: true } },
        department: true,
        shift: true,
        productionLine: true
      }
    });

    if (!operator) {
      return {
        dashboardType: 'operator',
        operator: null,
        summary: { totalMerit: 0, totalMisconduct: 0, performanceScore: 0, ranking: null },
        recentMerits: [],
        recentMisconducts: []
      };
    }

    // Get personal merit and misconduct history
    const [recentMerits, recentMisconducts, ranking] = await Promise.all([
      prisma.meritEvent.findMany({
        where: { operatorId: operator.id, approvalStatus: 'approved' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { operator: { include: { user: { select: { fullName: true } } } } }
      }),
      prisma.misconductEvent.findMany({
        where: { operatorId: operator.id, approvalStatus: 'approved' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { operator: { include: { user: { select: { fullName: true } } } } }
      }),
      // Get ranking position among all operators
      prisma.operator.count({
        where: { performanceScore: { gt: operator.performanceScore } }
      })
    ]);

    return {
      dashboardType: 'operator',
      operator,
      summary: {
        totalMerit: operator.totalMerit,
        totalMisconduct: operator.totalMisconduct,
        performanceScore: operator.performanceScore,
        ranking: ranking + 1 // +1 because ranking = number of people above + 1
      },
      recentMerits,
      recentMisconducts
    };
  }

  async getPerformanceChart(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const [merits, misconducts] = await Promise.all([
      prisma.meritEvent.findMany({
        where: { createdAt: { gte: startDate }, approvalStatus: 'approved' },
        select: { createdAt: true, points: true }
      }),
      prisma.misconductEvent.findMany({
        where: { createdAt: { gte: startDate }, approvalStatus: 'approved' },
        select: { createdAt: true, points: true }
      })
    ]);

    return { merits, misconducts };
  }
}
