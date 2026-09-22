/**
 * The chip that names a time must mean that time, in every band mode.
 *
 * ⛔ WHAT THIS PINS. Exponential band averaging applies α once per tick, and
 * the RTA has TWO tick rates: the native analysis loop at 50 ms, and the
 * client-side 1/6-octave derivation at 80 ms. One α therefore gives two
 * different time constants.
 *
 * τ = −T / ln(1 − α). At the old fixed α of 0.016 that is 4.96 s at 80 ms —
 * right — and 3.10 s at 50 ms, so the "5 SEC" chip delivered 3.1 s in four of
 * its five modes and the average silently changed length when the BANDING chip
 * changed. FAST / MED / SLOW name no time, promise nothing, and are left alone
 * on purpose: FAST's responsiveness was tuned by ear.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const alphaForTau = (tauSec: number, tickSec: number) => 1 - Math.exp(-tickSec / tauSec);
/** Recover the time constant an α actually produces at a given tick rate. */
const tauOf = (alpha: number, tickSec: number) => -tickSec / Math.log(1 - alpha);

const NATIVE_TICK = 0.05;
const SIXTH_TICK = 0.08;

test('the OLD single alpha really did deliver 3.1 s on the native path', () => {
  assert.ok(Math.abs(tauOf(0.016, SIXTH_TICK) - 4.96) < 0.02, 'correct at 80 ms');
  assert.ok(Math.abs(tauOf(0.016, NATIVE_TICK) - 3.1) < 0.02, '38% fast at 50 ms');
});

test('the per-path alphas both give five seconds', () => {
  assert.ok(Math.abs(tauOf(alphaForTau(5, NATIVE_TICK), NATIVE_TICK) - 5) < 1e-6);
  assert.ok(Math.abs(tauOf(alphaForTau(5, SIXTH_TICK), SIXTH_TICK) - 5) < 1e-6);
});

test('so the average no longer changes length when BANDING changes', () => {
  const a = tauOf(alphaForTau(5, NATIVE_TICK), NATIVE_TICK);
  const b = tauOf(alphaForTau(5, SIXTH_TICK), SIXTH_TICK);
  assert.ok(Math.abs(a - b) < 1e-6, `modes must agree: ${a} vs ${b}`);
});

test('alphaForTau stays in range and is monotonic in the right direction', () => {
  for (const tau of [0.05, 0.5, 5, 50]) {
    const a = alphaForTau(tau, NATIVE_TICK);
    assert.ok(a > 0 && a < 1, `alpha out of range for tau ${tau}`);
  }
  // A LONGER time constant means a SMALLER alpha (slower to follow).
  assert.ok(alphaForTau(5, NATIVE_TICK) < alphaForTau(0.5, NATIVE_TICK));
});
