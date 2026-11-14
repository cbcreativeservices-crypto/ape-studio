/**
 * stageplot/spPdf — the GIG PACKET as a PDF file, written directly:
 * `spPdfBytes(doc)` turns one `SpDoc` (spDocTypes.ts) into the bytes of a
 * PDF 1.4 file. No library, no Node, no DOM: the same code runs in a
 * browser (the web "Download PDF"), in React Native and under `node --test`.
 *
 * WHAT IS IN THE FILE
 *   • real, selectable text in the standard fonts Helvetica and
 *     Helvetica-Bold (WinAnsi encoding; widths in spPdfFonts.ts), plus
 *     ZapfDingbats only when a check or cross mark is printed
 *   • vector lines and shapes for the tables and the plot
 *   • uncompressed page streams, so the file needs no deflate code. It is
 *     NOT a tagged or standards-checked (PDF/A, PDF/UA) file, and nothing
 *     here may say that it is.
 *
 * THE RULES IT KEEPS (handoff §7, header of spDocTypes.ts)
 *   • US Letter or A4, portrait, 0.6 in margins; white paper, black lines,
 *     one light gray; nothing is told by color
 *   • table text is 10 pt: a long table gets MORE PAGES, never smaller text
 *   • a table's header is printed again on every page the table runs to
 *   • a row and its note stay on one page (only a row taller than a whole
 *     page is divided, because nothing else is possible); the last row of
 *     a table is never alone at the top of a page (the row before it goes
 *     with it); a gray note under a table stays with its last row
 *   • a heading, and the line or two under it, stay with the first row of
 *     the table that follows; a phone number is never divided at a line end
 *   • a section starts where the packet says (`breakBefore`): on a new page,
 *     on a new page only when less than a third of the page is left, or
 *     straight on
 *   • EVERY row, note and line is printed: text wraps, it is never cut
 *   • the title and the stamp at the top of every page; at the bottom of
 *     every page the footer "<doc.footer> · Page N of M"
 *
 * HOW IT WORKS: one pass lays the blocks out from the top of each page
 * down, in points, with y growing DOWNWARD (the way a page is read). PDF's
 * own y axis grows upward from the bottom edge; `makePen` converts, in its
 * `Y`, and nothing else in this file knows about it. The footers are added
 * after the last page exists, when the page count is known.
 */
import type { SpDoc, SpDocBlock, SpDocKeyItem, SpDocPlot, SpDocTable } from './spDocTypes.ts';
import { SP_PDF_MARKS, spPdfCodeWidth, spPdfEncode, spPdfIsMark, spPdfWidth, type SpPdfText } from './spPdfFonts.ts';
import type { SpFill, SpShape } from './spSymbols.ts';
import type { SpPaper } from './spTypes.ts';

/** Page sizes in points (1/72 in). */
export const SP_PDF_PAPER: Record<SpPaper, { w: number; h: number }> = {
  letter: { w: 612, h: 792 },
  a4: { w: 595.28, h: 841.89 },
};
/** 0.6 in on every side. */
export const SP_PDF_MARGIN = 43.2;
/** Table text size. A table is never printed smaller than this. */
export const SP_PDF_TABLE_PT = 10;
/** KEEP WITH NEXT: a table that starts on a page has its header and at least
 *  this many rows there (or all of a shorter table); otherwise it starts on
 *  the next page, whole. A table that goes on overleaf repeats its header. */
export const SP_PDF_TABLE_KEEP_ROWS = 3;
const TABLE_KEEP_ROWS = SP_PDF_TABLE_KEEP_ROWS;
/** The fixed words on the plot (the performer's left and right, facing the audience). */
export const SP_PDF_PLOT_WORDS = { up: 'UPSTAGE', down: 'AUDIENCE / DOWNSTAGE', right: 'STAGE RIGHT', left: 'STAGE LEFT', key: 'KEY' } as const;

// ───────────────────────── sizes (points) ─────────────────────────
const PT = { title: 16, running: 9, stamp: 11, section: 13, h1: 12, h2: 11, body: 10, footer: 9, legend: 9 } as const;
const BODY_LEAD = 12.5;
const TABLE_LEAD = 12;
const CELL_PAD_X = 3;
const CELL_PAD_Y = 2.5;
/** Space under a paragraph, a list, a facts block, a table. */
const AFTER = { para: 4, item: 1.5, list: 3, facts: 6, table: 7, plot: 6 } as const;
const NOTE_INDENT = 10;
const GRAY = { ink: 0, muted: 0.35, rule: 0.45, leader: 0.54, soft: 0.75, tone: 0.82, head: 0.88, grid: 0.74, paper: 1 } as const;

/** A space that a line is never broken at. It is printed as an ordinary space. */
const NBSP = String.fromCharCode(160);
/** Something that may be a phone number: digits with spaces, ( ) . - or an en
 *  dash (code 150 in encoded text) between them. */
const PHONE_LIKE = /[+(]?\d[\d ().\-\x96]{5,}\d/g;

/** A PHONE NUMBER IS NEVER DIVIDED AT THE END OF A LINE ("555 / 0100" reads
 *  as two numbers): the spaces inside one become spaces that do not break.
 *  A phone number here is 7 to 15 digits in at most 6 groups, with a group of
 *  3 or more digits or a leading +, ( or 0; a row of channel numbers
 *  ("10 11 12 13") is not one. */
function gluePhones(t: SpPdfText): SpPdfText {
  if (t.indexOf(' ') < 0) return t;
  return t.replace(PHONE_LIKE, (m) => {
    if (m.indexOf(' ') < 0) return m;
    let digits = 0;
    let groups = 0;
    let long = false;
    let run = 0;
    for (let i = 0; i <= m.length; i++) {
      const c = i < m.length ? m.charCodeAt(i) : 0;
      if (c >= 48 && c <= 57) {
        run += 1;
        digits += 1;
      } else if (run) {
        groups += 1;
        if (run >= 3) long = true;
        run = 0;
      }
    }
    const first = m[0];
    if (digits < 7 || digits > 15 || groups > 6 || !(long || first === '+' || first === '(' || first === '0')) return m;
    return m.split(' ').join(NBSP);
  });
}

/** Any text → encoded text, trimmed, ready to measure, wrap and print. */
const E = (text: string): SpPdfText => gluePhones(spPdfEncode(text).replace(/^[\s]+|[\s]+$/g, ''));

/** A whole number with zeros in front ("7" → "007"). */
function pad(text: string, length: number): string {
  let out = text;
  while (out.length < length) out = '0' + out;
  return out;
}

/** A number as PDF writes it: at most 2 decimals, never an exponent. */
function num(v: number): string {
  if (!Number.isFinite(v)) return '0';
  const r = Math.round(v * 100) / 100;
  if (r === 0) return '0';
  return Math.abs(r) >= 1e15 ? '0' : String(r);
}

/** Where a baseline goes in a line box, so capital letters sit in its middle. */
const baseline = (size: number, lead: number): number => (lead + 0.718 * size) / 2;

// ───────────────────────── word wrap ─────────────────────────
/** A word longer than a whole line may be divided after one of these. */
const SOFT_BREAK = '-/\\,;:_.@|+=)]' + String.fromCharCode(150, 151, 183);

function breakWord(word: SpPdfText, size: number, bold: boolean, maxW: number): SpPdfText[] {
  const parts: SpPdfText[] = [];
  let start = 0;
  let w = 0;
  let soft = -1;
  for (let i = 0; i < word.length; i++) {
    const cw = (spPdfCodeWidth(word.charCodeAt(i), bold) * size) / 1000;
    // after a cut at a soft point the rest may still be too long: cut again
    while (i > start && w + cw > maxW + 0.001) {
      const cut = soft > start ? soft : i;
      parts.push(word.slice(start, cut));
      start = cut;
      soft = -1;
      w = spPdfWidth(word.slice(start, i), size, bold);
    }
    w += cw;
    if (SOFT_BREAK.indexOf(word[i]) >= 0) soft = i + 1;
  }
  parts.push(word.slice(start));
  return parts;
}

/** Encoded text → the lines that fit `maxW` points. Breaks at spaces; a line
 *  break in the text is kept; a single word wider than the line is divided
 *  (nothing is ever cut off). Always returns at least one line. */
export function spPdfWrap(text: SpPdfText, size: number, bold: boolean, maxW: number): SpPdfText[] {
  const out: SpPdfText[] = [];
  const space = spPdfWidth(' ', size, bold);
  for (const para of text.split('\n')) {
    let line = '';
    let lineW = 0;
    for (const word of para.split(' ')) {
      if (!word) continue;
      const w = spPdfWidth(word, size, bold);
      if (line && lineW + space + w <= maxW + 0.001) {
        line += ' ' + word;
        lineW += space + w;
        continue;
      }
      if (line) out.push(line);
      if (w <= maxW + 0.001) {
        line = word;
        lineW = w;
        continue;
      }
      const parts = breakWord(word, size, bold, maxW);
      for (let i = 0; i < parts.length - 1; i++) out.push(parts[i]);
      line = parts[parts.length - 1];
      lineW = spPdfWidth(line, size, bold);
    }
    out.push(line);
  }
  return out;
}

// ───────────────────────── the pen: one page's drawing ─────────────────────────
/** What the pages used, so the file lists only the fonts it needs. */
type Used = { marks: boolean };

type Pen = {
  ops: string[];
  /** One line of text; (x, y) = the left end of its baseline. */
  text: (x: number, y: number, t: SpPdfText, size: number, bold: boolean, gray?: number) => void;
  /** One line of text turned to read from the bottom of the page to the top. */
  textUp: (x: number, y: number, t: SpPdfText, size: number, bold: boolean) => void;
  /** One line of text turned to read from the top of the page to the bottom. */
  textDown: (x: number, y: number, t: SpPdfText, size: number, bold: boolean) => void;
  line: (x1: number, y1: number, x2: number, y2: number, width: number, gray?: number, dash?: boolean) => void;
  /** A box. `fill` / `stroke` are grays (0 black … 1 white) or null for none. */
  box: (x: number, y: number, w: number, h: number, fill: number | null, stroke: number | null, width?: number) => void;
  /** A symbol's shape, already in points. */
  shape: (s: SpShape, width: number) => void;
};

/** Text in PDF string syntax: ( ) and \ escaped, a byte above 126 as \ooo. */
function pdfString(t: SpPdfText): string {
  let s = '';
  for (let i = 0; i < t.length; i++) {
    const c = t.charCodeAt(i);
    if (c === 40) s += '\\(';
    else if (c === 41) s += '\\)';
    else if (c === 92) s += '\\\\';
    else if (c >= 32 && c <= 126) s += t[i];
    else if (c === 160) s += ' ';
    else if (c > 126 && c <= 255) s += '\\' + pad(c.toString(8), 3);
  }
  return s;
}

const fillGray = (f: SpFill | undefined): number | null => (f === 'paper' ? GRAY.paper : f === 'tone' ? GRAY.tone : f === 'ink' ? GRAY.ink : null);

function makePen(pageH: number, used: Used): Pen {
  const ops: string[] = [];
  /** THE conversion: this file's y (down from the top edge) → PDF's y (up from the bottom edge). */
  const Y = (y: number): number => pageH - y;
  const at = (x: number, y: number): string => `${num(x)} ${num(Y(y))}`;

  /** The text-showing operators of one line: Helvetica, with any marks from ZapfDingbats. */
  const show = (t: SpPdfText, size: number, bold: boolean): string => {
    let out = '';
    let i = 0;
    while (i < t.length) {
      const mark = spPdfIsMark(t.charCodeAt(i));
      let j = i;
      while (j < t.length && spPdfIsMark(t.charCodeAt(j)) === mark) j++;
      if (mark) {
        used.marks = true;
        let s = '';
        for (let k = i; k < j; k++) s += String.fromCharCode(SP_PDF_MARKS[t.charCodeAt(k) - 0x100].byte);
        out += `/F3 ${num(size)} Tf (${s}) Tj `;
      } else out += `/${bold ? 'F2' : 'F1'} ${num(size)} Tf (${pdfString(t.slice(i, j))}) Tj `;
      i = j;
    }
    return out;
  };

  const paint = (fill: number | null, stroke: boolean, closed: boolean): string => {
    if (fill !== null && stroke) return closed ? 'b' : 'B';
    if (fill !== null) return 'f';
    return closed ? 's' : 'S';
  };
  const strokeState = (width: number, gray: number, dash: boolean): string => `${num(width)} w ${num(gray)} G ${dash ? '[4 3] 0 d' : '[] 0 d'}`;

  const circle = (cx: number, cy: number, r: number): string => {
    const k = 0.5523 * r;
    return (
      `${at(cx + r, cy)} m ` +
      `${at(cx + r, cy + k)} ${at(cx + k, cy + r)} ${at(cx, cy + r)} c ` +
      `${at(cx - k, cy + r)} ${at(cx - r, cy + k)} ${at(cx - r, cy)} c ` +
      `${at(cx - r, cy - k)} ${at(cx - k, cy - r)} ${at(cx, cy - r)} c ` +
      `${at(cx + k, cy - r)} ${at(cx + r, cy - k)} ${at(cx + r, cy)} c`
    );
  };
  const roundRect = (x: number, y: number, w: number, h: number, rIn: number): string => {
    const r = Math.max(0, Math.min(rIn, w / 2, h / 2));
    if (r <= 0.01) return `${at(x, y)} m ${at(x + w, y)} l ${at(x + w, y + h)} l ${at(x, y + h)} l`;
    const k = r * (1 - 0.5523);
    return (
      `${at(x + r, y)} m ${at(x + w - r, y)} l ${at(x + w - k, y)} ${at(x + w, y + k)} ${at(x + w, y + r)} c ` +
      `${at(x + w, y + h - r)} l ${at(x + w, y + h - k)} ${at(x + w - k, y + h)} ${at(x + w - r, y + h)} c ` +
      `${at(x + r, y + h)} l ${at(x + k, y + h)} ${at(x, y + h - k)} ${at(x, y + h - r)} c ` +
      `${at(x, y + r)} l ${at(x, y + k)} ${at(x + k, y)} ${at(x + r, y)} c`
    );
  };

  return {
    ops,
    text(x, y, t, size, bold, gray = GRAY.ink) {
      if (!t) return;
      ops.push(`BT ${num(gray)} g 1 0 0 1 ${at(x, y)} Tm ${show(t, size, bold)}ET`);
    },
    textUp(x, y, t, size, bold) {
      if (!t) return;
      ops.push(`BT 0 g 0 1 -1 0 ${at(x, y)} Tm ${show(t, size, bold)}ET`);
    },
    textDown(x, y, t, size, bold) {
      if (!t) return;
      ops.push(`BT 0 g 0 -1 1 0 ${at(x, y)} Tm ${show(t, size, bold)}ET`);
    },
    line(x1, y1, x2, y2, width, gray = GRAY.ink, dash = false) {
      ops.push(`${strokeState(width, gray, dash)} ${at(x1, y1)} m ${at(x2, y2)} l S`);
    },
    box(x, y, w, h, fill, stroke, width = 0.5) {
      if (fill === null && stroke === null) return;
      const state = (stroke !== null ? strokeState(width, stroke, false) + ' ' : '') + (fill !== null ? `${num(fill)} g ` : '');
      ops.push(`${state}${at(x, y)} m ${at(x + w, y)} l ${at(x + w, y + h)} l ${at(x, y + h)} l ${paint(fill, stroke !== null, true)}`);
    },
    shape(s, width) {
      const state = strokeState(width, GRAY.ink, !!s.dash);
      if (s.t === 'line') {
        ops.push(`${state} ${at(s.x1, s.y1)} m ${at(s.x2, s.y2)} l S`);
        return;
      }
      const fill = fillGray(s.fill);
      const g = fill !== null ? ` ${num(fill)} g` : '';
      if (s.t === 'circle') ops.push(`${state}${g} ${circle(s.cx, s.cy, s.r)} ${paint(fill, true, true)}`);
      else if (s.t === 'rect') ops.push(`${state}${g} ${roundRect(s.x, s.y, s.w, s.h, s.r ?? 0)} ${paint(fill, true, true)}`);
      else if (s.pts.length >= 4) {
        let path = `${at(s.pts[0], s.pts[1])} m`;
        for (let k = 2; k + 1 < s.pts.length; k += 2) path += ` ${at(s.pts[k], s.pts[k + 1])} l`;
        ops.push(`${state}${g} ${path} ${paint(fill, true, !!s.closed)}`);
      }
    },
  };
}

// ───────────────────────── tables ─────────────────────────
type PRow = { cells: SpPdfText[][]; note: SpPdfText[]; strong: boolean; cellUnits: number };
type PTable = { widths: number[]; xs: number[]; head: SpPdfText[][]; headH: number; rows: PRow[]; empty: SpPdfText[]; center: boolean[]; noteX: number };

/** The longest word of some encoded text, in points. */
function longestWord(t: SpPdfText, bold: boolean): number {
  let m = 0;
  for (const w of t.split(/[ \n]/)) if (w) m = Math.max(m, spPdfWidth(w, SP_PDF_TABLE_PT, bold));
  return m;
}

/** The page width shared in the columns' proportions. When the table has
 *  room, a column that is too narrow for its longest word borrows from the
 *  columns that have space to spare, so a word is not divided for nothing. */
function columnWidths(table: SpDocTable, total: number): number[] {
  const weights = table.columns.map((c) => (Number.isFinite(c.width) && c.width > 0 ? c.width : 1));
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const w = weights.map((x) => (total * x) / sum);
  const need = table.columns.map((c, i) => {
    let m = longestWord(E(c.label), true);
    for (const r of table.rows) m = Math.max(m, longestWord(E(r.cells[c.key] ?? ''), !!r.strong));
    return Math.min(m + 2 * CELL_PAD_X + 0.5, Math.max(w[i], total * 0.4));
  });
  if (need.reduce((a, b) => a + b, 0) > total) return w;
  let deficit = 0;
  let slack = 0;
  w.forEach((x, i) => {
    if (x < need[i]) deficit += need[i] - x;
    else slack += x - need[i];
  });
  if (deficit <= 0 || slack <= 0) return w;
  const give = Math.min(1, deficit / slack);
  return w.map((x, i) => (x < need[i] ? need[i] : x - (x - need[i]) * give));
}

function prepareTable(table: SpDocTable, left: number, total: number): PTable {
  const widths = columnWidths(table, total);
  const xs: number[] = [];
  let x = left;
  for (const w of widths) {
    xs.push(x);
    x += w;
  }
  const inner = (i: number): number => Math.max(4, widths[i] - 2 * CELL_PAD_X);
  // A row's note starts under the text of the SECOND column when the first
  // is a narrow centered one (the channel number): then it lines up with the
  // input's name. In any other table it is set in a little from the left.
  const noteX = table.columns.length > 1 && table.columns[0].align === 'center' ? xs[1] + CELL_PAD_X : left + CELL_PAD_X + NOTE_INDENT;
  const noteW = Math.max(4, left + total - CELL_PAD_X - noteX);
  const head = table.columns.map((c, i) => spPdfWrap(E(c.label), SP_PDF_TABLE_PT, true, inner(i)));
  const headH = Math.max(1, ...head.map((l) => l.length)) * TABLE_LEAD + 2 * CELL_PAD_Y;
  const rows = table.rows.map((r): PRow => {
    const strong = !!r.strong;
    const cells = table.columns.map((c, i) => spPdfWrap(E(r.cells[c.key] ?? ''), SP_PDF_TABLE_PT, strong, inner(i)));
    const noteText = E(r.note ?? '');
    const note = noteText ? spPdfWrap(noteText, SP_PDF_TABLE_PT, false, noteW) : [];
    return { cells, note, strong, cellUnits: Math.max(1, ...cells.map((l) => l.length)) };
  });
  const empty = spPdfWrap(E(table.empty), SP_PDF_TABLE_PT, false, Math.max(4, total - 2 * CELL_PAD_X));
  return { widths, xs, head, headH, rows, empty, center: table.columns.map((c) => c.align === 'center'), noteX };
}

/** A row is a stack of LINE UNITS: first the lines of its cells, then the
 *  lines of its note. A row is normally drawn as one piece (units 0…all). */
const rowUnits = (r: PRow): number => r.cellUnits + r.note.length;
const pieceHeight = (r: PRow, u0: number, u1: number): number => (u1 - u0) * TABLE_LEAD + 2 * CELL_PAD_Y;

// ───────────────────────── the plot ─────────────────────────
/**
 * The plot's sizes, in points. They MIRROR the packet's own plot sizes
 * (`SP_PLOT_TYPE`, `SP_PLOT_SIDE`, `SP_PLOT_MAX_H` in spPacket.ts; `TOP` and
 * `BOTTOM` in spPacketHtml.ts). The packet works out the place of every name
 * for a drawing of exactly this geometry, so the PDF must draw the same
 * scene as the HTML sheet and the preview: a name and its boxes as ONE ROW
 * (`labelAt` = the top-center of the name, the boxes to its right), the
 * whole of `marginM` drawn around the stage, the drawing at most `maxH`
 * tall (`smallH` for one or two performers). This file does not import the packet builder; test/stagePlotPdf.test.ts
 * reads the two files and fails when these numbers differ.
 */
export const SP_PDF_PLOT = {
  person: 10.5,
  label: 9,
  badge: 9,
  badgeH: 13,
  badgePad: 4,
  badgeGap: 3,
  direction: 9.5,
  /** The packet's estimate of a character's width (share of the type size). */
  charW: 0.52,
  charWBold: 0.58,
  side: 16,
  /** A leader's line width (a hairline, in a middle gray: `LEADER` in spPacketHtml.ts). */
  leader: 0.5,
  maxH: 380,
  /** A plot with `smallPeople` performers or fewer is drawn at most `smallH`
   *  tall (`SP_PLOT_SMALL_H`, `SP_PLOT_SMALL_PEOPLE`), so a solo act's packet
   *  can be one sheet. The same rule for every packet kind. */
  smallH: 240,
  smallPeople: 2,
  /** A shaped stage is never drawn smaller than its names were placed for:
   *  `SP_PLOT_SHAPED_K` in spPacket.ts (width, give), mirrored. Its drawing
   *  does not give way for the legend: the legend runs on instead. */
  shapedW: 508,
  shapedGive: 1,
  top: 18,
  bottom: 20,
  note: 16,
} as const;

/**
 * THE KEY (owner 2026-11-12: "the key explaining what drawn objects are needs
 * to always be there in the drawing to understand it"). Under the stage
 * drawing, on the same page: the heading, then one cell for each kind of
 * symbol on the plot: the symbol drawn small in a box of `symbolW` ×
 * `symbolH` points (its own shape kept, centered), then its name, wrapped
 * and never cut. Cells are `colW` wide and fill rows from the left, inside
 * the plot's side room; a row is as tall as its tallest cell.
 *
 * The first nine numbers MIRROR `SP_KEY_CELL` in spPacket.ts and the places
 * follow `spKeyLayout` and the key part of `spPlotScene` (spPacketHtml.ts),
 * so the PDF's key is the HTML sheet's key; the test pins them. `right` is
 * the room kept at the right of a name, `stroke` the line of a key symbol.
 */
export const SP_PDF_KEY = { symbolW: 26, symbolH: 20, textPt: 9, gap: 6, colW: 120, lineH: 11, rowGap: 6, headPt: 9.5, headH: 16, right: 8, stroke: 0.8 } as const;

type PlotLayout = { height: number; drawH: number; draw: (pen: Pen, x0: number, y0: number) => void };
type Box = { x0: number; y0: number; x1: number; y1: number };

const fin = (v: number, or = 0): number => (Number.isFinite(v) ? v : or);
const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** The box around an item's shapes, in meters (null when it has no shapes). */
function itemBox(item: { shapes: SpShape[] }): Box | null {
  let b: Box | null = null;
  const add = (x: number, y: number): void => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (!b) b = { x0: x, y0: y, x1: x, y1: y };
    else {
      b.x0 = Math.min(b.x0, x);
      b.y0 = Math.min(b.y0, y);
      b.x1 = Math.max(b.x1, x);
      b.y1 = Math.max(b.y1, y);
    }
  };
  for (const s of item.shapes ?? []) {
    if (s.t === 'rect') {
      add(s.x, s.y);
      add(s.x + s.w, s.y + s.h);
    } else if (s.t === 'circle') {
      add(s.cx - s.r, s.cy - s.r);
      add(s.cx + s.r, s.cy + s.r);
    } else if (s.t === 'line') {
      add(s.x1, s.y1);
      add(s.x2, s.y2);
    } else for (let k = 0; k + 1 < s.pts.length; k += 2) add(s.pts[k], s.pts[k + 1]);
  }
  return b;
}

/** One symbol shape, meters → points. */
function placeShape(s: SpShape, X: (m: number) => number, Yp: (m: number) => number, k: number): SpShape {
  if (s.t === 'rect') return { ...s, x: X(s.x), y: Yp(s.y), w: s.w * k, h: s.h * k, r: (s.r ?? 0) * k };
  if (s.t === 'circle') return { ...s, cx: X(s.cx), cy: Yp(s.cy), r: s.r * k };
  if (s.t === 'line') return { ...s, x1: X(s.x1), y1: Yp(s.y1), x2: X(s.x2), y2: Yp(s.y2) };
  return { ...s, pts: s.pts.map((v, i) => (i % 2 === 0 ? X(v) : Yp(v))) };
}

/** A reference that is an input number ("7", "9–10", a band-rig "B3", or "?"
 *  for no number yet: what `spBadge` gives) has a box with square corners;
 *  anything else is a monitor mix code ("M1") and has round ends, so the two
 *  are told apart by shape. */
const isInputBadge = (b: string): boolean => /^(?:B?\d+(?:[–-]B?\d+)?|\?)$/.test(b.trim());

/** The room around the stage, in meters: the packet's `marginM`, and never
 *  less than what the symbols themselves reach (so nothing is drawn off the
 *  sheet when a document was made with too small a margin). */
function plotMargin(plot: SpDocPlot, widthM: number, depthM: number): number {
  let m = Math.max(0, fin(plot.marginM));
  for (const item of plot.items ?? []) {
    const b = itemBox(item);
    if (b) m = Math.max(m, -b.x0 + 0.05, b.x1 - widthM + 0.05, -b.y0 + 0.05, b.y1 - depthM + 0.05);
  }
  return m;
}

/** The key of a plot `W` points wide: its height (0 for an empty key, which
 *  prints nothing, not even the heading) and how to draw it with its top at y0. */
function layoutKey(items: SpDocKeyItem[], W: number): { height: number; draw: (pen: Pen, x0: number, y0: number) => void } {
  const K = SP_PDF_KEY;
  const entries = (items ?? []).filter((it) => it);
  if (!entries.length) return { height: 0, draw: () => undefined };
  const side = SP_PDF_PLOT.side;
  const columns = Math.max(1, Math.floor((W - 2 * side) / K.colW));
  const nameW = K.colW - K.symbolW - K.gap - K.right;
  type Op = (pen: Pen, ox: number, oy: number) => void;
  const ops: Op[] = [];
  const heading = E(SP_PDF_PLOT_WORDS.key);
  ops.push((pen, ox, oy) => pen.text(ox + side, oy + K.headPt, heading, K.headPt, true));
  let y = K.headH;
  for (let r = 0; r * columns < entries.length; r++) {
    const row = entries.slice(r * columns, (r + 1) * columns).map((it) => ({ it, lines: spPdfWrap(E(it.name ?? ''), K.textPt, false, nameW) }));
    const rowH = Math.max(K.symbolH, ...row.map((c) => c.lines.length * K.lineH));
    const top = y;
    row.forEach((c, n) => {
      const x = side + n * K.colW;
      // the symbol: its own shape, as large as its box allows, in the middle of the box
      const box = itemBox(c.it);
      if (box) {
        const k = Math.min(K.symbolW / Math.max(box.x1 - box.x0, 1e-6), K.symbolH / Math.max(box.y1 - box.y0, 1e-6));
        const kx = (v: number): number => x + K.symbolW / 2 + (v - (box.x0 + box.x1) / 2) * k;
        const ky = (v: number): number => top + K.symbolH / 2 + (v - (box.y0 + box.y1) / 2) * k;
        for (const s of c.it.shapes ?? []) {
          const placed = placeShape(s, kx, ky, k);
          ops.push((pen, ox, oy) => pen.shape(placeShape(placed, (v) => v + ox, (v) => v + oy, 1), K.stroke));
        }
        // the short word inside the symbol sits where it sits on the plot: at the symbol's own center
        const tag = E(c.it.tag ?? '');
        if (tag) ops.push((pen, ox, oy) => pen.text(ox + kx(0) - spPdfWidth(tag, K.textPt, true) / 2, oy + ky(0) + K.textPt * 0.35, tag, K.textPt, true));
      }
      // its name, wrapped inside the cell, level with the middle of the symbol
      const nameTop = top + Math.max(0, (K.symbolH - c.lines.length * K.lineH) / 2);
      c.lines.forEach((l, i) => ops.push((pen, ox, oy) => pen.text(ox + x + K.symbolW + K.gap, oy + nameTop + K.textPt * 0.9 + i * K.lineH, l, K.textPt, false)));
    });
    y += rowH + K.rowGap;
  }
  return {
    height: y,
    draw: (pen, x0, y0) => {
      for (const op of ops) op(pen, x0, y0);
    },
  };
}

/** The plot, `W` points wide. `shrink` (1 = the usual size) makes the drawing
 *  smaller when a page cannot hold it; the words keep their size. */
function buildPlot(plot: SpDocPlot, W: number, shrink: number, tall = 0, floor = true): PlotLayout {
  const P = SP_PDF_PLOT;
  const widthM = Math.max(0.1, fin(plot.widthM, 7.2));
  const depthM = Math.max(0.1, fin(plot.depthM, 4.5));
  const m = plotMargin(plot, widthM, depthM);
  const people = (plot.items ?? []).filter((i) => i.person).length;
  // `tall` (a roomy plot) = the height the page has for the drawing, in place of the usual cap
  const usual = people <= P.smallPeople ? P.smallH : P.maxH;
  const tallest = tall > 0 ? tall : usual;
  const natural = Math.min((W - 2 * P.side) / (widthM + 2 * m), tallest / (depthM + 2 * m));
  // A SHAPED stage's names were placed for a drawing this large (fix
  // 2026-11-13: `SP_PLOT_SHAPED_K` in spPacket.ts): it is never drawn smaller,
  // or its names would run into each other. `floor` = false only for a plot
  // that cannot fit even an empty page.
  const least = plot.deck && floor ? Math.min(natural, Math.min((P.shapedW - 2 * P.side) / (widthM + 2 * m), usual / (depthM + 2 * m)) * P.shapedGive) : 0;
  const k = Math.max(least, natural * shrink);
  const drawW = (widthM + 2 * m) * k;
  const drawH = (depthM + 2 * m) * k;
  const left = (W - drawW) / 2;
  // meters → points inside the plot block (0,0 = its top left corner)
  const X = (x: number): number => left + (m + x) * k;
  const Yp = (y: number): number => P.top + (m + y) * k;
  const estimate = (text: string, size: number, bold: boolean): number => text.length * size * (bold ? P.charWBold : P.charW);

  type Op = (pen: Pen, ox: number, oy: number) => void;
  const ops: Op[] = [];

  const deck = plot.deck;
  if (deck) {
    // A STAGE THAT IS NOT A RECTANGLE (2026-11-13): the wings dashed with
    // their names, the grid inside the shape, the outline, and a heavier line
    // on every edge the audience sees
    for (const a of deck.areas ?? []) {
      if (![a.x, a.y, a.w, a.h].every(Number.isFinite)) continue;
      ops.push((pen, ox, oy) => pen.shape({ t: 'rect', x: ox + X(a.x), y: oy + Yp(a.y), w: a.w * k, h: a.h * k, dash: true }, 0.9));
      const word = E(a.name ?? '');
      if (word) ops.push((pen, ox, oy) => pen.text(ox + X(a.x + a.w / 2) - spPdfWidth(word, P.label, true) / 2, oy + P.top - 6, word, P.label, true));
    }
    for (const s of deck.grid ?? []) if (s.every(Number.isFinite)) ops.push((pen, ox, oy) => pen.line(ox + X(s[0]), oy + Yp(s[1]), ox + X(s[2]), oy + Yp(s[3]), 0.4, GRAY.grid));
    const ol = deck.outline;
    const heavy = deck.front?.all ? 3 : 1.4;
    if (ol?.t === 'circle') ops.push((pen, ox, oy) => pen.shape({ t: 'circle', cx: ox + X(ol.cx), cy: oy + Yp(ol.cy), r: ol.r * k }, heavy));
    else if (ol?.t === 'poly') ops.push((pen, ox, oy) => pen.shape({ t: 'poly', pts: ol.pts.map((v, n) => (n % 2 ? oy + Yp(v) : ox + X(v))), closed: true }, heavy));
    for (const l of deck.front?.lines ?? []) if (l.every(Number.isFinite)) ops.push((pen, ox, oy) => pen.line(ox + X(l[0]), oy + Yp(l[1]), ox + X(l[2]), oy + Yp(l[3]), 3));
  } else {
    // the grid, in light gray, under everything
    const g = fin(plot.gridM);
    if (g > 0 && widthM / g <= 200 && depthM / g <= 200) {
      for (let x = g; x < widthM - 1e-6; x += g) ops.push((pen, ox, oy) => pen.line(ox + X(x), oy + Yp(0), ox + X(x), oy + Yp(depthM), 0.4, GRAY.grid));
      for (let y = g; y < depthM - 1e-6; y += g) ops.push((pen, ox, oy) => pen.line(ox + X(0), oy + Yp(y), ox + X(widthM), oy + Yp(y), 0.4, GRAY.grid));
    }
    // the stage, with a heavier front (downstage) edge
    ops.push((pen, ox, oy) => {
      pen.box(ox + X(0), oy + Yp(0), widthM * k, depthM * k, null, GRAY.ink, 1.4);
      pen.line(ox + X(0), oy + Yp(depthM), ox + X(widthM), oy + Yp(depthM), 3);
    });
  }
  // a leader: a hairline from a name to its own symbol, UNDER the symbols
  // (the packet sets one when the name could not stand right beside it)
  for (const item of plot.items ?? []) {
    const l = item.leader;
    if (!l || !l.from || !l.to) continue;
    const pts = [l.from.x, l.from.y, l.to.x, l.to.y];
    if (!pts.every((v) => Number.isFinite(v))) continue;
    const x1 = clamp(X(pts[0]), 0, W);
    const y1 = clamp(Yp(pts[1]), P.top, P.top + drawH);
    const x2 = clamp(X(pts[2]), 0, W);
    const y2 = clamp(Yp(pts[3]), P.top, P.top + drawH);
    ops.push((pen, ox, oy) => pen.line(ox + x1, oy + y1, ox + x2, oy + y2, P.leader, GRAY.leader));
  }
  // the symbols (people last, so a drummer's circle covers the kit's stool
  // and reads as a person sitting on it), then the short word inside each
  const drawn = [...(plot.items ?? []).filter((i) => !i.person), ...(plot.items ?? []).filter((i) => i.person)];
  for (const item of drawn) {
    for (const s of item.shapes ?? []) {
      const placed = placeShape(s, X, Yp, k);
      ops.push((pen, ox, oy) => pen.shape(placeShape(placed, (v) => v + ox, (v) => v + oy, 1), 1));
    }
  }
  for (const item of plot.items ?? []) {
    const tag = E(item.tag ?? '');
    if (!tag) continue;
    const tx = X(fin(item.at?.x)) - spPdfWidth(tag, P.label, true) / 2;
    const ty = Yp(fin(item.at?.y)) + P.label * 0.35;
    ops.push((pen, ox, oy) => pen.text(ox + tx, oy + ty, tag, P.label, true));
  }

  // The names and the references. Each name is on white, so a line never
  // runs through a word; all the white first, then all the words, so the
  // white of one name never covers another name.
  const whites: Op[] = [];
  const words: Op[] = [];
  let lowest = P.top + drawH;
  for (const item of plot.items ?? []) {
    const raw = String(item.label ?? '');
    const name = E(raw);
    const fs = item.person ? P.person : P.label;
    const bold = !!item.person;
    const badges = (item.badges ?? []).map((b) => ({ text: E(b), input: isInputBadge(String(b)), raw: String(b) })).filter((b) => b.text);
    if (!name && !badges.length) continue;
    // a box is as wide as the packet reckoned, or as its text really is when that is wider
    const bws = badges.map((b) => Math.max(estimate(b.raw, P.badge, true), spPdfWidth(b.text, P.badge, true)) + 2 * P.badgePad);
    const badgesW = bws.reduce((a, b) => a + b, 0) + Math.max(0, badges.length - 1) * P.badgeGap;
    const gap = name && badges.length ? 4 : 0;
    const h = badges.length ? P.badgeH + 2 : fs + 3;
    // the name is one line; only a name too long for the sheet is wrapped (it is never cut)
    const room = Math.max(40, W - 4 - gap - badgesW);
    const real = spPdfWidth(name, fs, bold);
    const lines = !name ? [] : real <= room ? [name] : spPdfWrap(name, fs, bold, room);
    const nameW = lines.length === 1 ? Math.min(room, Math.max(estimate(raw, fs, bold), real)) : Math.max(0, ...lines.map((l) => spPdfWidth(l, fs, bold)));
    const lead = fs + 1.5;
    const more = Math.max(0, lines.length - 1) * lead;
    const rowW = nameW + gap + badgesW;
    // a row that would reach past the sheet is moved back inside, whole
    const want = X(fin(item.labelAt?.x, fin(item.at?.x))) - nameW / 2;
    const rowLeft = rowW + 4 >= W ? (W - rowW) / 2 : clamp(want, 2, W - rowW - 2);
    const top = clamp(Yp(fin(item.labelAt?.y, fin(item.at?.y))), P.top, Math.max(P.top, P.top + drawH - h));
    const mid = top + h / 2;
    lowest = Math.max(lowest, mid + fs / 2 + 1 + more);
    if (name) {
      whites.push((pen, ox, oy) => pen.box(ox + rowLeft - 1.5, oy + mid - fs / 2 - 1, nameW + 3, fs + 2 + more, GRAY.paper, null));
      lines.forEach((l, i) => {
        const lx = rowLeft + (nameW - spPdfWidth(l, fs, bold)) / 2;
        words.push((pen, ox, oy) => pen.text(ox + lx, oy + mid + fs * 0.36 + i * lead, l, fs, bold));
      });
    }
    let bx = rowLeft + nameW + gap;
    badges.forEach((b, i) => {
      const x = bx;
      const w = bws[i];
      const tx = x + (w - spPdfWidth(b.text, P.badge, true)) / 2;
      words.push((pen, ox, oy) => {
        pen.shape({ t: 'rect', x: ox + x, y: oy + mid - P.badgeH / 2, w, h: P.badgeH, r: b.input ? 1.5 : P.badgeH / 2, fill: 'paper' }, 0.8);
        pen.text(ox + tx, oy + mid + P.badge * 0.36, b.text, P.badge, true);
      });
      bx += w + P.badgeGap;
    });
  }
  ops.push(...whites, ...words);

  // the four direction words: fixed, never flipped
  // (a shaped stage brings its own: in the round, the reference side)
  const dw0 = plot.deck?.words;
  const dir = { up: E(dw0?.up ?? SP_PDF_PLOT_WORDS.up), down: E(dw0?.down ?? SP_PDF_PLOT_WORDS.down), right: E(dw0?.right ?? SP_PDF_PLOT_WORDS.right), left: E(dw0?.left ?? SP_PDF_PLOT_WORDS.left) };
  const dw = (t: SpPdfText): number => spPdfWidth(t, P.direction, true);
  const midY = P.top + drawH / 2;
  // a wrapped name under the drawing pushes the audience line and the size note down
  const under = Math.max(0, lowest - (P.top + drawH));
  ops.push((pen, ox, oy) => {
    pen.text(ox + (W - dw(dir.up)) / 2, oy + P.top - 6, dir.up, P.direction, true);
    pen.text(ox + (W - dw(dir.down)) / 2, oy + P.top + drawH + under + 14, dir.down, P.direction, true);
    // STAGE RIGHT is on the viewer's LEFT: the performer's right, facing the audience
    pen.textUp(ox + left - 4, oy + midY + dw(dir.right) / 2, dir.right, P.direction, true);
    pen.textDown(ox + left + drawW + 4, oy + midY - dw(dir.left) / 2, dir.left, P.direction, true);
  });

  // THE KEY: directly under the drawing, above the size note
  const key = layoutKey(plot.key ?? [], W);
  const keyTop = P.top + drawH + under + P.bottom;
  if (key.height) ops.push((pen, ox, oy) => key.draw(pen, ox, oy + keyTop));

  // the size note: always printed
  const noteBold = !plot.toScale;
  const noteText = E(plot.toScale ? `Stage size: ${plot.sizeNote ?? ''}` : String(plot.sizeNote ?? '').toUpperCase());
  const noteLines = noteText ? spPdfWrap(noteText, P.direction, noteBold, W) : [];
  const noteLead = P.direction + 2.5;
  // at the key's left edge, so the two headings of one block (KEY, NOT TO SCALE) line up
  const noteX = clamp(P.side, 0, Math.max(0, W - Math.max(0, ...noteLines.map((l) => spPdfWidth(l, P.direction, noteBold)))));
  const noteTop = keyTop + key.height;
  noteLines.forEach((l, i) => ops.push((pen, ox, oy) => pen.text(ox + noteX, oy + noteTop + P.note - 4 + i * noteLead, l, P.direction, noteBold)));
  return {
    height: noteTop + (noteLines.length ? P.note + (noteLines.length - 1) * noteLead : 0),
    drawH,
    draw: (pen, x0, y0) => {
      for (const op of ops) op(pen, x0, y0);
    },
  };
}

/** The plot at its usual size, or with a smaller DRAWING when the whole
 *  block (drawing, key, size note) must be no taller than `maxH`: the key and
 *  every word keep their size. */
function layoutPlot(plot: SpDocPlot, W: number, maxH: number, tall = 0, floor = true): PlotLayout {
  let shrink = 1;
  let lay = buildPlot(plot, W, shrink, tall, floor);
  for (let n = 0; n < 6 && lay.height > maxH + 0.01 && shrink > 0.2; n++) {
    const wanted = lay.drawH - (lay.height - maxH);
    shrink = Math.max(0.2, shrink * Math.min(0.985, (wanted / lay.drawH) * 0.995));
    lay = buildPlot(plot, W, shrink, tall, floor);
  }
  return lay;
}

// ───────────────────────── the flow layout ─────────────────────────
type Laid = { pages: string[]; used: Used };

function layoutDoc(d: SpDoc, paper: { w: number; h: number }): Laid {
  const used: Used = { marks: false };
  const left = SP_PDF_MARGIN;
  const right = paper.w - SP_PDF_MARGIN;
  const W = right - left;

  const title = E(d.title);
  const stamp = E(d.stamp);
  // (plain text here: text is encoded once, when the whole footer line is made)
  const footerBase = String(d.footer ?? '').trim();
  const footerText = (n: number | string, of: number | string): SpPdfText => E(`${footerBase ? footerBase + ' · ' : ''}Page ${n} of ${of}`);
  const FOOT_LEAD = 11;
  // room for the footer is kept for the longest page numbers a packet could have
  const footerLines = spPdfWrap(footerText(9999, 9999), PT.footer, false, W).length;
  const footerTop = paper.h - SP_PDF_MARGIN - footerLines * FOOT_LEAD;
  const bottom = footerTop - 10;

  const pens: Pen[] = [];
  let pen: Pen = makePen(paper.h, used);
  let y = 0;
  let pageTop = 0;

  const stampBox = (size: number, yTop: number): number => {
    if (!stamp) return 0;
    const w = spPdfWidth(stamp, size, true) + 12;
    const h = size + 7;
    pen.box(right - w, yTop, w, h, null, GRAY.ink, 1.2);
    pen.text(right - w + 6, yTop + baseline(size, h), stamp, size, true);
    return w + 10;
  };

  /** A new page, with the title and the stamp at its top. */
  const newPage = (): void => {
    pen = makePen(paper.h, used);
    pens.push(pen);
    const first = pens.length === 1;
    const size = first ? PT.title : PT.running;
    const lead = first ? 19 : 11;
    const stampPt = first ? PT.stamp : PT.running;
    const top = SP_PDF_MARGIN;
    const taken = stampBox(stampPt, top);
    const lines = title ? spPdfWrap(title, size, true, W - taken) : [];
    lines.forEach((l, i) => pen.text(left, top + i * lead + baseline(size, lead), l, size, true, first ? GRAY.ink : GRAY.muted));
    y = top + Math.max(lines.length * lead, stamp ? stampPt + 7 : 0) + (first ? 4 : 3);
    pen.line(left, y, right, y, first ? 1 : 0.5, first ? GRAY.ink : GRAY.rule);
    y += first ? 9 : 8;
    pageTop = y;
  };
  const fresh = (): boolean => y <= pageTop + 0.01;
  /** Keep `h` points together: start a new page when they do not fit here. */
  const ensure = (h: number): void => {
    if (y + h > bottom + 0.01 && !fresh()) newPage();
  };
  const gap = (h: number): void => {
    if (!fresh()) y += h;
  };

  /** Lines of text, one under the other. `keep` = on one page when a page can hold them. */
  const flow = (lines: SpPdfText[], o: { size: number; lead: number; bold?: boolean; gray?: number; x?: number; keep?: boolean; bullet?: SpPdfText }): void => {
    const x = o.x ?? left;
    if (o.keep && lines.length * o.lead <= bottom - pageTop) ensure(lines.length * o.lead);
    lines.forEach((l, i) => {
      ensure(o.lead);
      if (i === 0 && o.bullet) pen.text(x - 11, y + baseline(o.size, o.lead), o.bullet, o.size, false, o.gray);
      pen.text(x, y + baseline(o.size, o.lead), l, o.size, !!o.bold, o.gray);
      y += o.lead;
    });
  };

  // ── tables ──
  const tables = new Map<SpDocTable, PTable>();
  const prepared = (t: SpDocTable): PTable => {
    let p = tables.get(t);
    if (!p) {
      p = prepareTable(t, left, W);
      tables.set(t, p);
    }
    return p;
  };
  const whole = (r: PRow): number => pieceHeight(r, 0, rowUnits(r));
  /**
   * What a table needs under its header where it starts (KEEP WITH NEXT, held
   * item of 2026-11-13: a header and one row were left at the foot of a
   * page): its first `TABLE_KEEP_ROWS` rows, or ALL of a table that short,
   * with the gray note under it (`tail`). When that is not here, the table
   * starts on the next page, whole. Only a very tall first row (over half a
   * page) asks for less: its first lines; and the rows kept are never more
   * than half a page.
   */
  const firstPiece = (p: PTable, tail = 0): number => {
    if (!p.rows.length) return p.empty.length * TABLE_LEAD + 2 * CELL_PAD_Y;
    const pageRoom = bottom - pageTop - p.headH;
    const h0 = whole(p.rows[0]);
    if (h0 > pageRoom / 2) return Math.min(h0, 3 * TABLE_LEAD + 2 * CELL_PAD_Y);
    if (p.rows.length <= TABLE_KEEP_ROWS) {
      const all = p.rows.reduce((n, r) => n + whole(r), 0) + tail;
      if (all <= pageRoom) return all;
    }
    let h = h0;
    for (let i = 1; i < Math.min(TABLE_KEEP_ROWS, p.rows.length); i++) {
      if (h + whole(p.rows[i]) > pageRoom / 2) break;
      h += whole(p.rows[i]);
    }
    return h;
  };
  /**
   * Where a table goes on to a new page: the rows that START a page, worked
   * out before anything is drawn. Rows fill each page; then, where a page
   * after the first would hold ONE ROW ALONE (the last row of the table at
   * the top of a new page), the row before it is carried over too, and so on
   * back through the pages. `room0` = the room under the header on the page
   * where the table starts. `lonely` = that first page would be left with the
   * header and fewer than `TABLE_KEEP_ROWS` rows (or fewer than all of a
   * shorter table): the table should start on a new page.
   */
  const planTable = (p: PTable, room0: number, tail: number): { starts: Set<number>; lonely: boolean } => {
    const pageRoom = bottom - pageTop - p.headH;
    const last = p.rows.length - 1;
    // a row taller than a page is divided where it falls: nothing to plan
    if (p.rows.some((r) => whole(r) > pageRoom)) return { starts: new Set<number>(), lonely: false };
    const pages: number[][] = [[]];
    let room = room0;
    p.rows.forEach((r, i) => {
      const h = whole(r);
      if (h + (i === last ? tail : 0) > room + 0.01 && pages[pages.length - 1].length) {
        pages.push([]);
        room = pageRoom;
      }
      pages[pages.length - 1].push(i);
      room -= h;
    });
    const height = (k: number): number => pages[k].reduce((n, i) => n + whole(p.rows[i]), 0) + (k === pages.length - 1 ? tail : 0);
    for (let k = pages.length - 1; k >= 1; k--) {
      if (pages[k].length !== 1 || !pages[k - 1].length) continue;
      const moved = pages[k - 1][pages[k - 1].length - 1];
      if (height(k) + whole(p.rows[moved]) > pageRoom + 0.01) continue; // two rows that no page can hold together
      pages[k - 1].pop();
      pages[k].unshift(moved);
    }
    const starts = new Set<number>();
    for (let k = 1; k < pages.length; k++) if (pages[k].length) starts.add(pages[k][0]);
    return { starts, lonely: pages.length > 1 && pages[0].length < Math.min(TABLE_KEEP_ROWS, p.rows.length) };
  };
  /** `tail` = the height of a short gray note that follows the table: it is
   *  kept on the page of the table's last row. */
  const drawTable = (table: SpDocTable, tail = 0): void => {
    if (!table.columns.length) {
      flow(spPdfWrap(E(table.empty), PT.body, false, W), { size: PT.body, lead: BODY_LEAD, gray: GRAY.muted });
      y += AFTER.table;
      return;
    }
    const p = prepared(table);
    const cols = p.widths.length;
    const header = (): void => {
      pen.box(left, y, W, p.headH, GRAY.head, GRAY.ink, 0.75);
      for (let c = 1; c < cols; c++) pen.line(p.xs[c], y, p.xs[c], y + p.headH, 0.3, GRAY.rule);
      p.head.forEach((lines, c) =>
        lines.forEach((l, i) => {
          const lw = spPdfWidth(l, SP_PDF_TABLE_PT, true);
          const x = p.center[c] ? p.xs[c] + (p.widths[c] - lw) / 2 : p.xs[c] + CELL_PAD_X;
          pen.text(x, y + CELL_PAD_Y + i * TABLE_LEAD + baseline(SP_PDF_TABLE_PT, TABLE_LEAD), l, SP_PDF_TABLE_PT, true);
        }),
      );
      y += p.headH;
    };
    /** The header again, at the top of a new page. */
    const carryOn = (): void => {
      newPage();
      header();
    };
    const piece = (r: PRow, u0: number, u1: number): void => {
      const h = pieceHeight(r, u0, u1);
      const cellEnd = Math.min(u1, r.cellUnits);
      // cell by cell (not line by line across the row), so text that is
      // copied or read aloud from the file keeps each cell together
      r.cells.forEach((lines, c) => {
        for (let u = u0; u < cellEnd; u++) {
          const l = lines[u];
          if (!l) continue;
          const by = y + CELL_PAD_Y + (u - u0) * TABLE_LEAD + baseline(SP_PDF_TABLE_PT, TABLE_LEAD);
          const lw = spPdfWidth(l, SP_PDF_TABLE_PT, r.strong);
          pen.text(p.center[c] ? p.xs[c] + (p.widths[c] - lw) / 2 : p.xs[c] + CELL_PAD_X, by, l, SP_PDF_TABLE_PT, r.strong);
        }
      });
      for (let u = Math.max(u0, r.cellUnits); u < u1; u++) {
        const by = y + CELL_PAD_Y + (u - u0) * TABLE_LEAD + baseline(SP_PDF_TABLE_PT, TABLE_LEAD);
        pen.text(p.noteX, by, r.note[u - r.cellUnits], SP_PDF_TABLE_PT, false);
      }
      // column lines beside the cells only: the note runs the full width
      if (cellEnd > u0) {
        const cellH = u1 > r.cellUnits ? CELL_PAD_Y + (cellEnd - u0) * TABLE_LEAD : h;
        for (let c = 1; c < cols; c++) pen.line(p.xs[c], y, p.xs[c], y + cellH, 0.3, GRAY.soft);
      }
      pen.line(left, y, left, y + h, 0.5, GRAY.rule);
      pen.line(right, y, right, y + h, 0.5, GRAY.rule);
      pen.line(left, y + h, right, y + h, 0.5, GRAY.rule);
      y += h;
    };

    const pageRoom = bottom - pageTop - p.headH;
    ensure(p.headH + firstPiece(p, tail));
    let plan = planTable(p, bottom - y - p.headH, tail);
    if (plan.lonely && !fresh()) {
      newPage();
      plan = planTable(p, bottom - y - p.headH, tail);
    }
    header();
    if (!p.rows.length) {
      const h = p.empty.length * TABLE_LEAD + 2 * CELL_PAD_Y;
      p.empty.forEach((l, i) => pen.text(left + CELL_PAD_X, y + CELL_PAD_Y + i * TABLE_LEAD + baseline(SP_PDF_TABLE_PT, TABLE_LEAD), l, SP_PDF_TABLE_PT, false, GRAY.muted));
      pen.line(left, y, left, y + h, 0.5, GRAY.rule);
      pen.line(right, y, right, y + h, 0.5, GRAY.rule);
      pen.line(left, y + h, right, y + h, 0.5, GRAY.rule);
      y += h;
    }
    // (pageRoom = the room for rows on a page that holds only the page header and the table header)
    let underHeader = true;
    p.rows.forEach((r, i) => {
      // the planned page breaks: a row is never left alone on a page, and the
      // last row keeps the gray note that follows the table
      if (plan.starts.has(i) && !underHeader) {
        carryOn();
        underHeader = true;
      }
      const all = rowUnits(r);
      let u0 = 0;
      while (u0 < all) {
        const room = bottom - y;
        let u1 = all;
        if (pieceHeight(r, u0, all) > room + 0.01) {
          if (pieceHeight(r, u0, all) <= pageRoom) {
            // the usual case: the row goes to the next page whole
            carryOn();
            underHeader = true;
            continue;
          }
          // a row taller than a page: print what fits, and go on overleaf
          let k = Math.floor((room - 2 * CELL_PAD_Y + 0.01) / TABLE_LEAD);
          if (k < 3 && !underHeader) {
            carryOn();
            underHeader = true;
            continue;
          }
          k = Math.max(1, k);
          u1 = Math.min(all, u0 + k);
        }
        piece(r, u0, u1);
        underHeader = false;
        u0 = u1;
      }
    });
    y += AFTER.table;
  };

  // ── the plot block ──
  /** Set by a roomy plot: the next SECTION starts on a new page (what follows the plot in its own section runs on). */
  let pageOwed = false;
  const plots = new Map<SpDocPlot, { natural: PlotLayout; notes: SpPdfText[] }>();
  const plotInfo = (plot: SpDocPlot): { natural: PlotLayout; notes: SpPdfText[] } => {
    let p = plots.get(plot);
    if (!p) {
      const notes: SpPdfText[] = [];
      if (E(plot.viewNote ?? '')) notes.push(...spPdfWrap(E(plot.viewNote), PT.body, false, W));
      p = { natural: layoutPlot(plot, W, Number.POSITIVE_INFINITY), notes };
      plots.set(plot, p);
    }
    return p;
  };
  /** The least height a plot accepts on a page that already has something on it. */
  const plotLeast = (lay: PlotLayout): number => lay.height - 0.4 * lay.drawH;

  const drawPlot = (plot: SpDocPlot): void => {
    const { natural, notes } = plotInfo(plot);
    const notesH = notes.length * BODY_LEAD + 4;
    const legend = (plot.legend ?? []).map(E).filter((l) => l).map((l) => spPdfWrap(l, PT.legend, false, W - 12));
    const LEGEND_LEAD = 11;
    const legendH = legend.reduce((n, lines) => n + lines.length * LEGEND_LEAD, 0) + (legend.length ? 3 : 0);
    // The drawing, its key, its size note and its view note are ONE unit on
    // one page. The lines of the legend belong under them: when they do not
    // fit, the drawing gives way a little (at most 15%) before the legend is
    // allowed to run on to the next page.
    const fit = (): PlotLayout | null => {
      const room = bottom - y - notesH;
      if (natural.height + legendH <= room) return natural;
      if (natural.height + legendH - room <= 0.15 * natural.drawH) {
        const given = layoutPlot(plot, W, room - legendH);
        // (a shaped stage gives way only down to its floor: then the legend runs on)
        if (!plot.deck || given.height <= room) return given;
      }
      return natural.height <= room ? natural : null;
    };
    // A ROOMY plot (a plot-only packet, six or more performers) is drawn as
    // tall as this page allows after the header, the key and the notes (the
    // page width still bounds it), and the next section starts on a new page.
    // When the key and the notes leave the drawing less than its usual
    // height, it is laid out as any other plot (it never gets smaller for
    // being roomy).
    const roomy = (): PlotLayout | null => {
      const other = natural.height - natural.drawH;
      const forDrawing = bottom - y - notesH - legendH - other;
      return forDrawing > natural.drawH ? layoutPlot(plot, W, bottom - y - notesH - legendH, forDrawing) : null;
    };
    let lay = (plot.roomy ? roomy() : null) ?? fit();
    if (!lay && !fresh() && bottom - y - notesH < plotLeast(natural)) {
      newPage();
      lay = fit();
    }
    if (!lay) lay = layoutPlot(plot, W, bottom - y - notesH, 0, false);
    lay.draw(pen, left, y);
    y += lay.height + 4;
    flow(notes, { size: PT.body, lead: BODY_LEAD });
    if (legend.length) y += 3;
    for (const lines of legend) flow(lines, { size: PT.legend, lead: LEGEND_LEAD, x: left + 12, keep: true, bullet: E('•') });
    y += AFTER.plot;
    if (plot.roomy) pageOwed = true;
  };

  // ── facts: label / value pairs, in two columns when there are three or more ──
  const drawFacts = (rows: [string, string][], colCount = rows.length >= 3 ? 2 : 1): void => {
    if (!rows.length) return;
    const gutter = 18;
    const colW = (W - gutter * (colCount - 1)) / colCount;
    const per = Math.ceil(rows.length / colCount);
    const cols = Array.from({ length: colCount }, (_, c) => {
      const items = rows.slice(c * per, (c + 1) * per).map(([l, v]) => [E(l ?? ''), E(v ?? '')] as const);
      const widest = Math.max(0, ...items.map(([l]) => spPdfWidth(l, PT.body, true)));
      const labelW = Math.min(widest + 8, colW * 0.45);
      // each pair as its printed lines: [a line of the label, a line of the value]
      const pairs = items.map(([l, v]) => {
        const label = spPdfWrap(l, PT.body, true, labelW - 6);
        const value = spPdfWrap(v, PT.body, false, colW - labelW);
        return Array.from({ length: Math.max(label.length, value.length) }, (_, i) => [label[i] ?? '', value[i] ?? ''] as const);
      });
      return { x: left + c * (colW + gutter), labelW, pairs };
    });
    const put = (c: (typeof cols)[number], line: readonly [SpPdfText, SpPdfText], at: number): void => {
      pen.text(c.x, at + baseline(PT.body, BODY_LEAD), line[0], PT.body, true);
      pen.text(c.x + c.labelW, at + baseline(PT.body, BODY_LEAD), line[1], PT.body, false);
    };
    if (colCount > 1) {
      // two columns side by side, each read from its top down: they must share one page
      const height = Math.max(...cols.map((c) => c.pairs.reduce((n, p) => n + p.length, 0))) * BODY_LEAD;
      if (height > bottom - pageTop) {
        drawFacts(rows, 1);
        return;
      }
      ensure(height);
      for (const c of cols) {
        let at = y;
        for (const pair of c.pairs) {
          for (const line of pair) {
            put(c, line, at);
            at += BODY_LEAD;
          }
        }
      }
      y += height + AFTER.facts;
      return;
    }
    for (const pair of cols[0].pairs) {
      // a pair stays on one page; only a value longer than a page is divided
      if (pair.length * BODY_LEAD <= bottom - pageTop) ensure(pair.length * BODY_LEAD);
      for (const line of pair) {
        ensure(BODY_LEAD);
        put(cols[0], line, y);
        y += BODY_LEAD;
      }
    }
    y += AFTER.facts;
  };

  type HeadKind = 'section' | 1 | 2;
  const headingBox = (text: string, kind: HeadKind): { lines: SpPdfText[]; size: number; lead: number; before: number; after: number } => {
    const size = kind === 'section' ? PT.section : kind === 1 ? PT.h1 : PT.h2;
    const t = E(text);
    return { lines: t ? spPdfWrap(t, size, true, W) : [], size, lead: size + 3, before: kind === 'section' ? 10 : kind === 1 ? 8 : 6, after: kind === 'section' ? 6 : 3 };
  };
  const paraLines = (b: Extract<SpDocBlock, { t: 'para' }>): SpPdfText[] => {
    const t = E(b.text);
    return t ? spPdfWrap(t, PT.body, b.tone === 'strong', W) : [];
  };

  /**
   * What must stay on the page with a heading (or with a short line of
   * text): everything from block `from` up to and including the header and
   * the FIRST ROW of the next table, so a heading and the line or two under
   * it are never left at the foot of a page with their table overleaf.
   * `table` says whether a table was reached. Only the next `between` blocks
   * of text are looked through, and at most half a page of them: a table
   * farther off is not "under" this heading, and then only the first lines
   * of what follows are kept with it.
   */
  const keepAfter = (blocks: SpDocBlock[], from: number, between: number, at: number = y): { h: number; table: boolean } => {
    const most = (bottom - pageTop) / 2;
    let h = 0;
    for (let j = from; j < blocks.length && j <= from + between; j++) {
      const b = blocks[j];
      if (b.t === 'table') {
        if (!b.table.columns.length) return { h: h + BODY_LEAD, table: true };
        const p = prepared(b.table);
        const tail = tableNote(blocks[j + 1]);
        const need = h + p.headH + firstPiece(p, tail);
        // the table starts at `at + h`: where its page breaks would leave
        // fewer than TABLE_KEEP_ROWS rows there, it moves whole to the next
        // page (drawTable), and what is kept with it goes too
        const room0 = bottom - (at + h) - p.headH;
        if (room0 >= need - h - p.headH && planTable(p, room0, tail).lonely) return { h: Math.max(need, bottom - at + 1), table: true };
        return { h: need, table: true };
      }
      if (b.t === 'plot') {
        const info = plotInfo(b.plot);
        return { h: h + plotLeast(info.natural) + info.notes.length * BODY_LEAD + 4, table: false };
      }
      // The first lines of a list or of facts, never every block read on the
      // way to it: an uncapped sum here made a sub-heading ask for its whole
      // section and leave the section heading alone at a page foot (R2-SP2-02).
      if (b.t === 'facts') return { h: Math.min(h + BODY_LEAD, 3 * BODY_LEAD), table: false };
      if (b.t === 'list') {
        // A list RIGHT UNDER the heading: its first two ITEMS stay with it
        // (an item is never split, so two lines could be one item and a
        // heading stood at a page foot over one short item: checker P6)
        if (j === from) {
          const items = b.items.map((it) => E(it)).filter(Boolean).slice(0, 2);
          const firstTwo = items.reduce((sum, t) => sum + spPdfWrap(t, PT.body, false, W - 12).length * BODY_LEAD + AFTER.item, 0);
          if (firstTwo) return { h: firstTwo, table: false };
        }
        return { h: Math.min(h + 2 * BODY_LEAD, 3 * BODY_LEAD), table: false };
      }
      if (b.t === 'heading') {
        const box = headingBox(b.text, b.level === 1 ? 1 : 2);
        const boxH = box.lines.length ? box.before + box.lines.length * box.lead + box.after : 0;
        // A heading right under this one: keep everything THAT heading will
        // ask to keep, so the two never part at a page foot (R2-SP2-02).
        if (j === from && boxH) {
          const k = keepAfter(blocks, j + 1, between, at + boxH);
          return { h: boxH + k.h, table: k.table };
        }
        h += boxH;
      } else {
        const n = paraLines(b).length;
        if (n) h += n * BODY_LEAD + AFTER.para;
      }
      if (h > most) break;
    }
    // no table close by: the heading keeps the first lines of what follows
    return { h: Math.min(h, 3 * BODY_LEAD), table: false };
  };

  const heading = (text: string, kind: HeadKind, blocks: SpDocBlock[], next: number): void => {
    const box = headingBox(text, kind);
    if (!box.lines.length) return;
    const own = box.lines.length * box.lead + box.after;
    // a heading is never the last thing on a page
    const under = y + (fresh() ? 0 : box.before) + own;
    if (under + keepAfter(blocks, next, 4, under).h > bottom + 0.01 && !fresh()) newPage();
    gap(box.before);
    box.lines.forEach((l) => {
      pen.text(left, y + baseline(box.size, box.lead), l, box.size, true);
      y += box.lead;
    });
    if (kind === 'section') pen.line(left, y + 1, right, y + 1, 0.5, GRAY.rule);
    y += box.after;
  };

  /** The height of a short gray note right under a table (0 = there is none). */
  const tableNote = (b: SpDocBlock | undefined): number => {
    if (!b || b.t !== 'para' || b.tone !== 'muted') return 0;
    const n = paraLines(b).length;
    return n >= 1 && n <= 4 ? n * BODY_LEAD + AFTER.table : 0;
  };

  const drawBlock = (blocks: SpDocBlock[], i: number): void => {
    const b = blocks[i];
    if (b.t === 'heading') heading(b.text, b.level === 1 ? 1 : 2, blocks, i + 1);
    else if (b.t === 'para') {
      const lines = paraLines(b);
      if (!lines.length) return;
      // a line or two of text just above a table goes to the next page with the
      // table (not the gray note UNDER a table: that one belongs to the table above it)
      const under = i > 0 && blocks[i - 1].t === 'table' && tableNote(b) > 0;
      if (lines.length <= 4 && !under) {
        const keep = keepAfter(blocks, i + 1, 1, y + lines.length * BODY_LEAD + AFTER.para);
        if (keep.table) ensure(lines.length * BODY_LEAD + AFTER.para + keep.h);
      }
      flow(lines, { size: PT.body, lead: BODY_LEAD, bold: b.tone === 'strong', gray: b.tone === 'muted' ? GRAY.muted : GRAY.ink });
      y += AFTER.para;
    } else if (b.t === 'facts') drawFacts(b.rows);
    else if (b.t === 'list') {
      for (const item of b.items) {
        const t = E(item);
        if (!t) continue;
        flow(spPdfWrap(t, PT.body, false, W - 12), { size: PT.body, lead: BODY_LEAD, x: left + 12, keep: true, bullet: E('•') });
        y += AFTER.item;
      }
      y += AFTER.list;
    } else if (b.t === 'table') drawTable(b.table, tableNote(blocks[i + 1]));
    else if (b.t === 'plot') drawPlot(b.plot);
  };

  newPage();
  const same = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();
  for (const sec of d.sections ?? []) {
    // where the section starts: 'page' = always a new page; 'auto' = a new
    // page only when less than a third of this one is left; 'none' = it follows on
    if (!fresh() && (pageOwed || sec.breakBefore === 'page' || (sec.breakBefore === 'auto' && bottom - y < (bottom - pageTop) / 3))) newPage();
    pageOwed = false;
    const blocks = sec.blocks ?? [];
    // a section whose first block already is its title gets the title once
    const first = blocks[0];
    if (!(first && first.t === 'heading' && same(first.text, sec.title ?? ''))) heading(sec.title ?? '', 'section', blocks, 0);
    blocks.forEach((_, i) => drawBlock(blocks, i));
  }

  // the footers, now that the page count is known
  pens.forEach((p, i) => {
    p.line(left, footerTop - 4, right, footerTop - 4, 0.5, GRAY.rule);
    const lines = spPdfWrap(footerText(i + 1, pens.length), PT.footer, false, W);
    lines.forEach((l, k) => p.text(left + (W - spPdfWidth(l, PT.footer, false)) / 2, footerTop + k * FOOT_LEAD + baseline(PT.footer, FOOT_LEAD), l, PT.footer, false));
  });
  return { pages: pens.map((p) => p.ops.join('\n')), used };
}

// ───────────────────────── the file ─────────────────────────
/** Any text as a PDF hex string in UTF-16 (for the file's title, which is not page text). */
function hexText(text: string): string {
  let s = 'FEFF';
  for (let i = 0; i < text.length; i++) s += pad(text.charCodeAt(i).toString(16).toUpperCase(), 4);
  return `<${s}>`;
}

function pdfDate(ms: number): string {
  const t = new Date(ms);
  if (!Number.isFinite(ms) || Number.isNaN(t.getTime())) return '';
  const p = (v: number, n = 2): string => pad(String(v), n);
  return `D:${p(t.getUTCFullYear(), 4)}${p(t.getUTCMonth() + 1)}${p(t.getUTCDate())}${p(t.getUTCHours())}${p(t.getUTCMinutes())}${p(t.getUTCSeconds())}Z`;
}

/** A 32-digit mark made from the file's own text (the same packet gives the same file). */
function fileId(body: string): string {
  const h = [0x811c9dc5, 0x01000193, 0x9e3779b9, 0x85ebca6b];
  for (let i = 0; i < body.length; i++) {
    const c = body.charCodeAt(i) & 0xff;
    for (let k = 0; k < 4; k++) h[k] = Math.imul(h[k] ^ (c + k * 31), 16777619) >>> 0;
  }
  return h.map((v) => pad(v.toString(16).toUpperCase(), 8)).join('');
}

/** How many pages the PDF of this packet has on its paper: the same layout
 *  the file is made with, so the Export screen can say "4 pages on US
 *  Letter" before anything is downloaded (bug test 2026-11-13, 8). */
export function spPdfPageCount(d: SpDoc): number {
  return layoutDoc(d, SP_PDF_PAPER[d.paper] ?? SP_PDF_PAPER.letter).pages.length;
}

/**
 * One packet → the bytes of its PDF file. The same `SpDoc` always gives the
 * same bytes (the date in the file is `doc.generatedAt`, not the clock).
 */
export function spPdfBytes(d: SpDoc): Uint8Array {
  const paper = SP_PDF_PAPER[d.paper] ?? SP_PDF_PAPER.letter;
  const { pages, used } = layoutDoc(d, paper);
  const marks = used.marks;

  // object numbers: 1 catalog, 2 page tree, 3–4 (5) fonts, then the file facts, then two per page
  const infoId = marks ? 6 : 5;
  const firstPage = infoId + 1;
  const pageId = (i: number): number => firstPage + i * 2;
  const objects: string[] = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pages.map((_, i) => `${pageId(i)} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  if (marks) objects[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /ZapfDingbats >>';
  const date = pdfDate(d.generatedAt);
  objects[infoId] = `<< /Title ${hexText(d.title ?? '')} /Producer (Stage Plot and Channel Designer)${date ? ` /CreationDate (${date})` : ''} >>`;
  const fonts = `/F1 3 0 R /F2 4 0 R${marks ? ' /F3 5 0 R' : ''}`;
  pages.forEach((content, i) => {
    objects[pageId(i)] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(paper.w)} ${num(paper.h)}] ` + `/Resources << /ProcSet [/PDF /Text] /Font << ${fonts} >> >> /Contents ${pageId(i) + 1} 0 R >>`;
    // every character of a page stream is one byte (text above 126 is written as \ooo)
    objects[pageId(i) + 1] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  });

  // the second line holds four bytes above 127: it tells a program that this is not a plain text file
  const parts: string[] = [`%PDF-1.4\n%${String.fromCharCode(0xe2, 0xe3, 0xcf, 0xd3)}\n`];
  let length = parts[0].length;
  const offsets: number[] = [];
  for (let id = 1; id < objects.length; id++) {
    offsets[id] = length;
    const o = `${id} 0 obj\n${objects[id]}\nendobj\n`;
    parts.push(o);
    length += o.length;
  }
  let xref = `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id++) xref += `${pad(String(offsets[id]), 10)} 00000 n \n`;
  const id = fileId(parts.join(''));
  parts.push(`${xref}trailer\n<< /Size ${objects.length} /Root 1 0 R /Info ${infoId} 0 R /ID [<${id}> <${id}>] >>\nstartxref\n${length}\n%%EOF\n`);

  const all = parts.join('');
  const bytes = new Uint8Array(all.length);
  for (let i = 0; i < all.length; i++) bytes[i] = all.charCodeAt(i) & 0xff;
  return bytes;
}
