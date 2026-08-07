# AP&E — Governance & Decisions Log (2026-08-06)

Rulings of record from the v3-move / commercial-first dev cycle. Successor to
`APE_GOVERNANCE_DECISIONS_2026_07_23.md`; supersedes conflicting earlier notes.
Owner rulings issued in the Claude Code dev session, 2026-08-06.

## New rulings (owner, 2026-08-06)

### R1 — INSTITUTIONAL / COURSE MODEL: RETIRED
The old institutional (academic) mode and the entire COURSE model are retired.
Do not reason about `courses` / course `enrollment` / `public_courses` / the v2
bundled curriculum matrix (`courseTopicMatrix.ts`) as the live model. The app IS
the commercial app: `commercialMode` defaults ON at boot
(`config/flags.ts` `FLAG_DEFAULTS.commercialMode = true`). Institutional code
paths remain only as dead branches reachable via the dev logo long-press.

### R2 — v3 CURRICULUM IS THE LIVE CURRICULUM
The app runs on the **v3 curriculum** (curriculum_version `a7c1f2e0-…`, resolve
by `status='active'`): 171 topics organized **Field → Subject → Topic**
(`achievements.field` / `subject`; gs 3000+). The client fetches it at runtime
(`src/data/v3Curriculum.ts` — `fetchV3Curriculum` / `fetchV3Programs` /
`fetchV3Certs`). Browse (Enrollment), Curriculum, Certificate, and Program
screens all render v3. Programs/certs come from `programs`/`program_topics` and
`certificates`/`certificate_topics` (the `-v3` slugs).

### R3 — ENROLLMENT-DRIVEN ACCESS ("My Enrollments" is the master list)
A topic is studiable/quizzable when the student has it in **My Enrollments**
(`user_topic_enrollments`) AND the paywall passes (`always_free` OR
`has_academy_access`). **NO course enrollment, NO progression lock.** The app's
enrollment list syncs to `user_topic_enrollments` via the `sync_my_enrollments`
RPC (debounced, signed-in only; guests stay device-local). Study/quiz RPCs
(`record_study_progress`, `start_quiz_attempt`) branch on the v3 curriculum id;
the archived/institutional path is left byte-for-byte intact.

### R4 — STUDY-METHOD GATE RULES (replaced timer + accuracy)
Completion: **flashcards = each card SEEN once** (views≥1); **fill-in-blank /
matching / scenarios = each question answered CORRECTLY once** (correct≥1).
**NO timer gate.** `study_methods`: `min_engagement_seconds=0`,
`requires_accuracy=false`, `required_passes=1`. LED meters always show ≥1 lit
green segment.

### R5 — QUIZZES: NEVER GATED ON QUESTION COUNT (for v3)
Quiz content (24,000+ terms' questions + scenarios) is being authored and will
take weeks. Quizzes must NOT be blocked by having too few questions: for v3 the
attempt builds from whatever approved graded questions exist (0..30) and grows
as questions are added. The activation trigger's ≥25-question gate was removed
(kept the applicable_methods guard). **The LAUNCH gate — no launch until every
term has its questions — is the OWNER's, held manually, not a code gate.** The
archived path still requires the full 30.

### R6 — v3 CO-REQUISITE (core) TOPICS
Every certificate/program's shared co-reqs are: **Professional Audio Safety
(gs3060), Grounding & Shielding (gs3070), Electrical Power, Distribution &
Safety (gs3080), Workplace Skills (gs4370)**, plus the **Foundations lab** (a
lab, not a terms topic — surfaced via `FOUNDATIONS_LAB_ROUTE`). `COREQ_TOPIC_GS`
holds the four gs.

### R7 — FINISH THE v2 PURGE
Fully remove v2. Remaining consumers still importing retired v2 data for
topic-name lookups + cert/program counts (not the study flow):
`CourseSelectionScreen` (module-level consts — needs refactor), `ProfileScreen`,
`HomeSetupSheet`. After migrating those to the v3 fetch, DELETE
`src/data/courseTopicMatrix.ts` and the v2 `PROGRAM_PATHS` /
`SPECIALIZED_CERTIFICATES` / their types from `awardsData.ts`.

### R8 — v3 FREE TOPICS: PENDING OWNER DESIGNATION
No v3 topic currently has `always_free=true`, so free-tier users see no v3
topics. Owner will designate the free v3 topics; then set `always_free` on them
and switch the client from the hardcoded gs `[0,36]` free detection
(`isFreeEnrollGs`, enrollmentStore seed) to the flag.
