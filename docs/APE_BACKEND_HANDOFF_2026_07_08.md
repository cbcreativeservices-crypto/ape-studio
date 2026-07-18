# AP&E STUDIO — BACKEND SESSION HAND-OFF
**Date:** 2026-07-08 · **From:** Claude Code client-build session · **To:** backend/spec Claude chat
**Location note:** kept in the app repo (`ape-studio/docs/`) because writes into the OneDrive
project folder from the build tooling do NOT reliably persist (Files-On-Demand). Copy into OneDrive
via Windows Explorer if you want it in the governance registry.

Backend project: Supabase `yjgolswjggmlpeowvtxr`, SCHEMA v2.12.

---

## 1. 🔴 LIVE DB MUTATIONS MADE FROM THE CLIENT SESSION (ratify / restore)
User-directed DML executed via the Supabase MCP during the client build. They cross the Phase-2
"no backend changes from the frontend session" rule — surfaced here for the backend session to own.

### 1.1 ⏰ TEMPORARY — study time gates lowered for testing (MUST RESTORE)
`study_methods.min_engagement_seconds` — live now: **flashcards / fill_in_blank / matching = 200**
(ear_training 300 and scenarios 600 unchanged). History 600→300→150→**200** (2026-07-09).
**Production restore target = 360s — ✅ CONFIRMED BY USER 2026-07-09** (supersedes the earlier
270 vs 600 question). Restore still pending the user's explicit go-ahead (after testing).
```sql
UPDATE study_methods SET min_engagement_seconds = 360  -- user-confirmed production value
WHERE key IN ('flashcards','fill_in_blank','matching');
```

### 1.2 PERMANENT — Safety topic gained two methods (ratify)
`achievements.applicable_methods` for Safety (`eebac0e9-c48a-49c5-8c71-6e43d9bee2ee`):
`{flashcards}` → `{flashcards, fill_in_blank, matching}` (live). Raises the onboarding gate for all
future students. Content auto-builds from Safety's 70 glossary terms. **Ratify or revert.**

### 1.3 Trophy icons — `achievements.icon_url` SET (done; do NOT redo)
The client session populated `achievements.icon_url` for the **33 topics** in
`trophy_icon_mapping_33.json`, format `trophy-icons/<filename>` (public bucket) — the step the
mapping note had assigned to the backend session. Verified: 33 rows non-null, all target UUIDs
matched. ⏳ **Still pending: the actual PNG upload to the `trophy-icons` bucket** (needs the
service-role key; the user runs `upload_trophy_icons.py`). Client renders trophy art with graceful
fallback to the placeholder, so the icon_url values are harmless before the PNGs are uploaded.

### 1.4 Config the user changed in the Supabase dashboard
- **Email confirmation OFF** (Auth → Providers → Email) — fixed a live model-A violation blocking
  registration.
- **Site URL** still at a localhost default — breaks the password-reset deep-link until designed.

---

## 2. NEW BACKEND WORK ITEMS SURFACED TODAY
1. **Single-sentence quiz stems.** Practice methods (fill-in-blank, matching) now show ONE random
   sentence of a definition (done client-side). **Quizzes cannot** — stems are server-authored and
   rendered verbatim per contract. Single-sentence quiz stems = a **question-bank / RPC authoring**
   change (backend), if Booth wants it.
2. **Footnote / reminder + due-date data source.** Client renders an occasional notice strip below
   the nav ("This topic is due this week!"). Infrastructure only — **no data source**: the schema
   has no per-topic/enrollment due dates or reminder feed. Backend needs to provide these.
3. **"Term of the Day" / study-reminder notifications.** Deferred client-side (needs
   `expo-notifications` + a new EAS build). Server push would need a backend notifications pipeline.

## 2b. NEW (2026-07-09)
- **Trophy `icon_url` set for 2 MORE topics (ratify).** Same DML/pattern as §1.3
  (client session wrote `achievements.icon_url`). Both PNGs live in the public
  `trophy-icons` bucket (verified HTTP 200); both topics are `is_active = true`.
  Now **35** topics have trophy art (was 33).
  ```sql
  UPDATE achievements SET icon_url = 'trophy-icons/pro audio safety.png'
    WHERE id = 'eebac0e9-c48a-49c5-8c71-6e43d9bee2ee'; -- Professional Audio Safety
  UPDATE achievements SET icon_url = 'trophy-icons/Sound and Acoustics.png'
    WHERE id = '595c0857-5afa-4b6a-a0bb-fdea84ae2a8c'; -- Sound & Acoustics
  ```
  Remaining ACTIVE topics still without art (next art batch): Amps & Loudspeakers,
  Commercial Audio Systems, Connectors & I/O Connections, Consumer Audio Systems,
  Corporate AV, Distributed Audio Systems, Vehicle Audio. (Other null-icon topics
  are `is_active = false` — not shown until activated.)
- **Flashcard gate → 1 view — ✅ APPROVED BY USER 2026-07-09.** Client display
  already credits a card fully after ONE reveal (or known). Make the SERVER match:
  in `record_study_progress` the flashcards "done" test is hardcoded
  `views >= 2 OR known` — change to `views >= 1 OR known` (and mirror in
  `build_study_snapshot` / the `start_quiz_attempt` §3.6 gate if it recomputes).
  Deploy via the RPC contract's dev-branch → tests → advisors → merge process.
  Until then, a gate-relevant topic can show flashcards 100% (client) while the
  quiz gate still wants 2 views (server) — the one known mismatch.
- **Safety topic grew to 81 glossary items** (was ~70) — students who completed
  the old set now show <100% until they study the added terms. Expected, noted.
- **New bucket `course-cards`** (public) created from the client session for the
  course-selection card art; **8 PNGs** uploaded via dashboard (glossary + 7
  courses; MUSI205A/B still on the client placeholder). No schema change
  (client maps course code → filename). Trophy `icon_url` now set for 35 topics.

## 3. CARRIED-OVER BACKEND ITEMS
- **D-3** — S7 explanations not client-readable. `quiz_questions.explanation` exists but the table
  is admin-only (RLS `is_admin()`). Include `explanation` in `submit_quiz` `wrong_answers` (or a
  read path).
- **D-2 / D-2b** — no pre-session verify RPC (S1 step-1 VERIFY is local-only; "Welcome,
  [Nickname]!" has no source). `register_student` returns one code for both "ID not found" and
  "already registered" — the locked "Already registered" copy has no distinguishable trigger.
- **Grants** — `anon` holds stray `TRUNCATE / REFERENCES / TRIGGER` on `users`; revoke.
- **Media columns** — `glossary` has none; client hides the media frame until they exist. Add e.g.
  `glossary.media_url` + `media_type` when media ships.
- **Password-reset deep-link** (Site URL + URL scheme + dev build).

## 4. VERIFICATION STILL OWED (client+user)
Remaining Code-brief §8 smoke tests, runnable as Safety PRACTICE attempts: ≤19 no_pass · practice
zero-side-effects · timer force-fail (>602s) · focus-void + 15-min lockout · idempotent resume.
Already ✅ live: F4 all-4-types, registration walk, gate RAISE, 20–23 clamp ×5, monotonic best,
full-pass 24 + `unlock_after_safety`.

---
*App code: `C:\Users\profe\dev\ape-studio` (bundle-clean, tsc pass, iOS HTTP 200 as of 2026-07-08).
The full client-only UI changelog is in the earlier session log; this doc is backend-scoped.*
