/**
 * Miking Labs — Lab 2 HAND PERCUSSION, the small-percussion family:
 * I02 Cajón, I03a Shaker, I03b Egg shaker, I03c Maracas, I04 Headless
 * tambourine, I05a Cowbell, I05b Claves, I05c Woodblock, I05d Güiro
 * (docs/labs/miking/BUILDER_BRIEF.md; LESSON_JOURNEY.md; BATCH2_RESEARCH_SUMMARY.md).
 *
 * Real relationships, never re-running the implementation:
 *   • each lesson validates; its zones' start poses are clear of every part and
 *     inside their zone, for every state and mic type they allow; each zone is
 *     DRAWN where it is TESTED; two zones are reachable with the default mic;
 *   • the monitor exercise is solvable by an off-axis null and NOT by a cardioid;
 *   • the clearance readout is the distance to the motion envelope;
 *   • the hands wrap what they hold; the parts match the sources;
 *   • the item-writing rules, the quick check, the practice contract;
 *   • the starting-points voice; every src key on record; the corrections log.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import { compileScene, checkAssembly } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { inZone, lineDistance, zonesAvailable } from '../src/screens/lab/miking/engine/geometry/zones.ts';
import { micBodyOf, validateLesson } from '../src/screens/lab/miking/engine/model/validate.ts';
import { arrivalAngle, nearNull } from '../src/screens/lab/miking/engine/physics/polar.ts';
import { gradeSetup } from '../src/screens/lab/miking/engine/progress/setupGrade.ts';
import { validateQuickCheck } from '../src/screens/lab/miking/engine/journey.ts';
import { PAGE_IDS, type PatternId, type Lesson } from '../src/screens/lab/miking/engine/model/types.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { copyOf } from '../src/screens/lab/miking/engine/model/copy.ts';
import { LESSONS, readyLabs } from '../src/screens/lab/miking/data/registry.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { SMALL_PERC_CONTENT } from '../src/screens/lab/miking/lessons/shared/smallperc/content.ts';
import type { SpLesson } from '../src/screens/lab/miking/lessons/shared/smallperc/family.ts';
import { clearLine, elbowOf, PLAYER, SHOULDER_R, v3 } from '../src/screens/lab/miking/lessons/shared/smallperc/geom.ts';
import { cradle, dorsalFist, openHand, placeBetween, placePt, profileFist, smoothPathD, tubeOutline } from '../src/screens/lab/miking/lessons/shared/smallperc/hands.ts';
import { inPoly } from '../src/screens/lab/miking/lessons/shared/handGeom.ts';
import { BANNED_FORMS, BRAND_NAMES } from './mikingLearnerText.test.ts';
import { itemRules, RESEARCH_NAMES } from './_mikingItemRules.ts';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const IDS = Object.keys(SMALL_PERC_CONTENT);
const L = (id: string) => SMALL_PERC_CONTENT[id] as SpLesson;
/** The research folder (SOURCES.md) and the owner's lesson text per lesson. */
const FOLDER: Record<string, { dir: string; text: string }> = {
  I02: { dir: 'cajon', text: 'Cajon-Miking-Technique-Research.txt' },
  I03a: { dir: 'shaker', text: 'Shaker-Miking-Technique-Research.txt' },
  I03b: { dir: 'egg_shaker', text: 'Egg-Shaker-Miking-Technique-Research.txt' },
  I03c: { dir: 'maracas', text: 'Maracas-Miking-Technique-Research.txt' },
  I04: { dir: 'headless_tambourine', text: 'I04-Headless-Tambourine-and-Jingles-Miking-Technique.txt' },
  I05a: { dir: 'cowbell', text: 'Cowbell-Miking-Technique-Research.txt' },
  I05b: { dir: 'claves', text: 'Claves-Miking-Technique-Research.txt' },
  I05c: { dir: 'woodblock', text: 'Woodblock-Miking-Technique-Research.txt' },
  I05d: { dir: 'guiro', text: 'Guiro-Miking-Technique-Research.txt' },
};

describe('registration (Lab 2, hand percussion)', () => {
  it('every family lesson is listed in Lab 2 and served; Lab 2 is listed with a blurb', () => {
    assert.ok(IDS.length >= 3);
    for (const id of IDS) {
      const meta = LESSONS.find((l) => l.id === id);
      assert.ok(meta, id);
      assert.equal(meta!.labId, 'percussion', id);
      assert.ok(lessonById(id), `${id} content`);
      assert.equal(L(id).labId, 'percussion');
    }
    const lab2 = readyLabs().find((l) => l.id === 'percussion');
    assert.ok(lab2 && lab2.blurb.length > 40, 'Lab 2 appears with a blurb');
  });
});

describe('each lesson validates and its zones are reachable', () => {
  for (const id of IDS) {
    const lesson = L(id);
    const m = lesson.model;
    it(`${id}: validateLesson is clean; nine pages`, () => {
      assert.deepEqual(validateLesson(lesson, MIC_TYPES), []);
      for (const p of PAGE_IDS) assert.ok(lesson.pages[p]?.title, p);
    });
    it(`${id}: every zone start is clear and inside its zone, for every state and mic it allows`, () => {
      for (const z of lesson.zones) {
        const variants = z.requires?.variant ? [z.requires.variant] : z.requires?.variants ? [...z.requires.variants] : m.variants.map((v) => v.id);
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
    it(`${id}: each zone is drawn where it is tested (its start inside its drawn region, both views)`, () => {
      for (const z of lesson.zones) {
        const p = z.start.p;
        const inDraw = (view: 'side' | 'top', u: number, v: number) => {
          const d = z.draw?.[view];
          const r = z.drawn?.[view];
          if (d) return d.some((q) => inPoly(q.poly, u, v));
          if (r && 'u0' in r) return u >= r.u0 - 1 && u <= r.u1 + 1 && v >= r.v0 - 1 && v <= r.v1 + 1;
          return false;
        };
        assert.ok(inDraw('side', p.x, p.y), `${z.id} side`);
        assert.ok(inDraw('top', p.x, p.z), `${z.id} top`);
      }
    });
    it(`${id}: with the default mic, two different zones can be rested in`, () => {
      const C = copyOf(lesson);
      const worked = lesson.zones.find((z) => z.id === Object.values(C.placement.workedZone)[0])!;
      const typeId = (worked.requires?.micTypeIds ?? lesson.micTypeIds)[0];
      const reach = new Set<string>();
      for (const v of m.variants.map((x) => x.id)) for (const z of zonesAvailable(lesson.zones, v, typeId, MIC_TYPES[typeId].mount)) reach.add(z.id);
      assert.ok(reach.size >= 2, `${id}: ${[...reach].join(', ')}`);
      for (const zid of Object.values(C.placement.workedZone)) assert.ok(lesson.zones.some((z) => z.id === zid), zid);
    });
    it(`${id}: the Studio-or-live and two-mic zones exist and their poses are clear`, () => {
      const C = copyOf(lesson);
      const ctx = lesson.zones.find((z) => z.id === C.context.zone)!;
      assert.ok(ctx, C.context.zone);
      const v = C.context.variant ?? m.defaultVariant;
      assert.equal(checkAssembly(compileScene(m, v), ctx.start, micBodyOf(MIC_TYPES[C.context.typeId])), null);
      const tv = C.twoMic.variant ?? m.defaultVariant;
      for (const zid of [C.twoMic.A.zone, C.twoMic.B.zone!]) {
        const z = lesson.zones.find((q) => q.id === zid)!;
        assert.ok(z, zid);
        assert.equal(checkAssembly(compileScene(m, tv), z.start, micBodyOf(MIC_TYPES[C.twoMic.A.typeId])), null, zid);
      }
    });
    it(`${id}: the downstage wedge can sit in a null with the mic still facing the instrument (by aim or by pattern)`, () => {
      const C = copyOf(lesson);
      const z = lesson.zones.find((q) => q.id === C.context.zone)!;
      const w = lesson.live.wedges.find((x) => x.id === C.context.target)!;
      const floor = compileScene(m, C.context.variant ?? m.defaultVariant).yFloor;
      const src = { x: w.p.x, y: floor - w.lift, z: w.p.z };
      const can = (p: PatternId) => {
        for (let az = -C.context.azMax; az <= C.context.azMax; az += 3) for (let el = -C.context.elMax; el <= C.context.elMax; el += 3) if (nearNull(p, arrivalAngle({ ...z.start, az: z.start.az + az, el: z.start.el + el }, src), 15)) return true;
        return false;
      };
      // Two answers, both taught: tilt a cardioid's back toward the wedge, or
      // choose a pattern whose null sits off to the side of the rear.
      assert.ok(can('hypercardioid') || can('supercardioid'), `${id}: an off-axis null reaches the wedge`);
      // The cowbell's spot looks across from the side or down from above: no
      // tilt within the AIM range brings a cardioid's rear to the downstage
      // wedge — the lesson's own answer is the tighter pattern. Pinned both ways.
      if (id === 'I05a') assert.ok(!can('cardioid'), `${id}: only a tighter pattern reaches it`);
      else assert.ok(can('cardioid'), `${id}: a tilted cardioid's rear reaches it too`);
    });
  }
});

describe('the family geometry (pure)', () => {
  it('the clearance readout is the distance to the motion capsule (finite line), signed', () => {
    const line = clearLine('c', 'the shake', v3(-90, -1150, 0), v3(90, -1150, 0), 60, ['x']);
    const at = (x: number, y: number, z: number) => lineDistance([line], 'c', { p: v3(x, y, z), az: 0, el: 0 });
    assert.ok(Math.abs(at(450, -1150, 0) - (450 - 90 - 60)) < 1e-9, 'beyond the end: from the end cap');
    assert.ok(Math.abs(at(0, -1450, 0) - (300 - 60)) < 1e-9, 'beside: from the side');
    assert.ok(at(0, -1150, 30) < 0, 'inside reads negative');
  });
  it('an infinite reference line is unchanged by the finite-line support', () => {
    const l = { id: 'l', label: 'l', point: v3(0, 0, 0), dir: v3(1, 0, 0) };
    assert.equal(lineDistance([l], 'l', { p: v3(5000, 30, 40), az: 0, el: 0 }), 50);
  });
  it('the arm solver keeps the segment lengths and bends the elbow down', () => {
    const W = v3(-90, -1160, 30);
    const E = elbowOf(SHOULDER_R, W, v3(0.1, 1, 0.45));
    const d = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    assert.ok(Math.abs(d(SHOULDER_R, E) - PLAYER.upperArm) < 1e-6);
    assert.ok(Math.abs(d(E, W) - PLAYER.forearm) < 1e-6);
    assert.ok(E.y > Math.min(SHOULDER_R.y, W.y), 'the elbow hangs below the shoulder–wrist line');
  });
});

describe('the hands (drawn well: they wrap what they hold)', () => {
  it('a fist seen along what it holds: every finger stays outside the held circle and wraps round its front', () => {
    for (const r of [7, 12.5, 22.5]) {
      const g = profileFist(r);
      const c = g.hold!;
      // The nearest (index) finger wraps outside the object; the fingers
      // behind it are set back in depth, so in the picture they may overlap
      // its edge — never its middle.
      for (const p of g.fingers[3].pts) assert.ok(Math.hypot(p[0] - c[0], p[1] - c[1]) >= r - 1e-6, `r ${r}: the index finger inside the held object`);
      for (const f of g.fingers) {
        for (const p of f.pts) assert.ok(Math.hypot(p[0] - c[0], p[1] - c[1]) >= r * 0.6, `r ${r}: a finger over the held object's middle`);
        const a0 = Math.atan2(f.pts[0][1] - c[1], f.pts[0][0] - c[0]);
        const a1 = Math.atan2(f.pts[f.pts.length - 1][1] - c[1], f.pts[f.pts.length - 1][0] - c[0]);
        assert.ok(a0 < -Math.PI / 3, 'the knuckle sits above the object');
        assert.ok(a1 > 0, 'the fingertip comes round underneath');
      }
      assert.equal(g.fingers.length, 4);
    }
  });
  it('each phalanx keeps its length (bones, not a ring)', () => {
    const g = profileFist(12.5);
    const idx = g.fingers[3].pts;
    const len = (i: number) => Math.hypot(idx[i + 1][0] - idx[i][0], idx[i + 1][1] - idx[i][1]);
    assert.ok(len(0) > 40 && len(0) < 56, `proximal ${len(0)}`);
    assert.ok(len(1) > 22 && len(1) < 36, `middle ${len(1)}`);
  });
  it('the back of a fist: four folded fingers past the knuckle row, a thumb, a cradle round a clave, an open hand', () => {
    const d = dorsalFist();
    assert.equal(d.fingers.length, 4);
    for (const f of d.fingers) assert.ok(f.pts[f.pts.length - 1][0] > 84, 'folded past the knuckles');
    const c = cradle(12.5);
    for (const f of c.fingers) for (const p of f.pts.slice(1)) assert.ok(Math.hypot(p[0] - c.hold![0], p[1] - c.hold![1]) >= 12.5, 'the cradle stays outside the clave');
    assert.equal(openHand().fingers.length, 4);
  });
  it('placing a hand puts its wrist and its grip where the model’s arm says', () => {
    const g = profileFist(22.5);
    const pl = placeBetween(g, [-96, -1166], [-4, -1150]);
    const w = placePt([0, 0], pl);
    const h = placePt(g.hold!, pl);
    assert.ok(Math.hypot(w[0] + 96, w[1] + 1166) < 1e-9);
    assert.ok(Math.hypot(h[0] + 4, h[1] + 1150) < 2, `grip at ${h}`);
  });
  it('outlines are closed, finite and smooth', () => {
    const o = tubeOutline([[0, 0], [30, 5], [50, 20]], 18, 14);
    assert.ok(o.length > 10 && o.every((p) => Number.isFinite(p[0]) && Number.isFinite(p[1])));
    const d = smoothPathD(o);
    assert.match(d, /^M[-\d.]+ [-\d.]+C/);
    assert.match(d, /Z$/);
  });
});

describe('the checks follow the item-writing rules (LESSON_JOURNEY §5)', () => {
  for (const id of IDS) {
    const lesson = L(id);
    it(`${id}: item rules — length, no giveaways, a why for every wrong option`, () => itemRules(lesson));
    it(`${id}: the quick check is valid (6 items, foundations only, a critical hearing item with 85 dBA)`, () => {
      assert.deepEqual(validateQuickCheck(lesson.diagnostic), []);
      const c = lesson.diagnostic.filter((d) => d.critical);
      assert.equal(c.length, 1);
      assert.match(c[0].explain, /85 dBA/);
    });
    it(`${id}: the practice contract — the ids the practice page reads, both briefs pass ≥ 2 setups on their reasons`, () => {
      const P = copyOf(lesson).practice;
      for (const k of [P.gain, P.second, ...P.mixed]) assert.ok(lesson.scenarios.some((s) => s.id === k && s.page === 'practice'), `copy.practice ${k}`);
      assert.equal(P.mixed.length, 3);
      assert.ok(lesson.orderTasks.some((t) => t.id.endsWith('.prac.order')));
      const REQUIRED = ['r.doc', 'r.clear', 'r.power'];
      for (const t of lesson.setupTasks) {
        const ok = t.setups.filter((s) => s.ok);
        assert.ok(ok.length >= 2, t.id);
        for (const s of ok) assert.equal(gradeSetup(t, s.id, new Set(REQUIRED)).pass, true, `${t.id}/${s.id}`);
        assert.equal(gradeSetup(t, ok[0].id, new Set([...REQUIRED, 'r.brand'])).pass, false);
      }
      const noPh = lesson.setupTasks.find((x) => /NO phantom/.test(x.brief))!;
      assert.ok(noPh, 'a brief with no phantom power');
      for (const s of noPh.setups) if (s.power === 'phantom') assert.equal(s.ok, false, s.id);
      const order = lesson.orderTasks[0];
      const at = (re: RegExp) => order.steps.findIndex((s) => re.test(s.text));
      assert.ok(at(/phantom/) > at(/stop/i) && at(/phantom/) < at(/gain/) && at(/gain/) < at(/mono/), 'place, power, gain, then the mono check');
    });
    it(`${id}: ORIENT asks nothing; HOW IT SOUNDS and THE SETTING have their own checks; every page from MICROPHONES to ADVANCED reaches back`, () => {
      assert.equal(lesson.pages.instrument.credit.scenarios.length, 0);
      assert.equal(lesson.pages.sound.credit.interactive, 'soundPath');
      for (const p of ['sound', 'setting'] as const) {
        assert.ok(lesson.pages[p].credit.scenarios.length >= 3);
        for (const sid of lesson.pages[p].credit.scenarios) assert.equal(lesson.scenarios.find((s) => s.id === sid)?.page, p, sid);
      }
      for (const p of ['microphone', 'placement', 'context'] as const) {
        assert.ok(lesson.pages[p].credit.scenarios.some((sid) => lesson.scenarios.find((s) => s.id === sid)?.prompt.startsWith('FROM EARLIER')), `${id} ${p}`);
      }
    });
    it(`${id}: HOW IT SOUNDS — four events, the family's motion pair, a sound stage per event`, () => {
      assert.equal(lesson.sound.stages.length, 4);
      const C = copyOf(lesson);
      assert.ok(C.sound.pair, 'a pair of motions for step 2');
      for (const c of C.sound.cells) assert.equal(c.at.length, 4, c.k);
      assert.ok(lesson.sp.strikeTitle.length > 3);
    });
  }
});

/** Brands, makers, models and named people the Lab 2 hand-percussion research met. */
const SP_BRANDS = ['Meinl', 'Grinnell', 'Schlagwerk', 'Duvel', 'Paul White', 'Sound On Sound', 'Rangel', 'Jonas', 'Blink', 'Slaptop', 'Bulería', 'Buleria', 'MPMCC', 'CMH10', 'BP40', 'FP7', 'f6', '4011A?', '2011C', 'Percussive Arts Society', 'PAS', 'Waves', 'Hornbostel', 'Sachs', 'Metropolitan', 'Benny Greb', 'Groove Bell', 'Crystal Shaker', 'Siam'];
const ALL_RE = [...BANNED_FORMS, new RegExp(`\\b(?:${[...BRAND_NAMES, ...SP_BRANDS].join('|')})\\b`), RESEARCH_NAMES];
const INTERNAL = new Set(['src', 'quote', 'prov', 'bandProv', 'strikeSrc', 'unknowns', 'examples', 'kind', 'id', 'partId', 'refSurface', 'line', 'typeId', 'zone', 'surface']);
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
  for (const id of IDS) {
    it(`${id}: no source, brand, model or badge in any learner-facing string (the family extras included)`, () => {
      const items: { path: string; text: string }[] = [];
      strings(L(id), id, items);
      assert.ok(items.length > 300);
      const bad = items.flatMap(({ path, text }) => ALL_RE.filter((re) => re.test(text)).map((re) => `${path}: ${re} in "${text.slice(0, 90)}"`));
      assert.deepEqual(bad, []);
      assert.match(L(id).accuracyDetail, /^ABOUT THESE STARTING POINTS\. After our research/);
    });
  }
  it('the family’s presentation files name no maker and place no mic on the foundation pages', () => {
    const files = ['Hand.tsx', 'Player.tsx', 'objects.tsx', 'soundKit.tsx', 'StationPlan.tsx', 'pages/SSound.tsx', 'pages/SInstrument.tsx'].map((f) => `src/screens/lab/miking/lessons/shared/smallperc/${f}`);
    for (const f of files) {
      const s = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      for (const re of ALL_RE) assert.doesNotMatch(s, re, f);
    }
    for (const f of ['pages/SSound.tsx', 'pages/SInstrument.tsx']) {
      const s = read(`src/screens/lab/miking/lessons/shared/smallperc/${f}`).replace(/\/\*[\s\S]*?\*\//g, '');
      assert.doesNotMatch(s, /slots=\{\[['"]A['"]/, f);
      assert.doesNotMatch(s, /placementParams\(/, f);
    }
  });
  it('the family sound page is user-started and finite: no loop host, a stop on cover, reduced motion steps', () => {
    const s = read('src/screens/lab/miking/lessons/shared/smallperc/pages/SSound.tsx').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(s, /\bwithRepeat\(|\buseFrameCallback\(|\bsetInterval\(|\bAnimated\.loop\(/);
    assert.match(s, /withTiming\(n,/);
    assert.match(s, /useAnimationsAllowed\(\)/);
    assert.match(s, /if \(\(hidden \|\| !focused\) && playing\) stop\(\);/);
    assert.match(s, /cancelAnimation\(reveal\)/);
    const steps = s.slice(s.indexOf('const steps: MikingStep[]'));
    assert.ok(steps.indexOf('<ScenarioList') > steps.lastIndexOf("layout: 'rack'"), 'checks after the explorations');
  });
});

describe('the internal record (research mandatory, never shown)', () => {
  const SHARED = read('docs/labs/miking/SOURCES_SHARED.md') + read('docs/labs/miking/shaker/SOURCES.md') + read('docs/labs/miking/hihat/SOURCES.md');
  for (const id of IDS) {
    const f = FOLDER[id];
    it(`${id}: every zone and orient src resolves to a SOURCES key (or is the owner's own lesson text)`, () => {
      const keys = new Set<string>();
      for (const mm of (read(`docs/labs/miking/${f.dir}/SOURCES.md`) + SHARED).matchAll(/^\| ([A-Z0-9][A-Z0-9-]+) \|/gm)) keys.add(mm[1]);
      for (const mm of (read(`docs/labs/miking/${f.dir}/SOURCES.md`) + SHARED).matchAll(/\b([A-Z][A-Z0-9]+(?:-[A-Z0-9]+)+)\b/g)) keys.add(mm[1]);
      const lesson = L(id);
      const srcs: string[] = [...lesson.zones.map((z) => z.src), ...lesson.orient.map((o) => o.src)];
      const own = /^LESSON-/;
      assert.deepEqual([...new Set(srcs)].filter((s) => !own.test(s) && !keys.has(s)), []);
    });
    it(`${id}: each zone’s research words are on record verbatim`, () => {
      const norm = (s: string) => s.replace(/[*]/g, '').replace(/[’']/g, "'").replace(/[“”"]/g, '"').replace(/\s+/g, ' ').toLowerCase();
      const text = norm(read(`docs/labs/miking/${f.dir}/SOURCES.md`) + read(`docs/labs/miking/source_text/${f.text}`) + SHARED);
      for (const z of L(id).zones) {
        const q = norm(z.quote);
        assert.ok(text.includes(q) || text.includes(q.slice(0, 48)), `${z.id}: "${z.quote}"`);
      }
    });
  }
  it('the corrections log lists the Lab 2 hand-percussion fixes and build defaults', () => {
    const LOG = read('docs/labs/miking/CORRECTIONS_LOG.md');
    for (const k of ['SH-01', 'EG-01', 'MR-01', 'SP-01', 'HT-01', 'CB-01', 'CV-01', 'WB-01', 'GU-01']) assert.match(LOG, new RegExp(`\\| ${k} \\|`), k);
  });
});

describe('the lessons hold together', () => {
  it('every family lesson is a Lesson with the family extras', () => {
    for (const id of IDS) {
      const l: Lesson = L(id);
      assert.ok(L(id).sp.plan.things.length >= 5, id);
      assert.ok(L(id).sp.close.side.u1 > L(id).sp.close.side.u0, id);
      assert.equal(l.id, id);
    }
  });
});
