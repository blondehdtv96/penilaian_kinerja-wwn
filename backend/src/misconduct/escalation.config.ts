/**
 * Escalation threshold configuration service for the Integrated Misconduct System.
 *
 * This module bridges the pure escalation engine (`escalation.ts`) with
 * persistence. It loads the single-row `EscalationConfig` override when present
 * and falls back to the fixed defaults otherwise, and it validates + persists
 * Section Manager overrides.
 *
 * See design.md section "4. Escalation Config".
 *   - getActiveThresholds() returns the persisted override row or the defaults
 *     when absent (R4.6).
 *   - setThresholds(input) delegates to `validateThresholds`; on success it
 *     upserts the single row, on failure it throws a `ValidationError` and
 *     leaves the previously active values unchanged (R4.7).
 */

import { PrismaClient } from '@prisma/client';
import {
  DEFAULT_THRESHOLDS,
  Thresholds,
  validateThresholds,
} from './escalation';
import { ValidationError } from './errors';

const prisma = new PrismaClient();

export class EscalationConfigService {
  /**
   * Returns the currently active escalation thresholds. When a Section Manager
   * has persisted an override row it is returned; otherwise the fixed defaults
   * from the pure engine are used. (R4.6)
   */
  async getActiveThresholds(): Promise<Thresholds> {
    const row = await prisma.escalationConfig.findFirst();
    if (!row) {
      return { ...DEFAULT_THRESHOLDS };
    }
    return {
      counseling: row.counseling,
      kartuKuning: row.kartuKuning,
      sp1: row.sp1,
      sp2: row.sp2,
      sp3: row.sp3,
    };
  }

  /**
   * Validates and persists a candidate threshold configuration. Delegates the
   * validation rules (integers >= 1, strictly increasing across steps) to the
   * pure `validateThresholds`. On validation failure it throws a
   * `ValidationError` and does NOT persist, so the previously active thresholds
   * remain unchanged. On success it upserts the single override row and returns
   * the normalized thresholds. (R4.7)
   *
   * @param input       Candidate configuration (untrusted shape).
   * @param updatedById Optional id of the Section Manager applying the override.
   */
  async setThresholds(input: unknown, updatedById?: number): Promise<Thresholds> {
    const result = validateThresholds(input);
    if (!result.ok) {
      // Reject without touching persistence: active values stay unchanged.
      throw new ValidationError(result.error);
    }

    const value = result.value;

    // Single-row table: update the existing row when present, otherwise create it.
    const existing = await prisma.escalationConfig.findFirst();
    if (existing) {
      await prisma.escalationConfig.update({
        where: { id: existing.id },
        data: {
          counseling: value.counseling,
          kartuKuning: value.kartuKuning,
          sp1: value.sp1,
          sp2: value.sp2,
          sp3: value.sp3,
          updatedById: updatedById ?? existing.updatedById,
        },
      });
    } else {
      await prisma.escalationConfig.create({
        data: {
          counseling: value.counseling,
          kartuKuning: value.kartuKuning,
          sp1: value.sp1,
          sp2: value.sp2,
          sp3: value.sp3,
          updatedById: updatedById ?? null,
        },
      });
    }

    return value;
  }
}
