# AP&E STUDIO — PROJECT FILE INDEX & ALIGNMENT STATE
**Index version:** v35 (**APPROVED 2026-07-16 by Prof. Booth**) · **Date:** 2026-07-16 (course-card + glossary IMAGE PIPELINE optimized/standardized/live; glossary `glossary_media.url` rewritten to WebP on prod) · **Supersedes:** `PROJECT_FILE_INDEX_2026_07_15_v34.md` (v34)
> ⚠️ **Header note:** the v31 header line erroneously still read "v30 · 2026-06-27"; corrected in v33. Pointers this version: STATE **r33** (`PROJECT_STATE_CURRENT_2026_07_16_v44_r33.md`) / TRACKER **r32** (`PROGRESS_TRACKER_2026_07_16_r32.md`) / STARTUP to refresh on approval. **Superseded files to retire on approval:** the 07-15 set (`PROJECT_FILE_INDEX_2026_07_15_v34.md`, `PROJECT_STATE_CURRENT_2026_07_15_v44_r32.md`, `PROGRESS_TRACKER_2026_07_15_r31.md`) AND the 07-11 set (`PROJECT_FILE_INDEX_2026_07_11_v33.md`, `PROJECT_STATE_CURRENT_2026_07_11_v44_r31.md`, `PROGRESS_TRACKER_2026_07_11_r30.md`) (+ the stale duplicate set in `governance_2026_07_11/`).

> **ROLE — the canonical registry.** §1 canonical files · §2 retired · §4 findings/decisions register · §5 tasks. This is the authoritative file list. **Chronological session history → `PROGRESS_TRACKER` (not here).** File roles: STARTUP = thin entry · INDEX = registry · STATE = snapshot · TRACKER = changelog home.
**Purpose:** the single "where we are" anchor — read this FIRST every session. It names the exact current files, what to upload, what to retire, and every open decision in one place.

> **WHY v5 EXISTS (read this):** A maintenance audit found that **five files produced after index v4 were uploaded into the project but never recorded in the index, STARTUP_HERE, PROJECT_STATE, or PROGRESS_TRACKER.** As a result the project's own "current status" understated reality (it still listed the 8 P0 blockers as open and Screen 12 as pending). v5 folds those five files in and flags two genuine spec conflicts they introduced (see §4G). **Nothing was deleted to make v5.**

---

## 0.0 WHAT CHANGED SINCE INDEX v34 (this version, v35) — COURSE-CARD + GLOSSARY IMAGE PIPELINE [APPROVED 2026-07-16]
**Session 2026-07-16 — image assets optimized + standardized; glossary `glossary_media.url` rewritten on prod (backup taken).** Coordinated bump: INDEX **v35** / STATE **r33** / TRACKER **r32**. Full detail → TRACKER **r32**; snapshot → STATE **r33**.

- **COURSE CARDS (25 = Free 4 / Courses 6 / Single-topic 15):** WebP q80 (941×1672), standardized to **`tier_key.webp`** (filename = card_id), live in bucket `course-cards` (25 verified, 0 stale). **No DB card-image column** → **frontend derives file from card_id** (`${card_id.replace(':','_')}.webp`); wiring deferred to frontend. 51.4MB→3.07MB. SSoT `ape_course_card_map_FINAL_STANDARDIZED_2026_07_16.json` + `COURSE_CARD_MAP_2026_07_16.md`; art `coursecards_final/`.
- **GLOSSARY IMAGES (139 `glossary_media` rows):** WebP q80 ≤1024px, renamed **`<term-slug>.webp`**; **`glossary_media.url` rewritten to `.webp` on prod** (term-keyed; backup `glossary_media_backup_20260716`). Verified 139/139 webp, 0 png, 0 unreferenced, **3 broken = XLRM/XLRF/XLR Cable only (pre-wired, await art)**. 182.7MB→6.04MB. SSoT `ape_glossary_media_rename_2026_07_16.json` + `GLOSSARY_RENAME_REVIEW_2026_07_16.csv` + `glossary_media_url_update_2026_07_16.sql`; art `glossary_images_final/`.
- **NEW REFERENCE FILES (register into §1 on next full pass):** `AP&E_Course_Card_Assigner.html`, `COURSE_CARD_MAP_2026_07_16.md`, `ape_course_card_map_FINAL_STANDARDIZED_2026_07_16.json` (supersedes the interim `…_FINAL_…` / `…_WEBP_…` json), `GLOSSARY_RENAME_REVIEW_2026_07_16.csv`, `ape_glossary_media_rename_2026_07_16.json`, `glossary_media_url_update_2026_07_16.sql`, `APE_CLAUDE_CODE_HANDOFF_2026_07_16.md`; folders `coursecards_final/` (25) + `glossary_images_final/` (136).
- **DROPPABLE on go-ahead:** `glossary_media_backup_20260716`. **NO schema/content change beyond the single `glossary_media.url` rewrite.**

## 0.0-prev WHAT CHANGED SINCE INDEX v33 (was v34) — v2.13 ITEM-D/E + OPTION-B FOLDED IN + 2026-07-15 HANDOFF [CANDIDATE]
**Session 2026-07-15 — read-only verification + governance reconciliation (no DB writes).** Coordinated bump: INDEX **v34** / STATE **r32** / TRACKER **r31**. Full detail → TRACKER **r31**; snapshot → STATE **r32**.

- **DRIFT CLOSED (files lagged prod; Claude memory was already correct):** 5 migrations applied 07-11 PM→07-12 were never in these files → now folded: `v213_itemD_deploy_glossary_full_v_view`, `v213_itemD_close_common_mistakes_leak`, `v213_fix_grant_execute_has_academy_access`, `v213_itemE_glossary_study_v_free_topic_exception`, `v213_optionb_commercial_progression`. **Live DB was AHEAD of r31/r30.**
- **NOW LIVE (verified 2026-07-15):** `glossary_full_v` masks common_mistakes→NULL for non-academy (anon/auth SELECT); `glossary_study_v` free-topic exception; `has_academy_access` EXECUTE→anon+authenticated; `register_commercial_user` deployed; Option-B commercial progression (submit_quiz v8.4 + 3 helpers; `start_quiz_attempt` kept 2-arg, public course derived).
- **ADVISORS:** now **2 ERROR `security_definer_view`** (`glossary_full_v` + `glossary_study_v`, BY DESIGN) — supersedes r31 "no new ERROR"; **decision owed.** + accepted WARN set + 2 INFO (07-10 backup tables).
- **2026-07-15 CLIENT HANDOFF (`APE_BACKEND_HANDOFF_2026_07_15.txt`, registered §1H):** carryover **F** (common_mistakes 403→masked NULL) + **G** (register_commercial_user) **already RESOLVED** on prod. New OPEN items → §4M: **A** awards model (no tables), **B** rename Professional Networking (gs47)→Workplace Professionalism + networking→Music Entrepreneurship (gs49) [both `is_active=false`, non-launch-critical], **C** pricing $99.99 lifetime-thru-EOY-2026 server SSoT (static client text; no table), **H** per-term hazard flag + (R)/(TM) marks (no glossary columns; client `src/lib/hazard.ts`), **I** flashcard `required_passes` 2→1 (currently 2). **D/E informational — no backend action.** **B-1 still 200** (spec 600) — top pre-provisioning blocker. New EAS iOS dev build 76e2f5ee (client-only). Reconciliation record: `GOVERNANCE_RECONCILIATION_DRAFT_2026_07_15.md`.
- **[CONFIRM]:** exact Option-B mechanism vs `v213_optionb_commercial_progression` source; 5 in-scope NULL trophy icons (gs3/6/18/20/22); `docs/APE_PLANNING_NOTES_2026_07_15.txt` cited by handoff is **NOT in the workspace**.

## 0.0-prev WHAT CHANGED SINCE INDEX v32 (was v33) — SCHEMA v2.13 COMMERCIAL MAPPING LAYER DEPLOYED [CANDIDATE]
**Session 2026-07-11 — Path B commercial mapping layer DEPLOYED to prod `yjgolswjggmlpeowvtxr` (additive; item-D held).** Coordinated bump: INDEX **v33** / STATE **r31** / TRACKER **r30**.
- **DEPLOYED (4 tracked migrations, additive-only):** `public_courses`(9) · `public_course_topics`(54: 51 primary + 3 cross_list, +is_free, single-primary trigger) · `entitlements`(+RLS) · `users.audience` · `has_academy_access()` · `register_commercial_user` v1 · anon catalog read grants (glossary ex common_mistakes, topics, achievements, public_courses/topics). Verified; `get_advisors` no new ERROR.
- **HELD:** item-D `common_mistakes` gate + `glossary_full_v` view — ships with client release.
- **CANDIDATE (blocked):** `start_quiz_attempt` v3 (optional `p_public_course_id` param ruled) — blocked on design Qs. Live v2 untouched.
- Files → §1H · open items → §4L · tasks → §5C. Known gap: gs36 "DAW Skills" free but `is_active=false`.

## 0.0-prev WHAT CHANGED SINCE INDEX v31 (was v32) — POST-LAUNCH RECONCILIATION [CANDIDATE]
**Session 2026-07-10 — reconciled ~2 weeks of production-era work that was on disk + in the live DB but never recorded in governance.** Same drift class as the "WHY v5 EXISTS" note above, recurring. Grounded in the live DB (`yjgolswjggmlpeowvtxr`, verified this session) + dated on-disk files; **[CONFIRM]** = not verifiable from disk/DB, not filled from memory. Full detail → TRACKER **r29**; current snapshot → STATE **r30**.

1. **PRODUCTION LIVE since 2026-07-04:** pooled-answer **SCHEMA v2.12 + `start_quiz_attempt v2`** deployed (after isolated dev-branch verify B-3 = PASS); **1,148 graded questions** across **24 active topics**; Safety gs0 `is_active=TRUE`; 3 users (2 admin + 1 test), 6 attempts, 0 badges, **0 real students**; glossary **3,660 / 4,677 / 2,607 authored / 1,053 pending**.

2. **FILES NOW REGISTERED (were produced after v31 but never indexed — recorded here; slot into §1 sub-lists on next full pass):**
   - `SCHEMA_v212_PRODUCTION_DEPLOY_2026_07_04.sql` — production deploy package for the pooled-answer layer (v2.12).
   - `POOLED_ANSWER_IMPORT_AND_DEPLOY_2026_07_03.md` + `DECISION_MATCHING_PAIR_FLOOR_3_2026_07_03.md` + `F1_DEVBRANCH_DEPLOY_APPROVAL_2026_07_03.md` — pooled-answer import map / deploy-rollback-tests + matching-pair floor=3 decision + F1 approval.
   - `B3_DEVBRANCH_VERIFICATION_REPORT_2026_07_04.md` — dev-branch verification (PASS, prod untouched).
   - `APE_QUIZ_CORPUS_ALL_1148.json` — the 1,148-question corpus (imported to live).
   - `APE_FRONTEND_BUILD_HANDOFF_2026_07_04.md` + `APE_DESIGN_SEED_BRIEF_2026_07_05.md` + `APE_CODE_INTEGRATION_BRIEF_2026_07_05.md` + `APE_CLAUDE_CODE_KICKOFF_PROMPT_2026_07_05.md` — frontend build orchestration (Claude Design → Claude Code).
   - `RECORD_STUDY_PROGRESS_RPC_CONTRACT_2026_07_05_v1.md` — deployed RPC (present in live DB).
   - `D2_VERIFY_REGISTRATION_RPC_SPEC_2026_07_08_v1.md` + `D3_SUBMIT_QUIZ_EXPLANATION_SPEC_2026_07_08_v1.md` — `verify_registration` (present in live DB) + `submit_quiz` explanations (v8.2→v8.3; 1,148/1,148 explanation coverage).
   - `ape_glossary_data_snapshot_20260708.js` — glossary SSoT snapshot (3,660 terms); **supersedes `…_20260627.js`**; ⚠️ may now be behind live after 2026-07-10 glossary edits [CONFIRM/regen].
   - `APE_SPIKE0_REPORT_2026_07_09_v1.txt` — `ape-dsp` native audio-capture spike (PASS on-device; Spring measurement-tools).
   - Gate/stage reviews already on disk but unindexed: `MUSI190_GATE2_REVIEW_2026_07_02.md`, `AUDI201_GATE2_REVIEW_2026_07_02.md`, `R2_STAGE1_GATE2_REVIEW_2026_07_03.md`, `R2_STAGE2_GATE2_REVIEW_2026_07_03.md`, `APE_CONTINUATION_HANDOFF_R2_STAGE2_2026_07_02.md`.
   - This session's deliverable: `APE_TROPHY_ART_WIRING_HANDOFF_2026_07_10.md` (Claude Code handoff).

3. **TROPHY / COURSE-CARD ART (2026-07-09→10):** buckets `trophy-icons` + `course-cards` created 07-09. **07-10 (this session):** wired **7** `achievements.icon_url` values (in-scope Corporate AV gs19 + Distributed Audio gs21; deferred Mixing/Vacuum Tubes/Band Recording/Audio Career/Professional Networking) + fixed MUSI 205B course-card duplicate (verified). **Gap:** 5 in-scope active achievements still `icon_url=NULL`, no file (Connectors gs3, Amps & Loudspeakers gs6, Consumer Audio gs18, Commercial Audio gs20, Vehicle Audio gs22). 2 redundant trophy files may be deleted (`audiocareereploration.png`, `pluginsandvitrinstr.png`).

4. **DEPLOYMENT-STATUS CAVEAT:** several files above carry `CANDIDATE / NOT deployed` headers, but the live DB shows the behavior deployed. **Live DB is ground truth; those headers lag.** Deployed exact versions of `submit_quiz` / `register_student` = [CONFIRM].

5. **OPEN BLOCKERS (pre-provisioning):** **B-1 NOT restored** — `study_methods.min_engagement_seconds` = **200** for flashcards/fill_in_blank/matching (spec = 600); restore before any real student. Remaining smoke tests + parked rulings = [CONFIRM]. ⚠️ Two backup tables dated today (`glossary_backup_corrections_20260710`, `glossary_backup_prefill_20260710`) → glossary edits ran 07-10 outside this session [CONFIRM scope].

6. **VERSION-DRIFT NOTE:** a memory-cached governance set "INDEX v47 / STATE r46 / TRACKER r45" was **phantom** — the real latest was the 06-28 v44_r29 set. Per the non-negotiable rule, versions are trusted from disk, not memory.

---

## 0.0-prev WHAT CHANGED SINCE INDEX v30 (was v31)
**Session 2026-06-28 — SAFETY PREREQUISITE FEATURE LIVE: glossary import (Phase 3) + engine wiring (Phase 4) applied + verified to live + snapshot regenerated + pre-safety backups dropped + project-folder cleanup.** Full detail → TRACKER **r28**.
1. **SAFETY GLOSSARY IMPORT (Phase 3) — 153 committee-reviewed terms** loaded via the staging pattern (gate-verified term-md5 `a7bcdfe1…` + full-content md5 `5042052a…`). Glossary **3,107 → 3,260 terms / 4,114 → 4,272 assignments / 2,053 → 2,206 authored / 1,054 pending** (all 153 authored; pending unchanged, all in the deferred 6 courses). Safety topic (Achievement 0, `is_prerequisite`, gs=0) = **70 assignments**. File: `SAFETY_GLOSSARY_PHASE3_IMPORT_2026_06_27.sql`.
2. **SAFETY PHASE 4 (ENGINE WIRING) — DEPLOYED + 7/7 behavioral-tested** (migration `safety_phase4_engine_wiring_20260627`; Design A status-driven gate): NEW `unlock_after_safety` (internal-only, EXECUTE revoked) + Design-A seed-lock in `seed_first_topic_on_enrollment` + precondition-0 `safety_prerequisite_incomplete` in `start_quiz_attempt` + completion hook in `submit_quiz` + Safety auto-enroll in `register_student` + Achv0 `applicable_methods='{flashcards}'`. Advisors **10 WARN + 0 INFO — no new exposure**. File: `SAFETY_PHASE4_ENGINE_2026_06_27.sql`. ⚠️ **GATE NOW LIVE** — do NOT provision/claim students until Phase 5 (≥25 graded Safety questions + Achv0 activation), else their whole app is locked. (The 06-18 RPC dump no longer reflects the deployed `register_student`/`start_quiz_attempt`/`submit_quiz`.)
3. **SNAPSHOT REGENERATED (Safety-inclusive) → `ape_glossary_data_snapshot_20260627.js`** (same filename; file md5 `4c68a8fa19a0bc845483835771d72f40`; 9 courses / 51 topics / 3,260 terms / 4,272 assignments). **NEW convention `achv` index `i = global_sequence`** (Safety at 0). Supersedes pre-Safety md5 `b4afbd9e…`. Uploaded + verified in Project.
4. **PRE-SAFETY BACKUPS DROPPED** (`drop_pre_safety_glossary_backups_20260627`) → **0 `_backup_*` tables remain**; 2 INFO advisors cleared.
5. **PROJECT-FOLDER CLEANUP:** 13 stale files removed (7 retired + 6 superseded glossary-provenance). §1 entries for the removed files retired here (see §2 v31). Leftover still to remove: `SESSION_HANDOFF_STEP0_BUILD_2026_06_18.md`. **Pointers** → STATE **r29** / TRACKER **r28** / this file **v31**.
6. **SAFETY DOC-SYNC — APPROVED & LOCKED 2026-06-28** (Safety layer; deployed): SCHEMA **v2.11-SAFE** (`…v210.md`) · MASTER **v4.3-SAFE** (`…v42.md`) · `register_student` **v2.1** (`…_v2.md`) · `start_quiz_attempt` precondition-0 (`…_v1.md`) · `submit_quiz` **v8.2** (`…v8_1.md`) · `DEVELOPER_QUICKSTART` **v22** (new file, replaces v21). **The quiz-draw candidate stays CANDIDATE, UNCHANGED** (SCHEMA **v2.12** / MASTER **v4.4** / `start_quiz_attempt v2`) — authored earlier, independent of the Safety lock; reconcile on its own separate approval. (Safety locked as a `v2.11-SAFE`/`v4.3-SAFE` point-release on the v2.11/v4.3 baseline so the lock does not imply quiz-draw approval.)
7. **DEFERRED-GLOSSARY AUTHORING INITIATIVE (2026-06-28; overnight Cowork):** all-8-field glossary authoring to committee standard for MUSI 201 + AUDI 204 + MUSI 202 = **815 terms / 17 topics**; 5 single-field 'definition-only' drafts DISCARDED (never applied to live). Prompt registered in §1G (**GL-AUTH**). Runs a few batches/night; content-only (no change to Spring-2027 launch or live behavior; nothing to live until reviewed + imported).
**Safety feature: ✅ Phase 2 · ✅ Phase 3 · ✅ Phase 4 — ⏭ Phase 5 (questions, TOP blocker) · ⏭ Phase 6 (frontend, Cursor).**

## 0.0-prev WHAT CHANGED SINCE INDEX v29 (was v30)
**Session 2026-06-27 (PM·3) — glossary B-PHASE COMPLETE: B4 + B5 applied + verified to live + snapshot regenerated.** Glossary-quality pass; **no spec or backend-logic change.** Full detail → TRACKER **r27**.
1. **B4 (related_terms validation) APPLIED + VERIFIED:** 12 in-scope self-references stripped (`array_remove`); 21 case/wording-variant dangling refs re-pointed to canonical survivors (dedupe + self-guard); 32 true-orphan deferred-course dangling refs **left for Spring 2027** (Booth Option B). Result: **0 self-refs globally · 0 dangling on any in-scope row** (32 deferred dangling remain).
2. **SNAPSHOT REGENERATED → `ape_glossary_data_snapshot_20260627.js`** (md5 `b4afbd9e296420a47b1da639f93263ee`; 148,488 bytes; 3,107 terms / 4,114 assignments / 1,054 pending). Studio 100-row cap defeated via a single-row/single-cell `json_build_object` export. **Verified vs live** (50/50 per-topic counts + 10 term spot-checks). Supersedes the AM md5 `54c3…` version. **CURRENT through the whole B-phase** (B4 & B5 both touched only `related_terms`, not stored in the snapshot) — the prior "behind live" OPEN ITEM is **CLOSED**.
3. **B5 (cross-course duplicate rows) RESOLVED:** multi-topic model had already absorbed most candidates; Booth chose **keep-distinct on all 5** (HDMI, MADI, Codec, ADC/DAC, Watt/Wattage). Only edit = **Watt ↔ Wattage cross-link** (no rows merged/deleted; counts unchanged).
4. **Pre-B5 backups created + RETAINED** (droppable on go-ahead): `_backup_glossary_pre_B5_20260627` (3,107) + `_backup_glossary_topics_pre_B5_20260627` (4,114).
5. **§1B/§1F pointers** → STATE **r28** / TRACKER **r27** / this file **v30**; snapshot md5 refreshed `54c3…`→`b4af…`. **Live DB unchanged in counts: 3,107 terms / 4,114 assignments / 2,053 authored / 1,054 pending / 295 categories / 0 questions.** **REMAINING (in-scope launch blockers): (1)** approve the 2026-06-27 quiz-draw + flashcard-banner CANDIDATE specs (SCHEMA v2.12 / `start_quiz_attempt v2` / MASTER v4.4 / IMPL r8) → deploy on a dev branch; **(2)** ≥25 graded questions/topic × 23.
**Not touched (correctly historical):** the §0.0-prev blocks + all prior pass descriptions stay verbatim. Coordinated: STATE **r28** / TRACKER **r27** / STARTUP refreshed.

## 0.0-prev WHAT CHANGED SINCE INDEX v28 (was v29)
**Session 2026-06-27 (PM) — glossary structural cleanup B1–B3 applied + verified to live DB.** Glossary-quality pass; **no spec or backend change.** Full detail → TRACKER **r26**.
1. **B1–B3 GLOSSARY CLEANUP APPLIED + VERIFIED (live `glossary`):** (B1) ~44 duplicate/near-dup rows consolidated across ~12 family-batches (many siblings deliberately kept distinct); (B2) topic reassignments (Operating point→Amplifiers, Dielectric→Connectors & I/O; **Arcing + Capacitor kept in Grounding** with hazard-aware defs) + **Grounding dual-meaning fixes** (Watt / Shielding / Ground loop now carry BOTH the audio and the electrical-safety meaning); (B3) full category-taxonomy "splitter" consolidation of all 7 in-scope clusters (Microphones, Grounding, Dynamics, Reverb/Delay, EQ, Connectors, Measurement). **Live now = 3,107 terms / 4,114 assignments / 2,053 authored / 1,054 pending / 295 distinct categories** (B1 −44 rows → −61 assignments via `glossary_topics` ON DELETE CASCADE). Each batch verified; all edits logged verbatim in `GLOSSARY_REVIEW_KNOWN_EDITS_LEDGER_2026_06_27.md`.
2. **NEW FILES registered (§1B):** `GLOSSARY_B4_B5_STARTUP_2026_06_27.md` (resume doc for the next chat — schema facts, scope, achievement-ID table, DB snapshot, B4/B5 plans) + `GLOSSARY_REVIEW_KNOWN_EDITS_LEDGER_2026_06_27.md` (the per-batch edit ledger).
3. **OPEN ITEM:** `ape_glossary_data_snapshot_20260627.js` is now **behind live** again (the B1–B3 deltas) — regenerate after the B-phase. **REMAINING: B4** (related_terms validation — 12 self-ref rows + dangling-ref sweep) **+ B5** (cross-course duplicate rows, incl. Watt vs Wattage).
4. **§1F glossary counts** refreshed to **3,107 / 4,114 / 2,053 authored / 1,054 pending**. **§1B pointers** → STATE **r27** / TRACKER **r26** / this file **v29** (also corrects the §1B table, which had still shown the v27-era r25/r24/v27 pointers).
**Not touched (correctly historical):** the §0.0-prev blocks + all prior pass descriptions stay verbatim. Coordinated: STATE **r27** / TRACKER **r26** / STARTUP refreshed.

## 0.0-prev WHAT CHANGED SINCE INDEX v27 (was v28)
**Session 2026-06-27 — snapshot regen + rollback-backup drop (DONE, live DB) + quiz-draw & flashcard-banner CANDIDATE specs (authored, pending approval).** Items 1–2 applied + verified on live DB; items 3–4 authored CANDIDATE (in outputs, nothing deployed). Full detail → TRACKER **r25**.
1. **GLOSSARY SNAPSHOT REGENERATED from live → `ape_glossary_data_snapshot_20260627.js`** (md5 `54c303dc2caa543aaff8b55151ff5569`; 159,350 bytes; 8 courses / 50 topics / 3,151 terms / 4,175 assignments / 1,112 pending; parse-validated; confirmed on disk in the Project). **Supersedes `…_20260625.js` (retired); MATCHES live — the prior "behind live" OPEN ITEM is CLOSED.**
2. **Rollback backup `_backup_glossary_related_terms_20260626` DROPPED** (migration `drop_backup_glossary_related_terms_20260626`; 0 `_backup_*` remain) after fixing 2 in-scope self-refs (`Patch bay`, `Sample Rate`) → in-scope primary set = 0 self-ref / 0 dangling.
3. **QUIZ-DRAW CANDIDATE SPECS AUTHORED (pending approval; nothing deployed, `glossary_id` not on live):** SCHEMA **v2.12** (+`quiz_questions.glossary_id` + write-time integrity trigger `validate_graded_question_glossary_link` + draw-join index; question-level `difficulty` DEPRECATED; activation unchanged ≥25), **`start_quiz_attempt v2`** (only Step 8/the draw changes — stratified `min(18,|I+A|)` I+A + RELAX + rotation; submit_quiz v8.1 unchanged), **MASTER v4.4** (OPEN-2/Quiz-Flow prose → pool/stratified-draw). Draw arithmetic validated on live synthetic pools.
4. **FLASHCARD DIFFICULTY BANNER SPEC AUTHORED (pending approval):** IMPLEMENTATION_SPEC **Screen 2 (→ r8)** + MASTER §6 note — **frontend-only, no schema/RPC/DB change** (progression on *done* = viewed 2× OR once+known; two-state lit=shown buttons; ≥1 always shown; integrity invariant — hiding never reduces the required set).
5. **§1B pointers** → STATE **r26** / TRACKER **r25** / this file **v28**. **NEXT:** approve the 2026-06-27 CANDIDATE specs → deploy quiz-draw (dev branch) → ≥25 graded questions/topic × 23. *NOTE: the Item-3/4 CANDIDATE files reuse frozen canonical filenames (`…v210.md` / `…v42.md` / IMPL `…_v2_r7.md`) with internal bumps + in-header CANDIDATE status; §1 still lists the LOCKED v2.11/v4.3/r7 as canonical until Prof. Booth approves + uploads the candidates.*
6. **§1A row 3f corrected** — removed two phantom `.mermaid` filenames (`APE_DASHBOARD_ECOSYSTEM_MAP.mermaid`, `APE_SCHEMA_ERD_v29.mermaid`) that were never created as files; kept the real `APE_explorer_glossary_mockup.html`; the 23-table ERD lives in `BACKEND_BUILD_RECORD`.
**Not touched (correctly historical):** the §0.0-prev blocks + all prior pass descriptions stay verbatim. Coordinated: STATE **r25** / TRACKER **r24** / STARTUP refreshed.

## 0.0-prev WHAT CHANGED SINCE INDEX v25 (was v26)
**Session-2 decisions logged + ADV-1 security closed (2026-06-26 PM).** The quiz/flashcard items are **DECIDED — CANDIDATE specs NOT yet authored, nothing deployed**; the security changes **WERE applied + verified on live DB**. Full detail → TRACKER **r23**; consolidated in **§4K**.
1. **QUIZ-DRAW RULE — LOCKED; SUPERSEDES §4G-D(2) serve-set + the pool-and-draw proposal (both VOID).** 25 Q/quiz; **≥18 from intermediate+advanced**; difficulty inherited via NEW `quiz_questions.glossary_id` → `glossary_topics.difficulty`; activation ≥25 approved with RELAX; ≤50% retake rotation. KNOWN-DIVERGENT: locked specs still describe the serve-set — pending CANDIDATE SCHEMA **v2.12** + `start_quiz_attempt` **v2** + MASTER **v4.4**.
2. **FLASHCARD DIFFICULTY BANNER — FULLY DECIDED** (specs pending): Progressive = adaptive+additive default-on; lit B/I/A = live read-out of deck levels; ≥1 always lit; hidden cards still gate-required.
3. **FALL-2026 SCOPE — SET:** launch = MUSI 190 + AUDI 201 only (23/50 topics); other 6 → Spring 2027. In-scope gaps: 780 definitions + 914 deeper-field; 0 graded questions (≈≥575 to author).
4. **SECURITY — ADV-1 FULLY RESOLVED + verified:** REVOKE on admin import/validate/KPI fns from authenticated/anon (migration `adv1_revoke_admin_import_fns_from_authenticated_20260626`) + Leaked-Password Protection enabled; advisors 16→10 (remainder by-design).
5. **ADMIN SURFACE — SCOPED:** sole-admin Fall → in-app admin dashboard DEFERRED. **NEW ARTIFACT (§1G):** `APE_Glossary_Authoring_AGENT_PROMPT_2026_06_26.md`.
6. **§1B pointers** → STATE r24 / TRACKER r23 / this file v26; **§5** task list refreshed (new §F punch list); **§4G-D(2)** marked SUPERSEDED.
**Not touched (correctly historical):** the §0.0-prev blocks + all 06-23 / 06-25 pass descriptions stay verbatim. Coordinated: STATE **r24** / TRACKER **r23** / STARTUP refreshed.

## 0.0-prev WHAT CHANGED SINCE INDEX v24 (was v25)
**Doc-only reconciliation pass — no spec/schema/RPC/live-DB-data change.** Records pre-approved housekeeping executed 2026-06-26 (session "Pre-project housekeeping tasks") whose changelog had been deferred. **Re-verified live DB 2026-06-26:** 3,152 terms / 4,176 assignments / 1,316 authored / 1,836 pending / **0 questions** / 2 admins / 0 students — unchanged.
1. **Pre-merge backups** (flagged open in the v23 changelog + STATE/STARTUP) — all 5 superseded backups (`_backup_glossary_pre_merge_20260625`, `_backup_glossary_topics_pre_merge_20260625`, `_backup_{achievements,glossary,glossary_topics}_20260623`) **DROPPED 2026-06-26** via tracked migration `drop_superseded_glossary_backups_20260625` (verified 0 `_backup_*` remain; live tables intact). *(was: retained pending Prof. Booth confirm — CLOSED.)*
2. **Snapshot SSoT** (flagged open in the v23 changelog + STATE/STARTUP) — **CLOSED**: `ape_glossary_data_snapshot_20260625.js` regenerated from live (canonical md5 `f797e59ad2b50bd96010ae0a25327341`), superseding the stale `…_20260623.js`. *(was: OPEN — regenerate.)*
3. **Current-state SSoT pointers** refreshed `…_20260623.js` → `…_20260625.js` (§4 + §1F glossary note). 06-23 snapshot retained only as provenance.
4. **STARTUP_HERE.md** refreshed in lockstep (body pointers → v25 / STATE r23 / TRACKER r22; both open-item flags removed).
**Not touched (correctly historical):** the §0.0-prev blocks and all 06-23 / 06-25 pass descriptions stay verbatim. Coordinated: STATE **r23** / TRACKER **r22** / STARTUP refreshed.

## 0.0-prev WHAT CHANGED SINCE INDEX v23 (was v24)
**Doc-tidy pass only — no spec/schema/RPC/live-DB change.** Refreshed stale *internal* rows that lagged the current canonical reality (the v23 canonical-set pointers themselves were already correct):
1. **§1B row 10** — `DEVELOPER_QUICKSTART` corrected `v20 (2026-06-20)` → **`v21 (2026-06-21)`** (matches disk + STARTUP read-order).
2. **§1B row 14** — "This file" pointer `v13 (2026-06-20)` → **v24 (2026-06-25)**.
3. **§1F (GL/GL1b rows + the "Glossary = 1,196 terms" note)** — the pre-expansion single-topic description replaced with the current **multi-topic 3,152-term / 4,176-assignment** reality; the `APE_Glossary_v13_*` xlsx + `glossary_import_v13.sql` re-labelled **SUPERSEDED** (kept as provenance).
4. **§5-D (Phase-2 Backend task list)** — flagged **SUPERSEDED**: backend is BUILT + integrity-tested to live DB, admin bootstrapped, glossary seeded; current truth = STATE r22 / TRACKER r21 / `BACKEND_BUILD_RECORD`.
5. **STARTUP_HERE.md** refreshed in lockstep (body pointers → v24 / STATE r22 / TRACKER r21; SCHEMA v2.11 + MASTER v4.3 re-labelled **LOCKED**, not "drafted/CANDIDATE").
**Not touched (correctly historical):** PROGRESS_TRACKER r21's "Coordinated: INDEX v23" line records the v23 pass and stays. STATE r22 carries no index-version pointer → no change.

## 0.0-prev WHAT CHANGED SINCE INDEX v22 (was v23)
1. **GLOSSARY COMBINED-ADDITIONS MERGE APPLIED TO LIVE DB** `yjgolswjggmlpeowvtxr` (data-only; backend stays CANDIDATE; verified). Applied on top of the 2026-06-23 50-topic restructure: **14 dedup deletes + 1,990 difficulty/primary-topic edits + 134 fully-authored additions**. Glossary **3,031 → 3,152 terms / 4,069 → 4,176 topic-assignments**; authored defs **1,196 → 1,316**; pending **1,835 → 1,836**. Source: `APE_Glossary_Additions_COMBINED_CANDIDATE_2026_06_25.xlsx` + `APE_Glossary_Additions_COMBINED_import_CANDIDATE_2026_06_25.sql`.
2. **DURABLE GUARDRAIL HONORED** — authored-def count held at 1,182 through all of Stage B (no existing definition overwritten by an upsert); +134 in Stage C. Verified: 3,152 terms · 4,176 assignments · exactly one primary/term · 0 orphans · 0 of the 14 deletes re-created · 5/5 sampled additions authored.
3. **DOC-SYNC — SCHEMA v2.11 + MASTER v4.3 APPROVED & LOCKED (Prof. Booth, 2026-06-25).** The 2026-06-23 CANDIDATE structural drafts (multi-topic `glossary_topics` + per-topic `difficulty`; canonical 50-topic/8-course map; `ape_achievement_structure_FINAL_20260623.json` = 'Valid Topics' SSoT) are now LOCKED; data-scale annotations refreshed to post-merge counts across SCHEMA / MASTER / STATE / TRACKER / INDEX / STARTUP (current-state figures only; historical refs left intact).
4. **Pre-merge safety backups on DB:** `_backup_glossary_pre_merge_20260625` (3,031) + `_backup_glossary_topics_pre_merge_20260625` (4,069) — drop after Prof. Booth confirms. `get_advisors` (security): **no new issues** — only pre-existing ADV-1 WARNs + benign INFO on backup tables.
5. **OPEN ITEM:** the assignments+difficulty SSoT snapshot `ape_glossary_data_snapshot_20260623.js` is now **stale vs live** (merge applied on top) — regenerate `…_20260625.js` from live DB when ready (deferred — out of this pass's scope).
6. **Launch blockers unchanged:** (1, top) question authoring — 0 graded questions; (2) **1,836** pending glossary definitions. Coordinated: STATE **r22** / TRACKER **r21** / STARTUP refreshed.

## 0.0-prev WHAT CHANGED SINCE INDEX v20 (was v21)
1. **GLOSSARY MEGA-EXPANSION + 50-TOPIC RESTRUCTURE APPLIED TO LIVE DB** `yjgolswjggmlpeowvtxr` (CANDIDATE, verified). Glossary **1,196 → 3,031 terms / 4,069 topic-assignments** (multi-topic, per-topic B/I/A difficulty; +1,835 new terms).
2. **Curriculum restructured in place** to the canonical **50-topic / 8-course** map via overwrite-by-`global_sequence` (UUIDs + glossary FKs preserved). Per-course 10/13/4/8/5/3/4/3 = 50. Renames + course-moves (Assisted Listening→AUDI201, Vacuum Tubes→AUDI204) + Corporate AV / Commercial Audio Systems / Assisted Listening positions; Industry Professionalism / Workplace Readiness / Stage & Monitor Systems retired from the active map.
3. **NEW DB column `glossary_topics.difficulty`** (`beginner|intermediate|advanced`). `glossary_topics` fully rebuilt with per-topic difficulty + `is_primary`. `courses.achievement_count` resynced.
4. **1,196 existing authored definitions PRESERVED**; **1,835 new terms = `(definition pending)`** (new content blocker).
5. **New canonical artifacts (outputs — upload to persist):** `APE_Glossary_BACKUP_20260623.xlsx` (Glossary / Topic Assignments / Topics), `ape_glossary_data_snapshot_20260623.js` (working-set snapshot = SSoT for assignments+difficulty), `ape_achievement_structure_FINAL_20260623.json`.
6. **Safety backups on DB:** `_backup_{achievements,glossary,glossary_topics}_20260623` (drop after confirmation).
7. `get_advisors`: only pre-existing WARNs + 3 INFO (backup-table RLS-no-policy). **No new security findings.**
8. **Doc-sync DONE (2026-06-23 PM·2 — CANDIDATE, pending Prof. Booth approval):** SCHEMA bumped internally to **v2.11** (documents `glossary_topics` + per-topic `difficulty`); MASTER bumped internally to **v4.3** (canonical 50-topic/8-course map; full list → `ape_achievement_structure_FINAL_20260623.json` = the glossary 'Valid Topics' SSoT). Filenames unchanged (`…v210.md` / `…v42.md`) to preserve pointers. *(Was: "SCHEMA must add `glossary_topics.difficulty`; MASTER 50-achievement list" — now drafted on disk.)*
9. **Launch blockers:** (1, top) question authoring — 0 graded questions; (2, new) 1,835 pending glossary definitions. Coordinated: STATE **r20** / TRACKER **r19** / STARTUP refreshed.

## 0.0-prev WHAT CHANGED SINCE INDEX v10 (was v11)
1. **Phase 2 backend BUILT to live DB** `yjgolswjggmlpeowvtxr` (was "untouched / pending Step 0"). 23 tables + RLS (55 policies) + 3 views + 1 matview + 19 functions + 3 RPCs + grader/clamp applied via `apply_migration` (M1–M25) and **integrity-tested — ALL harnesses PASS**.
2. **submit_quiz v8 + grade_one + recompute_reachability AUTHORED (Option B)** — the complete grader/clamp/submit source was not on disk (v7 retired; hardened file abbreviated), so it was authored strictly to TWO_THRESHOLD §3-4 / IMPL §313/269-278 / SCHEMA answer-shapes, deployed, and validated. **4 authored-logic flags need a ruling** (see BUILD RECORD §3 / §4G-E2).
3. **2 bugs caught + fixed by tests:** `grade_one` matching-sort (`ORDER BY 1` literal); missing base `GRANT SELECT TO authenticated` (RLS was unreachable).
4. **New canonical build artifacts** registered in **§1G**.
5. **Post-build checkpoint** produced (deferred from v10): STATE **r10**, TRACKER **r9**, QUICKSTART **v19**, MASTER **addendum**.
6. **New open item §4G-E2:** client WRITE-grant matrix (INSERT/UPDATE/DELETE + WITH CHECK for client-direct writes) — pending RLS-Addendum write model; RPC writes already work.
7. DB seed pristine (0 quiz_questions, 0 glossary — test data rolled back). **CANDIDATE — pending approval.**

## 0.0-prev WHAT CHANGED SINCE INDEX v9 (was v10)
1. **Serve-set / pool model APPROVED (Q3, 2026-06-18).** Graded quiz delivery changed from **fixed-25** to **pool + server-sampled exactly-25**. Decisions 3a–3e + D-SS1…D-SS6 locked (see SCHEMA v2.10 §0).
2. **SCHEMA v2.9 → v2.10** (22→**23 tables**): NEW `quiz_attempt_items` (materialized serve-set w/ snapshots + reserved repeat-fill slot); `validate_quiz_question_count` revised (`<>25` → **pool ≥25 approved-only**); `quiz_attempts` += `attempt_status`, `submitted_at` default dropped, one-active-attempt partial index; answers slot-keyed.
3. **submit_quiz v7 → v8** — grades the recorded serve-set (`quiz_attempt_items`) instead of the live pool; UPDATEs an attempt created at start; slot-keyed; server timer. All v7 scoring/clamp/integrity/badge logic unchanged.
4. **NEW `start_quiz_attempt` v1** — server samples/locks the 25, snapshots answers, sets the timer, online-required (3e). The eligibility gate now fires at quiz START.
5. **§4G-D RESOLVED** (the last open conflict): "pool may exceed/repeat 25" reconciled to the approved serve-set model (pool ≥25 → sample 25; <25 cannot activate; repeat-fill reserved/unreachable).
6. **register_student v2, IMPL v2-r5, Dashboard Spec, all 22 prior tables — unchanged.**
7. **Deferred to post-build checkpoint:** consolidated MASTER **v4.2** addendum, STATE **r10**, TRACKER **r9**, QUICKSTART **v1.9** (will reflect actual build status). Until then, per STARTUP precedence, the file-specific authoritative sources (SCHEMA v2.10 / submit_quiz v8 / start_quiz_attempt v1) govern.

## 0.0-prev WHAT CHANGED SINCE INDEX v8 (was v9)
1. **Dashboard planning formalized** → new `APE_DASHBOARD_SPEC_2026_06_17.md` (7 dashboards + Database Explorer over all 22 tables, Airtable-style; placeholder-now/polish-later).
2. **SCHEMA v2.8 → v2.9** (20→22 tables): glossary enrichment (`category`/`difficulty`/`common_mistakes`/`scenario_contexts`) + `glossary_media`; `student_badges` revocation + audited grant; NEW `audit_log`; extended RLS; dashboard data-layer (views/matview/import fns).
3. **Coordinated bump:** MASTER v4.0→**v4.1**, SCHEMA v2.8→**v2.9**, INDEX v8→**v9**, STATE r8→**r9**, TRACKER r7→**r8**, QUICKSTART v1.7→**v1.8**. submit_quiz **v7**, register_student **v2**, IMPL **v2-r5** unchanged.
4. **`admin_dashboard_requirements.json` RETIRED** (§2) — superseded by the Dashboard Spec.
5. Three dashboard **visuals** added to §1 (ecosystem map, ERD, grid placeholder). **CANDIDATE; Supabase untouched.**

## 0.0-prev WHAT CHANGED SINCE INDEX v7 (was v8)
1. **Phase-2 planning session applied** (2026-06-17 PM). Decisions in `PHASE_2_PLANNING_DECISIONS_2026_06_17.md`.
2. **Coordinated bump:** MASTER v3.9→**v4.0**, SCHEMA v2.7→**v2.8** (17→**20 tables**), submit_quiz v6→**v7**, IMPL v2-r4→**v2-r5**, INDEX v7→**v8**, STATE r7→**r8**, TRACKER r6→**r7**, QUICKSTART v1.6→**v1.7**. register_student stays **v2**.
3. **Deltas:** users.qr_token+role; glossary_definitions; quiz_questions media/usage/source/review; course_sections+instructor_sections; enrollment.section_id; RLS addendum. **B-4 trigger + submit_quiz scoped to `usage='graded_quiz'`** (approved).
4. **Two new files** added to §1: PHASE_2_PLANNING_DECISIONS + admin_dashboard_requirements.json.
5. **Status = CANDIDATE** (pending Prof. Booth approval). **Supabase not provisioned/modified.** Next planning block: dashboard→data mapping. §4G-D (Phase-2 25-Q "pool" model) still open.

## 0.0-prev WHAT CHANGED SINCE INDEX v6 (was v7)
1. **Screen 13 (Scenarios) LOCKED** — folded into `IMPLEMENTATION_SPEC_2026_06_17_v2_r4.md` §7; the standalone upload is **retired/discarded** (same pattern as the Screen 12 standalone). **→ 20/20 MVP screens; UI phase complete.**
2. **S13-A (Scenarios single-pass):** added `study_methods.required_passes` (default **2**; Scenarios = **1**) so a scenario is "done" after **one** answer, not two. The **80%-accuracy + 10-min-time gates are unchanged**, and the gate SQL (`completion_pct < 100`) is **unchanged** — only the per-item "done" threshold became per-method. Folded into SCHEMA **v2.7** / MASTER **v3.9** / `submit_quiz` **v6**. `register_student` stays **v2** (untouched).
3. **Coordinated bump:** MASTER v3.8→**v3.9**, SCHEMA v2.6→**v2.7**, submit_quiz v5→**v6**, IMPL v2-r3→**v2-r4**, INDEX v6→**v7**, STATE r6→**r7**, TRACKER r5→**r6**, QUICKSTART v1.5→**v1.6**.

---

## 0.0b WHAT CHANGED SINCE INDEX v4 (historical)
1. **Five previously-unrecorded files are now classified** (see §1C and §1E):
   - `SCREEN_12_MEDIA_EAR_TRAINING_LOCKED_2026_06_16.md` — Screen 12 locked spec.
   - `8_P0_BLOCKERS_SESSION_COMPLETE_2026_06_16.md`, `8_P0_BLOCKERS_HARDENED_RPCS_2026_06_16.md`, `8_P0_BLOCKERS_SCHEMA_RULES_VALIDATION_2026_06_16.md` — P0-blocker resolution package.
   - `PHASE_2_SUPABASE_APIS_EDGE_FUNCTIONS_INVENTORY_2026_06_16.md` — Phase 2 backend planning.
2. **Status corrected:** the 8 P0 blockers are **resolved at the design level** in the advisory package above; Screen 12 is **LOCKED** (only Screen 13 remains for Path B).
3. **Two new conflicts opened** by the P0 package (§4G): a `submit_quiz` **v3-vs-v4** clash, and **schema columns/triggers not yet folded into SCHEMA v2.4.** Both are DECISIONS for Prof. Booth — they are *not* silently resolved here.
4. **Consolidation executed this pass:** **Tier-1** — Screen 12 spec folded into `IMPLEMENTATION_SPEC v2-r2` §7 (standalone retired); TWO_THRESHOLD fold **held** (not redundant — §4G-E). **Tier-3** — the canonical-set & retire lists, previously triplicated across INDEX/STATE/TRACKER, are now owned ONLY by this index (STATE r5 + TRACKER r4 point here).

---

## 0.1 HOW PERSISTENCE WORKS (unchanged)
- `/mnt/project/` is a **read-only mirror.** Claude cannot write to it.
- Work persists **only when you upload files into the Claude Project.** Files Claude makes sit in `/mnt/user-data/outputs/` until you do.
- Memory is secondary and trimmed — never the source of truth. The files are.
- End-of-session protocol: upload the updated canonical set (Section 1), delete the retire set (Section 2). This index is the checklist.

## 0.2 DATE-COLLISION ARBITER (unchanged, now more important)
Many files share `2026_06_16`, and the five newly-classified files share it too. **This index is the tiebreaker.** A new chat reads this index before trusting any filename date-sort.

---

## 1. CANONICAL FILE SET — UPLOAD ALL OF THESE (exact filenames)

> **⚠️ RETIRED & REMOVED FROM PROJECT (2026-06-28, v31) — the entries below are no longer on disk; treat as struck-through (see §2 v31):** §1C items 15–17 (`8_P0_BLOCKERS_*` ×3); §1F `APE_Glossary_v13_CLEANED_CANDIDATE.xlsx`, `APE_Glossary_v13_IMPORT_READY.xlsx`, `MUSI190_Glossary_Final_Complete_1.xlsx`, `AUDI201_Glossary_Updated_1.xlsx`; §1E `APE_STUDIO_GLOSSARY_ANALYSIS_DELIVERABLES_INDEX_2026_06_07.md`, `GLOSSARY_ENHANCEMENT_QUICK_REFERENCE_2026_06_07.md`. Also pending removal: `SESSION_HANDOFF_STEP0_BUILD_2026_06_18.md`. **NEW (upload to Project):** `SAFETY_GLOSSARY_PHASE3_IMPORT_2026_06_27.sql` + `SAFETY_PHASE4_ENGINE_2026_06_27.sql` (§1G) + the regenerated `ape_glossary_data_snapshot_20260627.js` (DONE).

### 1A. Locked specs (authoritative)
| # | File | Version | Role | Status |
|---|---|---|---|---|
| 1 | `MASTER_SPEC_CONSOLIDATED_2026_06_21_v42.md` *(LOCKED — internal v4.3)* | v4.3 | **Single source of truth** | **v4.3 (APPROVED & LOCKED 2026-06-25; drafted 2026-06-23):** adds the canonical **50-topic/8-course** map (item 6; full list → `ape_achievement_structure_FINAL_20260623.json`) + multi-topic glossary note + D-5 reconciliation; glossary data-scale annotation refreshed to **3,260 / 4,272** (post-Safety-import 2026-06-28). v4.2 base: F-6 + F-7 folded; **§1A** progression nuggets from TWO_THRESHOLD (§4G-E). ⚠️ engine refs still cite older schema/RPC labels — superseded by SCHEMA v2.11 / submit_quiz v8.1 / start_quiz v1 which govern. |
| 2 | `SUPABASE_SCHEMA_COMPLETE_2026_06_18_v210.md` | **v2.11** (**23 tables**) | DB schema | **v2.10 body APPROVED (2026-06-18); v2.11 additions APPROVED & LOCKED 2026-06-25 (drafted 2026-06-23):** documents the multi-topic **`glossary_topics`** join table (TABLE 16d) + per-topic **`difficulty`** (both LIVE on DB); data-scale annotations refreshed to **3,260 / 4,272** (post-Safety-import 2026-06-28). v2.10 = serve-set/pool model: NEW `quiz_attempt_items`; activation trigger (pool ≥25 approved); attempt lifecycle; slot-keyed answers. (file suffix `v210` == version 2.10; internal now **2.11**) |
| 2d | `SCHEMA_v2_10_DELTA_SERVE_SET_2026_06_18.md` | — | Serve-set delta (rationale) | review companion to the consolidated v2.10 (decisions D-SS1…D-SS6) |
| 3 | `SUBMIT_QUIZ_RPC_CONTRACT_2026_06_19_v8_1.md` | **v8.1** | Server scoring/clamp/gate/integrity | **DEPLOYED + verified (2026-06-19)** — grades the recorded serve-set; UPDATEs the start-created attempt; slot-keyed; server timer **602 s** (F2); calls `refresh_student_metrics()` after finalize (F1). Full contract (restores accidentally-deleted v8 + folds the v8.1 addendum). Supersedes v8/v7. |
| 3a2 | `START_QUIZ_ATTEMPT_RPC_CONTRACT_2026_06_18_v1.md` | **v1** | **NEW** serve-set generation | **APPROVED/LOCKED (2026-06-18)** — server samples/locks 25 + snapshots + timer; online-required; eligibility gate at quiz start. |
| 3c | `PHASE_2_PLANNING_DECISIONS_2026_06_17.md` | — | Phase-2 decision record | current — companion to SCHEMA / submit_quiz |
| 3e | `APE_DASHBOARD_SPEC_2026_06_17.md` | **v1.1** | **NEW** Admin/Instructor Dashboard Spec | authoritative for the dashboard layer (7 dashboards + Database Explorer); supersedes the JSON; CANDIDATE. **v1.1 (2026-06-21): definition-rotation rule removed** per STUDY_UX_DECISIONS (LOCKED) |
| 3f | `APE_explorer_glossary_mockup.html` | — | Dashboard visual (Explorer mockup) | Explorer grid **placeholder** (polish-later). *(Correction 2026-06-26: the dashboard ecosystem map + schema ERD were never created as standalone `.mermaid` files and are not in the project — the current 23-table ERD is described in `BACKEND_BUILD_RECORD_2026_06_18.md` inventory; regenerate there at checkpoints if a diagram file is ever needed.)* |
| 3b | `REGISTER_STUDENT_RPC_CONTRACT_2026_06_17_v2.md` | v2 | Student account claim + auth link | **LOCKED (2026-06-17 baseline)** — model A self-service; first-topic seeding via enrollment trigger. Supersedes v1. Unchanged by the serve-set work. |
| 4 | *Screens 12 & 13 specs now live in `IMPLEMENTATION_SPEC ...v2_r5.md` §7* | — | Screens 12 (Ear Training) + 13 (Scenarios) | **FOLDED IN — standalone files RETIRED/discarded (§2).** (D-8: `mc`/`multi_select` final; **S13-A: Scenarios single-pass**.) |
| 5 | `AUTH_FLOW_SPEC_2026_06_21_v1_1.md` *(CANDIDATE — was 06_06)* | v1.1 | Auth/registration | **reconciled 2026-06-21 (CANDIDATE): F-12 RESOLVED** — nickname (PUBLIC) / first_name+last_name_initial (PRIVATE); `full_name` retired |
| 6 | `NOTIFICATION_EDGE_FUNCTIONS_SPEC_2026_06_21_v1_1.md` *(CANDIDATE — was 06_06)* | v1.1 | Notifications | **reconciled 2026-06-21 (CANDIDATE): F-5 RESOLVED** — enum `complete`, genuine-only (practice/void) guards, edge-fn naming declared, `nickname` |
| 7 | `UX_REFINEMENT_DECISIONS_2026_06_06.md` | — | 40-question decision log | current |
| 7b | `STUDY_UX_DECISIONS_2026_06_21.md` | — | Study-UX decisions: flashcard 5-level reveal · `.gif`=`image` · split-term disambiguation · definition-rotation removal · 5/5 sibling authoring-convention | **LOCKED (2026-06-21)** — integrated into IMPLEMENTATION_SPEC v2-r6 + APE_DASHBOARD_SPEC v1.1 (§4I) |

### 1B. Status / build / contract docs
| # | File | Version | Role | Status |
|---|---|---|---|---|
| 8 | `PROJECT_STATE_CURRENT_2026_06_28_v44_r29.md` | v4.2 (r29) | Current status | **refreshed 2026-06-28 (SAFETY FEATURE LIVE — glossary import + Phase 4 engine + snapshot regen; 3,260/4,272/2,206/1,054; gate live)** — canonical/retire tables live only here (Tier-3) |
| 9 | `PROGRESS_TRACKER_2026_06_28_r28.md` | r28 | Build schedule | **refreshed 2026-06-28** — Safety glossary import (153) + Phase 4 engine + snapshot regen + backup drop + folder cleanup logged; **Safety feature Phases 2–4 done** |
| 10 | `DEVELOPER_QUICKSTART_2026_06_28_v22.md` | v22 | Dev onboarding | **refreshed 2026-06-28** — Safety feature live + glossary 3,260/4,272; supersedes v21; version pointers track the current INDEX §1 |
| 11 | `IMPLEMENTATION_SPEC_2026_06_21_v2_r7.md` *(CANDIDATE — was v2_r6)* | v2-r7 | Consolidated RN build spec | **reconciled 2026-06-21 (CANDIDATE):** F-6 settings toggles + F-13 offline-quiz + F-7 100%-LED gradient; r6 study-UX (Screen 2 5-level reveal, `.gif`=`image`); Screens 12 & 13 in §7 |
| 12 | `TWO_THRESHOLD_SPEC_RECONCILED_v3_5.md` | — | Progression build-reference | **KEPT** — verification found unique content (worked example §3, pseudocode-demotion gotcha §4.3, double-partial §4.6) + stale v3.5/v2.3 line cites; folding requires editing MASTER (SSoT) — held, see §4G-E |
| 13 | `STARTUP_HERE.md` | perpetual | Session onboarding anchor | refreshed 2026-06-28 (Safety feature live; snapshot file md5 `4c68…`) |
| 14 | `PROJECT_FILE_INDEX_2026_06_28_v31.md` | v31 | This file | **current (2026-06-28 — Safety feature live; supersedes v30)** |
| 14b | `GLOSSARY_REVIEW_KNOWN_EDITS_LEDGER_2026_06_27.md` | — | Glossary cleanup edit ledger (Section B) | **living ledger** — per-batch verbatim IDs for every B0–B5 edit applied to live `glossary`; **Section B COMPLETE** |
| 14c | `GLOSSARY_B4_B5_STARTUP_2026_06_27.md` | — | B4/B5 resume + startup doc | **DONE — B4 + B5 complete 2026-06-27 PM·3** (kept as provenance; schema facts/scope table still useful reference) |

### 1C. Engineering advisory / planning (reference — NOT yet locked specs; do not build verbatim until §4G is resolved)
| # | File | Role | Note |
|---|---|---|---|
| 15 | `8_P0_BLOCKERS_SESSION_COMPLETE_2026_06_16.md` | P0 resolution summary + sequence | resolves B-1…B-8 at design level |
| 16 | `8_P0_BLOCKERS_HARDENED_RPCS_2026_06_16.md` | `register_student` RPC + `submit_quiz` **v6** delta | **FOLDED INTO v6 + register_student v2 (§4G-A RESOLVED)** — advisory kept as rationale |
| 17 | `8_P0_BLOCKERS_SCHEMA_RULES_VALIDATION_2026_06_16.md` | idempotency columns, method-key + 25-Q triggers | **FOLDED INTO SCHEMA v2.7, carried into v2.8 (§4G-B RESOLVED)** — advisory kept as rationale |
| 18 | `PHASE_2_SUPABASE_APIS_EDGE_FUNCTIONS_INVENTORY_2026_06_16.md` | Phase 2 RPC/Edge/cron/admin inventory | planning; overlaps NOTIFICATION spec naming (§4G-D) |

### 1D. Audits (June 15 — reference, historical snapshot; file-status tables inside them are now outdated)
| # | File | Role | Note |
|---|---|---|---|
| 19 | `APE_STUDIO_CTO_TAKEOVER_AUDIT_2026_06_15.md` | Governance/strategy | F-1…F-13; F-1 resolved. Its "files missing/on disk" tables describe the June-15 state only. |
| 20 | `APE_STUDIO_TECHNICAL_BUG_AUDIT_2026_06_15.md` | Code/logic | 8 P0 / 11 P1 / 12 P2 / 6 forward-risk. P0s now addressed by files 15–17 (pending §4G). |

### 1E. Historical analysis (June 7 — optional reference; candidate for an `archive/` group, do NOT delete)
| # | File | Role |
|---|---|---|
| 21 | `APE_STUDIO_ASSESSMENT_AND_GLOSSARY_ANALYSIS_REPORT_2026_06_07.md` | Glossary/assessment analysis (1,459 lines) |
| 22 | `APE_STUDIO_GLOSSARY_ANALYSIS_DELIVERABLES_INDEX_2026_06_07.md` | Index of the June-7 deliverable set |
| 23 | `GLOSSARY_ENHANCEMENT_QUICK_REFERENCE_2026_06_07.md` | Glossary enhancement sprint guide (F-2 workstream) |
| 24 | `STUDY_METHODS_GLOSSARY_DATA_MATRIX_2026_06_07.md` | Glossary-column → study-method matrix |

### 1F. Data
| # | File | Role |
|---|---|---|
| GL | `APE_Glossary_v13_CLEANED_CANDIDATE.xlsx` | **SUPERSEDED (provenance only)** — the old 1,196-term *single-topic* SSoT. Replaced by the multi-topic model live on DB (see the note below §1F). Kept for history. |
| GL1b | `APE_Glossary_v13_IMPORT_READY.xlsx` | **SUPERSEDED (provenance only)** — import source for the old 1,196-term single-topic load (`glossary_import_v13.sql`). Superseded by the 2026-06-23 mega-expansion + 2026-06-25 merge. |
| GL2 | `APE_BUSINESS_SCENARIO_BANK.md` | 38 business/career scenario questions (held for Scenarios-method authoring) |
| GL3 | `APE_Glossary_Authoring_AGENT_PROMPT_2026_06_26.md` | **NEW (2026-06-26)** — Cowork agent prompt: safety-critical, **fill-empty-only** authoring of the 8 glossary content fields across the 23 in-scope topics (MUSI190 + AUDI201); 1 batch/topic; ≥2–3 authoritative sources; flag-don't-guess; structural fields off-limits. **CANDIDATE** |
| 25 | `MUSI190_Glossary_Final_Complete_1.xlsx` | Glossary **source** — 239 terms (superseded by the fully-authored file; kept as provenance) |
| 26 | `AUDI201_Glossary_Updated_1.xlsx` | Glossary **source** — 572 terms (superseded; kept as provenance) |
| 27 | `ape_50_achievements_by_course.json` | Achievement order seed (top key `program`) |

> **Glossary = 3,107 terms / 4,114 topic-assignments — LIVE on DB `yjgolswjggmlpeowvtxr` (multi-topic, per-topic difficulty; verified 2026-06-27 PM·3 after the B-PHASE (B1–B5) structural cleanup).** Current SSoT = `ape_glossary_data_snapshot_20260627.js` (assignments + per-topic difficulty; **regenerated 2026-06-27 PM·3 from live; md5 `b4afbd9e296420a47b1da639f93263ee`; 148,488 bytes; supersedes the AM `54c3…` version and `…_20260625.js` — CURRENT through the whole B-phase (B4 & B5 = related_terms-only, not stored in the snapshot)**) + `APE_Glossary_BACKUP_20260623.xlsx` (human-readable; pre-merge provenance). *(`…_20260623.js` superseded — retained only as history.)* 2,053 authored defs + **1,054 `(definition pending)`** (✅ in-scope 23 topics 100% authored; all remaining pending in the DEFERRED 6 courses). `related_terms` (after B4): **0 self-refs globally · 0 dangling on any in-scope row** (32 deferred-orphan dangling refs deferred to Spring 2027). Pre-B5 backups `_backup_glossary_pre_B5_20260627` / `_backup_glossary_topics_pre_B5_20260627` RETAINED. *(Historical: the original load was 1,196 terms single-topic via `glossary_import_v13.sql`, owner-run + idempotent; superseded by the 2026-06-23 mega-expansion → 3,031 and the 2026-06-25 combined-additions merge → 3,152.)* **Migration `add_video_to_media_type_checks` applied:** `media_type` CHECK allows 'video' on `glossary_media` + `quiz_questions`.

---

### 1G. Phase-2 build artifacts (2026-06-18 — CANDIDATE, as-applied to live DB)
| # | File | What | Status |
|---|---|---|---|
| BR | `BACKEND_BUILD_RECORD_2026_06_18.md` | Canonical record: live inventory, M1–M25 sequence, authored logic + flags, bugs fixed, full test results, open items | **Ground truth for "what's on the DB"** — read with STARTUP |
| DDL-r3 | `PHASE2_AUTHORED_DDL_CANDIDATE_2026_06_18_r3.sql` | Authored security/data/importer/seed layer (M14–M18) | as-applied |
| RPC-FINAL | `PHASE2_APPLIED_RPCS_AND_GRANTS_2026_06_18_FINAL.sql` | RPCs (`register_student`, `start_quiz_attempt`+`build_attempt_payload`, `submit_quiz`, `grade_one`, `recompute_reachability`) + execute grants + base read grants — **dumped from live DB (byte-for-byte)** | as-applied |
| MASTER-ADD | `MASTER_SPEC_ADDENDUM_2026_06_18_BACKEND.md` | Backend-logic addendum to MASTER v4.1 (authored rules + decisions) | CANDIDATE |
| GL-IMP | `glossary_import_v13.sql` (2026-06-21) | Glossary bulk import — owner-run, idempotent `ON CONFLICT(term)`; 6 chunks = 1,196 terms; mirrors `bulk_import_glossary` minus the `is_admin()` gate. | **APPLIED to live DB** — 1,196 glossary + 1,196 defs loaded; `Phase wrapping` reconciled via 1-row UPDATE; idempotent re-run safe |
| SAFE-GL | `SAFETY_GLOSSARY_PHASE3_IMPORT_2026_06_27.sql` | Safety glossary import — 153 committee-reviewed terms (staging + gate-verify + atomic load) | **APPLIED to live DB 2026-06-28** (glossary → 3,260 / 4,272; Safety topic = 70). *(upload to Project)* |
| SAFE-P4 | `SAFETY_PHASE4_ENGINE_2026_06_27.sql` | Safety Phase 4 engine wiring — `unlock_after_safety` + Design-A seed-lock + precondition-0 gate + completion hook + Safety auto-enroll + flashcard study | **DEPLOYED to live DB 2026-06-28** (migration `safety_phase4_engine_wiring_20260627`; 7/7 tested; **gate LIVE**). **Current source for the modified RPCs** (supersedes the 06-18 dump for `register_student`/`start_quiz_attempt`/`submit_quiz`). *(upload to Project)* |
| GL-AUTH | `APE_Glossary_Authoring_AGENT_PROMPT_DEFERRED3_2026_06_28.md` | Cowork glossary-authoring agent prompt for the 3 deferred courses (MUSI201+AUDI204+MUSI202): all 8 fields, committee standard, 17-topic batch list, data-access + output→review→import flow, safety flags | **CANDIDATE — overnight Cowork initiative (2026-06-28).** Standard byte-identical to `APE_Glossary_Authoring_AGENT_PROMPT_2026_06_26.md`. *(upload to Project)* |

> Schema itself was applied verbatim from `SUPABASE_SCHEMA_COMPLETE_2026_06_18_v210.md` (M1–M9); live schema is now effectively **v2.11** (glossary `purpose_function` + `practical_application`).

---

### 1H. Commercial mapping layer (Path B, SCHEMA v2.13 — 2026-07-11)
| # | File | Role | Status |
|---|---|---|---|
| 1H-1 | `PATH_B_MAPPING_LAYER_SCHEMA_2026_07_11_v1.md` | v2.13 design (DESIGN APPROVED) | **DEPLOYED (additive) 2026-07-11** — item-D held |
| 1H-2 | `V213_VERIFICATION_REPORT_2026_07_11.md` | Deploy + verification record | **current** — 4-migration prod deploy + PROD dry-run |
| 1H-3 | `SCHEMA_v213_MAPPING_LAYER_DDL_CANDIDATE.sql` | Consolidated DDL reference | applied as the 4-migration split |
| 1H-4 | `SCHEMA_v213_SEED_CANDIDATE.sql` | Seed (9 courses / 54 topics) | **APPLIED** (`v213_seed_public_courses_and_topics`) |
| 1H-5 | `SCHEMA_v213_ROLLBACK_CANDIDATE.sql` | Single-step rollback | staged (not run) |
| 1H-6 | `SCHEMA_v213_VERIFICATION_HARNESS.sql` | H1–H10 post-apply checks | used for prod verification |
| 1H-7 | `SCHEMA_v213_ITEMD_close_common_mistakes_CANDIDATE.sql` | item-D common_mistakes gate | **HELD** — deploy with client release |
| 1H-8 | `START_QUIZ_ATTEMPT_v3_CANDIDATE_2026_07_11.md` | v3 audience-scoped RPC spec | **CANDIDATE — blocked** on §4L |
| — | Applied migrations | `v213_core_ddl_mapping_layer` · `v213_anon_catalog_grants_and_glossary_view` · `v213_seed_public_courses_and_topics` · `v213_advisor_cleanup_defer_glossary_view` | live |

## 2. RETIRE — DO NOT UPLOAD / DELETE FROM PROJECT

**v31 retirements (2026-06-28 — Safety feature + folder cleanup; most already removed by Booth):**
- **Already removed from Project (2026-06-28):** `8_P0_BLOCKERS_HARDENED_RPCS_2026_06_16.md`, `8_P0_BLOCKERS_SCHEMA_RULES_VALIDATION_2026_06_16.md`, `8_P0_BLOCKERS_SESSION_COMPLETE_2026_06_16.md`, `BACKEND_BUILD_PLAN_2026_06_18.md`, `GLOSSARY_NEW_CHAT_HANDOFF_2026_06_27.md`, `Supabase_Snippet_Untitled_query.csv`, `Supabase_Snippet_Untitled_query_1.csv` (7 retired) + `APE_Glossary_v13_CLEANED_CANDIDATE.xlsx`, `APE_Glossary_v13_IMPORT_READY.xlsx`, `MUSI190_Glossary_Final_Complete_1.xlsx`, `AUDI201_Glossary_Updated_1.xlsx`, `APE_STUDIO_GLOSSARY_ANALYSIS_DELIVERABLES_INDEX_2026_06_07.md`, `GLOSSARY_ENHANCEMENT_QUICK_REFERENCE_2026_06_07.md` (6 superseded glossary-provenance). Their §1C/§1E/§1F rows are struck (see the §1 RETIRED note).
- **Still to remove:** `SESSION_HANDOFF_STEP0_BUILD_2026_06_18.md` (retired per STARTUP §42; one leftover).
- `PROJECT_FILE_INDEX_2026_06_27_v30.md` (→ **v31**, this file) · `PROJECT_STATE_CURRENT_2026_06_27_v44_r28.md` (→ **r29**) · `PROGRESS_TRACKER_2026_06_27_r27.md` (→ **r28**) · `DEVELOPER_QUICKSTART_2026_06_21_v21.md` (→ **v22**, `DEVELOPER_QUICKSTART_2026_06_28_v22.md`).
- `ape_glossary_data_snapshot_20260627.js` **pre-Safety version (md5 `b4afbd9e…`)** → replaced by the **same-named** Safety-inclusive regen (file md5 `4c68a8fa…`); overwrite-on-upload **DONE 2026-06-28**.
- *(`STARTUP_HERE.md` perpetual — overwrite in place.)*

**v30 retirements (2026-06-27 PM·3 — B-PHASE COMPLETE checkpoint bump; delete once the new set is uploaded):**
- `PROJECT_FILE_INDEX_2026_06_27_v29.md` (→ **v30**, this file)
- `PROJECT_STATE_CURRENT_2026_06_27_v44_r27.md` (→ **r28**)
- `PROGRESS_TRACKER_2026_06_27_r26.md` (→ **r27**)
- `ape_glossary_data_snapshot_20260627.js` **(AM version, md5 `54c303dc…`)** → replaced by the **same-named** regenerated file (md5 `b4afbd9e296420a47b1da639f93263ee`); overwrite on upload.
- *(`STARTUP_HERE.md` is perpetual — overwrite in place; do NOT keep a dated copy.)*
- *(No spec or data-model files retired this pass. `GLOSSARY_B4_B5_STARTUP_2026_06_27.md` is KEPT as provenance (B4/B5 now done). Pre-B5 backup tables `_backup_glossary_pre_B5_20260627` / `_backup_glossary_topics_pre_B5_20260627` RETAINED in-DB pending Booth's drop go-ahead.)*

**v29 retirements (2026-06-27 PM — B1–B3 glossary-cleanup checkpoint bump; delete once the new set is uploaded):**
- `PROJECT_FILE_INDEX_2026_06_27_v28.md` (→ **v29**)
- `PROJECT_STATE_CURRENT_2026_06_27_v44_r26.md` (→ **r27**)
- `PROGRESS_TRACKER_2026_06_27_r25.md` (→ **r26**)
- *(`STARTUP_HERE.md` is perpetual — overwrite in place; do NOT keep a dated copy.)*
- *(No spec or data files retired this pass. NEW files ADDED — not retirements: `GLOSSARY_B4_B5_STARTUP_2026_06_27.md`, `GLOSSARY_REVIEW_KNOWN_EDITS_LEDGER_2026_06_27.md`.)*
- *(Housekeeping note: the intermediate v26 / v27 / v28 INDEX/STATE/TRACKER generations were already removed from the project in prior sessions — their explicit retire lines were not separately recorded here, but the folder is already clean of them.)*

**v25 retirements (2026-06-26 PM — session-decisions checkpoint bump; delete once the new set is uploaded):**
- `PROJECT_FILE_INDEX_2026_06_26_v25.md` (→ **v26**, this file)
- `PROJECT_STATE_CURRENT_2026_06_26_v44_r23.md` (→ **r24**)
- `PROGRESS_TRACKER_2026_06_26_r22.md` (→ **r23**)
- *(`STARTUP_HERE.md` is perpetual — overwrite in place; do NOT keep a dated copy.)*

**v24 retirements (2026-06-26 — doc reconciliation bump; delete once the new set is uploaded):**
- `PROJECT_FILE_INDEX_2026_06_25_v24.md` (→ **v25**, this file)
- `PROJECT_STATE_CURRENT_2026_06_25_v44_r22.md` (→ **r23**)
- `PROGRESS_TRACKER_2026_06_25_r21.md` (→ **r22**)
- *(`STARTUP_HERE.md` is perpetual — overwrite in place; do NOT keep a dated copy.)*

**v23 retirements (2026-06-25 — doc-tidy bump) [already retired]:**
- `PROJECT_FILE_INDEX_2026_06_25_v23.md` (→ **v24** → v25) — delete once v24 was uploaded.

**v22 retirements (2026-06-23 PM·2) — coordinated checkpoint bump; delete once the new set is uploaded:**
- `PROJECT_FILE_INDEX_2026_06_23_v21.md` (→ **v22**, this file)
- `PROJECT_STATE_CURRENT_2026_06_23_v44_r20.md` (→ **r21**)
- `PROGRESS_TRACKER_2026_06_23_r19.md` (→ **r20**)
- *(`STARTUP_HERE.md` is perpetual — overwrite in place, do NOT keep a dated copy.)*
- *(Any dated INDEX/STATE/TRACKER copies left from the v19/v20/v21 bumps are likewise superseded by their successors.)*

**v18 retirements (2026-06-21 PM·4) — study-UX promoted to LOCKED:**
- `PROJECT_FILE_INDEX_2026_06_21_v17.md` (→ **v18**), `PROJECT_STATE_CURRENT_2026_06_21_v43_r16.md` (→ **r17**), `PROGRESS_TRACKER_2026_06_21_r15.md` (→ **r16**), `IMPLEMENTATION_SPEC_2026_06_17_v2_r5.md` (→ **v2-r6**). Overwritten same-name: `APE_DASHBOARD_SPEC_2026_06_17.md` (→ v1.1), `STUDY_UX_DECISIONS_2026_06_21.md` (→ LOCKED), `STARTUP_HERE.md` (refreshed). No data files retired.

**v17 retirements (2026-06-21 PM·3) — study-UX decisions captured:**
- `PROJECT_FILE_INDEX_2026_06_21_v16.md` (→ **v17**), `PROJECT_STATE_CURRENT_2026_06_21_v43_r15.md` (→ **r16**), `PROGRESS_TRACKER_2026_06_21_r14.md` (→ **r15**), old `STARTUP_HERE.md` (→ refreshed). New file added: `STUDY_UX_DECISIONS_2026_06_21.md` (CANDIDATE). No data files retired.

**v16 retirements (2026-06-21 PM·2) — glossary imported + 'video' migration applied:**
- `PROJECT_FILE_INDEX_2026_06_21_v15.md` (→ **v16**), `PROJECT_STATE_CURRENT_2026_06_21_v43_r14.md` (→ **r15**), `PROGRESS_TRACKER_2026_06_21_r13.md` (→ **r14**), old `STARTUP_HERE.md` (→ refreshed). `BACKEND_BUILD_RECORD_2026_06_18.md` re-uploaded with a post-build update note. No data files retired.

**v15 retirements (2026-06-21 PM) — glossary import-prep doc bump:**
- `PROJECT_FILE_INDEX_2026_06_21_v14.md` (→ **v15**), `PROJECT_STATE_CURRENT_2026_06_21_v43_r13.md` (→ **r14**), `PROGRESS_TRACKER_2026_06_21_r12.md` (→ **r13**), old `STARTUP_HERE.md` (→ refreshed). No data/spec files retired this pass (additive: 2 glossary artifacts recorded).

**v13 retirements (2026-06-20) — glossary-complete doc bump + folder cleanup:**
- `PROJECT_FILE_INDEX_2026_06_19_v12.md` (→ **v13**), `PROJECT_STATE_CURRENT_2026_06_19_v42_r11.md` (→ **r12**), `PROGRESS_TRACKER_2026_06_19_r10.md` (→ **r11**), `DEVELOPER_QUICKSTART_2026_06_18_v19.md` (→ **v20**), old `STARTUP_HERE.md` (→ refreshed).
- **Advisory now retired** (folded into the built+tested+deployed backend): `8_P0_BLOCKERS_SESSION_COMPLETE_2026_06_16.md`, `8_P0_BLOCKERS_HARDENED_RPCS_2026_06_16.md`, `8_P0_BLOCKERS_SCHEMA_RULES_VALIDATION_2026_06_16.md`.
- **Superseded build/handoff:** `BACKEND_BUILD_PLAN_2026_06_18.md` (→ as-built `BACKEND_BUILD_RECORD`), `SESSION_HANDOFF_STEP0_BUILD_2026_06_18.md` (→ BUILD RECORD).
- **Superseded June-7 glossary docs** (glossary now complete): `GLOSSARY_ENHANCEMENT_QUICK_REFERENCE_2026_06_07.md`, `APE_STUDIO_GLOSSARY_ANALYSIS_DELIVERABLES_INDEX_2026_06_07.md`.
- *Optional (your call — keep as provenance/snapshot or archive):* source glossary xlsx (`MUSI190_*`, `AUDI201_*`), June-15 audits, `STUDY_METHODS_GLOSSARY_DATA_MATRIX_2026_06_07.md`.

**v12 retirements (2026-06-19) — superseded by the flags+WM deploy set:**
- `SUBMIT_QUIZ_RPC_CONTRACT_2026_06_18_v8.md` (→ **v8.1**, full contract). *Was accidentally deleted; v8.1 restores it — do not re-upload v8.*
- `SUBMIT_QUIZ_v8_1_ADDENDUM_2026_06_19.md` (→ **folded into v8.1**; retire if uploaded).
- `PROJECT_STATE_CURRENT_2026_06_18_v42_r10.md` (→ **r11**) — already deleted ✓
- `PROGRESS_TRACKER_2026_06_18_r9.md` (→ **r10**) — already deleted ✓
- `PROJECT_FILE_INDEX_2026_06_18_v11.md` (→ **v12**).
- *Never upload:* `F1_PERFORMANCE_METRICS_CANDIDATE_2026_06_19.sql`, `WM_CLIENT_WRITE_GRANTS_CANDIDATE_2026_06_19.sql` (drafts — superseded by `PHASE2_APPLIED_2026_06_19_FLAGS_WM.sql`).

**v10 retirements — superseded by the serve-set / v2.10 set; delete once the new set is uploaded:**
- `SUPABASE_SCHEMA_COMPLETE_2026_06_17_v29.md` (→ v2.10 = `...v210`)
- `SUBMIT_QUIZ_RPC_CONTRACT_2026_06_17_v7.md` (→ v8)
- `PROJECT_FILE_INDEX_2026_06_17_v9.md` (→ v10)
- *Not retired (unchanged): `REGISTER_STUDENT_RPC_CONTRACT_2026_06_17_v2.md`, `IMPLEMENTATION_SPEC_2026_06_17_v2_r5.md`, `APE_DASHBOARD_SPEC_2026_06_17.md`, `PHASE_2_PLANNING_DECISIONS_2026_06_17.md`.*
- *Deferred (retire at post-build checkpoint when their bumps land): `MASTER_SPEC_CONSOLIDATED_2026_06_17_v41.md` (→ v4.2), `PROJECT_STATE_CURRENT_2026_06_17_v41_r9.md` (→ r10), `PROGRESS_TRACKER_2026_06_17_r8.md` (→ r9), `DEVELOPER_QUICKSTART_2026_06_17_v18.md` (→ v1.9).*
- *Optional: the `_PENDING_APPROVAL` review copies (delta + RPC drafts) — keep the delta for rationale; the PENDING RPC drafts are superseded by the clean LOCKED files.*

**v6 retirements — the previous baseline (June 16/17) is superseded by the 2026-06-17 set; delete the prior-baseline files below once the new set is uploaded. The folder was already clean of pre-v6 retired versions.**

**v9 retirements — superseded by the dashboard / v2.9 set; delete once the new set is uploaded:**
- `MASTER_SPEC_CONSOLIDATED_2026_06_17_v40.md` (→ v4.1)
- `SUPABASE_SCHEMA_COMPLETE_2026_06_17_v28.md` (→ v2.9)
- `PROJECT_FILE_INDEX_2026_06_17_v8.md` (→ v9)
- `PROJECT_STATE_CURRENT_2026_06_17_v40_r8.md` (→ v41_r9)
- `PROGRESS_TRACKER_2026_06_17_r7.md` (→ r8)
- `DEVELOPER_QUICKSTART_2026_06_17_v17.md` (→ v1.8)
- **`admin_dashboard_requirements.json`** — **RETIRED** (informational only; superseded by `APE_DASHBOARD_SPEC_2026_06_17.md`). Per the agreed lifecycle, remove it from the project now that the Dashboard Spec exists.
- *Unchanged (NOT retired): `SUBMIT_QUIZ_RPC_CONTRACT_2026_06_17_v7.md`, `REGISTER_STUDENT_RPC_CONTRACT_2026_06_17_v2.md`, `IMPLEMENTATION_SPEC_2026_06_17_v2_r5.md`.*

**v8 retirements — the v7-generation baseline (2026-06-17, pre-PM) is superseded by the Phase-2 v2.8 set; delete the files below once the new set is uploaded:**
- `MASTER_SPEC_CONSOLIDATED_2026_06_17_v39.md` (→ v4.0)
- `SUPABASE_SCHEMA_COMPLETE_2026_06_17_v27.md` (→ v2.8)
- `SUBMIT_QUIZ_RPC_CONTRACT_2026_06_17_v6.md` (→ v7)
- `IMPLEMENTATION_SPEC_2026_06_17_v2_r4.md` (→ v2-r5)
- `PROJECT_FILE_INDEX_2026_06_17_v7.md` (→ v8)
- `PROJECT_STATE_CURRENT_2026_06_17_v39_r7.md` (→ v40_r8)
- `PROGRESS_TRACKER_2026_06_17_r6.md` (→ r7)
- `DEVELOPER_QUICKSTART_2026_06_17_v16.md` (→ v17)
- `REGISTER_STUDENT_RPC_CONTRACT_2026_06_17_v2.md` — **NOT retired; stays v2** (Phase-2 deltas do not touch registration).

**Prior 2026-06-17 baseline (v6 generation) — delete once the v7 set is uploaded:**
- `MASTER_SPEC_CONSOLIDATED_2026_06_17_v38.md` (→ v3.9)
- `SUPABASE_SCHEMA_COMPLETE_2026_06_17_v26.md` (→ v2.7)
- `SUBMIT_QUIZ_RPC_CONTRACT_2026_06_17_v5.md` (→ v6)
- `IMPLEMENTATION_SPEC_2026_06_17_v2_r3.md` (→ v2-r4)
- `PROJECT_FILE_INDEX_2026_06_17_v6.md` (→ v7)
- `PROJECT_STATE_CURRENT_2026_06_17_v38_r6.md` (→ v39_r7)
- `PROGRESS_TRACKER_2026_06_17_r5.md` (→ r6)
- `DEVELOPER_QUICKSTART_2026_06_17_v15.md` (→ v16)
- `SCREEN_13_SCENARIOS_2026_06_16_v11_PENDING_APPROVAL.md` — **DISCARD (do not upload)**; folded into IMPL §7 (same as the Screen 12 standalone).
- `REGISTER_STUDENT_RPC_CONTRACT_2026_06_17_v2.md` — **NOT retired; stays v2** (S13-A does not touch registration).

**Earlier retires (historical):**
- `MASTER_SPEC_CONSOLIDATED_2026_06_16_v37.md` (→ v3.8)
- `SUPABASE_SCHEMA_COMPLETE_2026_06_17_v25.md` (→ v2.6)
- `SUBMIT_QUIZ_RPC_CONTRACT_2026_06_17_v4.md` (→ v5)
- `REGISTER_STUDENT_RPC_CONTRACT_2026_06_17_v1.md` (→ v2)
- `PROJECT_FILE_INDEX_2026_06_16_v5.md` (→ v6)
- `PROJECT_STATE_CURRENT_2026_06_16_v37_r5.md` (→ r6)
- `PROGRESS_TRACKER_2026_06_16_r4.md` (→ r5)
- `DEVELOPER_QUICKSTART_2026_06_16_v14.md` (→ v1.5)
- `IMPLEMENTATION_SPEC_2026_06_16_v2_r2.md` (→ v2-r3)

Older superseded files (retire if still present):

**Replaced by this reconciliation (delete once the new set is uploaded):**
- `PROJECT_FILE_INDEX_2026_06_16_v4.md` (→ this v5)
- `PROJECT_STATE_CURRENT_2026_06_16_v37_r4.md` (→ r5 — produced)
- `PROGRESS_TRACKER_2026_06_16_r3.md` (→ r4 — produced)
- `IMPLEMENTATION_SPEC_2026_06_16_v2.md` (→ v2-r2 — produced)
- `SCREEN_12_MEDIA_EAR_TRAINING_LOCKED_2026_06_16.md` (**folded into IMPL v2-r2 §7** — retire the standalone; nothing lost)
- `SUPABASE_SCHEMA_COMPLETE_2026_06_16_v24.md` (→ **v2.6** — superseded; retire once v2.6 uploaded)
- `SUBMIT_QUIZ_RPC_CONTRACT_2026_06_16_v3.md` (→ **v5** — superseded; retire once v5 uploaded)

**Phantoms — never upload:** any `MASTER_SPEC_CONSOLIDATED_2026_06_16_v36.md`. (NOTE: the current canonical schema is **v2.9** — `SUPABASE_SCHEMA_COMPLETE_2026_06_17_v29.md` (dashboard deltas; CANDIDATE); the old 'v2.5' was a phantom.)

---

## 3. ALIGNMENT STATE — what is consistent across the locked specs
- **Progression:** raw counts on 25-q quiz — 24–25 = full pass (trophy + privilege + COMPLETE + next unrestricted); 20–23 = partial pass (next CLAMPED, `passed_incomplete`, no trophy); ≤19 = no pass. Consistent across MASTER_SPEC v4.0 / SCHEMA v2.8 / RPC v7 / STATE / TRACKER / QUICKSTART / IMPL.
- **Clamp = Interpretation A, CONTIGUOUS** (RPC v7 reachability walk; MASTER_SPEC v4.0 C1 wording).
- **Study gate:** 3 conditions per applicable method — completion (done twice; **Scenarios single-pass = once**, S13-A) + min active time (Ear Training 5 min, rest 10) + ≥80% accuracy (Flashcards exempt). RPC v7 step 6; config on `study_methods` (`required_passes`/`min_engagement_seconds`/`accuracy_threshold`, v2.8).
- **Quiz integrity:** 10-min force-fail timer; 1st app-switch warning / 2nd voids + 15-min lockout (2 s grace); fields on `quiz_attempts`; `lockout_until` on progress.
- **Questions:** 5-value `question_type` taxonomy + `correct_answers` JSONB; topic cannot open without exactly 25 questions.
- **Enrollment-gated (OPEN-3):** enrollment unlocks a course's first topic only; clamp per-course; no cross-course auto-unlock. Requires first-topic seeding (B-2 — now addressed by `register_student`).
- **UI:** **20 of 20 MVP screens** now locked (16 base + 2 media + Screen 12 + Screen 13). **UI phase complete** → Phase 2 backend next.

---

## 4. CONSOLIDATED FINDINGS & OPEN-ITEMS REGISTER

### 4L. 2026-07-11 — SCHEMA v2.13 commercial mapping layer (open items)
- **item-D common_mistakes gate — HELD:** deploy `SCHEMA_v213_ITEMD_close_common_mistakes_CANDIDATE.sql` ONLY with the client release that switches common_mistakes reads to `public.glossary_full_v` (institutional 403s otherwise). Masking view trips `security_definer_view` lint by design → decide accept vs. definer-RPC.
- **start_quiz_attempt v3 — DECISION NEEDED:** commercial progression seeding + clamp over `public_course_topics.seq` (spec §4). Optional `p_public_course_id` param ruled 2026-07-11.
- **RevenueCat (D3-a) — Booth action:** create account + App Store Connect monthly/annual products → then author edge-function entitlements receiver (Phase 3).
- **public_courses.description** — Booth-authored (W7); seeded NULL.
- **Favorites migration destination:** no server favorites table; `register_commercial_user` accepts `p_favorites` but does not persist → decide table vs. device-local.
- **gs36 "DAW Skills" `is_active=false`:** free topic browsable but not completable until content activates.

### 4K. 2026-06-26 (PM) — decisions & ADV-1 hardening
- **Quiz-draw rule — LOCKED; SUPERSEDES §4G-D(2) + the pool-and-draw proposal (both VOID).** 25 Q/quiz; **≥18 from intermediate+advanced** (≤7 beginner; floor, may be more by chance); difficulty **inherited** from each graded question's linked glossary term — NEW `quiz_questions.glossary_id` FK → `glossary_topics.difficulty` for the question's `achievement_id`. **Activation = ≥25 approved graded; ≥18 I+A is best-effort with RELAX.** Draw = min(18,|I+A|) from I+A then fill to 25. **Rotation:** ≤50% overlap with the previous attempt when the pool allows (≳38). submit_quiz unchanged. **DECIDED — CANDIDATE specs NOT authored:** pending go-ahead for SCHEMA **v2.12** (+`quiz_questions.glossary_id` + activation trigger), `start_quiz_attempt` **v2**, MASTER **v4.4**. Author-time assumptions: exactly 1 term/graded Q; `glossary_id` required for graded rows only; the term must already be assigned to the topic; per-topic difficulty non-null (all 4,176 are).
- **Flashcard difficulty banner — FULLY DECIDED (specs pending).** Progressive = adaptive + ADDITIVE, default-on: Beginner first; once every current-level card is seen ≥2×, the next level's terms are ADDED (B→+I→+A; never hides lower). Lit B/I/A buttons = live read-out of included levels. Progressive off → manual show/hide filter. **≥1 level always lit** (no null deck). Integrity: hiding only hides from view — every card still required for the study-gate.
- **Fall-2026 scope — SET.** Launch = **MUSI 190 + AUDI 201 only** (23/50 topics); the other 6 → Spring 2027 (no per-course content work now). In-scope gaps (live DB): **780 definitions + 914 deeper enrichment fields**; **0 graded questions** (≥25/topic × 23 ≈ ≥575). Engine/specs stay course-agnostic. (Reframes the launch blockers to the 23-topic subset.)
- **Security — ADV-1 FULLY RESOLVED + verified (live DB).** REVOKE EXECUTE on `bulk_import_glossary` / `bulk_import_questions` / `validate_glossary` / `validate_questions` / `get_program_kpis` from `authenticated`+`anon` (postgres/service_role retains) — migration `adv1_revoke_admin_import_fns_from_authenticated_20260626`; + Leaked-Password Protection enabled (Booth, Dashboard). Advisors **16 → 10**; remaining are by-design (is_admin / is_ta_or_admin / is_instructor_for_user RLS helpers + register_student / start_quiz_attempt / submit_quiz / lookup_student_by_qr student RPCs). **Closes the ADV-1 deferred items.**
- **Admin surface — SCOPED.** Sole admin (Booth) for Fall → no in-app admin dashboard needed; operate via Supabase Studio + import tools. Full in-app admin DEFERRED (post-Fall/scale); ask refining questions when built.
- **New artifact (§1G):** `APE_Glossary_Authoring_AGENT_PROMPT_2026_06_26.md` — Cowork prompt for safety-critical, fill-empty-only authoring of the 8 glossary content fields across the 23 in-scope topics (1 batch/topic; ≥2–3 authoritative sources; flag-don't-guess; structural fields off-limits).

### 4J. 2026-06-21 PM·5 reconciliation pass — ✅ RESOLVED / CLOSED
Audit-driven. **Doc reconciliations → CANDIDATE specs (await upload):**
- **F-5** (NOTIFICATION v1.1) — enum `earned`→`complete`; genuine-only (practice/void) guards; edge-fn naming `on-<event>` / trigger-fn `notify_<event>()` (closes §4G-D-1 naming); `full_name`→`nickname`. ✅
- **F-6** (IMPL v2-r7 + MASTER v4.2 + STATE r18) — dead notification toggles ("Study/Due-date reminders", "Course announcements") removed; replaced with real events. ✅
- **F-7** (IMPL v2-r7 + MASTER v4.2) — 100%-LED keeps positional gradient (green→yellow→orange→red), NOT recolored to uniform red; **prose reconciled to the existing render code** (`SEGMENT_COLORS` was already correct). Ruled by Prof. Booth. ✅
- **F-12** (AUTH_FLOW v1.1) — Profile/onboarding/welcome → `nickname` (PUBLIC); `full_name` retired. ✅
- **F-13** (IMPL v2-r7) — single canonical offline-quiz statement aligned to `start_quiz_attempt v1` + `submit_quiz v8.1` (`p_submitted_at`/`p_submitted_offline`). ✅

**§4G-E** — ✅ DONE: TWO_THRESHOLD §3/§4.3/§4.6 nuggets folded into **MASTER v4.2 §1A**; `TWO_THRESHOLD_SPEC_RECONCILED_v3_5` may now retire (move to §2).

**Closed by verification (were stale-open in §4G/memory):**
- **F-DEMOTE** — SCHEMA annotation present + `submit_quiz v8.1` uses `best_genuine_score` (no-demote). ✅ (durable guardrail: never implement the schema status-derivation pseudocode verbatim.)
- **F-OFFLINETIMER** — `submit_quiz v8.1` already uses client `p_submitted_at` for the timer. ✅
- **F-GATEBYPASS** — deployed gate (`start_quiz_attempt`) is requirement-driven and **fail-closes on a missing `student_method_progress` row** (`smp.id IS NULL` = fail). Residual (empty `applicable_methods` → vacuous pass) CLOSED by the activation guard below. ✅

**Live-DB hardening APPLIED + verified (advisors: only pre-existing WARNs):**
- **ADV-1** — ✅ DONE: `REVOKE TRUNCATE, TRIGGER, REFERENCES` from `authenticated` on all 23 base tables (SELECT + scoped INSERT/UPDATE intact).
- **applicable_methods activation guard** — ✅ DONE: `validate_quiz_question_count()` now blocks `is_active=true` when `applicable_methods` is empty (the ≥25-question check preserved).

### 4I. Study-UX decisions (2026-06-21) — ✅ LOCKED & integrated
Full record: `STUDY_UX_DECISIONS_2026_06_21.md` (now **LOCKED**). **Integrated:** flashcard 5-level reveal → `IMPLEMENTATION_SPEC` **v2-r6** (Screen 2; L/R-navigate + U/D-reveal replaces diagonal swipe); definition-rotation rule removed → `APE_DASHBOARD_SPEC` **v1.1**; `.gif`=`image` media note added. **Still open (build, not spec):** `.gif` upload-validation + renderer; flashcard component implementation. Backend + live DB unchanged.
- **Flashcard 5-level reveal** (Screen 2) — integrate into `IMPLEMENTATION_SPEC` §3 / Flashcards section at promote-to-LOCK. Gestures: tap advances 1/5→5/5 (loops); swipe↓=term; L/R=card nav (unchanged). Fields per level: 1/5 `definition` · 2/5 `plain_english` · 3/5 `purpose_function`+`practical_application` · 4/5 `scenario_contexts` · 5/5 `common_mistakes`+`related_terms`+`category`+`difficulty`.
- **`.gif` = `'image'`** — no new `media_type` value, no migration. Build backlog: admin upload-validation must allow `.gif`; renderer animates GIF as image. Applies to `quiz_questions` + `glossary_media`.
- **Split-term disambiguation** — one meaning per term; two meanings → two distinct terms with a parenthetical qualifier (`Compression (dynamics)` / `Compression (data)`). `glossary_definitions` stays permanently 1:1. Multi-def in-card switcher **dropped**.
- **Definition-rotation rule REMOVED** — delete the `APE_DASHBOARD_SPEC:78` rotation/​distractor-reuse rule at integration (moot under one-meaning-per-term); retain `is_primary` as the single-definition marker.
- **5/5 sibling-conflict note** — authoring convention: when splitting a term, add a `common_mistakes` entry naming/contrasting the sibling. No schema/UI change. (Structured sibling-link field **declined**.)
- **Web↔mobile switching** — reviewed; already specified (PLANNING A1 / MASTER / UX Q10). No change.

### 4A. Resolved (unchanged)
- F-1 (canonical specs absent) — RESOLVED June 15.
- D1, D2 — RATIFIED June 16; RPC contract LOCKED.
- C1 / C2 — APPLIED (MASTER_SPEC v4.0 / SCHEMA v2.8 / RPC v7).
- OPEN-1 / OPEN-2 / OPEN-3 — RESOLVED.

### 4B. P0 backend blockers — RESOLVED AT DESIGN LEVEL (files 15–17), pending fold-in (§4G)
- **B-1** registration under RLS → `register_student` SECURITY DEFINER RPC. ✅ designed
- **B-2** first-topic dead-end → seeded `unlocked` in `register_student`. ✅ designed
- **B-3** method-key mismatch → 5 canonical keys + `trig_validate_applicable_methods`. ✅ designed
- **B-4** no 25-Q guard → hard-fail in RPC + activation trigger + pre-delivery query. ✅ designed
- **B-5** concurrent-submission race → `FOR UPDATE` lock. ✅ designed
- **B-6** idempotency → `client_attempt_id` + `result_payload`. ✅ designed
- **B-7** version mismatch → early version check. ✅ designed
- **B-8** client/server gate divergence → server gate strictly from `applicable_methods`. ✅ designed
> These live in advisory files, NOT in the locked RPC/SCHEMA. They are not "shipped" until §4G is resolved and folded in.

### 4G. NEW CONFLICTS opened by the P0 package — DECISIONS NEEDED
- **§4G-A `submit_quiz` v3 vs v4 — ✅ RESOLVED (D-1, June 17).** Reconciled to a single **v4** (`SUBMIT_QUIZ_RPC_CONTRACT_2026_06_17_v5.md`): v3's complete grader/walk/integrity + the hardening done correctly (B-5 advisory lock, B-6 `p_client_attempt_id` idempotency with post-lock re-check, B-7 version check, B-8/D-3 coverage gate, D-4 `p_submitted_at` timer). The abbreviated advisory v4 was NOT used as a drop-in. LOCKED.
- **§4G-B Schema additions — ✅ RESOLVED (D-7/D-1, June 17).** Folded into the deliberate **v2.6** bump (formerly v2.5) (`SUPABASE_SCHEMA_COMPLETE_2026_06_17_v26.md`): `client_attempt_id`, `result_payload`, `is_active`, the method-key + 25-Q triggers (now INSERT+UPDATE), the `seed_first_topic_on_enrollment` trigger, FERPA identity, per-student registration code, and indexes. LOCKED.
- **§4G-C Screen 12 "Options C & E" — ✅ RESOLVED (D-8, June 17).** The locked Screen 12 (IMPL §7) implements media-as-question with `mc` + `multi_select` answer grids. Prof. Booth confirmed this design is final; the earlier "Options C & E" (C: Analyze Media / E: Identify Properties, recovered from the June-12 session) and the once-mentioned "media-as-answer" state are superseded/orphaned. Stale wording purged from the current files (MASTER, QUICKSTART, STATE, TRACKER, STARTUP, this index); the June-15 historical audit left as a snapshot.
- **§4G-D Phase 2 inventory inconsistencies.** (1) Edge-Function names differ from NOTIFICATION spec (`notify_on_badge_earned` vs `on-badge-earned`) — **still open (LOW)**; pick one naming convention at Edge-Function build. (2) The "randomly sample 25 from a pool (may repeat if pool < 25)" question model — **⚠️ SUPERSEDED 2026-06-26 by the §4K quiz-draw rule (serve-set model now VOID).** *(Was: ✅ RESOLVED (Q3, 2026-06-18) — serve-set / pool model: pool ≥25 approved → sample exactly 25; <25 cannot activate; encoded in SCHEMA v2.10 `quiz_attempt_items` + trigger, `start_quiz_attempt v1`, submit_quiz v8. Those specs are now KNOWN-DIVERGENT pending the §4K rewrite.)*
- **§4G-E TWO_THRESHOLD fold-in (MEDIUM — HELD).** Verification (this reconciliation) found `TWO_THRESHOLD_SPEC_RECONCILED_v3_5` is **not fully redundant**: unique value = the clamp worked-example (§3), the "schema pseudocode demotes on low retake — don't copy verbatim" gotcha (§4.3 note), and the double-partial rule (§4.6); its MASTER v3.5 / SCHEMA v2.3 line-citations are also stale. Folding it into MASTER_SPEC would edit the single source of truth + force a version bump with downstream pointer ripple (the baseline already moved MASTER to v3.8 for synchronization, not for this fold). **Held for Prof. Booth's approval.** Recommended path: migrate those three nuggets into MASTER_SPEC §1 as a short addition → bump MASTER accordingly → then retire TWO_THRESHOLD. Until approved, TWO_THRESHOLD stays canonical (1B #12).

### 4G-F. Scenarios completion model — ✅ RESOLVED (S13-A, June 17)
The Screen 13 spec flagged a conflict: the global study-gate says items must be "done twice," but Scenarios is single-pass. **Resolved** by per-method `study_methods.required_passes` (Scenarios = 1, all others = 2): a scenario is "done" after **one** answer; the 80%-accuracy + 10-min-time gates are unchanged; the gate SQL (`completion_pct < 100`) is unchanged. Folded into SCHEMA v2.7 / MASTER v3.9 / `submit_quiz` v6 (now carried into v2.8 / v4.0 / v7). LOCKED.

### 4H. Stale status docs — REFRESHED (this reconciliation)
- **PROJECT_STATE → r7** and **PROGRESS_TRACKER → r6** — ✅ status current (20 screens, UI phase complete, S13-A single-pass) AND their duplicated canonical/retire tables removed (Tier-3 → INDEX is sole owner).
- **IMPLEMENTATION_SPEC → v2-r2** — ✅ Screen 12 section now LOCKED (folded in).
- **DEVELOPER_QUICKSTART → v1.6** — ✅ stale lines fixed (Screen 13 is done; `register_student` is a Phase-2 deploy step, not a UI to-do).

### 4F. Doc-tidy findings (low effort, carried forward)
- **F-2** glossary enhancement sprint not executed → blocks Fill-in-Blank/Matching/Scenarios + smart distractors.
- **F-5** NOTIFICATION spec uses stale `earned` enum, implies Edge-Function grants, must skip `voided` → reconcile to `complete` + notify-only.
- **F-6** vestigial Settings toggles ("Due date reminders", "Course announcements") have no backing events.
- **F-7** one-line 100%-LED-color clarification (recolor all-red vs keep gradient).
- **F-12** Profile identity drift — AUTH_FLOW says "Full name — safe to display"; current model is nickname-public / names-private.
- **F-13** offline-quiz behavior described inconsistently across docs.

---

## 5. TASK LIST

### A. MAKE THIS RECONCILIATION PERMANENT
- [ ] **A1.** Upload `PROJECT_FILE_INDEX_2026_06_17_v6.md` + refreshed `STARTUP_HERE.md`; delete index v4.
- [x] **A2.** ✅ Produced `PROJECT_STATE ...r5.md` + `PROGRESS_TRACKER ...r4.md` (§4H) with Tier-3 dedup. **Upload them; delete r4/r3.** Also upload `IMPLEMENTATION_SPEC ...v2_r3.md`; delete v2 and the standalone Screen 12 file.
- [ ] **A3.** (Optional) Group files 19–24 under an `archive/` prefix for discoverability — do not delete.

### B. RESOLVE THE TWO SPEC CONFLICTS (decisions — §4G)
- [x] **B1.** ✅ DONE (D-1) — reconciled `submit_quiz` **v4** + standalone `register_student` **v1** produced (§4G-A). LOCKED.
- [x] **B2.** ✅ DONE (D-7/D-1) — schema bumped to **v2.6**; P0 columns/triggers folded in (§4G-B). LOCKED.
- [x] **B3.** Confirm Screen 12 satisfies "Options C & E" (§4G-C). ✅ RESOLVED (D-8): design is final; stale wording purged.
- [x] **B4.** Old pool/serve-set model **SUPERSEDED 2026-06-26** by the §4K quiz-draw rule (serve-set void). **NEW task → §F2:** author CANDIDATE SCHEMA v2.12 + `start_quiz_attempt v2` + MASTER v4.4 (pending Booth go-ahead). §4G-D(1) Edge-Function naming still open (LOW).

### C. NEXT BUILD (Path B)
- [x] **C1.** ✅ Screen 13 — Scenarios LOCKED (June 17; single-pass / S13-A; folded into IMPL §7). **UI phase complete (20/20).**

- [x] **C2.** ✅ **SCHEMA v2.13 commercial mapping layer DEPLOYED to prod 2026-07-11** (additive; 4 migrations; verified; item-D held). Files §1H.
- [ ] **C3.** Deploy HELD item-D (`SCHEMA_v213_ITEMD_...`) WITH the client release reading common_mistakes from `glossary_full_v`.
- [ ] **C4.** Resolve `start_quiz_attempt` v3 design Qs (§4L) → author surgical v3 → dev-verify institutional regression + commercial matrix → Booth go-ahead.
- [ ] **C5.** RevenueCat (Booth) → author edge-function entitlements receiver (Phase 3).

### D. PHASE 2 BACKEND (UI complete; serve-set model SUPERSEDED 2026-06-26 by the §4K quiz-draw rule)
> **⚠️ SUPERSEDED (2026-06-25) — this section is historical.** Phase-2 backend is **BUILT + integrity-tested to live DB `yjgolswjggmlpeowvtxr` (CANDIDATE)**; admin bootstrap DONE (2 admins); glossary seeded + expanded (3,152 terms). Current truth: STATE r23 / TRACKER r22 / `BACKEND_BUILD_RECORD_2026_06_18.md`. **Genuinely-remaining build queue:** question authoring (≥25/topic); 1,836 pending definitions; Edge Functions (notifications); `get_*` RPCs; dashboard UI; `record_study_progress` RPC; instructor/TA name-edit; `.gif` upload-validation + renderer. The checkboxes below are left as the original plan-of-record.
- [ ] **Step 0 (read-only):** verify project `yjgolswjggmlpeowvtxr` reachable + empty (use `information_schema`, NOT `schema_migrations`). *Awaiting Prof. Booth's Step-0 trigger.*
- [ ] **Dev branch** (`create_branch`) → apply **SCHEMA v2.10** in dependency-ordered chunks (`apply_migration`) → `get_advisors` → deploy `register_student v2` + **`start_quiz_attempt v1`** + **`submit_quiz v8`** → test integrity triggers → `merge_branch`.
- [ ] Build sequence + verification/rollback in `BACKEND_BUILD_PLAN_2026_06_18.md`.
- [ ] Post-build checkpoint: bump MASTER **v4.2** addendum, STATE **r10**, TRACKER **r9**, QUICKSTART **v1.9**; refresh the 23-table ERD.
- [ ] Then: `get_*` RPCs / Edge Functions / admin APIs (Phase-2 inventory); §4G-D(1) Edge-Function naming.
- [ ] Admin bootstrap: link `role='admin'` user to auth email `cbooth@sdccd.edu`.
- [ ] Deferred: glossary seed (Q5=a) + multi-definition migration; content authoring (≥25 graded Qs/topic, Ear-Training, Scenarios).

### E. DOC-TIDY (low effort) — F-2, F-5, F-6, F-7, F-12, F-13.

### F. FALL-2026 PUNCH LIST (set 2026-06-26 — scope = MUSI 190 + AUDI 201, 23 topics)
- [ ] **F1. Glossary authoring — ACTIVE NEXT.** Fill empty content fields for the 23 in-scope topics via Cowork (`APE_Glossary_Authoring_AGENT_PROMPT_2026_06_26.md`), 1 batch/topic — **780 definitions + 914 deeper-field gaps**. Import per batch (bulk_import / UPDATE SQL) on go-ahead.
- [~] **F2. Quiz-draw CANDIDATE specs — AUTHORED 2026-06-27 (pending Booth approval; nothing deployed):** SCHEMA **v2.12** (+`quiz_questions.glossary_id` + write-time integrity trigger + draw-join index; activation unchanged), `start_quiz_attempt` **v2** (stratified draw; only Step 8 changes), MASTER **v4.4** — per §4K. In outputs (frozen canonical filenames + in-header CANDIDATE status). On approval → fold §4K, retire v1 wording; on deploy go-ahead → apply v2.12 migration chunks (dev branch) + deploy v2 + run tests.
- [ ] **F3. Question authoring:** ≥25 approved graded Qs/topic × 23 (≈ **≥575**); each links to one in-scope glossary term (difficulty inherited). Blocked on F2.
- [~] **F4. Flashcard banner spec — AUTHORED 2026-06-27 (pending Booth approval):** folded into IMPLEMENTATION_SPEC **Screen 2 (r8)** + MASTER §6 note — frontend-only, no schema/RPC change — per §4K / §4I.
- [ ] **F5. Booth-owned launch items:** create student auth users + registration codes; provide badge/trophy art (in progress); (later) Resend + Expo Push for notifications.
- [x] **F6. ADV-1 security — DONE + verified** (REVOKE + Leaked-Password Protection; §4K).
- [x] **F7. Admin surface — DECIDED:** sole-admin Fall; in-app admin dashboard deferred (§4K).

---
*Index v31 — 2026-06-28 — **SAFETY FEATURE LIVE (Phase 3 glossary import [153 terms] + Phase 4 engine [gate live] + snapshot regen + pre-safety backups dropped + folder cleanup).** Pointers STATE r29 / TRACKER r28. Historical: v30 — 2026-06-27 (PM·3) — **B-PHASE COMPLETE (B1–B5).** B4 (related_terms: 12 self-refs stripped + 21 case-variant re-points; 32 deferred orphans left for Spring 2027 → 0 self-refs globally / 0 in-scope dangling) + B5 (cross-course duplicate rows: keep-distinct on all 5 candidates; only edit = Watt↔Wattage cross-link; no rows merged/deleted) + snapshot REGENERATED from live (`ape_glossary_data_snapshot_20260627.js`, md5 `b4afbd9e296420a47b1da639f93263ee`, CURRENT through the whole B-phase; verified 50/50 per-topic counts + 10 term spot-checks) + pre-B5 backups retained. Pointers STATE r28 / TRACKER r27. Live DB counts unchanged (3,107 / 4,114 / 2,053 / 1,054 / 0 questions). Historical: v28 — 2026-06-27 — snapshot regenerated from live → `…_20260627.js` (md5 `54c303dc…`) + rollback backup `_backup_glossary_related_terms_20260626` dropped (live DB) + quiz-draw + flashcard-banner CANDIDATE specs authored (pending approval; SCHEMA v2.12 / start_quiz_attempt v2 / MASTER v4.4 / IMPL r8) + pointers STATE r26 / TRACKER r25. Historical: v26 — 2026-06-26 (PM — session decisions logged + ADV-1 closed: quiz-draw rule LOCKED [supersedes serve-set §4G-D2]; flashcard banner fully decided; Fall-2026 scope = MUSI190+AUDI201; ADV-1 REVOKE migration `adv1_revoke_admin_import_fns_from_authenticated_20260626` + Leaked-Password Protection applied & verified [advisors 16→10]; new agent-prompt artifact; see §4K + §F. v19 reconciliation history below retained for context). — F-5/F-6/F-7/F-12/F-13 doc candidates + §4G-E fold into MASTER v4.2 §1A; F-DEMOTE/F-OFFLINETIMER/F-GATEBYPASS closed by verification; live-DB hardening ADV-1 REVOKE + applicable_methods activation guard applied & verified; broader backend CANDIDATE). If this file and any other disagree on a spec, the file-specific authoritative source (live DB as recorded in `BACKEND_BUILD_RECORD_2026_06_18.md` + `SESSION_CHECKPOINT_2026_06_19.md` / SCHEMA **v2.10→2.11** / **submit_quiz v8.1** / **start_quiz_attempt v1** / register_student v2, plus §4G/§4J decisions) wins; update this index to match.*
