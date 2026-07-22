# Architecture

## Runtime topology

```text
Browser
  ├─ index.html + styles.css + config.js + app.js
  └─ REST requests with user auth token
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
4. A 401 clears the browser session; a 403 preserves login and reports insufficient permission.

PocketBase superusers are only for setup, the PocketBase dashboard, and system administration. They must not be used by the web UI.

## Authorization

| Resource/action | Rule |
| --- | --- |
| `users` login | `active = true` |
| Read own `users` record | Authenticated record ID matches and active |
| Read `surgery_cases` | Active authenticated user |
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

`schedule_conflicts.pb.js` rejects overlapping intervals in the same room and date for create and update requests. This is the authoritative server validation layer in the current design.

## Schema evolution

- Add a new timestamped migration for every deployed schema change.
- Keep migrations and hooks committed.
- Test migrations against a new temporary data directory or an isolated copy before production.
- Do not manually edit production collections without recording an equivalent migration.

## Current configuration caveat

At the 2026-07-22 handoff, `config.js` has `requireAuth: false`, while PocketBase collection rules require authentication for all case reads and writes. Confirm the intended unauthenticated experience before release. The earlier role-based UI verification used `requireAuth: true`. Do not silently change this setting; resolve and retest it deliberately.

