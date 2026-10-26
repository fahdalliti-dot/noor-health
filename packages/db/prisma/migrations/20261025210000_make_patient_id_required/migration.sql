-- Make Appointment.patient_id non-nullable FK to Patient
-- Prerequisite: every Appointment must reference a Patient.
-- Slice 2 (patients) is complete, so appointments can now be linked to a patient.

-- 1. Drop the existing nullable FK constraint (created in add_patient_tables migration)
ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_patient_id_fkey";

-- 2. Backfill any NULL patient_id rows with a placeholder patient for the demo clinic
--    (Seed data must be updated to set real patient_id; this is a safety net only.)
--    No-op here because seed is run after this migration and sets patient_id explicitly.

-- 3. Make the column NOT NULL
ALTER TABLE "Appointment" ALTER COLUMN "patient_id" SET NOT NULL;

-- 4. Re-add the FK constraint (ON DELETE RESTRICT: a patient with appointments
--    cannot be hard-deleted; soft delete via deleted_at is the supported path)
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patient_id_fkey"
  FOREIGN KEY ("patient_id") REFERENCES "Patient"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
