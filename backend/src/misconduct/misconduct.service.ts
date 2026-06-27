import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../notifications/notifications.service';
import { emitToRooms } from '../socket/emit';

const prisma = new PrismaClient();
const notifications = new NotificationService();

// Staff Produksi memonitor seluruh catatan disiplin → ikut menerima.
const recordRooms = (operatorUserId: number) => [
  'role:Foreman',
  'role:Section Manager',
  'role:Staff Produksi',
  `user:${operatorUserId}`,
];

export class MisconductService {
  // MISCONDUCT
  async createMisconduct(data: { operatorId: number; createdById: number; type: string; severity: string; description: string; evidencePhotos?: string; points?: number }) {
    const record = await prisma.misconduct.create({
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

    const operatorUserId = record.operator.user.id;
    await notifications.notifyUser(operatorUserId, {
      type: 'warning',
      category: 'misconduct',
      title: 'Pelanggaran tercatat',
      body: record.type,
      entityType: 'Misconduct',
      entityId: record.id,
      link: '/performance',
    });
    await notifications.notifyRole('Section Manager', {
      type: 'info',
      category: 'misconduct',
      title: 'Pelanggaran baru dicatat',
      body: `${record.operator.user.fullName} — ${record.type}`,
      entityType: 'Misconduct',
      entityId: record.id,
      link: '/operators',
    });
    emitToRooms(recordRooms(operatorUserId), 'record:changed', { kind: 'misconduct', id: record.id });

    return record;
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
  async createCounseling(data: {
    operatorId: number;
    foremanId: number;
    topic: string;
    category?: string;
    pws?: string;
    employeeStatement?: string;
    supervisorSuggestion?: string;
    employeeCommitment?: string;
    location?: string;
    notes?: string;
  }) {
    const record = await prisma.counseling.create({
      data: {
        operatorId: data.operatorId,
        foremanId: data.foremanId,
        topic: data.topic,
        category: data.category || 'Others',
        pws: data.pws || '',
        employeeStatement: data.employeeStatement || '',
        supervisorSuggestion: data.supervisorSuggestion || '',
        employeeCommitment: data.employeeCommitment || '',
        location: data.location || '',
        notes: data.notes || ''
      },
      include: {
        operator: { include: { user: { select: { id: true, fullName: true } } } },
        foreman: { select: { id: true, fullName: true } }
      }
    });

    const operatorUserId = record.operator.user.id;
    await notifications.notifyUser(operatorUserId, {
      type: 'info',
      category: 'counseling',
      title: 'Sesi konseling dicatat',
      body: record.topic,
      entityType: 'Counseling',
      entityId: record.id,
      link: '/performance',
    });
    emitToRooms(recordRooms(operatorUserId), 'record:changed', { kind: 'counseling', id: record.id });

    return record;
  }

  /** Section Manager menandatangani / mengetahui sesi konseling. */
  async acknowledgeCounseling(id: number, acknowledgedById: number) {
    const record = await prisma.counseling.update({
      where: { id },
      data: { acknowledgedById, acknowledgedAt: new Date() },
      include: {
        operator: { include: { user: { select: { id: true, fullName: true } } } },
        foreman: { select: { id: true, fullName: true } },
        acknowledgedBy: { select: { id: true, fullName: true } }
      }
    });

    emitToRooms(recordRooms(record.operator.user.id), 'record:changed', { kind: 'counseling', id: record.id });
    return record;
  }

  async getAllCounselings(operatorId?: number) {
    return prisma.counseling.findMany({
      where: operatorId ? { operatorId: Number(operatorId) } : {},
      include: {
        operator: { include: { user: { select: { id: true, fullName: true } } } },
        foreman: { select: { id: true, fullName: true } },
        acknowledgedBy: { select: { id: true, fullName: true } }
      },
      orderBy: { date: 'desc' }
    });
  }

  // KARTU KUNING
  async createKartuKuning(data: { operatorId: number; issuedById: number; reason: string }) {
    const record = await prisma.kartuKuning.create({
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

    const operatorUserId = record.operator.user.id;
    await notifications.notifyUser(operatorUserId, {
      type: 'warning',
      category: 'kartu_kuning',
      title: 'Kartu Kuning diterbitkan',
      body: record.reason,
      entityType: 'KartuKuning',
      entityId: record.id,
      link: '/performance',
    });
    await notifications.notifyRole('Section Manager', {
      type: 'info',
      category: 'kartu_kuning',
      title: 'Kartu Kuning diterbitkan',
      body: `${record.operator.user.fullName} — ${record.reason}`,
      entityType: 'KartuKuning',
      entityId: record.id,
      link: '/operators',
    });
    emitToRooms(recordRooms(operatorUserId), 'record:changed', { kind: 'kartu_kuning', id: record.id });

    return record;
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
    const record = await prisma.suratPeringatan.create({
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

    const operatorUserId = record.operator.user.id;
    await notifications.notifyUser(operatorUserId, {
      type: 'error',
      category: 'surat_peringatan',
      title: `Surat Peringatan level ${record.level} diterbitkan`,
      body: record.reason,
      entityType: 'SuratPeringatan',
      entityId: record.id,
      link: '/performance',
    });
    await notifications.notifyRole('Section Manager', {
      type: 'warning',
      category: 'surat_peringatan',
      title: `Surat Peringatan level ${record.level}`,
      body: `${record.operator.user.fullName} — ${record.reason}`,
      entityType: 'SuratPeringatan',
      entityId: record.id,
      link: '/operators',
    });
    emitToRooms(recordRooms(operatorUserId), 'record:changed', { kind: 'surat_peringatan', id: record.id });

    return record;
  }

  async getAllSuratPeringatan(operatorId?: number) {
    return prisma.suratPeringatan.findMany({
      where: operatorId ? { operatorId: Number(operatorId) } : {},
      include: {
        operator: { include: { user: { select: { id: true, fullName: true } } } },
        issuedBy: { select: { id: true, fullName: true, role: { select: { name: true } } } }
      },
      orderBy: { issuedAt: 'desc' }
    });
  }
}
