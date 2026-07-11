/**
 * Integrated disciplinary history assembly (R7).
 *
 * Assembles an operator's misconducts, counselings, kartu kuning, and surat
 * peringatan records, each ordered chronologically ascending, together with
 * linkage references and the operator's current accumulated points and
 * escalation step. See design.md section "7. Disciplinary History Service".
 */
import { PrismaClient } from '@prisma/client';
import { NotFoundError, AuthorizationError } from './errors';
import { EscalationConfigService } from './escalation.config';
import { requiredStep, StepOrdinal } from './escalation';

const prisma = new PrismaClient();
const escalationConfig = new EscalationConfigService();

export interface DisciplinaryHistory {
  operatorId: number;
  accumulatedPoints: number;
  currentStep: StepOrdinal;
  misconducts: Array<{
    id: number;
    type: string;
    severity: string;
    description: string;
    points: number;
    isActive: boolean;
    createdAt: Date;
    counselingId: number | null; // linkage: misconduct → its counseling, if any
  }>;
  counselings: Array<{
    id: number;
    topic: string;
    misconductId: number | null; // linkage: counseling → misconduct (R7.2)
    acknowledgedAt: Date | null;
    createdAt: Date;
  }>;
  kartuKuning: Array<{
    id: number;
    reason: string;
    accumulatedPointsAtIssuance: number;
    isManualOverride: boolean;
    contributingMisconductIds: number[]; // linkage: KK → contributing misconducts (R7.2)
    createdAt: Date;
  }>;
  suratPeringatan: Array<{
    id: number;
    level: number;
    reason: string;
    accumulatedPointsAtIssuance: number;
    isManualOverride: boolean;
    contributingMisconductIds: number[]; // linkage: SP → contributing misconducts (R7.2)
    createdAt: Date;
  }>;
}

export class DisciplinaryHistoryService {
  /**
   * Assemble the full disciplinary history for an operator (R7.1–R7.3).
   *
   * Rejects with `NotFoundError` when the operator does not exist, returning
   * no records (R7.5). When `requester` is provided and identifies an
   * Operator role, the request is rejected with `AuthorizationError` unless
   * the requester is the operator themselves (R7.4, R7.6).
   */
  async getDisciplinaryHistory(
    operatorId: number,
    requester?: { role: string; operatorId?: number },
  ): Promise<DisciplinaryHistory> {
    const operator = await prisma.operator.findUnique({ where: { id: operatorId } });
    if (!operator) {
      throw new NotFoundError(`Operator ${operatorId} does not exist.`); // R7.5
    }

    if (requester && requester.role === 'Operator' && requester.operatorId !== operatorId) {
      throw new AuthorizationError(
        'Operators may only view their own disciplinary history.', // R7.6
      );
    }

    const [misconducts, counselings, kartuKuningRows, suratRows] = await Promise.all([
      prisma.misconduct.findMany({
        where: { operatorId },
        orderBy: { createdAt: 'asc' }, // R7.1
        include: { counseling: { select: { id: true } } },
      }),
      prisma.counseling.findMany({
        where: { operatorId },
        orderBy: { createdAt: 'asc' }, // R7.1
      }),
      prisma.kartuKuning.findMany({
        where: { operatorId },
        orderBy: { createdAt: 'asc' }, // R7.1
        include: { contributingMisconducts: { select: { misconductId: true } } },
      }),
      prisma.suratPeringatan.findMany({
        where: { operatorId },
        orderBy: { createdAt: 'asc' }, // R7.1
        include: { contributingMisconducts: { select: { misconductId: true } } },
      }),
    ]);

    const thresholds = await escalationConfig.getActiveThresholds();
    const currentStep = requiredStep(operator.accumulatedPoints, thresholds); // R7.3

    return {
      operatorId,
      accumulatedPoints: operator.accumulatedPoints, // R7.3
      currentStep,
      misconducts: misconducts.map((m) => ({
        id: m.id,
        type: m.type,
        severity: m.severity,
        description: m.description,
        points: m.points,
        isActive: m.isActive,
        createdAt: m.createdAt,
        counselingId: m.counseling?.id ?? null,
      })),
      counselings: counselings.map((c) => ({
        id: c.id,
        topic: c.topic,
        misconductId: c.misconductId ?? null, // R7.2
        acknowledgedAt: c.acknowledgedAt,
        createdAt: c.createdAt,
      })),
      kartuKuning: kartuKuningRows.map((kk) => ({
        id: kk.id,
        reason: kk.reason,
        accumulatedPointsAtIssuance: kk.accumulatedPointsAtIssuance,
        isManualOverride: kk.isManualOverride,
        contributingMisconductIds: kk.contributingMisconducts.map((c) => c.misconductId), // R7.2
        createdAt: kk.createdAt,
      })),
      suratPeringatan: suratRows.map((sp) => ({
        id: sp.id,
        level: sp.level,
        reason: sp.reason,
        accumulatedPointsAtIssuance: sp.accumulatedPointsAtIssuance,
        isManualOverride: sp.isManualOverride,
        contributingMisconductIds: sp.contributingMisconducts.map((c) => c.misconductId), // R7.2
        createdAt: sp.createdAt,
      })),
    };
  }
}
