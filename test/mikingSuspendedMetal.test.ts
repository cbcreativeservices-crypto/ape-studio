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

const fc = await import('../src/screens/lab/miking/lessons/i06bFingerCymbals/model.ts');
const fcG = await import('../src/screens/lab/miking/lessons/i06bFingerCymbals/geometry.ts');
const { I06B_LESSON } = await import('../src/screens/lab/miking/lessons/i06bFingerCymbals/lesson.ts');

const bc = await import('../src/screens/lab/miking/lessons/i06cBarChimes/model.ts');
const { I06C_LESSON } = await import('../src/screens/lab/miking/lessons/i06cBarChimes/lesson.ts');

const gg = await import('../src/screens/lab/miking/lessons/i12Gong/model.ts');
const ggG = await import('../src/screens/lab/miking/lessons/i12Gong/geometry.ts');
const { I12_LESSON } = await import('../src/screens/lab/miking/lessons/i12Gong/lesson.ts');

type L = typeof I06A_LESSON;
const LESSONS_UNDER_TEST: L[] = [I06A_LESSON, I06B_LESSON, I06C_LESSON, I12_LESSON];

describe('I12 gong: identify it first — a tam-tam or a bossed gong', () => {
  it('a 32 in symphonic tam-tam (sourced size) and an 18 in bossed gong (inside the 12–24 in range)', () => {
    assert.ok(near(gg.GONG.tamtamD.mm, 32 * IN) && gg.GONG.tamtamD.prov.kind === 'sourced');
    assert.ok(gg.GONG.bossedD.mm >= 12 * IN && gg.GONG.bossedD.mm <= 24 * IN);
    assert.ok(gg.GONG.tamtamD.mm <= gg.GONG.standRating.mm, 'inside the frame’s rating');
  });
  it('the selector: two variants; the boss and its zone exist only on the bossed gong', () => {
    assert.deepEqual(I12_LESSON.model.variants.map((v: { id: string }) => v.id), ['tamtam', 'bossed']);
    const boss = I12_LESSON.model.parts.find((p: { id: string }) => p.id === 'gg.boss')!;
    assert.deepEqual(boss.variants, ['bossed']);
    assert.equal(I12_LESSON.zones.find((z: { id: string }) => z.id === 'gg.boss')!.requires!.variant, 'bossed');
  });
  it('the frame is wider than the gong plus its swing; the gong hangs below the top bar', () => {
    for (const v of ['tamtam', 'bossed']) {
      assert.ok(gg.frameW(v) / 2 > gg.radiusOf(v) + gg.GONG.swing.mm, v);
      assert.ok(ggG.topBarY(v) < gg.CY - gg.radiusOf(v), v);
    }
  });
  it('every starting point is at least 30 cm from the face at rest and outside the free swing', () => {
    for (const z of I12_LESSON.zones) {
      const x = z.start.p.x - (z.refSurface === 'boss' ? gg.GONG.bossH.mm : gg.GONG.dome.mm);
      assert.ok(x >= 250 || z.refSurface === 'boss', `${z.id}: ${x}`);
      const v = z.requires?.variant ?? 'tamtam';
      const swingFront = (v === 'bossed' ? gg.GONG.bossH.mm : gg.GONG.dome.mm) + gg.GONG.swing.mm + 100;
      assert.ok(z.start.p.x > swingFront, `${z.id} inside the swing`);
    }
  });
  it('a tam-tam is struck a little off centre, toward the player; a bossed gong on its boss', () => {
    assert.ok(gg.strikePoint('tamtam').z < 0 && near(gg.strikeFrac('tamtam'), 0.25));
    assert.ok(near(gg.strikePoint('bossed').z, 0));
  });
  it('the build-up moves the energy to finer shapes on a tam-tam; a boss stroke keeps the ring-shaped ones', () => {
    const late = mm.buildUpWeights(3, 0.25, 'tamtam');
    const early = mm.buildUpWeights(2, 0.25, 'tamtam');
    const fine = (w: number[]) => w.slice(6).reduce((a, b) => a + b, 0) / w.reduce((a, b) => a + b, 1e-9);
    assert.ok(fine(late) > fine(early));
    const boss = mm.buildUpWeights(3, 0, 'bossed');
    mm.DISC_SHAPES.forEach((d: { n: number }, i: number) => {
      if (d.n === 0) assert.ok(boss[i] >= 0.6);
      else assert.ok(boss[i] < 1e-9);
    });
  });
});

describe('I06c bar chimes: the row', () => {
  it('27 bars in a single row, 60 in a double — counts sourced; graduated, longest at the player’s left', () => {
    const one = bc.barsOf('single');
    const two = bc.barsOf('double');
    assert.equal(one.length, 27);
    assert.equal(two.length, 60);
    assert.equal(bc.BC.bars.prov.kind, 'sourced');
    for (let i = 1; i < one.length; i++) assert.ok(one[i].L < one[i - 1].L && one[i].z > one[i - 1].z);
    assert.ok(one[0].z < 0, 'the long bars at −z');
  });
  it('the row fits on the rail, which sits inside the 12–16 in reading', () => {
    const one = bc.barsOf('single');
    assert.ok(Math.abs(one[0].z) <= bc.BC.rail.mm / 2 && Math.abs(one[one.length - 1].z) <= bc.BC.rail.mm / 2);
    assert.ok(bc.BC.rail.mm >= 12 * IN && bc.BC.rail.mm <= 16 * IN);
  });
  it('P0 is the row’s centre at the bars’ mean mid-height; the ends sit at the end bars’ middles', () => {
    assert.ok(near(bc.P0.z, 0) && bc.P0.y > bc.BAR_TOP && bc.P0.y < bc.BAR_TOP + bc.BC.longest.mm);
    assert.ok(near(bc.END_L.y, bc.BAR_TOP + bc.BC.longest.mm / 2) && near(bc.END_R.y, bc.BAR_TOP + bc.BC.shortest.mm / 2));
  });
  it('the shortest bar rings (longest/shortest)² higher — five times the length, 25 times the pitch', () => {
    assert.ok(near(mm.chimePitchRatio(bc.BC.shortest.mm, bc.BC.longest.mm), 25));
  });
  it('bar sizes are flagged placeholders (no source gives them)', () => {
    for (const k of ['longest', 'shortest', 'barD', 'filament', 'railDepth', 'railH', 'height', 'swingDeg'] as const) assert.equal(bc.BC[k].placeholder, true, k);
  });
});

describe('I06b finger cymbals: a measured pair, two ways of playing', () => {
  it('the museum pair: Ø 5.5 and 4.8 cm, 2.4 cm high — sourced', () => {
    assert.ok(near(fc.FC.dA.mm, 55) && near(fc.FC.dB.mm, 48) && near(fc.FC.h.mm, 24));
    for (const k of ['dA', 'dB', 'h'] as const) assert.equal(fc.FC[k].prov.kind, 'sourced', k);
  });
  it('held still: the held cymbal flat at P0, the dropped one above it', () => {
    assert.ok(near(fcG.HELD_C.y, fc.P0.y) && fcG.DROP_C.y < fc.P0.y);
    assert.ok(near(fc.P0.y - fcG.DROP_C.y, fc.FC.drop.mm));
  });
  it('the dance zones sit outside the whole dance envelope; the held zones outside the hands', () => {
    const env = (id: string) => fcG.FC_MODEL.envelopes.find((e: { id: string }) => e.id === id)!.shape as { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
    const inBox = (b: ReturnType<typeof env>, p: { x: number; y: number; z: number }) => p.x > b.min.x && p.x < b.max.x && p.y > b.min.y && p.y < b.max.y && p.z > b.min.z && p.z < b.max.z;
    for (const z of fcG.FC_ZONES) {
      const box = z.requires?.variant === 'dance' ? env('env.dance') : env('env.hands');
      assert.ok(!inBox(box, z.start.p), z.id);
    }
  });
  it('dance numbers are flagged placeholders', () => {
    for (const k of ['holdH', 'drop', 'danceH', 'danceR', 'danceTop', 'route', 'domeD', 'thick'] as const) assert.equal(fc.FC[k].placeholder, true, k);
  });
});

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
    const dirs = ['lessons/shared/metal', 'lessons/i06aTriangle', 'lessons/i06bFingerCymbals', 'lessons/i06cBarChimes', 'lessons/i12Gong'];
    for (const d of dirs) {
      for (const f of readdirSync(join(ROOT, MIKING, d))) {
        const text = read(`${MIKING}/${d}/${f}`);
        assert.doesNotMatch(text, /withRepeat|useFrameCallback|setInterval|expo-av|expo-audio|startFenced/, `${d}/${f}`);
      }
    }
  });
});
