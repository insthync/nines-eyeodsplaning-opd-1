# PocketBase authentication and schema

โปรเจกต์นี้ใช้ PocketBase `0.39.8` และ Web API โดยตรง ไม่ต้องติดตั้ง JavaScript SDK

## Security model

- `_superusers`: ใช้เฉพาะ setup script และ PocketBase dashboard
- `users`: บัญชีที่หน้าเว็บใช้ login
- `surgery_cases`: ข้อมูลตารางผ่าตัด

Auth collection `users` มี fields เพิ่มเติม:

| Field | Type | Values |
| --- | --- | --- |
| `name` | Text | ชื่อที่แสดง |
| `role` | Select | `viewer`, `editor`, `admin` |
| `active` | Bool | ต้องเป็น `true` จึง login ได้ |

API rules ของ `surgery_cases` เปิด List และ View เป็น public เพื่อให้ guest และผู้ใช้ทุก role อ่านตารางได้โดยไม่ต้อง login ส่วน Create, Update และ Delete ต้อง login ด้วยบัญชีที่ `active = true` และมี role `editor` หรือ `admin`

## Case schema

| Field | Type | Required | Options |
| --- | --- | --- | --- |
| `surgery_date` | Text | Yes | `YYYY-MM-DD` |
| `operating_room` | Select | Yes | `OR 1`, `OR 2` |
| `start_time` | Text | Yes | `HH:mm` |
| `duration` | Number | Yes | Integer 30–240 |
| `patient_name` | Text | Yes | Max 200 |
| `hn` | Text | No | Max 80 |
| `doctor` | Text | Yes | Max 200 |
| `procedure` | Text | Yes | Max 2,000 |
| `anesthesia` | Select | Yes | `general`, `local`, `regional` |
| `status` | Select | Yes | `confirmed`, `waitlist`, `coordination` |
| `implant` | Text | No | Max 2,000 |
| `statusConfirm` | Select | Yes | `confirmed`, `no-answer`, `cancelled` |

Migration เริ่มต้นอยู่ที่ `pocketbase/pb_migrations/1784737200_initial_or_planner_schema.js` และ migration `1784836072_public_surgery_case_reads.js` เปิดสิทธิ์อ่านแบบ public โดย setup/start script จะรัน migration ที่ยังไม่ถูกใช้

Hook `pocketbase/pb_hooks/schedule_conflicts.pb.js` ตรวจ date, OR, start และ duration อีกครั้งที่ server เพื่อปฏิเสธเคสซ้อน แม้ client-side validation จะถูกข้าม

Hook `pocketbase/pb_hooks/registration.pb.js` เปิดเฉพาะ `POST /api/or-planner/register` สำหรับสมัครบัญชีผู้ชม โดยรับชื่อ อีเมล และรหัสผ่าน แล้วบังคับ `role = viewer`, `active = true`, `verified = false` ที่ server ส่วน generic create API ของ `users` ยังล็อกไว้สำหรับ superuser เท่านั้น

## Environment variables for setup

| Variable | Required | Description |
| --- | --- | --- |
| `PB_SUPERUSER_EMAIL` | Yes | บัญชี bootstrap/dashboard |
| `PB_SUPERUSER_PASSWORD` | Yes | รหัสผ่านอย่างน้อย 8 ตัวอักษร |
| `PB_STAFF_EMAIL` | Yes | บัญชีหน้าเว็บ |
| `PB_STAFF_PASSWORD` | Yes | รหัสผ่านอย่างน้อย 8 ตัวอักษร |
| `PB_STAFF_NAME` | No | ค่าเริ่มต้น `OR Administrator` |
| `PB_STAFF_ROLE` | No | `viewer`, `editor`, `admin`; ค่าเริ่มต้น `admin` |

ถ้าไม่กำหนด environment variables สคริปต์จะถามแบบ interactive และช่อง password จะถูกซ่อน

บน Linux และ macOS ใช้ Bash scripts ดังนี้:

```bash
export PB_SUPERUSER_EMAIL="owner@example.org"
export PB_SUPERUSER_PASSWORD="replace-with-a-strong-password"
export PB_STAFF_EMAIL="or-admin@example.org"
export PB_STAFF_PASSWORD="replace-with-another-strong-password"
export PB_STAFF_ROLE="admin"

bash scripts/setup-pocketbase.sh
bash scripts/start-pocketbase.sh
```

`download-pocketbase.sh` ตรวจ OS/CPU และดาวน์โหลด binary ไปที่ `pocketbase/pocketbase` ส่วน `setup-pocketbase.sh` ต้องมี `bash`, `curl` และ `unzip` ติดตั้งอยู่ในเครื่อง

## Production checklist

- เปลี่ยน `config.js` ไปยัง HTTPS PocketBase URL
- เก็บ `pb_data` บน persistent disk และสำรองข้อมูลสม่ำเสมอ
- ไม่ใช้ superuser account ในหน้าเว็บหรือ client-side code
- สร้างบัญชีเจ้าหน้าที่รายบุคคลและปิดบัญชีด้วย `active = false`
- ใช้ `viewer` สำหรับผู้ที่ไม่ต้องแก้ตาราง
- จำกัด network access ของ PocketBase dashboard ตามนโยบายองค์กร
- ตรวจ retention, backup encryption, audit และ incident-response policy
