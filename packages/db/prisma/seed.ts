import { createPrismaClient } from '../src/index';
import { hashPassword } from '../../shared/utils/password';
import * as crypto from 'crypto';

// Read database URL from env
const dbUrl = process.env.DATABASE_URL || 'postgresql://saas_owner:saas_pass@localhost:5432/saas_dev?schema=public';
const db = createPrismaClient(dbUrl);

// Encryption helpers for Moroccan CIN AES-256-GCM and HMAC-SHA256 blind index
const KEY_HEX = process.env.PATIENT_ENCRYPTION_KEY || '920bd7f5c0e2dd2302f20e135f0b705977414a603ebe5fbef26071f393ce229f';
const PEPPER_HEX = process.env.BLIND_INDEX_PEPPER || 'a7b3c4d5e6f7890123456789abcdef0123456789abcdef0123456789abcdef01';

const encKey = Buffer.from(KEY_HEX, 'hex');
const pepper = Buffer.from(PEPPER_HEX, 'hex');

function encryptCin(cin: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encKey, iv, { authTagLength: 16 });
  const ciphertext = Buffer.concat([cipher.update(cin, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${ciphertext.toString('hex')}`;
}

function hashBlindIndex(cin: string): string {
  const hmac = crypto.createHmac('sha256', pepper);
  hmac.update(cin.trim().toUpperCase());
  return hmac.digest('hex');
}

async function main() {
  console.log('--- Seeding Database with Moroccan Clinical Practice Data ---');

  // Clean existing tables in dependency order
  console.log('Cleaning existing records...');
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

  // Common password hash for test accounts
  const passwordHash = await hashPassword('SeedPass123!');

  // =========================================================================
  // CLINIC 1: Cabinet de Cardiologie Dr. Amine Benali (Casablanca)
  // =========================================================================
  console.log('Creating Clinic 1: Casablanca (Dr. Amine Benali)...');
  const clinicCasablanca = await db.clinic.create({
    data: {
      name: 'Cabinet de Cardiologie Dr. Amine Benali',
      city: 'Casablanca',
      address: '45 Boulevard Zerktouni, 3ème étage, Casablanca',
      phone: '+212 522 334455',
      locale: 'fr',
      timezone: 'Africa/Casablanca',
      require_2fa_all: false,
      first_day_of_week: 0,
      subscription: {
        create: {
          plan: 'clinic',
          status: 'active',
          trial_ends_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const doctorBenali = await db.user.create({
    data: {
      clinic_id: clinicCasablanca.id,
      email: 'doctor@clinic-a.test',
      password_hash: passwordHash,
      full_name: 'Dr. Amine Benali',
      role: 'doctor',
      speciality: 'Cardiologie & Maladies Vasculaires',
      license_number: '104829384',
      is_clinic_admin: true,
      is_active: true,
    },
  });

  const secretaryMeryem = await db.user.create({
    data: {
      clinic_id: clinicCasablanca.id,
      email: 'secretary@clinic-a.test',
      password_hash: passwordHash,
      full_name: 'Meryem El Idrissi',
      role: 'secretary',
      is_clinic_admin: false,
      is_active: true,
    },
  });

  // Working hours for Dr. Benali (Mon-Fri 08:30–12:30, 14:00–18:30)
  // Minutes: 08:30=510, 12:30=750, 14:00=840, 18:30=1110
  const workingHoursCasablanca = [];
  for (let day = 0; day < 5; day++) {
    workingHoursCasablanca.push({
      clinic_id: clinicCasablanca.id,
      doctor_id: doctorBenali.id,
      weekday: day,
      start_minutes: 510,
      end_minutes: 750,
      slot_length_minutes: 30,
      is_active: true,
    });
    workingHoursCasablanca.push({
      clinic_id: clinicCasablanca.id,
      doctor_id: doctorBenali.id,
      weekday: day,
      start_minutes: 840,
      end_minutes: 1110,
      slot_length_minutes: 30,
      is_active: true,
    });
  }
  await db.doctorWorkingHours.createMany({ data: workingHoursCasablanca });

  // =========================================================================
  // CLINIC 2: Cabinet Pédiatrique Al-Andalus (Rabat)
  // =========================================================================
  console.log('Creating Clinic 2: Rabat (Dr. Sara Karim)...');
  const clinicRabat = await db.clinic.create({
    data: {
      name: 'Cabinet Pédiatrique Al-Andalus',
      city: 'Rabat',
      address: '78 Avenue Mohamed V, Agdal, Rabat',
      phone: '+212 537 778899',
      locale: 'fr',
      timezone: 'Africa/Casablanca',
      require_2fa_all: false,
      first_day_of_week: 0,
      subscription: {
        create: {
          plan: 'clinic',
          status: 'active',
          trial_ends_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const doctorSara = await db.user.create({
    data: {
      clinic_id: clinicRabat.id,
      email: 'doctor@clinic-b.test',
      password_hash: passwordHash,
      full_name: 'Dr. Sara Karim',
      role: 'doctor',
      speciality: 'Pédiatrie & Néonatalogie',
      license_number: '109283741',
      is_clinic_admin: true,
      is_active: true,
    },
  });

  // =========================================================================
  // CLINIC 3: Cabinet Médical Solo Dr. Yassine El Fassi (Marrakech)
  // =========================================================================
  console.log('Creating Clinic 3: Marrakech (Dr. Yassine El Fassi)...');
  const clinicMarrakech = await db.clinic.create({
    data: {
      name: 'Cabinet Médical Solo Guéliz',
      city: 'Marrakech',
      address: '12 Avenue Hassan II, Guéliz, Marrakech',
      phone: '+212 524 445566',
      locale: 'fr',
      timezone: 'Africa/Casablanca',
      require_2fa_all: false,
      first_day_of_week: 0,
      subscription: {
        create: {
          plan: 'solo',
          status: 'trialing',
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const doctorFassi = await db.user.create({
    data: {
      clinic_id: clinicMarrakech.id,
      email: 'doctor@solo.test',
      password_hash: passwordHash,
      full_name: 'Dr. Yassine El Fassi',
      role: 'doctor',
      speciality: 'Médecine Générale',
      license_number: '105928172',
      is_clinic_admin: true,
      is_active: true,
    },
  });

  // =========================================================================
  // PATIENTS WITH ENCRYPTED CINS & MEDICAL PROFILES (Casablanca)
  // =========================================================================
  console.log('Creating Moroccan Patients & Medical Records...');

  // Patient 1: Fatima Zahra Alami (Allergie Pénicilline)
  const pAlami = await db.patient.create({
    data: {
      clinic_id: clinicCasablanca.id,
      file_number: 1089,
      first_name: 'Fatima Zahra',
      last_name: 'Alami',
      birth_date: new Date('1984-07-22'),
      gender: 'female',
      phone: '+212 663-987654',
      email: 'fz.alami@gmail.com',
      address: '22 Rue d\'Agadir, Casablanca',
      cin: encryptCin('BK654321'),
      cin_hash: hashBlindIndex('BK654321'),
      medical_profile: {
        create: {
          height_cm: 165,
          weight_kg: 68.5,
          blood_type: 'A_positive',
          allergies: ['Pénicilline', 'Bêta-lactamines'],
          chronic_conditions: ['Hypertension artérielle', 'Insuffisance veineuse'],
        },
      },
    },
  });

  // Patient 2: Yassine Mansouri (Contrôle sain)
  const pMansouri = await db.patient.create({
    data: {
      clinic_id: clinicCasablanca.id,
      file_number: 1042,
      first_name: 'Yassine',
      last_name: 'Mansouri',
      birth_date: new Date('1992-03-15'),
      gender: 'male',
      phone: '+212 661-234567',
      email: 'yassine.mansouri@outlook.com',
      address: '14 Boulevard Ghandi, Casablanca',
      cin: encryptCin('BE892142'),
      cin_hash: hashBlindIndex('BE892142'),
      medical_profile: {
        create: {
          height_cm: 178,
          weight_kg: 74.0,
          blood_type: 'O_positive',
          allergies: [],
          chronic_conditions: ['Hypercholestérolémie légère'],
        },
      },
    },
  });

  // Patient 3: Omar Bennani (Bilan tensionnel)
  const pBennani = await db.patient.create({
    data: {
      clinic_id: clinicCasablanca.id,
      file_number: 1091,
      first_name: 'Omar',
      last_name: 'Bennani',
      birth_date: new Date('1976-11-04'),
      gender: 'male',
      phone: '+212 664-554433',
      address: '50 Rue Sebou, Maarif, Casablanca',
      cin: encryptCin('C489102'),
      cin_hash: hashBlindIndex('C489102'),
      medical_profile: {
        create: {
          height_cm: 172,
          weight_kg: 82.0,
          blood_type: 'A_positive',
          allergies: [],
          chronic_conditions: ['Dyspnée d\'effort', 'Arythmie sinusale'],
        },
      },
    },
  });

  // Patient 4: Khadija Tazi (Allergie Aspirine)
  const pTazi = await db.patient.create({
    data: {
      clinic_id: clinicCasablanca.id,
      file_number: 1077,
      first_name: 'Khadija',
      last_name: 'Tazi',
      birth_date: new Date('1968-09-19'),
      gender: 'female',
      phone: '+212 662-112233',
      address: '8 Boulevard Abdelmoumen, Casablanca',
      cin: encryptCin('A982145'),
      cin_hash: hashBlindIndex('A982145'),
      medical_profile: {
        create: {
          height_cm: 160,
          weight_kg: 64.0,
          blood_type: 'B_positive',
          allergies: ['Aspirine', 'AINS'],
          chronic_conditions: ['Palpitations', 'Asthme modéré'],
        },
      },
    },
  });

  // Patient 5: Mehdi Chraibi (Stent coronarien)
  const pChraibi = await db.patient.create({
    data: {
      clinic_id: clinicCasablanca.id,
      file_number: 1095,
      first_name: 'Mehdi',
      last_name: 'Chraibi',
      birth_date: new Date('1961-05-30'),
      gender: 'male',
      phone: '+212 665-998877',
      address: '105 Avenue 2 Mars, Casablanca',
      cin: encryptCin('D392011'),
      cin_hash: hashBlindIndex('D392011'),
      medical_profile: {
        create: {
          height_cm: 175,
          weight_kg: 79.5,
          blood_type: 'O_negative',
          allergies: [],
          chronic_conditions: ['Stent coronarien (2024)', 'Diabète type 2'],
        },
      },
    },
  });

  // =========================================================================
  // TODAY'S APPOINTMENTS SCHEDULE (Dr. Benali - Casablanca)
  // =========================================================================
  console.log('Seeding today\'s clinical schedule...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function getSlotTime(hour: number, minute: number): Date {
    const d = new Date(today);
    d.setHours(hour, minute, 0, 0);
    return d;
  }

  const appointmentsData = [
    // 09:00 - 09:30 : Completed (Yassine Mansouri, fee 350 DH)
    {
      clinic_id: clinicCasablanca.id,
      patient_id: pMansouri.id,
      doctor_id: doctorBenali.id,
      starts_at: getSlotTime(9, 0),
      ends_at: getSlotTime(9, 30),
      status: 'completed' as const,
      reason: 'Consultation de contrôle cardiologie annuelle. ECG normal.',
      source: 'staff' as const,
      created_by: secretaryMeryem.id,
    },
    // 09:30 - 10:00 : In Progress (Fatima Zahra Alami)
    {
      clinic_id: clinicCasablanca.id,
      patient_id: pAlami.id,
      doctor_id: doctorBenali.id,
      starts_at: getSlotTime(9, 30),
      ends_at: getSlotTime(10, 0),
      status: 'in_progress' as const,
      reason: 'Première consultation - Hypertension artérielle et souffle systolique.',
      source: 'staff' as const,
      created_by: secretaryMeryem.id,
    },
    // 10:00 - 10:30 : Arrived in Waiting Room (Omar Bennani)
    {
      clinic_id: clinicCasablanca.id,
      patient_id: pBennani.id,
      doctor_id: doctorBenali.id,
      starts_at: getSlotTime(10, 0),
      ends_at: getSlotTime(10, 30),
      status: 'arrived' as const,
      reason: 'Bilan tensionnel et dyspnée d\'effort modérée.',
      source: 'staff' as const,
      created_by: secretaryMeryem.id,
    },
    // 10:30 - 11:00 : Arrived in Waiting Room (Khadija Tazi)
    {
      clinic_id: clinicCasablanca.id,
      patient_id: pTazi.id,
      doctor_id: doctorBenali.id,
      starts_at: getSlotTime(10, 30),
      ends_at: getSlotTime(11, 0),
      status: 'arrived' as const,
      reason: 'Renouvellement ordonnance et palpitations nocturnes.',
      source: 'staff' as const,
      created_by: secretaryMeryem.id,
    },
    // 11:30 - 12:00 : Scheduled (Mehdi Chraibi)
    {
      clinic_id: clinicCasablanca.id,
      patient_id: pChraibi.id,
      doctor_id: doctorBenali.id,
      starts_at: getSlotTime(11, 30),
      ends_at: getSlotTime(12, 0),
      status: 'scheduled' as const,
      reason: 'Suivi post-opératoire stent et bilan lipidique.',
      source: 'online' as const,
      created_by: doctorBenali.id,
    },
  ];

  await db.appointment.createMany({ data: appointmentsData });

  // =========================================================================
  // CNDP AUDIT TRAIL LOGS
  // =========================================================================
  console.log('Seeding CNDP Law 09-08 Audit Trail Logs...');
  await db.auditLog.createMany({
    data: [
      {
        clinic_id: clinicCasablanca.id,
        user_id: doctorBenali.id,
        action: 'login',
        entity_type: 'User',
        entity_id: doctorBenali.id,
        request_id: 'cndp-req-001',
        ip: '196.200.145.22',
        user_agent: 'Antigravity Medical Client (Casablanca)',
        metadata: { method: '2FA_TOTP_VERIFIED', role: 'doctor' },
      },
      {
        clinic_id: clinicCasablanca.id,
        user_id: doctorBenali.id,
        action: 'read',
        entity_type: 'Patient',
        entity_id: pAlami.id,
        request_id: 'cndp-req-002',
        ip: '196.200.145.22',
        user_agent: 'Antigravity Medical Client (Casablanca)',
        metadata: { action: 'LECTURE_DOSSIER_MEDICAL', loi_09_08_compliance: true },
      },
      {
        clinic_id: clinicCasablanca.id,
        user_id: secretaryMeryem.id,
        action: 'create',
        entity_type: 'Appointment',
        entity_id: pBennani.id,
        request_id: 'cndp-req-003',
        ip: '196.200.145.22',
        user_agent: 'Antigravity Reception Terminal',
        metadata: { action: 'ENREGISTREMENT_ARRIVEE_SALLE_ATTENTE', status: 'arrived' },
      },
    ],
  });

  console.log('--- Database Seed Finished Successfully! ---');
  console.log('Clinics seeded: Casablanca (Dr. Benali), Rabat (Dr. Sara), Marrakech (Dr. El Fassi)');
  console.log('Test Credentials:');
  console.log('  - Doctor: doctor@clinic-a.test / SeedPass123!');
  console.log('  - Secretary: secretary@clinic-a.test / SeedPass123!');
  console.log('  - Solo Doctor: doctor@solo.test / SeedPass123!');
}

main()
  .catch((e) => {
    console.error('Seed execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
