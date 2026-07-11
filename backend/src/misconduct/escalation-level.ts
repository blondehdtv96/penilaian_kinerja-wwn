/**
 * Shared helper for computing an operator's current escalation level (the
 * highest disciplinary step already issued to them), used by both
 * `misconduct.service.ts` (post-creation escalation check, R4.2/R4.4/R4.5)
 * and `disciplinary-history.service.ts` (R7.3).
 *
 * Kept in its own module (rather than duplicated) so the two call sites can
 * never drift apart on what "current escalation level" means.
 */
import { PrismaClient } from '@prisma/client';
import { StepOrdinal } from './escalation';

/**
 * Ordinal of the KARTU_KUNING step in the fixed escalation sequence
 * (design "Disciplinary Step Model": 1=COUNSELING, 2=KARTU_KUNING, 3=SP1,
 * 4=SP2, 5=SP3). Used as the fallback level for a kartu kuning whose
 * `escalationLevelAtIssuance` predates the escalation wiring (default 0).
 */
export const KARTU_KUNING_ORDINAL = 2 as const;

/**
 * Computes an operator's current escalation level: the highest disciplinary
 * step already issued to them, expressed as a `StepOrdinal`
 * (1=COUNSELING, 2=KARTU_KUNING, 3=SP1, 4=SP2, 5=SP3; 0 = none).
 *
 * The level is the maximum across:
 *  - counseling presence  → ordinal 1,
 *  - issued kartu kuning  → its `escalationLevelAtIssuance`, falling back to
 *    the KARTU_KUNING ordinal (2) for legacy rows issued before escalation
 *    levels were snapshotted,
 *  - issued surat peringatan → its `level` mapped to an ordinal (SP1→3,
 *    SP2→4, SP3→5).
 */
export async function computeCurrentEscalationLevel(
  prisma: PrismaClient,
  operatorId: number,
): Promise<StepOrdinal> {
  const [counselingCount, kartuKuningRows, suratRows] = await Promise.all([
    prisma.counseling.count({ where: { operatorId } }),
    prisma.kartuKuning.findMany({
      where: { operatorId },
      select: { escalationLevelAtIssuance: true },
    }),
    prisma.suratPeringatan.findMany({
      where: { operatorId },
      select: { level: true },
    }),
  ]);

  let level = 0;
  if (counselingCount > 0) level = Math.max(level, 1); // COUNSELING → 1
  for (const kk of kartuKuningRows) {
    level = Math.max(level, kk.escalationLevelAtIssuance || KARTU_KUNING_ORDINAL);
  }
  for (const sp of suratRows) {
    if (sp.level >= 1 && sp.level <= 3) level = Math.max(level, sp.level + 2); // SP1→3, SP2→4, SP3→5
  }

  // Clamp into the StepOrdinal domain (0..5) to stay within the engine's contract.
  return Math.min(Math.max(level, 0), 5) as StepOrdinal;
}
