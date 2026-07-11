/**
 * Pure escalation engine for the Integrated Misconduct System.
 *
 * This module is intentionally free of any I/O: it imports no Prisma client and
 * no Socket.IO. The escalation decision is a pure function of
 * `(accumulatedPoints, thresholds, currentLevel)`, which makes it deterministic
 * and property-testable in isolation from the database and the notification layer.
 *
 * See design.md section "3. Escalation Engine".
 */

/**
 * Ordinal position of a disciplinary step in the fixed escalation sequence.
 * `0` means "no step required" (points below the lowest threshold).
 *
 *   1 = COUNSELING
 *   2 = KARTU_KUNING
 *   3 = SP1
 *   4 = SP2
 *   5 = SP3
 */
export type StepOrdinal = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * The set of accumulated-point thresholds at which each disciplinary step
 * becomes required. Thresholds are ordered by ascending step and must be
 * strictly increasing integers (>= 1). (Requirements 4.1, 4.7)
 */
export interface Thresholds {
  counseling: number;
  kartuKuning: number;
  sp1: number;
  sp2: number;
  sp3: number;
}

/**
 * The fixed default threshold set: counseling 5, kartu kuning 10, SP1 20,
 * SP2 30, SP3 40. These are strictly increasing and each >= 1, satisfying
 * Requirement 4.1. Used whenever a Section Manager has not configured an
 * override (Requirement 4.6).
 */
export const DEFAULT_THRESHOLDS: Thresholds = {
  counseling: 5,
  kartuKuning: 10,
  sp1: 20,
  sp2: 30,
  sp3: 40,
};

/**
 * The thresholds in ascending step order, paired with the ordinal they gate.
 * Kept as a single ordered source of truth so `requiredStep` and
 * `validateThresholds` cannot drift apart.
 */
const STEP_ORDER: ReadonlyArray<{ ordinal: StepOrdinal; key: keyof Thresholds }> = [
  { ordinal: 1, key: 'counseling' },
  { ordinal: 2, key: 'kartuKuning' },
  { ordinal: 3, key: 'sp1' },
  { ordinal: 4, key: 'sp2' },
  { ordinal: 5, key: 'sp3' },
];

/**
 * Returns the highest disciplinary step whose threshold is met, i.e. the
 * greatest ordinal whose threshold is `<= points`. Returns `0` when the points
 * are below the lowest threshold. (Requirements 4.2, 4.3)
 *
 * A step is "met" when `points >= threshold` for that step.
 */
export function requiredStep(points: number, t: Thresholds): StepOrdinal {
  let step: StepOrdinal = 0;
  for (const { ordinal, key } of STEP_ORDER) {
    if (points >= t[key]) {
      step = ordinal;
    }
  }
  return step;
}

/**
 * Returns whether a step-due notification should fire for the given state.
 * A notification is warranted exactly when the required step is strictly
 * greater than the current escalation level (the highest step already issued
 * to the operator). (Requirements 4.4, 4.5)
 */
export function shouldNotify(
  points: number,
  t: Thresholds,
  currentLevel: StepOrdinal
): boolean {
  return requiredStep(points, t) > currentLevel;
}

/**
 * Result of validating a candidate threshold configuration. On success it
 * carries the normalized `Thresholds`; on failure it carries a human-readable
 * error describing the first violated constraint.
 */
export type ValidateThresholdsResult =
  | { ok: true; value: Thresholds }
  | { ok: false; error: string };

/**
 * Validates a candidate threshold configuration (Requirement 4.7).
 *
 * A configuration is accepted only when:
 *   - it is an object containing all five step keys,
 *   - every value is an integer >= 1, and
 *   - values are strictly increasing across the ordered steps
 *     (counseling < kartuKuning < sp1 < sp2 < sp3).
 *
 * On failure the configuration is rejected with an error identifying the
 * invalid or non-increasing threshold; callers must leave previously active
 * values unchanged.
 */
export function validateThresholds(raw: unknown): ValidateThresholdsResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'Threshold configuration must be an object' };
  }

  const source = raw as Record<string, unknown>;
  const value = {} as Thresholds;

  // Each threshold must be present and an integer >= 1.
  for (const { key } of STEP_ORDER) {
    const candidate = source[key];
    if (typeof candidate !== 'number' || !Number.isInteger(candidate)) {
      return { ok: false, error: `Threshold "${key}" must be an integer` };
    }
    if (candidate < 1) {
      return { ok: false, error: `Threshold "${key}" must be at least 1` };
    }
    value[key] = candidate;
  }

  // Strict monotonicity across the ordered steps.
  for (let i = 1; i < STEP_ORDER.length; i++) {
    const prev = STEP_ORDER[i - 1];
    const curr = STEP_ORDER[i];
    if (value[curr.key] <= value[prev.key]) {
      return {
        ok: false,
        error: `Threshold "${curr.key}" (${value[curr.key]}) must be strictly greater than "${prev.key}" (${value[prev.key]})`,
      };
    }
  }

  return { ok: true, value };
}
