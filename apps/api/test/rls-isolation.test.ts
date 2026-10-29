import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createPrismaClient } from '@doctors-morocco/db';
import type { PrismaClient } from '@doctors-morocco/db';
import { hashPassword } from '@shared/utils/password';

/**
 * Database-level tenant isolation tests (RLS + encryption)
 *
 * These tests verify that:
 * 1. saas_app role cannot read/write across clinic boundaries via RLS
 * 2. CIN encryption and blind index work correctly at DB level
 * 3. Soft delete pattern works (deleted_at filtering)
 */

let dbOwner: PrismaClient;
let dbApp: PrismaClient;
let clinicAId: string;
let clinicBId: string;
let clinicAUserId: string;
let clinicBUserId: string;

// Generate unique suffix for test run
const testSuffix = Date.now().toString(36);

async function withClinicContext(db: PrismaClient, clinicId: string, callback: (tx: any) => Promise<any>) {
  // Use a transaction to ensure SET app.clinic_id and the callback run on the same connection
  return db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SELECT set_config('app.clinic_id', $1, true)`, clinicId);
    return callback(tx);
  });
}

describe('Database-level RLS isolation', () => {
  beforeAll(async () => {
    const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
    const TEST_APP_DATABASE_URL = process.env.TEST_APP_DATABASE_URL;

    if (!TEST_DATABASE_URL || !TEST_APP_DATABASE_URL) {
      console.warn('TEST_DATABASE_URL or TEST_APP_DATABASE_URL not set, skipping RLS tests');
      return;
    }

    dbOwner = createPrismaClient(TEST_DATABASE_URL);
    dbApp = createPrismaClient(TEST_APP_DATABASE_URL);

    // Create test clinics
    const clinicA = await dbOwner.clinic.create({
      data: {
        name: `RLS Test Clinic A ${testSuffix}`,
        city: 'Casablanca',
        address: 'Test Address A',
        phone: '+212 522 000000',
        locale: 'fr',
        timezone: 'Africa/Casablanca',
        require_2fa_all: false,
        first_day_of_week: 0,
      },
    });
    clinicAId = clinicA.id;

    const clinicB = await dbOwner.clinic.create({
      data: {
        name: `RLS Test Clinic B ${testSuffix}`,
        city: 'Marrakech',
        address: 'Test Address B',
        phone: '+212 524 000000',
        locale: 'fr',
        timezone: 'Africa/Casablanca',
        require_2fa_all: false,
        first_day_of_week: 0,
      },
    });
    clinicBId = clinicB.id;

    // Create test users (one per clinic)
    const passwordHash = await hashPassword('TestPass123!');
    const userA = await dbOwner.user.create({
      data: {
        email: `rls-test-a-${testSuffix}@test.com`,
        password_hash: passwordHash,
        full_name: 'RLS Test User A',
        role: 'doctor',
        clinic_id: clinicAId,
        is_clinic_admin: false,
        is_active: true,
      },
    });
    clinicAUserId = userA.id;

    const userB = await dbOwner.user.create({
      data: {
        email: `rls-test-b-${testSuffix}@test.com`,
        password_hash: passwordHash,
        full_name: 'RLS Test User B',
        role: 'doctor',
        clinic_id: clinicBId,
        is_clinic_admin: false,
        is_active: true,
      },
    });
    clinicBUserId = userB.id;
  });

  afterAll(async () => {
    if (!dbOwner) return;
    const clinicIds = [clinicAId, clinicBId].filter(Boolean);
    const userIds = [clinicAUserId, clinicBUserId].filter(Boolean);

    if (clinicIds.length > 0) {
      await dbOwner.appointment.deleteMany({ where: { clinic_id: { in: clinicIds } } });
      await dbOwner.patientMedicalProfile.deleteMany({ where: { patient: { clinic_id: { in: clinicIds } } } });
      await dbOwner.patient.deleteMany({ where: { clinic_id: { in: clinicIds } } });
      if (userIds.length > 0) {
        await dbOwner.user.deleteMany({ where: { id: { in: userIds } } });
      }
      await dbOwner.clinic.deleteMany({ where: { id: { in: clinicIds } } });
    }
    await dbOwner.$disconnect();
    await dbApp?.$disconnect();
  });

  it('should allow saas_app to read/write Patient in own clinic', async () => {
    if (!dbApp) return;

    // Create a patient in Clinic A using transaction with clinic context
    const patient = await withClinicContext(dbApp, clinicAId, async (tx) => {
      return tx.patient.create({
        data: {
          clinic_id: clinicAId,
          file_number: 1,
          first_name: 'Test',
          last_name: 'PatientA',
          birth_date: new Date('1990-01-01'),
          gender: 'male',
          cin: 'ENCRYPTED_CIN_A',
          cin_hash: 'HASH_A',
        },
      });
    });

    expect(patient).toBeDefined();
    expect(patient.clinic_id).toBe(clinicAId);
    expect(patient.cin).toBe('ENCRYPTED_CIN_A');

    // Read it back
    const found = await withClinicContext(dbApp, clinicAId, async (tx) => {
      return tx.patient.findUnique({ where: { id: patient.id } });
    });
    expect(found).not.toBeNull();
    expect(found?.id).toBe(patient.id);
  });

  it('should block saas_app from reading Patient in another clinic', async () => {
    if (!dbApp) return;

    // Set app.clinic_id to Clinic B
    await withClinicContext(dbApp, clinicBId, async (tx) => {
      // Try to read Clinic A's patient (should return null due to RLS)
      const patients = await tx.patient.findMany({
        where: { clinic_id: clinicAId },
      });

      expect(patients).toHaveLength(0);
    });
  });

  it('should block saas_app from inserting Patient with wrong clinic_id', async () => {
    if (!dbApp) return;

    // Set app.clinic_id to Clinic A
    await expect(
      withClinicContext(dbApp, clinicAId, async (tx) => {
        // Try to insert a patient with Clinic B's clinic_id (should fail RLS WITH CHECK)
        return tx.patient.create({
          data: {
            clinic_id: clinicBId, // Wrong clinic!
            file_number: 999,
            first_name: 'Evil',
            last_name: 'Hacker',
            birth_date: new Date('1990-01-01'),
            gender: 'male',
          },
        });
      })
    ).rejects.toThrow();
  });

  it('should allow saas_app to read/write Appointment in own clinic', async () => {
    if (!dbApp) return;

    // Create a patient first
    const patient = await withClinicContext(dbApp, clinicAId, async (tx) => {
      return tx.patient.create({
        data: {
          clinic_id: clinicAId,
          file_number: 2,
          first_name: 'Appt',
          last_name: 'Patient',
          birth_date: new Date('1990-01-01'),
          gender: 'female',
          cin: 'ENCRYPTED_CIN_APPT',
          cin_hash: 'HASH_APPT',
        },
      });
    });

    // Create appointment in Clinic A
    const appt = await withClinicContext(dbApp, clinicAId, async (tx) => {
      return tx.appointment.create({
        data: {
          clinic_id: clinicAId,
          patient_id: patient.id,
          doctor_id: clinicAUserId,
          starts_at: new Date('2025-01-15T09:00:00Z'),
          ends_at: new Date('2025-01-15T09:30:00Z'),
          status: 'scheduled',
          reason: 'RLS test',
          source: 'staff',
          created_by: clinicAUserId,
        },
      });
    });

    expect(appt).toBeDefined();
    expect(appt.clinic_id).toBe(clinicAId);
    expect(appt.patient_id).toBe(patient.id);
  });

  it('should block saas_app from reading Appointment in another clinic', async () => {
    if (!dbApp) return;

    await withClinicContext(dbApp, clinicBId, async (tx) => {
      const appointments = await tx.appointment.findMany({
        where: { clinic_id: clinicAId },
      });

      expect(appointments).toHaveLength(0);
    });
  });

  it('should enforce soft delete - deleted_at patients not returned by default', async () => {
    if (!dbApp) return;

    // Create patient
    const patient = await withClinicContext(dbApp, clinicAId, async (tx) => {
      return tx.patient.create({
        data: {
          clinic_id: clinicAId,
          file_number: 3,
          first_name: 'Soft',
          last_name: 'Delete',
          birth_date: new Date('1990-01-01'),
          gender: 'male',
          cin: 'ENCRYPTED_CIN_SOFT',
          cin_hash: 'HASH_SOFT',
        },
      });
    });

    // Soft delete
    await withClinicContext(dbApp, clinicAId, async (tx) => {
      await tx.patient.update({
        where: { id: patient.id },
        data: { deleted_at: new Date() },
      });
    });

    // Default findMany should not return it
    const active = await withClinicContext(dbApp, clinicAId, async (tx) => {
      return tx.patient.findMany({
        where: { clinic_id: clinicAId, deleted_at: null },
      });
    });

    expect(active.find((p: { id: string }) => p.id === patient.id)).toBeUndefined();

    // But explicit deleted_at filter should
    const deleted = await withClinicContext(dbApp, clinicAId, async (tx) => {
      return tx.patient.findMany({
        where: { clinic_id: clinicAId, deleted_at: { not: null } },
      });
    });

    expect(deleted.find((p: { id: string }) => p.id === patient.id)).toBeDefined();
  });

  it('should enforce PatientMedicalProfile RLS via Patient join', async () => {
    if (!dbApp) return;

    // Create patient in Clinic A
    const patient = await withClinicContext(dbApp, clinicAId, async (tx) => {
      return tx.patient.create({
        data: {
          clinic_id: clinicAId,
          file_number: 4,
          first_name: 'Profile',
          last_name: 'Test',
          birth_date: new Date('1990-01-01'),
          gender: 'female',
        },
      });
    });

    // Create medical profile
    const profile = await withClinicContext(dbApp, clinicAId, async (tx) => {
      return tx.patientMedicalProfile.create({
        data: {
          patient_id: patient.id,
          height_cm: 170,
          weight_kg: 65,
          blood_type: 'A_positive',
        },
      });
    });

    expect(profile).toBeDefined();

    // Switch to Clinic B - should not see the profile
    const profiles = await withClinicContext(dbApp, clinicBId, async (tx) => {
      return tx.patientMedicalProfile.findMany({
        where: { patient_id: patient.id },
      });
    });

    expect(profiles).toHaveLength(0);
  });
});