# Wave 2 — Launch-Blocking Functional Bug Audit

Date: 2026-09-09 · Scope: `src/screens/**`, `src/features/**`, `src/components/**`,
`src/lib/**`, `src/navigation/**` + boot path (`App.tsx`).
Method: read-only source review (main pass) + two focused sub-audits (all labs;
all tools/audio DSP). No source was modified.

## Headline

This codebase is **exceptionally defensive**. Effectively every `JSON.parse` is
wrapped in try/catch with schema-cleaning; every reviewed timer / listener /
mic session / animation frame is torn down on unmount; DSP math guards its
denominators (`sampleRate>0`, `Math.max(1e-12,…)` before `log`, `Number.isFinite`);
optional native modules go through `optionalModule`/`requireOptionalNativeModule`;
Supabase reads check `!error && data`; a `RootErrorBoundary` is mounted at the app
root. The study loop, quiz, results, entitlement ladder, and deep-link table are
all hardened.

No *crash-on-normal-use* defect was found. The real launch risks are two **boot
hangs** (unhandled error → stuck on a blank screen with no route forward) and the
**Final Exam** screen being a port of the topic quiz that never received two of the
quiz's later fixes. Everything else is low-severity / latent.

## Top 5

1. **Font-load failure hangs the app on a blank screen forever** — `App.tsx:92,185`.
2. **`getSession()` rejection hangs the app on the Splash screen forever** — `SplashScreen.tsx:32-34`.
3. **Final Exam has no "skip / unanswerable" fallback** — a malformed options payload strands the learner on the capstone until the 10-min force-submit — `FinalExamScreen.tsx:359-432`.
4. **Final Exam tracks selection by value string, not option index** (missing the quiz's C1 fix) — duplicate option text mis-selects / can soft-lock a matching question — `FinalExamScreen.tsx:68-71,218-251`.
5. **EarModule playback `setTimeout` never cleared** — setState after unmount (latent) — `EarModuleScreen.tsx:206`.

Counts: 8 findings — 0 high / 4 med / 4 low. Auto-fixable: 5 of 8.

---

## Findings

### [Sev: med] Font-load error is ignored → permanent blank-screen boot hang
`C:\Users\profe\dev\ape-studio\App.tsx:92` (and gate at `:185`)
- **What breaks / how hit:** `const [fontsLoaded] = useFonts(fontAssets);` destructures
  only the first tuple element, discarding the `error`. The render gate at line 185 is
  `if (!fontsLoaded) return <dark surface/>;`. If `useFonts` fails (a corrupt/again-missing
  font asset, OTA asset mismatch), `fontsLoaded` never turns true and `error` is never
  read — the app is stuck on a blank dark surface with no message and no way forward.
  Maximally launch-blocking because it is the boot path.
- **Fix:** `const [fontsLoaded, fontError] = useFonts(fontAssets);` and change the gate to
  `if (!fontsLoaded && !fontError) return <dark surface/>;` so a font failure falls through
  to render with system fonts instead of hanging (optionally log `fontError`).
- `auto_fixable: yes`

### [Sev: med] Splash `getSession()` rejection leaves the app stuck on Splash
`C:\Users\profe\dev\ape-studio\src\screens\SplashScreen.tsx:32-34`
- **What breaks / how hit:** `const sessionP = supabase.auth.getSession();` is created at
  mount and only awaited 2.5 s later inside the timer: `const { data } = await sessionP;`
  with **no try/catch**. `getSession()` normally resolves `{data,error}`, but it can reject
  when the session store fails — and the session store here is the native `expo-secure-store`
  keychain adapter (`lib/supabase.ts` notes it is a native module that only takes effect after
  a fresh build and can fail on device). If it rejects, the `await` throws, `navigation.reset(...)`
  never runs, and the app sits on the Splash screen forever (plus an unhandled rejection for the
  2.5 s the promise is un-awaited).
- **Fix:** Wrap the await in try/catch defaulting to the signed-out route
  (`const res = await sessionP.catch(() => ({ data: { session: null } }));`), so a session-read
  failure still routes to `Auth`.
- `auto_fixable: yes`

### [Sev: med] Final Exam strands the learner on a malformed question (no skip fallback)
`C:\Users\profe\dev\ape-studio\src\screens\exam\FinalExamScreen.tsx:359-432`
(compare `src\screens\quiz\QuizScreen.tsx:335-339,391,497-504`)
- **What breaks / how hit:** The topic quiz got fix **M3 (2026-09-07)**: when a question renders
  no answerable control (matching payload fails the shape guard → `matching` is null, or a
  single/multi payload whose `options` is not an array → `singleOpts` empty), it computes
  `answerable` and shows a **"Skip question"** button so the learner isn't trapped. The Final
  Exam is a deliberate port of the quiz but **never received M3**: its render (lines 359-432)
  has no `answerable` computation and no skip control. On a malformed capstone question the
  ScrollView shows only the question text with no controls and no way forward — the learner is
  stuck until the 10-minute timer force-submits (and a panic app-switch during that wait would
  VOID the attempt + 15-min lockout). Higher stakes than the quiz because a Final Exam is a
  once-per-award event.
- **Fix:** Port the quiz's `answerable` derivation and the `skipQuestion`/`!answerable` skip
  block into `FinalExamScreen` (record `''` for the slot and `advance()`).
- `auto_fixable: no`

### [Sev: med] Final Exam tracks selection by value string, not option index (missing quiz C1 fix)
`C:\Users\profe\dev\ape-studio\src\screens\exam\FinalExamScreen.tsx:68-71,218-231,233-251,377-424`
- **What breaks / how hit:** The topic quiz was refactored (**C1, 2026-09-07**) to track selection
  by **option index** precisely because "two options with the same display text must remain
  independently selectable." The Final Exam still tracks by the **value string**
  (`picked: string`, `multiSel: Set<string>`, `pairs: [string,string][]`, and React
  `key={opt}` / `key={v}`). When a served question repeats a display string:
  - `key={opt}` / `key={v}` produce duplicate React keys (reconciliation warnings / wrong cell state).
  - multi_select: `opts.filter((o) => multiSel.has(o))` (line 230) submits **all** copies and they
    cannot be toggled independently.
  - matching: `paired(value,0/1)` (line 236) treats both same-text cells as paired after one is
    paired, so `nextPairs.length` can never reach `k` (line 248) — the question **can never be
    completed** (which, combined with the missing skip above, strands the learner until force-submit).
  The submitted value format itself is correct (values match the quiz), so this is a client-side
  selection/soft-lock defect, triggered only by duplicate display strings.
- **Fix:** Port the quiz's index-based selection model (select by index, resolve to the value only
  at record time; key cells by index).
- `auto_fixable: no`

### [Sev: low] EarModule playback `setTimeout` is never cleared → setState after unmount
`C:\Users\profe\dev\ape-studio\src\screens\lab\eartraining\EarModuleScreen.tsx:206`
- **What breaks / how hit:** `onPlay` schedules `setTimeout(() => setPlaying(false), ms + 60)` but
  the id is never stored or cleared; the unmount cleanup (lines 171-175) only disposes the audio
  player. Starting a clip then leaving the screen before it ends fires the callback on an unmounted
  component. On React 19 this is a silent no-op (the old warning was removed), so it is not
  user-visible today — but it is a real uncleared timer.
- **Fix:** Store the id in a ref and `clearTimeout` it in the effect cleanup and at the start of a
  new play.
- `auto_fixable: no`

### [Sev: low] Unguarded `/(points-1)` denominator in shared waveform model math
`C:\Users\profe\dev\ape-studio\src\screens\lab\harmonicModel.ts:189` (same pattern in `envelopeModel.ts` adsr/shaped/speech curves)
- **What breaks / how hit:** `t = (i / (points - 1)) * cycles` yields `Infinity`/`NaN` if ever
  called with `points === 1`, which would propagate NaN into the drawn waveform and `crestFactorDb`.
  No in-scope caller passes 1 today, so it is **not currently triggerable** — flagged only because it
  is a real unguarded denominator in shared model code.
- **Fix:** `const denom = Math.max(1, points - 1);`.
- `auto_fixable: yes`

### [Sev: low] Exposure monitor drops the retro-credited first second from the daily total
`C:\Users\profe\dev\ape-studio\src\features\audio\exposureMonitor.ts:434` (vs `:443`, `:448`)
- **What breaks / how hit:** On session open, `session.activeSec` is seeded with `pendingSec` (the
  retro-credited first audible second), but the running daily total only does `d.activeSec += dt`
  (=1) on that tick and `d.energySum`/`d.dose` likewise integrate only that 1 s. So the first second
  of every session is credited to the session record but **never to the day's** `activeSec`/dose —
  contradicting the "first tick is retro-credited so no real listening time is lost" comment at :431.
  Effect: ~1 s per-session undercount of daily active time and a negligible dose undercount. Not a crash.
- **Fix:** Add the retro-credited seconds to the day on open (e.g. `d.activeSec += pendingSec` and fold
  the pending second(s) into `energySum`/`dose` using `lvl`).
- `auto_fixable: yes`

### [Sev: low] Trophy screen dereferences `topicName` param without a guard
`C:\Users\profe\dev\ape-studio\src\screens\results\TrophyScreen.tsx:85`
- **What breaks / how hit:** `{topicName.toUpperCase()}` crashes the render if `topicName` is ever
  undefined. It is always passed today (QuizScreen `doSubmit` → `navigate('Trophy', { topicName, … })`),
  and Trophy lives on the ROOT stack, so a future/edge caller navigating without the param would hard-crash
  this screen (caught by the RootErrorBoundary, but still a broken screen). Defensive gap only.
- **Fix:** `{(topicName ?? '').toUpperCase()}` (and similarly treat `questions.find` in
  `ResultsScreen.tsx:65` defensively if `questions` can ever be absent).
- `auto_fixable: yes`

---

## Verified NOT bugs (checked, correctly handled)

- Every `JSON.parse` in scope (study/quiz/notifications/settings/home/enrollment/careerfinder/
  directory/localProgress/workflowStore/measure) sits in try/catch or a promise `.catch`.
- `QuizScreen`: highlight/countdown/AppState timers all cleared; runtime shape guards on options;
  empty-questions and no-controls fallbacks present; hardware-back confirm.
- `EntitlementProvider`: never downgrades a member on a transient read error; scans for any active
  academy row (not `[0]`); `resolved` gate avoids a first-paint anonymous flash.
- `studyDisplayPct` guards `totalItems<=0`; `fibSentence`/`matchingClueV2` guard empty sentence pools;
  `MatchingScreen`/`FillInBlankScreen` use safe modulo indexing and folded trailing boards.
- Deep-link table (`navigation/linking.ts`) re-validates authority (`isAcceptedLink`) and try/catches
  `navigateToPath`.
- Tools/DSP: `useDspEngine` 12 s watchdog cleared in `finally` + generation counter; `micSession`
  restart races guarded; all hub/spectrogram/waveform/SPL polls clear intervals; SPL rAF has
  stale-frame handling.
- `optionalModule` uses a literal `require` in try/catch and keeps uninstalled packages on the
  dynamic path; `GlossaryDictation` (throwing native import) is loaded via a guarded `require`.
