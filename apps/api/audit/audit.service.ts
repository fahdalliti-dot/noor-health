import { Injectable } from '@nestjs/common';
import { User } from '../db/client';
import { AuthRepository } from '../db/repository';

@Injectable()
export class AuditService {
  constructor(private authRepository: AuthRepository) {}

  async createAuditLog(
    action: string,
    entity_type: string | null,
    entity_id: string | null,
    clinic_id: string | null,
    user_id: string | null,
    metadata: Record<string, any>,
    request_id: string,
    ip: string | undefined,
    user_agent: string | null,
  ): Promise<any> {
    return this.authRepository.auditLog({
      action,
      entity_type,
      entity_id,
      clinic_id,
      user_id,
      metadata,
      request_id,
      ip,
      user_agent,
    });
  }

  async findAll(clinic_id: string, user_id?: string | null): Promise<any[]> {
    return this.authRepository.findAuditLogs(clinic_id, user_id ?? undefined);
  }

  async findPatientAccessLog(patient_id: string, clinic_id: string): Promise<any[]> {
    return this.authRepository.findPatientAccessLogs(patient_id, clinic_id);
  }

  async exportPatientData(patient_id: string, clinic_id: string): Promise<any> {
    const logs = await this.findPatientAccessLog(patient_id, clinic_id);
    return { patient_id, clinic_id, access_logs: logs };
  }
}
