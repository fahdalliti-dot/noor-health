import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { AuditLogRepository } from '../audit/audit-log.repository';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import * as crypto from 'crypto';

@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogRepository,
  ) {}

  async create(
    dto: CreatePrescriptionDto,
    clinicId: string,
    doctorId: string,
  ): Promise<any> {
    if (!dto.items || dto.items.length === 0) {
      throw new ForbiddenException('A prescription must contain at least one medication item.');
    }

    // Verify patient belongs to clinic
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patient_id, clinic_id: clinicId, deleted_at: null },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found in this clinic.');
    }

    const qrToken = `ORD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const prescription = await this.prisma.prescription.create({
      data: {
        clinic_id: clinicId,
        patient_id: dto.patient_id,
        doctor_id: doctorId,
        appointment_id: dto.appointment_id || null,
        prescription_date: dto.prescription_date ? new Date(dto.prescription_date) : new Date(),
        diagnosis: dto.diagnosis || null,
        notes: dto.notes || null,
        qr_code_token: qrToken,
        items: {
          create: dto.items.map((item) => ({
            medication_name: item.medication_name,
            dosage: item.dosage,
            form: item.form,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions || null,
          })),
        },
      },
      include: {
        items: true,
        patient: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            birth_date: true,
            gender: true,
          },
        },
        doctor: {
          select: {
            id: true,
            full_name: true,
            speciality: true,
            license_number: true,
          },
        },
      },
    });

    await this.auditLog.log({
      action: 'create',
      entity_type: 'Prescription',
      entity_id: prescription.id,
      clinic_id: clinicId,
      user_id: doctorId,
      metadata: { patient_id: dto.patient_id, items_count: dto.items.length },
    });

    return prescription;
  }

  async findAll(clinicId: string, patientId?: string): Promise<any> {
    return this.prisma.prescription.findMany({
      where: {
        clinic_id: clinicId,
        ...(patientId ? { patient_id: patientId } : {}),
      },
      include: {
        items: true,
        patient: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            birth_date: true,
          },
        },
        doctor: {
          select: {
            id: true,
            full_name: true,
            speciality: true,
            license_number: true,
          },
        },
      },
      orderBy: { prescription_date: 'desc' },
    });
  }

  async findOne(id: string, clinicId: string): Promise<any> {
    const prescription = await this.prisma.prescription.findFirst({
      where: { id, clinic_id: clinicId },
      include: {
        items: true,
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
          },
        },
        patient: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            birth_date: true,
            gender: true,
          },
        },
        doctor: {
          select: {
            id: true,
            full_name: true,
            speciality: true,
            license_number: true,
          },
        },
      },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found.');
    }
    return prescription;
  }

  async verifyQr(token: string): Promise<any> {
    const prescription = await this.prisma.prescription.findFirst({
      where: { qr_code_token: token },
      include: {
        items: true,
        clinic: {
          select: {
            name: true,
            city: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            full_name: true,
            speciality: true,
            license_number: true,
          },
        },
        patient: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!prescription) {
      throw new NotFoundException('Invalid prescription QR token.');
    }

    return {
      valid: true,
      token: prescription.qr_code_token,
      prescription_date: prescription.prescription_date,
      doctor: prescription.doctor,
      clinic: prescription.clinic,
      patient_name: `${prescription.patient.first_name} ${prescription.patient.last_name}`,
      items: prescription.items,
    };
  }
}
