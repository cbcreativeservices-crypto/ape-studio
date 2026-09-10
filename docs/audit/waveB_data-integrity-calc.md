# Wave B — Data integrity + server-authoritative calculation (release-readiness QA, 2026-09-10)

Scope: DB constraints / duplicate guards, progress-%/achievement/certificate/
program/badge calculation correctness, client↔server divergence, stale data.
DB facts via read-only SQL; calc facts via a verified code review. One safe fix
applied (Profile overall %); everything else analyzed/filed. Backend frozen — no
DB changes.

## Headline
DB integrity constraints are **solid** (dedup + enum guards all present). One
**HIGH** calc bug (Profile overall % rendered >100%) — **FIXED** this wave
(safe, tsc+tests green). One **MED** client/server divergence for programs with
electives — filed (needs a server/contract change). Remaining items are LOW.

## DB constraints — GOOD (verified live)
- `credential_awards` UNIQUE (user_id, credential_type, credential_id) → no
  duplicate certificates/programs.
- `student_achievement_progress` UNIQUE (user_id, achievement_id); 
  `student_method_progress` UNIQUE (user_id, achievement_id, method_key);
  `student_badges` UNIQUE (user_id, badge_name_snapshot) → no duplicate progress/
  badge rows.
- `quiz_attempts` UNIQUE (client_attempt_id) + `attempt_status` CHECK enum;
  `final_exam_attempts` UNIQUE (user_id, client_attempt_id) + `award_type` CHECK →
  idempotent resume + dedup submission.
- `entitlements` CHECK (product='academy'), status ∈ {active,lapsed,revoked},
  source enum + UNIQUE (user_id, product).
(Note: `student_achievement_progress.status` has **no** CHECK constraint — not a
new issue; a CHECK wouldn't stop the Wave A forge, which uses the legit value.)

## FIXED this wave

### B-1 [HIGH→FIXED] Profile overall % rendered >100%
`src/features/profile/api.ts` computed `done / ALBUM_DENOMINATOR(50) * 100` against
a 166-topic curriculum, so >50 complete topics → >100% ("110% - Full Course
Certification"), unclamped at `ProfileScreen.tsx:561/568/1042` (only the bar width
was clamped). **Fix (commit baa7efb):** denominator is now the live v3 topic count
(queried on `V3_CURRICULUM_VERSION_ID`, active), result clamped to 100.

## FILED — owner / server

### B-2 [MED][client/server divergence] Program-with-electives progress under-reports
`award_required_topics(program, id)` returns **all** `program_topics` (electives
included) + standing co-reqs (verified: the program arm has no `is_elective`
filter). The client's `allComplete = completeCount === totalCount`
(`src/features/awards/api.ts:139`) therefore demands **every** elective, but the
server (`evaluate_user_credentials`) awards a program after all **non-elective**
topics + **≥1** elective. Effect: a user who is server-eligible (and may already
be auto-awarded) sees the AwardProgress checklist / "start Final Exam" gate as
incomplete. The **earned badge is still correct** (from `credential_awards`), so
this is under-reported progress, not a false grant. **Can't be fixed client-side**
— `award_required_topics` doesn't expose `is_elective`. Owner options: have the
RPC expose elective flags, or add a dedicated program-eligibility RPC.

### B-3 [LOW] Profile `completeCount` not v3-scoped
`fetchProfile` counts every `student_achievement_progress.status='complete'` row
(`src/features/profile/api.ts`), whereas the Achievements hub counts only v3-topic
completes. A stray non-v3 complete (sibling/legacy/lab-credit row) makes Profile's
"Topics completed" exceed the hub's topic count. Low likelihood post-v1-removal;
the B-1 clamp now prevents it from showing >100%. Proper fix: scope the count to
v3 achievement ids.

### B-4 [LOW] `required_passes` path is inert
`studyDisplayPct` ignores its `_requiredPasses` arg and the `rpFor` fallback of 2
never affects results (`src/features/study/api.ts:293,303`; `DashboardScreen.tsx:1171`).
Matches the server's current seen-once/correct-once rule, but a future server move
to multi-pass would silently not reflect client-side. Dead-but-latent.

### B-5 [LOW] "Nearest credential" ranking ignores standing co-reqs
`src/features/achievements/api.ts:227-237` ranks "closest credential" using only the
credential's own topics, not the Safety/Grounding/Workplace/Foundations co-reqs that
`award_required_topics` unions in — so the *chosen* nearest credential can be
sub-optimal. The displayed numbers for the chosen one are corrected via
`fetchAwardProgress`, so only the pick is slightly off.

### B-6 [LOW · by design] 100% topic meter before quiz passed
A topic with all four study methods at 100% but its quiz unpassed shows a 100%
study meter while `status` is still not 'complete' (`DashboardScreen.tsx:1206`).
Study-progress vs quiz-completion is intentional (quiz is a separate panel), but
the 100% meter beside an un-passed quiz can read as "done."

### B-7 [LOW · server-dependency] Credential display lags server awarding
The client reads `credential_awards` as authoritative and never calls
`evaluate_user_credentials` itself, so right after the action that completes a
cert's last topic, the cert appears only once the server awards it. Also:
Achievements screens refetch on focus but not on `onStudyProgress`, so a
credential/status change while an Achievements tab is already foregrounded waits
for blur/refocus. Minor.

## Verified CORRECT (not defects)
- **Topic-% shared formula** (`topicPct.ts` `topicOverallPct`/`methodDisplayPct`/
  `smoothMethodPct`): divide-by-zero guarded, single floor of the mean with
  un-rounded per-method values (prevents 99.5→100 early unlock), one helper shared
  by Dashboard + Enrollment (B-087 drift can't recur).
- **Topic-complete rule**: every screen reads server `status==='complete'` — never
  recomputes completion from method counts. No client/server completion divergence.
- **Method-sequence unlock**: staged model (flashcards → FIB+matching → scenarios →
  quiz) uses RAW method pct for gates (99.6% can't unlock); scenarios-exempt only on
  a confirmed-empty homework load (no stuck-quiz). 
- **Earned-credential counts + category totals**: from de-duplicated
  `credential_awards` / the 166-topic set — no double-count or off-by-one.
- **Focus-refetch staleness**: Dashboard refetches on focus + `onStudyProgress` +
  scenario-exempt; Achievements/Profile/AwardProgress refetch on focus.

## Filed items → owner
| ID | Sev | Action |
| --- | --- | --- |
| B-1 | HIGH | ✅ FIXED (baa7efb) |
| B-2 | MED | Server/contract: expose `is_elective` (or add a program-eligibility RPC) so the client's program progress matches the server award rule |
| B-3 | LOW | Scope Profile `completeCount` to v3 topic ids |
| B-4 | LOW | Remove/realize the inert `required_passes` path when the server rule is finalized |
| B-5 | LOW | Include standing co-reqs in nearest-credential ranking |
| B-6 | LOW | (optional) don't show 100% study meter until quiz passed |
| B-7 | LOW | (optional) refresh Achievements on `onStudyProgress`; accept award lag |
