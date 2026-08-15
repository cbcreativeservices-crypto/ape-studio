# AP&E — Governance & Decisions Log (2026-08-14)

Rulings of record from the audio-engine GO-LIVE session (`audio-tools-engine`
branch). Successor to `APE_GOVERNANCE_DECISIONS_2026_08_13.md`; earlier logs
stand. Owner rulings issued in the Claude Code dev session on 2026-08-14. The
R-number series restarts at R1 per house style.

> Scope: the native DSP audio engine going live on iOS, the amplitude-display
> integrity rule, and the generator-silence root cause. Nav-icon + calc rulings
> in the 2026-08-13 logs stand.

## R1 — AUDIO ENGINE IS LIVE ON iOS (engineVersion 7)

The native `ape-dsp` engine was already complete in source (v7, goldens 166/166);
it was dark only because the installed dev client predated it. A fresh EAS
`development` iOS build brought it live. **All 8 measurement tools + all
generator/synth output were verified working on the owner's iPhone 2026-08-14.**
`SCREEN_STATUS.md`: the 8 tool rows moved 🟡 → 🔵.

- **Android is a separate second pass** — the engine has NEVER been built/run on
  Android; it has 2 known platform-layer gaps (no capture auto-recovery watchdog;
  `bluetoothInput`/`interrupted` hardcoded false) AND almost certainly the same
  `mode as Int` bridge bug (R3) in `ApeDspModule.kt`. Do NOT claim Android until
  built + on-device verified.
- Diagnostics added (kept — dev-only): `DspDebug` shows `engineVersion`;
  SignalGen dev status card shows `PULLS` (render-pull counter) / `ROUTE` /
  `SESSION`, all `__DEV__`-gated.

## R2 — FIXED-REFERENCE AMPLITUDE DISPLAYS (STANDING)

Amplitude / level / volume displays map to a FIXED absolute reference (constant
dBFS/dB-SPL window, ±full-scale). The MIDI colour scheme must NOT dynamically
re-anchor to the live signal (observed max / peak / auto-gain), and the vertical
scale must NOT re-fit to content. **Zoom operates ON TOP of the fixed schema**;
the scale never readjusts to fit a zoom. A full 3-agent sweep of every
`levelColor`/`heatColor` call site confirmed the shared helpers + all
meters/RTA/RT60/gain/EQ/foundations/amplitude/tube/demos are fixed.

- **Fixed this session:** main Spectrogram (`FIXED_ANCHOR_DB=0`), MultiMeter
  mini-spectrogram (`SG_ANCHOR_DB=0`), HarmonicsView LIVE heatmap + slice
  (`LIVE_CEILING_DB=0`).
- **Waveform-type amplitude traces** (Waveform viewer, MultiMeter mini-scope,
  HarmonicsView live waveform): owner ruling = keep TRUE 0 dBFS colour reference
  (red=full-scale, quiet=blue is honest); height stays auto-fit (expands only
  above 0 dBFS to reveal clipping). No more-sensitive reference.
- **Approved DYNAMIC exceptions (keep — modeled/demo/opt-in, NOT live-mic
  measurement):** vizWave pulse-tracer colour + arrival-tick length
  (wave-propagation model), fxAnim DistFlow demo output colour, SPL VU "AUTO"
  range (opt-in, default off, labelled).

## R3 — iOS EXPO-MODULE DICTS: READ JS NUMBERS AS NSNumber, NEVER `as? Int`

**Root cause of the "generator produces no sound" bug:** `ApeDspModule.swift`
`genSet` read `params["mode"] as? Int`, but JS numbers cross the Expo bridge as
`Double`/`NSNumber` — never `Int` — so the cast silently failed, `setMode` was
never called, and the core stayed at its default `mode_ = 0 = GenMode::Off`,
rendering PURE SILENCE while `genStatus` still reported RUNNING + level (the UI
lied). This silenced the tone generator AND every genSet-mode output path
(Oscillator/Noise/FM/Bass/Autotune labs, HarmonicsView additive tone). Fixed via
`(params["mode"] as? NSNumber)?.intValue`; the identical sibling at binaural
`params["type"] as? Int` was fixed too.

- **Standing rule:** in Expo-module `[String: Any]` dicts on iOS, read numeric
  values as `NSNumber`/`Double` (then convert), NEVER `as? Int`. Typed
  AsyncFunction/Function signature params are coerced by Expo and are safe; the
  hazard is only untyped dictionary reads.
- Belt-and-braces in the same fix: explicit `mainMixerNode → outputNode` connect
  + `outputVolume = 1.0` in `startGeneratorOutput()`.

## Harmonic Lab live-mode fixes (bugs of record)

Both pre-existing, exposed the first time LIVE mode ran with the engine present:
(1) `LiveHeatmap` keyed `<Path>` by colour value, but the ramp has two identical
`#3fae52` green stops → duplicate React keys → error every frame → LogBox thrash
→ screen unusable. Fixed: key by index. (2) The shared LabShell `InteractionZone`
locked page-scroll on ANY touch across the whole view (designed so model-mode
stem drags beat scroll) → couldn't scroll to controls in the tall live view.
Fixed: removed the whole-view zone; SCOPED the scroll-lock to the stem plot only
(HarmonicStems `onTouchStart/End → onDragActive`), so the rest of the lab scrolls.
