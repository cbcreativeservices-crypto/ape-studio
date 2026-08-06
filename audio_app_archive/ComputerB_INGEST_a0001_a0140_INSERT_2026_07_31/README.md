# Computer B Ingest — a0001–a0140 (INSERT / new terms)
_Machine A · 2026-07-31 · CANDIDATE — pending Booth approval before running_

## What this is
Computer B's committee-reviewed delivery `DELIVERY_MachineA_a0001-a0140` — **1,854 brand-new glossary terms** (4-expert reviewed incl. Legal/IP). All are genuine INSERTs.

## Review results (all clean)
- **1,854** terms; **0** empty fields, **0** real placeholders, **0** malformed list fields.
- **0 id collisions**, **0 term collisions** vs live glossary (checked in 3 chunks).
- **112 flagged/safety terms EXCLUDED** by Computer B (held for Booth register) — not in this ingest.
- Definitions independently written + sourced (copyright rule honored).
- content md5 (id|term): `991ac131503a9880c9bba00c387238e8`

## Topic landing (14 topics)
11 map to existing topic achievements; **3 new topic achievements were created** (draft cv, mirrors sibling glossary topics — `is_active=false`, `course_id=NULL`):
- Magnetic Tape Preservation & Conservation `be9c2311…` — 161
- Archival Preservation & Obsolete Media `f2442389…` — 127
- Dubbing — Adaptation, Sync & Deliverables `39203cec…` — 121

Per-topic counts: ADR & Looping 101 · Analog Tape 142 · Archival Preservation 127 · Audio Restoration 142 · Dialogue Editing 130 · Dubbing & Localization 173 · Dubbing—Adaptation 121 · Dynamics Processing 138 · Film Scoring 162 · Instrument & Close Miking 155 · Magnetic Tape Preservation 161 · Re-Recording & Final Mix 113 · Reverb & Delay 106 · Stereo & Ensemble Miking 83.

## ⚠️ Two judgment calls to confirm
1. **Dynamics Processing** has TWO achievement rows (draft `d42dcf1d`, 264 existing terms; active `fd3b3424`, 67). The 138 new terms attach to the **draft** row (where the bulk already sits). OK?
2. **Reverb & Delay** is the only landing topic whose existing terms live on an **active-cv** achievement (`415df21a`); the other 10 existing topics are draft-cv. New Reverb terms attach there. OK?

## How to run (Supabase SQL editor)
Run in order — each file is a self-contained `BEGIN;…COMMIT;` transaction, ≤600 KB, idempotent (safe to re-run):
`APPLY_01.sql` → … → `APPLY_08.sql`, then **`VERIFY.sql`** (expect 1854 / 1854 / 0).
Each term: 1 `glossary` row (with `achievement_id` = primary topic) + 1 `glossary_topics` link (`is_primary=true`). Guards skip any row whose id OR normalized term already exists.

## Rollback
`ROLLBACK.sql` deletes the 1,854 inserted rows by id (correct for pure INSERTs); optional trailing line also drops the 3 new topic achievements.

## Not in this ingest (kept separate, as agreed)
difficulty ratings · Legal/IP ®™ marks · the 112 flagged terms.
