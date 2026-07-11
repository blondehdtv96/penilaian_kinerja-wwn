import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fc from 'fast-check';
import type { PrismaClient } from '@prisma/client';
import { createTestDatabase, destroyTestDatabase, TestDb } from './catalog.test-setup';

/**
 * Property 5: Deactivation hides from default listing but preserves references.
 *
 * Validates: Requirements 1.7
 *
 * For any catalog containing a deactivated violation type, the default catalog
 * listing (`listCatalog()`) excludes it while any misconduct referencing it
 * still resolves to that violation type.
 *
 * Runs against a disposable SQLite database via ./catalog.test-setup. The
 * service is imported dynamically AFTER the test DB is provisioned so its
 * internal PrismaClient binds to the throwaway database. The harness
 * provisions the full schema, so we also create an Operator + Misconduct that
 * reference a deactivated violation type to prove the reference still resolves.
 */

// Bound in beforeAll (dynamic import must follow test-DB provisioning).
let db: TestDb;
let prisma: PrismaClient;
let CatalogServiceCtor: typeof import('./catalog.service').CatalogService;
let service: import('./catalog.service').CatalogService;

beforeAll(async () => {
  db = createTestDatabase('catalog-deactivation');
  prisma = db.prisma;
  ({ CatalogService: CatalogServiceCtor } = await import('./catalog.service'));
  service = new CatalogServiceCtor();
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

interface CatalogSpec {
  name: string;
  category: string;
  severity: string;
  points: number;
  deactivate: boolean;
}

// A set of catalog entries with distinct normalized names. At least one entry
// is forced to be deactivated so the property is exercised meaningfully.
const catalogSpecs: fc.Arbitrary<CatalogSpec[]> = fc
  .uniqueArray(
    fc.record({
      name: validName,
      category: nonEmptyField,
      severity: nonEmptyField,
      points: fc.integer({ min: 1, max: 100 }),
      deactivate: fc.boolean(),
    }),
    {
      selector: (s) => s.name.trim().toLowerCase(),
      minLength: 1,
      maxLength: 6,
    },
  )
  .map((specs) => {
    // Guarantee at least one deactivated entry per run.
    specs[0] = { ...specs[0], deactivate: true };
    return specs;
  });

// --- Property --------------------------------------------------------------

describe('CatalogService deactivation (Property 5)', () => {
  it(
    'Property 5: deactivation hides from default listing but preserves misconduct references',
    async () => {
      await fc.assert(
        fc.asyncProperty(catalogSpecs, async (specs) => {
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
            },
          });

          // Seed the catalog via the service.
          const created = [] as { id: number; deactivate: boolean }[];
          for (const spec of specs) {
            const vt = await service.createViolationType({
              name: spec.name,
              category: spec.category,
              severity: spec.severity,
              points: spec.points,
            });
            created.push({ id: vt.id, deactivate: spec.deactivate });
          }

          // Deactivate the flagged entries and create a referencing misconduct.
          const deactivatedIds: number[] = [];
          const misconductRefs: { miscId: number; vtId: number }[] = [];
          for (const c of created) {
            if (!c.deactivate) continue;
            await service.deactivateViolationType(c.id);
            deactivatedIds.push(c.id);
            const m = await prisma.misconduct.create({
              data: {
                operatorId: operator.id,
                createdById: user.id,
                type: 'Test',
                description: 'references a deactivated violation type',
                points: 0,
                violationTypeId: c.id,
              },
            });
            misconductRefs.push({ miscId: m.id, vtId: c.id });
          }

          // Default listing excludes every deactivated entry.
          const listed = await service.listCatalog();
          const listedIds = new Set(listed.map((v) => v.id));
          for (const id of deactivatedIds) {
            expect(listedIds.has(id)).toBe(false);
          }
          // ...and every deactivated entry is indeed marked inactive.
          for (const v of listed) {
            expect(v.isActive).toBe(true);
          }

          // Active entries still appear in the default listing.
          for (const c of created) {
            if (!c.deactivate) {
              expect(listedIds.has(c.id)).toBe(true);
            }
          }

          // Deactivated entries remain retrievable when explicitly requested.
          const listedAll = await service.listCatalog({ includeInactive: true });
          const listedAllIds = new Set(listedAll.map((v) => v.id));
          for (const c of created) {
            expect(listedAllIds.has(c.id)).toBe(true);
          }

          // Every misconduct referencing a deactivated type still resolves to it.
          for (const { miscId, vtId } of misconductRefs) {
            const m = await prisma.misconduct.findUnique({
              where: { id: miscId },
              include: { violationType: true },
            });
            expect(m?.violationType).not.toBeNull();
            expect(m?.violationType?.id).toBe(vtId);
            expect(m?.violationType?.isActive).toBe(false);
          }
        }),
        { numRuns: 100 },
      );
    },
    300_000,
  );
});
