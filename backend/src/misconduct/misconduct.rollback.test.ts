import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fc from 'fast-check';
import type { PrismaClient } from '@prisma/client';
import { createTestDatabase, destroyTestDatabase, TestDb } from './catalog.test-setup';

/**
 * Property 10: Misconduct creation is atomic and rolls back fully on failure.
 *
 * Validates: Requirements 8.3, 8.4
 *
 * For any failure occurring during misconduct creation or the associated
 * counter/score/accumulated-points updates, no misconduct record is persisted
 * and the operator's performanceScore, accumulatedPoints, and totalMisconduct
 * equal their values immediately before the operation.
 *
 * `createMisconduct` wraps the misconduct insert AND the operator counter
 * updates in a single `prisma.$transaction`, so any mid-transaction throw must
 * roll the whole unit back.
 *
 * Runs against a disposable SQLite database via ./catalog.test-setup. The
 * service is imported dynamically AFTER the test DB is provisioned so its
 * module-level PrismaClient binds to the throwaway database.
 * `../notifications/notifications.service` and `../socket/emit` are mocked so
 * the (never-reached) post-commit side effects are inert.
 *
 * Three failure-injection modes exercise the failure paths the service
 * actually runs, all of which throw inside the transaction:
 *   - 'missing-violation-type': the transaction's first step rejects a
 *     violationTypeId absent from the catalog (ValidationError).
 *   - 'foreign-key': the misconduct insert itself fails because `createdById`
 *     references a non-existent user (SQLite FK constraint violation) — this
 *     forces the failure DURING the misconduct-creation statement.
 *   - 'missing-operator': the transaction rejects an operatorId that does not
 *     exist (NotFoundError).
 *
 * Prior successful misconducts are seeded in most runs so the operator's
 * counters hold a non-trivial state and "unchanged" is a meaningful assertion.
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
let violationTypeIds: number[] = [];

// Ids guaranteed absent from the disposable database (used to inject failures).
const ABSENT_VIOLATION_TYPE_ID = 2_000_000_001;
const ABSENT_USER_ID = 2_000_000_002;
const ABSENT_OPERATOR_ID = 2_000_000_003;

// Starting performance score reset before each run so the floor/decrement math
// yields a consistent, non-trivial baseline after seeding priors.
const BASE_SCORE = 100;

// A pool of distinct point values (small, mid, and the 100 boundary).
const POOL_POINTS = [1, 3, 7, 10, 15, 25, 50, 100];

beforeAll(async () => {
  db = createTestDatabase('misconduct-rollback');
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
      performanceScore: BASE_SCORE,
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

type FailureMode = 'missing-violation-type' | 'foreign-key' | 'missing-operator';

interface Scenario {
  // Prior successful misconducts to seed (indices into the violation pool),
  // establishing a non-trivial pre-operation counter state.
  priorSelections: number[];
  failureMode: FailureMode;
}

const scenario: fc.Arbitrary<Scenario> = fc.record({
  priorSelections: fc.array(fc.integer({ min: 0, max: POOL_POINTS.length - 1 }), {
    minLength: 0,
    maxLength: 5,
  }),
  failureMode: fc.constantFrom<FailureMode>(
    'missing-violation-type',
    'foreign-key',
    'missing-operator',
  ),
});

describe('MisconductService.createMisconduct (Property 10)', () => {
  it(
    'Property 10: a failing creation persists no misconduct and leaves score/points/counter unchanged',
    async () => {
      await fc.assert(
        fc.asyncProperty(scenario, async ({ priorSelections, failureMode }) => {
          // Fresh slate: remove prior misconducts and reset operator counters.
          await prisma.misconduct.deleteMany({ where: { operatorId } });
          await prisma.operator.update({
            where: { id: operatorId },
            data: { accumulatedPoints: 0, totalMisconduct: 0, performanceScore: BASE_SCORE },
          });

          // Seed prior successful misconducts through the service so the
          // operator's counters reach a genuine, consistent, non-trivial state.
          for (const idx of priorSelections) {
            await service.createMisconduct({
              operatorId,
              createdById,
              violationTypeId: violationTypeIds[idx],
              description: 'seed',
            });
          }

          // Capture the exact pre-operation state.
          const before = await prisma.operator.findUniqueOrThrow({
            where: { id: operatorId },
            select: { performanceScore: true, accumulatedPoints: true, totalMisconduct: true },
          });
          const misconductCountBefore = await prisma.misconduct.count({ where: { operatorId } });
          const globalCountBefore = await prisma.misconduct.count();

          // Build a failing input for the selected injection mode.
          const failingInput =
            failureMode === 'missing-violation-type'
              ? {
                  operatorId,
                  createdById,
                  violationTypeId: ABSENT_VIOLATION_TYPE_ID,
                  description: 'should fail',
                }
              : failureMode === 'foreign-key'
                ? {
                    operatorId,
                    createdById: ABSENT_USER_ID,
                    violationTypeId: violationTypeIds[0],
                    description: 'should fail',
                  }
                : {
                    operatorId: ABSENT_OPERATOR_ID,
                    createdById,
                    violationTypeId: violationTypeIds[0],
                    description: 'should fail',
                  };

          // The operation must reject.
          await expect(service.createMisconduct(failingInput)).rejects.toBeInstanceOf(Error);

          // No misconduct row leaked (neither for the operator nor globally).
          const misconductCountAfter = await prisma.misconduct.count({ where: { operatorId } });
          const globalCountAfter = await prisma.misconduct.count();
          expect(misconductCountAfter).toBe(misconductCountBefore);
          expect(globalCountAfter).toBe(globalCountBefore);

          // The three operator counters equal their pre-operation values.
          const after = await prisma.operator.findUniqueOrThrow({
            where: { id: operatorId },
            select: { performanceScore: true, accumulatedPoints: true, totalMisconduct: true },
          });
          expect(after.performanceScore).toBe(before.performanceScore);
          expect(after.accumulatedPoints).toBe(before.accumulatedPoints);
          expect(after.totalMisconduct).toBe(before.totalMisconduct);
        }),
        { numRuns: 100 },
      );
    },
    120_000,
  );
});
