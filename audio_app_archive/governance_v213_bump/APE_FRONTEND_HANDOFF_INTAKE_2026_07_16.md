# Frontend Handoff Intake — 2026-07-16 (PM)
**Source:** `APE_FRONTEND_HANDOFF_2026_07_16.txt` (client RN/Expo session, read-only on prod). **Reply to:** `APE_CLAUDE_CODE_HANDOFF_2026_07_16.md`. **Prod:** `yjgolswjggmlpeowvtxr`.
*Not yet folded into a coordinated STATE/TRACKER/INDEX bump — will fold on the next backend batch (awards model). This doc is the interim record.*

## Applied to prod this session (2 config changes — Booth-approved 2026-07-16)
| Change | Old → New | Scope | Verified |
|---|---|---|---|
| **B rename** — achievement gs47 | `Professional Networking` → **`Workplace Skills`** | 1 row; `is_active=false`, non-launch-critical | ✅ name now `Workplace Skills` |
| **I** — `study_methods.required_passes` (flashcards) | `2` → **`1`** | 1 row | ✅ flashcards `required_passes=1` |
Rollback: set gs47 name back to `Professional Networking`; flashcards `required_passes` back to `2`.

## Verified STALE (no action) — read-only
- Carryover "`has_academy_access` EXECUTE for anon/free → `glossary_full_v` 403s" is **already resolved (07-12)**: ACL = `anon=X, authenticated=X`; `glossary_full_v` readable by anon+authenticated. The frontend re-listed the 07-15 carryover set without re-checking.

## Frontend completed (context; no backend change)
- Course-card wiring done (25 files HTTP 200, keyed `card_id→tier_key.webp`); coming-soon topic stubs carry art; client added catalog cards **"Live Sound"** + **"Worship Sound"** (renamed from Worship); single-topic cards alphabetized.
- Glossary image contract built (url from `glossary_media` + storage base + `onError` fallback; XLR 400s degrade gracefully).
- v2.13 route-backs migrated: `register_commercial_user` (nickname=email local-part; favorites device-local), catalog via `public_courses`/`public_course_topics`/`achievements`, study fetch via `glossary_study_v`, detail via `glossary_full_v`.

## OPEN backend items (updated shapes)
- **A — Awards model (design pass, no tables exist):** Cert **L1** (topic specializations) / Diploma **L2 ×2 tracks** (Music, Audio) / **Masters L3** (renamed from Hall of Fame; accent green). Dual pre-reqs on EVERY tier: **Pro Audio Safety + Workplace Skills**. Masters fulfillment = **metal tag only (t-shirt dropped 2026-07-16)**. Level-2 "Professional Track" certificates REMOVED.
- **E — Diploma track topic assignment:** which topics → Music vs Audio (awaiting Booth).
- **B (content move):** move networking content → Music Entrepreneurship (gs49). Needs the term/item list.
- **D — `p_favorites` storage:** `register_commercial_user` accepts but ignores `p_favorites`; needs a store (e.g. `users.favorites jsonb`) + fn update.
- **Policy copy:** drop "T-shirt size" from the Master Graduate Package / shipping-policy canonical text (locate doc).
- **Carryovers (Booth did NOT action now):** B-1 study gate flashcards/FIB/matching **still 200** (spec 600); per-term hazard flags + (R)/(TM) columns; pricing SSoT (intro $99.99 lifetime thru EOY is static client copy).
- **C (future):** when Live Sound / Worship Sound become real single-topic public courses, add `public_courses` + `public_course_topics` rows (client picks up names automatically).

## Naming governance
- **"Workplace Skills"** is the settled name for renamed gs47 (SUPERSEDES the 07-15 "Workplace Professionalism").
- **"Masters"** replaces "Hall of Fame" (Level 3). Diplomas now 2 tracks (Music, Audio). Level-2 Professional Track certificates removed.
