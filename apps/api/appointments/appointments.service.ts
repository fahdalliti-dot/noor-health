import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { AuditLogRepository } from '../audit/audit-log.repository';
import { User } from '@doctors-morocco/db';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  ChangeAppointmentStatusDto,
  AppointmentStatus,
} from '@shared/utils';

// Terminal statuses — no further transitions allowed.
const TERMINAL_STATUSES = new Set<AppointmentStatus>([
  'completed',
  'cancelled',
  'no_show',
]);

// Valid state transitions keyed by current status.
const VALID_TRANSITIONS: Record<string, Set<AppointmentStatus>> = {
  scheduled: new Set(['confirmed', 'cancelled', 'no_show']),
  confirmed: new Set(['arrived', 'cancelled', 'no_show']),
  arrived: new Set(['in_progress', 'cancelled', 'no_show']),
  in_progress: new Set(['completed']),
  // Terminal — no outgoing transitions.
  completed: new Set(),
  cancelled: new Set(),
  no_show: new Set(),
};

// Roles that can transition from one status to another.
// Each transition maps to the minimum role required.
// 'self' means the doctor who owns the appointment.
// 'any' means a secretary can do it for any appointment in the clinic.
const STATUS_TRANSITION_ROLES: Record<
  string,
  { to: AppointmentStatus; allowed_for: 'doctor' | 'secretary' | 'admin' }[]
> = {
  scheduled: [
    { to: 'confirmed', allowed_for: 'secretary' },
    { to: 'cancelled', allowed_for: 'secretary' },
    { to: 'no_show', allowed_for: 'secretary' },
  ],
  confirmed: [
    { to: 'arrived', allowed_for: 'secretary' },
    { to: 'cancelled', allowed_for: 'secretary' },
    { to: 'no_show', allowed_for: 'secretary' },
  ],
  arrived: [
    { to: 'in_progress', allowed_for: 'doctor' },
    { to: 'cancelled', allowed_for: 'secretary' },
    { to: 'no_show', allowed_for: 'secretary' },
  ],
  in_progress: [
    { to: 'completed', allowed_for: 'doctor' },
  ],
};

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogRepository,
  ) {}

  /**
   * List appointments for a clinic within a date range.
   * Doctors see only their own appointments; secretaries see all in clinic.
   */
  async list(params: {
    clinicId: string;
    userId: string;
    userRole: string;
    from?: string;
    to?: string;
    doctorId?: string;
    status?: AppointmentStatus;
  }): Promise<any[]> {
    const { clinicId, userId, userRole, from, to, doctorId, status } = params;

    // RLS ensures only clinic-scoped rows are returned.
    const where: any = {
      clinic_id: clinicId,
    };

    if (userRole === 'doctor') {
      where.doctor_id = userId;
    }

    if (doctorId) {
      // Only admins and secretaries can query by doctor_id.
      if (userRole === 'doctor' && doctorId !== userId) {
        throw new ForbiddenException('Doctors can only view their own appointments.');
      }
      where.doctor_id = doctorId;
    }

    if (status) {
      where.status = status;
    }

    if (from || to) {
      const range: any = {};
      if (from) range.gte = new Date(from);
      if (to) range.lte = new Date(to);
      where.starts_at = range;
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      orderBy: { starts_at: 'asc' },
      include: {
        doctor: { select: { id: true, full_name: true } },
      },
    });

    // Audit: list query logged once, no contents
    await this.auditLog.log({
      action: 'appointment_list',
      clinic_id: clinicId,
      user_id: userId,
      metadata: { filter: { doctor_id: doctorId, status } },
    });

    return appointments;
  }

  /**
   * Create a new appointment. Throws 409 if it overlaps an active appointment for the same doctor.
   */
  async create(
    dto: CreateAppointmentDto,
    clinicId: string,
    userId: string,
    userRole: string,
  ): Promise<any> {
    const { doctor_id, starts_at, ends_at, reason, source, patient_id } = dto;

    // Validate the doctor belongs to this clinic.
    const doctor = await this.prisma.user.findFirst({
      where: { id: doctor_id, clinic_id: clinicId, role: 'doctor' },
    });
    if (!doctor) {
      throw new BadRequestException('Doctor does not belong to this clinic.');
    }

    // Only secretaries can create appointments for other doctors.
    if (userRole === 'doctor' && doctor_id !== userId) {
      throw new ForbiddenException('Doctors can only create appointments for themselves.');
    }

    const startsAt = new Date(starts_at);
    const endsAt = new Date(ends_at);
    if (endsAt <= startsAt) {
      throw new BadRequestException('ends_at must be after starts_at.');
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        clinic_id: clinicId,
        patient_id: patient_id ?? null,
        doctor_id,
        starts_at: startsAt,
        ends_at: endsAt,
        reason,
        source,
        created_by: userId,
      },
    });

    // Audit: create (field names only, never values)
    await this.auditLog.log({
      action: 'create',
      entity_type: 'appointment',
      entity_id: appointment.id,
      clinic_id: clinicId,
      user_id: userId,
      metadata: { fields: ['doctor_id', 'starts_at', 'ends_at', 'reason', 'source'] },
    });

    return appointment;
  }

  /**
   * Update an appointment (reschedule, change reason).
   * Uses optimistic concurrency via If-Match with updated_at timestamp.
   * Throws 409 if the new slot overlaps an existing appointment.
   */
  async update(
    id: string,
    dto: UpdateAppointmentDto,
    clinicId: string,
    userId: string,
    userRole: string,
    ifMatch?: string,
  ): Promise<any> {
    const existing = await this.prisma.appointment.findUnique({
      where: { id },
      include: { doctor: { select: { id: true, full_name: true } } },
    });

    if (!existing) {
      throw new NotFoundException('Appointment not found.');
    }

    if (existing.clinic_id !== clinicId) {
      throw new ForbiddenException('Access denied: this appointment belongs to another clinic.');
    }

    // Permission: doctors can only manage their own appointments.
    if (userRole === 'doctor' && existing.doctor_id !== userId) {
      throw new ForbiddenException('Doctors can only modify their own appointments.');
    }

    // Optimistic concurrency — If-Match with the updated_at timestamp.
    if (ifMatch) {
      const expectedTs = ifMatch.replace(/"/g, '');
      if (existing.updated_at.toISOString() !== expectedTs) {
        throw new ConflictException('Stale data — appointment was modified by another user.');
      }
    }

    // Validate doctor belongs to clinic if rescheduling to a different doctor.
    if (dto.doctor_id && dto.doctor_id !== existing.doctor_id) {
      if (userRole === 'doctor') {
        throw new ForbiddenException('Doctors can only reschedule their own appointments.');
      }
      const newDoctor = await this.prisma.user.findFirst({
        where: { id: dto.doctor_id, clinic_id: clinicId, role: 'doctor' },
      });
      if (!newDoctor) {
        throw new BadRequestException('Doctor does not belong to this clinic.');
      }
    }

    const updateData: any = {};
    const updatedFields: string[] = [];

    if (dto.starts_at) {
      updateData.starts_at = new Date(dto.starts_at);
      updatedFields.push('starts_at');
    }
    if (dto.ends_at) {
      updateData.ends_at = new Date(dto.ends_at);
      updatedFields.push('ends_at');
    }
    if (dto.reason !== undefined) {
      updateData.reason = dto.reason;
      updatedFields.push('reason');
    }
    if (dto.doctor_id) {
      updateData.doctor_id = dto.doctor_id;
      updatedFields.push('doctor_id');
    }

    // The exclusion constraint in the DB will reject overlapping active appointments.
    // We catch that error in the exception filter and map to 409.
    try {
      const updated = await this.prisma.appointment.update({
        where: { id },
        data: updateData,
        include: { doctor: { select: { id: true, full_name: true } } },
      });

      await this.auditLog.log({
        action: 'update',
        entity_type: 'appointment',
        entity_id: id,
        clinic_id: clinicId,
        user_id: userId,
        metadata: { fields: updatedFields },
      });

      return updated;
    } catch (e: any) {
      if (e.code === 'P2002' || e.cause?.code === '23P01' || e.message?.includes('exclusion')) {
        throw new ConflictException({
          code: 'slot_unavailable',
          message: 'The selected time slot is unavailable.',
        });
      }
      throw e;
    }
  }

  /**
   * Change the status of an appointment.
   * Validates the state machine, timing constraints, and role permissions.
   * Throws 409 on illegal transitions or terminal states.
   */
  async changeStatus(
    id: string,
    dto: ChangeAppointmentStatusDto,
    clinicId: string,
    user: User,
  ): Promise<any> {
    const { status, cancel_reason } = dto;

    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { doctor: { select: { id: true, full_name: true } } },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found.');
    }

    if (appointment.clinic_id !== clinicId) {
      throw new ForbiddenException('Access denied.');
    }

    // Check for terminal state.
    if (TERMINAL_STATUSES.has(appointment.status as AppointmentStatus)) {
      throw new ConflictException('Cannot transition from a terminal status.');
    }

    // Validate the transition is allowed.
    const allowed = VALID_TRANSITIONS[appointment.status as string];
    if (!allowed || !allowed.has(status)) {
      throw new ConflictException(
        `Invalid transition from ${appointment.status} to ${status}.`,
      );
    }

    // Check role permissions.
    const transitionRules = STATUS_TRANSITION_ROLES[appointment.status as string] || [];
    const rule = transitionRules.find((r) => r.to === status);
    if (!rule) {
      throw new ConflictException(
        `No role is permitted to transition from ${appointment.status} to ${status}.`,
      );
    }

    const userRole = user.role as 'doctor' | 'secretary' | 'admin';
    if (userRole === 'doctor') {
      // Doctors can only transition their own appointments, regardless of
      // which transitions are secretary-permitted.
      if (appointment.doctor_id !== user.id) {
        throw new ForbiddenException('Doctors can only transition their own appointments.');
      }
    }
    if (rule.allowed_for === 'doctor' && userRole !== 'doctor') {
      throw new ForbiddenException('Only the assigned doctor can perform this transition.');
    }
    // Secretaries can do any transition with allowed_for: 'secretary'.
    // Admins are not permitted to perform appointment status changes (per 04-api.md).

    // Timing constraints.
    const now = new Date();
    if ((status === 'no_show' || status === 'arrived') && appointment.starts_at > now) {
      throw new ConflictException(
        `Cannot set status to ${status} before the appointment start time.`,
      );
    }

    const updateData: any = { status };
    if (status === 'cancelled') {
      updateData.cancelled_at = now;
      if (cancel_reason) updateData.cancel_reason = cancel_reason;
    }

    // For no_show, also update cancel fields for audit trail consistency.
    if (status === 'no_show') {
      updateData.cancelled_at = now;
      if (cancel_reason) updateData.cancel_reason = cancel_reason;
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: updateData,
    });

    await this.auditLog.log({
      action: 'update',
      entity_type: 'appointment',
      entity_id: id,
      clinic_id: clinicId,
      user_id: user.id,
      metadata: {
        fields: ['status', ...(cancel_reason ? ['cancel_reason'] : [])],
        from_status: appointment.status,
        to_status: status,
      },
    });

    return updated;
  }

  /**
   * Get a single appointment by ID (with permission check).
   */
  async findById(
    id: string,
    clinicId: string,
    userId: string,
    userRole: string,
  ): Promise<any> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: { select: { id: true, full_name: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found.');
    }

    if (appointment.clinic_id !== clinicId) {
      throw new ForbiddenException('Access denied.');
    }

    // Doctors can only see their own appointments.
    if (userRole === 'doctor' && appointment.doctor_id !== userId) {
      throw new ForbiddenException('Access denied.');
    }

    await this.auditLog.log({
      action: 'read',
      entity_type: 'appointment',
      entity_id: id,
      clinic_id: clinicId,
      user_id: userId,
      metadata: {},
    });

    return appointment;
  }
}
