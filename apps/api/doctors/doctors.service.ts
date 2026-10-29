import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { AuditLogRepository } from '../audit/audit-log.repository';
import {
  CreateWorkingHoursDto,
  UpdateWorkingHoursDto,
  CreateTimeOffDto,
  GetAvailabilityDto,
} from '@shared/utils';
import { DateTime } from 'luxon';

// Working day boundary offsets (in minutes from midnight).
const MINUTES_PER_DAY = 1440;

@Injectable()
export class DoctorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogRepository,
  ) {}

  // =====================
  // Working Hours CRUD
  // =====================

  async createWorkingHours(
    dto: CreateWorkingHoursDto,
    clinicId: string,
    userId: string,
    userRole: string,
  ): Promise<any> {
    const { doctor_id, weekday, start_minutes, end_minutes } = dto;

    // Validate doctor belongs to the clinic and is a doctor.
    const doctor = await this.prisma.user.findFirst({
      where: { id: doctor_id, clinic_id: clinicId, role: 'doctor' },
    });
    if (!doctor) {
      throw new BadRequestException('Doctor does not belong to this clinic.');
    }

    // Permission: only the doctor themselves or admin can set hours.
    if (userRole === 'doctor' && doctor_id !== userId) {
      throw new ForbiddenException('Doctors can only set their own working hours.');
    }
    if (userRole === 'secretary') {
      throw new ForbiddenException('Secretaries cannot manage working hours.');
    }

    if (start_minutes >= end_minutes || start_minutes < 0 || end_minutes > MINUTES_PER_DAY) {
      throw new BadRequestException('Invalid working hours range.');
    }

    const wh = await this.prisma.doctorWorkingHours.create({
      data: {
        clinic_id: clinicId,
        doctor_id,
        weekday,
        start_minutes,
        end_minutes,
        slot_length_minutes: dto.slot_length_minutes,
        is_active: dto.is_active,
      },
    });

    await this.auditLog.log({
      action: 'create',
      entity_type: 'working_hours',
      entity_id: wh.id,
      clinic_id: clinicId,
      user_id: userId,
      metadata: { fields: ['doctor_id', 'weekday', 'start_minutes', 'end_minutes'] },
    });

    return wh;
  }

  async listWorkingHours(doctorId: string, clinicId: string): Promise<any[]> {
    const hours = await this.prisma.doctorWorkingHours.findMany({
      where: { clinic_id: clinicId, doctor_id: doctorId, is_active: true },
    });

    await this.auditLog.log({
      action: 'read',
      entity_type: 'working_hours',
      entity_id: doctorId,
      clinic_id: clinicId,
      user_id: undefined,
      metadata: {},
    });

    return hours;
  }

  async updateWorkingHours(
    doctorId: string,
    whId: string,
    dto: UpdateWorkingHoursDto,
    clinicId: string,
    userId: string,
    userRole: string,
  ): Promise<any> {
    const wh = await this.prisma.doctorWorkingHours.findUnique({
      where: { id: whId },
    });

    if (!wh) {
      throw new NotFoundException('Working hours not found.');
    }

    if (wh.clinic_id !== clinicId) {
      throw new ForbiddenException('Access denied.');
    }

    // Permission: doctor can edit own, admin can edit any, secretary blocked.
    if (userRole === 'doctor' && wh.doctor_id !== userId) {
      throw new ForbiddenException('Doctors can only edit their own working hours.');
    }
    if (userRole === 'secretary') {
      throw new ForbiddenException('Secretaries cannot manage working hours.');
    }

    const updateData: any = {};
    if (dto.start_minutes !== undefined) updateData.start_minutes = dto.start_minutes;
    if (dto.end_minutes !== undefined) updateData.end_minutes = dto.end_minutes;
    if (dto.slot_length_minutes !== undefined) {
      updateData.slot_length_minutes = dto.slot_length_minutes;
    }
    if (dto.is_active !== undefined) updateData.is_active = dto.is_active;

    const updated = await this.prisma.doctorWorkingHours.update({
      where: { id: whId },
      data: updateData,
    });

    await this.auditLog.log({
      action: 'update',
      entity_type: 'working_hours',
      entity_id: whId,
      clinic_id: clinicId,
      user_id: userId,
      metadata: { fields: Object.keys(dto).filter((k) => dto[k as keyof typeof dto] !== undefined) },
    });

    return updated;
  }

  async deleteWorkingHours(
    whId: string,
    clinicId: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    const wh = await this.prisma.doctorWorkingHours.findUnique({
      where: { id: whId },
    });

    if (!wh) {
      throw new NotFoundException('Working hours not found.');
    }

    if (wh.clinic_id !== clinicId) {
      throw new ForbiddenException('Access denied.');
    }

    if (userRole === 'doctor' && wh.doctor_id !== userId) {
      throw new ForbiddenException('Doctors can only edit their own working hours.');
    }
    if (userRole === 'secretary') {
      throw new ForbiddenException('Secretaries cannot manage working hours.');
    }

    await this.prisma.doctorWorkingHours.delete({ where: { id: whId } });

    await this.auditLog.log({
      action: 'delete',
      entity_type: 'working_hours',
      entity_id: whId,
      clinic_id: clinicId,
      user_id: userId,
      metadata: {},
    });
  }

  // =====================
  // Time Off CRUD
  // =====================

  async createTimeOff(
    dto: CreateTimeOffDto,
    clinicId: string,
    userId: string,
    userRole: string,
  ): Promise<any> {
    const { doctor_id, start_at, end_at, reason } = dto;

    const doctor = await this.prisma.user.findFirst({
      where: { id: doctor_id, clinic_id: clinicId, role: 'doctor' },
    });
    if (!doctor) {
      throw new BadRequestException('Doctor does not belong to this clinic.');
    }

    if (userRole === 'doctor' && doctor_id !== userId) {
      throw new ForbiddenException('Doctors can only set their own time off.');
    }
    if (userRole === 'secretary') {
      throw new ForbiddenException('Secretaries cannot manage time off.');
    }

    const startAt = new Date(start_at);
    const endAt = new Date(end_at);
    if (endAt <= startAt) {
      throw new BadRequestException('end_at must be after start_at.');
    }

    const to = await this.prisma.doctorTimeOff.create({
      data: {
        clinic_id: clinicId,
        doctor_id,
        start_at: startAt,
        end_at: endAt,
        reason,
      },
    });

    await this.auditLog.log({
      action: 'create',
      entity_type: 'time_off',
      entity_id: to.id,
      clinic_id: clinicId,
      user_id: userId,
      metadata: { fields: ['doctor_id', 'start_at', 'end_at'] },
    });

    return to;
  }

  async listTimeOff(doctorId: string, clinicId: string): Promise<any[]> {
    return this.prisma.doctorTimeOff.findMany({
      where: { clinic_id: clinicId, doctor_id: doctorId },
      orderBy: { start_at: 'asc' },
    });
  }

  async deleteTimeOff(
    toId: string,
    clinicId: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    const to = await this.prisma.doctorTimeOff.findUnique({
      where: { id: toId },
    });

    if (!to) {
      throw new NotFoundException('Time off not found.');
    }

    if (to.clinic_id !== clinicId) {
      throw new ForbiddenException('Access denied.');
    }

    if (userRole === 'doctor' && to.doctor_id !== userId) {
      throw new ForbiddenException('Doctors can only edit their own time off.');
    }
    if (userRole === 'secretary') {
      throw new ForbiddenException('Secretaries cannot manage time off.');
    }

    await this.prisma.doctorTimeOff.delete({ where: { id: toId } });

    await this.auditLog.log({
      action: 'delete',
      entity_type: 'time_off',
      entity_id: toId,
      clinic_id: clinicId,
      user_id: userId,
      metadata: {},
    });
  }

  // =====================
  // Availability
  // =====================

  /**
   * Compute free slots for a doctor on a given date.
   *
   * Algorithm:
   * 1. Resolve day boundaries in the clinic timezone.
   * 2. Get working hours for that weekday.
   * 3. Convert working hours to timestamptz ranges.
   * 4. Subtract time-off ranges.
   * 5. Subtract existing active-status appointments.
   * 6. Split remaining free ranges into slot-length slots.
   */
  async getAvailability(
    doctorId: string,
    dto: GetAvailabilityDto,
    clinicId: string,
  ): Promise<any> {
    const { date, slot_length } = dto;

    // Validate doctor belongs to clinic.
    const doctor = await this.prisma.user.findFirst({
      where: { id: doctorId, clinic_id: clinicId, role: 'doctor' },
    });
    if (!doctor) {
      throw new BadRequestException('Doctor does not belong to this clinic.');
    }

    // Get clinic timezone (default Africa/Casablanca).
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { timezone: true },
    });
    const tz = clinic?.timezone || 'Africa/Casablanca';

    // Parse the requested date in the clinic timezone.
    const dayStart = DateTime.fromFormat(date, 'yyyy-MM-dd', { zone: tz })
      .startOf('day');
    const dayEnd = dayStart.plus({ days: 1 });

    // Determine weekday (0=Monday per decision 8, DateTime uses 1=Monday..7=Sunday
    // so we normalize: Monday=1 → 0, Tuesday=2 → 1, ... Sunday=7 → 6).
    const weekday = dayStart.weekday === 7 ? 6 : dayStart.weekday - 1;

    // 1. Get working hours for the requested weekday.
    const workingHoursList = await this.prisma.doctorWorkingHours.findMany({
      where: {
        clinic_id: clinicId,
        doctor_id: doctorId,
        weekday,
        is_active: true,
      },
    });

    if (workingHoursList.length === 0) {
      return { slots: [], date, timezone: tz };
    }

    // 2. Build working time ranges as UTC Date objects.
    const workingRanges: { start: Date; end: Date }[] = workingHoursList.map((wh) => ({
      start: dayStart.plus({ minutes: wh.start_minutes }).toJSDate(),
      end: dayStart.plus({ minutes: wh.end_minutes }).toJSDate(),
    }));

    // 3. Get time-off ranges that overlap the requested day.
    const timeOff = await this.prisma.doctorTimeOff.findMany({
      where: {
        clinic_id: clinicId,
        doctor_id: doctorId,
        OR: [
          { start_at: { lt: dayEnd.toJSDate(), gte: dayStart.toJSDate() } },
          { end_at: { gt: dayStart.toJSDate(), lte: dayEnd.toJSDate() } },
          {
            AND: [
              { start_at: { lte: dayStart.toJSDate() } },
              { end_at: { gte: dayEnd.toJSDate() } },
            ],
          },
        ],
      },
    });

    const blockedRanges: { start: Date; end: Date }[] = timeOff.map((to) => ({
      start: to.start_at,
      end: to.end_at,
    }));

    // 4. Get existing active-status appointments on that day.
    const appointments = await this.prisma.appointment.findMany({
      where: {
        clinic_id: clinicId,
        doctor_id: doctorId,
        starts_at: {
          gte: dayStart.toJSDate(),
          lt: dayEnd.toJSDate(),
        },
        status: {
          in: ['scheduled', 'confirmed', 'arrived', 'in_progress'] as const,
        },
      },
      select: {
        starts_at: true,
        ends_at: true,
      },
    });

    for (const appt of appointments) {
      blockedRanges.push({ start: appt.starts_at, end: appt.ends_at });
    }

    // 5. Subtract blocked ranges from working ranges.
    // Sort ranges for easier processing.
    blockedRanges.sort((a, b) => a.start.getTime() - b.start.getTime());

    let freeRanges = [...workingRanges];
    for (const blocked of blockedRanges) {
      const newRanges: { start: Date; end: Date }[] = [];
      for (const range of freeRanges) {
        if (blocked.end <= range.start || blocked.start >= range.end) {
          // No overlap
          newRanges.push(range);
        } else {
          // Overlap — subtract
          if (blocked.start > range.start) {
            newRanges.push({ start: range.start, end: blocked.start });
          }
          if (blocked.end < range.end) {
            newRanges.push({ start: blocked.end, end: range.end });
          }
        }
      }
      freeRanges = newRanges;
    }

    // 6. Split free ranges into slot-length slots.
    const slotMinutes = slot_length || 30;
    const slots: { start: string; end: string; available: boolean }[] = [];

    for (const range of freeRanges) {
      let slotStart = DateTime.fromJSDate(range.start, { zone: tz });
      const rangeEnd = DateTime.fromJSDate(range.end, { zone: tz });

      while (slotStart.plus({ minutes: slotMinutes }) <= rangeEnd) {
        const slotEnd = slotStart.plus({ minutes: slotMinutes });
        slots.push({
          start: slotStart.toISO()!,
          end: slotEnd.toISO()!,
          available: true,
        });
        slotStart = slotEnd;
      }
    }

    return {
      slots,
      date,
      timezone: tz,
    };
  }
}
