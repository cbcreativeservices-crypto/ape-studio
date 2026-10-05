/**
 * Miking Labs, Lab 2 — the mallet keyboards (I07 vibraphone, I08 marimba,
 * I09 xylophone, I10 glockenspiel): the shared mallet-bar family and the
 * lesson data, checked against the relationships the research states.
 *
 *   • every lesson validates, has the 9 journey pages, is registered in
 *     Lab 2 (percussion) in order, with its own art and the family's pages;
 *   • bar counts per printed range; the end widths are the printed ones; the
 *     naturals row fits the frame; the longest bar fits the low-end depth;
 *   • the resonators' acoustic lengths are the quarter-wave table
 *     (vibraphone/GEOMETRY_PROPOSAL.md §A4, A = 442 Hz, 20 °C) to 0.1 mm; the
 *     marimba's C2 quarter wave is taller than its bar height, so its bass
 *     is boxes; drawn pipes are shorter than L_ac, above the floor, and no
 *     wider than the bar pitch; "only essential accidental resonators";
 *   • the plain bar's shapes: ratios 2.76 / 5.40, still points at 0.224;
 *   • the published pair: 457.2 mm above, 609.6 mm apart; the coincident
 *     pair's grilles together at 135°, its bisector straight down, no path
 *     difference for any bar; the spaced pair's path difference at an end;
 *   • every zone's start pose is inside its zone and collision-free for
 *     every mic type and variant it allows; every one-mic zone starts above
 *     the mallets' travel; the glockenspiel's close example lies inside it;
 *   • a stand always stands on the audience side, outside the frame;
 *   • every source key resolves; the item-writing rules hold.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { itemRules } from './_mikingItemRules.ts';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { lessonById } = await import('../src/screens/lab/miking/data/lessons.ts');
const { LESSONS } = await import('../src/screens/lab/miking/data/registry.ts');
const { MIC_TYPES } = await import('../src/screens/lab/miking/data/micTypes.ts');
const { validateLesson, micBodyOf } = await import('../src/screens/lab/miking/engine/model/validate.ts');
const { checkAssembly, compileScene, assembly } = await import('../src/screens/lab/miking/engine/geometry/collision.ts');
const { inZone } = await import('../src/screens/lab/miking/engine/geometry/zones.ts');
const { aimVec, angleBetween } = await import('../src/screens/lab/miking/engine/geometry/vec.ts');
const { pathDiffMm } = await import('../src/screens/lab/miking/engine/physics/twoMic.ts');
const { PAGE_IDS } = await import('../src/screens/lab/miking/engine/model/types.ts');
const S = await import('../src/screens/lab/miking/lessons/shared/mallets/malletSpec.ts');
const M = await import('../src/screens/lab/miking/lessons/shared/mallets/malletModel.ts');
const C = await import('../src/screens/lab/miking/lessons/shared/mallets/content.ts');
const { VIBE_GEOM } = await import('../src/screens/lab/miking/lessons/i07Vibraphone/geometry.ts');
const { MARIMBA_GEOM } = await import('../src/screens/lab/miking/lessons/i08Marimba/geometry.ts');
const { XYLO_GEOM } = await import('../src/screens/lab/miking/lessons/i09Xylophone/geometry.ts');
const { GLOCK_GEOM } = await import('../src/screens/lab/miking/lessons/i10Glockenspiel/geometry.ts');
const { CLOSE_EXAMPLE } = await import('../src/screens/lab/miking/lessons/i10Glockenspiel/model.ts');

type L = NonNullable<ReturnType<typeof lessonById>>;
const IDS = ['I07', 'I08', 'I09', 'I10'] as const;
const GEOMS = { I07: VIBE_GEOM, I08: MARIMBA_GEOM, I09: XYLO_GEOM, I10: GLOCK_GEOM } as const;
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const SRC_DIRS = ['vibraphone', 'marimba', 'xylophone', 'glockenspiel', 'hihat', 'snare', 'overheads'];
const KEYS = (() => {
  const keys = new Set<string>();
  const text = SRC_DIRS.filter((d) => existsSync(join(process.cwd(), `docs/labs/miking/${d}/SOURCES.md`)))
    .map((d) => read(`docs/labs/miking/${d}/SOURCES.md`))
    .join('\n') + read('docs/labs/miking/SOURCES_SHARED.md');
  // A row's first cell may name several keys ("YMH-YG2500 / YMH-YG2500-OM").
  for (const m of text.matchAll(/^\| ([A-Z0-9][A-Z0-9 ,/()-]+?) \|/gm)) for (const k of m[1].split(/[,/]/)) keys.add(k.trim().split(' ')[0]);
  return keys;
})();
const lesson = (id: string): L => {
  const l = lessonById(id);
  assert.ok(l, id);
  return l!;
};

describe('the four mallet lessons validate and are registered in Lab 2', () => {
  it('registered as percussion lessons, in order, with the family art and pages', () => {
    const rows = LESSONS as readonly { id: string; labId: string }[];
    const at = IDS.map((id) => rows.findIndex((l) => l.id === id));
    assert.ok(at.every((i) => i >= 0), `${at}`);
    assert.deepEqual([...at].sort((a, b) => a - b), at, 'I07, I08, I09, I10 in order');
    for (const id of IDS) assert.equal(rows.find((l) => l.id === id)!.labId, 'percussion');
    const art = read('src/screens/lab/miking/lessons/shared/mallets/artRegistry.ts');
    for (const id of IDS) assert.match(art, new RegExp(`\\b${id}: ${id}_ART\\b`));
    assert.match(read('src/screens/lab/miking/data/lessonArt.ts'), /Object\.assign\(ART, MALLET_ART\)/);
    const pages = read('src/screens/lab/miking/lessons/shared/mallets/pages.ts');
    assert.match(pages, /sound: MSound/);
    assert.match(pages, /twoMic: MTwoMic/);
  });
  for (const id of IDS) {
    it(`${id}: validates, nine pages, the item rules`, () => {
      const l = lesson(id);
      assert.deepEqual(validateLesson(l, MIC_TYPES), []);
      for (const p of PAGE_IDS) assert.ok(l.pages[p], p);
      assert.equal(l.labId, 'percussion');
      itemRules(l);
      assert.equal(l.symptoms.length, 6);
      assert.equal(l.diagnostic.length, 6);
      assert.ok(l.diagnostic.some((d) => d.critical), 'a critical hearing item');
    });
    it(`${id}: every source key resolves to a SOURCES table`, () => {
      const l = lesson(id);
      const used = new Set<string>();
      for (const z of l.zones) used.add(z.src);
      for (const p of l.model.parts) if (p.prov.kind === 'sourced' || p.prov.kind === 'trial') used.add(p.prov.src);
      for (const f of l.orient) used.add(f.src);
      for (const k of used) assert.ok(KEYS.has(k), `${id}: ${k}`);
    });
  }
});

describe('the mallet-bar family: keyboards from the printed ranges', () => {
  const counts: Record<string, [number, number]> = {
    vibe: [22, 15],
    marimba50: [36, 25],
    marimba43: [31, 21],
    xyloYX: [26, 18],
    xyloConcert: [29, 20],
    glockPedal: [24, 17],
    glockCase: [19, 13],
  };
  for (const [name, row] of Object.entries(S.ROWS)) {
    it(`${name}: bar counts, end widths, the frame`, () => {
      const L = S.layoutOf(row as never);
      assert.deepEqual([L.naturals.length, L.accidentals.length], counts[name]);
      assert.equal(L.bars.length, row.highKey - row.lowKey + 1);
      // The low end at +x: the first natural is the lowest key, at the widest.
      assert.equal(L.naturals[0].key, row.lowKey);
      assert.ok(Math.abs(L.naturals[0].w - row.wLow.mm) < 1e-9);
      assert.ok(Math.abs(L.naturals[L.naturals.length - 1].w - row.wHigh.mm) < 1e-9);
      assert.ok(L.naturals[0].x > L.naturals[L.naturals.length - 1].x, 'low end at +x');
      assert.ok(L.span.hi - L.span.lo < row.Lframe.mm, 'the naturals row fits the frame');
      assert.ok(Math.abs(L.zNat) + L.naturals[0].L / 2 <= row.Dlow.mm / 2, 'the longest natural inside the low-end depth');
      assert.ok(L.zAcc + L.accidentals[0].L / 2 <= row.Dlow.mm / 2, 'the longest accidental inside the low-end depth');
      for (const b of L.accidentals) assert.ok(b.yTop < L.yNat, 'accidentals sit higher');
      // Every accidental between two naturals; none overlaps another accidental.
      const acc = [...L.accidentals].sort((a, b) => a.x - b.x);
      for (let i = 1; i < acc.length; i++) assert.ok(acc[i].x - acc[i].w / 2 > acc[i - 1].x + acc[i - 1].w / 2, `${acc[i].note}`);
    });
  }
  it('names and keys: F3 = 33, C2 = 16, E8 = 92 (88-key scale)', () => {
    assert.equal(S.noteName(33), 'F3');
    assert.equal(S.noteName(16), 'C2');
    assert.equal(S.noteName(92), 'E8');
    assert.equal(S.noteName(34), 'F♯3');
    assert.ok(Math.abs(S.freqHz(49) - 442) < 1e-9);
  });
});

describe('resonators: a quarter wavelength (DERIVED), drawn honestly', () => {
  const TABLE: [number, number][] = [
    [16, 1305.9],
    [25, 776.5],
    [28, 653.0],
    [33, 489.2],
    [40, 326.5],
    [45, 244.6],
    [52, 163.2],
    [57, 122.3],
    [64, 81.6],
    [69, 61.1],
    [76, 40.8],
    [88, 20.4],
    [92, 16.2],
  ];
  it('L = c ÷ 4f matches the proposal’s table to 0.1 mm', () => {
    for (const [k, mm] of TABLE) assert.ok(Math.abs(S.quarterWaveMm(k) - mm) < 0.1, `${S.noteName(k)} ${S.quarterWaveMm(k)} vs ${mm}`);
  });
  it('the marimba’s C2 quarter wave is taller than its bars are high: boxes C2–F2, tubes above', () => {
    const L = S.layoutOf(S.ROWS.marimba50);
    assert.ok(S.quarterWaveMm(16) > S.ROWS.marimba50.hBars.mm);
    for (const t of L.tubes) assert.equal(t.kind, t.key <= 21 ? 'helmholtz' : 'tube', S.noteName(t.key));
    assert.equal(L.tubes.filter((t) => t.kind === 'helmholtz').length, 6, 'C2, C♯2, D2, D♯2, E2, F2');
  });
  for (const [name, row] of Object.entries(S.ROWS)) {
    it(`${name}: pipes shorter than L_ac, above the floor, no wider than the bar pitch`, () => {
      const L = S.layoutOf(row as never);
      if (row.res.kind === 'none') return assert.equal(L.tubes.length, 0);
      for (const t of L.tubes) {
        assert.ok(t.yBot < 0 && t.yTop < t.yBot, S.noteName(t.key));
        if (t.kind === 'tube') {
          assert.ok(t.yBot - t.yTop < t.lAc, 'the end correction makes the pipe shorter');
          const b = L.bars.find((q) => q.key === t.key)!;
          assert.ok(t.d <= b.w + 6 - 4 + 1e-9, 'within the bar pitch');
        }
      }
      if (row.res.accidentals === 'essential') assert.ok(L.tubes.length < L.bars.length, 'only some accidentals have a tube');
      else assert.equal(L.tubes.length, L.bars.length);
    });
  }
});

describe('the plain bar (free–free beam)', () => {
  it('ratios 1 : 2.76 : 5.40 and the first shape’s still points at 0.224 L', () => {
    assert.ok(Math.abs(S.BAR_RATIOS[1] - 2.7565) < 1e-3);
    assert.ok(Math.abs(S.BAR_RATIOS[2] - 5.4039) < 1e-3);
    const n = S.barNodes(0);
    assert.equal(n.length, 2);
    assert.ok(Math.abs(n[0] - S.NODE_FRAC) < 1e-3 && Math.abs(n[1] - (1 - S.NODE_FRAC)) < 1e-3);
    assert.equal(S.barNodes(1).length, 3);
    assert.ok(Math.abs(S.barNodes(1)[1] - 0.5) < 1e-3, 'shape 2 is still at the middle');
    assert.ok(S.barStrikeShare(1, 0.5) < 0.01, 'a strike in the middle leaves shape 2 quiet');
    assert.ok(S.barStrikeShare(0, 0.5) > 0.5);
  });
});

describe('two mics: the published pair, spaced or coincident', () => {
  for (const id of ['I07', 'I08', 'I09'] as const) {
    it(`${id}: spaced 609.6 apart at 457.2 above; coincident at one point, 135°, bisector down`, () => {
      const G = GEOMS[id];
      const pairs = C.shurePairs('mlSdc', G.barY);
      const sp = pairs.find((p) => p.id === 'spaced')!;
      const xy = pairs.find((p) => p.id === 'xy')!;
      assert.ok(Math.abs(sp.B.p.x - sp.A.p.x - 609.6) < 1e-9);
      assert.ok(Math.abs(G.barY - sp.A.p.y - 457.2) < 1e-9);
      assert.deepEqual(xy.A.p, xy.B.p, 'grilles together');
      const a = aimVec(xy.A.az, xy.A.el);
      const b = aimVec(xy.B.az, xy.B.el);
      assert.ok(Math.abs(angleBetween(a, b) - 135) < 1e-6);
      const bis = { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
      assert.ok(angleBetween(bis, M.DOWN) < 1e-6, 'the pair looks straight down');
      const L = G.layouts[Object.keys(G.layouts)[0]];
      for (const bar of L.bars) assert.ok(Math.abs(pathDiffMm({ x: bar.x, y: bar.yTop, z: bar.z }, xy.A.p, xy.B.p)) < 1e-9);
      const low = L.naturals[0];
      assert.ok(Math.abs(pathDiffMm({ x: low.x, y: low.yTop, z: low.z }, sp.A.p, sp.B.p)) > 50, 'an end bar: two arrival times');
      // Both pairs clear of everything, above the mallets.
      const scene = compileScene(lesson(id).model, lesson(id).model.defaultVariant);
      const body = micBodyOf(MIC_TYPES.mlSdc);
      for (const p of [sp, xy]) for (const pose of [p.A, p.B]) assert.equal(checkAssembly(scene, pose, body), null);
    });
  }
  it('I10: the glockenspiel’s pairs clear the mallets (no published dimension)', () => {
    const G = GLOCK_GEOM;
    const scene = compileScene(lesson('I10').model, 'pedal');
    const body = micBodyOf(MIC_TYPES.mlSdc);
    for (const p of C.glockPairs('mlSdc', G.barY)) for (const pose of [p.A, p.B]) assert.equal(checkAssembly(scene, pose, body), null);
  });
});

describe('starting points and keep-outs', () => {
  for (const id of IDS) {
    it(`${id}: every zone start is inside and clear, for every mic type and variant it allows`, () => {
      const l = lesson(id);
      for (const z of l.zones) {
        const variants = z.requires?.variants ?? l.model.variants.map((v) => v.id);
        for (const v of variants) {
          const scene = compileScene(l.model, v);
          for (const t of z.requires?.micTypeIds ?? l.micTypeIds) {
            const body = micBodyOf(MIC_TYPES[t]);
            assert.equal(checkAssembly(scene, z.start, body), null, `${z.id} ${v} ${t}`);
            assert.ok(inZone(z, { scene, surfaces: l.model.surfaces, lines: l.model.lines, variant: v, micTypeId: t, mount: MIC_TYPES[t].mount }, z.start), `${z.id} ${v} ${t}`);
          }
        }
      }
      // Two different zones in every variant (the placement credit needs two).
      for (const v of l.model.variants) assert.ok(l.zones.filter((z) => !z.requires?.variants || z.requires.variants.includes(v.id)).length >= 2, v.id);
    });
    it(`${id}: a mic's stand stands on the audience side, outside the frame`, () => {
      const l = lesson(id);
      const G = GEOMS[id];
      for (const z of l.zones) {
        const v = z.requires?.variants?.[0] ?? l.model.defaultVariant;
        const segs = assembly(compileScene(l.model, v), z.start, micBodyOf(MIC_TYPES.mlSdc));
        const stand = segs.find((s) => s.piece === 'stand');
        assert.ok(stand, z.id);
        assert.ok(stand!.a.z > G.layouts[v].halfDepth(stand!.a.x) || stand!.a.z > G.layouts[v].zFar, `${z.id}: ${stand!.a.z}`);
      }
    });
  }
  it('every one-mic zone over the bars starts above the mallets’ travel', () => {
    for (const id of ['I07', 'I08', 'I09'] as const) {
      const l = lesson(id);
      const G = GEOMS[id];
      const one = l.zones.find((z) => z.id.endsWith('.one'))!;
      const row = G.layouts[l.model.defaultVariant].row;
      assert.ok(one.distance.min > row.malletH.mm, `${id}: ${one.distance.min} vs ${row.malletH.mm}`);
      assert.ok(M.SHURE_H > row.malletH.mm, 'the published 457.2 clears the drawn mallet height');
    }
  });
  it('the glockenspiel’s close example (4–6 in) lies inside the mallets’ travel: a mic there is stopped', () => {
    const l = lesson('I10');
    const G = GLOCK_GEOM;
    const row = G.layouts.pedal.row;
    assert.ok(Math.abs(CLOSE_EXAMPLE.min - 101.6) < 1e-9 && Math.abs(CLOSE_EXAMPLE.max - 152.4) < 1e-9);
    assert.ok(CLOSE_EXAMPLE.max < row.malletH.mm);
    const scene = compileScene(l.model, 'pedal');
    const hit = checkAssembly(scene, { p: { x: 0, y: G.barY - 127, z: 0 }, az: 0, el: -90 }, micBodyOf(MIC_TYPES.mlSdc));
    assert.ok(hit && hit.partId.startsWith('env.mallets'), JSON.stringify(hit));
    assert.ok(!l.zones.some((z) => z.distance.max <= 152.4 && z.refSurface === 'bars'), 'never a zone a mic can rest in');
  });
  it('the case glockenspiel keeps the bars on the same plane: the floor moves', () => {
    const m = lesson('I10').model;
    assert.equal(m.floorByVariant?.pedal, 0);
    assert.ok(Math.abs((m.floorByVariant?.case ?? 0) - (GLOCK_GEOM.barY + S.ROWS.glockCase.hBars.mm)) < 1e-9);
  });
});
