import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { AuditLogRepository } from '../audit/audit-log.repository';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { CertificateType } from '@doctors-morocco/db';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogRepository,
  ) {}

  async create(
    dto: CreateCertificateDto,
    clinicId: string,
    doctorId: string,
  ): Promise<any> {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patient_id, clinic_id: clinicId, deleted_at: null },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found in this clinic.');
    }

    const certificate = await this.prisma.medicalCertificate.create({
      data: {
        clinic_id: clinicId,
        patient_id: dto.patient_id,
        doctor_id: doctorId,
        type: dto.type as CertificateType,
        title: dto.title,
        content: dto.content,
        start_date: dto.start_date ? new Date(dto.start_date) : new Date(),
        end_date: dto.end_date ? new Date(dto.end_date) : null,
        itt_days: dto.itt_days ?? null,
      },
      include: {
        patient: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            birth_date: true,
            gender: true,
            cin: true,
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
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
          },
        },
      },
    });

    await this.auditLog.log({
      action: 'create',
      entity_type: 'MedicalCertificate',
      entity_id: certificate.id,
      clinic_id: clinicId,
      user_id: doctorId,
      metadata: { patient_id: dto.patient_id, type: dto.type, itt_days: dto.itt_days },
    });

    return certificate;
  }

  async findAll(clinicId: string, patientId?: string): Promise<any> {
    return this.prisma.medicalCertificate.findMany({
      where: {
        clinic_id: clinicId,
        ...(patientId ? { patient_id: patientId } : {}),
      },
      include: {
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
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string, clinicId: string): Promise<any> {
    const certificate = await this.prisma.medicalCertificate.findFirst({
      where: { id, clinic_id: clinicId },
      include: {
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
        clinic: true,
      },
    });

    if (!certificate) {
      throw new NotFoundException('Medical certificate not found.');
    }
    return certificate;
  }
}
