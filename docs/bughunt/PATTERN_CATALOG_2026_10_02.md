# Bug Pattern Catalog — 2026-10-02 (Phase 1 of the pattern-based hunt)

**What this is.** For three weeks the app was fixed one bug at a time: roughly
950 fixes between 2026-09-12 and 2026-10-02. This document sorts those fixes
into the handful of *shapes* that keep producing them, and for each shape gives
a way to find every other place in the app where the same mistake could be
sitting. Phase 2 sweeps by shape, not by screen.

**Nothing was fixed while writing this.** Repo HEAD `23cef646`, branch
`audio-tools-engine`. No source changed; the candidate counts below were run
against that tree on 2026-10-02.

**How the counts were made (read this before trusting a number).**

- *Fixed-bug counts* come from the record: the 116 bug-pass regression test
  files in `test/` (`*BugPass*`, `*NightPass*`, `*FullRun*`, `*Toddler*`,
  `*BugHunt*`, `morningFixes*`, `*2026093x*`, `*20261001*`), which hold
  **1,154 describe/it titles**, one per fixed bug or sub-check. A keyword
  classifier sorted the titles into the patterns below (first match wins);
  212 titles did not match any pattern (mostly `describe` headers, template
  strings, and one-off accuracy fixes). The per-pattern figure is therefore
  **"regression-test titles that name this shape"**, an honest proxy for
  "fixed bugs of this class", not an exact ledger. Where a report gives a
  harder number (for example "about 15 places" or "about 25 places") it is
  quoted with its source.
- *Candidate-site counts* are ripgrep runs over `src/` (tests excluded).
  "Unverified" means the signature found the risky construct and did NOT find
  the house idiom in the same file. It is a worklist, not a bug count: some
  will be fine on inspection, and some real sites use an idiom the signature
  did not recognise (calibrated below where known).
- Sources mined: `docs/bughunt/BRIEF.md`, `docs/APE_BUG_HUNT_STANDARD.md`,
  `docs/APE_ENGINEERING_LESSONS.md`, `git log --since=2026-09-12` (1,093
  commits, 1,044 after dropping sync stubs), the test titles above, and the
  Downloads reports `2026-09-20_BUG_PASSES_SUMMARY`,
  `2026-09-23_OVERNIGHT_BUG_HUNT_FINAL_REPORT`, `2026-09-29_OVERNIGHT_SUMMARY`,
  `2026-09-29_EVENING_SUMMARY`, `2026-09-30_OVERNIGHT_SUMMARY`,
  `2026-09-30_DAY_BUG_PASSES_SUMMARY`, `2026-10-01_OVERNIGHT_NEW_LABS_AND_BUG_PASSES`,
  `2026-10-01_DRUM_LAB_AND_THREE_LAB_PASSES`, `2026-10-02_FULL_APP_BUG_RUNS_AND_PUBLISH`.

**The fixed-bug record by pass (from the reports and commit messages):**

| When | Pass | Fixes |
|---|---|---|
| 09-20 | three bug passes + three copy passes (`584a9954`…`a1e8e677`) | 15 verified findings fixed, plus the copy passes |
| 09-22/23 | three overnight hunts (`3b6dda27`) | 19 raised, 19 confirmed, 17 fixed |
| 09-27 | dashboard deep-clean (`1101132f`) | 20 |
| 09-29 | nine-area overnight hunt | ~130 |
| 09-30 | overnight toddler+cat (`f8b5a8f2`) | 138 |
| 09-30 | day passes 1–3 (`afd46b71`, `56dc5ef2`, `9f392572`) | 88, 82, 79 (incl. 10 corrections) |
| 09-30 | TestFlight 32 feedback (`98ac8547`) | 14 |
| 10-01 | night passes 1–3 (`3f7d0d32`, `049bf10d`, `6d7b3b93`) | 72, 66, 43 |
| 10-01 | toddler passes on Drum / Mastering / Room (`0d1f56ea`, `84d55652`, `03b10d16`) | 30, 23, 15 |
| 10-02 | full-app runs 1–2 (`5691609c`, `6cdca20b`) | 33, 49 (+4 corrections) |

Roughly 950 fixes. The counts went 138 → 88 → 82 → 79 → 72 → 66 → 43 → 33 → 49
across whole-app passes: falling, but never to zero, which is the reason for
changing strategy.

---

## The pattern table (summary)

| # | Pattern (plain words) | Fixed bugs (test titles) | Candidate sites now | Unverified | Severity | Risk rank |
|---|---|---|---|---|---|---|
| P1 | A failed storage READ is treated as "nothing saved yet", and the next save writes that emptiness over the real data | 43 (reports: "about 15 places" on 10-02 alone) | 77 files that both read and write AsyncStorage | **38** files | BLOCKER (data loss) | **1** |
| P4 | A sound start that is still in flight finishes AFTER a stop / leave / mute, so sound plays behind the user | ~150 (keyword-inflated; the 10-02 report says "about 25 places") | 54 files with a native start | **38** files without the stop-epoch idiom (some use a shared hook — see calibration) | BLOCKER (safety promise) | **2** |
| P3 | Work done under one identity lands under the next (no generation fence across the account wipe) | 77 | 35 hydrating stores; 82 files writing `ape:` keys | **21** stores without a fence; 32 writers with no reset/fence | BLOCKER (credit to the wrong person) | **3** |
| P7 | A network call with no deadline hangs a screen for ever | 47 | 62 files making network calls | **22** files with no deadline helper | MAJOR→BLOCKER (frozen flow, lost graded work) | **4** |
| P8 | Guest / preview / tier-unknown gating wrong (free answers, guest copy over real progress, "saved" to nobody) | 77 | 69 lab/feature files that persist | **38** with no tier word at all | BLOCKER (paid feature free; lost progress) | **5** |
| P5 | iOS: a popup opened while another popup is closing or open does nothing (Modal-over-Modal, 450 ms dialog fade) | 90 | 170 confirm/notify sites; 39 `navigate('Paywall'|'Settings'|'Help')` sites; 20 `presentation:'modal'` screens | 30 navigate sites not via `afterDialogCloses` (9 use it) | MAJOR (dead tap, stuck queue) | **6** |
| P6 | "Saved" / credit / success shown when the write failed or was never checked | 56 | 66 `void AsyncStorage.setItem`; 93 "Saved" copy sites; 179 `.catch(() => {})` | 66 + 93 to inspect | BLOCKER (lies about data) | **7** |
| P9 | Double tap / re-entrancy: two projects, two charges, two sends, a skipped question | 73 | 2,192 `onPress` handlers; 99 same-line navigate presses; 33 async presses | 4 files with async presses and no latch word; 99 navigate presses | MAJOR | 8 |
| P2 | A write lands before the store has loaded, or an older load lands after a newer one (no ticket) | 57 | 77 files with async effects; 35 hydrating stores | 12 async-effect files with no cancel/ticket; 21 stores (shared with P3) | MAJOR | 9 |
| P13 | Navigation law broken: a lab blocks NEXT/FINISH, two exits fire, BACK leaves the wrong thing, no "what's left" screen | 54 | 70 lab screens; 22 use `useLabNav`; 21 use `LabEndScreen` | ~48 lab screens not on the shared nav; 8 BackHandlers without a focus check | MAJOR (owner law) | 10 |
| P16 | Calculator numeric edges: negative, zero, unit mismatch, "0,500" parsed as 500, wrong gauge | 46 | 168 formulas; 769 divisions in calc; 6 `parseFloat/Number(text)` | 168 formulas minus 71 declared non-negative fields | BLOCKER (safety-grade numbers) | 11 |
| P10 | Timers, intervals, rAF and looped animations that outlive the screen or ignore Low-Light / reduce-motion | 27 | 183 setTimeout; 75 setInterval; 19 rAF; 24 `withRepeat` | 14 setTimeout files w/o clear; 5 rAF files w/o cancel; 14 `withRepeat` files w/o a motion gate | MINOR→MAJOR (Low-Light is a product promise) | 12 |
| P14/15 | Lab display text under 9 pt; cropped readouts that lose the number | 30 | 369 `fontSize: 9|10` (scale must be ≥1); 180 `numberOfLines={1}` | 14 literal sub-9 sites; 180 single-line texts to check for numbers | MAJOR (owner rule) | 13 |
| P17 | Float noise on whole-number results (65540 for 65536), 8991 frames for 9000 | 16 | 1,152 `toFixed(`; 21 `fmtInt` users | integer-valued outputs not through `fmtInt` | MAJOR (source of truth) | 14 |
| P18 | Copy that contradicts behaviour ("nothing is saved" while saving; "costs nothing"; a control that does not exist) | 13 (+ the 4 copy passes of 09-20) | 148 copy strings about saved/free; 161 "Tap X" strings | all | MINOR→MAJOR | 15 |
| P11 | setState / present / play for a component that is gone | 11 | 77 async-effect files | 12 | MINOR→MAJOR (crash on web, orphan popup) | 16 |
| P12 | Stale closure / wrong dependency (a cleanup that re-runs on every render) | 7 (one hit 15 labs) | 41 `useFocusEffect`; 10 cleanup-with-deps shapes | 1 real (`useDspEngine.ts:245`), rest guarded by test | MAJOR when it hits | 17 |
| P20 | Mic engine lifecycle (acquire during stop, orphan start, dead stream shown as live) | 12 | 36 acquire/release sites; 17 tool screens | single file `micSession.ts` + 17 screens | MAJOR (privacy, dead tool) | 18 |
| P19 | A control that changes nothing visibly | 3 (+ reviews) | 15 `onPress={() => {}}` (all scrim-swallowers, benign) | by review, not grep | MINOR | 19 |
| P24 | Unhandled promise rejection (haptics, speech, bare `void`) | 7 | 2 Haptics, 4 Speech without catch; 313 bare `void x()` | 6 + a sample of 313 | MINOR (red screen in dev; silent on device) | 20 |
| P21 | Android BACK closes the wrong thing | 0 by keyword (folded into P13/P5; ~12 by report) | 18 BackHandler sites; 9 Modals without `onRequestClose` | 8 + 9 | MINOR→MAJOR | 21 |
| P25 | Domain accuracy (physics, geometry, model) — real but not a code *pattern* | 46 | n/a | n/a | MAJOR (teaching product) | reviewed per lab, not swept |

Patterns from the owner's list that the evidence **merged or renamed**:

- "write before hydration" and "stale closures" were kept separate (P2, P12)
  but P2 absorbed "overlapping loads need a ticket" — same fix shape.
- "missing generation fences after account switch" (P3) is distinct from P2:
  P2 is time ordering within one identity; P3 is identity crossing. Both use
  the same counter, which is why they are often fixed together.
- "guest/preview/identity gating" (P8) overlaps P3 and P6 heavily; it is kept
  because its fix is a *policy* (`sessionCarry`, tier-known gating) not a fence.
- "controls that change nothing visibly" (P19) turned out to be almost always
  a review finding (expert/cognitive review), not a grep-able code shape — the
  15 no-op `onPress` sites are all deliberate scrim-tap swallowers.
- Added from the evidence: **P20 mic engine**, **P24 unhandled rejections**,
  **P21 Android BACK**, **P25 domain accuracy** (counted, not swept).

---

## P1 — A failed READ becomes "empty", then gets saved over the real data

**Symptom the user sees.** Credit, notes, saved rooms, favourites, the Home
card list, deck order, enrollments, the final-exam queue — all gone after an
ordinary reopen. Nothing errors. The data was there; one bad read (a storage
hiccup, a cold start under load) returned a failure, the store treated that as
"nothing saved yet", and the next ordinary save wrote the blank copy on top.

**Root cause shape.**

```ts
try { raw = await AsyncStorage.getItem(KEY); } catch { raw = null; }   // failure == absence
state = raw ? JSON.parse(raw) : DEFAULT;
hydrated = true;                                                      // and now saves are allowed
...
function commit(next) { state = next; void AsyncStorage.setItem(KEY, JSON.stringify(state)); }
```

**Real examples.**
- `src/features/dashboard/deckOrderStore.ts` — full run 2 (`6cdca20b`); test
  `homeShellFullRun2_20261001`: "Deck order: a FAILED read is never saved over the custom order by the next tap".
- `src/features/lab/labCompletion.ts`, `labVisits.ts`, `pagedProgress` — `sharedFullRun2_20261001`: "lab stores: a read that failed is not …; banked units survive a failed boot read".
- Amp / Tuning / Ear / Production project list — night passes 2–3 (`049bf10d`, `6d7b3b93`): "one failed read can no longer wipe Amp progress or the Production project list"; `labsBNightPass3_20261001`: "tuning progress: a failed storage READ is never written back over the chapters".
- Drum / Mastering / Room stores — toddler passes (`0d1f56ea`…`03b10d16`): "a failed READ never writes: the real copy survives every writer"; `masteringReadFailed`, `isRoomDesignStoreUnreadable`.
- Cymatics patterns + experiment ticks, Signal Detective solved set, Career Finder record, calc favourites/recents/workflows — `labsBFullRun1_20261001`, `calcFullRun1/2_20261001`, `communityCareersFullRun2_20261001`.
- The 10-02 report: "In about 15 places a failed read let the next save write an empty copy over the real one."

**House idiom (already in the codebase).** Three variants, all equivalent in
intent — *a failed read is not an empty read, and saves stay off until a read
succeeds*:
1. `readFailed` flag — `deckOrderStore.ts`: `catch { readFailed = true; hydrated = true; }` and `if (!readFailed) void AsyncStorage.setItem(...)`.
2. "stay unhydrated" — `labCompletion.ts`, `labVisits.ts`: `catch { hydrating = null; return; }` so `persist()` writes nothing and the next call re-reads and merges.
3. `tryLoad()` returning `null` for an unreadable store vs `[]` for empty — the production project store (`labsAFullRun2_20261001`: "tryLoad answers null for an unreadable store, the list otherwise"); `isRoomDesignStoreUnreadable()` in `src/features/roomdesign/roomDesignStore.ts:221`; `masteringReadFailed / masteringReadFromStore`.
Companion rule: a *damaged* (unparseable) blob is different again — it is
quarantined (renamed/kept) and the store starts empty, with saves allowed
(`calcFullRun1_20261001`: "a genuinely damaged blob is still quarantined, then starts empty").

**Detection signatures (run 2026-10-02).**
- `rg -n 'AsyncStorage\.getItem\(' src` → **117 sites in 78 files**.
- Files that both read and write storage (the only place the overwrite can happen): **77**.
- Of those, files with none of the idioms (`readFailed|Unreadable|unreadable|tryLoad|readOk|loadFailed|readError|read failed|READ failed|hydrating = null|stay unhydrated|readBlocked`): **38** — list in the Phase-2 worklist (`attemptDraft.ts`, `exposureMonitor.ts`, `celebrationSeen.ts`, `soundSafetyAck.ts`, `permissionStore.ts`, `deviceIdentity.ts`, `attractStore.ts`, `accountLocalSync.ts`, `enrollmentStore.ts`, `enrolledBundlesStore.ts`, `flaggedStore.ts`, `calcUsage.ts`, `popupSuppressStore.ts`, `academyStats.ts`, `bigPicturePref.ts`, `quiz/api.ts`, `CenterLockTuner.tsx`, `firstOpen.ts`, `reviewPrompt.ts`, `settings/store.ts`, `lowLight.ts`, `localProgress.ts`, `lastStudyLocation.ts`, `soundsystems/progress.ts`, `paceStore.ts`, `deviceProfile.ts`, `calibrationStore.ts`, `scenarioExempt.ts`, `scenarioQueue.ts`, `measurementsBackend.ts`, `termsExempt.ts`, `CableLabScreen.tsx`, `AwardsScreen.tsx`, `AuthScreen.tsx`, `DashboardScreen.tsx`, `ExperimentWell.tsx`, `FoundationsCourseScreen.tsx`, `MicSelectLabScreen.tsx`, `mixing/kit.tsx`, `RackUnit.tsx`).
  Note: some of these were fixed under a different wording (enrollment/bundles stores were fenced for hydrate races in `studyFullRun2_20261001`, but that is P2, not P1 — a failed read there still needs checking).
- Catch blocks that return an empty value: `rg -U 'catch(\s*\([^)]*\))?\s*\{\s*(//[^\n]*\n\s*)*return (\[\]|\{\}|null|undefined|false|0|\x27\x27);'` → **100 sites** (includes legitimate ones; use as a secondary list).
- SQLite reads (`getAllAsync|getFirstAsync`): 0 in `src/` (the queues go through their own module; check `replayChunk.ts` / queue stores by hand).

**Verification checklist for a sweeper.**
- CORRECT: the read's `catch` sets a distinct "unreadable" state (flag, `null`, or stays unhydrated); every writer checks it and writes nothing (or merges after a later successful read); the UI, where it shows a list, can say "could not be read, not lost" rather than "empty".
- CORRECT: a *parse* failure (damaged blob) is handled separately: quarantined, then treated as empty with saves allowed.
- BUGGY: `catch` yields the same value as "key absent"; `hydrated = true` is set regardless; any `setItem` can run after a failed read.
- BUGGY-LITE: the read is wrapped in `softDeadline`/fallback that returns the default — same effect.

**Risk.** Severity BLOCKER (irreversible user data loss) × 38 unverified files = **rank 1**.

---

## P4 — A sound start still in flight finishes AFTER stop / leave / mute

**Symptom.** Tap ▶ then quickly ■ (or leave the screen, press Home, shake to
mute): the tone, clip or replay starts anyway, or ■ stays lit over silence, or
the lab goes silent while showing ■. In the worst case sound plays while the
user is in another app with "Mute audio when I leave" OFF.

**Root cause shape.** Native starts are async (`await genStart(...)`, a signed
URL fetch, `await setAudioModeAsync`). The gate is checked BEFORE the await and
never again after it, so a stop that happened during the await is lost:

```ts
if (!isAudioOutputEnabled()) return;
await player.load(url);           // user pressed ■ / left / muted here
player.play();                    // plays anyway
```

A second shape (the dead Bass ▶, `b2660894`): a focus-effect cleanup depended
on `stop`, which changed identity on every render, so the tap's own re-render
ran `stop()` and cancelled the start it had just begun — in 15 labs.

**Real examples.**
- `b2660894` "FIX the dead Bass ▶: a re-render cancelled every start (and the same trap in 14 labs)" → `useStopOnBlur` / `useStopOnClose`.
- `labsAFullRun2_20261001`: "Labs A: every native start re-checks the sound-stop epoch after it resolves; no top-level lab file with a native start escapes the list".
- `sharedFullRun2_20261001`: "LabAudioPlayer.play() honours a leave-the-app stop that lands during its awaits — the stop epoch is read before the first await and checked with the gate".
- `labsBFullRun1_20261001`: "a tone start in flight when every sound is stopped (leave the app, mute-on-leave OFF) never sounds on"; `toolsFullRun1_20261001`: "Signal Generator: stopAllSound during an in-flight genStart stops it".
- Day passes: "▶ ■ ▶ silence (Foundations, Playground, EQ, Cymatics)"; "a superseded start stops the generator only while the last act was a stop" (`bugPassLabsGroupA20260930c`); "Mastering STOP did not cancel a pending replay" (`3f7d0d32`).
- The 10-02 report: "fixed in every lab and tool that makes sound (about 25 places), plus lab clips and the signal generator".

**House idiom.**
- `getSoundStopEpoch()` in `src/features/audio/audioOutputStore.ts:191` — read the counter before the first `await`; after it resolves, `if (epoch !== getSoundStopEpoch() || !isAudioOutputEnabled()) { stop; return; }`. 51 call sites today. `signalSoundStopped()` bumps it from `stopAllSound()` (`panicMute.ts:36`).
- `useStopWhenSilenced(running, stop)` in `src/features/audio/useStopWhenSilenced.ts` — unwinds the screen's own transport on the gate's falling edge AND on the epoch (26 files).
- `useStopOnClose(stop)` / `useStopOnBlur(stop)` in `src/features/audio/useStopOnBlur.ts` — cleanup reads the latest `stop` from a ref; never `useFocusEffect(() => () => stop(), [stop])` (25 files). One-owner rule via `labOutputOwner.ts`.
- Per-start generation / "only the newest press owns the player" (`useDrumPlayback`, `soloPair.ts`, `earPlayer` per-play token).
- Guards already pinning parts of this class: `test/labSoundPolicy20260929.test.ts` (every screen that starts lab sound joins the one-owner rule; no blur-stop outside exceptions), `test/labSoundAudit20260929.test.ts` (no effect cleanup stops sound AND re-runs when `stop` changes), `test/labsAFullRun2_20261001.test.ts` (every top-level Labs-A file with a native start re-checks the epoch), `test/muteAudioOnLeave20261001.test.ts`.

**Detection signatures (run 2026-10-02).**
- Native/lab start sites `rg 'genStart\(|startTone\(|playNote\(|renderAndPlay\(|\.play\(\)|startVoice\(|startGenerator\(|\.start\(\)' src/screens/lab src/features/audio src/features/tools src/screens/tools` → **106 sites in 54 files**.
- Of those files, without `getSoundStopEpoch|soundStopEpoch`: **38**. Calibration: the drum-tuning chapters route through `useDrumPlayback.ts`, which re-checks `isAudioOutputEnabled()` after the await (line 220) but does NOT read the epoch — so with mute-on-leave OFF the epoch is the only signal, and this is a real candidate, not noise. Likewise `useRecordedPlayback.ts`, `micSession.ts`/`useDspEngine.ts` (tools), the three Cymatics studios, `octaveElevator.tsx`, `AmpRig.tsx`, `TubeCardScreen.tsx`, `PatchPairView.tsx`, `LabShell.tsx`.
- Files with a start and NONE of the stop hooks (`useStopWhenSilenced|useStopOnClose|useStopOnBlur|getSoundStopEpoch`) in `screens/lab` + `screens/tools`: **32 of 48**. Many are sub-components whose host screen holds the hook — a sweeper must check the host.
- `isAudioOutputEnabled()` re-check sites: 44 — compare against the 106 starts.
- The multi-line `await …; …play()` shape: `rg -U 'await [^;]*;\s*[^;]*\.(play|start)\(' <file>` per candidate.

**Verification checklist.**
- CORRECT: the start reads `const epoch = getSoundStopEpoch()` before its first `await`; after every `await` it checks `epoch === getSoundStopEpoch() && isAudioOutputEnabled()` (and the screen's own focus/generation if it has one) and otherwise stops/disposes what it loaded; the screen calls `useStopWhenSilenced(running, stop)`; the unmount stop is `useStopOnClose`/`useStopOnBlur` (never a `[stop]`-deps cleanup); a per-press generation makes the newest press the owner.
- BUGGY: any gate check only before the await; a `.play()` reached from a `.then`/after-await with no re-check; a `useFocusEffect` cleanup that calls `stop` and lists it in deps; a replay timer armed before a stop with no epoch captured.

**Risk.** BLOCKER (sound behind the user is a safety promise; sound after mute) × 38 files = **rank 2**. Architectural fix proposed in §Architecture (A1).

---

## P3 — Work crosses identities: no generation fence across the account wipe

**Symptom.** Person A signs out, person B signs in on the same phone and sees
A's Sound Systems pages, Career Finder answers, celebration list, enrollments,
popup settings, paid glossary definitions; or A's lab credit is written to B;
or B's wipe deletes a store that then re-persists A's rows from memory.

**Root cause shape.** A store's async read or server sync was started under
identity A; `clearLocalAccountData()` + `resetAllLocalStores()` run; the read
lands later and writes A's data into memory / disk / the server under B.

```ts
const raw = await AsyncStorage.getItem(KEY);   // wipe happens here
state = JSON.parse(raw); hydrated = true;      // A is back
```

**Real examples.**
- `studyToddlerPass2`: "enrollment: a hydrate in flight across resetLocal never restores the previous user"; same for deck order, enrolled bundles, last study location (`56dc5ef2`).
- `studyNightPass1/2_2026_10_01`: "ensureStudyTopic survives an account wipe mid-hydrate — captures the generation before awaiting and bails if it moved"; "the enrollment server sync is fenced across an account wipe".
- `labsAFullRun1_20261001`: "Sound Systems page memory never crosses to another account — the session map is dropped when the ledger epoch moves".
- `communityCareersFullRun2_20261001`: "celebrationSeen — a load straddling an account change is not kept"; `accountFullRun2`: "popup suppression: a reset emits to mounted hooks and fences an in-flight hydrate".
- `accountNightPass2`: "the account wipe sweeps again after the SQLite clear, closing the re-persist window"; `calcNightPass3`: "a save carrying a pre-wipe mount generation is dropped".
- Glossary: "paid definitions could reach the next account after a mid-read sign-out" (`3f7d0d32`); `glossaryBugHunt20261001a`: "every async read is fenced by the reader generation".

**House idiom.**
- A module-level `let generation = 0;` bumped by the store's `resetLocal()`; every async path does `const gen = generation;` before the first `await` and `if (gen !== generation) return;` after each one, *before* any state or cache write (`deckOrderStore.ts:34`, `workflowGeneration()` in `calc/workflowStore.ts:41`).
- Every store's reset is registered in `resetAllLocalStores()` (`src/features/account/clearLocalAccountData.ts:249`; 34 resets today) — a store not on that list is not wiped in memory at all.
- `KEEP` allow-list (`clearLocalAccountData.ts:62`) for device preferences that must survive; `test/accountWipeRegistry.test.ts` guards the registry.
- Identity ledger for lab work: `src/features/lab/sessionCarry.ts` (`epoch`, `owner`, `syncPending`) — see P8.
- Guard tests already pinning parts: `accountWipeRegistry.test.ts`, `progressReadIsScoped.test.ts`, `usersReadIsScoped.test.ts`.

**Detection signatures (run 2026-10-02).**
- Stores with a `hydrated` flag: **35**; without `generation|epoch|ticket|gen`: **21** (`ProfileScreen.tsx`, `CareerFinderScreen.tsx`, `AuthScreen.tsx`, `CareerFinderQuizScreen.tsx`, `MyProfileView.tsx`, `onboardingFlow.ts`, `FirstRunCoordinator.tsx`, `calibrationStore.ts`, `clearLocalAccountData.ts` (itself), `myUserRow.ts`, `flaggedStore.ts`, `amplitudeOrientation.ts`, `labCompletion.ts`, `labVisits.ts`, `soundsystems/progress.ts`, `lowLight.ts`, `study/api.ts`, `sessionRetry.ts`, `scenarioHomework.ts`, `CableInstallLabScreen.tsx`, `roomdesign/labCtx.ts`). Calibration: `labCompletion`/`labVisits` rely on the "stay unhydrated + merge" idiom and the sessionCarry epoch; still worth a look because the read itself is unfenced.
- Files writing an `ape:` key: **82**; with no `resetLocal|reset*(|generation|epoch|KEEP` mention: **32**.
- Module-level import-time reads (`^void (hydrate|load|init|read)\w*\(\);`): **5** — these race the boot identity check by construction.
- Cross-check: every `reset*` exported by a store should appear in `resetAllLocalStores`. Run 2026-10-02: **41 exported `reset[A-Z]*` functions vs 34 calls inside `resetAllLocalStores`** — up to 7 stores whose in-memory copy is never reset on an account switch (some may be reset by a parent reset or be non-user state; each needs a one-line verdict). This is the first concrete P3 worklist and the seed for guard G2.

**Verification checklist.**
- CORRECT: store exports `reset*()` that bumps a generation and clears memory; it is called from `resetAllLocalStores()`; each async path captures the generation before the first `await` and re-checks before every write (memory, disk, server, cache); caches are written AFTER the stale check; a server pull neither adopts the departing rows nor latches for the next identity.
- BUGGY: `hydrated = true` after an await with no fence; a `.then(setState)` with no fence; a server sync with a retry timer that survives the wipe; a user-scoped `ape:` key not swept and not in `KEEP` (either is a decision — unknown is the bug).

**Risk.** BLOCKER (credit/paid content to the wrong person; data loss on the second sweep) × 21 stores + 32 writers = **rank 3**.

---

## P7 — A network call with no deadline freezes a screen for ever

**Symptom.** A spinner that never ends and never errors: LOGIN, CREATE
ACCOUNT, Restore, redeem, the glossary term popup, the quiz submit (which also
LOST the graded attempt), Delete Account, "Loading the conversation…". Airplane
mode does not show it; only a stalled connection does.

**Root cause shape.** `await supabase.rpc(...)` / `.from()` / `auth.*` with
no race against a timer. A promise that never settles never reaches `catch` or
`finally`, so the loading flag stays on.

**Real examples.**
- 09-23 hunt: "seven instances of one shape … glossary meter, exam submit, quiz submit, glossary gateway, CALCULATE, community search, Delete Account — hand-copied six times and drifted" → `src/lib/boundedCall.ts`.
- 09-22: the `getSession()` sweep that missed six multi-line sites including the boot read → `safeSession` in `src/lib/getSessionSafe.ts:55`; guard `test/authReadsBounded.test.ts`.
- `accountNightPass1_20261001`: "every auth WRITE is bounded and a stall reads as the offline error"; "restore and finishTransaction cannot hold the paywall spinner forever".
- `glossaryFullRun2_20261001`: "corpus pages and definition batches are bounded and still reject; the detail body read is bounded, and both callers use it".
- `communityToddlerDay20260930Pass3`: "a failed conversation read offers a retry instead of loading forever"; `accountNightPass3`: "employer admin writes and queue reads are bounded".

**House idiom.** `withDeadline(run, label, ms)` REJECTS (for anything whose
failure path matters — a graded submit, an error to show); `softDeadline(run,
fallback, label, ms)` RESOLVES to a fallback (for decorations and meters —
fail OPEN). Both in `src/lib/boundedCall.ts` (`DEFAULT_DEADLINE_MS = 25000`;
the word "timeout" in the rejection is load-bearing for the transient matchers).
`safeSession` / `safeUser` / `hasSafeSession` for `supabase.auth.*` reads. 61
call sites today. Picking the wrong one is the next bug: a graded submit that
resolves to a fallback is thrown away.

**Detection signatures (run 2026-10-02).**
- `supabase.from(` **20**, `.rpc(` **75**, `supabase.auth.*` (multi-line, `rg -U`) **62**, `functions.invoke|fetch(` **6**.
- Files making any network call: **62**; with none of `withDeadline|softDeadline|safeSession|boundedCall|AbortController|bounded`: **22** — `lib/supabase.ts`, `awards/api.ts`, `auth/intentionalSignOut.ts`, `curriculumStats.ts`, `academyStats.ts`, `settings/store.ts`, `credentials/api.ts`, `weeklyConcept.ts`, `push.ts`, `localSchedule.ts`, `moderation/api.ts`, `tools/telemetry.ts`, `lab/labAudio.ts`, `enrollmentProgress.ts`, `TopicWelcomeSheet.tsx`, `labCompletion.ts`, `study/sync.ts`, `paceRecords.ts`, `study/api.ts`, `mediaTypes.ts`, `SplashScreen.tsx`, `scenarioHomework.ts`. Some of these are called THROUGH a bounded caller (the api modules); the sweep must trace each export to its screen and bound the *outermost* await that gates UI.
- ⛔ Run every signature with `rg -U` (multi-line): the 09-22 single-line grep missed six `.auth\n.getSession()` sites.

**Verification checklist.**
- CORRECT: every await that a loading flag or a button's busy state depends on is inside `withDeadline`/`softDeadline`/`safeSession`; the choice matches the consequence (recorded result → reject; decoration → fallback); a stall shows the offline error with RETRY; a late success after the deadline is handled (signed back out / ignored) rather than landing as a hidden session.
- BUGGY: a bare `await supabase…` behind `setLoading(true)`; a `Promise.all` where one member can hang; a `finally { setLoading(false) }` that is the only exit.

**Risk.** MAJOR, BLOCKER where the result is graded or money × 22 files = **rank 4**.

---

## P8 — Guest / preview / tier-unknown gating

**Symptom.** A guest is told "nothing here is saved" while the lab saves and
restores their place; a guest's empty copy is saved over a signed-in learner's
real progress because the first membership check failed; free calculator
answers go to a free account before the tier resolves; a member who just paid
reads as a guest on a slow connection; a members-only preview earns credit; a
guest's lab work vanishes on sign-in (now carried by owner ruling 10-01).

**Root cause shape.** Reading `isGuest`/`isMember` from a value that is
`false`/`'anonymous'` *until the server answers*, and acting on it as if it
were known; or persisting lab progress with no tier check at all.

**Real examples.**
- `9f392572` corrections: "Ear + Tuning guest copies never saved over real progress"; `dialogToModalHandoff20260930`: "PagedLab: a guest-loaded copy is never saved".
- `3f7d0d32`: "a paying member could read as a guest on a slow connection; free calculator answers before the tier resolved and double-charges"; `calcBugPass20261001`: "W2 the answer waits for the entitlement tier".
- `labsGroupBBugPass3_20260930`: "Amp and Ear training: progress is read only once the tier is known"; `sharedInfraBugHunt20260930Pass3` R3: "PagedLab restores only once the tier is known".
- `661c5d3f` guest session carry → `src/features/lab/sessionCarry.ts`; `guestSessionCarry20261001` (one block per lab store).
- `accountFullRun1_20261001`: "the tier is re-read when the app returns from the background (refund = same day, cancel = at expires_at)".

**House idiom.**
- Tier is tri-state: unknown / guest / signed-in (`tierKnown`, `resolved`). Stores BLOCK saves until known (`saves are blocked until the tier resolves`, Mastering); hosts HOLD pre-resolve work and hand it to the first unblocked load.
- `sessionCarry.ts`: `holdSessionWork` / `registerSessionWriter` / `settleSessionCarry` / `peekSessionWork` / `sessionCarryOpen()`; writes are DELTAS; a preview holds nothing; sign-out drops everything (40 call sites).
- `withMembershipPreview` + `isMemberOnlyLabRoute` for paid routes (`test/membershipGating.test.ts`); `MembershipGate` hosted inside open Modals (P5).
- `useLabPreview`/`getLabPreview` for "PREVIEW EARNS NOTHING".

**Detection signatures (run 2026-10-02).**
- Lab/feature files that `setItem`: **69**; with no `isGuest|inPreview|tierKnown|resolved|blocked|guest` word: **38** — each is either a device preference (fine) or user progress with no tier rule (bug). The list is in the worklist.
- Reads of `isGuest|inPreview|tierKnown|resolved`: 480 — too many to sweep; instead sweep the 38 silent files and every `useEntitlement()`/`isMember` consumer that *persists* or *charges*.
- Copy strings that promise saving/not saving: 148 (P18) — each must match the store's real rule.

**Verification checklist.**
- CORRECT: no persist and no charge until the tier is KNOWN; a guest's work is held (not saved) and registered with `sessionCarry`; a preview earns and holds nothing; a signed-in learner whose tier read failed is treated as guest by the lab but written to their own identity by the ledger; the end screen's wording comes from `sessionCarryOpen()`; the tier is re-read on foreground.
- BUGGY: `if (isGuest) return;` where `isGuest` is false while unknown; a restore that loads a guest copy and then saves it; "nothing is saved" copy over a store that saves.

**Risk.** BLOCKER (lost progress; paid feature free) × 38 files = **rank 5**.

---

## P5 — iOS Modal-over-Modal and the 450 ms dialog fade

**Symptom (iPhone).** A tap does nothing: EXPLORE MEMBERSHIP, RENEW, UNLOCK,
"See membership", GET MEMBERSHIP, the Bass ▶ (its audio prompt was refused),
ⓘ stuck open; after one refused presentation every later confirm (Log out
included) silently queues until the app is killed. Android renders a sibling
Modal BEHIND the open one.

**Root cause shape.** UIKit presents one modal at a time. Opening a
`<Modal>` or a `presentation:'modal'` screen (Paywall, Settings, Help) while
another Modal is open or still animating away (450 ms) is refused. The app's
dialogs, audio gate, membership card and sheets are all Modals.

**Real examples.**
- `a0cf29af` "popups open inside an already-open Modal" → `DimModal` hosting (`test/appShellBugHunt20260929` A2); `f8b5a8f2` "confirm dialogs raised over an open sheet/full screen are hosted inside it (AppDialog via keyed DimModal overlays)".
- `9f392572`: "calculator + Tube Reference dialog → Paywall hand-off waits for the dialog to close" → `afterDialogCloses` (`src/lib/confirm.ts:37`); `navShellNightPass2`: "AppDialog: a queued dialog waits out an afterDialogCloses hand-off".
- `bugPass3HomeCatalogue20260930`: "EXPLORE MEMBERSHIP waits out the prompt Modal before the Paywall, once"; `studyToddlerPass3`: "UNLOCK waits for the study-access sheet to go before presenting the Paywall".
- `56dc5ef2`: "raw RN Modals in Glossary/Flashcards/Dashboard/Credential/TopicDetail now DimModal hosts"; guards `test/modalLayering.test.ts`, `test/modalsAreDimmed.test.ts`, `test/noRawAlert.test.ts`.
- Lessons: `InteractionManager.runAfterInteractions` does not wait for the native push; a Modal presented from a mount effect sticks half-presented.

**House idiom.**
- `DimModal` (`src/components/DimModal.tsx`) is the only Modal: it registers visible hosts, draws hosted overlays (AppDialog, audio gate, MembershipGate, ExposureCheckin) INSIDE the open Modal, exposes `HOST_DISMISS_MS = 450`, and defaults `supportedOrientations` (the landscape crash).
- `confirmDialog` / `notify` (`src/lib/confirm.ts`) — never `Alert.alert`.
- `afterDialogCloses(fn)` wraps any dialog button that opens a modal screen; it holds the dialog queue for 2× the fade.
- Self-presenting popups gate on `useIsFocused()` and on "no other popup open"; auto-presents wait for the stack's `transitionEnd`.

**Detection signatures (run 2026-10-02).**
- Raw `Modal` from react-native: **2 files**, both legitimate (`DimModal.tsx`, `LowLightLayer.tsx`) — this sub-class is CLOSED by `modalsAreDimmed.test.ts`.
- `confirmDialog|notify` sites: **170**; of those whose callback navigates (within 400 chars, `rg -U`): **2 found by regex but 9 `afterDialogCloses` sites exist** — the regex under-counts because callbacks are usually named functions. Better signature: every `navigate('Paywall'|'Settings'|'Help'|'Membership')` → **39 sites**; each must be either from a plain screen (fine) or wrapped in `afterDialogCloses` / wait-for-host (30 to inspect).
- `presentation: 'modal'` screens: **20** — any navigation to one of these from inside a Modal/dialog/sheet is a candidate.
- Modal tags without `onRequestClose`: **9** (P21).
- The 09-30 day report's parked option: "every confirm popup's OK running after the popup closes would be the one-line fix … ~155 buttons would change timing" — see Architecture A3.

**Verification checklist.**
- CORRECT: the popup is a `DimModal`; anything opened from a dialog button that is itself a modal screen goes through `afterDialogCloses`; anything opened over an open sheet/full screen is HOSTED (published to the DimModal host) rather than presented; self-opening popups check focus and other-popup state; the audio gate re-present checks the request generation.
- BUGGY: `navigation.navigate('Paywall')` directly inside a `confirmDialog` yes-handler; a `<DimModal visible>` toggled true while another is closing; a Modal presented from `useEffect` on mount.

**Risk.** MAJOR (dead taps on the paying path; stuck dialog queue) × ~30 navigate sites + 20 modal screens = **rank 6**.

---

## P6 — Silent success: "Saved" / credit shown when the write failed

**Symptom.** "SAVED ✓" after a save that did not happen; a note listed as saved
after the device refused it; a deleted row still on disk; "you have earned
nothing" / "0 / 166" when the read failed; a Time Trial "cleared" that the
server never credited; a certificate printed "Academy Member" with no QR
because a read blipped; "Nothing is waiting for review" when the queue read
was denied.

**Root cause shape.** Fire-and-forget writes (`void setItem(...).catch(() => {})`),
a `catch` that returns the empty shape, or UI that flips to "saved" before /
regardless of the result; a server 200 that means "ignored" (`duplicate_batch`).

**Real examples.**
- BRIEF pass 3: "`saveMeasurement` showed SAVED ✓ on failure, at all 8 tools"; "`fetchMyCredentials` reported a failed read as you have earned nothing"; 09-23: Trophy Case "0 / 166".
- Toddler passes: "saveTuningNote says whether the write landed: saved / blocked / failed"; "a failed delete keeps the row"; Room Design "a DELETE the device refused says so"; `toolsFullRun2`: "a calibration write that failed is SAID".
- `studyFullRun1_20261001`: "Time Trial: a pass is not reported as cleared until the server has it"; `certificateQrRead20261002`: "the export uses the throwing token read".
- `homeShellFullRun1`: "Dashboard item counts: a failed read THROWS — never a zero or partial denominator"; `accountFullRun2`: "fetchMyRegistryName throws on a failed read".
- Lessons: "A successful response is not evidence the work landed" (`record_study_progress` dedupe); "a clamp doing real work is a bug indicator".

**House idiom.** Writers return a tri-state result (`saved | blocked | failed`,
or `Promise<boolean>`), the UI words each one; readers THROW (or return `null`)
on failure and the screen keeps what it had plus RETRY; never `?? 0` or
`Math.min(100, …)` around a count that could be wrong; server no-op responses
(`duplicate_batch`) are read. Copy rule from the 09-20 copy pass 4b: "a failure
must say what failed, and what survived".

**Detection signatures (run 2026-10-02).**
- `void AsyncStorage.(setItem|multiSet|removeItem|multiRemove)` → **66 sites** (the result is discarded by construction; each must be either a device preference nobody is told about, or a bug).
- "Saved"-style copy (`SAVED ✓|'Saved'|saved on this device|Saved to`) → **93 sites**; each must be rendered from a write result.
- `.catch(() => {})` → **179**; empty `catch {}` → **8**; `catch` holding only a comment → **39**. Sweep the subset that sits on a write or a read whose result is shown.
- `void supabase.*` fire-and-forget server writes → **2**.
- `Math.min(100` → **25**; `(count|total|length|n)… ?? 0 / || 0` → **79**: each is a place a failure becomes a confident number.

**Verification checklist.**
- CORRECT: the "saved" word appears only after the promise resolved true; a `false`/throw shows a failure line naming what did not land and that the old copy survives; a failed read is `null`/throw, never `[]`/`0`; retry offered where it can help.
- BUGGY: state set to "saved" before/without awaiting; `catch(() => {})` on a write whose success is displayed; a count fed through `?? 0`/`Math.min` with no error path.

**Risk.** BLOCKER (a lie about the user's data) × 66 void writes + 93 copy sites = **rank 7**.

---

## P9 — Double tap / re-entrancy

**Symptom.** Two projects, two measurements, two messages, two accounts, two
purchases, two redeemed codes, two share sheets, two Cymatics studios, a quiz
question skipped, DONE leaving two screens, an enrol-then-unenrol flicker.

**Root cause shape.** The guard is React state (`busy`) set inside the
handler — the second tap in the same frame sees the old value. Or a handler
that both navigates and does work with no latch.

**Real examples.**
- `frontDoorBugHunt`: "useSending guards on a ref, not only on state; every send goes through useSending" (`src/screens/directory/directoryBits.tsx:148`, `useSendingPer` :172).
- `accountMembershipBugPass`: "paywall: CONTINUE and Restore are guarded by a synchronous in-flight ref; auth: every account action goes through the in-flight guard; settings: redeem is guarded by a ref, not by the state it sets".
- `4c0f7f88` "a double-tap spends one metered lookup, not two"; `studyNightPass2/3`: "every plain Back is latched to one exit"; `navShellNightPass2`: "LabHeader ‹ and LabEndScreen DONE share ONE leave window".
- `cableLabsBugHunt` "same-frame double taps: … Know / Route / Fire / Floor lock answers through refs"; `labsGroupABugHunt20260930` "module hosts: a double-tap on NEXT cannot skip the last module"; `toolsCalcBugHunt20260929` T7 "every tool SAVE claims the latch right before saveMeasurement".

**House idiom.** A synchronous ref latch claimed as the FIRST statement of the
handler (`if (busyRef.current) return; busyRef.current = true;`) and released
in `finally`; `useSending()` / `useSendingPer(key)` for sends; `useLabNav`'s
single nav lock for NEXT/FINISH/‹/DONE; a 600–700 ms leave window for exits;
"first answer wins" latched synchronously for scored picks.

**Detection signatures (run 2026-10-02).**
- `onPress={` → **2,192** handlers (too many to sweep blind).
- Same-line `onPress={() => navigation.(navigate|push|goBack|popTo|replace)(` → **99** — exits and openers with no latch; the shared-strip/`LabEndScreen` guards cover some. Sweep these.
- `async` / `void fn()` presses → **33**; files with such a press and no latch word → **4** (`CurriculumScreen.tsx`, `EmployerSection.tsx`, `modHarmonics.tsx`, `CalcResultsScreen.tsx`).
- Latch vocabulary in use: 329 sites (`useRef(false)|inFlightRef|busyRef|lockRef|Latch|useSending`).
- Scored/credited handlers: `rg -n 'onPress=\{[^}]*(score|credit|answer|submit|send|buy|redeem|save|create|delete)' src` per area.

**Verification checklist.**
- CORRECT: latch is a ref, claimed synchronously before any await or navigation, released in `finally`; one latch per logical action (not per button); scored picks latch the first answer; exits share one window per screen.
- BUGGY: `if (busy) return; setBusy(true)` as the only guard; two buttons that each call `goBack()`; `disabled={busy}` as the only guard on a `Pressable` (RN can still deliver the second tap in the same frame).

**Risk.** MAJOR (money, duplicates, skipped grading) × 99 + 4 = rank 8.

---

## P2 — Write before hydration / overlapping loads (newest wins)

**Symptom.** Home cards lost after opening Enrollments; a tap before the saved
list loads removes a card that was there; a reorder before load replaces the
stored order; an older load lands after a newer one (stale rack after a card;
the term viewer shows a previous term; a thread load lands in another thread).

**Root cause shape.** A store answers the first action with its in-memory
default while the disk read is in flight, and then persists the result —
replacing rather than merging. Or two loads race with no ticket.

**Real examples.**
- `56dc5ef2`: "Home cards lost after opening Enrollments (hydrate race) + same generation fence in enrollment/bundles/deck/last-study stores"; `bugPass2HomeCatalogue20260930`: "a write before the saved Home list loads is applied ON TOP of it, not over it".
- `studyFullRun2_20261001`: "ENROLL tapped before hydrate keeps the stored topics AND the new one".
- `1101132f`: "only the newest overlapping load may land (stale rack after a card)" → ticket refs; `communityNightPass2` E6 "only the latest read of the open thread lands"; `studyNightPass1` "Flashcards linked-term viewer: newest request wins".
- Mastering/Tuning/Amp: "a move before the first load is kept"; "chapters completed before load are credited" (`049bf10d`).

**House idiom.** Pre-hydrate actions are HELD as deltas and merged into the
loaded copy (`held`, `pendingTicks`); `++ticketRef.current` before a load,
bail before any setState/cache write if superseded; module-level
`generation` for resets (P3). `labCompletion`'s "units recorded meanwhile live
in memory and are merged with what the next read finds".

**Detection signatures (run 2026-10-02).**
- Hydrating stores: **35** (21 without a fence — shared list with P3).
- Async effects (`useEffect(() => { … void (async|.then(|await`): **77 files**; without `cancelled|mountedRef|isMounted|alive|disposed|gen !==|ticket|generation|stale`: **12** (`SessionExpiryGuard.tsx`, `popupSuppressStore.ts`, `flaggedStore.ts`, `amplitudeOrientation.ts`, `labCompletion.ts`, `labVisits.ts`, `lowLight.ts`, `ExposureMonitorScreen.tsx`, `TrophyScreen.tsx`, `CableLabScreen.tsx`, `CalcWorkflowEditScreen.tsx`, `MicSelectLabScreen.tsx`).
- Ticket refs in use: 55 (`ticketRef|reqIdRef|seqRef|latestRef|requestId|openSeq`).
- Store mutators that `commit()` without checking `hydrated`: `rg -n 'function (add|remove|toggle|set|reorder)\w*\(' <store>` then confirm each either awaits `hydrate()` or records a delta.

**Verification checklist.**
- CORRECT: a mutator before hydrate records a delta (never persists the default); the load merges held deltas; overlapping loads carry a ticket and only the newest may setState/write cache; the cache is written after the stale check.
- BUGGY: `prefs = next; setItem(next)` while `hydrated === false`; two `load()` calls with no sequence check; a `.then(setState)` with nothing cancelling it.

**Risk.** MAJOR × 12 + 21 = rank 9.

---

## P13 — The navigation law: labs never block, one exit, BACK closes the right thing, a "what's left" end

**Symptom.** CONTINUE locked until every check is answered; FINISH blocked
outside the understanding check; RESET wiping credit; DONE + ‹ popping two
screens; Android BACK leaving the lab instead of closing the tray; no
"what's left" screen; retry stuck at 5/5.

**Real examples.** `87872fe2` (Sound Systems FINISH), `f8b5a8f2` (Amp CONTINUE
→ SKIP AHEAD, RESET keeps credit), `31643437` (REPEAT LAB is a fresh run),
`3be07b0e` (Cable Fundamentals what's-left), `navShellNightPass2` (one leave
window), `labShellRackBugHunt20260929` LP6/LP8 (trays and BACK),
`meterLabWaterfallNav20260930` (PREV/NEXT on the shared strip).

**House idiom.** `useLabNav` (`src/screens/lab/kit/useLabNav.ts:89`) +
`LabNavBar` (shared strip, one nav lock), `LabEndScreen` with `endLead` /
`sessionCarryOpen()`, credit stores that only GROW (`labCompletion` union
merges; resets are "practice resets"); guards `test/labNavLaw.test.ts`,
`test/backControlReachable.test.ts`.

**Detection signatures.** 70 lab `*Screen.tsx`; `useLabNav` in **22** files;
`LabEndScreen` in **21**; `disabled={…}` on NEXT/FINISH/CONTINUE/DONE in labs:
**1** regex hit (the sweep must also read `pointerEvents`/opacity gating);
`BackHandler.addEventListener` **18** sites, **8** without a focus check
(`AuthScreen`, `FinalExamScreen`, `WaveformScreen`, `ToolFullScreen`,
`HarmonographViewer`, `CalcLabScreen`, `QuizScreen`, `cableinstall/bits.tsx`);
Modals without `onRequestClose`: **9**. The 09-29/09-30 reports list labs still
missing a what's-left screen (paged labs, Mic Selection, Foundations, Vacuum
Tube, Mic Principles, Speaker Coverage, Wave, Cymatics, EQ, Gain, Digital, Ear
Training, Amplitude) — owner decision, not a bug sweep.

**Checklist.** CORRECT: movement never withheld (credit may be); every lab exit
goes through one latch; BACK handlers are registered only while focused and
close the topmost thing first; reset/repeat never deletes banked credit.

**Risk.** MAJOR (owner law) × ~48 lab screens not on the shared strip + 8 + 9 = rank 10.

---

## P16 — Calculator numeric edges

**Symptom.** −100 Hz gives −10 ms; "0,500" read as 500 (1000×); a negative
limiter margin puts the threshold 64 dB too high; 20–24 AWG costed as 18 AWG;
0 s RT60 gives a confident treatment plan; a 0 Ω speaker silently dropped; dBu
chained into a dBV field; NaN-only result shown as dashes.

**Real examples.** `afd46b71` "negative-input rule extended to ~45 physically
non-negative fields"; `calcBugPass3_20260930` (zero inputs), `calcFullRun1/2`
(limiter, headroom, gauge), `toolsCalcBugHunt20260930` P1 (mixed separators),
`56dc5ef2` (chain/import unit guard; NaN-only results are errors). BRIEF pass
2/5: `parseFloat` → `parseQuantity`; `12,000` → 12 regression.

**House idiom.** `parseQuantity` (`src/screens/lab/calc/calcUnits.ts:233`) for
every typed number; `negativeInput` (`:381`) with the declared physically
non-negative field list; zero-input refusals that answer in words; `chainFits`
for unit-tagged chaining; `fmt`/`fmtInt`/`formatOutput` for display. Guard
`test/productionNumberInput.test.ts`.

**Detection signatures.** 168 `compute` formulas across 38 calc files; **71**
fields declared non-negative (`nonNeg|nonNegative|min: 0|minExclusive`); 769
variable divisions in calc (zero-denominator candidates); `parseFloat|Number(text)`
**6** sites outside the helper (`coachMark.ts:80` benign, `SplMeterScreen.tsx:681`,
`CableInstallLabScreen.tsx:151`, `roomdesign/bits.tsx:102` — a typed number
not through `parseQuantity`, `production/FieldRow.tsx` has its own
`interpretTypedNumber`). The owner left "negative inputs on ~160 formulas" as
a decision on 09-30; the 10-02 run closed four safety fields.

**Checklist.** CORRECT: every input through `parseQuantity`; every physically
non-negative field in the `negativeInput` list; zero denominators refused in
words; results that are all NaN/∞ are errors; integer-valued outputs through
`fmtInt`. BUGGY: a formula that divides by an input with no guard; a field
accepting a sign it cannot physically have.

**Risk.** BLOCKER (field safety numbers) × (168 − 71 = 97 formulas to classify) = rank 11.

---

## P10 — Timers, intervals, rAF and animation loops that outlive the screen

**Symptom.** A rack lesson timer that outlives the screen; a ▶ backup timer
firing after the next touch; a GlassTile beat after unmount; Home shimmer and
hub motion still moving in Low-Light / reduce-motion; the exam retry notifying
every 15 s; HoldToActivate's old interval still running.

**Real examples.** `sharedInfraBugHunt20260930Pass3` R7 (RackUnit pending
present), `toolsCalcBugHunt20260930` G1 (GlassTile), `bugPass3HomeCatalogue`
(Low-Light shimmer), `nightPass3_20261001HomeAwards` (LabScopeSweep stops off
screen), BRIEF "Reduce animations leaves 11 of 17 `withRepeat` files running".

**House idiom.** Timer handle in a ref, cleared in the effect cleanup and on
the next arm; `withRepeat` gated on reduce-motion / `useOverlaysSuppressed()` /
`useIsFocused()`; meters drive SharedValues per rAF, never React state.

**Detection signatures.** setTimeout **183**, setInterval **75**, rAF **19**,
`withRepeat` **24**. Files with setTimeout and no clearTimeout: **14**; rAF
without cancel: **5** (`AccuracyNote.tsx`, `AwardsScreen.tsx`,
`GlossaryScreen.tsx`, `CourseSelectionScreen.tsx`, `CurriculumScreen.tsx`);
setInterval without clear: **0**; `withRepeat` with no motion/Low-Light/focus
gate in the same file: **14 of 19**.

**Checklist.** CORRECT: handle in a ref; cleared on unmount, on re-arm, and on
leave/blur where the effect is visible; loops gated on reduce-motion and
Low-Light, and paused off-screen. BUGGY: `setTimeout(fn)` with a `setState`
inside and no handle; `withRepeat(-1)` with no gate.

**Risk.** MINOR→MAJOR × 14 + 5 + 14 = rank 12.

---

## P14 / P15 — Lab display text under 9 pt; cropped readouts

**Symptom.** Labels at 2.6 pt on the Sound Systems map; 8.5-pt spectrogram
labels; a bezel number ellipsised to "12…"; the DEMO tag at 6.5 pt; Career
Finder chart labels ~8 pt on small phones.

**House idiom.** Measure fontSize × fit scale at 390 wide (memory
`feedback_lab_display_text_9pt`); `useStageTextScale()` / `StageTextScale`
(48 users) for Skia/SVG; `BezelReadouts` drops the LABEL never the number (7
users, `test/ledMeterWellLabel.test.ts` sibling); labels may only grow; the
rack full screen scales everything.

**Detection signatures.** Literal `fontSize` under 9 in lab/tool/components:
**14 sites** (`hubPreviewShared.tsx:139` 6.5, `ToolsHubScreen.tsx:1284` 8.5,
`SignalGenDemo.tsx:692` 8.5, `CalcWorkspaceScreen.tsx:673` 8.5,
`CertIcon.tsx:43` 8.4, `LedColorPicker.tsx:264` 8.5, `gearArt.tsx` 3.2–5
(legend glyphs, likely scaled), `pagesLearnB.tsx` 8.5 ×3). `fontSize: 9|10`:
**369** — correct only if the drawing's fit scale is ≥ 1 at 390 wide; the
in-page harness (`#labpreview/<Screen>`) measures rendered size.
`numberOfLines={1}` **180** sites — any that carries a number must shrink,
not ellipsise.

**Checklist.** CORRECT: rendered size ≥ 9 pt at 390 (and on the short-phone
boost); a cropped readout drops its label; no `ellipsizeMode` on a numeric
cell. BUGGY: a fixed-height SVG in a "meet" viewBox; CSS `transform: scale`
hiding the real size.

**Risk.** MAJOR (owner rule) × 14 + 180 = rank 13.

---

## P17 — Float rounding on whole-number results

**Examples.** `calcBugPass20261001` TC1 (29.97 fps → 9000 frames not 8991);
`calcNightPass2` C1 (65536 not 65540); `calcNightPass3` C1 "float-noise counts
snap; genuine fractions do not"; `toolsCalcBugHunt20260929` T10 `fmtInt`.
**Idiom.** `fmtInt` (`calcUnits.ts:197`), `formatOutput` integer contract
(`calcPanel.tsx:97`). **Signatures.** 1,152 `toFixed(` sites app-wide; 21
`fmtInt` users. Sweep only outputs whose unit is a count (frames, samples,
taps, points, cycles, lugs). **Risk.** MAJOR (source of truth) × unknown count
outputs = rank 14.

---

## P18 — Copy that contradicts behaviour

**Examples.** The four 09-20 copy passes (`e8bac7a9` routes/emails/controls
that do not exist; `ae74ccb1` a failure must say what failed; `092e2715`
screens that disagree; `9f3f733d` instructions you cannot follow); "Enroll
notice no longer says enrolling costs nothing" (`98ac8547`); Meter/Tuning
accuracy notes claiming a microphone; Paywall/Help/end-screen wording made
false by the 10-01 carry ruling and corrected on 10-02; `communityCareersFullRun2`
H1 Guest Mode help answer.
**Idiom.** Copy derived from the rule (`endLead(…, carry: sessionCarryOpen())`,
`isMember` branches), never hard-coded; `test/helpContent.test.ts`,
`test/credentialNaming.test.ts`. **Signatures.** 148 strings about
saved/not-saved/free; 161 "Tap/Press/Open THE X" strings. **Risk.**
MINOR→MAJOR × 148 = rank 15. Sweep as a copy audit against the P6/P8 rules.

---

## P11 — setState / present / play for a component that is gone

**Examples.** `sharedInfraBugHunt20260930Pass2` Q6 "nothing plays for a
component that is gone (SpeakButton, AudioPlayer)"; `calcNightPass2` W4 "no
dialogs from a CALCULATE that lands after unmount"; `glossaryBugHunt20260930d`
"dictation stands down if the button unmounted during the permission prompt";
`studyNightPass1` "FinalExam guards on mountedRef like the quiz twin".
**Idiom.** `mountedRef` / `let cancelled = false` in the effect / request
sequence number. **Signatures.** 77 async-effect files, **12** with no guard
(list under P2). **Risk.** MINOR→MAJOR × 12 = rank 16.

---

## P12 — Stale closure / wrong dependency

**Examples.** `b2660894` (the Bass ▶, 15 labs); `sharedInfraBugHunt20260930Pass1`
P2 "HoldToActivate completes with the LATEST onComplete (reads a ref)";
`accountBugPass20260930dayPass3` "notification switch optimism is an updater,
not a stale spread"; `labBugHunt20260929` "MiniConsole merges with a functional
updater"; `1101132f` "track the TOPIC, not the slot".
**Idiom.** Latest-callback refs; functional updaters; ids not indices.
**Signatures.** `useFocusEffect(useCallback(() => () => fn(), [fn]))` → 10
regex hits of which **1 live** (`useDspEngine.ts:245`, deps `[stopPolling]`,
cleanup also calls `releaseMic` — the Bass shape, in the tools engine);
`useEffect(() => () => fn(), [fn])` → 1. `test/labSoundAudit20260929` guards
the lab half; the tools half is not guarded. **Risk.** MAJOR when it hits × 1
confirmed candidate = rank 17 — but cheap: extend the guard to `features/tools`.

---

## P20 — Mic engine lifecycle

**Examples.** `toolsFullRun1_20261001` 1a–1d (released while waiting on a
closing stop → mic stays closed), `toolsNightPass2/3` (acquire during
forceRestart; a stop that never settles; `closeStream` capped),
`micReleasedOnBackground.test.ts`, `8fa7f8b5` (a superseded mic start no
longer kills a newer start's stream), "the mic could open behind a pushed
screen". **Idiom.** `micSession.ts` single owner with bounded close, generation
per start, acquire waits for the previous stop; `useToolAutoStart` holds while
blurred. **Signatures.** 36 acquire/release sites; 17 tool screens. **Risk.**
MAJOR (privacy indicator on; dead tool) — one module plus 17 screens; sweep as
one unit.

---

## P19 / P24 / P21 — small, bounded

- **P19 dead controls.** 15 `onPress={() => {}}` are all scrim swallowers
  (correct). The real finds (THICK on a rug; HEIGHT → SUB; every material pick
  changes the picture) came from expert/cognitive review — keep that as a
  review step per lab, not a grep.
- **P24 unhandled rejections.** 2 `Haptics.*Async(` and 4 `Speech.(speak|stop)(`
  without `.catch`; 313 bare `void fn();` statements — the subset calling a
  promise-returning native API needs a catch (`hapticsEnabled()` + catch is the
  idiom; `sharedInfraBugHunt20260930` S3/P5).
- **P21 Android BACK.** 8 `BackHandler` sites without a focus check; 9 Modals
  without `onRequestClose`. Folded into P13's sweep.

---

## Phase 2 sweep plan

**Order (by risk rank, then by how cleanly a guard can close the class):**

1. **P1 failed-read overwrite** — 38 files. One agent per ~13 files (3 agents).
   Deliverable per file: which idiom (flag / stay-unhydrated / `tryLoad` null),
   the test. Then the guard test (G1 below) so the class cannot return.
2. **P4 sound start vs stop** — 38 files. Split by folder: (a) `screens/lab/drumtuning` + `tuning` + `cymatics`; (b) `screens/tools` + `features/tools/engine` + `features/audio`; (c) the rest of `screens/lab`. Each start gets the epoch read-before/check-after; each screen gets `useStopWhenSilenced`. Then decide A1 (central fence) — if A1 lands, the per-site sweep shrinks to "does the start go through the fenced helper".
3. **P3 identity fences** — 21 stores + 32 `ape:` writers. One agent on the stores (generation + `resetAllLocalStores` registration), one on the writers (sweep or KEEP, written down). Extend `accountWipeRegistry.test.ts` (G2).
4. **P7 deadlines** — 22 files. One agent; trace each export to the screen that awaits it; bound the outermost UI-gating await; run every signature with `rg -U`. Extend `authReadsBounded.test.ts` to `.rpc(`/`.from(` (G3).
5. **P8 tier gating + P6 silent success** — run together (same files): 38 silent persist files, 66 `void setItem`, 93 "Saved" strings. Two agents by folder (`features/*` vs `screens/*`). Each writer returns a tri-state; each "saved" word is rendered from it; each persist waits for `tierKnown` or holds via `sessionCarry`.
6. **P5 iOS presentation** — 30 navigate-to-modal-screen sites + 20 modal screens. One agent. Decide A3 (make `afterDialogCloses` the default inside `confirmDialog`) — that removes most of the sweep.
7. **P9 double tap** — 99 same-line navigate presses + 4 async-press files + every scored/credited handler. Two agents by area.
8. **P2/P11 hydrate + async landing** — 12 files (plus the 21 from P3). One agent.
9. **P13/P21 navigation law** — 48 lab screens not on the shared strip (owner call on the what's-left list), 8 BackHandlers, 9 Modals. One agent.
10. **P16/P17 numeric** — 97 formulas not yet classified for sign; count-valued outputs. One agent with the calc expert checklist; owner approves any number change (source of truth).
11. **P10 timers/loops**, **P14/15 legibility**, **P18 copy**, **P12 tools engine**, **P20 mic**, **P24** — one agent each, small lists.

**Rules for sweepers (from the Bug-Hunt Standard, repeated because they bit):**
read-only until the catalog item is confirmed; a finding needs the file, the
line and which checklist line it fails; "nothing found in X" is a result; run
multi-line greps; every fix ships with a test checked against the pre-fix
code; fix the twin (`web/` mirrors app rulings — `test/webMirrorsAppRulings.test.ts`).

**Guard tests to add (a guard beats hunting):**

- **G1 — no failed read may become empty.** A source test that walks `src/`,
  finds every file with `AsyncStorage.getItem` AND a storage write, and fails
  unless the file contains one of the recognised idioms (`readFailed`,
  `hydrating = null` with the "READ failed" comment, `tryLoad`, `*Unreadable`)
  — or a one-line opt-out comment naming why (device preference, no user
  data). Same shape as `labSoundPolicy20260929.test.ts`. Start it with the 38
  current files listed as known-open so it fails only on new sites, then burn
  the list down.
- **G2 — every store with a `reset*` export is in `resetAllLocalStores`, and
  every `ape:` key writer is either swept or on `KEEP` with a reason.** Extend
  `accountWipeRegistry.test.ts`.
- **G3 — every `.rpc(`/`.from(`/`functions.invoke(` reached from a screen is
  inside a deadline helper.** Extend `authReadsBounded.test.ts` from
  `auth.*` to all four call families, multi-line.
- **G4 — every native start re-checks the epoch.** Generalise
  `labsAFullRun2_20261001`'s "no top-level lab file with a native start escapes
  the list" from Labs A to all of `screens/lab`, `screens/tools`,
  `features/audio`, `features/tools`.
- **G5 — every `navigate('<presentation:modal screen>')` inside a dialog or
  sheet callback goes through `afterDialogCloses`** (or A3 makes it moot).
- **G6 — the P12 cleanup-with-deps regex from `labSoundAudit20260929`
  applied to `features/tools`** (one known hit today).
- **G7 — "Saved" copy only from a write result**: a source test that fails if
  a file renders a `SAVED`/"Saved" string and also has `void AsyncStorage.setItem`
  with `.catch(() => {})`.

---

## Architectural fixes that close a class at once

- **A1 — Fence in-flight starts centrally.** Today ~25 sites each read
  `getSoundStopEpoch()` before and after their awaits, and 38 files do not.
  Instead: one `startFenced(label, async () => …)` helper in
  `features/audio` (or inside `LabAudioPlayer.play()`, `genStart`,
  `useRecordedPlayback`) that captures the epoch, awaits the native start,
  and disposes/stops if the epoch or gate moved — so a lab cannot forget.
  `stopAllSound()` already bumps the epoch; the missing half is that the
  *starters* consult it. With A1, G4 reduces to "every start goes through the
  helper".
- **A2 — One safe store.** 77 files hand-roll read/parse/write of an `ape:`
  key with a hydrated flag; 38 lack the failed-read rule and 21 lack the
  generation fence. A single `createLocalStore({ key, parse, merge, keep })`
  that owns: failed read ≠ empty (saves off until a read succeeds), damaged
  blob quarantine, held deltas before hydrate, generation reset wired into
  `resetAllLocalStores`, and tri-state write results — would make P1, P2, P3
  and half of P6 impossible to write by hand. Migrate store by store, highest
  risk first (lab credit, enrollments, deck, exam queue).
- **A3 — Dialog hand-off by default.** Make `confirmDialog`/`notify` button
  handlers run after the dialog's dismissal when the host is a Modal (what
  `afterDialogCloses` does), instead of nine hand-wrapped sites and ~30
  unwrapped. The 09-30 day pass parked this because ~155 buttons change
  timing (sign-out, delete account); the safe version is opt-in per call
  (`{ opensModalScreen: true }`) with G5 enforcing it — or opt-out for the
  handful of destructive flows.
- **A4 — Deadline at the client boundary.** Wrap the Supabase client once
  (a thin `boundedRpc`/`boundedFrom` in `lib/supabase.ts`) so every
  `.rpc()`/`.from()` carries `DEFAULT_DEADLINE_MS` unless a caller opts into
  `softDeadline`. Removes the "sixth hand copy" risk the helper's own header
  describes.
- **A5 — Tier is a tri-state type, not a boolean.** `isGuest: boolean` is
  the root of P8; a `Tier = 'unknown' | 'guest' | 'free' | 'member'` with
  `persistAllowed(tier)` would make "unknown" impossible to mistake for
  "guest" at the type level.
- **A6 — Server-side classes are out of this catalog's scope but are the
  same shape:** RLS policy without GRANT (bitten twice), refund not revoking
  certificates (A's lane, 10-02), `record_study_progress` success-that-ignored.
  They need a DB-side checklist, not a `src/` sweep.

---

## Known noise in the signatures (so phase 2 does not chase ghosts)

- P4's 38 includes sub-components whose host screen holds the hook, and hooks
  that re-check `isAudioOutputEnabled()` but not the epoch (`useDrumPlayback`)
  — the latter is a real gap only when "Mute audio when I leave" is OFF.
- P1's list contains device preferences (`lowLight.ts`, `permissionStore.ts`,
  `popupSuppressStore.ts`) where "failed read → default" is arguably right;
  G1's opt-out comment is for those.
- P7's 22 are mostly api modules; the bound may live in the caller. Trace,
  don't assume either way.
- P9's 2,192 `onPress` total is not a worklist; the 99 + 4 are.
- The title classifier double-counts nothing but under-counts P21 (0) because
  its titles say "BACK" (captured by P13) — ~12 BACK fixes by report.
