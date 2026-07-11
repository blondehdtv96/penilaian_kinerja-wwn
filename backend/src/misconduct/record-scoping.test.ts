import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fc from 'fast-check';
import type { PrismaClient } from '@prisma/client';
import { createTestDatabase, destroyTestDatabase, TestDb } from './catalog.test-setup';

/**
 * Property 21: Record listings return only the requested operator's records.
 *
 * Validates: Requirements 5.6, 5.7, 7.4
 *
 * For any operator and any population of disciplinary records across
 * multiple operators, a listing or self-view for that operator returns
 * exactly the records belonging to that operator (an empty list when there
 * are none).
 *
 * This test covers the kartu kuning listing (all-by-operator and operator
 * self-view). Runs against a disposable SQLite database via
 * ./catalog.test-setup.
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

let foremanId: number;

beforeAll(async () => {
  db = createTestDatabase('record-scoping');
  prisma = db.prisma;
  const svcMod = await import('./misconduct.service');
  service = new svcMod.MisconductService();

  const role = await prisma.role.create({ data: { name: 'Foreman', permissions: '[]' } });
  const foreman = await prisma.user.create({
    data: { username: 'foreman-scope', email: 'foreman-scope@test.local', password: 'x', fullName: 'Foreman', roleId: role.id },
  });
  foremanId = foreman.id;
}, 120_000);

afterAll(async () => {
  await destroyTestDatabase(db);
});

async function seedOperator(): Promise<{ operatorId: number; userId: number }> {
  const role = await prisma.role.create({ data: { name: `R-${Math.random()}`, permissions: '[]' } });
  const user = await prisma.user.create({
    data: {
      username: `op-scope-${Math.random().toString(36).slice(2)}`,
      email: `op-scope-${Math.random().toString(36).slice(2)}@test.local`,
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
      accumulatedPoints: 50, // above the default kartu kuning threshold (10)
    },
  });
  return { operatorId: operator.id, userId: user.id };
}

// Each operator gets 0 or 1 kartu kuning: a non-override issuance is unique
// per unescalated level (R5.4), so more than one per operator would require
// escalating between issuances — orthogonal to what this property tests
// (listing scope, not issuance sequencing).
const kkCounts: fc.Arbitrary<number[]> = fc.array(fc.integer({ min: 0, max: 1 }), {
  minLength: 2,
  maxLength: 4,
});

describe('Kartu Kuning listing scoping (Property 21)', () => {
  it(
    'Property 21: getAllKartuKuning(operatorId) and getMyKartuKuning(userId) return exactly that operator\'s records',
    async () => {
      await fc.assert(
        fc.asyncProperty(kkCounts, async (counts) => {
          const operators: { operatorId: number; userId: number }[] = [];
          for (const count of counts) {
            const op = await seedOperator();
            operators.push(op);
            for (let i = 0; i < count; i++) {
              await service.createKartuKuning({
                operatorId: op.operatorId,
                issuedById: foremanId,
                reason: `kk-${i}`,
              });
              // Bump accumulatedPoints back up (issuance doesn't change it,
              // but repeated non-override issuances at the same level would
              // be rejected as duplicates — so escalate between issuances by
              // recording an extra misconduct to raise the level check's
              // "current level" isn't affected by count; instead simply
              // accept that only the FIRST issuance per operator is
              // non-override-eligible and subsequent ones may throw. To keep
              // this property about LISTING SCOPE (not issuance rules), cap
              // at count=1 effectively by breaking after the first success.
            }
          }

          for (const op of operators) {
            const expectedCount = await prisma.kartuKuning.count({ where: { operatorId: op.operatorId } });

            const allView = await service.getAllKartuKuning(op.operatorId);
            expect(allView.every((r: any) => r.operatorId === op.operatorId)).toBe(true);
            expect(allView.length).toBe(expectedCount);

            const selfView = await service.getMyKartuKuning(op.userId);
            expect(selfView.every((r: any) => r.operatorId === op.operatorId)).toBe(true);
            expect(selfView.length).toBe(expectedCount);
          }
        }),
        { numRuns: 100 },
      );
    },
    300_000,
  );

  it('returns an empty list for an operator with no kartu kuning records', async () => {
    const op = await seedOperator();
    expect(await service.getAllKartuKuning(op.operatorId)).toEqual([]);
    expect(await service.getMyKartuKuning(op.userId)).toEqual([]);
  });
});
