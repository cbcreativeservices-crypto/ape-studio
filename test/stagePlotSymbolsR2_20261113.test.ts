/**
 * Stage Plot and Channel Designer — ROUND 2 OF THE ADDED SYMBOLS (owner
 * 2026-11-13: "Yes, build them all", about the items held from the first
 * round):
 *   1. a choir of any size: 4 to 60 singers, 1 to 4 rows or auto; the riser,
 *      the art, the print symbol, the key, TURN, label clearance, the area
 *      microphones and the review follow; an old choir is 11 singers in
 *      3 rows and looks the same;
 *   2. the Leslie's real size (the maker's figure);
 *   3. five new kinds: marimba, timpani, flute, hand harmonium, harmonica,
 *      each held to the same checks as the 22 kinds of the first round.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const { SP_PALETTE, SP_PACKAGES } = R(await import('../src/features/stageplot/spCatalog.ts'));
const SY = R(await import('../src/features/stageplot/spSymbols.ts'));
const { SP_R2_KINDS, SP_MORE_KINDS, spSymbol, spPlotKey, spKeySymbol, spKeyKind, spPlacedShapes, spIsSized, spObjectSymbol, spChoirSymbol, spObjectBoxM, SP_TIMPANI } = SY;
const CH = R(await import('../src/features/stageplot/spChoir.ts'));
const { spChoirLayout, spChoirMics, spChoirAutoRows, spChoirClean, spChoirPackageId, SP_CHOIR_LEGACY, SP_RISER_UNIT_W } = CH;
const { spNewProject, spAddObject, spAddPackage, spMigrate, spUpdateObject, spDuplicateObject } = R(await import('../src/features/stageplot/spModel.ts'));
const { spReview } = R(await import('../src/features/stageplot/spReview.ts'));
const { spPlotDoc, spPlotScale, spLabelBlock, SP_PLOT_NOMINAL_W, spBuildSnapshot, spBuildDoc } = R(await import('../src/features/stageplot/spPacket.ts'));
const { spPdfBytes } = R(await import('../src/features/stageplot/spPdf.ts'));
const { stageLinkMode, stagePackagesFor, stageKindForSource, stageKeyEntries, stageAddWithPackage, stageFreeSpot } = R(await import('../src/screens/lab/stageplot/stage/stageLinks.ts'));
const { stageDrawOrder: drawOrder, stageKeyLayout, STAGE_KEY_FS, stageArtSize } = R(await import('../src/screens/lab/stageplot/stage/stageGeom.ts'));
const { TOP_ART_R2, TOP_ART_R2_EXTENT } = R(await import('../src/screens/lab/stageplot/stage/topArtR2.tsx'));
const { ChoirTop, TOP_ART_WORLD } = R(await import('../src/screens/lab/stageplot/stage/topArtWorld.tsx'));
const STRINGS = R(await import('../src/screens/lab/stageplot/stage/topArtStringsKeys.tsx'));

type Kind = (typeof SP_R2_KINDS)[number];
const KINDS = [...SP_R2_KINDS] as Kind[];
const src = (f: string) => readFileSync(join(process.cwd(), f), 'utf8').replace(/\r\n/g, '\n');
const STAGE = 'src/screens/lab/stageplot/stage';
const ART: Record<string, () => unknown> = TOP_ART_R2 as Record<string, () => unknown>;
const EXTENT: Record<string, { hw: number; hh: number }> = TOP_ART_R2_EXTENT;
const NOW = 1_800_000_000_000;

/* ── measuring a drawing (as the first round's test does) ── */

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
    else if (fn === 'scale') m = mul(m, [a[0]!, 0, 0, a[1] ?? a[0]!, 0, 0]);
    else if (fn === 'rotate') {
      const r = (a[0]! * Math.PI) / 180;
      const rot: Mat = [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0];
      m = a.length === 3 ? mul(mul(mul(m, [1, 0, 0, 1, a[1]!, a[2]!]), rot), [1, 0, 0, 1, -a[1]!, -a[2]!]) : mul(m, rot);
    } else throw new Error(`a transform this test cannot measure: ${fn}`);
  }
  return m;
}
function pathPoints(d: string): [number, number][] {
  const tk = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const pts: [number, number][] = [];
  let i = 0;
  let cmd = '';
  let x = 0;
  let y = 0;
  const num = () => Number(tk[i++]);
  while (i < tk.length) {
    if (/[A-Za-z]/.test(tk[i]!)) cmd = tk[i++]!;
    if (cmd === 'Z' || cmd === 'z') continue;
    if (cmd === 'M' || cmd === 'L') ((x = num()), (y = num()), pts.push([x, y]));
    else if (cmd === 'm' || cmd === 'l') ((x += num()), (y += num()), pts.push([x, y]));
    else if (cmd === 'H') ((x = num()), pts.push([x, y]));
    else if (cmd === 'h') ((x += num()), pts.push([x, y]));
    else if (cmd === 'V') ((y = num()), pts.push([x, y]));
    else if (cmd === 'v') ((y += num()), pts.push([x, y]));
    else if (cmd === 'C' || cmd === 'Q') for (let k = 0; k < (cmd === 'C' ? 3 : 2); k++) ((x = num()), (y = num()), pts.push([x, y]));
    else if (cmd === 'A' || cmd === 'a') {
      const rx = num();
      const ry = num();
      i += 3;
      const ex = cmd === 'a' ? x + num() : num();
      const ey = cmd === 'a' ? y + num() : num();
      for (const [px, py] of [
        [x, y],
        [ex, ey],
      ] as [number, number][])
        pts.push([px - rx, py - ry], [px + rx, py + ry], [px - rx, py + ry], [px + rx, py - ry]);
      x = ex;
      y = ey;
    } else throw new Error(`a path command this test cannot measure: ${cmd}`);
  }
  return pts;
}
type Mark = {
  shape: string;
  fill: string;
  shadow: boolean;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
};
type El = {
  type: unknown;
  props: Record<string, unknown> & { children?: unknown };
};
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
    const half = (476 / 2) * Number(p.pxPerMm) + 0.6;
    const [cx, cy] = at(m, Number(p.x), Number(p.y));
    out.push({
      shape: 'figure',
      fill: 'figure',
      shadow: false,
      x0: cx - half,
      x1: cx + half,
      y0: cy - half * 0.6,
      y1: cy + half * 0.6,
    });
    return out;
  }
  if (typeof el.type === 'function' && el.type !== STUB) return marksOf((el.type as (q: unknown) => unknown)(p), m, out);
  const n = (k: string) => Number(p[k] ?? 0);
  const fill = String(p.fill ?? '');
  const stroke = String(p.stroke ?? '');
  const mm = mul(m, transformOf(p.transform));
  let pts: [number, number][];
  let shape: string;
  let pad = stroke && stroke !== 'none' ? Number(p.strokeWidth ?? 1) / 2 : 0;
  if ('d' in p) ((shape = 'path'), (pts = pathPoints(String(p.d))));
  else if ('x1' in p)
    ((shape = 'line'),
      (pts = [
        [n('x1'), n('y1')],
        [n('x2'), n('y2')],
      ]));
  else if ('width' in p)
    ((shape = 'rect'),
      (pts = [
        [n('x'), n('y')],
        [n('x') + n('width'), n('y')],
        [n('x'), n('y') + n('height')],
        [n('x') + n('width'), n('y') + n('height')],
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
  } else if ('rx' in p) {
    shape = 'ellipse';
    pts = [
      [n('cx') - n('rx'), n('cy') - n('ry')],
      [n('cx') + n('rx'), n('cy') + n('ry')],
      [n('cx') - n('rx'), n('cy') + n('ry')],
      [n('cx') + n('rx'), n('cy') - n('ry')],
    ];
  } else return marksOf(p.children, mm, out);
  const w = pts.map(([x, y]) => at(mm, x, y));
  const scale = Math.sqrt(Math.abs(mm[0] * mm[3] - mm[1] * mm[2]));
  pad *= scale;
  out.push({
    shape,
    fill,
    shadow: [fill, stroke].some((c) => /^rgba\(0,\s*0,\s*0,/.test(c)),
    x0: Math.min(...w.map((q) => q[0])) - pad,
    x1: Math.max(...w.map((q) => q[0])) + pad,
    y0: Math.min(...w.map((q) => q[1])) - pad,
    y1: Math.max(...w.map((q) => q[1])) + pad,
  });
  return out;
}
const drawn = (k: Kind): Mark[] => marksOf(ART[k]!());
const solid = (k: Kind): Mark[] => drawn(k).filter((q) => !q.shadow);
const boxOf = (ms: Mark[]) => ({
  x0: Math.min(...ms.map((q) => q.x0)),
  x1: Math.max(...ms.map((q) => q.x1)),
  y0: Math.min(...ms.map((q) => q.y0)),
  y1: Math.max(...ms.map((q) => q.y1)),
});
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
  return {
    x0: Math.min(...xs),
    x1: Math.max(...xs),
    y0: Math.min(...ys),
    y1: Math.max(...ys),
  };
}

/** Each object alone on a stage, turned `rot`: its printed name is off its symbol. */
function nameOffSymbol(p: ReturnType<typeof spNewProject>, what: string) {
  const plot = spPlotDoc(p);
  const kk = spPlotScale(plot, SP_PLOT_NOMINAL_W);
  for (const item of plot.items) {
    const lb = spLabelBlock(item);
    assert.ok(lb.h > 0, `${what}: named on the drawing`);
    const x0 = item.labelAt.x - lb.labelW / kk / 2;
    const box = {
      x0,
      y0: item.labelAt.y,
      x1: x0 + lb.w / kk,
      y1: item.labelAt.y + lb.h / kk,
    };
    for (const part of item.shapes.map((s: never) => boundsOf([s]))) {
      const ov = Math.max(0, Math.min(box.x1, part.x1) - Math.max(box.x0, part.x0)) * Math.max(0, Math.min(box.y1, part.y1) - Math.max(box.y0, part.y0));
      assert.ok(ov < 1e-9, `${what}: the name lies over the symbol`);
    }
  }
}

/* ── 3. the five new kinds ── */

describe('round 2: the five new kinds', () => {
  it('are the agreed list, once each, and none of the first round changed', () => {
    assert.deepEqual([...KINDS].sort(), ['flute', 'harmonica', 'harmonium', 'marimba', 'timpani']);
    assert.equal(SP_MORE_KINDS.length, 22);
    for (const k of KINDS) assert.ok(!SP_MORE_KINDS.includes(k as never));
  });

  for (const k of KINDS) {
    it(`${k}: in the palette with a plain name, and in the key with its own entry`, () => {
      const items = SP_PALETTE.filter((x) => x.kind === k);
      assert.equal(items.length, 1);
      assert.equal(items[0]!.group, 'instruments');
      assert.equal(items[0]!.sized, false);
      assert.ok(items[0]!.name.length >= 3 && items[0]!.name.length <= 24, items[0]!.name);
      assert.doesNotMatch(items[0]!.name, /^[A-Z0-9 -]+$/);
      const key = spPlotKey([{ kind: k }]);
      assert.equal(key.length, 1);
      assert.equal(key[0]!.kind, k);
      assert.equal(spKeyKind(k), k);
      assert.ok(key[0]!.name.length >= 3);
      const ks = spKeySymbol(k);
      assert.ok(ks.shapes.length >= 3 && ks.w > 0 && ks.h > 0);
    });
  }

  it('the key of a stage with all five and the 22 of the first round fits a phone in 9 pt rows', () => {
    const all = [...SP_MORE_KINDS, ...KINDS].map((kind) => ({ kind }));
    const entries = stageKeyEntries(all);
    assert.equal(entries.length, 27);
    const L = stageKeyLayout(entries, 366, 'NOT TO SCALE');
    assert.equal(L.cells.length, 27);
    assert.ok(STAGE_KEY_FS >= 9);
    for (const c of L.cells) assert.ok(c.x >= 0 && c.lines.every((ln: { text: string }) => ln.text.length > 0));
  });
});

const BRANDS = /shure|sennheiser|neumann|akg|\bdpa\b|audio-?technica|beyer|electro-?voice|r[øo]de\b|countryman|schertler|\bamt\b|radial|telefunken|royer|coles|sm5[78]|md ?421|e ?60[49]|beta ?\d|lavalier brand/i;

describe('round 2: every new kind offers its inputs, as they are really done', () => {
  for (const k of KINDS) {
    it(`${k}: asks what it stands for, offers packages, generic equipment only`, () => {
      assert.equal(stageLinkMode(k), 'sound');
      const pkgs = stagePackagesFor(k);
      assert.ok(pkgs.length >= 2, `${k} offers packages`);
      for (const pkg of pkgs) {
        assert.ok(
          SP_PACKAGES.some((x) => x.id === pkg.id),
          `${pkg.id} in the catalog`,
        );
        assert.ok(pkg.assumes.length > 15);
        for (const r of pkg.rows) {
          assert.doesNotMatch(`${r.label} ${r.equipment}`, BRANDS);
          assert.match(r.equipment, /microphone|DI|line output/i);
        }
        if (pkg.rows.some((x) => x.side)) assert.equal(pkg.stereo, true, pkg.id);
        const added = spAddPackage(spNewProject({ id: 'p', now: NOW }), pkg);
        assert.equal(added.inputIds.length, pkg.rows.length);
        for (const i of added.p.inputs.filter((x: { side: string | null }) => x.side)) assert.ok(i.pairId);
      }
      const p = spAddObject(spNewProject({ id: 'q', now: NOW }), k, {
        x: 0.5,
        y: 0.5,
      }).p;
      assert.ok(
        spReview(p).some((i: { rule: string }) => i.rule === 'icon-no-input'),
        `${k} is asked about`,
      );
    });
  }

  it('the practice the live-sound reviewer set', () => {
    const rows = (k: string) => stagePackagesFor(k as Kind).map((p) => p.rows);
    const cond = /small-diaphragm condenser/i;
    // marimba: a pair low / high above the bars on tall booms, or three for 5 octaves
    assert.ok(rows('marimba').some((r) => r.map((x) => x.label).join() === 'Marimba low,Marimba high' && r.every((x) => cond.test(x.equipment) && x.stand === 'tall-boom')));
    assert.ok(rows('marimba').some((r) => r.length === 3));
    // timpani: a pair above (offered first), or one per drum named by its size
    assert.equal(stagePackagesFor('timpani')[0]!.id, 'timpani-pair');
    assert.ok(rows('timpani').some((r) => r.map((x) => x.label).join() === 'Timpani 32 in,Timpani 29 in,Timpani 26 in,Timpani 23 in' && r.every((x) => x.stand === 'tall-boom')));
    // flute: a stand microphone, or a clip-on
    assert.ok(rows('flute').some((r) => r.length === 1 && cond.test(r[0]!.equipment) && r[0]!.stand === 'tall-boom'));
    assert.ok(rows('flute').some((r) => r.length === 1 && /clip-on/i.test(r[0]!.equipment) && r[0]!.stand === 'clamp'));
    assert.match(stagePackagesFor('flute')[0]!.assumes, /never into the air stream/);
    // harmonium: a low boom for a seated player, and the player's vocal
    assert.ok(rows('harmonium').every((r) => r.every((x) => x.stand === 'short-boom')));
    assert.ok(rows('harmonium').some((r) => r.some((x) => /vocal/i.test(x.label))));
    // harmonica: a vocal-style dynamic the player cups; the player's amp miked; a line out through a high-impedance DI
    assert.ok(rows('harmonica').some((r) => r.length === 1 && /dynamic vocal/i.test(r[0]!.equipment) && r[0]!.stand === 'straight'));
    assert.ok(rows('harmonica').some((r) => r.length === 1 && /amp/i.test(r[0]!.label) && r[0]!.capture === 'mic'));
    assert.ok(rows('harmonica').some((r) => r.length === 1 && r[0]!.capture === 'di' && /high-impedance/.test(r[0]!.equipment)));
    for (const p of stagePackagesFor('harmonica')) assert.match(p.assumes, /also sing: add a vocal microphone/);
    // a sax player who doubles on flute: the clip-on and a stand microphone for the flute
    assert.ok(stagePackagesFor('saxophone').some((p) => p.id === 'sax-flute' && p.rows.length === 2));
  });

  it('a source named for one of them is drawn with its symbol when it is placed from the list', () => {
    const cases: [string, string, Kind][] = [
      ['Marimba', 'percussion', 'marimba'],
      ['Timpani', 'percussion', 'timpani'],
      ['Kettledrums', 'percussion', 'timpani'],
      ['Flute', 'horns', 'flute'],
      ['Piccolo', 'other', 'flute'],
      ['Harmonium', 'keys', 'harmonium'],
      ['Harmonica', 'other', 'harmonica'],
      ['Blues harp', 'other', 'harmonica'],
    ];
    for (const [label, cat, kind] of cases) assert.equal(stageKindForSource(label, cat as never), kind, label);
    // the old words still land where they did
    assert.equal(stageKindForSource('Harp', 'other'), 'harp');
    assert.equal(stageKindForSource('Trumpet 1', 'other'), 'horn');
    assert.equal(stageKindForSource('Hammond', 'keys'), 'organ');
    assert.equal(stageKindForSource('Vibes', 'percussion'), 'vibraphone');
  });
});

describe('round 2: the on-screen art of every new kind', () => {
  it('the stage draws from the new map, each kind has exactly one drawing, and takes no props', () => {
    const stage = src(`${STAGE}/stageArt.tsx`);
    assert.match(stage, /STAGE_TOP_ART: TopArtMap = \{[^}]*\.\.\.TOP_ART_WORLD[^}]*\.\.\.TOP_ART_R2[^}]*\}/);
    assert.deepEqual(Object.keys(ART).sort(), [...KINDS].sort());
    assert.deepEqual(Object.keys(EXTENT).sort(), [...KINDS].sort());
    for (const k of KINDS) assert.equal((ART[k] as (...a: unknown[]) => unknown).length, 0);
  });

  for (const k of KINDS) {
    it(`${k}: illustrated (not a bare primitive), its shadow first, inside its footprint and filling it`, () => {
      const ms = solid(k);
      assert.ok(ms.length >= 10, `${k}: ${ms.length} parts`);
      const fills = new Set(ms.map((q) => q.fill).filter((f) => f && f !== 'none'));
      assert.ok(fills.size >= 3, `${k}: ${fills.size} materials`);
      assert.equal(drawn(k)[0]!.shadow, true, `${k}: the shadow is drawn first`);
      const sym = spSymbol(k);
      const f = { hw: sym.w * 16, hh: sym.h * 16 };
      const b = boxOf(ms);
      if (process.env.SP_EXTENT_DEBUG) console.log('EXTENT', k, Math.max(-b.x0, b.x1).toFixed(2), Math.max(-b.y0, b.y1).toFixed(2), (b.x0 + b.x1).toFixed(2), (b.y0 + b.y1).toFixed(2), f.hw, f.hh);
      assert.ok(b.x0 >= -f.hw - 0.05 && b.x1 <= f.hw + 0.05, `${k}: x ${b.x0.toFixed(2)}..${b.x1.toFixed(2)} in ±${f.hw}`);
      assert.ok(b.y0 >= -f.hh - 0.05 && b.y1 <= f.hh + 0.05, `${k}: y ${b.y0.toFixed(2)}..${b.y1.toFixed(2)} in ±${f.hh}`);
      const e = EXTENT[k]!;
      assert.ok(e.hw <= f.hw + 1e-9 && e.hh <= f.hh + 1e-9);
      assert.ok(Math.abs(Math.max(-b.x0, b.x1) - e.hw) <= 0.5, `${k}: hw drawn ${Math.max(-b.x0, b.x1).toFixed(2)}, stated ${e.hw}`);
      assert.ok(Math.abs(Math.max(-b.y0, b.y1) - e.hh) <= 0.5, `${k}: hh drawn ${Math.max(-b.y0, b.y1).toFixed(2)}, stated ${e.hh}`);
      assert.ok(Math.abs(b.x0 + b.x1) <= 1.2 && Math.abs(b.y0 + b.y1) <= 1.2, `${k}: centered (${(b.x0 + b.x1).toFixed(2)}, ${(b.y0 + b.y1).toFixed(2)})`);
      const long = f.hw >= f.hh ? (b.x1 - b.x0) / (2 * f.hw) : (b.y1 - b.y0) / (2 * f.hh);
      assert.ok(long >= 0.9, `${k}: fills ${(long * 100).toFixed(0)} % of its long side`);
    });
  }

  it('pure drawings: no text, no image file, no hooks, no animation; only the drawing package, the contract and the shared geometry', () => {
    const code = src(`${STAGE}/topArtR2.tsx`)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
    assert.doesNotMatch(code, /<Text\b|SvgText|<TSpan\b/);
    assert.doesNotMatch(code, /\bImage\b|require\(|\.png|\.jpg|\.webp/);
    assert.doesNotMatch(code, /\buse[A-Z]\w*\s*\(/);
    assert.doesNotMatch(code, /Animated|reanimated|setState|setInterval|setTimeout/);
    const from = [...code.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]).sort();
    assert.deepEqual(from, ['../../../../features/stageplot/spSymbols', './topArtTypes', 'react-native-svg']);
  });

  it('each one is the right way round for its player (upstage, facing the audience)', () => {
    // marimba: the longest bars (the low end) at the player's left, +x; the naturals nearest the player
    const bars = solid('marimba').filter((q) => q.fill === '#8a3f22');
    const longest = [...bars].sort((a, b) => b.y1 - b.y0 - (a.y1 - a.y0))[0]!;
    assert.ok(mid(longest).x > 30 && mid(longest).y < 0, 'marimba: low end at +x, naturals upstage');
    // timpani: the largest bowl at the timpanist's left (+x); the stool upstage of every drum
    // (from above the chrome counterhoop is each drum's outermost ring)
    const bowls = solid('timpani').filter((q) => q.fill === '#d4d6da' && q.shape === 'circle' && q.x1 - q.x0 > 15);
    assert.equal(bowls.length, 4);
    const big = [...bowls].sort((a, b) => b.x1 - b.x0 - (a.x1 - a.x0))[0]!;
    const small = [...bowls].sort((a, b) => a.x1 - a.x0 - (b.x1 - b.x0))[0]!;
    assert.ok(mid(big).x > 20 && mid(small).x < -20, 'timpani: American setup');
    for (const d of SP_TIMPANI.drums) assert.ok(d.y > SP_TIMPANI.stool.y, 'timpani: the stool upstage');
    // flute: the lip plate at the player's left (+x), the tube running to the player's right
    const lip = solid('flute').find((q) => q.shape === 'ellipse' && q.fill === '#1a1c20')!;
    assert.ok(mid(lip).x > 5, 'flute: lip plate at the left');
    // harmonium: the keys toward the player (−y of the case), the bellows away, opened at +x
    const ivory = solid('harmonium').filter((q) => q.fill === '#e8e6dd');
    const bellows = solid('harmonium').find((q) => q.fill === '#2a2420')!;
    assert.ok(ivory.length === 23 && ivory.every((q) => mid(q).y < mid(bellows).y), 'harmonium: keys toward the player');
    assert.ok(Math.max(...ivory.map((q) => q.y1)) <= bellows.y0 + 0.01);
    // harmonica: the microphone's grille toward the player (upstage of its base); the case at the player's right
    const grille = solid('harmonica').find((q) => q.fill === '#9aa0a8' && q.shape === 'circle')!;
    const base = solid('harmonica').find((q) => q.fill === '#1b1c20' && q.shape === 'circle')!;
    assert.ok(mid(grille).y < mid(base).y, 'harmonica: microphone toward the player');
    // twelve harmonicas, each 102 × 22 mm (a 10-hole diatonic), standing in the case
    const harps = solid('harmonica').filter((q) => q.fill === '#d4d6da' && q.shape === 'rect' && q.x1 - q.x0 > 3);
    assert.equal(harps.length, 12);
    for (const q of harps) assert.ok(Math.abs((q.x1 - q.x0) / 32 - 0.102) < 0.006 && Math.abs((q.y1 - q.y0) / 32 - 0.022) < 0.006);
    // the stand's pole is under the microphone's tail end, 6 cm from it (a straight stand, no boom)
    assert.ok(Math.abs(SY.SP_HARMONICA.base.y - SY.SP_HARMONICA.mic.y0 - 0.06) < 1e-9);
    assert.ok(
      harps.every((q) => mid(q).x < mid(base).x),
      'harmonica: the case at the player’s right',
    );
  });

  it('draw order: the four instruments under the performers; the harmonica (a microphone) over them', () => {
    const objs = ['performer', ...KINDS].map((kind, i) => ({
      id: `o${i}`,
      kind,
    })) as never[];
    const order = (drawOrder(objs) as { kind: string }[]).map((o) => o.kind);
    for (const k of ['marimba', 'timpani', 'flute', 'harmonium']) assert.ok(order.indexOf(k) < order.indexOf('performer'), k);
    assert.ok(order.indexOf('harmonica') > order.indexOf('performer'));
  });
});

describe('round 2: the print symbol of every new kind (what the PDF draws)', () => {
  for (const k of KINDS) {
    it(`${k}: several shapes, inside its footprint; TURN turns it`, () => {
      const sym = spSymbol(k);
      assert.ok(sym.shapes.length >= 3);
      assert.equal(spIsSized(k), false);
      const b = boundsOf(sym.shapes);
      assert.ok(b.x0 >= -sym.w / 2 - 1e-6 && b.x1 <= sym.w / 2 + 1e-6, `${k}: x ${b.x0}..${b.x1}`);
      assert.ok(b.y0 >= -sym.h / 2 - 1e-6 && b.y1 <= sym.h / 2 + 1e-6, `${k}: y ${b.y0}..${b.y1}`);
      const p = spNewProject({ id: 't', now: NOW });
      const o0 = spAddObject(p, k, { x: 0.5, y: 0.5 }, { rot: 0 });
      const o90 = spAddObject(p, k, { x: 0.5, y: 0.5 }, { rot: 90 });
      const a = boundsOf(spPlacedShapes(o0.p, o0.p.objects[0]!));
      const c = boundsOf(spPlacedShapes(o90.p, o90.p.objects[0]!));
      assert.ok(Math.abs(a.x1 - a.x0 - (c.y1 - c.y0)) < 1e-6 && Math.abs(a.y1 - a.y0 - (c.x1 - c.x0)) < 1e-6);
    });
  }

  it('the print sizes are the real instruments', () => {
    assert.deepEqual([spSymbol('marimba').w, spSymbol('marimba').h], [2.6, 1.05]); // Yamaha YM-5100A 261 × 103 cm
    assert.deepEqual([spSymbol('timpani').w, spSymbol('timpani').h], [2.6, 1.52]);
    // every rim at the same reach from the stool (0.55 m)
    for (const d of SP_TIMPANI.drums) assert.ok(Math.abs(Math.hypot(d.x - SP_TIMPANI.stool.x, d.y - SP_TIMPANI.stool.y) - d.bowl - 0.55) < 1e-9);
    // the marimba's bars: an even 16 mm gap all along, 42 to 62 mm wide
    for (let n = 0; n < 35; n++) {
      const gap = SY.spMarimbaX(n) - SY.spMarimbaX(n + 1) - (SY.spMarimbaW(1 - n / 35) + SY.spMarimbaW(1 - (n + 1) / 35)) / 2;
      assert.ok(Math.abs(gap - 0.016) < 1e-9, `gap ${n}`);
    }
    // the four heads, 32, 29, 26 and 23 in
    assert.deepEqual(
      SP_TIMPANI.drums.map((d: { size: number; head: number }) => [d.size, Math.round((d.head * 2) / 0.0254)]),
      [
        [32, 32],
        [29, 29],
        [26, 26],
        [23, 23],
      ],
    );
    // no two drums overlap
    for (const a of SP_TIMPANI.drums) for (const b of SP_TIMPANI.drums) if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= a.bowl + b.bowl - 1e-9, `${a.size}/${b.size}`);
    const fl = SY.SP_FLUTE;
    assert.ok(Math.abs(Math.hypot(fl.crown.x - fl.foot.x, fl.crown.y - fl.foot.y) - 0.67) < 0.01, 'flute 0.67 m');
    const H = SY.SP_HARMONIUM;
    // owner 2026-11-13: build the remaining held items — the harmonium is now
    // the Bina No. 23B, 3¼ octave, "21 1/2 by 12" in (0.546 × 0.305 m; it was
    // 0.60 × 0.30 m); test/stagePlotSymbolsR3_20261113.test.ts holds it
    assert.ok(Math.abs(H.x1 - H.x0 - 0.546) < 1e-9 && Math.abs(H.y1 - H.y0 - 0.305) < 1e-9, 'harmonium 0.546 × 0.305 m (Bina No. 23B)');
  });

  it('a plot with all five prints each one whole, lists them in the key, and makes a PDF', () => {
    let p = spNewProject({ id: 'all', now: NOW, band: 'Example' });
    p = {
      ...p,
      stage: { ...p.stage, width: 44, depth: 28, unit: 'ft' as const },
    };
    KINDS.forEach((k, i) => {
      p = spAddObject(p, k, { x: 0.15 + (i % 3) * 0.33, y: 0.2 + Math.floor(i / 3) * 0.45 }, { label: SP_PALETTE.find((x) => x.kind === k)!.name }).p;
    });
    const plot = spPlotDoc(p);
    assert.equal(plot.items.length, 5);
    for (const o of p.objects) assert.equal(plot.items.find((x: { id: string }) => x.id === o.id)!.shapes.length, spSymbol(o.kind).shapes.length);
    assert.deepEqual(plot.key.map((e: { kind: string }) => e.kind).sort(), [...KINDS].sort());
    const bytes = spPdfBytes(spBuildDoc(spBuildSnapshot(p, { paper: 'letter', packet: 'plot' }, NOW)));
    assert.equal(String.fromCharCode(...bytes.slice(0, 5)), '%PDF-');
  });

  for (const rot of [0, 90]) {
    it(`each one alone on a stage, turned ${rot}°: its printed name never lies over its symbol`, () => {
      for (const k of KINDS) nameOffSymbol(spAddObject(spNewProject({ id: 'one', now: NOW }), k, { x: 0.5, y: 0.5 }, { rot, label: SP_PALETTE.find((x) => x.kind === k)!.name }).p, `${k} at ${rot}°`);
    });
  }
});

/* ── 2. the Leslie's real size ── */

describe('round 2: the Leslie is the maker’s size', () => {
  it('the cabinet is 29 1/4 × 20 5/8 in (0.743 × 0.524 m), Hammond’s figure for the 122A, 147A and 122XB', () => {
    const cab = spSymbol('leslie').shapes[0] as {
      t: string;
      w: number;
      h: number;
    };
    assert.equal(cab.t, 'rect');
    assert.ok(Math.abs(cab.w - 29.25 * 0.0254) < 0.002 && Math.abs(cab.h - 20.625 * 0.0254) < 0.002, `${cab.w} × ${cab.h}`);
    // the on-screen cabinet agrees within 2 cm
    const ms = marksOf((STRINGS.TOP_ART_STRINGS_KEYS as Record<string, () => unknown>).leslie!()).filter((q) => q.fill === '#2a180c' && q.shape === 'rect');
    const outer = ms.sort((a, b) => b.x1 - b.x0 - (a.x1 - a.x0))[0]!;
    assert.ok(Math.abs((outer.x1 - outer.x0) / 32 - 0.743) < 0.02 && Math.abs((outer.y1 - outer.y0) / 32 - 0.524) < 0.02, `${(outer.x1 - outer.x0) / 32} × ${(outer.y1 - outer.y0) / 32}`);
  });
});

/* ── 1. a choir of any size ── */

const layoutOf = (singers: number, rows: number | 'auto') => spChoirLayout({ singers, rows });

describe('round 2: a choir of any size', () => {
  it('an old choir (no size saved) loads as 11 singers in 3 rows, and draws as it did', () => {
    let p = spNewProject({ id: 'old', now: NOW });
    p = spAddObject(p, 'choir', { x: 0.5, y: 0.4 }).p;
    const raw = JSON.parse(JSON.stringify(p));
    delete raw.objects[0].choir;
    const q = spMigrate(raw)!;
    assert.deepEqual(q.objects[0].choir, { singers: 11, rows: 3 });
    assert.deepEqual(SP_CHOIR_LEGACY, { singers: 11, rows: 3 });
    // the same footprint as before (1.85 × 1.4 m), one riser unit, 4 + 3 + 4
    const lay = layoutOf(11, 3);
    assert.deepEqual(lay.perRow, [4, 3, 4]);
    assert.equal(lay.units, 1);
    assert.ok(Math.abs(lay.w - 1.85) < 0.002 && Math.abs(lay.h - 1.4) < 0.002);
    const b = spObjectBoxM(q, q.objects[0]);
    assert.ok(Math.abs(b.w - 1.85) < 0.002 && Math.abs(b.h - 1.4) < 0.002);
    assert.deepEqual(stageArtSize('choir', q.objects[0]), {
      w: spChoirSymbol({ singers: 11, rows: 3 }).w,
      h: spChoirSymbol({ singers: 11, rows: 3 }).h,
    });
    // on the screen: the riser and every singer where the old drawing had them (within 0.6 floor units, 2 cm)
    const before = marksOf((TOP_ART_WORLD as Record<string, () => unknown>).choir!())
      .filter((m) => m.shape === 'figure')
      .map(mid);
    const now = marksOf(ChoirTop({ layout: lay }))
      .filter((m) => m.shape === 'figure')
      .map(mid);
    assert.equal(now.length, 11);
    for (const a of before)
      assert.ok(
        now.some((c) => Math.hypot(a.x - c.x, a.y - c.y) <= 0.6),
        `a singer at ${a.x},${a.y}`,
      );
    const deckBefore = boxOf(marksOf((TOP_ART_WORLD as Record<string, () => unknown>).choir!()).filter((m) => !m.shadow && m.shape === 'rect'));
    const deckNow = boxOf(marksOf(ChoirTop({ layout: lay })).filter((m) => !m.shadow && m.shape === 'rect'));
    for (const k of ['x0', 'x1', 'y0', 'y1'] as const) assert.ok(Math.abs(deckBefore[k] - deckNow[k]) < 0.05, k);
    // a damaged size reads as the old choir; only a choir keeps the field
    raw.objects[0].choir = { singers: 'many' };
    raw.objects.push({
      ...raw.objects[0],
      id: 'ob2',
      kind: 'wedge',
      choir: { singers: 30, rows: 3 },
    });
    const r = spMigrate(raw)!;
    assert.deepEqual(r.objects[0].choir, { singers: 11, rows: 3 });
    assert.ok(!('choir' in r.objects[1]));
  });

  it('a new choir is 11 singers with rows chosen for it (3), the same drawing', () => {
    const p = spAddObject(spNewProject({ id: 'n', now: NOW }), 'choir', {
      x: 0.5,
      y: 0.5,
    }).p;
    assert.deepEqual(p.objects[0].choir, { singers: 11, rows: 'auto' });
    assert.deepEqual(spChoirLayout(p.objects[0].choir).perRow, [4, 3, 4]);
  });

  it('auto rows follow the reviewer: 4–5 one row, 6–7 two, 8–35 three, 36–60 four', () => {
    for (let n = 4; n <= 60; n++) assert.equal(spChoirAutoRows(n), n <= 5 ? 1 : n <= 7 ? 2 : n <= 35 ? 3 : 4, String(n));
  });

  it('sizes are kept in range and whole', () => {
    assert.deepEqual(spChoirClean({ singers: 2, rows: 9 }), {
      singers: 4,
      rows: 4,
    });
    assert.deepEqual(spChoirClean({ singers: 99.6, rows: 0 }), {
      singers: 60,
      rows: 1,
    });
    assert.deepEqual(spChoirClean({ singers: 24.4, rows: 'auto' }), {
      singers: 24,
      rows: 'auto',
    });
    assert.deepEqual(spChoirClean(null), { singers: 11, rows: 3 });
  });

  it('every size from 4 to 60, in 1 to 4 rows or auto: everybody placed, the fewest riser units, window spacing, inside the footprint', () => {
    for (let n = 4; n <= 60; n++) {
      for (const rows of ['auto', 1, 2, 3, 4] as const) {
        const lay = layoutOf(n, rows);
        const what = `${n} singers, rows ${rows}`;
        assert.equal(lay.at.length, n, what);
        assert.equal(
          lay.perRow.reduce((a: number, b: number) => a + b, 0),
          n,
          what,
        );
        assert.ok(
          lay.perRow.every((c: number) => c >= 1),
          what,
        );
        if (lay.rows === 1) {
          assert.equal(lay.riser, null);
          assert.ok(Math.abs(lay.w - n * 0.5 - 0.03) < 1e-9, what);
        } else {
          // the riser: 6 ft units side by side, the fewest that seat everybody
          const cap = (u: number) => Array.from({ length: lay.rows }, (_, i) => (i % 2 ? 4 * u - 1 : 4 * u)).reduce((a, b) => a + b, 0);
          assert.ok(cap(lay.units) >= n && (lay.units === 1 || cap(lay.units - 1) < n), what);
          assert.ok(Math.abs(lay.riser.x1 - lay.riser.x0 - lay.units * SP_RISER_UNIT_W) < 1e-9, what);
          assert.equal(lay.riser.steps.length, lay.rows + 1);
          assert.equal(lay.riser.joins.length, lay.units - 1);
          // each singer stands on its own step, inside the riser
          for (const a of lay.at) {
            assert.ok(a.y > lay.riser.steps[a.row] && a.y < lay.riser.steps[a.row + 1], what);
            assert.ok(a.x - 0.22 >= lay.riser.x0 - 1e-9 && a.x + 0.22 <= lay.riser.x1 + 1e-9, what);
          }
          // window spacing: nobody directly behind the singer in front
          const pitch = (lay.riser.x1 - lay.riser.x0 - (2 * 1.15) / 32) / (4 * lay.units);
          // (every row stands on its own seats, even one whose empty places
          // cannot be split evenly: it stands half a seat off center; visual
          // review, round 2)
          for (const a of lay.at) for (const b of lay.at) if (b.row === a.row + 1) assert.ok(Math.abs(a.x - b.x) >= pitch / 2 - 1e-9, what);
          for (const a of lay.at) for (const b of lay.at) if (a !== b && a.row === b.row) assert.ok(Math.abs(a.x - b.x) >= pitch - 1e-9, what);
        }
        // the print symbol: one circle a singer, inside its footprint
        const sym = spChoirSymbol({ singers: n, rows });
        assert.equal(sym.shapes.filter((s: { t: string }) => s.t === 'circle').length, n, what);
        const b = boundsOf(sym.shapes);
        assert.ok(b.x0 >= -sym.w / 2 - 1e-6 && b.x1 <= sym.w / 2 + 1e-6 && b.y0 >= -sym.h / 2 - 1e-6 && b.y1 <= sym.h / 2 + 1e-6, what);
      }
    }
  });

  for (const [n, rows] of [
    [4, 1],
    [6, 'auto'],
    [20, 'auto'],
    [24, 2],
    [40, 'auto'],
    [60, 4],
    [60, 3],
  ] as const) {
    it(`${n} singers, rows ${rows}: the screen art is illustrated and stays inside its footprint; TURN turns the print`, () => {
      const lay = layoutOf(n, rows);
      const ms = marksOf(ChoirTop({ layout: lay }));
      const solidMs = ms.filter((q) => !q.shadow);
      assert.equal(ms[0]!.shadow, true, 'shadow first');
      assert.equal(solidMs.filter((q) => q.shape === 'figure').length, n);
      const b = boxOf(solidMs);
      const f = { hw: lay.w * 16, hh: lay.h * 16 };
      assert.ok(b.x0 >= -f.hw - 0.05 && b.x1 <= f.hw + 0.05, `x ${b.x0}..${b.x1} in ±${f.hw}`);
      assert.ok(b.y0 >= -f.hh - 0.05 && b.y1 <= f.hh + 0.05, `y ${b.y0}..${b.y1} in ±${f.hh}`);
      assert.ok((b.x1 - b.x0) / (2 * f.hw) >= 0.9, 'fills its width');
      let p = spNewProject({ id: 't', now: NOW });
      p = {
        ...p,
        stage: { ...p.stage, width: 60, depth: 30, unit: 'ft' as const },
      };
      const o0 = spAddObject(p, 'choir', { x: 0.5, y: 0.5 }, { rot: 0, choir: { singers: n, rows } });
      const o90 = spAddObject(p, 'choir', { x: 0.5, y: 0.5 }, { rot: 90, choir: { singers: n, rows } });
      const a = boundsOf(spPlacedShapes(o0.p, o0.p.objects[0]!));
      const c = boundsOf(spPlacedShapes(o90.p, o90.p.objects[0]!));
      assert.ok(Math.abs(a.x1 - a.x0 - lay.w) < 0.3 && Math.abs(a.x1 - a.x0 - (c.y1 - c.y0)) < 1e-6 && Math.abs(a.y1 - a.y0 - (c.x1 - c.x0)) < 1e-6);
      // the screen's box (selection, touch, label room) is the choir's own
      const s = stageArtSize('choir', o0.p.objects[0]);
      assert.ok(Math.abs(s.w - lay.w) < 1e-9 && Math.abs(s.h - lay.h) < 1e-9);
    });
  }

  it('the area microphones follow the width: about one for every 2.5 m, 1 to 6', () => {
    assert.equal(spChoirMics(layoutOf(11, 3)), 1);
    assert.equal(spChoirMics(layoutOf(30, 'auto')), 3); // three units, 5.5 m
    assert.equal(spChoirMics(layoutOf(60, 'auto')), 3); // four units on four rows, 7.3 m
    assert.equal(spChoirMics(layoutOf(60, 1)), 6); // 30 m in one row: at most six
    for (let n = 4; n <= 60; n++) {
      const lay = layoutOf(n, 'auto');
      assert.equal(spChoirMics(lay), Math.max(1, Math.min(6, Math.ceil(lay.w / 2.5 - 1e-9))));
    }
  });

  it('its packages follow its size: the sized one first, the left and right pair second, all in the catalog', () => {
    for (const [n, rows, want] of [
      [11, 'auto', 'choir-one'],
      [30, 'auto', 'choir-three'],
      [12, 'auto', 'choir-two'],
      [8, 2, 'choir-two'],
      [50, 1, 'choir-six'],
    ] as const) {
      const pk = stagePackagesFor('choir', { singers: n, rows });
      assert.equal(pk[0]!.id, want, `${n}/${rows}`);
      assert.equal(pk[0]!.id, spChoirPackageId(spChoirMics(layoutOf(n, rows))));
      assert.ok(pk.some((x) => x.id === 'choir-two'));
      for (const x of pk) {
        assert.ok(SP_PACKAGES.some((y) => y.id === x.id));
        assert.ok(x.rows.every((r) => r.capture === 'mic' && /small-diaphragm condenser/i.test(r.equipment) && r.stand === 'tall-boom'));
        assert.match(x.assumes, /2\.5 m/);
      }
    }
    // the names: Choir; Choir L/R; Choir L/C/R; Choir 1..n
    const names = (id: string) =>
      SP_PACKAGES.find((x) => x.id === id)!
        .rows.map((r) => r.label)
        .join();
    assert.equal(names('choir-one'), 'Choir');
    assert.equal(names('choir-two'), 'Choir L,Choir R');
    assert.equal(names('choir-three'), 'Choir L,Choir C,Choir R');
    assert.equal(names('choir-five'), 'Choir 1,Choir 2,Choir 3,Choir 4,Choir 5');
  });

  it('the review asks when a choir has fewer area microphones than its width needs, or more than one extra', () => {
    const withPkg = (n: number, rows: number | 'auto', pkgId: string) => {
      let p = spNewProject({ id: 'r', now: NOW });
      p = stageAddWithPackage(
        p,
        'choir',
        { x: 0.5, y: 0.4 },
        SP_PACKAGES.find((x) => x.id === pkgId)!,
      ).p;
      return spUpdateObject(p, p.objects[0].id, {
        choir: { singers: n, rows },
      });
    };
    const asks = (p: ReturnType<typeof spNewProject>) => spReview(p).filter((i: { rule: string }) => i.rule === 'choir-mics');
    assert.equal(asks(withPkg(11, 'auto', 'choir-one')).length, 0);
    assert.equal(asks(withPkg(11, 'auto', 'choir-two')).length, 0, 'the L/R pair (rule + 1) stays quiet');
    const many = asks(withPkg(11, 3, 'choir-three'));
    assert.equal(many.length, 1, 'three across 1.85 m is too many');
    assert.match(many[0].text, /feedback/);
    const few = asks(withPkg(40, 'auto', 'choir-one'));
    assert.equal(few.length, 1);
    assert.match(few[0].text, /40 singers in 4 rows/);
    assert.equal(few[0].target.kind, 'source');
    assert.equal(asks(withPkg(40, 'auto', 'choir-three')).length, 0);
  });

  it('a new choir is placed with room for its own riser; a copy keeps its size', () => {
    let p = spNewProject({ id: 'f', now: NOW });
    p = {
      ...p,
      stage: { ...p.stage, width: 40, depth: 24, unit: 'ft' as const },
    };
    p = spAddObject(p, 'grand-piano', { x: 0.5, y: 0.5 }).p;
    const big = { singers: 40, rows: 'auto' as const };
    const spot = stageFreeSpot(p, { x: 0.5, y: 0.5 }, 'choir', big);
    const q = spAddObject(p, 'choir', spot, { choir: big }).p;
    const A = spObjectBoxM(q, q.objects[0]);
    const B = spObjectBoxM(q, q.objects[1]);
    assert.ok(Math.abs(A.cx - B.cx) >= (A.w + B.w) / 2 - 1e-9 || Math.abs(A.cy - B.cy) >= (A.h + B.h) / 2 - 1e-9, 'no overlap');
    const d = spDuplicateObject(q, q.objects[1].id);
    assert.deepEqual(d.p.objects[2].choir, big);
  });

  it('the key lists one choir entry, whatever the sizes; the plot prints each choir at its size with its name off it', () => {
    let p = spNewProject({ id: 'k', now: NOW, band: 'Example' });
    p = {
      ...p,
      stage: { ...p.stage, width: 60, depth: 36, unit: 'ft' as const },
    };
    p = spAddObject(p, 'choir', { x: 0.3, y: 0.35 }, { choir: { singers: 40, rows: 'auto' }, label: 'Mass choir' }).p;
    p = spAddObject(p, 'choir', { x: 0.75, y: 0.7 }, { choir: { singers: 6, rows: 'auto' }, label: 'Soloists' }).p;
    const plot = spPlotDoc(p);
    assert.equal(plot.key.filter((e: { kind: string }) => e.kind === 'choir').length, 1);
    for (const o of p.objects) assert.equal(plot.items.find((x: { id: string }) => x.id === o.id)!.shapes.length, spObjectSymbol(o).shapes.length);
    nameOffSymbol(p, 'two choirs');
    for (const rot of [0, 90]) {
      const one = spAddObject(spNewProject({ id: 'o', now: NOW }), 'choir', { x: 0.5, y: 0.5 }, { rot, choir: { singers: 24, rows: 'auto' }, label: 'Choir' }).p;
      nameOffSymbol(one, `24 singers at ${rot}°`);
    }
    const bytes = spPdfBytes(spBuildDoc(spBuildSnapshot(p, { paper: 'a4', packet: 'full' }, NOW)));
    assert.equal(String.fromCharCode(...bytes.slice(0, 5)), '%PDF-');
  });

  it('the size is set where a choir is added and in its details, from one shared control', () => {
    const palette = src(`${STAGE}/StagePalette.tsx`);
    const inspector = src(`${STAGE}/StageInspector.tsx`);
    assert.match(palette, /<ChoirSize value=\{choir\}/);
    assert.match(palette, /stagePackagesFor\(kind, choir\)/);
    assert.match(inspector, /<ChoirSize value=\{spChoirOf\(o\)\}/);
    assert.match(src(`${STAGE}/stageArt.tsx`), /case 'choir':[\s\S]*?<ChoirTop layout=\{spChoirLayout\(spChoirOf\(o\)\)\} \/>/);
  });

  it('no example band changed: none places a round 2 kind, and their choirs (none) are untouched', async () => {
    const { SP_TEMPLATES, spFromTemplate } = R(await import('../src/features/stageplot/spTemplates.ts'));
    for (const t of SP_TEMPLATES) {
      const p = spFromTemplate(t.id, { id: `x-${t.id}`, now: NOW });
      for (const o of p.objects) assert.ok(!KINDS.includes(o.kind) && o.kind !== 'choir', `${t.id}: ${o.kind}`);
    }
  });
});
