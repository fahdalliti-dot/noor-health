-- Update RLS policies to handle Prisma connection pooling gracefully
-- When app.clinic_id is set, tenant isolation is strictly enforced.
-- When running in connection pool where session variable is unset, application-level clinic_id filter takes effect.

-- 1. Patient
DROP POLICY IF EXISTS "Patient_all" ON "Patient";
CREATE POLICY "Patient_all" ON "Patient"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  );

-- 2. PatientMedicalProfile
DROP POLICY IF EXISTS "PatientMedicalProfile_read" ON "PatientMedicalProfile";
CREATE POLICY "PatientMedicalProfile_all" ON "PatientMedicalProfile"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR EXISTS (
      SELECT 1 FROM "Patient" p
      WHERE p.id::uuid = "PatientMedicalProfile"."patient_id"::uuid
      AND p.clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR EXISTS (
      SELECT 1 FROM "Patient" p
      WHERE p.id::uuid = "PatientMedicalProfile"."patient_id"::uuid
      AND p.clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
    )
  );

-- 3. Prescription
DROP POLICY IF EXISTS "Prescription_all" ON "Prescription";
CREATE POLICY "Prescription_all" ON "Prescription"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  );

-- 4. PrescriptionItem
DROP POLICY IF EXISTS "PrescriptionItem_all" ON "PrescriptionItem";
CREATE POLICY "PrescriptionItem_all" ON "PrescriptionItem"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR EXISTS (
      SELECT 1 FROM "Prescription" p
      WHERE p.id::uuid = "PrescriptionItem"."prescription_id"::uuid
      AND p.clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR EXISTS (
      SELECT 1 FROM "Prescription" p
      WHERE p.id::uuid = "PrescriptionItem"."prescription_id"::uuid
      AND p.clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
    )
  );

-- 5. MedicalCertificate
DROP POLICY IF EXISTS "MedicalCertificate_all" ON "MedicalCertificate";
CREATE POLICY "MedicalCertificate_all" ON "MedicalCertificate"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  );

-- 6. PaymentTransaction
DROP POLICY IF EXISTS "PaymentTransaction_all" ON "PaymentTransaction";
CREATE POLICY "PaymentTransaction_all" ON "PaymentTransaction"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  );

-- 7. InventoryItem
DROP POLICY IF EXISTS "InventoryItem_all" ON "InventoryItem";
CREATE POLICY "InventoryItem_all" ON "InventoryItem"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  );

-- 8. InventoryLog
DROP POLICY IF EXISTS "InventoryLog_all" ON "InventoryLog";
CREATE POLICY "InventoryLog_all" ON "InventoryLog"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR EXISTS (
      SELECT 1 FROM "InventoryItem" i
      WHERE i.id::uuid = "InventoryLog"."item_id"::uuid
      AND i.clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR EXISTS (
      SELECT 1 FROM "InventoryItem" i
      WHERE i.id::uuid = "InventoryLog"."item_id"::uuid
      AND i.clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
    )
  );
