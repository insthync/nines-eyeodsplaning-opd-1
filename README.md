# OR Planning Board

เว็บวางแผนคิวผ่าตัดภาษาไทยที่อ้างอิง workflow จาก Surgery Schedule Board เดิม รองรับมุมมองรายวัน รายเดือน ภาพรวม การพิมพ์ และการตรวจเวลาทับซ้อนทั้งฝั่ง browser และ PocketBase

## เริ่มใช้งานครั้งแรกบน Linux / macOS

ต้องมี `bash`, `unzip` และ `curl` (หรือ `wget` สำหรับ download เท่านั้น) จากนั้นเปิด terminal ที่โฟลเดอร์โปรเจกต์:

```bash
export PB_SUPERUSER_EMAIL="owner@example.org"
export PB_SUPERUSER_PASSWORD="replace-with-a-strong-password"
export PB_STAFF_EMAIL="or-admin@example.org"
export PB_STAFF_PASSWORD="replace-with-another-strong-password"
export PB_STAFF_NAME="OR Administrator"
export PB_STAFF_ROLE="admin"

bash scripts/setup-pocketbase.sh
```

สคริปต์รองรับ Linux และ macOS ทั้ง `amd64`/`x86_64` และ `arm64`/`aarch64` แล้วเปิดระบบด้วย:

```bash
bash scripts/start-pocketbase.sh
```

- เว็บ: `http://127.0.0.1:8090/`
- PocketBase dashboard: `http://127.0.0.1:8090/_/`

หากต้องการให้ไฟล์รันโดยตรง สามารถใช้ `chmod +x scripts/*.sh` แล้วเรียก `./scripts/setup-pocketbase.sh` และ `./scripts/start-pocketbase.sh` ได้

ตัวอย่างกำหนด port และตำแหน่งฐานข้อมูลบน Unix:

```bash
bash scripts/start-pocketbase.sh \
  --http "127.0.0.1:8095" \
  --data-dir "/var/lib/or-planner/pb_data"
```

## เริ่มใช้งานครั้งแรกบน Windows

เปิด PowerShell ที่โฟลเดอร์โปรเจกต์ แล้วกำหนดบัญชี bootstrap และบัญชีเจ้าหน้าที่เริ่มต้น:

```powershell
$env:PB_SUPERUSER_EMAIL = "owner@example.org"
$env:PB_SUPERUSER_PASSWORD = "replace-with-a-strong-password"
$env:PB_STAFF_EMAIL = "or-admin@example.org"
$env:PB_STAFF_PASSWORD = "replace-with-another-strong-password"
$env:PB_STAFF_NAME = "OR Administrator"
$env:PB_STAFF_ROLE = "admin"

powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-pocketbase.ps1
```

สคริปต์จะทำงานดังนี้:

1. ดาวน์โหลด PocketBase 0.39.8 เข้า `pocketbase/` หากยังไม่มี
2. รัน migration เพื่อสร้าง schema และ API rules
3. สร้างหรืออัปเดต PocketBase superuser สำหรับงานดูแลระบบ
4. สร้างหรืออัปเดตบัญชี `users` สำหรับเข้าใช้งานหน้าเว็บ

จากนั้นเปิดระบบ:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-pocketbase.ps1
```

- เว็บ: `http://127.0.0.1:8090/`
- PocketBase dashboard: `http://127.0.0.1:8090/_/`

`start-pocketbase.ps1` จะรัน migrations ก่อน start server ทุกครั้ง จึงสามารถใช้คำสั่งเดิมหลัง pull schema รุ่นใหม่ได้

## Authentication และสิทธิ์

หน้าเว็บ login ผ่าน Auth collection ชื่อ `users` เท่านั้น ไม่ส่งหรือเก็บ superuser credential ใน browser

| Role | อ่านตาราง | เพิ่ม/แก้ไข/ลบ |
| --- | --- | --- |
| `viewer` | Yes | No |
| `editor` | Yes | Yes |
| `admin` | Yes | Yes |

PocketBase superuser ใช้เฉพาะ setup, dashboard และงานดูแลระบบ เพราะ superuser จะข้าม API rules ทั้งหมด

หากต้องการเพิ่มหรือเปลี่ยนบัญชีเจ้าหน้าที่ ให้รัน `setup-pocketbase.ps1` อีกครั้งโดยเปลี่ยน `PB_STAFF_*` สคริปต์จะ upsert บัญชีตามอีเมล

## Scripts

```text
scripts/download-pocketbase.sh   ดาวน์โหลด binary สำหรับ Linux/macOS ตาม OS/CPU
scripts/setup-pocketbase.sh      migrate, bootstrap superuser และ upsert staff บน Unix
scripts/start-pocketbase.sh      migrate แล้ว serve API + frontend บน Unix
scripts/download-pocketbase.ps1  ดาวน์โหลด binary ตาม OS/CPU
scripts/setup-pocketbase.ps1     migrate, bootstrap superuser และ upsert staff
scripts/start-pocketbase.ps1     migrate แล้ว serve API + frontend
```

ตัวอย่างกำหนดตำแหน่งฐานข้อมูลหรือ port เอง:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-pocketbase.ps1 `
  -HttpAddress "127.0.0.1:8095" `
  -DataDirectory "D:\OR-Data\pb_data"
```

ค่าเริ่มต้นของ frontend จะใช้ PocketBase จาก origin เดียวกัน จึงเปลี่ยน port ได้โดยไม่ต้องแก้ config หาก serve ทั้งคู่ด้วยสคริปต์นี้ หากแยก frontend กับ backend คนละโดเมน ให้แก้ `pocketBaseUrl` ใน `config.js` เป็น HTTPS URL ของ backend

## Hosting

Frontend เป็น static HTML/CSS/JavaScript แต่ข้อมูลต้องผ่าน PocketBase ที่มี persistent volume สำหรับ `pb_data` วิธีที่ประหยัดคือใช้ VPS ขนาดเล็กเครื่องเดียว serve ทั้ง frontend และ PocketBase ผ่าน HTTPS reverse proxy

สำหรับ static hosting แยกต่างหาก สามารถนำ `index.html`, `styles.css`, `app.js` และ `config.js` ไปวางบน GitHub Pages หรือ Cloudflare Pages แล้วตั้ง `pocketBaseUrl` เป็น HTTPS URL ของ backend

## ข้อควรระวังเรื่องข้อมูลผู้ป่วย

ชื่อผู้ป่วย, HN และรายละเอียดหัตถการเป็นข้อมูลละเอียดอ่อน อย่าเปิด collection rules เป็น public ควรใช้ HTTPS, บัญชีรายบุคคล, backup ที่เข้ารหัส, least privilege และข้อกำหนดด้านข้อมูลสุขภาพขององค์กรก่อนนำขึ้นระบบจริง

ห้าม commit `pocketbase/pb_data` เข้า Git โฟลเดอร์ดังกล่าวถูกเพิ่มไว้ใน `.gitignore` แล้ว

## โครงสร้างสำคัญ

```text
index.html                                      UI และ dialog
styles.css                                     responsive/print styles
app.js                                         calendar, auth, roles และ CRUD
config.js                                      PocketBase URL และ write roles
pocketbase/pb_migrations/...initial_schema.js  collections และ API rules
pocketbase/pb_hooks/schedule_conflicts.pb.js   server-side overlap validation
docs/pocketbase-setup.md                       คู่มือ schema/security เพิ่มเติม
```

## Continue on another device

Start with `AGENTS.md`, `docs/INDEX.md`, and `docs/HANDOFF.md`. The portable Codex skill is in `skills/continue-or-planning-board/`, and the complete source/data/secrets transfer checklist is in `docs/DEVICE-MIGRATION.md`.
