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

## ⚠️ TWO THINGS ONLY THE OWNER CAN CLOSE (both cost money or trust at launch)

**1. Does `glossary_study_v` return ZERO ROWS or an ERROR for a caller who is
not entitled?** — `src/features/study/api.ts:139-192`. `fetchTopicItems`
treats a gated-empty result as "view unavailable" and falls through to a
**legacy path that reads base `glossary` directly with no entitlement
filter**; the code's own comment concedes the base table is readable under
the column grants. If the view returns 0 rows for a non-entitled caller,
paid study content is being handed to free/lapsed/anonymous users. If it
errors instead, we are safe today and fragile tomorrow. **This cannot be
settled from the client** — it needs the view's definition.

**2. What status vocabulary does the `validate-purchase` edge function
write?** — `src/features/commercial/EntitlementProvider.tsx:108` accepts
`r.status === 'active'` and NOTHING else. If the function ever writes
`trialing`, `in_grace_period` or `in_billing_retry` — all normal App Store /
Play states — `academyTierFromRows` returns **`lapsed`** and a genuinely
paying subscriber is locked out of everything they bought. The only status
write visible in the repo uses `'active'`; the edge function itself is not in
the repo. Deliberately NOT loosened: guessing here could grant academy on a
status that legitimately means "not paid".

## Round 3 — the entitlement sweep (the most expensive bug of the night)

**A single failed entitlements read at boot locked a paying member out of
the entire app, for the whole run.** "Keep the current tier on a failed read"
is correct mid-session, but at boot the current tier *is* `anonymous` — so
one flaky network moment re-locked every tool, lab, paid topic and
notification, made Profile say "REFERENCE MODE", and left no way back short
of force-quitting. Fixed with a bounded, generation-counted retry that can
only ever RAISE the tier (commit `39d803a`).

Alongside it, the first-paint half of the same problem: Profile told members
their changes were device-only and offered to **sell them the membership they
already own**, while Settings said "ACADEMY — ACTIVE" and "See membership"
*in the same screen*.

### The capability ladder is mostly decoration — worth knowing before launch
Of the 7 capabilities in `caps`, **5 have zero consumers anywhere in `src/`**,
and the 2 live ones are display-only. Real access control runs on
`entitlement` / `isMember` directly (which is defensible and documented), but
`caps` currently reads like protection that does not exist. Two specifics:
- `caps.audioTools` gives `free` no audio tools, which **contradicts the
  owner's ratified 2026-08-05 ruling** that "Free accounts keep OPEN TOOL
  free". Anyone who wires this cap later would break that ruling.
- `caps.completionRecords` now has zero consumers; `caps.albumAchievements`
  hides a shortcut to a hub the bottom tab opens unconditionally for the same
  user.

Clean results worth recording: **every `__DEV__` bypass is genuinely
`__DEV__`-guarded** and cannot reach a release build; the weekly glossary and
calculator caps are consistently tiered (both fail OPEN on RPC failure —
the right call for a paid product, but it means a user who blocks the RPC
gets unlimited use).

## Round 3 — mechanical / static analysis (a different approach on purpose)

Agent review is one lens; these are checks a human reading code would never
do by hand. **Most came back clean, which is itself the launch signal we
want.**

| Check | Result |
|---|---|
| Duplicate ids in every lab registry (runtime, not regex) | **Clean** — 20 categories, 54 leaves, 47 route+param combos, 15 credit keys, all 5 module registries. The `mixing` collision fixed earlier was the only one |
| Every `navigate()` / `replace()` / `popTo()` target vs registered routes | **Clean** — 62 distinct targets, all 121 screens registered, **0 unknown** |
| Registered screens never referenced anywhere (the M20 "dead screen" class) | **Clean** — 0 orphans |
| `TODO` / `FIXME` / `HACK` markers | **0 in `src/`** |
| Committed secrets (`service_role`, `sk_live`, private keys) | **None**; only `.env.example` is tracked |
| Catalog credit keys vs `LabKey` union | **Match exactly** (15 = 15) |

### One real gap found this way

**`af_foundations`, `af_mic_principles`, `af_speaker_coverage` have no STATIC
`LAB_UNITS` entry.** I first read this as a launch blocker — those three are
seeded `is_active = true`, and the server needs every active fundamentals lab
for the gs3081 credit that gates all certificates. **It is not a blocker:**
`unitsFor()` falls back to `dynamicUnits`, and all three screens do call
`registerLabUnits(...)` on mount, which re-checks and fires completion.

The genuine residual: `retryUnsent()` runs at boot *before* any lab screen
mounts, so for these three it finds no unit set and cannot retry. A user who
finishes one of them **offline** and never reopens it never gets the
completion sent. Self-healing on any revisit. The clean fix is the pattern
already used by Patchbay and Connector Select — extract the step/section id
lists into React-free `units.ts` modules (the completion store is
boot-loaded and must stay React-free) and reference them statically.

### Gaps worth knowing

- **There is no lint tooling at all** — no ESLint config, no lint script, no
  lint dependency. Rules like `react-hooks/exhaustive-deps` are referenced in
  suppression comments throughout the code but nothing enforces them.
- **8 pure-logic modules have no test**, led by
  `src/screens/lab/meter/meterEngine.ts` (34 KB),
  `src/screens/lab/harmonicModel.ts` (14 KB),
  `src/screens/lab/wave/waveEngine.ts` (13 KB),
  `src/screens/lab/eq/modules/eqMath.ts` (7 KB),
  `src/screens/lab/gain/gainEngine.ts` (5 KB). These back member-facing labs
  that make numeric claims — the same shape as the "14 calculator outputs
  1000× wrong" bug from the 2026-09-01 QA night.

## Harness notes for next time

- The web preview's console **accumulates across navigations**, so a stale
  `TransformError` from a mid-edit state reads as a live failure. Compare
  message *counts*, or verify statically.
- **Two tabs on one origin stomp each other's localStorage** (documented, and
  it bit this run) — keep to one tab.
- Agents were told **not to commit**; the main session reviewed every diff and
  committed in logical batches. With six agents on one index that is the only
  safe arrangement.
