/**
 * Group PHYS2 — round 2 "next fixes" of the lab controls audit (owner
 * 2026-11-25, fix-first 15 → "continue with next fixes"). Appendix A rows:
 *   3  Room Design › Treatment: the freestanding panel (gobo) never touched a
 *      reflection path or the TREATED count.
 *   10 Room Design › Treatment: bass trap SIZE never widened the drawn trap.
 *   9  Sound Playground › SLOW / FAST SWEEP rocked at one fixed speed.
 *   19 Foundations motion speed froze below 110 Hz and above 1760 Hz.
 *   20 Sound Playground FREQ drag lurch (plain seconds clock × changing rate).
 *   21 Envelope sweeps longer than 4 s ran fast but read "about real time".
 *   25 Foundations M10: OUT captioned "sum level" while it prints frequencies.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
});

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const RD = 'src/screens/lab/roomdesign/';
const F = 'src/screens/lab/foundations/';

const {
  analyze,
  basstrapAt,
  basstrapOutline,
  broadbandAlpha,
  defaultDesign,
  distToEdge,
  firstReflections,
  GOBO_END_CLEAR_M,
  goboBeside,
  goboCrossesLeg,
  goboInDirectSound,
  goboOutOfPlayLine,
  isReflexVertex,
  moveTreatment,
  pointInPolygon,
  reflectionKey,
  shapeVertices,
  rt60Bands,
  speedOfSound,
  treatmentBroadbandAlpha,
  wallMaterialAt,
} = await import('../src/screens/lab/roomdesign/roomModel.ts');
type Treatment = import('../src/screens/lab/roomdesign/roomModel.ts').Treatment;
type Reflection = import('../src/screens/lab/roomdesign/roomModel.ts').Reflection;
type Pt = import('../src/screens/lab/roomdesign/roomModel.ts').Pt;
/** A convex corner's outline (never null there). */
const trap = (v: Pt[], i: number, w: number, th: number) => basstrapOutline(v, i, w, th)!;

const gobo = (x: number, y: number, z: number, extra: Partial<Treatment> = {}): Treatment => ({
  id: 'gobo1', kind: 'gobo', x, y, width: 1.2, height: 0.4, thickness: 0.1, z, enabled: true, ...extra,
});
const withTreatment = (t: Treatment[]) => {
  const d = defaultDesign('metric');
  return { ...d, treatment: t };
};

describe('3 · Room Design: a freestanding panel in a reflection path treats it', () => {
  const bare = analyze(withTreatment([]));
  // L's first reflection off the left wall (x = 0) and the leg wall → ears.
  const L = bare.reflections.find((r: Reflection) => r.speaker === 'L' && r.surface.kind === 'wall' && r.point.x < 1e-6)!;
  const d0 = defaultDesign('metric');
  const lay = d0.layouts[d0.active];
  const lis = lay.listener;
  const mid = { x: (L.point.x + lis.x) / 2, y: (L.point.y + lis.y) / 2, z: (L.point.z + lis.earZ) / 2 };

  it('the default room has an untreated left-wall path for L to test on', () => {
    assert.ok(L, 'L → left wall exists');
    assert.equal(L.treatedBy, undefined);
  });

  it('a gobo standing across the wall → ears leg marks THAT path treated and lowers its level', () => {
    const a = analyze(withTreatment([gobo(mid.x, mid.y, mid.z)]));
    const hit = a.reflections.find((r: Reflection) => reflectionKey(r) === reflectionKey(L))!;
    assert.equal(hit.treatedBy, 'gobo1');
    assert.ok(hit.levelDb < L.levelDb - 3, `${hit.levelDb.toFixed(2)} vs ${L.levelDb.toFixed(2)} dB`);
    const treatedCount = a.reflections.filter((r: Reflection) => r.treatedBy).length;
    assert.ok(treatedCount > bare.reflections.filter((r: Reflection) => r.treatedBy).length, 'TREATED rises');
    // Delay and geometry of the path are untouched: only its loss and ✓ change.
    assert.equal(hit.delayMs, L.delayMs);
    assert.deepEqual(hit.point, L.point);
  });

  it('the level drop equals the panel α replacing the drywall α (same convention as a wall panel)', () => {
    const room = d0.room;
    const spk = lay.speakers.find((s) => s.role === 'L')!;
    const c = speedOfSound(room.tempC);
    const g = gobo(mid.x, mid.y, mid.z);
    const a = firstReflections(room, spk, lis, c, [g]).find((r: Reflection) => reflectionKey(r) === reflectionKey(L))!;
    const b = firstReflections(room, spk, lis, c, []).find((r: Reflection) => reflectionKey(r) === reflectionKey(L))!;
    const aG = treatmentBroadbandAlpha(g);
    const aW = broadbandAlpha(wallMaterialAt(room, 3, 1 - b.point.y / 5));
    assert.ok(aG > aW);
    // bare = geometry + 10·log10(1 − αwall); with the gobo = geometry + 10·log10(max(0.01, 1 − αgobo)).
    const want = 10 * Math.log10(Math.max(0.01, 1 - aG)) - 10 * Math.log10(Math.max(0.01, 1 - aW));
    assert.ok(Math.abs(a.levelDb - b.levelDb - want) < 1e-9, `${(a.levelDb - b.levelDb).toFixed(3)} vs ${want.toFixed(3)} dB`);
  });

  it('a gobo far from every path, or switched OFF, changes no reflection at all', () => {
    const far = analyze(withTreatment([gobo(3.6, 4.6, 1.0)]));
    const off = analyze(withTreatment([gobo(mid.x, mid.y, mid.z, { enabled: false })]));
    assert.deepEqual(far.reflections, bare.reflections);
    assert.deepEqual(off.reflections, bare.reflections);
  });

  it('a gobo whose face is below the path (z span misses) does not treat it', () => {
    const low = analyze(withTreatment([gobo(mid.x, mid.y, 0.5)]));
    const r = low.reflections.find((x: Reflection) => reflectionKey(x) === reflectionKey(L))!;
    assert.equal(r.treatedBy, undefined);
  });

  it('goboCrossesLeg: inside the face, beside it, above it, and parallel to it', () => {
    const t = { x: 1, y: 1, z: 1, width: 1, height: 0.4 };
    assert.equal(goboCrossesLeg(t, { x: 1, y: 0, z: 1 }, { x: 1, y: 2, z: 1 }), true);
    assert.equal(goboCrossesLeg(t, { x: 2, y: 0, z: 1 }, { x: 2, y: 2, z: 1 }), false, 'beside the face');
    assert.equal(goboCrossesLeg(t, { x: 1, y: 0, z: 1.5 }, { x: 1, y: 2, z: 1.5 }), false, 'over the top');
    assert.equal(goboCrossesLeg(t, { x: 0, y: 1, z: 1 }, { x: 2, y: 1, z: 1 }), false, 'parallel');
    assert.equal(goboCrossesLeg(t, { x: 1, y: 0, z: 1 }, { x: 1, y: 0.9, z: 1 }), false, 'stops short');
  });

  it('RT60 still counts the gobo as before (both faces) — the reverb side is unchanged', () => {
    const room = d0.room;
    const near = rt60Bands(room, [gobo(mid.x, mid.y, mid.z)]);
    const farR = rt60Bands(room, [gobo(3.6, 4.6, 1.0)]);
    assert.deepEqual(near, farR);
  });

  it('a path already under a wall panel keeps the panel as its treatment', () => {
    const panel: Treatment = { id: 'p1', kind: 'absorber', wall: 3, pos: 1 - L.point.y / 5, width: 1.2, height: 1.2, thickness: 0.1, z: L.point.z, enabled: true };
    const a = analyze(withTreatment([panel]));
    const pr = a.reflections.find((r: Reflection) => reflectionKey(r) === reflectionKey(L))!;
    assert.equal(pr.treatedBy, 'p1');
    const both = analyze(withTreatment([panel, gobo(mid.x, mid.y, mid.z)]));
    const br = both.reflections.find((r: Reflection) => reflectionKey(r) === reflectionKey(L))!;
    assert.equal(br.treatedBy, 'p1');
    // Same panel, same α (10 cm both): the level is the panel's, not doubled.
    assert.equal(br.levelDb, pr.levelDb);
  });
});

describe('10 · Room Design: bass trap SIZE widens the drawn trap; THICK sets its depth', () => {
  const d = defaultDesign('metric');
  const v = d.room.vertices;
  const dist = (p: { x: number; y: number }, q: { x: number; y: number }) => Math.hypot(p.x - q.x, p.y - q.y);

  it('the face is exactly SIZE wide, and grows with SIZE (0.6 → 2.4 m)', () => {
    let last = 0;
    for (const w of [0.6, 1.2, 1.8, 2.4]) {
      const o = trap(v, 0, w, 0.3);
      const face = dist(o.face[0], o.face[1]);
      assert.ok(Math.abs(face - w) < 1e-9, `face ${face} for SIZE ${w}`);
      assert.ok(face > last);
      last = face;
    }
  });

  it('THICK is the porous depth behind the face: a band when thinner than the corner, a block when deeper', () => {
    const W = 1.2; // right-angle corner: the face sits 0.6 m in front of the corner
    const thin = trap(v, 0, W, 0.1);
    assert.ok(Math.abs(thin.apex - 0.6) < 1e-9);
    assert.ok(thin.gap, 'air gap behind a thin panel');
    // The inner edge of the band is 0.1 m behind the face (measured along the bisector).
    const C = v[0];
    const depth = (p: { x: number; y: number }) => ((p.x - C.x) + (p.y - C.y)) / Math.SQRT2; // the bisector of corner (0,0)
    assert.ok(Math.abs(depth(thin.body[0]) - 0.6) < 1e-9);
    assert.ok(Math.abs(depth(thin.body[3]) - 0.5) < 1e-9);
    const deep = trap(v, 0, 0.6, 0.5);
    assert.equal(deep.gap, null);
    assert.ok(Math.abs(depth(deep.face[0]) - 0.5) < 1e-9, 'face stands 0.5 m out');
    assert.ok(Math.abs(dist(deep.face[0], deep.face[1]) - 0.6) < 1e-9);
  });

  it('the default trap (0.6 m face, 0.3 m deep) fills its corner exactly', () => {
    const t = basstrapAt(d.room, 0);
    const o = trap(v, 0, t.width, t.thickness);
    assert.ok(Math.abs(o.apex - t.thickness) < 1e-9);
    assert.equal(o.gap, null);
  });

  it('plan and side views draw from basstrapOutline, not from thickness × 1.6', () => {
    const plan = read(`${RD}RoomPlanView.tsx`);
    const side = read(`${RD}RoomSideView.tsx`);
    assert.doesNotMatch(plan, /t\.thickness \* 1\.6/);
    assert.doesNotMatch(side, /t\.thickness \* 1\.6/);
    assert.match(plan, /basstrapOutline\(v, t\.wall, t\.width, t\.thickness\)/);
    assert.match(side, /basstrapOutline\(room\.vertices, t\.wall, t\.width, t\.thickness\)/);
  });
});

describe('19 · Foundations: one monotonic motion mapping over 55 Hz – 8 kHz', async () => {
  const { motionHzFor, MOTION_LO_HZ, MOTION_HI_HZ } = await import('../src/screens/lab/foundations/motionHz.ts');
  // The course's visHzFor (110–1760 clamp), copied from FoundationsCourseScreen.tsx.
  const visHzFor = (f: number) => 0.45 + 1.15 * (Math.log(Math.max(110, Math.min(1760, f)) / 110) / Math.log(16));

  it('55, 77 and 110 Hz now rock at different speeds; so do 1760 and 3520 Hz and 8 kHz', () => {
    assert.ok(motionHzFor(55) < motionHzFor(77) && motionHzFor(77) < motionHzFor(110));
    assert.ok(motionHzFor(1760) < motionHzFor(3520) && motionHzFor(3520) < motionHzFor(8000));
    assert.ok(motionHzFor(80) < motionHzFor(110), 'M9: 80 and 110 Hz no longer pulse alike');
  });
  it('strictly increasing over the whole range and never zero or negative', () => {
    let last = -Infinity;
    for (let f = MOTION_LO_HZ; f <= MOTION_HI_HZ; f *= 1.01) {
      const m = motionHzFor(f);
      assert.ok(m > last && m > 0, `${f} Hz → ${m}`);
      last = m;
    }
    assert.equal(MOTION_LO_HZ, 55);
    assert.equal(MOTION_HI_HZ, 8000);
  });
  it('identical to visHzFor inside 110–1760 Hz (every screen that stays there moves as before)', () => {
    for (let f = 110; f <= 1760; f *= 1.05) assert.ok(Math.abs(motionHzFor(f) - visHzFor(f)) < 1e-12, `${f}`);
    assert.ok(Math.abs(motionHzFor(1760) - 1.6) < 1e-12);
    assert.ok(Math.abs(motionHzFor(55) - 0.1625) < 1e-12);
  });
  it('M6, M9 and the Playground use it; the course\'s own visHzFor (other labs import it) is untouched', () => {
    const course = read(`${F}FoundationsCourseScreen.tsx`);
    assert.match(course, /function M6Stage[\s\S]{0,800}usePhaseClock\(focused, motionHzFor\(f\)\)/);
    assert.match(course, /function M9Stage[\s\S]{0,800}usePhaseClock\(focused, motionHzFor\(f\)\)/);
    assert.match(course, /const lo = 110;\s*const hi = 1760;/);
    const pg = read(`${F}FoundationsPlaygroundScreen.tsx`);
    assert.doesNotMatch(pg, /import \{ visHzFor \}|visHzFor\(freq\)/);
    assert.match(read(`${F}viz.tsx`), /rate\.value = motionHzFor\(freqHz\)/);
  });
});

describe('9 · Sound Playground: the sweep\'s motion follows the sweep; SLOW and FAST differ', async () => {
  const { motionHzFor, sweepHzAt } = await import('../src/screens/lab/foundations/motionHz.ts');
  it('sweepHzAt is the generator\'s log law (100 Hz → 8 kHz, repeating)', () => {
    assert.ok(Math.abs(sweepHzAt(0, 100, 8000, 8) - 100) < 1e-9);
    assert.ok(Math.abs(sweepHzAt(4, 100, 8000, 8) - Math.sqrt(100 * 8000)) < 1e-6);
    assert.ok(Math.abs(sweepHzAt(8, 100, 8000, 8) - 100) < 1e-9, 'repeats');
    assert.ok(Math.abs(sweepHzAt(1, 100, 8000, 2) - Math.sqrt(100 * 8000)) < 1e-6);
  });
  // The frame integration the hook runs (viz.tsx useMotionPhaseClock), in plain JS.
  const cyclesAfter = (secs: number, T: number, dt = 1 / 60) => {
    let ph = 0;
    let t = 0;
    for (let s = 0; s < T; s += dt) {
      ph += motionHzFor(sweepHzAt(t, 100, 8000, secs)) * dt;
      t += dt;
    }
    return ph;
  };
  it('the drawn rate climbs during a sweep (it used to sit at the 900 Hz rate throughout)', () => {
    const r0 = motionHzFor(sweepHzAt(0.1, 100, 8000, 8));
    const r1 = motionHzFor(sweepHzAt(7.9, 100, 8000, 8));
    assert.ok(r1 > 4 * r0, `${r0.toFixed(2)} → ${r1.toFixed(2)} Hz`);
  });
  it('FAST and SLOW draw different motion over the same 2 s', () => {
    const fast = cyclesAfter(2, 2);
    const slow = cyclesAfter(8, 2);
    assert.ok(fast > slow * 1.5, `fast ${fast.toFixed(2)} vs slow ${slow.toFixed(2)} cycles in 2 s`);
  });
  it('the screen restarts the drawn sweep whenever it reprograms the generator', () => {
    const pg = read(`${F}FoundationsPlaygroundScreen.tsx`);
    assert.match(pg, /sweep: \{ startHz: SWEEP_START_HZ, endHz: SWEEP_END_HZ, seconds: sw\.secs, repeat: true \},[\s\S]{0,120}setSweepToken\(\(n\) => n \+ 1\);/);
    assert.match(pg, /viz\.useMotionPhaseClock\(running && airMode === 'wave', freq, sweep, sweepToken\)/);
    assert.doesNotMatch(pg, /visHzFor\(900\)\s*:/);
  });
});

describe('20 · Sound Playground: a FREQ drag no longer lurches', async () => {
  const { motionHzFor } = await import('../src/screens/lab/foundations/motionHz.ts');
  it('integrated phase moves by under one cycle across a 290 → 667 Hz drag; the old clock jumped ~20', () => {
    const t0 = 60; // a minute after PLAY
    const oldJump = (motionHzFor(667) - motionHzFor(290)) * t0; // ω·t with the plain seconds clock
    assert.ok(oldJump > 15, `old jump ${oldJump.toFixed(1)} cycles`);
    // A 0.3 s drag, integrated frame by frame (usePhaseClock / useMotionPhaseClock).
    let ph = 0;
    const dt = 1 / 60;
    for (let s = 0; s < 0.3; s += dt) ph += motionHzFor(290 * Math.pow(667 / 290, s / 0.3)) * dt;
    assert.ok(ph < 1, `${ph.toFixed(2)} cycles during the drag`);
  });
  it('the wave views ride the phase clock (visHz = 1/2π so ω·t IS the phase); noise keeps real seconds', () => {
    const pg = read(`${F}FoundationsPlaygroundScreen.tsx`);
    assert.match(pg, /const clock = airMode === 'wave' \? phaseClock : noiseClock;/);
    assert.match(pg, /const visHz = viz\.PHASE_CLOCK_VIS_HZ;/);
    assert.match(read(`${F}viz.tsx`), /export const PHASE_CLOCK_VIS_HZ = 1 \/ \(2 \* Math\.PI\);/);
  });
});

describe('21 · Envelope: a sweep is never faster than real time, and its note says so', async () => {
  const { envelopeSweep } = await import('../src/screens/lab/envelope/sweepTiming.ts');
  const old = (total: number) => {
    const sweepMs = Math.round(Math.max(1600, Math.min(4000, total * 4)));
    const slow = sweepMs / total;
    return { sweepMs, label: slow >= 1.5 ? `×${slow < 10 ? slow.toFixed(1) : slow.toFixed(0)} slower than real time` : 'about real time' };
  };
  it('6000 ms and 10 319 ms now sweep in real time (they ran 1.5× and 2.6× fast)', () => {
    for (const total of [6000, 10319]) {
      const s = envelopeSweep(total);
      assert.equal(s.sweepMs, total);
      assert.equal(s.label, 'about real time');
      assert.ok(old(total).sweepMs < total, 'the old sweep was faster than real time');
    }
  });
  it('never faster than real time at any length up to the Explorer\'s maximum', () => {
    for (let total = 1; total <= 10000; total += 37) assert.ok(envelopeSweep(total).sweepMs >= total - 0.5, `${total}`);
  });
  it('every shape up to 4 s sweeps exactly as before', () => {
    for (let total = 1; total <= 4000; total += 7) assert.deepEqual(envelopeSweep(total), old(total), `${total}`);
  });
  it('the chart uses it', () => {
    assert.match(read('src/screens/lab/envelope/EnvelopeChart.tsx'), /const \{ sweepMs, label: slowLabel \} = envelopeSweep\(total\);/);
  });
});

describe('25 · Foundations M10: OUT is captioned as what it prints', async () => {
  const { FOUNDATIONS_CAPTIONS } = await import('../src/screens/lab/foundations/bezelCaptions.ts');
  it('OUT reads the two tones, not a level', () => {
    assert.equal(FOUNDATIONS_CAPTIONS.OUT, 'L/R tones');
    assert.doesNotMatch(FOUNDATIONS_CAPTIONS.OUT, /level/);
    assert.match(read(`${F}FoundationsCourseScreen.tsx`), /k: 'OUT', v: tone\.playing && stereoMode \? \(stereoMode === 'drift' \? '220\/222' : '220\/220'\)/);
  });
});

describe('checker corrections (owner 2026-11-25, round 2)', () => {
  const d0 = defaultDesign('metric');
  const lay = d0.layouts[d0.active];
  const lis = lay.listener;
  const Lsp = lay.speakers.find((x) => x.role === 'L')!;
  // The app's own new gobo: the ADD tray's FREESTANDING PANEL (modTreatment → goboBeside).
  const appGobo = goboBeside(d0.room, lay);
  const count = (t: Treatment[]) => analyze({ ...d0, treatment: t }).reflections.filter((r: Reflection) => r.treatedBy).length;

  it('B1: a gobo standing on the listener, or on a speaker, treats nothing', () => {
    assert.equal(count([{ ...appGobo, x: lis.x, y: lis.y }]), 0);
    assert.equal(count([{ ...appGobo, x: Lsp.x, y: Lsp.y }]), 0);
    assert.ok(goboOutOfPlayLine({ ...appGobo, x: lis.x, y: lis.y }, lay));
  });
  it('B1: a gobo in the direct sound treats nothing and says so in one plain line', () => {
    const g = { ...appGobo, x: Lsp.x + (lis.x - Lsp.x) * 0.4, y: Lsp.y + (lis.y - Lsp.y) * 0.4 };
    assert.equal(goboInDirectSound(g, lay), true);
    assert.equal(count([g]), 0);
    assert.equal(goboOutOfPlayLine(g, lay), 'This panel stands in the direct sound: move it to a reflection path.');
    assert.match(read(`${RD}modules/modTreatment.tsx`), /goboOutOfPlayLine\(sel, /);
  });
  it('B1: a crossing closer than 0.15 m to the speaker or the ears does not count', () => {
    assert.equal(GOBO_END_CLEAR_M, 0.15);
    const t = { x: 1, y: 0.1, z: 1, width: 1, height: 0.4 };
    assert.equal(goboCrossesLeg(t, { x: 1, y: 0, z: 1 }, { x: 1, y: 2, z: 1 }, 0.15, 0), false);
    assert.equal(goboCrossesLeg(t, { x: 1, y: 0, z: 1 }, { x: 1, y: 2, z: 1 }, 0, 0), true);
  });
  it('B1/S2: the app\'s own gobo, where ADD puts it, treats a real reflection path (and is not out of play)', () => {
    assert.equal(goboOutOfPlayLine(appGobo, lay), null);
    const a = analyze({ ...d0, treatment: [appGobo] });
    const hit = a.reflections.filter((r: Reflection) => r.treatedBy === appGobo.id).map((r: Reflection) => reflectionKey(r));
    assert.deepEqual(hit, ['R:w3']);
  });
  it('S2: a new gobo has a 1.6 m face (0.2–1.8 m), 1.2 m wide; it still counts with speakers and ears at 1.25 m', () => {
    assert.equal(appGobo.width, 1.2);
    assert.equal(appGobo.height, 1.6);
    assert.equal(appGobo.z, 1.0);
    const up = { ...lay, listener: { ...lis, earZ: 1.25 }, speakers: lay.speakers.map((x) => ({ ...x, z: 1.25 })) };
    const d2 = { ...d0, layouts: [up], active: 0 };
    const n = (t: Treatment[]) => analyze({ ...d2, treatment: t }).reflections.filter((r: Reflection) => r.treatedBy).length;
    assert.equal(n([appGobo]), 1);
    assert.equal(n([{ ...appGobo, height: 0.4 }]), 0, 'an old 0.4 m gobo (top at 1.2 m) is under a 1.25 m path');
  });
  it('S2: RT60 reads the same stored face (2 × 1.2 × 1.6 m); 500 Hz 0.547 s bare → 0.435 s with a new gobo', () => {
    const mid = (t: Treatment[]) => rt60Bands(d0.room, t).find((b) => b.hz === 500)!.sabine;
    assert.equal(mid([]).toFixed(3), '0.547');
    assert.equal(mid([{ ...appGobo, height: 0.4 }]).toFixed(3), '0.514');
    assert.equal(mid([appGobo]).toFixed(3), '0.435');
  });
  it('S2: the plan draws a gobo on a fixed 0.4 m stand footprint, not its 1.6 m face height', () => {
    const plan = read(`${RD}RoomPlanView.tsx`);
    assert.match(plan, /const depthM = t\.kind === 'gobo' \? GOBO_FOOTPRINT_M : t\.height;/);
    assert.match(read(`${RD}modules/modTreatment.tsx`), /t = goboBeside\(room, lay\);/);
  });

  // Every room shape in the lab, at the lab's own size and a small room, × SIZE / THICK extremes.
  const inside = (p: Pt, v: Pt[]) => pointInPolygon(p, v) || v.some((_, i) => distToEdge(p, v, i).dist < 1e-6);
  it('S3: the alcove\'s inner corner is reflex; no trap is drawn there and a drag never snaps to it', () => {
    const v = shapeVertices('irregular', 4, 5);
    assert.deepEqual(v.map((_, i) => isReflexVertex(v, i)), [false, false, false, true, false, false]);
    assert.equal(basstrapOutline(v, 3, 0.6, 0.3), null);
    const t = { ...basstrapAt({ ...d0.room, vertices: v }, 0) };
    assert.notEqual(moveTreatment(t, v[3], { vertices: v }).wall, 3);
    assert.match(read(`${RD}modules/modTreatment.tsx`), /!have\.has\(i\) && !isReflexVertex\(room\.vertices, i\)/);
    for (const shape of ['rect', 'angled', 'curved'] as const) {
      const r = shapeVertices(shape, 4, 5);
      assert.ok(r.every((_, i) => !isReflexVertex(r, i)), shape);
    }
  });
  it('S3: every outline point lies inside the room, every shape × SIZE 0.4/2.4 × THICK 0.025/0.4', () => {
    let checked = 0;
    for (const shape of ['rect', 'angled', 'irregular', 'curved'] as const) {
      for (const [W, L] of [[4, 5], [2.4, 3]]) {
        const v = shapeVertices(shape, W, L);
        v.forEach((_, i) => {
          for (const size of [0.4, 2.4]) {
            for (const th of [0.025, 0.4]) {
              const o = basstrapOutline(v, i, size, th);
              if (isReflexVertex(v, i)) {
                assert.equal(o, null);
                continue;
              }
              for (const p of [...o!.body, ...(o!.gap ?? []), ...o!.face]) {
                assert.ok(inside(p, v), `${shape} ${W}x${L} corner ${i} SIZE ${size} THICK ${th}: (${p.x.toFixed(3)}, ${p.y.toFixed(3)})`);
                checked++;
              }
            }
          }
        });
      }
    }
    assert.ok(checked > 300, `${checked} points`);
  });
  it('S4: the two tray sentences say what TREATED and the desk now do', () => {
    const t = read(`${RD}modules/modTreatment.tsx`);
    assert.match(t, /TREATED counts only the reflection paths that land on a panel or pass through a freestanding one/);
    assert.match(t, /no panel mounts on a desk top, though a freestanding panel standing in that path counts/);
    assert.doesNotMatch(t, /nothing in the kit treats a desk top/);
  });
  it('N5: the model states the gobo always faces down the room', () => {
    assert.match(read(`${RD}roomModel.ts`), /a gobo always faces down the room/);
  });
});
