-- Apply RLS + grants to Patient and PatientMedicalProfile tables
-- (These were applied manually to saas_dev after `prisma migrate dev` generated
-- the base DDL. This file documents the SQL for fresh database setups.)

\set ON_ERROR_STOP on

-- Enable RLS
ALTER TABLE "Patient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PatientMedicalProfile" ENABLE ROW LEVEL SECURITY;

-- Patient policy: belongs to current clinic
CREATE POLICY "Patient_all" ON "Patient"
  FOR ALL
  USING (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid)
  WITH CHECK (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid);

-- PatientMedicalProfile policy: isolation via Patient join
CREATE POLICY "PatientMedicalProfile_all" ON "PatientMedicalProfile"
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM "Patient" p
    WHERE p.id::uuid = "PatientMedicalProfile"."patient_id"::uuid
    AND p.clinic_id::uuid = current_setting('app.clinic_id', true)::uuid
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Patient" p
    WHERE p.id::uuid = "PatientMedicalProfile"."patient_id"::uuid
    AND p.clinic_id::uuid = current_setting('app.clinic_id', true)::uuid
  ));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "Patient", "PatientMedicalProfile" TO saas_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO saas_app;
