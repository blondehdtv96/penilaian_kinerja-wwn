import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MisconductService {
  // MISCONDUCT
  async createMisconduct(data: { operatorId: number; createdById: number; type: string; severity: string; description: string; evidencePhotos?: string; points?: number }) {
    return prisma.misconduct.create({
      data: {
        operatorId: data.operatorId,
        createdById: data.createdById,
        type: data.type,
        severity: data.severity || 'low',
        description: data.description,
        evidencePhotos: data.evidencePhotos || '[]',
        points: data.points || 0
      },
      include: {
        operator: { include: { user: { select: { id: true, fullName: true } } } },
        createdBy: { select: { id: true, fullName: true } }
      }
    });
  }

  async getAllMisconducts(filters?: { operatorId?: number; severity?: string }) {
    const where: any = {};
    if (filters?.operatorId) where.operatorId = Number(filters.operatorId);
    if (filters?.severity) where.severity = filters.severity;

    return prisma.misconduct.findMany({
      where,
      include: {
        operator: { include: { user: { select: { id: true, fullName: true } } } },
        createdBy: { select: { id: true, fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // COUNSELING
  async createCounseling(data: { operatorId: number; foremanId: number; topic: string; notes?: string }) {
    return prisma.counseling.create({
      data: {
        operatorId: data.operatorId,
        foremanId: data.foremanId,
        topic: data.topic,
        notes: data.notes || ''
      },
      include: {
        operator: { include: { user: { select: { id: true, fullName: true } } } },
        foreman: { select: { id: true, fullName: true } }
      }
    });
  }

  async getAllCounselings(operatorId?: number) {
    return prisma.counseling.findMany({
      where: operatorId ? { operatorId: Number(operatorId) } : {},
      include: {
        operator: { include: { user: { select: { id: true, fullName: true } } } },
        foreman: { select: { id: true, fullName: true } }
      },
      orderBy: { date: 'desc' }
    });
  }

  // KARTU KUNING
  async createKartuKuning(data: { operatorId: number; issuedById: number; reason: string }) {
    return prisma.kartuKuning.create({
      data: {
        operatorId: data.operatorId,
        issuedById: data.issuedById,
        reason: data.reason
      },
      include: {
        operator: { include: { user: { select: { id: true, fullName: true } } } },
        issuedBy: { select: { id: true, fullName: true } }
      }
    });
  }

  async getAllKartuKuning(operatorId?: number) {
    return prisma.kartuKuning.findMany({
      where: operatorId ? { operatorId: Number(operatorId) } : {},
      include: {
        operator: { include: { user: { select: { id: true, fullName: true } } } },
        issuedBy: { select: { id: true, fullName: true } }
      },
      orderBy: { issuedAt: 'desc' }
    });
  }

  // SURAT PERINGATAN
  async createSuratPeringatan(data: { operatorId: number; issuedById: number; level: number; reason: string }) {
    return prisma.suratPeringatan.create({
      data: {
        operatorId: data.operatorId,
        issuedById: data.issuedById,
        level: data.level,
        reason: data.reason
      },
      include: {
        operator: { include: { user: { select: { id: true, fullName: true } } } },
        issuedBy: { select: { id: true, fullName: true } }
      }
    });
  }

  async getAllSuratPeringatan(operatorId?: number) {
    return prisma.suratPeringatan.findMany({
      where: operatorId ? { operatorId: Number(operatorId) } : {},
      include: {
        operator: { include: { user: { select: { id: true, fullName: true } } } },
        issuedBy: { select: { id: true, fullName: true } }
      },
      orderBy: { issuedAt: 'desc' }
    });
  }
}
