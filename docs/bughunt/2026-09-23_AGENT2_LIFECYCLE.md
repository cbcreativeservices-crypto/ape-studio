# Agent 2 — interruption / lifecycle / stalled waits (2026-09-23, overnight)

Raw findings. Verification by me appended at the bottom. Nothing acted on until
confirmed in source.

**Theme:** a request that HANGS is not one that FAILS. `try/catch` catches a
rejection; a promise that never settles is not caught, `finally` never runs, and
any loading flag set before it stays true forever. This is the same family as
the four freezes already shipped this month.

---

## A2-1 · The graded QUIZ submit is unbounded — the exam's twin was fixed, this was not · **LOSES DATA**
- `src/features/quiz/api.ts:247` (`submitQuiz`), used at `QuizScreen.tsx:161`, `:538-544`
- `doSubmit` sets `submitting = true`, awaits `submitQuiz` → `supabase.rpc('submit_quiz')`, no timeout.
- Screen renders bare ActivityIndicator + "Submitting…" forever.
- **The offline-queue rescue at `QuizScreen.tsx:216` is in the CATCH** — a stall
  never reaches it, so a completed graded attempt is never enqueued and is lost.
- `submitFinalExam` got `SUBMIT_TIMEOUT_MS = 25000` yesterday for exactly this;
  the identically-shaped quiz path was left alone.
- Escape: StudyStack sets `headerShown:false, gestureEnabled:false`
  (`StudyStack.tsx:33`), back interceptor skips this branch (`:362`) — on iOS the
  only exit is the tab bar.

## A2-2 · A stalled quiz replay hangs the whole Study tab
- `DashboardScreen.tsx:761` → `quiz/api.ts:302-319`
- `load()` sets `setLoading(true)` (`:753`) and its FIRST act is
  `await replayQuizSubmissions()`, looping queued rows through the unbounded
  `submitQuiz`. `.catch(() => [])` catches a rejection, not a stall, so the
  `finally` at `:927` never runs and the study rack spins forever.
- The exam replay two lines later (`:774`) is safe *because* submitFinalExam is
  bounded — same file, same shape, one fixed.
- **Fixed for free by A2-1.**

## A2-3 · Glossary silently stops opening terms — the LIVE metering path
- `glossaryGateway.ts:127` → `GlossaryScreen.tsx:1418`, `:1723`
- `gateDefinitionOpen` → `openViaGateway` → `fetchDefinitionViaGateway` →
  `supabase.rpc('get_glossary_definition')`, unbounded.
- `openPopupRoot` awaits it and sets NO loading flag, so a tap produces
  literally nothing — no popup, no spinner, no error.
- Retaps fire more un-deduplicated RPCs (`gateOpeningRef` guards only the
  non-gateway branch) → the weekly meter can be charged several times for one term.
- **Sharpest point:** `glossaryCap.ts` got `boundedRpc` covering
  `glossary_usage_status` and `glossary_consume` — but those are the FALLBACK
  meter. When `serverMeters` is true (`GlossaryScreen.tsx:1355`, and it is) the
  live path is this unbounded gateway RPC, affecting **every tier including
  members**, not just signed-in free users.

## A2-4 · Multi-Meter leaves the mic hot in the background during cold-open
- `MultiMeterScreen.tsx:818`
- Background-release fires only when `stateRef.current === 'running'`; a press
  during `'starting'` (documented 5–10 s Android HAL window) releases nothing —
  capture stays open with the OS mic indicator lit, contradicting the setting's
  own promise that "the mic stops immediately". `releasedForBgRef` stays false
  so nothing tears it down on return either.
- The identical bug was fixed in `useDspEngine.ts:373` on 2026-09-20 with a
  comment explaining why. MultiMeter has its own copy and was missed.
- Severity: privacy defect / breaks a stated setting.

## A2-5 · CALCULATE sticks on "CALCULATING…" permanently
- `lab/calcUsage.ts:123` (`consumeCalc`) → `CalcWorkspaceScreen.tsx:166`
- `setConsuming(true)` → unbounded `calc_consume` → `setConsuming(false)` with
  NO `finally`. Button `disabled={consuming}`, reads "CALCULATING…" (`:299`,
  `:303`) for the life of the screen. The answer was computed locally and ready.
- `calcUsage.ts` is a deliberate line-for-line mirror of `glossaryCap.ts` — it
  mirrored everything except the `boundedRpc` that was later added to the original.

## A2-6 · Community Explore spins forever, no error, no retry
- `directory/api.ts:305` (`searchDirectory`) → `ExploreView.tsx:73-75`
- `setBusy(true); await …; setBusy(false)` with no `finally`; the RPC is
  unbounded. The view's error state is only reachable from a RESOLVED
  `{status:'error'}`, so a stall shows a spinner with no message and no retry.
  The debounce keeps firing more unbounded searches behind it.

## Smaller, verified
- `settings/DeleteAccountButton.tsx:74` — `delete_my_account` unbounded,
  `setBusy(false)` only in `catch`. After the 5-second hold and final confirm the
  button goes permanently disabled with no message. `signOut()` at `:77` also
  unbounded. Legally-sensitive flow.
- `lab/labAudio.ts:63` → `useLabAudio.ts:86-88` — no `finally`; a lab's play
  button sticks on its loading state.
- `glossary/GlossaryTermPopup.tsx:72-87` — `setLoading(true)` then unbounded
  reads; popup sits loading (closable, so bounded damage).

## Confirmed already correct (not findings)
`getSessionSafe` (both), `glossaryCap.boundedRpc`, `submitFinalExam`,
`singleDevice`, `enrollmentStore`, `SplashScreen`. Lifecycle: `study/sync.ts`
(write-ahead before the background flush, serialised inflight),
`AudioOutputGate`, `exposureMonitor`, `useDspEngine`, `supabase.ts` — all handle
`'inactive' ≠ 'background'` correctly. Loops: `offlineCorpus.saveTerms` batches
and yields; `saveDefinitions`' per-row await is bounded by its callers; the 32k
`visible` filter is behind `useDeferredValue`. `ExamHold` now covers the exam
start-hold, so that was deliberately not re-reported.

## Inferred only, not chased
`buildTermIndex` (`GlossaryScreen.tsx:520`, called `:2011`) — synchronous single
pass over ~32k entries with per-row regex, inside a `useMemo` during render,
re-running after the 5-minute cache release. One-off block, not per-keystroke;
could not be measured from source.
