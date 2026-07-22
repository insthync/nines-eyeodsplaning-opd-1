# Operations

## First setup

Linux/macOS:

```bash
export PB_SUPERUSER_EMAIL="owner@example.org"
export PB_STAFF_EMAIL="admin@example.org"
export PB_STAFF_NAME="OR Administrator"
export PB_STAFF_ROLE="admin"
bash scripts/setup-pocketbase.sh
bash scripts/start-pocketbase.sh
```

Missing passwords are prompted securely. Windows uses the corresponding `.ps1` scripts documented in `README.md`.

Local URLs are `http://127.0.0.1:8090/` for the app and `http://127.0.0.1:8090/_/` for the PocketBase dashboard.

## Add or update a staff account

Run the setup script again with the target email. A new email creates an account; an existing email updates the account, password, name, role, and active state.

```bash
export PB_SUPERUSER_EMAIL="owner@example.org"
export PB_STAFF_EMAIL="new-editor@example.org"
export PB_STAFF_NAME="New Editor"
export PB_STAFF_ROLE="editor"   # viewer, editor, or admin
unset PB_SUPERUSER_PASSWORD PB_STAFF_PASSWORD
bash scripts/setup-pocketbase.sh --skip-download
```

## Data location

The default database directory is `pocketbase/pb_data`. Override it with `--data-dir` or `PB_DATA_DIRECTORY`. Production should use a persistent disk with explicit backup monitoring.

## Production deployment direction

The discussed low-cost target is a small Linux VPS, with Hetzner CX23 as the current recommendation. This is a recommendation only; no production server has been provisioned from this repository.

Expected production topology:

```text
Internet → Caddy HTTPS → PocketBase on 127.0.0.1:8090
                           ├─ static frontend
                           └─ persistent pb_data
```

Still to implement before deployment:

- A least-privilege `systemd` service.
- Caddy configuration and domain/DNS instructions.
- Host firewall rules.
- Automated encrypted off-server backups and restore verification.
- Monitoring, log retention, and upgrade/rollback procedure.

## Troubleshooting

- If migrations fail, stop and inspect the full output; do not bypass them.
- If setup says the bootstrap port is occupied, choose another `--bootstrap-http` address.
- If the app cannot read cases, verify `config.js`, authentication state, user `active`/`role`, and collection rules.
- If a time is rejected, check both browser conflict messaging and the PocketBase hook response.
- Always reproduce database issues against a temporary data directory first.

