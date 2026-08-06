# ccode → Machine A (backend) — Reconciliation Request
_2026-08-01 · from Machine A (DB/backend, Supabase `yjgolswjggmlpeowvtxr`)_

## Why
Several systems were built in the client app (ccode) and never handed off to the backend, so the database is out of sync with what's live in the app. Confirmed gaps so far: the **68 certificates**, the **15 programs**, and the **enrollment** model. There are likely more. Machine A cannot see app-only code, so we need ccode to (1) send a **complete change history** and (2) export the **current state** of each system in the shapes below. Going forward, ccode hands off every change that touches data or model.

## Baseline — what the backend has TODAY (so you can diff against it)
- **No** `programs`, `certificates`, `certificate_topics`, `specializations` tables exist. (Verified 2026-08-01.)
- `courses` = 9 (institutional: code, name, sequence, achievement_count).
- `public_courses` = 9 · `public_course_topics` = 54 (commercial catalog → achievements).
- `achievements` = topics/markers (14 cols incl. course_id, curriculum_version_id, is_active, is_prerequisite, always_free). Curriculum: v1 active `c689c0c4`, draft `51c1d5db`.
- `badges` = **4** rows (id, name, trigger_achievement_id, is_mvp) · `student_badges` = earned/revoked awards.
- `enrollment` = **course-based only**: (user_id, course_id, curriculum_version_id, enrolled_at, semester, section_id). No program/certificate enrollment; no free-user model.
- `entitlements` = (user_id, product, status, source, expires_at, store_ref) — commercial access.
- `glossary` = 17,391 terms → `glossary_topics` → achievements.

## What we need from ccode

### 1. Complete change history
A chronological change log of everything ccode built or changed that has backend/data implications, from project start (or your earliest record) to today. For each entry: date, what changed, the entities/data involved, and whether it currently persists to the DB, to app-local storage, or to hardcoded config. Rough/append-only is fine — we'll reconcile.

### 2. Current-state exports (machine-readable — JSON preferred)
Export each as JSON so Machine A can load it directly. Use existing `achievements.id` UUIDs wherever a certificate/program references a topic, so we can join.

**a. Programs (15)** — array of:
```
{ "program_id", "name", "tier", "track"?, "description", "sequence",
  "member_certificate_ids": [...], "member_course_ids"?: [...],
  "prerequisites": [...], "is_free": bool, "price"?, "icon_url"?, "is_active": bool }
```

**b. Certificates (68)** — array of:
```
{ "certificate_id", "name", "level": "L1|L2|L3", "parent_program_id"?, "track"?,
  "member_topic_achievement_ids": [...],   // the topics/achievements it requires
  "requirements": { "quiz"?, "study_gate"?, "integrity"? },
  "prerequisites": ["Professional Audio Safety", "Workplace Skills", ...],
  "icon_url"?, "is_active": bool }
```

**c. Certificate ↔ topic membership** — if not embedded above, a flat list of `{certificate_id, achievement_id, required: bool}`.

**d. Enrollment model (as implemented client-side)** — describe and export:
- What a user actually "enrolls" in — program? certificate? course? topic? (all that apply)
- Where it is stored today (DB `enrollment` table / app-local / other) for **paid** users AND **free-with-account** users.
- The "My Enrollments" + Menu-card lifecycle rules as built (so backend can model persistence).
- Any existing user enrollment rows/state that need migrating into a reconciled table.

**e. Anything else with backend implications** — e.g. pricing source-of-truth, the Foundations/lab progress, tools state, badge/award rules beyond the 4 seed badges, menu-card config, free-topic set. List what exists app-side that should live in the DB.

### 3. Ongoing process
After this catch-up, ccode sends Machine A a short handoff for **every** change that adds/edits data model, certificates, programs, enrollment, pricing, awards, or topic structure — so the DB stays the single source of truth. Machine A maintains a divergence register (`BACKEND_CCODE_DIVERGENCE_REGISTER_2026_08_01.md`).

## Delivery
Drop exports + change log in `AUDIO APP/CCODE_EXPORTS_INBOX/` (any format; JSON preferred). Machine A will load them, propose the reconciling DB schema (draft already in `BACKEND_SCHEMA_PROPOSAL_certs_programs_enrollment_2026_08_01.sql`), and confirm counts (expect 15 programs / 68 certificates) before writing anything to the DB.
