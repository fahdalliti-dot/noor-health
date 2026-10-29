-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('aptitude', 'arret_travail', 'coups_et_blessures', 'prolonge_arret');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'cmi_card', 'virement', 'cheque');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('completed', 'pending', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "InventoryCategory" AS ENUM ('consumable', 'medication', 'equipment', 'office');

-- CreateEnum
CREATE TYPE "InventoryAction" AS ENUM ('restock', 'usage', 'waste', 'adjustment');

-- CreateTable Prescription
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "prescription_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diagnosis" TEXT,
    "notes" TEXT,
    "qr_code_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable PrescriptionItem
CREATE TABLE "PrescriptionItem" (
    "id" TEXT NOT NULL,
    "prescription_id" TEXT NOT NULL,
    "medication_name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable MedicalCertificate
CREATE TABLE "MedicalCertificate" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "type" "CertificateType" NOT NULL DEFAULT 'aptitude',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "itt_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable PaymentTransaction
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "patient_id" TEXT,
    "appointment_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "method" "PaymentMethod" NOT NULL DEFAULT 'cash',
    "status" "PaymentStatus" NOT NULL DEFAULT 'completed',
    "receipt_number" TEXT NOT NULL,
    "cmi_transaction_id" TEXT,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable InventoryItem
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "InventoryCategory" NOT NULL DEFAULT 'consumable',
    "sku" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "min_threshold" INTEGER NOT NULL DEFAULT 5,
    "unit" TEXT NOT NULL DEFAULT 'unité',
    "unit_cost" DECIMAL(10,2),
    "supplier" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable InventoryLog
CREATE TABLE "InventoryLog" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "action" "InventoryAction" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "actor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Prescription_clinic_id_patient_id_idx" ON "Prescription"("clinic_id", "patient_id");
CREATE INDEX "Prescription_clinic_id_doctor_id_idx" ON "Prescription"("clinic_id", "doctor_id");
CREATE INDEX "PrescriptionItem_prescription_id_idx" ON "PrescriptionItem"("prescription_id");

CREATE INDEX "MedicalCertificate_clinic_id_patient_id_idx" ON "MedicalCertificate"("clinic_id", "patient_id");
CREATE INDEX "MedicalCertificate_clinic_id_doctor_id_idx" ON "MedicalCertificate"("clinic_id", "doctor_id");

CREATE UNIQUE INDEX "PaymentTransaction_receipt_number_key" ON "PaymentTransaction"("receipt_number");
CREATE INDEX "PaymentTransaction_clinic_id_created_at_idx" ON "PaymentTransaction"("clinic_id", "created_at");
CREATE INDEX "PaymentTransaction_clinic_id_method_idx" ON "PaymentTransaction"("clinic_id", "method");

CREATE INDEX "InventoryItem_clinic_id_category_idx" ON "InventoryItem"("clinic_id", "category");
CREATE INDEX "InventoryItem_clinic_id_name_idx" ON "InventoryItem"("clinic_id", "name");
CREATE INDEX "InventoryLog_item_id_idx" ON "InventoryLog"("item_id");

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MedicalCertificate" ADD CONSTRAINT "MedicalCertificate_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MedicalCertificate" ADD CONSTRAINT "MedicalCertificate_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MedicalCertificate" ADD CONSTRAINT "MedicalCertificate_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InventoryLog" ADD CONSTRAINT "InventoryLog_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryLog" ADD CONSTRAINT "InventoryLog_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================
-- Row-Level Security (RLS) for New Tables
-- ============================================
ALTER TABLE "Prescription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PrescriptionItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MedicalCertificate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prescription_all" ON "Prescription"
  FOR ALL
  USING (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid)
  WITH CHECK (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid);

CREATE POLICY "PrescriptionItem_all" ON "PrescriptionItem"
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM "Prescription" p
    WHERE p.id::uuid = "PrescriptionItem"."prescription_id"::uuid
    AND p.clinic_id::uuid = current_setting('app.clinic_id', true)::uuid
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Prescription" p
    WHERE p.id::uuid = "PrescriptionItem"."prescription_id"::uuid
    AND p.clinic_id::uuid = current_setting('app.clinic_id', true)::uuid
  ));

CREATE POLICY "MedicalCertificate_all" ON "MedicalCertificate"
  FOR ALL
  USING (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid)
  WITH CHECK (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid);

CREATE POLICY "PaymentTransaction_all" ON "PaymentTransaction"
  FOR ALL
  USING (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid)
  WITH CHECK (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid);

CREATE POLICY "InventoryItem_all" ON "InventoryItem"
  FOR ALL
  USING (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid)
  WITH CHECK (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid);

CREATE POLICY "InventoryLog_all" ON "InventoryLog"
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM "InventoryItem" i
    WHERE i.id::uuid = "InventoryLog"."item_id"::uuid
    AND i.clinic_id::uuid = current_setting('app.clinic_id', true)::uuid
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "InventoryItem" i
    WHERE i.id::uuid = "InventoryLog"."item_id"::uuid
    AND i.clinic_id::uuid = current_setting('app.clinic_id', true)::uuid
  ));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "Prescription", "PrescriptionItem", "MedicalCertificate", "PaymentTransaction", "InventoryItem", "InventoryLog" TO saas_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO saas_app;
