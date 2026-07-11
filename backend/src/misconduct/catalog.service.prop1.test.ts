import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import type { CatalogService, ViolationTypeInput } from './catalog.service';

// Feature: integrated-misconduct-system, Property 1: Valid violation types are stored faithfully.

/**
 * Property 1: Valid violation types are stored faithfully.
 *
 * Validates: Requirements 1.1
 *
 * For any valid `ViolationTypeInput` (name 1..100 non-whitespace characters,
 * non-empty category and severity, integer points in 1..100), calling
 * `createViolationType` stores a catalog entry whose `name`, `category`,
 * `severity`, and `points` equal the submitted values.
 *
 * Runs against a disposable SQLite database. Because `catalog.service.ts`
 * instantiates its own `PrismaClient` at module load from `DATABASE_URL`, we
 * point that variable at a throwaway DB file and only import the service
 * dynamically after the environment is prepared, so the service and this
 * test's verification client share the same disposable database.
 */

const testDbPath = path.join(__dirname, 'test-catalog-prop1.db');
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
  // createViolationType) matching the Prisma model's column layout.
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

// --- Generators constrained to the valid input space ---------------------

/** Visible ASCII characters excluding all whitespace. */
const nonWhitespaceChar = fc.constantFrom(
  ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.!?()#@&*+='.split('')
);

/**
 * Valid name: 1..100 non-whitespace characters. Because the value has no
 * leading/trailing (indeed no) whitespace, the service's trim() is a no-op,
 * so the stored `name` must equal the submitted `name`.
 */
const validName = fc
  .array(nonWhitespaceChar, { minLength: 1, maxLength: 100 })
  .map((chars) => chars.join(''));

/** Non-empty category / severity (no surrounding whitespace so trim() is a no-op). */
const validCategory = fc.constantFrom('Safety', 'Quality', 'Produksi', 'Behaviour', 'Others');
const validSeverity = fc.constantFrom('low', 'medium', 'high', 'critical');
const validPoints = fc.integer({ min: 1, max: 100 });

const validInput: fc.Arbitrary<ViolationTypeInput> = fc.record({
  name: validName,
  category: validCategory,
  severity: validSeverity,
  points: validPoints,
});

// --- Property 1 ----------------------------------------------------------

describe('CatalogService.createViolationType (Property 1)', () => {
  it('Property 1: stores name, category, severity, and points equal to the submitted values', async () => {
    await fc.assert(
      fc.asyncProperty(validInput, async (input) => {
        let createdId: number | undefined;
        try {
          const created = await service.createViolationType(input);
          createdId = created.id;

          // The returned entry mirrors the submitted values.
          expect(created.name).toBe(input.name);
          expect(created.category).toBe(input.category);
          expect(created.severity).toBe(input.severity);
          expect(created.points).toBe(input.points);

          // The persisted row (read back independently) also mirrors them.
          const persisted = await prisma.violationType.findUnique({ where: { id: created.id } });
          expect(persisted).not.toBeNull();
          expect(persisted!.name).toBe(input.name);
          expect(persisted!.category).toBe(input.category);
          expect(persisted!.severity).toBe(input.severity);
          expect(persisted!.points).toBe(input.points);
        } finally {
          // Keep the catalog empty between iterations so randomly-repeated
          // names never trip the unique-name constraint (out of scope here).
          if (createdId !== undefined) {
            await prisma.violationType.delete({ where: { id: createdId } });
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});
