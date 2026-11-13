/**
 * stageplot/spPacketHtml — the packet as ONE HTML sheet, made from the
 * `SpDoc` and nothing else. A browser shows it as the print view. A phone
 * uses it only as the FALLBACK, when the PDF that spPdf.ts writes cannot be
 * saved as a file: the app's own writer is the first choice everywhere,
 * because it prints the footer and repeats table headers on every engine.
 *
 * Made to print well from an HTML-to-PDF engine (handoff §7):
 *   • white paper, dark lines, system fonts, no images and no web requests;
 *   • every table: `thead { display: table-header-group }` so the header
 *     repeats on each page the engine breaks the table over, and each row
 *     (with its note) is one `tbody` that is not split;
 *   • table text 10 pt. A long table gets more pages, never smaller text;
 *   • the footer (band, revision, page number) and the DRAFT stamp are page
 *     margin boxes, and the same words are also printed in the flow at the
 *     top of the document, for an engine that does not draw margin boxes;
 *   • the plot is inline SVG drawn from `SpDocPlot`: the audience at the
 *     bottom, the four direction words, THE KEY (each kind of symbol on the
 *     plot, small, with its name: inside the same drawing, so a page break
 *     cannot part it from the plot), and the size note, always.
 *
 * `spPlotScene` is the plot as a short list of lines, boxes and words in
 * points. The HTML's SVG and the on-screen preview both draw that list, so
 * the two cannot differ.
 *
 * Pure: strings in, strings out. Every word from the project is escaped.
 */
import type { SpDoc, SpDocBlock, SpDocPlot, SpDocTable } from './spDocTypes.ts';
import { SP_KEY_CELL, SP_PLOT_SIDE, SP_PLOT_TYPE, spBadgeW, spKeyLayout, spLabelBlock, spPlotScale } from './spPacket.ts';
import type { SpFill, SpShape } from './spSymbols.ts';
import type { SpPaper } from './spTypes.ts';

/** Page sizes in points (72 per inch): what expo-print is given. */
export const SP_PAGES: Record<SpPaper, { w: number; h: number; css: string }> = {
  letter: { w: 612, h: 792, css: '612pt 792pt' },
  a4: { w: 595, h: 842, css: '595pt 842pt' },
};
/** How tall a plot that needs room (`SpDocPlot.roomy`) may be on each paper, in points. */
export const SP_ROOMY_H: Record<SpPaper, number> = { letter: 520, a4: 560 };
/** 0.6 in on every side; a little more at the bottom for the footer. */
export const SP_PAGE_MARGIN = { top: 43, right: 43, bottom: 50, left: 43 } as const;

export function spEscapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
const esc = spEscapeHtml;

/** A CSS string for `content:`. Anything that could end the string, the
 *  rule or the style element is written as a hex escape. */
function cssString(s: string): string {
  return `"${s.replace(/[^A-Za-z0-9 .,·:;()\-–—_/]/g, (c) => `\\${(c.codePointAt(0) ?? 63).toString(16)} `)}"`;
}

/* ── the plot as a list of things to draw ───────────────────────────────── */

export type SpSceneOp =
  | { t: 'rect'; x: number; y: number; w: number; h: number; r: number; fill: string; stroke: string; sw: number }
  | { t: 'circle'; cx: number; cy: number; r: number; fill: string; stroke: string; sw: number; dash: boolean }
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number; stroke: string; sw: number; dash: boolean }
  | { t: 'poly'; pts: number[]; closed: boolean; fill: string; stroke: string; sw: number; dash: boolean }
  /** `y` is the baseline. `rotate` turns the words about (x, y), in degrees. */
  | { t: 'text'; x: number; y: number; text: string; size: number; bold: boolean; anchor: 'start' | 'middle' | 'end'; rotate: number };

/** `key` = which of the `ops` draw the key ([from, to)); null when the plot
 *  has nothing on it and so no key. */
export type SpPlotScene = { w: number; h: number; ops: SpSceneOp[]; key: { from: number; to: number } | null };

export const SP_INK = '#111111';
export const SP_PAPER = '#ffffff';
const TONE = '#d2d2d2';
const GRID = '#bdbdbd';
const LEADER = '#8a8a8a';
const NONE = 'none';
export const SP_DASH = '4 3';
const fillOf = (f: SpFill | undefined): string => (f === 'ink' ? SP_INK : f === 'tone' ? TONE : f === 'paper' ? SP_PAPER : NONE);

const TOP = 18;
const BOTTOM = 20;
const NOTE = 16;

/** An input number ("7", "9–10", a band-rig "B3", or "?" for no number yet)
 *  gets a square box. Any other reference is a monitor mix code ("M1"): it
 *  gets round ends, so the two are told apart by shape, not by color. */
export const spIsInputBadge = (b: string): boolean => /^(?:B?\d+(?:–B?\d+)?|\?)$/.test(b.trim());

/** The plot, laid out `width` points wide. Upstage is at the top and the
 *  audience at the bottom; stage right is on the left. */
export function spPlotScene(plot: SpDocPlot, width: number, how: { key?: boolean; maxH?: number } = {}): SpPlotScene {
  const T = SP_PLOT_TYPE;
  const k = spPlotScale(plot, width, how.maxH);
  const m = plot.marginM;
  const drawW = (plot.widthM + m * 2) * k;
  const drawH = (plot.depthM + m * 2) * k;
  const left = (width - drawW) / 2;
  const sx = left + m * k;
  const sy = TOP + m * k;
  const X = (x: number) => sx + x * k;
  const Y = (y: number) => sy + y * k;
  const sw = plot.widthM * k;
  const sh = plot.depthM * k;
  const ops: SpSceneOp[] = [];

  // the stage: white, an optional grid, a dark outline, a heavier front edge
  ops.push({ t: 'rect', x: sx, y: sy, w: sw, h: sh, r: 0, fill: SP_PAPER, stroke: NONE, sw: 0 });
  if (plot.gridM > 0) {
    for (let g = plot.gridM; g < plot.widthM - 1e-6; g += plot.gridM) ops.push({ t: 'line', x1: X(g), y1: sy, x2: X(g), y2: sy + sh, stroke: GRID, sw: 0.4, dash: false });
    for (let g = plot.gridM; g < plot.depthM - 1e-6; g += plot.gridM) ops.push({ t: 'line', x1: sx, y1: Y(g), x2: sx + sw, y2: Y(g), stroke: GRID, sw: 0.4, dash: false });
  }
  ops.push({ t: 'rect', x: sx, y: sy, w: sw, h: sh, r: 0, fill: NONE, stroke: SP_INK, sw: 1.4 });
  ops.push({ t: 'line', x1: sx, y1: sy + sh, x2: sx + sw, y2: sy + sh, stroke: SP_INK, sw: 3, dash: false });

  // a leader ties a name that had to go farther out to its own symbol: a
  // thin gray line, under the symbols
  for (const item of plot.items) {
    if (item.leader) ops.push({ t: 'line', x1: X(item.leader.from.x), y1: Y(item.leader.from.y), x2: X(item.leader.to.x), y2: Y(item.leader.to.y), stroke: LEADER, sw: 0.5, dash: false });
  }

  // the symbols: people last, so a drummer's circle covers the kit's stool
  // and reads as a person sitting on it
  for (const item of [...plot.items.filter((i) => !i.person), ...plot.items.filter((i) => i.person)]) {
    for (const s of item.shapes) {
      if (s.t === 'circle') ops.push({ t: 'circle', cx: X(s.cx), cy: Y(s.cy), r: s.r * k, fill: fillOf(s.fill), stroke: SP_INK, sw: 1, dash: !!s.dash });
      else if (s.t === 'line') ops.push({ t: 'line', x1: X(s.x1), y1: Y(s.y1), x2: X(s.x2), y2: Y(s.y2), stroke: SP_INK, sw: 1, dash: !!s.dash });
      else if (s.t === 'poly') ops.push({ t: 'poly', pts: s.pts.map((v, n) => (n % 2 ? Y(v) : X(v))), closed: !!s.closed, fill: fillOf(s.fill), stroke: SP_INK, sw: 1, dash: !!s.dash });
      else ops.push({ t: 'poly', pts: [X(s.x), Y(s.y), X(s.x + s.w), Y(s.y), X(s.x + s.w), Y(s.y + s.h), X(s.x), Y(s.y + s.h)], closed: true, fill: fillOf(s.fill), stroke: SP_INK, sw: 1, dash: !!s.dash });
    }
  }
  for (const item of plot.items) {
    if (item.tag) ops.push({ t: 'text', x: X(item.at.x), y: Y(item.at.y) + T.label * 0.35, text: item.tag, size: T.label, bold: true, anchor: 'middle', rotate: 0 });
  }

  // the names and the references, each on white so a line never runs through
  // a word. All the white first, then all the words, so one name's white
  // never covers another name.
  const words: SpSceneOp[] = [];
  for (const item of plot.items) {
    const block = spLabelBlock(item);
    if (!block.h) continue;
    const fs = item.person ? T.person : T.label;
    // a row that would reach past the drawing is moved back inside, whole
    const wantLeft = X(item.labelAt.x) - block.labelW / 2;
    const rowLeft = block.w + 4 >= width ? (width - block.w) / 2 : Math.max(2, Math.min(width - block.w - 2, wantLeft));
    const top = Math.max(TOP, Math.min(TOP + drawH - block.h, Y(item.labelAt.y)));
    const mid = top + block.h / 2;
    if (item.label) {
      ops.push({ t: 'rect', x: rowLeft - 1.5, y: mid - fs / 2 - 1, w: block.labelW + 3, h: fs + 2, r: 0, fill: SP_PAPER, stroke: NONE, sw: 0 });
      words.push({ t: 'text', x: rowLeft + block.labelW / 2, y: mid + fs * 0.36, text: item.label, size: fs, bold: item.person, anchor: 'middle', rotate: 0 });
    }
    let x = rowLeft + block.labelW + block.gap;
    for (const b of item.badges) {
      const w = spBadgeW(b);
      const y = mid - T.badgeH / 2;
      words.push({ t: 'rect', x, y, w, h: T.badgeH, r: spIsInputBadge(b) ? 1.5 : T.badgeH / 2, fill: SP_PAPER, stroke: SP_INK, sw: 0.8 });
      words.push({ t: 'text', x: x + w / 2, y: mid + T.badge * 0.36, text: b, size: T.badge, bold: true, anchor: 'middle', rotate: 0 });
      x += w + T.badgeGap;
    }
  }
  ops.push(...words);

  // the four direction words: fixed, never flipped
  const midY = TOP + drawH / 2;
  ops.push({ t: 'text', x: width / 2, y: TOP - 6, text: 'UPSTAGE', size: T.direction, bold: true, anchor: 'middle', rotate: 0 });
  ops.push({ t: 'text', x: width / 2, y: TOP + drawH + 14, text: 'AUDIENCE / DOWNSTAGE', size: T.direction, bold: true, anchor: 'middle', rotate: 0 });
  ops.push({ t: 'text', x: left - 4, y: midY, text: 'STAGE RIGHT', size: T.direction, bold: true, anchor: 'middle', rotate: -90 });
  ops.push({ t: 'text', x: left + drawW + 4, y: midY, text: 'STAGE LEFT', size: T.direction, bold: true, anchor: 'middle', rotate: 90 });

  // THE KEY: under the stage, part of the same drawing. One cell for each
  // kind of symbol on this plot: the symbol small, then its name. (A caller
  // that shows the drawing in a sideways scroller draws the key apart, at
  // its own width, with `spKeyScene`: the key must never scroll out of view.)
  const keyTop = TOP + drawH + BOTTOM;
  const keyFrom = ops.length;
  const keyH = how.key === false ? 0 : keyOps(plot.key, SP_PLOT_SIDE, keyTop, width - SP_PLOT_SIDE * 2, ops);
  const key = ops.length > keyFrom ? { from: keyFrom, to: ops.length } : null;

  // the size note: always printed
  const h = TOP + drawH + BOTTOM + keyH + NOTE;
  ops.push({ t: 'text', x: SP_PLOT_SIDE, y: h - 4, text: plot.toScale ? `Stage size: ${plot.sizeNote}` : plot.sizeNote.toUpperCase(), size: T.direction, bold: !plot.toScale, anchor: 'start', rotate: 0 });

  return { w: width, h, ops, key };
}

/** Draw the key into `ops`, its top-left corner at (`left`, `top`), `width`
 *  points wide. Returns its height (0 for an empty key: no heading). */
function keyOps(keyItems: SpDocPlot['key'], left: number, top: number, width: number, ops: SpSceneOp[]): number {
  const layout = spKeyLayout(keyItems, width);
  if (!layout.cells.length) return 0;
  const K = SP_KEY_CELL;
  ops.push({ t: 'text', x: left, y: top + K.headPt, text: 'KEY', size: K.headPt, bold: true, anchor: 'start', rotate: 0 });
  layout.cells.forEach((cell, n) => {
    const item = keyItems[n];
    const x0 = left + cell.x;
    const y0 = top + cell.y;
    // the symbol, scaled to fit its box with its own shape kept
    const b = boxOf(item.shapes);
    const s = Math.min(K.symbolW / Math.max(b.x1 - b.x0, 1e-6), K.symbolH / Math.max(b.y1 - b.y0, 1e-6));
    const kx = (x: number) => x0 + K.symbolW / 2 + (x - (b.x0 + b.x1) / 2) * s;
    const ky = (y: number) => y0 + K.symbolH / 2 + (y - (b.y0 + b.y1) / 2) * s;
    for (const sh of item.shapes) {
      if (sh.t === 'circle') ops.push({ t: 'circle', cx: kx(sh.cx), cy: ky(sh.cy), r: sh.r * s, fill: fillOf(sh.fill), stroke: SP_INK, sw: 0.8, dash: !!sh.dash });
      else if (sh.t === 'line') ops.push({ t: 'line', x1: kx(sh.x1), y1: ky(sh.y1), x2: kx(sh.x2), y2: ky(sh.y2), stroke: SP_INK, sw: 0.8, dash: !!sh.dash });
      else if (sh.t === 'poly') ops.push({ t: 'poly', pts: sh.pts.map((v, i) => (i % 2 ? ky(v) : kx(v))), closed: !!sh.closed, fill: fillOf(sh.fill), stroke: SP_INK, sw: 0.8, dash: !!sh.dash });
      else ops.push({ t: 'poly', pts: [kx(sh.x), ky(sh.y), kx(sh.x + sh.w), ky(sh.y), kx(sh.x + sh.w), ky(sh.y + sh.h), kx(sh.x), ky(sh.y + sh.h)], closed: true, fill: fillOf(sh.fill), stroke: SP_INK, sw: 0.8, dash: !!sh.dash });
    }
    if (item.tag) ops.push({ t: 'text', x: kx(0), y: ky(0) + K.textPt * 0.35, text: item.tag, size: K.textPt, bold: true, anchor: 'middle', rotate: 0 });
    // its name, in lines that fit the cell: never cut
    const textH = cell.lines.length * K.lineH;
    const lineTop = y0 + Math.max(0, (K.symbolH - textH) / 2);
    cell.lines.forEach((line, i) => ops.push({ t: 'text', x: x0 + K.symbolW + K.gap, y: lineTop + K.textPt * 0.9 + i * K.lineH, text: line, size: K.textPt, bold: false, anchor: 'start', rotate: 0 }));
  });
  return layout.h;
}

/** The key alone, `width` points wide: for a screen that shows the drawing
 *  in a sideways scroller and keeps the key in view under it. */
export function spKeyScene(keyItems: SpDocPlot['key'], width: number): SpPlotScene {
  const ops: SpSceneOp[] = [];
  const h = keyOps(keyItems, 0, 0, width, ops);
  return { w: width, h, ops, key: ops.length ? { from: 0, to: ops.length } : null };
}

/** What a screen preview draws in a window `width` points wide, when the
 *  plot is never drawn narrower than `minW` (so its names stay readable):
 *  ONE scene with the key in it when the drawing fits the window; otherwise
 *  the stage alone, to scroll sideways, and the key as its own scene at the
 *  window's width, so the key never scrolls out of view (owner 2026-11-12:
 *  the key is always there; review 2, visuals C). */
export function spPlotPreview(plot: SpDocPlot, width: number, minW: number): { scrolls: boolean; stage: SpPlotScene; key: SpPlotScene | null } {
  const sceneW = Math.max(minW, Math.floor(width));
  const scrolls = sceneW > width + 0.5;
  if (!scrolls) return { scrolls, stage: spPlotScene(plot, sceneW), key: null };
  return { scrolls, stage: spPlotScene(plot, sceneW, { key: false }), key: plot.key.length ? spKeyScene(plot.key, Math.floor(width)) : null };
}

/** The box around a symbol's shapes (the symbol's own units). */
function boxOf(shapes: readonly SpShape[]): { x0: number; y0: number; x1: number; y1: number } {
  const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const add = (x: number, y: number) => {
    b.x0 = Math.min(b.x0, x);
    b.x1 = Math.max(b.x1, x);
    b.y0 = Math.min(b.y0, y);
    b.y1 = Math.max(b.y1, y);
  };
  for (const s of shapes) {
    if (s.t === 'circle') {
      add(s.cx - s.r, s.cy - s.r);
      add(s.cx + s.r, s.cy + s.r);
    } else if (s.t === 'line') {
      add(s.x1, s.y1);
      add(s.x2, s.y2);
    } else if (s.t === 'poly') {
      for (let k = 0; k + 1 < s.pts.length; k += 2) add(s.pts[k], s.pts[k + 1]);
    } else {
      add(s.x, s.y);
      add(s.x + s.w, s.y + s.h);
    }
  }
  return Number.isFinite(b.x0) ? b : { x0: -0.5, y0: -0.5, x1: 0.5, y1: 0.5 };
}

const n2 = (v: number): string => String(Math.round(v * 100) / 100);

/** The scene as an SVG element (black on white, no outside files). */
export function spPlotSvg(scene: SpPlotScene, label: string): string {
  const out: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n2(scene.w)} ${n2(scene.h)}" width="100%" role="img" aria-label="${esc(label)}" font-family="-apple-system, Helvetica, Arial, sans-serif">`,
    `<title>${esc(label)}</title>`,
  ];
  scene.ops.forEach((o, n) => {
    // the key is one group, so it reads (and is found) as one thing
    if (scene.key && n === scene.key.from) out.push('<g class="key">');
    if (o.t === 'rect') out.push(`<rect x="${n2(o.x)}" y="${n2(o.y)}" width="${n2(o.w)}" height="${n2(o.h)}"${o.r ? ` rx="${n2(o.r)}"` : ''} fill="${o.fill}" stroke="${o.stroke}" stroke-width="${o.sw}"/>`);
    else if (o.t === 'circle') out.push(`<circle cx="${n2(o.cx)}" cy="${n2(o.cy)}" r="${n2(o.r)}" fill="${o.fill}" stroke="${o.stroke}" stroke-width="${o.sw}"${o.dash ? ` stroke-dasharray="${SP_DASH}"` : ''}/>`);
    else if (o.t === 'line') out.push(`<line x1="${n2(o.x1)}" y1="${n2(o.y1)}" x2="${n2(o.x2)}" y2="${n2(o.y2)}" stroke="${o.stroke}" stroke-width="${o.sw}"${o.dash ? ` stroke-dasharray="${SP_DASH}"` : ''}/>`);
    else if (o.t === 'poly') out.push(`<${o.closed ? 'polygon' : 'polyline'} points="${o.pts.map(n2).join(' ')}" fill="${o.closed ? o.fill : 'none'}" stroke="${o.stroke}" stroke-width="${o.sw}" stroke-linejoin="round"${o.dash ? ` stroke-dasharray="${SP_DASH}"` : ''}/>`);
    else out.push(`<text x="${n2(o.x)}" y="${n2(o.y)}" font-size="${o.size}"${o.bold ? ' font-weight="700"' : ''} text-anchor="${o.anchor}" fill="${SP_INK}"${o.rotate ? ` transform="rotate(${o.rotate} ${n2(o.x)} ${n2(o.y)})"` : ''}>${esc(o.text)}</text>`);
    if (scene.key && n === scene.key.to - 1) out.push('</g>');
  });
  out.push('</svg>');
  return out.join('');
}

/* ── the sheet ──────────────────────────────────────────────────────────── */

function css(d: SpDoc): string {
  const page = SP_PAGES[d.paper];
  const M = SP_PAGE_MARGIN;
  const stamp = d.stamp ? `@top-right { content: ${cssString(d.stamp)}; font: 700 10pt -apple-system, Helvetica, Arial, sans-serif; color: #111; }` : '';
  return `
@page { size: ${page.css}; margin: ${M.top}pt ${M.right}pt ${M.bottom}pt ${M.left}pt; }
@page {
  @bottom-left { content: ${cssString(d.footer)}; font: 8pt -apple-system, Helvetica, Arial, sans-serif; color: #333; }
  @bottom-right { content: "Page " counter(page) " of " counter(pages); font: 8pt -apple-system, Helvetica, Arial, sans-serif; color: #333; }
  ${stamp}
}
* { box-sizing: border-box; }
html { background: #fff; }
body { margin: 0; padding: 0; background: #fff; color: #111; font-family: -apple-system, "Helvetica Neue", Helvetica, Roboto, Arial, sans-serif; font-size: 10.5pt; line-height: 1.35; -webkit-text-size-adjust: 100%; }
.dochead { display: flex; justify-content: space-between; align-items: flex-start; gap: 10pt; border-bottom: 1.5pt solid #111; padding-bottom: 5pt; margin-bottom: 8pt; }
.doctitle { font-size: 16pt; font-weight: 700; line-height: 1.2; overflow-wrap: anywhere; }
.docmeta { font-size: 10pt; color: #333; margin-top: 2pt; overflow-wrap: anywhere; }
.stamp { flex: none; border: 2pt solid #111; padding: 2pt 8pt; font-size: 13pt; font-weight: 700; letter-spacing: 2pt; }
.runhead { font-size: 9pt; color: #333; border-bottom: 0.5pt solid #555; padding-bottom: 2pt; margin-bottom: 6pt; overflow-wrap: anywhere; }
.sec { margin: 0 0 14pt; }
.sec.newpage { break-before: page; page-break-before: always; }
h1 { font-size: 14pt; margin: 0 0 6pt; break-after: avoid; page-break-after: avoid; }
h2 { font-size: 12pt; margin: 12pt 0 4pt; break-after: avoid; page-break-after: avoid; }
h3 { font-size: 10.5pt; margin: 10pt 0 3pt; break-after: avoid; page-break-after: avoid; }
p { margin: 0 0 6pt; overflow-wrap: anywhere; }
p.strong { font-weight: 700; }
p.muted { color: #333; font-size: 10pt; }
p.empty { font-style: italic; color: #333; }
ul { margin: 0 0 6pt; padding-left: 14pt; }
li { margin: 0 0 3pt; overflow-wrap: anywhere; break-inside: avoid; page-break-inside: avoid; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10pt; margin: 0 0 8pt; }
thead { display: table-header-group; }
tr { break-inside: avoid; page-break-inside: avoid; }
tbody.row { break-inside: avoid; page-break-inside: avoid; }
th { text-align: left; font-weight: 700; padding: 3pt 4pt; border-top: 1pt solid #111; border-bottom: 1pt solid #111; vertical-align: bottom; overflow-wrap: anywhere; }
td { padding: 3pt 4pt; vertical-align: top; border-bottom: 0.5pt solid #777; overflow-wrap: anywhere; word-break: break-word; }
th.center, td.center { text-align: center; }
tr.strong td { font-weight: 700; }
tr.hasnote td { border-bottom: 0; padding-bottom: 1pt; }
tr.note td { padding-top: 0; color: #222; font-weight: 400; }
table.facts { margin-bottom: 8pt; }
table.facts th { width: 24%; border: 0; border-bottom: 0.5pt solid #999; vertical-align: top; }
table.facts td { border-bottom: 0.5pt solid #999; }
figure.plot { margin: 0 0 8pt; padding: 0; break-inside: avoid; page-break-inside: avoid; }
figure.plot svg { display: block; width: 100%; height: auto; }
.legend { font-size: 10pt; color: #222; }
.viewnote { font-size: 10pt; }
@media screen { body { padding: 12px; } }
`;
}

function tableHtml(t: SpDocTable): string {
  if (!t.rows.length) return `<p class="empty">${esc(t.empty)}</p>`;
  const total = t.columns.reduce((w, c) => w + c.width, 0) || 1;
  const cls = (align?: 'left' | 'center') => (align === 'center' ? ' class="center"' : '');
  const cols = t.columns.map((c) => `<col style="width:${n2((c.width / total) * 100)}%"/>`).join('');
  const head = t.columns.map((c) => `<th scope="col"${cls(c.align)}>${esc(c.label)}</th>`).join('');
  const body = t.rows
    .map((r) => {
      const rowCls = [r.strong ? 'strong' : '', r.note ? 'hasnote' : ''].filter(Boolean).join(' ');
      const cells = t.columns.map((c) => `<td${cls(c.align)}>${esc(r.cells[c.key] ?? '')}</td>`).join('');
      const note = r.note ? `<tr class="note"><td colspan="${t.columns.length}">${esc(r.note)}</td></tr>` : '';
      return `<tbody class="row"><tr${rowCls ? ` class="${rowCls}"` : ''}>${cells}</tr>${note}</tbody>`;
    })
    .join('');
  return `<table><colgroup>${cols}</colgroup><thead><tr>${head}</tr></thead>${body}</table>`;
}

function plotHtml(plot: SpDocPlot, d: SpDoc): string {
  const page = SP_PAGES[d.paper];
  // a plot that needs room may take what the page has left under the header
  const scene = spPlotScene(plot, page.w - SP_PAGE_MARGIN.left - SP_PAGE_MARGIN.right, plot.roomy ? { maxH: SP_ROOMY_H[d.paper] } : {});
  const label = `Stage plot drawing, seen from above, with the audience at the bottom. ${plot.items.length} ${plot.items.length === 1 ? 'object' : 'objects'}. ${plot.sizeNote}.`;
  const view = plot.viewNote ? `<p class="viewnote"><strong>Viewpoint:</strong> ${esc(plot.viewNote)}</p>` : '';
  const legend = plot.legend.length ? `<ul class="legend">${plot.legend.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : '';
  return `<figure class="plot">${spPlotSvg(scene, label)}</figure>${view}${legend}`;
}

function blockHtml(b: SpDocBlock, d: SpDoc): string {
  if (b.t === 'heading') return b.level === 1 ? `<h2>${esc(b.text)}</h2>` : `<h3>${esc(b.text)}</h3>`;
  if (b.t === 'para') return `<p${b.tone && b.tone !== 'normal' ? ` class="${b.tone}"` : ''}>${esc(b.text).replace(/\n/g, '<br/>')}</p>`;
  if (b.t === 'facts') return `<table class="facts"><tbody>${b.rows.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>`;
  if (b.t === 'list') return `<ul>${b.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
  if (b.t === 'table') return tableHtml(b.table);
  return plotHtml(b.plot, d);
}

/** The whole packet as one self-contained HTML document. */
export function spPacketHtml(d: SpDoc): string {
  const stamp = d.stamp ? `<div class="stamp">${esc(d.stamp)}</div>` : '';
  const head = `<header class="dochead"><div><div class="doctitle">${esc(d.title)}</div><div class="docmeta">${esc(d.footer)}</div></div>${stamp}</header>`;
  const sections = d.sections
    .map((s, n) => {
      // 'page' always starts a page. 'auto' and 'none' run on: a browser
      // cannot be told "only when less than a third of the page is left",
      // so on this sheet (the web print view, and the phone's fallback) a
      // short packet is never padded with a forced break.
      // …and the section after a plot that was given the page's room
      const afterRoomy = n > 0 && d.sections[n - 1].blocks.some((b) => b.t === 'plot' && b.plot.roomy);
      const fresh = n > 0 && (s.breakBefore === 'page' || afterRoomy);
      const run = fresh ? `<div class="runhead">${esc(d.footer)}${d.stamp ? ` · <strong>${esc(d.stamp)}</strong>` : ''}</div>` : '';
      return `<section class="sec${fresh ? ' newpage' : ''}">${run}<h1>${esc(s.title)}</h1>${s.blocks.map((b) => blockHtml(b, d)).join('\n')}</section>`;
    })
    .join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${esc(d.title)}</title><style>${css(d)}</style></head><body>${head}\n${sections}</body></html>`;
}
