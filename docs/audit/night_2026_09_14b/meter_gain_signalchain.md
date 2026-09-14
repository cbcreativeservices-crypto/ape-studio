# Meter / Gain / Signal Chain — code audit (Track B, overnight 2026-09-14b)

Full read of meter/**, gain/**, SignalChainLabScreen + shared foundations clocks.

| Lab | Grade | Critical | Major | Minor |
|---|---|---|---|---|
| Meter (Visual Audio Analysis) | A (M7 was C, now FIXED) | 0 | 1 FIXED | 2 |
| Gain Staging | A | 0 | 0 | 0 |
| Signal Chain Builder | A | 0 | 0 | 0 |

## Fixed this run
- Waterfall CSD (M7) EQ-boost renormalization — vizSpectral.tsx:998 stale
  `eqBoostDb` → `eqGains: {}` (see _FIXES.md). This is the flagship CSD.

## Minor (owner-glance, not fixed)
- VU ballistics inconsistency: bezel NDL MAX readout integrates at tc=0.3s
  (meterEngine vuStep) while the drawn needle worklet uses tc=0.20s
  (vizMeters:945). Both explicitly illustrative; number vs picture slightly differ.
- meterEngine vuStep comment calls tc=0.3s "~300ms integration" — conflates a
  real VU's 300ms-to-99% rise-time with time-constant (a 300ms VU ≈65ms tc).
  Fine as a "too slow for transients" teaching model; wording only.

## Verified correct (spot list)
- sine peak = RMS+3.01dB; pink −3dB/oct; square RMS≈peak (band-limited);
  LUFS 400ms/3s/integrated-gated, streaming −14 / broadcast −23..−24;
  true-peak vs sample-peak intersample; correlation −1 mono-cancel; Lissajous
  45°=mono; DC-offset, clip-irrecoverable, hum-vs-feedback, room-mode-vs-EQ.
- NO dBFS-as-SPL violation: meter levels labelled dBFS, never SPL. Honesty
  badges pervasive ("SYNTHESIZED TEACHING SIGNAL", BS.1770 "not a compliance
  meter", uncalibrated-mic AccuracyNote). Detective de-cued + PASS persists.
- Gain: distortion latches downstream (fader lowers level, never clears clip);
  noise floor is a real power-sum; LowHigh verdict follows whole chain.
- SignalChain: honest fixed COMP-before-GATE caveat; GR meters "MEASURED, LIVE";
  genRef guards stale async; intervals running-gated + cleaned; blur stops audio.

## Bug-class sweep (this group)
SVG-black: CLEARED (Skia gradients-as-children in vizMeters/vizSpectral/foundations;
gainViz react-native-svg is literal stroke/fill only — zero url() refs). Animation
leaks: none (frame-callback clocks setActive(running); intervals cleaned + gated).
Conditional hooks: none (WfSlice renders constant WF_SLICES=56 → stable hook count).
