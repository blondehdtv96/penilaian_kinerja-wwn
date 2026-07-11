import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fc from 'fast-check';
import type { PrismaClient } from '@prisma/client';
import { createTestDatabase, destroyTestDatabase, TestDb } from './catalog.test-setup';

/**
 * Properties 19 & 20 for `MisconductService.createSuratPeringatan`.
 *
 * Property 19: Surat peringatan is valid only with a legal, in-sequence,
 * non-duplicate level. Validates: Requirements 6.2, 6.3, 6.7
 *
 * Property 20: Surat peringatan listings are ordered by ascending level.
 * Validates: Requirements 6.5
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
let ValidationErrorCtor: typeof import('./errors').ValidationError;
let SequenceErrorCtor: typeof import('./errors').SequenceError;
let DuplicateErrorCtor: typeof import('./errors').DuplicateError;

let foremanId: number;
let issuedById: number;

beforeAll(async () => {
  db = createTestDatabase('sp-issuance');
  prisma = db.prisma;
  const svcMod = await import('./misconduct.service');
  service = new svcMod.MisconductService();
  ({
    ValidationError: ValidationErrorCtor,
    SequenceError: SequenceErrorCtor,
    DuplicateError: DuplicateErrorCtor,
  } = await import('./errors'));

  const role = await prisma.role.create({ data: { name: 'Foreman', permissions: '[]' } });
  const foreman = await prisma.user.create({
    data: { username: 'foreman-sp', email: 'foreman-sp@test.local', password: 'x', fullName: 'Foreman', roleId: role.id },
  });
  foremanId = foreman.id;
  issuedById = foreman.id;
}, 120_000);

afterAll(async () => {
  await destroyTestDatabase(db);
});

async function seedOperator(): Promise<number> {
  const role = await prisma.role.create({ data: { name: `R-${Math.random()}`, permissions: '[]' } });
  const user = await prisma.user.create({
    data: {
      username: `op-sp-${Math.random().toString(36).slice(2)}`,
      email: `op-sp-${Math.random().toString(36).slice(2)}@test.local`,
      password: 'x',
      fullName: 'Op',
      roleId: role.id,
    },
  });
  const operator = await prisma.operator.create({
    data: {
      userId: user.id,
      employeeId: `EMP-${Math.random().toString(36).slice(2)}`,
      qrCode: `QR-${Math.random().toString(36).slice(2)}`,
      performanceScore: 1000,
      accumulatedPoints: 100, // well above every SP threshold by default
    },
  });
  return operator.id;
}

// --- Property 19: legal, in-sequence, non-duplicate level acceptance -------

/** A test action: issue at a given level, expecting a given outcome. */
type Outcome = 'accept' | 'validation' | 'sequence' | 'duplicate';

interface Step {
  level: number;
  expected: Outcome;
}

/**
 * Generates a plan of issuance attempts for a single fresh operator:
 * a shuffled-ish mix of legal in-sequence issuances plus deliberate
 * violations (invalid level, out-of-sequence, duplicate), each tagged with
 * its expected outcome given the operator's history built up so far.
 */
const plan: fc.Arbitrary<Step[]> = fc.array(
  fc.oneof(
    // A legal level attempt (may or may not be in-sequence at eval time,
    // handled by the evaluator below which tracks state).
    fc.constantFrom(1, 2, 3).map((level) => ({ tag: 'legal' as const, level })),
    // An illegal level value (not 1/2/3).
    fc
      .integer({ min: -3, max: 6 })
      .filter((n) => n !== 1 && n !== 2 && n !== 3)
      .map((level) => ({ tag: 'illegal' as const, level })),
  ),
  { minLength: 1, maxLength: 8 },
).map((attempts) => {
  // Evaluate each attempt against accumulated state to assign the expected outcome.
  const issued = new Set<number>();
  const steps: Step[] = [];
  for (const a of attempts) {
    if (a.tag === 'illegal') {
      steps.push({ level: a.level, expected: 'validation' });
      continue;
    }
    const level = a.level;
    if (issued.has(level)) {
      steps.push({ level, expected: 'duplicate' });
    } else if (level > 1 && !issued.has(level - 1)) {
      // Missing at least one prior level.
      let ok = true;
      for (let l = 1; l < level; l++) if (!issued.has(l)) ok = false;
      steps.push({ level, expected: ok ? 'accept' : 'sequence' });
      if (ok) issued.add(level);
    } else {
      steps.push({ level, expected: 'accept' });
      issued.add(level);
    }
  }
  return steps;
});

describe('MisconductService.createSuratPeringatan (Property 19)', () => {
  it(
    'Property 19: accepts only legal, in-sequence, non-duplicate levels; otherwise rejects without mutation',
    async () => {
      await fc.assert(
        fc.asyncProperty(plan, async (steps) => {
          const operatorId = await seedOperator();

          for (const step of steps) {
            const before = await prisma.suratPeringatan.findMany({
              where: { operatorId },
              select: { level: true },
            });

            const input = { operatorId, issuedById, level: step.level, reason: 'test' };

            if (step.expected === 'accept') {
              const record = await service.createSuratPeringatan(input);
              expect(record.level).toBe(step.level);
            } else {
              const ErrorCtor =
                step.expected === 'validation'
                  ? ValidationErrorCtor
                  : step.expected === 'sequence'
                    ? SequenceErrorCtor
                    : DuplicateErrorCtor;
              await expect(service.createSuratPeringatan(input)).rejects.toBeInstanceOf(ErrorCtor);

              // Rejected attempts leave the operator's existing records unchanged.
              const after = await prisma.suratPeringatan.findMany({
                where: { operatorId },
                select: { level: true },
              });
              expect(after.map((r) => r.level).sort()).toEqual(before.map((r) => r.level).sort());
            }
          }
        }),
        { numRuns: 100 },
      );
    },
    180_000,
  );
});

// --- Property 20: ascending-level listing order -----------------------------

describe('MisconductService.getAllSuratPeringatan (Property 20)', () => {
  it(
    'Property 20: returns the operator\'s records ordered by ascending level',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Sequencing requires levels 1..N-1 before N, so only a PREFIX of
          // [1, 2, 3] (length 1..3) is ever a legal issuance set.
          fc.integer({ min: 1, max: 3 }),
          async (maxLevel) => {
            const operatorId = await seedOperator();
            for (let level = 1; level <= maxLevel; level++) {
              await service.createSuratPeringatan({ operatorId, issuedById, level, reason: 'r' });
            }

            const list = await service.getAllSuratPeringatan(operatorId);
            const levels = list.map((r: any) => r.level);
            const expectedLevels = [...levels].sort((a, b) => a - b);
            expect(levels).toEqual(expectedLevels);
          },
        ),
        { numRuns: 100 },
      );
    },
    180_000,
  );

  it('returns an empty list when the operator has no surat peringatan records', async () => {
    const operatorId = await seedOperator();
    const list = await service.getAllSuratPeringatan(operatorId);
    expect(list).toEqual([]);
  });
});
