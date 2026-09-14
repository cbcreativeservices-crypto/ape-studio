# Owner-decision items (not bugs) — overnight 2026-09-14b

Real observations that need YOUR judgment (design/copy/pedagogy), left unchanged.

## FX-rack (fxrack.md)
- Three display-inert audio-only controls: Delay REPEAT DAMPING, Reverb HF
  DAMPING, Distortion OVERSAMPLING — they change the DSP but move nothing in
  either hero (honest via labels, but a coverage gap). Consider visualizing the
  two damping controls.
- Stereo lesson prints M/S with `/√2` while the viz uses `(L±R)/2` — scale-
  invariant, nothing on screen contradicts, but a one-line reconciliation helps.

## Synthesis (synthesis.md)
- NoiseLab shimmer runs a 70 ms (~14 fps) re-render whenever focused, even idle
  (leak-free, cleaned on blur). DESIGN Q: should an idle noise chart shimmer, or
  gate it on `running`? Left as-is (behavior change needs your call).
- OscillatorLab traveling wave scrolls RIGHTWARD — seamless (no seam bug), but
  flagged against the "time axes animate one direction" standard.

## Amplifier Principles (from deep read — grade A)
- mod2Devices DeviceDiagram labels BJT in=COLLECTOR/out=EMITTER (tube
  PLATE/CATHODE) as the controlled current to load — a power-flow simplification;
  a student could infer the wrong output terminal. Owner glance.

## EQ Lab (grade A)
- FindFrequency Level-4 / FixSignal pass test judges frequency + gain
  direction/amount but NOT Q, so "✓ CORRECTED" can show while the amber curve
  still has residual shoulders (visual vs verdict can mildly disagree). Owner
  glance.

## Module-shell + Connectors (landed 2026-09-15)
- Bass 2nd CheckQuestion wrongHint hard-codes E-string numbers (shows on any string).
- Connector Selection roster: 22 families built vs brief's "20" — decide count.
- Patchbay: tablet tap-target fix unverified on a real tablet (credit-bearing lab).
- Amplifier mod2 BJT in=COLLECTOR/out=EMITTER power-flow simplification.
- EQ FindFrequency L4 judges freq+gain, not Q.
- Advanced Mixing pagesAdvD:356 "shelf" should read "band/boost" (peaking filter).
- Tube Reference stale doc comments (30/10) + dead TubeGlyph + Image-404 failReason.
- Speech doc-comment "Ten visual modules" (ships 11).
