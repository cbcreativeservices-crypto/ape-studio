# Synthesis + Visualization Labs — Final-Polish Audit (night 2026-09-14b)

Scope: OscillatorLab, NoiseLab, HarmonicLab (HarmonicsView / HarmonicStage),
FmLab, ModularLab, EnvelopeLab (Sound Envelope & Transients + EnvelopeChart),
BinauralLab, and the shared visualization modules (wave/**, digital/**,
vizQuant). REPORT ONLY — no edits made. Read screen-by-screen; math and
animation code verified by reading, not run. Device-only motion smoothness is
flagged explicitly where it cannot be judged from source.

## Verdict

- **Critical: 0**
- **Major: 0**
- **Minor / safe-fixes: 2**
- **Owner-decision (consistency, not a bug): 1**

The mic-lab "SVG paint server referenced but not defined → opaque black" bug
does **not** recur anywhere in this set. Every `url(#…)` in the react-native-svg
labs resolves to a `<Defs>` entry in the **same** `<Svg>` document. The Skia
viz files (wave/**, digital/**) use child-element gradients, not `url()`
references, so that failure mode is structurally impossible there.

## Per-lab grades

| Lab | Grade | Notes |
|---|---|---|
| OscillatorLab | A- | Seamless traveling-strip tiling verified; scroll direction is an owner-consistency question (below). |
| NoiseLab | B+ | Correct slopes + honest speaker view; one always-on 14 fps React re-render loop (safe-fix #1). |
| HarmonicLab / HarmonicsView | A- | Large, exceptionally well-guarded (start-serialization, generation counters, focus-gated native sweep, memoized heatmap). |
| FmLab | A- | Bessel J_k(I) series correct; fold/alias handling honest; Carson BW correct. |
| ModularLab | A- | Live native modStatus readouts; all paint servers local; poll + keepalive gated and cleaned. |
| EnvelopeLab + EnvelopeChart | A- | Per-instance gradient ids via useId; honest badges; minor unmount-cleanup nit (safe-fix #2). |
| BinauralLab | A- | Woodworth ITD + sin-θ ILD with correct front/back folding; PanResponder anchored-drag; generation guard. |
| Wave viz (shared Skia) | A- | Focus-gated frame clocks, fixed per-frame node counts; motion smoothness is a device-only check. |
| Digital viz (vizQuant + modules) | A | Static-per-state geometry; real quantizer/dither math; clocks focus-gated; intervals cleaned. |

## Findings

### SAFE-FIXES (low severity)

**[PERF] NoiseLab — shimmer clock re-renders the whole chart 14×/s while merely focused**
`NoiseLabScreen.tsx:427-433` — `SlopeChart` drives a `setInterval(…, 70)` inside
`useFocusEffect` that calls `setTick`, forcing a full React re-render of the
component (rebuild of the 48-point shimmer path + 5 `EasedSlopeLine` + label
nodes) ~14×/second. It runs **whenever the lab is focused**, regardless of
whether noise is playing or the user is interacting. Correct and cleaned-up on
blur (no leak), but it is the one standing "runaway per-frame work" candidate in
the set. Fix options: gate the shimmer on `running` (only animate while noise
sounds), or move the jitter into a Reanimated `useDerivedValue` worklet like the
other labs so the UI thread carries it. Verify smoothness on device.

**[ANIM] EnvelopeChart — no cancelAnimation on unmount**
`EnvelopeChart.tsx:113-129` — `startSweep`/`stopSweep` and the shape-change
effect (`useEffect(() => { stopSweep(); }, [shapeKey])`) manage `prog`, but there
is no unmount cleanup, and the `withTiming` completion callback runs
`runOnJS(setPlaying)` which can fire after unmount. Benign in practice
(Reanimated tears down shared values; late setState is tolerated), but a tidy
`useEffect(() => () => cancelAnimation(prog), [prog])` would close it. No visual
symptom expected.

### OWNER-DECISION (consistency question, not a defect)

**[VIZ] OscillatorLab traveling wave scrolls rightward**
`OscillatorLabScreen.tsx:417-427` — the strip animates `shift` from `-w/2` to `0`,
so the waveform travels **rightward**. Tiling is exact (period = w/2 px over a
3-cycle path spanning w·1.5) so the wrap is genuinely seamless — verified, no
seam bug. The direction is defensible because this is a synthesized traveling
wave, not a time-history scroll. Flagging only against the memory standard "time
axes animate one direction" for cross-lab consistency — owner call.

## What's GOOD (deliberate call-outs)

- **Paint servers all resolve locally.** oscWaveLevel + harmonicLevelRamp
  (Oscillator), harmModelLevel + harmWaveLevel (HarmonicsView — the second is
  gated behind the same `liveWave` truthiness as its reference, so it never
  dangles), mdBg/mdPlate/mdScrew (Modular), and EnvelopeChart's two gradients
  are each defined in the same `<Svg>`'s `<Defs>` as their `url(#…)` use.
  EnvelopeChart scopes its ids per instance via `useId()`, so multiple charts on
  one page (gallery, etc.) cannot collide — the correct pattern.
- **Visualization math is correct and honest.**
  - FM: `besselJ` is the standard ascending series (term_0 = (x/2)^k/k!, exact
    recurrence), evaluated for the lab's range; sticks at fc ± k·fm; negative-
    frequency reflection vs above-Nyquist alias folds are distinguished (dashed
    reflect vs red alias) and Carson BW = 2·fm·(I+1) is correct.
  - Noise: slopes 0 / −3 / −6 / +3 / +6 dB/oct (white/pink/brown/blue/violet)
    are textbook; the "brown/pink guard" copy is derived from the same helper as
    the audio path (no drift).
  - Binaural: Woodworth ITD = (a/c)(θ + sinθ) with a=0.0875 m, sin-θ ILD, and
    correct front/back θ-folding (cone-of-confusion honesty matches the copy).
  - vizQuant: real mid-tread two's-complement quantizer, clamp [−2^(N−1),
    2^(N−1)−1]; RPDF/TPDF/noise-shaped dither is real seeded math; the spectrum
    strip is explicitly badged "SIMPLIFIED SHAPE (NOT AN FFT)".
- **Honesty badges present and dynamic** in every lab: ANALYTIC MODEL / SPEAKER
  HPF views, SIMPLIFIED BINAURAL — NOT MEASURED HRTF, ILLUSTRATIVE MODEL,
  TYPICAL VALUES — NOT MEASURED, "waiting for spectrum frames" empty states —
  never a fabricated meter or column.
- **Animation lifecycles are disciplined.** Native-driver Animated loops and
  Reanimated `useDerivedValue` frame clocks are gated on focus (`useIsFocused` /
  `useFocusEffect`) across wave/** and digital/** modules; tone, keepalive, and
  spectrogram-poll intervals are gated on `running` and cleaned up; every async
  start uses a generation-counter stale guard (and HarmonicsView adds
  start-serialization for the double-tap/solo races).
- **All retrieval check-questions are factually correct** across the six
  synthesis labs (verified answer keys and explanations).

## Device-only checks (cannot judge from source)

- Smoothness of the NoiseLab shimmer vs the safe-fix above.
- Reanimated traveling-strip and settle-bar overshoot on Oscillator; playhead
  sweep timing on Harmonic and EnvelopeChart.
- Skia wave-physics ring/pulse-node motion (fixed node counts confirmed in
  source; frame-rate must be seen on hardware).
