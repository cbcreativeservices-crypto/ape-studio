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
