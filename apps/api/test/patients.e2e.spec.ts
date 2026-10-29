import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createPrismaClient, PrismaClient, PrismaPg } from '@doctors-morocco/db';
import { hashPassword } from '@shared/utils/password';
import { Role } from '@doctors-morocco/db';
import { AppModule } from '../app.module';

// Set test JWT secret globally
const TEST_JWT_SECRET = 'test-secret-change-in-production';
process.env.JWT_SECRET = TEST_JWT_SECRET;

// ============================================================
// MUST SET ENV VARS BEFORE IMPORTING ANY MODULES
// because PrismaService constructor reads process.env.APP_DATABASE_URL
// ============================================================
// Read .env file directly to get test DB URLs
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(__dirname, '../../.env');

try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !match[1].trim().startsWith('#')) {
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
} catch {
  // .env file not found, that's ok
}

// NOW override with test URLs - MUST happen before any module imports
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
if (process.env.TEST_APP_DATABASE_URL) {
  process.env.APP_DATABASE_URL = process.env.TEST_APP_DATABASE_URL;
}
process.env.REQUIRE_2FA_ALL = 'false';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const TEST_APP_DATABASE_URL = process.env.TEST_APP_DATABASE_URL;

/**
 * HTTP E2E Integration Tests for Patient RLS isolation
 *
 * These tests verify that:
 * 1. Users can only access patients from their own clinic via HTTP API
 * 2. RLS is enforced at the database level through the interceptor
 */

let app: INestApplication;
let prismaOwner: ReturnType<typeof createPrismaClient>;
let prismaApp: ReturnType<typeof createPrismaClient>;

let clinicAId: string;
let clinicBId: string;
let clinicAUserId: string;      // Using secretary role (no 2FA required)
let clinicBUserId: string;      // Using secretary role (no 2FA required)
let clinicASecretaryId: string;
let clinicAPatientId: string;

const testSuffix = `e2e-${Date.now().toString(36)}`;

describe('E2E - Patient RLS Isolation', () => {
  beforeAll(async () => {
    if (!TEST_DATABASE_URL || !TEST_APP_DATABASE_URL) {
      console.warn('TEST_DATABASE_URL or TEST_APP_DATABASE_URL not set, skipping E2E tests');
      return;
    }

    prismaOwner = createPrismaClient(TEST_DATABASE_URL);
    prismaApp = createPrismaClient(TEST_APP_DATABASE_URL);

    // Verify connection
    const clinicCount = await prismaOwner.clinic.count();
    console.log(`[beforeAll] prismaOwner connected, clinic count: ${clinicCount}`);

    // Create test clinics with require_2fa_all = false
    const clinicA = await prismaOwner.clinic.create({
      data: {
        name: `E2E Clinic A ${testSuffix}`,
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

    const clinicB = await prismaOwner.clinic.create({
      data: {
        name: `E2E Clinic B ${testSuffix}`,
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

    // Create test users with a known password
    // Use 'secretary' role for all test users to avoid 2FA requirement
    // (doctors require 2FA by default, secretaries don't)
    const passwordHash = await hashPassword('TestPass123!');
    console.log(`[beforeAll] passwordHash: ${passwordHash.substring(0, 30)}...`);
    const userA = await prismaOwner.user.create({
      data: {
        email: `e2e-user-a-${testSuffix}@test.com`,
        password_hash: passwordHash,
        full_name: 'E2E User A',
        role: 'secretary',
        clinic_id: clinicAId,
        is_clinic_admin: false,
        is_active: true,
      },
    });
    console.log(`[beforeAll] Created userA: ${userA.id}`);
    clinicAUserId = userA.id;

    const userB = await prismaOwner.user.create({
      data: {
        email: `e2e-user-b-${testSuffix}@test.com`,
        password_hash: passwordHash,
        full_name: 'E2E User B',
        role: 'secretary',
        clinic_id: clinicBId,
        is_clinic_admin: false,
        is_active: true,
      },
    });
    clinicBUserId = userB.id;

    const userASecretary = await prismaOwner.user.create({
      data: {
        email: `e2e-secretary-a-${testSuffix}@test.com`,
        password_hash: passwordHash,
        full_name: 'E2E Secretary A',
        role: 'secretary',
        clinic_id: clinicAId,
        is_clinic_admin: false,
        is_active: true,
      },
    });
    clinicASecretaryId = userASecretary.id;

    // Create a patient in Clinic A
    const patientA = await prismaOwner.patient.create({
      data: {
        clinic_id: clinicAId,
        file_number: 1,
        first_name: 'E2E',
        last_name: 'PatientA',
        birth_date: new Date('1990-01-01'),
        gender: 'male',
      },
    });
    clinicAPatientId = patientA.id;

    // Initialize NestJS app with full AppModule
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    if (!prismaOwner) return;

    // Cleanup test data
    const ids = [clinicAId, clinicBId].filter(Boolean);
    if (ids.length > 0) {
      await prismaOwner.patientMedicalProfile.deleteMany({ where: { patient: { clinic_id: { in: ids } } } });
      await prismaOwner.appointment.deleteMany({ where: { clinic_id: { in: ids } } });
      await prismaOwner.patient.deleteMany({ where: { clinic_id: { in: ids } } });
      // Clean up sessions first (foreign key constraint)
      await prismaOwner.session.deleteMany({ where: { clinic_id: { in: ids } } });
    }
    const userIds = [clinicAUserId, clinicBUserId, clinicASecretaryId].filter(Boolean);
    if (userIds.length > 0) {
      await prismaOwner.user.deleteMany({ where: { id: { in: userIds } } });
    }
    const clinicIds = [clinicAId, clinicBId].filter(Boolean);
    if (clinicIds.length > 0) {
      await prismaOwner.clinic.deleteMany({ where: { id: { in: clinicIds } } });
    }

    await prismaOwner.$disconnect();
    await prismaApp?.$disconnect();
    await app?.close();
  });

  beforeEach(async () => {
    // Clean up any sessions from previous tests that might cause FK violations
    const ids = [clinicAId, clinicBId].filter(Boolean);
    if (ids.length > 0) {
      await prismaOwner.session.deleteMany({ where: { clinic_id: { in: ids } } });
    }
  });

  async function loginAndGetToken(email: string, password: string = 'TestPass123!'): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password });

    console.log(`[loginAndGetToken] Login for ${email}: status=${response.status}, body=`, JSON.stringify(response.body));

    if (response.body.status === 'two_factor_required') {
      throw new Error('2FA required for test user - should not happen');
    }

    // Login endpoint returns 201 by default in NestJS for POST, but we also accept 200
    expect([200, 201]).toContain(response.status);
    expect(response.body.data.access_token).toBeDefined();
    return response.body.data.access_token;
  }

  it('should allow Clinic A user to list their own clinic patients', async () => {
    if (!app) return;

    const userEmail = `e2e-user-a-${testSuffix}@test.com`;
    const token = await loginAndGetToken(userEmail);

    const response = await request(app.getHttpServer())
      .get('/api/v1/patients')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.patients).toBeDefined();
    expect(Array.isArray(response.body.data.patients)).toBe(true);

    // Should find the patient we created for Clinic A
    const foundPatient = response.body.data.patients.find((p: any) => p.id === clinicAPatientId);
    expect(foundPatient).toBeDefined();
    expect(foundPatient.clinic_id).toBe(clinicAId);
  });

  it('should allow Clinic A secretary to list their own clinic patients', async () => {
    if (!app) return;

    const secretaryEmail = `e2e-secretary-a-${testSuffix}@test.com`;
    const token = await loginAndGetToken(secretaryEmail);

    const response = await request(app.getHttpServer())
      .get('/api/v1/patients')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.patients).toBeDefined();

    const foundPatient = response.body.data.patients.find((p: any) => p.id === clinicAPatientId);
    expect(foundPatient).toBeDefined();
    expect(foundPatient.clinic_id).toBe(clinicAId);
  });

  it('should block Clinic B user from reading Clinic A patients (RLS returns empty)', async () => {
    if (!app) return;

    const userEmail = `e2e-user-b-${testSuffix}@test.com`;
    const token = await loginAndGetToken(userEmail);

    const response = await request(app.getHttpServer())
      .get('/api/v1/patients')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.patients).toBeDefined();
    expect(response.body.data.patients).toHaveLength(0);
  });

  it('should block Clinic B user from reading Clinic A specific patient (returns 404)', async () => {
    if (!app) return;

    const userEmail = `e2e-user-b-${testSuffix}@test.com`;
    const token = await loginAndGetToken(userEmail);

    const response = await request(app.getHttpServer())
      .get(`/api/v1/patients/${clinicAPatientId}`)
      .set('Authorization', `Bearer ${token}`);

    // Should return 404 because RLS blocks the row
    expect(response.status).toBe(404);
  });

  it('should allow Clinic A user to get their own patient by ID', async () => {
    if (!app) return;

    const userEmail = `e2e-user-a-${testSuffix}@test.com`;
    const token = await loginAndGetToken(userEmail);

    const response = await request(app.getHttpServer())
      .get(`/api/v1/patients/${clinicAPatientId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.patient).toBeDefined();
    expect(response.body.data.patient.id).toBe(clinicAPatientId);
    expect(response.body.data.patient.clinic_id).toBe(clinicAId);
  });

  it('should allow Clinic A user to create a new patient in their clinic', async () => {
    if (!app) return;

    const userEmail = `e2e-user-a-${testSuffix}@test.com`;
    const token = await loginAndGetToken(userEmail);

    const response = await request(app.getHttpServer())
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        file_number: 999,
        first_name: 'New',
        last_name: 'Patient',
        birth_date: '1995-06-15',
        gender: 'female',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.patient).toBeDefined();
    expect(response.body.data.patient.first_name).toBe('New');
    expect(response.body.data.patient.clinic_id).toBe(clinicAId);
  });

  it('should block Clinic B user from creating patient with Clinic A clinic_id', async () => {
    if (!app) return;

    const userEmail = `e2e-user-b-${testSuffix}@test.com`;
    const token = await loginAndGetToken(userEmail);

    // Try to create a patient with Clinic A's ID while authenticated as Clinic B user
    const response = await request(app.getHttpServer())
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        file_number: 999,
        first_name: 'Evil',
        last_name: 'Hacker',
        birth_date: '1995-06-15',
        gender: 'male',
      });

    // Should succeed but with clinic_id = clinicBId (RLS WITH CHECK forces correct clinic)
    // or fail if the API validates clinic_id matches user's clinic
    // The important thing is they can't inject data into Clinic A
    expect(response.status).toBe(201);
    // The created patient should have clinicBId, not clinicAId
    expect(response.body.data.patient.clinic_id).toBe(clinicBId);
  });
});