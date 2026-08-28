# AP&E — Debug Audit (2026-08-28, overnight)

Five parallel read-only audits (crash/null-safety · hooks & leaks · stale-visual
class · state/persistence/gating · one owner-reported bug), every finding then
re-verified by hand before any edit. **No database change** (frozen backend).

Commits: `76be8af` (fixes) · `4ebb876` (readout/drawing contradictions) ·
`15c07e4` (security review, separate doc).

Verification used throughout: `tsc --noEmit` clean, plus **real Metro bundles**
for `platform=ios` and `platform=android` (HTTP 200, ~24.5 MB) — not just types.

---

## FIXED — 1. Native bundles were broken (launch-blocking) 🔴

`index.ts` loads CanvasKit for web behind `if (Platform.OS === 'web')` with a
dynamic import. That is a **runtime** guard — Metro still walks the import at
**build** time, so `canvaskit-wasm` entered the native graph and it requires
Node's `fs`:

```
Unable to resolve module fs from node_modules/canvaskit-wasm/bin/full/canvaskit.js
```

The dev client hid this completely because it bundles **lazily** (only what the
runtime actually asks for). A full bundle — `expo export`, an EAS release build
— walks the whole graph and fails. The app on the phone was fine; the next
release build would not have been.

Fixed in `metro.config.js` with a `resolveRequest` that resolves the Skia web
entry and `canvaskit-wasm` to an empty module on non-web platforms (CanvasKit is
web-only by design; native Skia is linked into the binary).

**Measured before → after:** `platform=ios` 500 → **200**; `platform=android`
500 → **200**; `platform=web` **200** both times and still contains canvaskit
(8 refs); native now contains **0**.

## FIXED — 2. Saved Measurements: the Academy paywall was decorative 🔴

Ruling of record (owner 2026-08-05) puts the Saved Measurements library in the
Academy layer, and the hub + Frequency Counter correctly route free users to the
Paywall with a 🔒. But **six tool screens** (SPL, RTA, RT60, MultiMeter,
Spectrogram, Waveform) link straight to the library, and the destination had
**no entitlement check at all** — so a free account could bounce off the lock,
open any tool, and read the whole library with Compare and Share.

Gated at the destination (`useToolsLocked`) so every entry point is covered, and
removed the superseded "Free to use" claim still sitting in that file's header.

## FIXED — 3. Hearing-exposure data leaked across accounts 🔴

`exposureMonitor` keeps dose, sessions, max dB and the personal limit in module
state, and its `hydrate()` is latched by a `hydrated` flag. Its storage keys were
already swept on account switch — so the module is explicitly classed as user
data — but nothing reset the **module** state and the latch meant it never
re-read.

Consequence on a shared device: user A's dose and session list stayed on screen
for user B, and within 15 s the `persistDay()` tick wrote **A's record into B's
freshly-wiped storage**, durably attributing one person's hearing-exposure
history to another. Added `resetLocal()` and registered it in
`resetAllLocalStores()`.

## FIXED — 4. Enrollment sync could wipe the *next* user's enrollments 🔴

`enrollmentStore.resetLocal()` cleared the list but left its debounced server
sync **armed** (failure backoff keeps a timer alive up to 30 s). The callback
reads module state at fire time and uses whatever session is current, so
sign-out → sign-in inside that window could fire
`sync_my_enrollments({ p_items: [] })` under the new user and wipe the
enrollment master list the backend gates v3 study/quiz on. Now cancelled on
reset.

## FIXED — 5. Audio kept sounding behind closed screens (3 races + 2 leaks) 🟠

`start()` awaits the audio-output request and a native start; leaving during
that window ran teardown **first**, so the start resolved afterwards and audio
continued with no UI path to stop it.

- **Binaural Lab** and **Modular Lab** — generation guards added, matching the
  pattern already proven in BassLab/AutotuneLab.
- **Signal Generator** — same guard; this one violated spec §18 ("no DSP behind
  a closed screen") outright.
- **DSP Debug** — could create its poll interval *after* unmount: an unbounded
  leak polling JSI forever.
- **Glossary dictation** — never released the speech recognizer on unmount, so
  navigating away mid-dictation held the mic (OS indicator lit) until the
  platform timeout, contending with the tools' DSP stream.

## FIXED — 6. Mic Principles · DISTANCE — the owner-reported "NOT WORKING" 🟠

Root cause, both halves confirmed in code:

- `room = 0.32` was a **hard literal** — the ROOM bar *and* the ROOM bezel %
  were mathematically incapable of moving, at any distance.
- `direct = 6 / inches` is a hyperbola: over the upper 70 % of the fader the bar
  moved 35 % → 12.5 %, i.e. almost nothing.

Both bars now show each source's **share of what the mic hears**, derived from
the inverse-square law, crossing at ~12 in (the critical distance) — which is
exactly the lesson the caption already claimed ("beyond that, the room starts
winning"). Labels and caption updated to match.

## FIXED — 7. Readouts that contradicted their own drawing 🟠

- **Wave Lab / Refraction:** the drawing bends rays with
  `gradient01 * 1.2 + wind * 0.55`, but BEND, RAY @150m and the in-canvas
  "UNIFORM AIR" label used the gradient **alone**. Max WIND curved the rays onto
  the audience while the bezel read STRAIGHT over "UNIFORM AIR" — contradicting
  the module's own prose about wind shear. All three now use the effective
  gradient.
- **Foundations Playground:** subtitle claimed *"Every control drives every
  view"* while BALANCE and DELAY have no drawn twin — and the note admitting
  that rendered **only when the v6 effects build was absent**, i.e. it vanished
  on exactly the build where you can hear them. Note is now unconditional.
- **CameraAnalogy:** header comment claimed PAN works in every mode; the code has
  always locked it at stage 0.

## FIXED — 8. Two consistency defects 🟡

- Coach-mark counters (`ape:coach:*`) were swept on every account switch, so a
  fully-retired hint replayed after each logout — the exact bug the
  onboarding-flag exception exists to prevent. Added to the preserved prefixes.
- `ToolLearn` / `ToolDemo` / `ConceptModule` gated on `caps` instead of
  `isMember`, against the house rule in `ToolLockUi`. Not exploitable today
  (they agree for real users) but they diverge under the dev bypass. Aligned.

---

## NOT FIXED — deferred deliberately, with recipes

### A. Ungated native/Skia imports on the boot path 🔴 *(highest remaining risk)*

Same class as the `ExpoPushTokenManager` crash: a static import of a native
module throws at **module evaluation**, before any error boundary exists.

- `src/features/audio/ShakeToMute.tsx:17` — `import { Accelerometer } from 'expo-sensors'`,
  mounted from `App.tsx`. Note `src/lib/useShake.ts:13-18` already does the
  guarded `try/require` for the **same package** — the call is defended, the
  import is not.
- `src/features/audio/panicMute.ts:15`, `src/features/audio/exposureMonitor.ts:32`,
  `src/components/SpeakButton.tsx:12` — `expo-speech`, also on the boot path.
- `src/screens/courses/CourseSelectionScreen.tsx:29` — ungated
  `@shopify/react-native-skia` on the **Home tab**, bypassing the repo's own
  `skiaGate` discipline. Also white-screens Home in `expo start --web`, where
  CanvasKit isn't shipped. Same ungated import in `SpectrogramScreen`,
  `WaveformScreen`, `MicSelectLabScreen`, `micArt`, `AmplitudeOrientation`,
  `cableArt`, `introSceneArt`.

**Why deferred:** these are latent, not currently broken (your dev client has
all three modules). The fix touches the boot path and the Home tab, and if I got
it wrong you would wake to an app that will not start. The pattern to copy is
in-repo (`useShake.ts`, `skiaGate.ts`). Worth doing with you awake.

### B. Guest lab progress persists across sessions 🟠

The promise (`EntitlementProvider`): a no-account user is *"factory-reset every
session"*. That reset only clears `ape:localMethod:*`. Lab screens guard their
own step keys with `noAccountRef`, but `markLabUnit()` does not — so guest lab
completions land in `ape:labProgress` and survive relaunch, showing green checks
to the next guest and retrying server credit for them each boot.

One-place fix: guard the writer, not the ~25 call sites — a
`setLabCreditNoAccount(entitlement === 'anonymous')` flag checked at the top of
`markLabUnit`. **Deferred** because it changes guest behaviour and touches the
stated promise; that is your ruling to make.

### C. Weekly-concept toggles never revert on a failed write 🟠

`SettingsScreen.persistWeeklySubs` discards the `Promise<boolean>` from
`syncWeeklySchedule`, so a failed write leaves the chip lit and nothing saved.
The correct pattern is two functions above it (`setPref` reverts on `!ok`).
**Deferred** because SettingsScreen and the notifications feature are actively
being edited by the other session — this is theirs to fix, not mine to collide
with.

### D. Static FX heroes ignore a control the animation honours 🟡

Three cases where the *animated* hero is correct and the **static** graph beside
it is not, under a badge claiming it shows the current design:

- **Phaser** — `phaserResponseDb(..., 0.5, f)` pins `mix`; RESONANCE never
  reaches the curve.
- **Stereo Imaging** — `LissajousGraph` takes neither PAN nor MONO-FOLD, yet the
  caption under it says *"everything wide is gone — only the MID survives the
  fold."*
- **Phase** — same missing MONO-FOLD; caption says *"fold to mono and it
  CANCELS."*

**Deferred** because each needs a signature change to a shared drawing function
used by several labs — a change to what those graphs *display*, which you should
see rather than find.

### E. Watch item — a `while` loop that could hang on a data edit 🟡

`src/screens/lab/cableinstall/scenes/InspectScene.tsx:462` — the loop condition
cannot change inside the body; it terminates only because today's 25 inspection
entries happen to map to 25 distinct correction strings. Reuse a `mistakeId`, or
give two mistakes the same correction text, and it spins forever inside a
`useMemo` during render (ANR, no stack trace). Today's data verified safe. A
bounded `for` would make it safe against a future content edit.

---

## Coverage note (honest scope of this audit)

The stale-visual sweep disclosed its own gap: the following were **listed and
skimmed, not traced param-by-param**, because a heuristic scan stalled on the
4k-line viz files and was killed. A second, narrower per-directory pass was
started to close it — see "Gap-closing pass" at the end of this doc for the
result:

- the nine standalone lab screens (Binaural, Fm, Autotune, Bass, Noise,
  Oscillator, Modular, SignalChain, EarLab),
- `src/screens/lab/cableinstall/scenes/*` (13 files, ~10k lines),
- `SplMeterScreen`, `MultiMeterScreen`, `Spl3dGauge`.

Nothing in the "verified clean" list below depends on that gap — those areas
were traced directly.

## Gap-closing pass — result (commit `1c7eafd`)

The three areas above were re-run as narrow per-directory traces. **Verdict: the
nine standalone lab screens were 8/9 clean; the meters and the cable lab were
not.**

### Fixed — live instruments (the no-fake-meters rule)

- **SPL meter showed a dead mic as a live reading.** `getMeterFrame()` can
  return null while React still thinks it is running (interruption, HAL drop,
  route change); the loop did `if (!m) return;`, so PEAK, PEAK HOLD, Leq,
  ELAPSED and the big number kept the last frame **indefinitely**. The warning
  path could not save it — `flags` is derived from that same stale frame, so it
  reported healthy. Frames are now timestamped; readouts go dark after 750 ms
  (well above the ~50 ms native tick, so a dropped frame never flickers).
- **Both meters inherited the previous session's peak — and saved it.** Neither
  `startMeter` nor `onStart` reset the *native* peak-hold/Leq, and the mic
  stream is warm-adopted across tools, so opening the SPL meter after clapping
  in the MultiMeter showed that clap as this session's PEAK HOLD with the prior
  ELAPSED. `onSaveLog` / `openSnapshot` write both into the Measurement Library,
  so this was data corruption, not just display.
- **MultiMeter kept reading after STOP:** DOMINANT (captioned "from spectrum
  peak"), the cursor chip and SAMPLE RATE all ran off a frozen spectrum while
  every other panel correctly went dark.

### Fixed — Noise Lab (integrity)

The OUTPUT advisory promised "brown −14 dB, pink −6 dB" — a protection
`guardNoiseLevelForEngine` has **not applied** since the native high-pass landed
(it returns the level unchanged for engine ≥ 4; shipping is 7). It also
contradicted the OUT bezel cell one control away. The sentence is now derived
from the same helpers as the audio path, so it cannot drift again. Also: the
SPKR caption said "Amber =" for a line stroked in the noise colour (regression
from `726e498`).

### Fixed — Cable Install Lab (the lab awaiting your device test)

- **Resume locked the whole lab.** The completed-unit mirror was never hydrated,
  so resuming at stage 6 drew dots 2–13 locked and announced ", locked", under a
  counter reading "5 of 15 units complete" — and the intro button reverted to
  START LAB, throwing the user back to stage 1. The code comment had always
  claimed this hydration existed.
- **FireScene highlighted the correct answer instead of the learner's pick**, so
  a wrong answer lit the *right* chip while the banner said "wrong".
- **FloorScene redrew the stage plan "the professional way" for wrong calls** —
  the art, and its accessibility label, rewarded the wrong answer.
- EmiScene credited "MOVE DISTANCE" without the value changing; WhyScene
  rendered a literal `isn\'t`.

### Deferred from this pass (recipes in the agent findings)

SPL: peak cells ignore the dBFS/SPL toggle and are labelled with a weighting
they do not apply (S2/S3); the first 2 s of "5 SEC AVG" is a single sample that
can park the gauge in RED (S5); the gauge legend claims C-weighting while the
ring follows the selected weighting (S8); a dead `centerColor` prop (S7).
MultiMeter: PEAK/RMS/PK HOLD carry the A/C label while being Z (M2). Cable lab:
MechScene's verdict text rebuilds live under a frozen verdict; InspectScene's
replay cannot reach its completion card; RackScene's phase-B latch cannot
un-latch. **All of these are unit/label semantics or lesson-flow judgment on
screens you have strong standing rulings about — they need your eye, not mine.**

## Verified clean (do not re-audit)

- Every `JSON.parse` of AsyncStorage is inside try/catch with a default; every
  persisted step index is range-clamped on restore.
- The reported Home "infinite refresh" cannot recur from the current code —
  `caps` is memoized and the focus effect's identity is stable.
- Mic lifecycle (`micSession`, `useDspEngine`, `hubPreviewEngine`), all study
  session start/stop pairs, and every tool screen's timers are symmetric.
- Gain lab's cumulative chain, all EQ modules' summed curves, mic/speaker
  coverage fields, meter lab, digital lab, tube lab, harmonograph, and every FX
  *animation* flow consume all their inputs.
- Offline study/quiz queues are cleared on account switch; a rejected study
  batch is queued durably, not dropped; entitlement reads do not downgrade a
  paying member on a transient failure.
