# AP&E — Governance & Decisions Log (2026-08-15)

Rulings of record from the audio-display refinement session
(`audio-tools-engine` branch). Successor to
`APE_GOVERNANCE_DECISIONS_2026_08_14.md`; earlier logs stand. Owner rulings
issued in the Claude Code dev session on 2026-08-15, verified on-device on BOTH
phones. The R-number series restarts at R1 per house style.

> Scope: the live-waveform trace rendering standard on dense multi-panel screens,
> the unified vertical-scale rule for all waveform-type traces, and removal of the
> RTA line traces. The 2026-08-14 amplitude-integrity + engine rulings stand and
> are refined (not overturned) here. Commit of record: `c0ddc1a`.

## R1 — WAVEFORM TRACE RENDERING ON DENSE SCREENS: SVG + MIN/MAX, NOT SKIA PER-PIXEL

The dedicated Waveform Viewer renders its trace as a Skia per-pixel envelope and
is smooth because it owns its screen. Porting that same per-pixel Skia approach
into the **multi-panel** screens (MultiMeter, Harmonic Lab) **starved the JS/render
thread — the whole screen (scope AND spectrogram) went clunky**, and the added
outline strokes made it worse. Ruling of record:

- On multi-panel live screens, render waveform traces with **react-native-svg +
  MIN/MAX downsample to ≤128 columns** over the correct time window. Min/max
  preserves every transient peak (DAW-style envelope) at high resolution while the
  draw stays as light as the original SVG.
- Pull the window **resolution-agnostically** from the fine engine history
  (`wantBuckets = round(total × windowSec / 6)`), so it auto-adapts to the native
  bucket duration (same idiom as `WaveformScreen` `capRef`/`bucketSec`). Never
  hardcode a bucket count (that broke when native buckets went 50 ms → 5 ms:
  a fixed 60/120 buckets silently became a 0.3 s / 0.6 s window).
- **Skia per-pixel is reserved for the single-panel Waveform Viewer only.**
- **No decorative outline/edge stroke on a waveform trace** — one filled body.
  (The MultiMeter mini-scope outline was removed.)

Applied to: MultiMeter mini-scope (3 s window), Harmonic Lab live strip (2 s
window). Both verified smooth + high-res on iPhone and Pixel.

## R2 — WAVEFORM VERTICAL SCALE: `Math.max(1.05, observed)` ON ALL THREE TRACES

All three waveform-type traces (Waveform Viewer, MultiMeter mini-scope, Harmonic
Lab live strip) use the SAME vertical scale: `scaleMax = Math.max(1.05, observed)`.

- This is **effectively fixed full-scale for normal signal** (≤ 0 dBFS → scale
  pinned at 1.05 → NO size pulsing), expanding **only past 0 dBFS** to reveal
  clipping (disclosed as "scale ±"). Colour stays keyed to true amplitude (0 dBFS
  → red invariant), consistent with the 2026-08-14 R2 fixed-colour rule.
- **Do NOT pin to `scaleMax = 1`** — that renders a quiet signal as a thin band on
  the centre line that reads as an unwanted "outline."
- **Do NOT pure-auto-gain (`v / observed`)** — that both pulsed AND crushed normal
  signal into a thin "green outline" on any transient. This was the Harmonic Lab
  live-strip defect; it now uses the shared `Math.max(1.05, observed)` rule.
- Honest trade-off accepted by the owner: at ×1 a quiet source draws small. The
  mini-scope has ×2/×4 zoom; the Harmonic strip has no zoom (soft input reads
  small there — acceptable).

## R3 — RTA IS BARS, NO LINE TRACE

The MultiMeter **LIVE SPECTRUM (RTA)** previously drew a fine **FFT** line trace
and an exponential **AVG** line trace over the LED bars. Owner: *"remove the
trace… I never wanted that."* Ruling of record:

- The RTA shows **LED bars + peak-hold ONLY**. Both line overlays
  (`ENV_LIVE` / `ENV_AVG`) and the FFT/AVG legend entries were removed.
- Do not re-add a line/curve overlay over the RTA bars.

## Also of record (2026-08-15)

- **EAS versionCode gotcha (resolved):** with `cli.appVersionSource: "remote"`
  and no `autoIncrement`, every `eas build --profile development` produced
  `Version code 1`, so a new APK installed over the old one left Android running
  the ANCIENT cached APK (why the Pixel waveform was stuck coarse). Fixes:
  immediate = uninstall then install fresh; permanent = `"autoIncrement": true`
  added to the `development` profile in `eas.json`. Lesson: if a native/DSP change
  isn't showing after a rebuild, check the build's Version code in
  `eas build:list` — identical versionCode = the device never updated.
