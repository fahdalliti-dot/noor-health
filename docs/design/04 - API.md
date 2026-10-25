# 04 - API

Status: draft. Part of the design doc set in `docs/design/`.
Depends on: `01-architecture.md` (request pipeline, roles), `02-data-model.md` (entities), `03-auth-and-sessions.md` (authentication details, which take precedence over anything here).

## 1. Conventions

| Topic | Rule |
|---|---|
| Style | REST over HTTPS, JSON bodies, base path `/api/v1`. |
| Auth | Access token and refresh token in httpOnly, Secure, SameSite cookies (see `03`). No tokens in URLs or local storage. |
| CSRF | State-changing requests require a CSRF token (double-submit or custom header). |
| Tenant | `clinic_id` is never accepted from the client. It comes from the session. |
| IDs | UUIDs in paths. Never expose sequential database IDs. Human-facing numbers (`file_number`, invoice `number`) are separate fields. |
| Validation | Every body, query and path parameter is validated with a shared Zod schema from `packages/shared`. Unknown fields are rejected. |
| Responses | Only whitelisted fields. Never return raw database rows or internal fields (hashes, secrets, storage keys). |
| Timestamps | ISO 8601 in UTC. The UI converts to the clinic timezone. |
| Money | Integer centimes (MAD) in fields suffixed `_cents`. |
| Language | `Accept-Language` selects the language of messages. Error `code` values are stable and language-independent. |
| Docs | OpenAPI generated from the schemas, served in non-production environments only. |

## 2. Errors

One format for every error:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Human-readable message in the user's language",
    "details": [{ "field": "phone", "issue": "invalid_format" }],
    "request_id": "01J..."
  }
}
```

| Status | When | Example codes |
|---|---|---|
| 400 | malformed request or validation failure | `validation_failed` |
| 401 | missing, expired or revoked credentials | `unauthenticated`, `session_revoked`, `two_factor_required` |
| 403 | authenticated but not permitted | `forbidden`, `clinical_access_required` |
| 404 | not found **or in another clinic** | `not_found` |
| 409 | conflict | `slot_unavailable`, `invoice_not_editable`, `already_signed` |
| 413 / 415 | upload too large or type not allowed | `file_too_large`, `unsupported_media_type` |
| 429 | rate limited | `rate_limited` |
| 5xx | server fault | `internal_error` |

Rules:
- Another clinic's record returns 404, identical to a nonexistent one, so IDs cannot be probed.
- Error messages and `details` never contain patient data. Field names and codes only.
- Every response carries `request_id`, also written to the audit log and application logs.

## 3. Pagination, filtering, search

- List endpoints use cursor pagination: `?limit=25&cursor=...` (max limit 100). Response: `{ "data": [...], "next_cursor": "..." | null }`.
- Filtering through explicit, documented query parameters (for example `status`, `from`, `to`, `doctor_id`). No arbitrary field filters.
- Patient search: `GET /patients?q=...` matches name (trigram), phone and file number. Minimum 2 characters, rate limited, and every search is audited without storing the search text.
- Default sort is documented per endpoint and stable.

## 4. Idempotency and concurrency

- Create endpoints that must not run twice (invoices, payments, appointments) accept an `Idempotency-Key` header. The same key and body returns the original result.
- Updates to shared records (appointments, invoices) use optimistic concurrency via `If-Match` with the record version or `updated_at`. A stale write returns 409.
- Number allocation (file number, invoice number) happens inside the creating transaction (see `ClinicCounter` in `02`).

## 5. Permissions

Each endpoint declares one permission. An endpoint without one fails at startup.

| Permission | admin | doctor | secretary |
|---|---|---|---|
| `clinic:manage` (settings, 2FA policy) | yes | no | no |
| `users:manage` (staff, invites, deactivate) | yes | no | no |
| `subscription:read` | yes | no | no |
| `audit:read` | yes | no | no |
| `patients:read` / `patients:write` | no | yes | yes |
| `medical_profile:read` / `:write` | no | yes | no |
| `appointments:read` / `:write` | no | yes | yes |
| `consultations:read` / `:write` | no | yes | no |
| `attachments:read` / `:write` (clinical kinds) | no | yes | no |
| `attachments:read` / `:write` (id documents) | no | yes | yes |
| `billing:read` / `billing:write` | no | yes | yes |

Notes:
- The secretary is denied clinical data by default. A clinic can grant `clinical_access` to a specific secretary, which adds the clinical permissions for that user only. Each grant is audited.
- Admins manage the clinic but do not read patient data by default. Whether admins need `billing:read` is an open question (section 12).
- Doctors can only be assigned appointments for themselves unless they hold a clinic-level scheduling permission.

## 6. Endpoints

All paths are under `/api/v1`. Exact request and response schemas live in `packages/shared` and the generated OpenAPI file.

### Auth (summary only, see `03`)
| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/login` | email + password, returns 2FA challenge when required |
| POST | `/auth/2fa/verify` | complete login with TOTP or recovery code |
| POST | `/auth/2fa/setup` | begin TOTP enrollment (QR secret) |
| POST | `/auth/2fa/confirm` | confirm enrollment, returns recovery codes once |
| POST | `/auth/refresh` | rotate refresh token |
| POST | `/auth/logout` | revoke current session |
| GET | `/auth/sessions` | list own sessions |
| DELETE | `/auth/sessions/:id` | revoke one of own sessions |
| POST | `/auth/invites/accept` | accept an invite, set password (public, token-based) |
| POST | `/auth/password/forgot`, `/auth/password/reset` | reset flow (public, rate limited) |

### Clinic and staff
| Method | Path | Permission |
|---|---|---|
| GET | `/clinic` | any authenticated |
| PATCH | `/clinic` | `clinic:manage` |
| GET | `/users` | `users:manage` |
| POST | `/invites` | `users:manage` |
| DELETE | `/invites/:id` | `users:manage` |
| PATCH | `/users/:id` | `users:manage` (role, active flag) |
| POST | `/users/:id/deactivate` | `users:manage` (revokes all sessions) |
| GET | `/subscription` | `subscription:read` |

Invariants: the last active admin cannot be deactivated or demoted. Users cannot change their own role.

### Patients
| Method | Path | Permission |
|---|---|---|
| GET | `/patients` | `patients:read` |
| POST | `/patients` | `patients:write` |
| GET | `/patients/:id` | `patients:read` |
| PATCH | `/patients/:id` | `patients:write` |
| DELETE | `/patients/:id` | `patients:write` (soft delete, doctor only) |
| GET | `/patients/:id/medical-profile` | `medical_profile:read` |
| PUT | `/patients/:id/medical-profile` | `medical_profile:write` |
| GET | `/patients/:id/history` | `consultations:read` (consultations, prescriptions, attachments, timeline) |

`POST /patients` returns a possible-duplicate warning (same name and birth date) without blocking creation.

### Appointments
| Method | Path | Permission |
|---|---|---|
| GET | `/appointments?from&to&doctor_id&status` | `appointments:read` |
| POST | `/appointments` | `appointments:write` |
| PATCH | `/appointments/:id` | `appointments:write` (reschedule, edit reason) |
| POST | `/appointments/:id/status` | `appointments:write` (confirm, arrive, start, complete, cancel, no_show) |
| GET | `/doctors/:id/availability?date` | `appointments:read` (free slots) |

Creating or moving an appointment into a taken slot returns 409 `slot_unavailable` (enforced by the database constraint, see `02`). Status transitions follow a fixed state machine, and illegal transitions return 409.

### Consultations and prescriptions
| Method | Path | Permission |
|---|---|---|
| POST | `/patients/:id/consultations` | `consultations:write` |
| GET | `/consultations/:id` | `consultations:read` |
| PATCH | `/consultations/:id` | `consultations:write` (draft only) |
| POST | `/consultations/:id/sign` | `consultations:write` (doctor who owns it) |
| POST | `/consultations/:id/amendments` | `consultations:write` (after signing) |
| PUT | `/consultations/:id/prescription` | `consultations:write` (replace items while draft) |
| GET | `/consultations/:id/prescription.pdf` | `consultations:read` (generated on demand) |

Signed consultations are immutable. Changes go through amendments (open question 1 in `02`).

### Attachments
| Method | Path | Permission |
|---|---|---|
| POST | `/patients/:id/attachments` | `attachments:write` |
| GET | `/patients/:id/attachments` | `attachments:read` |
| GET | `/attachments/:id/download` | `attachments:read` (redirect to a short-lived signed URL) |
| DELETE | `/attachments/:id` | `attachments:write` (soft delete) |

### Billing
| Method | Path | Permission |
|---|---|---|
| GET | `/invoices?patient_id&status&from&to` | `billing:read` |
| POST | `/invoices` | `billing:write` (supports `Idempotency-Key`) |
| GET | `/invoices/:id` | `billing:read` |
| POST | `/invoices/:id/issue` | `billing:write` (draft to issued, assigns number) |
| POST | `/invoices/:id/void` | `billing:write` (requires reason) |
| POST | `/invoices/:id/payments` | `billing:write` (supports `Idempotency-Key`) |
| GET | `/invoices/:id/receipt.pdf` | `billing:read` |
| GET | `/billing/daily-summary?date` | `billing:read` (totals by payment method) |

Issued invoices cannot be edited. Overpayment is rejected. Totals are recomputed on the server.

### Audit and compliance
| Method | Path | Permission |
|---|---|---|
| GET | `/audit-logs?user_id&entity_type&from&to` | `audit:read` |
| GET | `/patients/:id/access-log` | `audit:read` (who accessed this patient's data) |
| POST | `/exports/patient/:id` | `patients:read` + `consultations:read` (patient data export, audited) |

### Operational
| Method | Path | Notes |
|---|---|---|
| GET | `/health/live`, `/health/ready` | unauthenticated, no data, for load balancer and monitoring |
| POST | `/webhooks/messaging` | delivery status callbacks from the WhatsApp/SMS provider, signature verified |

## 7. File uploads

- `multipart/form-data`, one file per request, streamed to object storage (never buffered fully in memory).
- Maximum size: 10 MB per file (configurable).
- Allowed types: PDF, JPEG, PNG. DICOM and others are added deliberately later.
- Type is verified from the file content (magic bytes), not the filename or declared MIME type.
- Filenames are sanitized and never used as storage paths. The storage key is a generated random value.
- A SHA-256 checksum is stored and checked on download.
- Malware scanning before the file becomes downloadable is the target design. The tooling is an open decision (section 12). Until it exists, uploads are limited to the types above and the file is flagged `unscanned`.
- Downloads go through the API: permission check, audit entry, then a signed URL valid for about 60 seconds.

## 8. Rate limiting and abuse protection

| Scope | Limit (starting point) |
|---|---|
| Login, 2FA verify, password reset | strict per IP and per account, with lockout and backoff |
| Patient search | per user, to slow data harvesting |
| Uploads | per user and per clinic |
| General authenticated API | per user |

Exceeding a limit returns 429 with `Retry-After`. Repeated failures are written to the audit log. Exact numbers are tuned in staging.

## 9. Audit behavior

The audit interceptor (see `01`) records for every patient-data endpoint: user, action, entity, request ID, IP. Specific rules:
- Reads of a patient record, medical profile, consultation, attachment and exports are logged.
- List and search calls are logged once per request, without result contents or search text.
- Denied requests (`403`) are logged as `permission_denied`.
- The audit metadata holds changed **field names** only, never values.

## 10. Versioning and compatibility

- Breaking changes require `/api/v2`. Additive changes (new optional fields, new endpoints) do not.
- The web app and API deploy together at the pilot stage, but the API must stay backward compatible for one release so a stale browser tab does not break.
- Deprecated fields are marked in OpenAPI and removed only after a release cycle.

## 11. Future and out of scope (for now)

- Public online booking (a separate, tightly rate-limited, unauthenticated surface with its own threat model).
- Patient portal and patient authentication.
- Insurance claim submission (CNSS, CNOPS) and electronic prescriptions to pharmacies.
- Bulk import of patients from Excel (planned as a migration tool for pilot clinics).
- Doctor availability and leave rules (see open question 3 in `02`).

## 12. Open questions

| # | Question | Notes |
|---|---|---|
| 1 | Does the admin need `billing:read`? | Useful for owners, but widens access to financial data. |
| 2 | Malware scanning tool for uploads | Must run in Morocco-compliant infrastructure. |
| 3 | CSRF approach | Double-submit cookie vs custom header, to settle with `03`. |
| 4 | Granting clinical access to secretaries | Per user flag vs a custom role per clinic. |
| 5 | Patient data export format | PDF, JSON, or both. Needed for access requests under Law 09-08. |
| 6 | Rate limit values | To be tuned against real pilot usage. |