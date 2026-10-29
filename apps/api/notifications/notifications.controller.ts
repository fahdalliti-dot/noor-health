import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { GetUser } from '../decorators/user.decorator';
import { ResponseFormat } from '../decorators/response.decorator';
import { NotificationsService } from './notifications.service';
import { buildWhatsAppReminderPayload } from './templates/whatsapp-reminder.templates';

@Controller('notifications')
export class NotificationsController {
  constructor(
    @Inject(NotificationsService) private readonly service: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Meta WhatsApp Cloud Webhook Verification Challenge (GET)
   */
  @Get('whatsapp/webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const configuredToken = this.config.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN') || 'nura_webhook_secret_2026';
    if (mode === 'subscribe' && token === configuredToken) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden: invalid webhook token');
  }

  /**
   * Inbound WhatsApp Webhook Ingestion (POST)
   * Receives interactive 1-click button responses from patients (Confirm / Cancel).
   */
  @Post('whatsapp/webhook')
  async handleWebhook(@Body() body: any, @Res() res: Response) {
    const result = await this.service.handleInboundWhatsAppWebhook(body);
    // Return 200 OK fast so Meta doesn't retry
    return res.status(200).json({ status: 'received', result });
  }

  /**
   * Send single appointment reminder (WhatsApp with SMS fallback)
   */
  @Post('send-reminder/:appointmentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor', 'secretary', 'admin')
  @ResponseFormat()
  async sendReminder(
    @Param('appointmentId') appointmentId: string,
    @Body('language') language: 'ar_MA' | 'fr_MA',
    @GetUser() user: any,
  ): Promise<any> {
    const data = await this.service.sendAppointmentReminder(
      appointmentId,
      user.clinic_id,
      language || 'ar_MA',
    );
    return {
      status: HttpStatus.OK,
      data,
      message: 'Rappel WhatsApp interactif envoyé au patient.',
    };
  }

  /**
   * Batch process reminders for all upcoming appointments (24h lead time)
   */
  @Post('batch-reminders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor', 'secretary', 'admin')
  @ResponseFormat()
  async triggerBatchReminders(@GetUser() user: any): Promise<any> {
    const data = await this.service.processBatchUpcomingReminders(user.clinic_id);
    return {
      status: HttpStatus.OK,
      data,
      message: `${data.success_count} rappels WhatsApp programmés et envoyés.`,
    };
  }

  /**
   * List notification audit logs
   */
  @Get('logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor', 'secretary', 'admin')
  @ResponseFormat()
  async getLogs(
    @Query('appointment_id') appointmentId: string,
    @GetUser() user: any,
  ): Promise<any> {
    const data = await this.service.getLogs(user.clinic_id, appointmentId);
    return {
      status: HttpStatus.OK,
      data,
    };
  }

  /**
   * Live preview of WhatsApp interactive templates in Darija and French
   */
  @Post('preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor', 'secretary', 'admin')
  @ResponseFormat()
  async previewTemplate(
    @Body('language') language: 'ar_MA' | 'fr_MA',
  ): Promise<any> {
    const payload = buildWhatsAppReminderPayload(
      {
        patientName: 'Khadija El Fassi',
        doctorName: 'Dr. Amine Benali',
        speciality: 'Cardiologue',
        clinicName: 'Clinique Al Madina',
        clinicAddress: 'Boulevard d’Anfa, Casablanca',
        clinicPhone: '+212 522-123456',
        appointmentId: 'demo-appt-123',
        dateStr: 'Jeudi 30 Octobre 2026',
        timeStr: '11:00',
      },
      language || 'ar_MA',
    );
    return {
      status: HttpStatus.OK,
      data: payload,
    };
  }
}
