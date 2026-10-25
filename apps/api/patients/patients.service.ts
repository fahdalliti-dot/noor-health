import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { AuditLogRepository } from '../audit/audit-log.repository';
import { EncryptionService } from '../encryption/encryption.service';
import {
  CreatePatientDto,
  UpdatePatientDto,
  SearchPatientsDto,
} from '@shared/utils';
import { Prisma } from '@doctors-morocco/db';

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogRepository,
    private readonly encryption: EncryptionService,
  ) {}

  // =====================
  // Patient CRUD (Identity)
  // =====================

  async createPatient(
    dto: CreatePatientDto,
    clinicId: string,
    userId: string,
    userRole: string,
  ): Promise<any> {
    const { cin, ...rest } = dto;

    // Validate permission: doctor, secretary, admin can create
    if (userRole === 'secretary' || userRole === 'doctor' || userRole === 'admin') {
      // allowed
    } else {
      throw new ForbiddenException('Insufficient permission to create patient.');
    }

    // Encrypt CIN if provided
    const encryptedCin = cin ? this.encryption.encrypt(cin) : null;
    const cinHash = cin ? this.encryption.hashBlindIndex(cin) : null;

    // Check for duplicate CIN within clinic (using blind index)
    if (cinHash) {
      const existing = await this.prisma.patient.findFirst({
        where: {
          clinic_id: clinicId,
          cin_hash: cinHash,
          deleted_at: null,
        },
      });
      if (existing) {
        throw new ConflictException('A patient with this CIN already exists in this clinic.');
      }
    }

    // Generate file_number (per-clinic sequence)
    const maxFileNumber = await this.prisma.patient.aggregate({
      where: { clinic_id: clinicId },
      _max: { file_number: true },
    });
    const fileNumber = (maxFileNumber._max.file_number ?? 0) + 1;

    const patient = await this.prisma.patient.create({
      data: {
        clinic_id: clinicId,
        file_number: fileNumber,
        ...rest,
        birth_date: new Date(dto.birth_date),
        cin: encryptedCin,
        cin_hash: cinHash,
      },
    });

    await this.auditLog.log({
      action: 'create',
      entity_type: 'patient',
      entity_id: patient.id,
      clinic_id: clinicId,
      user_id: userId,
      metadata: { fields: ['file_number', 'first_name', 'last_name', 'birth_date', 'gender'] },
    });

    return this.sanitizePatient(patient);
  }

  async listPatients(
    clinicId: string,
    params: { deleted?: boolean; limit?: number; offset?: number } = {},
  ): Promise<any[]> {
    const { deleted = false, limit = 50, offset = 0 } = params;

    const where: Prisma.PatientWhereInput = {
      clinic_id: clinicId,
      deleted_at: deleted ? { not: null } : null,
    };

    const patients = await this.prisma.patient.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { file_number: 'asc' },
    });

    await this.auditLog.log({
      action: 'read',
      entity_type: 'patient',
      entity_id: undefined,
      clinic_id: clinicId,
      user_id: undefined,
      metadata: { list: true },
    });

    return patients.map((p) => this.sanitizePatient(p));
  }

  async getPatient(
    id: string,
    clinicId: string,
    includeMedicalProfile = false,
  ): Promise<any> {
    const patient = await this.prisma.patient.findFirst({
      where: {
        id,
        clinic_id: clinicId,
        deleted_at: null,
      },
      include: {
        medical_profile: includeMedicalProfile
          ? { where: { deleted_at: null } }
          : false,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found.');
    }

    return this.sanitizePatient(patient, includeMedicalProfile);
  }

  async updatePatient(
    id: string,
    dto: UpdatePatientDto,
    clinicId: string,
    userId: string,
    userRole: string,
  ): Promise<any> {
    const existing = await this.prisma.patient.findFirst({
      where: { id, clinic_id: clinicId, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Patient not found.');
    }

    // Permission: doctor, secretary, admin can update
    if (userRole === 'secretary' || userRole === 'doctor' || userRole === 'admin') {
      // allowed
    } else {
      throw new ForbiddenException('Insufficient permission to update patient.');
    }

    const { cin, deleted_at, ...rest } = dto;
    const updateData: any = { ...rest };

    if (dto.birth_date) {
      updateData.birth_date = new Date(dto.birth_date);
    }

    // Handle CIN update
    if (cin !== undefined) {
      if (cin === null || cin === '') {
        updateData.cin = null;
        updateData.cin_hash = null;
      } else {
        updateData.cin = this.encryption.encrypt(cin);
        updateData.cin_hash = this.encryption.hashBlindIndex(cin);

        // Check for duplicate CIN (excluding self)
        const duplicate = await this.prisma.patient.findFirst({
          where: {
            clinic_id: clinicId,
            cin_hash: updateData.cin_hash,
            deleted_at: null,
            NOT: { id },
          },
        });
        if (duplicate) {
          throw new ConflictException('A patient with this CIN already exists in this clinic.');
        }
      }
    }

    if (deleted_at !== undefined) {
      updateData.deleted_at = deleted_at ? new Date(deleted_at) : null;
    }

    const patient = await this.prisma.patient.update({
      where: { id },
      data: updateData,
    });

    await this.auditLog.log({
      action: 'update',
      entity_type: 'patient',
      entity_id: id,
      clinic_id: clinicId,
      user_id: userId,
      metadata: { fields: Object.keys(dto).filter((k) => dto[k as keyof typeof dto] !== undefined) },
    });

    return this.sanitizePatient(patient);
  }

  async softDeletePatient(
    id: string,
    clinicId: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    // Only doctor can soft-delete (per requirements)
    if (userRole !== 'doctor') {
      throw new ForbiddenException('Only doctors can delete patients.');
    }

    const patient = await this.prisma.patient.findFirst({
      where: { id, clinic_id: clinicId, deleted_at: null },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found.');
    }

    await this.prisma.$transaction([
      this.prisma.patient.update({
        where: { id },
        data: { deleted_at: new Date() },
      }),
      this.prisma.patientMedicalProfile.update({
        where: { patient_id: id },
        data: { deleted_at: new Date() },
      }),
    ]);

    await this.auditLog.log({
      action: 'delete',
      entity_type: 'patient',
      entity_id: id,
      clinic_id: clinicId,
      user_id: userId,
      metadata: { soft_delete: true },
    });
  }

  // =====================
  // Patient Medical Profile CRUD (Doctor only)
  // =====================

  async getMedicalProfile(patientId: string, clinicId: string): Promise<any> {
    // Verify patient exists and belongs to clinic
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, clinic_id: clinicId, deleted_at: null },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found.');
    }

    const profile = await this.prisma.patientMedicalProfile.findUnique({
      where: { patient_id: patientId },
    });

    if (!profile || profile.deleted_at) {
      return null;
    }

    return {
      height_cm: profile.height_cm,
      weight_kg: profile.weight_kg,
      blood_type: profile.blood_type,
      allergies: profile.allergies ?? [],
      chronic_conditions: profile.chronic_conditions ?? [],
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      deleted_at: profile.deleted_at,
    };
  }

  async upsertMedicalProfile(
    patientId: string,
    dto: { height_cm?: number | null; weight_kg?: number | null; blood_type?: string | null; allergies?: string[] | null; chronic_conditions?: string[] | null },
    clinicId: string,
    userId: string,
    userRole: string,
  ): Promise<any> {
    // Only doctors can access medical profile
    if (userRole !== 'doctor') {
      throw new ForbiddenException('Only doctors can manage medical profiles.');
    }

    // Verify patient belongs to clinic
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, clinic_id: clinicId, deleted_at: null },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found.');
    }

    const updateData: any = {
      ...dto,
      deleted_at: null, // clear soft delete if re-activating
    };

    // Convert empty arrays to null for consistency
    if (updateData.allergies?.length === 0) updateData.allergies = null;
    if (updateData.chronic_conditions?.length === 0) updateData.chronic_conditions = null;

    const profile = await this.prisma.patientMedicalProfile.upsert({
      where: { patient_id: patientId },
      create: {
        patient_id: patientId,
        ...updateData,
      },
      update: updateData,
    });

    await this.auditLog.log({
      action: 'update',
      entity_type: 'patient_medical_profile',
      entity_id: patientId,
      clinic_id: clinicId,
      user_id: userId,
      metadata: { fields: Object.keys(dto).filter((k) => dto[k as keyof typeof dto] !== undefined) },
    });

    return {
      height_cm: profile.height_cm,
      weight_kg: profile.weight_kg,
      blood_type: profile.blood_type,
      allergies: profile.allergies ?? [],
      chronic_conditions: profile.chronic_conditions ?? [],
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      deleted_at: profile.deleted_at,
    };
  }

  async deleteMedicalProfile(
    patientId: string,
    clinicId: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    if (userRole !== 'doctor') {
      throw new ForbiddenException('Only doctors can delete medical profiles.');
    }

    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, clinic_id: clinicId, deleted_at: null },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found.');
    }

    await this.prisma.patientMedicalProfile.update({
      where: { patient_id: patientId },
      data: { deleted_at: new Date() },
    });

    await this.auditLog.log({
      action: 'delete',
      entity_type: 'patient_medical_profile',
      entity_id: patientId,
      clinic_id: clinicId,
      user_id: userId,
      metadata: { soft_delete: true },
    });
  }

  // =====================
  // Search
  // =====================

  async searchPatients(
    clinicId: string,
    dto: SearchPatientsDto,
  ): Promise<any[]> {
    const { q, limit = 20 } = dto;

    const patients = await this.prisma.patient.findMany({
      where: {
        clinic_id: clinicId,
        deleted_at: null,
        OR: [
          { first_name: { contains: q, mode: 'insensitive' } },
          { last_name: { contains: q, mode: 'insensitive' } },
          { cin_hash: { equals: this.encryption.hashBlindIndex(q) } }, // exact CIN match via blind index
        ],
      },
      take: limit,
      orderBy: { file_number: 'asc' },
    });

    await this.auditLog.log({
      action: 'read',
      entity_type: 'patient',
      entity_id: undefined,
      clinic_id: clinicId,
      user_id: undefined,
      metadata: { search: q },
    });

    return patients.map((p) => this.sanitizePatient(p));
  }

  // =====================
  // Helper
  // =====================

  private sanitizePatient(patient: any, includeMedicalProfile = false): any {
    return {
      id: patient.id,
      clinic_id: patient.clinic_id,
      file_number: patient.file_number,
      first_name: patient.first_name,
      last_name: patient.last_name,
      birth_date: patient.birth_date?.toISOString?.() ?? patient.birth_date,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      emergency_contact_name: patient.emergency_contact_name,
      emergency_contact_phone: patient.emergency_contact_phone,
      has_medical_profile: !!patient.medical_profile && !patient.medical_profile?.deleted_at,
      created_at: patient.created_at?.toISOString?.() ?? patient.created_at,
      updated_at: patient.updated_at?.toISOString?.() ?? patient.updated_at,
      deleted_at: patient.deleted_at?.toISOString?.() ?? patient.deleted_at,
      ...(includeMedicalProfile && patient.medical_profile && !patient.medical_profile.deleted_at
        ? {
            medical_profile: {
              height_cm: patient.medical_profile.height_cm,
              weight_kg: patient.medical_profile.weight_kg,
              blood_type: patient.medical_profile.blood_type,
              allergies: patient.medical_profile.allergies ?? [],
              chronic_conditions: patient.medical_profile.chronic_conditions ?? [],
              created_at: patient.medical_profile.created_at,
              updated_at: patient.medical_profile.updated_at,
              deleted_at: patient.medical_profile.deleted_at,
            },
          }
        : {}),
    };
  }
}