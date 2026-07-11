import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fc from 'fast-check';
import type { PrismaClient } from '@prisma/client';
import { createTestDatabase, destroyTestDatabase, TestDb } from './catalog.test-setup';

/**
 * Property 6: Misconduct is rejected for a missing violation type or missing
 * operator.
 *
 * Validates: Requirements 2.2, 2.3
 *
 * For any misconduct submission referencing a violation type id not in the
 * catalog, or an operator id that does not exist, the submission is rejected
 * with the appropriate error — a ValidationError for a missing violation type
 * (R2.2) and a NotFoundError for a missing operator (R2.3) — and no misconduct
 * record is created (the misconduct row count is unchanged after each
 * rejection).
 *
 * Runs against a disposable SQLite database via ./catalog.test-setup. The
 * service is imported dynamically AFTER the test DB is provisioned so its
 * module-level PrismaClient binds to the throwaway database. The service also
 * constructs a NotificationService and emits socket signals on success, so we
 * mock both collaborators to keep the test free of external side effects.
 */

// --- Mock side-effecting collaborators (hoisted by vitest) -----------------
vi.mock('./../notifications/notifications.service', () => ({
  NotificationService: class {
    notifyUser = vi.fn(async () => {});
    notifyRole = vi.fn(async () => {});
  },
}));

vi.mock('./../socket/emit', () => ({
  emitToRooms: vi.fn(() => {}),
}));

// Bound in beforeAll (dynamic import must follow test-DB provisioning).
let db: TestDb;
let prisma: PrismaClient;
let MisconductServiceCtor: typeof import('./misconduct.service').MisconductService;
let ValidationErrorCtor: typeof import('./errors').ValidationError;
let NotFoundErrorCtor: typeof import('./errors').NotFoundError;
let service: import('./misconduct.service').MisconductService;

// Seeded reference ids (a valid operator + violation type) so each rejection
// scenario is "valid except one missing reference".
let seededOperatorId: number;
let seededUserId: number;
let seededViolationTypeId: number;

beforeAll(async () => {
  db = createTestDatabase('misconduct-missing-ref');
  prisma = db.prisma;
  ({ MisconductService: MisconductServiceCtor } = await import('./misconduct.service'));
  ({ ValidationError: ValidationErrorCtor, NotFoundError: NotFoundErrorCtor } = await import(
    './errors'
  ));
  service = new MisconductServiceCtor();

  // Minimal Role -> User -> Operator chain plus a catalog entry so the only
  // thing "missing" in each scenario is the id under test.
  const role = await prisma.role.create({ data: { name: 'Test Role', permissions: '[]' } });
  const user = await prisma.user.create({
    data: {
      username: 'tester',
      email: 'tester@example.com',
      password: 'x',
      fullName: 'Tester',
      roleId: role.id,
    },
  });
  const operator = await prisma.operator.create({
    data: { userId: user.id, employeeId: 'EMP-1', qrCode: 'QR-1' },
  });
  const vt = await prisma.violationType.create({
    data: {
      name: 'Seeded Violation',
      nameNormalized: 'seeded violation',
      category: 'general',
      severity: 'low',
      points: 10,
    },
  });

  seededOperatorId = operator.id;
  seededUserId = user.id;
  seededViolationTypeId = vt.id;
}, 120_000);

afterAll(async () => {
  await destroyTestDatabase(db);
});

// --- Generators ------------------------------------------------------------

// A non-empty free-text description for the misconduct.
const description: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 60 })
  .map((s) => (s.trim().length ? s : 'violation description'));

// Positive offset used to construct an id guaranteed absent from the DB
// (only one operator and one violation type are ever seeded).
const missingOffset: fc.Arbitrary<number> = fc.integer({ min: 1, max: 1_000_000 });

interface Scenario {
  kind: 'missing-violation-type' | 'missing-operator';
  description: string;
  offset: number;
}

const scenario: fc.Arbitrary<Scenario> = fc.record({
  kind: fc.constantFrom('missing-violation-type', 'missing-operator'),
  description,
  offset: missingOffset,
});

// --- Property --------------------------------------------------------------

describe('MisconductService.createMisconduct (Property 6)', () => {
  it(
    'Property 6: rejects a missing violation type (ValidationError) or missing operator (NotFoundError) and creates no misconduct',
    async () => {
      await fc.assert(
        fc.asyncProperty(scenario, async (s) => {
          const before = await prisma.misconduct.count();

          const input =
            s.kind === 'missing-violation-type'
              ? {
                  // Valid operator, missing violation type id (R2.2).
                  operatorId: seededOperatorId,
                  createdById: seededUserId,
                  violationTypeId: seededViolationTypeId + s.offset,
                  description: s.description,
                }
              : {
                  // Valid violation type, missing operator id (R2.3).
                  operatorId: seededOperatorId + s.offset,
                  createdById: seededUserId,
                  violationTypeId: seededViolationTypeId,
                  description: s.description,
                };

          let rejected = false;
          try {
            await service.createMisconduct(input);
          } catch (err) {
            rejected = true;
            if (s.kind === 'missing-violation-type') {
              expect(err).toBeInstanceOf(ValidationErrorCtor);
            } else {
              expect(err).toBeInstanceOf(NotFoundErrorCtor);
            }
          }
          expect(rejected).toBe(true);

          // No misconduct record was created by the rejected submission.
          const after = await prisma.misconduct.count();
          expect(after).toBe(before);
        }),
        { numRuns: 100 },
      );
    },
    120_000,
  );
});
