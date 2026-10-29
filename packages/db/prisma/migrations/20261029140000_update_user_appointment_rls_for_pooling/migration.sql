-- Update RLS policies for User, Appointment, DoctorWorkingHours, DoctorTimeOff
-- to handle Prisma connection pooling gracefully.

-- 1. User
DROP POLICY IF EXISTS "User_all" ON "User";
CREATE POLICY "User_all" ON "User"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  );

-- 2. Appointment
DROP POLICY IF EXISTS "Appointment_all" ON "Appointment";
CREATE POLICY "Appointment_all" ON "Appointment"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  );

-- 3. DoctorWorkingHours
DROP POLICY IF EXISTS "DoctorWorkingHours_all" ON "DoctorWorkingHours";
CREATE POLICY "DoctorWorkingHours_all" ON "DoctorWorkingHours"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  );

-- 4. DoctorTimeOff
DROP POLICY IF EXISTS "DoctorTimeOff_all" ON "DoctorTimeOff";
CREATE POLICY "DoctorTimeOff_all" ON "DoctorTimeOff"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  );
