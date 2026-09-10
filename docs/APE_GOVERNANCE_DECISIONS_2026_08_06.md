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
(gs3060), Grounding & Shielding (gs3070), Audio Fundamentals Lab (gs3081),
Workplace Skills (gs4370)**. Completing every lab in the `audio_fundamentals`
area marks gs3081 complete. The Foundations of Sound lab (`FoundationsCourse` /
`af_foundations`) is one of those labs, not a fifth standing requirement.
`COREQ_TOPIC_GS` holds the four gs.

*(Amended 2026-08-30: gs3081 replaced Electrical Power, Distribution & Safety
(gs3080). The 2026-08-06 wording listed gs3080 plus a separate Foundations lab.)*

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

## Copy ratifications (owner)

### RC1 — COMPRESSOR & RF CALCULATOR COPY: RE-RATIFIED (owner, 2026-09-09)
The Test Expert night (2026-09-01) flagged two ratified-copy MATH errors; both
were corrected in code during that run and are now mathematically verified, and
the owner has RE-RATIFIED the corrected wording (this session, 2026-09-09):

- **Compressor Math** (`src/screens/lab/calc/workspaces/dynamics.ts`) —
  `whyItMatters` + `example`. Worked case: threshold −20 dBFS, ratio 4:1, input
  −8 dBFS → 12 dB over → 12÷4 = 3 dB passes → output −17 dBFS → **9 dB of gain
  reduction** (input − output). The earlier "3 dB of gain reduction" wording is
  gone; "3" now correctly names only the pass-through, "9" the gain reduction.
- **RF & Link Budget** (`src/screens/lab/calc/workspaces/micsRf.ts`) — `example`.
  550 MHz at 50 m: FSPL = 20·log₁₀(50) + 20·log₁₀(550e6) − 147.56 ≈ **61.2 dB**;
  with +10 dBm TX, +2 dB each antenna, −95 dBm RX → Prx ≈ **−47.2 dBm** →
  margin ≈ **47.8 dB**. The earlier ~10 dB-off figure is corrected.

Status: RATIFIED as-is. No code change — the strings are already live and
correct; this ruling closes the re-ratification item.
