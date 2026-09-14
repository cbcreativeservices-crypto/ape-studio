# Wave Physics / Digital Audio — code audit (Track B, overnight 2026-09-14b)

Full read of wave/** (15 modules + Room Builder + engine + vizWave 2069 lines)
and digital/** (8 modules + 4 viz). Near reference quality.

| Lab | Grade | Critical | Major | Minor |
|---|---|---|---|---|
| Wave Physics (15 modules) | A (2 modules A−) | 0 | 0 | 4 |
| Digital Audio (8 modules) | A | 0 | 0 | 2 |

## Verified-correct (hand-checked)
- speedOfSound(20)=343.2; mode freq (c/2)√((nx/w)²+(ny/h)²); Schroeder 2000√(RT/V);
  Sabine 0.161V/A; reflection loss −10log(1−α); grating-lobe λ<d(1+|sinθ|);
  cardioid correctDelay d/c=3.5ms, wrong-way null c/4d≈71Hz; line-array L≈λ→172Hz;
  beam-steer Δt=d·sinθ/c; diffraction 80Hz→4.3m, 4kHz→8.6cm; Fresnel N=2δ/λ.
  Diffusion c/(2·depth) verified correct (Schroeder design freq, not a factor-2 error).
- Digital: aliasing signed fold; dynamic range 6.02N+1.76 (8b→49.9, 24b→146 with
  honest 144/ENOB≈120 nuance); two's-complement MSB −32768 + 32768/32767 asymmetry;
  data rate 48k·24·2=2.304Mbit/s; ISP true-peak≥sample-peak; reconstruction =
  band-limited interpolation (NOT staircase); jitter≈slope×Δt; 32b float ~±770dB.
  Real RPDF/TPDF/noise-shaped dither math, correctly badged.

## Fixed this run
- modWaveB.tsx:1084 comment "~80–100 ms" echo-fusion → "~50 ms" to match the
  module's user-facing Haas threshold (timeline marker, verdict, reveal all 50ms).

## Minor (owner-glance, not fixed)
- waveEngine.ts:275 maekawaAttenuationDb has no upper cap → Module 5 LOSS @8kHz
  ~27.6dB while a real knife-edge tops ~24dB and the prose says "20-something".
  Optionally clamp ~24dB (disclosed Maekawa model — defensible as-is).
- Refraction: readout curves the ray ×0.08 (physical) while the drawing curves
  the fan ×1.2 (exaggerated for the 90m scene) — self-consistent + badged, but
  the drawn bend and "RAY @ 150m" number don't visually correspond.
- Echo preset blurbs quote full-room round-trip (2d/c) while live GAP readout is
  direct-vs-first-reflection at the default spot — can diverge; framed as room char.
- Digital modChain.tsx:107 gain constants hand-duplicated instead of importing the
  exported GAIN_MODEL (vizChain.tsx:773); currently in sync, can drift. Import it.
- Remote-bucket photos (line-array/subwoofer/foam/fiberglass webp) load from
  glossary-images public bucket — by design, not verifiable in-repo.

## Bug-class sweep (this group)
SVG-black CLEAN (Skia gradients-as-children; only react-native-svg is
ArrivalTimeline with literal fill/stroke). Hooks CLEAN (PulseNodes NODE_BUCKETS=24,
buildStrip ×3 — fixed-count same-order). Animation leaks CLEAN (frame-callback
clocks focus-gated; pulseT withRepeat has cancelAnimation; intervals cleared).
