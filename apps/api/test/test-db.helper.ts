import { PrismaClient } from '@doctors-morocco/db';

/**
 * Creates a PrismaClient pointing at the test PostgreSQL database.
 * Uses TEST_DATABASE_URL (owner role) for test schema operations.
 */
export function createTestPrisma(): PrismaClient {
  return new PrismaClient({
    log: ['error'],
  } as any);
}

/**
 * Ensures the test database has the current schema.
 * In PostgreSQL mode, this is handled by prisma migrate deploy.
 */
export async function ensureTestSchema(): Promise<void> {
  // Migrations are run via: pnpm prisma migrate deploy
  // This function is a no-op — migrations must be applied before tests
}

/**
 * Wipes all tenant-owned tables in the correct dependency order.
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