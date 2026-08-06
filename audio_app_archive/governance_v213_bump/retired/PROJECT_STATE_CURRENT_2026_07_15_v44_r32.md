> **ROLE — current snapshot only.** What is true *right now*. **Do NOT add changelog entries here** — chronological history lives in `PROGRESS_TRACKER`. Update the snapshot in place.

# AP&E STUDIO — PROJECT STATE CURRENT
**Date:** July 15, 2026 (PRODUCTION LIVE — SCHEMA v2.13 commercial mapping layer FULLY deployed [additive; item-D/E + Option-B live] — r32)
**Version:** 4.2 (revision r32)
**Author:** Prof. Channing Booth, San Diego Miramar College

> **🟢 CURRENT STATE (2026-07-15 [r32] — SCHEMA v2.13 COMMERCIAL MAPPING LAYER FULLY DEPLOYED to prod `yjgolswjggmlpeowvtxr` [additive; item-D + item-E + Option-B commercial progression LIVE]; read-only re-verified 2026-07-15; supersedes the 2026-07-10 block below).**
> Path B commercial-first backend landed on production as **9 tracked migrations, additive-only** (no academic table altered). The 4 core v2.13 migrations (07-11 AM) plus **5 follow-ups applied 07-11 PM→07-12 that had not been folded into these files** — see TRACKER r31. Re-verified read-only vs prod 2026-07-15.
> - **NEW TABLES:** `public_courses` (9) · `public_course_topics` (54 = 51 primary + 3 cross_list; `is_free` on gs0+gs36; single-primary trigger) · `entitlements` (RLS self-read). **NEW COLUMN:** `users.audience` ('institutional' default; 3 users backfilled).
> - **NEW RPC/HELPER:** `register_commercial_user(nickname,favorites)` v1 (synthetic `APE-C-…` id, audience='commercial') · `has_academy_access(uid)`.
> - **ANON CATALOG READ:** anon SELECT on glossary (12 cols, **NO common_mistakes**), glossary_topics, achievements, public_courses/topics + anon RLS policies.
> - **Migrations (9):** core — `v213_core_ddl_mapping_layer` · `v213_anon_catalog_grants_and_glossary_view` · `v213_seed_public_courses_and_topics` · `v213_advisor_cleanup_defer_glossary_view`; follow-ups (07-11 PM→07-12) — `v213_itemD_deploy_glossary_full_v_view` · `v213_itemD_close_common_mistakes_leak` · `v213_fix_grant_execute_has_academy_access` · `v213_itemE_glossary_study_v_free_topic_exception` · `v213_optionb_commercial_progression`. Rollback staged.
> - **item-D — DEPLOYED (07-11):** `glossary_full_v` masks `common_mistakes`→NULL when `NOT has_academy_access(auth.uid())` (else returns the array); leak closed (authenticated base-glossary common_mistakes grant = 0). `has_academy_access` EXECUTE granted to anon+authenticated (definer view checks EXECUTE against the querying role). Client reads common_mistakes via the view (masked NULL, **not** 403).
> - **item-E — DEPLOYED (07-12):** `glossary_study_v` free-topic exception (common_mistakes visible when has_academy_access OR authed on gs0/gs36; anon → NULL). Client study fetch route-back to `glossary_study_v`.
> - **Option-B commercial progression — DEPLOYED (07-12):** `submit_quiz` v8.4 (6-arg) + helpers `recompute_reachability_commercial` / `commercial_topic_unlocked` / `seed_commercial_free_topics` (EXECUTE revoked from public). **`start_quiz_attempt` kept 2-arg** `(p_achievement_id, p_client_attempt_id)` — public course DERIVED from the achievement's primary home; the v3 `p_public_course_id` param was NOT added. Grader math byte-identical; verified on a throwaway clone 07-11. **[CONFIRM mechanism vs migration source before quoting.]**
> - **⚠️ ADVISORS (2026-07-15):** **2 ERROR `security_definer_view`** — `glossary_full_v` + `glossary_study_v`, **BY DESIGN** (Booth accepted view-over-RPC 07-11). **Supersedes the earlier "no new ERROR" note; decision owed** (accept vs SECURITY INVOKER refactor). Plus accepted WARN set + 2 INFO `rls_enabled_no_policy` on 07-10 backup tables (`glossary_backup_corrections_20260710`, `glossary_backup_prefill_20260710`).
> - **Known gap:** gs36 "DAW Skills" (free) is `is_active=false` — browsable, not completable. gs0 Safety active.
> - **2026-07-15 CLIENT HANDOFF (`APE_BACKEND_HANDOFF_2026_07_15.txt`; no backend change by client):** carryover **F** (common_mistakes 403 → masked NULL) and **G** (`register_commercial_user` deploy) were **already RESOLVED** on prod. New OPEN items: **A** awards model (no tables yet), **B** rename Professional Networking (gs47)→Workplace Professionalism + networking→Music Entrepreneurship (gs49) — both `is_active=false`, non-launch-critical, **C** pricing $99.99 lifetime-thru-EOY-2026 needs server SSoT (static client text; no table), **H** per-term hazard flag + (R)/(TM) marks (no glossary columns; client uses `src/lib/hazard.ts`), **I** flashcard `required_passes` 2→1 (currently 2). **D/E informational — no backend action.** New EAS iOS dev build 76e2f5ee (client-only). Reconciliation record: `GOVERNANCE_RECONCILIATION_DRAFT_2026_07_15.md`.
> - **Live counts (2026-07-15):** glossary 3,660 / assignments 4,677 / pending 1,053; quiz_questions 1,148; active achievements 24; **users 4** (2 admin + 1 test + Anorak `APE-GOD-0001`); commercial users 0; public_courses 9 / public_course_topics 54; entitlements 1.
> - **Design SSoT:** `PATH_B_MAPPING_LAYER_SCHEMA_2026_07_11_v1.md`; record: `V213_VERIFICATION_REPORT_2026_07_11.md` (folder `v213_mapping_layer/`).
> - **Note:** Supabase native branching UNUSABLE for this DB (replay halts ~06-18) → verified read-only against prod instead.

> **🟢 CURRENT STATE (2026-07-10 — CANDIDATE · verified against live DB `yjgolswjggmlpeowvtxr` this session; supersedes the 2026-06-28 block below).**
> This block reconciles ~2 weeks of production-era work that existed on disk (07-01→07-09 artifacts) + live DB but was never folded into STATE/TRACKER/INDEX. Every figure is DB- or disk-verified; items that could not be verified from disk/DB are marked **[CONFIRM]** rather than filled from memory.
>
> - **PRODUCTION LIVE (since 2026-07-04):** pooled-answer layer **SCHEMA v2.12 + `start_quiz_attempt v2`** deployed to production after an isolated dev-branch verification (`B3_DEVBRANCH_VERIFICATION_REPORT_2026_07_04` = PASS; branch `pooled-v212-verify` deleted; prod untouched during test).
> - **Questions:** **1,148** graded questions live across all **24 active topics** (Safety + MUSI 190 [10] + AUDI 201 [13]). Explanation coverage **1,148/1,148** (verified 07-08, D-3).
> - **Safety gate:** Achievement 0 (gs0) **`is_active = TRUE`** — gate ACTIVE (was `false` at 06-28). App is un-gated for the in-scope courses.
> - **Users / activity (live):** **3 users** = 2 admins + 1 TEST student (APE-TEST-0001); **6** quiz_attempts; **0** badges awarded; **0 real students provisioned.**
> - **Student RPCs (all present in live DB):** `register_student`, `start_quiz_attempt` (v2 pooled), `submit_quiz`, `record_study_progress` (contract 07-05), `verify_registration` (D-2, 07-08). Deployed `submit_quiz`/`register_student` exact versions **[CONFIRM]** (specs: submit_quiz v8.2→v8.3 D-3; register_student D-2b taxonomy).
> - **Glossary (live):** **3,660 terms / 4,677 assignments / 2,607 authored / 1,053 pending** (pending all in deferred courses; 1 curriculum version). ⚠️ Two backup tables dated **today** — `glossary_backup_corrections_20260710`, `glossary_backup_prefill_20260710` — indicate glossary corrections + prefill ran 2026-07-10 **outside this session** [CONFIRM scope].
> - **Snapshot SSoT:** `ape_glossary_data_snapshot_20260708.js` (3,660 terms) — **may now be behind live** after today's glossary edits [CONFIRM / regen].
> - **Frontend:** RN/Expo, path = Claude Design → Claude Code. Milestones M1–M8 reported built on Booth's iPhone (EAS dev build) **[CONFIRM — not verifiable from here]**. `ape-dsp` native audio capture **SPIKE 0 = PASS on-device 2026-07-09** (Spring measurement-tools feature; Option A validated).
> - **Trophy / course-card art:** buckets `trophy-icons` + `course-cards` created 2026-07-09. **This session (07-10):** wired **7** achievement `icon_url`s — in-scope **Corporate AV (gs19)** + **Distributed Audio (gs21)**; deferred Mixing/Vacuum Tubes/Band Recording/Audio Career/Professional Networking — and fixed the **MUSI 205B** course-card duplicate (single `205b_card.PNG`, new art, verified). gs38 Plugins left as-is (byte-identical art already wired). **Remaining trophy-art gap:** 5 in-scope active achievements still `icon_url = NULL`, no file uploaded — **Connectors & I/O (gs3), Amps & Loudspeakers (gs6), Consumer Audio (gs18), Commercial Audio (gs20), Vehicle Audio (gs22).**
>
> **⚠️ PRE-PROVISIONING GATE (must clear before ANY real student):**
> 1. **B-1 NOT restored** — live `study_methods.min_engagement_seconds` = **200** for flashcards/fill_in_blank/matching (on-device test value; study-gate spec = **600** / 10 min). ear_training = 300 (spec), scenarios = 600 (spec). Restore the three to 600.
> 2. Remaining smoke tests + parked Booth rulings **[CONFIRM — status not verifiable from disk]**.
> 3. (Visible-but-optional) create art for the 5 in-scope NULL trophies above.
>
> Full chronology → `PROGRESS_TRACKER r29`. **This CURRENT block is CANDIDATE** pending Prof. Booth's confirmation of the **[CONFIRM]** items; on approval it becomes the LOCKED snapshot and this note is removed.

> **🟩 PRIOR STATE (2026-06-28 — SAFETY PREREQUISITE FEATURE LIVE; SUPERSEDED by the 2026-07-10 CURRENT block above — kept for history):** The Safety prerequisite — Achievement 0 "Professional Audio Safety" (course `SAFE`, `global_sequence`=0, `is_prerequisite`=true) — is fully wired. **Live glossary = 3,260 terms / 4,272 assignments / 2,206 authored / 1,054 pending** (all pending in the DEFERRED 6 courses; Safety topic = 70 terms, 100% authored). **51 achievements = 1 prerequisite (Achv0) + 50 mastery.** **Phase 4 engine DEPLOYED + 7/7 behavioral-tested** (migration `safety_phase4_engine_wiring_20260627`): NEW `unlock_after_safety` (internal-only, EXECUTE revoked), Design-A seed-lock in `seed_first_topic_on_enrollment`, precondition-0 gate `safety_prerequisite_incomplete` in `start_quiz_attempt`, completion hook in `submit_quiz`, Safety auto-enroll in `register_student`, Achv0 `applicable_methods='{flashcards}'`. Security advisors **10 WARN + 0 INFO — no new exposure.** Snapshot regenerated (Safety-inclusive) → `ape_glossary_data_snapshot_20260627.js` (file md5 `4c68a8fa19a0bc845483835771d72f40`; 9 courses / 51 topics; **new convention `achv` index `i = global_sequence`**, Safety at 0). Pre-safety backups DROPPED (**0 `_backup_*` tables remain**). ⚠️ **THE GATE IS LIVE:** Achv0 is `is_active=false` with 0 questions, so **no student may be provisioned / claim an account until Phase 5 (≥25 approved graded Safety questions + activation)** — otherwise that student's entire app is locked. **Safety feature: ✅ Phase 2 (schema) · ✅ Phase 3 (glossary) · ✅ Phase 4 (engine) — ⏭ Phase 5 (questions, TOP blocker) · ⏭ Phase 6 (frontend, Cursor).** **Safety spec doc-sync APPROVED & LOCKED 2026-06-28** (SCHEMA `v2.11-SAFE` · MASTER `v4.3-SAFE` · register_student v2.1 · start_quiz_attempt precond-0 · submit_quiz v8.2; the quiz-draw candidate SCHEMA v2.12 / MASTER v4.4 / start_quiz_attempt v2 stays CANDIDATE, independent). Full chronology → `PROGRESS_TRACKER r28`. **🌙 ACTIVE OVERNIGHT INITIATIVE (2026-06-28):** deferred-glossary authoring for MUSI 201 + AUDI 204 + MUSI 202 — all 8 authorable fields to committee standard, **815 terms / 17 topics** — runs via Cowork using `APE_Glossary_Authoring_AGENT_PROMPT_DEFERRED3_2026_06_28.md`, a few batches per night. Content-only: does NOT change the Spring-2027 launch of those courses or any live behavior; nothing applied to live until reviewed + imported.
**Status:** Active Development — **UI phase complete (20/20 LOCKED)**. **Phase 2 backend now BUILT to the live Supabase project `yjgolswjggmlpeowvtxr` (CANDIDATE, integrity-tested)**: 23 tables + RLS + 3 RPCs + grader/clamp deployed and passing all test harnesses. submit_quiz v8 + grade_one + clamp were authored (Option B) to the locked rules; the **4 authored-logic flags + client WRITE-grant matrix are now RULED & DEPLOYED** (F2 602 s timer; F1 `performance_metrics` analytics via `refresh_student_metrics`; WM client-write grants for `notification_preferences` + `users` profile cols). 8 P0 blockers folded; two-threshold raw-count progression + one-ahead clamp (Interpretation A) implemented and verified. **LIVE GLOSSARY/CURRICULUM SNAPSHOT (2026-06-25, post-merge, applied + verified):** achievements = canonical **50 topics / 8 courses** (per-course 10/13/4/8/5/3/4/3; achievement UUIDs preserved). glossary = **3,151 terms** (2,039 authored definitions + **1,112 `(definition pending)`**, all remaining pending in the DEFERRED 6 courses). `glossary_topics` = **4,175** assignments, multi-topic, per-topic `difficulty`; exactly one primary/term; 0 orphans. `courses.achievement_count` resynced. **2026-06-25 combined-additions merge** (14 dedup deletes + 1,990 difficulty/primary-topic edits + 134 authored additions) applied on top of the 2026-06-23 50-topic restructure; **durable guardrail honored** (no existing definition overwritten). Pre-merge backups (`_backup_{glossary,glossary_topics}_pre_merge_20260625` + earlier `_backup_{achievements,glossary,glossary_topics}_20260623`, all 5) **DROPPED 2026-06-26** via tracked migration `drop_superseded_glossary_backups_20260625` (0 `_backup_*` remain; live tables intact). quiz_questions still **0** (top launch blocker). **DOC-SYNC (2026-06-25): SCHEMA v2.11 + MASTER v4.3 APPROVED & LOCKED** (Prof. Booth) — SCHEMA documents `glossary_topics` + per-topic `difficulty`; MASTER records the canonical 50-topic/8-course map (`ape_achievement_structure_FINAL_20260623.json` = 'Valid Topics' SSoT); both data-scale annotations refreshed to post-merge counts. **SNAPSHOT SSoT (2026-06-27 PM·3, regenerated post-B-phase):** `ape_glossary_data_snapshot_20260627.js` (md5 `b4afbd9e296420a47b1da639f93263ee`; 148,488 bytes; 8 courses / 50 topics / **3,107 terms / 4,114 assignments / 1,054 `(definition pending)`**) — **regenerated from live after B4 (single-cell `json_build_object` export defeated the Studio 100-row cap), verified vs live (50/50 per-topic counts + 10 term spot-checks); CURRENT through the whole B-phase** (B4 and B5 both touched only `related_terms`, which the snapshot does not store). Supersedes the 2026-06-27 AM version (md5 `54c303dc2caa543aaff8b55151ff5569`) and `…_20260625.js`. Rollback backup `_backup_glossary_related_terms_20260626` **DROPPED 2026-06-27** (tracked migration `drop_backup_glossary_related_terms_20260626`). Pre-B5 backups `_backup_glossary_pre_B5_20260627` (3,107) + `_backup_glossary_topics_pre_B5_20260627` (4,114) **created + RETAINED** (droppable on Booth's go-ahead). **FALL-2026 SCOPE (set 2026-06-26):** launch = **MUSI 190 + AUDI 201 ONLY** (23 of 50 topics); the other 6 courses deferred to Spring 2027 — no per-course content work on them now. **In-scope content: ✅ 100% AUTHORED 2026-06-26** (823-term Cowork import + Grounding applied + verified; all 1,542 in-scope terms carry all 8 content fields, 0 pending; `related_terms` cleaned to 0 dangling / 0 self-ref, backup `_backup_glossary_related_terms_20260626` retained). Remaining in-scope blocker: **0 graded questions** (≥25/topic × 23 ≈ ≥575 to author). **QUIZ-DRAW RULE + FLASHCARD BANNER — CANDIDATE SPECS AUTHORED 2026-06-27** (in outputs, **pending Prof. Booth approval; nothing deployed**): the new quiz-draw rule (25 Q; ≥18 intermediate+advanced; difficulty inherited via a new `quiz_questions.glossary_id`; activation ≥25 with relax; ≤50% retake rotation) is now encoded in **SCHEMA v2.12** (+`glossary_id` + write-time integrity trigger `validate_graded_question_glossary_link` + draw-join index; `quiz_questions.difficulty` deprecated; activation unchanged) + **`start_quiz_attempt v2`** (only Step 8/the draw changes; submit_quiz v8.1 unchanged) + **MASTER v4.4** (OPEN-2 prose → pool/stratified-draw); draw arithmetic validated on live synthetic pools. The flashcard difficulty banner (Progressive adaptive+additive; **two-state** lit=shown buttons; ≥1 always shown; progression on *done*; hidden cards still gate-required) is specced into **IMPLEMENTATION_SPEC Screen 2 (r8)** + MASTER §6 — **frontend-only, no schema/RPC change**. *(These CANDIDATE files reuse frozen canonical filenames with internal bumps + in-header CANDIDATE status; they overwrite the LOCKED v2.11/v4.3/r7 only on approval+upload.)* **SECURITY — ADV-1 FULLY RESOLVED 2026-06-26 + verified:** EXECUTE on the admin import/validate/KPI fns revoked from `authenticated`+`anon` (migration `adv1_revoke_admin_import_fns_from_authenticated_20260626`); Leaked-Password Protection enabled; security advisors **16 → 10** (remainder by-design RLS helpers + student RPCs). **ADMIN SURFACE:** sole-admin for Fall → in-app admin dashboard DEFERRED (operate via Supabase Studio + import tools). **ACTIVE NEXT:** review/approve the 2026-06-27 CANDIDATE specs (quiz-draw + flashcard banner) → deploy quiz-draw on a dev branch → author ≥25 graded questions/topic × 23. **2026-06-27 PM — B1–B3 GLOSSARY STRUCTURAL CLEANUP applied + verified on live `glossary`:** (B1) duplicate/near-dup row consolidation; (B2) topic reassignments (Operating point→Amplifiers, Dielectric→Connectors & I/O; Arcing + Capacitor kept in Grounding with hazard-aware defs) + Grounding dual-meaning fixes (Watt / Shielding / Ground loop now carry BOTH the audio and the electrical-safety meaning); (B3) full category-taxonomy consolidation of all 7 in-scope clusters (Microphones, Grounding, Dynamics, Reverb/Delay, EQ, Connectors, Measurement). **Live now = 3,107 terms / 4,114 assignments / 2,053 authored / 1,054 pending / 295 distinct categories** (B1 removed 44 duplicate rows → 61 fewer assignments via CASCADE). The `ape_glossary_data_snapshot_20260627.js` SSoT was regenerated post-B-phase and is **CURRENT** (see SNAPSHOT SSoT above). All edits logged in `GLOSSARY_REVIEW_KNOWN_EDITS_LEDGER_2026_06_27.md`. **2026-06-27 PM·3 — B4 + B5 APPLIED + VERIFIED (B-PHASE COMPLETE):** **B4** (related_terms) stripped 12 in-scope self-refs + re-pointed 21 case/wording-variant dangling refs to canonical survivors; 32 true-orphan deferred-course dangling refs left for Spring 2027 → **0 self-refs globally / 0 dangling on any in-scope row**. **B5** (cross-course duplicate rows) — multi-topic model had already absorbed most candidates; Booth chose **keep-distinct on all 5** real candidates (HDMI, MADI, Codec, ADC/DAC, Watt/Wattage); only edit = **Watt ↔ Wattage cross-link** (no rows merged/deleted; counts unchanged). **Live now = 3,107 terms / 4,114 assignments / 2,053 authored / 1,054 pending / 295 distinct categories.** See TRACKER r27 for the full change log.

> **r9 → r10 (June 18 — Phase 2 backend built to live DB):** Full schema (SCHEMA v2.10, +v2.11 glossary delta) + authored security/data/importer/seed layer + RPCs applied **directly** to live project `yjgolswjggmlpeowvtxr` and **integrity-tested (ALL PASS)**. `register_student v2` verbatim; `start_quiz_attempt v1` + `submit_quiz v8` + `grade_one` + `recompute_reachability` **authored (Option B)** strictly to TWO_THRESHOLD §3-4 / IMPL §313/269-278. Base read GRANT to `authenticated` added (was missing — RLS unreachable). DB seed pristine. Record: `BACKEND_BUILD_RECORD_2026_06_18.md`. INDEX v11 / TRACKER r9 / QUICKSTART v19 / MASTER addendum. **CANDIDATE — pending approval.**

> **r8 → r9 (June 17 PM·2 — dashboards formalized):** Dashboard planning → new `APE_DASHBOARD_SPEC_2026_06_17` + SCHEMA v2.8→**v2.9** (glossary enrichment+media; `glossary_media`; badge revocation+audited grant; `audit_log`; dashboard data-layer views/matview). `admin_dashboard_requirements.json` RETIRED. MASTER v4.1 / INDEX v9 / TRACKER r8 / QUICKSTART v1.8. submit_quiz v7 + register_student v2 unchanged. CANDIDATE; Supabase untouched.
> **r7 → r8 (June 17 PM — Phase-2 planning applied):** Coordinated bump MASTER v4.0 / SCHEMA v2.8 (17→20 tables) / submit_quiz v7 / IMPL v2-r5 / INDEX v8 / QUICKSTART v1.7. Deltas: roles, c-ii sections, student QR identity, multi-definition glossary, quiz_questions media/usage/provenance; B-4 + submit_quiz scoped to `usage='graded_quiz'`. register_student stays v2. **CANDIDATE — pending approval; Supabase untouched.**
> **r6 → r7 (June 17 — Screen 13 locked):** Screen 13 (Scenarios) folded into IMPL §7 and **LOCKED → 20/20 screens; UI phase complete.** **S13-A:** Scenarios completion is single-pass (per-method `study_methods.required_passes`; Scenarios=1) — folded into SCHEMA **v2.7** / MASTER **v3.9** / submit_quiz **v6**. register_student stays v2. Pointers → index v7, tracker r6, quickstart v1.6, impl v2-r4.
>
> **r4 → r5 (post-session-2 reconciliation):** A maintenance audit found 5 files produced after this session were uploaded but never recorded. Folded in: **Screen 12 Ear Training now LOCKED** (→ 19 screens); **8 P0 blockers B-1…B-8 RESOLVED at design level** in the `8_P0_BLOCKERS_*` advisory files (register_student RPC + submit_quiz hardening + schema triggers/columns) — NOT yet folded into the locked RPC/SCHEMA (see INDEX v5 §4G). Two open spec conflicts flagged: §4G-A submit_quiz v3-vs-v4 merge; §4G-B schema columns/triggers not yet in SCHEMA v2.4. **The canonical-set and retire lists previously duplicated at the bottom of this file have been REMOVED — they now live ONLY in `PROJECT_FILE_INDEX_2026_06_17_v6.md` §1/§2** (the triple-duplication was the cause of the drift this audit fixed). Pointers → index v5, tracker r4, quickstart v1.4, impl v2-r2.
>
> **r3 → r4 (June 16, session 2):** 5 new changes specced + OPEN-1/2/3 RESOLVED → MASTER_SPEC **v3.7**, SCHEMA **v2.4**, RPC **v3**. #1 study-method 3-condition gate (completion done-twice + min ACTIVE time + ≥80% accuracy; Ear Training 5 min, rest 10); #2 10-min quiz timer (force-fail); #3 app-switch 1st-warning/2nd-void + 15-min lockout (2 s grace); #4 quiz_attempts integrity fields + lockout_until; #5 flashcard mark-known/Show-Reset. OPEN-1 multi-answer question_type taxonomy + correct_answers JSONB; OPEN-2 25-question quiz-open guard; OPEN-3 enrollment-gated/per-course/no cross-course auto-unlock. Pointers → index v4, tracker r3, quickstart v1.4, impl v2. Screens 2/6/7 re-locked. NOTE: a standalone MASTER_SPEC v3.6 file never existed (its changes were logged only; v3.7 = v3.5 + C1).
>
> **r2 → r3 (June 16):** D1 + D2 **ratified**; C1 + C2 **applied** (MASTER_SPEC → **v3.6**, SCHEMA v2.3 annotated at line 209 + status pseudocode); `SUBMIT_QUIZ_RPC_CONTRACT_v2` flipped **pending → LOCKED**. New startup anchor `PROJECT_FILE_INDEX_2026_06_16_v3.md`. Open items now tracked in index v3 §4 (OPEN-1/2/3, 8 P0 blockers, F-2/F-4…F-13 tidy). T-1 (v3.5→v3.6 pointer refresh in tracker/quickstart/impl-spec) DONE June 16 — re-upload those three.

> **r1 → r2 (June 15, end-of-day):** Two audits added (`APE_STUDIO_CTO_TAKEOVER_AUDIT`, `APE_STUDIO_TECHNICAL_BUG_AUDIT`) and a consolidated build doc (`IMPLEMENTATION_SPEC_2026_06_15_v1.md`). Finding F-1 (canonical v3.5/v2.3 absent from project) is **RESOLVED** — both files now uploaded.

---

## CHANGELOG — v3.6 → v3.7 (June 16, 2026 — session 2)
- **5 changes specced** into MASTER_SPEC v3.7 / SCHEMA v2.4 / RPC v3: #1 study-method completion gating (3 conditions per applicable method — completion done-twice + min active time + ≥80% accuracy, Flashcards exempt); #2 10-min quiz timer (force-fail, never pauses); #3 focus-loss void + 15-min lockout (1st app-switch warning, 2 s grace); #4 `quiz_attempts` integrity fields + `lockout_until`; #5 flashcard mark-known + Show/Reset.
- **OPEN-1/2/3 RESOLVED:** multi-answer `question_type` taxonomy (mc/true_false/fill_in_blank/multi_select/matching) + `correct_answers` JSONB; 25-question quiz-open guard; enrollment-gated per-course progression (no cross-course auto-unlock).
- **C1 folded into v3.7** (contiguous, non-skip clamp wording). A standalone v3.6 master-spec file never existed — v3.7 is built from v3.5 + C1.
- Screens 2 (Flashcards), 6 (Quiz), 7 (Results) **re-locked** for the new behaviors (layout/nav unchanged; + [TBD-CURSOR] visuals).

---

## CHANGELOG — v3.5 → v3.6 (June 16, 2026)
- **D1 ratified:** a clamped-provisional topic scored 20–23 stays `unlocked` (no 2nd `passed_incomplete`; score banked; later 24+ promotes it).
- **D2 ratified:** `submit_quiz` writes the `student_badges` row atomically; the `on-badge-earned` Edge Function notifies only. (Tidy F-5: NOTIFICATION spec + SCHEMA line 371 still describe Edge-Function grants — reconcile later.)
- **C1 applied (clamp wording):** line 389 + SCHEMA 312–313 confirmed correct (unchanged); MASTER_SPEC changelog line 10 + SCHEMA line 209 aligned to the contiguous, non-skip rule. MASTER_SPEC → v3.6.
- **C2 applied (status derivation):** SCHEMA reference pseudocode derives `status` from `best_genuine_score`, never the current attempt. SCHEMA stays v2.3 (pseudocode/annotation only).
- **RPC contract LOCKED.** No screen, schema-structure, or threshold changes — v3.6 (logical) was a wording/decision-ratification step — no standalone file; the structural changes are in v3.7 (see the v3.6 → v3.7 changelog above).

---

## CHANGELOG — v3.4 → v3.5 (June 14, 2026)
- **Two-threshold progression (raw counts, replaces one-ahead lock):** 24–25 correct = FULL PASS (trophy + studio privilege + COMPLETE + unrestricted next); 20–23 = PARTIAL PASS (next unlocks CLAMPED, no trophy, PASSED-INCOMPLETE); ≤19 = no unlock. One-ahead clamp relative to last FULL-PASS (24+) topic.
- **Trophies gate real studio privileges (MIC/REC/MIX/PA) + visible peer-status badges** — the primary motivator; raises quiz-integrity stakes.
- **New achievement state:** PASSED-INCOMPLETE.
- **Screen 4* Dashboard RE-LOCKED:** hard-stop boundary moved to the one-ahead provisional topic; provisional topic gets distinct color/border [TBD-CURSOR].
- **Screen 7 Results RE-LOCKED:** three-way branch; 20–23 is celebrate-forward with explicit CLAMP NOTICE, [Retake for Trophy] + [Continue].
- **Practice-mode narrowed:** only FULL-PASS (24+) topics → practice. PASSED-INCOMPLETE retake is genuine.
- **SCHEMA → v2.2 (REAL change):** status enum adds 'passed_incomplete' ('earned'→'complete'); best_genuine_score added. Legitimate line v2.0→v2.1→v2.2; "v2.5" was phantom.
- **SCHEMA → v2.3 (curriculum-as-data):** NEW curriculum_versions table (17 tables); courses/achievements/badges version-scoped; enrollment pinned per cohort; trophy images→Supabase Storage; earned badges PERMANENT. Version-READY model only — publish/migration workflow deferred until a real v2. Addresses CTO report's #1 architecture debt (hard-coded curriculum).
- **Visual specifics deferred to Cursor:** provisional-topic colors/border, the persistent "provisional access" reminder styling, 20–23 Results styling, PASSED-INCOMPLETE grid trophy form — all marked [TBD-CURSOR].

---

## CHANGELOG — v3.2 → v3.4 (June 10, 2026)
- Screen 3-Media (Identify from Media — Option B) LOCKED
- Screen 4-Media (Match to Media — select-all, orange #ff6f22) LOCKED
- Screen 4 (Matching) RE-LOCKED: [Prev]/[Next] + swipe, auto-advance 300ms, sequential LED
- LED formula standardized to SEQUENTIAL (one segment at a time) across all study methods
- Ear Training (12) & Scenarios (13) formalized and **LOCKED**
- **Path B selected:** finish UI (Screens 12 & 13) before Phase 2 backend
- **SCHEMA NOTE (superseded by v3.5):** v2.1 was current as of June 10; "v2.5" was a phantom version. v2.2 (June 14) is the first real bump since v2.1.

---

## QUICK STATUS

| Area | Status |
|---|---|
| Screen Designs Locked | **20 LOCKED** (16 MVP base + 2 media variants + Screen 12 + Screen 13) ✅ — Screens 2/6/7 re-locked v3.7; **UI phase complete** |
| UX Navigation Audit | COMPLETE — 40 decisions locked June 6 |
| Backend Architecture | Locked — Supabase only |
| Auth Flow | Locked — Handshake registration model |
| Notification System | Locked — Edge Functions architecture |
| Framework | React Native (Cursor-assisted development) |
| Airtable | PERMANENTLY REMOVED — never reference |
| Glossary / Data Population | **LIVE on DB (verified)** — **3,151 glossary terms / 4,175 topic-assignments** (multi-topic, per-topic difficulty; 2,039 authored defs + 1,112 `(definition pending)`; ✅ in-scope 23 topics 100% authored 2026-06-26; `Polarity Popper` deleted) after the 2026-06-23 mega-expansion/50-topic restructure + the **2026-06-25 combined-additions merge** + the **2026-06-26 in-scope authoring import**. `media_type` CHECK allows 'video' on `glossary_media` + `quiz_questions` (migration `add_video_to_media_type_checks`). **Current SSoT** = `ape_glossary_data_snapshot_20260627.js` (assignments+difficulty; regenerated 2026-06-27 from live; md5 `54c303dc2caa543aaff8b55151ff5569`; matches live 3,151 / 4,175 / 1,112) + `ape_achievement_structure_FINAL_20260623.json` (topics). *(Provenance: originally imported 1,196 terms via `APE_Glossary_v13_CLEANED_CANDIDATE.xlsx` / `glossary_import_v13.sql`, `Phase wrapping`→MUSI190/Signal Flow — superseded.)* |
| Database Implementation | **BUILT to live DB (CANDIDATE, integrity-tested)** — project `yjgolswjggmlpeowvtxr`: 23 tables + RLS (now ~59 policies) + 3 views + 1 matview + **20 functions** (+`refresh_student_metrics`) + 3 RPCs + grader/clamp; seed 8 courses / 50 achievements / 4 badges / 5 methods + **2 admin users** (`cbooth@sdccd.edu`, `cbcreativeservices@gmail.com`, linked 2026-06-21); **0 questions; 3,151 glossary (2,039 defs + 1,112 pending; in-scope 23 topics 100% authored 2026-06-26)**. All test harnesses PASS. **2026-06-21: admin bootstrap DONE — 2 admins linked** (see above). **2026-06-19: 4 flags + WM deployed** (602 s timer; `performance_metrics` analytics; client-write grants). See `BACKEND_BUILD_RECORD_2026_06_18.md` + `SESSION_CHECKPOINT_2026_06_19.md`. Deferred: question-bank, Edge Functions, dashboards, `record_study_progress` RPC, instructor/TA name-edit. (Glossary import + `glossary_media` 'video' migration DONE; **admin bootstrap DONE — 2 admins**; **ADV-1 privilege REVOKE DONE + verified 2026-06-26**.) |
| Multi-platform | Mobile + Web — same account, same data |

---

## SCREENS — COMPLETE STATUS (UPDATED JUNE 7-8)

### ✅ LOCKED (20 screens: 16 MVP base + 2 media variants + Screen 12 Ear Training + Screen 13 Scenarios — Ready for Developer Handoff)

| Screen | Name | Locked | Key Specs |
|---|---|---|---|
| 0 | Splash | May 28 | Skip on valid session, 300×300px, 2–3s |
| 1 | Login / Registration | June 6 | Step indicator, show/hide password, sign in → last dashboard |
| 2 | Flashcards | May 28 | Dominant axis diagonal swipe, 300×280px, manual back on 100% |
| 3 | Fill-in-Blank | May 28 | 4-option tap grid 3×2, 8px gap, manual back on 100% |
| 4 | Matching | **June 10 RE-LOCKED** | 2-column, 1.5px borders, [Prev]/[Next]+swipe, auto-advance 300ms, sequential LED |
| 5 | Trophy Unlock Animation | May 28 | Gradient #003366→#330066→#cc9900, confetti 3s, haptic 230BPM |
| 3* | Course Selection | June 5 | 8-course carousel, snap 300ms, 30% peek, "Not Enrolled" locked, returns to active position |
| 4* | Dashboard | June 6 | Topic swipe nav LEFT/RIGHT, "Topic # of #", no resume prompt, glow pulse quiz activate, hard stop at current topic |
| 5* | All Achievements | June 5 | 5-column grid, 50 achievements, course section labels, unlocked tappable → Trophy |
| 6 | Quiz | June 5 | 25 questions, "Question # of 25", 350ms highlight, one-sitting, practice mode support |
| 7 | Results | June 5 (re-locked v3.5) | Raw score "# out of 25", THREE-WAY branch: 24–25→Trophy(8); 20–23→clamp notice + [Retake for Trophy]+[Continue]; ≤19→[Retake]+[Back]. Scrollable wrong answers, practice label |
| 8 | Trophy Screen | June 5 | Gradient, confetti, haptic, badge callout, all entry_source paths (quiz_win, gallery, achievements_grid, practice) |
| 9 | Achievement Gallery | **June 7 LOCKED** | Earned trophies only, 10-row flex layout, course-color fills, tap→Trophy(entry_source=gallery)→[Back] |
| 10 | Profile / Digital ID Badge | **June 7 LOCKED** | Miramar AP&E student card, photo 120×120px, Student ID (monospace), QR 120×120px, 4 badges in 1 row, Album Level with vinyl icon 60×60px, zero scroll |
| 11 | Settings | **June 7 LOCKED** | Scrollable single column, 4 sections (Notifications, Display, Accessibility, Account), orange accent #ff6f22, iOS toggles, immediate writes, X close |
| 17 | Glossary | June 5 | Single screen, 3 filter buttons (All/Course/Topic), searchable, bottom nav visible, closed-book |
| 3-Media | Identify from Media | **June 10 LOCKED** | Option B — media is stimulus, 4-option tap, sequential LED |
| 4-Media | Match to Media | **June 10 LOCKED** | Select-all-that-apply, orange #ff6f22, sequential LED |
| 12 | Ear Training | **June 16 LOCKED** | Audio = stimulus; `mc` 2×2 grid OR `multi_select` (orange #ff6f22) + [Confirm]; 5-min gate; sequential LED; manual [<BACK]. Full spec in IMPL v2-r2 §7. (D-8 resolved) |

**Total locked: 20 screens** (16 MVP base + 2 media variants + Screen 12 Ear Training + Screen 13 Scenarios)

### 🔲 PENDING — MVP (Path B: build BEFORE Phase 2 backend)

| Screen | Name | Priority | Dependencies |
|---|---|---|---|
| 13 | Scenarios | Study Methods | **LOCKED** — single-pass (S13-A); spec in IMPL §7 |

> **Screens 12 (Ear Training) & 13 (Scenarios) are LOCKED** — full specs folded into `IMPLEMENTATION_SPEC_2026_06_17_v2_r5.md` §7 (from the now-retired standalone files). D-8: the `mc`/`multi_select` design is final ("Options C & E" superseded). **S13-A:** Scenarios completion is single-pass.

### 🚫 REMOVED — DO NOT BUILD

| Screen | Reason |
|---|---|
| Former Screen 6 (Achievement Detail) | Redundant — routes to Dashboard |
| Homework (all screens) | Removed June 6 |
| Badge Unlock Animation | Trophy screen is sufficient |
| Glossary 17a/17b/17c sub-screens | Replaced by single screen with filter buttons |

---

## NEW FEATURES LOCKED (JUNE 7-8)

### Screen 9 — Achievement Gallery (LOCKED)
- **Display:** Earned trophies only, newest first
- **Layout:** 10-row flex layout, responsive columns
- **Cards:** Course-color fills (0.12 opacity) in containers; card backgrounds #2a2a2a fully opaque
- **States:** Earned/Unlocked/Locked (locked not shown—earned only)
- **Interaction:** Tap trophy → Trophy Screen with entry_source=gallery → [Back] → Gallery
- **Icon assets:** Reserved 48×48px per achievement, Supabase storage, Phase 2 implementation
- **Empty state:** "Earn your first trophy to see it here"

### Screen 10 — Profile / Digital ID Badge (LOCKED)
- **Card design:** Miramar College AP&E Student ID, fullscreen fit, zero scrolling
- **Photo:** 120×120px square, Supabase Storage
- **Student ID:** Monospace, auto-generated from UUID (bidirectional)
- **Name display:** Nickname field (public), first_name + last_name_initial (private in Supabase)
- **QR Code:** 120×120px, value = AP&E ID, react-native-qrcode-svg
- **Certifications:** 4 badges (MIC/REC/MIX/PA) in 1 row, earned only
- **Album Level System:** 
  - **BLACK:** 0–24% of 50 achievements
  - **SILVER:** 25–49%
  - **GOLD:** 50–69%
  - **PLATINUM:** 70–89%
  - **DIAMOND:** 90%+
- **Album display:** Text LEFT (level name + %), vinyl icon RIGHT 60×60px
- **Layout:** 16px card padding, 14px section gaps, 6px text gaps
- **Data model:** Users table adds first_name, last_name_initial, nickname

### Screen 11 — Settings (LOCKED)
- **Layout:** Scrollable single column, fullscreen
- **Sections:** 4 total (Notifications, Display, Accessibility, Account)
- **Visual theme:** Orange accent #ff6f22 for toggles
- **Toggles:** iOS-style, fully interactive
- **Behavior:** Immediate writes to Supabase, no Save button
- **Access:** From Dashboard header + Profile
- **Close:** X button top right
- **Notifications section:**
  - Push (master), Email (master)
  - Trophy Earned, Badge Earned, Quiz Unlocked
  - Method Complete (default OFF)
  - *(r18/F-6: "Study/Due date reminders" + "Course announcements" removed — no backing event)*
- **Display section:**
  - Dark mode (toggle)
- **Accessibility section:**
  - Font size: 4 options (13/16/19/24px)
  - High contrast (toggle)
  - Color-blind mode (Standard/Protanopia/Deuteranopia/Tritanopia/Monochrome)
  - Reduce animations (toggle)
  - Haptic feedback (toggle)
- **Account section:**
  - AP&E ID display (read-only)
  - App version display (read-only)

### Bottom Nav Dynamic Achievement Button (LOCKED)
- **Update trigger:** Real-time when achievement earned
- **States:**
  - BLACK: 0–24% of 50 achievements
  - SILVER: 25–49%
  - GOLD: 50–69%
  - PLATINUM: 70–89%
  - DIAMOND: 90%+
- **Only nav button that changes appearance over time**

### Album Level System Locked (ALL CONTEXTS)
- **Profile (Screen 10):** Text + vinyl icon display
- **Bottom Nav Achievements button:** Dynamic color change only
- **Data model:** Calculated from student_achievement_progress count / 50

### Media Placeholder Spec Locked (ALL STUDY METHODS + QUIZ)
- **Applies to:** Flashcards, Fill-in-Blank, Matching, Ear Training, Scenarios, Quiz
- **Dimensions:** Responsive 80% screen width, 4:3 aspect ratio
- **Position:** TOP of screen, 16px padding around block
- **Audio:** Album art + play/pause/replay controls below
- **Images/video:** Static display
- **Caption/title:** Area below media
- **No media:** Hide block entirely
- **Aspect ratio mismatch:** Center crop
- **Loading:** Transparent/invisible until ready

---

## NAVIGATION MAP (v3.7 — reconciled to two-threshold raw-count)

```
Splash (0)
  └─→ [valid session] → last used Dashboard topic directly
  └─→ [no session] → Login/Register (1)
        └─→ [sign in] → last used Dashboard topic directly
        └─→ [register] → Course Selection (3*)

Course Selection (3*) [carousel, locked=greyed+"Not Enrolled", returns to active position]
  └─→ [tap enrolled course] → Dashboard (4*)

Dashboard (4*) [loads to last known topic, LED meters current, no prompt]
  ├─→ [swipe topic title block LEFT] → previous completed topic (fully interactive)
  ├─→ [swipe topic title block RIGHT] → forward toward current topic
  ├─→ [swipe past current] → screen shake + double haptic (no navigation)
  ├─→ Topic # of # indicator always visible
  ├─→ Flashcards (2) ──┐
  ├─→ Fill-in-Blank (3)│  All method screens
  ├─→ Matching (4) ────┤  [<BACK] → Dashboard
  ├─→ Ear Training ────┤  Closed-book (no Glossary)
  ├─→ Scenarios ───────┘  Manual back on 100%
  ├─→ Quiz (6) [locked until all applicable methods=100%, glow pulse on activate; 25 questions, raw-count scoring server-side via submit_quiz RPC]
  │     ├─→ [24–25, genuine] → Trophy (8) [auto-advance; COMPLETE + studio privilege; next unlocks UNRESTRICTED]
  │     │     └─→ [Next] → Dashboard (4*) [next unlocked topic]
  │     ├─→ [20–23, genuine] → Results (7) [PASSED-INCOMPLETE; next unlocks CLAMPED; explicit clamp notice; no trophy]
  │     │     ├─→ [Retake for Trophy] → Quiz (6) [genuine]
  │     │     └─→ [Continue] → Dashboard (4*) [advances into clamped provisional topic]
  │     ├─→ [≤19, genuine] → Results (7) [no unlock; wrong answers + explanations]
  │     │     ├─→ [Retake Quiz] → Quiz (6)
  │     │     └─→ [Back to Dashboard] → Dashboard (4*)
  │     └─→ [any score, is_practice=true] → Results (7) [Practice Mode label; no progress/trophy change]
  │           ├─→ [Retake Quiz] → Quiz (6) [still practice]
  │           └─→ [Back to Dashboard] → Dashboard (4*)
  │     (is_practice=true only on already-COMPLETE 24+ topics)
  └─→ Glossary (17) [button in topic title block — closed-book during quiz/methods]
        └─→ [<BACK] → Dashboard (4*)

Bottom Nav (always visible):
  Home → Course Selection (3*)
  Study → Dashboard (4*)
  Achievements → All Achievements (5*) [dynamic color: BLACK/SILVER/GOLD/PLATINUM/DIAMOND]
  Profile → Profile (10)

All Achievements (5*) [course section labels, full 50-achievement grid]
  └─→ [tap earned achievement] → Trophy (8) [entry_source=achievements_grid]
        └─→ [Back] → All Achievements (5*)
  └─→ [tap unlocked achievement] → Trophy (8) [entry_source=achievements_grid]
        └─→ [Back] → All Achievements (5*)
  └─→ [tap locked achievement] → nothing

Achievement Gallery (9) [earned only, newest first]
  └─→ [tap trophy] → Trophy (8) [entry_source=gallery]
        └─→ [Back] → Gallery (9)

Profile (10) [fullscreen, zero scroll]
  └─→ Settings (11)
        └─→ [X] → previous screen

Dashboard Header
  └─→ Settings (11)
        └─→ [X] → previous screen

Deep Links (push notifications)
  └─→ Router layer → checks unlock status
        ├─→ Unlocked: navigate to target screen
        └─→ Locked: "Not available yet" → Dashboard
```

---

## BACKEND STATUS

### Supabase
- **Architecture:** Locked ✅
- **Schema:** Now **v2.4 — 17 tables** (curriculum-as-data + study-gate config + quiz integrity + multi-answer). v2.4 adds: `study_methods` gate config (min_engagement_seconds / requires_accuracy / accuracy_threshold), `student_method_progress` tracking (engagement_seconds / answered_count / correct_count / item_states), `quiz_attempts` integrity fields (focus_loss_count / focus_loss_duration / voided / void_reason), `student_achievement_progress.lockout_until`, and `quiz_questions` question_type + correct_answers JSONB. v2.3 added curriculum_versions (version-scoped); v2.2 added passed_incomplete + best_genuine_score. Legitimate line: v2.0 → v2.1 → v2.2 → v2.3 → v2.4. Publish/migration workflow still deferred.
- **Auth:** Supabase Auth (email+password) with handshake registration
- **Storage:** Supabase Storage bucket for profile photos + achievement icons (Phase 2)
- **Edge Functions:** Architecture locked — practice retake guards documented
- **RLS:** Defined per-table
- **Implementation:** **BUILT (CANDIDATE) to live project `yjgolswjggmlpeowvtxr` 2026-06-18 + integrity-tested (ALL PASS).** Schema applied verbatim from SCHEMA v2.10 (now effectively v2.11). RPCs `register_student v2` / `start_quiz_attempt v1` / `submit_quiz v8` + `grade_one` + `recompute_reachability` deployed. See `BACKEND_BUILD_RECORD_2026_06_18.md`.

### React Native
- **Framework:** Confirmed ✅
- **Development tool:** Cursor (AI-assisted)
- **New interactions confirmed:** expo-haptics (topic boundary double pulse + screen shake)
- **Implementation:** NOT yet started

---

## DEFERRED

- Glossary content population (MUSI190, AUDI201 xlsx files ready)
- Quiz question bank content per achievement
- Achievement content/metadata per course
- SQLite local cache schema (required before offline dev)

**NOT deferred — next up per Path B:**
- ~~Screen 12 Ear Training design~~ ✅ LOCKED June 16 (D-8 resolved)
- ~~Screen 13 Scenarios design~~ ✅ LOCKED June 17 (S13-A single-pass) — **UI phase complete (20/20)**
These precede Phase 2 backend.

---

## CANONICAL FILE SET & RETIRE LIST → SINGLE SOURCE

> **Removed from this file in r5 (Tier-3 dedup).** The canonical-set and retire lists used to be duplicated here, in `PROGRESS_TRACKER`, and in `PROJECT_FILE_INDEX` — three copies that drifted out of sync (the root cause of the staleness this audit fixed).
>
> **They now live in exactly one place:** `PROJECT_FILE_INDEX_2026_06_17_v7.md` — Section 1 (canonical set, classified 1A–1F) and Section 2 (retire list). Read that file first every session; it is the date-collision arbiter and open-items register (§4, incl. §4G conflicts / §4H stale-doc tracking).

---
*Project State v4.2 r17 — 2026-06-21 PM·4 (study-UX decisions promoted to LOCKED — IMPLEMENTATION_SPEC v2-r6 + APE_DASHBOARD_SPEC v1.1; glossary IMPORTED + 'video' migration applied to live DB; broader backend CANDIDATE). Canonical/retire lists owned solely by PROJECT_FILE_INDEX v18.*
