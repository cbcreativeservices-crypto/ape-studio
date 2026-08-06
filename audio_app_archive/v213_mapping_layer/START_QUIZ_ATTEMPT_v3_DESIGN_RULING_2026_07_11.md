<!--
CANONICAL FILE: START_QUIZ_ATTEMPT_v3_DESIGN_RULING_2026_07_11.md
STATUS: CANDIDATE design ruling — resolves the §4L open questions for commercial quiz support.
        Integrity-critical (grading/gating/progression are server-authoritative). NOTHING DEPLOYED.
        Companion to START_QUIZ_ATTEMPT_v3_CANDIDATE_2026_07_11.md.
KEY FINDING: PATH_B's "submit_quiz UNCHANGED / audience-agnostic" is INCORRECT (see §2). A ruling
        on approach is required before any v3 SQL is authored.
-->

# start_quiz_attempt v3 — Design Ruling (commercial quiz support)
**Pro Audio Training Academy · 2026-07-11 · CANDIDATE**

## 1. The engine as it actually is (verified from live DB)
- **Progression is enrollment-driven.** `register_student` inserts an `enrollment` row (SAFE course);
  the `seed_first_topic_on_enrollment` trigger seeds `student_achievement_progress` (status +
  `student_method_progress`) for that course's `sequence_in_course = 1` topic.
- **The clamp is `recompute_reachability(user, cv, course)`** — orders achievements by
  `sequence_in_course` **within `(curriculum_version_id, course_id)`** (the *academic* order), finds the
  contiguous-complete prefix, unlocks the next topic, and does the one-ahead unlock on a
  `passed_incomplete` (20–23) topic. It only ever unlocks (never re-locks).
- **`submit_quiz` (v8.3)** grades, sets `best_genuine_score = GREATEST(...)` (monotonic), derives
  status (complete / passed_incomplete / unlocked), fires trophies/badges, calls `unlock_after_safety`
  on the prereq, then calls `recompute_reachability(user, v_ach_cv, v_course)`.
- **`student_achievement_progress` is keyed `(user_id, achievement_id)`** — ONE row per achievement.
  So `best_genuine_score` + completion are inherently **shared** across any course that contains the
  topic (this is why cross-listing "just works"), but `status`/unlock is a single value and cannot
  simultaneously express "unlocked in course A, locked in course B".

## 2. KEY FINDING — submit_quiz is NOT audience-agnostic
PATH_B §4 assumed `submit_quiz` is "UNCHANGED … audience-agnostic." It is not:
```
SELECT e.curriculum_version_id INTO v_enr_cv FROM enrollment e
  WHERE e.user_id = v_user AND e.course_id = v_course;
IF v_enr_cv IS NULL THEN RAISE EXCEPTION 'not_enrolled'; END IF;
```
A commercial user with no `enrollment` row **cannot submit any quiz** — including the FREE topics
(gs0 Safety, gs36 DAW Skills) that the free tier is supposed to play *without* paying. It also
computes the clamp and the `passed_incomplete` sibling check over the **academic** course, not the
public-course sequence. So commercial quiz support is not a `start_quiz_attempt`-only change.

**Impact scope:** this blocks the FREE-tier commercial study→quiz→trophy flow, which is needed at
launch regardless of payments (payments only gate the *paid* topics).

## 3. Options (pick one — §7 decision)
**Option A — Reuse the engine via commercial enrollments.** On commercial signup / first course-open,
create `enrollment` rows so the existing triggers + `submit_quiz` + `recompute_reachability` run
unchanged. Pros: zero change to the integrity-critical grader. Cons: the clamp then follows the
*academic* `sequence_in_course`, not `public_course_topics.seq`; public courses don't map 1:1 to
academic courses (e.g. "Career and Business" spans several), and a free topic that isn't academic
`sequence_in_course = 1` (gs36 likely) wouldn't unlock without an extra direct seed. Academic status
rows become noise the commercial UI must ignore. Fit with PATH_B's public-course clamp: **poor**.

**Option B — Parallel commercial engine + minimal grader change (RECOMMENDED).**
- **Completion stays shared & audience-agnostic:** `best_genuine_score`, `status='complete'`,
  trophies, Album — all per-achievement, written by `submit_quiz` exactly as today. Keep.
- **submit_quiz change (surgical, integrity-preserving):** replace ONLY the hard `not_enrolled` guard
  and the academic `recompute_reachability` call with an **audience branch**: institutional →
  unchanged; commercial → skip the enrollment lookup, pin `curriculum_version_id` via a helper
  (§4.3), and call a new `recompute_reachability_commercial(user, public_course_id)`. Grading, clamp
  math, best_genuine_score, trophies — **untouched**.
- **New `recompute_reachability_commercial(user, public_course_id)`** — same contiguous + one-ahead
  logic as the original, but ordered by `public_course_topics.seq` within the public course.
- **start_quiz_attempt v3** — audience branch: commercial uses the public-course unlock + the free-topic
  Safety exception (gs0/gs36 startable pre-Safety, D4-a) + the entitlement precondition
  (`has_academy_access` for non-free topics). Optional `p_public_course_id` param (already ruled).
- **Seeding:** commercial free topics (gs0, gs36) seeded `unlocked` on signup/first-open;
  paid-topic unlock computed by the commercial recompute after each pass. (Lazy, no 51-row seed.)

**Option C — Fully separate commercial progress tables.** Cleanest separation, biggest build + a second
completion model to keep in sync with trophies/Album. Overkill; rejected.

## 4. Rulings on the §4L / spec-§4 open questions (under Option B)
- **4.1 Commercial progression rows:** lazy. Seed only gs0 + gs36 `unlocked` at signup; create other
  rows on first attempt; unlock derived by `recompute_reachability_commercial` from prior
  `public_course_topics.seq` topics' `best_genuine_score`. No 51-row seed.
- **4.2 Clamp:** one-ahead contiguous over `public_course_topics.seq` within `public_course_id`;
  cross-listed completion shared via the single progress row; free topics always startable; Safety
  prereq required for non-free paid topics.
- **4.3 curriculum_version_id:** pin commercial attempts to the current active curriculum version
  (single active version today) via a `current_curriculum_version()` helper; store it on the
  `quiz_attempts` row so `submit_quiz` scoring stays consistent.
- **4.4 submit_quiz:** CANNOT stay unchanged (see §2). Minimal audience branch per Option B — the only
  edits are the enrollment guard + the reachability call; all grading/scoring/threshold/trophy logic
  is byte-identical. This is the one integrity-sensitive edit and must pass a full institutional
  regression (byte-identical behavior for `audience='institutional'`).

## 5. What must be verified before authoring v3 SQL
- Confirm `unlock_after_safety` behavior for commercial (it's called on Safety completion; verify it
  doesn't assume enrollment).
- Confirm the `passed_incomplete` sibling-partial check can be scoped to the public course for
  commercial (currently academic-course scoped).
- Institutional regression harness: every existing smoke test passes byte-identical after the
  submit_quiz audience branch.

## 6. Not blocking, but note
Commercial *paid* quizzes also need the entitlement (payments, parked). But **free-topic** commercial
quizzes (gs0, gs36) need Option B to work and are launch-relevant now.

## 7. DECISION NEEDED (Prof. Booth)
Approve the **approach** before I author SQL:
- **Option B (recommended)** — parallel commercial clamp + a *surgical, audience-branched* submit_quiz
  (grader math untouched), or
- **Option A** — reuse academic enrollments (no grader change, but clamp follows academic order, not
  the public-course sequence), or
- **Hold** — leave commercial quizzes (incl. free topics) disabled for now.

*End — CANDIDATE ruling. On approval of Option B, I author: `current_curriculum_version()`,
`recompute_reachability_commercial()`, the commercial seed, `start_quiz_attempt` v3, and the surgical
`submit_quiz` audience branch — dev-verified against a full institutional regression before any prod go-ahead.*
