import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { Action } from '@doctors-morocco/db';

export interface AuditLogEntry {
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  clinic_id?: string | null;
  user_id?: string | null;
  metadata?: Record<string, any>;
  request_id?: string;
  ip?: string | null;
  user_agent?: string | null;
}

/**
 * Thin wrapper around the AuditLog table that centralises the "log a single
 * action" call so services don't repeat the `request_id ?? 'system'` boilerplate.
 */
@Injectable()
export class AuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<any> {
    return this.prisma.auditLog.create({
      data: {
        action: entry.action as Action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        clinic_id: entry.clinic_id,
        user_id: entry.user_id,
        metadata: entry.metadata ?? {},
        request_id: entry.request_id ?? 'system',
        ip: entry.ip,
        user_agent: entry.user_agent,
      },
    });
  }

  async findByClinic(clinicId: string, userId?: string): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      where: {
        clinic_id: clinicId,
        ...(userId ? { user_id: userId } : {}),
      },
      orderBy: { occurred_at: 'desc' },
      take: 200,
    });
  }
}
