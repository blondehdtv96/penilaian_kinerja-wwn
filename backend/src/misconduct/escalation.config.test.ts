import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Unit tests for EscalationConfigService load/override behavior.
 *
 * Covers:
 *   - Default fallback when no override row exists (R4.6).
 *   - Returning the persisted override when a row exists (R4.6).
 *   - Successful override persistence (create when absent, update when present).
 *   - Rejection of an invalid configuration that preserves previously active
 *     values, i.e. no persistence write occurs (R4.7).
 *
 * The Prisma layer is mocked: `@prisma/client`'s PrismaClient is replaced with a
 * constructor returning a shared mock whose `escalationConfig` delegate exposes
 * `findFirst`, `update`, and `create` spies.
 */

// Hoisted so the vi.mock factory below can reference it safely.
const { mockEscalationConfig } = vi.hoisted(() => ({
  mockEscalationConfig: {
    findFirst: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@prisma/client', () => ({
  // Regular function (not arrow) so it can be invoked with `new`.
  PrismaClient: vi.fn(function () {
    return { escalationConfig: mockEscalationConfig };
  }),
}));

import { EscalationConfigService } from './escalation.config';
import { DEFAULT_THRESHOLDS, Thresholds } from './escalation';
import { ValidationError } from './errors';

/** A valid, strictly-increasing override distinct from the defaults. */
const OVERRIDE: Thresholds = {
  counseling: 3,
  kartuKuning: 7,
  sp1: 15,
  sp2: 25,
  sp3: 50,
};

/** Builds a persisted override row shape as Prisma would return it. */
function overrideRow(id: number, t: Thresholds, updatedById: number | null = null) {
  return {
    id,
    counseling: t.counseling,
    kartuKuning: t.kartuKuning,
    sp1: t.sp1,
    sp2: t.sp2,
    sp3: t.sp3,
    updatedById,
  };
}

describe('EscalationConfigService.getActiveThresholds', () => {
  let service: EscalationConfigService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EscalationConfigService();
  });

  it('R4.6: falls back to the fixed defaults when no override row exists', async () => {
    mockEscalationConfig.findFirst.mockResolvedValue(null);

    const active = await service.getActiveThresholds();

    expect(active).toEqual(DEFAULT_THRESHOLDS);
    // Returns a copy, not the shared DEFAULT_THRESHOLDS reference, so callers
    // cannot mutate the module-level defaults.
    expect(active).not.toBe(DEFAULT_THRESHOLDS);
    expect(mockEscalationConfig.findFirst).toHaveBeenCalledTimes(1);
  });

  it('R4.6: returns the persisted override when a row exists', async () => {
    mockEscalationConfig.findFirst.mockResolvedValue(overrideRow(1, OVERRIDE, 42));

    const active = await service.getActiveThresholds();

    expect(active).toEqual(OVERRIDE);
    // Only the five threshold fields are surfaced (no id/updatedById leakage).
    expect(Object.keys(active).sort()).toEqual(
      ['counseling', 'kartuKuning', 'sp1', 'sp2', 'sp3'].sort()
    );
  });
});

describe('EscalationConfigService.setThresholds', () => {
  let service: EscalationConfigService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EscalationConfigService();
  });

  it('creates the single override row when none exists yet', async () => {
    mockEscalationConfig.findFirst.mockResolvedValue(null);
    mockEscalationConfig.create.mockResolvedValue(overrideRow(1, OVERRIDE, 7));

    const result = await service.setThresholds(OVERRIDE, 7);

    expect(result).toEqual(OVERRIDE);
    expect(mockEscalationConfig.create).toHaveBeenCalledTimes(1);
    expect(mockEscalationConfig.update).not.toHaveBeenCalled();
    expect(mockEscalationConfig.create).toHaveBeenCalledWith({
      data: { ...OVERRIDE, updatedById: 7 },
    });
  });

  it('updates the existing override row when one is already present', async () => {
    mockEscalationConfig.findFirst.mockResolvedValue(overrideRow(9, DEFAULT_THRESHOLDS, 1));
    mockEscalationConfig.update.mockResolvedValue(overrideRow(9, OVERRIDE, 5));

    const result = await service.setThresholds(OVERRIDE, 5);

    expect(result).toEqual(OVERRIDE);
    expect(mockEscalationConfig.update).toHaveBeenCalledTimes(1);
    expect(mockEscalationConfig.create).not.toHaveBeenCalled();
    expect(mockEscalationConfig.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { ...OVERRIDE, updatedById: 5 },
    });
  });

  it('R4.7: rejects a non-increasing configuration and performs no persistence write', async () => {
    // sp2 (25) is not strictly greater than sp1 (25): must be rejected.
    const invalid = { counseling: 3, kartuKuning: 7, sp1: 25, sp2: 25, sp3: 50 };
    mockEscalationConfig.findFirst.mockResolvedValue(overrideRow(1, OVERRIDE, 3));

    await expect(service.setThresholds(invalid, 3)).rejects.toBeInstanceOf(ValidationError);

    // No write occurred, so the previously active values remain unchanged.
    expect(mockEscalationConfig.create).not.toHaveBeenCalled();
    expect(mockEscalationConfig.update).not.toHaveBeenCalled();
  });

  it('R4.7: rejects a non-integer/below-one value and performs no persistence write', async () => {
    const invalid = { counseling: 0, kartuKuning: 7, sp1: 15, sp2: 25, sp3: 50 };
    mockEscalationConfig.findFirst.mockResolvedValue(overrideRow(1, OVERRIDE, 3));

    await expect(service.setThresholds(invalid, 3)).rejects.toBeInstanceOf(ValidationError);

    expect(mockEscalationConfig.create).not.toHaveBeenCalled();
    expect(mockEscalationConfig.update).not.toHaveBeenCalled();
  });

  it('R4.7: after a rejected update, getActiveThresholds still returns the prior override', async () => {
    // Prior active value: the persisted OVERRIDE row.
    mockEscalationConfig.findFirst.mockResolvedValue(overrideRow(1, OVERRIDE, 3));

    const invalid = { counseling: 3, kartuKuning: 3, sp1: 15, sp2: 25, sp3: 50 };
    await expect(service.setThresholds(invalid, 3)).rejects.toBeInstanceOf(ValidationError);

    // The active thresholds are unchanged from before the rejected write.
    const active = await service.getActiveThresholds();
    expect(active).toEqual(OVERRIDE);
    expect(mockEscalationConfig.update).not.toHaveBeenCalled();
    expect(mockEscalationConfig.create).not.toHaveBeenCalled();
  });
});
