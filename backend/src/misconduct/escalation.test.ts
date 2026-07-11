import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  validateThresholds,
  requiredStep,
  shouldNotify,
  DEFAULT_THRESHOLDS,
  Thresholds,
  StepOrdinal,
} from './escalation';

/**
 * Property 13: Active thresholds are always valid and invalid configs are rejected.
 *
 * Validates: Requirements 4.1, 4.7
 *
 * For any ACCEPTED threshold configuration, all five step thresholds
 * (counseling, kartuKuning, sp1, sp2, sp3) are integers >= 1 AND strictly
 * increasing across the ordered steps. For any submitted config violating these
 * constraints (non-integer, < 1, or non-increasing), validateThresholds returns
 * { ok: false } with an error.
 */

const STEP_KEYS = ['counseling', 'kartuKuning', 'sp1', 'sp2', 'sp3'] as const;

/**
 * Generates strictly-increasing integer threshold sets (each >= 1) by summing
 * a cumulative sequence of positive gaps. This constrains generation directly
 * to the accepted input space so we exercise the success path meaningfully.
 */
const validThresholds: fc.Arbitrary<Thresholds> = fc
  .tuple(
    fc.integer({ min: 1, max: 1000 }),
    fc.integer({ min: 1, max: 1000 }),
    fc.integer({ min: 1, max: 1000 }),
    fc.integer({ min: 1, max: 1000 }),
    fc.integer({ min: 1, max: 1000 })
  )
  .map(([g0, g1, g2, g3, g4]) => {
    const counseling = g0;
    const kartuKuning = counseling + g1;
    const sp1 = kartuKuning + g2;
    const sp2 = sp1 + g3;
    const sp3 = sp2 + g4;
    return { counseling, kartuKuning, sp1, sp2, sp3 };
  });

/**
 * Generates configurations that violate at least one constraint by taking a
 * valid base and applying a guaranteed-invalidating mutation:
 *   - nonInteger:     make one threshold fractional
 *   - belowOne:       make one threshold <= 0
 *   - nonIncreasing:  make one threshold equal to its predecessor
 */
const invalidThresholds: fc.Arbitrary<Record<string, number>> = fc
  .tuple(
    validThresholds,
    fc.integer({ min: 0, max: 4 }),
    fc.constantFrom('nonInteger', 'belowOne', 'nonIncreasing'),
    fc.integer({ min: 1, max: 5 })
  )
  .map(([base, idx, kind, delta]) => {
    const cfg: Record<string, number> = { ...base };
    if (kind === 'nonInteger') {
      cfg[STEP_KEYS[idx]] = base[STEP_KEYS[idx]] + 0.5;
    } else if (kind === 'belowOne') {
      cfg[STEP_KEYS[idx]] = 1 - delta; // <= 0
    } else {
      // Force a non-increasing pair: set some step equal to its predecessor.
      const j = idx === 0 ? 1 : idx;
      cfg[STEP_KEYS[j]] = base[STEP_KEYS[j - 1]];
    }
    return cfg;
  });

describe('validateThresholds (Property 13)', () => {
  it('Property 13: accepted threshold configs are integers >= 1 and strictly increasing', () => {
    fc.assert(
      fc.property(validThresholds, (candidate) => {
        const result = validateThresholds(candidate);

        expect(result.ok).toBe(true);
        if (!result.ok) return; // narrow for TypeScript

        const values = STEP_KEYS.map((k) => result.value[k]);
        // Every value is an integer >= 1.
        for (const v of values) {
          expect(Number.isInteger(v)).toBe(true);
          expect(v).toBeGreaterThanOrEqual(1);
        }
        // Strictly increasing across the ordered steps.
        for (let i = 1; i < values.length; i++) {
          expect(values[i]).toBeGreaterThan(values[i - 1]);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('Property 13: configs violating integer/>=1/monotonicity constraints are rejected', () => {
    fc.assert(
      fc.property(invalidThresholds, (candidate) => {
        const result = validateThresholds(candidate);

        expect(result.ok).toBe(false);
        if (result.ok) return; // narrow for TypeScript
        expect(typeof result.error).toBe('string');
        expect(result.error.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: integrated-misconduct-system, Property 14: Required step is the highest
// step whose threshold is met.

/**
 * Property 14: Required step is the highest step whose threshold is met.
 *
 * Validates: Requirements 4.2, 4.3, 4.6
 *
 * For any accumulated points value and any valid threshold set (default or a
 * configured override), requiredStep(points, t) equals the highest step ordinal
 * whose threshold is <= points, or 0 ("none") when the points are below the
 * lowest threshold. This is verified against an independent reference
 * computation, and covers both the fixed DEFAULT_THRESHOLDS and generated
 * override sets.
 */

/**
 * Independent reference implementation of the required-step rule. Walks the
 * ordered steps and remembers the highest ordinal whose threshold is met,
 * starting from 0 (none). Deliberately written differently from the production
 * code so the property checks the rule rather than mirroring the implementation.
 */
function expectedRequiredStep(points: number, t: Thresholds): StepOrdinal {
  let highest: StepOrdinal = 0;
  STEP_KEYS.forEach((key, index) => {
    if (points >= t[key]) {
      highest = (index + 1) as StepOrdinal;
    }
  });
  return highest;
}

/**
 * Threshold sets to test against: the fixed defaults (Requirement 4.6 fallback)
 * plus generated strictly-increasing override sets.
 */
const anyThresholds: fc.Arbitrary<Thresholds> = fc.oneof(
  fc.constant<Thresholds>(DEFAULT_THRESHOLDS),
  validThresholds
);

describe('requiredStep (Property 14)', () => {
  it('Property 14: returns the highest step whose threshold is <= points, else 0', () => {
    fc.assert(
      fc.property(
        anyThresholds,
        // Points range covers below the lowest threshold through beyond the highest.
        fc.integer({ min: -10, max: 6000 }),
        (thresholds, points) => {
          const expected = expectedRequiredStep(points, thresholds);
          const actual = requiredStep(points, thresholds);

          expect(actual).toBe(expected);

          // When any step is required, its threshold must be met and the next
          // step's threshold (if any) must NOT be met.
          if (actual === 0) {
            // Below the lowest threshold: no step's threshold is met.
            expect(points).toBeLessThan(thresholds[STEP_KEYS[0]]);
          } else {
            expect(points).toBeGreaterThanOrEqual(thresholds[STEP_KEYS[actual - 1]]);
            if (actual < STEP_KEYS.length) {
              expect(points).toBeLessThan(thresholds[STEP_KEYS[actual % STEP_KEYS.length]]);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: integrated-misconduct-system, Property 15: Step-due notification fires
// exactly when the required step exceeds the current level.

/**
 * Property 15: Step-due notification fires exactly when the required step exceeds
 * the current escalation level.
 *
 * Validates: Requirements 4.4, 4.5
 *
 * For any accumulated points, threshold set, and current escalation level,
 * shouldNotify(points, t, currentLevel) returns true if and only if
 * requiredStep(points, t) is strictly greater than currentLevel. This gate is
 * what suppresses duplicate step-due notifications once a step has been issued.
 */

/** Escalation levels span 0 (none issued) through 5 (SP3 issued). */
const stepOrdinal: fc.Arbitrary<StepOrdinal> = fc.constantFrom<StepOrdinal>(
  0,
  1,
  2,
  3,
  4,
  5
);

describe('shouldNotify (Property 15)', () => {
  it('Property 15: notifies iff requiredStep is strictly greater than the current level', () => {
    fc.assert(
      fc.property(
        validThresholds,
        // Points range covers below the lowest threshold up to beyond the highest.
        fc.integer({ min: -10, max: 6000 }),
        stepOrdinal,
        (thresholds, points, currentLevel) => {
          const required = requiredStep(points, thresholds);
          const expected = required > currentLevel;

          expect(shouldNotify(points, thresholds, currentLevel)).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});
