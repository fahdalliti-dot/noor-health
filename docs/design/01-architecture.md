# 01 - Architecture

Status: draft. Part of the design doc set in `docs/design/` (see `README.md`).
Related: `02-data-model.md`, `03-auth-and-sessions.md`, `04-api.md`, `05-ui.md`.

## 1. Goals and constraints

**Goal.** A multi-tenant SaaS that lets Moroccan doctors' offices manage patient files, appointments, consultations, prescriptions and billing.

**Constraints that shape every decision**
- Health data is sensitive (Law 09-08, CNDP oversight). Privacy and tenant isolation come before convenience.
- Pilot scale first (3 to 5 clinics), but the design must not need a rewrite at hundreds of clinics.
- Clinics may have weak connectivity. The app must be light and tolerate drops.
- French first, Arabic (RTL) supported. Dates in `Africa/Casablanca`, money in MAD centimes.
- Hosting provider is undecided. Everything stays provider-agnostic until a Moroccan-compliant host is confirmed.
- Built and maintained by a very small team using Claude Code, so favor boring, well-known technology and strong conventions.

## 2. High-level view

```
 Browser (doctor / secretary / admin)
        |  HTTPS
        v
 +----------------+        +------------------+
 |  apps/web      |  API   |  apps/api        |
 |  Next.js       +------->+  NestJS          |
 |  (fr / ar UI)  |        |  REST + guards   |
 +----------------+        +----+--------+----+
                                |        |
                       Prisma   |        |  jobs (queue)
                                v        v
                         +-----------+  +-----------------+
                         | PostgreSQL|  | Worker          |
                         | (RLS on)  |  | reminders, PDFs |
                         +-----------+  +--------+--------+
                                                 |
                                   WhatsApp / SMS providers
                                   File storage (attachments)
```

A modular monolith: one API service, one worker process sharing the same codebase, one database. No microservices. Split a module out only when a real scaling or ownership problem appears.

## 3. Repository layout

```
/
  CLAUDE.md
  docs/design/            design docs (this file)
  apps/
    web/                  Next.js frontend
    api/                  NestJS backend (+ worker entry point)
  packages/
    shared/               Zod schemas, shared types, constants
  prisma/                 schema, migrations, seed
  docker-compose.yml      local Postgres (and later: local object storage)
```

`packages/shared` is the contract between web and api. Request/response shapes are defined once as Zod schemas and reused for validation (api) and typing (web).

## 4. Backend structure

Feature-based NestJS modules, each owning its controllers, services, DTOs and tests:

| Module | Responsibility |
|---|---|
| `auth` | login, 2FA, sessions, invites, password reset |
| `clinics` | clinic profile, settings (locale, timezone, 2FA policy) |
| `users` | staff accounts, roles, activation/deactivation |
| `patients` | patient records, identity, insurance, search |
| `appointments` | calendar, availability, status changes |
| `consultations` | clinical notes, prescriptions, attachments |
| `billing` | receipts, payments, daily cash summary |
| `notifications` | reminder scheduling and delivery (WhatsApp/SMS) |
| `audit` | append-only audit log and viewer |
| `subscriptions` | stub: plan, status, trial end (no payments yet) |

Rules between modules:
- Modules talk through exported services, never by reaching into each other's tables.
- Cross-cutting concerns (tenant context, audit, permissions) live in shared infrastructure, not copied per module.

## 5. Request lifecycle

Every authenticated request passes the same pipeline:

1. **Authentication guard** validates the access token and loads the session.
2. **Tenant context** sets `clinic_id` and `user_id` for the request (async local storage). Nothing downstream accepts `clinic_id` from the client.
3. **Permission guard** checks the endpoint's declared role/permission against the user's role.
4. **Validation pipe** validates input with the shared Zod schema.
5. **Handler/service** runs business logic through the tenant-scoped Prisma client.
6. **Audit interceptor** records access to patient data (who, what, which record, when, from where).
7. **Response** returns only whitelisted fields (no raw database rows).

An endpoint without a declared permission is rejected at startup. Secure by default.

## 6. Multi-tenancy and isolation

Model: one shared database, one schema, `clinic_id` on every tenant-owned table.

Defense in depth, two layers:
1. **Application layer.** A tenant-scoped Prisma client (extension/middleware) automatically injects `clinic_id` into every query and create. Services never build unscoped queries.
2. **Database layer.** PostgreSQL row-level security policies on tenant tables, keyed on a session variable (`app.clinic_id`) set per request/transaction. If application code is wrong, the database still refuses cross-tenant reads.

Mandatory tests:
- Clinic A cannot read, update or delete any clinic B record, for every tenant-owned table.
- A request with a forged `clinic_id` in body or URL is ignored or rejected.
- Background jobs run with an explicit tenant context, never a global one.

Platform-level operations (creating a clinic, support tooling) use a separate, narrowly scoped admin path that is itself audited.

## 7. Roles and permissions

| Role | Access |
|---|---|
| `admin` | clinic settings, staff, invites, subscription; no clinical notes by default |
| `doctor` | full clinical data for their clinic. If `is_clinic_admin: true`, the doctor also has admin-level permissions for their own clinic (settings, staff, invites). |
| `secretary` | appointments, patient identity/contact, billing; no clinical notes unless granted |

Permissions are declared per endpoint (for example `patients:read`, `consultations:write`) and mapped to roles in one place. Clinical notes are a separate permission so access can be granted explicitly. Authorization is always enforced server-side. The UI only hides controls for usability.

## 8. Data protection

- **In transit:** TLS everywhere, HSTS, secure cookies.
- **At rest:** encrypted database volumes and backups. Sensitive free-text fields (consultation notes) get application-level encryption with per-environment keys, so a database dump alone is not readable. Key management details are decided in `03-auth-and-sessions.md` and the deployment doc.
- **Logging:** no patient data in logs, errors, analytics or URLs. Opaque IDs only. Request bodies on patient routes are never logged.
- **Retention:** clinical records are soft-deleted. Hard deletion only through an explicit, audited retention process.
- **Backups:** daily, encrypted, restore tested regularly. Backup location follows the hosting decision.
- **Third parties:** nothing sends patient data abroad (analytics, error tracking, AI APIs) without an explicit decision recorded in this doc.

## 9. Background jobs

A queue-backed worker (same codebase, separate process) handles:
- Appointment reminders via WhatsApp/SMS, scheduled relative to the clinic's timezone.
- PDF generation (prescriptions, receipts) when it is too slow for a request.
- Scheduled cleanups (expired invites, revoked sessions, retention tasks).

Requirements: jobs are idempotent, retried with backoff, carry an explicit `clinic_id`, and never put patient data in job payloads beyond opaque IDs (the worker loads the data itself under tenant context).

Queue technology (for example Redis-backed, or a Postgres-backed queue to avoid a new dependency) is an open decision, see section 13.

## 10. Files and attachments

- Lab results, imaging and scanned documents are stored in object storage, not in the database. The database keeps metadata (`clinic_id`, patient, type, size, checksum, storage key).
- Files are private. Access goes through the API with a permission check and a short-lived signed URL, with an audit entry.
- Upload limits, allowed types and malware scanning are defined in `04-api.md`.
- Storage backend is provider-agnostic (S3-compatible interface) until hosting is chosen.

## 11. Internationalization and locale

- Clinic has `locale` (default `fr`) and `timezone` (default `Africa/Casablanca`). Users may override locale.
- Text direction is derived from locale in the UI layer, not stored.
- All UI strings go through `next-intl`. Server-generated documents (PDFs) and notifications use the clinic or user locale.
- Timestamps are stored in UTC and displayed in the clinic's timezone. Money is stored as integer centimes (MAD).

## 12. Environments and delivery

| Environment | Purpose | Data |
|---|---|---|
| local | development via Docker Postgres | fake seed data only |
| staging | pre-release testing | fake data only |
| production | live clinics | real data, restricted access |

- CI runs lint, typecheck and tests on every change, including the isolation and permission test suites.
- Database changes ship only as reviewed Prisma migrations.
- Configuration through environment variables only. No secrets in the repo.
- Real patient data never exists in local or staging environments.

## 13. Open decisions

| # | Decision | Notes |
|---|---|---|
| 1 | Hosting provider and region | Must satisfy CNDP requirements. Confirm with a lawyer before deploy. |
| 2 | Job queue technology | Redis-backed vs Postgres-backed. Favor fewer moving parts at pilot scale. |
| 3 | Object storage provider | Needs S3-compatible API and acceptable data location. |
| 4 | Application-level encryption scheme | Field-level for clinical notes, key storage and rotation. |
| 5 | WhatsApp/SMS provider | Compliance, cost and Moroccan delivery quality. Patient data minimized in messages. |
| 6 | Error tracking and monitoring | Self-hosted or Morocco-compliant, no patient data in reports. |

## 14. Decisions already made

- Modular monolith, not microservices.
- Shared database with `clinic_id` plus PostgreSQL row-level security.
- Invite-only clinic onboarding at launch (no public signup).
- Revocable sessions stored in a `Session` table (details in `03-auth-and-sessions.md`).
- 2FA enforced for doctors and admins from the first release.
- `Subscription` stubbed now, payments integrated later.
- Clinic stores `locale` and `timezone`. Direction is derived in the UI.