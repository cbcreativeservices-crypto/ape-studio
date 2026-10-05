/**
 * Lab 4 (Strings) — the shared GUITAR BODY FAMILY and its lessons
 * (docs/labs/miking/acoustic_guitar/GEOMETRY_PROPOSAL.md §2–§7 and the
 * per-lesson proposals; BATCH4_RESEARCH_SUMMARY.md §2–§3):
 *
 *   • the family: fret positions from the formula, the 14-fret steel joint
 *     with the 12th fret 35.33 mm out on the neck (34.50 on the twelve-
 *     string), the 12-fret nylon joint, the sound hole between the bridge and
 *     the body edge, the clip depth fits (35–122 mm), twelve strings in six
 *     pairs;
 *   • the ideal plucked string: whole-number ratios, n − 1 still points, a
 *     middle pluck leaving every even shape still, the shapes summing back to
 *     the triangle;
 *   • each lesson validates, carries the 9 pages, is registered in Lab 4 and
 *     served, follows the item-writing rules, names copy ids that exist, and
 *     its wedge can be put in a supercardioid's null by aim alone;
 *   • every zone's start is clear of every part and inside its zone (via
 *     validateLesson), and the starting points read from the points the
 *     research names.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
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
import { fretX, geomOf, NYLON_C5, onBody, STEEL_DREAD, TWELVE_HD } from '../src/screens/lab/miking/lessons/shared/guitars/guitarSpec.ts';
import { modeShape, pluckShare, pluckSum, relativeToLowest, stillPoints } from '../src/screens/lab/miking/lessons/shared/guitars/stringPhysics.ts';
import { C01_LESSON } from '../src/screens/lab/miking/lessons/c01Guitar/lesson.ts';

const r2 = (x: number) => Math.round(x * 100) / 100;

describe('the guitar body family (acoustic_guitar/GEOMETRY_PROPOSAL.md §2)', () => {
  it('fret positions follow L·2^(−n/12): the 12th fret halves the string', () => {
    for (const s of [STEEL_DREAD, TWELVE_HD, NYLON_C5]) assert.equal(r2(fretX(s.scale.mm, 12)), r2(s.scale.mm / 2), s.id);
    assert.equal(r2(fretX(647.7, 14)), 288.52);
  });
  it('a 14-fret steel body puts the 12th fret 35.33 mm out on the neck (34.50 on the twelve-string); the nylon joins AT the 12th', () => {
    const st = geomOf(STEEL_DREAD);
    const tw = geomOf(TWELVE_HD);
    const ny = geomOf(NYLON_C5);
    assert.equal(r2(st.fret12 - st.edge), 35.33);
    assert.equal(r2(tw.fret12 - tw.edge), 34.5);
    assert.equal(r2(ny.fret12 - ny.edge), 0);
    assert.equal(r2(ny.edge), 325);
  });
  it('the sound hole lies wholly between the bridge plate and the body edge, on the top', () => {
    for (const s of [STEEL_DREAD, TWELVE_HD, NYLON_C5]) {
      const g = geomOf(s);
      const bridgeEnd = s.bridge.x.mm + s.bridge.l.mm / 2;
      assert.ok(g.hole.x - g.hole.r > bridgeEnd, s.id);
      assert.ok(g.hole.x + g.hole.r < g.edge, s.id);
      assert.ok(onBody(g, g.hole.x, g.hole.r) && onBody(g, g.hole.x, -g.hole.r), `${s.id}: hole inside the outline`);
    }
  });
  it('the bodies are the sourced sizes; their depths fit a 35–122 mm guitar clip', () => {
    assert.equal(r2(STEEL_DREAD.body.length.mm), 508);
    assert.equal(r2(STEEL_DREAD.body.lower.mm), 406.4);
    assert.equal(r2(STEEL_DREAD.body.depth.mm), 117.48);
    assert.equal(r2(NYLON_C5.body.length.mm), 488.95);
    for (const s of [STEEL_DREAD, TWELVE_HD, NYLON_C5]) assert.ok(s.body.depth.mm >= 35 && s.body.depth.mm <= 122, s.id);
  });
  it('the twelve-string carries twelve strings in six pairs; the others six', () => {
    assert.equal(geomOf(TWELVE_HD).stringYs(100).length, 12);
    assert.equal(geomOf(STEEL_DREAD).stringYs(100).length, 6);
    assert.equal(geomOf(NYLON_C5).stringYs(100).length, 6);
  });
  it('the outline is widest at the lower bout and narrows at the waist', () => {
    const g = geomOf(STEEL_DREAD);
    assert.equal(r2(g.halfW(STEEL_DREAD.body.xLower.mm, 'bass')), r2(406.4 / 2));
    assert.ok(g.halfW(STEEL_DREAD.body.xWaist.mm, 'bass') < g.halfW(STEEL_DREAD.body.xLower.mm, 'bass'));
    assert.equal(g.halfW(g.tail - 1, 'bass'), 0);
  });
});

describe('the ideal plucked string (stringPhysics.ts)', () => {
  it('shape n has n − 1 still points, evenly spaced', () => {
    assert.deepEqual(stillPoints(1), []);
    assert.deepEqual(stillPoints(3).map(r2), [0.33, 0.67]);
    for (const n of [2, 3, 4, 5]) for (const s of stillPoints(n)) assert.ok(Math.abs(modeShape(n, s)) < 1e-9);
  });
  it('a pluck at the exact middle leaves every even shape still', () => {
    for (const n of [2, 4, 6]) assert.ok(pluckShare(n, 0.5) < 1e-9, `${n}`);
    for (const n of [1, 3, 5]) assert.ok(Math.abs(pluckShare(n, 0.5) - 1) < 1e-9, `${n}`);
  });
  it('a pluck near the bridge gives the upper shapes relatively more than a middle pluck', () => {
    assert.ok(Math.abs(relativeToLowest(3, 0.08)) > Math.abs(relativeToLowest(3, 0.5)));
  });
  it('the shapes sum back to the triangle of the pluck', () => {
    assert.ok(Math.abs(pluckSum(0.3, 0.3, 400) - 1) < 0.01);
    assert.ok(Math.abs(pluckSum(0.3, 0.65, 400) - (1 - 0.65) / (1 - 0.3)) < 0.01);
  });
});

/** The rules every check follows (the drum lessons' item-writing rules). */
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
    const longest = items.filter((s) => s.options.every((o) => o === s.correct || o.length < s.correct.length)).length;
    assert.ok(longest <= items.length / 4, `correct is the longest in ${longest} of ${items.length}`);
  });
  it('wrong options carry no absolute-word giveaway, and no option recalls a model', () => {
    for (const s of [...items, ...lesson.diagnostic])
      for (const o of s.options) {
        if (o !== s.correct) assert.doesNotMatch(o, /\b(always|any|never|every)\b/i, `${s.id}: "${o}"`);
        assert.doesNotMatch(o, /Shure|DPA|Taylor|Martin|Cordoba|Yamaha|4099|PGA ?27|KSM/, `${s.id}: "${o}"`);
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
  it('the setup order has seven steps, power before gain before securing', () => {
    const t = lesson.orderTasks[0];
    assert.equal(t.steps.length, 7);
    for (const s of t.steps) assert.ok(s.early.length > 10, s.text);
    const at = (re: RegExp) => t.steps.findIndex((s) => re.test(s.text));
    assert.ok(at(/phantom/i) < at(/input gain/i), 'power before gain');
    assert.ok(at(/input gain/i) < at(/Secure/), 'gain before securing');
  });
  it('a hearing-safety line is on the setting page (85 dBA, in plain words)', () => {
    assert.ok(lesson.scenarios.some((s) => s.page === 'setting' && /85 dBA/.test(s.explain)));
  });
}

function copyIds(lesson: Lesson) {
  it('its copy names zones, wedges and cards that exist', () => {
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
    for (const p of C.context.patterns) assert.ok(MIC_TYPES[p.typeId], p.typeId);
    for (const id of C.context.shield) assert.ok(lesson.model.parts.some((q) => q.id === id), id);
    assert.equal(C.words.instrument !== 'drum', true, 'the family words replace the drum words');
  });
  it('the wedge can sit in a supercardioid’s null by aim alone, and does not at the start; the voice in front cannot', () => {
    const X = copyOf(lesson).context;
    const v = X.variant ?? lesson.model.defaultVariant;
    const scene = compileScene(lesson.model, v);
    const z = lesson.zones.find((q) => q.id === X.zone)!;
    const reach = (id: string, pat: 'cardioid' | 'supercardioid') => {
      const w = lesson.live.wedges.find((q) => q.id === id)!;
      const src = { x: w.p.x, y: w.p.y - w.lift, z: w.p.z };
      const body = micBodyOf(MIC_TYPES[X.patterns.find((p) => p.id === pat)!.typeId]);
      let n = 0;
      for (let da = -X.azMax; da <= X.azMax; da += 5)
        for (let de = -X.elMax; de <= X.elMax; de += 5) {
          const pose: MicPose = { ...z.start, az: z.start.az + da, el: z.start.el + de };
          if (checkAssembly(scene, pose, body)) continue;
          if (nearNull(pat, arrivalAngle(pose, src), 15) && !solidOnPath(scene, pose.p, src, X.shield)) n++;
        }
      return { n, src };
    };
    const t = reach(X.target, 'supercardioid');
    assert.ok(t.n > 0, 'supercardioid reaches the wedge');
    assert.equal(nearNull('supercardioid', arrivalAngle(z.start, t.src), 15), false, 'the start is not already in the null');
    for (const f of X.frontIds) assert.equal(reach(f, 'supercardioid').n, 0, `${f} is in front: no null reaches it`);
  });
}

for (const lesson of [C01_LESSON]) {
  describe(`${lesson.id} ${lesson.title} validates`, () => {
    it('validateLesson returns no problems', () => assert.deepEqual(validateLesson(lesson, MIC_TYPES), []));
    it('the 9 pages are present', () => assert.deepEqual(Object.keys(lesson.pages).sort(), [...PAGE_IDS].sort()));
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
    it('a mic facing the instrument points along −z (the model’s aim home)', () => assert.deepEqual(lesson.model.aimHome, { az: -90, el: 0 }));
    itemRules(lesson);
    copyIds(lesson);
  });
}

describe('C01 acoustic guitar (acoustic_guitar/GEOMETRY_PROPOSAL.md §4)', () => {
  const zone = (id: string) => C01_LESSON.zones.find((z) => z.id === id)!;
  const surf = (id: string) => C01_LESSON.model.surfaces.find((s) => s.id === id)!;
  it('one lesson, three bodies, five starting points each', () => {
    assert.deepEqual(C01_LESSON.model.variants.map((v) => v.id), ['steel', 'twelve', 'nylon']);
    for (const v of ['steel', 'twelve', 'nylon']) assert.equal(C01_LESSON.zones.filter((z) => z.requires?.variant === v).length, 5, v);
  });
  it('the 12th-fret and sound-hole starts read 15–30 cm (6–12 in); the bridge 10–20 cm (4–8 in)', () => {
    for (const v of ['steel', 'twelve', 'nylon']) {
      assert.deepEqual(zone(`fret12.${v}`).distance, { min: 152.4, max: 304.8 });
      assert.deepEqual(zone(`hole.${v}`).distance, { min: 152.4, max: 304.8 });
      assert.deepEqual(zone(`bridge.${v}`).distance, { min: 101.6, max: 203.2 });
    }
  });
  it('the 12th-fret start is read from the 12th fret on the steel bodies, and from the neck joint (the same place) on the nylon', () => {
    assert.equal(zone('fret12.steel').refSurface, 'steel.fret12');
    assert.equal(r2(surf('steel.fret12').point.x), r2(647.7 / 2));
    assert.equal(zone('fret12.nylon').refSurface, 'nylon.joint');
    assert.equal(r2(surf('nylon.joint').point.x), 325);
  });
  it('the clip start is between the sound hole and the neck joint, only for the clip mic', () => {
    for (const v of ['steel', 'twelve', 'nylon']) {
      const z = zone(`clip.${v}`);
      assert.deepEqual(z.requires?.micTypeIds, ['clipCond']);
      const g = geomOf(v === 'steel' ? STEEL_DREAD : v === 'twelve' ? TWELVE_HD : NYLON_C5);
      assert.ok(z.start.p.x > g.hole.x && z.start.p.x < g.edge, v);
    }
  });
  it('a mic at the hole zone’s start, pushed into the strumming hand, is stopped', () => {
    const z = zone('hole.steel');
    const scene = compileScene(C01_LESSON.model, 'steel');
    const body = micBodyOf(MIC_TYPES.sdcCard);
    assert.equal(checkAssembly(scene, z.start, body), null);
    const inHand: MicPose = { ...z.start, p: { ...z.start.p, x: 60, z: 80 } };
    assert.ok(checkAssembly(scene, inHand, body));
  });
});
