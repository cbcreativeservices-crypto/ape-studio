/**
 * Stage shapes: printed labels never collide (fix 2026-11-13).
 *
 * THE DEFECT: on a thrust (and in the round) the printed plot's names ran into
 * each other and into symbols: "13" on Nina, "M4 M4", "Lead vocal 11" over its
 * microphone, "Guitar amp" over the amp. The names were placed for one size of
 * drawing, and the PDF drew the taller shaped stage SMALLER (giving way for its
 * legend, or a roomy plot with no room) while the words kept their size; the
 * PDF also prints some words wider than the estimate ("M4").
 *
 * THE FIX: a shaped stage's names are placed for the smallest drawing any
 * renderer makes, with the PDF's own word widths (`SP_PLOT_SHAPED_K`,
 * `spLabelBlockPrinted`), and the PDF never draws a shaped stage smaller than
 * that (its legend runs on instead). A rectangle is untouched.
 *
 * HOW IT IS PROVEN: geometry, not eyes. Each plot is printed (Letter and A4;
 * full, compact and plot-only), the PDF's own drawing scale is read back from
 * the stage outline it drew, every printed name is found in the PDF at the
 * place the test works out, and then every name row (name + its number and
 * mix boxes) is checked against every other row and every symbol's footprint.
 * The HTML print sheet and the export preview are checked the same way.
 *
 * Run: node --test --test-timeout=120000 test/stagePlotShapeLabels_20261113.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { SP_PALETTE } from '../src/features/stageplot/spCatalog.ts';
import type { SpDocPlot, SpDocPlotItem } from '../src/features/stageplot/spDocTypes.ts';
import * as M from '../src/features/stageplot/spModel.ts';
import { SP_PLOT_SHAPED_K, SP_PLOT_TYPE, spBadgeW, spBuildDoc, spBuildSnapshot, spLabelBlock, spLabelBlockPrinted, spPlotDoc, spPlotScale } from '../src/features/stageplot/spPacket.ts';
import { SP_PAGE_MARGIN, SP_PAGES, SP_ROOMY_H, spPlotPreview, spPlotScene } from '../src/features/stageplot/spPacketHtml.ts';
import { SP_PDF_MARGIN, SP_PDF_PAPER, SP_PDF_PLOT, spPdfBytes } from '../src/features/stageplot/spPdf.ts';
import { spPdfEncode, spPdfWidth } from '../src/features/stageplot/spPdfFonts.ts';
import { SP_MORE_KINDS, spIsSized, spSymbol, type SpShape } from '../src/features/stageplot/spSymbols.ts';
import { spFromTemplate } from '../src/features/stageplot/spTemplates.ts';
import type { SpPaper, SpProject } from '../src/features/stageplot/spTypes.ts';
import * as G from '../src/screens/lab/stageplot/stage/stageGeom.ts';
import * as L from '../src/screens/lab/stageplot/stage/stageLinks.ts';

const NOW = Date.UTC(2026, 10, 13, 20, 0);
type Box = { x0: number; y0: number; x1: number; y1: number };

/* ── the plots ─────────────────────────────────────────────────────────── */

const byLabel = (p: SpProject, label: string) => p.objects.find((o) => o.label === label);
const move = (p: SpProject, label: string, x: number, y: number): SpProject => {
  const o = byLabel(p, label);
  return o ? M.spMoveObject(p, o.id, { x, y }, { snap: false }) : p;
};
const sized = (p: SpProject, w: number, d: number): SpProject => M.spEdit(p, (q) => Object.assign(q.stage, { width: w, depth: d, unit: 'ft', dims: 'confirmed' }));
const four = (id: string): SpProject => spFromTemplate('four-piece', { id, now: NOW, band: 'The Example Four' });
const salsa = (id: string): SpProject => spFromTemplate('salsa', { id, now: NOW, band: 'Orquesta Ejemplo' });
function allNewSymbols(): SpProject {
  let p = M.spNewProject({ id: 'p-syms', now: NOW, band: 'Example' });
  p = { ...p, stage: { ...p.stage, width: 60, depth: 30, unit: 'ft', dims: 'confirmed' } };
  [...SP_MORE_KINDS].forEach((k, i) => {
    p = M.spAddObject(p, k, { x: 0.1 + (i % 6) * 0.16, y: 0.12 + Math.floor(i / 6) * 0.25 }, { label: spSymbol(k) ? (SP_PALETTE.find((x) => x.kind === k)?.name ?? '') : '' }).p;
  });
  return p;
}

/** The plots of the bug report (the builder's own render script) and more. */
function shapedPlots(): Record<string, SpProject> {
  // the report's picture: the four-piece on a 24 × 16 ft stage, a 10 × 8 ft thrust, the singer out on it
  let thrust = M.spSetStageShape(sized(four('p-thrust'), 24, 16), { shape: 'thrust', thrustWidth: 10, thrustDepth: 8 });
  thrust = move(thrust, 'Lead vocal', 0.5, 1.3);
  thrust = move(thrust, 'Wedge 1', 0.5, 1.42);
  const sam = thrust.objects.find((x) => x.performerId && thrust.performers.find((pf) => pf.id === x.performerId)?.name === 'Sam');
  if (sam) thrust = M.spMoveObject(thrust, sam.id, { x: 0.5, y: 1.2 }, { snap: false });
  const round = M.spSetStageShape(sized(four('p-round'), 30, 30), { shape: 'round', roundForm: 'circle', roundRef: 'FOH' });
  let wings = M.spSetStageShape(sized(four('p-wings'), 24, 16), { shape: 'wings', wingWidth: 6 });
  wings = move(wings, 'In-ear transmitter', -0.12, 0.2);
  wings = move(wings, 'Keys headphone amplifier', 1.12, 0.3);
  wings = M.spAddBox(wings, { name: 'SB1', inputs: 16, returns: 8, kind: 'digital', supplier: 'venue' }).p;
  wings = M.spAutoAssignBoxes(wings).p;
  let salsaBoxedThrust = M.spSetStageShape(salsa('p-sb-thrust'), { shape: 'thrust' });
  salsaBoxedThrust = M.spAddBox(salsaBoxedThrust, { name: 'SB1', inputs: 16, returns: 8, kind: 'digital', supplier: 'venue', at: { x: 0.25, y: 0.06 } }).p;
  salsaBoxedThrust = M.spAddBox(salsaBoxedThrust, { name: 'SB2', inputs: 12, returns: 4, kind: 'analog', supplier: 'venue', at: { x: 0.8, y: 0.06 } }).p;
  salsaBoxedThrust = M.spAutoAssignBoxes(salsaBoxedThrust).p;
  const syms = allNewSymbols();
  return {
    'four-piece, thrust 10 × 8 ft (the report)': thrust,
    'four-piece, round 30 ft circle': round,
    'four-piece, wings 6 ft, gear in the wings, a stage box': wings,
    'four-piece, thrust (usual size)': M.spSetStageShape(four('p-t2'), { shape: 'thrust' }),
    'four-piece, round square': M.spSetStageShape(four('p-r2'), { shape: 'round', roundForm: 'square' }),
    'four-piece, wings (usual width)': M.spSetStageShape(four('p-w2'), { shape: 'wings' }),
    'salsa, thrust': M.spSetStageShape(salsa('p-st'), { shape: 'thrust' }),
    'salsa, round square': M.spSetStageShape(salsa('p-sr'), { shape: 'round', roundForm: 'square' }),
    'salsa, wings': M.spSetStageShape(salsa('p-sw'), { shape: 'wings' }),
    'salsa, thrust, two stage boxes': salsaBoxedThrust,
    'the 22 new symbols, thrust': M.spSetStageShape(syms, { shape: 'thrust', thrustWidth: 20, thrustDepth: 10 }),
    'the 22 new symbols, round': M.spSetStageShape(syms, { shape: 'round', roundForm: 'square', roundRef: 'FOH' }),
    'the 22 new symbols, wings': M.spSetStageShape(syms, { shape: 'wings', wingWidth: 10 }),
  };
}

/* ── geometry ──────────────────────────────────────────────────────────── */

const TOL = 0.2; // points: two boxes that only touch do not collide
const hit = (a: Box, b: Box): boolean => Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > TOL && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > TOL;
const apart = (a: Box, b: Box): number => Math.hypot(Math.max(0, a.x0 - b.x1, b.x0 - a.x1), Math.max(0, a.y0 - b.y1, b.y0 - a.y1));
function shapeBox(s: SpShape): Box {
  if (s.t === 'circle') return { x0: s.cx - s.r, y0: s.cy - s.r, x1: s.cx + s.r, y1: s.cy + s.r };
  if (s.t === 'line') return { x0: Math.min(s.x1, s.x2), y0: Math.min(s.y1, s.y2), x1: Math.max(s.x1, s.x2), y1: Math.max(s.y1, s.y2) };
  if (s.t === 'poly') {
    const xs = s.pts.filter((_, i) => i % 2 === 0);
    const ys = s.pts.filter((_, i) => i % 2 === 1);
    return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
  }
  return { x0: s.x, y0: s.y, x1: s.x + s.w, y1: s.y + s.h };
}

/** Does a line pass through a box (shrunk by TOL, so a line that only
 *  grazes an edge does not count)? */
function segCuts(box: Box, [x1, y1, x2, y2]: [number, number, number, number]): boolean {
  const b = { x0: box.x0 + TOL, y0: box.y0 + TOL, x1: box.x1 - TOL, y1: box.y1 - TOL };
  let t0 = 0;
  let t1 = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  for (const [q, r] of [[-dx, x1 - b.x0], [dx, b.x1 - x1], [-dy, y1 - b.y0], [dy, b.y1 - y1]] as [number, number][]) {
    if (Math.abs(q) < 1e-12) {
      if (r < 0) return false;
    } else {
      const t = r / q;
      if (q < 0) t0 = Math.max(t0, t);
      else t1 = Math.min(t1, t);
      if (t0 > t1) return false;
    }
  }
  return true;
}

/** A plot drawn at `k` points per meter: meters → points (y down). */
type Map2 = { k: number; X: (x: number) => number; Y: (y: number) => number };
type Row = { id: string; text: string; box: Box; leader: boolean };
type Part = { id: string; box: Box };

/** Every symbol's footprint: one box per shape, as the placer counts it
 *  (a platform, a riser or a labeled area, is not a footprint: a name may
 *  stand on it). A stroke reaches half its width past the line. */
function partsOf(p: SpProject, plot: SpDocPlot, m: Map2): Part[] {
  const kind = new Map(p.objects.map((o) => [o.id, o.kind]));
  const out: Part[] = [];
  for (const it of plot.items) {
    const k = kind.get(it.id);
    if (!k || spIsSized(k)) continue;
    for (const s of it.shapes) {
      const b = shapeBox(s);
      out.push({ id: it.id, box: { x0: m.X(b.x0) - 0.5, y0: m.Y(b.y0) - 0.5, x1: m.X(b.x1) + 0.5, y1: m.Y(b.y1) + 0.5 } });
    }
  }
  return out;
}

/** Each name row as the PDF prints it (the name centered on `labelAt`, its
 *  boxes after it, every word as wide as Helvetica prints it). */
function pdfRows(plot: SpDocPlot, m: Map2): Row[] {
  const rows: Row[] = [];
  for (const it of plot.items) {
    const b = spLabelBlockPrinted(it);
    if (!b.h) continue;
    const x0 = m.X(it.labelAt.x) - b.labelW / 2;
    const y0 = m.Y(it.labelAt.y);
    rows.push({ id: it.id, text: `${it.label}${it.badges.length ? ` [${it.badges.join(' ')}]` : ''}`, box: { x0, y0, x1: x0 + b.w, y1: y0 + b.h }, leader: !!it.leader });
  }
  return rows;
}

/** The HTML sheet / preview row: badges laid out from the estimate (as the
 *  scene draws them), the name as wide as it really prints, centered. */
function htmlRows(plot: SpDocPlot, m: Map2): Row[] {
  const T = SP_PLOT_TYPE;
  const rows: Row[] = [];
  for (const it of plot.items) {
    const est = spLabelBlock(it);
    if (!est.h) continue;
    const fs = it.person ? T.person : T.label;
    const real = it.label ? Math.max(est.labelW, spPdfWidth(spPdfEncode(it.label), fs, it.person)) : 0;
    const cx = m.X(it.labelAt.x);
    const left = cx - est.labelW / 2;
    const badgesEnd = left + est.labelW + est.gap + it.badges.reduce((w, b) => w + spBadgeW(b), 0) + Math.max(0, it.badges.length - 1) * T.badgeGap;
    const y0 = m.Y(it.labelAt.y);
    rows.push({ id: it.id, text: it.label || it.badges.join(' '), box: { x0: Math.min(left, cx - real / 2), y0, x1: Math.max(badgesEnd, cx + real / 2), y1: y0 + est.h }, leader: !!it.leader });
  }
  return rows;
}

/** Every collision on a drawing, in words (empty = clean); and every row
 *  with no leader that stands nearer another symbol than its own. */
function collisions(rows: Row[], parts: Part[]): string[] {
  const bad: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) if (hit(rows[i].box, rows[j].box)) bad.push(`"${rows[i].text}" runs into "${rows[j].text}"`);
    for (const q of parts) if (hit(rows[i].box, q.box)) bad.push(`"${rows[i].text}" lies over ${q.id === rows[i].id ? 'its own symbol' : `the symbol of ${rows.find((r) => r.id === q.id)?.text ?? q.id}`}`);
  }
  return [...new Set(bad)];
}
/** A name with no leader is nearer its own symbol than any other. Names are
 *  placed at `placedK` (points per meter); drawn at `k` ≥ that, everything
 *  grows by k / placedK (which keeps every "nearer") and each row, whose
 *  size in points does not grow, shrinks toward its anchor: no edge moves
 *  more than (1 − placedK / k) × its diagonal. That much is allowed, twice
 *  (own and other); at the placed size, nothing is. */
function strays(rows: Row[], parts: Part[], k: number, placedK: number): string[] {
  const bad: string[] = [];
  for (const r of rows) {
    if (r.leader) continue;
    const own = Math.min(...parts.filter((q) => q.id === r.id).map((q) => apart(r.box, q.box)));
    if (!Number.isFinite(own)) continue; // a platform's name: on or under its platform
    const other = Math.min(...parts.filter((q) => q.id !== r.id).map((q) => apart(r.box, q.box)));
    const drift = 2 * Math.max(0, 1 - placedK / k) * Math.hypot(r.box.x1 - r.box.x0, r.box.y1 - r.box.y0);
    if (other + drift + 0.05 < own) bad.push(`"${r.text}" stands nearer another symbol (${other.toFixed(1)} pt) than its own (${own.toFixed(1)} pt)`);
  }
  return bad;
}
/** The size a shaped plot's names were placed for (spPacket.ts). */
const placedKOf = (plot: SpDocPlot): number => spPlotScale({ ...plot, roomy: false }, SP_PLOT_SHAPED_K.width) * SP_PLOT_SHAPED_K.give;
const atPlaced = (plot: SpDocPlot): Map2 => {
  const k = placedKOf(plot);
  return { k, X: (x) => (plot.marginM + x) * k, Y: (y) => (plot.marginM + y) * k };
};

/* ── reading the PDF back ──────────────────────────────────────────────── */

type PdfText = { x: number; y: number; size: number; bold: boolean; text: string };
const pdfDecode = (s: string): string => s.replace(/\\([0-7]{1,3}|.)/g, (_, e: string) => (/^[0-7]+$/.test(e) ? String.fromCharCode(parseInt(e, 8)) : e));
function pages(bytes: Uint8Array): string[] {
  const all = Buffer.from(bytes).toString('latin1');
  const out: string[] = [];
  const re = /stream\n([\s\S]*?)\nendstream/g;
  for (let m = re.exec(all); m; m = re.exec(all)) out.push(m[1]);
  return out;
}
function texts(page: string): PdfText[] {
  const out: PdfText[] = [];
  const re = /BT \S+ g 1 0 0 1 (-?[\d.]+) (-?[\d.]+) Tm \/F([12]) ([\d.]+) Tf \(((?:\\.|[^\\)])*)\) Tj ET/g;
  for (let m = re.exec(page); m; m = re.exec(page)) out.push({ x: +m[1], y: +m[2], bold: m[3] === '2', size: +m[4], text: pdfDecode(m[5]) });
  return out;
}
/** The points of every stroked path drawn `width` points wide. */
function paths(page: string, width: number): number[][] {
  const out: number[][] = [];
  for (const line of page.split('\n')) {
    if (!line.startsWith(`${width} w `)) continue;
    const nums: number[] = [];
    const toks = line.split(' ');
    let pending: number[] = [];
    for (const t of toks.slice(toks.indexOf('d') + 1)) {
      if (/^-?[\d.]+$/.test(t)) pending.push(+t);
      else if (t === 'm' || t === 'l' || t === 'c') {
        nums.push(...pending);
        pending = [];
      } else pending = [];
    }
    if (nums.length >= 8) out.push(nums);
  }
  return out;
}
const boxOfPts = (pts: number[]): Box => {
  const xs = pts.filter((_, i) => i % 2 === 0);
  const ys = pts.filter((_, i) => i % 2 === 1);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
};

/** The PDF's own drawing scale and place, read back from the stage outline
 *  it drew: its box in points against the outline's box in meters. */
function pdfMap(page: string, plot: SpDocPlot, pageH: number): Map2 {
  const deck = plot.deck;
  assert.ok(deck, 'a shaped plot has its own outline');
  const heavy = deck.front.all ? 3 : 1.4;
  const drawn = paths(page, heavy).filter((p) => p.length >= 8);
  assert.ok(drawn.length >= 1, 'the outline is in the PDF');
  const pt = boxOfPts(drawn.reduce((a, b) => (boxOfPts(a).x1 - boxOfPts(a).x0 >= boxOfPts(b).x1 - boxOfPts(b).x0 ? a : b)));
  const ol = deck.outline;
  const mb: Box = ol.t === 'circle' ? { x0: ol.cx - ol.r, y0: ol.cy - ol.r, x1: ol.cx + ol.r, y1: ol.cy + ol.r } : boxOfPts(ol.pts);
  const k = (pt.x1 - pt.x0) / (mb.x1 - mb.x0);
  const kY = (pt.y1 - pt.y0) / (mb.y1 - mb.y0);
  assert.ok(Math.abs(k - kY) < 0.01, `one scale both ways (${k} / ${kY})`);
  // in this test's points, y runs DOWN from the top of the page
  return { k, X: (x) => pt.x0 + (x - mb.x0) * k, Y: (y) => pageH - pt.y1 + (y - mb.y0) * k };
}

/** Each printed name (not a number or a code: those are in their boxes) is
 *  in the PDF where `pdfRows` says, so the rows measured are the rows printed. */
function assertNamesWhereSaid(page: string, plot: SpDocPlot, m: Map2, pageH: number, what: string): void {
  const T = SP_PLOT_TYPE;
  const found = texts(page);
  for (const it of plot.items) {
    if (!it.label) continue;
    const fs = it.person ? T.person : T.label;
    const enc = spPdfEncode(it.label);
    const w = spLabelBlockPrinted({ ...it, badges: [] }).labelW;
    if (w + 4 >= 500) continue; // a name too long for the sheet is wrapped: not this test's case
    const left = m.X(it.labelAt.x) - w / 2 + (w - spPdfWidth(enc, fs, it.person)) / 2;
    const t = found.find((x) => x.text === enc && x.size === fs && x.bold === it.person && Math.abs(x.x - left) < 0.2);
    assert.ok(t, `${what}: "${it.label}" printed at x ${left.toFixed(2)}`);
    const h = it.badges.length ? T.badgeH + 2 : fs + 3;
    const baseline = pageH - (m.Y(it.labelAt.y) + h / 2 + fs * 0.36);
    assert.ok(Math.abs(t.y - baseline) < 0.2, `${what}: "${it.label}" printed on its line (${t.y} vs ${baseline.toFixed(2)})`);
  }
}

/* ── the tests ─────────────────────────────────────────────────────────── */

const PLOTS = shapedPlots();
const PAPERS: SpPaper[] = ['letter', 'a4'];
const PACKETS = ['full', 'compact', 'plot'] as const;

describe('shaped stages: the printed PDF', () => {
  for (const [name, p] of Object.entries(PLOTS)) {
    it(`${name}: no name, number or mix code runs into another or lies over a symbol (Letter and A4; full, compact, plot)`, () => {
      for (const paper of PAPERS) {
        for (const packet of PACKETS) {
          const what = `${name} · ${paper} · ${packet}`;
          const doc = spBuildDoc(spBuildSnapshot(p, { paper, packet }, NOW));
          const plot = doc.sections.flatMap((s) => s.blocks).find((b) => b.t === 'plot');
          assert.ok(plot && plot.t === 'plot', `${what}: has a plot`);
          const pageH = SP_PDF_PAPER[paper].h;
          const page = pages(spPdfBytes(doc)).find((pg) => paths(pg, plot.plot.deck?.front.all ? 3 : 1.4).length > 0);
          assert.ok(page, `${what}: the plot's page`);
          const m = pdfMap(page, plot.plot, pageH);
          assertNamesWhereSaid(page, plot.plot, m, pageH, what);
          const rows = pdfRows(plot.plot, m);
          const parts = partsOf(p, plot.plot, m);
          assert.deepEqual(collisions(rows, parts), [], what);
          assert.deepEqual(strays(rows, parts, m.k, placedKOf(plot.plot)), [], what);
        }
      }
    });
  }

  for (const [name, p] of Object.entries(PLOTS)) {
    it(`${name}: at the size its names were placed for, each name without a leader is nearer its own symbol than any other, and nothing collides`, () => {
      const plot = spPlotDoc(p);
      const m = atPlaced(plot);
      const rows = pdfRows(plot, m);
      const parts = partsOf(p, plot, m);
      assert.deepEqual(collisions(rows, parts), [], name);
      assert.deepEqual(strays(rows, parts, m.k, m.k), [], name);
      // no name lies across the shape's own lines (its outline, the wings'
      // dashed edges), and none lies on another name's leader
      const deck = plot.deck as NonNullable<SpDocPlot['deck']>;
      const segs: [number, number, number, number][] = [];
      if (deck.outline.t === 'poly') {
        const q = deck.outline.pts;
        for (let n = 0; n + 1 < q.length; n += 2) segs.push([q[n], q[n + 1], q[(n + 2) % q.length], q[(n + 3) % q.length]]);
      }
      for (const a of deck.areas) segs.push([a.x, a.y, a.x + a.w, a.y], [a.x + a.w, a.y, a.x + a.w, a.y + a.h], [a.x + a.w, a.y + a.h, a.x, a.y + a.h], [a.x, a.y + a.h, a.x, a.y]);
      const toPt = (s: [number, number, number, number]): [number, number, number, number] => [m.X(s[0]), m.Y(s[1]), m.X(s[2]), m.Y(s[3])];
      const across: string[] = [];
      for (const r of rows) {
        for (const s of segs) if (segCuts(r.box, toPt(s))) across.push(`"${r.text}" lies across the stage's line`);
        if (deck.outline.t === 'circle') {
          const c = { x: m.X(deck.outline.cx), y: m.Y(deck.outline.cy), r: deck.outline.r * m.k };
          const b = r.box;
          const near = Math.hypot(Math.max(0, b.x0 - c.x, c.x - b.x1), Math.max(0, b.y0 - c.y, c.y - b.y1));
          const far = Math.hypot(Math.max(Math.abs(b.x0 - c.x), Math.abs(b.x1 - c.x)), Math.max(Math.abs(b.y0 - c.y), Math.abs(b.y1 - c.y)));
          if (near < c.r - TOL && c.r + TOL < far) across.push(`"${r.text}" lies across the circle`);
        }
        // (the 22-symbol plot packs a symbol every few feet: there a leader
        // may run behind a name when no place has one that does not)
        for (const it of plot.items) {
          if (!it.leader || it.id === r.id || name.startsWith('the 22 new symbols')) continue;
          if (segCuts(r.box, toPt([it.leader.from.x, it.leader.from.y, it.leader.to.x, it.leader.to.y]))) across.push(`"${r.text}" lies on the leader of ${it.label || it.badges.join(' ')}`);
        }
      }
      assert.deepEqual(across, [], name);
      // a name that could not stand beside its symbol has a leader to it
      for (const it of plot.items.filter((x) => x.leader)) {
        const l = it.leader as NonNullable<SpDocPlotItem['leader']>;
        assert.ok(Math.hypot(l.to.x - it.at.x, l.to.y - it.at.y) < 1e-9, `${name}: the leader ends on its own symbol`);
      }
    });
  }

  it('the report\'s plot: "13" is off Nina, one M4 each, "Lead vocal" and "Guitar amp" clear of their symbols (A4, plot only)', () => {
    const p = PLOTS['four-piece, thrust 10 × 8 ft (the report)'];
    const doc = spBuildDoc(spBuildSnapshot(p, { paper: 'a4', packet: 'plot' }, NOW));
    const plot = doc.sections.flatMap((s) => s.blocks).find((b) => b.t === 'plot');
    assert.ok(plot && plot.t === 'plot');
    const page = pages(spPdfBytes(doc))[0];
    const m = pdfMap(page, plot.plot, SP_PDF_PAPER.a4.h);
    const rows = pdfRows(plot.plot, m);
    const parts = partsOf(p, plot.plot, m);
    const row = (f: (it: SpDocPlotItem) => boolean): Row => {
      const it = plot.plot.items.find(f);
      assert.ok(it);
      const r = rows.find((x) => x.id === it.id);
      assert.ok(r);
      return r;
    };
    const nina = row((it) => it.person && it.label === 'Nina');
    for (const r of rows.filter((x) => x !== nina)) assert.ok(!hit(r.box, nina.box), `"${r.text}" clear of Nina's name`);
    for (const label of ['Guitar amp', 'Lead vocal']) {
      const it = plot.plot.items.find((x) => x.label === label || (!x.label && p.objects.find((o) => o.id === x.id)?.label === label));
      assert.ok(it, label);
      const r = rows.find((x) => x.id === it.id);
      assert.ok(r);
      for (const q of parts.filter((x) => x.id === it.id)) assert.ok(!hit(r.box, q.box), `${label} clear of its own symbol`);
    }
  });

  it('a shaped stage is never drawn smaller than its names were placed for: the PDF and the packet agree on that size', () => {
    assert.equal(SP_PDF_PLOT.shapedW, SP_PLOT_SHAPED_K.width);
    assert.equal(SP_PDF_PLOT.shapedGive, SP_PLOT_SHAPED_K.give);
    // the narrowest page (A4) is at least that wide
    assert.ok(SP_PDF_PAPER.a4.w - 2 * SP_PDF_MARGIN >= SP_PLOT_SHAPED_K.width);
    assert.ok(SP_PAGES.a4.w - SP_PAGE_MARGIN.left - SP_PAGE_MARGIN.right >= SP_PLOT_SHAPED_K.width);
    for (const [name, p] of Object.entries(PLOTS)) {
      const plot = spPlotDoc(p);
      const placed = spPlotScale({ ...plot, roomy: false }, SP_PLOT_SHAPED_K.width) * SP_PLOT_SHAPED_K.give;
      for (const paper of PAPERS) {
        for (const packet of PACKETS) {
          const doc = spBuildDoc(spBuildSnapshot(p, { paper, packet }, NOW));
          const dp = doc.sections.flatMap((s) => s.blocks).find((b) => b.t === 'plot');
          assert.ok(dp && dp.t === 'plot');
          const page = pages(spPdfBytes(doc)).find((pg) => paths(pg, dp.plot.deck?.front.all ? 3 : 1.4).length > 0);
          assert.ok(page);
          const k = pdfMap(page, dp.plot, SP_PDF_PAPER[paper].h).k;
          const want = spPlotScale({ ...dp.plot, roomy: false }, SP_PLOT_SHAPED_K.width) * SP_PLOT_SHAPED_K.give;
          assert.ok(k >= want - 0.01, `${name} · ${paper} · ${packet}: drawn at ${k.toFixed(2)} pt/m, placed for ${want.toFixed(2)}`);
        }
      }
      assert.ok(placed > 0, name);
    }
  });
});

describe('shaped stages: the HTML print sheet and the export preview', () => {
  const TOP = 18; // spPacketHtml.ts: the room above the drawing
  const sceneMap = (plot: SpDocPlot, width: number, maxH?: number): Map2 => {
    const k = spPlotScale(plot, width, maxH);
    const left = (width - (plot.widthM + plot.marginM * 2) * k) / 2;
    return { k, X: (x) => left + (plot.marginM + x) * k, Y: (y) => TOP + (plot.marginM + y) * k };
  };
  for (const [name, p] of Object.entries(PLOTS)) {
    it(`${name}: clean on the Letter and A4 sheet and in the preview (any phone: drawn at least 520 pt wide)`, () => {
      for (const paper of PAPERS) {
        for (const packet of PACKETS) {
          const doc = spBuildDoc(spBuildSnapshot(p, { paper, packet }, NOW));
          const dp = doc.sections.flatMap((s) => s.blocks).find((b) => b.t === 'plot');
          assert.ok(dp && dp.t === 'plot');
          const plot = dp.plot;
          const sheetW = SP_PAGES[paper].w - SP_PAGE_MARGIN.left - SP_PAGE_MARGIN.right;
          const views: [string, number, number | undefined][] = [[`sheet ${paper} ${packet}`, sheetW, plot.roomy ? SP_ROOMY_H[paper] : undefined]];
          for (const phone of [390, 375, 320]) {
            const prev = spPlotPreview(plot, phone - 32, 520);
            views.push([`preview ${phone} ${packet}`, prev.stage.w, undefined]);
          }
          for (const [what, width, maxH] of views) {
            // the scene itself is the one checked: same width, same scale
            const scene = spPlotScene(plot, width, { maxH });
            assert.equal(scene.w, width);
            const m = sceneMap(plot, width, maxH);
            const rows = htmlRows(plot, m);
            const parts = partsOf(p, plot, m);
            assert.deepEqual(collisions(rows, parts), [], `${name} · ${what}`);
            // (nearness is measured on the row as placed, which holds the
            // sheet's row: the sheet sizes number boxes from the estimate,
            // a point or two narrower than the PDF's)
            assert.deepEqual(strays(pdfRows(plot, m), parts, m.k, placedKOf(plot)), [], `${name} · ${what}`);
          }
        }
      }
    });
  }
});

describe('shaped stages: the on-screen Stage drawing (phone 390, 375, 320 wide)', () => {
  // the glass the stage is drawn in, measured in the lab at each phone size
  // (390 × 844, 375 × 667, 320 × 640): the SVG's own width and height
  const GLASS: [string, number, number][] = [
    ['390 × 844', 368, 266],
    ['375 × 667', 353, 139],
    ['320 × 640', 298, 117.6],
  ];
  /** The plan exactly as StagePlanView makes it (names and numbers on, nothing selected). */
  const screenPlan = (p: SpProject, gw: number, gh: number) => {
    const T = G.stageTransformFor(p, gw, gh);
    const order = G.stageDrawOrder(p.objects);
    const items: G.StageLabelIn[] = order.map((o) => ({ id: o.id, text: L.stageName(p, o), badges: L.stageBadges(p, o), box: G.stageObjectBox(p, o, T), person: o.kind === 'performer', selected: false }));
    const f = G.stageFrameBoxes(gw, gh);
    return { items, plan: G.stageLabelPlan(items, gw, gh, [f.top, f.bottom, f.left, f.right], { numbersClear: p.stage.shape !== 'rect' }) };
  };
  const four = Object.entries(PLOTS).filter(([n]) => n.startsWith('four-piece'));
  for (const [name, p] of four) {
    it(`${name}: no name, number box or mix code runs into another; no number box lies over another symbol`, () => {
      for (const [phone, gw, gh] of GLASS) {
        const { items, plan } = screenPlan(p, gw, gh);
        const pieces: { id: string; what: string; box: Box; number: boolean }[] = [];
        for (const l of plan.labels) {
          const nameEnd = l.badges.length ? l.badges[0].x - 4 : l.box.x1;
          if (l.lines.length) pieces.push({ id: l.id, what: l.lines.map((x) => x.text).join(' '), box: { ...l.box, x1: Math.max(l.box.x0, nameEnd) }, number: false });
          for (const b of l.badges) pieces.push({ id: l.id, what: b.text, box: { x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + b.h }, number: true });
        }
        const bad: string[] = [];
        for (let i = 0; i < pieces.length; i++) {
          for (let j = i + 1; j < pieces.length; j++) if (pieces[i].id !== pieces[j].id && hit(pieces[i].box, pieces[j].box)) bad.push(`"${pieces[i].what}" × "${pieces[j].what}"`);
          if (!pieces[i].number) continue;
          for (const it of items) if (it.id !== pieces[i].id && !it.box.sized && hit(pieces[i].box, G.stageBoxBounds(it.box))) bad.push(`"${pieces[i].what}" over the symbol of ${it.text || it.id}`);
        }
        assert.deepEqual(bad, [], `${name} · ${phone}`);
        // every performer is still named
        for (const it of items.filter((x) => x.person)) assert.ok(plan.labels.some((l) => l.id === it.id && l.lines.length), `${name} · ${phone}: ${it.text} named`);
      }
    });
  }
  it('the view asks for it on a shaped stage only; a rectangle keeps its last resort', () => {
    const view = readFileSync(join(import.meta.dirname, '..', 'src/screens/lab/stageplot/stage/StagePlanView.tsx'), 'utf8').replace(/\r\n/g, '\n');
    assert.match(view, /stageLabelPlan\(items, gw, gh, \[frame\.top, frame\.bottom, frame\.left, frame\.right\], \{ numbersClear: spShapeOf\(p\.stage\) !== 'rect' \}\)/);
    // a crowded rectangle on a small phone still prints numbers on their own symbol (unchanged)
    const sal = salsa('p-rect-salsa');
    const T = G.stageTransformFor(sal, 298, 117.6);
    const order = G.stageDrawOrder(sal.objects);
    const items: G.StageLabelIn[] = order.map((o) => ({ id: o.id, text: L.stageName(sal, o), badges: L.stageBadges(sal, o), box: G.stageObjectBox(sal, o, T), person: o.kind === 'performer', selected: false }));
    const f = G.stageFrameBoxes(298, 117.6);
    const a = G.stageLabelPlan(items, 298, 117.6, [f.top, f.bottom, f.left, f.right]);
    const b = G.stageLabelPlan(items, 298, 117.6, [f.top, f.bottom, f.left, f.right], { numbersClear: false });
    assert.deepEqual(a, b);
  });
});

describe('a rectangle keeps its own rule', () => {
  it('the five examples and a plot of the new symbols are placed for the usual size, with the estimate (their layouts are pinned elsewhere)', () => {
    // a rectangle never reaches the shaped rule: its plot has no deck, so the
    // PDF has no floor for it and the packet places it as before
    for (const id of ['salsa', 'four-piece', 'playback', 'solo', 'duo']) {
      const plot = spPlotDoc(spFromTemplate(id, { id: `r-${id}`, now: NOW, band: 'Example' }));
      assert.equal(plot.deck, undefined, id);
    }
    assert.equal(spPlotDoc(allNewSymbols()).deck, undefined);
  });
});
