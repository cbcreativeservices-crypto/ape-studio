# FX-Rack Lab Family — Final-Polish Audit (night 2026-09-14b)

REPORT ONLY. No source edited, no git/DB/network touched. Screen-by-screen, each lab
judged on its own merits even where code is shared.

## Files read in full
- `src/screens/lab/fxLabConfigs.tsx` (all 12 configs)
- `src/screens/lab/FxLabScreen.tsx` (config-driven host, audio lifecycle, GR polling)
- `src/screens/lab/fxAnim.tsx` (Skia animated heroes — every flow)
- `src/features/lab/fxViz.tsx` (static SVG heroes + GR meters)
- `src/screens/lab/LabShell.tsx`
- `src/screens/lab/rack/*` (RackUnit, ParamLane, DockButton, DockTray, BezelReadouts, rackTypes)
- `src/features/lab/guidedLessons/content.ts` (all 12 FX lessons)
- `src/features/lab/attentionPulse.tsx`, `src/screens/lab/foundations/viz.tsx` (usePhaseClock)
- `modules/ape-dsp/index.ts` (FX_PARAM id map — cross-checked against every config)

---

## HEADLINE
No critical findings. No major bugs. The four bug CLASSES the pass was hunting are
essentially clean:

1. **SVG paint-server black-smear (url(#id) undefined) — NOT PRESENT.** The animated
   heroes use `@shopify/react-native-skia`, where gradients are inline child elements of
   the painted node (no url() references at all). The static heroes use `react-native-svg`,
   and every `url(#…)` there resolves to a `<Defs>` in the SAME `<Svg>`: `fxRcgFill`,
   `fxTcgFill`, `fxWsFill`, `fxEchoBar`, `fxEchoEnv`, `fxDecayFill` — all local, all
   defined. No `<Mask>`, `feGaussianBlur`/filters, or `mix-blend` anywhere in fxViz. This
   family is not exposed to the mic-lab defect.
2. **Animation-loop leaks — NOT PRESENT (one minor cross-cutting exception, below).**
   `usePhaseClock`/`useVizClock` use `useFrameCallback` gated by `setActive(active)` where
   `active = screen focus`; a blurred-but-mounted lab does zero per-frame work.
   `useGlide`/withTiming and the distortion crossfade use shared values (no timers).
   `attentionPulse` withRepeat is cancelled on unmount and honours reduced-motion.
   GR polling `setInterval` and the activity keepalive both clear on stop/unmount.
   `DockTray` BackHandler subscription is removed on close.
3. **Image/asset integrity — N/A.** The entire FX family requires ZERO image/font/asset
   files. Nothing to break.
4. **Config correctness — every FX_PARAM id referenced exists** and maps to a distinct
   index within its node (verified against `modules/ape-dsp/index.ts` lines 543-593). Every
   config `lessonKey` resolves to a real control entry in `content.ts`. The shared-node
   inheritance trap (FX.mod across chorus/flanger/phaser; FX.stereo across phase/stereo) is
   correctly defended with `fixed:[]` blocks in all five affected labs.

The family reads as A-grade. Findings below are polish (minor) plus two cognition items
that are genuinely design decisions, not defects.

---

## PER-LAB GRADES

### EQ — A
Fader (log 100–8k) → curve → caption all consistent. Pass-filter caption correctly drops
GAIN/Q ("the slope is fixed; only the cutoff moves") — a prior fix that holds. Animated
EQ flow re-weights a 3-band composite via the exact `eqResponseDb`, gain-clamped to 4×.
Checks are sound. GOOD: the pass-filter caption branch is a genuinely thoughtful correction.

### Delay — A− (one cognition item)
Timeline math (spacing=time, decay=fb, ping-pong sides) and the BPM caption
(`60000/timeMs` = quarter-note tempo) are correct. **REPEAT DAMPING (`dampHz`) changes the
DSP audio but is expressed in NEITHER hero** — the echoes never visibly darken. On web
preview / pre-v6 clients (no audio) the COLOR tray's damping half is fully inert. Audible
on device, so honest, but a "silent control" on the display. See cognition note.

### Reverb — A− (one cognition item)
Decay slope, RT60 marker (where the line crosses −60 dB), pre-delay gap all correct.
**HF DAMPING (`reverbDampHz`) is not passed into the anim model at all** (`anim` sends only
rt60/preDelayMs/mix) and is not drawn in the static decay curve — same silent-control class
as delay damping. MIX and pre-delay ARE expressed. Otherwise excellent.

### Chorus — A
Comb sweep (solid = now, ghosts = LFO extent), the "100% wet = vibrato" caption, and the
detune-beating explanation are all correct. Shared-node `fixed:[modMode:0, modFeedback:0]`
present. Notch-spacing caption (`1000/centerMs`) correct.

### Flanger — A
Even-comb hero, `fixed:[modMode:1]`, negative-feedback "hollow" choice, notch-spacing
caption (`1000/centerMs`) all correct. SWEEP dock-group keeps dock ≤5. The center-delay
teaching fader (manual tape-flange) is the right primary control.

### Phaser — A
Sparse UNEVEN notches via `phaserResponseDb`, `fixed:[modMode:2, modMix:0.5]` (Hero hardcodes
the same 0.5 — consistent), notch-count caption (`stages/2`). The flanger-vs-phaser contrast
is the whole lesson and it lands. DEPTH=STATIC enables a clean manual sweep.

### Compression — A
The envelope-follower rewrite in `DynamicsFlow` (attack/release now mirrored, with a
hoisted-exp perf pass and a causal pre-roll) is correct and well-reasoned. Threshold range
−50…−10 with the fader spanning the chips; CLICK-first source so GR visibly moves; live
`fxGrStatus` GR on bezel + ladder + meter, fed 0 while silent (honest). Transfer curve's
NET operating-point marker (includes makeup, so it can't disagree with the GR meter) is a
strong teaching touch.

### Gate — A
The attack/release EDGE-SWAP bug (shipped 2026-09-11, gate never opened at defaults) is
FIXED and correct: for a gate `gr` FALLING = opening = fast edge, with HOLD tracked as
state-over-time (`sinceOpen`). GATE ATTENUATION label + maxDb=70 scale (vs 30 for
comp/limiter) is right. No `sourcePeakDb` on the gate transfer curve — correct, since a gate
acts on what a hit decays TO, which a peak marker can't express (documented).

### Limiter — A
Brickwall shelf, ratio→∞ framing, constant-GR caption (`|ceiling+20|` dB for a −20 dBFS
source) all correct. SINE-first (ceiling expressible on a steady tone) with a transient one
tap away for RELEASE — the source ordering is deliberate and right. `attackMs:0.1` in the
anim matches the engine's forced LimiterMode value (Effects.hpp:373).

### Distortion — A− (one cognition item)
Waveshape via exact `distShape`, odd-vs-even caption keyed to type, MIX blended in both
heroes (a prior static/anim divergence fix). **OVERSAMPLING (`oversample`) is audible-only**
— aliasing is a spectral artifact invisible in a single-cycle waveshape, so the toggle moves
nothing on either display. The `note` and the choice label ("OFF — HEAR ALIASING") set the
expectation, so it is honest, but it is a display-inert control (same class as damping).

### Phase — A
Lissajous + correlation, polarity-vs-phase distinction, `fixed:[widthPct:100, pan:0,
bassMonoHz:0]` guarding the shared FX.stereo node. DELAY R fader correctly declares an honest
`home:0` (one of only two teaching faders in the set with a neutral value). Cancellation
demo (INVERT + MONO → flatline) is correct.

### Stereo — A (one minor copy note)
Width = SIDE/MID scaling, correlation safety gauge, `fixed:[invertR:0, delayRms:0]` guard,
honest `home:100`. Minor: the LESSON formula states M/S with `/√2` (energy-preserving encode)
while the viz/anim use `(L±R)/2` (averaging). Correlation is scale-invariant so nothing on
screen contradicts, but a student comparing the printed formula to the model sees a constant
factor. Teaching simplification, not a bug.

---

## FINDINGS

### SAFE FIXES the main session can apply (surgical, low-risk)
There are **no code bugs requiring a fix.** The only surgical, no-risk items are optional
copy touch-ups (all owner-review since copy is governed):

- **[COPY] minor — `content.ts` stereo `formula` (line 569) vs viz convention.** The lesson
  prints `M = (L + R)/√2`; the LissajousGraph/StereoFlow use `(L+R)/2`. If exactness matters,
  either note "(a scaling convention; this app's meter uses the averaged M/S)" or switch the
  formula to the `/2` form. Correlation math is unaffected either way. Owner-review (governed
  copy), so not a silent edit.

### Needs owner / design decision
- **[COGNITION] major-ish — three "display-inert" audio-only controls.** Delay REPEAT
  DAMPING (`fxLabConfigs.tsx` ~L246), Reverb HF DAMPING (~L342), Distortion OVERSAMPLING
  (~L1155) each change the real DSP but move NOTHING in either hero. On device they are
  audible; on the web preview and any pre-v6 client they are fully inert (no audio, no
  visual). This is the same family as the historical "test signal cannot express parameter"
  problem, but here it is a coverage gap rather than a wired-wrong control. Options for the
  owner: (a) accept as audio-only and lean on the existing labels/notes (current state, and
  it IS honest); (b) add tone-darkening to the delay echoes and the reverb wash tail in
  `fxAnim` (EchoFlow/ReverbFlow) so damping reads visually; (c) for oversampling, the honest
  visual only arrives with the analyzer/FFT view already noted as future work. Recommend
  leaving oversampling for the analyzer view and deciding (b) for the two damping controls.
- **[HONESTY nuance] minor — the animated-hero badge says "EXACT JS MIRROR OF THE DSP
  MATH."** For the three controls above, the model silently omits those params. The primary
  transformation IS mirrored and the omissions are second-order tone, but if the two damping
  controls are NOT visualized, consider softening the badge (e.g. "mirrors the primary
  transformation") so the claim isn't overstated. Owner call.
- **[ANIMATION-CODE] minor, cross-cutting (NOT FX-specific).** `ParamLane`'s cap-line
  attention pulse (`usePulseStyle`, `attentionPulse.tsx`) runs its `withRepeat` loop whenever
  the lane is mounted; it is NOT gated by screen focus the way `usePhaseClock` is. Native-stack
  keeps pushed-under screens mounted, so a stack of visited rack labs each keeps one opacity
  tween alive. Cost is negligible (a single interpolated shared value per lane, UI thread),
  and it is shared by 30+ labs — out of scope for a surgical FX edit, but worth a line in the
  perf backlog if the mounted-screen count ever grows.

### Verified NON-issues (checked, and fine)
- Fixed SVG gradient ids are module-level constants, but only ONE static FX hero renders per
  screen (the stage shows the Skia anim; the well shows the SVG hero — never two SVG heroes),
  so there is no same-document id collision even on web. Safe.
- Shared-node param inheritance (the 2026-09-12 flanger-mix-100%→phaser-all-pass bug) is
  defended in all five shared-node labs via `fixed:[]`. Confirmed present and correct.
- GR meters/ladder are fed the real `fxGrStatus` and forced to 0 while silent — no fake-meter
  violation. Gate uses a 70 dB scale, comp/limiter 30 dB. Correct.

---

## GRADE SUMMARY
EQ A · Delay A− · Reverb A− · Chorus A · Flanger A · Phaser A · Compression A · Gate A ·
Limiter A · Distortion A− · Phase A · Stereo A

Critical findings: 0 · Major findings: 0 (one cognition item rated "major-ish" — the three
display-inert audio controls — is a design decision, not a bug).

Top safe fixes: none are bugs. The only actionable items are (1) owner decision on
visualizing delay/reverb damping in the animated heroes, and (2) an optional one-line copy
reconciliation of the stereo M/S formula. Nothing blocks release.
