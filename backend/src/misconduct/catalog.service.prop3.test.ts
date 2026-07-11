import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { ValidationError } from './errors';
import type { CatalogService, ViolationTypeInput } from './catalog.service';

/**
 * Property 3: Invalid name or point values are rejected without mutation.
 *
 * Validates: Requirements 1.3, 1.4
 *
 * For any submission whose name is empty, whitespace-only, or exceeds 100
 * characters, or whose points value is non-integer, less than 1, or greater
 * than 100, `createViolationType` / `updateViolationType` reject the request
 * with a `ValidationError` identifying the invalid field (`name` or `points`)
 * and leave the affected catalog entry unchanged (no create; no update).
 *
 * Runs against a disposable SQLite database. Because `catalog.service.ts`
 * instantiates its own `PrismaClient` at module load from `DATABASE_URL`, we
 * point that variable at a throwaway DB file and only import the service
 * dynamically after the environment is prepared, so the service and this
 * test's verification client share the same disposable database.
 */

const testDbPath = path.join(__dirname, 'test-catalog-prop3.db');
const testDbUrl = `file:${testDbPath}`;
const artifacts = [testDbPath, `${testDbPath}-journal`];

let prisma: PrismaClient;
let service: CatalogService;

function removeArtifacts(): void {
  for (const file of artifacts) {
    try {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } catch {
      // Best-effort: a lingering DB handle on Windows may block deletion; the
      // stale file is cleared at the start of the next run regardless.
    }
  }
}

beforeAll(async () => {
  // Point the service's PrismaClient at the disposable DB BEFORE importing it.
  process.env.DATABASE_URL = testDbUrl;
  removeArtifacts();

  prisma = new PrismaClient({ datasources: { db: { url: testDbUrl } } });

  // Create just the ViolationType table (the only table exercised by
  // create/update validation) matching the Prisma model's column layout.
  await prisma.$executeRawUnsafe(
    `CREATE TABLE "ViolationType" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "nameNormalized" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "severity" TEXT NOT NULL,
      "points" INTEGER NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );`
  );
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX "ViolationType_nameNormalized_key" ON "ViolationType"("nameNormalized");`
  );

  const mod = await import('./catalog.service');
  service = new mod.CatalogService();
});

afterAll(async () => {
  if (prisma) await prisma.$disconnect();
  removeArtifacts();
});

// --- Generators constrained to the invalid input space -------------------

const alnumChar = fc.constantFrom(
  ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')
);

/** Valid name: 1..100 non-whitespace chars (kept short for uniqueness). */
const validName = fc.array(alnumChar, { minLength: 1, maxLength: 60 }).map((a) => a.join(''));
const validCategory = fc.constantFrom('Safety', 'Quality', 'Produksi', 'Behaviour', 'Others');
const validSeverity = fc.constantFrom('low', 'medium', 'high', 'critical');
const validPoints = fc.integer({ min: 1, max: 100 });

/** Empty ('') or whitespace-only names (R1.3). */
const whitespaceName = fc
  .array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 0, maxLength: 8 })
  .map((a) => a.join(''));
/** Names whose trimmed length exceeds 100 characters (R1.3). */
const tooLongName = fc.array(alnumChar, { minLength: 101, maxLength: 140 }).map((a) => a.join(''));
const invalidName = fc.oneof(whitespaceName, tooLongName);

/** Non-integer, <1, or >100 point values (R1.4). */
const invalidPoints = fc.oneof(
  fc
    .double({ min: 1, max: 99, noNaN: true, noDefaultInfinity: true })
    .filter((n) => !Number.isInteger(n)),
  fc.integer({ min: -500, max: 0 }),
  fc.integer({ min: 101, max: 5000 })
);

type ExpectedField = 'name' | 'points';

const invalidCreate: fc.Arbitrary<{ input: ViolationTypeInput; expectedField: ExpectedField }> =
  fc.oneof(
    fc
      .record({ name: invalidName, category: validCategory, severity: validSeverity, points: validPoints })
      .map((input) => ({ input, expectedField: 'name' as const })),
    fc
      .record({ name: validName, category: validCategory, severity: validSeverity, points: invalidPoints })
      .map((input) => ({ input, expectedField: 'points' as const }))
  );

const invalidPatch: fc.Arbitrary<{ patch: Partial<ViolationTypeInput>; expectedField: ExpectedField }> =
  fc.oneof(
    invalidName.map((name) => ({ patch: { name }, expectedField: 'name' as const })),
    invalidPoints.map((points) => ({ patch: { points }, expectedField: 'points' as const }))
  );

// --- Property 3 ----------------------------------------------------------

describe('CatalogService validation (Property 3)', () => {
  it('Property 3: create rejects invalid name/points and creates no entry', async () => {
    await fc.assert(
      fc.asyncProperty(invalidCreate, async ({ input, expectedField }) => {
        const before = await prisma.violationType.count();

        let error: unknown;
        try {
          await service.createViolationType(input);
        } catch (e) {
          error = e;
        }

        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe(expectedField);

        const after = await prisma.violationType.count();
        expect(after).toBe(before);
      }),
      { numRuns: 100 }
    );
  });

  it(
    'Property 3: update rejects invalid name/points and leaves the entry unchanged',
    async () => {
      let counter = 0;
      await fc.assert(
        fc.asyncProperty(invalidPatch, async ({ patch, expectedField }) => {
          const created = await service.createViolationType({
            name: `Valid Name ${counter++} ${Date.now()}`,
            category: 'Safety',
            severity: 'low',
            points: 10,
          });
          const before = await prisma.violationType.findUnique({ where: { id: created.id } });

          let error: unknown;
          try {
            await service.updateViolationType(created.id, patch);
          } catch (e) {
            error = e;
          }

          try {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).field).toBe(expectedField);

            const after = await prisma.violationType.findUnique({ where: { id: created.id } });
            expect(after).toEqual(before);
          } finally {
            await prisma.violationType.delete({ where: { id: created.id } });
          }
        }),
        { numRuns: 100 }
      );
    },
    60_000,
  );
});
