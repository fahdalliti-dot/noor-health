import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { WhatsAppClientService } from './services/whatsapp-client.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, WhatsAppClientService],
  exports: [NotificationsService, WhatsAppClientService],
})
export class NotificationsModule {}
