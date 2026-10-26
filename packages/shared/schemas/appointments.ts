import { z } from 'zod';

// =====================
// Enums — mirrored to Prisma + shared
// =====================

export const AppointmentStatusSchema = z.enum([
  'scheduled',
  'confirmed',
  'arrived',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
]);
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

export const AppointmentSourceSchema = z.enum(['staff', 'online']);
export type AppointmentSource = z.infer<typeof AppointmentSourceSchema>;

// =====================
// Core DTOs
// =====================

export const CreateAppointmentSchema = z.object({
  patient_id: z.string().uuid(), // required non-nullable FK to Patient (Slice 2 follow-up)
  doctor_id: z.string().uuid(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  reason: z.string().max(500).nullish(),
  source: AppointmentSourceSchema.default('staff'),
  idempotency_key: z.string().uuid().optional(),
});

export type CreateAppointmentDto = z.infer<typeof CreateAppointmentSchema>;

export const UpdateAppointmentSchema = z.object({
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
  reason: z.string().max(500).nullish(),
  doctor_id: z.string().uuid().optional(), // reschedule with a different doctor
});

export type UpdateAppointmentDto = z.infer<typeof UpdateAppointmentSchema>;

export const ChangeAppointmentStatusSchema = z.object({
  status: AppointmentStatusSchema,
  cancel_reason: z.string().max(500).nullish(),
});

export type ChangeAppointmentStatusDto = z.infer<typeof ChangeAppointmentStatusSchema>;

// =====================
// Availability DTOs
// =====================

export const GetAvailabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  slot_length: z.number().int().min(5).max(120).default(30),
});

export type GetAvailabilityDto = z.infer<typeof GetAvailabilitySchema>;

// =====================
// Working Hours DTOs
// =====================

export const CreateWorkingHoursSchema = z.object({
  doctor_id: z.string().uuid(),
  weekday: z.number().int().min(0).max(6), // 0=Monday .. 6=Sunday
  start_minutes: z.number().int().min(0).max(1439),
  end_minutes: z.number().int().min(0).max(1439),
  slot_length_minutes: z.number().int().min(5).max(120).default(30),
  is_active: z.boolean().default(true),
});

export type CreateWorkingHoursDto = z.infer<typeof CreateWorkingHoursSchema>;

export const UpdateWorkingHoursSchema = z.object({
  start_minutes: z.number().int().min(0).max(1439).optional(),
  end_minutes: z.number().int().min(0).max(1439).optional(),
  slot_length_minutes: z.number().int().min(5).max(120).optional(),
  is_active: z.boolean().optional(),
});

export type UpdateWorkingHoursDto = z.infer<typeof UpdateWorkingHoursSchema>;

// =====================
// Time Off DTOs
// =====================

export const CreateTimeOffSchema = z.object({
  doctor_id: z.string().uuid(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  reason: z.string().max(500).nullish(),
});

export type CreateTimeOffDto = z.infer<typeof CreateTimeOffSchema>;
