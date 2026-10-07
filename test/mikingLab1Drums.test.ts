/**
 * Lab 1 (Drums) — the shared 5-piece kit, M02 SNARE and M03 RACK AND FLOOR
 * TOMS (blueprint §11; docs/labs/miking/{kit,snare,toms}/GEOMETRY_PROPOSAL.md
 * §6/§8 invariant tests):
 *
 *   • the kit plan: the proposal's plan distances, heights inside the stand
 *     ranges, every rack tom above the kick;
 *   • each lesson validates, carries the 9 pages, and its checks follow the
 *     item-writing rules (no length cue, no absolute-word giveaway, a why for
 *     every wrong option, no brand recall);
 *   • its copy names ids that exist (zones, wedges, practice cards);
 *   • the snare: 10 rods 36° apart, the wires on the snare-side head, the
 *     clip zone's 30–60° aim, the hi-hat reachable by a supercardioid's null
 *     and not by a cardioid's;
 *   • the toms: rods equally spaced (8 on the floor tom), the inside zone
 *     only with the bottom head off, the rim condenser refusing an axis
 *     parallel to the head, the crash reachable by the null, readouts read
 *     from the chosen head's own edge.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Lesson, MicPose } from '../src/screens/lab/miking/engine/model/types.ts';
import { PAGE_IDS, lineFor } from '../src/screens/lab/miking/engine/model/types.ts';
import { copyOf } from '../src/screens/lab/miking/engine/model/copy.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { LESSONS } from '../src/screens/lab/miking/data/registry.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { micBodyOf, validateLesson } from '../src/screens/lab/miking/engine/model/validate.ts';
import { checkAssembly, compileScene, solidOnPath } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { inZone } from '../src/screens/lab/miking/engine/geometry/zones.ts';
import { arrivalAngle, nearNull } from '../src/screens/lab/miking/engine/physics/polar.ts';
import { gradeSetup } from '../src/screens/lab/miking/engine/progress/setupGrade.ts';
import { M01_LESSON } from '../src/screens/lab/miking/lessons/m01Kick/lesson.ts';
import { M02_LESSON } from '../src/screens/lab/miking/lessons/m02Snare/lesson.ts';
import { M03_LESSON } from '../src/screens/lab/miking/lessons/m03Toms/lesson.ts';
import { DEPTH, H_UP, SNARE_ZONES } from '../src/screens/lab/miking/lessons/m02Snare/model.ts';
import { WIRE_Y } from '../src/screens/lab/miking/lessons/m02Snare/geometry.ts';
import { FLOOR_16x16, SNARE_14x55, TOM_10x7, TOM_12x8, lowestHeight, rodAngles } from '../src/screens/lab/miking/lessons/shared/drums/drumSpec.ts';
import { KIT, KIT_CYMBALS, KIT_DRUMS, KIT_FLOOR_Y } from '../src/screens/lab/miking/lessons/shared/kitPlanModel.ts';
import { assertJourneyPages } from './_mikingPages.ts';

const plan = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.round(Math.hypot(a.x - b.x, a.z - b.z) * 10) / 10;
const heightOf = (y: number) => KIT_FLOOR_Y - y;

describe('the shared 5-piece kit (kit/GEOMETRY_PROPOSAL.md §2, §6)', () => {
  it('the plan distances the proposal states', () => {
    assert.equal(plan(KIT_CYMBALS.crash1.c, KIT_CYMBALS.hihat.c), 400.2);
    assert.equal(plan(KIT_CYMBALS.crash1.c, KIT_DRUMS.tom1.c), 350);
    assert.equal(plan(KIT_CYMBALS.crash2.c, KIT_DRUMS.tom2.c), 335.3);
    assert.equal(plan(KIT_CYMBALS.ride.c, KIT_DRUMS.floor.c), 382.1);
  });
  it('the hi-hat and the cymbals sit inside the stand ranges', () => {
    const hh = heightOf(KIT_CYMBALS.hihat.c.y);
    assert.ok(hh >= 800 && hh <= 920, `hi-hat ${hh}`);
    for (const id of ['crash1', 'crash2', 'ride'] as const) {
      const h = heightOf(KIT_CYMBALS[id].c.y);
      assert.ok(h >= 940 && h <= 1750, `${id} ${h}`);
    }
  });
  it('no two cymbal discs overlap in plan where they share a height band', () => {
    const ids = Object.keys(KIT_CYMBALS) as (keyof typeof KIT_CYMBALS)[];
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) {
        const a = KIT_CYMBALS[ids[i]];
        const b = KIT_CYMBALS[ids[j]];
        if (Math.abs(a.c.y - b.c.y) > 120) continue;
        assert.ok(plan(a.c, b.c) > (a.d + b.d) / 2, `${a.id} / ${b.id}`);
      }
  });
  it('every rack tom’s lowest point clears the kick’s top (569.8 mm); the 12 in at 614.3', () => {
    const kickTop = KIT_FLOOR_Y + KIT.kick.R;
    assert.equal(Math.round(kickTop * 10) / 10, 569.8);
    for (const id of ['tom1', 'tom2'] as const) assert.ok(lowestHeight(KIT_DRUMS[id], KIT_FLOOR_Y) > kickTop, id);
    assert.equal(Math.round(lowestHeight(KIT_DRUMS.tom2, KIT_FLOOR_Y) * 10) / 10, 614.3);
  });
  it('the drums are the sourced sizes', () => {
    assert.equal(Math.round(SNARE_14x55.d.mm * 10) / 10, 355.6);
    assert.equal(Math.round(TOM_10x7.d.mm * 10) / 10, 254);
    assert.equal(Math.round(TOM_12x8.d.mm * 10) / 10, 304.8);
    assert.equal(Math.round(FLOOR_16x16.d.mm * 10) / 10, 406.4);
    assert.equal(KIT_DRUMS.tom1.spec, TOM_10x7);
    assert.equal(KIT_DRUMS.floor.spec, FLOOR_16x16);
  });
});

/** The rules every check follows (cognitive C1, M2; the kick's review fixes). */
function itemRules(lesson: Lesson) {
  const items = [...lesson.scenarios, ...lesson.symptoms];
  it('no length cue: the correct option ≤ 1.6× the mean of the others', () => {
    for (const s of [...items, ...lesson.diagnostic]) {
      const others = s.options.filter((o) => o !== s.correct);
      const mean = others.reduce((a, o) => a + o.length, 0) / others.length;
      assert.ok(s.correct.length <= 1.6 * mean, `${s.id}: ${s.correct.length} vs mean ${mean.toFixed(1)}`);
    }
  });
  it('the correct option is the longest in at most a quarter of the checks (quick check included, review Lab 1 M1)', () => {
    const longest = [...items, ...lesson.diagnostic].filter((s) => s.options.every((o) => o === s.correct || o.length < s.correct.length)).length;
    assert.ok(longest <= (items.length + lesson.diagnostic.length) / 4, `correct is the longest in ${longest} of ${items.length + lesson.diagnostic.length}`);
  });
  it('wrong options carry no absolute-word giveaway, and no option recalls a model', () => {
    for (const s of [...items, ...lesson.diagnostic])
      for (const o of s.options) {
        if (o !== s.correct) assert.doesNotMatch(o, /\b(always|any|never|every)\b/i, `${s.id}: "${o}"`);
        assert.doesNotMatch(o, /Beta ?\d|SM ?57|e ?90\d|DM ?20|D112|Shure|Sennheiser|AKG|Audix|DPA/, `${s.id}: "${o}"`);
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
  it('the setup order has seven steps, each with its own "too early" note', () => {
    const t = lesson.orderTasks[0];
    assert.equal(t.steps.length, 7);
    for (const s of t.steps) assert.ok(s.early.length > 10, s.text);
    const at = (re: RegExp) => t.steps.findIndex((s) => re.test(s.text));
    assert.ok(at(/phantom/i) < at(/input gain/i), 'power before gain');
    assert.ok(at(/input gain/i) < at(/Secure/), 'gain before securing');
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
  it('the context target sits in a supercardioid’s null by aim alone — never a cardioid’s — and not at the start', () => {
    const X = copyOf(lesson).context;
    const v = X.variant ?? lesson.model.defaultVariant;
    const scene = compileScene(lesson.model, v);
    const z = lesson.zones.find((q) => q.id === X.zone)!;
    const w = lesson.live.wedges.find((q) => q.id === X.target)!;
    const src = { x: w.p.x, y: w.p.y - w.lift, z: w.p.z };
    const reach = (pat: 'cardioid' | 'supercardioid') => {
      const body = micBodyOf(MIC_TYPES[X.patterns.find((p) => p.id === pat)!.typeId]);
      let n = 0;
      for (let da = -X.azMax; da <= X.azMax; da += 5)
        for (let de = -X.elMax; de <= X.elMax; de += 5) {
          const pose: MicPose = { ...z.start, az: z.start.az + da, el: z.start.el + de };
          if (checkAssembly(scene, pose, body)) continue;
          if (nearNull(pat, arrivalAngle(pose, src), 15) && !solidOnPath(scene, pose.p, src, X.shield)) n++;
        }
      return n;
    };
    assert.ok(reach('supercardioid') > 0, 'supercardioid');
    assert.equal(reach('cardioid'), 0, 'cardioid');
    assert.equal(nearNull('supercardioid', arrivalAngle(z.start, src), 15), false, 'the start is not already in the null');
  });
}

for (const lesson of [M02_LESSON, M03_LESSON]) {
  describe(`${lesson.id} ${lesson.title} validates`, () => {
    it('validateLesson returns no problems', () => assert.deepEqual(validateLesson(lesson, MIC_TYPES), []));
    it('its written pages serve the 8 journey pages', () => assertJourneyPages(lesson));
    it('it is registered in Lab 1 after the kick, and served', () => {
      const lab1 = LESSONS.filter((l) => l.labId === 'drums').map((l) => l.id);
      assert.deepEqual(lab1.slice(0, 3), ['M01', 'M02', 'M03']);
      assert.equal(lessonById(lesson.id), lesson);
    });
    it('the ⓘ note: starting points from our research — experiment, trust your ears', () => {
      assert.match(lesson.accuracyDetail, /^ABOUT THESE STARTING POINTS\. After our research/);
      assert.match(lesson.accuracyDetail, /experiment/);
      assert.match(lesson.accuracyDetail, /trust your ears/);
    });
    itemRules(lesson);
    copyIds(lesson);
  });
}

describe('M02 snare (snare/GEOMETRY_PROPOSAL.md §8)', () => {
  const zone = (id: string) => M02_LESSON.zones.find((z) => z.id === id)!;
  it('10 rods per head, 36° apart', () => {
    const a = rodAngles(SNARE_14x55);
    assert.equal(a.length, 10);
    for (let k = 1; k < 10; k++) assert.equal(Math.round((a[k] - a[k - 1]) * 1e9) / 1e9, 36);
  });
  it('the wires lie on the snare-side head, not the batter — and drop off it when released', () => {
    assert.ok(WIRE_Y.on > DEPTH && WIRE_Y.on - DEPTH < 10);
    assert.ok(WIRE_Y.off > WIRE_Y.on);
  });
  it('the top zones read 2.5–7.5 cm; the clamp zone 3–5 cm at 30–60° from straight-on', () => {
    assert.deepEqual(zone('top.close').distance, { min: 25, max: 75 });
    assert.deepEqual(zone('top.clip').distance, { min: 30, max: 50 });
    assert.equal(zone('top.clip').aim!.minOffAxis, 30);
    assert.equal(zone('top.clip').aim!.maxOffAxis, 60);
  });
  it('the bottom zones are measured from the snare-side head', () => {
    for (const id of ['bottom', 'bottom.clip']) assert.equal(zone(id).refSurface, 'snareSide');
  });
});

describe('M03 toms (toms/GEOMETRY_PROPOSAL.md §8)', () => {
  const m = M03_LESSON.model;
  const zone = (id: string) => M03_LESSON.zones.find((z) => z.id === id)!;
  it('the floor tom has 8 rods; every tom’s rods are equally spaced', () => {
    assert.equal(rodAngles(FLOOR_16x16).length, 8);
    for (const s of [TOM_10x7, TOM_12x8, FLOOR_16x16]) {
      const a = rodAngles(s);
      for (let k = 1; k < a.length; k++) assert.ok(Math.abs(a[k] - a[k - 1] - 360 / a.length) < 1e-9, s.id);
    }
  });
  it('the inside zone is offered only with the bottom head off — the head blocks it otherwise', () => {
    const z = zone('floor.inside');
    assert.deepEqual(z.requires?.variants, ['open']);
    const body = micBodyOf(MIC_TYPES[z.requires!.micTypeIds![0]]);
    assert.equal(checkAssembly(compileScene(m, 'open'), z.start, body), null);
    assert.notEqual(checkAssembly(compileScene(m, 'floor'), z.start, body), null);
  });
  it('the rim condenser zone refuses an axis parallel to the head', () => {
    const z = zone('tom2.cond');
    const scene = compileScene(m, 'rack');
    const ctx = { scene, surfaces: m.surfaces, lines: m.lines, variant: 'rack', micTypeId: 'rimCondenser', mount: MIC_TYPES.rimCondenser.mount };
    assert.equal(inZone(z, ctx, z.start), true);
    // Turn the same mic until its axis lies in the head's plane (15° tilt: el = −15° along x).
    const parallel: MicPose = { ...z.start, az: 0, el: 15 };
    assert.equal(inZone(z, ctx, parallel), false);
  });
  it('readouts measure from the chosen head’s own edge (several drums in one scene)', () => {
    assert.equal(lineFor(m, 'rack', 'tom1'), 'tom1Edge');
    assert.equal(lineFor(m, 'rack', 'tom2'), 'tom2Edge');
    assert.equal(lineFor(m, 'floor', 'floorReso'), 'floorEdge');
    assert.equal(lineFor(M01_LESSON.model, M01_LESSON.model.defaultVariant, 'anything'), M01_LESSON.model.lines[0].id, 'the kick keeps its first line');
  });
  it('the bottom mic is measured from the floor tom’s bottom head, which exists only with both heads on', () => {
    assert.equal(zone('floor.bottom').refSurface, 'floorReso');
    assert.deepEqual(m.surfaces.find((s) => s.id === 'floorReso')!.variants, ['floor']);
  });
});

describe('review Lab 1 C1: the snare reference-surface check holds in the lab’s own model', () => {
  it('5 cm above the head is inside the rim band (the hoop stands H_UP above the head); 2 cm would not be', () => {
    const z = SNARE_ZONES.find((x) => x.id === 'top.close')!;
    assert.equal(z.refSurface, 'rim');
    const aboveRim = (aboveHeadMm: number) => aboveHeadMm - H_UP;
    const inBand = (mm: number) => mm >= z.distance.min && mm <= z.distance.max;
    assert.ok(inBand(aboveRim(50)), `${aboveRim(50)} mm above the rim`);
    assert.ok(!inBand(aboveRim(20)), `${aboveRim(20)} mm above the rim`);
    const item = M02_LESSON.scenarios.find((s) => s.id === 'sn.place.1')!;
    assert.match(item.prompt, /5 cm above the batter HEAD/);
    assert.match(item.prompt, /about 1 cm above the head/);
    assert.equal(Math.round(H_UP / 10), 1, 'the prompt’s “about 1 cm” is the drawn hoop step');
    assert.match(item.correct, /^Yes — .*about 4 cm/);
  });
});
