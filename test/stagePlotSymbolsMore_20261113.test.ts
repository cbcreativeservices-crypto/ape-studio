/**
 * Stage Plot and Channel Designer — MORE SYMBOLS FOR MORE DIVERSE MUSIC
 * (owner 2026-11-13: "We also need more symbols for more diverse music").
 *
 * Twenty-two kinds were added: strings (upright bass, cello, violin or viola,
 * harp), keys (grand piano, electric piano, two-tier rig, Hammond organ,
 * Leslie speaker), world and hand percussion (cajón, djembe, tabla, steel
 * pan, vibraphone), electronic (electronic drums, DJ table), folk (banjo,
 * mandolin, accordion), brass and reeds (saxophone, trombone) and a choir on
 * a riser. For EVERY one this file holds:
 *   • it is in the palette and in the key, with a plain name;
 *   • it offers its inputs: real practice, generic categories, never a
 *     brand or model of microphone;
 *   • its on-screen art exists, is illustrated (many parts, several
 *     materials, its shadow first) and keeps to its footprint;
 *   • its print symbol (the PDF's drawing) exists, keeps to its footprint,
 *     turns with TURN, and its printed name never lies over it.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { SP_PALETTE, SP_PACKAGES } = R(await import('../src/features/stageplot/spCatalog.ts'));
const { SP_MORE_KINDS, spSymbol, spPlotKey, spKeySymbol, spKeyKind, spPlacedShapes, spIsSized } = R(await import('../src/features/stageplot/spSymbols.ts'));
const { spNewProject, spAddObject, spAddPackage } = R(await import('../src/features/stageplot/spModel.ts'));
const { spReview } = R(await import('../src/features/stageplot/spReview.ts'));
const { spPlotDoc, spPlotScale, spLabelBlock, SP_PLOT_NOMINAL_W, spBuildSnapshot, spBuildDoc } = R(await import('../src/features/stageplot/spPacket.ts'));
const { spPdfBytes } = R(await import('../src/features/stageplot/spPdf.ts'));
const { stageLinkMode, stagePackagesFor, stageKindForSource, stageKeyEntries } = R(await import('../src/screens/lab/stageplot/stage/stageLinks.ts'));
const { stageDrawOrder: drawOrder, stageKeyLayout, STAGE_KEY_FS } = R(await import('../src/screens/lab/stageplot/stage/stageGeom.ts'));
const { TOP_ART_STRINGS_KEYS, TOP_ART_STRINGS_KEYS_EXTENT } = R(await import('../src/screens/lab/stageplot/stage/topArtStringsKeys.tsx'));
const { TOP_ART_WORLD, TOP_ART_WORLD_EXTENT } = R(await import('../src/screens/lab/stageplot/stage/topArtWorld.tsx'));

type Kind = (typeof SP_MORE_KINDS)[number];
const KINDS = [...SP_MORE_KINDS] as Kind[];
const src = (f: string) => readFileSync(join(process.cwd(), f), 'utf8').replace(/\r\n/g, '\n');
const STAGE = 'src/screens/lab/stageplot/stage';
const ART: Record<string, () => unknown> = { ...TOP_ART_STRINGS_KEYS, ...TOP_ART_WORLD } as Record<string, () => unknown>;
const EXTENT: Record<string, { hw: number; hh: number }> = { ...TOP_ART_STRINGS_KEYS_EXTENT, ...TOP_ART_WORLD_EXTENT };
const NOW = 1_800_000_000_000;

describe('the 22 added kinds', () => {
  it('are the agreed list, once each', () => {
    assert.equal(KINDS.length, 22);
    assert.equal(new Set(KINDS).size, 22);
    assert.deepEqual(
      [...KINDS].sort(),
      ['accordion', 'banjo', 'cajon', 'cello', 'choir', 'dj', 'djembe', 'e-drums', 'electric-piano', 'grand-piano', 'harp', 'keyboard-rig', 'leslie', 'mandolin', 'organ', 'saxophone', 'steel-pan', 'tabla', 'trombone', 'upright-bass', 'vibraphone', 'violin'],
    );
  });

  for (const k of KINDS) {
    it(`${k}: in the palette with a plain name, and in the key with its own entry`, () => {
      const items = SP_PALETTE.filter((x) => x.kind === k);
      assert.equal(items.length, 1, `${k} once in the palette`);
      const it0 = items[0]!;
      assert.equal(it0.group, k === 'choir' ? 'people' : 'instruments');
      assert.equal(it0.sized, false);
      assert.ok(it0.name.length >= 3 && it0.name.length <= 24, `${k}: "${it0.name}"`);
      assert.doesNotMatch(it0.name, /^[A-Z0-9 -]+$/, 'a plain name, not a code');
      const key = spPlotKey([{ kind: k }]);
      assert.equal(key.length, 1);
      assert.equal(key[0]!.kind, k, 'its own key entry (it shares a look with nothing)');
      assert.equal(spKeyKind(k), k);
      assert.ok(key[0]!.name.length >= 3);
      const ks = spKeySymbol(k);
      assert.ok(ks.shapes.length >= 3 && ks.w > 0 && ks.h > 0);
    });
  }

  it('the key of a stage with all of them lists each once, in reading order, and fits a phone in rows of 9 pt text', () => {
    const key = spPlotKey(KINDS.map((kind) => ({ kind })));
    assert.deepEqual(key.map((e) => e.kind).sort(), [...KINDS].sort());
    const entries = stageKeyEntries(KINDS.map((kind) => ({ kind })));
    const L = stageKeyLayout(entries, 366, 'NOT TO SCALE');
    assert.equal(L.cells.length, 22);
    assert.ok(STAGE_KEY_FS >= 9);
    for (const c of L.cells) assert.ok(c.x >= 0 && c.lines.every((ln) => ln.text.length > 0));
  });
});

/* ── inputs ── */

const BRANDS = /shure|sennheiser|neumann|akg|\bdpa\b|audio-?technica|beyer|electro-?voice|r[øo]de\b|countryman|schertler|\bamt\b|radial|countryman|telefunken|royer|coles|sm5[78]|md ?421|e ?60[49]|beta ?\d/i;

describe('every added kind offers its inputs, as they are really done', () => {
  for (const k of KINDS) {
    it(`${k}: asks what it stands for, offers at least one package, generic equipment only`, () => {
      assert.equal(stageLinkMode(k), 'sound');
      const pkgs = stagePackagesFor(k);
      assert.ok(pkgs.length >= 1, `${k} offers a package`);
      for (const pkg of pkgs) {
        assert.ok(pkg.rows.length >= 1);
        assert.ok(pkg.assumes.length > 15);
        for (const r of pkg.rows) {
          assert.doesNotMatch(`${r.label} ${r.equipment}`, BRANDS, `${pkg.id}: ${r.equipment}`);
          assert.match(r.equipment, /microphone|DI|line output/i);
        }
        // the rows become real inputs, stereo sides paired
        const added = spAddPackage(spNewProject({ id: 'p', now: NOW }), pkg);
        assert.equal(added.inputIds.length, pkg.rows.length);
        const sided = added.p.inputs.filter((i: { side: string | null }) => i.side);
        for (const i of sided) assert.ok(i.pairId, `${pkg.id}: ${i.label} is one side of a pair`);
      }
      // a symbol with nothing behind it is asked about in the review
      const p = spAddObject(spNewProject({ id: 'q', now: NOW }), k, { x: 0.5, y: 0.5 }).p;
      assert.ok(spReview(p).some((i: { rule: string }) => i.rule === 'icon-no-input'), `${k} is asked about`);
    });
  }

  const rowsOf = (k: Kind) => stagePackagesFor(k).map((p) => ({ id: p.id, rows: p.rows }));
  const has = (k: Kind, test: (rows: readonly { capture: string; equipment: string; stand: string; side?: string; label: string }[]) => boolean) => rowsOf(k).some((p) => test(p.rows));

  it('the practice a venue engineer expects', () => {
    // upright bass: its pickup through a DI AND a microphone, in one package
    assert.ok(has('upright-bass', (r) => r.some((x) => x.capture === 'di') && r.some((x) => x.capture === 'mic')));
    // pickups on acoustic strings want a high-impedance DI
    for (const k of ['upright-bass', 'cello', 'violin', 'harp', 'banjo', 'mandolin'] as Kind[]) assert.ok(has(k, (r) => r.some((x) => x.capture === 'di' && /high-impedance/.test(x.equipment))), k);
    // cajón: one at the port in the back, one at the front plate
    assert.ok(has('cajon', (r) => r.length === 2 && r.every((x) => x.capture === 'mic') && r.some((x) => /back/i.test(x.label)) && r.some((x) => /front/i.test(x.label))));
    // steel pan and vibraphone: microphones above, on tall stands
    for (const k of ['steel-pan', 'vibraphone'] as Kind[]) assert.ok(has(k, (r) => r.every((x) => x.capture === 'mic' && x.stand === 'tall-boom')), k);
    // DJ: a stereo pair of line inputs
    assert.ok(has('dj', (r) => r.length === 2 && r.every((x) => x.capture === 'line') && r.map((x) => x.side).join('') === 'LR'));
    // Leslie: top left and right, and the bottom; never a DI (it has its own amplifier)
    assert.ok(has('leslie', (r) => r.length === 3 && r.filter((x) => /top/i.test(x.label)).length === 2 && r.some((x) => /bottom/i.test(x.label))));
    for (const p of rowsOf('leslie')) assert.ok(p.rows.every((x) => x.capture === 'mic'), p.id);
    // the organ offers the Leslie's microphones, and a line out for a modern organ
    assert.ok(stagePackagesFor('organ').some((p) => p.id === 'leslie-mics') && stagePackagesFor('organ').some((p) => p.rows.every((x) => x.capture === 'di')));
    // harp: a condenser or its pickup
    assert.ok(has('harp', (r) => r.some((x) => x.capture === 'mic' && /condenser/i.test(x.equipment))));
    // choir: area condensers, at least two, on tall stands
    assert.ok(has('choir', (r) => r.length >= 2 && r.every((x) => x.capture === 'mic' && /condenser/i.test(x.equipment) && x.stand === 'tall-boom')));
    // electronic drums: the module's stereo output through DIs
    assert.ok(has('e-drums', (r) => r.filter((x) => x.side).length === 2 && r.every((x) => x.capture === 'di')));
    // tabla: one microphone a drum
    assert.ok(has('tabla', (r) => r.length === 2 && r.every((x) => x.capture === 'mic')));
    // trombone: a tall boom, beside the slide (a standing player's bell is about 1.5 m up)
    assert.ok(has('trombone', (r) => r.length === 1 && r[0]!.stand === 'tall-boom'));
    // the grand piano has its own pair, low and high, under its own source name
    assert.ok(stagePackagesFor('grand-piano').every((p) => p.source === 'Grand piano'));
    assert.ok(has('grand-piano', (r) => r.map((x) => x.label).join() === 'Piano low,Piano high'));
    // the vibraphone's pair is named low and high, never a side the audience might misread
    assert.ok(has('vibraphone', (r) => r.map((x) => x.label).join() === 'Vibes low,Vibes high'));
    // a stereo package says so
    for (const k of KINDS) for (const p of stagePackagesFor(k)) if (p.rows.some((x) => x.side)) assert.equal(p.stereo, true, p.id);
    // every package the added kinds offer is in the catalog
    for (const k of KINDS) for (const p of stagePackagesFor(k)) assert.ok(SP_PACKAGES.some((x) => x.id === p.id));
  });

  it('a source named for one of them is drawn with its symbol when it is placed from the list', () => {
    const cases: [string, string, Kind][] = [
      ['Upright bass', 'bass', 'upright-bass'],
      ['Double bass', 'bass', 'upright-bass'],
      ['Grand piano', 'keys', 'grand-piano'],
      ['Rhodes', 'keys', 'electric-piano'],
      ['Leslie top', 'keys', 'leslie'],
      ['Hammond', 'keys', 'organ'],
      ['Violin 1', 'other', 'violin'],
      ['Fiddle', 'other', 'violin'],
      ['Cello', 'other', 'cello'],
      ['Harp', 'other', 'harp'],
      ['Banjo', 'guitars', 'banjo'],
      ['Mandolin', 'guitars', 'mandolin'],
      ['Accordion', 'other', 'accordion'],
      ['Cajón', 'percussion', 'cajon'],
      ['Djembe', 'percussion', 'djembe'],
      ['Tabla', 'percussion', 'tabla'],
      ['Steel pan', 'percussion', 'steel-pan'],
      ['Vibes', 'percussion', 'vibraphone'],
      ['E-drums', 'drums', 'e-drums'],
      ['DJ', 'playback', 'dj'],
      ['Tenor sax', 'horns', 'saxophone'],
      ['Trombone 1', 'horns', 'trombone'],
      ['Choir', 'vocals', 'choir'],
    ];
    for (const [label, cat, kind] of cases) assert.equal(stageKindForSource(label, cat as never), kind, label);
    // a blues "harp" is a harmonica, into a microphone; a double bass drum is a drum kit
    assert.equal(stageKindForSource('Blues harp', 'other'), 'vocal-mic');
    assert.equal(stageKindForSource('Harmonica', 'other'), 'vocal-mic');
    assert.notEqual(stageKindForSource('Double bass drum', 'drums'), 'upright-bass');
    assert.notEqual(stageKindForSource('Kettledrums', 'percussion'), 'e-drums');
    assert.equal(stageKindForSource('Grand piano', 'keys'), 'grand-piano');
    assert.equal(stageKindForSource('Organ (Leslie)', 'keys'), 'organ');
    // the old words still land where they did
    assert.equal(stageKindForSource('Trumpet 1', 'other'), 'horn');
    assert.equal(stageKindForSource('Piano', 'keys'), 'piano');
    assert.equal(stageKindForSource('Acoustic guitar', 'guitars'), 'acoustic-guitar');
  });
});

/* ── the on-screen art ── */

type Mat = [number, number, number, number, number, number];
const UNIT: Mat = [1, 0, 0, 1, 0, 0];
const mul = (m: Mat, n: Mat): Mat => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
const at = (m: Mat, x: number, y: number): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
function transformOf(t: unknown): Mat {
  let m = UNIT;
  for (const [, fn, args] of String(t ?? '').matchAll(/(\w+)\(([^)]*)\)/g)) {
    const a = args!.trim().split(/[\s,]+/).map(Number);
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
/** Path points (absolute M L H V C Q A Z): control points and arc boxes, never less than the outline. */
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
    if (cmd === 'M' || cmd === 'L') (x = num()), (y = num()), pts.push([x, y]);
    else if (cmd === 'm' || cmd === 'l') (x += num()), (y += num()), pts.push([x, y]);
    else if (cmd === 'H') (x = num()), pts.push([x, y]);
    else if (cmd === 'h') (x += num()), pts.push([x, y]);
    else if (cmd === 'V') (y = num()), pts.push([x, y]);
    else if (cmd === 'v') (y += num()), pts.push([x, y]);
    else if (cmd === 'C' || cmd === 'Q') for (let k = 0; k < (cmd === 'C' ? 3 : 2); k++) (x = num()), (y = num()), pts.push([x, y]);
    else if (cmd === 'A' || cmd === 'a') {
      const rx = num();
      const ry = num();
      i += 3;
      const ex = cmd === 'a' ? x + num() : num();
      const ey = cmd === 'a' ? y + num() : num();
      for (const [px, py] of [[x, y], [ex, ey]] as [number, number][]) pts.push([px - rx, py - ry], [px + rx, py + ry], [px - rx, py + ry], [px + rx, py - ry]);
      x = ex;
      y = ey;
    } else throw new Error(`a path command this test cannot measure: ${cmd}`);
  }
  return pts;
}
type Mark = { shape: string; fill: string; shadow: boolean; x0: number; x1: number; y0: number; y1: number };
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
    // the house figure (a choir's singers): 476 mm across, 230 mm deep, halo included
    const half = (476 / 2) * Number(p.pxPerMm) + 0.6;
    const [cx, cy] = at(m, Number(p.x), Number(p.y));
    out.push({ shape: 'figure', fill: 'figure', shadow: false, x0: cx - half, x1: cx + half, y0: cy - half * 0.6, y1: cy + half * 0.6 });
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
  if ('d' in p) (shape = 'path'), (pts = pathPoints(String(p.d)));
  else if ('x1' in p) (shape = 'line'), (pts = [[n('x1'), n('y1')], [n('x2'), n('y2')]]);
  else if ('width' in p) (shape = 'rect'), (pts = [[n('x'), n('y')], [n('x') + n('width'), n('y')], [n('x'), n('y') + n('height')], [n('x') + n('width'), n('y') + n('height')]]);
  else if ('r' in p) {
    shape = 'circle';
    const r = n('r');
    pts = [[n('cx') - r, n('cy') - r], [n('cx') + r, n('cy') + r], [n('cx') - r, n('cy') + r], [n('cx') + r, n('cy') - r]];
  } else if ('rx' in p) {
    shape = 'ellipse';
    pts = [[n('cx') - n('rx'), n('cy') - n('ry')], [n('cx') + n('rx'), n('cy') + n('ry')], [n('cx') - n('rx'), n('cy') + n('ry')], [n('cx') + n('rx'), n('cy') - n('ry')]];
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
const boxOf = (ms: Mark[]) => ({ x0: Math.min(...ms.map((q) => q.x0)), x1: Math.max(...ms.map((q) => q.x1)), y0: Math.min(...ms.map((q) => q.y0)), y1: Math.max(...ms.map((q) => q.y1)) });

describe('the on-screen art of every added kind', () => {
  it('the stage draws from both new maps, and each kind has exactly one drawing', () => {
    const stage = src(`${STAGE}/stageArt.tsx`);
    assert.match(stage, /STAGE_TOP_ART: TopArtMap = \{[^}]*\.\.\.TOP_ART_STRINGS_KEYS[^}]*\.\.\.TOP_ART_WORLD[^}]*\}/);
    assert.deepEqual(Object.keys(ART).sort(), [...KINDS].sort());
    assert.deepEqual(Object.keys(EXTENT).sort(), [...KINDS].sort());
    for (const k of KINDS) assert.equal((ART[k] as (...a: unknown[]) => unknown).length, 0, `${k} takes no props`);
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
      assert.ok(e.hw <= f.hw + 1e-9 && e.hh <= f.hh + 1e-9, `${k}: stated extent inside`);
      assert.ok(Math.abs(Math.max(-b.x0, b.x1) - e.hw) <= 0.5, `${k}: hw drawn ${Math.max(-b.x0, b.x1).toFixed(2)}, stated ${e.hw}`);
      assert.ok(Math.abs(Math.max(-b.y0, b.y1) - e.hh) <= 0.5, `${k}: hh drawn ${Math.max(-b.y0, b.y1).toFixed(2)}, stated ${e.hh}`);
      assert.ok(Math.abs(b.x0 + b.x1) <= 1.2 && Math.abs(b.y0 + b.y1) <= 1.2, `${k}: centered (${(b.x0 + b.x1).toFixed(2)}, ${(b.y0 + b.y1).toFixed(2)})`);
      const long = f.hw >= f.hh ? (b.x1 - b.x0) / (2 * f.hw) : (b.y1 - b.y0) / (2 * f.hh);
      assert.ok(long >= 0.9, `${k}: fills ${(long * 100).toFixed(0)} % of its long side`);
    });
  }

  it('pure drawings: no text, no image file, no hooks, no animation; only the drawing package, the contract and the house figure', () => {
    for (const f of ['topArtStringsKeys.tsx', 'topArtWorld.tsx']) {
      const code = src(`${STAGE}/${f}`).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
      assert.doesNotMatch(code, /<Text\b|SvgText|<TSpan\b/, f);
      assert.doesNotMatch(code, /\bImage\b|require\(|\.png|\.jpg|\.webp/, f);
      assert.doesNotMatch(code, /\buse[A-Z]\w*\s*\(/, f);
      assert.doesNotMatch(code, /Animated|reanimated|setState|setInterval|setTimeout/, f);
      const from = [...code.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]).sort();
      assert.deepEqual(from, f === 'topArtWorld.tsx' ? ['../../../../features/lab/figureAboveSvg', './topArtTypes', 'react-native-svg'] : ['./topArtTypes', 'react-native-svg'], f);
    }
  });

  it('each one is the right way round for its player (upstage, facing the audience)', () => {
    const parts = (k: Kind, fill: string) => solid(k).filter((q) => q.fill === fill);
    const mid = (q: Mark) => ({ x: (q.x0 + q.x1) / 2, y: (q.y0 + q.y1) / 2 });
    // keyboards: the ivory keys are on the player's side (upstage, −y) of the case
    for (const k of ['electric-piano', 'keyboard-rig'] as Kind[]) {
      const keys = parts(k, '#e8e6dd').sort((a, b) => a.y0 - b.y0)[0]!;
      assert.ok(mid(keys).y < 0, `${k}: keys upstage`);
    }
    // the grand: keys and bench at stage right (−x), in concert placement
    assert.ok(parts('grand-piano', '#e8e6dd').length > 0 && parts('grand-piano', '#e8e6dd').every((q) => mid(q).x < -12), 'grand: keys at stage right');
    // the organ: the bench upstage of the console
    assert.ok(solid('organ').some((q) => q.shape === 'rect' && q.fill === '#5a3a22' && q.y1 < -7), 'organ: the bench upstage');
    // the tabla: the small dayan at the player's right (−x), the bayan at the left
    const heads = solid('tabla').filter((q) => q.shape === 'circle' && q.fill === '#dccfae').sort((a, b) => a.x1 - a.x0 - (b.x1 - b.x0));
    assert.ok(mid(heads[0]!).x < 0 && mid(heads[1]!).x > 0, 'tabla: dayan right, bayan left');
    // the e-kit: the throne upstage, the module and hi-hat on the drummer's left (+x)
    const throne = solid('e-drums').find((q) => q.fill === '#1b1c20' && q.shape === 'circle' && Math.abs(mid(q).x) < 0.01)!;
    assert.ok(mid(throne).y < -10, 'e-drums: throne upstage');
    // the trombone: the slide reaches the audience, the bell is on the player's left
    const brass = solid('trombone').filter((q) => q.fill === '#b39b48' && q.shape === 'path');
    const bell = brass.sort((a, b) => b.x1 - b.x0 - (a.x1 - a.x0))[0]!;
    assert.ok(mid(bell).x > 0, 'trombone: bell on the player’s left');
    // the vibraphone: the low end (the longest bars) at the player's left, +x
    const bars = solid('vibraphone').filter((q) => q.fill === '#b9bcc2');
    const longest = bars.sort((a, b) => b.y1 - b.y0 - (a.y1 - a.y0))[0]!;
    assert.ok(mid(longest).x > 15, 'vibraphone: low end at +x');
    // the violin: its scroll forward and to the player's left (+x, +y)
    assert.ok(solid('violin').some((q) => q.shape === 'circle' && mid(q).x > 4 && mid(q).y > 5), 'violin: scroll forward left');
    // the cello: its chair upstage, the endpin toward the audience
    assert.ok(solid('cello').some((q) => q.shape === 'line' && q.y1 > 14), 'cello: endpin downstage');
  });

  it('the added instruments are painted under the performers, as the drum kit is', () => {
    const objs = ['performer', ...KINDS].map((kind, i) => ({ id: `o${i}`, kind })) as never[];
    const order = (drawOrder(objs) as { kind: string }[]).map((o) => o.kind);
    for (const k of KINDS) assert.ok(order.indexOf(k) < order.indexOf('performer'), k);
  });
});

/* ── the print symbol: the PDF's drawing ── */

function boundsOf(shapes: readonly { t: string; [k: string]: unknown }[]) {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const s of shapes as never[] as Record<string, number & number[]>[]) {
    if ((s as { t: string }).t === 'circle') xs.push(s.cx - s.r, s.cx + s.r), ys.push(s.cy - s.r, s.cy + s.r);
    else if ((s as { t: string }).t === 'line') xs.push(s.x1, s.x2), ys.push(s.y1, s.y2);
    else if ((s as { t: string }).t === 'poly') s.pts.forEach((v: number, i: number) => (i % 2 ? ys : xs).push(v));
    else xs.push(s.x, s.x + s.w), ys.push(s.y, s.y + s.h);
  }
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

describe('the print symbol of every added kind (what the PDF draws)', () => {
  for (const k of KINDS) {
    it(`${k}: several shapes, inside its footprint; TURN turns it`, () => {
      const sym = spSymbol(k);
      assert.ok(sym.shapes.length >= 3, `${k}: ${sym.shapes.length} shapes`);
      assert.equal(spIsSized(k), false);
      const b = boundsOf(sym.shapes);
      assert.ok(b.x0 >= -sym.w / 2 - 1e-6 && b.x1 <= sym.w / 2 + 1e-6, `${k}: x ${b.x0}..${b.x1} in ±${sym.w / 2}`);
      assert.ok(b.y0 >= -sym.h / 2 - 1e-6 && b.y1 <= sym.h / 2 + 1e-6, `${k}: y ${b.y0}..${b.y1} in ±${sym.h / 2}`);
      // a quarter turn swaps its width and depth on the plot
      const p = spNewProject({ id: 't', now: NOW });
      const o0 = spAddObject(p, k, { x: 0.5, y: 0.5 }, { rot: 0 });
      const o90 = spAddObject(p, k, { x: 0.5, y: 0.5 }, { rot: 90 });
      const a = boundsOf(spPlacedShapes(o0.p, o0.p.objects[0]!));
      const c = boundsOf(spPlacedShapes(o90.p, o90.p.objects[0]!));
      assert.ok(Math.abs(a.x1 - a.x0 - (c.y1 - c.y0)) < 1e-6 && Math.abs(a.y1 - a.y0 - (c.x1 - c.x0)) < 1e-6, `${k}: turned`);
    });
  }

  it('a plot with all of them prints each one with its symbol and its name off the drawing, in the key, and makes a PDF', () => {
    let p = spNewProject({ id: 'all', now: NOW, band: 'Example' });
    p = { ...p, stage: { ...p.stage, width: 60, depth: 30, unit: 'ft' as const } };
    KINDS.forEach((k, i) => {
      p = spAddObject(p, k, { x: 0.1 + (i % 6) * 0.16, y: 0.12 + Math.floor(i / 6) * 0.25 }, { label: spSymbol(k) ? SP_PALETTE.find((x) => x.kind === k)!.name : '' }).p;
    });
    const plot = spPlotDoc(p);
    assert.equal(plot.items.length, 22);
    for (const o of p.objects) {
      const item = plot.items.find((x: { id: string }) => x.id === o.id)!;
      assert.equal(item.shapes.length, spSymbol(o.kind).shapes.length, `${o.kind}: drawn whole`);
    }
    assert.deepEqual(plot.key.map((e: { kind: string }) => e.kind).sort(), [...KINDS].sort());
    const doc = spBuildDoc(spBuildSnapshot(p, { paper: 'letter', packet: 'plot' }, NOW));
    const bytes = spPdfBytes(doc);
    assert.equal(String.fromCharCode(...bytes.slice(0, 5)), '%PDF-');
    assert.ok(bytes.length > 4000);
  });

  for (const rot of [0, 90]) {
    it(`each one alone on a stage, turned ${rot}°: its printed name never lies over its symbol`, () => {
      for (const k of KINDS) {
        let p = spNewProject({ id: 'one', now: NOW });
        p = spAddObject(p, k, { x: 0.5, y: 0.5 }, { rot, label: SP_PALETTE.find((x) => x.kind === k)!.name }).p;
        const plot = spPlotDoc(p);
        const kk = spPlotScale(plot, SP_PLOT_NOMINAL_W);
        const item = plot.items[0]!;
        const lb = spLabelBlock(item);
        assert.ok(lb.h > 0, `${k}: named on the drawing`);
        const x0 = item.labelAt.x - lb.labelW / kk / 2;
        const box = { x0, y0: item.labelAt.y, x1: x0 + lb.w / kk, y1: item.labelAt.y + lb.h / kk };
        for (const part of item.shapes.map((s: never) => boundsOf([s]))) {
          const ov = Math.max(0, Math.min(box.x1, part.x1) - Math.max(box.x0, part.x0)) * Math.max(0, Math.min(box.y1, part.y1) - Math.max(box.y0, part.y0));
          assert.ok(ov < 1e-9, `${k} at ${rot}°: the name lies over the symbol`);
        }
      }
    });
  }
});

/* ── the examples keep their layouts ── */

describe('the examples', () => {
  it('none of the five examples changed: no added kind is placed in them', async () => {
    const { SP_TEMPLATES, spFromTemplate } = R(await import('../src/features/stageplot/spTemplates.ts'));
    for (const t of SP_TEMPLATES) {
      const p = spFromTemplate(t.id, { id: `x-${t.id}`, now: NOW });
      for (const o of p.objects) assert.ok(!KINDS.includes(o.kind), `${t.id}: ${o.kind}`);
    }
  });
});
