# Prerequisites & "My Enrollments / Menu Cards" — New Model (Booth 2026-07-31)

Prerequisite **gating is RETIRED.** `is_prerequisite` no longer controls access — it now only marks a topic as a **requisite / reminder** topic for the certificate + Menu‑card UI.

## The model (frontend behavior)
- **No prerequisite gate.** Any user — paid member OR free user with an account — may go **directly to any topic**. Nothing is locked behind a prerequisite anymore.
- **Always‑free, always‑shown topics** (regardless of membership) — listed in **My Enrollments** AND shown as a **Menu card** until completed; the Menu card disappears once completed:
  1. **Professional Audio Safety** (free to all)
  2. **Foundations of Sound** / Audio Foundations Listening Lab (free to all)
- **My Enrollments list is saved for BOTH** paid members and free users with an account.
- **Certificates require 3 requisite topics:** Professional Audio Safety, Grounding & Electrical, Workplace Skills. When a user **selects a certificate**, those 3 requisites appear in **My Enrollments** AND as **Menu cards** (shown until completed) as visual reminders to finish them from the Menu screen.
- **If the user abandons/deselects all certs** (does only a few topics): the two *paid* requisite courses — **Grounding & Electrical** and **Workplace Skills** — are **removed** from My Enrollments and their **Menu cards removed** (no longer required → no reminder). **Professional Audio Safety stays** (free, always there) and **Foundations of Sound stays** (free, always there).
- **Menu‑card lifecycle:** a card shows while the topic is (a) always‑free [Safety, Foundations] or (b) a requisite of a currently‑selected cert; it disappears on completion, and requisite cards disappear if the cert is deselected.

## DB status (Machine A)
DONE — active v1, `is_prerequisite=true` on all four requisite/always‑free topics:
- Professional Audio Safety `eebac0e9…` (is_active=true)
- Grounding & Electrical `d392b133…` (is_active=true)  ← set today
- Workplace Skills `036e7ed0…` (is_active=false)  ← set today
- Foundations of Sound `7387db19…` (is_active=false, staged)

`is_prerequisite` is now a **"requisite/reminder" marker**, not a gate.

## DB changes — APPLIED & VERIFIED 2026-07-31 (Booth approved)
1. **`start_quiz_attempt` — prerequisite gate REMOVED.** The `safety_prerequisite_incomplete` block is deleted (verified absent). Free access now reads the `always_free` flag. All other gates intact: `academy_required` (commercial non-members still blocked from paid topics), `topic_locked`, `study_gate_unmet`, `pool_too_small`, lockouts.
2. **`seed_first_topic_on_enrollment` — seeds `unlocked` unconditionally** for members (prereq/`v_safety_done` branch removed; verified).
3. **`always_free` boolean column** added to `achievements`; set true for **Professional Audio Safety, Foundations of Sound, DAW Skills** (the existing free sample, preserved). Replaces the old hard-coded `v_gs IN (0,36)`.
4. **`unlock_after_safety`** left in place but now vestigial/harmless (only unlocked already-unlocked first topics).

Result matches Booth: (1) no prereq gates anything; (2) members get everything seeded unlocked, non-paying users get only free topics + tools + Foundations lab; (3) Safety + Foundations always free to all.

## Still frontend (ccode) — the reminder UX (NOT DB)
- My-Enrollments list saved for BOTH audiences; Menu cards: Safety + Foundations always shown until completed; the 3 cert-requisites appear when a cert is selected and are removed if the cert is dropped; any card disappears on completion.
- Intra-course sequencing (`recompute_reachability`) STAYS — retirement was only the cross-course prerequisite gate. (Booth confirmed.)
- **Data-model note:** free/commercial users don't use the `enrollment` table (commercial = `public_course_topics` + entitlements). Persisting a My-Enrollments list for them likely needs a small addition — flag for the frontend/data plan.

Related: FOUNDATIONS_OF_SOUND_lab_spec_2026_07_30.md.
