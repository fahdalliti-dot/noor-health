-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other', 'unknown');

-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A_positive', 'A_negative', 'B_positive', 'B_negative', 'AB_positive', 'AB_negative', 'O_positive', 'O_negative', 'unknown');

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "file_number" INTEGER NOT NULL DEFAULT 0,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "cin" TEXT,
    "cin_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientMedicalProfile" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "height_cm" INTEGER,
    "weight_kg" DOUBLE PRECISION,
    "blood_type" "BloodType",
    "allergies" JSONB,
    "chronic_conditions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "PatientMedicalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Patient_clinic_id_first_name_last_name_idx" ON "Patient"("clinic_id", "first_name", "last_name");

-- CreateIndex
CREATE INDEX "Patient_clinic_id_deleted_at_idx" ON "Patient"("clinic_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_clinic_id_file_number_key" ON "Patient"("clinic_id", "file_number");

-- CreateIndex
CREATE UNIQUE INDEX "PatientMedicalProfile_patient_id_key" ON "PatientMedicalProfile"("patient_id");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientMedicalProfile" ADD CONSTRAINT "PatientMedicalProfile_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================
-- Row-Level Security (RLS) for Slice 2 tables
-- ============================================
-- Same pattern as initial migration: clinic_id-based isolation via app.clinic_id session var.

ALTER TABLE "Patient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PatientMedicalProfile" ENABLE ROW LEVEL SECURITY;

-- Patient: belongs to current clinic (same as other tenant tables)
CREATE POLICY "Patient_all" ON "Patient"
  FOR ALL
  USING (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid)
  WITH CHECK (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid);

-- PatientMedicalProfile: isolation via join to Patient's clinic_id
CREATE POLICY "PatientMedicalProfile_read" ON "PatientMedicalProfile"
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

-- Grants (consistent with initial migration)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "Patient", "PatientMedicalProfile" TO saas_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO saas_app;
