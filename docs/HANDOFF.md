# Current handoff

Last updated: 2026-07-24

## Repository state

- Branch: `main`.
- Remote: `origin` at `https://github.com/insthync/nines-eyeodsplaning-opd-1.git`.
- Git history currently contains only the old initial commit.
- The current application, PocketBase integration, scripts, and documentation are uncommitted working-tree changes. Run `git status --short`; do not assume a fresh clone contains this work until it is committed and pushed.

## Implemented

- Thai responsive OR planning board inspired by the original Canva site.
- Daily, monthly, dashboard, and print views.
- Daily timetable covers 08:00–21:00 with selectable start times through 20:30; 30-minute rows fit complete case-card details, and the time column stays fixed during horizontal scrolling.
- Daily case cards show time/duration, patient name with optional HN, doctor, procedure, and anesthesia.
- Add/edit/delete case forms and client-side overlap checks.
- PocketBase REST adapter with session login and role-aware UI.
- Signed-out header uses `#add-case-button` as the login entry point; the separate account-status chip appears only after login.
- Dedicated Thai registration page linked from login; self-registration is forced to `viewer` by a PocketBase custom route.
- `viewer`, `editor`, and `admin` users.
- PocketBase migration for `users` and `surgery_cases` rules/schema.
- Public appointment reads for guests, viewers, editors, and admins; writes remain limited to active editors/admins.
- Server hook rejecting overlapping room schedules.
- Windows PowerShell and Linux/macOS Bash download/setup/start scripts.
- Same-origin frontend/API serving suitable for a small VPS.
- Repository-owned continuation context: `AGENTS.md`, `DESIGN.md`, focused `docs/`, and a portable Codex skill.

## Verified during implementation

- JavaScript syntax for frontend, migration, and hook.
- PowerShell parsing and script behavior.
- Bash syntax, LF line endings, and a full Linux-container setup/start flow.
- Migration and setup idempotency with temporary data.
- Public-read migration on a clean temporary PocketBase database: guest, viewer, editor, and admin list/detail reads; guest/viewer writes rejected; editor/admin create, update, and delete allowed.
- Registration API behavior: privilege fields cannot override `viewer`; generic public `users` creation remains locked.
- Registration page submit/success flow at desktop and 390 px mobile width, with no browser console errors or horizontal overflow.
- Browser UI role behavior when authentication was required: editor add enabled; viewer add disabled.
- Signed-out add/login control and signed-in add/account transition at desktop and 390 px widths, with no browser console errors or horizontal overflow.
- Case-card details at 1440 px and 390 px: 60- and 120-minute cards show time/duration, patient with HN, doctor, procedure, and anesthesia without content overflow or browser console errors.
- Enlarged 30-minute rows at 800 px and 390 px: complete five-line cards fit without content overflow; longer cases remain proportional, schedule scrolling stays internal, and no browser console errors occur.
- `git diff --check`.

## Open decisions and risks

1. Public API reads expose all `surgery_cases` fields, including patient name, HN, procedure, doctor, and schedule data. Formal organizational privacy/security/compliance approval is required before storing real patient data; otherwise introduce a redacted public data model.
2. Signed-out browser verification for the new public-read contract is still pending on a browser that can reach the local test server; the current in-app browser blocked localhost navigation by policy.
3. `editor` and `admin` currently have identical case permissions. Admin-only user management/audit features do not exist.
4. No automated test suite or CI workflow exists.
5. No production deployment files exist yet (`systemd`, Caddy, firewall, backup automation, monitoring).
6. Hosting was discussed but not provisioned. Hetzner CX23 was recommended; pricing and region must be rechecked before purchase.
7. The original reference site should be treated as visual/workflow inspiration, not copied assets.

## Suggested next work

1. Obtain an explicit privacy/security decision on publishing patient-identifying appointment fields, or implement a redacted public representation.
2. Review and commit the current working tree, then push it so another device can recover it.
3. Add automated tests for overlap logic, role handling, and PocketBase API rules.
4. Add a production deployment package for the selected host.
5. Add encrypted backup/restore automation and a restore drill.

## Handoff maintenance

After each meaningful task, replace stale statements here with observed state and record the exact validation performed. Never include credentials, tokens, patient records, or private infrastructure details.
