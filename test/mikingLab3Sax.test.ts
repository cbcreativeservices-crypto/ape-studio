/**
 * Lab 3 (Winds) — the shared SAXOPHONE family (lessons/shared/sax) and its
 * four lessons: A05a SOPRANO, A05b ALTO, A05c TENOR, A05d BARITONE
 * (docs/labs/miking/alto_sax/GEOMETRY_PROPOSAL.md and the soprano, tenor and
 * baritone rows):
 *
 *   • the family: the sourced lowest notes and the derived air columns
 *     (c ÷ 2f), the transpositions, the 3° cone;
 *   • THE TONE HOLES: one per semitone, ordered from the bell toward the
 *     mouthpiece, on the body or the bell — never in the bow;
 *   • THE RADIATION POINT against the fingering: every key closed → the
 *     bell; up a register the first open hole climbs toward the mouthpiece;
 *     the octave key sends it back down; the bell always carries the high
 *     harmonics;
 *   • the straight soprano's bell points down and forward, never up;
 *   • the bell's swing is a solid (the engine draws keep-outs on approach);
 *   • each lesson validates, sits in Lab 3, follows the item rules, its copy
 *     names ids that exist, every start is clear and inside its zone, and the
 *     Studio-or-live wedge can be put in a supercardioid's null by aim alone.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Lesson, MicPose } from '../src/screens/lab/miking/engine/model/types.ts';
import { PAGE_IDS } from '../src/screens/lab/miking/engine/model/types.ts';
import { copyOf } from '../src/screens/lab/miking/engine/model/copy.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { LESSONS, MIKING_LABS, lessonsOf } from '../src/screens/lab/miking/data/registry.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { micBodyOf, validateLesson } from '../src/screens/lab/miking/engine/model/validate.ts';
import { checkAssembly, compileScene, solidOnPath } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { inZone } from '../src/screens/lab/miking/engine/geometry/zones.ts';
import { sdf } from '../src/screens/lab/miking/engine/geometry/sdf.ts';
import { arrivalAngle, nearNull } from '../src/screens/lab/miking/engine/physics/polar.ts';
import { gradeSetup } from '../src/screens/lab/miking/engine/progress/setupGrade.ts';
import { ALTO, BARITONE, SAX_ROWS, SOPRANO, TENOR, coneNodes, coneShape, fingering, holeCount, holesOf, lowestAirColumn, noteRange, pathOf, radiationPoint, radiators, radiusAt, REGISTER_TOP } from '../src/screens/lab/miking/lessons/shared/sax/saxSpec.ts';
import { anchorsOf, saxPosture } from '../src/screens/lab/miking/lessons/shared/sax/saxPosture.ts';
import { A05A_LESSON } from '../src/screens/lab/miking/lessons/a05aSopranoSax/lesson.ts';
import { A05B_LESSON } from '../src/screens/lab/miking/lessons/a05bAltoSax/lesson.ts';
import { A05C_LESSON } from '../src/screens/lab/miking/lessons/a05cTenorSax/lesson.ts';
import { A05D_LESSON } from '../src/screens/lab/miking/lessons/a05dBaritoneSax/lesson.ts';
import { assertJourneyPages } from './_mikingPages.ts';

const SAX = [A05A_LESSON, A05B_LESSON, A05C_LESSON, A05D_LESSON];
const ROWS = Object.values(SAX_ROWS);
const r1 = (x: number) => Math.round(x * 10) / 10;

describe('the saxophone family (lessons/shared/sax/saxSpec.ts)', () => {
  it('the lowest sounding notes: A♭3, D♭3, A♭2, and C2 with the baritone’s low A', () => {
    assert.equal(r1(SOPRANO.lowest.hz), 207.7);
    assert.equal(r1(ALTO.lowest.hz), 138.6);
    assert.equal(r1(TENOR.lowest.hz), 103.8);
    assert.equal(r1(BARITONE.lowest.hz), 65.4);
  });
  it('the air column of the lowest note is c ÷ 2f (c = 343.2 m/s): 826, 1238, 1653 and 2624 mm (low A)', () => {
    assert.deepEqual(ROWS.map((r) => Math.round(lowestAirColumn(r))), [826, 1238, 1653, 2624]);
  });
  it('written low B♭ sounds the horn’s own note: A♭3, D♭3, A♭2, D♭2', () => {
    assert.deepEqual(ROWS.map((r) => fingering(r, 0).sounding), ['A♭3', 'D♭3', 'A♭2', 'D♭2']);
    assert.equal(r1(fingering(BARITONE, 0).hz), 69.3);
    assert.equal(fingering(BARITONE, -1).written, 'A3', 'the baritone’s low A');
    assert.equal(noteRange(ALTO).lo, 0);
    assert.equal(noteRange(BARITONE).lo, -1);
  });
  it('the bore is a cone: the radius grows along the body, and the bell flares to its rim', () => {
    for (const r of ROWS) {
      const S = pathOf(r);
      assert.ok(radiusAt(r, S.bodyEnd) > radiusAt(r, S.tenon), r.id);
      assert.equal(radiusAt(r, S.U), r.rimR.v, r.id);
    }
  });
});

describe('THE TONE HOLES — one a semitone, ordered, never in the bow', () => {
  for (const r of ROWS) {
    it(`${r.id}: ${holeCount(r)} holes, from the bell end (hole 1) toward the mouthpiece`, () => {
      const H = holesOf(r);
      const S = pathOf(r);
      assert.equal(H.length, r.id === 'baritone' ? 18 : 17);
      for (let i = 1; i < H.length; i++) {
        assert.ok(H[i].u < H[i - 1].u, `hole ${H[i].k} sits nearer the mouthpiece than hole ${H[i - 1].k}`);
        assert.ok(Math.abs(H[i].air / H[i - 1].air - Math.pow(2, -1 / 12)) < 1e-9, 'each hole a semitone: ≈ 6 % shorter');
      }
      for (const h of H) {
        assert.ok(h.u > S.tenon && h.u < S.U, `hole ${h.k} on the body or the bell`);
        assert.ok(!(h.u > S.bodyEnd + 1 && h.u < S.bellStart - 1), `hole ${h.k} is not in the bow`);
        assert.ok(h.cupR > h.r, 'a cup covers its hole');
      }
    });
  }
});

describe('THE RADIATION POINT against the fingering', () => {
  for (const r of ROWS) {
    const S = pathOf(r);
    const { lo, hi } = noteRange(r);
    it(`${r.id}: every key closed (the lowest note) → the bell`, () => {
      const f = fingering(r, lo);
      assert.equal(f.k, 0);
      assert.equal(radiationPoint(r, lo), S.U);
      assert.deepEqual(radiators(r, f).map((x) => x.kind), ['bell']);
    });
    it(`${r.id}: up the first register the first open hole climbs toward the mouthpiece`, () => {
      for (let s = lo + 1; s <= REGISTER_TOP; s++) assert.ok(radiationPoint(r, s) < radiationPoint(r, s - 1), `${fingering(r, s).written} above ${fingering(r, s - 1).written}`);
    });
    it(`${r.id}: the octave key sends it back down, then it climbs again — an octave up on the same holes`, () => {
      const top = REGISTER_TOP;
      assert.ok(radiationPoint(r, top + 1) > radiationPoint(r, top), 'jumps back down the body');
      assert.equal(fingering(r, top + 1).octaveKey, true);
      assert.equal(fingering(r, top).octaveKey, false);
      for (let s = top + 2; s <= hi; s++) assert.ok(radiationPoint(r, s) < radiationPoint(r, s - 1));
      for (let s = top + 1; s <= hi && s - 12 <= top; s++) {
        assert.equal(fingering(r, s).k, fingering(r, s - 12).k, 'the same first open hole as an octave below');
        assert.ok(Math.abs(fingering(r, s).hz / fingering(r, s - 12).hz - 2) < 1e-9, 'an octave up');
      }
    });
    it(`${r.id}: the first open hole is the main radiator, the next open holes weaker, the bell the high harmonics`, () => {
      const f = fingering(r, 9);
      const rad = radiators(r, f);
      assert.equal(rad[0].kind, 'hole');
      assert.equal(rad[0].k, f.k);
      assert.equal(rad[0].strength, 'main');
      assert.ok(rad.filter((x) => x.strength === 'partial').every((x) => x.k < f.k), 'past the first open hole, toward the bell');
      assert.deepEqual(rad.filter((x) => x.kind === 'bell').map((x) => x.strength), ['harmonics']);
      assert.deepEqual(f.open, Array.from({ length: f.k }, (_, i) => f.k - i), 'open from the first open hole down to the bell end');
    });
  }
  it('the air column’s shapes: shape 1 still only at the open end; shape 2 also in the middle (the octave vent)', () => {
    assert.deepEqual(coneNodes(1), [1]);
    assert.deepEqual(coneNodes(2), [0.5, 1]);
    assert.ok(Math.abs(coneShape(2, 0.5)) < 1e-12 && Math.abs(coneShape(1, 1)) < 1e-12);
    assert.ok(Math.abs(coneShape(1, 0.5)) > 0.5, 'shape 1 moves at the vent: the vent spoils it');
  });
});

describe('the posture and the bell', () => {
  it('the straight soprano’s bell points down and forward — never up; the curved bells point up', () => {
    for (const r of ROWS) {
      const A = anchorsOf(saxPosture(r, 'standing'));
      if (r.id === 'soprano') assert.ok(A.bellAxis.y > 0.5 && A.bellAxis.x > 0, 'down and forward');
      else assert.ok(A.bellAxis.y < -0.8, `${r.id}: up`);
    }
  });
  it('the reed tip is at the lips, the floor below; seated, the floor comes closer and the horn stays put', () => {
    for (const r of ROWS) {
      const st = saxPosture(r, 'standing');
      const se = saxPosture(r, 'seated');
      assert.ok(Math.hypot(st.player.head.x, st.player.head.y) < st.player.headR * 1.1, 'the mouth is at the head');
      assert.ok(se.floorY < st.floorY);
      assert.deepEqual(anchorsOf(se).rimC, anchorsOf(st).rimC);
      assert.ok(anchorsOf(st).bottom.y < st.floorY - 200, 'the horn hangs clear of the floor');
    }
  });
  it('the bell’s swing is a solid (drawn by the engine on approach)', () => {
    for (const l of SAX) {
      const e = l.model.envelopes.find((x) => x.id === 'env.swing');
      assert.ok(e, l.id);
      assert.ok(compileScene(l.model, 'standing').solids.some((s) => s.partId === 'env.swing'), l.id);
    }
  });
});

function itemRules(lesson: Lesson) {
  const items = [...lesson.scenarios, ...lesson.symptoms, ...lesson.diagnostic];
  it('no length cue: the correct option ≤ 1.25 × the mean of the others, the longest in at most a quarter', () => {
    for (const s of items) {
      const others = s.options.filter((o) => o !== s.correct);
      const mean = others.reduce((a, o) => a + o.length, 0) / others.length;
      assert.ok(s.correct.length <= 1.25 * mean, `${s.id}: ${s.correct.length} vs ${mean.toFixed(1)}`);
    }
    const longest = items.filter((s) => s.options.every((o) => o === s.correct || o.length < s.correct.length)).length;
    assert.ok(longest <= items.length / 4, `${longest} of ${items.length}`);
  });
  it('every wrong option has its own why and no absolute word; the quick check has a critical hearing item', () => {
    for (const s of items) {
      assert.ok(s.options.includes(s.correct), s.id);
      assert.deepEqual(Object.keys(s.why).sort(), s.options.filter((o) => o !== s.correct).sort(), s.id);
      for (const o of s.options) if (o !== s.correct) assert.doesNotMatch(o, /\b(always|any|never|every)\b/i, `${s.id}: ${o}`);
    }
    assert.equal(lesson.diagnostic.length, 6);
    for (const p of ['instrument', 'sound', 'setting']) assert.equal(lesson.diagnostic.filter((d) => d.covers === p).length, 2, p);
    const crit = lesson.diagnostic.filter((d) => d.critical);
    assert.equal(crit.length, 1);
    assert.match(crit[0].explain, /85 dBA/);
  });
  it('the radiation wording: the FIRST open hole, never “last open holes”; the supercardioid null toward the rear', () => {
    // What the lesson TEACHES: the keys, the explanations, the stages and the
    // zones (a wrong option may state the misconception on purpose).
    const taught = [...lesson.scenarios, ...lesson.diagnostic].flatMap((s) => [s.correct, s.explain, ...Object.values(s.why)]);
    const text = JSON.stringify({ taught, sound: lesson.sound, z: lesson.zones.map((z) => [z.label, z.band, z.tendency]) });
    assert.doesNotMatch(text, /last open hole/i);
    assert.match(text, /first open hole/i);
    assert.match(text, /125°/);
    assert.doesNotMatch(text, /nulls? (?:at|on) (?:the|its) sides/i);
  });
  it('each brief passes at least two setups on sound reasons, and a brand reason fails one', () => {
    const REQUIRED = ['r.doc', 'r.clear', 'r.power'];
    for (const t of lesson.setupTasks) {
      const ok = t.setups.filter((s) => s.ok);
      assert.ok(ok.length >= 2, t.id);
      for (const s of ok) assert.equal(gradeSetup(t, s.id, new Set(REQUIRED)).pass, true, `${t.id}/${s.id}`);
      assert.equal(gradeSetup(t, ok[0].id, new Set([...REQUIRED, 'r.brand'])).pass, false);
    }
  });
}

function copyIds(lesson: Lesson) {
  it('its copy names zones, wedges and cards that exist', () => {
    const C = copyOf(lesson);
    const zones = new Set(lesson.zones.map((z) => z.id));
    const wedges = new Set(lesson.live.wedges.map((w) => w.id));
    const cards = new Map(lesson.scenarios.map((s) => [s.id, s.page]));
    for (const z of Object.values(C.placement.workedZone)) assert.ok(zones.has(z!), `worked ${z}`);
    assert.ok(zones.has(C.context.zone));
    assert.ok(wedges.has(C.context.target));
    assert.equal(cards.get(C.context.studioId), 'context');
    assert.ok(zones.has(C.twoMic.A.zone));
    assert.ok(C.twoMic.B.zone && zones.has(C.twoMic.B.zone));
    for (const id of [C.practice.gain, C.practice.second, ...C.practice.mixed]) assert.equal(cards.get(id), 'practice', id);
    for (const p of C.context.patterns) assert.ok(MIC_TYPES[p.typeId], p.typeId);
    for (const id of C.context.shield) assert.ok(lesson.model.parts.some((q) => q.id === id), id);
  });
  it('the context wedge can sit in a supercardioid’s null by aim alone, and is not already there at the start', () => {
    const X = copyOf(lesson).context;
    const v = X.variant ?? lesson.model.defaultVariant;
    const scene = compileScene(lesson.model, v);
    const z = lesson.zones.find((q) => q.id === X.zone)!;
    const w = lesson.live.wedges.find((q) => q.id === X.target)!;
    const src = { x: w.p.x, y: w.p.y - w.lift, z: w.p.z };
    const sup = X.patterns.find((p) => p.id === 'supercardioid')!;
    const body = micBodyOf(MIC_TYPES[sup.typeId]);
    let n = 0;
    for (let da = -X.azMax; da <= X.azMax; da += 5)
      for (let de = -X.elMax; de <= X.elMax; de += 5) {
        const pose: MicPose = { ...z.start, az: z.start.az + da, el: z.start.el + de };
        if (checkAssembly(scene, pose, body)) continue;
        if (nearNull('supercardioid', arrivalAngle(pose, src), 15) && !solidOnPath(scene, pose.p, src, X.shield)) n++;
      }
    assert.ok(n > 0, 'reachable');
    assert.equal(nearNull('supercardioid', arrivalAngle(z.start, src), 15), false, 'not already in the null');
  });
}

for (const lesson of SAX) {
  describe(`${lesson.id} ${lesson.title}`, () => {
    it('validateLesson returns no problems; its written pages serve the 8 journey pages', () => {
      assert.deepEqual(validateLesson(lesson, MIC_TYPES), []);
      assertJourneyPages(lesson);
    });
    it('it is listed in Lab 3 (Winds), on its own registry line, and served', () => {
      const lab = MIKING_LABS.find((l) => l.id === 'winds')!;
      assert.ok(lab.blurb.length > 40, 'the Winds hub has its blurb');
      assert.ok(LESSONS.some((l) => l.id === lesson.id && l.labId === 'winds' && l.status === 'ready'));
      assert.ok(lessonsOf('winds').some((l) => l.id === lesson.id));
      assert.equal(lesson.labId, 'winds');
      assert.equal(lessonById(lesson.id), lesson);
    });
    it('the ⓘ note: starting points from our research — experiment, trust your ears', () => {
      assert.match(lesson.accuracyDetail, /^ABOUT THESE STARTING POINTS\. After our research/);
      assert.match(lesson.accuracyDetail, /experiment/);
      assert.match(lesson.accuracyDetail, /trust your ears/);
    });
    it('every recommended start is clear of every part (the swing included) and inside its own zone, standing and seated', () => {
      for (const z of lesson.zones) {
        const t = MIC_TYPES[z.requires?.micTypeIds?.[0] ?? lesson.micTypeIds[0]];
        const body = micBodyOf(t);
        for (const v of ['standing', 'seated']) {
          const scene = compileScene(lesson.model, v);
          const hit = checkAssembly(scene, z.start, body);
          assert.equal(hit, null, `${z.id} (${v}): blocked by ${hit?.partId}/${hit?.piece}`);
          assert.ok(inZone(z, { scene, surfaces: lesson.model.surfaces, lines: lesson.model.lines, variant: v, micTypeId: t.id, mount: t.mount }, z.start), `${z.id} (${v})`);
        }
      }
    });
    it('no start sits in the hands’ reach', () => {
      const scene = compileScene(lesson.model, 'standing');
      const hands = scene.solids.filter((s) => s.partId.startsWith('sx.hand'));
      assert.equal(hands.length, 2);
      for (const z of lesson.zones) for (const h of hands) assert.ok(sdf(h.shape, z.start.p) > 0, `${z.id} in ${h.partId}`);
    });
    it('a clip goes on the bell rim, within its reach; the stand zones use stand mics', () => {
      for (const z of lesson.zones) {
        const t = MIC_TYPES[z.requires!.micTypeIds![0]];
        if (t.mount === 'clip') assert.equal(z.refSurface, 'bell', z.id);
      }
      assert.deepEqual(lesson.model.rims?.map((r) => r.id), ['bellRim']);
    });
    itemRules(lesson);
    copyIds(lesson);
  });
}

describe('each saxophone is its own', () => {
  it('the soprano has no mid-body “natural” zone; the curved horns start above the bell', () => {
    const ids = (l: Lesson) => l.zones.map((z) => z.id);
    assert.ok(ids(A05A_LESSON).includes('ss.far') && ids(A05A_LESSON).includes('ss.bite'));
    for (const l of [A05B_LESSON, A05C_LESSON, A05D_LESSON]) {
      const above = l.zones.find((z) => z.id.endsWith('.above'))!;
      const A = anchorsOf(saxPosture(SAX_ROWS[l.model.id as keyof typeof SAX_ROWS], 'standing'));
      assert.ok(above.start.p.y < A.rimC.y, `${l.id}: above the rim`);
    }
  });
  it('the tenor offers the farther start a third of the way up; the baritone the triangle', () => {
    assert.ok(A05C_LESSON.zones.some((z) => z.id === 'ts.third' && z.distance.min === 304.8 && z.distance.max === 609.6));
    const tri = A05D_LESSON.zones.find((z) => z.id === 'bs.triangle')!;
    assert.ok(tri.near && tri.distance.min > 800, 'about a horn’s length away');
  });
  it('the baritone’s lowest notes sit below a wireless pack’s 80 Hz cut; the others above it', () => {
    assert.ok(fingering(BARITONE, -1).hz < 80 && fingering(BARITONE, 0).hz < 80);
    for (const r of [SOPRANO, ALTO, TENOR]) assert.ok(fingering(r, 0).hz > 80, r.id);
    assert.match(A05D_LESSON.scenarios.find((s) => s.id === 'bs.mic.4')!.correct, /thin the lowest notes/);
  });
});
