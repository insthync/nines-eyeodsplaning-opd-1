---
name: continue-or-planning-board
description: Continue, review, debug, secure, test, or deploy the OR Planning Board PocketBase appointment website across devices and fresh Codex sessions. Use when working in this repository on its Thai scheduling UI, case CRUD, authentication and viewer/editor/admin roles, PocketBase migrations or hooks, Windows/Unix scripts, hosting, backups, or project handoff documentation.
---

# Continue OR Planning Board

Use the repository documentation as durable context. Reconstruct current state from files and Git before changing anything; never depend on prior chat history.

## Start

1. Read [`AGENTS.md`](../../AGENTS.md).
2. Read [`docs/INDEX.md`](../../docs/INDEX.md).
3. Read [`docs/HANDOFF.md`](../../docs/HANDOFF.md).
4. Run `git status --short` and inspect the files relevant to the request.
5. Treat implementation as the final authority when documentation and code differ; then update the stale document.

## Route context

- UI/product work: read [`DESIGN.md`](../../DESIGN.md).
- Frontend, API, auth, schema, or hook work: read [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md).
- Auth, patient data, secrets, backups, or hosting: read [`docs/SECURITY.md`](../../docs/SECURITY.md).
- Setup, user creation, deployment, or troubleshooting: read [`docs/OPERATIONS.md`](../../docs/OPERATIONS.md).
- Device transfer: read [`docs/DEVICE-MIGRATION.md`](../../docs/DEVICE-MIGRATION.md).

## Work safely

- Preserve Thai UI conventions and `id="add-case-button"` unless explicitly asked otherwise.
- Keep superusers out of browser code and enforce permissions in PocketBase rules.
- Never inspect, modify, copy, delete, or test against real `pb_data` without explicit authorization.
- Use temporary PocketBase data for migrations and integration tests.
- Create new migrations for schema evolution; keep the overlap hook authoritative.
- Keep Unix scripts LF-only and retain Windows equivalents when changing shared behavior.
- Preserve unrelated working-tree changes.

## Validate and hand off

Run checks proportional to risk, including syntax, `git diff --check`, temporary PocketBase API tests, and browser verification for UI/auth changes. Do not claim production readiness from syntax checks alone.

Update [`docs/HANDOFF.md`](../../docs/HANDOFF.md) after material work. Update architectural, design, security, or operations documents whenever their contracts change. Never write secrets or patient data into the handoff.

