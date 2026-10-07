/**
 * Lab 4 (Strings) — the KEYBOARDS + HARP builder's lessons: C11 PIANO (grand,
 * baby grand, upright), C10 HARP (pedal, lever), C12 CLAVINET (the amp it
 * plays through, and the direct path). Invariants from the geometry
 * proposals (docs/labs/miking/{acoustic_piano,harp,clavinet}/) and the
 * corrections (CORRECTIONS_LOG.md C11-*, C10-*, C12-*):
 *
 *   • each lesson validates, carries the 9 pages, is registered in Lab 4 and
 *     served; its checks follow the item-writing rules; its copy names ids
 *     that exist; its context target is reachable in a null by aim, and not
 *     already in the first pattern's null at the start;
 *   • every zone's source key resolves to a SOURCES table;
 *   • the piano: the keyboard's middle at z = 0, A4 at +58.6; the longest
 *     strings the sourced lengths; every string inside the case; the Shure
 *     row 12 in / 8 in; the ORTF pair 45° down (C11-01); the curve at 45°;
 *   • the strings' physics: whole-number ratios, still points at k/n;
 *   • the harp: 1.9 m, the second hole from the bottom (C10-02), 47 / 34
 *     strings, the front zone about 60 cm from the board;
 *   • the clavinet: contra F to e''' in Hz, the null aimed TOWARD the
 *     monitor (C12-02), the rear zone only behind the open back.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { describe, it } from 'node:test';
import type { Lesson, MicPose } from '../src/screens/lab/miking/engine/model/types.ts';
import { PAGE_IDS } from '../src/screens/lab/miking/engine/model/types.ts';
import { copyOf } from '../src/screens/lab/miking/engine/model/copy.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { LESSONS } from '../src/screens/lab/miking/data/registry.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { micBodyOf, validateLesson } from '../src/screens/lab/miking/engine/model/validate.ts';
import { checkAssembly, compileScene, solidOnPath } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { polyDist2D } from '../src/screens/lab/miking/engine/geometry/sdf.ts';
import { arrivalAngle, nearNull } from '../src/screens/lab/miking/engine/physics/polar.ts';
import { gradeSetup } from '../src/screens/lab/miking/engine/progress/setupGrade.ts';
import { STRING_SHAPES, keyFreq, stillPoints, stringShare } from '../src/screens/lab/miking/engine/physics/stringModes.ts';
import { A4_Z, GRANDS, MIDDLE_Z, grandGeom } from '../src/screens/lab/miking/lessons/shared/piano/pianoSpec.ts';
import { C11_LESSON } from '../src/screens/lab/miking/lessons/c11Piano/lesson.ts';
import { C10_LESSON } from '../src/screens/lab/miking/lessons/c10Harp/lesson.ts';
import { C12_LESSON } from '../src/screens/lab/miking/lessons/c12Clavinet/lesson.ts';
import { HP, LV } from '../src/screens/lab/miking/lessons/c10Harp/model.ts';
import { CLAV_RANGE_HZ } from '../src/screens/lab/miking/lessons/c12Clavinet/ampSpec.ts';
import { assertJourneyPages } from './_mikingPages.ts';

const ALL = [C11_LESSON, C10_LESSON, C12_LESSON];
const DOCS = 'docs/labs/miking';
const FOLDER: Record<string, string[]> = {
  C11: ['acoustic_piano'],
  C10: ['harp'],
  C12: ['clavinet', 'speaker_leslie', 'electric_guitar_amp'],
};

function sourceKeys(id: string): Set<string> {
  const files = [`${DOCS}/SOURCES_SHARED.md`, ...FOLDER[id].map((f) => `${DOCS}/${f}/SOURCES.md`)];
  // The shared §0 tables (acoustic_guitar/SOURCES.md) hold the Lab 4 keys several lessons cite.
  files.push(`${DOCS}/acoustic_guitar/SOURCES.md`);
  const keys = new Set<string>();
  for (const f of files) if (existsSync(f)) for (const m of readFileSync(f, 'utf8').matchAll(/^\| ([A-Z0-9][A-Z0-9-]+) \|/gm)) keys.add(m[1]);
  return keys;
}

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
        assert.doesNotMatch(o, /Steinway|Hohner|Shure|Sennheiser|DPA|Neumann|Fender|Marshall|SM ?5[78]|e ?906/, `${s.id}: "${o}"`);
      }
  });
  it('every wrong option has its own explanation; at least three options', () => {
    for (const s of [...items, ...lesson.diagnostic]) {
      assert.ok(s.options.length >= 3, s.id);
      assert.ok(s.options.includes(s.correct), s.id);
      assert.deepEqual(Object.keys(s.why).sort(), s.options.filter((o) => o !== s.correct).sort(), `${s.id}: why keys`);
      for (const o of Object.keys(s.why)) assert.ok(s.why[o].length > 20, `${s.id}: "${o}"`);
    }
  });
  it('the quick check: six items, two per foundation, one critical (hearing, 85 dBA)', () => {
    assert.equal(lesson.diagnostic.length, 6);
    for (const p of ['instrument', 'sound', 'setting']) assert.equal(lesson.diagnostic.filter((d) => d.covers === p).length, 2, p);
    const crit = lesson.diagnostic.filter((d) => d.critical);
    assert.equal(crit.length, 1);
    assert.match(crit[0].explain, /85 dBA/);
  });
  it('each brief passes at least two setups on sound reasons; a brand reason or a missing one fails', () => {
    const REQUIRED = ['r.doc', 'r.clear', 'r.power'];
    for (const t of lesson.setupTasks) {
      const ok = t.setups.filter((s) => s.ok);
      assert.ok(ok.length >= 2, t.id);
      for (const s of ok) assert.equal(gradeSetup(t, s.id, new Set(REQUIRED)).pass, true, `${t.id}/${s.id}`);
      assert.equal(gradeSetup(t, ok[0].id, new Set([...REQUIRED, 'r.brand'])).pass, false, `${t.id} with a brand`);
      for (const r of REQUIRED) assert.equal(gradeSetup(t, ok[0].id, new Set(REQUIRED.filter((x) => x !== r))).pass, false, `${t.id} without ${r}`);
      if (/NO phantom/.test(t.brief)) for (const s of t.setups) if (s.power === 'phantom') assert.equal(s.ok, false, `${t.id}/${s.id}`);
    }
  });
  it('the setup order: seven steps, each with its own "too early" note; power before gain', () => {
    const t = lesson.orderTasks[0];
    assert.equal(t.steps.length, 7);
    for (const s of t.steps) assert.ok(s.early.length > 10, s.text);
    const at = (re: RegExp) => t.steps.findIndex((s) => re.test(s.text));
    const gain = at(/gain/i);
    assert.ok(gain > 0, 'a gain step');
    const power = at(/phantom/i);
    if (power >= 0 && !/no phantom/i.test(t.steps[power].text)) assert.ok(power < gain, 'power before gain');
  });
}

for (const lesson of ALL) {
  describe(`${lesson.id} ${lesson.title}`, () => {
    it('validateLesson returns no problems', () => assert.deepEqual(validateLesson(lesson, MIC_TYPES), []));
    it('its written pages serve the 8 journey pages', () => assertJourneyPages(lesson));
    it('registered in Lab 4 (Strings) and served', () => {
      const meta = LESSONS.find((l) => l.id === lesson.id);
      assert.ok(meta);
      assert.equal(meta.labId, 'strings');
      assert.equal(meta.status, 'ready');
      assert.equal(lessonById(lesson.id), lesson);
      assert.equal(lesson.labId, 'strings');
    });
    it('the ⓘ note: starting points from our research — experiment, trust your ears', () => {
      assert.match(lesson.accuracyDetail, /^ABOUT THESE STARTING POINTS\. After our research/);
      assert.match(lesson.accuracyDetail, /experiment/);
      assert.match(lesson.accuracyDetail, /trust your ears/);
    });
    it('every zone’s source key resolves to a SOURCES table', () => {
      const keys = sourceKeys(lesson.id);
      const missing = [...new Set(lesson.zones.map((z) => z.src))].filter((s) => !keys.has(s));
      assert.deepEqual(missing, []);
    });
    it('every zone is drawn in both views', () => {
      for (const z of lesson.zones) {
        assert.ok(z.drawn?.side, `${z.id} side`);
        assert.ok(z.drawn?.top, `${z.id} top`);
      }
    });
    itemRules(lesson);
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
      if (C.twoMic.opposite) assert.ok(lesson.model.surfaces.some((s) => s.id === C.twoMic.opposite!.surface));
    });
    it('the context target can sit in a null by aim, and is not in the first pattern’s null at the start', () => {
      const X = copyOf(lesson).context;
      const v = X.variant ?? lesson.model.defaultVariant;
      const scene = compileScene(lesson.model, v);
      const z = lesson.zones.find((q) => q.id === X.zone)!;
      const w = lesson.live.wedges.find((q) => q.id === X.target)!;
      const src = { x: w.p.x, y: w.p.y - w.lift, z: w.p.z };
      let n = 0;
      for (const p of X.patterns) {
        const body = micBodyOf(MIC_TYPES[p.typeId]);
        for (let da = -X.azMax; da <= X.azMax; da += 5)
          for (let de = -X.elMax; de <= X.elMax; de += 5) {
            const pose: MicPose = { ...z.start, az: z.start.az + da, el: z.start.el + de };
            if (checkAssembly(scene, pose, body)) continue;
            if (nearNull(p.id as 'cardioid', arrivalAngle(pose, src), 15) && !solidOnPath(scene, pose.p, src, X.shield)) n++;
          }
      }
      assert.ok(n > 0, 'reachable');
      assert.equal(nearNull(X.patterns[0].id as 'cardioid', arrivalAngle(z.start, src), 15), false, 'not at the start');
    });
    it('the hearing line: the critical item tells a mic’s limit from a person’s', () => {
      assert.ok(lesson.diagnostic.some((d) => d.critical && /distortion limit/.test(d.correct)));
      assert.ok(lesson.scenarios.some((s) => s.page === 'setting' && /85 dBA/.test(s.explain)));
    });
  });
}

describe('the ideal string (PHYS-STRING)', () => {
  it('whole-number ratios and still points at k/n', () => {
    STRING_SHAPES.forEach((s, i) => assert.equal(s.ratio, i + 1));
    assert.deepEqual(stillPoints(4), [0.25, 0.5, 0.75]);
    assert.equal(stringShare(2, 0.5), 0);
    assert.ok(stringShare(1, 0.5) > 0.999);
    assert.ok(Math.abs(stringShare(3, 0.06) - Math.abs(Math.sin(3 * Math.PI * 0.06))) < 1e-12);
  });
  it('equal temperament: A0 27.5 Hz, A4 440 Hz', () => {
    assert.ok(Math.abs(keyFreq(1) - 27.5) < 1e-9);
    assert.ok(Math.abs(keyFreq(49) - 440) < 1e-9);
  });
});

describe('C11 piano invariants', () => {
  it('the keyboard’s middle at z = 0; A4 at +58.6', () => {
    assert.ok(Math.abs(MIDDLE_Z) < 0.1);
    assert.equal(Math.round(A4_Z * 10) / 10, 58.6);
  });
  for (const id of ['B', 'S'] as const) {
    it(`grand ${id}: the longest string is the sourced length; every string inside the case`, () => {
      const g = grandGeom(id);
      assert.equal(g.strings.length, 88);
      const L = Math.max(...g.strings.map((s) => Math.hypot(s.a[0] - s.b[0], s.a[1] - s.b[1])));
      assert.ok(Math.abs(L - GRANDS[id].longest!.mm) < 2, `${L}`);
      for (const s of g.strings) {
        // Both ends inside the case; the far (bridge) end over the open interior
        // (the agraffe end sits under the pin block, in front of the opening).
        assert.ok(polyDist2D(g.outline, s.a[0], s.a[1]) < -20, `key ${s.k} a`);
        assert.ok(polyDist2D(g.outline, s.b[0], s.b[1]) < -20, `key ${s.k} b`);
        assert.ok(polyDist2D(g.inner, s.b[0], s.b[1]) <= 0, `key ${s.k} b over the opening`);
      }
      assert.ok(Math.abs(g.curve.n.x - Math.SQRT1_2) < 1e-9 && Math.abs(g.curve.n.z - Math.SQRT1_2) < 1e-9, 'the curve point faces 45°');
    });
  }
  it('Shure’s row: 12 in above the middle strings, 8 in from the hammers', () => {
    const z = C11_LESSON.zones.find((q) => q.id === 'gp.over')!;
    assert.ok(Math.abs((z.distance.min + z.distance.max) / 2 - 304.8) < 1e-6);
    assert.ok(Math.abs((z.radial!.min! + z.radial!.max!) / 2 - 203.2) < 1e-6);
  });
  it('the ORTF pair over the strings is aimed 45° down (C11-01)', () => {
    for (const id of ['gp.ortf', 'bg.ortf']) {
      const z = C11_LESSON.zones.find((q) => q.id === id)!;
      assert.match(z.band, /45°/);
      assert.equal((z.aim!.minOffAxis! + z.aim!.maxOffAxis) / 2, 45);
    }
  });
});

describe('C10 harp invariants', () => {
  it('the pedal harp stands 1.9 m; the lever harp is smaller', () => {
    assert.equal(HP.height, 1900);
    assert.ok(LV.height < HP.height);
    assert.equal(HP.strings.length, 47);
    assert.equal(LV.strings.length, 34);
  });
  it('the miniature goes at the second sound hole from the bottom (C10-02)', () => {
    for (const [id, g] of [['hp.hole', HP], ['lv.hole', LV]] as const) {
      const z = C10_LESSON.zones.find((q) => q.id === id)!;
      assert.match(z.band, /second sound hole from the bottom/);
      const surf = C10_LESSON.model.surfaces.find((s) => s.id === z.refSurface)!;
      assert.deepEqual([surf.point.x, surf.point.y], [g.holes[1].c[0], g.holes[1].c[1]]);
      assert.ok(g.holes[1].c[1] > g.holes[2].c[1], 'the second from the bottom is below the third');
    }
  });
  it('the front zone is about 60 cm (2 ft) from the soundboard', () => {
    const z = C10_LESSON.zones.find((q) => q.id === 'hp.front')!;
    assert.ok(Math.abs((z.distance.min + z.distance.max) / 2 - 609.6) < 1e-6);
  });
});

describe('C12 clavinet invariants', () => {
  it('contra F to e′′′: about 43.65 Hz to 1318.5 Hz', () => {
    assert.ok(Math.abs(keyFreq(9) - CLAV_RANGE_HZ.low) < 0.01);
    assert.ok(Math.abs(keyFreq(68) - CLAV_RANGE_HZ.high) < 0.1);
  });
  it('the null is aimed TOWARD the loudest monitor (C12-02)', () => {
    const C = copyOf(C12_LESSON);
    assert.match(C.context.prompt, /TOWARD/);
    const card = C12_LESSON.scenarios.find((s) => s.id === 'cv.ctx.1')!;
    assert.match(card.correct, /^Toward/);
    for (const s of C12_LESSON.scenarios) if (/away from the (wedge|loudest)/i.test(s.correct)) assert.fail(s.id);
  });
  it('the mechanism: a tangent and an anvil, not a hammer (C12-01)', () => {
    const text = C12_LESSON.sound.stages.map((s) => s.text).join(' ');
    assert.match(text, /tangent/);
    assert.match(text, /anvil/);
    assert.doesNotMatch(text, /hammer/i);
  });
  it('the rear zone exists only behind the open back', () => {
    const z = C12_LESSON.zones.find((q) => q.id === 'cl.rear')!;
    assert.deepEqual(z.requires?.variants, ['combo']);
  });
});

describe('Lab 4 docs', () => {
  it('the corrections log carries the C10, C11 and C12 rows', () => {
    const log = readFileSync(`${DOCS}/CORRECTIONS_LOG.md`, 'utf8');
    for (const id of ['C11-01', 'C11-D1', 'C10-02', 'C12-01', 'C12-02']) assert.ok(log.includes(`| ${id} |`), id);
  });
  it('the lesson folders exist', () => {
    for (const f of ['c10Harp', 'c11Piano', 'c12Clavinet']) assert.ok(readdirSync(`src/screens/lab/miking/lessons/${f}`).includes('lesson.ts'), f);
  });
});
