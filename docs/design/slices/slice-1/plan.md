# Phase 0 Plan — Slice 1: Auth, Clinics, Roles

## 1. Repo Scaffolding

A fresh pnpm monorepo matching CLAUDE.md conventions:

| Directory | Purpose |
|---|---|
| `apps/web/` | Next.js (App Router), TypeScript strict, Tailwind, next-intl for i18n (fr, ar) |
| `apps/api/` | NestJS backend (v10+), TypeScript strict, feature modules: auth, clinics, users, invites, sessions, audit |
| `packages/shared/` | Zod validation schemas shared between web and api; constants for enums; no Prisma |
| `packages/db/prisma/` | Prisma schema, migrations, seed scripts |
| `docker-compose.yml` | Postgres + Mailpit for local dev; no third-party services sending patient data |
| `scripts/` | `pnpm db seed` — creates 2 demo clinics with admin/doctor/secretary per clinic; one solo-doctor clinic using `is_clinic_admin`. CLI `pnpm auth create-clinic` to bootstrap a new clinic + first admin |
| `.env.example` | All env vars listed; `.env` never committed |
| `CLAUDE.md` updated with status checklist for slice 1 |

**Dependencies needed and why**:

- `pnpm` — monorepo workspace management (already in use)
- `nestjs` — API framework (request pipeline, guards, pipes)
- `@prisma/client` + `prisma` — ORM and migration engine
- `next` + `next-intl` — frontend with i18n routing
- `@nestjs/jwt` + `argon2` — authentication (access/refresh tokens, password hashing)
- `speakeasy` or `otpauth` — TOTP generation/verification
- `mailpit` (dev) — local email catcher for password/reset and invite flows
- `tsx` / `ts-node` — runtime for scripts/seed
- `zod` — input validation shared across web and api
- `class-validator` / `class-transformer` — NestJS DTO validation

CI config (GitHub Actions or equivalent): lint, typecheck, test. Runs on every PR and on push to main.

---

## 2. Prisma Schema Outline (8 tables)

Following conventions from `02 - Data model.md` and decisions:

### Enum: `role` { admin, doctor, secretary }
### Enum: `plan` { trial, solo, clinic }
### Enum: `subscription_status` { trialing, active, past_due, canceled }
### Enum: `action` (AuditLog) — extended: read, create, update, delete, export, login, logout, login_failed, permission_denied, 2fa_setup, 2fa_disabled, password_reset_requested, password_reset_completed, session_revoked, session_reuse_detected, invite_created, invite_accepted, user_deactivated, role_changed, clinical_access_granted

### Table: Clinic
- `id` uuid @id `@default(uuid())`
- `name` text
- `city` text
- `address` text
- `phone` text
- `locale` enum(fr, ar, en) @default(fr)
- `timezone` text @default("Africa/Casablanca")
- `require_2fa_all` boolean @default(false)
- `logo_key` text?
- `status` enum(active, suspended) @default(active)
- `created_at` timestamptz @default(now())
- `updated_at` timestamptz @default(now())

### Table: User
- `id` uuid @id `@default(uuid())`
- `clinic_id` uuid @db.Column("clinic_id") referenced to Clinic(id)
- `email` citext @unique (globally unique — login identifies the clinic)
- `password_hash` text (argon2id)
- `full_name` text
- `role` enum(admin, doctor, secretary)
- `speciality` text? (doctors only)
- `license_number` text? (doctors only — Ordre des médecins)
- `locale` enum?(fr/ar/en) — nullable override of clinic locale
- `is_clinic_admin` boolean @default(false) — grants admin-level permissions for own clinic (solo doctor)
- `totp_secret` text? [enc] — AES-256-GCM envelope, key from env
- `totp_enabled_at` timestamptz? — null until 2FA setup completed
- `is_active` boolean @default(true) — deactivation revokes all sessions
- `last_login_at` timestamptz?
- `deactivated_at` timestamptz?
- `created_at` timestamptz @default(now())
- `updated_at` timestamptz @default(now())

Indexes: `(clinic_id)`, `(clinic_id, role)`, `(email)` — but email uniqueness is global, not per-clinic.

### Table: RecoveryCode
- `id` uuid @id `@default(uuid())`
- `user_id` uuid referenced to User(id)
- `code_hash` text (bcrypt/argon2id)
- `used_at` timestamptz?
- `created_at` timestamptz @default(now())
- Unique `(user_id, code_hash)` — generated in batches at 2FA setup

### Table: Invite
- `id` uuid @id `@default(uuid())`
- `clinic_id` uuid referenced to Clinic(id)
- `email` citext
- `role` enum(admin, doctor, secretary)
- `token_hash` text @unique (SHA-256 of raw token; raw token only in emailed link)
- `expires_at` timestamptz (7 days)
- `accepted_at` timestamptz?
- `revoked_at` timestamptz?
- `invited_by` uuid referenced to User(id)
- Unique `(clinic_id, email)` — one pending invite per email per clinic

### Table: Session
- `id` uuid @id `@default(uuid())`
- `user_id` uuid referenced to User(id)
- `clinic_id` uuid referenced to Clinic(id)
- `family_id` uuid — groups rotation chain
- `refresh_token_hash` text @unique (never store raw token)
- `device_label` text? (parsed user agent)
- `ip` inet?
- `created_at` timestamptz @default(now())
- `last_used_at` timestamptz @default(now())
- `expires_at` timestamptz (7-day absolute lifetime)
- `revoked_at` timestamptz?
- `revoked_reason` enum(logout, rotated, reuse_detected, user_deactivated, admin)

Unique `(user_id, family_id)` — reuse of rotated token revokes whole family.

### Table: Subscription (stub)
- `id` uuid @id `@default(uuid())`
- `clinic_id` uuid @unique referenced to Clinic(id) — one subscription per clinic
- `plan` enum(trial, solo, clinic) @default(trial)
- `status` enum(trialing, active, past_due, canceled) @default(trialing)
- `trial_ends_at` timestamptz
- `created_at` timestamptz @default(now())
- `updated_at` timestamptz @default(now())

### Table: AuditLog
- `id` uuid @id `@default(uuid())`
- `clinic_id` uuid? nullable — null for platform-level actions
- `user_id` uuid? nullable — null for system actions
- `action` enum(extended set per decisions.md)
- `entity_type` text? (e.g. patient, consultation)
- `entity_id` uuid?
- `request_id` text
- `ip` inet?
- `user_agent` text?
- `metadata` jsonb — changed field **names** only; **never values** and never patient data
- `occurred_at` timestamptz @default(now())

Protections: app database role has INSERT + SELECT only (no UPDATE/DELETE).
Indexes: `(clinic_id, occurred_at desc)`, `(clinic_id, entity_type, entity_id)`.

**Row-level security design**:
- Two PostgreSQL roles:
  1. `prisma_migration` — owner, can do anything (including BYPASSRLS). Used only for migration commands.
  2. `app_role` — restricted, no BYPASSRLS. All tenant tables have RLS enabled.
- Policy on every tenant table: `clinic_id = current_setting('app.clinic_id')::uuid`
- Rows with null `clinic_id` in AuditLog are invisible to clinic users (policy excludes null or sets default).
- Application sets `app.clinic_id` per transaction via Prisma client extension or middleware.
- Narrow SECURITY DEFINER functions for paths with no tenant context yet:
  - Login lookup by email (read-only, returns only needed columns)
  - Invite acceptance by token hash (read-only)
  - Password reset by token hash (read-only)
- Platform actions (clinic creation) use separate audited path with `prisma_migration` role.

**Exceptions that need dedicated paths** (from 02 sec 9):
- Login: clinic not known until user found by email → restricted lookup function
- Invite acceptance: looked up by token hash before any tenant context
- Worker: sets tenant context from job's clinic_id before loading data
- Platform admin/seed script: creates clinics under separate role, every use logged

---

## 3. Endpoint List with Permissions

All under `/api/v1`. Each endpoint declares exactly one permission; app fails at startup if any endpoint lacks one.

### Auth
| Method | Path | Permission |
|---|---|---|
| POST | `/auth/login` | (authentication — no role check beyond valid credentials, returns two_factor_required) |
| POST | `/auth/2fa/verify` | (2fa_verify — after session challenge) |
| POST | `/auth/2fa/setup` | (2fa_setup — user’s own) |
| POST | `/auth/2fa/confirm` | (2fa_setup — complete enrollment) |
| POST | `/auth/refresh` | (session:rotate — refresh token) |
| POST | `/auth/logout` | (session:revoke — own sessions) |
| GET | `/auth/sessions` | (session:list — own sessions) |
| DELETE | `/auth/sessions/:id` | (session:revoke — own sessions) |
| POST | `/auth/invites/accept` | (public, token-based — no permission check; validates token only) |
| POST | `/auth/password/forgot` | (password_forgot — rate limited, no permission) |
| POST | `/auth/password/reset` | (password_reset — single use token) |

### Clinic and Staff
| Method | Path | Permission |
|---|---|---|
| GET | `/clinic` | any authenticated |
| PATCH | `/clinic` | `clinic:manage` |
| GET | `/users` | `users:manage` |
| POST | `/invites` | `users:manage` |
| DELETE | `/invites/:id` | `users:manage` |
| PATCH | `/users/:id` | `users:manage` (role, active flag) |
| POST | `/users/:id/deactivate` | `users:manage` (revokes all sessions) |

### Patients (post-slice 1, but stub declared)
| Method | Path | Permission |
|---|---|---|
| GET | `/patients` | `patients:read` |
| POST | `/patients` | `patients:write` |
| GET | `/patients/:id` | `patients:read` |
| PATCH | `/patients/:id` | `patients:write` |
| DELETE | `/patients/:id` | `patients:write` (soft delete, doctor only) |

### Subscription
| Method | Path | Permission |
|---|---|---|
| GET | `/subscription` | `subscription:read` |

### Audit
| Method | Path | Permission |
|---|---|---|
| GET | `/audit-logs` | `audit:read` |
| GET | `/patients/:id/access-log` | `audit:read` |

### Operational
| Method | Path | Notes |
|---|---|---|
| GET | `/health/live`, `/health/ready` | unauthenticated, no data |
| POST | `/webhooks/messaging` | provider callbacks, signature verified |

**Permission mapping by role** (from 04-API.md):

| Permission | admin | doctor | secretary |
|---|---|---|---|
| `clinic:manage` | yes | no | no |
| `users:manage` | yes | no | no |
| `subscription:read` | yes | no | no |
| `audit:read` | yes | no | no |
| `patients:read` / `:write` | no | yes | yes |
| `medical_profile:read` / `:write` | no | yes | no |
| `appointments:read` / `:write` | no | yes | yes |
| `consultations:read` / `:write` | no | yes | no |
| `attachments:read` / `:write` (clinical kinds) | no | yes | no |
| `attachments:read` / `:write` (id documents) | no | yes | yes |
| `billing:read` / `:write` | no | yes | yes |

Note: `clinical_access` flag on specific secretaries grants clinical permissions for that user only, audited on grant/revoke.

---

## 4. Test Plan

### Tenant Isolation
- For every tenant table, test that clinic A cannot read/update/delete clinic B rows.
- Test both through API (authenticated as user from clinic A, query clinic B data) and with direct SQL as the app role with wrong `app.clinic_id`.
- Forge `clinic_id` in body/query/path — must be ignored or rejected (404).

### Permissions Matrix
- Test matrix over every endpoint and role (admin, doctor, secretary, doctor with `is_clinic_admin`, secretary with `clinical_access`).
- Startup fails for an endpoint without a declared permission.

### Auth Tests
- Lockout: 5 failed attempts → 15 min lockout, escalating on repeats; audit every lockout.
- 2FA enforcement: doctors/admins cannot login without 2FA; secretaries optional unless `require_2fa_all`.
- Recovery codes: 10 single-use codes shown once at 2FA setup.
- Refresh rotation and reuse detection: replaying an old refresh token revokes whole family.
- Deactivation revokes all sessions.
- Password reset revokes all sessions.
- Expired and reused invite and reset tokens return appropriate errors.
- Last-admin protection: cannot deactivate/demote the last active admin.
- CSRF rejection on state-changing requests (double-submit token header).

### Audit Tests
- Events written for each action listed in AuditLog enum.
- AuditLog cannot be updated or deleted by the app role (INSERT + SELECT only).
- Metadata contains no values or secrets — only field names.
- No secret, token or patient data appears in logs or error responses.

### Playwright E2E Tests
- Invite and first login with 2FA setup (French and Arabic RTL).
- Login flow with 2FA.
- Session revoke from account page.
- All in French; also Arabic RTL where applicable.

---

## 5. Build Order (Small Steps, One Commit Each)

Each step ends with `pnpm lint && pnpm test` passing. Stop at checkpoints and wait for approval.

### Step 1 — Monorepo Scaffolding & Docker
- [ ] Initialize pnpm monorepo with `apps/web`, `apps/api`, `packages/shared`, `packages/db/prisma`
- [ ] Add `docker-compose.yml` for Postgres + Mailpit
- [ ] Add `.env.example` with all env vars (JWT secret, argon2id params, TOTP key, etc.)
- [ ] Set up root `package.json` scripts: `dev`, `lint`, `test`, `prisma migrate`, `prisma db seed`
- [ ] CI config: lint, typecheck, test scripts
- **Commit**: "scaffold: monorepo structure and docker compose"
- **Checkpoint**: Wait for approval before proceeding.

### Step 2 — Prisma Schema & Migration
- [ ] Write Prisma schema in `packages/db/prisma/schema.prisma` for all 8 tables
- [ ] Run `pnpm prisma migrate dev --create-only` to generate migration
- [ ] Apply migration: `pnpm prisma migrate dev`
- [ ] Verify schema in DB
- **Commit**: "db: createPrisma schema and migrate for slice 1"
- **Checkpoint**: Wait for approval.

### Step 3 — Seed Script
- [ ] Write seed script `packages/db/seed.ts` with FAKE data:
  - Two demo clinics (isolation test data)
    - Clinic A: admin user (role=admin), doctor user (role=doctor, is_clinic_admin=false), secretary user (role=secretary)
    - Clinic B: same structure (proves isolation)
  - One solo-doctor clinic using `is_clinic_admin` (role=doctor, is_clinic_admin=true)
  - Sample data for other tables (sessions, invites, subscriptions)
- [ ] Run `pnpm prisma db seed`
- **Commit**: "seed: FAKE demo clinics with staff"
- **Checkpoint**: Wait for approval.

### Step 4 — Auth Module (NestJS)
- [ ] Implement `AuthModule` with local strategy (email + password, argon2id)
- [ ] TOTP generation/verification (speakeasy/otpauth)
- [ ] Access token (15 min, HS256) + refresh token (7 days) with httpOnly, Secure, SameSite=Strict cookies
- [ ] Double-submit CSRF token header on state-changing requests
- [ ] Login flow: correct password + 2FA requirement detection → returns `{"status":"two_factor_required"}` with short-lived challenge token
- [ ] 2FA enforcement: doctors/admins mandatory; secretaries optional, clinic-level `require_2fa_all`
- [ ] Recovery codes: 10 single-use, stored hashed, shown once
- [ ] Lockout: 5 failed attempts → 15 min, escalating; audit every lockout
- [ ] Session management: rotation with family tracking, reuse detection
- [ ] Invite creation/acceptance with single-use, expiring tokens
- [ ] Password reset flow with ~30-min token, single use, revokes all sessions on complete
- **Commit**: "auth: NestJS auth module with 2FA, sessions, invites, password reset"
- **Checkpoint**: Wait for approval.

### Step 5 — RLS & Permissions
- [ ] Set up PostgreSQL roles: `prisma_migration` (owner) and `app_role` (restricted, no BYPASSRLS)
- [ ] Enable RLS on all tenant tables; policy: `clinic_id = current_setting('app.clinic_id')::uuid`
- [ ] Handle null clinic_id in AuditLog — invisible to clinic users
- [ ] Create narrow SECURITY DEFINER functions for login lookup, invite acceptance, password reset
- [ ] Ensure app database role has INSERT + SELECT only on AuditLog (no UPDATE/DELETE)
- [ ] Implement Prisma middleware or extension that sets `app.clinic_id` per transaction
- [ ] Startup validation: every endpoint must declare a permission, otherwise app fails to start
- **Commit**: "rls: row-level security, app role, Prisma middleware, startup permission check"
- **Checkpoint**: Wait for approval.

### Step 6 — API Routes & Validation
- [ ] Implement all slice 1 endpoints from 04-API.md
- [ ] Zod validation schemas in `packages/shared` for all DTOs
- [ ] Error format with `request_id`, language-independent codes, localized messages
- [ ] 404-for-cross-clinic: another clinic's record returns 404 (identical to nonexistent)
- [ ] Pagination with cursor for list endpoints
- [ ] Idempotency key support for create endpoints
- **Commit**: "api: all slice 1 endpoints with validation and error handling"
- **Checkpoint**: Wait for approval.

### Step 7 — UI Slice 1 Minimal
- [ ] Next.js app structure with next-intl routing (fr/ar)
- [ ] Login page: email + password, 2FA step when required
- [ ] 2FA setup page with QR code and backup codes
- [ ] Account page: password change, 2FA setup/reset, session revoke
- [ ] Team and invites page (admin only): list staff, invite new members
- [ ] Clinic settings: name, address, locale, timezone, require_2fa_all toggle
- [ ] All strings through next-intl; verb-first buttons; Arabic RTL support
- **Commit**: "ui: minimal French/Arabic UI for auth, clinics, users"
- **Checkpoint**: Wait for approval.

### Step 8 — Tests
- [ ] Write Vitest/Jest unit tests for auth logic, permission checks, isolation
- [ ] Write Playwright E2E tests for: invite + first login with 2FA, login, session revoke
- [ ] Run full test suite: `pnpm test`
- [ ] Fix any failures
- **Commit**: "tests: isolation, permissions, and E2E suites passing"
- **Checkpoint**: Wait for approval.

### Step 9 — Final Integration
- [ ] Fresh clone run: `pnpm install`, `docker compose up -d`, `pnpm prisma migrate dev`, `pnpm prisma db seed`, `pnpm dev`
- [ ] Verify: create clinic + first admin works; staff join by invite; 2FA behaves as specified; deactivation takes effect immediately
- [ ] Record a short video/GIF of the critical flows working (French UI)
- **Commit**: "integration: fresh clone run end-to-end verified"
- **Final**: All checklist items in CLAUDE.md updated; plan.md, decisions.md and CLAUDE.md status checklist are current.

---

## 6. Risks and Open Questions

| Risk | Mitigation |
|---|---|
| Prisma schema conflicts with existing conventions | Review all field names against `02 - Data model.md` conventions before writing |
| RLS policy misconfiguration allows cross-tenant data access | Test isolation extensively; use both API and direct SQL with wrong `app.clinic_id` |
| TOTP implementation errors (clock drift, base32 encoding) | Use well-maintained library (speakeasy); allow 1-step drift in verification |
| Invite/token replay attacks | Enforce single-use, absolute expiry; hash tokens; family tracking for sessions |
| Arabic RTL bugs in Next.js + Tailwind | Test all screens in both languages from early; use logical CSS properties |
| Secret leakage in logs or error messages | Strict policy: no passwords, TOTP secrets, raw tokens in audit logs or error responses |
| Email deliverability in production | Use Mailpit in dev; transactional provider later; emails carry no patient data |
| Decision on `is_clinic_admin` default behavior | Per decisions.md: default false; enabled for users with role=admin and for solo doctors (role=doctor where clinic has single staff) |
| Subscription plan enum values | Per decisions.md: trial, solo, clinic — no payment integration in slice 1 |
| AuditLog metadata: field names only | Strict parser on write; reject any metadata containing values or patient data |

---

## 7. Checklist — Definition of Done for Slice 1

- [ ] Fresh clone: `pnpm install`, `docker compose up`, `pnpm prisma migrate dev`, `pnpm prisma db seed`, `pnpm dev` — all working
- [ ] All tests pass in CI, including isolation and permission suites
- [ ] A clinic and first admin can be created by script; staff join by invite
- [ ] 2FA and sessions behave as specified (doctors/admins mandatory, secretaries optional)
- [ ] Deactivation takes effect immediately (sessions revoked)
- [ ] `plan.md`, `decisions.md` and `CLAUDE.md` status checklist are up to date
- [ ] All seven build-order steps completed with commits, each passing lint/typecheck/tests

---