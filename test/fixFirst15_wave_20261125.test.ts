/**
 * Fix-first 15, group WAVE (owner 2026-11-25, "Fix-first 15"; audit
 * Downloads/2026-11-25_LAB_CONTROLS_AUDIT.md items 3, 5, 9 = Appendix A W1, 2, 7).
 *
 *  3. Wave Physics slow ripple rings (PRESSURE: RoomRing, OutsideTrain) follow
 *     each source's DELAY and POLARITY: a train runs (freq × delay + ½ if
 *     flipped) of one ring spacing behind, later = smaller radius; each train
 *     fades by its own radius. Delay 0 / normal polarity = the old rings, bit
 *     for bit. OutsideTrain measures each source from its own wall distance.
 *  5. Speaker Coverage side view: the rear delay speaker's start and both
 *     fronts' speeds follow the drawn geometry (was a fixed 0.16 of a cycle).
 *  9. Mic Principles, Plosives: the air drawn at the grille is BLAST AT
 *     CAPSULE's share (POP 30 % < FOAM 50 %), as the readout and lesson say.
 *
 * vizWave.tsx and micspeaker/viz.tsx import Skia (node cannot load them): the
 * ring maths is in wave/pulseTracer.ts; the two micspeaker helpers are pure
 * top-level functions whose bodies are read from the source and run here.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  RING_MAX_TRAINS,
  ringFade,
  ringPhaseOffset,
  ringTrainFrac,
  ringTrainGroups,
} from '../src/screens/lab/wave/pulseTracer.ts';
import { speedOfSound } from '../src/screens/lab/wave/waveEngine.ts';

const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const VIZ_WAVE = src('src/screens/lab/wave/vizWave.tsx');
const VIZ_MIC = src('src/screens/lab/micspeaker/viz.tsx');

const RING_N = 3;
/** RoomRing as it stood before 2026-11-25 (copied from vizWave.tsx). */
function oldRing(f: number, i: number, spacing: number, count = RING_N) {
  const r = (f + i) * spacing;
  const u = (f + i) / count;
  return {
    r,
    drawn: !(r < 2.5 || r > count * spacing),
    line: 0.42 * Math.min(1, u / 0.12) * (1 - u) * (1 - u),
    glow: 0.2 * Math.min(1, u / 0.12) * (1 - u) * (1 - u),
  };
}
/** RoomRing now: the same maths with the train's offset. */
function newRing(f: number, off: number, i: number, spacing: number, count = RING_N) {
  const g = ringTrainFrac(f, off);
  const r = (g + i) * spacing;
  const u = (g + i) / count;
  return { r, drawn: !(r < 2.5 || r > count * spacing), line: ringFade(u, 0.42), glow: ringFade(u, 0.2) };
}
const mod1 = (x: number) => x - Math.floor(x);
/** Circular distance between two fractions of a ring spacing. */
const cdist = (a: number, b: number) => {
  const d = Math.abs(mod1(a) - mod1(b));
  return Math.min(d, 1 - d);
};

describe('3a. delay 0, normal polarity → the old slow rings, bit for bit', () => {
  it('the offset is exactly 0 at every frequency', () => {
    for (const freq of [20, 40, 80, 100, 125, 250, 500, 1000, 4000, 16000]) assert.equal(ringPhaseOffset(freq, 0, 1), 0);
  });
  it('every ring radius, visibility and fade is the old one', () => {
    for (const spacing of [12, 37.5, 120, 260]) {
      for (let k = 0; k < 1000; k++) {
        const f = k / 1000 + 0.00037;
        for (let i = 0; i < RING_N; i++) assert.deepEqual(newRing(f % 1, 0, i, spacing), oldRing(f % 1, i, spacing));
      }
    }
  });
  it('all on-time sources share ONE train, in source order (the old 6 paths)', () => {
    assert.deepEqual(ringTrainGroups([0, 0, 0, 0]), [{ off: 0, members: [0, 1, 2, 3] }]);
    assert.deepEqual(ringTrainGroups([0]), [{ off: 0, members: [0] }]);
  });
});

describe('3b. a delayed or flipped source’s rings sit where its wave is', () => {
  it('Interference, 500 Hz: DELAY 1.0 ms or Ø flip puts S2 half a ring off; both together cancel', () => {
    assert.equal(ringPhaseOffset(500, 1.0, 1), 0.5);
    assert.equal(ringPhaseOffset(500, 0, -1), 0.5);
    assert.equal(ringPhaseOffset(500, 1.0, -1), 0);
  });
  it('Delay Alignment, 100 Hz, DELAY 6.96 ms: MAIN’s rings sit 0.696 of a ring (≈ 2.39 m) back', () => {
    const off = ringPhaseOffset(100, 6.96, 1);
    assert.ok(Math.abs(off - 0.696) < 1e-12, `${off}`);
    const lambda = speedOfSound(20) / 100;
    assert.ok(Math.abs(off * lambda - 2.39) < 0.01, `${off * lambda} m`);
  });
  it('later = smaller radius: a delayed train is the on-time train shown `off` of a cycle earlier', () => {
    const sp = 50;
    for (const off of [0.1, 0.25, 0.5, 0.696, 0.93]) {
      for (let k = 0; k < 500; k++) {
        const f = k / 500;
        const g = ringTrainFrac(f, off);
        assert.ok(g >= 0 && g <= 1, `${g}`);
        // The delayed crests = the on-time crests pulled in by off × spacing (mod one spacing).
        assert.ok(cdist(g, f - off) < 1e-12);
        // …and where both have a ring with the same index, the delayed one is inside.
        if (f >= off) assert.ok(newRing(f, off, 1, sp).r < newRing(f, 0, 1, sp).r);
      }
    }
  });
  it('each train fades by ITS OWN radius, so a late train never pops (0 at both ends)', () => {
    const sp = 40;
    for (const off of [0.2, 0.5, 0.81]) {
      for (let k = 0; k <= 2000; k++) {
        const f = (k / 2000) % 1;
        for (let i = 0; i < RING_N; i++) {
          const ring = newRing(f, off, i, sp);
          assert.ok(Math.abs(ring.line - ringFade(ring.r / (RING_N * sp), 0.42)) < 1e-12);
        }
      }
    }
    assert.equal(ringFade(0, 0.42), 0);
    assert.equal(ringFade(1, 0.42), 0);
  });
  it('Beam Steering: each box’s rings run behind by its delay, so the fronts tilt toward the later boxes', () => {
    // modWaveB Beam Steering: STEER_SPACING 2 m, TEMP_C 20, 80 Hz default, delays rounded to 5 µs.
    const c = speedOfSound(20);
    const freq = 80;
    const lambda = c / freq;
    for (const n of [4, 5, 6]) {
      for (const steer of [-60, -30, 15, 45, 60]) {
        const dt = ((2.0 * Math.sin((steer * Math.PI) / 180)) / c) * 1000;
        const raw = Array.from({ length: n }, (_, i) => i * dt);
        const minD = Math.min(...raw);
        const delays = raw.map((d) => Math.round((d - minD) * 200) / 200);
        const offs = delays.map((d) => ringPhaseOffset(freq, d, 1));
        for (let k = 0; k + 1 < n; k++) {
          // Box k+1 fires (delay difference) later: its crests sit that much
          // sound-travel nearer the box (mod one wavelength) — 2 m × sin(steer).
          const shiftM = (offs[k + 1] - offs[k]) * lambda;
          const want = (delays[k + 1] - delays[k]) / 1000 * c;
          assert.ok(cdist(shiftM / lambda, want / lambda) < 1e-9, `n ${n} steer ${steer} box ${k}`);
          assert.ok(Math.abs(Math.abs(want) - 2.0 * Math.abs(Math.sin((steer * Math.PI) / 180))) < 0.01);
        }
        const groups = ringTrainGroups(offs);
        assert.equal(groups.length, n, 'every box its own train');
        assert.ok(groups.length * RING_N * 2 <= 36);
      }
    }
    // STEER 0: every delay 0 → one train, the old drawing.
    assert.equal(ringTrainGroups([0, 0, 0, 0, 0, 0].map((d) => ringPhaseOffset(80, d, 1))).length, 1);
  });
  it('the train count is bounded (≤ RING_MAX_TRAINS = 6 → ≤ 36 paths)', () => {
    assert.equal(RING_MAX_TRAINS, 6);
    const seven = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.62];
    const g = ringTrainGroups(seven);
    assert.equal(g.length, 6);
    assert.deepEqual(g.flatMap((x) => x.members).sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6]);
    assert.ok(g.find((x) => x.off === 0.5)!.members.includes(6), 'the 7th joins the nearest train');
  });
});

describe('3c. vizWave draws the rings from these (source ratchet)', () => {
  const roomRing = VIZ_WAVE.slice(VIZ_WAVE.indexOf('function RoomRing('), VIZ_WAVE.indexOf('// ── Pulse tracer'));
  const oStart = VIZ_WAVE.indexOf('function OutsideTrain(');
  const outside = VIZ_WAVE.slice(oStart, VIZ_WAVE.indexOf('\n}\n', oStart));
  it('RoomRing: the train offset drives radius AND fade', () => {
    assert.equal((roomRing.match(/ringTrainFrac\(\(phase\.value \/ \(2 \* Math\.PI\)\) % 1, off\)/g) ?? []).length, 3);
    assert.match(roomRing, /return ringFade\(u, 0\.42\);/);
    assert.match(roomRing, /return ringFade\(u, 0\.2\);/);
    assert.doesNotMatch(roomRing, /const f = \(phase\.value \/ \(2 \* Math\.PI\)\) % 1;/);
  });
  it('ringSrcs reads each source’s delay and polarity; one RoomRing set per train', () => {
    assert.match(VIZ_WAVE, /off: ringPhaseOffset\(freq, s\.delayMs, s\.polarity\),/);
    assert.match(VIZ_WAVE, /ringTrainGroups\(ringSrcs\.map\(\(s\) => s\.off\)\)/);
    // round 2 (W3): the 3rd and later trains skip the blurred glow (glow={ti < RING_GLOW_TRAINS}).
    assert.match(VIZ_WAVE, /<RoomRing key=\{`\$\{ti\}-\$\{i\}`\} phase=\{p\.phase\} srcs=\{tr\.srcs\} off=\{tr\.off\} glow=\{ti < RING_GLOW_TRAINS\} i=\{i\} \/>/);
  });
  it('OutsideTrain: each source’s own offset, wall distance and level (W2)', () => {
    assert.match(outside, /const r = \(ringTrainFrac\(f0, srcs\[i\]\.off\) \+ k\) \* sp;/);
    assert.match(outside, /rWallPx\[i\]/);
    assert.match(outside, /lvl0\[i\]/);
    assert.doesNotMatch(VIZ_WAVE, /const s0 = scene\.sources\[0\];/);
    assert.match(VIZ_WAVE, /const live = scene\.sources\.filter\(\(s\) => !s\.muted\);/);
  });
});

/** Read a top-level function's body from source and run it (types stripped from the parameter list). */
function loadFn(text: string, name: string) {
  const m = new RegExp(`export function ${name}\\(([^)]*)\\): \\w+ \\{([\\s\\S]*?)\\n\\}`).exec(text);
  assert.ok(m, `${name} not found`);
  const params = m[1].split(',').map((p) => p.split(':')[0].trim());
  // eslint-disable-next-line no-new-func
  return new Function(...params, m[2]) as (...a: unknown[]) => any;
}

describe('5. Speaker Coverage side view: rear delay timing follows AUDIENCE DISTANCE', () => {
  const timing = loadFn(VIZ_MIC, 'alignmentTiming') as (m: number, r: number, t: number, a: boolean) => { rearStart: number; rearTravel: number };
  // SideCoverageView geometry (glass points): spkX 30, audFront = 4 + 44 +
  // round(1.2 × COVER_MPP) + depth × 0.38 w, rear speaker halfway into the
  // block, target = audEnd − 8 (COVER_MPP = 42 / 1.7).
  const geom = (w: number, depth: number) => {
    const audFront = 4 + 44 + Math.round(1.2 * (42 / 1.7)) + depth * (w * 0.38);
    return { mainX: 30, rearX: audFront + (w - audFront) * 0.5, targetX: w - 8 };
  };
  it('the rear front’s travel is the audit’s geometry, not a fixed 0.16 (w 360: 0.413 / 0.339 / 0.264 / 0.201)', () => {
    const want = [0.413, 0.339, 0.264, 0.201];
    [0, 0.35, 0.7, 1].forEach((d, k) => {
      const g = geom(360, d);
      const t = timing(g.mainX, g.rearX, g.targetX, true).rearTravel;
      assert.ok(Math.abs(t - want[k]) < 0.0015, `depth ${d}: ${t}`);
    });
  });
  it('one speed for both fronts; TIME-ALIGNED lands together, MISALIGNED early by the stage → rear travel time', () => {
    for (const w of [300, 360, 520, 760]) {
      for (let k = 0; k <= 20; k++) {
        const g = geom(w, k / 20);
        const span = g.targetX - g.mainX; // stage front: whole cycle
        const al = timing(g.mainX, g.rearX, g.targetX, true);
        const mis = timing(g.mainX, g.rearX, g.targetX, false);
        // Same speed: rear distance ÷ rear travel = stage distance ÷ 1 cycle.
        assert.ok(Math.abs((g.targetX - g.rearX) / al.rearTravel - span) < 1e-9);
        // Aligned: fires late by exactly the stage → rear-speaker time, lands at the end with the stage front.
        assert.ok(Math.abs(al.rearStart - (g.rearX - g.mainX) / span) < 1e-12);
        assert.ok(Math.abs(al.rearStart + al.rearTravel - 1) < 1e-12);
        // Misaligned: fires with the mains, lands early by that same time.
        assert.equal(mis.rearStart, 0);
        assert.ok(Math.abs(1 - (mis.rearStart + mis.rearTravel) - (g.rearX - g.mainX) / span) < 1e-12);
      }
    }
  });
  it('the overlay uses it; the fixed share is gone', () => {
    assert.doesNotMatch(VIZ_MIC, /D_REAR/);
    assert.match(VIZ_MIC, /const \{ rearStart, rearTravel \} = alignmentTiming\(mainX, rearX, targetX, aligned\);/);
    assert.match(VIZ_MIC, /const local = \(g - rearStart\) \/ rearTravel;/);
  });
});

describe('9. Plosives: the air drawn at the grille agrees with BLAST AT CAPSULE', () => {
  const radius = loadFn(VIZ_MIC, 'plosivePuffRadius') as (
    mode: string, i: number, n: number, x: number, pass: number, barX: number, edge: number, gx: number,
  ) => number;
  const passOf = (text: string, key: string) => Number(new RegExp(`key: '${key}', label: '[^']+', pass: ([\\d.]+)`).exec(text)![1]);
  const SCREEN = src('src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx');
  it('the picture’s pass shares are the readout’s (100 / 30 / 50 / 12 %)', () => {
    for (const [k, v] of [['none', 1], ['pop', 0.3], ['foam', 0.5], ['blimp', 0.12]] as const) {
      assert.equal(passOf(SCREEN, k), v);
      assert.equal(passOf(VIZ_MIC, k), v);
    }
    assert.match(VIZ_MIC, /const pass = mode === 'none' \? 1 : mode === 'pop' \? 0\.3 : mode === 'foam' \? 0\.5 : 0\.12;/);
  });
  it('probe: air drawn near the grille ∝ pass; POP FILTER shows less air than FOAM', () => {
    // PopFilterView geometry (glass points) at a phone width.
    const w = 340;
    const srcX = 24;
    const micX = w - 56;
    const gx = micX + 2;
    const barX = srcX + (micX - srcX) * 0.62;
    const air = (mode: string, pass: number) => {
      const edge = mode === 'blimp' ? gx - 54 : gx - 17;
      let a = 0;
      for (let s = 0; s < 4000; s++) {
        for (const fo of [0, 0.5]) {
          const f = (s / 4000 + fo) % 1;
          const x = srcX + 12 + f * (micX - srcX - 16);
          if (x < gx - 8) continue; // the last stretch before the grille
          for (let i = 0; i < 8; i++) a += radius(mode, i, 8, x, pass, barX, edge, gx) ** 2;
        }
      }
      return a;
    };
    const none = air('none', 1);
    const pop = air('pop', 0.3) / none;
    const foam = air('foam', 0.5) / none;
    const blimp = air('blimp', 0.12) / none;
    assert.ok(Math.abs(pop - 0.3) < 1e-9, `pop ${pop}`);
    assert.ok(Math.abs(foam - 0.5) < 1e-9, `foam ${foam}`);
    assert.ok(Math.abs(blimp - 0.12) < 1e-9, `blimp ${blimp}`);
    assert.ok(1 > foam && foam > pop && pop > blimp, 'NONE > FOAM > POP FILTER > WINDSHIELD, as the readout');
  });
  it('before the barrier every mode draws the same full particle', () => {
    for (const mode of ['none', 'pop', 'foam', 'blimp']) assert.equal(radius(mode, 5, 8, 40, 0.3, 120, 200, 220), 2.2);
  });
  it('the lab’s text agrees: pop 30 %, foam 50 %, windshield 12 %', () => {
    const guide = src('src/screens/lab/micspeaker/micSpeakerScreenGuides.ts');
    assert.match(guide, /BLAST AT CAPSULE falls from 100% to 30%/);
    assert.match(guide, /Compare FOAM \(50%\) with SHOTGUN WINDSHIELD \(12%\)/);
    assert.match(VIZ_MIC, /const rr = plosivePuffRadius\(mode, i, N, x, pass, barX, edge, gx\);/);
  });
});
