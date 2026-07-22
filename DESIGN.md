# OR Planning Board design specification

## Product intent

OR Planning Board is a Thai-language appointment and operating-room scheduling tool for an OPD/OR team. It replaces a visual planning board with a responsive web application that supports daily scheduling, monthly capacity review, and a management overview.

The design should feel calm, clinical, legible, and operational rather than decorative. Fast schedule comprehension is more important than animation or dense controls.

## Primary workflows

1. Sign in with a staff account.
2. Review the selected day's OR 1 and OR 2 timetable.
3. Select an empty time slot or `#add-case-button` to add a case.
4. Open an existing case to view or edit it according to role.
5. Use monthly and dashboard views to assess capacity and status.
6. Print the current planning view when needed.

## Views

- **Daily:** 08:00–20:00 in 30-minute slots, with OR 1 and OR 2 columns. Cases occupy visual blocks based on duration.
- **Monthly:** Calendar-level case counts and capacity signals for the selected month.
- **Dashboard:** Monthly totals, status mix, busiest days, and room utilization.

## Case form

Required fields are surgery date, room, start time, duration, patient name, doctor, procedure, anesthesia, and status. HN is optional. Duration is 30–240 minutes.

The same room cannot contain overlapping cases. Show the conflict before submission, while also relying on server-side validation.

## Status language and colors

| Value | Thai meaning | Color token |
| --- | --- | --- |
| `confirmed` | OR รับเคสแล้ว | `--confirmed` |
| `waitlist` | รอจัดห้อง | `--waitlist` |
| `coordination` | รอประสานงาน | `--coordination` |

Core palette lives in `styles.css`: navy text, teal actions, pale aqua canvas, white surfaces, restrained shadows, and red only for destructive/error states.

## Permission behavior

- `viewer`: read schedule and case details; no create/update/delete controls.
- `editor`: create, update, and delete cases.
- `admin`: currently the same case permissions as editor; reserved for future management functions.
- Unauthenticated users must not be able to change data.

The UI must reflect permissions, but PocketBase API rules remain authoritative.

## Responsive and accessibility requirements

- Preserve semantic headings, labels, button names, modal focus behavior, and live status messaging.
- Keep the daily grid horizontally usable on narrow screens rather than collapsing schedule meaning.
- Preserve landscape print styles.
- Honor `prefers-reduced-motion`.
- Maintain sufficient contrast for text, status colors, disabled states, and focus indicators.
- Preserve stable IDs used by scripts and tests, especially `add-case-button`.

## Design-change rule

Before materially changing navigation, terminology, fields, colors, or scheduling behavior, update this document and explain the tradeoff in `docs/HANDOFF.md`.

