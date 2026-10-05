/**
 * Miking Labs — the SPEAKER family and the Speaker-cabinet & Leslie module
 * (lesson SPK). Real relationships only (charter §9.2):
 *   • the rotary cabinet's rotor speeds, ramp times and crossover equal the
 *     maker's table (speaker_leslie/SOURCES.md, HAM-122H p.7 / p.5–6), the
 *     ramps are linear and continuous, and a speed change never snaps;
 *   • the cabinets' outer sizes are the sourced ones, the drivers fit their
 *     baffles with room to spare, every zone's start is clear and inside it,
 *     and each zone's drawn band contains its start;
 *   • every rotary-cabinet mic stays OUTSIDE the cabinet;
 *   • the piston beam is the textbook one (D(0) = 1, first null at
 *     ka·sinθ = 3.8317) and the near field is the calculator's;
 *   • the engine additions (a cylinder on any axis, a target point, an
 *     approach cone) behave;
 *   • the checks follow the item-writing rules, and no learner text names a
 *     maker, a model or a person from the research.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { itemRules, learnerStrings, RESEARCH_NAMES } from './_mikingItemRules.ts';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const rotor = await import('../src/screens/lab/miking/lessons/shared/speakers/rotor.ts');
const sm = await import('../src/screens/lab/miking/lessons/shared/speakers/speakerModel.ts');
const cg = await import('../src/screens/lab/miking/lessons/shared/speakers/cabGeometry.ts');
const lm = await import('../src/screens/lab/miking/lessons/shared/speakers/leslieMics.ts');
const pb = await import('../src/screens/lab/miking/lessons/shared/speakers/pistonBeam.ts');
const labels = await import('../src/screens/lab/miking/lessons/shared/speakers/cabLabels.ts');
const { SPK_LESSON } = await import('../src/screens/lab/miking/lessons/spk/lesson.ts');
const { SPK_CABS, CAB_ORDER } = await import('../src/screens/lab/miking/lessons/spk/geometry.ts');
const { MIC_TYPES } = await import('../src/screens/lab/miking/data/micTypes.ts');
const { validateLesson, micBodyOf } = await import('../src/screens/lab/miking/engine/model/validate.ts');
const { checkAssembly, compileScene } = await import('../src/screens/lab/miking/engine/geometry/collision.ts');
const { inZone, surfaceDistance } = await import('../src/screens/lab/miking/engine/geometry/zones.ts');
const { sdf } = await import('../src/screens/lab/miking/engine/geometry/sdf.ts');
const { pistonNearField } = await import('../src/screens/lab/calc/workspaces/speakersAdv.ts');
const { lessonById } = await import('../src/screens/lab/miking/data/lessons.ts');
const { LESSONS } = await import('../src/screens/lab/miking/data/registry.ts');

const near = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol;

describe('the rotary cabinet: speeds, ramps and crossover are the maker’s', () => {
  const { ROTORS } = rotor;
  it('horn 44 / 402 rpm, 1.8 s up, 2.4 s down; low rotor 42 / 372 rpm, 7 s up, 5.5 s down; crossover 800 Hz', () => {
    assert.deepEqual([ROTORS.horn.slowRpm, ROTORS.horn.fastRpm, ROTORS.horn.riseS, ROTORS.horn.fallS], [44, 402, 1.8, 2.4]);
    assert.deepEqual([ROTORS.drum.slowRpm, ROTORS.drum.fastRpm, ROTORS.drum.riseS, ROTORS.drum.fallS], [42, 372, 7, 5.5]);
    assert.equal(sm.CROSSOVER_HZ, 800);
    assert.match(read('docs/labs/miking/speaker_leslie/SOURCES.md'), /"1\.8\[s\]", fall "2\.4\[s\]", slow "44\[rpm\]", fast "402\[rpm\]"/);
  });
  it('slow → fast takes exactly the rise time, fast → slow the fall time, at a constant rate', () => {
    for (const r of [ROTORS.horn, ROTORS.drum]) {
      const up = rotor.makeRamp(r, 0, 0, r.slowRpm, 'fast');
      assert.ok(near(up.dur, r.riseS), `${r.id} up ${up.dur}`);
      assert.ok(near(rotor.rpmAt(up, r.riseS / 2), (r.slowRpm + r.fastRpm) / 2, 1e-9), 'linear: half way at half time');
      assert.equal(rotor.rpmAt(up, r.riseS + 5), r.fastRpm);
      const down = rotor.makeRamp(r, 0, 0, r.fastRpm, 'slow');
      assert.ok(near(down.dur, r.fallS), `${r.id} down`);
      assert.equal(rotor.rpmAt(down, 100), r.slowRpm);
    }
    assert.ok(ROTORS.horn.riseS < ROTORS.drum.riseS, 'the horn reaches speed first');
  });
  it('the angle integrates the speed (1 rpm = 6° a second) and turns the drawing’s default way', () => {
    const steady = rotor.makeRamp(ROTORS.horn, 0, 0, 402, 'fast');
    assert.ok(near(rotor.angleAt(steady, 1), rotor.DRAW_DIRECTION * 402 * 6, 1e-6));
    const up = rotor.makeRamp(ROTORS.horn, 0, 0, 44, 'fast');
    // ∫ over the ramp = mean speed × time.
    assert.ok(near(rotor.angleAt(up, 1.8), rotor.DRAW_DIRECTION * ((44 + 402) / 2) * 6 * 1.8, 1e-6));
    assert.ok(near(rotor.revPerSec(402), 6.7));
  });
  it('a speed change part-way through a ramp keeps angle and speed continuous (nothing snaps)', () => {
    const r = ROTORS.drum;
    const up = rotor.makeRamp(r, 0, 10, r.slowRpm, 'fast');
    const t = 3.3;
    const back = rotor.retarget(r, up, t, 'slow');
    assert.ok(near(rotor.angleAt(back, t), rotor.angleAt(up, t), 1e-9));
    assert.ok(near(rotor.rpmAt(back, t), rotor.rpmAt(up, t), 1e-9));
    assert.ok(near(back.rate, rotor.decelRate(r)), 'it slows at the fall rate');
    const stop = rotor.retarget(r, up, t, 'stop');
    assert.equal(rotor.rpmAt(stop, t + 100), 0);
  });
  it('the display plays a FINITE run and offers the true speed, slowed ×4 and ×10', () => {
    assert.ok(rotor.RUN_WALL_S > 0 && rotor.RUN_WALL_S <= 60);
    assert.deepEqual(rotor.TIME_BASES.map((b) => b.scale), [0.25, 0.1, 1]);
    const src = read('src/screens/lab/miking/lessons/shared/speakers/LeslieDisplay.tsx');
    assert.match(src, /withTiming\(t0 \+ RUN_WALL_S \* sc/);
    assert.doesNotMatch(src.replace(/\/\*[\s\S]*?\*\//g, ''), /withRepeat\(|useFrameCallback\(|setInterval\(/);
  });
});

describe('the rotary cabinet: size, and every mic outside', () => {
  it('742 × 524 × 1043 mm and a 15 in woofer', () => {
    assert.deepEqual([sm.LESLIE.w.mm, sm.LESLIE.d.mm, sm.LESLIE.h.mm], [742, 524, 1043]);
    assert.ok(near(sm.LESLIE.woofer.mm, 381));
    assert.ok(sm.LESLIE.hornReach.placeholder && sm.LESLIE.drumR.placeholder, 'rotor sizes are drawing defaults');
  });
  it('every arrangement keeps every mic outside the cabinet and its keep-out, at any distance the fader allows', () => {
    for (const arr of ['upper', 'upperLower', 'xyLower', 'sidesLower', 'room'] as const) {
      for (const d of [0, 20, 76.2, 200, 364.8]) {
        for (const m of lm.leslieMics(arr, d, d, 'front').concat(lm.leslieMics(arr, d, d, 'back'))) {
          assert.ok(lm.distanceFromCabinet(m) >= lm.LESLIE_KEEP_OUT - 1e-9, `${arr} ${m.id} at ${d}`);
        }
      }
    }
  });
  it('the starting ranges are the research’s (3 in to 1 ft; about 2 m for a pair)', () => {
    assert.ok(near(lm.LESLIE_RANGES.close.min, 76.2) && near(lm.LESLIE_RANGES.close.max, 304.8));
    assert.equal(lm.LESLIE_RANGES.room, 2000);
    const ms = lm.leslieMics('upperLower', 150, 150);
    assert.ok(ms.every((m) => lm.inRange('upperLower', m)));
    assert.ok(!lm.leslieMics('upperLower', 40, 40).every((m) => lm.inRange('upperLower', m)));
  });
  it('the sounding bell points at a mic when the angle says so (0° = the front); the balance bell does not sound', () => {
    const front = lm.leslieMics('upper', 150, 150)[0];
    assert.ok(lm.bellToMic(0, front) < 1e-6);
    assert.ok(near(lm.bellToMic(180, front), 180, 1e-6), 'the opposite bell is the blocked balance bell: one sweep per turn');
    assert.ok(near(lm.bellToMic(90, front), 90, 1e-6));
  });
});

describe('the cabinets and the 12 in speaker', () => {
  it('outer sizes are the makers’; the speaker’s are the datasheet’s', () => {
    assert.deepEqual([sm.CABINETS['1x12'].w.mm, sm.CABINETS['1x12'].h.mm, sm.CABINETS['1x12'].d.mm], [500, 470, 290]);
    assert.deepEqual([sm.CABINETS['4x12'].w.mm, sm.CABINETS['4x12'].h.mm, sm.CABINETS['4x12'].d.mm], [770, 755, 365]);
    assert.ok(near(sm.CABINETS.bass410.w.mm, 762) && near(sm.CABINETS.bass410.h.mm, 609.6) && near(sm.CABINETS.bass410.d.mm, 482.6));
    assert.deepEqual([sm.SPEAKER_12.dNom.mm, sm.SPEAKER_12.dFrame.mm, sm.SPEAKER_12.dCut.mm, sm.SPEAKER_12.holes.mm], [305, 309, 283, 4]);
    assert.ok(sm.SPEAKER_12.rDust.placeholder && sm.SPEAKER_12.rSurroundIn.placeholder, 'dust cap and surround are drawing defaults');
  });
  it('the drivers fit their baffles: ≥ 10 mm between frames, never past the edge', () => {
    for (const k of ['4x12', 'bass410'] as const) {
      const c = cg.driverClearances(k);
      assert.ok(c.between >= 10, `${k} between ${c.between}`);
      assert.ok(c.toEdge >= 0, `${k} edge ${c.toEdge}`);
    }
    assert.ok(cg.driverClearances('1x12').toEdge >= 0);
  });
  it('the active speaker sits at the origin and the cabinet stands on the floor', () => {
    for (const k of CAB_ORDER) {
      const l = sm.cabLayout(k);
      assert.deepEqual([l.drivers[0].y, l.drivers[0].z], [0, 0]);
      assert.equal(l.floorY, l.box.y1);
      assert.equal(l.box.x1, sm.GRILLE_X.mm);
    }
  });
  it('the section hit test names the parts it draws', () => {
    const s = cg.speakerSection(12);
    assert.equal(labels.cabHitTest('1x12', 'closed', 'side', s.dustX(0) - 2, 0, 4), 'spk.dust');
    assert.equal(labels.cabHitTest('1x12', 'closed', 'side', sm.GRILLE_X.mm, 100, 4), 'spk.grille');
    assert.equal(labels.cabHitTest('1x12', 'open', 'side', sm.cabLayout('1x12').box.x0 + 5, 200, 4), 'spk.openBack');
    assert.equal(labels.cabFrontHit('bass410', sm.cabLayout('bass410').horn!.z, sm.cabLayout('bass410').horn!.y, 4), 'spk.horn');
  });
});

describe('the module validates; its zones are clear, inside, and drawn round their start', () => {
  it('SPK validates as a lesson, and so does each cabinet’s model', () => {
    assert.deepEqual(validateLesson(SPK_LESSON, MIC_TYPES), []);
    for (const k of CAB_ORDER) assert.deepEqual(validateLesson({ ...SPK_LESSON, model: SPK_CABS[k].model, zones: SPK_CABS[k].zones }, MIC_TYPES), [], k);
  });
  it('is registered in Lab 1 and served', () => {
    const row = LESSONS.find((l: { id: string }) => l.id === 'SPK');
    assert.ok(row && row.labId === 'drums' && row.title === 'Amplified speakers & Leslie');
    assert.ok(lessonById('SPK'));
  });
  it('every zone is outside the grille (d > 0) and each start lies inside its drawn band (side view)', () => {
    for (const k of CAB_ORDER) {
      for (const z of SPK_CABS[k].zones) {
        assert.ok(z.distance.min > 0, z.id);
        const polys = z.draw!.side!;
        const u = z.start.p.x;
        const v = z.start.p.y;
        assert.ok(polys.some((g) => { const us = g.poly.map((q) => q[0]); const vs = g.poly.map((q) => q[1]); return u >= Math.min(...us) && u <= Math.max(...us) && v >= Math.min(...vs) && v <= Math.max(...vs); }), `${k} ${z.id}`);
      }
    }
  });
  it('one variable at a time: sliding across the cone keeps the distance from the grille', () => {
    const s = SPK_CABS['1x12'].model.surfaces;
    const a = surfaceDistance(s, 'grille', { p: { x: 60, y: 0, z: 0 }, az: 0, el: 0 });
    const b = surfaceDistance(s, 'grille', { p: { x: 60, y: -118, z: 40 }, az: 0, el: 0 });
    assert.ok(near(a, b) && near(a, 60 - sm.GRILLE_X.mm));
  });
  it('a mic pressed against the cloth is stopped by the cabinet', () => {
    const scene = compileScene(SPK_CABS['1x12'].model, 'closed');
    assert.ok(checkAssembly(scene, { p: { x: sm.GRILLE_X.mm + 2, y: 0, z: 0 }, az: 0, el: 0 }, micBodyOf(MIC_TYPES.instDynCard)));
    assert.equal(checkAssembly(scene, { p: { x: sm.GRILLE_X.mm + 25, y: 0, z: 0 }, az: 0, el: 0 }, micBodyOf(MIC_TYPES.instDynCard)), null);
  });
  it('the open-back zone exists only on the open 1×12, and faces the back', () => {
    const z = SPK_CABS['1x12'].zones.find((q) => q.id === 'cab.rear')!;
    assert.equal(z.requires?.variant, 'open');
    assert.equal(z.start.az, 180);
    assert.ok(!SPK_CABS['4x12'].zones.some((q) => q.id === 'cab.rear'));
    const m = SPK_CABS['1x12'].model;
    const ctx = (v: string) => ({ scene: compileScene(m, v), surfaces: m.surfaces, lines: m.lines, variant: v, micTypeId: 'instDynCard', mount: 'stand' });
    assert.equal(inZone(z, ctx('open'), z.start), true);
    assert.equal(inZone(z, ctx('closed'), z.start), false);
  });
});

describe('the beam: a rigid piston in a wall (textbook), the calculator’s near field', () => {
  it('D(0°) = 1; the first null where k·a·sinθ = 3.8317', () => {
    assert.equal(pb.pistonD(5, 0), 1);
    const ka = 6;
    const theta = (Math.asin(3.8317 / ka) * 180) / Math.PI;
    assert.ok(pb.pistonD(ka, theta) < 1e-3);
  });
  it('low pitches spread wide; the spread narrows as the pitch rises', () => {
    assert.equal(pb.halfAngle(pb.kaOf(200)), null);
    const a1 = pb.halfAngle(pb.kaOf(1000))!;
    const a2 = pb.halfAngle(pb.kaOf(3000))!;
    assert.ok(a1 > a2 && a2 > 0);
  });
  it('the near field is the calculator’s decision (larger of the radius and Sd ÷ λ)', () => {
    const a = pb.PISTON_A_MM / 1000;
    const sd = Math.PI * a * a;
    assert.equal(pb.inNearField(100, 987), pistonNearField(sd, 987, 0.1, pb.C_AIR) !== null);
    const r = pb.farFieldFromMm(987);
    assert.ok(Math.abs(r - Math.max(pb.PISTON_A_MM, ((sd * 987) / pb.C_AIR) * 1000)) < 0.5, `${r}`);
  });
});

describe('engine additions: a cylinder on any axis, a target point, an approach cone', () => {
  it('cyl: negative inside, zero on the wall, positive outside, on a tilted axis', () => {
    const shape = { kind: 'cyl' as const, a: { x: 0, y: 0, z: 0 }, b: { x: 0, y: -100, z: 100 }, r: 50 };
    assert.ok(sdf(shape, { x: 0, y: -50, z: 50 }) < 0);
    assert.ok(near(sdf(shape, { x: 80, y: -50, z: 50 }), 30, 1e-6));
    assert.ok(near(sdf(shape, { x: 50, y: -50, z: 50 }), 0, 1e-6));
    assert.ok(sdf(shape, { x: 0, y: 50, z: -50 }) > 0);
  });
  it('a TARGET surface measures straight-line distance; a plane its normal distance', () => {
    const s = [
      { id: 'pt', partId: 'x', label: 'the point', point: { x: 0, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 }, target: true },
      { id: 'pl', partId: 'x', label: 'the plane', point: { x: 0, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 } },
    ];
    const pose = { p: { x: 300, y: 0, z: 400 }, az: 0, el: 0 };
    assert.ok(near(surfaceDistance(s, 'pt', pose), 500));
    assert.ok(near(surfaceDistance(s, 'pl', pose), 300));
  });
});

/* ── the checks and the words (shared rules: test/_mikingItemRules.ts) ── */
const strings = (v: unknown, out: string[]): void => void learnerStrings(v, out);

describe('SPK: the checks follow the item-writing rules; the words name nobody', () => {
  it('item-writing rules (LESSON_JOURNEY §5)', () => itemRules(SPK_LESSON));
  it('no maker, model or person from the research in learner text', () => {
    const out: string[] = [];
    strings(SPK_LESSON, out);
    const bad = out.filter((t) => RESEARCH_NAMES.test(t));
    assert.deepEqual(bad, []);
    for (const f of ['lessons/spk/pages.tsx', 'lessons/shared/speakers/LeslieDisplay.tsx', 'lessons/shared/speakers/SpeakerSound.tsx', 'lessons/shared/speakers/StagePlan.tsx', 'lessons/shared/speakers/CabExplorer.tsx', 'lessons/shared/journeyPages.tsx']) {
      const text = read(`src/screens/lab/miking/${f}`).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
      const hits = text.split('\n').filter((l) => RESEARCH_NAMES.test(l));
      assert.deepEqual(hits, [], f);
    }
  });
  it('the lesson’s “near-coincident XY” is taught as a coincident X/Y pair (correction logged)', () => {
    const out: string[] = [];
    strings(SPK_LESSON, out);
    assert.ok(!out.some((t) => /near-coincident/i.test(t)));
    assert.match(read('src/screens/lab/miking/lessons/spk/pages.tsx'), /coincident/);
    assert.match(read('docs/labs/miking/CORRECTIONS_LOG.md'), /near-coincident XY/);
  });
});
