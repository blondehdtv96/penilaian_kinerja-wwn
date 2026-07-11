import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fc from 'fast-check';
import type { PrismaClient } from '@prisma/client';
import { createTestDatabase, destroyTestDatabase, TestDb } from './catalog.test-setup';

/**
 * Property 7: Performance score decreases by the applied points and floors at zero.
 *
 * Validates: Requirements 2.7
 *
 * For any operator with a starting performanceScore and any created misconduct
 * referencing a violation type worth `points`, the operator's resulting
 * performanceScore equals `max(0, previousScore - points)`. This includes cases
 * where the applied points exceed the previous score, exercising the zero floor.
 *
 * Runs against a disposable SQLite database via ./catalog.test-setup. The
 * misconduct service is imported dynamically AFTER the test DB is provisioned so
 * its internal module-level PrismaClient binds to the throwaway database.
 * NotificationService and the socket emit helper are mocked so post-commit side
 * effects neither touch Socket.IO nor influence the score computation.
 */

// The service constructs a module-level NotificationService and calls emitToRooms
// after the transaction commits. Stub both so the test isolates the score math.
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
let MisconductServiceCtor: typeof import('./misconduct.service').MisconductService;
let service: import('./misconduct.service').MisconductService;

beforeAll(async () => {
  db = createTestDatabase('misconduct-perf-floor');
  prisma = db.prisma;
  ({ MisconductService: MisconductServiceCtor } = await import('./misconduct.service'));
  service = new MisconductServiceCtor();
}, 120_000);

afterAll(async () => {
  await destroyTestDatabase(db);
});

// --- Generators ------------------------------------------------------------

interface Scenario {
  // Starting performance score for the operator. Range spans below, equal to,
  // and above the point range so the zero floor is exercised on both sides.
  previousScore: number;
  // Catalog point value for the violation type (valid 1..100 per R2 / catalog).
  points: number;
}

const scenario: fc.Arbitrary<Scenario> = fc.record({
  previousScore: fc.integer({ min: 0, max: 200 }),
  points: fc.integer({ min: 1, max: 100 }),
});

// --- Property --------------------------------------------------------------

describe('MisconductService.createMisconduct (Property 7)', () => {
  it(
    'Property 7: resulting performanceScore equals max(0, previousScore - appliedPoints)',
    async () => {
      await fc.assert(
        fc.asyncProperty(scenario, async (s) => {
          // Fresh graph per run so ids/uniques never collide.
          await prisma.misconduct.deleteMany();
          await prisma.violationType.deleteMany();
          await prisma.operator.deleteMany();
          await prisma.user.deleteMany();
          await prisma.role.deleteMany();

          // Seed Role -> User -> Operator with the generated starting score.
          const role = await prisma.role.create({
            data: { name: 'Foreman', permissions: '[]' },
          });
          const user = await prisma.user.create({
            data: {
              username: 'op-user',
              email: 'op-user@example.test',
              password: 'x',
              fullName: 'Op User',
              roleId: role.id,
            },
          });
          const operator = await prisma.operator.create({
            data: {
              userId: user.id,
              employeeId: 'EMP-1',
              qrCode: 'QR-1',
              performanceScore: s.previousScore,
            },
          });

          // Seed the violation type carrying the generated point value.
          const violationType = await prisma.violationType.create({
            data: {
              name: 'V',
              nameNormalized: 'v',
              category: 'general',
              severity: 'low',
              points: s.points,
            },
          });

          // Record the misconduct through the service under test.
          await service.createMisconduct({
            operatorId: operator.id,
            createdById: user.id,
            violationTypeId: violationType.id,
            description: 'test',
          });

          const after = await prisma.operator.findUniqueOrThrow({
            where: { id: operator.id },
          });

          const expected = Math.max(0, s.previousScore - s.points);
          expect(after.performanceScore).toBe(expected);
        }),
        { numRuns: 100 },
      );
    },
    120_000,
  );
});
