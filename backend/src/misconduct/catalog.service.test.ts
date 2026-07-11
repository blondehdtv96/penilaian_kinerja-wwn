import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fc from 'fast-check';
import type { PrismaClient } from '@prisma/client';
import { createTestDatabase, destroyTestDatabase, TestDb } from './catalog.test-setup';

/**
 * Property 2: Duplicate names are rejected and leave the catalog unchanged.
 *
 * Validates: Requirements 1.2
 *
 * For any existing violation type name and any variant differing only by
 * letter case and/or leading/trailing whitespace, submitting the variant is
 * rejected with a duplicate-name error (DuplicateError) and the catalog is
 * unchanged (no row added, no existing row mutated).
 *
 * Runs against a disposable SQLite database via ./catalog.test-setup. The
 * service is imported dynamically AFTER the test DB is provisioned so its
 * internal PrismaClient binds to the throwaway database.
 */

// Bound in beforeAll (dynamic import must follow test-DB provisioning).
let db: TestDb;
let prisma: PrismaClient;
let CatalogServiceCtor: typeof import('./catalog.service').CatalogService;
let DuplicateErrorCtor: typeof import('./errors').DuplicateError;
let service: import('./catalog.service').CatalogService;

beforeAll(async () => {
  db = createTestDatabase('catalog-dupe');
  prisma = db.prisma;
  ({ CatalogService: CatalogServiceCtor } = await import('./catalog.service'));
  ({ DuplicateError: DuplicateErrorCtor } = await import('./errors'));
  service = new CatalogServiceCtor();
}, 120_000);

afterAll(async () => {
  await destroyTestDatabase(db);
});

// --- Generators ------------------------------------------------------------

// ASCII-only name characters keep case-folding well-behaved (no locale/length
// surprises from Unicode toLowerCase) while still exercising letters, digits,
// spaces and punctuation.
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

// Leading/trailing whitespace runs (stripped by trim()).
const whitespace: fc.Arbitrary<string> = fc
  .array(fc.constantFrom(' ', '\t'), { maxLength: 3 })
  .map((chars) => chars.join(''));

interface Scenario {
  name: string;
  category: string;
  severity: string;
  points: number;
  vCategory: string;
  vSeverity: string;
  vPoints: number;
  lead: string;
  trail: string;
  caseMode: 'upper' | 'lower' | 'same';
}

const scenario: fc.Arbitrary<Scenario> = fc.record({
  name: validName,
  category: nonEmptyField,
  severity: nonEmptyField,
  points: fc.integer({ min: 1, max: 100 }),
  vCategory: nonEmptyField,
  vSeverity: nonEmptyField,
  vPoints: fc.integer({ min: 1, max: 100 }),
  lead: whitespace,
  trail: whitespace,
  caseMode: fc.constantFrom('upper', 'lower', 'same'),
});

/** Build a name variant that differs only by case and/or surrounding space. */
function makeVariant(s: Scenario): string {
  const cased =
    s.caseMode === 'upper'
      ? s.name.toUpperCase()
      : s.caseMode === 'lower'
        ? s.name.toLowerCase()
        : s.name;
  return `${s.lead}${cased}${s.trail}`;
}

// --- Property --------------------------------------------------------------

describe('CatalogService.createViolationType (Property 2)', () => {
  it(
    'Property 2: rejects case/whitespace-variant duplicate names and leaves the catalog unchanged',
    async () => {
      await fc.assert(
        fc.asyncProperty(scenario, async (s) => {
          // Fresh catalog per run so "unchanged" is unambiguous.
          await prisma.violationType.deleteMany();

          // Seed the existing violation type.
          await service.createViolationType({
            name: s.name,
            category: s.category,
            severity: s.severity,
            points: s.points,
          });

          const before = await prisma.violationType.findMany({ orderBy: { id: 'asc' } });

          // Submitting a case/whitespace variant must be rejected.
          const variant = makeVariant(s);
          let rejected = false;
          try {
            await service.createViolationType({
              name: variant,
              category: s.vCategory,
              severity: s.vSeverity,
              points: s.vPoints,
            });
          } catch (err) {
            rejected = true;
            expect(err).toBeInstanceOf(DuplicateErrorCtor);
          }
          expect(rejected).toBe(true);

          // The catalog is unchanged: exactly the seeded row, byte-for-byte.
          const after = await prisma.violationType.findMany({ orderBy: { id: 'asc' } });
          expect(after).toHaveLength(1);
          expect(after).toEqual(before);
        }),
        { numRuns: 100 },
      );
    },
    120_000,
  );
});
