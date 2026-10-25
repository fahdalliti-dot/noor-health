# 03 - Auth and Sessions

Status: draft. Part of the design doc set in `docs/design/`.
Depends on: `01-architecture.md`, `02-data-model.md`. Feeds: `04-api.md`, `05-ui.md`.

This doc covers authentication, 2FA, session management, invite links, and password reset for slice 1.

## 1. Authentication flow

### Login
1. User submits email + password to `POST /auth/login`.
2. System looks up user by email (globally unique), verifies password hash (argon2id).
3. If 2FA is enabled for this user (required for doctor/admin, optional for secretary per clinic setting):
   - Return `{ requires_2fa: true, session_id: "..." }` — no access token yet.
   - User must submit TOTP code to `POST /auth/2fa/verify` with the session_id.
4. On successful 2FA (or if 2FA not required):
   - Create a new Session row with hashed refresh token, device info, IP.
   - Return short-lived JWT access token (httpOnly cookie) + refresh token (httpOnly cookie, rotated).
5. Write audit log: `action: login` or `login_failed`.

### Token structure
- **Access token**: JWT, 15-minute expiry, contains `user_id`, `clinic_id`, `role`, `session_id`. Signed with HS256 or RS256 (key from env). No patient data.
- **Refresh token**: Opaque, stored hashed in DB, 7-day absolute expiry, rotated on each use with family tracking.

### Logout
- Client calls `POST /auth/logout` (or silent on token expiry).
- Server revokes the session (`revoked_at` set, reason: `logout`).
- Clears cookies.

## 2. Two-factor authentication (TOTP)

### Enforcement rules
- **Doctors and admins**: 2FA mandatory at slice 1. Cannot disable.
- **Secretaries**: 2FA optional per user, but clinic can set `require_2fa_all: true` to enforce for all roles.

### Setup flow (first login or settings page)
1. User requests 2FA setup: `POST /auth/2fa/setup`.
2. Server generates TOTP secret (base32, 160-bit), stores encrypted (`totp_secret`), returns QR code URI and backup codes.
3. User scans QR, enters first TOTP code to confirm.
4. Server sets `totp_enabled_at`, marks 2FA active.
5. Backup codes (10 codes, single-use) are shown once, stored hashed like passwords.

### Verification
- TOTP window: 30 seconds, allow 1-step drift (±30s) for clock skew.
- Rate limit: 5 failed attempts per 5 minutes per user, then lockout (audit: `login_failed`).

### Recovery codes
- Generated in batches of 10 at 2FA setup.
- Each code is 8 alphanumeric characters, stored hashed (bcrypt or argon2id).
- Single use: using a code invalidates it (`used_at` set).
- User can regenerate (invalidates old batch, requires re-authentication).

## 3. Session management

### Storage
Sessions table (`02-data-model.md` section 3) stores:
- `family_id`: groups rotation chain (same browser/device).
- `refresh_token_hash`: hashed opaque token, unique.
- `device_label`: parsed UA (e.g., "Chrome on Windows").
- `ip`: inet type for IPv4/IPv6.
- `expires_at`: absolute lifetime (7 days default).
- `revoked_at`, `revoked_reason`: for audit and reuse detection.

### Rotation with reuse detection
1. Client sends refresh token to `POST /auth/refresh`.
2. Server hashes incoming token, looks up session.
3. If found and not expired/revoked:
   - Generate new refresh token, new `family_id` (or keep same for parallel tabs — decision below).
   - Mark old session as `revoked_at: now, reason: rotated`.
   - Return new access + refresh tokens.
4. If the incoming token matches a *already-rotated* session (reuse attack detected):
   - Revoke the entire `family_id` (all sessions in the chain).
   - Audit: `session_reuse_detected`.
   - Force re-login.

### Family tracking decision
Option A: New `family_id` on each rotation — stricter, detects any reuse but breaks parallel tabs.
Option B: Same `family_id` for the chain, track only the latest valid token — allows parallel tabs, still detects cross-device reuse.

**Decision**: Option B for usability. Secretaries may have multiple tabs open for scheduling. Parallel tabs share a family; reuse from a different device/family triggers revoke.

### Revocation triggers
- User logs out: revoke current session.
- Admin deactivates user: revoke all sessions for that user (`is_active: false` triggers cascade).
- Password change: revoke all sessions (force re-login with new password).
- 2FA enforcement change: if clinic enables `require_2fa_all`, users without 2FA get sessions revoked on next request.

## 4. Invite links

### Creation (admin only)
1. Admin calls `POST /clinics/:clinicId/invites` with `{ email, role }`.
2. Server creates Invite row:
   - `token`: raw UUID v4, shown only in the emailed link.
   - `token_hash`: SHA256(token), stored unique index.
   - `expires_at`: 7 days from creation.
   - `invited_by`: admin's user ID.
3. Email sent via provider (later integration) with link: `https://app.example.com/join/:token`.

### Acceptance flow
1. User clicks link, lands on signup page.
2. Frontend validates token format, fetches invite metadata (email, role, clinic name — no sensitive data).
3. User sets password, confirms email matches.
4. Backend:
   - Verifies token hash exists, not expired, not accepted, not revoked.
   - Creates User row with `clinic_id`, `role`, `email`.
   - Marks invite `accepted_at: now`.
   - Logs audit: `user_created_via_invite`.
5. Auto-login: create session, return tokens.

### Security properties
- Token is single-use, short-lived, cannot be brute-forced (UUID v4 entropy).
- Email must match exactly — no hijacking via typos.
- Admin can revoke pending invites (`revoked_at` set).

## 5. Password reset

### Request flow
1. User clicks "Forgot password", submits email.
2. Server looks up user by email, creates/reset token (similar to invite):
   - `reset_token_hash`: stored.
   - `expires_at`: 1 hour from creation.
3. Email sent with reset link: `https://app.example.com/reset/:token`.
4. Audit: `password_reset_requested` (no patient data).

### Reset flow
1. User submits token + new password.
2. Server verifies token hash, checks expiry.
3. Hashes new password (argon2id), updates user.
4. Revokes all sessions (force re-login everywhere).
5. Marks token used, audit: `password_reset_completed`.

### Rate limiting
- Max 3 reset requests per email per hour.
- Generic response: "If an account exists, you'll receive an email" — no enumeration.

## 6. Password policy

- Minimum 12 characters.
- Not in common password list (HaveIBeenPwned API or local bloom filter — later decision).
- No personal info (email, name) — basic heuristic check.
- Stored with argon2id (memory: 64MB, iterations: 3, parallelism: 4).

## 7. Clinic-level 2FA policy

Clinic has `require_2fa_all` boolean (default false):
- When true: secretaries must enable 2FA to log in (same flow as doctors/admins).
- When false: secretaries can skip 2FA (not recommended).
- Changing from false→true does not immediately revoke sessions — users are prompted on next login.

## 8. Audit logging for auth events

| Event | Fields logged |
|---|---|
| `login` | user_id, clinic_id, ip, user_agent, success/failure |
| `logout` | user_id, session_id |
| `login_failed` | email (masked?), ip, reason (wrong_password, 2fa_invalid, account_locked) |
| `2fa_setup` | user_id, method: totp |
| `2fa_disabled` | user_id (only if allowed — e.g., secretary) |
| `password_reset_requested` | email (masked), ip |
| `password_reset_completed` | user_id, ip |
| `invite_created` | invited_email, role, invited_by |
| `invite_accepted` | user_id, clinic_id, role |
| `session_revoked` | session_id, user_id, reason |
| `session_reuse_detected` | family_id, user_id, ip (both IPs if detectable) |

No passwords, TOTP secrets, or raw tokens in audit logs.

## 9. Cookie configuration

| Environment | Secure | SameSite | Domain |
|---|---|---|---|
| local (localhost:3000/4000) | false | lax | localhost |
| staging | true | lax | *.staging.example.com |
| production | true | strict | app.example.com |

HttpOnly always. Access token: `Max-Age=900` (15 min). Refresh token: `Max-Age=604800` (7 days).

## 10. Open decisions

| # | Decision | Notes |
|---|---|---|
| 1 | JWT signing algorithm | HS256 (simpler, shared secret) vs RS256 (asymmetric, better for future microservices). Lean HS256 for slice 1. |
| 2 | Password breach checking | Integrate HaveIBeenPwned API (k-anonymity) or skip for pilot? |
| 3 | Session absolute timeout | 7 days default — too long for clinics? Consider 24h for high-security environments. |
| 4 | Remember me option | Extend refresh token to 30 days? Or force daily login for clinical staff. |
| 5 | Email provider for invites/resets | SendGrid, Mailgun, or self-hosted SMTP? Compliance (data location) matters. |
| 6 | Account lockout duration | After 5 failed logins: 15 min? Indefinite until admin unlock? |

## 11. Implementation checklist for slice 1

- [ ] NestJS auth module with guards, strategies (local, JWT, 2FA).
- [ ] Prisma schema for User, Session, RecoveryCode, Invite (section 3 of `02-data-model.md`).
- [ ] TOTP generation/verification (speakeasy or otpauth library).
- [ ] Argon2id password hashing (node-argon2).
- [ ] Invite link creation, email placeholder (log to console for dev), acceptance endpoint.
- [ ] Password reset flow (console email for dev).
- [ ] Session rotation middleware with family tracking.
- [ ] Audit log writes for all auth events.
- [ ] E2E tests: login, 2FA flow, invite acceptance, session reuse detection, tenant isolation on auth.