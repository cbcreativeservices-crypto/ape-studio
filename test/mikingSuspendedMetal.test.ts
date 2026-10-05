/**
 * Miking Labs — Lab 2 SUSPENDED METAL: I06a triangle, I06b finger cymbals,
 * I06c bar chimes, I12 gong. Real relationships only (charter §9.2):
 *   • the physics the pictures draw: a bar free at both ends (its textbook
 *     ratios and still points), chime pitch ∝ 1/length², the free disc's
 *     shapes (a centre stroke drives only the ring-shaped ones);
 *   • each instrument is its research's size (sourced where a source gives
 *     it, a flagged placeholder where none does);
 *   • each lesson validates; every zone's start is clear of the instrument,
 *     inside its zone, inside its drawn band, outside every keep-out, and at
 *     least the general 30 cm percussion floor from the instrument;
 *   • the checks follow the item-writing rules; the words name nobody from
 *     the research; the lessons are registered in Lab 2, each on its own
 *     line; no file in the family loops.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { itemRules, learnerStrings, RESEARCH_NAMES } from './_mikingItemRules.ts';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const ROOT = process.cwd();
const MIKING = 'src/screens/lab/miking';
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const IN = 25.4;
const near = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol;

const mm = await import('../src/screens/lab/miking/lessons/shared/metal/metalModes.ts');
const tri = await import('../src/screens/lab/miking/lessons/i06aTriangle/model.ts');
const triG = await import('../src/screens/lab/miking/lessons/i06aTriangle/geometry.ts');
const { I06A_LESSON } = await import('../src/screens/lab/miking/lessons/i06aTriangle/lesson.ts');
const { inPoly } = await import('../src/screens/lab/miking/lessons/shared/handGeom.ts');
const { MIC_TYPES } = await import('../src/screens/lab/miking/data/micTypes.ts');
const { validateLesson, micBodyOf } = await import('../src/screens/lab/miking/engine/model/validate.ts');
const { checkAssembly, compileScene } = await import('../src/screens/lab/miking/engine/geometry/collision.ts');
const { inZone } = await import('../src/screens/lab/miking/engine/geometry/zones.ts');
const { lessonById } = await import('../src/screens/lab/miking/data/lessons.ts');
const { LESSONS, readyLabs } = await import('../src/screens/lab/miking/data/registry.ts');

type L = typeof I06A_LESSON;
const LESSONS_UNDER_TEST: L[] = [I06A_LESSON];

describe('suspended metal: the physics the pictures draw', () => {
  it('a bar free at both ends: the textbook ratios 1 : 2.757 : 5.404 : 8.933 : 13.34', () => {
    const r = mm.BAR_SHAPES.map((b: { ratio: number }) => b.ratio);
    for (const [got, want] of r.map((x: number, i: number) => [x, [1, 2.7565, 5.4039, 8.933, 13.3443][i]])) assert.ok(near(got, want, 2e-3), `${got} vs ${want}`);
  });
  it('the lowest shape stands still 22.4 % from each end; shape n has n + 1 still points', () => {
    const b1 = mm.BAR_SHAPES[0];
    assert.ok(near(b1.nodes[0], 0.2242, 1e-3) && near(b1.nodes[1], 0.7758, 1e-3));
    mm.BAR_SHAPES.forEach((b: { nodes: readonly number[] }, i: number) => assert.equal(b.nodes.length, i + 2));
  });
  it('a stroke at a still point drives that shape hardly at all; the free ends move most', () => {
    const b1 = mm.BAR_SHAPES[0];
    assert.ok(mm.barStrikeShare(b1, b1.nodes[0]) < 0.01);
    assert.ok(near(mm.barStrikeShare(b1, 0), 1, 1e-6) && near(mm.barStrikeShare(b1, 1), 1, 1e-6));
  });
  it('chimes of one diameter: a bar half as long rings four times higher (two octaves)', () => {
    assert.ok(near(mm.chimePitchRatio(150, 300), 4) && near(mm.octaves(4), 2));
  });
  it('the free disc: (2,0) lowest, (0,1) next; a stroke at the exact centre drives only ring-shaped shapes', () => {
    assert.equal(mm.DISC_SHAPES[0].label, '(2,0)');
    assert.equal(mm.DISC_SHAPES[1].label, '(0,1)');
    for (const d of mm.DISC_SHAPES) {
      const s = mm.discStrikeShare(d, 0);
      if (d.n > 0) assert.ok(s < 1e-9, d.label);
      else assert.ok(s > 0.5, d.label);
    }
    assert.ok(mm.shapesDriven(0.25) > mm.shapesDriven(0), 'off-centre drives more shapes than the centre');
  });
  it('the (0,1) shape’s still ring sits where J0 first crosses zero (2.405 / k)', () => {
    const d = mm.DISC_SHAPES[1];
    assert.ok(near(mm.discStillRings(d)[0], 2.405 / d.k, 3e-3));
  });
});

describe('I06a triangle: the research’s size and hold', () => {
  it('an 8 in side of ½ in rod, both sourced; equilateral; the centre is P0', () => {
    assert.ok(near(tri.SIDE, 8 * IN) && near(tri.ROD_D, 0.5 * IN));
    assert.equal(tri.TRI.side.prov.kind, 'sourced');
    assert.equal(tri.TRI.rod.prov.kind, 'sourced');
    const { top, open, closed } = tri.HELD;
    const d = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    assert.ok(near(d(top, open), tri.SIDE, 1e-6) && near(d(top, closed), tri.SIDE, 1e-6) && near(d(open, closed), tri.SIDE, 1e-6));
    assert.ok(near((top[1] + open[1] + closed[1]) / 3, tri.P0.y));
  });
  it('held: the base is level at the bottom, the open corner on the player’s LEFT (−z)', () => {
    assert.ok(near(tri.HELD.open[1], tri.HELD.closed[1]) && tri.HELD.top[1] < tri.HELD.open[1]);
    assert.ok(tri.HELD.open[0] < 0 && tri.HELD.closed[0] > 0);
  });
  it('the rod is one bar: three pieces, the open corner’s gap left out; strike spots on the right pieces', () => {
    const L = tri.rodLengths(tri.HELD);
    assert.equal(L.length, 3);
    assert.ok(near(L.reduce((a: number, b: number) => a + b, 0), 3 * tri.SIDE - tri.GAP, 1e-6));
    assert.ok(tri.STRIKE_S.base < L[0] / tri.ROD_LEN && tri.STRIKE_S.corner < L[0] / tri.ROD_LEN);
    assert.ok(tri.STRIKE_S.side > L[0] / tri.ROD_LEN && tri.STRIKE_S.side < (L[0] + L[1]) / tri.ROD_LEN);
  });
  it('mounted: the closed side level on top, the open corner at the bottom, the same centre', () => {
    const { top, closed, open } = tri.MOUNTED;
    assert.ok(near(top[1], closed[1]) && open[1] > top[1]);
    assert.ok(near((top[1] + open[1] + closed[1]) / 3, tri.P0.y));
  });
  it('posture numbers are flagged placeholders', () => {
    for (const k of ['gap', 'holdH', 'eyeH', 'line', 'beaterD'] as const) assert.equal(tri.TRI[k].placeholder, true, k);
  });
  it('three rod solids per hold; the clip above the top corner; the starting points on the open corner’s side', () => {
    const held = I06A_LESSON.model.parts.filter((p: { variants?: string[]; solid?: unknown; id: string }) => p.solid && p.variants?.includes('held') && /^tri\.(base|side|oside)$/.test(p.id));
    assert.equal(held.length, 3);
    assert.ok(triG.CLIP_Y + triG.CLIP.h < tri.HELD.top[1]);
    assert.ok(triG.SIDE_DIR.z < 0 && triG.SIDE_DIR.y < 0, 'to the player’s left and a little above');
  });
});

describe('suspended metal: every lesson validates; every start is clear, in its zone, in its band', () => {
  for (const lesson of LESSONS_UNDER_TEST) {
    it(`${lesson.id}: validateLesson is clean`, () => assert.deepEqual(validateLesson(lesson, MIC_TYPES), []));
    it(`${lesson.id}: each start is clear, inside its zone and drawn band, outside every keep-out, ≥ 30 cm from the instrument`, () => {
      const m = lesson.model;
      for (const z of lesson.zones) {
        const variants = z.requires?.variant ? [z.requires.variant] : m.variants.map((v: { id: string }) => v.id);
        const t = z.requires?.micTypeIds?.[0] ?? lesson.micTypeIds[0];
        for (const v of variants) {
          const scene = compileScene(m, v);
          assert.equal(checkAssembly(scene, z.start, micBodyOf(MIC_TYPES[t])), null, `${z.id} (${v})`);
          assert.ok(inZone(z, { scene, surfaces: m.surfaces, lines: m.lines, variant: v, micTypeId: t, mount: 'stand' }, z.start), `${z.id} (${v})`);
        }
        const p = z.start.p;
        if (z.draw) {
          assert.ok(z.draw.side?.some((d: { poly: [number, number][] }) => inPoly(d.poly, p.x, p.y)), `${z.id}: side band`);
          assert.ok(z.draw.top?.some((d: { poly: [number, number][] }) => inPoly(d.poly, p.x, p.z)), `${z.id}: top band`);
        }
        assert.ok(z.distance.min >= 12 * IN - 5, `${z.id}: under the 30 cm floor`);
      }
    });
    it(`${lesson.id}: six quick-check items, at least one critical`, () => {
      assert.equal(lesson.diagnostic.length, 6);
      assert.ok(lesson.diagnostic.some((q: { critical?: boolean }) => q.critical));
    });
    it(`${lesson.id}: item-writing rules (LESSON_JOURNEY §5)`, () => itemRules(lesson));
    it(`${lesson.id}: no maker, model or person from the research in learner text`, () => {
      assert.deepEqual(learnerStrings(lesson).filter((s) => RESEARCH_NAMES.test(s) || /\b(Grover|Meinl|Paiste|Zildjian|Son Vo|PAS)\b/.test(s)), []);
    });
    it(`${lesson.id}: registered in Lab 2 on its own line, served, and the lab is listed`, () => {
      const meta = LESSONS.find((l: { id: string }) => l.id === lesson.id);
      assert.ok(meta && meta.labId === 'percussion');
      assert.equal(lessonById(lesson.id), lesson);
      assert.match(read(`${MIKING}/data/registry.ts`), new RegExp(`\\n  \\{ id: '${lesson.id}', [^\\n]*\\},\\n`));
      assert.ok(readyLabs().some((l: { id: string }) => l.id === 'percussion'));
    });
  }
});

describe('suspended metal: silent and still', () => {
  it('no file in the family plays a sound or runs a loop', () => {
    const dirs = ['lessons/shared/metal', 'lessons/i06aTriangle'];
    for (const d of dirs) {
      for (const f of readdirSync(join(ROOT, MIKING, d))) {
        const text = read(`${MIKING}/${d}/${f}`);
        assert.doesNotMatch(text, /withRepeat|useFrameCallback|setInterval|expo-av|expo-audio|startFenced/, `${d}/${f}`);
      }
    }
  });
});
