# QA sweep — bug / nav / testing (2026-09-11, owner away)

Six agents in two waves plus a main-session pass, on branch
`audio-tools-engine`. **Every commit is `tsc` clean and 397/397 tests green.**

## The headline

**The 2026-09-07 app-navigation handoff is CLOSED.** All 21 of its
critical + major items (C1, M1–M20) were verified against live code and were
*already applied* — mostly by commits `84f7fd4` and `c72fd5a`. Nothing there
needs re-working. Two of its findings were simply **wrong**:

- **M9 / M20 (weekly-concept push "unwired")** — `attachWeeklyConceptPush`
  IS called, from `App.tsx` at the repo **root**. The finding came from a
  `src/`-only grep. (The same mistake was repeated at the start of this
  sweep before the verification pass caught it.)
- **M10 (public-glossary back no-op)** — `GlossaryScreen` does not render
  `StudyHeader`, so the described path is unreachable.

The 57 minors were all verified too: most already fixed, ~15 fixed tonight,
the rest deliberately skipped as owner decisions (recorded below).

## What actually got fixed (7 commits)

| Commit | What |
|---|---|
| `e09b294` | **Ear + Tuning labs: synchronous DSP burst** — same class as the null-test freeze |
| `3173533` | **Quiz M3 residual** — malformed matching payload stranded the learner |
| `a29c138` | **Cold-start reminder taps** landed at Home instead of the destination |
| `bbad2b3` | **Two web dead-ends in Auth** + quiz/exam/awards minors |
| `66db757` | **Glossary / directory / enrollment** — failed loads stop reading as empty |
| `ce19dfd` | **Duplicate `mixing` category id** (self-inflicted, 2026-09-11) |
| (earlier) `508c2a8` | AML null-test device freeze |

### The three that matter most

1. **The freeze class spread further than the mixing lab.** Measured in Node
   (a phone's JS thread is several times slower): ear-trial synthesis up to
   **112 ms**, retried up to 4× on a repeated key; the tuning lab's "A → B"
   renders two clips in one tick (**~106 ms**), a 7-note chord **~180 ms**.
   Both set (or failed to set) a rendering state in the *same tick* as the
   work, so it could never paint — the tap read as a frozen screen. Both now
   yield first. The ear lab's pre-rendered answer→NEXT path stays instant.

2. **Two Auth dialogs were no-ops on react-native-web.** The single-device
   takeover prompt never appeared (a second-device login looked like a dead
   Login button), and a signup whose access code failed created the account
   and then showed a dialog whose Continue was the *only* caller of
   `claimAndProceed` — stranding the user on the sign-in screen. Both now use
   the ratified `src/lib/confirm` shim.

3. **The quiz never received two submit-path fixes its Final Exam twin has.**
   A non-network submit failure left the double-submit latch set (a transient
   server error on a *finished* quiz was unrecoverable without unmounting),
   and a post-navigation state set was unguarded. Ported verbatim.

## Deliberately NOT done — owner decisions

- **Enrollment's `TAKE FINAL EXAM`** is a permanently inert primary button on
  both card shapes. Its label was corrected (it claimed it becomes "available
  when all topics are complete"; it stays disabled at 100%), but **wiring it
  is a product call**: route to `AwardProgress`, or hide it until the exam
  flow lands?
- **`SUBJECT_META_RATIFIED = false`** means every Curriculum subject expands
  with no description and no CAREER APPLICATIONS, for all users. Intentional
  and safely guarded, but it silently blocks a whole content surface pending
  your copy review.
- **Two mixing categories** now sit in TRAINING — the live one and the
  all-placeholder "Mixing & Production". Fold the placeholders in?
- **Profile vs Settings entitlement wording**: Profile collapses `free` and
  `anonymous` into "REFERENCE MODE" while Settings distinguishes "FREE" from
  "GUEST — NO ACCOUNT". Unifying it safely also needs Profile gated on
  `resolved`, or a paying member sees "GUEST" flash on every launch.
- **M7 Fix C (delete retired v1 catalog files): REFUSED.**
  `src/data/courseTopicMatrix.ts` and `src/data/course_topic_matrix_v2.json`
  still have live importers (`AwardsScreen`, `HomeSetupSheet`).
- **Certificate tier co-reqs, 3 vs 4**: the picker's sub-copy was
  self-contradicting and is fixed, but whether a tier needs 3 or 4 core
  topics is a curriculum ruling.
- **FIB on tiny topics** (<4 glossary items) renders a 1–3-cell answer grid;
  a 1-item topic hands over the answer. Fixing it means either a minimum-item
  gate (affects progress gating) or cross-topic distractors.

## New copy that wants your eye

- Auth email field in recovery mode: label becomes **"Email (code sent
  here)"** while locked.
- Results clamp notice now interpolates `QUIZ_PASS` instead of the hardcoded
  (and retired) **"Score 24+"**.
- Enrollment: **"Take Final Exam — not available yet"**.

## Filed, not fixed

- `QuizScreen`'s web submission queue is session-scoped and in-memory, so a
  reload before reconnecting loses a **finished** attempt. A warning now says
  so; moving it to persistent storage is a change on a graded path.
- `FinalExamScreen` lacks the quiz's clock-sync and start-error retry
  (reverse of the parity gap fixed tonight).
- `ResultsScreen` derives the score denominator client-side while the server
  returns the authoritative size elsewhere.
- `caps.albumAchievements` had **zero** consumers before tonight — a declared
  ladder capability nothing enforced. Worth a sweep.
- `MainTabs.tsx` docblock still says "Default tab = Study" while
  `initialRouteName="Home"`.

## Harness notes for next time

- The web preview's console **accumulates across navigations**, so a stale
  `TransformError` from a mid-edit state reads as a live failure. Compare
  message *counts*, or verify statically.
- **Two tabs on one origin stomp each other's localStorage** (documented, and
  it bit this run) — keep to one tab.
- Agents were told **not to commit**; the main session reviewed every diff and
  committed in logical batches. With six agents on one index that is the only
  safe arrangement.
