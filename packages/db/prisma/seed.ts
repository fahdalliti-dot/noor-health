import { createPrismaClient } from '../src/index';
import { hashPassword } from '../../shared/utils/password';

// Prisma 7 requires a driver adapter. Uses DATABASE_URL (saas_owner role)
// so the seed can create/wipe tenant tables without RLS interference.
const db = createPrismaClient(process.env.DATABASE_URL as string);

async function main() {
  console.log('Starting seed...');

  // Wipe existing data so the seed is idempotent.
  await db.$transaction([
    db.auditLog.deleteMany(),
    db.appointment.deleteMany(),
    db.doctorTimeOff.deleteMany(),
    db.patientMedicalProfile.deleteMany(),
    db.patient.deleteMany(),
    db.doctorWorkingHours.deleteMany(),
    db.passwordResetToken.deleteMany(),
    db.session.deleteMany(),
    db.recoveryCode.deleteMany(),
    db.invite.deleteMany(),
    db.subscription.deleteMany(),
    db.user.deleteMany(),
    db.clinic.deleteMany(),
  ]);

  // Create two demo clinics for isolation testing
  const clinicA = await db.clinic.create({
    data: {
      name: 'Demo Clinic Al-Andalus',
      city: 'Casablanca',
      address: '123 Avenue Hassan II',
      phone: '+212 522 123456',
      locale: 'fr',
      timezone: 'Africa/Casablanca',
      require_2fa_all: false,
      first_day_of_week: 0,
    },
  });

  const clinicB = await db.clinic.create({
    data: {
      name: 'Demo Clinic Al-Firdaws',
      city: 'Marrakech',
      address: '45 Rue Riad Zitoun',
      phone: '+212 524 987654',
      locale: 'fr',
      timezone: 'Africa/Casablanca',
      require_2fa_all: false,
      first_day_of_week: 0,
    },
  });

  // Solo doctor clinic (is_clinic_admin = true)
  const soloClinic = await db.clinic.create({
    data: {
      name: 'Solo Dr. Benali Clinic',
      city: 'Rabat',
      address: '78 Boulevard Mohamed V',
      phone: '+212 537 555555',
      locale: 'fr',
      timezone: 'Africa/Casablanca',
      require_2fa_all: false,
      first_day_of_week: 0,
    },
  });

  // Hash a common password for seeding
  const passwordHash = await hashPassword('SeedPass123!');

  // Clinic A staff
  const clinicAAAdmin = await db.user.create({
    data: {
      email: 'admin@clinic-a.test',
      password_hash: passwordHash,
      full_name: 'Admin Clinic A',
      role: 'admin',
      clinic_id: clinicA.id,
      is_clinic_admin: true,
      is_active: true,
    },
  });

  const clinicADoctor = await db.user.create({
    data: {
      email: 'doctor@clinic-a.test',
      password_hash: passwordHash,
      full_name: 'Dr. Ahmed Alami',
      role: 'doctor',
      speciality: 'Cardiology',
      license_number: '12345',
      clinic_id: clinicA.id,
      is_clinic_admin: false,
      is_active: true,
    },
  });

  const clinicASecretary = await db.user.create({
    data: {
      email: 'secretary@clinic-a.test',
      password_hash: passwordHash,
      full_name: 'Fatima Zahra',
      role: 'secretary',
      clinic_id: clinicA.id,
      is_clinic_admin: false,
      is_active: true,
    },
  });

  // Clinic B staff
  const clinicBAAdmin = await db.user.create({
    data: {
      email: 'admin@clinic-b.test',
      password_hash: passwordHash,
      full_name: 'Admin Clinic B',
      role: 'admin',
      clinic_id: clinicB.id,
      is_clinic_admin: true,
      is_active: true,
    },
  });

  const clinicBDoctor = await db.user.create({
    data: {
      email: 'doctor@clinic-b.test',
      password_hash: passwordHash,
      full_name: 'Dr. Sara Karim',
      role: 'doctor',
      speciality: 'Pediatrics',
      license_number: '67890',
      clinic_id: clinicB.id,
      is_clinic_admin: false,
      is_active: true,
    },
  });

  const clinicBSecretary = await db.user.create({
    data: {
      email: 'secretary@clinic-b.test',
      password_hash: passwordHash,
      full_name: 'Youssef Tariq',
      role: 'secretary',
      clinic_id: clinicB.id,
      is_clinic_admin: false,
      is_active: true,
    },
  });

  // Solo clinic staff (doctor who is also admin)
  const soloDoctor = await db.user.create({
    data: {
      email: 'doctor@solo.test',
      password_hash: passwordHash,
      full_name: 'Dr. Khalid Benali',
      role: 'doctor',
      speciality: 'General Practice',
      license_number: '55555',
      clinic_id: soloClinic.id,
      is_clinic_admin: true, // Solo doctor acts as admin
      is_active: true,
    },
  });

  // Create a subscription for each clinic
  await db.subscription.createMany({
    data: [
      {
        clinic_id: clinicA.id,
        plan: 'clinic',
        status: 'trialing',
        trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      {
        clinic_id: clinicB.id,
        plan: 'clinic',
        status: 'trialing',
        trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        clinic_id: soloClinic.id,
        plan: 'solo',
        status: 'trialing',
        trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Create some sample sessions for testing
  await db.session.createMany({
    data: [
      {
        user_id: clinicAAAdmin.id,
        clinic_id: clinicA.id,
        family_id: 'fam-' + clinicAAAdmin.id,
        refresh_token_hash: await hashPassword('sample-refresh-token-1'),
        device_label: 'Chrome on Windows',
        ip: '127.0.0.1',
        expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
      },
      {
        user_id: clinicADoctor.id,
        clinic_id: clinicA.id,
        family_id: 'fam-' + clinicADoctor.id,
        refresh_token_hash: await hashPassword('sample-refresh-token-2'),
        device_label: 'Safari on iPad',
        ip: '127.0.0.1',
        expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000),
      },
    ],
  });

  // Create some sample recovery codes for the admin of clinic A
  const recoveryCodes = [];
  for (let i = 0; i < 10; i++) {
    recoveryCodes.push({
      user_id: clinicAAAdmin.id,
      code_hash: await hashPassword(`BACKUP${i.toString().padStart(4, '0')}`),
    });
  }
  await db.recoveryCode.createMany({
    data: recoveryCodes,
  });

  // Create some sample invites
  await db.invite.createMany({
    data: [
      {
        clinic_id: clinicA.id,
        email: 'new.staff@clinic-a.test',
        role: 'doctor',
        token_hash: await hashPassword('sample-invite-token-1'),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        invited_by: clinicAAAdmin.id,
      },
      {
        clinic_id: clinicB.id,
        email: 'new.staff@clinic-b.test',
        role: 'secretary',
        token_hash: await hashPassword('sample-invite-token-2'),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        invited_by: clinicBAAdmin.id,
      },
    ],
  });

  // Create PasswordResetToken entries for seed/demo
  await db.passwordResetToken.createMany({
    data: [
      {
        clinic_id: clinicA.id,
        user_id: clinicADoctor.id,
        token_hash: await hashPassword('sample-reset-token-1'),
        expires_at: new Date(Date.now() + 30 * 60 * 1000), // 30 min
        used_at: null,
      },
      {
        clinic_id: clinicB.id,
        user_id: clinicBDoctor.id,
        token_hash: await hashPassword('sample-reset-token-2'),
        expires_at: new Date(Date.now() + 30 * 60 * 1000),
        used_at: null,
      },
    ],
  });

  // ======================================
  // SLICE 3 - Appointments & Agenda seed data
  // ======================================

  // Working hours for Dr. Ahmed (Clinic A): Mon-Fri 08:00-12:00, 13:30-17:30
  // Minutes from midnight: 08:00=480, 12:00=720, 13:30=810, 17:30=1050
  const workingHoursA = [];
  for (let day = 0; day < 5; day++) { // Mon-Fri (0=Mon)
    // Morning slot
    workingHoursA.push({
      clinic_id: clinicA.id,
      doctor_id: clinicADoctor.id,
      weekday: day,
      start_minutes: 480,  // 08:00
      end_minutes: 720,    // 12:00
      is_active: true,
      slot_length_minutes: 30,
    });
    // Afternoon slot
    workingHoursA.push({
      clinic_id: clinicA.id,
      doctor_id: clinicADoctor.id,
      weekday: day,
      start_minutes: 810,  // 13:30
      end_minutes: 1050,   // 17:30
      is_active: true,
      slot_length_minutes: 30,
    });
  }
  await db.doctorWorkingHours.createMany({ data: workingHoursA });

  // Working hours for Dr. Sara (Clinic B): Tue-Thu 09:00-17:00 (longer slots)
  // 09:00=540, 17:00=1020
  const workingHoursB = [];
  for (let day = 1; day < 4; day++) { // Tue-Thu
    workingHoursB.push({
      clinic_id: clinicB.id,
      doctor_id: clinicBDoctor.id,
      weekday: day,
      start_minutes: 540,
      end_minutes: 1020,
      slot_length_minutes: 60,
      is_active: true,
    });
  }
  await db.doctorWorkingHours.createMany({ data: workingHoursB });

  // Dr. Ahmed takes a half-day off on Monday (10:00-14:00 in clinic timezone)
  // Using a specific date for clarity
  const mondayDate = new Date();
  mondayDate.setDate(mondayDate.getDate() - mondayDate.getDay() + 1); // nearest Monday
  mondayDate.setHours(0, 0, 0, 0);
  const mondayStart = new Date(mondayDate);
  mondayStart.setHours(10, 0, 0, 0);
  const mondayEnd = new Date(mondayDate);
  mondayEnd.setHours(14, 0, 0, 0);

  await db.doctorTimeOff.create({
    data: {
      clinic_id: clinicA.id,
      doctor_id: clinicADoctor.id,
      start_at: mondayStart,
      end_at: mondayEnd,
      reason: 'Conference',
    },
  });

  // ======================================
  // Slice 2 - Patients (one per appointment below)
  // ======================================
  const patientA1 = await db.patient.create({
    data: {
      clinic_id: clinicA.id,
      file_number: 1,
      first_name: 'Youssef',
      last_name: 'Amrani',
      birth_date: new Date('1985-06-12'),
      gender: 'male',
      phone: '+212600000001',
      cin: 'AB123456',
    },
  });

  const patientA2 = await db.patient.create({
    data: {
      clinic_id: clinicA.id,
      file_number: 2,
      first_name: 'Lina',
      last_name: 'Bennis',
      birth_date: new Date('1992-09-23'),
      gender: 'female',
      phone: '+212600000002',
      cin: 'CD789012',
    },
  });

  const patientA3 = await db.patient.create({
    data: {
      clinic_id: clinicA.id,
      file_number: 3,
      first_name: 'Omar',
      last_name: 'Fettah',
      birth_date: new Date('1978-01-05'),
      gender: 'male',
      phone: '+212600000003',
      cin: 'EF345678',
    },
  });

  const patientA4 = await db.patient.create({
    data: {
      clinic_id: clinicA.id,
      file_number: 4,
      first_name: 'Sara',
      last_name: 'Moussaoui',
      birth_date: new Date('2001-11-30'),
      gender: 'female',
      phone: '+212600000004',
      cin: 'GH901234',
    },
  });

  const patientA5 = await db.patient.create({
    data: {
      clinic_id: clinicA.id,
      file_number: 5,
      first_name: 'Tariq',
      last_name: 'Zerouali',
      birth_date: new Date('1965-04-17'),
      gender: 'male',
      phone: '+212600000005',
      cin: 'IJ567890',
    },
  });

  const patientA6 = await db.patient.create({
    data: {
      clinic_id: clinicA.id,
      file_number: 6,
      first_name: 'Nadia',
      last_name: 'Haddou',
      birth_date: new Date('1988-08-02'),
      gender: 'female',
      phone: '+212600000006',
      cin: 'KL123456',
    },
  });

  const patientB1 = await db.patient.create({
    data: {
      clinic_id: clinicB.id,
      file_number: 1,
      first_name: 'Karim',
      last_name: 'Bennis',
      birth_date: new Date('1990-03-14'),
      gender: 'male',
      phone: '+212600000007',
      cin: 'MN789012',
    },
  });

  // Sample appointments for Clinic A (Dr. Ahmed)
  // Base date: today at 09:00 in Morocco timezone
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const baseDate = new Date(today);
  baseDate.setHours(9, 0, 0, 0);

  const appointmentsA: any[] = [];

  // A confirmed appointment at 09:00-09:30 (first slot of the morning)
  appointmentsA.push({
    clinic_id: clinicA.id,
    patient_id: patientA1.id,
    doctor_id: clinicADoctor.id,
    starts_at: new Date(baseDate.getTime()),
    ends_at: new Date(baseDate.getTime() + 30 * 60 * 1000),
    status: 'confirmed',
    reason: 'Annual checkup',
    source: 'staff',
    created_by: clinicADoctor.id,
  });

  // An arrived appointment at 09:30-10:00
  const arrivedStart = new Date(baseDate.getTime() + 30 * 60 * 1000);
  appointmentsA.push({
    clinic_id: clinicA.id,
    patient_id: patientA2.id,
    doctor_id: clinicADoctor.id,
    starts_at: arrivedStart,
    ends_at: new Date(arrivedStart.getTime() + 30 * 60 * 1000),
    status: 'arrived',
    reason: 'Follow-up',
    source: 'staff',
    created_by: clinicASecretary.id,
  });

  // An in_progress appointment at 10:00-10:30 (this is the one being seen)
  const inProgStart = new Date(baseDate.getTime() + 60 * 60 * 1000);
  appointmentsA.push({
    clinic_id: clinicA.id,
    patient_id: patientA3.id,
    doctor_id: clinicADoctor.id,
    starts_at: inProgStart,
    ends_at: new Date(inProgStart.getTime() + 30 * 60 * 1000),
    status: 'in_progress',
    reason: 'Consultation',
    source: 'staff',
    created_by: clinicASecretary.id,
  });

  // A scheduled appointment at 10:30-11:00 (next patient waiting)
  const schedStart = new Date(baseDate.getTime() + 90 * 60 * 1000);
  appointmentsA.push({
    clinic_id: clinicA.id,
    patient_id: patientA4.id,
    doctor_id: clinicADoctor.id,
    starts_at: schedStart,
    ends_at: new Date(schedStart.getTime() + 30 * 60 * 1000),
    status: 'scheduled',
    reason: 'New patient',
    source: 'online',
    created_by: clinicADoctor.id,
  });

  // A completed appointment earlier today (08:30-09:00) — terminal status, doesn't block the 09:00 slot
  const completedStart = new Date(baseDate.getTime() - 30 * 60 * 1000);
  appointmentsA.push({
    clinic_id: clinicA.id,
    patient_id: patientA5.id,
    doctor_id: clinicADoctor.id,
    starts_at: completedStart,
    ends_at: new Date(completedStart.getTime() + 30 * 60 * 1000),
    status: 'completed',
    reason: 'Routine exam',
    source: 'staff',
    created_by: clinicADoctor.id,
  });

  // A cancelled appointment at 11:00-11:30 (terminal, doesn't block)
  const cancelledStart = new Date(baseDate.getTime() + 120 * 60 * 1000);
  appointmentsA.push({
    clinic_id: clinicA.id,
    patient_id: patientA6.id,
    doctor_id: clinicADoctor.id,
    starts_at: cancelledStart,
    ends_at: new Date(cancelledStart.getTime() + 30 * 60 * 1000),
    status: 'cancelled',
    reason: 'Patient called in sick',
    source: 'staff',
    cancelled_at: new Date(),
    cancel_reason: 'Patient called in sick',
    created_by: clinicASecretary.id,
  });

  // A no_show appointment from yesterday (terminal)
  const yesterday = new Date(baseDate.getTime() - 24 * 60 * 60 * 1000);
  appointmentsA.push({
    clinic_id: clinicA.id,
    patient_id: patientA6.id, // same patient as cancelled, different appointment
    doctor_id: clinicADoctor.id,
    starts_at: yesterday,
    ends_at: new Date(yesterday.getTime() + 30 * 60 * 1000),
    status: 'no_show',
    reason: 'Missed appointment',
    source: 'staff',
    created_by: clinicASecretary.id,
  });

  await db.appointment.createMany({ data: appointmentsA });

  // Sample appointment for Clinic B (Dr. Sara), different day for isolation test
  const day2 = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000);
  const day2Start = new Date(day2.getTime() + 9 * 60 * 60 * 1000);
  await db.appointment.create({
    data: {
      clinic_id: clinicB.id,
      patient_id: patientB1.id,
      doctor_id: clinicBDoctor.id,
      starts_at: day2Start,
      ends_at: new Date(day2Start.getTime() + 60 * 60 * 1000), // 60-min slot
      status: 'confirmed',
      reason: 'Routine checkup',
      source: 'online',
      created_by: clinicBDoctor.id,
    },
  });

  // Create audit log entries
  await db.auditLog.createMany({
    data: [
      {
        clinic_id: clinicA.id,
        user_id: clinicAAAdmin.id,
        action: 'login',
        entity_type: 'User',
        entity_id: clinicAAAdmin.id,
        request_id: 'seed-init',
        ip: '127.0.0.1',
        user_agent: 'seed-script',
        metadata: {},
      },
      {
        clinic_id: clinicA.id,
        user_id: clinicADoctor.id,
        action: 'login',
        entity_type: 'User',
        entity_id: clinicADoctor.id,
        request_id: 'seed-init',
        ip: '127.0.0.1',
        user_agent: 'seed-script',
        metadata: {},
      },
      {
        clinic_id: null, // platform action
        user_id: null,
        action: 'invite_created',
        entity_type: 'Clinic',
        entity_id: clinicA.id,
        request_id: 'seed-init',
        ip: '127.0.0.1',
        user_agent: 'seed-script',
        metadata: {},
      },
    ],
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
