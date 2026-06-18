import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

export class DashboardService {
  async getKPI() {
    const totalOperators = await prisma.operator.count();
    const totalVoo = await prisma.vooSubmission.count();
    const pendingVoo = await prisma.vooSubmission.count({ where: { status: 'pending' } });
    const approvedVoo = await prisma.vooSubmission.count({ where: { status: 'approved_final' } });
    const totalMisconduct = await prisma.misconduct.count();
    const totalCounseling = await prisma.counseling.count();
    const totalKartuKuning = await prisma.kartuKuning.count();
    const totalSuratPeringatan = await prisma.suratPeringatan.count();

    // Average performance score
    const operators = await prisma.operator.findMany({ select: { performanceScore: true } });
    const avgPerformance = operators.length > 0
      ? Math.round((operators.reduce((sum, o) => sum + o.performanceScore, 0) / operators.length) * 10) / 10
      : 0;

    // Monthly trends (last 12 months)
    const months: string[] = [];
    const vooTrend: number[] = [];
    const misconductTrend: number[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
      months.push(monthStr);

      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      vooTrend.push(await prisma.vooSubmission.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }));

      misconductTrend.push(await prisma.misconduct.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }));
    }

    return {
      summary: {
        totalOperators, totalVoo, pendingVoo, approvedVoo,
        totalMisconduct, totalCounseling, totalKartuKuning, totalSuratPeringatan,
        avgPerformance
      },
      trends: { months, vooTrend, misconductTrend }
    };
  }

  async exportPDF() {
    // PDF export placeholder - using basic text structure
    const kpi = await this.getKPI();
    const operators = await prisma.operator.findMany({
      include: { user: { select: { fullName: true } } },
      orderBy: { performanceScore: 'desc' }
    });

    return {
      title: 'Performance Report',
      generatedAt: new Date().toISOString(),
      kpi: kpi.summary,
      operators: operators.map(o => ({
        name: o.user.fullName,
        employeeId: o.employeeId,
        section: o.section,
        performanceScore: o.performanceScore,
        totalMerit: o.totalMerit,
        totalMisconduct: o.totalMisconduct
      }))
    };
  }

  async exportExcel() {
    const workbook = new ExcelJS.Workbook();

    // Operators sheet
    const ws1 = workbook.addWorksheet('Operators');
    ws1.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Section', key: 'section', width: 15 },
      { header: 'Line', key: 'line', width: 15 },
      { header: 'Performance Score', key: 'score', width: 18 },
      { header: 'Total Merit', key: 'merit', width: 12 },
      { header: 'Total Misconduct', key: 'misconduct', width: 18 },
    ];

    const operators = await prisma.operator.findMany({
      include: { user: { select: { fullName: true } } },
      orderBy: { performanceScore: 'desc' }
    });

    operators.forEach(o => {
      ws1.addRow({
        employeeId: o.employeeId,
        name: o.user.fullName,
        section: o.section,
        line: o.line,
        score: o.performanceScore,
        merit: o.totalMerit,
        misconduct: o.totalMisconduct
      });
    });

    // VoO Submissions sheet
    const ws2 = workbook.addWorksheet('VoO Submissions');
    ws2.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Status', key: 'status', width: 18 },
      { header: 'Points', key: 'points', width: 10 },
      { header: 'Created', key: 'created', width: 20 },
    ];

    const voos = await prisma.vooSubmission.findMany({ orderBy: { createdAt: 'desc' } });
    voos.forEach(v => {
      ws2.addRow({
        id: v.id,
        title: v.title,
        type: v.type,
        status: v.status,
        points: v.points,
        created: v.createdAt.toISOString()
      });
    });

    return workbook;
  }
}
