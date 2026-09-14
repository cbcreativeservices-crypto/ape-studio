# Study + grading correctness audit — 2026-09-14

Bug-hunt over the study/quiz/exam/results path. Every claim verified in code.
`npx tsc --noEmit` clean and `npm test` green (1165 pass / 0 fail) after the fix.

Scope edited: `src/screens/exam/**`. Everything else read-only.

---

## CONFIRMED AND FIXED

### 1. Final Exam strands the learner on a malformed `matching` payload (missing M3 Skip)
**File:** `src/screens/exam/FinalExamScreen.tsx` (was line 392 `answerable`, and the
matching render block at line 469).

**What was wrong.** The Final Exam is a deliberate port of `QuizScreen` and the file's
header promises "a fix to one is obviously a fix to the other." The M3 malformed-payload
Skip fallback was ported in *name* but the `answerable` computation was not fully ported:

- Quiz twin (`QuizScreen.tsx:450-452`):
  `answerable = isMatching ? (!!matching && matching.lefts.length > 0 && matching.rights.length >= matching.lefts.length) : singleOpts.length > 0`
  and its matching block is gated `{isMatching && matching && answerable && (…)}`.
- Exam twin (before fix): `answerable = isMatching ? !!matching : singleOpts.length > 0`
  and its matching block was gated only `{isMatching && matching && (…)}`.

A matching payload whose arrays are **shape-valid but empty** (`lefts: [], rights: []`),
or with **fewer rights than lefts**, passes the `Array.isArray` shape guard, so
`answerable` was `true`. That suppressed the Skip fallback (`{!answerable && …}`) while
the matching block rendered controls that can never reach `nextPairs.length === k`
(`k = lefts.length`; with `k === 0` the `if (k > 0 && …)` submit branch is unreachable;
with `rights < lefts` the last term has no free right cell). The learner is stuck on that
question with no Skip and no way to advance — the whole capstone attempt is then lost to
the 0:00 force-submit. This is exactly the stranding class M3 was written to prevent, and
the quiz already handled it.

**How proven.** Static trace of both twins against the served contract (K lefts ↔ K rights):
for `lefts=[]` → `answerable` was `true`, matching block renders zero pairable cells,
`recordAndAdvance` never fires, `{!answerable}` Skip never shows. For `rights.length <
lefts.length` → same dead end (a leftover left term can never be paired). The quiz twin's
extra length predicates are precisely the guard that turns both cases into a Skip.

**Fix.** Brought `answerable` to parity (require `lefts.length > 0 && rights.length >=
lefts.length` for matching) and gated the matching render block on `answerable`, so a
malformed matching item now shows the "couldn't be displayed — skip it" fallback exactly
like the quiz. Comment added explaining the parity requirement. tsc clean, suite green.

---

## ATTACKED AND CLEAN

- **Rapid double-tap / double-count (all methods).** FillInBlank (`pickedRef` synchronous
  guard, `answer` FIB:293), Matching (`selectedLeftRef`/`lockedRef`/`wrongPairRef`,
  `pickRight` Matching:329-336), Scenarios (`answeredItemRef` on single/multi/sequence,
  Scenarios:290/303/320), Quiz/Exam (`selIdx !== null` + `submitted.current` latch). Each
  ref re-syncs from state every render, so a genuine second tap is preserved while a
  same-tick multi-tap is rejected. No path records two attempts for one decision.

- **Answer after unmount / advance-timer leaks.** FIB, Matching, Quiz, Exam all clear
  `advanceTimer`/`flashTimers` on unmount; Matching gates deferred flash work on
  `mounted.current`. No setState-after-unmount on the feedback hold.

- **Slow async landing after the question advanced.** Quiz/Exam record answers into
  `answers.current[slot]` keyed by `slot_index` (not by array position), so a late tap
  can't write into the wrong slot; `submitted.current` prevents the timer force-submit and
  a manual final advance from both firing.

- **Timer expiry racing a submit.** `doSubmit` guards on `submitted.current`; the countdown
  passes `deadline` as `submittedAtMs` so the server grades `timed_out` against the true
  deadline. Non-network submit failure releases the latch (Quiz:196, Exam:157) so a
  transient error is recoverable; the offline path stays queued and keeps its latch.

- **Grading progress banking (monotonic / wrong-topic class).** Client never banks quiz
  progress itself — `submitQuiz`/`submitFinalExam` are the sole authority and the screen
  only navigates on the returned outcome. Study events go through `record_study_progress`
  with a client UUID per batch (idempotent replay); `flush()` serializes on `inflight` and
  re-queues (never drops) on non-network rejection. `replayQueue` coalesces per
  (achievement, method) and drops only genuinely poisoned batches.

- **Resume state (wrong topic / lost position).** `mergeItemStates` takes the per-field
  **max** of server vs device mirror — never regresses `known`/`views`/`attempts`/`correct`
  and never sums them (so resume can't double-count). FIB/Matching partition
  `attempts < 2` first-then-rest, stable within session. Scenarios resume via
  `answersRef = {...hw.answers}` and `enterRound` seeks the first unanswered item.
  Local mirror keys are `${achievementId}:${methodKey}` and wiped on account switch.

- **Flashcards view/known credit.** View credit fires once per card per session
  (`viewedThisSession` Set, FlashcardsScreen:863-873). `toggleKnown` and the knownList
  reconcile effect both guard on `!states[id]?.known`, so a card is credited known at most
  once; flashcards completion counts distinct items, so even a hypothetical duplicate
  event can't over-fill the LED.

- **Unlock gate — `applicable_methods` not client-authoritative.** The quiz gate is
  enforced server-side (`start_quiz_attempt` raises `study_gate_unmet` /
  `safety_prerequisite_incomplete`); the client surfaces the error, it does not decide the
  gate. Scenarios exemption is only recorded on a *confirmed-empty* homework payload
  (`noContentReason` distinguishes empty vs load-error, Scenarios:224-242), so a transient
  load failure can't falsely satisfy the gate.

- **Scoring math / denominators.** Topic-quiz result has no `.size`; ResultsScreen renders
  `result.score / QUIZ_SIZE` (30), consistent with `DashboardScreen:714`. Final Exam reads
  server truth: `FinalExamScreen` derives `passMark`/`examSize` from `payload.size`
  (fallback `items.length`), and `FinalExamResultScreen` shows `result.size` /
  `result.pass_mark` verbatim — the two screens read the same server-declared size and
  cannot drift. `timed_out` vs `no_pass` are distinct server outcomes each rendered with
  its own copy; `wrong_answers` renders all three F4 shapes (string / array / [l,r] pairs).

---

## CONFIRMED BUT OUT OF SCOPE
None found. (Unlock-gate and dashboard-banking logic in `src/screens/dashboard/**` and
`src/features/dashboard/**` were read as part of surface #2/#3 and showed no client-side
gate authority; not edited per scope.)

## DEVICE-ONLY (not verifiable here)
- The Final Exam Skip fix is pure logic and covered by the static trace above; the actual
  gesture/scroll behavior of the rendered Skip button is a device-pass item.
- Focus-void (app-switch) voiding, the 250ms countdown cadence, and PanResponder swipe
  bypasses are runtime/device behaviors, not statically decidable.
