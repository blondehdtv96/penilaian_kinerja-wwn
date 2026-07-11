import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fc from 'fast-check';
import type { PrismaClient } from '@prisma/client';
import { createTestDatabase, destroyTestDatabase, TestDb } from './catalog.test-setup';

/**
 * Property 8: Accumulated points equal the sum of active misconduct points.
 *
 * Validates: Requirements 2.8, 8.1
 *
 * For any sequence of successful misconduct creations for an operator, after
 * each operation the operator's `accumulatedPoints` equals the sum of the
 * applied points of that operator's active misconducts.
 *
 * Runs against a disposable SQLite database via ./catalog.test-setup. The
 * service is imported dynamically AFTER the test DB is provisioned so its
 * module-level PrismaClient binds to the throwaway database.
 *
 * `../notifications/notifications.service` and `../socket/emit` are mocked so
 * the post-commit side effects of `createMisconduct` are inert — this property
 * concerns the transactional counter reconciliation, not delivery.
 */

// Side-effect modules are stubbed (hoisted before any import of the service).
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

// Bound in beforeAll (dynamic import must follow test-DB provisioning).
let db: TestDb;
let prisma: PrismaClient;
let service: import('./misconduct.service').MisconductService;

// Fixed seed identifiers.
let operatorId: number;
let createdById: number;
// Pool of violation types keyed by id, each carrying a known point value.
let violationTypeIds: number[] = [];

// A pool of distinct point values exercising small, mid, and boundary (100) sums.
const POOL_POINTS = [1, 3, 7, 10, 15, 25, 50, 100];

beforeAll(async () => {
  db = createTestDatabase('misconduct-accum');
  prisma = db.prisma;

  const { MisconductService } = await import('./misconduct.service');
  service = new MisconductService();

  // Role -> User (recorder) -> User + Operator (subject).
  const role = await prisma.role.create({
    data: { name: 'Foreman', description: 'test', permissions: '[]' },
  });
  const recorder = await prisma.user.create({
    data: {
      username: 'recorder',
      email: 'recorder@test.local',
      password: 'x',
      fullName: 'Recorder',
      roleId: role.id,
    },
  });
  createdById = recorder.id;

  const operatorUser = await prisma.user.create({
    data: {
      username: 'operator1',
      email: 'operator1@test.local',
      password: 'x',
      fullName: 'Operator One',
      roleId: role.id,
    },
  });
  const operator = await prisma.operator.create({
    data: {
      userId: operatorUser.id,
      employeeId: 'EMP-001',
      qrCode: 'QR-001',
      performanceScore: 0,
    },
  });
  operatorId = operator.id;

  // Seed the violation-type pool (distinct normalized names, known points).
  for (let i = 0; i < POOL_POINTS.length; i++) {
    const vt = await prisma.violationType.create({
      data: {
        name: `Violation ${i}`,
        nameNormalized: `violation ${i}`,
        category: 'general',
        severity: 'low',
        points: POOL_POINTS[i],
      },
    });
    violationTypeIds.push(vt.id);
  }
}, 120_000);

afterAll(async () => {
  await destroyTestDatabase(db);
});

// A non-empty sequence of selections into the violation-type pool.
const selectionSequence: fc.Arbitrary<number[]> = fc.array(
  fc.integer({ min: 0, max: POOL_POINTS.length - 1 }),
  { minLength: 1, maxLength: 12 },
);

describe('MisconductService.createMisconduct (Property 8)', () => {
  it(
    'Property 8: after each creation, accumulatedPoints equals the sum of active misconduct points',
    async () => {
      await fc.assert(
        fc.asyncProperty(selectionSequence, async (selections) => {
          // Fresh slate per run so the invariant is checked from a known origin.
          await prisma.misconduct.deleteMany({ where: { operatorId } });
          await prisma.operator.update({
            where: { id: operatorId },
            data: { accumulatedPoints: 0, totalMisconduct: 0, performanceScore: 0 },
          });

          for (const idx of selections) {
            await service.createMisconduct({
              operatorId,
              createdById,
              violationTypeId: violationTypeIds[idx],
              description: 'generated',
            });

            // Independently recompute the invariant straight from the ground
            // truth (the operator's active misconduct rows).
            const active = await prisma.misconduct.findMany({
              where: { operatorId, isActive: true },
              select: { points: true },
            });
            const expected = active.reduce((sum, m) => sum + m.points, 0);

            const op = await prisma.operator.findUniqueOrThrow({
              where: { id: operatorId },
              select: { accumulatedPoints: true },
            });

            expect(op.accumulatedPoints).toBe(expected);
          }
        }),
        { numRuns: 100 },
      );
    },
    120_000,
  );
});
