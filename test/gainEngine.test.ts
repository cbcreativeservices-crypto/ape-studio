/**
 * Gain Staging Lab — gainEngine tests (untested-math QA night 2026-09-11).
 *
 * The lab's core lesson is that distortion is BAKED IN at the stage that
 * overloads and rides downstream forever. These tests pin that behaviour, the
 * power-sum noise model that makes "gain early beats gain late" true, and the
 * region thresholds the meter colours and verdicts read from.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CLIP_CEIL, HOT_EDGE, LOW_EDGE,
  ZONE_LOW_FILL, ZONE_HOT_FILL, ZONE_CLIP_FILL,
  regionFor, meterFill, computeChain, verdictFor, chainIsHealthy,
  type Stage, type StageKind,
} from '../src/screens/lab/gain/gainEngine.ts';

const near = (a: number, b: number, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b} (tol ${tol})`);

const stage = (key: string, gain: number, kind: StageKind = 'preamp'): Stage =>
  ({ key, name: key, kind, gain, min: -30, max: 60, adjustable: true });

describe('the operating regions', () => {
  it('the thresholds are ordered and the ceiling is full scale', () => {
    assert.equal(CLIP_CEIL, 0);
    assert.ok(LOW_EDGE < HOT_EDGE);
    assert.ok(HOT_EDGE < CLIP_CEIL);
  });
  it('classifies at and around every boundary the right way', () => {
    assert.equal(regionFor(CLIP_CEIL), 'clip');      // at the ceiling IS clipping
    assert.equal(regionFor(CLIP_CEIL + 3), 'clip');
    assert.equal(regionFor(CLIP_CEIL - 0.01), 'hot');
    assert.equal(regionFor(HOT_EDGE), 'hot');        // −6 is already hot
    assert.equal(regionFor(HOT_EDGE - 0.01), 'healthy');
    assert.equal(regionFor(LOW_EDGE), 'healthy');    // −24 is the bottom of healthy
    assert.equal(regionFor(LOW_EDGE - 0.01), 'low');
    assert.equal(regionFor(-90), 'low');
  });
  it('regions never overlap and never leave a gap — every level lands somewhere', () => {
    const seen = new Set<string>();
    for (let v = -80; v <= 12; v += 0.25) {
      const r = regionFor(v);
      assert.ok(['low', 'healthy', 'hot', 'clip'].includes(r), `${v} → ${r}`);
      seen.add(r);
    }
    assert.equal(seen.size, 4);
  });
  it('the region only ever moves UP as the level rises (monotonic)', () => {
    const rank = { low: 0, healthy: 1, hot: 2, clip: 3 } as const;
    let prev = -1;
    for (let v = -80; v <= 12; v += 0.1) {
      const r = rank[regionFor(v)];
      assert.ok(r >= prev, `region went backwards at ${v}`);
      prev = r;
    }
  });
});

describe('meterFill — bar height and colour agree', () => {
  it('is clamped to 0..1 however far off-scale the level goes', () => {
    for (const v of [-200, -40, -17, 0, 6, 60]) {
      const f = meterFill(v);
      assert.ok(f >= 0 && f <= 1, `${v} → ${f}`);
    }
    assert.equal(meterFill(-40), 0);
    assert.equal(meterFill(6), 1);
    assert.equal(meterFill(-1000), 0);
    assert.equal(meterFill(1000), 1);
  });
  it('is linear in dB between the scale ends', () => {
    near(meterFill(-17), 0.5, 1e-9); // the midpoint of −40 … +6
    near(meterFill(-28.5) + meterFill(-5.5), 2 * meterFill(-17), 1e-9);
  });
  it('rises monotonically with level', () => {
    let prev = -1;
    for (let v = -45; v <= 10; v += 0.5) {
      const f = meterFill(v);
      assert.ok(f >= prev, `dipped at ${v}`);
      prev = f;
    }
  });
  it('the drawn zone bands sit at the same places as the region thresholds', () => {
    assert.equal(ZONE_LOW_FILL, meterFill(LOW_EDGE));
    assert.equal(ZONE_HOT_FILL, meterFill(HOT_EDGE));
    assert.equal(ZONE_CLIP_FILL, meterFill(CLIP_CEIL));
    assert.ok(ZONE_LOW_FILL < ZONE_HOT_FILL);
    assert.ok(ZONE_HOT_FILL < ZONE_CLIP_FILL);
    assert.ok(ZONE_CLIP_FILL < 1); // there is visible headroom above the ceiling
  });
});

describe('computeChain — level propagation', () => {
  it('returns one node per point in the chain, source first', () => {
    const n = computeChain(-40, [stage('pre', 20), stage('fader', -6, 'fader')]);
    assert.equal(n.length, 3);
    assert.equal(n[0].key, 'source');
    assert.equal(n[0].kind, 'source');
    assert.deepEqual(n.slice(1).map((x) => x.key), ['pre', 'fader']);
  });
  it('gain simply ADDS in dB, stage after stage', () => {
    const n = computeChain(-60, [stage('a', 20), stage('b', 10), stage('c', -5)]);
    near(n[1].level, -40);
    near(n[2].level, -30);
    near(n[3].level, -35);
  });
  it('an empty chain is just the source', () => {
    const n = computeChain(-18, []);
    assert.equal(n.length, 1);
    near(n[0].level, -18);
    assert.equal(n[0].region, 'healthy');
  });
  it('a stage that reaches the ceiling CLIPS: its output is capped there', () => {
    const n = computeChain(-10, [stage('pre', 40)]);
    assert.equal(n[1].level, CLIP_CEIL);
    assert.equal(n[1].stageClipped, true);
    assert.equal(n[1].region, 'clip');
  });
  it('THE LESSON: a later fader lowers the LEVEL but never clears the distortion', () => {
    const n = computeChain(-10, [stage('pre', 20), stage('fader', -30, 'fader')]);
    assert.equal(n[1].stageClipped, true);
    assert.equal(n[2].stageClipped, false); // the fader itself did not overload
    assert.equal(n[2].distorted, true);     // …but the damage rides downstream
    near(n[2].level, -30);
    assert.equal(n[2].region, 'low');
    assert.equal(verdictFor(n[2]), 'DISTORTED — clipped upstream, baked in');
  });
  it('once distortion latches it stays latched for every remaining stage', () => {
    const n = computeChain(-4, [stage('a', 10), stage('b', -20), stage('c', -20), stage('d', 5)]);
    assert.equal(n[1].distorted, true);
    for (const x of n.slice(1)) assert.equal(x.distorted, true, x.key);
  });
  it('a clean chain never reports distortion anywhere', () => {
    const n = computeChain(-40, [stage('pre', 22), stage('eq', -2, 'eq'), stage('fader', 2, 'fader')]);
    for (const x of n) {
      assert.equal(x.distorted, false, x.key);
      assert.equal(x.stageClipped, false, x.key);
    }
  });
  it('a source already at or over full scale arrives distorted — nothing downstream can help', () => {
    const n = computeChain(2, [stage('fader', -40, 'fader')]);
    assert.equal(n[0].stageClipped, true);
    assert.equal(n[0].distorted, true);
    assert.equal(n[0].level, CLIP_CEIL); // displayed capped, not at +2
    assert.equal(n[1].distorted, true);
  });
  it('the region reflects what the stage TRIED to do, so an overload still reads clip', () => {
    const n = computeChain(-2, [stage('pre', 12)]);
    assert.equal(n[1].level, CLIP_CEIL); // capped for display
    assert.equal(n[1].region, 'clip');   // but the verdict is the raw +10
  });
  it('every node is finite for any plausible dial position', () => {
    for (const src of [-80, -40, -18, 0, 6]) {
      for (const g of [-30, 0, 12, 60]) {
        for (const x of computeChain(src, [stage('a', g), stage('b', -g)])) {
          assert.ok(Number.isFinite(x.level) && Number.isFinite(x.noise), `${src}/${g}`);
        }
      }
    }
  });
});

describe('the noise model — why gain EARLY beats gain LATE', () => {
  it('the same total gain, taken early, ends with a better signal-to-noise ratio', () => {
    const snr = (nodes: ReturnType<typeof computeChain>) =>
      nodes.at(-1)!.level - nodes.at(-1)!.noise;
    const early = computeChain(-50, [stage('pre', 30), stage('fader', 0, 'fader')]);
    const late = computeChain(-50, [stage('pre', 0), stage('fader', 30, 'fader')]);
    near(early.at(-1)!.level, late.at(-1)!.level, 1e-9); // identical LEVEL …
    assert.ok(snr(early) > snr(late) + 3, 'gain early must win by a visible margin');
  });
  it('every stage adds noise — the floor only ever rises relative to nothing', () => {
    const n = computeChain(-40, [stage('a', 0), stage('b', 0), stage('c', 0)]);
    for (let i = 1; i < n.length; i++) assert.ok(n[i].noise >= n[i - 1].noise, `stage ${i}`);
  });
  it('amplifying the signal amplifies the noise it was handed, dB for dB', () => {
    // With a self-noise floor far below, a +20 dB stage lifts the inherited
    // noise by close to 20 dB, not by nothing.
    const n = computeChain(-40, [stage('a', 20)]);
    assert.ok(n[1].noise > n[0].noise + 15);
  });
  it('the noise floor never exceeds the ceiling', () => {
    for (const x of computeChain(-60, [stage('a', 60), stage('b', 60)])) {
      assert.ok(x.noise <= CLIP_CEIL + 1e-12);
    }
  });
  it('a chain run TOO LOW has a worse SNR than the same chain run healthy', () => {
    const quiet = computeChain(-70, [stage('pre', 20)]);
    const good = computeChain(-40, [stage('pre', 20)]);
    assert.ok(good.at(-1)!.level - good.at(-1)!.noise
      > quiet.at(-1)!.level - quiet.at(-1)!.noise);
  });
});

describe('verdictFor', () => {
  it('speaks plainly for each state, overload first', () => {
    const n = computeChain(-40, [stage('a', 10)]);
    assert.equal(verdictFor({ ...n[1], region: 'low' }), 'TOO LOW — near the noise floor');
    assert.equal(verdictFor({ ...n[1], region: 'hot' }), 'HOT — little headroom left');
    assert.equal(verdictFor({ ...n[1], region: 'healthy' }), 'HEALTHY — good operating level');
    assert.equal(verdictFor({ ...n[1], stageClipped: true }), 'OVERLOADED — clipping here');
    assert.equal(verdictFor({ ...n[1], distorted: true }), 'DISTORTED — clipped upstream, baked in');
  });
  it('an overloading stage reports its OWN overload; a later one reports inherited damage', () => {
    const n = computeChain(-2, [stage('a', 10), stage('b', -12, 'fader')]);
    assert.equal(verdictFor(n[1]), 'OVERLOADED — clipping here');
    assert.equal(verdictFor(n[2]), 'DISTORTED — clipped upstream, baked in');
  });
  it('a UNITY stage fed a pinned full-scale signal still reads as overloading', () => {
    // Edge of the hard-ceiling model: stage A caps the level at exactly 0 dBFS,
    // so a following unity-gain stage sees raw === CLIP_CEIL and flags itself
    // too. Reported to the owner as a labelling judgement call, not changed —
    // the level genuinely IS at the ceiling there.
    const n = computeChain(-2, [stage('a', 10), stage('b', 0)]);
    assert.equal(n[2].stageClipped, true);
    assert.equal(n[2].distorted, true);
  });
  it('always returns a non-empty string for every node of every chain', () => {
    for (const src of [-70, -40, -10, 0]) {
      for (const x of computeChain(src, [stage('a', 25), stage('b', -10)])) {
        assert.ok(verdictFor(x).length > 0);
      }
    }
  });
});

describe('chainIsHealthy — the goal state of the balance exercises', () => {
  it('is true when every STAGE sits in the healthy band with no distortion', () => {
    assert.equal(chainIsHealthy(computeChain(-40, [stage('pre', 22), stage('fader', 0, 'fader')])), true);
  });
  it('exempts the raw source — a quiet source is WHY the chain has gain stages', () => {
    const n = computeChain(-60, [stage('pre', 42)]);
    assert.equal(n[0].region, 'low');
    assert.equal(chainIsHealthy(n), true);
  });
  it('is false the moment any stage clips, however it is trimmed back afterwards', () => {
    assert.equal(chainIsHealthy(computeChain(-10, [stage('pre', 20), stage('fader', -32, 'fader')])), false);
  });
  it('is false when a stage sits too low or too hot', () => {
    assert.equal(chainIsHealthy(computeChain(-60, [stage('pre', 10)])), false);  // −50, too low
    assert.equal(chainIsHealthy(computeChain(-60, [stage('pre', 57)])), false);  // −3, too hot
  });
});
