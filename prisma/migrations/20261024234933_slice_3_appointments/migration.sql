-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Casablanca',
    "require_2fa_all" BOOLEAN NOT NULL DEFAULT false,
    "first_day_of_week" INTEGER NOT NULL DEFAULT 0,
    "logo_key" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "speciality" TEXT,
    "license_number" TEXT,
    "locale" TEXT,
    "is_clinic_admin" BOOLEAN NOT NULL DEFAULT false,
    "totp_secret" TEXT,
    "totp_enabled_at" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" DATETIME,
    "deactivated_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "User_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecoveryCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "used_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecoveryCode_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "accepted_at" DATETIME,
    "revoked_at" DATETIME,
    "invited_by" TEXT NOT NULL,
    CONSTRAINT "Invite_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invite_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "device_label" TEXT,
    "ip" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" DATETIME NOT NULL,
    "revoked_at" DATETIME,
    "revoked_reason" TEXT,
    CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Session_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'trial',
    "status" TEXT NOT NULL DEFAULT 'trialing',
    "trial_ends_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Subscription_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "request_id" TEXT NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB NOT NULL,
    "occurred_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "token_hash" TEXT,
    "used_at" DATETIME,
    "expires_at" DATETIME
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "patient_id" TEXT,
    "doctor_id" TEXT NOT NULL,
    "starts_at" DATETIME NOT NULL,
    "ends_at" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "reason" TEXT,
    "source" TEXT NOT NULL DEFAULT 'staff',
    "cancelled_at" DATETIME,
    "cancel_reason" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Appointment_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DoctorWorkingHours" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "start_minutes" INTEGER NOT NULL,
    "end_minutes" INTEGER NOT NULL,
    "slot_length_minutes" INTEGER NOT NULL DEFAULT 30,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "DoctorWorkingHours_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DoctorWorkingHours_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DoctorTimeOff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "start_at" DATETIME NOT NULL,
    "end_at" DATETIME NOT NULL,
    "reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DoctorTimeOff_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DoctorTimeOff_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
CREATE UNIQUE INDEX "DoctorWorkingHours_clinic_id_doctor_id_weekday_key" ON "DoctorWorkingHours"("clinic_id", "doctor_id", "weekday");

-- CreateIndex
CREATE INDEX "DoctorTimeOff_clinic_id_doctor_id_start_at_end_at_idx" ON "DoctorTimeOff"("clinic_id", "doctor_id", "start_at", "end_at");
