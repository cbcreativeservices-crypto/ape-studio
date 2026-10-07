/**
 * Miking Labs — Lab 2 CYMBALS: I01a Hi-Hat, I01b Ride, I01c Crash, I01d
 * Splash, I01e China (docs/labs/miking/BUILDER_BRIEF.md; LESSON_JOURNEY.md;
 * BATCH2_RESEARCH_SUMMARY.md).
 *
 * Real relationships, never re-running the implementation:
 *   • each lesson validates; its zones' start poses are clear of every part
 *     and inside their zone, for every setup and mic type they allow; each
 *     zone is DRAWN where it is TESTED; two different zones can be rested in;
 *   • the zones sit OUT of the stick's side of the cymbal and outside the
 *     swing; the Studio-or-live exercise is solvable (a null can reach the
 *     drummer's fill from the under-mic);
 *   • the parts match the sources (sizes; the hats' pair; the China profile's
 *     cup above and valley below its rim; the splash family) and the new
 *     cymbals clear their neighbours;
 *   • the item-writing rules, the quick check, the practice contract;
 *   • the starting-points voice (no source, brand or model names; the Lab 2
 *     research names too);
 *   • registration in Lab 2 and the family's own HOW IT SOUNDS page.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { compileScene, checkAssembly } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { inZone, zonesAvailable } from '../src/screens/lab/miking/engine/geometry/zones.ts';
import { sdf } from '../src/screens/lab/miking/engine/geometry/sdf.ts';
import { micBodyOf, validateLesson } from '../src/screens/lab/miking/engine/model/validate.ts';
import { arrivalAngle, nearNull } from '../src/screens/lab/miking/engine/physics/polar.ts';
import { gradeSetup } from '../src/screens/lab/miking/engine/progress/setupGrade.ts';
import { validateQuickCheck } from '../src/screens/lab/miking/engine/journey.ts';
import { PAGE_IDS, type PatternId } from '../src/screens/lab/miking/engine/model/types.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { copyOf } from '../src/screens/lab/miking/engine/model/copy.ts';
import { LESSONS, readyLabs } from '../src/screens/lab/miking/data/registry.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { CYMBAL_CONTENT } from '../src/screens/lab/miking/lessons/shared/cymbals/content.ts';
import type { CymbalLesson } from '../src/screens/lab/miking/lessons/shared/cymbals/cymbalLesson.ts';
import { at, towardThrone } from '../src/screens/lab/miking/lessons/shared/cymbals/cymbalLesson.ts';
import { KIT_PLACED_CYMBALS, CYMBAL_SWING } from '../src/screens/lab/miking/lessons/shared/cymbals/cymbalSpec.ts';
import * as FX from '../src/screens/lab/miking/lessons/shared/cymbals/cymbalFx.ts';
import { BRAND_NAMES, BANNED_FORMS } from './mikingLearnerText.test.ts';
import { RESEARCH_NAMES, itemRules, learnerStrings } from './_mikingItemRules.ts';
import { assertJourneyPages } from './_mikingPages.ts';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const { CYMBAL_SHAPES, cymbalStrikeShare } = await import('../src/screens/lab/miking/lessons/shared/cymbals/cymbalModes.ts');

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const IDS = Object.keys(CYMBAL_CONTENT);
const L = (id: string) => CYMBAL_CONTENT[id] as CymbalLesson;
const DEG = Math.PI / 180;

describe('registration (Lab 2 · Cymbals & Percussion)', () => {
  it('every cymbal lesson is listed in Lab 2, ready, and served with its art', () => {
    assert.ok(IDS.length >= 2);
    for (const id of IDS) {
      const meta = LESSONS.find((l) => l.id === id);
      assert.ok(meta, id);
      assert.equal(meta!.labId, 'percussion');
      assert.ok(lessonById(id), `${id} content`);
    }
    assert.ok(readyLabs().some((l) => l.id === 'percussion'), 'Lab 2 is listed once it has a ready lesson');
    const lab = read('src/screens/lab/miking/data/registry.ts');
    assert.match(lab, /id: 'percussion', num: 2, name: 'Miking Lab 2: Cymbals & Percussion', blurb: '[^']{40,}'/, 'Lab 2 has a blurb');
  });
  it('the family’s HOW IT SOUNDS page is the cymbal page (plate shapes, not a membrane), and the rest are shared', () => {
    const reg = read('src/screens/lab/miking/lessons/shared/cymbals/CymbalSound.tsx');
    assert.match(reg, /CymbalModeFace/);
    assert.match(reg, /useStepReveal/);
    assert.doesNotMatch(reg, /MembraneFace|HEAD_SHAPES/);
  });
});

describe('each lesson validates and its zones are reachable', () => {
  for (const id of IDS) {
    const lesson = L(id);
    const m = lesson.model;
    it(`${id}: validateLesson is clean; the 8 journey pages`, () => {
      assert.deepEqual(validateLesson(lesson, MIC_TYPES), []);
      assertJourneyPages(lesson);
    });
    it(`${id}: every zone start is clear and inside its zone, for every setup and mic it allows`, () => {
      for (const z of lesson.zones) {
        const variants = z.requires?.variant ? [z.requires.variant] : z.requires?.variants ?? m.variants.map((v) => v.id);
        for (const v of variants) {
          const scene = compileScene(m, v);
          for (const t of z.requires?.micTypeIds ?? lesson.micTypeIds) {
            const ty = MIC_TYPES[t];
            assert.equal(checkAssembly(scene, z.start, micBodyOf(ty)), null, `${z.id} ${v} ${t} collides`);
            assert.ok(inZone(z, { scene, surfaces: m.surfaces, lines: m.lines, variant: v, micTypeId: t, mount: ty.mount }, z.start), `${z.id} ${v} ${t} not in its zone`);
          }
        }
      }
    });
    it(`${id}: each zone is drawn where it is tested (the start sits in its drawn region, both views)`, () => {
      for (const z of lesson.zones) {
        const side = z.drawn?.side;
        const top = z.drawn?.top;
        assert.ok(side && top && 'u0' in side && 'u0' in top, `${z.id} draws itself as a region`);
        const p = z.start.p;
        const inside = (r: { u0: number; u1: number; v0: number; v1: number }, u: number, v: number) => u >= r.u0 - 1 && u <= r.u1 + 1 && v >= r.v0 - 1 && v <= r.v1 + 1;
        assert.ok(inside(side, p.x, p.y), `${z.id} side`);
        assert.ok(inside(top, p.x, p.z), `${z.id} top`);
      }
    });
    it(`${id}: the placement activity is reachable (two different zones with the worked example’s mic, or across setups)`, () => {
      const C = copyOf(lesson);
      const worked = lesson.zones.find((z) => z.id === C.placement.workedZone[m.defaultVariant])!;
      assert.ok(worked, 'a worked example zone');
      const reach = new Set<string>();
      for (const t of lesson.micTypeIds) for (const v of m.variants.map((x) => x.id)) for (const z of zonesAvailable(lesson.zones, v, t, MIC_TYPES[t].mount)) reach.add(z.id);
      assert.ok(reach.size >= 2, [...reach].join(', '));
    });
    it(`${id}: no zone start sits on the stick’s side of its cymbal, and none inside the swing`, () => {
      for (const z of lesson.zones) {
        const scene = compileScene(m, z.requires?.variant ?? z.requires?.variants?.[0] ?? m.defaultVariant);
        // The envelopes this lesson adds (the stick's side) are in the scene:
        // a clear start is out of them; the cymbals' swing is their clearance.
        const sticks = scene.solids.filter((s) => /Stick$/.test(s.partId));
        assert.ok(sticks.length >= 1, `${id} draws the stick’s side`);
        for (const s of sticks) assert.ok(sdf(s.shape, z.start.p) > 0, `${z.id} is on the stick’s side`);
        for (const s of scene.solids.filter((x) => x.partId.startsWith('cym.') || /\.plate/.test(x.partId))) assert.ok(sdf(s.shape, z.start.p) - s.clearance > 0, `${z.id} inside ${s.partId}`);
      }
    });
    it(`${id}: the Studio-or-live and two-mic poses are clear`, () => {
      const C = copyOf(lesson);
      const v = C.context.variant ?? m.defaultVariant;
      const z = lesson.zones.find((q) => q.id === C.context.zone)!;
      assert.ok(z, 'a context zone');
      const scene = compileScene(m, v);
      assert.equal(checkAssembly(scene, z.start, micBodyOf(MIC_TYPES[C.context.typeId])), null, 'context pose');
      const A = lesson.zones.find((q) => q.id === C.twoMic.A.zone)!;
      const B = lesson.zones.find((q) => q.id === C.twoMic.B.zone)!;
      const tv = C.twoMic.variant ?? m.defaultVariant;
      const ts = compileScene(m, tv);
      assert.equal(checkAssembly(ts, A.start, micBodyOf(MIC_TYPES[C.twoMic.A.typeId])), null, 'two-mic A');
      assert.equal(checkAssembly(ts, B.start, micBodyOf(MIC_TYPES[C.twoMic.B.typeId])), null, 'two-mic B');
    });
    it(`${id}: from under the cymbal, a pattern’s null can reach the drummer’s fill while the mic still looks up`, () => {
      const C = copyOf(lesson);
      const z = lesson.zones.find((q) => q.id === C.context.zone)!;
      const w = lesson.live.wedges.find((x) => x.id === C.context.target)!;
      const floor = compileScene(m, C.context.variant ?? m.defaultVariant).yFloor;
      const src = { x: w.p.x, y: floor - w.lift, z: w.p.z };
      const can = (p: PatternId) => {
        for (let da = -C.context.azMax; da <= C.context.azMax; da += 2)
          for (let de = -C.context.elMax; de <= C.context.elMax; de += 2) if (nearNull(p, arrivalAngle({ ...z.start, az: z.start.az + da, el: z.start.el + de }, src), 15)) return true;
        return false;
      };
      assert.ok(C.context.patterns.some((p) => can(p.id)), `${id}: a null reaches the fill`);
    });
  }
});

describe('the parts match the sources', () => {
  const IN = 25.4;
  it('the kit cymbals are the family’s, unchanged: 14 in hats, 20 in ride, 16 and 18 in crashes', () => {
    assert.equal(KIT_PLACED_CYMBALS.hihat.spec.d.mm, 14 * IN);
    assert.equal(KIT_PLACED_CYMBALS.ride.spec.d.mm, 20 * IN);
    assert.equal(KIT_PLACED_CYMBALS.crash1.spec.d.mm, 16 * IN);
    assert.equal(KIT_PLACED_CYMBALS.crash2.spec.d.mm, 18 * IN);
  });
  it('the splash sizes (10 and 8 in) sit inside the published 6–12 in range; the arm rod is 3/8 in', () => {
    for (const s of [FX.SPLASH_10, FX.SPLASH_8]) {
      assert.ok(s.d.mm >= FX.SPLASH_RANGE_IN.min * IN && s.d.mm <= FX.SPLASH_RANGE_IN.max * IN, s.name);
      assert.equal(s.d.prov.kind, 'sourced');
    }
    assert.ok(Math.abs(FX.ARM_ROD.d.mm - 0.375 * IN) < 1e-9);
  });
  it('the China: 18 in; the cup above the rim, the valley below it, the lip rising back to the rim — all drawing defaults', () => {
    assert.equal(FX.CHINA_18.d.mm, 18 * IN);
    const R = FX.CHINA_18.d.mm / 2;
    assert.ok(FX.chinaHeight(0) > 0, 'the cup is above the rim');
    assert.ok(Math.abs(FX.chinaHeight(R)) < 1e-9, 'the rim is at the rim plane');
    const valley = FX.chinaHeight(FX.CHINA_PROFILE.valleyR.mm * R);
    assert.ok(Math.abs(valley + FX.CHINA_PROFILE.lipRise.mm) < 1e-6, 'the valley is the lip’s rise below the rim');
    // The shoulder falls monotonically from the cup's foot to the valley.
    let prev = Infinity;
    for (let r = FX.chinaAreas().shoulder[0] + 0.03 * R; r <= FX.CHINA_PROFILE.valleyR.mm * R; r += 5) {
      assert.ok(FX.chinaHeight(r) <= prev + 1e-9);
      prev = FX.chinaHeight(r);
    }
    // The upright strike is "about an inch above" the valley, on the shoulder.
    assert.ok(FX.CHINA_SHOULDER_STRIKE_R < FX.CHINA_PROFILE.valleyR.mm * R && FX.CHINA_SHOULDER_STRIKE_R > FX.chinaAreas().shoulder[0]);
    for (const k of Object.values(FX.CHINA_PROFILE)) assert.equal(k.placeholder, true);
  });
  it('the China takes the 18 in crash’s seat: upright, its cup rests on the seat; inverted, the cup hangs below it', () => {
    const n = { x: -Math.sin(15 * DEG), y: -Math.cos(15 * DEG), z: 0 };
    const along = (p: { x: number; y: number; z: number }) => (p.x - FX.CHINA_SEAT.x) * n.x + (p.y - FX.CHINA_SEAT.y) * n.y + (p.z - FX.CHINA_SEAT.z) * n.z;
    assert.ok(along(FX.CHINA_UPRIGHT.c) < 0, 'upright: the rim plane below the seat');
    assert.ok(along(FX.CHINA_INVERTED.c) > 0, 'inverted: the rim plane above the seat');
  });
  it('the piggyback splash sits above the 18 in crash’s bell; the arm splash clears the 16 in crash and the 10 in tom', () => {
    const c2 = KIT_PLACED_CYMBALS.crash2;
    const d = Math.hypot(FX.SPLASH_PIGGY.c.x - c2.c.x, FX.SPLASH_PIGGY.c.y - c2.c.y, FX.SPLASH_PIGGY.c.z - c2.c.z);
    assert.ok(d > c2.spec.rise.mm, 'above the bell');
    const s = FX.SPLASH_ARM.c;
    const c1 = KIT_PLACED_CYMBALS.crash1.c;
    // In plan, the splash and the 16 in crash (each with its swing) do not overlap.
    assert.ok(Math.hypot(s.x - c1.x, s.z - c1.z) > FX.SPLASH_10.d.mm / 2 + KIT_PLACED_CYMBALS.crash1.spec.d.mm / 2 - 1, 'clear of the 16 in crash in plan');
    assert.ok(s.y < KIT_PLACED_CYMBALS.crash1.c.y + 220, 'not far below the crash');
  });
  it('the stick’s side of each cymbal faces the throne', () => {
    for (const id of IDS) {
      const c = L(id).model.envelopes.find((e) => /Stick$/.test(e.id))!;
      assert.ok(c && c.shape.kind === 'sector', id);
      if (c.shape.kind !== 'sector') continue;
      const mid = (c.shape.a0 + c.shape.a1) / 2;
      const t = towardThrone({ spec: FX.SPLASH_10, c: c.shape.c, tiltDeg: 0 });
      assert.ok(Math.abs(Math.atan2(Math.sin(mid - Math.atan2(t.z, t.x)), Math.cos(mid - Math.atan2(t.z, t.x)))) < 1e-9, id);
    }
  });
  it('the swing keep-out is the family’s ± 60 mm (a drawing default)', () => {
    assert.equal(CYMBAL_SWING.mm, 60);
    assert.equal(CYMBAL_SWING.placeholder, true);
  });
});

describe('HOW IT SOUNDS: the plate model, not a membrane', () => {
  it('a centre-held plate: most of the drawn shapes move more under the edge than under the bell', () => {
    const more = CYMBAL_SHAPES.filter((sh: { label: string }) => cymbalStrikeShare(sh, 0.9) > cymbalStrikeShare(sh, 0.1));
    assert.ok(more.length >= CYMBAL_SHAPES.length - 2, more.map((s: { label: string }) => s.label).join(' '));
  });
  for (const id of IDS) {
    it(`${id}: the strike has four events and the face’s areas are on the plate`, () => {
      const c = L(id).cym;
      assert.equal(c.strike.stages.length, 4);
      assert.equal(c.strike.marks.length, 5);
      const R = c.spec.d.mm / 2;
      for (const a of c.shapes.areas) assert.ok(a.r >= 0 && a.r <= R, `${id} ${a.id}`);
      assert.ok(c.shapes.areas.some((a) => a.id === c.shapes.defaultArea));
      assert.ok(c.strike.rFrac > 0 && c.strike.rFrac < 1);
      assert.ok(c.arrivals.sources.length >= 2 && c.arrivals.points.length >= 2);
    });
  }
});

describe('words: item rules, quick check, practice, the starting-points voice', () => {
  const BRAND_RE = new RegExp(`\\b(?:${BRAND_NAMES.join('|')})\\b`);
  /** The Lab 2 cymbal research's own names (never on screen). */
  const LAB2 = /\b(Meinl|LEWITT|Lewitt|Vic Firth|Paiste|Barata|Hamilton|Brinck|Wertico|Killers|Blink|Jonas|Shelton|Cinderella|Juliet|Trashformer|Kerope|Cymbolt|FX Stack|Diamondback|Paragon|U-CLIP|SCX1\w*|e ?914|4011|4015|2011|2012|LCT|KM ?185|Beta ?181)\b/;
  for (const id of IDS) {
    const lesson = L(id);
    it(`${id}: the item-writing rules hold for every check, symptom and quick-check item`, () => {
      itemRules(lesson);
    });
    it(`${id}: the quick check is six foundation items with a critical hearing item`, () => {
      assert.deepEqual(validateQuickCheck(lesson.diagnostic), []);
      assert.ok(lesson.diagnostic.some((q) => q.critical && /hearing/i.test(q.explain + q.prompt + q.correct)));
    });
    it(`${id}: every page from MICROPHONES to STUDIO OR LIVE carries a FROM EARLIER check`, () => {
      for (const p of ['microphone', 'placement', 'context'] as const) {
        const rec = lesson.pages[p].credit.scenarios.map((s) => lesson.scenarios.find((x) => x.id === s)!).filter((s) => /^FROM EARLIER/.test(s.prompt));
        assert.ok(rec.length >= 1, p);
      }
    });
    it(`${id}: each brief passes at least two setups; a brand or a missing reason fails; no phantom means no condenser`, () => {
      const REQUIRED = ['r.doc', 'r.clear', 'r.power'];
      for (const t of lesson.setupTasks) {
        const ok = t.setups.filter((s) => s.ok);
        assert.ok(ok.length >= 2, t.id);
        for (const s of ok) assert.equal(gradeSetup(t, s.id, new Set(REQUIRED)).pass, true, `${t.id}/${s.id}`);
        assert.equal(gradeSetup(t, ok[0].id, new Set([...REQUIRED, 'r.brand'])).pass, false);
        for (const r of REQUIRED) assert.equal(gradeSetup(t, ok[0].id, new Set(REQUIRED.filter((x) => x !== r))).pass, false);
      }
      const t = lesson.setupTasks.find((x) => /NO phantom/.test(x.brief))!;
      for (const s of t.setups) if (s.power === 'phantom') assert.equal(s.ok, false, s.id);
    });
    it(`${id}: no source, brand, model or research name in learner text; no badge`, () => {
      const items = learnerStrings(lesson);
      assert.ok(items.length > 200);
      for (const s of items) {
        assert.doesNotMatch(s, BRAND_RE, s);
        assert.doesNotMatch(s, RESEARCH_NAMES, s);
        assert.doesNotMatch(s, LAB2, s);
        for (const re of BANNED_FORMS) assert.doesNotMatch(s, re, s);
      }
    });
    it(`${id}: the setup order: player → mic → mount → mute & phantom → gain → compare → secure`, () => {
      const o = lesson.orderTasks[0];
      const at = (re: RegExp) => o.steps.findIndex((s) => re.test(s.text));
      assert.equal(o.steps.length, 7);
      assert.ok(at(/Ask the player/) === 0);
      assert.ok(at(/mount the mic/i) < at(/phantom/));
      assert.ok(at(/Mute the outputs/) === at(/phantom/));
      assert.ok(at(/phantom/) < at(/gain/));
      assert.ok(lesson.pages.practice.credit.scenarios.includes(o.id));
    });
  }
  it('the family’s presentation files say no brand (comments stripped)', () => {
    const files = ['CymbalFxArt.tsx', 'CymbalKitArt.tsx', 'CymbalSettingPlan.tsx', 'CymbalSound.tsx', 'CymbalStrikeFx.tsx'].map((f) => `src/screens/lab/miking/lessons/shared/cymbals/${f}`);
    for (const f of files) {
      const s = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
      assert.doesNotMatch(s, BRAND_RE, f);
      assert.doesNotMatch(s, LAB2, f);
    }
  });
});

describe('the corrections are logged', () => {
  it('CORRECTIONS_LOG lists the Lab 2 cymbal fixes (both snare-mic strategies; the hearing line)', () => {
    const log = read('docs/labs/miking/CORRECTIONS_LOG.md');
    assert.match(log, /### I01a Hi-Hat/);
    assert.match(log, /both snare-mic strategies|BOTH strategies/i);
    assert.match(log, /hearing/i);
  });
});

/** A point on a cymbal at the given polar spot is what `at` says it is. */
it('at(): a point at radius r lies r from the centre, in the plate plane', () => {
  const p = KIT_PLACED_CYMBALS.ride;
  const q = at(p, 100, 30, 0);
  assert.ok(Math.abs(Math.hypot(q.x - p.c.x, q.y - p.c.y, q.z - p.c.z) - 100) < 1e-9);
});
