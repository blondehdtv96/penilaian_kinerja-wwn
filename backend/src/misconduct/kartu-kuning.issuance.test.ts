import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fc from 'fast-check';
import type { PrismaClient } from '@prisma/client';
import { createTestDatabase, destroyTestDatabase, TestDb } from './catalog.test-setup';

/**
 * Properties 16, 17, 18 for `MisconductService.createKartuKuning`.
 *
 * Property 16: Issuance snapshots accumulated points and links the
 * contributing misconducts. Validates: Requirements 5.1, 6.1
 *
 * Property 17: Below-threshold issuance is recorded as a manual override.
 * Validates: Requirements 5.2, 6.6
 *
 * Property 18: Issuance rejects unknown operators and non-override
 * duplicates at the current level. Validates: Requirements 5.3, 5.4
 *
 * Runs against a disposable SQLite database via ./catalog.test-setup. The
 * service is imported dynamically AFTER the test DB is provisioned so its
 * module-level PrismaClient binds to the throwaway database.
 */

vi.mock('../notifications/notifications.service', () => ({
  NotificationService: class {
    async notifyUser() {}
    async notifyRole() {}
    async notifyOperator() {}
  },
}));
vi.mock('../socket/emit', () => ({
  emitToRooms: () => {},
}));

let db: TestDb;
let prisma: PrismaClient;
let service: import('./misconduct.service').MisconductService;
let NotFoundErrorCtor: typeof import('./errors').NotFoundError;
let DuplicateErrorCtor: typeof import('./errors').DuplicateError;

let foremanId: number;
let issuedById: number;
// Default kartu kuning threshold is 10 (see escalation.ts DEFAULT_THRESHOLDS).
const KK_THRESHOLD = 10;

const ABSENT_OPERATOR_ID = 4_000_000_001;

beforeAll(async () => {
  db = createTestDatabase('kartu-kuning-issuance');
  prisma = db.prisma;
  const svcMod = await import('./misconduct.service');
  service = new svcMod.MisconductService();
  ({ NotFoundError: NotFoundErrorCtor, DuplicateError: DuplicateErrorCtor } = await import(
    './errors'
  ));

  const role = await prisma.role.create({ data: { name: 'Foreman', permissions: '[]' } });
  const foreman = await prisma.user.create({
    data: { username: 'foreman-kk', email: 'foreman-kk@test.local', password: 'x', fullName: 'Foreman', roleId: role.id },
  });
  foremanId = foreman.id;
  issuedById = foreman.id;
}, 120_000);

afterAll(async () => {
  await destroyTestDatabase(db);
});

/** Create a fresh operator with an isolated Role/User pair for each test iteration. */
async function seedOperator(): Promise<number> {
  const role = await prisma.role.create({ data: { name: `R-${Math.random()}`, permissions: '[]' } });
  const user = await prisma.user.create({
    data: {
      username: `op-${Math.random().toString(36).slice(2)}`,
      email: `op-${Math.random().toString(36).slice(2)}@test.local`,
      password: 'x',
      fullName: 'Op',
      roleId: role.id,
    },
  });
  const operator = await prisma.operator.create({
    data: { userId: user.id, employeeId: `EMP-${Math.random().toString(36).slice(2)}`, qrCode: `QR-${Math.random().toString(36).slice(2)}` },
  });
  return operator.id;
}

/** Create N active misconducts of the given point values directly (bypassing the catalog). */
async function seedActiveMisconducts(operatorId: number, points: number[]): Promise<void> {
  for (const p of points) {
    await prisma.misconduct.create({
      data: { operatorId, createdById: foremanId, type: 'V', description: 'seed', points: p, isActive: true },
    });
  }
  const sum = points.reduce((a, b) => a + b, 0);
  await prisma.operator.update({ where: { id: operatorId }, data: { accumulatedPoints: sum } });
}

// --- Property 16 + 17 -------------------------------------------------------

interface Scenario16 {
  pointsPool: number[]; // active misconduct point values
}

const scenario16: fc.Arbitrary<Scenario16> = fc.record({
  pointsPool: fc.array(fc.integer({ min: 1, max: 20 }), { minLength: 0, maxLength: 5 }),
});

describe('MisconductService.createKartuKuning (Properties 16 & 17)', () => {
  it(
    'Property 16: snapshots accumulatedPoints and links every active misconduct; Property 17: flags override below threshold',
    async () => {
      await fc.assert(
        fc.asyncProperty(scenario16, async ({ pointsPool }) => {
          const operatorId = await seedOperator();
          await seedActiveMisconducts(operatorId, pointsPool);

          const expectedAccumulated = pointsPool.reduce((a, b) => a + b, 0);
          const activeIds = (
            await prisma.misconduct.findMany({ where: { operatorId, isActive: true }, select: { id: true } })
          ).map((m) => m.id);

          const record = await service.createKartuKuning({
            operatorId,
            issuedById,
            reason: 'test issuance',
          });

          // Property 16: snapshot + linkage + issuing identity/timestamp.
          expect(record.accumulatedPointsAtIssuance).toBe(expectedAccumulated);
          expect(record.issuedById).toBe(issuedById);
          expect(record.issuedAt).toBeTruthy();

          const links = await prisma.kartuKuningMisconduct.findMany({ where: { kartuKuningId: record.id } });
          const linkedIds = links.map((l) => l.misconductId).sort();
          expect(linkedIds).toEqual([...activeIds].sort());

          // Property 17: below-threshold issuance is a manual override.
          expect(record.isManualOverride).toBe(expectedAccumulated < KK_THRESHOLD);
        }),
        { numRuns: 100 },
      );
    },
    180_000,
  );
});

// --- Property 18 -------------------------------------------------------------

describe('MisconductService.createKartuKuning (Property 18)', () => {
  it('rejects an unknown operator and creates no record', async () => {
    const before = await prisma.kartuKuning.count();
    await expect(
      service.createKartuKuning({ operatorId: ABSENT_OPERATOR_ID, issuedById, reason: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundErrorCtor);
    const after = await prisma.kartuKuning.count();
    expect(after).toBe(before);
  });

  it(
    'rejects a non-override issuance when an active kartu kuning already exists at the current level',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 15, max: 50 }), async (points) => {
          // Above-threshold operator: first issuance is non-override.
          const operatorId = await seedOperator();
          await seedActiveMisconducts(operatorId, [points]);

          const first = await service.createKartuKuning({ operatorId, issuedById, reason: 'first' });
          expect(first.isManualOverride).toBe(false);

          const before = await prisma.kartuKuning.count();
          // A second non-override issuance at the same (unescalated) level is rejected.
          await expect(
            service.createKartuKuning({ operatorId, issuedById, reason: 'second' }),
          ).rejects.toBeInstanceOf(DuplicateErrorCtor);
          const after = await prisma.kartuKuning.count();
          expect(after).toBe(before);
        }),
        { numRuns: 100 },
      );
    },
    180_000,
  );
});
