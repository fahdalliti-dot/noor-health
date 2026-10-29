-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('whatsapp', 'sms');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('queued', 'sent', 'delivered', 'read', 'failed');

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "patient_id" TEXT,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'whatsapp',
    "recipient_phone" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ar_MA',
    "status" "NotificationStatus" NOT NULL DEFAULT 'queued',
    "provider_message_id" TEXT,
    "content_preview" TEXT NOT NULL,
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationLog_clinic_id_created_at_idx" ON "NotificationLog"("clinic_id", "created_at");
CREATE INDEX "NotificationLog_appointment_id_idx" ON "NotificationLog"("appointment_id");
CREATE INDEX "NotificationLog_provider_message_id_idx" ON "NotificationLog"("provider_message_id");

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS
ALTER TABLE "NotificationLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "NotificationLog_all" ON "NotificationLog"
  FOR ALL
  USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::uuid = NULLIF(current_setting('app.clinic_id', true), '')::uuid
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "NotificationLog" TO saas_app;
