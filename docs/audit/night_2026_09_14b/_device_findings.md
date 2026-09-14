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
