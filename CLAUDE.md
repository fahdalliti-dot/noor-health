# CLAUDE.md

## Project

Multi-tenant SaaS for doctors' offices and clinics in Morocco. It lets doctors and staff create patient files, book appointments, write consultation notes and prescriptions, review patient history, and manage billing.

**Users and roles**
- `admin`: manages the clinic account, staff and subscription.
- `doctor`: full access to clinical data of their clinic.
- `secretary`: appointments, patient identity/contact, billing. No access to clinical notes unless explicitly granted.

**Languages**: French first, Arabic (RTL) supported. English for code, comments and commit messages.

## Stack (edit if you change it)

- Monorepo managed with pnpm: `apps/web` (Next.js, TypeScript, Tailwind), `apps/api` (NestJS, TypeScript), `packages/shared` (types, validation schemas).
- Database: PostgreSQL with Prisma migrations.
- Auth: email + password, 2FA (TOTP) for doctors and admins, short-lived JWT + refresh tokens.
- i18n: `next-intl` (fr, ar). No hardcoded UI strings.
- Tests: Vitest/Jest for unit tests, Playwright for end-to-end.

## Commands

```
pnpm install            # install dependencies
pnpm dev                # run web + api locally
pnpm test               # run all tests
pnpm lint               # lint and typecheck
pnpm prisma migrate dev # create/apply a migration
pnpm prisma db seed     # load FAKE demo data
```

Run `pnpm lint && pnpm test` before declaring any task done.

## Non-negotiable rules

1. **Tenant isolation.** Every tenant-owned table has a `clinic_id`. Every query is scoped by the authenticated user's `clinic_id`. Prefer enforcing this centrally (Prisma middleware or Postgres row-level security), never ad hoc in controllers. A user from one clinic must never see another clinic's data.
2. **Audit log.** Every read, create, update, export or delete of patient data writes an audit entry (who, what, which record, when, from where). Audit logs are append-only.
3. **No patient data in logs, errors, analytics or URLs.** Use opaque IDs. Never log request bodies on patient routes.
4. **Permissions are checked on the server**, never only in the UI. Every endpoint declares its required role.
5. **Secrets** come from environment variables. Never commit `.env` files or keys.
6. **Fake data only.** Never use real patient data in code, tests, seeds, fixtures or screenshots.
7. **Soft delete** clinical records (`deleted_at`), do not hard delete. Hard deletes only through an explicit, audited retention process.
8. **Dates and money.** Store timestamps in UTC, display in `Africa/Casablanca`. Store money as integer centimes (MAD), never floats.
9. **Migrations only.** Never edit the database schema by hand. Every schema change is a reviewed Prisma migration.

## Compliance context (Morocco)

- Health data is sensitive under Law 09-08 and falls under CNDP oversight. Treat any feature that collects, shares, exports or transfers patient data as legally sensitive and flag it in your summary.
- Data must be hosted in Morocco or with a provider acceptable to CNDP. Do not add third-party services that send patient data abroad (analytics, error tracking, AI APIs) without asking first.
- Medical confidentiality applies: access is limited to the care team of the clinic.
- This file is a development guide, not legal advice. Compliance decisions are reviewed by a qualified lawyer.

## Code conventions

- TypeScript strict mode. No `any` unless justified in a comment.
- Validate all input at the API boundary with shared Zod schemas from `packages/shared`.
- Keep modules small and feature-based (`patients`, `appointments`, `consultations`, `billing`, `audit`, `auth`).
- Write tests with each feature, especially for permissions and tenant isolation (a test must prove clinic A cannot read clinic B's data, and a secretary cannot read clinical notes).
- Accessible, responsive UI that works on tablets and slow connections. Show loading and empty states.
- Commit messages: short, imperative, one logical change per commit.

## How to work in this repo

- For any non-trivial task, **plan first**: summarize the approach, list files to change and open questions, then wait for approval before coding.
- Build in thin vertical slices (API, UI, tests together), and finish one before starting the next.
- If a requirement is ambiguous or touches security, privacy or billing, ask instead of guessing.
- After finishing, summarize what changed, what was tested, and anything that needs human review (auth, permissions, encryption, data export).
- Do not install new dependencies without stating why.

## Fact-Forcing Gate
When the Fact-Forcing Gate blocks a Write, state the four required facts in one short
block, then immediately retry the same Write in the same turn. Never end your turn after
stating the facts. The turn is only finished when the file exists on disk.

## Build roadmap

1. Auth, clinics, users and roles
2. Patient records (create, search, edit, attachments)
3. Appointments and calendar (doctor and secretary views)
4. Consultation notes and prescription PDF with clinic letterhead
5. Billing: receipts, payment tracking, daily cash summary
6. Reminders via WhatsApp/SMS
7. Audit log viewer and data export
8. Later: insurance claims (CNSS/CNOPS), teleconsultation, patient portal

## Current status

- [x] Project scaffolding
- [x] Slice 1: auth, clinics, roles (PostgreSQL 16, Prisma 7, RLS policies, exclusion constraints)
- [x] Slice 2: patients (not started — `patient_id` nullable on Appointment until Slice 2 ships)
- [x] Slice 3a: Appointment model, DoctorWorkingHours, DoctorTimeOff, Clinic.first_day_of_week
- [x] Slice 3a: double-booking exclusion constraint via btree_gist
- [x] Slice 3a: state machine with terminal statuses and per-role transition rules
- [x] Slice 3a: availability algorithm (luxon, Africa/Casablanca timezone)
- [x] Slice 3a: DatabaseExceptionFilter maps 23P01/P2002 → 409 `slot_unavailable`
- [x] Slice 3a: appointments + doctors CRUD + availability endpoints
- [x] Slice 3a: state machine unit tests pass (6/6)
- [x] Slice 3a: availability tests pass (6/6)
- [x] Prisma relation ambiguity fixed
- [x] Database seeded with demo data (clinics, users, working hours, time off, appointments in every status)
- [x] PostgreSQL exclusion constraint (btree_gist) verified: overlapping active slots rejected (23P01), adjacent allowed, non-active statuses allowed
- [x] PostgreSQL RLS tenant isolation verified: saas_app role blocked from cross-clinic reads/writes via `app.clinic_id` session variable
- [x] Password hashing and TOTP 2FA implemented
- [x] Seed script executed successfully
- [x] Typecheck passing across all workspaces (`pnpm typecheck`)
- [x] Lint passing across all workspaces (`pnpm lint`)
- [x] Unit test suites passing for both web & api (`pnpm test`)
- [x] Production builds passing for both web & api (`pnpm build`)
