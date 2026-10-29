-- Update Clinic RLS policy for connection pooling
DROP POLICY IF EXISTS "Clinic_read" ON "Clinic";
CREATE POLICY "Clinic_read" ON "Clinic"
  FOR SELECT
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  );

DROP POLICY IF EXISTS "Clinic_update" ON "Clinic";
CREATE POLICY "Clinic_update" ON "Clinic"
  FOR UPDATE
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  );
