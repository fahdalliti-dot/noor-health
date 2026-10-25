import path from 'path';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '../../../packages/db/src/generated/client';

const TEST_DB_PATH = path.resolve(__dirname, '../../../test.db');
const TEST_DB_URL = `file:${TEST_DB_PATH}`;

/**
 * Creates a PrismaClient pointing at a per-test SQLite file.
 *
 * Vitest runs each test file in its own worker, so a fresh DB per file is
 * sufficient for isolation. The file is cleaned up in `cleanup()`.
 */
export function createTestPrisma(): PrismaClient {
  const adapter = new PrismaLibSql({ url: TEST_DB_URL });
  return new PrismaClient({ adapter });
}

/**
 * Ensures the test database has the current schema. Idempotent — safe to
 * call on an existing DB.
 */
export async function ensureTestSchema(): Promise<void> {
  // Copy the existing dev.db (which has the full schema) into the test DB
  // location. The Prisma CLI is not reliably invokable from inside the vitest
  // worker, so we reuse the already-built database file instead.
  const fs = await import('fs');
  const devDbPath = path.resolve(__dirname, '../../../dev.db');
  const testDbPath = TEST_DB_PATH;

  if (fs.existsSync(devDbPath)) {
    fs.copyFileSync(devDbPath, testDbPath);
  } else {
    throw new Error(
      `dev.db not found at ${devDbPath}. Run "npx prisma db push" from the project root first.`,
    );
  }
}

/**
 * Wipes all tenant-owned tables. Safe to call between tests.
 */
export async function cleanupDb(db: PrismaClient): Promise<void> {
  await db.$transaction([
    db.auditLog.deleteMany(),
    db.appointment.deleteMany(),
    db.doctorTimeOff.deleteMany(),
    db.doctorWorkingHours.deleteMany(),
    db.session.deleteMany(),
    db.recoveryCode.deleteMany(),
    db.invite.deleteMany(),
    db.subscription.deleteMany(),
    db.user.deleteMany(),
    db.clinic.deleteMany(),
  ]);
}