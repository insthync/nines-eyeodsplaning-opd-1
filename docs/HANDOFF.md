# Current handoff

Last updated: 2026-10-18

## Latest change: login required for the board

- All planning views, navigation, and print controls stay hidden until an active user session is verified and case data loads. Guests see a Thai login prompt.
- Logout clears cases, dashboard output, and case form contents. Pending loads cannot restore data after logout or an account switch.
- Auth-refresh runs before every case load, including restored sessions and periodic refresh. Invalid sessions and disabled accounts clear the board; ordinary write-permission errors preserve login.
- Mobile headers now keep the account control accessible for logout and account switching.
- Added migration `1792285200_require_authenticated_case_reads.js` to restrict list/detail reads to active authenticated `users`; write permissions remain editor/admin only. Existing applied migrations were not changed.
- All seven frontend CSS/JavaScript references use `202610181300` (Asia/Bangkok).
- Validation: frontend/migration/hook JavaScript syntax; PowerShell script parsing; Bash syntax; git diff whitespace check. Temporary PocketBase API checks passed for guest/invalid-token read restrictions, viewer/editor/admin reads, guest/viewer write rejection, editor/admin create/update/delete, and disabled-account denial (auth-refresh returns 403).
- Browser checks at 1440 px and 390 px passed for login, restored session, failed login, viewer/editor controls, monthly/dashboard views, logout, and periodic disabled-account clearing. No page overflow or browser console errors observed. Temporary async regression checks passed for no guest fetch, logout during a pending load, account-switch races, and stale 401 responses.
- No real PocketBase data was accessed. Deployment still needs the frontend and new migration together; the normal start script applies pending migrations. No deployment was performed.

## Repository state

- Branch: `main`.
- Remote: `origin` at `https://github.com/insthync/nines-eyeodsplaning-opd-1.git`.
- The working tree was clean before the login-required change. The user requested committing and pushing this change to `origin/main`; verify current Git status and remote synchronization before continuing.

## Implemented

- Thai responsive OR planning board inspired by the original Canva site.
- Daily, monthly, dashboard, and print views.
- Monthly date cells show only the case count; patient and time previews are intentionally omitted to keep calendar rows uniform.
- Daily timetable covers 08:00–21:00 with selectable start times through 20:30; 30-minute rows are 128 px tall at desktop and narrow widths so all six case-card lines, including Implant, fit without clipping, and the time column stays fixed during horizontal scrolling.
- Daily case cards show time/duration with confirmation status, patient name with optional HN, doctor, procedure, anesthesia, and Implant.
- Add/edit/delete case forms, Implant and confirmation-status fields, and client-side overlap checks.
- Case create/update payloads send the required PocketBase `statusConfirm` field while normalized frontend records use `status_confirm` internally.
- PocketBase REST adapter with session login and role-aware UI.
- Signed-out header uses `#add-case-button` as the login entry point; the separate account-status chip appears only after login.
- Dedicated Thai registration page linked from login; self-registration is forced to `viewer` by a PocketBase custom route.
- `viewer`, `editor`, and `admin` users.
- PocketBase migration for `users` and `surgery_cases` rules/schema.
- Appointment reads require active authenticated users; writes remain limited to active editors/admins.
- Server hook rejecting overlapping room schedules.
- Windows PowerShell and Linux/macOS Bash download/setup/start scripts.
- Same-origin frontend/API serving suitable for a small VPS.
- Shared frontend asset query timestamp in `index.html` and `register.html` for cache busting without a user hard refresh; every deployed code change must update all values together.
- Repository-owned continuation context: `AGENTS.md`, `DESIGN.md`, focused `docs/`, and a portable Codex skill.

## Verified during implementation

- JavaScript syntax for frontend, migration, and hook.
- PowerShell parsing and script behavior.
- Bash syntax, LF line endings, and a full Linux-container setup/start flow.
- Migration and setup idempotency with temporary data.
- Historical public-read migration check (superseded by the authenticated-read checks above): guest, viewer, editor, and admin list/detail reads; guest/viewer writes rejected; editor/admin create, update, and delete allowed.
- Registration API behavior: privilege fields cannot override `viewer`; generic public `users` creation remains locked.
- Registration page submit/success flow at desktop and 390 px mobile width, with no browser console errors or horizontal overflow.
- Browser UI role behavior when authentication was required: editor add enabled; viewer add disabled.
- Signed-out add/login control and signed-in add/account transition at desktop and 390 px widths, with no browser console errors or horizontal overflow.
- Case-card details at 1440 px and 390 px: 60- and 120-minute cards show time/duration, patient with HN, doctor, procedure, and anesthesia without content overflow or browser console errors.
- Enlarged 30-minute rows with a temporary 30-minute Implant case at 1440 px and 390 px: complete six-line cards fit without vertical content overflow, Implant remains inside the card, longer cases remain proportional, schedule scrolling stays internal on narrow screens, the page has no horizontal overflow, and no browser console errors occur.
- Monthly case-count-only cells with synthetic temporary data at 1265 px and 375 px: populated dates showed the correct counts, every calendar row had one consistent height, no patient/time preview elements were rendered, and there was no horizontal overflow or browser console error.
- Implant/confirmation-status regression on a clean temporary PocketBase database: editor API create/update persisted `no-answer` and `cancelled`; browser create/edit showed the saved value and Implant on the case card; the edit form restored both fields at desktop and 390 px without horizontal overflow or console errors.
- Frontend cache-busting references: all seven CSS/JavaScript URLs across `index.html` and `register.html` use the shared `202608291245` timestamp, resolve to existing files, and returned HTTP 200 through PocketBase using a temporary data directory.
- `git diff --check`.

## Open decisions and risks

1. Public self-registration still creates active viewers. They can read every case field after login; account admission needs an organizational decision before using real patient data.
2. `editor` and `admin` currently have identical case permissions. Admin-only user management/audit features do not exist.
3. No automated test suite or CI workflow exists.
4. No production deployment files exist yet (`systemd`, Caddy, firewall, backup automation, monitoring).
5. Hosting was discussed but not provisioned. Hetzner CX23 was recommended; pricing and region must be rechecked before purchase.
6. The original reference site should be treated as visual/workflow inspiration, not copied assets.

## Suggested next work

1. Review account admission and self-registration before storing patient-identifying appointment fields.
2. Review and commit the current working tree, then push it so another device can recover it.
3. Add automated tests for overlap logic, role handling, and PocketBase API rules.
4. Add a production deployment package for the selected host.
5. Add encrypted backup/restore automation and a restore drill.

## Handoff maintenance

After each meaningful task, replace stale statements here with observed state and record the exact validation performed. Never include credentials, tokens, patient records, or private infrastructure details.
