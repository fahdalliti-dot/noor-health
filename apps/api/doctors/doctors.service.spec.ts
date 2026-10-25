import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { AuditLogRepository } from '@/audit/audit-log.repository';
import { DoctorsService } from '@/doctors/doctors.service';
import { createTestPrisma, cleanupDb, ensureTestSchema } from '@/test/test-db.helper';

let db: ReturnType<typeof createTestPrisma>;
let auditLog: AuditLogRepository;
let service: DoctorsService;

beforeAll(async () => {
  await ensureTestSchema();
});

beforeEach(async () => {
  db = createTestPrisma();
  await db.$connect();
  auditLog = new AuditLogRepository(db as any);
  service = new DoctorsService(db as any, auditLog as any);
  await cleanupDb(db);
});

afterEach(async () => {
  await db.$disconnect();
});

describe('DoctorsService — Availability', () => {
  let clinicId: string;
  let doctorId: string;

  beforeEach(async () => {
    const clinic = await db.clinic.create({
      data: { name: 'Test Clinic', city: 'Casablanca', address: '1', phone: '1', locale: 'fr', timezone: 'Africa/Casablanca' },
    });
    clinicId = clinic.id;

    const doctor = await db.user.create({
      data: {
        clinic_id: clinicId,
        email: 'doctor@test.com',
        password_hash: 'x',
        full_name: 'Test Doctor',
        role: 'doctor',
      },
    });
    doctorId = doctor.id;
  });

  it('returns empty slots when no working hours are configured', async () => {
    const result = await service.getAvailability(doctorId, { date: '2025-01-15', slot_length: 30 }, clinicId);
    expect(result.slots).toEqual([]);
    expect(result.timezone).toBe('Africa/Casablanca');
  });

  it('returns free slots within working hours', async () => {
    // 2025-01-15 is a Wednesday (weekday=2)
    await db.doctorWorkingHours.create({
      data: { clinic_id: clinicId, doctor_id: doctorId, weekday: 2, start_minutes: 480, end_minutes: 720, is_active: true },
    });

    const result = await service.getAvailability(doctorId, { date: '2025-01-15', slot_length: 30 }, clinicId);
    expect(result.slots.length).toBeGreaterThan(0);
    expect(result.slots[0].available).toBe(true);
  });

  it('subtracts time off from free slots', async () => {
    await db.doctorWorkingHours.create({
      data: { clinic_id: clinicId, doctor_id: doctorId, weekday: 2, start_minutes: 480, end_minutes: 720, is_active: true },
    });

    // Time off 11:00-12:00 clinic tz = 10:00-11:00 UTC (dayStart is midnight UTC,
    // clinic midnight is 23:00 UTC the previous day, so 11:00 clinic = 10:00 UTC).
    const dayStart = new Date('2025-01-15T00:00:00.000Z');
    await db.doctorTimeOff.create({
      data: {
        clinic_id: clinicId,
        doctor_id: doctorId,
        start_at: new Date(dayStart.getTime() + 10 * 60 * 60 * 1000),
        end_at: new Date(dayStart.getTime() + 11 * 60 * 60 * 1000),
        reason: 'Meeting',
      },
    });

    const result = await service.getAvailability(doctorId, { date: '2025-01-15', slot_length: 30 }, clinicId);
    // 08:00-12:00 (8 slots) minus 11:00-12:00 (2 slots) = 6 slots
    expect(result.slots.length).toBe(6);
    const starts = result.slots.map((slot: { start: string }) => slot.start);
    expect(starts.some((start: string) => start.includes('T11:00:00'))).toBe(false);
    expect(starts.some((start: string) => start.includes('T10:30:00'))).toBe(true);
  });

  it('subtracts existing active appointments from free slots', async () => {
    await db.doctorWorkingHours.create({
      data: { clinic_id: clinicId, doctor_id: doctorId, weekday: 2, start_minutes: 480, end_minutes: 720, is_active: true },
    });

    const dayStart = new Date('2025-01-15T00:00:00.000Z');
    // Appointment 10:00-10:30 clinic tz = 09:00-09:30 UTC
    await db.appointment.create({
      data: {
        clinic_id: clinicId,
        doctor_id: doctorId,
        starts_at: new Date(dayStart.getTime() + 9 * 60 * 60 * 1000),
        ends_at: new Date(dayStart.getTime() + 9.5 * 60 * 60 * 1000),
        status: 'confirmed',
        reason: 'Existing',
        source: 'staff',
        created_by: doctorId,
      },
    });

    const result = await service.getAvailability(doctorId, { date: '2025-01-15', slot_length: 30 }, clinicId);
    // 08:00-12:00 (8 slots) minus 10:00-10:30 (1 slot) = 7 slots
    expect(result.slots.length).toBe(7);
    expect(result.slots.some((slot: { start: string }) => slot.start.includes('T10:00:00'))).toBe(false);
  });

  it('respects slot length parameter', async () => {
    await db.doctorWorkingHours.create({
      data: { clinic_id: clinicId, doctor_id: doctorId, weekday: 2, start_minutes: 480, end_minutes: 540, is_active: true },
    });

    const result = await service.getAvailability(doctorId, { date: '2025-01-15', slot_length: 15 }, clinicId);
    // 08:00-09:00 = 4 slots of 15 min
    expect(result.slots.length).toBe(4);
  });

  it('throws when doctor does not belong to clinic', async () => {
    const otherClinic = await db.clinic.create({
      data: { name: 'Other', city: 'X', address: '1', phone: '1', locale: 'fr', timezone: 'Africa/Casablanca' },
    });
    await expect(
      service.getAvailability(doctorId, { date: '2025-01-15', slot_length: 30 }, otherClinic.id),
    ).rejects.toThrow();
  });
});