/**
 * Lab 4 (Strings) — the shared BOWED-STRING family (lessons/shared/bowed)
 * and its five lessons: C09a VIOLIN AND FIDDLE, C09b VIOLA, C09c CELLO,
 * C06a UPRIGHT BASS PLUCKED, C06b UPRIGHT BASS BOWED
 * (docs/labs/miking/{violin,viola,cello,upright_bass_*}/GEOMETRY_PROPOSAL.md):
 *
 *   • the family: the sourced sizes and lowest notes; frame B maps the
 *     instrument's top out toward the player's front; the bass rests on its
 *     endpin, on the floor;
 *   • the string physics the HOW IT SOUNDS pages draw: still points, the
 *     Helmholtz corner, the slip fraction = the bow point β, the plucked
 *     triangle mirrored half a cycle later;
 *   • each lesson validates, carries the 9 pages, sits in Lab 4, follows the
 *     item-writing rules, and its copy names ids that exist;
 *   • every recommended starting point is clear of every part (in every
 *     variant it is offered), inside its own zone — and NEVER inside the
 *     bow's sweep or the bow hand's path (the bow sweep never intersects a
 *     recommended zone's centre).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Lesson, MicPose } from '../src/screens/lab/miking/engine/model/types.ts';
import { PAGE_IDS } from '../src/screens/lab/miking/engine/model/types.ts';
import { copyOf } from '../src/screens/lab/miking/engine/model/copy.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { MIKING_LABS, LESSONS } from '../src/screens/lab/miking/data/registry.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { micBodyOf, validateLesson } from '../src/screens/lab/miking/engine/model/validate.ts';
import { checkAssembly, compileScene, solidOnPath } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { inZone } from '../src/screens/lab/miking/engine/geometry/zones.ts';
import { sdf } from '../src/screens/lab/miking/engine/geometry/sdf.ts';
import { aimVec } from '../src/screens/lab/miking/engine/geometry/vec.ts';
import { arrivalAngle, nearNull } from '../src/screens/lab/miking/engine/physics/polar.ts';
import { gradeSetup } from '../src/screens/lab/miking/engine/progress/setupGrade.ts';
import { BASS, CELLO, VIOLA, VIOLIN, stationsOf } from '../src/screens/lab/miking/lessons/shared/bowed/bowedSpec.ts';
import { anchorsOf, seated, standing, underChin } from '../src/screens/lab/miking/lessons/shared/bowed/posture.ts';
import { bowState, helmholtzAt, helmholtzCorner, nodesOf, pluckedAt, pluckedHarmonic, shareAt, slipFraction, stillAt } from '../src/screens/lab/miking/lessons/shared/bowed/stringModel.ts';
import { C09A_LESSON } from '../src/screens/lab/miking/lessons/c09aViolin/lesson.ts';
import { C09B_LESSON } from '../src/screens/lab/miking/lessons/c09bViola/lesson.ts';
import { C09C_LESSON } from '../src/screens/lab/miking/lessons/c09cCello/lesson.ts';
import { C06A_LESSON } from '../src/screens/lab/miking/lessons/c06aBassPlucked/lesson.ts';
import { C06B_LESSON } from '../src/screens/lab/miking/lessons/c06bBassBowed/lesson.ts';

const LAB4 = [C09A_LESSON, C09B_LESSON, C09C_LESSON, C06A_LESSON, C06B_LESSON];
const BOWED = [C09A_LESSON, C09B_LESSON, C09C_LESSON, C06B_LESSON];
const r1 = (x: number) => Math.round(x * 10) / 10;
const dot = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => a.x * b.x + a.y * b.y + a.z * b.z;

describe('the bowed-string family (lessons/shared/bowed)', () => {
  it('the sourced body and string lengths, and the bass bow’s hair', () => {
    assert.equal(VIOLIN.body.mm, 358);
    assert.equal(VIOLA.body.mm, 388);
    assert.equal(CELLO.body.mm, 755);
    assert.equal(BASS.body.mm, 1162);
    assert.equal(BASS.string.mm, 1115);
    assert.equal(BASS.bowHair?.mm, 485);
  });
  it('the lowest open strings: G3, C3, C2, E1 (equal temperament, A4 = 440)', () => {
    assert.equal(r1(VIOLIN.lowest.hz), 196);
    assert.equal(r1(VIOLA.lowest.hz), 130.8);
    assert.equal(r1(CELLO.lowest.hz), 65.4);
    assert.equal(r1(BASS.lowest.hz), 41.2);
  });
  it('the stations run tail → bridge → fingerboard end → nut → scroll', () => {
    for (const s of [VIOLIN, VIOLA, CELLO, BASS]) {
      const st = stationsOf(s);
      assert.ok(st.tailX < 0 && 0 < st.fbEndX && st.fbEndX < st.nutX && st.nutX < st.scrollX, s.id);
      assert.ok(st.contactX > 0 && st.contactX < st.fbEndX, `${s.id}: the bow plays between the bridge and the fingerboard`);
    }
  });
  it('the postures: frame B is right-handed in the same sense as the lesson frame, and the top faces out from the player', () => {
    for (const P of [underChin(VIOLIN), underChin(VIOLA, 20), seated(CELLO), standing(BASS, 'pluck'), standing(BASS, 'bow')]) {
      const { x, y, z } = P.ax;
      const det = x.x * (y.y * z.z - y.z * z.y) - x.y * (y.x * z.z - y.z * z.x) + x.z * (y.x * z.y - y.y * z.x);
      assert.ok(Math.abs(det - 1) < 1e-6, `${P.spec.id}: det ${det}`);
      // The top faces away from the player's chest.
      const A = anchorsOf(P);
      const out = { x: A.bridgeTop.x - P.player.chest.x, y: A.bridgeTop.y - P.player.chest.y, z: A.bridgeTop.z - P.player.chest.z };
      assert.ok(dot(out, z) > 0, `${P.spec.id}: the top faces out`);
    }
  });
  it('the cello and the bass rest on their endpins, on the floor', () => {
    for (const P of [seated(CELLO), standing(BASS, 'pluck'), standing(BASS, 'bow')]) {
      assert.ok(P.endpinTip, P.spec.id);
      assert.ok(Math.abs(P.endpinTip!.y - P.floorY) < 2, `${P.spec.id}: endpin tip ${P.endpinTip!.y} vs floor ${P.floorY}`);
    }
  });
});

describe('the string physics the HOW IT SOUNDS pages draw (stringModel.ts)', () => {
  it('shape n has n − 1 still points, evenly spaced', () => {
    assert.deepEqual(nodesOf(1), []);
    assert.deepEqual(nodesOf(4), [0.25, 0.5, 0.75]);
    for (const x of nodesOf(5)) assert.ok(shareAt(5, x) < 1e-9);
  });
  it('a point a seventh of the way along is a still point of shapes 7 and 14 — the bow there cannot drive them', () => {
    assert.deepEqual(stillAt(1 / 7, 14, 1e-6), [7, 14]);
  });
  it('the Helmholtz corner goes out and back once a cycle; the string is a straight line at the turn', () => {
    assert.equal(helmholtzCorner(0.25).x, 0.5);
    assert.equal(helmholtzCorner(0.25).outbound, true);
    assert.equal(helmholtzCorner(0.75).outbound, false);
    assert.ok(Math.abs(helmholtzAt(0.3, 0)) < 1e-9);
  });
  it('the string slips under the bow for a fraction β of the cycle (β = the bow point)', () => {
    for (const beta of [1 / 20, 1 / 10, 1 / 6]) assert.ok(Math.abs(slipFraction(beta) - beta) < 2e-3, `β ${beta}`);
    assert.equal(bowState(0.1, 0.02), 'slip');
    assert.equal(bowState(0.1, 0.3), 'stick');
  });
  it('a plucked string is the same triangle, mirrored, half a cycle later — and back after a whole cycle', () => {
    for (const beta of [0.1, 0.25]) {
      for (const x of [0.05, 0.2, 0.5, 0.8]) {
        assert.ok(Math.abs(pluckedAt(x, 0.5, beta) + pluckedAt(1 - x, 0, beta)) < 1e-9, `half: β ${beta}, x ${x}`);
        assert.ok(Math.abs(pluckedAt(x, 1, beta) - pluckedAt(x, 0, beta)) < 1e-9, `whole: β ${beta}, x ${x}`);
      }
    }
  });
  it('plucked at the middle, the even harmonics are missing', () => {
    assert.ok(pluckedHarmonic(2, 0.5) < 1e-12);
    assert.ok(pluckedHarmonic(3, 0.5) > 0);
  });
});

function itemRules(lesson: Lesson) {
  const items = [...lesson.scenarios, ...lesson.symptoms];
  it('no length cue: the correct option ≤ 1.6× the mean of the others', () => {
    for (const s of [...items, ...lesson.diagnostic]) {
      const others = s.options.filter((o) => o !== s.correct);
      const mean = others.reduce((a, o) => a + o.length, 0) / others.length;
      assert.ok(s.correct.length <= 1.6 * mean, `${s.id}: ${s.correct.length} vs mean ${mean.toFixed(1)}`);
    }
  });
  it('the correct option is the longest in at most a quarter of the checks', () => {
    const all = [...items, ...lesson.diagnostic];
    const longest = all.filter((s) => s.options.every((o) => o === s.correct || o.length < s.correct.length)).length;
    assert.ok(longest <= all.length / 4, `correct is the longest in ${longest} of ${all.length}`);
  });
  it('wrong options carry no absolute-word giveaway', () => {
    for (const s of [...items, ...lesson.diagnostic])
      for (const o of s.options) if (o !== s.correct) assert.doesNotMatch(o, /\b(always|any|never|every)\b/i, `${s.id}: "${o}"`);
  });
  it('every wrong option has its own explanation; the correct one is an option', () => {
    for (const s of [...items, ...lesson.diagnostic]) {
      assert.ok(s.options.length >= 3, s.id);
      assert.ok(s.options.includes(s.correct), s.id);
      assert.deepEqual(Object.keys(s.why).sort(), s.options.filter((o) => o !== s.correct).sort(), `${s.id}: why keys`);
      for (const o of Object.keys(s.why)) assert.ok(s.why[o].length > 20, `${s.id}: "${o}"`);
    }
  });
  it('the quick check: six items, two per foundation, one critical (hearing or the player’s safety)', () => {
    assert.equal(lesson.diagnostic.length, 6);
    for (const p of ['instrument', 'sound', 'setting']) assert.equal(lesson.diagnostic.filter((d) => d.covers === p).length, 2, p);
    assert.ok(lesson.diagnostic.some((d) => d.critical), 'one critical item');
  });
  it('a hearing line: 85 dBA, a limit for people, not a mic rating', () => {
    const texts = [...lesson.scenarios, ...lesson.diagnostic].map((s) => s.explain).join(' ');
    assert.match(texts, /85 dBA/);
  });
  it('each brief passes at least two setups on sound reasons, and a brand reason fails one', () => {
    const REQUIRED = ['r.doc', 'r.clear', 'r.power'];
    for (const t of lesson.setupTasks) {
      const ok = t.setups.filter((s) => s.ok);
      assert.ok(ok.length >= 2, t.id);
      for (const s of ok) assert.equal(gradeSetup(t, s.id, new Set(REQUIRED)).pass, true, `${t.id}/${s.id}`);
      assert.equal(gradeSetup(t, ok[0].id, new Set([...REQUIRED, 'r.brand'])).pass, false, `${t.id} with a brand`);
      for (const r of REQUIRED) assert.equal(gradeSetup(t, ok[0].id, new Set(REQUIRED.filter((x) => x !== r))).pass, false, `${t.id} without ${r}`);
    }
  });
  it('the setup order: power before gain, gain before the final check, each step with a "too early" note', () => {
    const t = lesson.orderTasks[0];
    assert.ok(t.steps.length >= 7);
    for (const s of t.steps) assert.ok(s.early.length > 10, s.text);
    const at = (re: RegExp) => t.steps.findIndex((s) => re.test(s.text));
    assert.ok(at(/phantom/i) >= 0 && at(/phantom/i) < at(/gain/i), 'power before gain');
  });
}

function copyIds(lesson: Lesson) {
  it('its copy names zones, wedges and cards that exist', () => {
    const C = copyOf(lesson);
    assert.ok(lesson.copy, 'the lesson carries its own copy');
    const zones = new Set(lesson.zones.map((z) => z.id));
    const wedges = new Set(lesson.live.wedges.map((w) => w.id));
    const cards = new Map(lesson.scenarios.map((s) => [s.id, s.page]));
    for (const z of Object.values(C.placement.workedZone)) assert.ok(zones.has(z!), `worked ${z}`);
    assert.ok(zones.has(C.context.zone), C.context.zone);
    assert.ok(wedges.has(C.context.target), C.context.target);
    for (const f of C.context.frontIds) assert.ok(wedges.has(f), f);
    assert.equal(cards.get(C.context.studioId), 'context');
    assert.ok(zones.has(C.twoMic.A.zone), C.twoMic.A.zone);
    if (C.twoMic.B.zone) assert.ok(zones.has(C.twoMic.B.zone), C.twoMic.B.zone);
    for (const id of [C.practice.gain, C.practice.second, ...C.practice.mixed]) assert.equal(cards.get(id), 'practice', id);
    for (const p of C.context.patterns) assert.ok(MIC_TYPES[p.typeId], p.typeId);
    for (const id of C.context.shield) assert.ok(lesson.model.parts.some((q) => q.id === id), id);
  });
  it('the context target can sit in a supercardioid’s null by aim alone, and is not already there at the start', () => {
    const X = copyOf(lesson).context;
    const v = X.variant ?? lesson.model.defaultVariant;
    const scene = compileScene(lesson.model, v);
    const z = lesson.zones.find((q) => q.id === X.zone)!;
    const w = lesson.live.wedges.find((q) => q.id === X.target)!;
    const src = { x: w.p.x, y: w.p.y - w.lift, z: w.p.z };
    const sup = X.patterns.find((p) => p.id === 'supercardioid');
    assert.ok(sup, 'a supercardioid is offered');
    const body = micBodyOf(MIC_TYPES[sup!.typeId]);
    let n = 0;
    for (let da = -X.azMax; da <= X.azMax; da += 5)
      for (let de = -X.elMax; de <= X.elMax; de += 5) {
        const pose: MicPose = { ...z.start, az: z.start.az + da, el: z.start.el + de };
        if (checkAssembly(scene, pose, body)) continue;
        if (nearNull('supercardioid', arrivalAngle(pose, src), 15) && !solidOnPath(scene, pose.p, src, X.shield)) n++;
      }
    assert.ok(n > 0, 'reachable');
    assert.equal(nearNull('supercardioid', arrivalAngle(z.start, src), 15), false, 'the start is not already in the null');
  });
}

/** The variants a zone is offered in. */
const variantsOf = (lesson: Lesson, z: Lesson['zones'][number]): string[] => {
  const all = lesson.model.variants.map((v) => v.id);
  const req = z.requires?.variants ?? (z.requires?.variant ? [z.requires.variant] : null);
  return req ?? all;
};

function startsClear(lesson: Lesson) {
  it('every recommended start is clear of every part and inside its own zone, in every variant it is offered', () => {
    for (const z of lesson.zones) {
      const t = MIC_TYPES[z.requires?.micTypeIds?.[0] ?? lesson.micTypeIds[0]];
      const body = micBodyOf(t);
      for (const v of variantsOf(lesson, z)) {
        const scene = compileScene(lesson.model, v);
        const hit = checkAssembly(scene, z.start, body);
        assert.equal(hit, null, `${z.id} (${v}): blocked by ${hit?.partId}/${hit?.piece}`);
        assert.ok(inZone(z, { scene, surfaces: lesson.model.surfaces, lines: lesson.model.lines, variant: v, micTypeId: t.id, mount: t.mount }, z.start), `${z.id} (${v}): not in its zone`);
      }
    }
  });
}

function bowNeverAtAStart(lesson: Lesson) {
  it('the bow’s sweep and the bow hand’s path never reach a recommended start — nor its mic body', () => {
    for (const z of lesson.zones) {
      const t = MIC_TYPES[z.requires?.micTypeIds?.[0] ?? lesson.micTypeIds[0]];
      const len = t.body.length.mm;
      const aim = aimVec(z.start.az, z.start.el);
      for (const v of variantsOf(lesson, z)) {
        const scene = compileScene(lesson.model, v);
        const bow = scene.solids.filter((s) => s.partId === 'bw.bow' || s.partId === 'bw.bowHand');
        assert.equal(bow.length, 2, `${lesson.id} (${v}): the bow and the bow hand are solids`);
        for (const s of bow) {
          // The capsule's front, its middle and its back along the body.
          for (const f of [0, 0.5, 1]) {
            const p = { x: z.start.p.x - aim.x * len * f, y: z.start.p.y - aim.y * len * f, z: z.start.p.z - aim.z * len * f };
            const d = sdf(s.shape, p);
            assert.ok(d > 0, `${z.id} (${v}): ${s.partId} reaches the mic (${d.toFixed(1)} mm at ${f})`);
          }
        }
      }
    }
  });
}

for (const lesson of LAB4) {
  describe(`${lesson.id} ${lesson.title} validates`, () => {
    it('validateLesson returns no problems', () => assert.deepEqual(validateLesson(lesson, MIC_TYPES), []));
    it('the 9 pages are present', () => assert.deepEqual(Object.keys(lesson.pages).sort(), [...PAGE_IDS].sort()));
    it('it is listed in Lab 4 (Strings), and served', () => {
      assert.ok(MIKING_LABS.some((l) => l.id === 'strings'), 'the Strings hub exists');
      assert.ok(LESSONS.some((l) => l.id === lesson.id && l.labId === 'strings' && l.status === 'ready'));
      assert.equal(lesson.labId, 'strings');
      assert.equal(lessonById(lesson.id), lesson);
    });
    it('the ⓘ note: starting points from our research — experiment, trust your ears', () => {
      assert.match(lesson.accuracyDetail, /^ABOUT THESE STARTING POINTS\. After our research/);
      assert.match(lesson.accuracyDetail, /experiment/);
      assert.match(lesson.accuracyDetail, /trust your ears/);
    });
    itemRules(lesson);
    copyIds(lesson);
    startsClear(lesson);
    if (BOWED.includes(lesson)) bowNeverAtAStart(lesson);
  });
}

describe('the two bass lessons share one instrument and one geometry', () => {
  it('the same zones in front, at the f-hole and under the bridge — each lesson adds one of its own', () => {
    const ids = (l: Lesson) => l.zones.map((z) => z.id);
    for (const id of ['ub.front', 'ub.fhole', 'ub.under']) {
      assert.ok(ids(C06A_LESSON).includes(id), `plucked ${id}`);
      assert.ok(ids(C06B_LESSON).includes(id), `bowed ${id}`);
    }
    assert.ok(ids(C06A_LESSON).includes('ub.live'));
    assert.ok(ids(C06B_LESSON).includes('ub.spot'));
  });
  it('“just above the bridge” is in FRONT of the strings, a little higher than the bridge — never on it', () => {
    for (const l of [C06A_LESSON, C06B_LESSON]) {
      const z = l.zones.find((q) => q.id === 'ub.front')!;
      const scene = compileScene(l.model, l.model.defaultVariant);
      const bridge = scene.solids.find((s) => s.partId === 'bw.bridge')!;
      assert.ok(sdf(bridge.shape, z.start.p) > 100, `${l.id}: the start is well clear of the bridge`);
      assert.equal(z.distance.min, 152.4);
      assert.equal(z.distance.max, 304.8);
    }
  });
  it('the plucked bass has no bow; the bowed bass has no plucking-hand envelope', () => {
    const parts = (l: Lesson) => l.model.parts.map((p) => p.id);
    assert.ok(!parts(C06A_LESSON).includes('bw.bow') && parts(C06A_LESSON).includes('bw.pluck'));
    assert.ok(parts(C06B_LESSON).includes('bw.bow') && !parts(C06B_LESSON).includes('bw.pluck'));
  });
});
