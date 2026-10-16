/**
 * Foundations TRACER PARTICLES (owner 2026-10-16) — the star glints that
 * marked single molecules are replaced by the standard physics-classroom
 * marker: a molecule in a distinct colour, a FIXED tick at its rest position,
 * and a faint ↔ bracket spanning its real swing.
 *
 * What must stay true:
 *  - no star / glint drawing is left in the early sound views;
 *  - a tracer moves by the SAME law as the grey field (one airDx worklet,
 *    called by both), so it can never do what its neighbours do not;
 *  - the tick is static (built in a useMemo, never in a frame worklet) and
 *    the bracket's half-width is the real swing (airSwing = peak of airDx);
 *  - a pitch drag never moves a tick (placement held until the field is
 *    rebuilt);
 *  - the plain legend shows on the first display that carries tracers.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const viz = readFileSync('src/screens/lab/foundations/viz.tsx', 'utf8');

test('no star glints remain in the Foundations views', () => {
  assert.doesNotMatch(viz, /addGlint|SPARKLE_|sparkleHomes|midBandIndices|const sparkles/);
});

test('one displacement law for the field and its tracers', () => {
  // AirParticlesView: field and tracers both call airDx.
  assert.match(viz, /xs\[i\] \+ airDx\(mode, amp, dispMax, om, k, t, xs\[i\], phasePx, i\)/);
  assert.match(viz, /trX\[j\] \+ airDx\(mode, amp, dispMax, om, k, t, trX\[j\], phasePx, trIdx\[j\]\)/);
  // WavelengthRulerView: the phase clock is ωt, so ω = 1, t = φ.
  assert.match(viz, /gxs\[i\] \+ airDx\('wave', amp, disp, 1, k, ph, gxs\[i\], 0, i\)/);
  assert.match(viz, /trX\[j\] \+ airDx\('wave', amp, disp, 1, k, ph, trX\[j\], 0, trIdx\[j\]\)/);
  // The replaced molecule is not drawn twice.
  assert.equal((viz.match(/if \(i === skipA \|\| i === skipB\) continue;/g) || []).length, 2);
});

test('the bracket is the real swing and the tick is static', () => {
  assert.match(viz, /if \(mode === 'wave'\) return amp \* dispMax;/);
  assert.match(viz, /if \(mode === 'noise'\) return 0\.9 \* amp \* dispMax;/);
  // Noise peak in airDx is 0.9·amp·dispMax·(hash−0.5)·2 → ±0.9·amp·dispMax.
  assert.match(viz, /return amp \* dispMax \* 0\.9 \* \(hash\(i \* 127\.1 \+ tq \* 311\.7\) - 0\.5\) \* 2;/);
  assert.match(viz, /const marks = useMemo\(\(\) => tracerMarks\(tracers, swing, ts\), \[tracers, swing, ts\]\);/);
  assert.match(viz, /const marks = useMemo\(\(\) => tracerMarks\(tracers, airSwing\('wave', amp, disp\), 1\), \[tracers, amp, disp\]\);/);
  // Ticks are drawn at the REST x only.
  assert.match(viz, /ticks\.moveTo\(x, y \+ 3\.6 \* s\);\s*ticks\.lineTo\(x, y \+ 11 \* s\);/);
});

test('a pitch drag never moves a tick', () => {
  assert.match(viz, /const pickLambda = useHeldUntil\(xs, lambda\);/);
  assert.match(viz, /const pickLambda = useHeldUntil\(gxs, lambdaPx\);/);
});

test('rest x sits on a displacement node at t = 0, so a still display shows the dot on its tick', () => {
  // Model check of the snap: ξ(x,0) = sin(−k(x+φ)) = 0 at x = n·λ/2 − φ.
  const lambda = 166, phi = 12;
  for (const target of [70, 140, 229]) {
    const half = lambda / 2;
    const n = Math.round((target + phi) / half);
    const x = n * half - phi;
    assert.ok(Math.abs(Math.sin(-(2 * Math.PI / lambda) * (x + phi))) < 1e-9);
    assert.ok(Math.abs(x - target) <= half / 2 + 1e-9);
  }
  assert.match(viz, /const x = n \* half - phasePx;/);
});

test('the legend shows where the tracers first appear', () => {
  const course = readFileSync('src/screens/lab/foundations/FoundationsCourseScreen.tsx', 'utf8');
  assert.match(course, /function M1Rack[\s\S]{0,3000}<TracerCaption \/>/);
  assert.doesNotMatch(course, /GLINTING/);
  assert.match(readFileSync('src/screens/lab/foundations/FoundationsPlaygroundScreen.tsx', 'utf8'), /<TracerCaption \/>/);
  assert.match(readFileSync('src/screens/startHere/pages.tsx', 'utf8'), /function L1Vibrate[\s\S]{0,2500}wellTop=\{<TracerCaption text=\{TRACER_CAPTION_PLAIN\} \/>\}/);
  const bits = readFileSync('src/screens/lab/foundations/bits.tsx', 'utf8');
  assert.match(bits, /tracerText: \{[^}]*fontSize: 13/);
});
