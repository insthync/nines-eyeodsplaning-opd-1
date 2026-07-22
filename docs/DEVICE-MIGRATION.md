# Continue on another device

There are three separate things to transfer: source code, production/local data, and secrets. Do not combine them into one Git repository.

## 1. Source code and project context

This repository already has the remote:

```text
https://github.com/insthync/nines-eyeodsplaning-opd-1.git
```

Before changing devices, review, commit, and push the intended source changes. At the 2026-07-22 handoff, most application files are still uncommitted, so cloning the remote now would only recover the older initial commit.

On the new device:

```bash
git clone https://github.com/insthync/nines-eyeodsplaning-opd-1.git
cd nines-eyeodsplaning-opd-1
```

Open the repository in Codex and say:

```text
Read AGENTS.md and docs/HANDOFF.md, then use the project skill at
skills/continue-or-planning-board/SKILL.md before continuing.
```

For optional global skill discovery, copy `skills/continue-or-planning-board` into the new device's Codex skills directory. The repository copy remains canonical.

## 2. PocketBase data

`pocketbase/pb_data` is deliberately ignored by Git. To move it:

1. Stop PocketBase or create a consistent PocketBase backup.
2. Encrypt the backup.
3. Transfer it through approved secure storage.
4. Verify its checksum on the new device.
5. Restore it to the configured data directory.
6. Start PocketBase and test login, record counts, and a non-production read flow.

Never put the backup in Git or a public file-sharing link.

## 3. Secrets

Move superuser/staff credentials through a password manager or deployment secret store. Do not copy them into repository documentation or source files.

## Final migration checklist

- Source changes committed and pushed.
- New clone contains `AGENTS.md`, `DESIGN.md`, `docs/`, and `skills/`.
- PocketBase data backed up, encrypted, transferred, and restored separately.
- Secrets restored separately.
- Correct PocketBase binary downloaded for the new OS/CPU.
- Migrations run successfully.
- Viewer/editor/admin permissions and schedule-conflict rejection verified.
- HTTPS and backups verified before real use.

