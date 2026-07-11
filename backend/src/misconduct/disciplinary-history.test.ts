import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fc from 'fast-check';
import type { PrismaClient } from '@prisma/client';
import { createTestDatabase, destroyTestDatabase, TestDb } from './catalog.test-setup';

/**
 * Properties 22, 23, 24 for `DisciplinaryHistoryService.getDisciplinaryHistory`.
 *
 * Property 22: Disciplinary history collections are chronologically ordered.
 * Validates: Requirements 7.1
 *
 * Property 23: Disciplinary history includes linkage references and current
 * escalation state. Validates: Requirements 7.2, 7.3
 *
 * Property 24: Disciplinary history is rejected for a non-existent operator.
 * Validates: Requirements 7.5
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
let misconductService: import('./misconduct.service').MisconductService;
let historyService: import('./disciplinary-history.service').DisciplinaryHistoryService;
let NotFoundErrorCtor: typeof import('./errors').NotFoundError;
let AuthorizationErrorCtor: typeof import('./errors').AuthorizationError;

let foremanId: number;

const ABSENT_OPERATOR_ID = 5_000_000_001;

beforeAll(async () => {
  db = createTestDatabase('disciplinary-history');
  prisma = db.prisma;
  const misMod = await import('./misconduct.service');
  misconductService = new misMod.MisconductService();
  const histMod = await import('./disciplinary-history.service');
  historyService = new histMod.DisciplinaryHistoryService();
  ({ NotFoundError: NotFoundErrorCtor, AuthorizationError: AuthorizationErrorCtor } = await import(
    './errors'
  ));

  const role = await prisma.role.create({ data: { name: 'Foreman', permissions: '[]' } });
  const foreman = await prisma.user.create({
    data: { username: 'foreman-hist', email: 'foreman-hist@test.local', password: 'x', fullName: 'Foreman', roleId: role.id },
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
      username: `op-hist-${Math.random().toString(36).slice(2)}`,
      email: `op-hist-${Math.random().toString(36).slice(2)}@test.local`,
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
    },
  });
  return { operatorId: operator.id, userId: user.id };
}

// --- Properties 22 & 23: build a rich history and verify ordering + linkage

interface Scenario {
  misconductCount: number; // 1..5 misconducts created in sequence
  counselingOnFirst: boolean; // attach a counseling to the first misconduct
  issueKartuKuning: boolean;
  issueSp1: boolean;
}

const scenario: fc.Arbitrary<Scenario> = fc.record({
  misconductCount: fc.integer({ min: 1, max: 5 }),
  counselingOnFirst: fc.boolean(),
  issueKartuKuning: fc.boolean(),
  issueSp1: fc.boolean(),
});

describe('DisciplinaryHistoryService.getDisciplinaryHistory (Properties 22 & 23)', () => {
  it(
    'Property 22 & 23: chronological ordering, linkage references, and current escalation state',
    async () => {
      await fc.assert(
        fc.asyncProperty(scenario, async (s) => {
          const { operatorId } = await seedOperator();

          const vt = await prisma.violationType.create({
            data: {
              name: `V-${Math.random().toString(36).slice(2)}`,
              nameNormalized: `v-${Math.random().toString(36).slice(2)}`,
              category: 'general',
              severity: 'low',
              points: 3,
            },
          });

          const misconductIds: number[] = [];
          for (let i = 0; i < s.misconductCount; i++) {
            const m = await misconductService.createMisconduct({
              operatorId,
              createdById: foremanId,
              violationTypeId: vt.id,
              description: `m-${i}`,
            });
            misconductIds.push(m.id);
          }

          let counselingMisconductId: number | null = null;
          if (s.counselingOnFirst) {
            const c = await misconductService.createCounseling({
              foremanId,
              misconductId: misconductIds[0],
              topic: 'Follow up',
            });
            counselingMisconductId = c.misconductId;
          }

          let kkId: number | null = null;
          if (s.issueKartuKuning) {
            const kk = await misconductService.createKartuKuning({
              operatorId,
              issuedById: foremanId,
              reason: 'escalation',
            });
            kkId = kk.id;
          }

          let spId: number | null = null;
          if (s.issueSp1) {
            const sp = await misconductService.createSuratPeringatan({
              operatorId,
              issuedById: foremanId,
              level: 1,
              reason: 'escalation sp1',
            });
            spId = sp.id;
          }

          const history = await historyService.getDisciplinaryHistory(operatorId);

          // Property 22: chronological ascending ordering per collection.
          for (const coll of [
            history.misconducts,
            history.counselings,
            history.kartuKuning,
            history.suratPeringatan,
          ]) {
            for (let i = 1; i < coll.length; i++) {
              expect(coll[i].createdAt.getTime()).toBeGreaterThanOrEqual(
                coll[i - 1].createdAt.getTime(),
              );
            }
          }

          // Property 23: linkage references.
          expect(history.misconducts.map((m) => m.id).sort()).toEqual([...misconductIds].sort());
          if (counselingMisconductId !== null) {
            expect(history.counselings.length).toBe(1);
            expect(history.counselings[0].misconductId).toBe(counselingMisconductId);
          } else {
            expect(history.counselings.length).toBe(0);
          }

          if (kkId !== null) {
            const kkEntry = history.kartuKuning.find((k) => k.id === kkId);
            expect(kkEntry).toBeDefined();
            expect(kkEntry!.contributingMisconductIds.length).toBeGreaterThan(0);
            for (const id of kkEntry!.contributingMisconductIds) {
              expect(misconductIds).toContain(id);
            }
          }

          if (spId !== null) {
            const spEntry = history.suratPeringatan.find((sp) => sp.id === spId);
            expect(spEntry).toBeDefined();
            expect(spEntry!.contributingMisconductIds.length).toBeGreaterThan(0);
          }

          // Property 23: current accumulated points + escalation step.
          const operator = await prisma.operator.findUniqueOrThrow({ where: { id: operatorId } });
          expect(history.accumulatedPoints).toBe(operator.accumulatedPoints);
          expect(typeof history.currentStep).toBe('number');
        }),
        { numRuns: 100 },
      );
    },
    300_000,
  );
});

// --- Property 24: non-existent-operator rejection ---------------------------

describe('DisciplinaryHistoryService.getDisciplinaryHistory (Property 24)', () => {
  it('Property 24: rejects a non-existent operator id and returns no records', async () => {
    await expect(
      historyService.getDisciplinaryHistory(ABSENT_OPERATOR_ID),
    ).rejects.toBeInstanceOf(NotFoundErrorCtor);
  });
});

// --- Property 21 (partial, history slice): operator self-view scoping ------

describe('DisciplinaryHistoryService.getDisciplinaryHistory (Property 21, authorization slice)', () => {
  it('rejects an Operator requester viewing another operator\'s history (R7.6)', async () => {
    const { operatorId: opA } = await seedOperator();
    const { operatorId: opB } = await seedOperator();

    await expect(
      historyService.getDisciplinaryHistory(opA, { role: 'Operator', operatorId: opB }),
    ).rejects.toBeInstanceOf(AuthorizationErrorCtor);
  });

  it('allows an Operator requester viewing their own history (R7.4)', async () => {
    const { operatorId } = await seedOperator();
    const result = await historyService.getDisciplinaryHistory(operatorId, {
      role: 'Operator',
      operatorId,
    });
    expect(result.operatorId).toBe(operatorId);
  });
});
