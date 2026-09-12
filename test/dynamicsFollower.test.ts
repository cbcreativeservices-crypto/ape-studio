/**
 * The dynamics hero's envelope follower — specifically WHICH TIME CONSTANT
 * drives WHICH EDGE, per processor.
 *
 * This is the bug class that has now shipped three times in `fxAnim.tsx`:
 * the drawing responds to a control, so it looks wired, but it responds
 * WRONGLY. `holdMs` was dead; `attackMs`/`releaseMs` were absent; and on
 * 2026-09-11 the gate got them inverted — its hard-coded 1 ms attack drove the
 * CLOSING edge while the student's release chip drove the opening one, so at
 * the gate lab's own defaults the drawn gate never opened. Hold still moved
 * the trace, which is exactly why the preview check passed.
 *
 * Ground truth is the native engine, `modules/ape-dsp/ios/core/Effects.hpp`:
 *
 *     if (envDb > thr) { holdLeft_ = holdSamples;
 *                        gGate_ += aA * (1.0 - gGate_); }   // open on ATTACK
 *     else if (holdLeft_ > 0) { --holdLeft_; }              // hold
 *     else { gGate_ += aR * (floorG - gGate_); }            // close on RELEASE
 *
 * and `grOut = -20*log10(gGate_)`, so for a gate **gr FALLING to 0 is the gate
 * OPENING** — the fast edge. A compressor/limiter is the other way round: gr
 * rising means the reduction is deepening, which is its attack.
 *
 * ⚠️ The follower lives inside a Reanimated worklet that cannot be imported
 * here (RN + Skia). Same constraint, and same hand-mirror convention, as
 * `grLadder.test.ts`. To stop the mirror drifting, the last test reads
 * `fxAnim.tsx` itself and pins the mode-aware edge selection in the source, so
 * a revert to the symmetric form fails the suite rather than the mirror.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

type Mode = 'compressor' | 'gate' | 'limiter';

/** Mirror of the follower's edge selection (fxAnim.tsx, the `rising` line). */
function step(gr: number, target: number, mode: Mode, aAtk: number, aRel: number): number {
  const rising = target > gr;
  return gr + (target - gr) * (mode === 'gate' ? (rising ? aRel : aAtk) : rising ? aAtk : aRel);
}

const coef = (ms: number, dt: number) => 1 - Math.exp(-dt / Math.max(0.1, ms));

/** Walk the follower toward a target and return how far it got. */
function settle(from: number, target: number, mode: Mode, atkMs: number, relMs: number, forMs: number) {
  const dt = 1;
  let gr = from;
  for (let t = 0; t < forMs; t += dt) gr = step(gr, target, mode, coef(atkMs, dt), coef(relMs, dt));
  return gr;
}

describe('dynamics follower — which constant drives which edge', () => {
  test('a GATE opens on ATTACK: a fast attack opens it even with a slow release', () => {
    // The gate lab's shape: attack hard-coded to 1 ms, release chosen by the
    // student (20 / 100 / 500 ms). Start fully closed at 40 dB of attenuation
    // and let a burst arrive (target 0 = fully open).
    const after5ms = settle(40, 0, 'gate', 1, 500, 5);
    assert.ok(
      after5ms < 1,
      `a 1 ms gate must be essentially open 5 ms after the hit regardless of release; got ${after5ms.toFixed(2)} dB still attenuating`,
    );
  });

  test('a GATE closes at RELEASE speed: the release chip is what changes the tail', () => {
    const chatter = settle(0, 40, 'gate', 1, 20, 60);
    const slow = settle(0, 40, 'gate', 1, 500, 60);
    assert.ok(chatter > slow + 10, `20 ms release must close far further in 60 ms than 500 ms does (${chatter.toFixed(1)} vs ${slow.toFixed(1)})`);
  });

  test('the gate lab DEFAULT still opens — the 2026-09-11 regression', () => {
    // ⚠️ ATTACK IS 10, NOT 1. This test was written pinned to 1 ms, and the very
    // next commit changed the gate's drawn attack to 10 to match the engine's
    // own default (Effects.hpp:421). Pinned to the retired value it still
    // passed, while no longer guarding the thing its name promises — exactly
    // the "test restates the implementation" trap it was written to avoid.
    // Release 100 ms is the lab's default chip.
    // 60 ms at this helper's 1 ms step: 40*exp(-6) = 0.10 dB. (The lab's own
    // step is ~8 ms, so on screen it is open within a few pixels of the hit.)
    const open = settle(40, 0, 'gate', 10, 100, 60);
    assert.ok(open < 0.5, `at the lab's default the gate must open on the hit; got ${open.toFixed(2)} dB`);
  });

  test('the gate lab default is what this test claims it is (source pin)', () => {
    const here2 = dirname(fileURLToPath(import.meta.url));
    const cfg = readFileSync(join(here2, '..', 'src', 'screens', 'lab', 'fxLabConfigs.tsx'), 'utf8');
    const gate = cfg.slice(cfg.indexOf("mode: 'gate'"));
    assert.match(gate.slice(0, 1200), /attackMs: 10,/, 'the gate anim must draw the engine default of 10 ms');
  });

  test('a COMPRESSOR is the other way round: gr RISING is its attack', () => {
    const fast = settle(0, 12, 'compressor', 1, 200, 10);
    const slow = settle(0, 12, 'compressor', 50, 200, 10);
    assert.ok(fast > slow + 5, `a 1 ms attack must clamp faster than a 50 ms one (${fast.toFixed(1)} vs ${slow.toFixed(1)})`);
  });

  test('a COMPRESSOR recovers on RELEASE', () => {
    const quick = settle(12, 0, 'compressor', 5, 20, 40);
    const slow = settle(12, 0, 'compressor', 5, 400, 40);
    assert.ok(slow > quick + 5, `a 400 ms release must still be holding reduction when a 20 ms one has let go (${slow.toFixed(1)} vs ${quick.toFixed(1)})`);
  });

  test('a LIMITER follows the compressor convention, not the gate one', () => {
    const fast = settle(0, 10, 'limiter', 0.2, 100, 2);
    const slow = settle(0, 10, 'limiter', 20, 100, 2);
    assert.ok(fast > slow + 3, 'a brickwall attack must clamp faster than a slow one');
  });

  test('the swapped-edge form is NOT what ships (source pin)', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(here, '..', 'src', 'screens', 'lab', 'fxAnim.tsx'), 'utf8');
    assert.match(
      src,
      /mode === 'gate' \? \(rising \? aRel : aAtk\)/,
      'fxAnim.tsx must select the gate’s edges the opposite way round from the compressor’s — see Effects.hpp:398',
    );
    assert.doesNotMatch(
      src,
      /gr \+= \(target - gr\) \* \(target > gr \? aAtk : aRel\);/,
      'the symmetric follower line is the 2026-09-11 regression; it must not come back',
    );
  });
});
