/**
 * Stage Plot and Channel Designer — ROUND 3 OF THE ADDED SYMBOLS (owner
 * 2026-11-13: "build the remaining held items too"):
 *   1. the German timpani setup: its own layout (the largest drum at the
 *      timpanist's right), chosen where the timpani are added and in the
 *      details; screen art, print symbol, TURN, label room and package words
 *      follow it; an old set is American, as it always was;
 *   2. choir singers that do not overlap at 0.44 m: the house figure's
 *      narrow build (400 mm across); the riser units and the counts stay;
 *   3. the hand harmonium matched to one named model, the Bina No. 23B
 *      (3¼ octave), at its listed 21 1/2 × 12 in;
 *   4. the choir's size printed: "Choir (24 singers, 3 rows)" beside its
 *      symbol, "at the choir (24 singers, 3 rows)" in the input list, and its
 *      riser units in the stage notes;
 *   5. Wenger's published capacity quoted word for word in the code;
 *   6. the timpani footprint: the drums and the stool, 2.6 × 1.52 m.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const SY = R(await import('../src/features/stageplot/spSymbols.ts'));
const { SP_TIMPANI, SP_TIMPANI_GERMAN, spTimpaniLayout, spTimpaniGermanSymbol, spSymbol, spObjectSymbol, spPlacedShapes, spObjectBoxM, SP_HARMONIUM, SP_HARMONIUM_KNOBS, spKeySymbol } = SY;
const { SP_PACKAGES, spTimpaniPackages, SP_TIMPANI_SETUP_WORDS } = R(await import('../src/features/stageplot/spCatalog.ts'));
const CH = R(await import('../src/features/stageplot/spChoir.ts'));
const { spChoirLayout, spChoirCountWords, spChoirRiserNote, SP_RISER_UNIT_W } = CH;
const { spNewProject, spAddObject, spMigrate, spUpdateObject, spDuplicateObject, spAddPackage } = R(await import('../src/features/stageplot/spModel.ts'));
const { spPlotDoc, spPlotScale, spLabelBlock, SP_PLOT_NOMINAL_W, spBuildSnapshot, spBuildDoc } = R(await import('../src/features/stageplot/spPacket.ts'));
const { spPdfBytes } = R(await import('../src/features/stageplot/spPdf.ts'));
const { stagePackagesFor, stageTimpaniPackagesFor, stageAddWithPackage } = R(await import('../src/screens/lab/stageplot/stage/stageLinks.ts'));
const { stageArtSize } = R(await import('../src/screens/lab/stageplot/stage/stageGeom.ts'));
const { TimpaniSetTop, TOP_ART_R2 } = R(await import('../src/screens/lab/stageplot/stage/topArtR2.tsx'));
const { ChoirTop } = R(await import('../src/screens/lab/stageplot/stage/topArtWorld.tsx'));
const { FIGURE_ABOVE_W_MM, FIGURE_ABOVE_NARROW_W_MM } = R(await import('../src/features/lab/figureAboveSvg.tsx'));

const src = (f: string) => readFileSync(join(process.cwd(), f), 'utf8').replace(/\r\n/g, '\n');
const STAGE = 'src/screens/lab/stageplot/stage';
const NOW = 1_800_000_000_000;

/* ── measuring a drawing (as the round-2 test does) ── */

type Mat = [number, number, number, number, number, number];
const UNIT: Mat = [1, 0, 0, 1, 0, 0];
const mul = (m: Mat, n: Mat): Mat => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
const at = (m: Mat, x: number, y: number): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
function transformOf(t: unknown): Mat {
  let m = UNIT;
  for (const [, fn, args] of String(t ?? '').matchAll(/(\w+)\(([^)]*)\)/g)) {
    const a = args!
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (fn === 'translate') m = mul(m, [1, 0, 0, 1, a[0]!, a[1] ?? 0]);
    else if (fn === 'scale') {
      assert.ok(a[0]! > 0 && (a[1] ?? a[0]!) > 0, 'never a reflected drawing');
      m = mul(m, [a[0]!, 0, 0, a[1] ?? a[0]!, 0, 0]);
    } else if (fn === 'rotate') {
      const r = (a[0]! * Math.PI) / 180;
      const rot: Mat = [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0];
      m = a.length === 3 ? mul(mul(mul(m, [1, 0, 0, 1, a[1]!, a[2]!]), rot), [1, 0, 0, 1, -a[1]!, -a[2]!]) : mul(m, rot);
    } else throw new Error(`a transform this test cannot measure: ${fn}`);
  }
  return m;
}
type Mark = { shape: string; fill: string; shadow: boolean; x0: number; x1: number; y0: number; y1: number; props?: Record<string, unknown> };
type El = { type: unknown; props: Record<string, unknown> & { children?: unknown } };
const STUB = (globalThis as { __mikingStub?: unknown }).__mikingStub;
function marksOf(node: unknown, m: Mat = UNIT, out: Mark[] = []): Mark[] {
  if (node == null || typeof node === 'boolean') return out;
  if (Array.isArray(node)) {
    for (const n of node) marksOf(n, m, out);
    return out;
  }
  const el = node as El;
  const p = el.props ?? {};
  if (typeof el.type === 'function' && (el.type as { name?: string }).name === 'FigureAboveSvg') {
    // the figure's REAL width: its build's
    const wmm = p.build === 'narrow' ? FIGURE_ABOVE_NARROW_W_MM : FIGURE_ABOVE_W_MM;
    const half = (wmm / 2) * Number(p.pxPerMm);
    const [cx, cy] = at(m, Number(p.x), Number(p.y));
    out.push({ shape: 'figure', fill: 'figure', shadow: false, x0: cx - half, x1: cx + half, y0: cy - half * 0.6, y1: cy + half * 0.6, props: p });
    return out;
  }
  if (typeof el.type === 'function' && el.type !== STUB) return marksOf((el.type as (q: unknown) => unknown)(p), m, out);
  const n = (k: string) => Number(p[k] ?? 0);
  const fill = String(p.fill ?? '');
  const mm = mul(m, transformOf(p.transform));
  let pts: [number, number][];
  let shape: string;
  if ('d' in p) return marksOf(p.children, mm, out);
  if ('x1' in p) return out;
  if ('width' in p)
    ((shape = 'rect'),
      (pts = [
        [n('x'), n('y')],
        [n('x') + n('width'), n('y') + n('height')],
        [n('x'), n('y') + n('height')],
        [n('x') + n('width'), n('y')],
      ]));
  else if ('r' in p) {
    shape = 'circle';
    const r = n('r');
    pts = [
      [n('cx') - r, n('cy') - r],
      [n('cx') + r, n('cy') + r],
      [n('cx') - r, n('cy') + r],
      [n('cx') + r, n('cy') - r],
    ];
  } else if ('rx' in p && 'cx' in p) {
    shape = 'ellipse';
    pts = [
      [n('cx') - n('rx'), n('cy') - n('ry')],
      [n('cx') + n('rx'), n('cy') + n('ry')],
    ];
  } else return marksOf(p.children, mm, out);
  const w = pts.map(([x, y]) => at(mm, x, y));
  out.push({ shape, fill, shadow: /^rgba\(0,\s*0,\s*0,/.test(fill), x0: Math.min(...w.map((q) => q[0])), x1: Math.max(...w.map((q) => q[0])), y0: Math.min(...w.map((q) => q[1])), y1: Math.max(...w.map((q) => q[1])) });
  return out;
}
const mid = (q: Mark) => ({ x: (q.x0 + q.x1) / 2, y: (q.y0 + q.y1) / 2 });
function boundsOf(shapes: readonly { t: string; [k: string]: unknown }[]) {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const s of shapes as never[] as Record<string, number & number[]>[]) {
    if ((s as { t: string }).t === 'circle') (xs.push(s.cx - s.r, s.cx + s.r), ys.push(s.cy - s.r, s.cy + s.r));
    else if ((s as { t: string }).t === 'line') (xs.push(s.x1, s.x2), ys.push(s.y1, s.y2));
    else if ((s as { t: string }).t === 'poly') s.pts.forEach((v: number, i: number) => (i % 2 ? ys : xs).push(v));
    else (xs.push(s.x, s.x + s.w), ys.push(s.y, s.y + s.h));
  }
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}
function nameOffSymbol(p: ReturnType<typeof spNewProject>, what: string) {
  const plot = spPlotDoc(p);
  const kk = spPlotScale(plot, SP_PLOT_NOMINAL_W);
  for (const item of plot.items) {
    const lb = spLabelBlock(item);
    assert.ok(lb.h > 0, `${what}: named on the drawing`);
    const x0 = item.labelAt.x - lb.labelW / kk / 2;
    const box = { x0, y0: item.labelAt.y, x1: x0 + lb.w / kk, y1: item.labelAt.y + lb.h / kk };
    for (const part of item.shapes.map((s: never) => boundsOf([s]))) {
      const ov = Math.max(0, Math.min(box.x1, part.x1) - Math.max(box.x0, part.x0)) * Math.max(0, Math.min(box.y1, part.y1) - Math.max(box.y0, part.y0));
      assert.ok(ov < 1e-9, `${what}: the name lies over the symbol`);
    }
  }
}
const docText = (p: ReturnType<typeof spNewProject>, packet: 'full' | 'plot' = 'full') => JSON.stringify(spBuildDoc(spBuildSnapshot(p, { paper: 'letter', packet }, NOW)));

/* ── 1 and 6. the German timpani setup; the footprint ── */

describe('round 3: timpani in the American or the German setup', () => {
  it('the German layout is its own: the largest drum at the timpanist’s right, at the same reach, inside the same box', () => {
    const big = (T: typeof SP_TIMPANI) => T.drums.find((d) => d.size === 32)!;
    const small = (T: typeof SP_TIMPANI) => T.drums.find((d) => d.size === 23)!;
    assert.ok(big(SP_TIMPANI).x > 0.5 && small(SP_TIMPANI).x < -0.5, 'American: the largest at the left (+x)');
    assert.ok(big(SP_TIMPANI_GERMAN).x < -0.5 && small(SP_TIMPANI_GERMAN).x > 0.5, 'German: the largest at the right (−x)');
    // from the player's left (+x) to the right: 23, 26, 29, 32
    assert.deepEqual([...SP_TIMPANI_GERMAN.drums].sort((a, b) => b.x - a.x).map((d) => d.size), [23, 26, 29, 32]);
    for (const T of [SP_TIMPANI, SP_TIMPANI_GERMAN]) {
      for (const d of T.drums) {
        assert.ok(Math.abs(Math.hypot(d.x - T.stool.x, d.y - T.stool.y) - d.bowl - 0.55) < 1e-9, 'every rim 0.55 m from the stool');
        assert.ok(d.y > T.stool.y, 'the stool upstage');
      }
      for (const a of T.drums) for (const b of T.drums) if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= a.bowl + b.bowl - 1e-9);
    }
    assert.equal(spTimpaniLayout('german'), SP_TIMPANI_GERMAN);
    assert.equal(spTimpaniLayout(undefined), SP_TIMPANI);
    assert.equal(spTimpaniLayout(null), SP_TIMPANI);
  });

  it('the footprint is the drums and the stool, 2.6 × 1.52 m, in both setups; the print symbol stays inside it', () => {
    const am = spSymbol('timpani');
    const de = spTimpaniGermanSymbol();
    for (const s of [am, de]) {
      assert.deepEqual([s.w, s.h], [2.6, 1.52]);
      const b = boundsOf(s.shapes);
      assert.ok(b.x0 >= -s.w / 2 - 1e-6 && b.x1 <= s.w / 2 + 1e-6 && b.y0 >= -s.h / 2 - 1e-6 && b.y1 <= s.h / 2 + 1e-6);
    }
    assert.equal(de.shapes.length, am.shapes.length);
    // the German symbol's largest bowl is at −x
    const bowl = (s: typeof am) => (s.shapes.filter((x) => x.t === 'circle' && (x as { fill?: string }).fill === 'paper') as { cx: number; r: number }[]).sort((a, b) => b.r - a.r)[0]!;
    assert.ok(bowl(am).cx > 0.5 && bowl(de).cx < -0.5);
    assert.equal(spObjectSymbol({ kind: 'timpani', choir: null }), am);
    assert.equal(spObjectSymbol({ kind: 'timpani', choir: null, timpaniSetup: 'german' }), de);
    assert.equal(spKeySymbol('timpani'), am, 'the key shows the kind (one entry)');
    // visual review fixes: the stool is dashed (never a fifth drum); each
    // pedal reaches 15 cm past its bowl, toward the player's feet
    for (const s of [am, de]) {
      const stool = s.shapes[0] as { t: string; dash?: boolean; r: number };
      assert.equal(stool.t, 'circle');
      assert.equal(stool.dash, true);
      assert.ok(Math.abs(stool.r - 0.19) < 1e-9);
    }
    for (const T of [SP_TIMPANI, SP_TIMPANI_GERMAN]) {
      const sym = T === SP_TIMPANI ? am : de;
      const pedals = sym.shapes.filter((x) => x.t === 'poly') as { pts: number[] }[];
      assert.equal(pedals.length, 4);
      T.drums.forEach((d, i) => {
        const pts = pedals[i]!.pts;
        const far = Math.max(Math.hypot(pts[2]! - d.x, pts[3]! - d.y), Math.hypot(pts[4]! - d.x, pts[5]! - d.y));
        assert.ok(far >= d.bowl + 0.14 && far <= d.bowl + 0.16, `${d.size}: ${far - d.bowl}`);
      });
    }
  });

  it('a set saved before is American; a German set is saved, kept by a copy, and read back; a damaged setup reads as American', () => {
    let p = spNewProject({ id: 'tp', now: NOW });
    p = spAddObject(p, 'timpani', { x: 0.5, y: 0.4 }).p;
    assert.ok(!('timpaniSetup' in p.objects[0]), 'a new set is American, with no field');
    p = spAddObject(p, 'timpani', { x: 0.5, y: 0.7 }, { timpaniSetup: 'german' }).p;
    assert.equal(p.objects[1].timpaniSetup, 'german');
    const d = spDuplicateObject(p, p.objects[1].id).p;
    assert.equal(d.objects[2].timpaniSetup, 'german');
    const raw = JSON.parse(JSON.stringify(d));
    raw.objects[0].timpaniSetup = 'sideways';
    raw.objects.push({ ...raw.objects[0], id: 'w1', kind: 'wedge', timpaniSetup: 'german' });
    const q = spMigrate(raw)!;
    assert.equal(q.schema, 2);
    assert.ok(!('timpaniSetup' in q.objects[0]), 'damaged: American');
    assert.equal(q.objects[1].timpaniSetup, 'german');
    assert.ok(!('timpaniSetup' in q.objects[3]), 'only timpani keep it');
    const back = spUpdateObject(q, q.objects[1].id, { timpaniSetup: 'american' });
    assert.equal(spObjectSymbol(back.objects[1]), spSymbol('timpani'));
  });

  it('the screen art draws each setup from its own layout, never reflected', () => {
    for (const setup of ['american', 'german'] as const) {
      const ms = marksOf(TimpaniSetTop({ setup })).filter((q) => !q.shadow);
      const bowls = ms.filter((q) => q.fill === '#d4d6da' && q.shape === 'circle' && q.x1 - q.x0 > 15);
      assert.equal(bowls.length, 4);
      const big = [...bowls].sort((a, b) => b.x1 - b.x0 - (a.x1 - a.x0))[0]!;
      assert.ok(setup === 'american' ? mid(big).x > 20 : mid(big).x < -20, setup);
      const b = { x0: Math.min(...ms.map((q) => q.x0)), x1: Math.max(...ms.map((q) => q.x1)), y0: Math.min(...ms.map((q) => q.y0)), y1: Math.max(...ms.map((q) => q.y1)) };
      assert.ok(b.x0 >= -2.6 * 16 - 0.6 && b.x1 <= 2.6 * 16 + 0.6 && b.y0 >= -1.52 * 16 - 0.6 && b.y1 <= 1.52 * 16 + 0.6, `${setup}: inside its footprint`);
      assert.equal(marksOf(TimpaniSetTop({ setup }))[0]!.shadow, true, 'the shadow first');
    }
    // the kind's own drawing (no props) is still the American one
    assert.equal((TOP_ART_R2.timpani as (...a: unknown[]) => unknown).length, 0);
    const stage = src(`${STAGE}/stageArt.tsx`);
    assert.match(stage, /case 'timpani':[\s\S]*?<TimpaniSetTop setup=\{o\.timpaniSetup === 'german' \? 'german' : 'american'\} \/>/);
    for (const f of ['TimpaniSetup.tsx', 'topArtR2.tsx']) assert.doesNotMatch(src(`${STAGE}/${f}`), /flip\w*\s*[:=(]|mirror\w*\s*[:=(]|scale\(\s*-1|scaleX/i, f);
  });

  it('TURN turns either setup; the stage box and the label room are the set’s own; the name stays off the drums', () => {
    let p = spNewProject({ id: 'tt', now: NOW });
    p = { ...p, stage: { ...p.stage, width: 40, depth: 24, unit: 'ft' as const } };
    for (const rot of [0, 90]) {
      for (const setup of ['american', 'german'] as const) {
        const one = spAddObject(p, 'timpani', { x: 0.5, y: 0.5 }, { rot, label: 'Timpani', timpaniSetup: setup }).p;
        const o = one.objects[0];
        const b = boundsOf(spPlacedShapes(one, o));
        const [w, h] = rot === 90 ? [1.52, 2.6] : [2.6, 1.52];
        assert.ok(b.x1 - b.x0 <= w + 1e-6 && b.y1 - b.y0 <= h + 1e-6, `${setup} ${rot}°`);
        assert.deepEqual(stageArtSize('timpani', o), { w: 2.6, h: 1.52 });
        const box = spObjectBoxM(one, o);
        assert.deepEqual([box.w, box.h], [2.6, 1.52]);
        nameOffSymbol(one, `${setup} timpani at ${rot}°`);
      }
    }
  });

  it('the package words follow the setup: the same packages and rows, the drawing and the pair’s low side said for each', () => {
    const am = stageTimpaniPackagesFor('american');
    const de = stageTimpaniPackagesFor('german');
    assert.deepEqual(
      am.map((x: { id: string }) => x.id),
      ['timpani-pair', 'timpani-each'],
    );
    assert.deepEqual(
      de.map((x: { id: string }) => x.id),
      ['timpani-pair', 'timpani-each'],
    );
    assert.deepEqual(am.map((x: { rows: unknown }) => x.rows), de.map((x: { rows: unknown }) => x.rows));
    // the catalog (and the kind's own list) keep the American words
    assert.deepEqual(stagePackagesFor('timpani'), am);
    assert.deepEqual(SP_PACKAGES.filter((x) => x.id.startsWith('timpani-')), spTimpaniPackages('american'));
    assert.match(am[0]!.assumes, /drawn in the American setup \(the largest at the timpanist’s left\)/);
    assert.match(am[0]!.assumes, /Timpani R is over the 32 and 29 in drums\./);
    assert.match(de[0]!.assumes, /drawn in the German setup \(the largest at the timpanist’s right\)/);
    assert.match(de[0]!.assumes, /Timpani L is over the 32 and 29 in drums\./);
    for (const pk of de) assert.doesNotMatch(pk.assumes, /drawn in the American/);
    assert.equal(de[1]!.rows.map((r: { label: string }) => r.label).join(), 'Timpani 32 in,Timpani 29 in,Timpani 26 in,Timpani 23 in');
    assert.match(de[1]!.assumes, /largest first/);
    assert.match(SP_TIMPANI_SETUP_WORDS.german, /largest drum at the timpanist’s right \(stage right\)/);
    // a German set added with its package: the inputs and the drawing agree
    const r = stageAddWithPackage(spNewProject({ id: 'pk', now: NOW }), 'timpani', { x: 0.5, y: 0.5 }, de[0]!);
    assert.equal(r.p.inputs.length, 2);
    assert.equal(spAddPackage(spNewProject({ id: 'pk2', now: NOW }), de[1]!).inputIds.length, 4);
  });

  it('the setup is chosen where the timpani are added (before the package) and in the details, from one shared control', () => {
    const palette = src(`${STAGE}/StagePalette.tsx`);
    const inspector = src(`${STAGE}/StageInspector.tsx`);
    assert.match(palette, /<TimpaniSetup value=\{timpani\} onChange=\{setTimpani\} \/>/);
    assert.match(palette, /kind === 'timpani' \? stageTimpaniPackagesFor\(timpani\) : stagePackagesFor\(kind, choir\)/);
    assert.match(palette, /spUpdateObject\(r\.p, r\.id, \{ timpaniSetup: 'german' \}\)/);
    assert.match(inspector, /<TimpaniSetup value=\{o\.timpaniSetup === 'german' \? 'german' : 'american'\} onChange=\{\(s\) => set\(\{ timpaniSetup: s \}\)\} \/>/);
    const ctl = src(`${STAGE}/TimpaniSetup.tsx`);
    assert.match(ctl, /label="Setup"/);
    assert.match(ctl, /'AMERICAN'[\s\S]*'GERMAN'/);
  });

  it('a plot with both setups makes a PDF', () => {
    let p = spNewProject({ id: 'pdf', now: NOW, band: 'Example' });
    p = { ...p, stage: { ...p.stage, width: 44, depth: 28, unit: 'ft' as const } };
    p = spAddObject(p, 'timpani', { x: 0.3, y: 0.4 }, { label: 'Timpani (American)' }).p;
    p = spAddObject(p, 'timpani', { x: 0.7, y: 0.4 }, { label: 'Timpani (German)', timpaniSetup: 'german' }).p;
    const plot = spPlotDoc(p);
    const g = plot.items.find((i: { id: string }) => i.id === p.objects[1].id)!;
    const big = (g.shapes.filter((s: { t: string; fill?: string }) => s.t === 'circle' && s.fill === 'paper') as { cx: number; r: number }[]).sort((a, b) => b.r - a.r)[0]!;
    assert.ok(big.cx < g.at.x, 'printed: the largest drum at stage right of the set');
    const bytes = spPdfBytes(spBuildDoc(spBuildSnapshot(p, { paper: 'letter', packet: 'plot' }, NOW)));
    assert.equal(String.fromCharCode(...bytes.slice(0, 5)), '%PDF-');
  });
});

/* ── 2. choir singers clear of each other ── */

describe('round 3: choir singers that do not overlap', () => {
  it('the narrow build is the house figure, 400 mm across: the same silhouette, only narrower', () => {
    assert.equal(FIGURE_ABOVE_W_MM, 476);
    assert.equal(FIGURE_ABOVE_NARROW_W_MM, 400);
    const fig = src('src/features/lab/figureAboveSvg.tsx');
    // only the part between the armhole seams is narrowed; each arm keeps its width
    assert.match(fig, /const SEAM_X = 165;/);
    assert.match(fig, /const NARROW_K = \(200 - \(238 - SEAM_X\)\) \/ SEAM_X;/);
    assert.match(fig, /const BODY_NARROW: XY\[\] = BODY\.map\(\(\[x, y\]\) => \[narrowX\(x\), y\] as XY\);/);
    // the body's widest point is 238 mm: the narrow build is 2 × (238 − 165 + 165 K) = 400 mm
    assert.match(fig, /\[238, 4\],/);
    const K = (200 - (238 - 165)) / 165;
    assert.ok(Math.abs(2 * (238 - 165 + 165 * K) - FIGURE_ABOVE_NARROW_W_MM) < 1e-9);
    assert.match(fig, /build = 'standard'/);
    // the head and the depth are the same
    assert.match(fig, /const SKULL: XY\[\] = \[H\(0, -98\)/);
    // other plans keep the standard build (no caller outside the choir asks for narrow)
    assert.match(src(`${STAGE}/topArtWorld.tsx`), /halo="#c3cde2" build="narrow" \/>/);
    assert.doesNotMatch(src(`${STAGE}/stageArt.tsx`), /build="narrow"/);
  });

  it('at every size and row setting, neighbours on a riser stand clear (body and rim); the riser units and counts are unchanged', () => {
    // the rim of the narrow build: 1.0 floor unit wide, half of it outside
    assert.match(src('src/features/lab/figureAboveSvg.tsx'), /const haloW = \(narrow \? 1\.0 : 1\.4\) \/ pxPerMm;/);
    const reach = FIGURE_ABOVE_NARROW_W_MM / 1000 + 1.0 / 32;
    for (let n = 4; n <= 60; n++) {
      for (const rows of ['auto', 1, 2, 3, 4] as const) {
        const lay = spChoirLayout({ singers: n, rows });
        const ms = marksOf(ChoirTop({ layout: lay })).filter((q) => q.shape === 'figure');
        assert.equal(ms.length, n);
        for (const q of ms) assert.equal(q.props!.build, 'narrow');
        for (const a of lay.at) for (const b of lay.at) if (a !== b && a.row === b.row) assert.ok(Math.abs(a.x - b.x) >= reach - 1e-9, `${n}/${rows}: ${Math.abs(a.x - b.x).toFixed(3)} m apart`);
      }
    }
    // the old choir: one unit, 4 + 3 + 4, 1.85 × 1.4 m, as before
    const old = spChoirLayout({ singers: 11, rows: 3 });
    assert.deepEqual(old.perRow, [4, 3, 4]);
    assert.equal(old.units, 1);
    assert.ok(Math.abs(old.w - 1.85) < 0.002 && Math.abs(old.h - 1.4) < 0.002);
    const pitch = (SP_RISER_UNIT_W - (2 * 1.15) / 32) / 4;
    assert.ok(Math.abs(pitch - 0.44) < 0.002, `${pitch}`);
    // the gap between two bodies at 0.44 m is about 4 cm
    assert.ok(pitch - FIGURE_ABOVE_NARROW_W_MM / 1000 > 0.035);
    // (the standard build would overlap: why the narrow one is used)
    assert.ok(FIGURE_ABOVE_W_MM / 1000 > pitch);
  });

  it('one row on the floor: each singer has their own shadow, no band behind them all', () => {
    const lay = spChoirLayout({ singers: 5, rows: 1 });
    const all = marksOf(ChoirTop({ layout: lay }));
    const shadows = all.filter((q) => q.shadow);
    assert.equal(all[0]!.shadow, true, 'shadows first');
    assert.equal(shadows.length, 5);
    for (const s of shadows) assert.ok(s.x1 - s.x0 < 0.45 * 32, 'one singer wide');
  });
});

/* ── 3. the harmonium is one named model ── */

describe('round 3: the hand harmonium is the Bina No. 23B (3¼ octave)', () => {
  it('its case is the listed 21 1/2 × 12 in; 39 keys; four stops and two smaller drones', () => {
    assert.ok(Math.abs(SP_HARMONIUM.x1 - SP_HARMONIUM.x0 - 21.5 * 0.0254) < 0.001);
    assert.ok(Math.abs(SP_HARMONIUM.y1 - SP_HARMONIUM.y0 - 12 * 0.0254) < 0.001);
    assert.equal(SP_HARMONIUM_KNOBS.length, 6);
    assert.equal(SP_HARMONIUM_KNOBS.filter((k: { drone: boolean }) => k.drone).length, 2);
    for (const k of SP_HARMONIUM_KNOBS) assert.ok(k.x > SP_HARMONIUM.x0 + 0.05 && k.x < SP_HARMONIUM.x1 - 0.05);
    const code = src('src/features/stageplot/spSymbols.ts');
    assert.match(code, /the Bina No\. 23B, 3¼ octave/);
    assert.match(code, /musiciansmallusa\.com\/bina-23b-kirtan-harmonium/);
    assert.match(code, /"21 1\/2 by 12 by 13 inches" open/);
    // the art: 23 white keys, six knob caps (the drones smaller), inside the rug
    const ms = marksOf((TOP_ART_R2.harmonium as () => unknown)()).filter((q) => !q.shadow);
    assert.equal(ms.filter((q) => q.fill === '#e8e6dd').length, 23);
    const caps = ms.filter((q) => q.fill === '#9a6638' && q.shape === 'rect' && q.y1 - q.y0 < 0.5);
    assert.equal(caps.length, 6);
    const widths = caps.map((q) => q.x1 - q.x0).sort((a, b) => a - b);
    assert.ok(widths[0]! < widths[5]! - 0.1, 'the drone knobs are smaller');
    // the print: six knob dots, two of them smaller
    const dots = spSymbol('harmonium').shapes.filter((s: { t: string; fill?: string }) => s.t === 'circle' && s.fill === 'ink') as { r: number }[];
    assert.equal(dots.length, 6);
    assert.equal(dots.filter((d) => d.r < 0.011).length, 2);
    // the footprint (the rug) is unchanged
    assert.deepEqual([spSymbol('harmonium').w, spSymbol('harmonium').h], [1.0, 1.0]);
  });
});

/* ── 4 and 5. the choir's size printed; Wenger's words ── */

describe('round 3: the packet prints the choir’s size', () => {
  const choirPlot = (singers: number, rows: number | 'auto', more: Record<string, unknown> = {}) => {
    let p = spNewProject({ id: 'cp', now: NOW, band: 'Example' });
    p = { ...p, stage: { ...p.stage, width: 48, depth: 30, unit: 'ft' as const } };
    p = spAddObject(p, 'choir', { x: 0.5, y: 0.4 }, { choir: { singers, rows }, label: 'Choir', ...more }).p;
    return p;
  };

  it('the words', () => {
    assert.equal(spChoirCountWords({ singers: 24, rows: 'auto' }), '24 singers, 3 rows');
    assert.equal(spChoirCountWords({ singers: 11, rows: 3 }), '11 singers, 3 rows');
    assert.equal(spChoirCountWords({ singers: 5, rows: 'auto' }), '5 singers, 1 row');
    assert.equal(spChoirCountWords({ singers: 40, rows: 'auto' }), '40 singers, 4 rows');
    assert.equal(spChoirRiserNote({ singers: 5, rows: 1 }), '', 'one row stands on the floor');
    assert.match(spChoirRiserNote({ singers: 24, rows: 'auto' }), /^Choral risers: 3 × 6 ft \(1\.83 m\) three-step riser units, 3 rows\. Drawn at about 4 singers a row on each unit \(about 0\.45 m, 18 in, a singer, staggered\)\. An adult choir that wants shoulder room needs 3 a row: about one riser unit for every 8 singers\.$/);
    assert.match(spChoirRiserNote({ singers: 11, rows: 3 }), /^Choral risers: 1 × 6 ft \(1\.83 m\) three-step riser unit, 3 rows\./);
  });

  it('beside the symbol: "Choir (24 singers, 3 rows)"; the name still stays off the symbol at 0° and 90°', () => {
    const p = choirPlot(24, 'auto');
    assert.equal(spPlotDoc(p).items[0].label, 'Choir (24 singers, 3 rows)');
    for (const rot of [0, 90]) nameOffSymbol(spUpdateObject(p, p.objects[0].id, { rot }), `24 singers at ${rot}°`);
    // a size note joins it; a one-row choir says one row
    assert.equal(spPlotDoc(spUpdateObject(p, p.objects[0].id, { sizeNote: 'gospel choir' })).items[0].label, 'Choir (24 singers, 3 rows; gospel choir)');
    assert.equal(spPlotDoc(choirPlot(5, 'auto')).items[0].label, 'Choir (5 singers, 1 row)');
    // a choir saved before (no size) prints the 11 it always drew
    const raw = JSON.parse(JSON.stringify(choirPlot(11, 'auto')));
    delete raw.objects[0].choir;
    assert.equal(spPlotDoc(spMigrate(raw)!).items[0].label, 'Choir (11 singers, 3 rows)');
    // other kinds are unchanged
    const w = spAddObject(spNewProject({ id: 'w', now: NOW }), 'wedge', { x: 0.5, y: 0.5 }, { label: 'Wedge' }).p;
    assert.equal(spPlotDoc(w).items[0].label, 'Wedge');
  });

  it('the input list says where the inputs are with the size; the stage notes list its riser units', () => {
    let p = spNewProject({ id: 'ci', now: NOW, band: 'Example' });
    p = { ...p, stage: { ...p.stage, width: 48, depth: 30, unit: 'ft' as const } };
    p = stageAddWithPackage(p, 'choir', { x: 0.5, y: 0.4 }, SP_PACKAGES.find((x) => x.id === 'choir-three')!).p;
    p = spUpdateObject(p, p.objects[0].id, { choir: { singers: 24, rows: 'auto' }, label: 'Choir' });
    const text = docText(p);
    assert.match(text, /at the choir \(24 singers, 3 rows\)/);
    assert.match(text, /Notes on the stage/);
    assert.match(text, /Choir \(24 singers, 3 rows\): Choral risers: 3 × 6 ft/);
    // the plot-only packet has the notes too
    assert.match(docText(p, 'plot'), /Choral risers: 3 × 6 ft/);
    const bytes = spPdfBytes(spBuildDoc(spBuildSnapshot(p, { paper: 'a4', packet: 'full' }, NOW)));
    assert.equal(String.fromCharCode(...bytes.slice(0, 5)), '%PDF-');
  });

  it('Wenger’s published capacity is quoted word for word where the spacing is set', () => {
    const code = src('src/features/stageplot/spChoir.ts');
    assert.match(code, /Wenger_Choral\n? \* {0,4}Risers_BRO_LT0024\.pdf|Wenger_Choral[\s\S]{0,12}Risers_BRO_LT0024\.pdf/);
    assert.match(code, /GROUP CAPACITY "12-16", UNITS NEEDED 1, SPACE REQUIRED/);
    assert.match(code, /"First number indicates how\n \*     many high school students will fit on a riser set if all students\n \*     stand shoulder to shoulder\. Second number indicates how many students\n \*     will fit on a riser set if they are all facing center with shoulders\n \*     overlapping\. Numbers include a row of students standing on the floor\.\n \*     Adult groups should use lower number\."/);
  });
});
