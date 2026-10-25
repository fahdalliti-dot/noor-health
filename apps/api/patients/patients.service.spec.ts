import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';

function createMockPrisma() {
  const mockPrisma = {
    patient: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
      delete: vi.fn(),
    },
    patientMedicalProfile: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  // Default transaction implementation that passes the mock itself
  mockPrisma.$transaction.mockImplementation(async (arg: any) => {
    if (typeof arg === 'function') return arg(mockPrisma);
    return arg; // array of promises
  });

  return mockPrisma;
}

function createMockAuditLog() {
  return {
    log: vi.fn(),
  };
}

function createMockEncryption() {
  return {
    encrypt: vi.fn((val: string) => val ? `encrypted:${val}` : null),
    decrypt: vi.fn((val: string) => val?.replace('encrypted:', '') ?? null),
    hashBlindIndex: vi.fn((val: string) => val ? `hash:${val.toUpperCase().trim()}` : ''),
    verifyBlindIndex: vi.fn((val: string, hash: string) => hash === `hash:${val.toUpperCase().trim()}`),
  };
}

describe('PatientsService', () => {
  let service: PatientsService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let auditLog: ReturnType<typeof createMockAuditLog>;
  let encryption: ReturnType<typeof createMockEncryption>;

  beforeEach(() => {
    prisma = createMockPrisma();
    auditLog = createMockAuditLog();
    encryption = createMockEncryption();
    service = new PatientsService(prisma as any, auditLog as any, encryption as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createPatient', () => {
    const validDto = {
      first_name: 'Ahmed',
      last_name: 'Alami',
      birth_date: '2000-01-15',
      gender: 'male' as const,
      phone: '+212600000000',
      email: 'ahmed@test.com',
      cin: '12345678',
    };

    it('should create patient with encrypted CIN and blind index', async () => {
      prisma.patient.aggregate.mockResolvedValue({ _max: { file_number: 5 } });
      prisma.patient.findFirst.mockResolvedValue(null); // no duplicate CIN
      prisma.patient.create.mockResolvedValue({
        id: 'p1',
        clinic_id: 'c1',
        file_number: 6,
        ...validDto,
        birth_date: new Date(validDto.birth_date),
        cin: 'encrypted:12345678',
        cin_hash: 'hash:12345678',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      });

      const result = await service.createPatient(validDto, 'c1', 'u1', 'secretary');

      expect(result.file_number).toBe(6);
      expect(result.first_name).toBe('Ahmed');
      expect(prisma.patient.create).toHaveBeenCalled();
      expect(encryption.encrypt).toHaveBeenCalledWith('12345678');
      expect(encryption.hashBlindIndex).toHaveBeenCalledWith('12345678');
    });

    it('should throw ConflictException if CIN already exists', async () => {
      prisma.patient.aggregate.mockResolvedValue({ _max: { file_number: 5 } });
      prisma.patient.findFirst.mockResolvedValue({ id: 'existing' }); // duplicate CIN

      await expect(service.createPatient(validDto, 'c1', 'u1', 'secretary')).rejects.toThrow(ConflictException);
    });

    it('should allow doctor and admin to create', async () => {
      prisma.patient.aggregate.mockResolvedValue({ _max: { file_number: 0 } });
      prisma.patient.findFirst.mockResolvedValue(null);
      prisma.patient.create.mockResolvedValue({ id: 'p1', file_number: 1, ...validDto, cin: 'encrypted:12345678', cin_hash: 'hash:12345678' });

      await service.createPatient(validDto, 'c1', 'u1', 'doctor');
      await service.createPatient(validDto, 'c1', 'u1', 'admin');
    });

    it('should throw ForbiddenException for other roles', async () => {
      await expect(service.createPatient(validDto, 'c1', 'u1', 'other')).rejects.toThrow(ForbiddenException);
    });

    it('should handle null CIN', async () => {
      const dtoNoCin = { ...validDto, cin: undefined };
      prisma.patient.aggregate.mockResolvedValue({ _max: { file_number: 0 } });
      prisma.patient.findFirst.mockResolvedValue(null);
      prisma.patient.create.mockResolvedValue({ id: 'p1', file_number: 1, ...dtoNoCin, cin: null, cin_hash: null });

      const result = await service.createPatient(dtoNoCin, 'c1', 'u1', 'secretary');
      expect(result.cin).toBeUndefined();
      expect(encryption.encrypt).not.toHaveBeenCalled();
    });
  });

  describe('getPatient', () => {
    it('should return patient with medical profile when requested', async () => {
      const patient = {
        id: 'p1',
        clinic_id: 'c1',
        file_number: 1,
        first_name: 'Ahmed',
        last_name: 'Alami',
        birth_date: new Date('2000-01-15'),
        gender: 'male',
        cin: 'encrypted:12345678',
        cin_hash: 'hash:12345678',
        medical_profile: {
          height_cm: 175,
          weight_kg: 70,
          blood_type: 'O_positive',
          allergies: ['penicillin'],
          chronic_conditions: [],
          deleted_at: null,
        },
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };

      prisma.patient.findFirst.mockResolvedValue(patient);

      const result = await service.getPatient('p1', 'c1', true);

      expect(result.medical_profile).toBeDefined();
      expect(result.medical_profile.height_cm).toBe(175);
    });

    it('should throw NotFoundException if patient not found', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);

      await expect(service.getPatient('p1', 'c1')).rejects.toThrow(NotFoundException);
    });

    it('should not return soft-deleted patients', async () => {
      prisma.patient.findFirst.mockResolvedValue(null); // because deleted_at is not null

      await expect(service.getPatient('p1', 'c1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePatient', () => {
    const existingPatient = {
      id: 'p1',
      clinic_id: 'c1',
      file_number: 1,
      first_name: 'Ahmed',
      last_name: 'Alami',
      birth_date: new Date('2000-01-15'),
      gender: 'male',
      cin: 'encrypted:12345678',
      cin_hash: 'hash:12345678',
      deleted_at: null,
    };

    it('should update patient and re-encrypt CIN if changed', async () => {
      prisma.patient.findFirst.mockResolvedValue(existingPatient);
      // findFirst called twice: once for patient lookup, once for duplicate CIN check
      // First call returns existingPatient, second returns null (no duplicate)
      prisma.patient.findFirst.mockResolvedValueOnce(existingPatient).mockResolvedValueOnce(null);
      prisma.patient.update.mockResolvedValue({ ...existingPatient, first_name: 'Mohamed' });

      const result = await service.updatePatient('p1', { first_name: 'Mohamed', cin: '87654321' }, 'c1', 'u1', 'doctor');

      expect(result.first_name).toBe('Mohamed');
      expect(encryption.encrypt).toHaveBeenCalledWith('87654321');
      expect(encryption.hashBlindIndex).toHaveBeenCalledWith('87654321');
    });

    it('should clear CIN when set to null', async () => {
      prisma.patient.findFirst.mockResolvedValue(existingPatient);
      prisma.patient.update.mockResolvedValue({ ...existingPatient, cin: null, cin_hash: null });

      const result = await service.updatePatient('p1', { cin: null }, 'c1', 'u1', 'doctor');

      expect(result.cin).toBeUndefined();
    });

    it('should throw ForbiddenException for unauthorized role', async () => {
      prisma.patient.findFirst.mockResolvedValue({ id: 'p1', clinic_id: 'c1', deleted_at: null });

      await expect(service.updatePatient('p1', { first_name: 'X' }, 'c1', 'u1', 'other')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if new CIN duplicates', async () => {
      prisma.patient.findFirst
        .mockResolvedValueOnce(existingPatient) // for update
        .mockResolvedValueOnce({ id: 'other' }); // duplicate CIN check

      await expect(service.updatePatient('p1', { cin: '87654321' }, 'c1', 'u1', 'doctor')).rejects.toThrow(ConflictException);
    });
  });

  describe('softDeletePatient', () => {
    const existingPatient = {
      id: 'p1',
      clinic_id: 'c1',
      file_number: 1,
      first_name: 'Ahmed',
      deleted_at: null,
    };

    it('should soft delete patient and medical profile', async () => {
      prisma.patient.findFirst.mockResolvedValue(existingPatient);
      // $transaction default implementation already passes the mock itself
      // The service calls $transaction with an array of operations
      prisma.patient.update.mockResolvedValue({ ...existingPatient, deleted_at: new Date() });
      prisma.patientMedicalProfile.update.mockResolvedValue({ deleted_at: new Date() });

      await service.softDeletePatient('p1', 'c1', 'u1', 'doctor');

      expect(prisma.patient.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { deleted_at: expect.any(Date) },
      });
      expect(prisma.patientMedicalProfile.update).toHaveBeenCalledWith({
        where: { patient_id: 'p1' },
        data: { deleted_at: expect.any(Date) },
      });
    });

    it('should throw ForbiddenException if not doctor', async () => {
      await expect(service.softDeletePatient('p1', 'c1', 'u1', 'secretary')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if patient not found', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);

      await expect(service.softDeletePatient('p1', 'c1', 'u1', 'doctor')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Medical Profile (Doctor only)', () => {
    it('should get medical profile', async () => {
      prisma.patient.findFirst.mockResolvedValue({ id: 'p1', clinic_id: 'c1', deleted_at: null });
      prisma.patientMedicalProfile.findUnique.mockResolvedValue({
        height_cm: 175,
        weight_kg: 70,
        blood_type: 'O_positive',
        allergies: ['penicillin'],
        chronic_conditions: ['hypertension'],
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.getMedicalProfile('p1', 'c1');

      expect(result.height_cm).toBe(175);
      expect(result.allergies).toEqual(['penicillin']);
    });

    it('should return null if no profile or deleted', async () => {
      prisma.patient.findFirst.mockResolvedValue({ id: 'p1', clinic_id: 'c1', deleted_at: null });
      prisma.patientMedicalProfile.findUnique.mockResolvedValue(null);

      const result = await service.getMedicalProfile('p1', 'c1');
      expect(result).toBeNull();
    });

    it('should throw ForbiddenException for secretary/admin on upsert', async () => {
      prisma.patient.findFirst.mockResolvedValue({ id: 'p1', clinic_id: 'c1', deleted_at: null });

      await expect(service.upsertMedicalProfile('p1', {}, 'c1', 'u1', 'secretary')).rejects.toThrow(ForbiddenException);
      await expect(service.upsertMedicalProfile('p1', {}, 'c1', 'u1', 'admin')).rejects.toThrow(ForbiddenException);
    });

    it('should upsert medical profile for doctor', async () => {
      prisma.patient.findFirst.mockResolvedValue({ id: 'p1', clinic_id: 'c1', deleted_at: null });
      prisma.patientMedicalProfile.upsert.mockResolvedValue({
        height_cm: 180,
        weight_kg: 80,
        blood_type: 'A_positive',
        allergies: [],
        chronic_conditions: [],
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.upsertMedicalProfile('p1', { height_cm: 180 }, 'c1', 'u1', 'doctor');
      expect(result.height_cm).toBe(180);
    });

    it('should throw ForbiddenException for non-doctor on deleteMedicalProfile', async () => {
      await expect(service.deleteMedicalProfile('p1', 'c1', 'u1', 'secretary')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('searchPatients', () => {
    it('should search by first_name and last_name', async () => {
      prisma.patient.findMany.mockResolvedValue([
        { id: 'p1', file_number: 1, first_name: 'Ahmed', last_name: 'Alami', cin_hash: 'hash:12345678', medical_profile: null },
      ]);

      const results = await service.searchPatients('c1', { q: 'Ahmed', limit: 20 });

      expect(results.length).toBe(1);
      const callArg = prisma.patient.findMany.mock.calls[0][0];
      expect(callArg.where.clinic_id).toBe('c1');
      expect(callArg.where.deleted_at).toBeNull();
      expect(callArg.where.OR).toHaveLength(3);
      expect(callArg.where.OR[0].first_name).toEqual({ contains: 'Ahmed', mode: 'insensitive' });
      expect(callArg.where.OR[1].last_name).toEqual({ contains: 'Ahmed', mode: 'insensitive' });
      expect(callArg.where.OR[2].cin_hash).toEqual({ equals: 'hash:AHMED' });
      expect(callArg.take).toBe(20);
      expect(callArg.orderBy).toEqual({ file_number: 'asc' });
    });

    it('should search by exact CIN via blind index', async () => {
      const encryption = createMockEncryption();
      const serviceWithEnc = new PatientsService(prisma as any, auditLog as any, encryption as any);

      prisma.patient.findMany.mockResolvedValue([]);

      await serviceWithEnc.searchPatients('c1', { q: '12345678', limit: 20 });

      expect(encryption.hashBlindIndex).toHaveBeenCalledWith('12345678');
    });

    it('should return empty for empty query', async () => {
      prisma.patient.findMany.mockResolvedValue([]);
      const results = await service.searchPatients('c1', { q: '', limit: 20 });
      expect(results).toEqual([]);
    });
  });

  describe('listPatients', () => {
    it('should list active patients by default', async () => {
      prisma.patient.findMany.mockResolvedValue([
        { id: 'p1', file_number: 1, first_name: 'Ahmed', deleted_at: null },
      ]);

      const results = await service.listPatients('c1');
      expect(results.length).toBe(1);
    });

    it('should list deleted patients when requested', async () => {
      prisma.patient.findMany.mockResolvedValue([
        { id: 'p1', file_number: 1, first_name: 'Ahmed', deleted_at: new Date() },
      ]);

      const results = await service.listPatients('c1', { deleted: true });
      expect(results.length).toBe(1);
      expect(prisma.patient.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ deleted_at: { not: null } }),
      }));
    });
  });
});