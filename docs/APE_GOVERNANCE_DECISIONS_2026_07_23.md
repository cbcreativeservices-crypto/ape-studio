# AP&E — Governance & Decisions Log (2026-07-23)

Rulings of record from the audio-tools build cycle. Successor to
`APE_GOVERNANCE_DECISIONS_2026_07_18.md`; supersedes conflicting earlier notes.
Owner rulings issued in the Claude Code dev session, 2026-07-23.

## New rulings (owner, 2026-07-23)

### R1 — dB SPL calibration: DEVICE-LOCAL OFFSET
The SPL Reference Meter gains a field-calibration flow: the user calibrates
against a reference sound-level meter (steady pink noise; adjust an offset
until the app matches the reference). The single offset is stored **on-device
only** (`ape:splCalOffset`) — never server-side (tech-spec §7.2 stands).
Calibrated readings display **"dB SPL · field-calibrated (approximate)"**;
uncalibrated readings remain **"dBFS · uncalibrated approximate"**. Saved
measurements carry `calibration_status: 'calibrated'` + the offset in
`measurement_settings` (context disclosure, spec §5). Approximate ALWAYS —
this is not, and never claims to be, an IEC 61672 instrument.

### R2 — Light-pulse (camera) mode: HOLD
The Frequency Counter's optical mode stays at the honest in-development card
until the audio engine is validated on-device. Revisit after validation;
implementation sketch when it lands: expo-camera frame-brightness analysis,
camera permission requested lazily on first use, measurable range honestly
capped by frame rate (~≤15 Hz) and disclosed on-screen.

### R3 — Android: PORT COMMITTED (new work order)
The measurement tools WILL ship on Android. The portable C++ core
(`modules/ape-dsp/ios/core/` — golden-tested host-side, no platform deps) is
the shared foundation; the work order is the platform bridge:
- Kotlin Expo module + Oboe/AAudio capture (measurement-equivalent input path,
  read-back verification like iOS), JNI onto the same EngineHub/Generator.
- Output path for the generator via Oboe.
- PROPOSED device baseline (confirm at port kickoff): arm64-v8a, Android 10+,
  Snapdragon 778G-class mid-range as the perf-budget device (Android analog of
  the Q5/A13 ruling). FFT ceiling ≤16384 unchanged.
- Until the port lands, Android clients keep the honest "not in this build" gate.

### R4 — Backend deploys: BOTH GREEN-LIT (execute in the backend session)
The client stays frozen; the backend/governance session executes via
dev-branch → tests → advisors → merge:
1. **T-1 tool-usage telemetry** — its deploy trigger ("until the engine
   build") has FIRED. Scope unchanged per Q3: opens + durations only
   ({tool_id, opened_at, duration_seconds}), authenticated RPC, no
   measurement content, no audio, ever. Spec of record:
   `T1_TOOL_USAGE_TELEMETRY_RPC_SPEC_2026_07_09_v1.md`.
2. **H3 flashcard gate views ≥2 → ≥1** — approved 2026-07-09, deploy held;
   now green-lit. Aligns the server gate with the display model
   (`studyDisplayPct`) on every surface (Dashboard + Enrollment meters).

## Ratifications of record (executed under owner direction this cycle)

- **Engine build order** ("build the engine", 2026-07-23): executed. Portable
  C++ DSP core (weighting, FFT/banding, ballistics, YIN, generator, waveform
  envelope, RT60/Schroeder) golden-tested 61/61 host-side; Swift/ObjC++ bridge;
  EAS build 2 (b7fd9334, commit 755af762) compiled it on iOS arm64 —
  ARCHIVE SUCCEEDED, zero errors.
- **Generator output path**: implemented as an ape-dsp extension
  (AVAudioSourceNode). Q4 caps (−20 dBFS default, −12 hard cap, session
  tap-through unlock) enforced IN the C++ core and proven by golden vectors.
- **Spike deviations ratified**: drop-NEWEST SPSC ring overrun (+counter);
  findings F1–F5 are platform truths binding future engine work.
- **Tuner merge** (spec recommendation accepted 2026-07-23): one dashboard
  tool, "Frequency Counter & Tuner" — 7 tiles total.
- **Tools access model**: tools + Saved Measurement Library + A/B compare are
  FREE; Learn/Demo tutorials and concept modules are Academy-gated (matches
  the ratified marketingLine).
- **Demo mode**: visual/animated only until an audio output UX ships;
  permanent "TRAINING DEMO — NOT A LIVE MEASUREMENT" badge (spec §5).
- **Clipping severity**: `input_clipping` grades INVALID (spec §15 Module 8
  "clipping invalidates data" outweighs §9's softer copy; flip back only with
  a ruling that also rewords the capstone). RT60 scopes clip flags to the
  armed capture window (2026-07-23 review) — flags describe the capture,
  never the session.
- **RT60 method honesty** (2026-07-23 review): every RT60 value carries ITS
  method (per band) and ITS fit's R²; invalid captures are unsaveable; poor
  fit is distinguished from insufficient range.

## Draft-pending items (need owner read-through, not blocking)

- Learn-mode tutorial copy (7 tools) + 8 concept modules
  (`src/features/tools/learn/`) — drafted from the spec of record by the dev
  session; treat as DRAFT until read through. Owner-authored texts (the spec
  itself, paywall copy 2026-07-23) are ratified by definition.

## Housekeeping

- `docs/service_key.txt` (0-byte stray) deleted 2026-07-23.
- Next EAS build should follow the RT60-UI commit (native gained per-fit R²
  marshaling + pending-flag arming after build 2; the RT60 screen shows
  R² 0.00 against build-2 clients until then).

*End of decisions log.*
