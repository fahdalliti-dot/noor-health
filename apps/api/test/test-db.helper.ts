import { createPrismaClient } from '@doctors-morocco/db';
import type { PrismaClient } from '@doctors-morocco/db';

/**
 * Creates a PrismaClient pointing at the test PostgreSQL database.
 * Uses TEST_DATABASE_URL (owner role) for test schema operations.
 */
export function createTestPrisma(): PrismaClient {
  return createPrismaClient(process.env.TEST_DATABASE_URL as string);
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
    db.patientMedicalProfile.deleteMany(),
    db.appointment.deleteMany(),
    db.patient.deleteMany(),
    db.auditLog.deleteMany(),
    db.doctorTimeOff.deleteMany(),
    db.passwordResetToken.deleteMany(),
    db.doctorWorkingHours.deleteMany(),
    db.session.deleteMany(),
    db.recoveryCode.deleteMany(),
    db.invite.deleteMany(),
    db.subscription.deleteMany(),
    db.user.deleteMany(),
    db.clinic.deleteMany(),
  ]);
}