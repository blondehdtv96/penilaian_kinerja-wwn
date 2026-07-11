import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../notifications/notifications.service';
import { emitToRooms } from '../socket/emit';
import {
  ValidationError,
  NotFoundError,
  DuplicateError,
  SequenceError,
  ConflictError,
} from './errors';
import { EscalationConfigService } from './escalation.config';
import { shouldNotify } from './escalation';
import { computeCurrentEscalationLevel, KARTU_KUNING_ORDINAL } from './escalation-level';

const prisma = new PrismaClient();
const notifications = new NotificationService();
const escalationConfig = new EscalationConfigService();

/**
 * Bangun batas awal/akhir bulan (inklusif) dari filter `month` (1-12) dan/atau
 * `year`. Mendukung filter bulan+tahun sekaligus, tahun saja (seluruh tahun),
 * atau tidak ada filter (undefined → tidak ada batasan tanggal).
 */
function monthYearRange(filters?: { month?: number | string; year?: number | string }): { gte: Date; lte: Date } | undefined {
  const year = filters?.year !== undefined && filters.year !== '' ? Number(filters.year) : undefined;
  const month = filters?.month !== undefined && filters.month !== '' ? Number(filters.month) : undefined;
  if (year === undefined && month === undefined) return undefined;

  const now = new Date();
  const y = year ?? now.getFullYear();
  if (month !== undefined) {
    // Bulan + tahun tertentu: dari tanggal 1 sampai akhir bulan tersebut.
    const gte = new Date(y, month - 1, 1, 0, 0, 0, 0);
    const lte = new Date(y, month, 0, 23, 59, 59, 999);
    return { gte, lte };
  }
  // Hanya tahun: dari 1 Januari sampai 31 Desember tahun tersebut.
  return {
    gte: new Date(y, 0, 1, 0, 0, 0, 0),
    lte: new Date(y, 11, 31, 23, 59, 59, 999),
  };
}

// Staff Produksi memonitor seluruh catatan disiplin → ikut menerima.
const recordRooms = (operatorUserId: number) => [
  'role:Foreman',
  'role:Section Manager',
  'role:Staff Produksi',
  `user:${operatorUserId}`,
];

/**
 * Input for recording a misconduct. Point value and violation type are driven
 * by the catalog: the caller supplies a `violationTypeId` instead of manual
 * points/type entry (R2.1). Authorization (Foreman/Section Manager) is enforced
 * at the route layer, so a rejected role never reaches this service (R2.4).
 */
export interface CreateMisconductInput {
  operatorId: number;
  createdById: number;
  violationTypeId: number;
  description: string;
  severity?: string; // optional override; defaults to the violation type's severity
  evidencePhotos?: string;
}

export class MisconductService {
  // MISCONDUCT
  /**
   * Record a misconduct against a catalog violation type (R2, R8).
   *
   * The misconduct creation and all operator counter updates happen inside a
   * single Prisma `$transaction`, so any failure rolls back the entire unit and
   * leaves the operator's score/accumulation/counter untouched (R8.3, R8.4).
   *
   * Transaction body:
   *  1. Load the violation type by id; reject if missing (R2.2). Inactive types
   *     are allowed and their points are still applied (R2.5).
   *  2. Load the operator; reject with a not-found error if missing (R2.3).
   *  3. Snapshot `points` and `violationTypeId` onto the new misconduct (R2.1).
   *  4. Recompute operator counters from ground truth:
   *       - `accumulatedPoints = sum(active misconduct points)` (R2.8, R8.1)
   *       - `totalMisconduct = count(misconducts)` (R2.6, R8.2)
   *       - `performanceScore = max(0, performanceScore - points)` (R2.7)
   *
   * After the transaction commits, notifications are delivered to the operator
   * and the Section Manager role and a `record:changed` signal is emitted (R2.9).
   */
  async createMisconduct(data: CreateMisconductInput) {
    const operatorId = Number(data.operatorId);
    const violationTypeId = Number(data.violationTypeId);

    const record = await prisma.$transaction(async (tx) => {
      // 1. Load the violation type (inactive allowed, R2.5); reject if missing (R2.2).
      const violationType = await tx.violationType.findUnique({
        where: { id: violationTypeId },
      });
      if (!violationType) {
        throw new ValidationError(
          `Violation type ${violationTypeId} does not exist.`,
          'violationTypeId',
        );
      }

      // 2. Load the operator; reject with a not-found error if missing (R2.3).
      const operator = await tx.operator.findUnique({ where: { id: operatorId } });
      if (!operator) {
        throw new NotFoundError(`Operator ${operatorId} does not exist.`);
      }

      // 3. Snapshot the catalog point value and violation type onto the record (R2.1).
      const points = violationType.points;
      const created = await tx.misconduct.create({
        data: {
          operatorId,
          createdById: data.createdById,
          violationTypeId,
          type: violationType.name,
          severity: data.severity || violationType.severity || 'low',
          description: data.description,
          evidencePhotos: data.evidencePhotos || '[]',
          points,
        },
        include: {
          operator: { include: { user: { select: { id: true, fullName: true } } } },
          createdBy: { select: { id: true, fullName: true } },
        },
      });

      // 4. Recompute operator counters from ground truth inside the same
      //    transaction so they stay consistent with the misconduct set.
      const activeAgg = await tx.misconduct.aggregate({
        where: { operatorId, isActive: true },
        _sum: { points: true },
      });
      const accumulatedPoints = activeAgg._sum.points ?? 0; // R2.8, R8.1
      const totalMisconduct = await tx.misconduct.count({ where: { operatorId } }); // R2.6, R8.2
      const performanceScore = Math.max(0, operator.performanceScore - points); // R2.7

      await tx.operator.update({
        where: { id: operatorId },
        data: { accumulatedPoints, totalMisconduct, performanceScore },
      });

      return created;
    }, { maxWait: 15_000, timeout: 15_000 });
    // Explicit generous timeouts: Prisma's interactive-transaction default
    // (5s) can be exceeded under heavy concurrent load (e.g. the test suite
    // running many property-based tests against SQLite in parallel), which
    // would otherwise surface as a spurious "Transaction not found" error
    // unrelated to the business logic under test.

    // --- Post-commit side effects (outside the transaction) ---
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

    // --- Escalation engine invocation (R4.2, R4.4, R4.5) ---
    // The operator's accumulatedPoints just changed inside the transaction, so
    // re-evaluate escalation against the active thresholds. `shouldNotify` is a
    // pure gate that returns true only when the required step is strictly higher
    // than the operator's current escalation level (highest step already issued),
    // which inherently suppresses duplicate step-due notifications (R4.5).
    const thresholds = await escalationConfig.getActiveThresholds();
    const currentLevel = await computeCurrentEscalationLevel(prisma, operatorId);
    const committed = await prisma.operator.findUnique({
      where: { id: operatorId },
      select: { accumulatedPoints: true },
    });
    const accumulatedPoints = committed?.accumulatedPoints ?? 0;

    if (shouldNotify(accumulatedPoints, thresholds, currentLevel)) {
      const stepDue = {
        type: 'warning' as const,
        category: 'misconduct',
        title: 'Langkah eskalasi disiplin jatuh tempo',
        body: `${record.operator.user.fullName} mencapai ${accumulatedPoints} poin akumulasi — langkah disiplin berikutnya perlu diterbitkan.`,
        entityType: 'Operator',
        entityId: operatorId,
        link: '/operators',
      };
      await notifications.notifyRole('Foreman', stepDue);
      await notifications.notifyRole('Section Manager', stepDue);
    }
    // When shouldNotify is false the required step is at or below the current
    // escalation level, so the step-due notification is suppressed (R4.5).

    return record;
  }

  async getAllMisconducts(filters?: { operatorId?: number; severity?: string; counselingStatus?: string; month?: number | string; year?: number | string }) {
    const where: any = {};
    if (filters?.operatorId) where.operatorId = Number(filters.operatorId);
    if (filters?.severity) where.severity = filters.severity;
    // Filter berdasarkan status tindak lanjut konseling.
    if (filters?.counselingStatus === 'pending') where.counseling = { is: null };
    if (filters?.counselingStatus === 'done') where.counseling = { isNot: null };
    // Filter riwayat berdasarkan bulan/tahun (R: Filter Data).
    const range = monthYearRange(filters);
    if (range) where.createdAt = range;

    return prisma.misconduct.findMany({
      where,
      include: {
        operator: { include: { user: { select: { id: true, fullName: true } } } },
        createdBy: { select: { id: true, fullName: true } },
        // Sertakan sesi konseling (bila ada) agar frontend bisa menampilkan status progres.
        counseling: {
          select: { id: true, topic: true, date: true, acknowledgedAt: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /** Daftar pelanggaran milik operator yang sedang login (berdasarkan userId). */
  async getMyMisconducts(userId: number, filters?: { month?: number | string; year?: number | string }) {
    const operator = await prisma.operator.findUnique({ where: { userId } });
    if (!operator) return [];

    const where: any = { operatorId: operator.id };
    const range = monthYearRange(filters);
    if (range) where.createdAt = range;

    return prisma.misconduct.findMany({
      where,
      include: {
        operator: {
          include: {
            user: { select: { id: true, fullName: true } }
          }
        },
        // Sertakan role pemberi pelanggaran (Foreman/Section Manager) agar operator
        // tahu siapa yang menerbitkan pelanggaran ini.
        createdBy: { select: { id: true, fullName: true, role: { select: { name: true } } } },
        counseling: { select: { id: true, topic: true, date: true, acknowledgedAt: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // COUNSELING
  /**
   * Create a counseling record tied to an existing misconduct (R3.1–R3.3, R3.6).
   *
   * Rejects when no existing misconduct is referenced (`NotFoundError`, R3.1)
   * or when the referenced misconduct already has a counseling
   * (`DuplicateError`, one-to-one rule, R3.2). The counseling's operator is
   * always derived from the referenced misconduct (R3.3) — any `operatorId`
   * supplied by the caller is ignored. Notifies the affected operator on
   * creation (R3.6).
   */
  async createCounseling(data: {
    foremanId: number;
    misconductId: number;
    topic: string;
    category?: string;
    pws?: string;
    employeeStatement?: string;
    supervisorSuggestion?: string;
    employeeCommitment?: string;
    location?: string;
    notes?: string;
  }) {
    // Alur wajib: pelanggaran (Misconduct) harus sudah diinput lebih dulu (R3.1).
    if (!data.misconductId) {
      throw new NotFoundError(
        'Konseling harus mengacu pada pelanggaran (misconduct) yang sudah diinput terlebih dahulu.',
      );
    }

    const misconduct = await prisma.misconduct.findUnique({
      where: { id: Number(data.misconductId) },
      include: { counseling: { select: { id: true } } }
    });

    if (!misconduct) {
      throw new NotFoundError(
        `Pelanggaran (misconduct) ${data.misconductId} tidak ditemukan. Input pelanggaran terlebih dahulu.`,
      );
    }
    if (misconduct.counseling) {
      throw new DuplicateError('Pelanggaran ini sudah memiliki sesi konseling.');
    }

    const record = await prisma.counseling.create({
      data: {
        operatorId: misconduct.operatorId, // R3.3: inherited from the referenced misconduct
        foremanId: data.foremanId,
        misconductId: misconduct.id,
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
        foreman: { select: { id: true, fullName: true } },
        misconduct: { select: { id: true, type: true, severity: true } }
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

  /**
   * Section Manager mengakui / menandatangani sesi konseling (R3.4, R3.5).
   *
   * Records the acknowledging user identity and timestamp only when the
   * counseling is not yet acknowledged. Re-acknowledgment is rejected with a
   * `ConflictError`, leaving the original acknowledging identity and
   * timestamp unchanged. The read-then-conditional-write below uses
   * `updateMany` guarded by `acknowledgedAt: null` so the "already
   * acknowledged" check and the write itself are atomic at the database
   * level (no separate read-then-write race window).
   */
  async acknowledgeCounseling(id: number, acknowledgedById: number) {
    const result = await prisma.counseling.updateMany({
      where: { id, acknowledgedAt: null },
      data: { acknowledgedById, acknowledgedAt: new Date() },
    });

    if (result.count === 0) {
      const existing = await prisma.counseling.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundError(`Counseling ${id} does not exist.`);
      }
      throw new ConflictError(`Counseling ${id} has already been acknowledged.`);
    }

    const record = await prisma.counseling.findUniqueOrThrow({
      where: { id },
      include: {
        operator: { include: { user: { select: { id: true, fullName: true } } } },
        foreman: { select: { id: true, fullName: true } },
        acknowledgedBy: { select: { id: true, fullName: true } }
      }
    });

    emitToRooms(recordRooms(record.operator.user.id), 'record:changed', { kind: 'counseling', id: record.id });
    return record;
  }

  async getAllCounselings(operatorId?: number, filters?: { month?: number | string; year?: number | string }) {
    const where: any = {};
    if (operatorId) where.operatorId = Number(operatorId);
    const range = monthYearRange(filters);
    if (range) where.date = range;

    return prisma.counseling.findMany({
      where,
      include: {
        operator: { include: { user: { select: { id: true, fullName: true } } } },
        foreman: { select: { id: true, fullName: true } },
        acknowledgedBy: { select: { id: true, fullName: true } },
        misconduct: { select: { id: true, type: true, severity: true, description: true } }
      },
      orderBy: { date: 'desc' }
    });
  }

  // KARTU KUNING
  /**
   * Issue a kartu kuning for an operator (R5.1–R5.5).
   *
   * Rejects unknown operators (`NotFoundError`, R5.3). Snapshots
   * `accumulatedPointsAtIssuance` from the operator's current
   * `accumulatedPoints` and links every currently-active misconduct as a
   * contributing record (their points sum equals `accumulatedPoints` by the
   * R8.1 invariant), recording the issuing user + timestamp (R5.1). Flags
   * `isManualOverride` when the operator is below the kartu kuning threshold
   * (R5.2), which also bypasses the duplicate-at-level guard: a non-override
   * issuance is rejected when the operator's current escalation level (the
   * highest step already issued, computed BEFORE this issuance) is already
   * at the kartu kuning step, i.e. a kartu kuning was already issued and the
   * operator has not escalated further since (R5.4). Notifies the operator +
   * Section Manager (R5.5).
   */
  async createKartuKuning(data: { operatorId: number; issuedById: number; reason: string }) {
    const operatorId = Number(data.operatorId);

    const operator = await prisma.operator.findUnique({ where: { id: operatorId } });
    if (!operator) {
      throw new NotFoundError(`Operator ${operatorId} does not exist.`);
    }

    const thresholds = await escalationConfig.getActiveThresholds();
    const accumulatedPoints = operator.accumulatedPoints;
    const isManualOverride = accumulatedPoints < thresholds.kartuKuning; // R5.2

    // Current escalation level BEFORE this issuance (R5.4).
    const currentLevel = await computeCurrentEscalationLevel(prisma, operatorId);
    if (!isManualOverride && currentLevel === KARTU_KUNING_ORDINAL) {
      throw new DuplicateError(
        `Operator ${operatorId} already has an active Kartu Kuning at the current escalation level.`,
      );
    }

    const activeMisconducts = await prisma.misconduct.findMany({
      where: { operatorId, isActive: true },
      select: { id: true },
    });

    const record = await prisma.kartuKuning.create({
      data: {
        operatorId,
        issuedById: data.issuedById,
        reason: data.reason,
        accumulatedPointsAtIssuance: accumulatedPoints,
        escalationLevelAtIssuance: KARTU_KUNING_ORDINAL,
        isManualOverride,
        contributingMisconducts: {
          create: activeMisconducts.map((m) => ({ misconductId: m.id })),
        },
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

  async getAllKartuKuning(operatorId?: number, filters?: { month?: number | string; year?: number | string }) {
    const where: any = {};
    if (operatorId) where.operatorId = Number(operatorId);
    const range = monthYearRange(filters);
    if (range) where.issuedAt = range;

    return prisma.kartuKuning.findMany({
      where,
      include: {
        operator: { include: { user: { select: { id: true, fullName: true } } } },
        issuedBy: { select: { id: true, fullName: true } }
      },
      orderBy: { issuedAt: 'desc' }
    });
  }

  /** Kartu kuning milik operator yang sedang login (self-view, R5.7). */
  async getMyKartuKuning(userId: number, filters?: { month?: number | string; year?: number | string }) {
    const operator = await prisma.operator.findUnique({ where: { userId } });
    if (!operator) return [];
    return this.getAllKartuKuning(operator.id, filters);
  }

  // SURAT PERINGATAN
  /**
   * Issue a surat peringatan for an operator (R6.1–R6.4, R6.6, R6.7).
   *
   * `level` must be exactly 1, 2, or 3 (`ValidationError`, R6.3). Strict
   * sequencing: level N > 1 requires every level 1..N-1 to already be issued
   * (`SequenceError`, R6.2). A level already issued to the operator is
   * rejected (`DuplicateError`, R6.7). Snapshots `accumulatedPointsAtIssuance`
   * and links every active misconduct as a contributing record (R6.1). Flags
   * `isManualOverride` when the operator is below the threshold configured
   * for the issued level (R6.6). Notifies the operator + Section Manager
   * (R6.4).
   */
  async createSuratPeringatan(data: { operatorId: number; issuedById: number; level: number; reason: string }) {
    const operatorId = Number(data.operatorId);
    const level = Number(data.level);

    if (!Number.isInteger(level) || (level !== 1 && level !== 2 && level !== 3)) {
      throw new ValidationError('Level surat peringatan harus bernilai 1, 2, atau 3.', 'level');
    }

    const operator = await prisma.operator.findUnique({ where: { id: operatorId } });
    if (!operator) {
      throw new NotFoundError(`Operator ${operatorId} does not exist.`);
    }

    const existing = await prisma.suratPeringatan.findMany({
      where: { operatorId },
      select: { level: true },
    });
    const issuedLevels = new Set(existing.map((s) => s.level));

    if (issuedLevels.has(level)) {
      throw new DuplicateError(
        `Surat Peringatan level ${level} sudah pernah diterbitkan untuk operator ${operatorId}.`,
      );
    }
    for (let l = 1; l < level; l++) {
      if (!issuedLevels.has(l)) {
        throw new SequenceError(
          `Surat Peringatan level ${l} harus diterbitkan sebelum level ${level}.`,
        );
      }
    }

    const thresholds = await escalationConfig.getActiveThresholds();
    const accumulatedPoints = operator.accumulatedPoints;
    const levelThreshold =
      level === 1 ? thresholds.sp1 : level === 2 ? thresholds.sp2 : thresholds.sp3;
    const isManualOverride = accumulatedPoints < levelThreshold; // R6.6

    const activeMisconducts = await prisma.misconduct.findMany({
      where: { operatorId, isActive: true },
      select: { id: true },
    });

    const record = await prisma.suratPeringatan.create({
      data: {
        operatorId,
        issuedById: data.issuedById,
        level,
        reason: data.reason,
        accumulatedPointsAtIssuance: accumulatedPoints,
        isManualOverride,
        contributingMisconducts: {
          create: activeMisconducts.map((m) => ({ misconductId: m.id })),
        },
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

  /** Surat peringatan diurutkan menaik berdasarkan level (R6.5). */
  async getAllSuratPeringatan(operatorId?: number, filters?: { month?: number | string; year?: number | string }) {
    const where: any = {};
    if (operatorId) where.operatorId = Number(operatorId);
    const range = monthYearRange(filters);
    if (range) where.issuedAt = range;

    return prisma.suratPeringatan.findMany({
      where,
      include: {
        operator: { include: { user: { select: { id: true, fullName: true } } } },
        issuedBy: { select: { id: true, fullName: true, role: { select: { name: true } } } }
      },
      orderBy: [{ level: 'asc' }, { issuedAt: 'asc' }]
    });
  }
}
