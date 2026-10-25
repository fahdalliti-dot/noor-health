-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'doctor', 'secretary');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('trial', 'solo', 'clinic');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('trialing', 'active', 'past_due', 'canceled');

-- CreateEnum
CREATE TYPE "Action" AS ENUM ('read', 'create', 'update', 'delete', 'export', 'login', 'logout', 'login_failed', 'permission_denied', 'two_fa_setup', 'two_fa_disabled', 'password_reset_requested', 'password_reset_completed', 'session_revoked', 'session_reuse_detected', 'invite_created', 'invite_accepted', 'user_deactivated', 'role_changed', 'clinical_access_granted');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('fr', 'ar', 'en');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('active', 'suspended');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('scheduled', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "AppointmentSource" AS ENUM ('staff', 'online');

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "locale" "Locale" NOT NULL DEFAULT 'fr',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Casablanca',
    "require_2fa_all" BOOLEAN NOT NULL DEFAULT false,
    "first_day_of_week" INTEGER NOT NULL DEFAULT 0,
    "logo_key" TEXT,
    "status" "Status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "speciality" TEXT,
    "license_number" TEXT,
    "locale" "Locale",
    "is_clinic_admin" BOOLEAN NOT NULL DEFAULT false,
    "totp_secret" TEXT,
    "totp_enabled_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "deactivated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryCode" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecoveryCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "invited_by" TEXT NOT NULL,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "device_label" TEXT,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "revoked_reason" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'trial',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'trialing',
    "trial_ends_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT,
    "user_id" TEXT,
    "action" "Action" NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "request_id" TEXT NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "token_hash" TEXT,
    "used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "patient_id" TEXT,
    "doctor_id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'scheduled',
    "reason" TEXT,
    "source" "AppointmentSource" NOT NULL DEFAULT 'staff',
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorWorkingHours" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "start_minutes" INTEGER NOT NULL,
    "end_minutes" INTEGER NOT NULL,
    "slot_length_minutes" INTEGER NOT NULL DEFAULT 30,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorWorkingHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorTimeOff" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoctorTimeOff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Clinic_id_idx" ON "Clinic"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_hash_key" ON "Invite"("token_hash");

-- CreateIndex
CREATE INDEX "Invite_token_hash_idx" ON "Invite"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refresh_token_hash_key" ON "Session"("refresh_token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_clinic_id_key" ON "Subscription"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_hash_key" ON "PasswordResetToken"("token_hash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_clinic_id_user_id_idx" ON "PasswordResetToken"("clinic_id", "user_id");

-- CreateIndex
CREATE INDEX "AuditLog_clinic_id_occurred_at_idx" ON "AuditLog"("clinic_id", "occurred_at");

-- CreateIndex
CREATE INDEX "AuditLog_clinic_id_entity_type_entity_id_idx" ON "AuditLog"("clinic_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "Appointment_clinic_id_doctor_id_starts_at_idx" ON "Appointment"("clinic_id", "doctor_id", "starts_at");

-- CreateIndex
CREATE INDEX "Appointment_clinic_id_starts_at_idx" ON "Appointment"("clinic_id", "starts_at");

-- CreateIndex
CREATE INDEX "Appointment_clinic_id_status_idx" ON "Appointment"("clinic_id", "status");

-- CreateIndex
CREATE INDEX "DoctorWorkingHours_clinic_id_doctor_id_idx" ON "DoctorWorkingHours"("clinic_id", "doctor_id");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorWorkingHours_clinic_id_doctor_id_weekday_start_minute_key" ON "DoctorWorkingHours"("clinic_id", "doctor_id", "weekday", "start_minutes");

-- CreateIndex
CREATE INDEX "DoctorTimeOff_clinic_id_doctor_id_start_at_end_at_idx" ON "DoctorTimeOff"("clinic_id", "doctor_id", "start_at", "end_at");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryCode" ADD CONSTRAINT "RecoveryCode_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Double-booking exclusion constraint via btree_gist
-- Adjacent ranges (end = next start) are allowed because [) is half-open.
-- Only active statuses participate in the constraint.
-- Uses tsrange (not tstzrange) because columns are TIMESTAMP(3) without timezone.
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_no_double_booking"
  EXCLUDE USING gist (doctor_id WITH =, tsrange("starts_at", "ends_at") WITH &&)
  WHERE (status IN ('scheduled', 'confirmed', 'arrived', 'in_progress'));

-- AddForeignKey
ALTER TABLE "DoctorWorkingHours" ADD CONSTRAINT "DoctorWorkingHours_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorWorkingHours" ADD CONSTRAINT "DoctorWorkingHours_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorTimeOff" ADD CONSTRAINT "DoctorTimeOff_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorTimeOff" ADD CONSTRAINT "DoctorTimeOff_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================
-- Row-Level Security (RLS)
-- ============================================
-- All tenant tables enforce isolation via the app.clinic_id session variable.
-- The API sets this via: SELECT set_config('app.clinic_id', clinicId, true)
-- saas_owner is the database owner — it BYPASSES RLS by default, which is correct
-- for migrations. The restricted saas_app role has NO BYPASSRLS.

-- Enable RLS on all tenant tables
ALTER TABLE "Clinic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecoveryCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DoctorWorkingHours" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DoctorTimeOff" ENABLE ROW LEVEL SECURITY;

-- Policies: one per operation (FOR SELECT / FOR INSERT / FOR UPDATE / FOR DELETE)
-- We use FOR ALL which covers SELECT, INSERT, UPDATE, DELETE

-- Clinic: owned by current clinic
CREATE POLICY "Clinic_all" ON "Clinic"
  FOR ALL
  USING (id::uuid = current_setting('app.clinic_id', true)::uuid)
  WITH CHECK (id::uuid = current_setting('app.clinic_id', true)::uuid);

-- User: belongs to current clinic
CREATE POLICY "User_all" ON "User"
  FOR ALL
  USING (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid)
  WITH CHECK (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid);

-- RecoveryCode: belongs to current clinic (via user's clinic)
CREATE POLICY "RecoveryCode_all" ON "RecoveryCode"
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM "User" u WHERE u.id::uuid = "RecoveryCode"."user_id"::uuid
    AND u.clinic_id::uuid = current_setting('app.clinic_id', true)::uuid
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "User" u WHERE u.id::uuid = "RecoveryCode"."user_id"::uuid
    AND u.clinic_id::uuid = current_setting('app.clinic_id', true)::uuid
  ));

-- Invite: belongs to current clinic
CREATE POLICY "Invite_all" ON "Invite"
  FOR ALL
  USING (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid)
  WITH CHECK (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid);

-- Session: belongs to current clinic
CREATE POLICY "Session_all" ON "Session"
  FOR ALL
  USING (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid)
  WITH CHECK (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid);

-- Subscription: belongs to current clinic
CREATE POLICY "Subscription_all" ON "Subscription"
  FOR ALL
  USING (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid)
  WITH CHECK (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid);

-- PasswordResetToken: belongs to current clinic
CREATE POLICY "PasswordResetToken_all" ON "PasswordResetToken"
  FOR ALL
  USING (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid)
  WITH CHECK (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid);

-- Appointment: belongs to current clinic
CREATE POLICY "Appointment_all" ON "Appointment"
  FOR ALL
  USING (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid)
  WITH CHECK (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid);

-- DoctorWorkingHours: belongs to current clinic
CREATE POLICY "DoctorWorkingHours_all" ON "DoctorWorkingHours"
  FOR ALL
  USING (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid)
  WITH CHECK (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid);

-- DoctorTimeOff: belongs to current clinic
CREATE POLICY "DoctorTimeOff_all" ON "DoctorTimeOff"
  FOR ALL
  USING (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid)
  WITH CHECK (clinic_id::uuid = current_setting('app.clinic_id', true)::uuid);

-- AuditLog: strictly append-only (SELECT and INSERT only, NO UPDATE or DELETE)
-- Audit logs are protected per CLAUDE.md rule #2 (append-only) and #4 (permissions on server)
CREATE POLICY "AuditLog_read" ON "AuditLog"
  FOR SELECT
  USING (
    clinic_id IS NULL OR clinic_id::uuid = current_setting('app.clinic_id', true)::uuid
  );

CREATE POLICY "AuditLog_insert" ON "AuditLog"
  FOR INSERT
  WITH CHECK (TRUE);

-- Grants: saas_app gets data access (no DDL, no BYPASSRLS)
-- Table grants
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO saas_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO saas_app;

-- Default privileges so saas_app automatically gets access to new tables/sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO saas_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO saas_app;