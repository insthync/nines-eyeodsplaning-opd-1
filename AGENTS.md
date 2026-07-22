# OR Planning Board agent instructions

This repository is the source of truth for continuing the OR Planning Board across Codex sessions and devices.

## Start every task here

1. Read `skills/continue-or-planning-board/SKILL.md`.
2. Read `docs/INDEX.md` and the documents it routes to for the task.
3. Run `git status --short` before editing. Preserve unrelated and user-authored changes.
4. Inspect the current implementation instead of assuming the handoff is perfectly current.

## Non-negotiable constraints

- Keep the primary UI in Thai unless the user requests another language.
- Preserve `id="add-case-button"`; external requirements refer to it directly.
- Never commit `pocketbase/pb_data`, PocketBase binaries, credentials, tokens, patient exports, or backups.
- Never expose PocketBase superuser credentials to browser code. Browser users belong to the `users` auth collection.
- Treat patient name, HN, procedure, and schedule data as sensitive health information.
- Keep authorization enforced by PocketBase API rules. UI disabling is only a convenience, not a security boundary.
- Represent schema changes as new files in `pocketbase/pb_migrations`; do not rewrite an applied migration without a deliberate migration strategy.
- Keep overlap validation on both client and server. The server hook is authoritative.
- Do not mutate or test against the user's real `pocketbase/pb_data` without explicit authorization. Use a temporary data directory.
- Keep shell scripts LF-only and compatible with Linux/macOS Bash.

## Validation baseline

Choose checks proportional to the change:

- JavaScript syntax: parse `app.js`, `config.js`, migrations, and hooks.
- Bash: `bash -n scripts/*.sh`.
- PowerShell: parse all `scripts/*.ps1` files.
- Repository hygiene: `git diff --check` and `git status --short`.
- Auth/data changes: use a temporary PocketBase data directory and verify viewer/editor/admin behavior through the API.
- UI changes: run PocketBase locally and verify the affected flow in a browser at desktop and narrow widths.

There is no package manager, build step, or automated test suite yet.

## Keep the handoff current

Update `docs/HANDOFF.md` after material changes. Update `DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, or `docs/OPERATIONS.md` whenever their contracts change.

