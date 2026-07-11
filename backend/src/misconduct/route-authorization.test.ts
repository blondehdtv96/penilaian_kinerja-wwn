import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import type { PrismaClient } from '@prisma/client';
import { createTestDatabase, destroyTestDatabase, TestDb } from './catalog.test-setup';

/**
 * Route-level authorization and notification-dispatch integration tests
 * (task 13.4).
 *
 * Covers:
 *   - 403 for disallowed roles on catalog write/read and disciplinary
 *     history (R2.4, R7.6).
 *   - Catalog read returns the list for an authorized role within the
 *     misconduct router (R1.6).
 *   - `notifyUser` / `notifyRole` are invoked on misconduct creation
 *     (R2.9), and a single step-due notification fires per newly-crossed
 *     escalation boundary (R4.5).
 *
 * The full Express app (`src/index.ts`) pulls in Socket.IO server setup and
 * many unrelated routers; to keep this test focused and fast, it mounts only
 * `misconduct.routes` on a bare Express app, matching how `index.ts` mounts
 * it in production (`app.use('/api/records', misconductRoutes)`).
 *
 * `NotificationService` is mocked so calls can be asserted directly;
 * `emitToRooms` is mocked since no Socket.IO server is started in this test.
 */

const notifyUser = vi.fn(async () => ({}));
const notifyRole = vi.fn(async () => {});

vi.mock('../notifications/notifications.service', () => ({
  NotificationService: class {
    notifyUser = notifyUser;
    notifyRole = notifyRole;
    async notifyOperator() {}
  },
}));
vi.mock('../socket/emit', () => ({
  emitToRooms: () => {},
}));
// The controller also fires a blockchain hash write after creating a
// misconduct; stub it out so the test doesn't depend on Ganache/Ethereum.
vi.mock('../blockchain/blockchain.service', () => ({
  BlockchainService: class {
    async storeHash() {
      return { hash: 'stub', txHash: null, blockNumber: null, record: {} };
    }
  },
}));

let db: TestDb;
let prisma: PrismaClient;
let app: express.Express;
let server: HttpServer;
let baseUrl: string;

const JWT_SECRET = 'test-secret-for-route-authorization';

function tokenFor(userId: number, role: string): string {
  return jwt.sign({ userId, username: `u${userId}`, role, permissions: [] }, JWT_SECRET, {
    expiresIn: '1h',
  });
}

async function api(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT',
  path: string,
  token: string | null,
  body?: unknown,
): Promise<{ status: number; json: any }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

let foremanToken: string;
let managerToken: string;
let operatorToken: string;
let operatorUserId: number;
let operatorId: number;
let managerUserId: number;

beforeAll(async () => {
  process.env.JWT_SECRET = JWT_SECRET;

  db = createTestDatabase('route-authorization');
  prisma = db.prisma;

  const misconductRoutes = (await import('./misconduct.routes')).default;

  app = express();
  app.use(express.json());
  app.use('/api/records', misconductRoutes);

  server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  baseUrl = `http://127.0.0.1:${port}/api/records`;

  const foremanRole = await prisma.role.create({ data: { name: 'Foreman', permissions: '[]' } });
  const managerRole = await prisma.role.create({ data: { name: 'Section Manager', permissions: '[]' } });
  const operatorRole = await prisma.role.create({ data: { name: 'Operator', permissions: '[]' } });

  const foreman = await prisma.user.create({
    data: { username: 'route-foreman', email: 'route-foreman@test.local', password: 'x', fullName: 'Foreman', roleId: foremanRole.id },
  });
  const manager = await prisma.user.create({
    data: { username: 'route-manager', email: 'route-manager@test.local', password: 'x', fullName: 'Manager', roleId: managerRole.id },
  });
  managerUserId = manager.id;
  const operatorUser = await prisma.user.create({
    data: { username: 'route-operator', email: 'route-operator@test.local', password: 'x', fullName: 'Operator', roleId: operatorRole.id },
  });
  operatorUserId = operatorUser.id;
  const operator = await prisma.operator.create({
    data: { userId: operatorUser.id, employeeId: 'EMP-ROUTE', qrCode: 'QR-ROUTE', performanceScore: 100 },
  });
  operatorId = operator.id;

  foremanToken = tokenFor(foreman.id, 'Foreman');
  managerToken = tokenFor(manager.id, 'Section Manager');
  operatorToken = tokenFor(operatorUser.id, 'Operator');
}, 120_000);

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await destroyTestDatabase(db);
});

// --- Authorization: disallowed roles get 403 --------------------------------

describe('Route authorization (R2.4, R7.6)', () => {
  it('rejects catalog write from a Foreman with 403 (Section Manager only)', async () => {
    const { status } = await api('POST', '/violation-types', foremanToken, {
      name: 'X',
      category: 'Safety',
      severity: 'low',
      points: 5,
    });
    expect(status).toBe(403);
  });

  it('rejects catalog write with no token with 401', async () => {
    const { status } = await api('POST', '/violation-types', null, {
      name: 'X',
      category: 'Safety',
      severity: 'low',
      points: 5,
    });
    expect(status).toBe(401);
  });

  it('rejects misconduct creation from an Operator with 403', async () => {
    const { status } = await api('POST', '/misconduct', operatorToken, {
      operatorId,
      violationTypeId: 999999,
      description: 'x',
    });
    expect(status).toBe(403);
  });

  it('rejects an Operator requesting another operator\'s disciplinary history with an authorization error (R7.6)', async () => {
    const other = await prisma.operator.create({
      data: {
        userId: (
          await prisma.user.create({
            data: {
              username: 'route-operator-2',
              email: 'route-operator-2@test.local',
              password: 'x',
              fullName: 'Operator 2',
              roleId: (await prisma.role.findFirstOrThrow({ where: { name: 'Operator' } })).id,
            },
          })
        ).id,
        employeeId: 'EMP-ROUTE-2',
        qrCode: 'QR-ROUTE-2',
      },
    });

    // The /disciplinary-history/:operatorId route itself is Foreman/Section
    // Manager only, so an Operator hits 403 at the route layer before ever
    // reaching the authorization check inside the service — this IS the R7.6
    // enforcement boundary for this route (operators use /my instead).
    const { status } = await api('GET', `/disciplinary-history/${other.id}`, operatorToken, undefined);
    expect(status).toBe(403);
  });
});

// --- Catalog read for an authorized role (R1.6) -----------------------------

describe('Catalog read (R1.6)', () => {
  it('returns the violation type list for an authorized role (Foreman)', async () => {
    const { status, json } = await api('GET', '/violation-types', foremanToken, undefined);
    expect(status).toBe(200);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('returns the violation type list for an authorized role (Section Manager)', async () => {
    const { status, json } = await api('GET', '/violation-types', managerToken, undefined);
    expect(status).toBe(200);
    expect(json.success).toBe(true);
  });
});

// --- Notification dispatch on misconduct creation (R2.9) --------------------

describe('Notification dispatch on misconduct creation (R2.9)', () => {
  it('calls notifyUser for the operator and notifyRole for Section Manager', async () => {
    const vt = await prisma.violationType.create({
      data: { name: 'Route VT', nameNormalized: 'route vt', category: 'general', severity: 'low', points: 3 },
    });

    notifyUser.mockClear();
    notifyRole.mockClear();

    const { status, json } = await api('POST', '/misconduct', foremanToken, {
      operatorId,
      violationTypeId: vt.id,
      description: 'route test misconduct',
    });

    expect(status).toBe(201);
    expect(json.success).toBe(true);

    // Operator notified directly.
    expect(notifyUser).toHaveBeenCalledWith(
      operatorUserId,
      expect.objectContaining({ category: 'misconduct' }),
    );
    // Section Manager role notified.
    expect(notifyRole).toHaveBeenCalledWith(
      'Section Manager',
      expect.objectContaining({ category: 'misconduct' }),
    );
  });
});

// --- Single step-due notification per newly-crossed boundary (R4.5) --------

describe('Step-due notification suppression across a threshold boundary (R4.5)', () => {
  it('fires exactly one step-due notification for Foreman when the counseling threshold (5) is first crossed, and none for a repeat crossing', async () => {
    // Fresh operator so accumulatedPoints starts at 0 and the default
    // thresholds (counseling=5) are exercised deterministically.
    const opUser = await prisma.user.create({
      data: {
        username: 'route-op-step',
        email: 'route-op-step@test.local',
        password: 'x',
        fullName: 'Op Step',
        roleId: (await prisma.role.findFirstOrThrow({ where: { name: 'Operator' } })).id,
      },
    });
    const op = await prisma.operator.create({
      data: { userId: opUser.id, employeeId: 'EMP-STEP', qrCode: 'QR-STEP', performanceScore: 100 },
    });
    const vt3 = await prisma.violationType.create({
      data: { name: 'Step VT 3pt', nameNormalized: 'step vt 3pt', category: 'general', severity: 'low', points: 3 },
    });
    const vt2 = await prisma.violationType.create({
      data: { name: 'Step VT 2pt', nameNormalized: 'step vt 2pt', category: 'general', severity: 'low', points: 2 },
    });

    notifyRole.mockClear();

    // First misconduct: 3 points, below the counseling threshold (5) — no
    // step-due notification to Foreman/Section Manager yet.
    await api('POST', '/misconduct', foremanToken, {
      operatorId: op.id,
      violationTypeId: vt3.id,
      description: 'first',
    });
    const stepDueCallsAfterFirst = notifyRole.mock.calls.filter(
      ([, input]: [string, any]) => input?.title === 'Langkah eskalasi disiplin jatuh tempo',
    );
    expect(stepDueCallsAfterFirst.length).toBe(0);

    // Second misconduct: +2 points => 5 total, crossing the counseling
    // threshold. Exactly one step-due notification per role (Foreman +
    // Section Manager) should fire for this newly-crossed boundary.
    await api('POST', '/misconduct', foremanToken, {
      operatorId: op.id,
      violationTypeId: vt2.id,
      description: 'second, crosses threshold',
    });
    const stepDueCallsAfterSecond = notifyRole.mock.calls.filter(
      ([, input]: [string, any]) => input?.title === 'Langkah eskalasi disiplin jatuh tempo',
    );
    expect(stepDueCallsAfterSecond.length).toBe(2); // Foreman + Section Manager, once each
    const rolesNotified = stepDueCallsAfterSecond.map(([role]: [string, any]) => role).sort();
    expect(rolesNotified).toEqual(['Foreman', 'Section Manager']);

    // Now actually issue the counseling for the FIRST misconduct, raising the
    // operator's current escalation level to 1 (COUNSELING). This is the
    // real-world action that should suppress further step-due notifications
    // while the operator's points remain in the counseling band [5, 10).
    const firstMisconduct = await prisma.misconduct.findFirstOrThrow({
      where: { operatorId: op.id },
      orderBy: { createdAt: 'asc' },
    });
    await api('POST', '/counseling', foremanToken, {
      misconductId: firstMisconduct.id,
      topic: 'Follow up on first violation',
    });

    notifyRole.mockClear();

    // Third misconduct: another +2 points => 7 total, still within the
    // counseling band. requiredStep is still COUNSELING (1), which now
    // equals the current escalation level (1, just issued) — R4.5 suppresses
    // the duplicate step-due notification.
    await api('POST', '/misconduct', foremanToken, {
      operatorId: op.id,
      violationTypeId: vt2.id,
      description: 'third, counseling already issued, notification suppressed',
    });
    const stepDueCallsAfterThird = notifyRole.mock.calls.filter(
      ([, input]: [string, any]) => input?.title === 'Langkah eskalasi disiplin jatuh tempo',
    );
    expect(stepDueCallsAfterThird.length).toBe(0);
  });
});
