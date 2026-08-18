import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import type { PrismaClient } from '@prisma/client';
import { createTestDatabase, destroyTestDatabase, TestDb } from '../misconduct/catalog.test-setup';

/**
 * Route-level authorization tests for the Staff-Produksi "manage Operator
 * users" module: only the Staff Produksi role (or Super Admin, via the
 * universal bypass in checkRole) may reach these routes, and the service
 * layer refuses to touch any User whose role isn't Operator — this is what
 * stops a Staff Produksi account from editing/deleting a Foreman, Section
 * Manager, or Super Admin through this endpoint.
 */

let db: TestDb;
let prisma: PrismaClient;
let app: express.Express;
let server: HttpServer;
let baseUrl: string;

const JWT_SECRET = 'test-secret-for-staff-produksi-route-authorization';

function tokenFor(userId: number, role: string): string {
  return jwt.sign({ userId, username: `u${userId}`, role, permissions: [] }, JWT_SECRET, {
    expiresIn: '1h',
  });
}

async function api(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
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

let staffProduksiToken: string;
let foremanToken: string;
let foremanUserId: number;
let operatorUserId: number;

beforeAll(async () => {
  process.env.JWT_SECRET = JWT_SECRET;

  db = createTestDatabase('staff-produksi-route-authorization');
  prisma = db.prisma;

  const staffProduksiRoutes = (await import('./staff-produksi.routes')).default;

  app = express();
  app.use(express.json());
  app.use('/api/staff-produksi', staffProduksiRoutes);

  server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  baseUrl = `http://127.0.0.1:${port}/api/staff-produksi`;

  const staffProduksiRole = await prisma.role.create({ data: { name: 'Staff Produksi', permissions: '[]' } });
  const foremanRole = await prisma.role.create({ data: { name: 'Foreman', permissions: '[]' } });
  const operatorRole = await prisma.role.create({ data: { name: 'Operator', permissions: '[]' } });

  const staffProduksiUser = await prisma.user.create({
    data: { username: 'route-staff', email: 'route-staff@test.local', password: 'x', fullName: 'Staff', roleId: staffProduksiRole.id },
  });
  const foremanUser = await prisma.user.create({
    data: { username: 'route-foreman', email: 'route-foreman@test.local', password: 'x', fullName: 'Foreman', roleId: foremanRole.id },
  });
  foremanUserId = foremanUser.id;
  const operatorUser = await prisma.user.create({
    data: { username: 'route-operator', email: 'route-operator@test.local', password: 'x', fullName: 'Operator', roleId: operatorRole.id },
  });
  operatorUserId = operatorUser.id;
  await prisma.operator.create({
    data: { userId: operatorUser.id, employeeId: 'EMP-ROUTE', qrCode: 'QR-ROUTE', performanceScore: 100 },
  });

  staffProduksiToken = tokenFor(staffProduksiUser.id, 'Staff Produksi');
  foremanToken = tokenFor(foremanUser.id, 'Foreman');
}, 120_000);

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await destroyTestDatabase(db);
});

describe('Role gate on /api/staff-produksi/operators', () => {
  it('rejects a Foreman with 403', async () => {
    const { status } = await api('GET', '/operators', foremanToken);
    expect(status).toBe(403);
  });

  it('rejects no token with 401', async () => {
    const { status } = await api('GET', '/operators', null);
    expect(status).toBe(401);
  });

  it('allows Staff Produksi to list operators', async () => {
    const { status, json } = await api('GET', '/operators', staffProduksiToken);
    expect(status).toBe(200);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.every((u: any) => u.role.name === 'Operator')).toBe(true);
  });
});

describe('Staff Produksi CRUD on Operator users', () => {
  it('creates an Operator user with its Operator profile', async () => {
    const { status, json } = await api('POST', '/operators', staffProduksiToken, {
      username: 'new-operator',
      email: 'new-operator@test.local',
      fullName: 'New Operator',
      password: 'password123',
      operatorData: { employeeId: 'EMP-NEW', section: 'Curing', group: 'A', position: 'Operator' },
    });
    expect(status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.operator.employeeId).toBe('EMP-NEW');

    const created = await prisma.user.findUnique({ where: { username: 'new-operator' }, include: { role: true, operator: true } });
    expect(created?.role.name).toBe('Operator');
    expect(created?.operator?.employeeId).toBe('EMP-NEW');
  });

  it('updates the Operator user and its profile', async () => {
    const { status, json } = await api('PUT', `/operators/${operatorUserId}`, staffProduksiToken, {
      email: 'route-operator-updated@test.local',
      fullName: 'Operator Updated',
      isActive: true,
      operatorData: { section: 'Assembly', group: 'B', position: 'Senior Operator' },
    });
    expect(status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.fullName).toBe('Operator Updated');
    expect(json.data.operator.section).toBe('Assembly');
  });

  it('rejects updating a non-Operator user with 400', async () => {
    const { status, json } = await api('PUT', `/operators/${foremanUserId}`, staffProduksiToken, {
      fullName: 'Should not apply',
    });
    expect(status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('rejects deleting a non-Operator user with 400', async () => {
    const { status } = await api('DELETE', `/operators/${foremanUserId}`, staffProduksiToken);
    expect(status).toBe(400);

    const stillThere = await prisma.user.findUnique({ where: { id: foremanUserId } });
    expect(stillThere).not.toBeNull();
  });

  it('toggles status and resets password for an Operator user', async () => {
    const toggle = await api('PATCH', `/operators/${operatorUserId}/toggle-status`, staffProduksiToken);
    expect(toggle.status).toBe(200);
    expect(toggle.json.data.isActive).toBe(false);

    const reset = await api('POST', `/operators/${operatorUserId}/reset-password`, staffProduksiToken, {
      newPassword: 'brandnewpassword',
    });
    expect(reset.status).toBe(200);
    expect(reset.json.success).toBe(true);
  });

  it('deletes the Operator user (and cascades its Operator profile)', async () => {
    const { status } = await api('DELETE', `/operators/${operatorUserId}`, staffProduksiToken);
    expect(status).toBe(200);

    const user = await prisma.user.findUnique({ where: { id: operatorUserId } });
    expect(user).toBeNull();
    const operator = await prisma.operator.findUnique({ where: { userId: operatorUserId } });
    expect(operator).toBeNull();
  });
});
