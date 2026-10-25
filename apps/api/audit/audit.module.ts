import { Module } from '@nestjs/common';
import { AuditLogRepository } from './audit-log.repository';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuthRepository } from '../db/repository';

@Module({
  controllers: [AuditController],
  providers: [AuditLogRepository, AuditService, AuthRepository],
  exports: [AuditLogRepository, AuditService],
})
export class AuditModule {}
