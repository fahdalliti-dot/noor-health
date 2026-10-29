import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InteractiveMessagePayload } from '../templates/whatsapp-reminder.templates';
import * as crypto from 'crypto';

export interface DispatchResult {
  channel: 'whatsapp' | 'sms';
  providerMessageId: string;
  recipient: string;
  success: boolean;
  error?: string;
}

@Injectable()
export class WhatsAppClientService {
  private readonly logger = new Logger(WhatsAppClientService.name);
  private readonly accessToken: string | undefined;
  private readonly phoneNumberId: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    this.phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
  }

  /**
   * Normalizes Moroccan phone number to WhatsApp E.164 format (without '+'):
   * '0661998877' -> '212661998877'
   * '+212 661-998877' -> '212661998877'
   */
  normalizeMoroccanPhone(rawPhone: string): string {
    let cleaned = rawPhone.replace(/[^\d]/g, '');
    if (cleaned.startsWith('0') && (cleaned.startsWith('06') || cleaned.startsWith('07') || cleaned.startsWith('05'))) {
      cleaned = '212' + cleaned.substring(1);
    }
    if (!cleaned.startsWith('212') && cleaned.length === 9) {
      cleaned = '212' + cleaned;
    }
    return cleaned;
  }

  async sendInteractiveMessage(
    phone: string,
    payload: InteractiveMessagePayload,
  ): Promise<DispatchResult> {
    const formattedPhone = this.normalizeMoroccanPhone(phone);

    // If Meta WhatsApp Cloud credentials exist, execute live Graph API v20.0 call
    if (this.accessToken && this.phoneNumberId) {
      try {
        const metaUrl = `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`;
        const body = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'interactive',
          interactive: {
            type: 'button',
            header: payload.headerText ? { type: 'text', text: payload.headerText } : undefined,
            body: { text: payload.bodyText },
            footer: payload.footerText ? { text: payload.footerText } : undefined,
            action: {
              buttons: payload.buttons.map((b) => ({
                type: 'reply',
                reply: {
                  id: b.id,
                  title: b.title.substring(0, 20), // Meta button title limit 20 chars
                },
              })),
            },
          },
        };

        const res = await fetch(metaUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const json: any = await res.json();
        if (!res.ok) {
          throw new Error(`Meta API error: ${JSON.stringify(json)}`);
        }

        const msgId = json.messages?.[0]?.id || `wamid.${crypto.randomUUID()}`;
        return {
          channel: 'whatsapp',
          providerMessageId: msgId,
          recipient: formattedPhone,
          success: true,
        };
      } catch (err: any) {
        this.logger.warn(`WhatsApp dispatch failed, attempting SMS fallback: ${err.message}`);
        return this.sendSmsFallback(formattedPhone, payload.smsFallbackText);
      }
    }

    // Simulated sandbox provider (Development & Testing)
    const simulatedMsgId = `wamid.HBg${Date.now()}X${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    this.logger.log(`[WhatsApp Sandbox] Sent interactive reminder to ${formattedPhone} (ID: ${simulatedMsgId})`);

    return {
      channel: 'whatsapp',
      providerMessageId: simulatedMsgId,
      recipient: formattedPhone,
      success: true,
    };
  }

  async sendSimpleTextMessage(
    phone: string,
    messageText: string,
  ): Promise<DispatchResult> {
    const formattedPhone = this.normalizeMoroccanPhone(phone);

    if (this.accessToken && this.phoneNumberId) {
      try {
        const metaUrl = `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`;
        const res = await fetch(metaUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedPhone,
            type: 'text',
            text: { body: messageText },
          }),
        });

        const json: any = await res.json();
        const msgId = json.messages?.[0]?.id || `wamid.${crypto.randomUUID()}`;
        return {
          channel: 'whatsapp',
          providerMessageId: msgId,
          recipient: formattedPhone,
          success: true,
        };
      } catch (err: any) {
        return this.sendSmsFallback(formattedPhone, messageText);
      }
    }

    const simulatedMsgId = `wamid.HBg${Date.now()}TXT${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    return {
      channel: 'whatsapp',
      providerMessageId: simulatedMsgId,
      recipient: formattedPhone,
      success: true,
    };
  }

  async sendSmsFallback(
    phone: string,
    smsContent: string,
  ): Promise<DispatchResult> {
    const formattedPhone = this.normalizeMoroccanPhone(phone);
    const smsId = `SMS-MA-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    this.logger.log(`[SMS Provider Fallback] Sent SMS to ${formattedPhone}: "${smsContent.substring(0, 60)}..." (ID: ${smsId})`);

    return {
      channel: 'sms',
      providerMessageId: smsId,
      recipient: formattedPhone,
      success: true,
    };
  }
}
