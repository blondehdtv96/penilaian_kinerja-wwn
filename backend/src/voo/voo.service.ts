import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class VooService {
  async create(data: {
    operatorId: number;
    submittedById: number;
    title: string;
    description: string;
    type: string;
    photos?: string;
  }) {
    return prisma.vooSubmission.create({
      data: {
        operatorId: data.operatorId,
        submittedById: data.submittedById,
        title: data.title,
        description: data.description,
        type: data.type || 'VoO',
        photos: data.photos || '[]'
      },
      include: {
        operator: { include: { user: { select: { id: true, fullName: true } } } },
        submittedBy: { select: { id: true, fullName: true } }
      }
    });
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
    const submission = await prisma.vooSubmission.findUnique({ where: { id } });
    if (!submission) throw new Error('Submission not found');
    if (submission.status !== 'pending') throw new Error('Submission already processed');

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

    return updated;
  }

  async approveManager(id: number, managerUserId: number, action: 'approve_final' | 'reject', points?: number, rejectionReason?: string) {
    const submission = await prisma.vooSubmission.findUnique({ where: { id } });
    if (!submission) throw new Error('Submission not found');
    if (submission.status !== 'approved_foreman') throw new Error('Must be approved by Foreman first');

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

    return updated;
  }
}
