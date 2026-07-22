# Project context index

Read this file after `AGENTS.md` when continuing the project on a new device or in a fresh session.

## Canonical documents

| Document | Read when |
| --- | --- |
| `../DESIGN.md` | Changing UI, fields, terminology, responsive behavior, or workflows |
| `ARCHITECTURE.md` | Changing frontend code, PocketBase schema, API behavior, or authentication |
| `SECURITY.md` | Touching auth, permissions, hosting, backups, patient data, or secrets |
| `OPERATIONS.md` | Running locally, creating users, deploying, restoring, or troubleshooting |
| `DEVICE-MIGRATION.md` | Moving work, data, and Codex context to another device |
| `HANDOFF.md` | Understanding current completion state, open decisions, and next work |
| `pocketbase-setup.md` | Looking up detailed PocketBase fields and environment variables |

## Repository map

```text
index.html                    Static Thai UI and modal markup
styles.css                   Responsive, dashboard, modal, and print styling
app.js                       State, rendering, auth, roles, validation, and CRUD
config.js                    Runtime PocketBase/auth configuration
register.html                Dedicated viewer-registration page
register.css                 Responsive registration-page styling
register.js                  Registration validation and custom API client
pocketbase/pb_migrations/    Versioned PocketBase schema and API rules
pocketbase/pb_hooks/         Server-side registration and schedule validation
scripts/                     Windows and Unix download/setup/start scripts
skills/                      Portable project continuation skill
```

## Quick technical summary

- Static HTML/CSS/JavaScript; no framework or build step.
- PocketBase 0.39.8 supplies SQLite persistence, REST APIs, and authentication.
- Frontend and PocketBase default to the same origin.
- `users` roles are `viewer`, `editor`, and `admin`.
- Public self-registration always creates an active, unverified `viewer` through a narrow custom route.
- `surgery_cases` is private to active authenticated users; writes require editor or admin.
- The frontend auth token is stored in `sessionStorage`, not persistent local storage.
- `pb_data` is local/production state and is intentionally ignored by Git.
