# 02 - Data model

Status: draft. Part of the design doc set in `docs/design/`.
Depends on: `01-architecture.md` (tenancy, encryption, audit). Feeds: `03-auth-and-sessions.md`, `04-api.md`.

This doc describes entities, fields, relationships and constraints at the level needed to write the Prisma schema. Exact Prisma syntax is left to implementation.

## 1. Conventions

| Topic | Rule |
|---|---|
| IDs | UUID (v7 if available, for index locality). Never expose sequential IDs. |
| Tenancy | Every tenant-owned table has `clinic_id` (NOT NULL, indexed, first column of composite indexes). |
| Timestamps | `created_at`, `updated_at` in UTC (`timestamptz`). Display in the clinic timezone. |
| Soft delete | Clinical and financial tables have `deleted_at`. Queries exclude deleted rows by default. |
| Money | Integer centimes (MAD). Never floats or decimals in application code. |
| Enums | Database enums for closed sets (roles, statuses). Add values through migrations. |
| Encrypted fields | Marked `[enc]`. Application-level encryption (see `01-architecture.md` section 8). Not searchable. |
| Naming | `snake_case` in the database, `camelCase` in code via Prisma mapping. |
| Authorship | Records created or changed by staff keep `created_by` (and `updated_by` where useful) as user IDs. |
| Uniqueness | Business uniqueness is scoped by clinic, for example `(clinic_id, file_number)`. |

## 2. Entity overview

```
Clinic 1--* User 1--* Session
Clinic 1--* Invite
User   1--* RecoveryCode
Clinic 1--1 Subscription
Clinic 1--* Patient 1--1 PatientMedicalProfile
Patient 1--* Appointment *--1 User (doctor)
Patient 1--* Consultation 1--* PrescriptionItem
Consultation *--0..1 Appointment
Patient 1--* Attachment
Patient 1--* Invoice 1--* InvoiceLine
Invoice 1--* Payment
Appointment 1--* Reminder
Clinic 1--* AuditLog
Clinic 1--* ClinicCounter
```

Domain groups:
- **Platform and access:** Clinic, User, RecoveryCode, Invite, Session, Subscription
- **Patients:** Patient, PatientMedicalProfile
- **Scheduling:** Appointment, Reminder
- **Clinical:** Consultation, PrescriptionItem, Attachment
- **Billing:** Invoice, InvoiceLine, Payment, ClinicCounter
- **Compliance:** AuditLog

## 3. Platform and access

### Clinic
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | |
| city, address, phone | text | letterhead and contact |
| locale | enum(fr, ar, en) | default `fr` |
| timezone | text | default `Africa/Casablanca` |
| require_2fa_all | boolean | default false. Doctors and admins always require 2FA. |
| logo_key | text? | storage key for prescription letterhead |
| status | enum(active, suspended) | |
| created_at, updated_at | timestamptz | |

### User
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| clinic_id | uuid | FK Clinic |
| email | citext | **globally unique** (login identifies the clinic) |
| password_hash | text | argon2id |
| full_name | text | |
| role | enum(admin, doctor, secretary) | |
| speciality | text? | doctors only |
| license_number | text? | doctors only (Ordre des médecins) |
| locale | enum? | nullable override of the clinic locale |
| totp_secret | text? [enc] | |
| totp_enabled_at | timestamptz? | null until 2FA setup completed |
| is_active | boolean | deactivation revokes all sessions |
| last_login_at | timestamptz? | |
| deactivated_at | timestamptz? | |
| created_at, updated_at | timestamptz | |

Constraint: a clinic always keeps at least one active admin (enforced in the service layer).

### User (continuation)

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| clinic_id | uuid | FK Clinic |
| email | citext | **globally unique** (login identifies the clinic) |
| password_hash | text | argon2id |
| full_name | text | |
| role | enum(admin, doctor, secretary) | |
| speciality | text? | doctors only |
| license_number | text? | doctors only (Ordre des médecins) |
| locale | enum? | nullable override of the clinic locale |
| totp_secret | text? [enc] | |
| totp_enabled_at | timestamptz? | null until 2FA setup completed |
| is_active | boolean | deactivation revokes all sessions |
| last_login_at | timestamptz? | |
| deactivated_at | timestamptz? | |
| created_at, updated_at | timestamptz | |
| **is_clinic_admin** | boolean | **default false**. When true, grants admin-level permissions for the user's own clinic (e.g., a solo doctor). Enabled by default for users with `role=admin` and for users who own their clinic (role `doctor` where the clinic has a single staff member). |

Constraint: a clinic always keeps at least one active admin (enforced in the service layer).

### RecoveryCode
`id`, `user_id`, `code_hash`, `used_at?`, `created_at`. Generated in batches at 2FA setup. Stored hashed, shown once.

### Invite
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| clinic_id | uuid | |
| email | citext | |
| role | enum | role granted on acceptance |
| token_hash | text | unique. Raw token only in the emailed link. |
| expires_at | timestamptz | short-lived |
| accepted_at | timestamptz? | single use |
| revoked_at | timestamptz? | |
| invited_by | uuid | FK User |

### Session
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| user_id, clinic_id | uuid | |
| family_id | uuid | groups a refresh-token rotation chain |
| refresh_token_hash | text | unique. Never store the raw token. |
| device_label | text? | parsed user agent |
| ip | inet? | |
| created_at, last_used_at | timestamptz | |
| expires_at | timestamptz | absolute lifetime |
| revoked_at | timestamptz? | |
| revoked_reason | enum? | logout, rotated, reuse_detected, user_deactivated, admin |

Reuse of a rotated token revokes the whole `family_id`. Details in `03-auth-and-sessions.md`.

### Subscription (stub)
`id`, `clinic_id` (unique), `plan` (enum: trial, solo, clinic), `status` (enum: trialing, active, past_due, canceled), `trial_ends_at`, `created_at`, `updated_at`. No payment fields yet and no feature gating.

## 4. Patients

### Patient
Identity and administrative data only. Visible to the secretary role.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| clinic_id | uuid | |
| file_number | int | per-clinic sequence. Unique `(clinic_id, file_number)`. |
| first_name, last_name | text | |
| sex | enum(female, male, other?) | optional |
| birth_date | date | |
| national_id | text? [enc] | CIN. Optional. Not searchable, store a blind index if search is needed. |
| phone | text | normalized E.164 |
| email | text? | |
| address, city | text? | |
| insurance_type | enum(none, cnss, cnops, amo, private, other) | |
| insurance_number | text? [enc] | |
| emergency_contact_name, emergency_contact_phone | text? | |
| preferred_locale | enum? | for reminders and documents |
| notes_admin | text? | non-clinical remarks (for example "prefers morning slots") |
| created_by | uuid | |
| created_at, updated_at, deleted_at | timestamptz | |

Indexes: `(clinic_id, last_name, first_name)`, `(clinic_id, phone)`, `(clinic_id, file_number)`. Search uses these plus trigram indexes (`pg_trgm`) on names. Possible duplicate detection on `(clinic_id, normalized name, birth_date)` at creation, as a warning, not a hard block.

### PatientMedicalProfile
Clinical background, separated so it needs the clinical permission. One row per patient.

| Field | Type | Notes |
|---|---|---|
| patient_id | uuid | PK and FK Patient |
| clinic_id | uuid | |
| blood_group | enum? | |
| allergies | text? [enc] | |
| chronic_conditions | text? [enc] | |
| current_medications | text? [enc] | |
| family_history | text? [enc] | |
| updated_by, updated_at | | |

## 5. Scheduling

### Appointment
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| clinic_id, patient_id | uuid | |
| doctor_id | uuid | FK User (role doctor) |
| starts_at, ends_at | timestamptz | `ends_at > starts_at` |
| status | enum(scheduled, confirmed, arrived, in_progress, completed, cancelled, no_show) | |
| reason | text? | short, non-clinical (for example "follow-up") |
| source | enum(staff, online) | |
| cancelled_at, cancel_reason | | |
| created_by | uuid | |
| created_at, updated_at | | |

Constraints and indexes:
- No double booking: a PostgreSQL exclusion constraint on `(doctor_id, tstzrange(starts_at, ends_at))` for active statuses (`btree_gist`).
- Indexes: `(clinic_id, doctor_id, starts_at)`, `(clinic_id, patient_id, starts_at)`, `(clinic_id, starts_at)` for the daily agenda.

Doctor working hours and leave (availability rules) are a later addition, tracked in `04-api.md` and not modeled yet.

### Reminder
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| clinic_id, appointment_id | uuid | |
| channel | enum(whatsapp, sms) | |
| scheduled_for | timestamptz | computed from the clinic timezone |
| status | enum(pending, sent, delivered, failed, skipped) | |
| attempts | int | |
| provider_message_id | text? | |
| error_code | text? | no patient data in errors |
| sent_at | timestamptz? | |

Unique `(appointment_id, channel, scheduled_for)` makes scheduling idempotent. Index `(status, scheduled_for)` for the worker.

## 6. Clinical

### Consultation
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| clinic_id, patient_id, doctor_id | uuid | |
| appointment_id | uuid? | optional link |
| occurred_at | timestamptz | |
| reason | text? [enc] | |
| notes | text? [enc] | main clinical note |
| diagnosis | text? [enc] | |
| vitals | jsonb? [enc] | weight, height, blood pressure, temperature, and so on |
| status | enum(draft, signed) | |
| signed_at | timestamptz? | |
| created_at, updated_at, deleted_at | | |

After `signed`, edits create an amendment (new version row or an addendum table, to be decided) so history is never silently rewritten. Index `(clinic_id, patient_id, occurred_at desc)` for the patient history view.

### PrescriptionItem
`id`, `clinic_id`, `consultation_id`, `position`, `medication_name`, `dosage`, `frequency`, `duration`, `instructions?`. Free text for now. A medication catalog is a later enhancement. The prescription PDF is generated on demand from these rows plus the clinic letterhead, so no PDF is stored.

### Attachment
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| clinic_id, patient_id | uuid | |
| consultation_id | uuid? | |
| kind | enum(lab_result, imaging, report, id_document, other) | |
| filename | text | |
| mime_type | text | allowlist enforced |
| size_bytes | int | |
| checksum | text | integrity check |
| storage_key | text | unique. Object storage path, never public. |
| uploaded_by | uuid | |
| created_at, deleted_at | | |

## 7. Billing

### Invoice (fee receipt)
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| clinic_id, patient_id | uuid | |
| consultation_id | uuid? | |
| number | int | per-clinic gapless sequence from ClinicCounter. Unique `(clinic_id, number)`. |
| issued_at | timestamptz | |
| total_cents | int | sum of lines |
| paid_cents | int | derived from payments, kept in sync in one transaction |
| status | enum(draft, issued, partially_paid, paid, void) | |
| void_reason | text? | |
| created_by | uuid | |

Issued invoices are immutable. Corrections happen by voiding and reissuing, which keeps the audit trail clean.

### InvoiceLine
`id`, `clinic_id`, `invoice_id`, `label`, `quantity`, `unit_price_cents`, `total_cents`.

### Payment
`id`, `clinic_id`, `invoice_id`, `amount_cents` (> 0), `method` (enum: cash, card, transfer, cheque, insurance), `paid_at`, `received_by`, `reference?`, `voided_at?`. Index `(clinic_id, paid_at)` for the daily cash summary.

### ClinicCounter
`clinic_id`, `name` (for example `file_number`, `invoice_number`), `value`. Incremented with `SELECT ... FOR UPDATE` inside the creating transaction to give gapless numbers per clinic. PK `(clinic_id, name)`.

## 8. Compliance

### AuditLog (append-only)
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| clinic_id | uuid? | null for platform-level actions |
| user_id | uuid? | null for system actions |
| action | enum(read, create, update, delete, export, login, logout, login_failed, permission_denied, 2fa_setup, 2fa_disabled, password_reset_requested, password_reset_completed, session_revoked, session_reuse_detected, invite_created, invite_accepted, user_deactivated, role_changed, clinical_access_granted) | |
| entity_type | text | for example `patient`, `consultation` |
| entity_id | uuid? | |
| request_id | text | correlates with application logs |
| ip, user_agent | | |
| metadata | jsonb | changed field **names** only. **Never values** and never patient data. |
| occurred_at | timestamptz | |

Protections: the application database role has `INSERT` and `SELECT` only (no `UPDATE` or `DELETE`). Index `(clinic_id, occurred_at desc)`, `(clinic_id, entity_type, entity_id)`. Partition by month once volume grows. Retention period is a compliance decision, see `01-architecture.md` section 13.

## 9. Row-level security

Policy on every tenant-owned table: rows are visible and writable only when `clinic_id = current_setting('app.clinic_id')::uuid`. The setting is applied per transaction by the tenant-scoped Prisma client.

Tables covered: User, RecoveryCode (via user), Invite, Session, Subscription, Patient, PatientMedicalProfile, Appointment, Reminder, Consultation, PrescriptionItem, Attachment, Invoice, InvoiceLine, Payment, ClinicCounter, AuditLog.

Known exceptions that need a dedicated, narrowly scoped path:
- **Login:** the clinic is not known until the user is found by email. Use a restricted lookup function or role that can read only the credentials fields needed for authentication.
- **Invite acceptance:** looked up by token hash before any tenant context exists.
- **Worker:** sets the tenant context from the job's `clinic_id` before loading any data.
- **Platform admin / seed script:** creates clinics under a separate role, and every use is logged.

## 10. Seed data

Seed scripts create **fake** data only: two demo clinics (to test isolation), staff of each role, sample patients, appointments, consultations and invoices. No real names, phone numbers or national IDs, in any environment except production.

## 11. Open questions

| # | Question | Notes |
|---|---|---|
| 1 | Amendments to signed consultations | Versioned rows or a separate addendum table. |
| 2 | Blind index for `national_id` search | Needed only if staff must search by CIN. |
| 3 | Doctor availability and leave | Separate model, needed for online booking. |
| 4 | Medication catalog | Local drug database vs free text. Licensing and data quality. |
| 5 | Audit log retention | Legal retention period to confirm with counsel. |
| 6 | Multi-clinic users | One user in several clinics (for example a visiting doctor) conflicts with global-unique email and one `clinic_id` per user. Out of scope for the pilot. |