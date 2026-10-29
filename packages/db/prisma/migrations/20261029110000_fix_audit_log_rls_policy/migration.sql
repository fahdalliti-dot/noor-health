-- Fix AuditLog RLS policy to allow RETURNING * on INSERT when app.clinic_id is not set on pooled connection
DROP POLICY IF EXISTS "AuditLog_read" ON "AuditLog";

CREATE POLICY "AuditLog_read" ON "AuditLog"
  FOR SELECT
  USING (
    clinic_id IS NULL 
    OR NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  );
