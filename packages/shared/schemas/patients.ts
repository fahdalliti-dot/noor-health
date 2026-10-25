import { z } from 'zod';

// =====================
// Enums — mirrored to Prisma
// =====================

export const GenderSchema = z.enum(['male', 'female', 'other', 'unknown']);
export type Gender = z.infer<typeof GenderSchema>;

export const BloodTypeSchema = z.enum([
  'A_positive',
  'A_negative',
  'B_positive',
  'B_negative',
  'AB_positive',
  'AB_negative',
  'O_positive',
  'O_negative',
  'unknown',
]);
export type BloodType = z.infer<typeof BloodTypeSchema>;

// =====================
// Patient Identity DTOs
// =====================

export const CreatePatientSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  birth_date: z.string().date(),
  gender: GenderSchema,
  phone: z.string().max(20).optional(),
  email: z.string().email().max(254).optional(),
  address: z.string().max(500).optional(),
  emergency_contact_name: z.string().max(100).optional(),
  emergency_contact_phone: z.string().max(20).optional(),
  cin: z.string().length(8).optional(), // CIN/JINC: 8 digits (Morocco)
});

export type CreatePatientDto = z.infer<typeof CreatePatientSchema>;

export const UpdatePatientSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  birth_date: z.string().date().optional(),
  gender: GenderSchema.optional(),
  phone: z.string().max(20).nullish(),
  email: z.string().email().max(254).nullish(),
  address: z.string().max(500).nullish(),
  emergency_contact_name: z.string().max(100).nullish(),
  emergency_contact_phone: z.string().max(20).nullish(),
  cin: z.string().length(8).nullish(),
  deleted_at: z.string().datetime().nullish(),
});

export type UpdatePatientDto = z.infer<typeof UpdatePatientSchema>;

// =====================
// Patient Medical Profile DTOs
// =====================

export const CreatePatientMedicalProfileSchema = z.object({
  height_cm: z.number().int().min(30).max(300).optional(),
  weight_kg: z.number().min(1).max(500).optional(),
  blood_type: BloodTypeSchema.optional(),
  allergies: z.array(z.string().max(200)).optional(),
  chronic_conditions: z.array(z.string().max(500)).optional(),
});

export type CreatePatientMedicalProfileDto = z.infer<typeof CreatePatientMedicalProfileSchema>;

export const UpdatePatientMedicalProfileSchema = z.object({
  height_cm: z.number().int().min(30).max(300).nullish(),
  weight_kg: z.number().min(1).max(500).nullish(),
  blood_type: BloodTypeSchema.nullish(),
  allergies: z.array(z.string().max(200)).nullish(),
  chronic_conditions: z.array(z.string().max(500)).nullish(),
});

export type UpdatePatientMedicalProfileDto = z.infer<typeof UpdatePatientMedicalProfileSchema>;

// =====================
// Search DTOs
// =====================

export const SearchPatientsSchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(100).default(20),
});

export type SearchPatientsDto = z.infer<typeof SearchPatientsSchema>;

// =====================
// Response DTOs
// =====================

export const PatientResponseSchema = z.object({
  id: z.string().uuid(),
  clinic_id: z.string().uuid(),
  file_number: z.number().int().positive(),
  first_name: z.string(),
  last_name: z.string(),
  birth_date: z.string().date(),
  gender: GenderSchema,
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  emergency_contact_name: z.string().nullable().optional(),
  emergency_contact_phone: z.string().nullable().optional(),
  has_medical_profile: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
});

export type PatientResponse = z.infer<typeof PatientResponseSchema>;

export const PatientWithMedicalProfileResponseSchema = PatientResponseSchema.extend({
  medical_profile: z
    .object({
      height_cm: z.number().int().nullable().optional(),
      weight_kg: z.number().nullable().optional(),
      blood_type: BloodTypeSchema.nullable().optional(),
      allergies: z.array(z.string()).nullable().optional(),
      chronic_conditions: z.array(z.string()).nullable().optional(),
      created_at: z.string().datetime(),
      updated_at: z.string().datetime(),
      deleted_at: z.string().datetime().nullable(),
    })
    .nullable(),
});

export type PatientWithMedicalProfileResponse = z.infer<typeof PatientWithMedicalProfileResponseSchema>;
