# Security and data handling

This application can contain patient name, HN, procedure, doctor, and appointment information. Treat all production records and backups as sensitive health data.

## Required boundaries

- Never place superuser credentials in `config.js`, browser code, Git, screenshots, logs, or chat transcripts.
- Use one named `users` account per person. Disable access with `active = false` rather than sharing accounts.
- Use `viewer` unless a user needs scheduling permissions.
- Self-registration must continue through the custom registration hook. Never expose the generic `users` create rule publicly.
- The hook ignores submitted privilege fields and always creates an active, unverified `viewer`.
- Promote or disable accounts only through a PocketBase superuser workflow.
- Keep PocketBase API rules restrictive even when the UI disables buttons.
- Serve production only through HTTPS.
- Restrict PocketBase dashboard access with network controls where practical.
- Keep the operating system and PocketBase version patched after testing upgrades.

## Secrets

Store production values such as `PB_SUPERUSER_PASSWORD` and `PB_STAFF_PASSWORD` in a password manager or deployment secret store. Environment variables are supported for automation, but do not commit `.env` files. Prefer interactive password prompts during manual setup.

## Browser session

The staff token is stored in `sessionStorage`, so closing the browser tab/session removes it. Do not change this to long-lived storage without a security review.

## Registration abuse controls

The registration form includes a honeypot and the route has a small request-body limit. Before exposing production registration to the internet, also enable PocketBase or reverse-proxy rate limiting, monitor account creation, and define an account removal process.

## Backups

- Keep encrypted backups separate from the server and source repository.
- Use a PocketBase/SQLite-consistent backup method. For a raw `pb_data` copy, stop PocketBase first.
- Test restoration regularly with an isolated data directory.
- Define retention, access, deletion, incident-response, and audit policies before real clinical use.
- Never use production patient data for development or automated tests.

## Before production

The organization operating the service must review applicable health-data, privacy, consent, residency, breach-notification, and retention requirements. Repository documentation is technical guidance, not legal or compliance approval.
