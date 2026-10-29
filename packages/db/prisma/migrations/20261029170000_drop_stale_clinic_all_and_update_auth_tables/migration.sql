-- Drop stale Clinic_all policy that caused "invalid input syntax for type uuid"
DROP POLICY IF EXISTS "Clinic_all" ON "Clinic";

-- Update remaining tables (Invite, Session, Subscription, PasswordResetToken, RecoveryCode)
DROP POLICY IF EXISTS "Invite_all" ON "Invite";
CREATE POLICY "Invite_all" ON "Invite"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  );

DROP POLICY IF EXISTS "Session_all" ON "Session";
CREATE POLICY "Session_all" ON "Session"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  );

DROP POLICY IF EXISTS "Subscription_all" ON "Subscription";
CREATE POLICY "Subscription_all" ON "Subscription"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  );

DROP POLICY IF EXISTS "PasswordResetToken_all" ON "PasswordResetToken";
CREATE POLICY "PasswordResetToken_all" ON "PasswordResetToken"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id = current_setting('app.clinic_id', true)
  );

DROP POLICY IF EXISTS "RecoveryCode_all" ON "RecoveryCode";
CREATE POLICY "RecoveryCode_all" ON "RecoveryCode"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "RecoveryCode".user_id
      AND u.clinic_id = current_setting('app.clinic_id', true)
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "RecoveryCode".user_id
      AND u.clinic_id = current_setting('app.clinic_id', true)
    )
  );
