import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fc from 'fast-check';
import type { PrismaClient } from '@prisma/client';
import { createTestDatabase, destroyTestDatabase, TestDb } from './catalog.test-setup';

/**
 * Property 12: Acknowledgment is recorded once and is immutable thereafter.
 *
 * Validates: Requirements 3.4, 3.5
 *
 * For any unacknowledged counseling, acknowledging it records the
 * acknowledging user's identity and a timestamp; and for any already-
 * acknowledged counseling, a further acknowledgment is rejected and the
 * original acknowledging identity and timestamp are unchanged.
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
let ConflictErrorCtor: typeof import('./errors').ConflictError;

let operatorId: number;
let foremanId: number;
let managerAId: number;
let managerBId: number;

beforeAll(async () => {
  db = createTestDatabase('counseling-ack');
  prisma = db.prisma;
  const svcMod = await import('./misconduct.service');
  service = new svcMod.MisconductService();
  ({ ConflictError: ConflictErrorCtor } = await import('./errors'));

  const role = await prisma.role.create({ data: { name: 'Foreman', permissions: '[]' } });
  const foreman = await prisma.user.create({
    data: { username: 'foreman-ack', email: 'foreman-ack@test.local', password: 'x', fullName: 'Foreman', roleId: role.id },
  });
  foremanId = foreman.id;
  const mgrA = await prisma.user.create({
    data: { username: 'mgr-a', email: 'mgr-a@test.local', password: 'x', fullName: 'Manager A', roleId: role.id },
  });
  managerAId = mgrA.id;
  const mgrB = await prisma.user.create({
    data: { username: 'mgr-b', email: 'mgr-b@test.local', password: 'x', fullName: 'Manager B', roleId: role.id },
  });
  managerBId = mgrB.id;

  const opUser = await prisma.user.create({
    data: { username: 'op-ack', email: 'op-ack@test.local', password: 'x', fullName: 'Operator Ack', roleId: role.id },
  });
  const operator = await prisma.operator.create({
    data: { userId: opUser.id, employeeId: 'EMP-ACK', qrCode: 'QR-ACK' },
  });
  operatorId = operator.id;
}, 120_000);

afterAll(async () => {
  await destroyTestDatabase(db);
});

const scenario = fc.record({
  // Whichever manager acknowledges first / attempts the second ack.
  firstAcker: fc.constantFrom<'A' | 'B'>('A', 'B'),
  secondAcker: fc.constantFrom<'A' | 'B'>('A', 'B'),
});

describe('MisconductService.acknowledgeCounseling (Property 12)', () => {
  it(
    'Property 12: first acknowledgment is recorded; a second is rejected and leaves the original unchanged',
    async () => {
      await fc.assert(
        fc.asyncProperty(scenario, async ({ firstAcker, secondAcker }) => {
          // Fresh misconduct + counseling per run.
          const misconduct = await prisma.misconduct.create({
            data: {
              operatorId,
              createdById: foremanId,
              type: 'V',
              description: 'ack test',
              points: 5,
            },
          });
          const counseling = await prisma.counseling.create({
            data: { operatorId, foremanId, misconductId: misconduct.id, topic: 'Ack test' },
          });

          expect(counseling.acknowledgedAt).toBeNull();

          const firstId = firstAcker === 'A' ? managerAId : managerBId;
          const acknowledged = await service.acknowledgeCounseling(counseling.id, firstId);

          expect(acknowledged.acknowledgedById).toBe(firstId);
          expect(acknowledged.acknowledgedAt).not.toBeNull();

          const originalTimestamp = acknowledged.acknowledgedAt;

          const secondId = secondAcker === 'A' ? managerAId : managerBId;
          await expect(
            service.acknowledgeCounseling(counseling.id, secondId),
          ).rejects.toBeInstanceOf(ConflictErrorCtor);

          // The original identity and timestamp remain unchanged.
          const after = await prisma.counseling.findUniqueOrThrow({ where: { id: counseling.id } });
          expect(after.acknowledgedById).toBe(firstId);
          expect(after.acknowledgedAt?.getTime()).toBe(originalTimestamp?.getTime());
        }),
        { numRuns: 100 },
      );
    },
    120_000,
  );

  it('rejects acknowledging a non-existent counseling with a not-found error', async () => {
    const { NotFoundError } = await import('./errors');
    await expect(service.acknowledgeCounseling(9_999_999, managerAId)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
