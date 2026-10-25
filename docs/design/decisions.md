# Decisions — Slice 1 design docs

**Status**: approved. Recorded from the consistency-review resolution session.
**Applies to**: `01-architecture.md`, `02 - Data model.md`,
`03-auth-and-sessions.md`, `04 - API.md`, `05-ui.md` (all under `docs/design/`).

How to read this file: each decision carries the ID it had in the open-questions
list of the consistency report. Decisions marked "deferred" are carried forward
to a named slice rather than resolved now.

## A. Structure and scope

| ID | Decision | Notes |
|---|---|---|
| 1 | Keep the five design docs in `docs/design/`. Put future slice specs in `docs/design/slices/`. Drop the `docs/superpowers/...` path. Fix all cross-references. | Resolves finding B1. |
| 4 | Slice 1 creates only the tables it needs (Clinic, User, RecoveryCode, Invite, Session, Subscription stub, AuditLog, PasswordResetToken). Later slices add their tables by migration. `02 - Data model.md` stays the full target schema. | Resolves finding C2. |

## B. Audit and security events

| ID | Decision | Notes |
|---|---|---|
| 2 | Extend the AuditLog `action` enum now with auth and admin events: 2FA enabled/failed, password reset requested/completed, session revoked, invite created/accepted, user deactivated, role changed, clinical access granted. | Resolves finding B2. |
| 12 | Rows with null `clinic_id` (platform actions) are never visible to clinic admins. Tenant RLS hides them. | Resolves finding G7. |

## C. Permissions and roles

| ID | Decision | Notes |
|---|---|---|
| 3 | Add `patients:delete` (soft delete), doctor only. Secretary cannot delete. | Resolves finding C1. |
| 5 | No new permission for doctors managing others' appointments. Doctors manage their own appointments, secretaries manage all. Revisit in the appointments slice. | Resolves finding C3. |
| 16 | Admin has no `billing:read` for now; revisit after pilot feedback. Solo doctors are covered by `is_clinic_admin`. | Resolves finding M1 / API Q1. |
| 17 | A per-user `clinical_access` flag on secretaries, audited on grant and revoke. | Resolves API Q4. |
| — | **Add `is_clinic_admin` to the User model.** Boolean, default false. Grants admin-level permissions for the user's own clinic. Used for solo doctors (role `doctor` who own and run the clinic). Permission checks updated in `01`, `04`, `05`. | New, requested separately. |

## D. Auth and sessions

| ID | Decision | Notes |
|---|---|---|
| 6 | Add `PasswordResetToken` (user_id, token_hash, expires_at ~30 min, used_at). Single use. A reset revokes all sessions. | Resolves finding G1. |
| 7 | 15-minute idle auto-lock, a constant in slice 1. Make it a clinic setting later. | Resolves finding G2. |
| 13 | One pending invite per email per clinic. Resend revokes the old token and issues a new one. An email already belonging to any clinic cannot be invited. | Resolves finding G8. |
| 14 | `SameSite=Strict` cookies plus a double-submit CSRF token header on state-changing requests. | Resolves auth/API Q3. |
| 15 | HS256 with a strong secret from the environment. Revisit only if a second service must verify tokens. | Resolves auth Q1. |
| 19 | Login rate limits: 5 failed attempts per account per 15 min, 20 per IP per 15 min. Tune in staging. | Resolves API Q6. |
| 20 | Lock the account for 15 minutes after 5 failures, escalating on repeats, and log each lockout. | Resolves auth Q6. |
| 21 | Hide email behind an interface. Use a local mail catcher (Mailpit) in dev. Pick a transactional provider before staging. Emails carry no patient data, so the risk is lower than for storage. | Resolves auth Q5. |
| 22 | Skip the breach-check API. Use a 12-character minimum plus a local common-password blocklist. | Resolves auth Q2. |
| 23 | Access token 15 min. Refresh tokens absolute lifetime 12 hours. No remember-me in v1. Adjust after pilot. | Resolves auth Q3/Q4. |
| 29 | A correct password that still needs 2FA returns 200 with `{"status":"two_factor_required"}` and a short-lived challenge token. Use 401 only for failed authentication. | Resolves finding M3. |

## E. Data model

| ID | Decision | Notes |
|---|---|---|
| 8 | Add `first_day_of_week` to Clinic, default Monday. Do it with the agenda slice, not slice 1. | Resolves finding G3. |
| 9 | Worker-only, no reminder API until the reminders slice. | Resolves finding G4. |
| 10 | Stub the doctor-availability endpoint in slice 1, implement with the appointments slice. | Resolves finding G5. |
| 11 | Minimal envelope encryption scheme now (AES-256-GCM, envelope with a keys table); full scheme before slice 4. | Resolves finding G6. |
| 27 | Entity `Reminder`, module renamed `reminders`. | Resolves finding M1. |
| 28 | Entity `Invoice` in code. The French UI and PDF label it "Reçu" (receipt). | Resolves finding M2. |

## F. UI

| ID | Decision | Notes |
|---|---|---|
| 18 | Defer the export format to the lawyer. Build JSON first. | Resolves API Q5. |
| 24 | shadcn/ui on Radix. | Resolves UI Q3. |
| 25 | Same as #7 — idle lock. Duplicate of decision 7. | — |
| 26 | UI copy in Modern Standard Arabic. Free-text fields accept any script. | Resolves UI Q2. |
| 30 | Ship French and Arabic only in v1. Remove English from the UI scope; keep the locale list extensible. | Resolves finding M7. |

## G. Deferred to later slices or external review

| ID | Item | When |
|---|---|---|
| — | Hosting provider and region (CNDP compliance) | Before deploy; needs a lawyer. |
| — | Job queue technology (Redis vs Postgres-backed) | Before the reminders slice. |
| — | Object storage provider | Before the attachments slice. |
| — | WhatsApp/SMS provider | Before the reminders slice. |
| — | Error tracking and monitoring | Before deploy. |
| — | Malware scanning for uploads | Before the attachments slice. |
| — | Blind index for `national_id` search | Only if staff must search by CIN. |
| — | Medication catalog vs free text | Before the prescriptions slice. |
| — | Amendments to signed consultations (versioned rows vs addendum) | Before the consultations slice. |
| — | Doctor availability and leave model | Before online booking. |
| — | Multi-clinic users | Out of scope for the pilot. |
| — | Audit-log retention period | Needs a lawyer. |
| — | Patient data export format | Needs a lawyer; build JSON first. |
| — | Full encryption scheme for health data | Before slice 4. |
| — | First day of week / weekend handling | With the agenda slice. |
| — | Consultation note templates by specialty | After pilot feedback. |
| — | Branding and logo | Not decided. |