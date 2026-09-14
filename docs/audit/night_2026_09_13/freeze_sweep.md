# Freeze / Accumulation Sweep — night of 2026-09-13

Report-only audit of the two systemic performance-failure classes:

- **CLASS 1** — heavy synchronous work in a press handler, or immediately after the setState meant to show a busy indicator (so it can never paint).
- **CLASS 2** — accumulation over time: intervals/listeners/animation loops without cleanup; per-frame allocation churn in mic-driven paths.

Scope as briefed: study screens (FillInBlank, Matching, Flashcards, quiz/exam), glossary, careerfinder, achievements/awards, directory, calc workspaces, and the tool screens **except** `FrequencyCounterScreen.tsx` / `CenterLockTuner.tsx` (owned by another session — not audited here at all).

Measurement notes: pure modules were timed in Node 24 on the dev PC (desktop V8). On-device Hermes on a mid-range Android is typically **3–8× slower**; the per-case estimates say which basis was used. Modules that import React Native (`measurementStore`, screen files) cannot be bundled for Node — those costs are **estimated from data-size arithmetic**, and marked as such. The glossary pure functions were extracted verbatim into a scratchpad `.ts` and bundled with esbuild before timing (the screen file itself cannot be bundled), so the numbers measure the identical code, not a paraphrase.

---

## CASE LIST

### C1 — Saved Measurement Library hydrates by parsing every payload in one burst
- **File:** `C:\Users\profe\dev\ape-studio\src\features\tools\measure\measurementStore.ts:158-184` (`hydrate()`, the `rows.flatMap((r) => [JSON.parse(r.json)…])` pass)
- **Smell:** first touch of the library (opening `MeasurementLibraryScreen`, or the *first save from any tool after launch* — every mutator is hydrate-first, line 202) runs `JSON.parse` over **all** stored rows in a single microtask. Rows carry the full `data_payload`: the file's own header documents ~119 KB per Spectrogram/MultiMeter snapshot, and the cap is 200 records → worst case ≈ **20+ MB of JSON parsed synchronously** on the JS thread.
- **Cost:** estimated (module imports RN, not Node-bundleable). Rough arithmetic: Hermes parses JSON at very roughly 20–60 MB/s on mid-range hardware → **hundreds of ms to several seconds at or near the 200-row cap**; tens of ms for a small library. Because saves are hydrate-first, the burst can land inside the tick right after a tool's SAVE press — exactly the "busy indicator can never paint" shape.
- **Fix (one sentence):** hydrate metadata-only (id/title/created_at/tool_type columns) and lazy-parse each record's `data_payload` on first display/share, or chunk the parse across `InteractionManager`/`setTimeout(0)` slices.
- **Severity:** **freeze-risk** (at/near cap on a low-end device; jank-risk for typical libraries).

### C2 — `getMeasurements()` re-sorts and copies the whole list on every consumer render
- **File:** `C:\Users\profe\dev\ape-studio\src\features\tools\measure\measurementStore.ts:187-191` + `useMeasurements` (267-278)
- **Smell:** every render of any subscriber (the library screen re-renders per selection tap) filters, copies and sorts up to 200 records and returns a fresh array identity.
- **Cost:** small (≤200 items, string compare) — sub-ms desktop, low single-digit ms device — but it defeats memoization downstream by changing identity every render.
- **Fix:** memoize the sorted list inside the store and invalidate on `emit()`.
- **Severity:** hygiene.

### C3 — Glossary link index + id map built synchronously in the render after the corpus lands
- **File:** `C:\Users\profe\dev\ape-studio\src\screens\glossary\GlossaryScreen.tsx:1898-1899` (`termIndex = useMemo(buildTermIndex(entries))`, `entryById = useMemo(new Map…)`); `buildTermIndex` at 361-379
- **Smell:** first render after `setEntries(all)` (26,847 rows) runs `buildTermIndex` — two Maps + a Set + regex-normalizing every term — plus the 26k-entry `entryById` Map, inside one render commit.
- **Cost:** **measured 60.7 ms in Node** on a synthetic 26,847-term corpus (verbatim function extract; real terms are similar length). Estimated **~180–500 ms on device Hermes**, once per corpus load (session-cached corpus, so usually once per app session — and again after the background cache release at line 140-154).
- **Fix:** build the index off the critical render (idle chunking, or on first actual link render) so the first painted list isn't delayed by it.
- **Severity:** jank-risk (one-time hitch at glossary load; partially masked by the loading panel, but it lands right when the list should appear).

### C4 — Glossary search scan per keystroke over the full corpus (mitigated, kept on record)
- **File:** `C:\Users\profe\dev\ape-studio\src\screens\glossary\GlossaryScreen.tsx:2048-2083` (`visible` memo), `searchRank` at 341-350
- **Smell:** each (deferred) search value change ranks all ~26.8k terms — `searchRank` splits every term on a regex — then sorts the hits.
- **Cost:** **measured 4.7–7.8 ms in Node** for one full scan → est. **~20–60 ms device**, per settled keystroke. Already mitigated by `useDeferredValue` (PERF note 2026-09-05), so typing stays responsive; the scan still occupies the JS thread when it runs.
- **Fix (if it ever bites):** precompute `term.toLowerCase()` + token arrays once per corpus load instead of per scan.
- **Severity:** hygiene (mitigated; no change urged).

### C5 — Glossary `detailsRef` spread runs on every render
- **File:** `C:\Users\profe\dev\ape-studio\src\screens\glossary\GlossaryScreen.tsx:1367-1368` (`detailsRef.current = { ...detailsRef.current, ...details }` at component top level)
- **Smell:** an O(n-opened-terms) double object spread executes on *every* render of the 4k-line screen (scroll ticks, coach marks, search keystrokes), not only when `details` changes.
- **Cost:** trivial early-session; grows linearly with terms opened (each detail is a small record — tens of µs per render at 100 opened terms). Never a freeze; pure waste.
- **Fix:** move the merge into `putDetail` (which already writes the ref) and delete the render-time spread.
- **Severity:** hygiene.

### C6 — Quiz/Final-Exam 250 ms countdown re-renders the whole screen 4×/s
- **Files:** `C:\Users\profe\dev\ape-studio\src\screens\quiz\QuizScreen.tsx:216-225`, `C:\Users\profe\dev\ape-studio\src\screens\exam\FinalExamScreen.tsx:178-187`
- **Smell:** `setMsLeft` every 250 ms re-renders the full question screen for a clock that only displays whole seconds. Interval is properly cleared (both files); this is churn, not a leak.
- **Cost:** est. low single-digit ms per render (small tree) × 4 Hz for the whole timed sitting.
- **Fix:** tick at 1000 ms aligned to the deadline (or isolate the clock into its own component) — behavior identical, quarter the renders.
- **Severity:** hygiene.

### C7 — SPL Meter drives a 20 Hz whole-screen re-render for the text readouts
- **File:** `C:\Users\profe\dev\ape-studio\src\screens\tools\SplMeterScreen.tsx:1025-1035` (`setDisplayMeter(m)` inside the RAF loop, throttled to 50 ms)
- **Smell:** the needle path is correctly on SharedValues (no React), but the text mirror re-renders the 2,983-line screen at ~20 Hz while running. Deliberate (owner 2026-08-05 "snappier numbers"), and it device-passed — recorded so the design intent isn't rediscovered as a bug.
- **Cost:** est. a few ms per render × 20 Hz on device; the dominant steady-state JS cost of the screen.
- **Fix (only if the screen ever janks on device):** move the readout texts into a child component so the 20 Hz state lives below the SVG-heavy chassis.
- **Severity:** hygiene (accepted design).

### C8 — ToolsHub tile press timers are untracked
- **File:** `C:\Users\profe\dev\ape-studio\src\screens\tools\ToolsHubScreen.tsx:835-838` (60 ms press-out) and `:850-857` (90 ms activate → `onActivate(tool)`)
- **Smell:** neither `setTimeout` is stored/cleared; the 90 ms one calls `markToolNavigate` + `onActivate` and can fire after the hub unmounts (e.g. a tab switch racing a tile tap). Also a fixed 90 ms latency on every tool open (documented as deliberate, trimmed from 190 ms in rev 22).
- **Cost:** no accumulation (one-shot, short); a rare post-unmount navigate is the only exposure.
- **Fix:** keep the handles in a ref and clear on unmount.
- **Severity:** hygiene.

### C9 — Per-tick allocation churn in the mic-driven poll loops (bounded, on record)
- **Files:**
  - `C:\Users\profe\dev\ape-studio\src\screens\tools\MultiMeterScreen.tsx:462-530` — 12.5 Hz loop allocates `new Array(ENV_POINTS)`, `Array.from(avg)`, a 61-band array, and (every 2nd tick) a spectrogram column + history copy.
  - `C:\Users\profe\dev\ape-studio\src\screens\tools\hubPreviewEngine.ts:234-294` — shared hub tick allocates a frame object + waveform array + occasional spectro column per 80 ms.
  - `C:\Users\profe\dev\ape-studio\src\screens\tools\SpectrogramScreen.tsx:320-338` — 8 Hz column push copies the ≤HISTORY_COLS array.
  - `C:\Users\profe\dev\ape-studio\src\screens\tools\hubPreviewsLive.tsx:368,429,541,617` — SVG path strings rebuilt per spectro update.
- **Smell:** steady small allocations on hot mic paths. All are **bounded** (fixed-size rings/history, ~tens of KB/s total — order(s) of magnitude below the ~1 MB/s the Adv-Tuner soak found in the engine) and every loop has verified cleanup.
- **Fix:** none urged; if a future soak shows GC pressure, reuse preallocated buffers for env/column arrays.
- **Severity:** hygiene (observation).

---

## SWEPT AND CLEAN

Verification depth is stated per group. "Read line-by-line" = full or near-full read with handler tracing; "tally + spot-check" = every `setInterval`/`setTimeout`/`addEventListener`/`Animated.loop`/`withRepeat` site located by grep and its cleanup confirmed, plus targeted context reads.

**Study (read line-by-line):**
- `src\screens\study\FillInBlankScreen.tsx` — pace interval, advance timer, PanResponders all cleaned; `answer()` is O(1); `fibSentence` per question measured **2.2 ms Node** (est. ≤~15 ms device, question-cadence — fine).
- `src\screens\study\MatchingScreen.tsx` — flash-timer Set cleared on unmount; sync double-tap refs in place; board math trivial (`matchingSentenceV2` 0.16 ms Node).
- `src\screens\study\FlashcardsScreen.tsx` — T3 45 s timer, session timers, PanResponders cleaned; deck memo O(topic size); link regex built once per topic; term-list popups virtualized.
- `src\screens\study\ScenariosScreen.tsx` — advance timer + pace interval cleaned; synchronous answer latches present.
- `src\screens\study\StudyHeader.tsx`, `src\features\study\sync.ts` (StudySession: both intervals + AppState sub torn down in `stop()`, flush serialization sound), `src\features\study\localProgress.ts`, `src\features\study\sentences.ts` (measured), `src\features\study\api.ts` (per-render `studyDisplayPct` is O(items), fine).

**Quiz / Exam (read line-by-line):**
- `src\screens\quiz\QuizScreen.tsx` — countdown, AppState, BackHandler, advance timer all cleaned (C6 noted above).
- `src\screens\exam\FinalExamScreen.tsx` — verified as a faithful port with the same cleanups (C6).
- `src\screens\exam\FinalExamResultScreen.tsx` — render-only (tally-level).

**Glossary (read line-by-line):**
- `src\screens\glossary\GlossaryScreen.tsx` — beyond C3/C4/C5: the `useDots` interval, tabPress listeners (focus-scoped), auth-state sub, scroll-retry timers and search settle timer all have cleanups; the module-level AppState listener at line 142 is the **intentional** cache-release singleton (documented in-file); popup lists virtualized; FlatList `extraData` correctly memoized.
- `src\screens\glossary\GlossaryDictation.tsx` — recognizer stopped on unmount.
- `src\features\glossary\GlossaryLockView.tsx` (30 s interval cleaned — grep + context), `glossaryCap.ts`, `glossaryGateway.ts`, `deviceKey*.ts` (async RPC paths, no timers).

**Career Finder (read line-by-line for quiz/results; features fully read):**
- `CareerFinderScreen / CareerFinderQuizScreen (advance timer cleaned) / CareerFinderResultsScreen / CareerFamilyScreen / CareerFamilyListScreen / CareerFinderAboutScreen / kit.tsx` — `computeResult` is 28 answers × 42 families (trivial); the 1,902-title index (`careerIndex.ts`) decodes lazily **once** and `searchCareers` is a bounded linear scan.

**Achievements / Awards (read line-by-line: TopicsScreen, AchievementsHomeScreen, AwardsScreen ≤560, awards api; tally + structure: rest):**
- `AchievementsHomeScreen.tsx`, `TopicsScreen.tsx`, `CertificatesScreen.tsx`, `ProgramsScreen.tsx`, `GalleryScreen.tsx`, `CredentialWall.tsx`, `AwardProgressScreen.tsx`, `src\features\achievements\api.ts` (grouping over 171 topics — trivial), `src\features\awards\api.ts`, `src\screens\awards\AwardsScreen.tsx` (pager re-snap RAF fine; `enrollTopics` press handler is small-array store writes), `awardsData.ts`.

**Directory (handler-level skim + tally; no timers/listeners exist in these files):**
- `DirectoryScreen.tsx`, `AudioCommunityDirectoryScreen.tsx`, `ExploreView.tsx` (350 ms search debounce cleaned), `RequestsView.tsx`, `MyProfileView.tsx`, `directoryBits.tsx`, `src\features\directory\api.ts / rules.ts / legacyMigration.ts` — all async-RPC-shaped, small lists.

**Calc (read line-by-line: CalcWorkspaceScreen ≤260, WorkflowRun persist block; tally + structure: rest):**
- `CalcWorkspaceScreen.tsx` — compute memoized per (fn, values), not per keystroke; sync consume latch present. `CalcWorkflowRunScreen.tsx` — debounced persist + `beforeRemove` listener both cleaned. `CalcLabScreen.tsx`, `CalcWorkflowsScreen.tsx` (focus listeners unsubscribed), `CalcWorkflowEditScreen.tsx`, `CalcProjectsScreen.tsx`, `CalcResultsScreen.tsx`, `CalcSymbolsKeyScreen.tsx`, `FormulaKeyPopup.tsx`, `ReportCard.tsx`, `calcPanel.tsx`, `workflowStore.ts` (bounded JSON, damaged-row quarantine).

**Tools (tally + targeted context reads on every timer/loop site; SplMeter/MultiMeter/Spectrogram/Rta/Waveform hot paths read):**
- `SplMeterScreen.tsx` (C7 noted; interval/timeout/loop tallies all matched), `MultiMeterScreen.tsx` (C9; interval + AppState cleaned), `RtaScreen.tsx` (both intervals + savedTimer cleaned; save payload ≤31 bands), `SpectrogramScreen.tsx` (8 Hz poll cleaned; history capped), `WaveformScreen.tsx` (BackHandler + savedTimer cleaned; scope memo bounded ~15 SVG nodes), `SignalGenScreen.tsx`, `Rt60Screen.tsx`, `ExposureMonitorScreen.tsx` (store subscription returns unsubscribe), `MeasurementLibraryScreen.tsx` (FlatList + memo rows; store issues are C1/C2), `ToolsHubScreen.tsx` (C8; armed-delay timer cleaned), `hubPreviewEngine.ts` (shared tick focus+foreground gated, cleared, EMPTY emitted on teardown; dead-capture watchdog), `hubPreviewsLive.tsx`, `hubPreviewsSim.tsx` (loops stopped; advance timeout cleared), `SkinnedVu.tsx`, `SkinnedTunerVu.tsx` (withRepeat cancelled), `Spl3dGauge.tsx` (all three sweep/twinkle/density loops cancelled; 5 s sparkle hold timer cleared), `VuGlass.tsx`, `TileChassis.tsx`, `ToolDemoScreen.tsx` (mounts exactly one demo), `ToolDemoPreview.tsx`, `ToolLearnScreen.tsx`, `ConceptModuleScreen.tsx`, `ToolInfoScreen.tsx` (AppState sub removed), `ToolLockUi.tsx`, `ToolAcademyLock.tsx`, `ToolPreview.tsx`, `EngineGate.tsx`, `DspDebugScreen.tsx` (poll ref cleared on stop/unmount), `toolsData.ts`, `multiMeterDetect.ts`, `vuGeometry.ts`, `hubPreviewShared.tsx`.
- `src\features\tools\engine\useDspEngine.ts` — read line-by-line: 15 Hz poll interval, watchdog, focus/blur/unmount teardown, AppState sub all correct; generation counter prevents the leaked-interval race.
- `src\features\audio\exposureMonitor.ts` — module singleton interval strictly armed/disarmed by foreground+output gates; AppState listener intentional.
- Tool demo components `src\components\tooldemos\*.tsx` — **tally-level**: `Animated.loop` creations vs `.stop()` cleanups balance in all 7 files (HzCounter 3/4, Rt60 2/2, Rta 2/2, SignalGen 5/5, Spectrogram 2/2, Spl 3/3, Waveform 2/2); timeout in HzCounter cleared.
- Shared components touched by this scope: `SwitchButton.tsx` (idle flicker loop stopped on unmount; native-driver), `nav\NavIcon.tsx` (fader loops + excursion interval all stopped; `stopped` flag guards the chained sequence), `lib\useShake.ts` (accelerometer sub removed).

**Explicitly NOT audited (other session owns them):** `src\screens\tools\FrequencyCounterScreen.tsx`, `src\screens\tools\CenterLockTuner.tsx`.

**Measurement impossibilities, stated rather than guessed:** `measurementStore.ts` (imports RN — cost estimated from documented payload sizes, not timed); screen-level render costs (C6/C7) — no device attached to this session, so those are cadence×tree-size estimates; glossary numbers were timed on a verbatim extract because the `.tsx` cannot be Node-bundled.

---

## Counts

| Severity | Count | Cases |
|---|---|---|
| freeze-risk | 1 | C1 |
| jank-risk | 1 | C3 |
| hygiene | 7 | C2, C4, C5, C6, C7, C8, C9 |
