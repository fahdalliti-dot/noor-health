import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { AuditLogRepository } from '../audit/audit-log.repository';
import { CreatePaymentDto, MockCmiProcessDto } from './dto/create-payment.dto';
import { PaymentMethod, PaymentStatus, Prisma } from '@doctors-morocco/db';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogRepository,
  ) {}

  private generateReceiptNumber(): string {
    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `REC-${year}-${randomHex}`;
  }

  async create(
    dto: CreatePaymentDto,
    clinicId: string,
    userId: string,
  ): Promise<any> {
    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0 MAD.');
    }

    const receiptNumber = this.generateReceiptNumber();

    const payment = await this.prisma.paymentTransaction.create({
      data: {
        clinic_id: clinicId,
        patient_id: dto.patient_id || null,
        appointment_id: dto.appointment_id || null,
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency || 'MAD',
        method: dto.method as PaymentMethod,
        status: (dto.status as PaymentStatus) || PaymentStatus.completed,
        receipt_number: receiptNumber,
        cmi_transaction_id: dto.cmi_transaction_id || null,
        notes: dto.notes || null,
        created_by: userId,
      },
      include: {
        patient: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        recorded_by: {
          select: {
            id: true,
            full_name: true,
            role: true,
          },
        },
      },
    });

    await this.auditLog.log({
      action: 'create',
      entity_type: 'PaymentTransaction',
      entity_id: payment.id,
      clinic_id: clinicId,
      user_id: userId,
      metadata: {
        amount: dto.amount,
        method: dto.method,
        receipt_number: receiptNumber,
      },
    });

    return payment;
  }

  async processMockCmi(
    dto: MockCmiProcessDto,
    clinicId: string,
    userId: string,
  ): Promise<any> {
    // Validate mock Moroccan CMI 3D-Secure OTP
    if (!dto.otp_code || dto.otp_code.trim().length < 4) {
      throw new BadRequestException('Code de confirmation CMI 3D-Secure invalide.');
    }

    const cmiTxId = `CMI-MA-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    return this.create(
      {
        patient_id: dto.patient_id,
        appointment_id: dto.appointment_id,
        amount: dto.amount,
        currency: 'MAD',
        method: 'cmi_card',
        status: 'completed',
        notes: `Règlement Carte Bancaire CMI (Porteur: ${dto.card_holder}). Auth code: ${Math.floor(100000 + Math.random() * 900000)}`,
        cmi_transaction_id: cmiTxId,
      },
      clinicId,
      userId,
    );
  }

  async findAll(clinicId: string, method?: string): Promise<any> {
    return this.prisma.paymentTransaction.findMany({
      where: {
        clinic_id: clinicId,
        ...(method ? { method: method as PaymentMethod } : {}),
      },
      include: {
        patient: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        recorded_by: {
          select: {
            id: true,
            full_name: true,
            role: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
  }

  async getDailySummary(clinicId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const transactions = await this.prisma.paymentTransaction.findMany({
      where: {
        clinic_id: clinicId,
        status: PaymentStatus.completed,
        created_at: { gte: today },
      },
    });

    let totalCash = 0;
    let totalCmi = 0;
    let totalCheck = 0;
    let totalTransfer = 0;

    for (const tx of transactions) {
      const amt = Number(tx.amount);
      if (tx.method === PaymentMethod.cash) totalCash += amt;
      else if (tx.method === PaymentMethod.cmi_card) totalCmi += amt;
      else if (tx.method === PaymentMethod.cheque) totalCheck += amt;
      else if (tx.method === PaymentMethod.virement) totalTransfer += amt;
    }

    return {
      date: today.toISOString().split('T')[0],
      currency: 'MAD',
      total_count: transactions.length,
      cash_total: totalCash,
      cmi_card_total: totalCmi,
      cheque_total: totalCheck,
      virement_total: totalTransfer,
      grand_total: totalCash + totalCmi + totalCheck + totalTransfer,
    };
  }
}
