/**
 * Lab 4 (Strings) — the shared LUTE FAMILY and its lessons: C13 Oud, C14
 * Sitar, C15 Saraswati Veena (docs/labs/miking/<oud|sitar|veena>/
 * GEOMETRY_PROPOSAL.md, BATCH4_RESEARCH_SUMMARY.md §2):
 *
 *   • the geometry: the sourced overall sizes hold (sitar 124.5 × 34.3 × 31 cm,
 *     veena 121.5 × 34 cm); the oud's three rosettes sit on its face, the
 *     bridge low, the bowl deepest where the face is widest; the sitar's
 *     frets run from the nut down to the neck, its 13 sympathetic strings end
 *     at pegs on the neck's edge and run UNDER the frets' arches, its upper
 *     gourd sits behind the neck; the veena's gourd hangs under the neck above
 *     the floor (a support on the thigh), its resonator resting on the floor;
 *   • the string counts: oud 11 in 6 courses; sitar 7 + 13; veena 4 + 3;
 *   • the sympathetic strings on the ideal-string model (which shapes line
 *     up): the same note lines up every shape, an octave half of them, a
 *     fifth or a fourth two, a semitone none;
 *   • the research corrections: the oud and the veena no longer share the
 *     copied trial ranges, and neither uses them; the hearing line is on each
 *     setting page;
 *   • each lesson validates, carries the 9 pages, is registered in Lab 4 and
 *     served, follows the item-writing rules, names copy ids that exist, and
 *     its monitor can be put in a supercardioid's null by aim alone — where
 *     the lesson says it can, and not where it says it cannot;
 *   • every zone's start AND the middle of its drawn band are clear of every
 *     part and of the player.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Lesson, MicPose } from '../src/screens/lab/miking/engine/model/types.ts';
import { PAGE_IDS } from '../src/screens/lab/miking/engine/model/types.ts';
import { copyOf } from '../src/screens/lab/miking/engine/model/copy.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { LESSONS, readyLabs } from '../src/screens/lab/miking/data/registry.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { micBodyOf, validateLesson } from '../src/screens/lab/miking/engine/model/validate.ts';
import { checkAssembly, compileScene, solidOnPath } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { arrivalAngle, nearNull } from '../src/screens/lab/miking/engine/physics/polar.ts';
import { gradeSetup } from '../src/screens/lab/miking/engine/progress/setupGrade.ts';
import { poseAimedAt } from '../src/screens/lab/miking/lessons/shared/guitars/guitarModel.ts';
import { OUD, oudGeom, SITAR, sitarGeom, VEENA, veenaGeom } from '../src/screens/lab/miking/lessons/shared/lutes/luteSpec.ts';
import { bowlPoints, sceneOfKind } from '../src/screens/lab/miking/lessons/shared/lutes/luteModel.ts';
import { answerWord, etRatio, inStep } from '../src/screens/lab/miking/lessons/shared/lutes/sympathetic.ts';
import { C13_LESSON } from '../src/screens/lab/miking/lessons/c13Oud/lesson.ts';
import { C14_LESSON } from '../src/screens/lab/miking/lessons/c14Sitar/lesson.ts';
import { C15_LESSON } from '../src/screens/lab/miking/lessons/c15Veena/lesson.ts';
import { assertJourneyPages } from './_mikingPages.ts';
import { pageOf } from '../src/screens/lab/miking/engine/restructure.ts';

const LUTES = [C13_LESSON, C14_LESSON, C15_LESSON];

describe('the oud (oud/GEOMETRY_PROPOSAL.md — every size a drawing default)', () => {
  const g = oudGeom();
  it('three rosettes, all on the face: the main one under the strings, two small ones low on either side', () => {
    assert.equal(OUD.roseCount.mm, 3);
    const main = { x: OUD.roseMainX.mm, r: OUD.roseMainD.mm / 2 };
    assert.ok(g.half(main.x) > main.r + 10, 'the main rose fits the face');
    for (const s of [-1, 1]) assert.ok(g.half(OUD.roseSmallX.mm) > OUD.roseSmallY.mm + OUD.roseSmallD.mm / 2, `small rose ${s}`);
    assert.ok(OUD.roseSmallX.mm < main.x, 'the small roses are lower on the face than the main one');
  });
  it('the bridge is low on the face, below every rosette; the fingerboard ends past the main rose', () => {
    assert.ok(g.tail < 0 && 0 < OUD.roseSmallX.mm - OUD.roseSmallD.mm / 2);
    assert.ok(OUD.boardEnd.mm > OUD.roseMainX.mm + OUD.roseMainD.mm / 2);
    assert.ok(g.joint < g.nut);
  });
  it('the bowl is deepest where the face is widest (the drawing rule)', () => {
    const xs = Array.from({ length: 50 }, (_, i) => g.tail + ((g.joint - g.tail) * (i + 0.5)) / 50);
    const deepest = xs.reduce((a, x) => (g.depth(x) > g.depth(a) ? x : a), xs[0]);
    assert.ok(Math.abs(deepest - g.widest) < 15, `${deepest} vs ${g.widest}`);
    assert.ok(Math.abs(g.depth(g.widest) - OUD.bowlDepth.mm) < 1);
  });
  it('eleven strings in six courses: one single bass course and five pairs', () => {
    const c = g.courseYs(0);
    assert.equal(c.length, 6);
    assert.equal(c.filter((q) => q.pair).length * 2 + c.filter((q) => !q.pair).length, OUD.strings.mm);
  });
  it('the pegbox bends back, behind the face', () => assert.ok(g.pegboxEnd.z < -100 && g.pegboxEnd.x > g.nut));
});

describe('the sitar (sitar/GEOMETRY_PROPOSAL.md)', () => {
  const g = sitarGeom();
  it('the sourced size: 124.5 cm long, the gourd 34.3 cm across and 31 cm deep', () => {
    assert.equal(g.top - g.bottom, 1245);
    assert.equal(g.gourd.a * 2, 343);
    assert.ok(Math.abs(-g.gourd.zc + g.gourd.c - 310) < 1e-9, 'the gourd’s depth behind the board');
    // The tabli is the gourd's section at the board.
    assert.ok(Math.abs(g.gourd.a * Math.sqrt(1 - (g.gourd.zc / g.gourd.c) ** 2) - g.tabliR) < 1e-6);
  });
  it('7 main strings (4 to the nut, 3 drones to side pegs) and 13 sympathetic strings', () => {
    assert.equal(g.playedYs(0).length + g.drones.length, SITAR.melody.mm);
    assert.equal(g.taraf.length, SITAR.sympathetic.mm);
  });
  it('19 frets, descending from near the nut to the neck’s foot, all on the neck', () => {
    assert.equal(g.frets.length, 19);
    for (let i = 1; i < g.frets.length; i++) assert.ok(g.frets[i] < g.frets[i - 1]);
    assert.ok(g.frets[0] < g.nut && g.frets[g.frets.length - 1] > g.neck.x0);
  });
  it('the sympathetic strings run under the frets’ arches to pegs along the neck’s edge', () => {
    for (const t of g.taraf) assert.ok(t.pegX > g.neck.x0 && t.pegX < g.nut, `${t.pegX}`);
    assert.ok(SITAR.fretArch.mm > 10, 'the arch leaves room under it');
    assert.ok(g.stringZ(0) > 8 && g.stringZ(g.nut) > SITAR.fretArch.mm, 'the main strings ride over the arches');
  });
  it('the upper gourd sits behind the neck near its top', () => {
    assert.ok(g.upperGourd.z + g.upperGourd.r <= 10 && g.upperGourd.x > 700 && g.upperGourd.x < g.top);
  });
  it('posture: the neck rises about 45° to the player’s left; the board faces the audience', () => {
    const sc = sceneOfKind('sitar');
    const nut = sc.posture.P({ x: g.nut, y: 0, z: 0 });
    assert.ok(nut.x > 0 && nut.y < 0 && Math.abs(Math.abs(nut.y / nut.x) - 1) < 1e-9);
    assert.deepEqual(sc.N, { x: 0, y: 0, z: 1 });
  });
});

describe('the Saraswati veena (veena/GEOMETRY_PROPOSAL.md)', () => {
  const g = veenaGeom();
  const sc = sceneOfKind('veena');
  it('the sourced size: 121.5 cm long, the resonator 34 cm across and 30 cm deep', () => {
    assert.equal(g.tip - g.tail, 1215);
    assert.equal(g.bowl.a * 2, 340);
    assert.ok(Math.abs(-g.bowl.zc + g.bowl.c - 300) < 1e-9);
  });
  it('four melody strings, three tala strings; 24 frets between the nut and the resonator', () => {
    assert.equal(g.melodyYs(0).length, VEENA.melody.mm);
    assert.equal(g.tala.length, VEENA.tala.mm);
    assert.equal(g.frets.length, 24);
    assert.ok(g.frets[g.frets.length - 1] > g.neck.x0 && g.frets[0] < g.nut);
  });
  it('the resonator rests on the floor; the gourd hangs under the neck, clear above the floor (on the thigh)', () => {
    const lowest = Math.max(...bowlPoints(g.bowl.cx, g.bowl.a, g.bowl.c, g.bowl.zc, 0).map((p) => sc.posture.P(p).y));
    assert.ok(Math.abs(lowest - sc.floorY) < 1e-6);
    const gc = sc.posture.P({ x: g.gourd.x, y: 0, z: g.gourd.z });
    const above = sc.floorY - (gc.y + g.gourd.r);
    assert.ok(above > 80 && above < 220, `the gourd is ${above.toFixed(0)} mm above the floor`);
    assert.ok(g.gourd.z + g.gourd.r < -g.neck.depth, 'under the neck');
  });
  it('the face is tilted up and partly toward the player (the proposal’s posture)', () => {
    assert.ok(sc.N.y < -0.85 && sc.N.z < 0);
  });
});

describe('sympathetic strings on the ideal-string model (sympathetic.ts)', () => {
  it('the same note lines up every one of the first 8 shapes; it answers most readily', () => {
    const p = inStep(1);
    assert.equal(p.length, 8);
    assert.ok(p.every((q) => q.n === q.m));
    assert.equal(answerWord(p), 'MOST READILY');
  });
  it('an octave above or below lines up half of them', () => {
    assert.deepEqual(inStep(2).map((q) => [q.n, q.m]), [[2, 1], [4, 2], [6, 3], [8, 4]]);
    assert.deepEqual(inStep(0.5).map((q) => [q.n, q.m]), [[1, 2], [2, 4], [3, 6], [4, 8]]);
  });
  it('a fifth or a fourth (12-TET) lines up two pairs; a semitone none', () => {
    assert.deepEqual(inStep(etRatio(7)).map((q) => [q.n, q.m]), [[3, 2], [6, 4]]);
    assert.deepEqual(inStep(etRatio(5)).map((q) => [q.n, q.m]), [[4, 3], [8, 6]]);
    assert.deepEqual(inStep(etRatio(1)), []);
    assert.equal(answerWord(inStep(etRatio(1))), 'BARELY');
  });
});

describe('research corrections (BATCH4_RESEARCH_SUMMARY.md §2)', () => {
  const band = (z: { distance: { min: number; max: number } }) => `${z.distance.min}-${z.distance.max}`;
  const COPIED = ['350-600', '200-350', '700-1200'];
  it('the oud and the veena no longer share ranges, and neither uses the copied trials', () => {
    const oud = new Set(C13_LESSON.zones.map(band));
    const veena = new Set(C15_LESSON.zones.map(band));
    for (const b of oud) assert.ok(!veena.has(b), `shared band ${b}`);
    for (const b of [...oud, ...veena]) assert.ok(!COPIED.includes(b), `copied band ${b}`);
  });
  it('the oud’s starting points are the oud’s own: 30–45 cm, about 20 cm, within 13 cm of the rose', () => {
    const d = (id: string) => C13_LESSON.zones.find((z) => z.id === id)!.distance;
    assert.deepEqual(d('upper'), { min: 304.8, max: 457.2 });
    assert.ok(d('face').min <= 203.2 && d('face').max >= 203.2);
    assert.equal(d('rose').max, 127);
  });
  it('the sitar keeps the confirmed starts (about 20 cm below the bridge; two mics at 7–8 in)', () => {
    const z = (id: string) => C14_LESSON.zones.find((q) => q.id === id)!;
    assert.ok(z('jawari').distance.min <= 200 && z('jawari').distance.max >= 200);
    for (const id of ['low', 'high']) assert.ok(z(id).distance.min <= 177.8 && z(id).distance.max >= 203.2, id);
  });
  it('the veena’s start is derived: a cardioid’s ±30° takes in the Ø 34 cm plate at its near edge', () => {
    const z = C15_LESSON.zones.find((q) => q.id === 'plate')!;
    assert.ok(z.distance.min >= (VEENA.resonatorD.mm / 2) / Math.tan(Math.PI / 6) - 5);
    assert.equal(z.distance.max, 500);
  });
  it('each setting page carries the hearing line (85 dBA, in plain words)', () => {
    for (const l of LUTES) assert.ok(l.scenarios.some((s) => s.page === 'setting' && /85 dBA/.test(s.explain)), l.id);
  });
});

/** The rules every check follows (the drum and guitar lessons' item rules). */
function itemRules(lesson: Lesson) {
  const items = [...lesson.scenarios, ...lesson.symptoms];
  it('no length cue: the correct option ≤ 1.6× the mean of the others, and the longest in at most a quarter', () => {
    for (const s of [...items, ...lesson.diagnostic]) {
      const others = s.options.filter((o) => o !== s.correct);
      const mean = others.reduce((a, o) => a + o.length, 0) / others.length;
      assert.ok(s.correct.length <= 1.6 * mean, `${s.id}: ${s.correct.length} vs mean ${mean.toFixed(1)}`);
    }
    const longest = items.filter((s) => s.options.every((o) => o === s.correct || o.length < s.correct.length)).length;
    assert.ok(longest <= items.length / 4, `correct is the longest in ${longest} of ${items.length}`);
  });
  it('wrong options carry no absolute-word giveaway, and no option recalls a model', () => {
    for (const s of [...items, ...lesson.diagnostic])
      for (const o of s.options) {
        if (o !== s.correct) assert.doesNotMatch(o, /\b(always|any|never|every)\b/i, `${s.id}: "${o}"`);
        assert.doesNotMatch(o, /Shure|DPA|Schoeps|Audix|AKG|KSM|SM ?7B|OM ?2|C411|4041|MK ?4/, `${s.id}: "${o}"`);
      }
  });
  it('every wrong option has its own explanation; the correct one is an option', () => {
    for (const s of [...items, ...lesson.diagnostic]) {
      assert.ok(s.options.length >= 3, s.id);
      assert.ok(s.options.includes(s.correct), s.id);
      assert.deepEqual(Object.keys(s.why).sort(), s.options.filter((o) => o !== s.correct).sort(), `${s.id}: why keys`);
      for (const o of Object.keys(s.why)) assert.ok(s.why[o].length > 20, `${s.id}: "${o}"`);
    }
  });
  it('the quick check: six items, two per foundation, one critical (hearing)', () => {
    assert.equal(lesson.diagnostic.length, 6);
    for (const p of ['instrument', 'sound', 'setting']) assert.equal(lesson.diagnostic.filter((d) => d.covers === p).length, 2, p);
    const crit = lesson.diagnostic.filter((d) => d.critical);
    assert.equal(crit.length, 1);
    assert.match(crit[0].explain, /85 dBA/);
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
    const noPhantom = lesson.setupTasks.find((x) => /NO phantom/.test(x.brief))!;
    for (const s of noPhantom.setups) if (s.power === 'phantom') assert.equal(s.ok, false, s.id);
  });
  it('the troubleshoot page’s count matches its symptoms', () => {
    const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    assert.match(lesson.pages.troubleshoot.credit.note, new RegExp(`all ${words[lesson.symptoms.length]} symptoms`));
  });
}

function copyIds(lesson: Lesson) {
  it('its copy names zones, monitors and cards that exist', () => {
    const C = copyOf(lesson);
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
    for (const id of C.context.shield) assert.ok(lesson.model.parts.some((q) => q.id === id), id);
    assert.ok(C.context.shield.length >= 3, 'the body shields the path');
    assert.notEqual(C.words.instrument, 'drum');
    for (const id of PAGE_IDS) for (const sid of pageOf(lesson, id).credit.scenarios) assert.ok(cards.has(sid) || lesson.orderTasks.some((t) => t.id === sid) || lesson.setupTasks.some((t) => t.id === sid), `${id}: ${sid}`);
  });
  it('the monitor can sit in a supercardioid’s null by aim alone, and does not at the start; the front sources cannot', () => {
    const X = copyOf(lesson).context;
    const v = X.variant ?? lesson.model.defaultVariant;
    const scene = compileScene(lesson.model, v);
    const z = lesson.zones.find((q) => q.id === X.zone)!;
    const reach = (id: string) => {
      const w = lesson.live.wedges.find((q) => q.id === id)!;
      const src = { x: w.p.x, y: w.p.y - w.lift, z: w.p.z };
      const body = micBodyOf(MIC_TYPES[X.patterns.find((p) => p.id === 'supercardioid')!.typeId]);
      let n = 0;
      for (let da = -X.azMax; da <= X.azMax; da += 5)
        for (let de = -X.elMax; de <= X.elMax; de += 5) {
          const pose: MicPose = { ...z.start, az: z.start.az + da, el: z.start.el + de };
          if (checkAssembly(scene, pose, body)) continue;
          if (nearNull('supercardioid', arrivalAngle(pose, src), 15) && !solidOnPath(scene, pose.p, src, X.shield)) n++;
        }
      return { n, src };
    };
    const t = reach(X.target);
    assert.ok(t.n > 0, 'supercardioid reaches the monitor');
    assert.equal(nearNull('supercardioid', arrivalAngle(z.start, t.src), 15), false, 'the start is not already in the null');
    for (const f of X.frontIds) assert.equal(reach(f).n, 0, `${f}: no null reaches it`);
  });
  it('the two-mic page’s mics start clear of every part and the player, at different distances', () => {
    const C = copyOf(lesson);
    const scene = compileScene(lesson.model, lesson.model.defaultVariant);
    const a = lesson.zones.find((z) => z.id === C.twoMic.A.zone)!.start;
    const b = C.twoMic.B.pose ?? lesson.zones.find((z) => z.id === C.twoMic.B.zone)!.start;
    assert.equal(checkAssembly(scene, a, micBodyOf(MIC_TYPES[C.twoMic.A.typeId])), null, 'A');
    assert.equal(checkAssembly(scene, b, micBodyOf(MIC_TYPES[C.twoMic.B.typeId])), null, 'B');
    const src = lesson.model.regions[0].anchor;
    const d = (p: { x: number; y: number; z: number }) => Math.hypot(p.x - src.x, p.y - src.y, p.z - src.z);
    assert.ok(Math.abs(d(a.p) - d(b.p)) > 40, `path difference ${Math.abs(d(a.p) - d(b.p)).toFixed(0)} mm`);
  });
  it('the middle of each zone’s drawn band, aimed at its point, is clear of every part and the player', () => {
    const scene = compileScene(lesson.model, lesson.model.defaultVariant);
    for (const z of lesson.zones) {
      const s = lesson.model.surfaces.find((q) => q.id === z.refSurface)!;
      const mid = (z.distance.min + z.distance.max) / 2;
      // From the start pose's side of the line, at the band's middle distance.
      const off = { x: z.start.p.x - s.point.x, y: z.start.p.y - s.point.y, z: z.start.p.z - s.point.z };
      const along = off.x * s.normal.x + off.y * s.normal.y + off.z * s.normal.z;
      const across = { x: off.x - s.normal.x * along, y: off.y - s.normal.y * along, z: off.z - s.normal.z * along };
      const p = { x: s.point.x + across.x + s.normal.x * mid, y: s.point.y + across.y + s.normal.y * mid, z: s.point.z + across.z + s.normal.z * mid };
      for (const t of z.requires?.micTypeIds ?? lesson.micTypeIds) {
        const hit = checkAssembly(scene, poseAimedAt(p, s.point), micBodyOf(MIC_TYPES[t]));
        assert.equal(hit, null, `${z.id} (${t}) at its band’s middle: ${hit?.partId}/${hit?.piece}`);
      }
    }
  });
}

for (const lesson of LUTES) {
  describe(`${lesson.id} ${lesson.title} validates`, () => {
    it('validateLesson returns no problems', () => assert.deepEqual(validateLesson(lesson, MIC_TYPES), []));
    it('its written pages serve the 8 journey pages', () => assertJourneyPages(lesson));
    it('it is registered in Lab 4 (strings) and served', () => {
      assert.ok(LESSONS.some((l) => l.id === lesson.id && l.labId === 'strings' && l.status === 'ready'));
      assert.equal(lessonById(lesson.id), lesson);
      assert.ok(readyLabs().some((l) => l.id === 'strings'));
    });
    it('the ⓘ note: starting points from our research — experiment, trust your ears', () => {
      assert.match(lesson.accuracyDetail, /^ABOUT THESE STARTING POINTS\. After our research/);
      assert.match(lesson.accuracyDetail, /experiment/);
      assert.match(lesson.accuracyDetail, /trust your ears/);
    });
    it('a mic facing the instrument: along −z to the face (oud, sitar), down and back onto the veena', () => {
      assert.deepEqual(lesson.model.aimHome, lesson.id === 'C15' ? { az: -90, el: -55 } : { az: -90, el: 0 });
    });
    it('at least two starting points for each mic type (the PLACE activity needs two)', () => {
      for (const t of lesson.micTypeIds) assert.ok(lesson.zones.filter((z) => z.requires?.micTypeIds?.includes(t)).length >= 2, t);
    });
    itemRules(lesson);
    copyIds(lesson);
  });
}

/** This research's own names (added here, beside the shared BRAND_NAMES). */
const LUTE_NAMES = /\b(?:Metropolitan|MFA|ProSoundWeb|Fletcher|Ozturk|Prunka|Stecher|Patro|Duvel|Simmons|Verma|Gayathri|Chauhan|Pianobook|IMRSV|GE-OS|Schoeps|KSM ?\d*|SM ?7B|OM ?2|C ?411|4041|MK ?4|extrica|Mike’s Oud)\b/;
const INTERNAL = new Set(['src', 'quote', 'prov', 'bandProv', 'strikeSrc', 'unknowns', 'examples', 'kind']);
function walk(v: unknown, path: string, out: { path: string; text: string }[]) {
  if (typeof v === 'string') out.push({ path, text: v });
  else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!INTERNAL.has(k)) walk(x, `${path}.${k}`, out);
}
describe('learner-facing text names none of this research’s sources', () => {
  for (const l of LUTES) {
    it(`${l.id}: the lesson data`, () => {
      const items: { path: string; text: string }[] = [];
      walk(l, l.id, items);
      assert.deepEqual(items.filter((i) => LUTE_NAMES.test(i.text)).map((i) => `${i.path}: ${i.text.slice(0, 80)}`), []);
    });
  }
  it('the lute family’s presentation files (comments stripped)', () => {
    const dir = join(process.cwd(), 'src/screens/lab/miking/lessons/shared/lutes');
    const strip = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.tsx'))) {
      const text = strip(readFileSync(join(dir, f), 'utf8'));
      assert.doesNotMatch(text, LUTE_NAMES, f);
    }
  });
});
