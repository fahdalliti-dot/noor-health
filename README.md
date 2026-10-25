# Slice 1 Design — Scaffolding, Clinics, Users, Roles, Audit Log

**Status**: draft for review
**Scope**: repo scaffolding + Prisma schema for slice 1 (clinics, users, roles, audit log) with tenant isolation
**Companion**: [CLAUDE.md](CLAUDE.md) — project guide, non-negotiable rules, roadmap

Section files live under [`docs/design/`](docs/design/).

## What this slice delivers

A runnable monorepo skeleton and a reviewed Prisma schema covering the
first roadmap step: **Auth, clinics, users and roles**. It establishes the
tenant model, the role/permission surface, session and refresh-token
storage, the audit-log table, and the API/UI scaffolding that later
slices build on. No patient data, appointments or billing yet — those are
later slices.

## Sections

| File | Covers |
|---|---|
| [01-architecture.md](docs/design/01-architecture.md) | Monorepo layout, stack choices, dev workflow, where each package lives |
| [decisions.md](docs/design/decisions.md) | All approved decisions from the consistency review, with IDs matching the open-questions list |
| [02 - Data model.md](docs/design/02 - Data model.md) | Prisma schema: clinics, users, roles, invites, sessions, audit log, money/date conventions |
| [03-auth-and-sessions.md](docs/design/03-auth-and-sessions.md) | Email+password, TOTP 2FA, recovery codes, session table, cookie strategy, lockout |
| [04 - API.md](docs/design/04 - API.md) | NestJS module layout, endpoint inventory for slice 1, permission model, validation, error shape |
| [05-ui.md](docs/design/05-ui.md) | Next.js app structure, i18n routing, auth flows, layout, accessibility and empty/loading states |

## Decisions

These were answered in the planning conversation and are binding for the
builder. They are restated here so the sections don't drift.

1. **Subscription** — minimal `Subscription` table only (clinic_id, plan,
   status, trial_ends_at). No payment integration, no feature gating yet.
2. **Clinic onboarding** — invite-only. No public signup. Clinics and their
   first admin are created via a seed/CLI command. Staff join via
   single-use, expiring invite links.
3. **2FA** — TOTP enforced for `admin` and `doctor` at slice 1, with
   recovery codes. Optional for `secretary`, plus a clinic-level setting
   to require it for all users.
4. **Sessions** — a `Session` table holding hashed refresh tokens, device
   info, `last_used_at`, `revoked_at`, with rotation and reuse detection.
   Deactivating a user revokes all their sessions. Short-lived access
   tokens, httpOnly cookies.
5. **i18n** — `locale` (default `fr`) and `timezone` (default
   `Africa/Casablanca`) stored on `Clinic`; nullable `locale` override on
   `User`. Text direction is derived from locale at render time — never
   stored.
6. **Hosting** — noted as a decision to confirm before deploy. Provider-
   agnostic: standard PostgreSQL, env-based config. Docker Postgres for
   local dev.

## Non-negotiable rules carried from CLAUDE.md

- Tenant isolation: every tenant-owned table has `clinic_id`; every query
  is scoped by the authenticated user's `clinic_id`, enforced centrally
  (Prisma middleware), never ad hoc in controllers.
- Audit log: every read/create/update/export/delete of patient data
  writes an append-only audit entry.
- No patient data in logs, errors, analytics or URLs — opaque IDs only.
- Permissions checked on the server; every endpoint declares its required
  role.
- Secrets from environment variables; never commit `.env` or keys.
- Fake data only in code, tests, seeds, fixtures, screenshots.
- Soft delete clinical records (`deleted_at`); hard delete only through an
  audited retention process.
- Timestamps in UTC; display in `Africa/Casablanca`. Money as integer
  centimes (MAD), never floats.
- Migrations only — never edit the schema by hand.

## Compliance context (Morocco)

Health data is sensitive under Law 09-08 and falls under CNDP oversight.
Any feature that collects, shares, exports or transfers patient data is
legally sensitive and must be flagged in the implementation summary.
Data must be hosted in Morocco or with a provider acceptable to CNDP —
**confirm before deploy**. Medical confidentiality limits access to the
care team of the clinic. This document is a development guide, not legal
advice; compliance decisions are reviewed by a qualified lawyer.

## Open questions for the builder

These are settled in conversation or by sensible defaults and marked as
"my call" where the builder may override.

- Prisma location (`packages/db/prisma/`) and Turbo vs plain pnpm scripts
  — my call: `packages/db/prisma/`, plain pnpm scripts for slice 1.
- Session cookie `SameSite` and environment (dev vs prod) — my call:
  `SameSite=lax`, with a flag to switch to `strict` in production.
- Invite-link expiry default — my call: 7 days, single use.