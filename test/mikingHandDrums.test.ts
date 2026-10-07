/**
 * Miking Labs — Lab 1 HAND DRUMS: M04a Congas, M04b Bongos, M04c Timbales,
 * M05 Djembe (docs/labs/miking/BUILDER_BRIEF.md; LESSON_JOURNEY.md).
 *
 * Real relationships, never re-running the implementation:
 *   • each lesson validates; its zones' start poses are clear of every part
 *     and inside their zone, for every setup and mic type they allow; each
 *     zone is DRAWN where it is TESTED (the start sits in its drawn region);
 *   • the parts match the sources (sizes, counts, single heads, open ends);
 *   • the frustum solid and its outline agree; the clip mount's reach;
 *   • the Studio-or-live exercise is solvable by an off-axis null and NOT by
 *     a cardioid aimed at the drum (the lesson's point);
 *   • the item-writing rules, the quick check, the practice contract;
 *   • the starting-points voice: no source, brand or model in learner text;
 *   • every src key resolves to the lesson's SOURCES file; the corrections
 *     log lists the fixes; registration after the kit drums.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { compileScene, checkAssembly, assembly } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { inZone, zonesAvailable } from '../src/screens/lab/miking/engine/geometry/zones.ts';
import { sdf } from '../src/screens/lab/miking/engine/geometry/sdf.ts';
import { frustumOutline } from '../src/screens/lab/miking/engine/geometry/outline.ts';
import { aimVec, angleBetween } from '../src/screens/lab/miking/engine/geometry/vec.ts';
import { micBodyOf, validateLesson } from '../src/screens/lab/miking/engine/model/validate.ts';
import { arrivalAngle, nearNull, gainDb } from '../src/screens/lab/miking/engine/physics/polar.ts';
import { gradeSetup } from '../src/screens/lab/miking/engine/progress/setupGrade.ts';
import { validateQuickCheck } from '../src/screens/lab/miking/engine/journey.ts';
import { PAGE_IDS, type PatternId, type Shape3 } from '../src/screens/lab/miking/engine/model/types.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { copyOf } from '../src/screens/lab/miking/engine/model/copy.ts';
import { LESSONS } from '../src/screens/lab/miking/data/registry.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { HAND_DRUM_CONTENT } from '../src/screens/lab/miking/lessons/shared/handdrums/content.ts';
import type { HandLesson } from '../src/screens/lab/miking/lessons/shared/handdrums/family.ts';
import { CONGA, TUMBA, CONGA_ZONES } from '../src/screens/lab/miking/lessons/m04aCongas/model.ts';
import { MACHO, HEMBRA } from '../src/screens/lab/miking/lessons/m04bBongos/model.ts';
import { SMALL, LARGE } from '../src/screens/lab/miking/lessons/m04cTimbales/model.ts';
import { DJEMBE, DIAG_N, COP_DIST, HEAD_Y as DJ_HEAD } from '../src/screens/lab/miking/lessons/m05Djembe/model.ts';
import { BRAND_NAMES, BANNED_FORMS } from './mikingLearnerText.test.ts';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import { assertJourneyPages } from './_mikingPages.ts';

// The membrane physics imports the Cymatics tables without an extension (the
// app's bundler style): resolve those for node, then load it dynamically.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const { HEAD_SHAPES } = await import('../src/screens/lab/miking/engine/physics/membrane.ts');
const { strokeShares } = await import('../src/screens/lab/miking/lessons/shared/handdrums/strokes.ts');

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const LESSON_IDS = ['M04a', 'M04b', 'M04c', 'M05'] as const;
const L = (id: string) => HAND_DRUM_CONTENT[id] as HandLesson;
const FOLDER: Record<string, string> = { M04a: 'congas', M04b: 'bongos', M04c: 'timbales', M05: 'djembe' };

describe('registration (Lab 1, after the kit drums)', () => {
  it('the four lessons are listed in Drums, after every kit lesson, and served', () => {
    const ids = LESSONS.map((l) => l.id);
    for (const id of LESSON_IDS) {
      assert.ok(ids.includes(id), id);
      assert.equal(LESSONS.find((l) => l.id === id)!.labId, 'drums');
      assert.ok(lessonById(id), `${id} content`);
    }
    const firstHand = Math.min(...LESSON_IDS.map((id) => ids.indexOf(id)));
    assert.ok(ids.indexOf('M01') < firstHand, 'the kick comes first');
    // Lab 1 order (lead, 2026-10-05): kit drums (M01–M03, M09–M11), then the
    // hand drums together and in order, then the later groups (SPK, M12, M13 …).
    for (const kit of ['M01', 'M02', 'M03', 'M09', 'M10', 'M11']) {
      if (ids.includes(kit)) assert.ok(ids.indexOf(kit) < firstHand, `${kit} comes before the hand drums`);
    }
    assert.deepEqual(ids.slice(firstHand, firstHand + LESSON_IDS.length), [...LESSON_IDS], 'the hand drums sit together, in order');
  });
});

describe('each lesson validates and its zones are reachable', () => {
  for (const id of LESSON_IDS) {
    const lesson = L(id);
    const m = lesson.model;
    it(`${id}: validateLesson is clean; the 8 journey pages; every page credit exists`, () => {
      assert.deepEqual(validateLesson(lesson, MIC_TYPES), []);
      assertJourneyPages(lesson);
    });
    it(`${id}: every zone start is clear and inside its zone, for every setup and mic it allows`, () => {
      for (const z of lesson.zones) {
        const variants = z.requires?.variant ? [z.requires.variant] : m.variants.map((v) => v.id);
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
    it(`${id}: each zone is drawn where it is tested (the start sits inside its drawn region, both views)`, () => {
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
    it(`${id}: with the default mic, two different zones can be rested in (the placement activity is reachable)`, () => {
      const typeId = lesson.zones.find((z) => z.id === lesson.hand.worked.default)!.requires!.micTypeIds![0];
      const reach = new Set<string>();
      for (const v of m.variants.map((x) => x.id)) for (const z of zonesAvailable(lesson.zones, v, typeId, MIC_TYPES[typeId].mount)) reach.add(z.id);
      assert.ok(reach.size >= 2, `${id}: ${[...reach].join(', ')}`);
    });
    it(`${id}: the Studio-or-live and two-mic poses are clear in every setup`, () => {
      for (const v of m.variants.map((x) => x.id)) {
        const scene = compileScene(m, v);
        for (const t of ['hdDynCard', 'hdDynHyper']) assert.equal(checkAssembly(scene, lesson.hand.context.pose, micBodyOf(MIC_TYPES[t])), null, `context ${v} ${t}`);
        for (const pr of lesson.hand.pairs) {
          if (pr.variant && pr.variant !== v) continue;
          assert.equal(checkAssembly(scene, pr.A.pose, micBodyOf(MIC_TYPES[pr.A.typeId])), null, `${pr.id}.A ${v}`);
          assert.equal(checkAssembly(scene, pr.B.pose, micBodyOf(MIC_TYPES[pr.B.typeId])), null, `${pr.id}.B ${v}`);
        }
      }
    });
    it(`${id}: the first monitor can sit in an off-axis null with the mic still facing the drum; a cardioid cannot`, () => {
      const w = lesson.live.wedges[0];
      for (const v of m.variants.map((x) => x.id)) {
        const floor = compileScene(m, v).yFloor;
        const src = { x: w.p.x, y: floor - w.lift, z: w.p.z };
        const can = (p: PatternId) => {
          for (let el = -80; el <= 10; el++) if (nearNull(p, arrivalAngle({ ...lesson.hand.context.pose, el }, src), 15)) return true;
          return false;
        };
        assert.ok(can('hypercardioid') || can('supercardioid'), `${id} ${v}: an off-axis null reaches the wedge`);
        assert.equal(can('cardioid'), false, `${id} ${v}: a cardioid aimed at the drum cannot`);
      }
    });
  }
});

describe('the parts match the sources', () => {
  const IN = 25.4;
  it('congas: an 11¾ in conga and a 12½ in tumba, 30 in tall, single-headed and open at the bottom', () => {
    assert.equal(CONGA.R * 2, 11.75 * IN);
    assert.equal(TUMBA.R * 2, 12.5 * IN);
    assert.equal(-CONGA.headY, 30 * IN);
    const m = L('M04a').model;
    assert.equal(m.parts.filter((p) => /\.head$/.test(p.id)).length, 2, 'one head per drum');
    assert.equal(m.parts.filter((p) => /\.shell$/.test(p.id)).length, 2);
    // Open at the bottom: on the floor a mic cannot be under a drum; raised it can be in front of the opening.
    assert.equal(CONGA_ZONES.find((z) => z.id === 'cg.bottom')!.requires!.variant, 'raised');
  });
  it('bongos: a 7¼ in macho and an 8⅝ in hembra, joined by a block; the macho’s shapes ≈ 1.19 × higher at the same tension', () => {
    assert.equal(MACHO.R * 2, 7.25 * IN);
    assert.ok(Math.abs(HEMBRA.R * 2 - 8.625 * IN) < 1e-9);
    assert.ok(MACHO.R < HEMBRA.R, 'the macho is the smaller');
    assert.equal(Math.round((HEMBRA.R / MACHO.R) * 100) / 100, 1.19);
    assert.ok(L('M04b').model.parts.some((p) => p.id === 'bongo.block'));
    // The block stays below the heads: it never blocks the shared mic above them.
    const block = L('M04b').model.parts.find((p) => p.id === 'bongo.block')!.solid as Extract<Shape3, { kind: 'box' }>;
    assert.ok(block.min.y > MACHO.headY);
  });
  it('timbales: 14 and 15 in, 6½ in deep, brass, with a bell only when the bell is mounted', () => {
    assert.equal(SMALL.R * 2, 14 * IN);
    assert.equal(LARGE.R * 2, 15 * IN);
    assert.ok(Math.abs(SMALL.bottomY - SMALL.headY - 6.5 * IN) < 1e-9);
    const m = L('M04c').model;
    assert.deepEqual(m.parts.filter((p) => p.id === 'timb.bell')[0].variants, ['bell']);
    assert.equal(compileScene(m, 'plain').solids.some((s) => s.partId === 'timb.bell'), false);
  });
  it('djembe: a 12½ in head, 610 mm tall (inside 58–63 cm), a goblet narrowing to a waist and flaring to the foot', () => {
    assert.equal(DJEMBE.R * 2, 12.5 * IN);
    assert.ok(-DJ_HEAD >= 580 && -DJ_HEAD <= 630);
    const solids = L('M05').model.parts.filter((p) => p.solid?.kind === 'frustum').map((p) => p.solid as Extract<Shape3, { kind: 'frustum' }>);
    const waist = Math.min(...solids.map((s) => Math.min(s.ra, s.rb)));
    assert.ok(waist < DJEMBE.R / 2, 'a narrow waist');
    assert.ok(DJEMBE.rBottom > waist * 2, 'a flaring foot');
  });
  it('djembe: the far top mic’s line is 16 in from the head centre, over the head’s outer edge (≈ 67° up)', () => {
    assert.equal(Math.round(COP_DIST * 10) / 10, 406.4);
    assert.ok(Math.abs(DIAG_N.x * COP_DIST - DJEMBE.R) < 1e-9, 'horizontal offset = the head radius');
    const up = (Math.asin(-DIAG_N.y) * 180) / Math.PI;
    assert.equal(Math.round(up), 67);
    assert.ok(Math.abs(Math.hypot(DIAG_N.x, DIAG_N.y, DIAG_N.z) - 1) < 1e-12);
  });
});

describe('the engine extensions (frustum, outline, mounts)', () => {
  const cyl: Extract<Shape3, { kind: 'frustum' }> = { kind: 'frustum', a: { x: 0, y: -100, z: 0 }, b: { x: 0, y: 100, z: 0 }, ra: 50, rb: 50 };
  it('a frustum’s distance: inside negative, the side and caps exact for a cylinder, a cone’s side between its radii', () => {
    assert.ok(sdf(cyl, { x: 0, y: 0, z: 0 }) < 0);
    assert.ok(Math.abs(sdf(cyl, { x: 80, y: 0, z: 0 }) - 30) < 1e-9);
    assert.ok(Math.abs(sdf(cyl, { x: 0, y: -130, z: 0 }) - 30) < 1e-9);
    assert.ok(Math.abs(sdf(cyl, { x: 0, y: 0, z: -50 })) < 1e-9);
    const cone: Shape3 = { kind: 'frustum', a: { x: 0, y: 0, z: 0 }, b: { x: 0, y: 100, z: 0 }, ra: 100, rb: 50 };
    assert.ok(sdf(cone, { x: 74, y: 50, z: 0 }) < 0 && sdf(cone, { x: 76, y: 50, z: 0 }) > 0, 'the side at mid-height is at r = 75');
  });
  it('the outline of an upright cylinder is its rectangle in the side view and its circle’s extent from above', () => {
    const side = frustumOutline(cyl, 'side');
    assert.ok(Math.abs(Math.min(...side.map((p) => p.u)) + 50) < 0.5 && Math.abs(Math.max(...side.map((p) => p.u)) - 50) < 0.5);
    assert.ok(Math.abs(Math.min(...side.map((p) => p.v)) + 100) < 1e-6 && Math.abs(Math.max(...side.map((p) => p.v)) - 100) < 1e-6);
    const top = frustumOutline(cyl, 'top');
    assert.ok(Math.abs(Math.max(...top.map((p) => Math.hypot(p.u, p.v))) - 50) < 0.5);
  });
  it('a level boom leaves a down-aimed mic horizontally (never a stand dropping through the drums)', () => {
    const scene = compileScene(L('M04a').model, 'floor');
    const segs = assembly(scene, CONGA_ZONES[0].start, micBodyOf(MIC_TYPES.hdDynCard));
    const boom = segs.find((s) => s.piece === 'boom')!;
    assert.ok(Math.abs(boom.a.y - boom.b.y) < 1e-9, 'horizontal');
    assert.ok(boom.b.x > boom.a.x + 200, 'toward the audience, away from the drums');
    const stand = segs.find((s) => s.piece === 'stand')!;
    assert.ok(stand.a.x > TUMBA.R + 100, 'the stand stands clear of the drums');
  });
  it('a clip-on mic reaches only as far as its 140 mm gooseneck from a rim', () => {
    const lesson = L('M04a');
    const scene = compileScene(lesson.model, 'floor');
    const body = micBodyOf(MIC_TYPES.hdClip);
    const ok = lesson.zones.find((z) => z.id === 'cg.clip.tumba')!.start;
    assert.equal(checkAssembly(scene, ok, body), null);
    const far = { ...ok, p: { ...ok.p, x: ok.p.x + 300, y: ok.p.y - 200 } };
    assert.equal(body.reach, 140, 'the gooseneck is the clamp’s reach');
    assert.equal(checkAssembly(scene, far, body)?.partId, 'clamp');
  });
  it('a zone’s aim band: “40–60°” refuses 30° and 70°, takes 50°', () => {
    const lesson = L('M05');
    const z = lesson.zones.find((q) => q.id === 'dj.top.near')!;
    const scene = compileScene(lesson.model, 'floor');
    const ctx = { scene, surfaces: lesson.model.surfaces, lines: lesson.model.lines, variant: 'floor', micTypeId: 'hdSdc', mount: 'stand' };
    const at = (offFromDown: number) => ({ ...z.start, el: -(90 - offFromDown) });
    assert.ok(inZone(z, ctx, at(50)));
    assert.equal(inZone(z, ctx, at(30)), false);
    assert.equal(inZone(z, ctx, at(70)), false);
    assert.equal(Math.round(angleBetween(aimVec(0, -40), { x: 0, y: 1, z: 0 })), 50);
  });
});

describe('HOW IT SOUNDS physics', () => {
  it('a centre strike drives only the ring shapes; near the edge the shapes with still lines across join in', () => {
    const centre = strokeShares(0);
    HEAD_SHAPES.forEach((sh, i) => assert.equal(centre[i] > 0.01, sh.n === 0, sh.label));
    const edge = strokeShares(0.85);
    assert.ok(HEAD_SHAPES.some((sh, i) => sh.n > 0 && edge[i] > 0.3));
    assert.ok(edge[0] < centre[0], 'the lowest shape moves less near the edge');
    assert.deepEqual(strokeShares(null), [0, 0, 0, 0, 0], 'a shell or rim strike drives no head shape');
  });
  it('every lesson’s strokes and strike points are inside the head', () => {
    for (const id of LESSON_IDS) {
      const h = L(id).hand;
      for (const s of h.strokes.items) if (s.frac != null) assert.ok(s.frac >= 0 && s.frac < 1, `${id} ${s.id}`);
      for (const p of h.facePoints) assert.ok(p.frac >= 0 && p.frac < 1);
      assert.equal(L(id).sound.stages.length, 4);
    }
  });
});

describe('the checks follow the item-writing rules (LESSON_JOURNEY §5)', () => {
  for (const id of LESSON_IDS) {
    const lesson = L(id);
    const items = [...lesson.scenarios, ...lesson.symptoms];
    it(`${id}: correct ≤ 1.6 × the others’ mean; the longest in at most a quarter; no absolute giveaways; a why for every wrong option`, () => {
      for (const s of items) {
        const others = s.options.filter((o) => o !== s.correct);
        const mean = others.reduce((a, o) => a + o.length, 0) / others.length;
        assert.ok(s.correct.length <= 1.6 * mean, `${s.id}: ${s.correct.length} vs ${mean.toFixed(1)}`);
        for (const o of others) assert.doesNotMatch(o, /\b(always|any|never|every)\b/i, `${s.id}: "${o}"`);
        assert.ok(s.options.length >= 3);
        assert.deepEqual(Object.keys(s.why).sort(), others.sort(), `${s.id}: why keys`);
        for (const o of others) assert.ok(s.why[o].length > 20, `${s.id}: why for "${o}"`);
      }
      const longest = items.filter((s) => s.options.every((o) => o === s.correct || o.length < s.correct.length)).length;
      assert.ok(longest <= items.length / 4, `${id}: correct is the longest in ${longest} of ${items.length}`);
    });
    it(`${id}: the quick check is valid (6 items, foundations only, a critical hearing item)`, () => {
      assert.deepEqual(validateQuickCheck(lesson.diagnostic), []);
      assert.ok(lesson.diagnostic.some((d) => d.critical && /hearing/.test(d.correct)));
    });
    it(`${id}: the practice page’s contract — the ids PPractice reads, both briefs pass ≥ 2 setups on their reasons`, () => {
      for (const k of ['k.prac.gain', 'k.prac.3', 'k.mix.1', 'k.mix.2', 'k.mix.3']) assert.ok(lesson.scenarios.some((s) => s.id === k && s.page === 'practice'), k);
      assert.ok(lesson.orderTasks.some((t) => t.id === 'k.prac.order'));
      // The shared practice page reads its card ids from the lesson's copy.
      const P = copyOf(lesson).practice;
      for (const k of [P.gain, P.second, ...P.mixed]) assert.ok(lesson.scenarios.some((s) => s.id === k && s.page === 'practice'), `copy.practice ${k}`);
      assert.equal(P.mixed.length, 3);
      const REQUIRED = ['r.doc', 'r.clear', 'r.power'];
      for (const t of lesson.setupTasks) {
        const ok = t.setups.filter((s) => s.ok);
        assert.ok(ok.length >= 2, t.id);
        for (const s of ok) assert.equal(gradeSetup(t, s.id, new Set(REQUIRED)).pass, true, `${t.id}/${s.id}`);
        assert.equal(gradeSetup(t, ok[0].id, new Set([...REQUIRED, 'r.brand'])).pass, false);
      }
      const noPh = lesson.setupTasks.find((x) => /NO phantom/.test(x.brief))!;
      for (const s of noPh.setups) if (s.power === 'phantom') assert.equal(s.ok, false, s.id);
      const order = lesson.orderTasks[0];
      const at = (re: RegExp) => order.steps.findIndex((s) => re.test(s.text));
      assert.equal(at(/^Ask the player/), 0);
      assert.ok(at(/mount the mic/) < at(/phantom/) && at(/phantom/) < at(/gain/) && at(/gain/) < at(/Compare positions/));
    });
    it(`${id}: every page from MICROPHONES to ADVANCED carries a FROM EARLIER item from a foundation page`, () => {
      for (const p of ['microphone', 'placement', 'context'] as const) {
        assert.ok(lesson.pages[p].credit.scenarios.some((sid) => lesson.scenarios.find((s) => s.id === sid)?.prompt.startsWith('FROM EARLIER')), `${id} ${p}`);
      }
      assert.equal(lesson.pages.instrument.credit.scenarios.length, 0, 'ORIENT asks nothing');
    });
  }
});

/** Brands and named sources the hand-drum research met (on top of the shared list). */
const HAND_BRANDS = ['Latin Percussion', 'LP', 'Meinl', 'KSM ?137', '4099', '4011', 'Beta ?181', 'SM ?57', 'SM ?58', 'D2', 'D4', 'AT ?4050', 'AT ?4047', 'C-?451', 'MD ?421', 'KM ?18[45]', 'U ?87', 'Coppinger', 'Duvel', 'Ferguson', 'Garza', 'Milan', 'Krys', 'Kooren', 'Brinser', 'Ozomatli', 'Jonas Brothers', 'Tito Puente', 'Wikipedia', 'Sound On Sound'];
const ALL_RE = [...BANNED_FORMS, new RegExp(`\\b(?:${[...BRAND_NAMES, ...HAND_BRANDS].join('|')})\\b`)];
const INTERNAL = new Set(['src', 'quote', 'prov', 'bandProv', 'strikeSrc', 'unknowns', 'examples', 'kind', 'id', 'partId', 'refSurface', 'line', 'source', 'drum', 'typeId', 'worked']);
function strings(v: unknown, path: string, out: { path: string; text: string }[], seen = new Set<unknown>()): void {
  if (typeof v === 'string') out.push({ path, text: v });
  else if (v && typeof v === 'object') {
    if (seen.has(v)) return;
    seen.add(v);
    if (Array.isArray(v)) v.forEach((x, i) => strings(x, `${path}[${i}]`, out, seen));
    else for (const [k, x] of Object.entries(v)) if (!INTERNAL.has(k)) strings(x, `${path}.${k}`, out, seen);
  }
}

describe('the starting-points voice (owner ruling 2026-10-04)', () => {
  for (const id of LESSON_IDS) {
    it(`${id}: no source, brand, model or badge in any learner-facing string (the family extras included)`, () => {
      const items: { path: string; text: string }[] = [];
      strings(L(id), id, items);
      assert.ok(items.length > 300);
      const bad = items.flatMap(({ path, text }) => ALL_RE.filter((re) => re.test(text)).map((re) => `${path}: ${re} in "${text.slice(0, 90)}"`));
      assert.deepEqual(bad, []);
      assert.match(L(id).accuracyDetail, /^ABOUT THESE STARTING POINTS\. After our research/);
    });
  }
  it('the hand-drum mic types name no brand to the learner', () => {
    const items: { path: string; text: string }[] = [];
    for (const t of ['hdDynCard', 'hdDynHyper', 'hdSdc', 'hdClip']) strings(MIC_TYPES[t], t, items);
    assert.deepEqual(items.filter(({ text }) => ALL_RE.some((re) => re.test(text))), []);
  });
  it('the family’s pages place no mic on the foundation pages', () => {
    for (const f of ['HInstrument.tsx', 'HSound.tsx', 'HSetting.tsx']) {
      const s = read(`src/screens/lab/miking/lessons/shared/handdrums/pages/${f}`).replace(/\/\*[\s\S]*?\*\//g, '');
      assert.doesNotMatch(s, /slots=\{\[['"]A['"]/, f);
      assert.doesNotMatch(s, /placementParams\(/, f);
    }
  });
});

describe('the internal record (research mandatory, never shown)', () => {
  const SHARED = read('docs/labs/miking/SOURCES_SHARED.md');
  for (const id of LESSON_IDS) {
    it(`${id}: every zone, part, orient and setting src resolves to a SOURCES key`, () => {
      const keys = new Set<string>();
      for (const mm of (read(`docs/labs/miking/${FOLDER[id]}/SOURCES.md`) + SHARED).matchAll(/^\| ([A-Z0-9][A-Z0-9-]+) \|/gm)) keys.add(mm[1]);
      const lesson = L(id);
      const srcs: string[] = [];
      for (const z of lesson.zones) srcs.push(z.src);
      for (const f of lesson.orient) srcs.push(f.src);
      for (const p of lesson.model.parts) if (p.prov.kind === 'sourced' || p.prov.kind === 'trial') srcs.push(p.prov.src);
      for (const it of lesson.setting.items) if (it.prov.kind === 'sourced') srcs.push(it.prov.src);
      for (const t of lesson.micTypeIds) for (const e of MIC_TYPES[t].examples) srcs.push(e.src);
      assert.deepEqual([...new Set(srcs)].filter((s) => !keys.has(s)), []);
    });
    it(`${id}: each sourced zone’s research words are on record verbatim`, () => {
      const text = read(`docs/labs/miking/${FOLDER[id]}/SOURCES.md`) + read(`docs/labs/miking/source_text/${{ M04a: 'Congas', M04b: 'Bongos', M04c: 'Timbales', M05: 'Djembe' }[id]}-Miking-Technique-Research.txt`) + read('docs/labs/miking/congas/SOURCES.md');
      const norm = (s: string) => s.replace(/[’']/g, "'").replace(/[“”"]/g, '"').replace(/\s+/g, ' ').toLowerCase();
      for (const z of L(id).zones) {
        const q = norm(z.quote);
        // The quote, or its first clause, appears in the research record.
        assert.ok(norm(text).includes(q) || norm(text).includes(q.slice(0, 40)), `${z.id}: "${z.quote}"`);
      }
    });
  }
  it('the corrections log lists the hand-drum fixes and build defaults', () => {
    const LOG = read('docs/labs/miking/CORRECTIONS_LOG.md');
    for (const k of ['CG-01', 'CG-05', 'BG-01', 'BG-04', 'TB-01', 'TB-04', 'DJ-01', 'DJ-02', 'DJ-03', 'DJ-04', 'HD-01']) assert.match(LOG, new RegExp(`\\| ${k} \\|`), k);
  });
  it('the shared mic family’s sources are on record (SOURCES_SHARED §6)', () => {
    for (const k of ['S-SM57-UG', 'AX-D2', 'AX-SCX1', 'MKT-4099']) assert.match(SHARED, new RegExp(`^\\| ${k} \\|`, 'm'), k);
  });
});

describe('membrane picture sanity (the bezel never prints a null as a number)', () => {
  it('the rejection checks use the ideal pattern only through the shared physics', () => {
    assert.ok(gainDb('hypercardioid', 109.47) < -40);
  });
});
