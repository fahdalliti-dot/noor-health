-- Simplify RLS policies to direct text comparison without error-prone ::uuid casting

-- 1. Clinic
DROP POLICY IF EXISTS "Clinic_read" ON "Clinic";
CREATE POLICY "Clinic_read" ON "Clinic"
  FOR SELECT
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR id = current_setting('app.clinic_id', true)
  );

DROP POLICY IF EXISTS "Clinic_update" ON "Clinic";
CREATE POLICY "Clinic_update" ON "Clinic"
  FOR UPDATE
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR id = current_setting('app.clinic_id', true)
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR id = current_setting('app.clinic_id', true)
  );

-- 2. User
DROP POLICY IF EXISTS "User_all" ON "User";
CREATE POLICY "User_all" ON "User"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  );

-- 3. Appointment
DROP POLICY IF EXISTS "Appointment_all" ON "Appointment";
CREATE POLICY "Appointment_all" ON "Appointment"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  );

-- 4. DoctorWorkingHours
DROP POLICY IF EXISTS "DoctorWorkingHours_all" ON "DoctorWorkingHours";
CREATE POLICY "DoctorWorkingHours_all" ON "DoctorWorkingHours"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  );

-- 5. DoctorTimeOff
DROP POLICY IF EXISTS "DoctorTimeOff_all" ON "DoctorTimeOff";
CREATE POLICY "DoctorTimeOff_all" ON "DoctorTimeOff"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  );

-- 6. Patient
DROP POLICY IF EXISTS "Patient_all" ON "Patient";
CREATE POLICY "Patient_all" ON "Patient"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  );

-- 7. PatientMedicalProfile
DROP POLICY IF EXISTS "PatientMedicalProfile_all" ON "PatientMedicalProfile";
CREATE POLICY "PatientMedicalProfile_all" ON "PatientMedicalProfile"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR EXISTS (
      SELECT 1 FROM "Patient" p
      WHERE p.id = "PatientMedicalProfile"."patient_id"
      AND p.clinic_id = current_setting('app.clinic_id', true)
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR EXISTS (
      SELECT 1 FROM "Patient" p
      WHERE p.id = "PatientMedicalProfile"."patient_id"
      AND p.clinic_id = current_setting('app.clinic_id', true)
    )
  );

-- 8. Prescription
DROP POLICY IF EXISTS "Prescription_all" ON "Prescription";
CREATE POLICY "Prescription_all" ON "Prescription"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  );

-- 9. PrescriptionItem
DROP POLICY IF EXISTS "PrescriptionItem_all" ON "PrescriptionItem";
CREATE POLICY "PrescriptionItem_all" ON "PrescriptionItem"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR EXISTS (
      SELECT 1 FROM "Prescription" p
      WHERE p.id = "PrescriptionItem"."prescription_id"
      AND p.clinic_id = current_setting('app.clinic_id', true)
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR EXISTS (
      SELECT 1 FROM "Prescription" p
      WHERE p.id = "PrescriptionItem"."prescription_id"
      AND p.clinic_id = current_setting('app.clinic_id', true)
    )
  );

-- 10. MedicalCertificate
DROP POLICY IF EXISTS "MedicalCertificate_all" ON "MedicalCertificate";
CREATE POLICY "MedicalCertificate_all" ON "MedicalCertificate"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  );

-- 11. PaymentTransaction
DROP POLICY IF EXISTS "PaymentTransaction_all" ON "PaymentTransaction";
CREATE POLICY "PaymentTransaction_all" ON "PaymentTransaction"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  );

-- 12. InventoryItem
DROP POLICY IF EXISTS "InventoryItem_all" ON "InventoryItem";
CREATE POLICY "InventoryItem_all" ON "InventoryItem"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  );

-- 13. InventoryLog
DROP POLICY IF EXISTS "InventoryLog_all" ON "InventoryLog";
CREATE POLICY "InventoryLog_all" ON "InventoryLog"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR EXISTS (
      SELECT 1 FROM "InventoryItem" i
      WHERE i.id = "InventoryLog"."item_id"
      AND i.clinic_id = current_setting('app.clinic_id', true)
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR EXISTS (
      SELECT 1 FROM "InventoryItem" i
      WHERE i.id = "InventoryLog"."item_id"
      AND i.clinic_id = current_setting('app.clinic_id', true)
    )
  );

-- 14. NotificationLog
DROP POLICY IF EXISTS "NotificationLog_all" ON "NotificationLog";
CREATE POLICY "NotificationLog_all" ON "NotificationLog"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  );

-- 15. AuditLog
DROP POLICY IF EXISTS "AuditLog_read" ON "AuditLog";
CREATE POLICY "AuditLog_read" ON "AuditLog"
  FOR SELECT
  USING (
    clinic_id IS NULL 
    OR NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  );
