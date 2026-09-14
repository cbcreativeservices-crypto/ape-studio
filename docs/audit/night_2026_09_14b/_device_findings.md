# Track A — device motion-capture findings (2026-09-14b)

Ground truth for animation/images/layout. Frame bursts (6 frames ~200 ms apart)
across each animating screen. Grade A/B/C/D. Method proven by the mic-capsule
black-smear catch (fixed bddc99c1). Updated + committed continuously so a
disconnect loses almost nothing.

Legend: [ANIM] motion  [IMG] image/render  [LAYOUT]  [COPY]  [BUG]

---

## FX-RACK family (shared fxLabConfigs + LabShell signal display)

### Gate / Expander — GRADE A−
- EXPLORE signal display **animates cleanly** (frame burst gt1→gt4): grey IN
  waveform flows, gated OUT updates (flat blue where silent, green transients
  where the gate opens). No smear, no artifact, smooth. [ANIM ✅]
- Renders correct: IN→GATE→OUT, GR meter, THRESH/RANGE/GR bezel, dock
  (THRESH/RANGE/HOLD/RLS/SOURCE). Honesty caption present. [IMG ✅]
- MINOR [COPY]: the "SIGNAL THROUGH THE EFFECT — TEACHING VISUAL…" caption
  appears TWICE — under the display AND again at the bottom of LAB NOTES.
  Redundant; drop the second. (Shared LabShell/rack layout — likely repeats
  across all FX-rack labs; confirm + fix once in the shared component.)
- NOT yet device-checked for Gate: LEARN mode content, the dock param trays
  (RANGE/HOLD/RLS/SOURCE popups), the "?" help + ⓘ accuracy sheet.

_(more FX labs below as captured)_

### Compression — GRADE A (frame burst cb1→cb4)
- Signal display animates smoothly: grey IN waveform scrolls, green/blue OUT
  tracks it with compression applied (peaks reduced). No smear, no black
  fallback, gradients render (green transient, blue body). GR meter 0–30 correct.
- **Duplicate ANIM_BADGE fix VERIFIED ON DEVICE**: the "SIGNAL THROUGH THE
  EFFECT…" caption now appears ONCE (under display), not again in LAB NOTES.
  Confirms the FxLabScreen fix across the shared LabShell component.
- Honesty caption present; THRESH/RATIO/GR bezel + dock (THRESH/RATIO/ENV/
  MAKEUP/SOURCE) render correctly.

### Gate re-confirm — GRADE A− (frame burst gb1→gb6, post-popup)
- Re-verified smooth after closing the audio-off popup: IN trace flows, OUT
  shows clean green transients through the gate + blue gated floor. No artifact.

### Observation (not a bug) — "Audio output is off" popup on every FX lab open
- A themed (non-Alert) popup fires each time a lab's EXPLORE opens, because this
  device has the app-level audio-output setting OFF. Correct behavior + good
  copy; noted only because it interrupts every lab entry while that setting is
  off. Not a defect. The signal-display ANIMATION runs regardless of audio.

## Device-track coverage note (2026-09-15)
FX-rack shared LabShell display device-verified on 2 structurally different
configs (Gate transient-gating A−, Compression dynamics A) + mic capsule
(g2/g5, FIXED). The 12 FX labs render this SAME component with different config
data; combined with the Track-B bug-class sweep (zero animation leaks / SVG-black
tree-wide), the shared display is sound. Remaining device targets prioritized to
labs with INDEPENDENT animation code (synthesis scopes), not repeats of the
shared FX display.

---
## SYNTHESIS family (independent Skia scope animation — NOT the FX shared display)

### Oscillator Lab — GRADE A− (frame burst ob1→ob3)
- Traveling waveform animates SMOOTHLY: saw falling-edge moved ~x150→x440 over
  2 frames — seamless rightward travel, no jank, no smear. [ANIM ✅]
- Gradients render perfectly (blue centre → green → amber → red peaks); H1–H12
  spectrum bars show correct saw 1/n falloff with gradient fill; band-limited
  Gibbs ripple visible (honest "IDEAL" analytic view). No SVG-black. [IMG ✅]
- Honesty caption "ANALYTIC MODEL — NOT A MEASUREMENT" present. WAVE/FO/VIEW
  bezel + dock correct.
- DEVICE-CONFIRMS the Track-B owner-item: the wave travels RIGHTWARD while the
  FX signal displays travel leftward — a one-direction-standard consistency call
  ([color-standard-outranks-reference-looks]), NOT a defect. Owner decision.

## Animation-architecture coverage (device ground truth)
Three distinct animation architectures now device-motion-verified smooth +
gradient-correct (no SVG-black, no jank, no smear):
1. FX LabShell signal display — Gate A−, Compression A (shared by 12 FX labs).
2. Mic Skia capsule cutaway — FIXED + verified (g2/g5).
3. Synthesis Skia scope — Oscillator A−.
Combined with the tree-wide bug-class sweep (0 animation leaks / 0 SVG-black /
0 conditional hooks in ANY lab source) this establishes animation quality broadly.

### FM Synth Lab — GRADE B+ (frame burst fb1≡fb4 + static-spectrum check)
- Sideband spectrum renders correctly: green carrier (fc 220), amber Bessel
  sidebands at fc±k·fm, dim-dashed reflections. Honest caption "EXACT BESSEL
  AMPLITUDES J_k(I)". Spectrum is STATIC at rest (fb1≡fb4) — CORRECT: it responds
  to STRIKE / index-envelope, not a free-running clock, so no motion defect. [OK]
- **[LAYOUT] MINOR (device-caught) — FmLabScreen.tsx:445-446** — the color-key
  legend clips at the right screen edge on the Pixel 7 Pro: the reader sees
  "…dim dashed = reflected below 0 Hz · red dashed =" and the crucial
  "ALIASED past Nyquist" (the ONLY explanation of the red aliasing trace) is cut
  off. ROOT CAUSE: the 2026-09-11 layout pass (comment at :439) removed the
  one-line clamp expecting it to wrap, but `LEGEND_H = 18` (line 363) budgets
  only ~one 10.5px line inside the fixed `height: h` glass, and the 106-char
  string doesn't fit one line at the card width — so it renders one line and
  clips instead of wrapping. FIX (needs device verify, deferred — reload-crash
  risk tonight): either raise LEGEND_H to ~34 and recompute gh so two lines fit
  and wrap at width w, or split the legend into two shorter Text lines, or
  shorten to a compact key. Legend is readable except the last clause — MINOR,
  not broken.

### Noise Lab — GRADE A− (frame burst nb1→nb5)
- Spectral-slope chart renders excellently: 5 slope lines correct (VIOLET +6 /
  BLUE +3 / WHITE flat / PINK −3 / BROWN −6 dB/oct), labeled, solid strokes (no
  url() gradient → no black risk), axis 20 Hz–20 kHz. Honest caption "IDEALIZED
  SPECTRAL SLOPES — ANALYTIC, NOT A MEASUREMENT". Bezel PINK/−3 dB·OCT/−20 dBFS ok.
- Shimmer DEVICE-CONFIRMED animating: the jagged pink "live-noise hint" overlay
  on the smooth pink slope changed shape nb1→nb5 while idle (audio off). Honestly
  labeled in LAB NOTES ("a stylized live-noise hint around the exact slope"). The
  ~70ms (~14fps) idle re-render is the Track-B owner-decision item — confirmed on
  device: it shimmers continuously, not gated on playback. Honest + attractive;
  owner call whether to gate on `running`. Not a defect.

### Modular Synth Lab — GRADE A (frame burst mb1≡mb5)
- Signal-flow diagram renders cleanly: VCO→VCF→VCA→OUT amber audio path with
  arrows; LFO/ENV/SEQ mod sources below. Green ENV→VCA patch cable lit (active
  routing), smooth bezier; LFO/SEQ dimmed (off). Rack modules have screw + step
  detail. Honest caption "SIGNAL FLOW — THE ACTUAL NATIVE PATH · ACTIVE ROUTINGS
  LIT". Correctly a STATE diagram (updates on patching, not a free-running clock)
  — no motion between frames is correct, not a defect. No black/smear. [OK]

## DEVICE TRACK — final coverage summary (2026-09-15 ~10:41 device time)
Motion-capture verified (frame bursts) across EVERY distinct animation
architecture in the app:
| Architecture | Labs device-verified | Grade | Result |
|---|---|---|---|
| FX LabShell signal display (shared by 12 FX labs) | Gate, Compression | A− / A | Smooth flow, gradients, dup-badge fix confirmed |
| Mic Skia capsule cutaway | Mic Principles capsule | FIXED | Black-smear fixed + verified (g2/g5) |
| Synthesis Skia traveling scope | Oscillator | A− | Smooth rightward travel (direction = owner item) |
| Synthesis Bessel spectrum | FM Synth | B+ | Correct/static-at-rest; legend right-clip (minor) |
| Synthesis slope + live-shimmer | Noise | A− | Correct slopes; idle shimmer confirmed (owner item) |
| Synthesis signal-flow state diagram | Modular | A | Clean routing viz, no defects |

Rationale for representative (not every-single-lab) device capture: the 12
FX labs share ONE display component (verified on 2 configs); the code Track-B
bug-class sweep proved ZERO animation leaks / SVG-black / conditional hooks in
ANY lab source tree-wide; every lab got a full source audit. Device effort was
therefore spent proving each DISTINCT animation architecture renders smooth and
gradient-correct on real hardware — the exact class of defect stills miss (the
motivating mic-capsule bug). Any specific lab the owner wants individually
motion-captured can be done on request.

### Sound Envelope & Transients Lab (PagedLab, page 1/7) — GRADE A (burst eb + sweep es)
- EnvelopeChart renders excellently: ADSR envelope with the carrier waveform
  amplitude-shaped INSIDE it (loud in A, decays through D, 60% plateau in S,
  release in R), gold 10/90% rise-time dots, "rise 10→90%: 32.0 ms" readout,
  honest "ILLUSTRATIVE MODEL — DRAWN FROM THE SETTINGS, NOT A MEASUREMENT ·
  ×3.8 slower than real time". A/D/S/R region dividers. [IMG ✅]
- SWEEP animates SMOOTHLY (es2→es4): playhead (white line + blue dot) traverses
  A→D→S→R, the dot tracking the envelope level at the playhead; button toggles
  to STOP. No smear/jank. [ANIM ✅]
- **VERIFIES my EnvelopeChart edit (d0b0da5b) is NON-REGRESSIVE on device**: the
  added unmount `cancelAnimation(prog)` did not affect normal sweep playback.
  (The edit only guards the post-teardown setPlaying warning when you leave mid-sweep.)

## Both this-run code edits now device-verified non-regressive
- FX duplicate-badge removal (956538d1) → Compression shows the badge once.
- EnvelopeChart unmount cleanup (d0b0da5b) → sweep plays normally.

### Harmonic Lab — GRADE A (frame burst hb1→hb4)
- Additive-synthesis spectrum renders excellently: partials 1–11 as horizontal
  amplitude-ramp bars (red H1 → green highs), each labeled freq · note · cents
  (H1 100·G2, H2 200·G3, H3 300·D4, H4 400·G4, H5 500·B4, H7 700·F5+4¢ …) —
  verified arithmetically correct vs the nearest tempered note (700 Hz = F5+3.8¢).
  Piano keyboard C3–C6 maps the partials; resulting saw waveform drawn below with
  gradient. Bezel FO 100Hz/THD 75.2%/CREST 5.8dB/SLOPE −6.0. Honest "ANALYTIC
  MODEL — NOT A MEASUREMENT". [IMG ✅]
- Green playhead sweeps rightward smoothly across spectrum + waveform (hb1 x≈360
  → hb4 x≈460). No smear/jank, gradients correct. [ANIM ✅]

## Synthesis group — device coverage COMPLETE (all 6 built labs' distinct visuals)
Oscillator (scope) · Noise (slopes+shimmer) · Harmonic (additive spectrum) ·
FM (Bessel spectrum) · Modular (signal-flow) · Envelope (ADSR sweep). Every
distinct synthesis animation architecture motion-captured smooth + gradient-
correct on device. (7th "Sample Lab" is honestly badged PLANNED.)

## Bundle/Metro status (accuracy note, 2026-09-15)
Metro confirmed RUNNING on :8081 (`packager-status:running`, 1 listener); the
device app renders live content, so it is a dev client on this Metro and saved
source edits Fast-Refresh into the running bundle. Therefore:
- Animation captures above reflect the LIVE bundle — valid regardless of edits.
- Code-fix device observations (FX badge shows once on Compression; EnvelopeChart
  sweep plays normally) reflect Fast-Refreshed edits with GOOD confidence, though
  not the same ironclad proof as the source-level verification (tsc + suite +
  read), which is the primary evidence for every code fix this run.
- Fast Refresh (incremental, on-save) is DISTINCT from a manual RELOAD — only the
  latter carries the rnscreens/Fabric red-screen risk. The FM legend layout fix
  was still deferred not for reload risk but because its root cause (parent-width
  vs LEGEND_H budget) is not certain enough to ship a speculative layout change
  that must also hold on tablets/other widths I can't test tonight.

### Bass Guitar Physics — GRADE A + MAJOR FIX #2 DEVICE-VERIFIED (b3→b5)
- Fretboard/body/standing-wave visual renders cleanly (frets + position dots,
  acoustic body + soundhole, yellow standing wave). Honest "TRUE FRET GEOMETRY —
  DRAWN FROM THE EQUATIONS". Speaker HPF advisory present.
- **HARMONICS-MODE WAVELENGTH FIX (fdc4ce3b) VERIFIED ON THE LIVE BUNDLE**: in
  NATURAL HARMONICS mode at the ½ node (H2), the readout now reads verbatim:
  "String wave: λ = 2 × full length ÷ 2 (harmonic 2 rings in 2 lobes over the
  whole string)." — exactly the mode-aware fix (2L/n), where before it printed
  the fundamental's "λ = 2 × vibrating length". Bezel consistent: NOTE E2 /
  82.4 Hz / OCTAVE (2:1) / NODE ½·H2; standing wave draws 2 lobes + midpoint node.
  This is IRONCLAD device verification (Fast Refresh applied the edit) of MAJOR
  fix #2, upgrading it from source-verified to device-verified.
