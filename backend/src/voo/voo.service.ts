import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../notifications/notifications.service';
import { emitToRooms } from '../socket/emit';

const prisma = new PrismaClient();
const notifications = new NotificationService();

// Room yang perlu refetch saat status VoO berubah (efemeral, untuk live-refresh halaman).
// Staff Produksi memonitor seluruh pengajuan → ikut menerima.
const vooRooms = (operatorUserId: number) => [
  'role:Foreman',
  'role:Section Manager',
  'role:Staff Produksi',
  `user:${operatorUserId}`,
];

export class VooService {
  async create(data: {
    operatorId: number;
    submittedById: number;
    title: string;
    description: string;
    type: string;
    groupShift?: string;
    sumberVoo?: string;
    kategori4m?: string;
    classification?: string;
    photos?: string;
  }) {
    const submission = await prisma.vooSubmission.create({
      data: {
        operatorId: data.operatorId,
        submittedById: data.submittedById,
        title: data.title,
        description: data.description,
        type: data.type || 'VoO',
        groupShift: data.groupShift || '',
        sumberVoo: data.sumberVoo || '',
        kategori4m: data.kategori4m || '',
        classification: data.classification || '[]',
        photos: data.photos || '[]'
      },
      include: {
        operator: { include: { user: { select: { id: true, fullName: true } } } },
        submittedBy: { select: { id: true, fullName: true } }
      }
    });

    const label = submission.type === 'IdeKaizen' ? 'Ide Kaizen' : 'VoO';
    await notifications.notifyRole('Foreman', {
      type: 'info',
      category: 'voo',
      title: `${label} baru diajukan`,
      body: `${submission.operator.user.fullName} — ${submission.title}`,
      entityType: 'VooSubmission',
      entityId: submission.id,
      link: '/voo/approve',
    });
    emitToRooms(vooRooms(submission.operator.user.id), 'voo:changed', { id: submission.id });

    return submission;
  }

  async getAll(filters?: { status?: string; operatorId?: number; type?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.operatorId) where.operatorId = Number(filters.operatorId);
    if (filters?.type) where.type = filters.type;

    return prisma.vooSubmission.findMany({
      where,
      include: {
        operator: { include: { user: { select: { id: true, fullName: true } } } },
        submittedBy: { select: { id: true, fullName: true } },
        approvals: { include: { approver: { select: { id: true, fullName: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getById(id: number) {
    const submission = await prisma.vooSubmission.findUnique({
      where: { id },
      include: {
        operator: { include: { user: { select: { id: true, fullName: true } } } },
        submittedBy: { select: { id: true, fullName: true } },
        approvals: { include: { approver: { select: { id: true, fullName: true } } } },
        blockchainHashes: true
      }
    });
    if (!submission) throw new Error('VoO submission not found');
    return submission;
  }

  async getForOperator(userId: number) {
    const operator = await prisma.operator.findUnique({ where: { userId } });
    if (!operator) throw new Error('Operator profile not found');

    return prisma.vooSubmission.findMany({
      where: { operatorId: operator.id },
      include: {
        submittedBy: { select: { id: true, fullName: true } },
        approvals: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approveForeman(id: number, foremanUserId: number, action: 'approve_foreman' | 'reject', rejectionReason?: string) {
    const submission = await prisma.vooSubmission.findUnique({
      where: { id },
      include: { operator: { include: { user: { select: { id: true, fullName: true } } } } }
    });
    if (!submission) throw new Error('Submission not found');
    if (submission.status !== 'pending') throw new Error('Submission already processed');

    const operatorUserId = submission.operator.user.id;

    if (action === 'reject') {
      const updated = await prisma.vooSubmission.update({
        where: { id },
        data: { status: 'rejected', rejectionReason: rejectionReason || 'Rejected by Foreman' }
      });

      await prisma.approval.create({
        data: {
          entityType: 'VooSubmission',
          entityId: id,
          approverId: foremanUserId,
          action: 'reject',
          notes: rejectionReason,
          vooSubmissionId: id
        }
      });

      await notifications.notifyUser(operatorUserId, {
        type: 'error',
        category: 'voo',
        title: 'VoO/Ide Kaizen ditolak',
        body: rejectionReason || 'Ditolak oleh Foreman',
        entityType: 'VooSubmission',
        entityId: id,
        link: '/voo/my',
      });
      emitToRooms(vooRooms(operatorUserId), 'voo:changed', { id });

      return updated;
    }

    const updated = await prisma.vooSubmission.update({
      where: { id },
      data: { status: 'approved_foreman', foremanApprovedBy: foremanUserId }
    });

    await prisma.approval.create({
      data: {
        entityType: 'VooSubmission',
        entityId: id,
        approverId: foremanUserId,
        action: 'approve',
        notes: 'Approved by Foreman',
        vooSubmissionId: id
      }
    });

    await notifications.notifyUser(operatorUserId, {
      type: 'success',
      category: 'voo',
      title: 'VoO disetujui Foreman',
      body: 'Menunggu persetujuan final Section Manager',
      entityType: 'VooSubmission',
      entityId: id,
      link: '/voo/my',
    });
    await notifications.notifyRole('Section Manager', {
      type: 'info',
      category: 'voo',
      title: 'VoO perlu persetujuan final',
      body: `${submission.operator.user.fullName} — ${submission.title}`,
      entityType: 'VooSubmission',
      entityId: id,
      link: '/voo/final',
    });
    emitToRooms(vooRooms(operatorUserId), 'voo:changed', { id });

    return updated;
  }

  async approveManager(id: number, managerUserId: number, action: 'approve_final' | 'reject', points?: number, rejectionReason?: string) {
    const submission = await prisma.vooSubmission.findUnique({
      where: { id },
      include: { operator: { include: { user: { select: { id: true, fullName: true } } } } }
    });
    if (!submission) throw new Error('Submission not found');
    if (submission.status !== 'approved_foreman') throw new Error('Must be approved by Foreman first');

    const operatorUserId = submission.operator.user.id;

    if (action === 'reject') {
      const updated = await prisma.vooSubmission.update({
        where: { id },
        data: { status: 'rejected', rejectionReason: rejectionReason || 'Rejected by Section Manager' }
      });

      await prisma.approval.create({
        data: {
          entityType: 'VooSubmission',
          entityId: id,
          approverId: managerUserId,
          action: 'reject',
          notes: rejectionReason,
          vooSubmissionId: id
        }
      });

      await notifications.notifyUser(operatorUserId, {
        type: 'error',
        category: 'voo',
        title: 'VoO ditolak Section Manager',
        body: rejectionReason || 'Ditolak oleh Section Manager',
        entityType: 'VooSubmission',
        entityId: id,
        link: '/voo/my',
      });
      emitToRooms(vooRooms(operatorUserId), 'voo:changed', { id });

      return updated;
    }

    const awardedPoints = points || 10;
    const updated = await prisma.vooSubmission.update({
      where: { id },
      data: {
        status: 'approved_final',
        managerApprovedBy: managerUserId,
        points: awardedPoints
      }
    });

    // Add merit points to operator
    await prisma.operator.update({
      where: { id: submission.operatorId },
      data: {
        totalMerit: { increment: 1 },
        performanceScore: { increment: awardedPoints * 0.5 }
      }
    });

    await prisma.approval.create({
      data: {
        entityType: 'VooSubmission',
        entityId: id,
        approverId: managerUserId,
        action: 'approve',
        notes: `Final approval, ${awardedPoints} points awarded`,
        vooSubmissionId: id
      }
    });

    await notifications.notifyUser(operatorUserId, {
      type: 'success',
      category: 'voo',
      title: 'VoO disetujui final 🎉',
      body: `Selamat! +${awardedPoints} poin ditambahkan ke kinerjamu`,
      entityType: 'VooSubmission',
      entityId: id,
      link: '/voo/my',
      data: { points: awardedPoints },
    });
    emitToRooms(vooRooms(operatorUserId), 'voo:changed', { id });

    return updated;
  }
}
