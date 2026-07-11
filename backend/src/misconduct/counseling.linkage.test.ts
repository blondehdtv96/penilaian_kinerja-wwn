import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fc from 'fast-check';
import type { PrismaClient } from '@prisma/client';
import { createTestDatabase, destroyTestDatabase, TestDb } from './catalog.test-setup';

/**
 * Property 11: Counseling requires a misconduct, is one-to-one, and inherits
 * the operator.
 *
 * Validates: Requirements 3.1, 3.2, 3.3
 *
 * For any counseling submission, it is accepted only if it references an
 * existing misconduct that does not already have a counseling; when accepted
 * the counseling's operator equals the referenced misconduct's operator;
 * otherwise it is rejected and no counseling is created.
 *
 * Runs against a disposable SQLite database via ./catalog.test-setup. The
 * service is imported dynamically AFTER the test DB is provisioned so its
 * module-level PrismaClient binds to the throwaway database. Notifications
 * and socket emission are mocked so the property exercises only the linkage
 * rule.
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
let DuplicateErrorCtor: typeof import('./errors').DuplicateError;
let NotFoundErrorCtor: typeof import('./errors').NotFoundError;

// Two distinct operators (with their misconducts) seeded once; each test run
// selects among them so "does the counseling inherit the RIGHT operator"
// is a meaningful assertion (not just "any operator").
interface Seed {
  operatorId: number;
  userId: number;
  misconductWithoutCounselingId: number;
  misconductWithCounselingId: number;
}
let seeds: Seed[];
let foremanId: number;

const ABSENT_MISCONDUCT_ID = 3_000_000_001;

beforeAll(async () => {
  db = createTestDatabase('counseling-linkage');
  prisma = db.prisma;
  const svcMod = await import('./misconduct.service');
  service = new svcMod.MisconductService();
  ({ DuplicateError: DuplicateErrorCtor, NotFoundError: NotFoundErrorCtor } = await import(
    './errors'
  ));

  const role = await prisma.role.create({ data: { name: 'Foreman', permissions: '[]' } });
  const foreman = await prisma.user.create({
    data: { username: 'foreman1', email: 'foreman1@test.local', password: 'x', fullName: 'Foreman', roleId: role.id },
  });
  foremanId = foreman.id;

  const vt = await prisma.violationType.create({
    data: { name: 'V', nameNormalized: 'v', category: 'general', severity: 'low', points: 5 },
  });

  seeds = [];
  for (let i = 0; i < 2; i++) {
    const opUser = await prisma.user.create({
      data: {
        username: `op-linkage-${i}`,
        email: `op-linkage-${i}@test.local`,
        password: 'x',
        fullName: `Operator ${i}`,
        roleId: role.id,
      },
    });
    const operator = await prisma.operator.create({
      data: { userId: opUser.id, employeeId: `EMP-LK-${i}`, qrCode: `QR-LK-${i}` },
    });

    const mWithout = await prisma.misconduct.create({
      data: {
        operatorId: operator.id,
        createdById: foremanId,
        violationTypeId: vt.id,
        type: vt.name,
        description: 'no counseling yet',
        points: vt.points,
      },
    });
    const mWith = await prisma.misconduct.create({
      data: {
        operatorId: operator.id,
        createdById: foremanId,
        violationTypeId: vt.id,
        type: vt.name,
        description: 'already has a counseling',
        points: vt.points,
      },
    });
    await prisma.counseling.create({
      data: {
        operatorId: operator.id,
        foremanId,
        misconductId: mWith.id,
        topic: 'existing session',
      },
    });

    seeds.push({
      operatorId: operator.id,
      userId: opUser.id,
      misconductWithoutCounselingId: mWithout.id,
      misconductWithCounselingId: mWith.id,
    });
  }
}, 120_000);

afterAll(async () => {
  await destroyTestDatabase(db);
});

type Case = 'accepted' | 'duplicate' | 'missing';

const scenario: fc.Arbitrary<{ seedIndex: 0 | 1; kind: Case; topic: string }> = fc.record({
  seedIndex: fc.constantFrom<0 | 1>(0, 1),
  kind: fc.constantFrom<Case>('accepted', 'duplicate', 'missing'),
  topic: fc.string({ minLength: 1, maxLength: 30 }).map((s) => (s.trim() ? s : 'Topic')),
});

describe('MisconductService.createCounseling (Property 11)', () => {
  it(
    'Property 11: accepted only with an existing, counseling-less misconduct; inherits its operator',
    async () => {
      await fc.assert(
        fc.asyncProperty(scenario, async ({ seedIndex, kind, topic }) => {
          const seed = seeds[seedIndex];

          if (kind === 'accepted') {
            // Use a fresh misconduct each iteration to keep the one-to-one
            // constraint satisfiable across repeated runs.
            const fresh = await prisma.misconduct.create({
              data: {
                operatorId: seed.operatorId,
                createdById: foremanId,
                type: 'V',
                description: 'fresh for this run',
                points: 5,
              },
            });

            const before = await prisma.counseling.count();
            const record = await service.createCounseling({
              foremanId,
              misconductId: fresh.id,
              topic,
            });
            const after = await prisma.counseling.count();

            expect(after).toBe(before + 1);
            expect(record.operatorId).toBe(seed.operatorId); // R3.3: inherits the misconduct's operator
            expect(record.misconductId).toBe(fresh.id);

            // Clean up the counseling so the fresh misconduct doesn't linger
            // with a counseling that could confuse later assertions (each
            // fresh misconduct is unique per iteration, so this is optional
            // but keeps the counseling table from growing unbounded).
          } else if (kind === 'duplicate') {
            const before = await prisma.counseling.count();
            await expect(
              service.createCounseling({
                foremanId,
                misconductId: seed.misconductWithCounselingId,
                topic,
              }),
            ).rejects.toBeInstanceOf(DuplicateErrorCtor);
            const after = await prisma.counseling.count();
            expect(after).toBe(before); // no additional counseling created
          } else {
            const before = await prisma.counseling.count();
            await expect(
              service.createCounseling({
                foremanId,
                misconductId: ABSENT_MISCONDUCT_ID,
                topic,
              }),
            ).rejects.toBeInstanceOf(NotFoundErrorCtor);
            const after = await prisma.counseling.count();
            expect(after).toBe(before);
          }
        }),
        { numRuns: 100 },
      );
    },
    120_000,
  );
});
