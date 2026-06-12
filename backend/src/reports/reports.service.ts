import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ReportService {
  async getOperatorPerformanceReport(filters?: any) {
    const where: any = {};

    if (filters?.departmentId) {
      where.departmentId = parseInt(filters.departmentId);
    }
    if (filters?.dateFrom) {
      where.createdAt = { gte: new Date(filters.dateFrom) };
    }
    if (filters?.dateTo) {
      where.createdAt = { 
        ...where.createdAt, 
        lte: new Date(filters.dateTo) 
      };
    }

    const operators = await prisma.operator.findMany({
      where,
      include: {
        user: {
          select: {
            fullName: true,
            username: true
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
          where: { approvalStatus: 'approved' }
        },
        misconductEvents: {
          where: { approvalStatus: 'approved' }
        }
      },
      orderBy: { performanceScore: 'desc' }
    });

    return operators.map((op, index) => ({
      ranking: index + 1,
      employeeId: op.employeeId,
      name: op.user.fullName,
      department: op.department.name,
      division: op.department.division.name,
      shift: op.shift.name,
      productionLine: op.productionLine.name,
      position: op.position,
      totalMerit: op.totalMerit,
      totalMisconduct: op.totalMisconduct,
      performanceScore: op.performanceScore,
      meritCount: op.meritEvents.length,
      misconductCount: op.misconductEvents.length
    }));
  }

  async getMeritMisconductReport(filters?: any) {
    const meritWhere: any = {};
    const misconductWhere: any = {};

    if (filters?.dateFrom) {
      meritWhere.createdAt = { gte: new Date(filters.dateFrom) };
      misconductWhere.createdAt = { gte: new Date(filters.dateFrom) };
    }
    if (filters?.dateTo) {
      meritWhere.createdAt = { 
        ...meritWhere.createdAt, 
        lte: new Date(filters.dateTo) 
      };
      misconductWhere.createdAt = { 
        ...misconductWhere.createdAt, 
        lte: new Date(filters.dateTo) 
      };
    }

    const [merits, misconducts] = await Promise.all([
      prisma.meritEvent.findMany({
        where: meritWhere,
        include: {
          operator: {
            include: {
              user: {
                select: { fullName: true }
              },
              department: true
            }
          },
          productionLine: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.misconductEvent.findMany({
        where: misconductWhere,
        include: {
          operator: {
            include: {
              user: {
                select: { fullName: true }
              },
              department: true
            }
          },
          productionLine: true
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return { merits, misconducts };
  }

  async getDepartmentReport() {
    const departments = await prisma.department.findMany({
      include: {
        division: true,
        operators: {
          include: {
            meritEvents: {
              where: { approvalStatus: 'approved' }
            },
            misconductEvents: {
              where: { approvalStatus: 'approved' }
            }
          }
        }
      }
    });

    return departments.map(dept => {
      const totalMerit = dept.operators.reduce((sum, op) => sum + op.totalMerit, 0);
      const totalMisconduct = dept.operators.reduce((sum, op) => sum + op.totalMisconduct, 0);
      const avgPerformance = dept.operators.length > 0 
        ? dept.operators.reduce((sum, op) => sum + op.performanceScore, 0) / dept.operators.length
        : 0;

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        departmentCode: dept.code,
        divisionName: dept.division.name,
        totalOperators: dept.operators.length,
        totalMerit,
        totalMisconduct,
        avgPerformanceScore: parseFloat(avgPerformance.toFixed(2))
      };
    });
  }

  async getBlockchainAuditReport(filters?: any) {
    const where: any = {};

    if (filters?.dateFrom) {
      where.timestamp = { gte: new Date(filters.dateFrom) };
    }
    if (filters?.dateTo) {
      where.timestamp = { 
        ...where.timestamp, 
        lte: new Date(filters.dateTo) 
      };
    }
    if (filters?.eventType) {
      where.eventType = filters.eventType;
    }

    const blocks = await prisma.blockchainLog.findMany({
      where,
      include: {
        meritEvent: {
          include: {
            operator: {
              include: {
                user: {
                  select: { fullName: true }
                }
              }
            }
          }
        },
        misconductEvent: {
          include: {
            operator: {
              include: {
                user: {
                  select: { fullName: true }
                }
              }
            }
          }
        }
      },
      orderBy: { blockIndex: 'desc' }
    });

    return blocks;
  }
}
