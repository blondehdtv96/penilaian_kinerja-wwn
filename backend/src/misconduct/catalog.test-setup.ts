/**
 * Shared disposable-database harness for CatalogService property/integration
 * tests (tasks 4.2–4.5).
 *
 * The catalog service lazily constructs its own `PrismaClient` from
 * `DATABASE_URL` at module-import time, so `createTestDatabase` MUST be called
 * (which sets `process.env.DATABASE_URL`) BEFORE the service module is
 * imported. Tests should therefore import `./catalog.service` dynamically
 * inside a `beforeAll` hook that runs after `createTestDatabase`.
 *
 * Each database is a throwaway SQLite file created next to the Prisma schema
 * (so the connector's relative-path resolution matches the generated client)
 * and torn down afterwards, leaving no artifacts behind.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';

/** Backend root (…/backend), two levels up from src/misconduct. */
const BACKEND_ROOT = path.resolve(__dirname, '..', '..');
const PRISMA_CLI = path.join(BACKEND_ROOT, 'node_modules', 'prisma', 'build', 'index.js');
const SCHEMA_PATH = path.join(BACKEND_ROOT, 'prisma', 'schema.prisma');
/** SQLite files live in the prisma/ dir so `file:./x.db` resolves there. */
const PRISMA_DIR = path.join(BACKEND_ROOT, 'prisma');

export interface TestDb {
  /** Value written to DATABASE_URL (relative to the schema dir). */
  url: string;
  /** Absolute path of the SQLite file for cleanup. */
  file: string;
  /** A verification client bound to the disposable database. */
  prisma: PrismaClient;
}

/** Remove a SQLite database file plus its journal/WAL siblings, if present. */
function removeDbFiles(file: string): void {
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    const target = `${file}${suffix}`;
    try {
      if (fs.existsSync(target)) fs.rmSync(target);
    } catch {
      /* best-effort cleanup */
    }
  }
}

/**
 * Create a fresh, schema-migrated, disposable SQLite database and point
 * `process.env.DATABASE_URL` at it. Returns a verification `PrismaClient`.
 *
 * Call this BEFORE importing any service module that instantiates its own
 * PrismaClient from the environment.
 */
export function createTestDatabase(label: string): TestDb {
  // Best-effort sweep of throwaway databases left by earlier runs. On Windows
  // the service's internal PrismaClient keeps the active file locked until the
  // test process exits, so end-of-run deletion can be denied; sweeping here
  // (a fresh process) reclaims those now-unlocked files and prevents buildup.
  sweepStaleTestDatabases();

  const fileName = `test-${label}-${process.pid}-${Date.now()}.db`;
  const file = path.join(PRISMA_DIR, fileName);
  const url = `file:./${fileName}`;

  removeDbFiles(file);

  // Ensure the service's lazily-created client binds to the disposable DB.
  process.env.DATABASE_URL = url;

  // Materialize the schema in the throwaway database (no client regeneration).
  execFileSync(
    process.execPath,
    [
      PRISMA_CLI,
      'db',
      'push',
      '--schema',
      SCHEMA_PATH,
      '--skip-generate',
      '--force-reset',
      '--accept-data-loss',
    ],
    {
      env: { ...process.env, DATABASE_URL: url },
      stdio: 'ignore',
    },
  );

  const prisma = new PrismaClient({ datasources: { db: { url } } });
  return { url, file, prisma };
}

/** Delete any leftover `test-*.db` databases from previous runs (best-effort). */
function sweepStaleTestDatabases(): void {
  let entries: string[];
  try {
    entries = fs.readdirSync(PRISMA_DIR);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (/^test-.*\.db(-journal|-wal|-shm)?$/.test(entry)) {
      try {
        fs.rmSync(path.join(PRISMA_DIR, entry));
      } catch {
        /* still locked by a live process; leave it */
      }
    }
  }
}

/** Disconnect the verification client and delete the disposable database. */
export async function destroyTestDatabase(db: TestDb): Promise<void> {
  await db.prisma.$disconnect();
  removeDbFiles(db.file);
}
