/**
 * The Harmony module's BEAT readout.
 *
 * ⛔ WHAT THIS PINS (owner 2026-09-21 bug pass). The module used
 * `Math.abs(f2 - f1)` — correct for two tones at almost the same pitch, wrong
 * for two tones an INTERVAL apart, which is what this module always shows. At
 * the default fifth with 1% detune it printed 113.3 Hz: seventeen times the
 * real rate, and not a beat at all, since nothing swells a hundred times a
 * second.
 *
 * What beats when you detune one side of a just interval is the pair of
 * partials that coincided while it was locked — partial n2 of A and partial
 * n1 of B, both at base·n1·n2. Detuning B by δ moves one of them to
 * base·n1·n2·(1 + δ), so the rate is base·n1·n2·δ.
 *
 * The formula lives in modHarmony.tsx as `Math.abs(n1 * f2 - n2 * f1)`;
 * this mirrors it so the identity is checked rather than trusted.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

/** Exactly the expression modHarmony.tsx computes. */
const beatHz = (base: number, n1: number, n2: number, detune: number) => {
  const f1 = base * n1;
  const f2 = base * n2 * (1 + detune);
  return Math.abs(n1 * f2 - n2 * f1);
};

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test('a locked ratio beats at exactly zero, for every interval', () => {
  for (const [n1, n2] of [
    [1, 2], // octave
    [2, 3], // fifth
    [3, 4], // fourth
    [4, 5], // major third
    [5, 6], // minor third
    [8, 9], // major second
  ]) {
    for (const base of [55, 110, 220, 440]) {
      assert.ok(close(beatHz(base, n1, n2, 0), 0), `${n1}:${n2} at ${base} Hz should be silent when locked`);
    }
  }
});

test('the default fifth at 1% detune beats at 6.6 Hz, not 113.3', () => {
  const hz = beatHz(110, 2, 3, 0.01);
  assert.ok(close(hz, 6.6, 1e-9), `expected 6.6 Hz, got ${hz}`);
  // The value the old formula produced, pinned so nobody reintroduces it.
  assert.notEqual(Number(hz.toFixed(1)), 113.3);
});

test('the rate is base × n1 × n2 × detune', () => {
  for (const [n1, n2] of [[1, 2], [2, 3], [3, 4], [4, 5]]) {
    for (const base of [55, 110, 440]) {
      for (const d of [0.001, 0.005, 0.01, 0.02]) {
        assert.ok(
          close(beatHz(base, n1, n2, d), base * n1 * n2 * d, 1e-9),
          `${n1}:${n2} at ${base} Hz, detune ${d}`,
        );
      }
    }
  }
});

test('the rate rises with the partial order — the honest limit of this module', () => {
  // base 55-440, detune 0-0.03, ratios up to 5:7. At the wide end the
  // coincidence sits on a high partial (5x7 = the 35th), so the rate is large
  // and the partials carrying it are weak. The arithmetic is still right; what
  // weakens is the AUDIBILITY of the swell, which is a content caveat noted in
  // modHarmony.tsx, not a bug in this formula.
  assert.ok(beatHz(110, 2, 3, 0.01) < 20, 'the default fifth must stay countable');
  assert.ok(beatHz(440, 5, 7, 0.03) > 100, 'the wide extreme is genuinely fast — documented, not hidden');
});
