import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class OperatorService {
  async getAll(filters?: { section?: string; line?: string; group?: string }) {
    const where: any = {};
    if (filters?.section) where.section = filters.section;
    if (filters?.line) where.line = filters.line;
    if (filters?.group) where.group = filters.group;

    return prisma.operator.findMany({
      where,
      include: { user: { select: { id: true, fullName: true, username: true, email: true } } },
      orderBy: { performanceScore: 'desc' }
    });
  }

  async getById(id: number) {
    const op = await prisma.operator.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, username: true, email: true } },
        vooSubmissions: { take: 10, orderBy: { createdAt: 'desc' } },
        misconducts: { take: 10, orderBy: { createdAt: 'desc' } },
        counselings: { take: 5, orderBy: { date: 'desc' } },
        kartuKunings: { take: 5, orderBy: { issuedAt: 'desc' } },
        suratPeringatan: { take: 5, orderBy: { issuedAt: 'desc' } }
      }
    });
    if (!op) throw new Error('Operator not found');
    return op;
  }

  async getByUserId(userId: number) {
    const op = await prisma.operator.findUnique({
      where: { userId },
      include: { user: { select: { id: true, fullName: true, username: true, email: true } } }
    });
    if (!op) throw new Error('Operator profile not found');
    return op;
  }

  async scanQR(qrData: string, userId: number) {
    let parsed: any;
    try { parsed = JSON.parse(qrData); } catch { throw new Error('Invalid QR code'); }

    // Check if it's an area QR
    if (parsed.locationCode) {
      const location = await prisma.qrLocation.findUnique({ where: { code: parsed.locationCode } });
      if (!location) throw new Error('Invalid area QR code');

      await prisma.qrScanLog.create({ data: { userId, qrLocationId: location.id } });
      return { type: 'area', location };
    }

    // Check if it's an operator QR
    if (parsed.employeeId) {
      const operator = await prisma.operator.findUnique({
        where: { employeeId: parsed.employeeId },
        include: { user: { select: { id: true, fullName: true } } }
      });
      if (!operator) throw new Error('Operator not found');
      return { type: 'operator', operator };
    }

    throw new Error('Unrecognized QR code format');
  }

  async getRanking(section?: string) {
    const where: any = {};
    if (section) where.section = section;

    return prisma.operator.findMany({
      where,
      include: { user: { select: { id: true, fullName: true } } },
      orderBy: { performanceScore: 'desc' }
    });
  }
}
