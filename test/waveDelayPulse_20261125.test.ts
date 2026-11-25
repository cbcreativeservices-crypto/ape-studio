/**
 * Wave Physics Lab — the PRESSURE pulse shows each source's DELAY
 * (owner 2026-11-25, Delay Alignment: "changing the delay time does not change
 * the visual circles representing the timing of the waveform arriving at the
 * listener. There is no visual feedback of the changes (delay timing)").
 *
 * The pulse maths lives in src/screens/lab/wave/pulseTracer.ts (vizWave.tsx
 * imports Skia, which node cannot load). A source delayed by `delayMs` fires
 * `delayMs/1000 × c × pxPerM` px behind the shared wavefront, so its ball and
 * ring start late by exactly that time.
 *
 *  (a) every delay 0 → the old formula, bit for bit;
 *  (b) Delay Alignment at its start: DELAY = REQ → the sub's and the main's
 *      balls land together; DELAY 0 → the main lands REQ early; 20 ms → late;
 *  (c) vizWave's pulse code reads the source delay (source ratchet).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  PACE_SPAN,
  PULSE_ARRIVE,
  PULSE_FADE_START,
  PULSE_FADE_END,
  DIST_POW,
  NODE_TIME_STRETCH,
  nodeState,
  pulseArrivalClock,
  pulseDelayPx,
  pulseFront,
  pulsePaceLen,
  pulseRingRadius,
  pulseTimeEnv,
  type TraceRay,
} from '../src/screens/lab/wave/pulseTracer.ts';
import { speedOfSound } from '../src/screens/lab/wave/waveEngine.ts';

const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// ── The formula as it stood before 2026-11-25 (copied from vizWave.tsx) ──────
type OldRay = Omit<TraceRay, 'delayPx'>;
function oldNodeState(ray: OldRay, dist: number, minLen: number, timeEnv: number) {
  if (ray.split && dist >= ray.len) return { x: 0, y: 0, amp: 0, r: 0 };
  const travelled = Math.min(dist, ray.len);
  let i = 1;
  while (i < ray.cum.length - 1 && travelled > ray.cum[i]) i++;
  const d0 = ray.cum[i - 1];
  const seg = ray.cum[i] - d0 || 1;
  const f = (travelled - d0) / seg;
  const x = ray.pts[(i - 1) * 2] + (ray.pts[i * 2] - ray.pts[(i - 1) * 2]) * f;
  const y = ray.pts[(i - 1) * 2 + 1] + (ray.pts[i * 2 + 1] - ray.pts[(i - 1) * 2 + 1]) * f;
  const gain = ray.segGain[i - 1] ?? 1;
  const ref = minLen * NODE_TIME_STRETCH;
  const level = gain * Math.pow(ref / Math.max(ref, travelled), DIST_POW);
  const amp = Math.max(0, Math.min(1, level * timeEnv));
  const r = Math.max(ray.split ? 1.7 : 0, 2.5 * (0.34 + 0.66 * amp));
  return { x, y, amp, r };
}
const OLD_PULSE_ARRIVE = 0.9;
const OLD_PACE_SPAN = 3.5;
const oldPaceLen = (w: number, h: number, ppm: number) => Math.max(1, OLD_PACE_SPAN * Math.hypot(w * ppm, h * ppm));
const oldTimeEnv = (u: number) => (u < 0.9 ? 1 : Math.max(0, 1 - (u - 0.9) / (2.98 / 3 - 0.9)));

/** A trace polyline in px from metre points (as vizWave builds them). */
function trace(ptsM: [number, number][], ppm: number, extra: Partial<TraceRay> = {}): TraceRay {
  const pts: number[] = [];
  for (const [x, y] of ptsM) pts.push(20 + x * ppm, 30 + y * ppm);
  const cum = [0];
  for (let i = 1; i < ptsM.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i * 2] - pts[i * 2 - 2], pts[i * 2 + 1] - pts[i * 2 - 1]));
  const segGain = [1];
  for (let i = 2; i < ptsM.length; i++) segGain.push(segGain[i - 2] * 0.8);
  return { pts, cum, len: cum[cum.length - 1], order: ptsM.length - 2, segGain, delayPx: 0, ...extra };
}

describe('(a) every delay 0 → the old pulse, bit for bit', () => {
  const ppm = 31.7;
  const samples: TraceRay[] = [
    trace([[3, 0.8], [8, 6]], ppm), // direct
    trace([[3, 0.8], [0, 4], [8, 6]], ppm), // one bounce
    trace([[8.5, 1.2], [16, 3], [10, 10], [8, 6]], ppm), // two bounces
    trace([[2, 2], [5, 0], [9, 7]], ppm, { split: true }), // diffuser fragment
    trace([[4, 4], [16, 9], [0, 7], [12, 0], [8, 6]], ppm, { free: true }), // free diffuse
  ];
  it('constants and pacing are the old values', () => {
    assert.equal(PULSE_ARRIVE, OLD_PULSE_ARRIVE);
    assert.equal(PACE_SPAN, OLD_PACE_SPAN);
    assert.equal(PULSE_FADE_START, 0.9);
    assert.equal(PULSE_FADE_END, 2.98 / 3);
    assert.equal(pulsePaceLen(16, 10, ppm), oldPaceLen(16, 10, ppm));
    assert.equal(pulseDelayPx(0, speedOfSound(20), ppm), 0);
  });
  it('positions, colours and sizes are identical at every clock value', () => {
    const paceLen = pulsePaceLen(16, 10, ppm);
    const minLen = samples[0].len;
    for (let k = 0; k <= 400; k++) {
      const t = k / 400;
      const front = pulseFront(t, paceLen);
      assert.equal(front, t * (paceLen / OLD_PULSE_ARRIVE));
      assert.equal(pulseTimeEnv(t), oldTimeEnv(t));
      assert.equal(pulseRingRadius(front, 0), front);
      for (const ray of samples) {
        const { delayPx: _d, ...old } = ray;
        assert.deepEqual(nodeState(ray, front, minLen, pulseTimeEnv(t)), oldNodeState(old, front, minLen, oldTimeEnv(t)));
      }
    }
  });
});

describe('(b) Delay Alignment (module 11) at its start: the balls show the delay', () => {
  // modWaveB: room 16 × 10 m, TEMP_C 20, sub (3, 0.8), main (8.5, 1.2), listener (8, 6).
  const c = speedOfSound(20);
  const ppm = 23.4; // any canvas scale: the result is in clock time
  const L: [number, number] = [8, 6];
  const SUB: [number, number] = [3, 0.8];
  const MAIN: [number, number] = [8.5, 1.2];
  const dSub = Math.hypot(L[0] - SUB[0], L[1] - SUB[1]);
  const dMain = Math.hypot(L[0] - MAIN[0], L[1] - MAIN[1]);
  const reqMs = ((dSub - dMain) / c) * 1000;
  // The fader holds 0.01 ms steps; AUTO-ALIGN lands on the rounded REQ.
  const setMs = (ms: number) => Math.round(ms * 100) / 100;
  const paceLen = pulsePaceLen(16, 10, ppm);
  const listenerPx = { x: 20 + L[0] * ppm, y: 30 + L[1] * ppm };
  const subRay = trace([SUB, L], ppm);
  const mainRay = (ms: number) => trace([MAIN, L], ppm, { delayPx: pulseDelayPx(ms, c, ppm) });
  /** First clock value at which a ball sits on the listener (bisection on nodeState). */
  const landClock = (ray: TraceRay) => {
    const at = (t: number) => {
      const n = nodeState(ray, pulseFront(t, paceLen), dMain * ppm, 1);
      return n.r > 0 && Math.hypot(n.x - listenerPx.x, n.y - listenerPx.y) < 1e-6;
    };
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 60; k++) {
      const mid = (lo + hi) / 2;
      if (at(mid)) hi = mid;
      else lo = mid;
    }
    return hi;
  };
  const clockToMs = (dt: number) => ((dt * paceLen) / PULSE_ARRIVE / ppm / c) * 1000;
  const subLand = landClock(subRay);

  it('REQ is the 6.96 ms the lab prints', () => {
    assert.equal(setMs(reqMs), 6.96);
    assert.ok(Math.abs(subLand - pulseArrivalClock(subRay.len, 0, paceLen)) < 1e-9);
  });
  it('DELAY = REQ → the sub and the main land on the listener together', () => {
    const main = mainRay(setMs(reqMs));
    const mainLand = landClock(main);
    const gapPx = (Math.abs(mainLand - subLand) * paceLen) / PULSE_ARRIVE;
    assert.ok(gapPx < 1, `gap ${gapPx} px`);
    assert.ok(Math.abs(mainLand - subLand) / subLand < 0.005, `${mainLand} vs ${subLand}`);
    // Both balls sit on the listener at the sub's landing clock.
    const nS = nodeState(subRay, pulseFront(subLand + 1e-6, paceLen), dMain * ppm, 1);
    const nM = nodeState(main, pulseFront(subLand + 1e-6, paceLen), dMain * ppm, 1);
    assert.ok(Math.hypot(nS.x - nM.x, nS.y - nM.y) < 1);
  });
  it('DELAY 0 → the main lands first, early by REQ', () => {
    const mainLand = landClock(mainRay(0));
    assert.ok(mainLand < subLand);
    const earlyMs = clockToMs(subLand - mainLand);
    assert.ok(Math.abs(earlyMs - reqMs) / reqMs < 0.005, `${earlyMs} ms vs REQ ${reqMs} ms`);
  });
  it('DELAY 20 ms → the main lands late, by 20 − REQ', () => {
    const mainLand = landClock(mainRay(20));
    assert.ok(mainLand > subLand);
    const lateMs = clockToMs(mainLand - subLand);
    assert.ok(Math.abs(lateMs - (20 - reqMs)) / (20 - reqMs) < 0.005, `${lateMs} ms vs ${20 - reqMs} ms`);
    // …and still lands well before the pulse starts to fade.
    assert.ok(mainLand < PULSE_FADE_START, `lands at ${mainLand}`);
  });
  it('a delayed ball is hidden until its source fires, then leaves FULL red', () => {
    const main = mainRay(20);
    const before = nodeState(main, main.delayPx - 0.5, dMain * ppm, 1);
    assert.equal(before.r, 0);
    assert.equal(before.amp, 0);
    const after = nodeState(main, main.delayPx + 0.5, dMain * ppm, 1);
    assert.equal(after.amp, 1);
    assert.ok(Math.hypot(after.x - main.pts[0], after.y - main.pts[1]) <= 0.5 + 1e-9);
    // Its ring starts growing at the same moment.
    assert.ok(pulseRingRadius(main.delayPx - 0.5, main.delayPx) < 0);
    assert.equal(pulseRingRadius(main.delayPx + 2, main.delayPx), 2);
  });
});

describe('(c) vizWave reads the source delay in the pulse (ratchet)', () => {
  const viz = src('src/screens/lab/wave/vizWave.tsx');
  const tracer = src('src/screens/lab/wave/pulseTracer.ts');
  it('the pulse maths comes from pulseTracer, never a local copy', () => {
    assert.match(viz, /from '\.\/pulseTracer'/);
    assert.doesNotMatch(viz, /function nodeState\(/);
    assert.doesNotMatch(viz, /t\.value \* \(paceLen \/ PULSE_ARRIVE\)/);
    assert.match(tracer, /const dist = front - ray\.delayPx;/);
  });
  it('every trace carries its source delay', () => {
    const pushes = viz.split('traces.push(').slice(1).map((s) => s.slice(0, s.indexOf(');')));
    assert.ok(pushes.length >= 4, `found ${pushes.length} traces.push`);
    for (const p of pushes) assert.match(p, /\bdelayPx\b/, p);
    assert.ok((viz.match(/pulseDelayPx\(s\.delayMs, cAir, geo\.pxPerM\)/g) ?? []).length >= 3);
  });
  it('each pulse ring starts when its own source fires', () => {
    assert.match(viz, /out\.push\(\{ x: r\.pts\[0\], y: r\.pts\[1\], delayPx: r\.delayPx \}\)/);
    assert.match(viz, /pulseRingRadius\(front, origins\[i\]\.delayPx\)/);
  });
  it('the Delay Alignment caption tells the learner what to watch', () => {
    const b = src('src/screens/lab/wave/modules/modWaveB.tsx');
    assert.match(b, /when DELAY equals REQ the two balls land together/);
  });
});
