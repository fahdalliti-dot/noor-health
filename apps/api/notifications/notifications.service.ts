import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { AuditLogRepository } from '../audit/audit-log.repository';
import { WhatsAppClientService } from './services/whatsapp-client.service';
import { buildWhatsAppReminderPayload } from './templates/whatsapp-reminder.templates';
import { AppointmentStatus, NotificationChannel, NotificationStatus } from '@doctors-morocco/db';
import { DateTime } from 'luxon';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogRepository,
    private readonly whatsAppClient: WhatsAppClientService,
  ) {}

  async sendAppointmentReminder(
    appointmentId: string,
    clinicId: string,
    language: 'ar_MA' | 'fr_MA' = 'ar_MA',
  ): Promise<any> {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, clinic_id: clinicId },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            full_name: true,
            speciality: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            timezone: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Rendez-vous introuvable.');
    }

    if (!appointment.patient?.phone) {
      throw new BadRequestException('Le patient n’a pas de numéro de téléphone enregistré.');
    }

    const tz = appointment.clinic?.timezone || 'Africa/Casablanca';
    const startsAtLuxon = DateTime.fromJSDate(appointment.starts_at).setZone(tz);
    const dateStr = startsAtLuxon.setLocale(language === 'ar_MA' ? 'ar-MA' : 'fr-MA').toFormat('EEEE d MMMM yyyy');
    const timeStr = startsAtLuxon.toFormat('HH:mm');

    const payload = buildWhatsAppReminderPayload(
      {
        patientName: `${appointment.patient.first_name} ${appointment.patient.last_name}`,
        doctorName: appointment.doctor?.full_name || 'Dr. Amine Benali',
        speciality: appointment.doctor?.speciality || 'Médecin Spécialiste',
        clinicName: appointment.clinic?.name || 'Cabinet Médical',
        clinicAddress: appointment.clinic?.address || 'Casablanca',
        clinicPhone: appointment.clinic?.phone || '+212 522-000000',
        appointmentId: appointment.id,
        dateStr,
        timeStr,
      },
      language,
    );

    const dispatchResult = await this.whatsAppClient.sendInteractiveMessage(
      appointment.patient.phone,
      payload,
    );

    const notificationLog = await this.prisma.notificationLog.create({
      data: {
        clinic_id: clinicId,
        appointment_id: appointment.id,
        patient_id: appointment.patient.id,
        channel: dispatchResult.channel as NotificationChannel,
        recipient_phone: dispatchResult.recipient,
        template_name: 'appointment_interactive_reminder',
        language,
        status: dispatchResult.success ? NotificationStatus.sent : NotificationStatus.failed,
        provider_message_id: dispatchResult.providerMessageId,
        content_preview: payload.bodyText.substring(0, 200),
        sent_at: new Date(),
      },
    });

    await this.auditLog.log({
      action: 'create',
      entity_type: 'NotificationLog',
      entity_id: notificationLog.id,
      clinic_id: clinicId,
      user_id: appointment.doctor_id,
      metadata: {
        channel: dispatchResult.channel,
        phone: dispatchResult.recipient,
        appointment_id: appointmentId,
      },
    });

    return {
      success: true,
      notification_id: notificationLog.id,
      channel: dispatchResult.channel,
      provider_message_id: dispatchResult.providerMessageId,
      recipient: dispatchResult.recipient,
      content_preview: payload.bodyText,
    };
  }

  async processBatchUpcomingReminders(clinicId: string): Promise<any> {
    const now = DateTime.now().setZone('Africa/Casablanca');
    const windowStart = now.plus({ hours: 12 }).toJSDate();
    const windowEnd = now.plus({ hours: 48 }).toJSDate();

    // Find scheduled appointments in the window without a sent reminder
    const appointments = await this.prisma.appointment.findMany({
      where: {
        clinic_id: clinicId,
        status: AppointmentStatus.scheduled,
        starts_at: { gte: windowStart, lte: windowEnd },
        notifications: {
          none: {
            status: { in: [NotificationStatus.sent, NotificationStatus.delivered, NotificationStatus.read] },
          },
        },
      },
      take: 50,
    });

    const results = [];
    for (const appt of appointments) {
      try {
        const res = await this.sendAppointmentReminder(appt.id, clinicId, 'ar_MA');
        results.push({ appointmentId: appt.id, status: 'sent', res });
      } catch (err: any) {
        results.push({ appointmentId: appt.id, status: 'failed', error: err.message });
      }
    }

    return {
      processed_count: appointments.length,
      success_count: results.filter((r) => r.status === 'sent').length,
      details: results,
    };
  }

  async handleInboundWhatsAppWebhook(body: any): Promise<any> {
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return { status: 'ignored_no_message' };
    }

    const fromPhone = message.from;
    const interactive = message.interactive;
    const buttonReply = interactive?.button_reply || message.button;
    const buttonId = buttonReply?.id || buttonReply?.payload;

    if (!buttonId) {
      this.logger.log(`Received non-interactive WhatsApp message from ${fromPhone}`);
      return { status: 'ignored_no_interactive_action' };
    }

    this.logger.log(`Received WhatsApp button reply from ${fromPhone}: ${buttonId}`);

    if (buttonId.startsWith('CONFIRM_')) {
      const appointmentId = buttonId.replace('CONFIRM_', '');
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { clinic: true, doctor: true, patient: true },
      });

      if (appointment) {
        await this.prisma.appointment.update({
          where: { id: appointmentId },
          data: { status: AppointmentStatus.confirmed },
        });

        await this.auditLog.log({
          action: 'update',
          entity_type: 'Appointment',
          entity_id: appointmentId,
          clinic_id: appointment.clinic_id,
          metadata: { trigger: 'whatsapp_button_confirm', phone: fromPhone },
        });

        // Send confirmation receipt in Darija
        const doctorName = appointment.doctor?.full_name || 'Amine Benali';
        const clinicName = appointment.clinic?.name || 'العيادة';
        const replyText = `شكراً ${appointment.patient?.first_name || ''}! تم تأكيد موعدك بنجاح مع الدكتور ${doctorName} في ${clinicName}. موعدنا في الوقت المحدد إن شاء الله.`;
        await this.whatsAppClient.sendSimpleTextMessage(fromPhone, replyText);

        return {
          status: 'confirmed',
          appointment_id: appointmentId,
          patient: appointment.patient?.first_name,
        };
      }
    } else if (buttonId.startsWith('CANCEL_')) {
      const appointmentId = buttonId.replace('CANCEL_', '');
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { clinic: true, doctor: true, patient: true },
      });

      if (appointment) {
        await this.prisma.appointment.update({
          where: { id: appointmentId },
          data: {
            status: AppointmentStatus.cancelled,
            cancelled_at: new Date(),
            cancel_reason: 'Annulé par le patient via réponse WhatsApp Cloud',
          },
        });

        await this.auditLog.log({
          action: 'update',
          entity_type: 'Appointment',
          entity_id: appointmentId,
          clinic_id: appointment.clinic_id,
          metadata: { trigger: 'whatsapp_button_cancel', phone: fromPhone },
        });

        // Send cancellation acknowledgement in Darija
        const doctorName = appointment.doctor?.full_name || 'Amine Benali';
        const clinicPhone = appointment.clinic?.phone || '+212 522-000000';
        const replyText = `تم إلغاء موعدك كما طلبت. إذا كنت ترغب في حجز موعد جديد مع الدكتور ${doctorName}، يمكنك الاتصال بـ ${clinicPhone}. شكراً لتفهمك.`;
        await this.whatsAppClient.sendSimpleTextMessage(fromPhone, replyText);

        return {
          status: 'cancelled',
          appointment_id: appointmentId,
          patient: appointment.patient?.first_name,
        };
      }
    }

    return { status: 'processed_unknown_action', buttonId };
  }

  async getLogs(clinicId: string, appointmentId?: string): Promise<any> {
    return this.prisma.notificationLog.findMany({
      where: {
        clinic_id: clinicId,
        ...(appointmentId ? { appointment_id: appointmentId } : {}),
      },
      include: {
        patient: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            phone: true,
          },
        },
        appointment: {
          select: {
            id: true,
            starts_at: true,
            status: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
  }
}
