import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fc from 'fast-check';
import type { PrismaClient } from '@prisma/client';
import { createTestDatabase, destroyTestDatabase, TestDb } from './catalog.test-setup';

/**
 * Property 4: Applied points are snapshotted and catalog updates are
 * non-retroactive.
 *
 * Validates: Requirements 1.5, 2.1, 2.5
 *
 * For any misconduct created against a violation type (active or inactive),
 * the misconduct's stored points equal the violation type's points at creation
 * time (R2.1, R2.5). And for any subsequent valid change to that violation
 * type's points, existing misconducts retain their original points while newly
 * created misconducts use the updated value (R1.5).
 *
 * Runs against a disposable SQLite database via ./catalog.test-setup. The
 * services are imported dynamically AFTER the test DB is provisioned so their
 * internal PrismaClients bind to the throwaway database. `misconduct.service`
 * pulls in NotificationService + socket emit for post-commit side effects;
 * both are mocked here so the property exercises only the snapshot logic
 * without touching the notification tables or the (absent) Socket.IO server.
 */

// Mock the post-commit side effects so misconduct creation stays hermetic.
// vi.mock is hoisted above the dynamic imports in beforeAll, so the mocked
// modules are already in place when misconduct.service is imported.
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
let CatalogServiceCtor: typeof import('./catalog.service').CatalogService;
let MisconductServiceCtor: typeof import('./misconduct.service').MisconductService;
let catalog: import('./catalog.service').CatalogService;
let misconducts: import('./misconduct.service').MisconductService;

beforeAll(async () => {
  db = createTestDatabase('misconduct-snapshot');
  prisma = db.prisma;
  ({ CatalogService: CatalogServiceCtor } = await import('./catalog.service'));
  ({ MisconductService: MisconductServiceCtor } = await import('./misconduct.service'));
  catalog = new CatalogServiceCtor();
  misconducts = new MisconductServiceCtor();
}, 120_000);

afterAll(async () => {
  await destroyTestDatabase(db);
});

// --- Generators ------------------------------------------------------------

// ASCII-only name characters keep case-folding well-behaved while exercising
// letters, digits, spaces and punctuation.
const NAME_CHARS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -_.'.split('');

// A valid catalog name: 1..100 chars once trimmed, not whitespace-only.
const validName: fc.Arbitrary<string> = fc
  .array(fc.constantFrom(...NAME_CHARS), { minLength: 1, maxLength: 40 })
  .map((chars) => chars.join(''))
  .filter((s) => {
    const t = s.trim();
    return t.length >= 1 && t.length <= 100;
  });

// A non-empty, non-whitespace-only value for category/severity fields.
const nonEmptyField: fc.Arbitrary<string> = fc
  .array(fc.constantFrom(...'abcdefghijkLMNOPQ'.split('')), { minLength: 1, maxLength: 12 })
  .map((chars) => chars.join(''));

const description: fc.Arbitrary<string> = fc
  .array(fc.constantFrom(...'abcdefghijk '.split('')), { minLength: 1, maxLength: 20 })
  .map((chars) => chars.join(''));

interface Scenario {
  name: string;
  category: string;
  severity: string;
  // Points on the violation type at the moment the first misconduct is created.
  initialPoints: number;
  // A subsequent valid points update (may equal initialPoints).
  updatedPoints: number;
  // Whether the violation type is deactivated before any misconduct is created
  // (exercises R2.5: inactive types still apply their points).
  deactivateBefore: boolean;
  descA: string;
  descB: string;
}

const scenario: fc.Arbitrary<Scenario> = fc.record({
  name: validName,
  category: nonEmptyField,
  severity: nonEmptyField,
  initialPoints: fc.integer({ min: 1, max: 100 }),
  updatedPoints: fc.integer({ min: 1, max: 100 }),
  deactivateBefore: fc.boolean(),
  descA: description,
  descB: description,
});

// --- Property --------------------------------------------------------------

describe('MisconductService point snapshotting (Property 4)', () => {
  it(
    'Property 4: applied points are snapshotted and catalog point updates are non-retroactive',
    async () => {
      await fc.assert(
        fc.asyncProperty(scenario, async (s) => {
          // Fresh state per run (FK-safe delete order).
          await prisma.misconduct.deleteMany();
          await prisma.operator.deleteMany();
          await prisma.user.deleteMany();
          await prisma.role.deleteMany();
          await prisma.violationType.deleteMany();

          // Minimal Role -> User -> Operator chain so misconducts can be created.
          const role = await prisma.role.create({
            data: { name: 'Test Role', permissions: '[]' },
          });
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
            data: {
              userId: user.id,
              employeeId: 'EMP-1',
              qrCode: 'QR-1',
              performanceScore: 1000,
            },
          });

          // Seed a violation type with the initial point value.
          const vt = await catalog.createViolationType({
            name: s.name,
            category: s.category,
            severity: s.severity,
            points: s.initialPoints,
          });

          // Optionally deactivate it before recording any misconduct: the
          // point snapshot must still be applied (R2.5).
          if (s.deactivateBefore) {
            await catalog.deactivateViolationType(vt.id);
          }

          // First misconduct: its snapshot must equal the point value at
          // creation time (R2.1 / R2.5).
          const m1 = await misconducts.createMisconduct({
            operatorId: operator.id,
            createdById: user.id,
            violationTypeId: vt.id,
            description: s.descA,
          });
          expect(m1.points).toBe(s.initialPoints);

          const m1Stored = await prisma.misconduct.findUnique({ where: { id: m1.id } });
          expect(m1Stored?.points).toBe(s.initialPoints);

          // Update the catalog point value (a valid 1..100 integer).
          await catalog.updateViolationType(vt.id, { points: s.updatedPoints });

          // The existing misconduct retains its original snapshot (R1.5): the
          // update is non-retroactive.
          const m1AfterUpdate = await prisma.misconduct.findUnique({ where: { id: m1.id } });
          expect(m1AfterUpdate?.points).toBe(s.initialPoints);

          // A newly created misconduct uses the updated catalog value (R1.5).
          const m2 = await misconducts.createMisconduct({
            operatorId: operator.id,
            createdById: user.id,
            violationTypeId: vt.id,
            description: s.descB,
          });
          expect(m2.points).toBe(s.updatedPoints);

          const m2Stored = await prisma.misconduct.findUnique({ where: { id: m2.id } });
          expect(m2Stored?.points).toBe(s.updatedPoints);

          // The earlier record is still untouched after the second creation.
          const m1Final = await prisma.misconduct.findUnique({ where: { id: m1.id } });
          expect(m1Final?.points).toBe(s.initialPoints);
        }),
        { numRuns: 100 },
      );
    },
    300_000,
  );
});
