# Architecture

## Runtime topology

```text
Browser
  ├─ index.html + styles.css + config.js + app.js
  └─ All case requests include a user auth token
                │
                ▼
PocketBase 0.39.8
  ├─ users auth collection
  ├─ surgery_cases collection
  ├─ API rules
  ├─ schedule-conflict hook
  └─ SQLite files in pocketbase/pb_data
```

`scripts/start-pocketbase.*` serves both the static frontend and PocketBase from one process. For split hosting, set `config.js` `pocketBaseUrl` to the backend HTTPS URL and configure the backend origin/security policy appropriately.

## Frontend

`app.js` is a single IIFE with no external dependencies. It contains:

- `LocalCaseStore` for explicit local-only mode.
- `PocketBaseCaseStore` for REST authentication and CRUD.
- Daily, monthly, and dashboard renderers.
- Client-side overlap validation.
- Modal, navigation, print, toast, and periodic-refresh behavior.

The normal configuration uses PocketBase. To intentionally use local-only storage, set `pocketBaseUrl` to an empty string and understand that local mode has no shared database or server authorization.

## Authentication flow

1. The browser posts identity/password to `/api/collections/users/auth-with-password`.
2. The returned record and token are stored in `sessionStorage` under a key scoped to the backend URL and auth collection.
3. Subsequent requests send the token in `Authorization`.
4. Before every case load, auth-refresh validates the session and account status. A 401 clears the session; a 403 on auth-refresh also clears it (disabled account). A 403 on other operations reports insufficient permission.
5. The board is hidden in HTML until a verified case load succeeds. Logout clears the rendered cases and case form. A request generation guard discards loads completed after logout or account switching.

PocketBase superusers are only for setup, the PocketBase dashboard, and system administration. They must not be used by the web UI.

## Registration flow

1. `register.html` collects display name, email, password, and password confirmation.
2. `register.js` posts those fields to `POST /api/or-planner/register`.
3. `registration.pb.js` ignores client-controlled privilege fields and explicitly saves `role = viewer`, `active = true`, and `verified = false`.
4. The generic public create endpoint for `users` remains locked; the custom endpoint returns only a sanitized account summary and no auth token.
5. A PocketBase superuser can later promote the account through the dashboard or setup script.

## Authorization

| Resource/action | Rule |
| --- | --- |
| `users` login | `active = true` |
| Self-register a `users` record | Custom route forces active `viewer`; generic create remains superuser-only |
| Read own `users` record | Authenticated record ID matches and active |
| Read `surgery_cases` | Active authenticated `users` account |
| Create/update/delete `surgery_cases` | Active editor or admin |

The migration is the source of truth for these rules. Frontend `writeRoles` must remain consistent with it.

## Case schema

| Field | Type | Constraint |
| --- | --- | --- |
| `surgery_date` | text | Required `YYYY-MM-DD` |
| `operating_room` | select | `OR 1`, `OR 2` |
| `start_time` | text | Required `HH:mm` |
| `duration` | integer | 30–240 minutes |
| `patient_name` | text | Required, max 200 |
| `hn` | text | Optional, max 80 |
| `doctor` | text | Required, max 200 |
| `procedure` | text | Required, max 2,000 |
| `anesthesia` | select | `general`, `local`, `regional` |
| `status` | select | `confirmed`, `waitlist`, `coordination` |
| `implant` | text | Optional, max 2,000 |
| `statusConfirm` | select | `confirmed`, `no-answer`, `cancelled` |

`schedule_conflicts.pb.js` rejects overlapping intervals in the same room and date for create and update requests. This is the authoritative server validation layer in the current design.

## Schema evolution

- Add a new timestamped migration for every deployed schema change.
- Keep migrations and hooks committed.
- Test migrations against a new temporary data directory or an isolated copy before production.
- Do not manually edit production collections without recording an equivalent migration.

## Authenticated-read configuration

`config.js` and the frontend default both set `requireAuth: true`. Migration `1792285200_require_authenticated_case_reads.js` restricts list/view rules to active authenticated `users`. Guests see a login prompt and no case data is requested. The explicit local-only demo mode remains without authentication and must not be used for shared patient data.
