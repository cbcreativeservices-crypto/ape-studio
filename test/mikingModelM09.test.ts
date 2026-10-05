/**
 * M09 Drum Overheads — the model (overheads/GEOMETRY_PROPOSAL.md §2):
 *
 *   • validateLesson(M09) is clean in both variants (studio, live);
 *   • the floor-tom method: the mic above the snare is 40 in (1016 mm) above
 *     its centre; the side mic is 6 in above the floor-tom rim and ALSO
 *     1016 mm from the snare's centre — the method's equal-distance rule;
 *     its kick distances differ (the two-mic arrival the lesson draws);
 *   • the "4 ft above the kit" account sits 48 in above the snare;
 *   • the shoulder method: both mics 32 in (812.8 mm) from the snare's centre
 *     AND equally far from the kick;
 *   • ORTF: 170 mm apart, 110° included; X/Y: coincident, 90° up to 135°;
 *     the spaced pair: each capsule 4 ft (1219.2 mm) from the snare;
 *   • every distance to the snare and the kick, for each pair, as a table;
 *   • the zone starts are clear of the kit in every variant they allow.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { M09_LESSON } from '../src/screens/lab/miking/lessons/m09Overheads/lesson.ts';
import { AB_HAT, AB_RIDE, GJ_MAIN, GJ_MAIN_HIGH, GJ_SIDE, MONO, OH, RM_A, RM_B } from '../src/screens/lab/miking/lessons/m09Overheads/model.ts';
import { PAIR_IDS, includedAngle, pairOf, pathDiff, shoulderClearance, snareKick, spacing } from '../src/screens/lab/miking/lessons/m09Overheads/pairs.ts';
import { DRUMMER, FT_RIM_H, O, S0, distMm, heightOf } from '../src/screens/lab/miking/lessons/shared/kitScene/kitSceneModel.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { micBodyOf, validateLesson } from '../src/screens/lab/miking/engine/model/validate.ts';
import { checkAssembly, compileScene } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { C20 } from '../src/screens/lab/miking/engine/physics/twoMic.ts';

const IN = 25.4;
const near = (a: number, b: number, tol: number, msg?: string) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} ${a} vs ${b} (±${tol})`);
const lesson = M09_LESSON;

describe('M09 — the lesson validates', () => {
  it('validateLesson is clean', () => {
    assert.deepEqual(validateLesson(lesson, MIC_TYPES), []);
  });
  it('every zone start is clear of the kit in each variant it allows', () => {
    for (const v of lesson.model.variants.map((x) => x.id)) {
      const scene = compileScene(lesson.model, v);
      for (const z of lesson.zones) {
        if (z.requires?.variants && !z.requires.variants.includes(v)) continue;
        const t = MIC_TYPES[z.requires!.micTypeIds![0]];
        assert.equal(checkAssembly(scene, z.start, micBodyOf(t)), null, `${z.id} in ${v}`);
      }
    }
  });
});

describe('M09 — the floor-tom method', () => {
  it('the mic above is 40 in (1016 mm) straight above the snare’s centre', () => {
    assert.equal(OH.gjMain, 40 * IN);
    near(distMm(GJ_MAIN, S0), 1016, 1e-9);
    assert.equal(GJ_MAIN.x, S0.x);
    assert.equal(GJ_MAIN.z, S0.z);
    near(distMm(GJ_MAIN_HIGH, S0), 48 * IN, 1e-9, '4 ft above');
  });
  it('the side mic: 6 in above the floor-tom rim, the same 1016 mm from the snare', () => {
    near(heightOf(GJ_SIDE), FT_RIM_H + 6 * IN, 1e-9);
    near(distMm(GJ_SIDE, S0), 1016, 1e-6);
    near(GJ_SIDE.x, -347.5, 0.1);
    near(GJ_SIDE.y, -492.0, 0.1);
    near(GJ_SIDE.z, 675.1, 0.1);
  });
  it('the kick is NOT equidistant: about 553 mm (≈ 1.6 ms) farther from the mic above', () => {
    const top = distMm(GJ_MAIN, O);
    const side = distMm(GJ_SIDE, O);
    near(top, 1458.0, 0.2);
    near(side, 904.8, 0.2);
    near((top - side) / C20, 1.61, 0.01, 'ms');
  });
});

describe('M09 — the shoulder method', () => {
  it('both mics 32 in (812.8 mm) from the snare’s centre', () => {
    assert.equal(OH.shoulderMethod, 32 * IN);
    near(distMm(RM_A, S0), 812.8, 1e-9);
    near(distMm(RM_B, S0), 812.8, 1e-6);
  });
  it('and equally far from the kick', () => {
    near(distMm(RM_A, O), distMm(RM_B, O), 1e-6);
  });
  it('mic B sits inside the drawing’s sticks’ reach (the lesson says so; logged)', () => {
    const c = shoulderClearance(pairOf('shoulder'));
    assert.equal(c.inReach, true);
    assert.ok(c.b < DRUMMER.reach);
  });
});

describe('M09 — the stereo pairs', () => {
  it('ORTF: 170 mm apart, 110° included', () => {
    const p = pairOf('ortf');
    near(spacing(p), 170, 1e-9);
    near(includedAngle(p), 110, 1e-9);
  });
  it('X/Y: coincident (5 mm), 90° by default, clamped to 90–135°', () => {
    near(spacing(pairOf('xy')), 5, 1e-9);
    near(includedAngle(pairOf('xy')), 90, 1e-9);
    near(includedAngle(pairOf('xy', 120)), 120, 1e-9);
    near(includedAngle(pairOf('xy', 170)), 135, 1e-9);
    near(includedAngle(pairOf('xy', 40)), 90, 1e-9);
  });
  it('the spaced pair: each capsule 4 ft (1219.2 mm) from the snare, equal heights', () => {
    near(distMm(AB_HAT, S0), 1219.2, 1e-6);
    near(distMm(AB_RIDE, S0), 1219.2, 1e-6);
    assert.equal(AB_HAT.y, AB_RIDE.y);
    assert.equal(pairOf('spaced').a.pattern, 'omni');
  });
  it('the distances to the snare and kick from each mic (the table the lesson draws)', () => {
    const table: Record<string, { snareA: number; snareB: number; kickA: number; kickB: number }> = {};
    for (const id of PAIR_IDS) table[id] = snareKick(pairOf(id));
    // Equal snare distances: the coincident and near-coincident pairs, and the methods.
    for (const id of ['xy', 'ortf', 'spaced', 'floortom', 'shoulder'] as const) near(table[id].snareA, table[id].snareB, 1e-6, id);
    // The floor-tom method's kick difference; the shoulder method's is zero.
    assert.ok(Math.abs(table.floortom.kickA - table.floortom.kickB) > 500);
    near(table.shoulder.kickA, table.shoulder.kickB, 1e-6);
    // A pair centred over the snare hears the kick (off to one side) a
    // little apart — never more than its spacing.
    assert.ok(Math.abs(table.ortf.kickA - table.ortf.kickB) <= 170);
    assert.ok(Math.abs(table.xy.kickA - table.xy.kickB) <= 5);
  });
  it('path differences: ORTF hears the hi-hat earlier on the hi-hat side; X/Y nearly together', () => {
    const hat = { x: AB_HAT.x, y: S0.y - 200, z: AB_HAT.z };
    const o = pathDiff(pairOf('ortf'), hat);
    assert.ok(o > 50 && o <= 170, `ORTF hi-hat difference ${o}`);
    assert.ok(Math.abs(pathDiff(pairOf('xy'), hat)) < 6);
  });
  it('the mono overhead is 1 ft above a 1300 mm head', () => {
    near(heightOf(MONO), 1300 + 12 * IN, 1e-9);
  });
});
