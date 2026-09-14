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
