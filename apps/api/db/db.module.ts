import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuthRepository } from './repository';
import { AuditLogRepository } from '../audit/audit-log.repository';

@Global()
@Module({
  providers: [PrismaService, AuthRepository, AuditLogRepository],
  exports: [PrismaService, AuthRepository, AuditLogRepository],
})
export class DbModule {}
