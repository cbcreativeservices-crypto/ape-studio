/**
 * stageplot/spPacket — the GIG PACKET, made from one frozen copy of a
 * project (handoff §7).
 *
 *   spBuildSnapshot   freeze the project as it is now, with the export options
 *   spBuildDoc        that one snapshot → ONE `SpDoc` (spDocTypes.ts)
 *   spDocText         the same `SpDoc` as structured text (a screen reader, a copy)
 *   spPlotDoc         the plot block alone
 *   spEmailText       the suggested message, for the user to edit
 *   spAfterExport     what an export does to the project: it freezes the
 *                     revision that was shared and changes nothing else
 *
 * Every page of an export is made from the `SpDoc`, and the `SpDoc` is made
 * from the snapshot and nothing else, so the plot page and the table pages
 * cannot come from different revisions.
 *
 * What the packet never does:
 *   • it never fills in an unknown: every "to be confirmed" and every review
 *     question still open is PRINTED in the unresolved list;
 *   • it never prints a contact item the user chose to hide;
 *   • it never says a gig is ready for production. "Ready to advance" means
 *     the band's document is prepared for discussion with the venue;
 *   • it never prescribes gain, EQ or polarity, and lists no radio
 *     frequencies. It records what the band asked for.
 *
 * Pure: no React, no native modules, no clock (the caller passes `now`).
 */
import {
  SP_AUDIENCE_WORD,
  SP_CAPTURE_WORD,
  SP_CATEGORY_ORDER,
  SP_CATEGORY_WORD,
  SP_DELIVERY_WORD,
  SP_DEVICE_WORD,
  SP_NEED_WORD,
  SP_PALETTE,
  SP_PRIORITY_WORD,
  SP_PROVIDER_WORD,
  SP_STAND_WORD,
  SP_SUPPLIER_WORD,
  SP_VENUE_FEED_WORD,
} from './spCatalog.ts';
import { spAllInputsInOrder, spBadge, spBoxMoreWords, spBoxSizeWords, spBoxUse, spBoxUseWords, spDeviceCountWord, spInputSupplier, spMixesOf, spMonoStereoWord, spPatchRows, spSummary, spSupplierWords, type SpBySupplier, type SpSummary } from './spDerive.ts';
import type { SpDoc, SpDocBlock, SpDocColumn, SpDocDeck, SpDocKeyItem, SpDocPlot, SpDocPlotItem, SpDocRow, SpDocSection, SpDocTable } from './spDocTypes.ts';
import { spBox, spBoxName, spBoxObject, spBoxPatchWords, spBoxPlotLabel, spBoxes, spEdit, spFreeze, spLocationWord, spMix, spMixWantsReturn, spObjectOfInput, spOnStage, spPerformer, spReturnBoxes, spReturnWords, spVenueGivesReturns } from './spModel.ts';
import { spPdfEncode, spPdfWidth } from './spPdfFonts.ts';
import { spChoirCountWords, spChoirOf, spChoirRiserNote } from './spChoir.ts';
import { spFrontEdges, spHasWings, spIsCircle, spIsShaped, spRoundRef, spRoundSides, spShapeBounds, spShapeDirections, spShapeGridSegments, spShapeOf, spShapeOutline, spShapeWords, spThrustFrac, spWingFrac, spWingRects } from './spShape.ts';
import { spReview, type SpIssue } from './spReview.ts';
import { spIsSized, spKeySymbol, spObjectBoxM, spPlacedShapes, spPlotKey, spStageMeters, spSymbol, type SpShape } from './spSymbols.ts';
import type { SpDeviceType, SpExportOptions, SpId, SpInput, SpMix, SpMixNeed, SpObject, SpPacketKind, SpProject, SpSnapshot } from './spTypes.ts';

/* ── small words ────────────────────────────────────────────────────────── */

const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;
const lower = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);
const DASH = '–';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2026-12-05" → "December 5, 2026". Anything else is printed as typed. */
export function spDateWords(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso.trim();
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${month} ${Number(m[3])}, ${m[1]}` : iso.trim();
}

/** A moment as the device's own date and time: "November 12, 2026, 2:05 PM". */
export function spMomentWords(ms: number): string {
  const d = new Date(ms);
  if (!Number.isFinite(d.getTime())) return '';
  const h = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}, ${h % 12 === 0 ? 12 : h % 12}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
}

/** The day of a moment, in the device's own time: "November 12, 2026". */
export function spDayWords(ms: number): string {
  const d = new Date(ms);
  return Number.isFinite(d.getTime()) ? `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : '';
}

const num = (n: number): string => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100));

export const SP_PACKET_WORD: Record<SpPacketKind, string> = { full: 'Full packet', plot: 'Stage plot only', compact: 'Compact packet' };

/** Which packets complete the guided task's "Make the packet" (owner
 *  2026-11-13): the full and the compact packet. A plot-only page is still
 *  made and shared as before; it is not the packet. */
export const spPacketCounts = (kind: SpPacketKind): boolean => kind === 'full' || kind === 'compact';
/** Said in Export while "Stage plot only" is chosen, and in the guided task. */
export const SP_PLOT_ONLY_WORDS = 'A plot-only page does not complete the guided task’s last step: make the full or compact packet.';
export const SP_PAPER_WORD = { letter: 'US Letter', a4: 'A4' } as const;

/** The band's name as typed; '' when none is typed. A made-up name is never
 *  printed as the band's: the header then has no name, and the first block
 *  says `Band: not named yet`. */
const bandName = (p: SpProject): string => p.band.trim();
const NO_BAND = 'not named yet';
const COUNT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const countWord = (n: number): string => COUNT_WORDS[n] ?? String(n);

/* ── the snapshot ───────────────────────────────────────────────────────── */

function deepFreeze<T>(x: T): T {
  if (x && typeof x === 'object' && !Object.isFrozen(x)) {
    Object.freeze(x);
    for (const v of Object.values(x as Record<string, unknown>)) deepFreeze(v);
  }
  return x;
}

/** A frozen copy of the project as it is NOW. An edit made after this belongs
 *  to the next export: it cannot reach a page made from this copy. */
export function spBuildSnapshot(p: SpProject, options: SpExportOptions, now: number): SpSnapshot {
  return deepFreeze({ project: JSON.parse(JSON.stringify(p)) as SpProject, options: { paper: options.paper, packet: options.packet }, generatedAt: now });
}

const sameContent = (a: SpProject, b: SpProject): boolean => JSON.stringify({ ...a, modifiedAt: 0, frozenRevision: 0, packetRevision: 0 }) === JSON.stringify({ ...b, modifiedAt: 0, frozenRevision: 0, packetRevision: 0 });

/** What a finished export does to the project (pass it to the editor's
 *  `apply`). The revision that was shared is frozen, so the next real edit
 *  moves the revision on. No other field changes.
 *
 *  `packetMade`: a PACKET left the app (DOWNLOAD PDF, SHARE, PRINT). Only
 *  then, and only for a full or compact packet (never "Stage plot only"),
 *  is the revision recorded as the one a packet was made from
 *  (`packetRevision`, what the guided task's last step reads). COPY
 *  TECHNICAL SUMMARY freezes the revision and makes no packet (R2-SP1-01).
 *
 *  If the project was edited WHILE the export was being made, those edits
 *  are not in the pages that went out: they are moved to the next revision
 *  here, so the number that was shared keeps meaning what was shared. */
export function spAfterExport(current: SpProject, snap: SpSnapshot, packetMade = false): SpProject {
  const sent = snap.project;
  if (current.id !== sent.id || current.revision !== sent.revision) return current;
  // only a FULL or COMPACT packet is "the packet" (owner 2026-11-13): a
  // plot-only page freezes the revision it shows and records no packet
  const counts = packetMade && spPacketCounts(snap.options.packet);
  const withPacket = (q: SpProject): SpProject => (counts && q.packetRevision < sent.revision ? { ...q, packetRevision: sent.revision } : q);
  if (sameContent(current, sent)) return withPacket(current.frozenRevision >= current.revision ? current : spFreeze(current));
  return spEdit(withPacket(spFreeze(current)), () => undefined);
}

/* ── names ──────────────────────────────────────────────────────────────── */

/** A band name as one file-name word: accents folded, anything a file system
 *  may refuse removed. "The Example Four" → "TheExampleFour". */
function fileWord(s: string): string {
  const ascii = s
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim();
  return ascii
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
    .slice(0, 60);
}

/** "TheExampleFour_StagePlot_2026-12-05_Rev03.pdf"; no date part when the
 *  project has no event date (handoff §7), and no name part when the band
 *  has no name ("StagePlot_Rev01.pdf"). */
export function spFileName(p: SpProject): string {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(p.eventDate.trim()) ? `${p.eventDate.trim()}_` : '';
  const band = fileWord(p.band);
  return `${band ? `${band}_` : ''}StagePlot_${date}Rev${String(p.revision).padStart(2, '0')}.pdf`;
}

/** The contact items the user chose to show, and only those. */
export function spShownContact(p: SpProject): { name: string; role: string; email: string; phone: string } {
  const c = p.contact;
  return {
    name: c.show.name ? c.name.trim() : '',
    role: c.show.role ? c.role.trim() : '',
    email: c.show.email ? c.email.trim() : '',
    phone: c.show.phone ? c.phone.trim() : '',
  };
}
function contactLine(p: SpProject): string {
  const c = spShownContact(p);
  const who = [c.name, c.role].filter(Boolean).join(', ');
  return [who, c.email, c.phone].filter(Boolean).join(' · ');
}

/** The suggested message (handoff §7). The user edits it; nothing is sent by
 *  this tool. It names only the contact items the user chose to show. */
export function spEmailText(p: SpProject): { subject: string; body: string } {
  const event = [p.venue.trim(), spDateWords(p.eventDate)].filter(Boolean).join(', ');
  const band = bandName(p);
  const what = `tage plot, input list and monitor plan${event ? ` for ${event}` : ''} (revision ${p.revision})`;
  const contact = contactLine(p);
  return {
    subject: band ? `${band}: s${what}` : `S${what}`,
    body: `Hello,\n\nAttached are our s${what}. The packet shows what we bring and what we ask the venue to provide. Please tell us about any substitutions, and help us settle the details marked “to be confirmed”.\n\nThank you.${contact ? `\n\nTechnical contact: ${contact}` : ''}`,
  };
}

/* ── the review, as the packet prints it ────────────────────────────────── */

/** "DRAFT" while the project is a draft or anything must be corrected. */
export function spStamp(p: SpProject, issues: SpIssue[] = spReview(p)): string {
  return p.status === 'draft' || issues.some((i) => i.level === 'block') ? 'DRAFT' : '';
}

/** Every "to be confirmed" and every review question still open, in words.
 *  Printed as they are: the packet never answers one for the band. The list
 *  is printed under its own heading "Unresolved: to be confirmed", so the
 *  same words are not repeated at the start of every line. A review question
 *  that has a sentence written for the venue (`packetText`) prints that. */
export function spUnresolved(issues: SpIssue[]): string[] {
  const out: string[] = [];
  for (const i of issues) {
    if (i.level !== 'open' && i.level !== 'ask') continue;
    // a question to the band about its own title is not the venue's to read
    if (i.rule === 'example-title') continue;
    const text = (i.packetText ?? i.text).replace(/^To be confirmed — /, '');
    if (!out.includes(text)) out.push(text);
  }
  return out;
}
/** What must be corrected before "Ready to advance". */
export function spToCorrect(issues: SpIssue[]): string[] {
  return issues.filter((i) => i.level === 'block').map((i) => i.text);
}

/* ── the plot ───────────────────────────────────────────────────────────── */

/** Type sizes of the plot, in points on the printed page. Shared with the
 *  renderers so a label takes the room that was kept for it. Nothing on the
 *  plot is smaller than 9 pt. */
export const SP_PLOT_TYPE = {
  /** A performer's name. */
  person: 10.5,
  /** An equipment label, a tag inside a symbol. */
  label: 9,
  /** An input number or a mix code in its box. */
  badge: 9,
  badgeH: 13,
  badgePad: 4,
  badgeGap: 3,
  /** The four direction words and the size note. */
  direction: 9.5,
  /** A character's width as a share of the type size: an estimate for the
   *  system sans-serif fonts, a little wide on purpose. */
  charW: 0.52,
  charWBold: 0.58,
} as const;

/** The width of the drawing, in points, that label places are worked out for
 *  (US Letter and A4 with 0.6 in margins are both close to it). */
export const SP_PLOT_NOMINAL_W = 510;
/** Room kept at the left and right for the two side words. */
export const SP_PLOT_SIDE = 16;
/** The drawing is never taller than this (points), so the plot page keeps
 *  room for the band, the date and the legend. */
export const SP_PLOT_MAX_H = 380;
/** A stage with very few people on it is drawn smaller, so a solo act or a
 *  duo can have its whole packet on one sheet: at most this tall (points)
 *  when the plot holds `SP_PLOT_SMALL_PEOPLE` performers or fewer. Every
 *  renderer applies the same rule (spPdf.ts mirrors these two numbers). */
export const SP_PLOT_SMALL_H = 240;
export const SP_PLOT_SMALL_PEOPLE = 2;

/** A plot that needs room (`SpDocPlot.roomy`: the plot-only packet, or six or
 *  more performers) may grow to this height, in points, when its page has
 *  it: the least a page has left after the header, the key and the notes
 *  (US Letter). A renderer that knows its page may allow more. */
export const SP_PLOT_ROOMY_H = 520;
export const SP_PLOT_ROOMY_PEOPLE = 6;

/** The tallest this plot is drawn, in points. */
export function spPlotMaxH(plot: { items?: readonly { person: boolean }[]; roomy?: boolean }): number {
  if (plot.roomy) return SP_PLOT_ROOMY_H;
  if (!plot.items) return SP_PLOT_MAX_H;
  return plot.items.filter((i) => i.person).length <= SP_PLOT_SMALL_PEOPLE ? SP_PLOT_SMALL_H : SP_PLOT_MAX_H;
}

/** THE KEY's sizes, in points (owner 2026-11-12: the key is part of the
 *  drawing, always). One cell for each kind of symbol on the plot: the
 *  symbol scaled to fit a box `symbolW` × `symbolH` (its own shape kept),
 *  then `gap`, then its name in `textPt` type, wrapped to the cell and never
 *  cut. Cells are `colW` wide and fill rows from the left; a row is as tall
 *  as its tallest cell, and rows are `rowGap` apart. The heading "KEY" is
 *  `headPt` type on a line `headH` high. Every renderer uses these numbers
 *  (spPdf.ts mirrors them). */
export const SP_KEY_CELL = { symbolW: 26, symbolH: 20, textPt: 9, gap: 6, colW: 120, lineH: 11, rowGap: 6, headPt: 9.5, headH: 16 } as const;

/** One key name as lines that fit a cell: broken between words only, and a
 *  word that is too long for the cell keeps a line to itself, whole. */
export function spKeyLines(name: string): string[] {
  const K = SP_KEY_CELL;
  const room = K.colW - K.symbolW - K.gap - 8;
  const lines: string[] = [];
  let line = '';
  for (const word of name.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && spTextW(next, K.textPt) > room) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export type SpKeyLayout = {
  /** The height of the whole key, heading included; 0 when the key is empty. */
  h: number;
  cols: number;
  /** Each cell's top-left corner (from the key's own top-left) and its name in lines. */
  cells: { kind: SpDocKeyItem['kind']; name: string; x: number; y: number; h: number; lines: string[] }[];
};

/** Where each cell of the key goes, for a key `width` points wide. An empty
 *  key takes no room and prints no heading. */
export function spKeyLayout(key: readonly Pick<SpDocKeyItem, 'kind' | 'name'>[], width: number): SpKeyLayout {
  const K = SP_KEY_CELL;
  if (!key.length) return { h: 0, cols: 0, cells: [] };
  const cols = Math.max(1, Math.floor(width / K.colW));
  const cells: SpKeyLayout['cells'] = [];
  let y = K.headH;
  for (let n = 0; n < key.length; n += cols) {
    const row = key.slice(n, n + cols).map((k) => ({ k, lines: spKeyLines(k.name) }));
    const h = Math.max(K.symbolH, ...row.map((c) => c.lines.length * K.lineH));
    row.forEach((c, i) => cells.push({ kind: c.k.kind, name: c.k.name, x: i * K.colW, y, h, lines: c.lines }));
    y += h + K.rowGap;
  }
  return { h: y, cols, cells };
}

export const spTextW = (text: string, size: number, bold = false): number => text.length * size * (bold ? SP_PLOT_TYPE.charWBold : SP_PLOT_TYPE.charW);
export const spBadgeW = (text: string): number => spTextW(text, SP_PLOT_TYPE.badge, true) + SP_PLOT_TYPE.badgePad * 2;

/** A name and its references, as ONE ROW: the name, then the boxes to its
 *  right ("Drums [1–6]"). Sizes in points. `labelAt` in the document is the
 *  top-center of the NAME; the boxes follow it. */
export function spLabelBlock(item: Pick<SpDocPlotItem, 'label' | 'badges' | 'person'>): { w: number; h: number; labelW: number; badgesW: number; gap: number } {
  const T = SP_PLOT_TYPE;
  const fs = item.person ? T.person : T.label;
  const labelW = item.label ? spTextW(item.label, fs, item.person) : 0;
  const badgesW = item.badges.reduce((w, b) => w + spBadgeW(b), 0) + Math.max(0, item.badges.length - 1) * T.badgeGap;
  const gap = labelW && badgesW ? 4 : 0;
  const h = item.badges.length ? T.badgeH + 2 : item.label ? fs + 3 : 0;
  return { w: labelW + gap + badgesW, h, labelW, badgesW, gap };
}

/** The same row as `spLabelBlock`, with every word as wide as the PDF prints
 *  it (Helvetica's own widths, never less than the estimate): what spPdf.ts
 *  draws. Names on a shaped stage are placed with it. */
export function spLabelBlockPrinted(item: Pick<SpDocPlotItem, 'label' | 'badges' | 'person'>): { w: number; h: number; labelW: number; badgesW: number; gap: number } {
  const T = SP_PLOT_TYPE;
  const fs = item.person ? T.person : T.label;
  const wide = (text: string, size: number, bold: boolean): number => Math.max(spTextW(text, size, bold), spPdfWidth(spPdfEncode(text), size, bold));
  const labelW = item.label ? wide(item.label, fs, item.person) : 0;
  const badgesW = item.badges.reduce((w, b) => w + wide(b, T.badge, true) + T.badgePad * 2, 0) + Math.max(0, item.badges.length - 1) * T.badgeGap;
  const gap = labelW && badgesW ? 4 : 0;
  const h = item.badges.length ? T.badgeH + 2 : item.label ? fs + 3 : 0;
  return { w: labelW + gap + badgesW, h, labelW, badgesW, gap };
}

/** The size a SHAPED stage's names are placed for: the narrowest page (A4:
 *  595 pt less two 43.2 pt margins) at the drawing's usual height (a roomy
 *  plot is only ever drawn larger), times `give`. The PDF never draws a
 *  shaped stage smaller than this (spPdf.ts `SP_PDF_PLOT.shapedW` and
 *  `shapedGive` mirror it): where a rectangle's drawing would give way to
 *  keep its legend on the page, a shaped stage's legend runs on instead.
 *  (A smaller `give` keeps those pages but prints more equipment by its
 *  number alone.) */
export const SP_PLOT_SHAPED_K = { width: 508, give: 1 } as const;

/** Points per meter for a plot drawn `width` points wide. With the plot's
 *  `items` it applies the small-stage rule (`spPlotMaxH`). */
export function spPlotScale(plot: Pick<SpDocPlot, 'widthM' | 'depthM' | 'marginM'> & { items?: readonly { person: boolean }[]; roomy?: boolean }, width: number, maxH: number = spPlotMaxH(plot)): number {
  return Math.min((width - SP_PLOT_SIDE * 2) / (plot.widthM + plot.marginM * 2), maxH / (plot.depthM + plot.marginM * 2));
}

type Box = { x0: number; y0: number; x1: number; y1: number };

/** A point of a shape, to start its box from. */
const shapeAt = (s: SpShape): { x: number; y: number } => (s.t === 'circle' ? { x: s.cx, y: s.cy } : s.t === 'line' ? { x: s.x1, y: s.y1 } : s.t === 'poly' ? { x: s.pts[0] ?? 0, y: s.pts[1] ?? 0 } : { x: s.x, y: s.y });

function shapesBox(shapes: SpShape[], at: { x: number; y: number }): Box {
  const b: Box = { x0: at.x, y0: at.y, x1: at.x, y1: at.y };
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
  return b;
}
const overlap = (a: Box, b: Box): number => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));

/** "1", "2", "3", "5", "6" → "1–3", "5–6": a stereo pair (and any run of
 *  channels on one symbol) is printed as a range. Band-rig numbers keep
 *  their B ("B3–B4"); a channel with no number yet is "?" once. */
export function spBadgeRuns(badges: string[]): string[] {
  const groups = new Map<string, number[]>();
  const other: string[] = [];
  for (const b of badges) {
    const m = /^(B?)(\d+)$/.exec(b);
    if (!m) {
      if (!other.includes(b)) other.push(b);
      continue;
    }
    const list = groups.get(m[1]) ?? [];
    if (!list.includes(Number(m[2]))) list.push(Number(m[2]));
    groups.set(m[1], list);
  }
  const out: string[] = [];
  for (const [prefix, list] of groups) {
    list.sort((a, b) => a - b);
    let from = list[0];
    let to = list[0];
    const flush = () => out.push(from === to ? `${prefix}${from}` : `${prefix}${from}${DASH}${prefix}${to}`);
    for (const n of list.slice(1)) {
      if (n === to + 1) to = n;
      else {
        flush();
        from = n;
        to = n;
      }
    }
    flush();
  }
  return [...out, ...other];
}

/** The name printed beside an object. An object the band left with no name
 *  prints NO name: the editor's drawing and the packet agree. (A monitor
 *  device with no name of its own on the symbol takes the device's name.) */
function objectLabel(p: SpProject, o: SpObject): string {
  let label = o.label.trim();
  if (o.kind === 'performer') label = spPerformer(p, o.performerId)?.name.trim() || label;
  // a stage box prints its own name and size ("SB2 16/8", round 3)
  else if (spBox(p, o.boxId)) label = spBoxPlotLabel(spBox(p, o.boxId) as NonNullable<ReturnType<typeof spBox>>);
  else if (!label && o.deviceId) {
    const d = p.devices.find((x) => x.id === o.deviceId);
    label = d ? d.label.trim() || SP_DEVICE_WORD[d.type] : '';
  }
  // a choir prints its size after its name (round 3, owner 2026-11-13:
  // "build the remaining held items too"): "Choir (24 singers, 3 rows)"
  const size = [o.kind === 'choir' ? spChoirCountWords(spChoirOf(o)) : '', o.sizeNote.trim()].filter(Boolean).join('; ');
  return label && size ? `${label} (${size})` : label || size;
}

/** The step of the printed grid, in meters; 0 = no grid. A grid is printed
 *  only when the stage size is known (a grid on a drawing that is not to
 *  scale would suggest distances), and never finer than 30 squares across. */
function printedGrid(p: SpProject, widthM: number, toScale: boolean): { stepM: number; words: string } {
  if (!p.stage.grid || !toScale) return { stepM: 0, words: '' };
  const unit = p.stage.unit === 'ft' ? 0.3048 : 0.25;
  let n = 1;
  while (widthM / (unit * n) > 30) n *= 2;
  return { stepM: unit * n, words: p.stage.unit === 'ft' ? `${n} ft` : `${num(0.25 * n)} m` };
}

const TAG_WORDS: Record<string, string> = { DI: 'DI = direct box', IEM: 'IEM = in-ear monitor', AC: 'AC = power' };

const inputName = (p: SpProject, id: SpId): string => {
  const i = p.inputs.find((x) => x.id === id);
  return i ? `${i.label} (${spBadge(p, id)})` : '';
};
const joinAnd = (list: string[]): string => (list.length <= 1 ? list.join('') : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`);

/** The name of a plot item that is printed with its reference alone (no room
 *  for the name beside the symbol): the text view still says the name. */
const PLOT_NAMES = new WeakMap<object, string>();
/** The name of a plot item, printed or not. */
export const spPlotItemName = (item: SpDocPlotItem): string => item.label || PLOT_NAMES.get(item) || '';

/** The stage plot as data: every stage object, placed, with the name printed
 *  beside it and its references (input channels, monitor mixes). */
export function spPlotDoc(p: SpProject, how: boolean | { brief?: boolean; roomy?: boolean } = false): SpDocPlot {
  const brief = typeof how === 'boolean' ? how : !!how.brief;
  // a drawing that needs room: the plot alone, or a stage with many people
  const roomy = (typeof how === 'object' && how.roomy) || p.performers.length >= SP_PLOT_ROOMY_PEOPLE;
  const st = spStageMeters(p);
  // THE SHAPE (2026-11-13): the plot's own space is everything the stage
  // floor covers (a thrust's tongue, the wings), with 0,0 at its top left.
  // For a rectangle that is the stage itself, as always.
  const fb = spShapeBounds(p.stage);
  const ox = -fb.x0 * st.width;
  const oy = -fb.y0 * st.depth;
  const plotW = (fb.x1 - fb.x0) * st.width;
  const plotD = (fb.y1 - fb.y0) * st.depth;
  const shiftShape = (s: SpShape): SpShape => {
    if (!ox && !oy) return s;
    if (s.t === 'circle') return { ...s, cx: s.cx + ox, cy: s.cy + oy };
    if (s.t === 'line') return { ...s, x1: s.x1 + ox, y1: s.y1 + oy, x2: s.x2 + ox, y2: s.y2 + oy };
    if (s.t === 'poly') return { ...s, pts: s.pts.map((v, k) => v + (k % 2 ? oy : ox)) };
    return { ...s, x: s.x + ox, y: s.y + oy };
  };

  // which symbol each input is shown at: the same answer "Locate on stage" gives
  const inputsAt = new Map<SpId, string[]>();
  for (const i of spAllInputsInOrder(p)) {
    const o = spObjectOfInput(p, i.id);
    if (!o) continue;
    inputsAt.set(o.id, [...(inputsAt.get(o.id) ?? []), spBadge(p, i.id)]);
  }

  // `parts` = the box of each shape of the symbol: a name may stand between
  // the drums of a kit, never on one of them
  type Draft = SpDocPlotItem & { box: Box; parts: Box[]; sized: boolean; onStage: boolean; placed: boolean; full: string; who: SpId | null };
  /** The performer an object belongs to: their figure, or what they play,
   *  sing into or hear. */
  const whoOf = (o: SpObject): SpId | null => {
    if (o.performerId) return o.performerId;
    const src = o.sourceId ?? (o.inputId ? (p.inputs.find((i) => i.id === o.inputId)?.sourceId ?? null) : null);
    if (src) return p.sources.find((x) => x.id === src)?.performerId ?? null;
    if (o.deviceId) return p.devices.find((x) => x.id === o.deviceId)?.performerId ?? null;
    return null;
  };
  // sized kinds (risers, labeled boxes) first: they are drawn under the rest
  // then the equipment, then the PEOPLE, so a performer's circle is drawn over
  // the stool of the kit they sit at
  const drawRank = (o: SpObject): number => (spIsSized(o.kind) ? 0 : o.kind === 'performer' ? 2 : 1);
  const objects = [...p.objects].sort((a, b) => drawRank(a) - drawRank(b));
  const drafts: Draft[] = objects.map((o) => {
    const b = spObjectBoxM(p, o);
    const at = { x: b.cx + ox, y: b.cy + oy };
    const shapes = spPlacedShapes(p, o).map(shiftShape);
    const badges = spBadgeRuns(inputsAt.get(o.id) ?? []);
    const mixCodes: string[] = [];
    if (o.performerId) for (const m of spMixesOf(p, o.performerId)) mixCodes.push(m.code);
    if (o.deviceId) {
      const d = p.devices.find((x) => x.id === o.deviceId);
      const m = d ? spMix(p, d.mixId) : undefined;
      if (m) mixCodes.push(m.code);
    }
    for (const c of mixCodes) if (c && !badges.includes(c)) badges.push(c);
    return { id: o.id, shapes, tag: spSymbol(o.kind).tag, at, label: objectLabel(p, o), labelAt: at, badges, person: o.kind === 'performer', box: shapesBox(shapes, at), parts: shapes.map((s) => shapesBox([s], shapeAt(s))), sized: spIsSized(o.kind), onStage: spOnStage(o, p.stage), placed: true, full: '', who: whoOf(o) };
  });

  // WHERE EACH NAME GOES (review 2: a name on the wrong object sends a
  // channel to the wrong microphone). Worked out at the printed size, so
  // every renderer puts the name in the same place. HARD RULES, never traded
  // for a nearer place:
  //   1. a name never lies over another object's symbol;
  //   2. a name never lies over another name;
  //   3. the name of an object on the stage is wholly inside the stage
  //      outline, 4 pt clear of it;
  //   4. a name never sits on a platform's dashed edge: it is wholly inside
  //      the platform or wholly outside it;
  //   5. a name placed beside its symbol is nearer to its own symbol than to
  //      any other, edge to edge, by at least NEAR points.
  // When no place beside the symbol keeps all five, the name goes to the
  // nearest place farther out that keeps rules 1 to 4, and a thin LEADER
  // line ties it to its symbol, so rule 5 is not needed to read it.
  const PAD = 1.5; // points kept clear around a name
  const EDGE = 4; // points between a name and the stage outline
  const NEAR = 0.5; // points by which a name is nearer to its own symbol than to any other
  const NEAR_RATIO = 1.6; // how many times farther any other symbol must be
  const PERSON_CLEAR = 6; // points kept clear around a performer's name (round 2)
  let symbolOver = 0;
  for (const d of drafts) symbolOver = Math.max(symbolOver, -d.box.x0, d.box.x1 - plotW, -d.box.y0, d.box.y1 - plotD);
  const symbolMargin = Math.max(0.6, Math.round((symbolOver + 0.15) * 100) / 100);
  let marginM = symbolMargin;
  const stageBox: Box = { x0: 0, y0: 0, x1: plotW, y1: plotD };
  const within = (a: Box, b: Box): boolean => a.x0 >= b.x0 - 1e-9 && a.x1 <= b.x1 + 1e-9 && a.y0 >= b.y0 - 1e-9 && a.y1 <= b.y1 + 1e-9;
  const grow = (a: Box, by: number): Box => ({ x0: a.x0 - by, y0: a.y0 - by, x1: a.x1 + by, y1: a.y1 + by });
  /** How far apart two boxes are (0 when they touch or overlap). */
  const apart = (a: Box, b: Box): number => Math.hypot(Math.max(0, a.x0 - b.x1, b.x0 - a.x1), Math.max(0, a.y0 - b.y1, b.y0 - a.y1));
  /** Does a box lie over any part of a symbol? A thin line of a symbol
   *  counts too (its box is given a hair of width). */
  const lies = (box: Box, o: Draft): boolean => {
    if (overlap(box, o.box) <= 0 && !(o.box.x0 === o.box.x1 || o.box.y0 === o.box.y1)) return false;
    for (const part of o.parts) if (overlap(box, grow(part, 1e-4)) > 0) return true;
    return false;
  };
  /** How far a box is from the nearest part of a symbol. */
  const away = (box: Box, o: Draft): number => {
    let least = Infinity;
    for (const part of o.parts) least = Math.min(least, apart(box, part));
    return least;
  };
  /** A name's box stands over a performer's head, where every name on the
   *  plot sits: above it, sharing some of its width, closer than two lines
   *  of a name (the gap is measured from the box's foot to the head). */
  const overHead = (box: Box, o: Draft): boolean => box.y1 <= o.box.y0 + 1e-9 && o.box.y0 - box.y1 < 2 * (box.y1 - box.y0) && Math.min(box.x1, o.box.x1) - Math.max(box.x0, o.box.x0) > 0;
  const solid = drafts.filter((d) => !d.sized);
  const platforms = drafts.filter((d) => d.sized);
  // A SHAPED STAGE (thrust, round, wings; fix 2026-11-13): its drawing is
  // taller than a rectangle's, so the PDF often drew it SMALLER than the
  // size names were placed for (it gave way by up to 15% to keep its legend
  // on the page, and a roomy plot is drawn only as tall as the page has),
  // while the words keep their size: names then ran into each other and into
  // symbols. Its names are placed for the smallest drawing any renderer
  // makes (`SP_PLOT_SHAPED_K`), each word as wide as the PDF prints it. Drawn
  // larger, a name's box only shrinks toward its own anchor, so a place that
  // was clear stays clear. A rectangle keeps its rule (its layouts are pinned).
  const shaped = spIsShaped(p.stage);
  // …and a shaped stage's own lines (its outline, the thrust's walls, the
  // wings' dashed edges) are not inside a plain box, so a name keeps off them
  // too: "Keys" ended on the wing wall with its "9–10" in the wing, and
  // "Wedge 2" broke the circle (review of this fix). A leader is a line as
  // well: a later name never sits on it, and it never runs through a name.
  type Seg = [number, number, number, number];
  const lines: Seg[] = [];
  let ring: { cx: number; cy: number; r: number } | null = null;
  if (shaped) {
    const mx = (f: number): number => f * st.width + ox;
    const my = (f: number): number => f * st.depth + oy;
    const ol = spShapeOutline(p.stage);
    if (ol.t === 'circle') ring = { cx: mx(ol.cx), cy: my(ol.cy), r: ol.r * st.width };
    else for (let n = 0; n + 1 < ol.pts.length; n += 2) lines.push([mx(ol.pts[n]), my(ol.pts[n + 1]), mx(ol.pts[(n + 2) % ol.pts.length]), my(ol.pts[(n + 3) % ol.pts.length])]);
    for (const w of spWingRects(p.stage)) {
      const r = w.r;
      lines.push([mx(r.x0), my(r.y0), mx(r.x1), my(r.y0)], [mx(r.x1), my(r.y0), mx(r.x1), my(r.y1)], [mx(r.x1), my(r.y1), mx(r.x0), my(r.y1)], [mx(r.x0), my(r.y1), mx(r.x0), my(r.y0)]);
    }
  }
  /** Does a line from (x1, y1) to (x2, y2) pass through a box? */
  const cuts = (b: Box, [x1, y1, x2, y2]: Seg): boolean => {
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
  };
  /** Does a box lie across one of the shape's own lines? */
  const onLine = (b: Box): boolean => {
    if (ring) {
      const near = Math.hypot(Math.max(0, b.x0 - ring.cx, ring.cx - b.x1), Math.max(0, b.y0 - ring.cy, ring.cy - b.y1));
      const far = Math.hypot(Math.max(Math.abs(b.x0 - ring.cx), Math.abs(b.x1 - ring.cx)), Math.max(Math.abs(b.y0 - ring.cy), Math.abs(b.y1 - ring.cy)));
      if (near <= ring.r && ring.r <= far) return true;
    }
    return lines.some((s) => cuts(b, s));
  };
  /** Is a point on the shape's floor (inside its outline)? An on-stage
   *  object's name stays there, not in a corner beside a thrust. */
  const outlinePts: number[] = [];
  if (shaped && !ring) {
    const ol = spShapeOutline(p.stage);
    if (ol.t === 'poly') ol.pts.forEach((v, n) => outlinePts.push(n % 2 ? v * st.depth + oy : v * st.width + ox));
  }
  const wingBoxes: Box[] = shaped ? spWingRects(p.stage).map((w) => ({ x0: w.r.x0 * st.width + ox, y0: w.r.y0 * st.depth + oy, x1: w.r.x1 * st.width + ox, y1: w.r.y1 * st.depth + oy })) : [];
  const onFloor = (x: number, y: number): boolean => {
    if (ring) return Math.hypot(x - ring.cx, y - ring.cy) <= ring.r;
    // (a wing is floor too: a name may stand wholly in it, never across its wall)
    if (wingBoxes.some((w) => x >= w.x0 && x <= w.x1 && y >= w.y0 && y <= w.y1)) return true;
    let inPoly = false;
    for (let a = 0, b = outlinePts.length - 2; a < outlinePts.length; b = a, a += 2) {
      const [xa, ya, xb, yb] = [outlinePts[a], outlinePts[a + 1], outlinePts[b], outlinePts[b + 1]];
      if (ya > y !== yb > y && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) inPoly = !inPoly;
    }
    return inPoly;
  };
  for (let pass = 0; pass < 4; pass += 1) {
    const k = shaped
      ? spPlotScale({ widthM: plotW, depthM: plotD, marginM, items: drafts }, SP_PLOT_SHAPED_K.width) * SP_PLOT_SHAPED_K.give
      : spPlotScale({ widthM: plotW, depthM: plotD, marginM, items: drafts, roomy }, SP_PLOT_NOMINAL_W);
    const gap = 3 / k;
    const pad = PAD / k;
    const taken: Box[] = [];
    /** The performers' names among them. */
    const takenPeople: Box[] = [];
    /** The leader lines drawn so far (a shaped stage keeps names off them). */
    const leads: Seg[] = [];
    const page: Box = { x0: -marginM, y0: -marginM, x1: plotW + marginM, y1: plotD + marginM };
    const inside = grow(stageBox, -EDGE / k);
    for (const d of drafts) {
      delete d.leader;
      d.placed = true;
      if (d.full) d.label = d.full;
      d.full = d.label;
    }
    /** Rules 1, 3, 4 (and 5 when `beside`): what does not depend on the
     *  names already placed. */
    const fits = (d: Draft, box: Box, beside: boolean): boolean => {
      if (!within(box, d.onStage ? inside : page)) return false;
      const clear = grow(box, pad);
      if (shaped && (onLine(clear) || (d.onStage && !onFloor((box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2)))) return false;
      for (const o of solid) if (o !== d && lies(clear, o)) return false;
      if (!d.sized && lies(clear, d)) return false;
      for (const r of platforms) {
        // (a platform's own name never sits on its own dashed edge either:
        // owner 2026-11-13, build the remaining held items)
        if (r === d && !shaped) continue;
        if (overlap(clear, r.box) > 0 && !within(clear, r.box)) return false;
      }
      if (beside && !d.sized) {
        // nearer to its own symbol than to any other, edge to edge, and by
        // a clear step (NEAR points), so the eye cannot give it to a neighbor.
        // Equipment's numbers keep CLEARLY away from ANOTHER performer (not
        // the one who plays or uses it): that performer is at least
        // NEAR_RATIO times as far ("3–5", the timbales' channels, stood
        // midway between the timbales and the conga player and read as his:
        // bug test, 2026-11-13).
        // A PERFORMER's name keeps the same clear distance from every other
        // performer: "Nelson (M5)" stood just nearer Nelson than Chino, above
        // Chino's head where every other name on the plot sits, and read as
        // Chino's (bug test round 2, R2-SP2-03).
        const own = away(box, d);
        for (const o of solid) if (o !== d && away(box, o) < (o.person && !d.person && o.who !== d.who ? own * NEAR_RATIO : own) + NEAR / k) return false;
        // …and never over ANOTHER performer's head, where every name on the
        // plot is read as that head's (R2-SP2-03)
        if (d.person && solid.some((o) => o !== d && o.person && overHead(box, o))) return false;
      }
      return true;
    };
    /** Rule 2: clear of every name already placed. */
    const free = (box: Box): boolean => {
      const clear = grow(box, pad);
      for (const x of taken) if (overlap(clear, x) > 0) return false;
      // a performer's name keeps a clear step (PERSON_CLEAR points) from any
      // other name or number, so a channel number is never read as part of it
      const wide = grow(box, PERSON_CLEAR / k);
      for (const x of takenPeople) if (overlap(wide, x) > 0) return false;
      // (a shaped stage: never on a leader line already drawn)
      if (shaped) for (const s of leads) if (cuts(clear, s)) return false;
      return true;
    };

    /** The places beside a symbol, best first: each is the row's box. */
    const beside = (d: Draft, w: number, h: number, deep = false): Box[] => {
      const b = d.box;
      const cx = d.at.x;
      const cy = d.at.y;
      let spots: [number, number][];
      if (d.sized) {
        // a platform carries its name inside its box, in a corner; if the box
        // is too small for it, directly under the box
        spots = [
          [b.x0 + gap + pad, b.y0 + gap + pad],
          [b.x1 - gap - pad - w, b.y0 + gap + pad],
          [b.x0 + gap + pad, b.y1 - gap - pad - h],
          [b.x1 - gap - pad - w, b.y1 - gap - pad - h],
          [cx - w / 2, b.y0 + gap + pad],
          [cx - w / 2, b.y1 - gap - pad - h],
          [cx - w / 2, b.y1 + gap + pad],
          [b.x0, b.y1 + gap + pad],
          [b.x1 - w, b.y1 + gap + pad],
          [cx - w / 2, b.y0 - gap - pad - h],
        ];
        // (owner 2026-11-13: build the remaining held items) …and when none
        // of its corners has room (what stands on it fills them), every other
        // place INSIDE it, along its upstage edge first, before any place
        // outside it: "Drum riser" stood under its riser, level with the
        // guitar amp. Only reached when no corner fits (jobFor).
        if (deep) {
          const ins: [number, number][] = [];
          const sx = 3 / k;
          // (its own dashed edge needs only the usual air: `pad`)
          const x0 = b.x0 + pad;
          const x1 = b.x1 - pad - w;
          const y0 = b.y0 + pad;
          const y1 = b.y1 - pad - h;
          for (let y = y0; y <= y1 + 1e-9; y += sx / 2) for (let x = x0; x <= x1 + 1e-9; x += sx / 2) ins.push([x, y]);
          spots.splice(6, 0, ...ins);
        }
      } else {
        const g = gap + pad;
        spots = [
          [cx - w / 2, b.y1 + g],
          [cx - w / 2, b.y0 - g - h],
          [b.x1 + g, cy - h / 2],
          [b.x0 - g - w, cy - h / 2],
          [b.x1 + g, b.y1 - h],
          [b.x0 - g - w, b.y1 - h],
          [b.x1 + g, b.y0],
          [b.x0 - g - w, b.y0],
          [cx, b.y1 + g],
          [cx - w, b.y1 + g],
          [cx, b.y0 - g - h],
          [cx - w, b.y0 - g - h],
          [b.x1 + g, b.y1 + g],
          [b.x0 - g - w, b.y1 + g],
          [b.x1 + g, b.y0 - g - h],
          [b.x0 - g - w, b.y0 - g - h],
        ];
        // …then every other place that still touches the symbol: slid along
        // its lower and upper edge, and up and down its two sides, nearest
        // the middle first
        const slid: [number, number][] = [];
        const step = 4 / k;
        for (let x = b.x0 - w + step; x <= b.x1 - step; x += step) slid.push([x, b.y1 + g], [x, b.y0 - g - h]);
        for (let y = b.y0 - h + step / 2; y <= b.y1 - step / 2; y += step / 2) slid.push([b.x1 + g, y], [b.x0 - g - w, y]);
        const off = (s: [number, number]): number => Math.hypot(s[0] + w / 2 - cx, s[1] + h / 2 - cy);
        slid.sort((m, n) => off(m) - off(n));
        spots.push(...slid);
      }
      return spots.map((s) => ({ x0: s[0], y0: s[1], x1: s[0] + w, y1: s[1] + h }));
    };

    type Job = { d: Draft; w: number; h: number; labelW: number; all: Box[]; ok: Box[] };
    const jobFor = (d: Draft): Job => {
      const size = shaped ? spLabelBlockPrinted(d) : spLabelBlock(d);
      const w = size.w / k;
      const h = size.h / k;
      const all = beside(d, w, h);
      const ok = all.filter((box) => fits(d, box, true));
      // a platform's name sits ON its platform (owner 2026-11-13: build the
      // remaining held items): when no corner has room, any place inside it;
      // a place outside it only when no other symbol is within NEXT_TO (it
      // then reads as the platform's, never as a neighbor's). With neither,
      // its name is not printed on the plot: the key names the platform, and
      // the legend says so (see `omit` below).
      if (d.sized && !ok.some((box) => within(box, d.box))) {
        const deep = beside(d, w, h, true);
        const NEXT_TO = 12 / k;
        const lone = (box: Box): boolean => within(box, d.box) || solid.every((o) => within(o.box, d.box) || away(box, o) >= NEXT_TO);
        return { d, w, h, labelW: size.labelW / k, all: deep, ok: deep.filter((box) => fits(d, box, true) && lone(box)) };
      }
      return { d, w, h, labelW: size.labelW / k, all, ok };
    };
    const jobs: Job[] = [];
    for (const d of drafts) {
      if (!spLabelBlock(d).h) {
        d.labelAt = { x: d.at.x, y: d.box.y1 + gap };
        continue;
      }
      jobs.push(jobFor(d));
    }
    /** A piece of equipment that has a number or a mix code can be printed
     *  with that reference alone: the key says what the symbol is, and the
     *  input list or the monitor plan names it. */
    const canShorten = (d: Draft): boolean => !d.person && !d.sized && !!d.label && d.badges.length > 0;
    /** Each name's box and its job, as placed (for moving a name off a leader). */
    const placedAt = new Map<Draft, { j: Job; box: Box }>();
    const put = (j: Job, box: Box): void => {
      taken.push(box);
      if (j.d.person) takenPeople.push(box);
      j.d.labelAt = { x: box.x0 + j.labelW / 2, y: box.y0 };
      placedAt.set(j.d, { j, box });
    };
    /** Move every name that lies across `legs` (a new leader for `d`, whose
     *  name will take `box`) to another place beside its own symbol that
     *  keeps every rule, is clear of `box` and lies on no leader. All or
     *  nothing: false (and nothing moved) when one of them has no such place.
     *  (owner 2026-11-13: build the remaining held items) */
    const makeRoom = (d: Draft, box: Box, legs: Seg[]): boolean => {
      const inWay = [...placedAt.entries()].filter(([o, v]) => o !== d && legs.some((s) => cuts(grow(v.box, pad), s)));
      if (!inWay.length || inWay.some(([o]) => !!o.leader || !o.placed)) return false;
      const unput = (o: Draft): void => {
        const v = placedAt.get(o);
        if (!v) return;
        const a = taken.indexOf(v.box);
        if (a >= 0) taken.splice(a, 1);
        const b = takenPeople.indexOf(v.box);
        if (b >= 0) takenPeople.splice(b, 1);
      };
      const moved: [Draft, { j: Job; box: Box }][] = [];
      const lines = [...leads, ...legs];
      for (const [o, v] of inWay) {
        unput(o);
        const to = v.j.all.find((b) => fits(o, b, true) && free(b) && overlap(grow(b, pad), box) <= 0 && !lines.some((s) => cuts(grow(b, pad), s)));
        if (!to) {
          put(v.j, v.box);
          for (const [m, was] of moved.reverse()) {
            unput(m);
            put(was.j, was.box);
          }
          return false;
        }
        put(v.j, to);
        moved.push([o, v]);
      }
      return true;
    };
    // Farther out, for a name with no place beside its symbol (it is placed
    // at once, in its turn, so a person's name is still placed before any
    // equipment): the nearest
    // place that lies on nothing, tied to its symbol by a leader line.
    const farOut = (short: Job): void => {
      // (equipment arrives here already shortened to its reference: a number
      // on a short leader reads better than a name on a long one)
      const j = short;
      const { d, w, h } = j;
      const area = d.onStage ? inside : page;
      const stepX = 3 / k;
      const stepY = 2 / k;
      // from the edge of the row that faces the symbol, to the symbol's center
      const leadFrom = (b: Box): { x: number; y: number } => ({ x: Math.max(b.x0, Math.min(b.x1, d.at.x)), y: Math.max(b.y0, Math.min(b.y1, d.at.y)) });
      /** A shaped stage's leader runs through no name and no other symbol,
       *  and its name does not hug another symbol (6 pt of air, unless it is
       *  nearer its own): "8" on a leader stood against Leo's head. */
      const crossesName = (b: Box): boolean => {
        const f = leadFrom(b);
        const s: Seg = [f.x, f.y, d.at.x, d.at.y];
        return taken.some((x) => cuts(grow(x, pad), s));
      };
      const clearLead = (b: Box): boolean => {
        const f = leadFrom(b);
        const s: Seg = [f.x, f.y, d.at.x, d.at.y];
        const own = away(b, d);
        return !solid.some((o) => o !== d && (away(b, o) < Math.min(own, 6 / k) || o.parts.some((part) => cuts(grow(part, pad), s))));
      };
      let best: Box | null = null;
      let bestD = Infinity;
      // (on a shaped stage, a place whose leader crosses a symbol, or whose
      // name hugs one, is kept only when no place has a clear leader; one
      // whose leader runs through a name, only when nothing else is free)
      let fallback: Box | null = null;
      let fallbackD = Infinity;
      let last: Box | null = null;
      let lastD = Infinity;
      // LEADERS NEVER RUN BEHIND A NAME (owner 2026-11-13: build the remaining
      // held items). Where every straight leader would, a leader with one
      // bend (along the row's side, then straight to the symbol) is tried:
      // the 22-symbol plot ran "Electronic drum kit"'s leader behind "Upright
      // bass". Kept only when no straight leader is clear of every name.
      type Bent = { box: Box; from: { x: number; y: number }; via: { x: number; y: number } };
      const bends = (b: Box): Bent[] => {
        const out: Bent[] = [];
        const cy = (b.y0 + b.y1) / 2;
        const cx = (b.x0 + b.x1) / 2;
        const sx = d.at.x < b.x0 ? b.x0 : d.at.x > b.x1 ? b.x1 : null;
        if (sx != null) out.push({ box: b, from: { x: sx, y: cy }, via: { x: d.at.x, y: cy } });
        const sy = d.at.y < b.y0 ? b.y0 : d.at.y > b.y1 ? b.y1 : null;
        if (sy != null) out.push({ box: b, from: { x: cx, y: sy }, via: { x: cx, y: d.at.y } });
        return out;
      };
      const bentSegs = (e: Bent): Seg[] => [[e.from.x, e.from.y, e.via.x, e.via.y], [e.via.x, e.via.y, d.at.x, d.at.y]];
      const bentThroughName = (e: Bent): boolean => bentSegs(e).some((s) => taken.some((x) => cuts(grow(x, pad), s)));
      const bentThroughSymbol = (e: Bent): boolean => bentSegs(e).some((s) => solid.some((o) => o !== d && o.parts.some((part) => cuts(grow(part, pad), s))));
      let bent: Bent | null = null;
      let bentD = Infinity;
      let bentAny: Bent | null = null;
      let bentAnyD = Infinity;
      /** Every free place whose straight leader runs through a name. */
      const crossing: { box: Box; far: number }[] = [];
      for (let y = area.y0; y + h <= area.y1 + 1e-9; y += stepY) {
        for (let x = area.x0; x + w <= area.x1 + 1e-9; x += stepX) {
          const box: Box = { x0: x, y0: y, x1: x + w, y1: y + h };
          const far = away(box, d);
          if (far >= bestD) continue;
          if (!fits(d, box, false) || !free(box)) continue;
          // a performer's name on a leader is not put over another head either (R2-SP2-03)
          if (d.person && solid.some((o) => o !== d && o.person && overHead(box, o))) continue;
          if (shaped && crossesName(box)) {
            if (far < lastD) {
              lastD = far;
              last = box;
            }
            crossing.push({ box, far });
            if (far < bentAnyD) {
              for (const e of bends(box)) {
                if (bentThroughName(e)) continue;
                if (far < bentAnyD) {
                  bentAnyD = far;
                  bentAny = e;
                }
                if (far < bentD && !bentThroughSymbol(e)) {
                  bentD = far;
                  bent = e;
                }
              }
            }
            continue;
          }
          if (shaped && !clearLead(box)) {
            if (far < fallbackD) {
              fallbackD = far;
              fallback = box;
            }
            continue;
          }
          bestD = far;
          best = box;
        }
      }
      const elbow = !best && !fallback ? (bent ?? bentAny) : null;
      if (elbow) {
        d.leader = { from: elbow.from, via: elbow.via, to: { x: d.at.x, y: d.at.y } };
        leads.push(...bentSegs(elbow));
        put(j, elbow.box);
        return;
      }
      // …and where even a bend runs behind a name, the names in its way move
      // to another place beside their own symbols, when each has one that
      // keeps every rule and lies on no leader (the nearest such place wins)
      if (shaped && !best && !fallback) {
        crossing.sort((a, b) => a.far - b.far);
        for (const c of crossing) {
          const f = leadFrom(c.box);
          const routes: { from: { x: number; y: number }; via?: { x: number; y: number }; legs: Seg[] }[] = [{ from: f, legs: [[f.x, f.y, d.at.x, d.at.y]] }, ...bends(c.box).map((e) => ({ from: e.from, via: e.via, legs: bentSegs(e) }))];
          for (const r of routes) {
            if (makeRoom(d, c.box, r.legs)) {
              d.leader = r.via ? { from: r.from, via: r.via, to: { x: d.at.x, y: d.at.y } } : { from: r.from, to: { x: d.at.x, y: d.at.y } };
              leads.push(...r.legs);
              put(j, c.box);
              return;
            }
          }
        }
        // a symbol whose name only says what the key says ("Steel pan") prints
        // no name at all rather than a leader behind another name: the key
        // names it, and the legend says so
        const kind = p.objects.find((o) => o.id === d.id)?.kind;
        const keyName = kind ? (spPlotKey(p.objects).find((e) => e.kind === kind)?.name ?? '').toLowerCase() : '';
        const said = d.label.trim().toLowerCase();
        if (!d.person && !d.badges.length && said && keyName && (keyName === said || keyName.startsWith(`${said} (`))) {
          d.label = '';
          d.labelAt = { x: d.at.x, y: d.box.y1 + gap };
          return;
        }
      }
      best = best ?? fallback ?? last;
      if (best) {
        const from = leadFrom(best);
        d.leader = { from, to: { x: d.at.x, y: d.at.y } };
        leads.push([from.x, from.y, d.at.x, d.at.y]);
        put(j, best);
        return;
      }
      // nowhere at all keeps the rules (a stage with no free room): the
      // least bad place beside the symbol
      d.placed = false;
      let least = Infinity;
      let worst = j.all[0];
      for (const box of j.all) {
        let cost = 3 * (1 - overlap(box, page) / (w * h));
        for (const x of taken) cost += (4 * overlap(box, x)) / (w * h);
        for (const o of solid) if (o !== d && lies(box, o)) cost += 3;
        if (cost < least) {
          least = cost;
          worst = box;
        }
      }
      put(j, worst);
    };
    // THE ORDER: people first (a performer's name is what a reader looks
    // for, and equipment can fall back on its number alone); within people,
    // and then within the rest, the name with the fewest places left goes
    // first, so a name that can stand in many places never takes the one
    // place another has. (Between equals: platforms, then the longest name.)
    const rank = (j: Job): number => (j.d.person ? 0 : j.d.sized ? 1 : 2);
    let waiting = [...jobs];
    // A SHAPED stage sends a name farther out only after every name of its
    // kind (people, or equipment) that still has a place beside its own
    // symbol has taken it: Iván's name, on a leader, took the place beside
    // Carmen, and hers went across the stage (review of this fix).
    const later = new Set<Job>();
    const othersFirst = (j: Job): boolean => waiting.some((o) => o !== j && !later.has(o) && o.d.person === j.d.person);
    while (waiting.length) {
      let pick: Job | null = null;
      let pickLeft: Box[] = [];
      for (const j of waiting) {
        if (later.has(j) && othersFirst(j)) continue;
        const left = j.ok.filter(free);
        j.ok = left;
        // (on a shaped stage a platform's name goes before everyone's: it has
        // only its own platform, a performer's name has the whole stage.
        // owner 2026-11-13: build the remaining held items)
        const tier = (x: Job | null): number => (shaped && x?.d.sized ? -1 : x?.d.person ? 0 : 1);
        const first = tier(j) - tier(pick);
        if (!pick || first < 0 || (first === 0 && (left.length < pickLeft.length || (left.length === pickLeft.length && (rank(j) < rank(pick) || (rank(j) === rank(pick) && j.w > pick.w)))))) {
          pick = j;
          pickLeft = left;
        }
      }
      if (!pick) break;
      waiting = waiting.filter((j) => j !== pick);
      if (pickLeft.length) put(pick, pickLeft[0]);
      else if (pick.d.sized && pick.d.label) {
        // a platform with no room on it and none alone beside it: no name on
        // the plot (owner 2026-11-13: build the remaining held items). It is
        // never printed next to another object; the key names it.
        pick.d.label = '';
        pick.d.labelAt = { x: pick.d.at.x, y: pick.d.box.y1 + gap };
      } else if (canShorten(pick.d)) {
        // no room for the name beside its symbol: the reference alone, which
        // is a few characters wide and nearly always has a place there
        pick.d.label = '';
        waiting.push(jobFor(pick.d));
      } else if (shaped && !later.has(pick) && othersFirst(pick)) {
        later.add(pick);
        waiting.push(pick);
      } else farOut(pick);
    }
    // NO NAME ON A LEADER (owner 2026-11-13: build the remaining held items).
    // A name placed beside its symbol before a later name went far out can
    // lie across that name's leader ("Hammond organ" on the steel pan's, on
    // the 22-symbol plot): it moves to another place beside its own symbol
    // that keeps every rule and lies on no leader. (A shaped stage only.)
    if (shaped) {
      const legsOf = (l: NonNullable<Draft['leader']>): Seg[] => (l.via ? [[l.from.x, l.from.y, l.via.x, l.via.y], [l.via.x, l.via.y, l.to.x, l.to.y]] : [[l.from.x, l.from.y, l.to.x, l.to.y]]);
      const allLegs = (): Seg[] => drafts.flatMap((o) => (o.leader ? legsOf(o.leader) : []));
      for (const d of drafts) {
        const at = placedAt.get(d);
        if (!at || d.leader || !d.placed) continue;
        const onLead = (b: Box): boolean => drafts.some((o) => o !== d && o.leader && legsOf(o.leader).some((s) => cuts(grow(b, pad), s)));
        if (!onLead(at.box)) continue;
        // (its own box is taken out while the other places are tried)
        const was = taken.indexOf(at.box);
        if (was >= 0) taken.splice(was, 1);
        const wasP = takenPeople.indexOf(at.box);
        if (wasP >= 0) takenPeople.splice(wasP, 1);
        const legs = allLegs();
        const to = at.j.all.find((b) => fits(d, b, true) && free(b) && !legs.some((s) => cuts(grow(b, pad), s)));
        put(at.j, to ?? at.box);
      }
    }
    // A RECTANGLE'S NAMES AS THEY PRINT (owner 2026-11-13: build the remaining
    // held items). A rectangle's names are placed with the estimate at the
    // usual width; A4 draws the plot a little smaller, with Helvetica's own
    // widths, and there "Nelson (M5)" touched the bass amp by about 1 pt. Each
    // name is checked at the smallest size a rectangle is drawn without giving
    // way (A4), as wide as it prints. One that touches a symbol or another
    // name moves to the first place beside its symbol that keeps every rule
    // at that size. A name that touches nothing is not moved, so those plots
    // print exactly as before.
    if (!shaped) {
      const kC = Math.min(k, spPlotScale({ widthM: plotW, depthM: plotD, marginM, items: drafts, roomy }, SP_PLOT_SHAPED_K.width));
      const printed = (d: Draft): Box | null => {
        const s = spLabelBlockPrinted(d);
        if (!s.h) return null;
        const x0 = d.labelAt.x - s.labelW / 2 / kC;
        return { x0, y0: d.labelAt.y, x1: x0 + s.w / kC, y1: d.labelAt.y + s.h / kC };
      };
      const hair = 0.3 / kC;
      const touches = (d: Draft, box: Box, others: Box[]): boolean => {
        const g = grow(box, hair);
        if (!d.sized && lies(g, d)) return true;
        for (const o of solid) if (o !== d && lies(g, o)) return true;
        return others.some((x) => overlap(g, x) > 0);
      };
      for (const d of drafts) {
        if (!d.placed) continue;
        const mine = printed(d);
        if (!mine) continue;
        const others = drafts.filter((o) => o !== d).map(printed).filter((b): b is Box => !!b);
        if (!touches(d, mine, others)) continue;
        const s = spLabelBlockPrinted(d);
        const clear = (box: Box, near: boolean): boolean => fits(d, box, near) && !touches(d, box, others) && others.every((x) => overlap(grow(box, pad), x) <= 0);
        // beside its symbol (a name with no leader); else the nearest small
        // nudge of where it is (up to 4 pt), its leader following it
        let spot = d.leader ? undefined : beside(d, s.w / kC, s.h / kC).find((box) => clear(box, true));
        if (!spot) {
          const nudges: Box[] = [];
          for (let dy = -4; dy <= 4; dy += 0.5) for (let dx = -4; dx <= 4; dx += 0.5) nudges.push({ x0: mine.x0 + dx / kC, y0: mine.y0 + dy / kC, x1: mine.x1 + dx / kC, y1: mine.y1 + dy / kC });
          nudges.sort((a, b) => Math.hypot(a.x0 - mine.x0, a.y0 - mine.y0) - Math.hypot(b.x0 - mine.x0, b.y0 - mine.y0));
          spot = nudges.find((box) => clear(box, !d.leader));
        }
        if (!spot) continue;
        d.labelAt = { x: spot.x0 + s.labelW / 2 / kC, y: spot.y0 };
        if (d.leader) {
          // (from the row as it is placed: the estimate at the usual size)
          const e = spLabelBlock(d);
          const ex0 = d.labelAt.x - e.labelW / 2 / k;
          d.leader = { ...d.leader, from: { x: Math.max(ex0, Math.min(ex0 + e.w / k, d.at.x)), y: Math.max(d.labelAt.y, Math.min(d.labelAt.y + e.h / k, d.at.y)) } };
        }
        taken.push(spot);
      }
    }
    // room around the stage, so anything off the stage (and its name) shows
    let over = 0;
    for (const x of taken) over = Math.max(over, -x.x0, x.x1 - plotW, -x.y0, x.y1 - plotD);
    const need = Math.min(symbolMargin + 0.6, Math.max(symbolMargin, Math.round((over + 0.05) * 100) / 100));
    if (need <= marginM + 0.01) break;
    marginM = need;
  }

  const items: SpDocPlotItem[] = drafts.map((d) => {
    const item: SpDocPlotItem = { id: d.id, shapes: d.shapes, tag: d.tag, at: d.at, label: d.label, labelAt: d.labelAt, badges: d.badges, person: d.person };
    if (d.leader) item.leader = d.leader;
    if (!d.label && d.full) PLOT_NAMES.set(item, d.full);
    return item;
  });
  const grid = printedGrid(p, st.width, st.toScale);
  const unit = p.stage.unit;
  const shape = spShapeOf(p.stage);
  const wings = spHasWings(p.stage);
  let sizeNote = st.toScale ? `${num(p.stage.width ?? 0)} ${unit} × ${num(p.stage.depth ?? 0)} ${unit} (${p.stage.dims})` : 'Not to scale';
  // the round's way of reading the drawing is printed with the size, so it is
  // on the plot's own page (expert review 2026-11-13)
  // (the round's sides may be clock positions or numbers: owner 2026-11-13, build the remaining held items)
  const sides = spRoundSides(p.stage);
  const atBottom = sides === 'clock' ? `12 o’clock (the ${spRoundRef(p.stage)} side) is at the bottom` : sides === 'numbered' ? `side 1 (the ${spRoundRef(p.stage)} side) is at the bottom` : `the ${spRoundRef(p.stage)} side is at the bottom`;
  if (shape === 'round') sizeNote = `${st.toScale ? (spIsCircle(p.stage) ? `${num(p.stage.width ?? 0)} ${unit} across (${p.stage.dims})` : sizeNote) : 'Not to scale'}, in the round: ${atBottom}`;
  else if (shape === 'thrust' && !st.toScale) sizeNote = `Not to scale; a thrust reaches into the audience at the front${wings ? ', with wings at each side' : ''}`;
  else if (st.toScale && shape === 'thrust') sizeNote += spThrustFrac(p.stage).given ? `; thrust ${num(p.stage.thrustWidth ?? 0)} ${unit} × ${num(p.stage.thrustDepth ?? 0)} ${unit}` : '; thrust drawn at a usual size';
  // wings are an option of a rectangle or a thrust (2026-11-13 R2): "thrust
  // 10 ft × 8 ft; wings 6 ft each"
  if (st.toScale && wings) sizeNote += spWingFrac(p.stage).given ? `; wings ${num(p.stage.wingWidth ?? 0)} ${unit} each` : '; wings drawn at a usual width';
  // the shape's own drawing, in the plot's space (absent for a rectangle)
  let deck: SpDocDeck | undefined;
  if (spIsShaped(p.stage)) {
    const mx = (fx: number): number => fx * st.width + ox;
    const my = (fy: number): number => fy * st.depth + oy;
    const ol = spShapeOutline(p.stage);
    const front = spFrontEdges(p.stage);
    deck = {
      // ('wings' = a rectangle with wings; a thrust with wings is a 'thrust'
      // whose `areas` are its wings)
      shape: shape === 'rect' ? 'wings' : shape,
      outline: ol.t === 'circle' ? { t: 'circle', cx: mx(ol.cx), cy: my(ol.cy), r: ol.r * st.width } : { t: 'poly', pts: ol.pts.map((v, k) => (k % 2 ? my(v) : mx(v))) },
      front: { all: front.all, lines: front.lines.map(([a, b, c, d]) => [mx(a), my(b), mx(c), my(d)] as [number, number, number, number]) },
      areas: spWingRects(p.stage).map((w) => ({ x: mx(w.r.x0), y: my(w.r.y0), w: (w.r.x1 - w.r.x0) * st.width, h: (w.r.y1 - w.r.y0) * st.depth, name: w.side === 'right' ? 'SR WING' : 'SL WING' })),
      grid: grid.stepM ? spShapeGridSegments(p.stage, { x: grid.stepM / st.width, y: grid.stepM / st.depth }).map(([a, b, c, d]) => [mx(a), my(b), mx(c), my(d)] as [number, number, number, number]) : [],
      words: spShapeDirections(p.stage),
      origin: { x: ox, y: oy },
      mainW: st.width,
      mainD: st.depth,
      stage: { shape, wings, thrustWidth: p.stage.thrustWidth ?? null, thrustDepth: p.stage.thrustDepth ?? null, wingWidth: p.stage.wingWidth ?? null, roundForm: p.stage.roundForm === 'square' ? 'square' : 'circle', roundRef: spRoundRef(p.stage), width: p.stage.width, depth: p.stage.depth, ...(shape === 'round' && sides !== 'ref' ? { roundSides: sides } : {}) },
    };
  }

  // What the drawing means, in words. `brief` (the compact packet) says the
  // same things in fewer words and as one entry, to keep a small act's
  // packet on one sheet; nothing a reader needs is left out.
  const badges = items.flatMap((i) => i.badges);
  const quiet = spAllInputsInOrder(p)
    .filter((i) => i.audience === 'monitor-only')
    .map((i) => inputName(p, i.id));
  const tags = [...new Set(items.map((i) => i.tag).filter((x) => TAG_WORDS[x]))].map((x) => TAG_WORDS[x]);
  const offstage = p.objects.some((o) => !spOnStage(o, p.stage));
  const legend: string[] = [];
  if (shape === 'round') {
    const ref = spRoundRef(p.stage);
    const briefSides = sides === 'clock' ? `Seen from above, in the round: the audience is on every side. 12 o’clock is the ${ref} side, at the bottom, and 3 o’clock is on the left of this drawing.` : sides === 'numbered' ? `Seen from above, in the round: the audience is on every side. Side 1 is the ${ref} side, at the bottom; sides 2, 3 and 4 follow clockwise.` : `Seen from above, in the round: the audience is on every side, and the ${ref} side is at the bottom. Stage right is on the left of this drawing.`;
    legend.push(brief ? briefSides : spShapeWords(p.stage, unit));
  } else {
    legend.push(
      brief
        ? 'Seen from above, with the audience at the bottom: stage right is on the left of this drawing.'
        : 'Seen from above, with the audience at the bottom. Stage right and stage left are the performers’ own right and left, so stage right is on the left of this drawing.',
    );
    if (spIsShaped(p.stage)) legend.push(spShapeWords(p.stage, unit));
  }
  if (badges.length) {
    const lines = [brief ? 'A number in a box is an input channel. A code in a rounded box, such as M1, is a monitor mix.' : 'A number in a box is an input channel in the input list. A code in a rounded box, such as M1, is a monitor mix.'];
    if (badges.some((b) => /^B\d/.test(b))) lines.push('A number with B is a channel of the band monitor rig.');
    // a crowded stage: equipment printed with its reference alone
    if (items.some((i) => !i.label && i.badges.length)) lines.push(brief ? 'A number or a code with no name beside it: the key shows what the symbol is.' : 'Where a number or a code has no name beside it, the key shows what the symbol is, and the input list or the monitor plan names it.');
    legend.push(lines.join(' '));
  }
  // a crowded shaped stage: a symbol printed with no name, where its name
  // would only repeat the key's (owner 2026-11-13: build the remaining held items)
  if (items.some((i) => !i.label && !i.badges.length && PLOT_NAMES.get(i))) legend.push('A symbol with no name beside it is named in the key.');
  // an exclusion is visible on every export, the plot alone included
  if (quiet.length) legend.push(`${joinAnd(quiet)} ${quiet.length === 1 ? 'is' : 'are'} monitor only: kept out of the audience mix.`);
  if (tags.length) legend.push(`${tags.join('. ')}.`);
  // (round 3) how to read a stage box's size on its label (only with a box drawn)
  const sizedBox = spBoxes(p).find((b) => spBoxObject(p, b.id));
  if (sizedBox) legend.push(`A stage box is named with its size: ${spBoxPlotLabel(sizedBox)} has ${sizedBox.inputs} input${sizedBox.inputs === 1 ? '' : 's'}${sizedBox.returns != null ? ` and ${sizedBox.returns} return${sizedBox.returns === 1 ? '' : 's'}` : ''}.`);
  legend.push(
    st.toScale
      ? `The stage outline is drawn to the size given${grid.stepM ? ` (each grid square is ${grid.words})` : ''}. A symbol shows a kind of equipment, not its real size: this plot does not show whether equipment fits.`
      : brief
        ? 'Not to scale.'
        : 'Not to scale: the drawing shows the arrangement, not distances.',
  );
  if (offstage) legend.push('Anything drawn outside the stage outline is off the stage.');
  const said = brief ? [legend.join(' ')] : legend;

  // THE KEY: each kind of symbol that is drawn on THIS plot, with its name.
  // Part of the drawing in every packet kind; nothing switches it off.
  const key: SpDocKeyItem[] = spPlotKey(p.objects).map((e) => {
    const sym = spKeySymbol(e.kind);
    return { kind: e.kind, name: e.name, w: sym.w, h: sym.h, shapes: sym.shapes, tag: sym.tag };
  });

  // (a shaped stage is drawn at the size its names were placed for, never
  // larger for being roomy: drawn larger, each name drifted from its symbol)
  const out: SpDocPlot = { widthM: plotW, depthM: plotD, toScale: st.toScale, sizeNote, marginM, gridM: grid.stepM, items, viewNote: p.viewNote.trim(), legend: said, roomy: roomy && !shaped, key };
  if (deck) out.deck = deck;
  return out;
}

/* ── tables ─────────────────────────────────────────────────────────────── */

const col = (key: string, label: string, width: number, align?: 'left' | 'center'): SpDocColumn => (align ? { key, label, width, align } : { key, label, width });

const noSupplier = (): SpBySupplier => ({ band: 0, venue: 0, other: 0, tbc: 0 });
const supplierCells = (b: SpBySupplier): Record<string, string> => ({
  band: b.band ? String(b.band) : '',
  venue: b.venue ? String(b.venue) : '',
  other: b.other ? String(b.other) : '',
  tbc: b.tbc ? String(b.tbc) : '',
});
/** Who supplies these inputs' capture equipment: the ONE answer of
 *  `spInputSupplier`, so a DI channel is counted with its DI device. */
const countInputs = (p: SpProject, list: SpInput[]): SpBySupplier => {
  const b = noSupplier();
  for (const i of list) b[spInputSupplier(p, i)] += 1;
  return b;
};

const UNNAMED = 'Unnamed performer';
const MONITOR_ONLY = 'MONITOR ONLY: kept out of the audience mix';

/** A kind and the name of the thing, said once: "Microphone" and "Kick drum
 *  microphone" print as "Kick drum microphone" (the name already says the
 *  kind); "Microphone" and "SM58" print as "Microphone: SM58". */
const kindAndName = (kind: string, name: string): string => (name.toLowerCase().includes(kind.toLowerCase()) ? name : `${kind}: ${name}`);

/** What captures the sound, in as few words as say it. Only what differs
 *  from the usual is printed: the priority when it is not "preferred", the
 *  connector when it is not an XLR on a microphone, DI or wireless row, and
 *  phantom power when it is required, must not be applied, or is still to
 *  be confirmed by someone other than the venue (the venue is not asked
 *  about its own microphones). */
function captureCell(p: SpProject, i: SpInput): string {
  const word = SP_CAPTURE_WORD[i.capture];
  const eq = i.equipment.trim();
  // a line-level row says "balanced line" once: "Direct balanced line, line level"
  const line = i.capture === 'line';
  const named = eq && eq.toLowerCase() !== word.toLowerCase() && !(line && /balanced line/i.test(eq));
  const level = lower(i.level.trim());
  const head = named ? kindAndName(word, eq) : word;
  const parts: string[] = [line && level ? `${head}, ${level}` : head];
  if (i.priority === 'required') parts.push('REQUIRED');
  else if (i.priority === 'flexible') parts.push(lower(SP_PRIORITY_WORD.flexible));
  const connector = i.connector.trim();
  const usual = /^xlr$/i.test(connector) && (i.capture === 'mic' || i.capture === 'di' || i.capture === 'wireless');
  if (connector && !usual) parts.push(connector);
  if (level && !line) parts.push(level);
  if (i.phantom === 'required') parts.push('phantom power required');
  else if (i.phantom === 'do-not-apply') parts.push('do not apply phantom power');
  else if (i.phantom === 'unknown' && (i.capture === 'mic' || i.capture === 'di') && spInputSupplier(p, i) !== 'venue') parts.push('phantom power to be confirmed');
  return parts.join('; ');
}

function inputNote(i: SpInput): string {
  const out: string[] = [];
  if (i.alternatives.trim()) out.push(`Acceptable alternatives: ${i.alternatives.trim()}`);
  if (i.adapterNote.trim()) out.push(`Adapter or interface: ${i.adapterNote.trim()}`);
  if (i.destination === 'custom') out.push(`Destination: ${i.splitNote.trim() || 'to be confirmed'}`);
  else if (i.splitNote.trim()) out.push(`Split: ${i.splitNote.trim()}`);
  if (i.notes.trim()) out.push(i.notes.trim());
  return out.join(' · ');
}

const standCell = (i: SpInput): string => (i.stand === 'none' ? DASH : [SP_STAND_WORD[i.stand], i.standNote.trim()].filter(Boolean).join(': '));
function supplierCell(p: SpProject, i: SpInput): string {
  const who = spInputSupplier(p, i);
  return i.stand !== 'none' && i.standSupplier !== who ? `${SP_SUPPLIER_WORD[who]}. Stand: ${SP_SUPPLIER_WORD[i.standSupplier]}` : SP_SUPPLIER_WORD[who];
}
function audienceCell(i: SpInput): string {
  if (i.audience === 'monitor-only') return MONITOR_ONLY;
  if (i.audience === 'tbc') return SP_AUDIENCE_WORD.tbc;
  if (i.cue) return i.cueAudienceOk ? 'Yes: a click or cue the audience is meant to hear' : 'Yes (a click or cue)';
  return 'Yes';
}

/** How near (a fraction of the stage) a microphone stands to its performer's
 *  figure to be "at" that performer. */
export const SP_MIC_AT_PERFORMER = 0.15;

/** What a kind of stage object is called in a sentence: "guitar amplifier". */
const kindWords = (kind: SpObject['kind']): string => lower(SP_PALETTE.find((x) => x.kind === kind)?.name ?? '');

/** Who plays an input and WHERE THE INPUT IS: its own symbol on the plot
 *  (the amplifier, the playback rig, the microphone), which is where the
 *  engineer puts the microphone or runs the line, and not where its
 *  performer stands. "Sam · at the guitar amplifier, center stage". An input
 *  with no symbol of its own is where its performer is. */
function whoCell(p: SpProject, i: SpInput, performerName: string, sourceLabel: string, compact: boolean): string {
  const source = p.sources.find((s) => s.id === i.sourceId);
  const note = source?.locationNote.trim() ?? '';
  const pf = spPerformer(p, source?.performerId ?? null);
  const o = spObjectOfInput(p, i.id);
  const who = pf ? performerName || pf.name.trim() || UNNAMED : sourceLabel && sourceLabel !== i.label ? sourceLabel : '';
  if (compact && pf) return [who, note].filter(Boolean).join(' · ');
  let where: string;
  if (!o) where = source?.offstage ? 'Off the stage' : 'Not placed on the stage yet';
  else {
    // A microphone right at its performer's figure is where that performer
    // is: one person, one position word (the mic a step downstage of the
    // singer read "Downstage center" beside "Center stage", round-1 bug 15).
    const fig = pf && (o.kind === 'vocal-mic' || o.kind === 'mic-stand') ? p.objects.find((x) => x.kind === 'performer' && x.performerId === pf.id) : undefined;
    const atFigure = !!fig && Math.hypot(fig.x - o.x, fig.y - o.y) <= SP_MIC_AT_PERFORMER;
    const place = spLocationWord(atFigure && fig ? fig : o, p.stage);
    // a figure or a microphone needs no "at the…": its place says it
    // (a choir says its size: "at the choir (24 singers, 3 rows)", round 3)
    const thing = o.kind === 'performer' || o.kind === 'vocal-mic' || o.kind === 'mic-stand' ? '' : o.kind === 'choir' ? `${kindWords(o.kind)} (${spChoirCountWords(spChoirOf(o))})` : kindWords(o.kind);
    where = thing ? `at the ${thing}, ${lower(place)}` : place;
  }
  return [who, where, note].filter(Boolean).join(' · ');
}

/** The house list (and any list that is not the band monitor rig): one row for
 *  each input, with everything the house needs to plug it in. */
function inputTable(p: SpProject, patchId: 'house' | 'band', compact: boolean): SpDocTable {
  const rows = spPatchRows(p, patchId);
  const withVenue = rows.some((r) => r.venue.trim());
  const columns: SpDocColumn[] = [
    col('ch', 'Ch', 0.7, 'center'),
    col('input', 'Input', compact ? 2.2 : 2),
    compact ? col('who', 'Performer', 1.8) : col('who', 'Performer and where the input is', 2.8),
    col('capture', 'Capture and equipment', compact ? 3.6 : 3.3),
    // (review 2: "Short boom stand" wrapped on three lines while "Audience
    // mix" had room to spare: Stand 13% of the full table, taken from it)
    col('stand', 'Stand', 1.85),
    col('supplier', 'Supplied by', compact ? 1.9 : 1.8),
    col('audience', 'Audience mix', 1.75),
  ];
  if (withVenue) columns.push(col('venue', 'Venue channel', 2));
  // the stage box socket each input plugs into: only when the plot has boxes
  const withBox = spBoxes(p).length > 0;
  // (round 2: a sub-snake's socket reads "SB2 · 3, via SB1 · 11": a wider column then)
  if (withBox) columns.splice(1, 0, col('box', 'Box · socket', spBoxes(p).some((b) => b.feed) ? 2 : 1.35));
  const docRows: SpDocRow[] = rows.map((r) => {
    const i = r.input;
    const cells: Record<string, string> = {
      ch: r.number != null ? String(r.number) : DASH,
      input: i.label,
      who: whoCell(p, i, r.performerName, r.sourceLabel, compact),
      capture: captureCell(p, i),
      stand: standCell(i),
      supplier: supplierCell(p, i),
      audience: audienceCell(i),
    };
    if (withVenue) cells.venue = r.venue.trim();
    if (withBox) cells.box = spBoxPatchWords(p, i) || (i.direct ? 'Console direct' : DASH);
    const row: SpDocRow = { cells };
    if (i.priority === 'required' || i.audience === 'monitor-only') row.strong = true;
    const note = inputNote(i);
    if (note) row.note = note;
    return row;
  });
  return { columns, rows: docRows, empty: 'No inputs yet.' };
}

/** The band monitor rig: four columns. An input that is also in the house list
 *  is described there, so here it is its two numbers only; an input that
 *  feeds the band's rig alone gets its full description in the notes. */
function bandTable(p: SpProject): SpDocTable {
  const rows = spPatchRows(p, 'band');
  const house = p.patches.find((x) => x.id === 'house');
  const columns = [col('ch', 'Ch', 0.8, 'center'), col('input', 'Input', 2.6), col('house', 'House channel', 2), col('notes', 'Notes', 5.2)];
  const docRows: SpDocRow[] = rows.map((r) => {
    const i = r.input;
    const inHouse = !!house && house.order.includes(i.id);
    const n = house?.numbers[i.id];
    const own = inHouse
      ? [r.venue.trim() ? `Venue channel: ${r.venue.trim()}` : '', i.splitNote.trim() ? `Split: ${i.splitNote.trim()}` : '']
      : [captureCell(p, i), i.stand === 'none' ? '' : standCell(i), `Supplied by: ${supplierCell(p, i)}`, i.audience === 'monitor-only' ? MONITOR_ONLY : '', r.venue.trim() ? `Venue channel: ${r.venue.trim()}` : '', spBoxPatchWords(p, i) ? `Stage box: ${spBoxPatchWords(p, i)}` : '', inputNote(i)];
    const row: SpDocRow = { cells: { ch: r.number != null ? String(r.number) : DASH, input: i.label, house: inHouse ? (n != null ? String(n) : DASH) : 'Band monitor rig only', notes: own.filter(Boolean).join(' · ') } };
    if (!inHouse && (i.priority === 'required' || i.audience === 'monitor-only')) row.strong = true;
    return row;
  });
  return { columns, rows: docRows, empty: 'No inputs yet.' };
}

function mixNote(p: SpProject, m: SpMix): string {
  const out: string[] = [];
  const order = spAllInputsInOrder(p).map((i) => i.id);
  for (const need of ['primary', 'supporting', 'not-needed', 'exclude'] as SpMixNeed[]) {
    const names = order.filter((id) => m.needs[id] === need).map((id) => inputName(p, id));
    if (names.length) out.push(`${SP_NEED_WORD[need]}: ${names.join(', ')}`);
  }
  if (m.notes.trim()) out.push(m.notes.trim());
  return out.join(' · ');
}

/** The compact packet's monitor plan: ONE table. What a mix is asked to hear
 *  goes on the line under its row, so nothing the band asked for is lost. */
/** (round 2) A monitor plan's "Box return" column: only when a stage box
 *  has returns. A mix asked of the house console with none reads "No return
 *  yet"; a mix the band makes on its own rig needs none. */
const withReturns = (p: SpProject): boolean => spReturnBoxes(p).length > 0;
const returnCell = (p: SpProject, m: SpMix): string => {
  if (m.fromConsole) return 'From the console, not a stage box';
  const w = spReturnWords(p, m);
  if (!w) return spMixWantsReturn(m) ? 'No return yet' : DASH;
  // (round 3) a mix the band makes itself that still holds a return, while the
  // band has not said it needs one (engineer review)
  const open = (m.provider === 'band-console' || m.provider === 'personal-mixer') && !spVenueGivesReturns(m) && !m.retKeep;
  return open ? `${w} (to be confirmed)` : w;
};

function mixTableCompact(p: SpProject): SpDocTable {
  const columns = [col('mix', 'Mix', 2.2), col('who', 'For', 1.8), col('format', 'Format and delivery', 2.9), col('by', 'Who creates it', 2.4), col('devices', 'Devices', 3.3)];
  const rets = withReturns(p);
  if (rets) columns.push(col('ret', 'Stage box return', 1.6));
  const rows: SpDocRow[] = p.mixes.map((m) => {
    const who = m.recipients.map((id) => spPerformer(p, id)?.name.trim() || UNNAMED).join(', ') || (m.delivery === 'drum-fill' || m.delivery === 'sidefill' ? 'The stage' : 'Nobody in particular');
    const devices = p.devices.filter((d) => d.mixId === m.id).map((d) => `${d.label.trim() || SP_DEVICE_WORD[d.type]} (${SP_SUPPLIER_WORD[d.supplier]})`);
    const own = m.provider === 'band-console' || m.provider === 'personal-mixer';
    const row: SpDocRow = {
      cells: {
        mix: [m.code, m.name.trim()].filter(Boolean).join(' '),
        who,
        format: `${m.format === 'stereo' ? 'Stereo' : 'Mono'}, ${lower(SP_DELIVERY_WORD[m.delivery])}`,
        by: own ? `${SP_PROVIDER_WORD[m.provider]}. Requested from the venue: ${lower(SP_VENUE_FEED_WORD[m.venueFeed])}` : SP_PROVIDER_WORD[m.provider],
        devices: [devices.join('; '), m.outputs.trim() ? `Requested outputs: ${m.outputs.trim()}` : ''].filter(Boolean).join('. '),
      },
    };
    if (rets) row.cells.ret = returnCell(p, m);
    const note = [m.instructions.length ? `Asked to hear: ${m.instructions.join('; ')}` : '', mixNote(p, m)].filter(Boolean).join(' · ');
    if (note) row.note = note;
    return row;
  });
  return { columns, rows, empty: 'No monitor mixes yet.' };
}

function mixTable(p: SpProject): SpDocTable {
  // widths as review 2 measured them on the playback example (percent of the table)
  const columns = [col('mix', 'Mix', 14), col('who', 'For', 10), col('format', 'Format', 8), col('by', 'Who creates it', 30), col('delivery', 'Delivery and devices', 22), col('asks', 'Asked to hear', 16)];
  const rets = withReturns(p);
  // (the return column takes its room from the two widest)
  if (rets) {
    columns[3].width = 23;
    columns[4].width = 19;
    columns.splice(5, 0, col('ret', 'Stage box return', 14));
  }
  const rows: SpDocRow[] = p.mixes.map((m) => {
    const who = m.recipients.map((id) => spPerformer(p, id)?.name.trim() || UNNAMED).join(', ') || (m.delivery === 'drum-fill' || m.delivery === 'sidefill' ? 'The stage' : 'Nobody in particular');
    const devices = p.devices.filter((d) => d.mixId === m.id).map((d) => `${d.label.trim() || SP_DEVICE_WORD[d.type]} (${SP_SUPPLIER_WORD[d.supplier]})`);
    const delivery = [SP_DELIVERY_WORD[m.delivery], devices.join('; '), m.outputs.trim() ? `Requested outputs: ${m.outputs.trim()}` : ''].filter(Boolean).join('. ');
    // a REQUEST to the venue, never a statement of what it has agreed to
    const feed = `Requested from the venue: ${lower(SP_VENUE_FEED_WORD[m.venueFeed])}`;
    const by =
      m.provider === 'band-console'
        ? `${SP_PROVIDER_WORD[m.provider]}. ${feed}`
        : m.provider === 'personal-mixer'
          ? `${SP_PROVIDER_WORD[m.provider]} (not mixed on the house console). ${feed}`
          : SP_PROVIDER_WORD[m.provider];
    const row: SpDocRow = {
      cells: {
        mix: [m.code, m.name.trim()].filter(Boolean).join(' '),
        who,
        format: m.format === 'stereo' ? 'Stereo' : 'Mono',
        by,
        delivery,
        asks: m.instructions.join('; '),
      },
    };
    if (rets) row.cells.ret = returnCell(p, m);
    const note = mixNote(p, m);
    if (note) row.note = note;
    return row;
  });
  return { columns, rows, empty: 'No monitor mixes yet.' };
}

const OWN_RIG = 'part of the band monitor rig: nothing is requested from the venue’s monitor system';

/** `saidAbove` = every device is part of the band monitor rig and a sentence
 *  above the table says so once, so no row repeats it. */
function deviceTable(p: SpProject, saidAbove: boolean): SpDocTable {
  // widths as review 2 measured them (percent of the table): the notes get the room
  const columns = [col('device', 'Device', 17), col('type', 'Type', 18), col('mix', 'Mix', 7), col('who', 'Used by', 10), col('supplier', 'Supplied by', 11), col('notes', 'Notes', 37)];
  const rows: SpDocRow[] = p.devices.map((d) => {
    const m = spMix(p, d.mixId);
    const notes = [d.model.trim(), d.wireless ? 'Wireless: radio frequency coordination needed' : '', d.selfContained && !saidAbove ? `Part ${OWN_RIG.slice(5)}` : '', d.note.trim()].filter(Boolean).join(' · ');
    return {
      cells: {
        device: d.label.trim() || SP_DEVICE_WORD[d.type],
        type: SP_DEVICE_WORD[d.type],
        mix: m ? m.code : d.selfContained ? 'Band monitor rig' : 'Not on a mix',
        who: spPerformer(p, d.performerId)?.name.trim() ?? '',
        supplier: SP_SUPPLIER_WORD[d.supplier],
        notes,
      },
    };
  });
  return { columns, rows, empty: 'No monitor devices listed yet.' };
}

const EXTRA_WORD: Record<SpProject['extras'][number]['kind'], string> = { 'stage-box': 'Stage box', split: 'Split', backline: 'Backline', riser: 'Riser', power: 'Power location', other: 'Other item' };

/** `qtyText` = what the Qty cell prints when it is not the number (a row
 *  that names several things has no one quantity: "–"). */
type EquipRow = { item: string; qty: number; qtyText?: string; by: SpBySupplier; notes: string; strong: boolean; say: string };

/** Every listed item once, with who supplies how many. `say` is the part of
 *  its notes that must also be printed in the compact form. */
function equipmentRows(p: SpProject, s: SpSummary): EquipRow[] {
  const rows: EquipRow[] = [];
  const add = (item: string, qty: number, by: SpBySupplier, notes: string, strong = false, say = '') => rows.push({ item, qty, by, notes, strong, say });
  for (const kind of ['mic', 'wireless'] as const) {
    for (const l of kind === 'mic' ? s.microphoneLines : s.wirelessLines) {
      const notes = [
        l.required ? `${l.required} REQUIRED` : '',
        kind === 'wireless' ? 'Radio frequency coordination needed' : '',
        l.alternatives.length ? `Acceptable alternatives (not extra items): ${l.alternatives.join('; ')}` : '',
      ]
        .filter(Boolean)
        .join(' · ');
      add(kindAndName(SP_CAPTURE_WORD[kind], l.name), l.qty, l.bySupplier, notes, l.required > 0, [l.required ? `${l.required} REQUIRED` : '', kind === 'wireless' ? 'radio frequency coordination needed' : ''].filter(Boolean).join(', '));
    }
  }
  for (const kind of ['line', 'custom'] as const) {
    const list = p.inputs.filter((i) => i.capture === kind);
    if (list.length) add(kind === 'line' ? 'Direct balanced line output' : 'Custom capture', list.length, countInputs(p, list), list.map((i) => i.label).join(', '));
  }
  for (const l of s.stands) add(l.name, l.qty, l.bySupplier, '');
  for (const d of p.diDevices) {
    // "passive or active" still open is a question: it is in the unresolved list, once
    const kind = d.kind === 'unknown' ? '' : d.kind;
    // the input it carries, with its channel: a device and its input often share a name
    const house = p.patches.find((x) => x.id === 'house');
    const feeds = p.inputs
      .filter((i) => i.diDeviceId === d.id)
      .map((i) => {
        const n = house?.numbers[i.id];
        return n != null ? `${i.label} (channel ${n})` : i.label;
      });
    const by = noSupplier();
    by[d.supplier] = 1;
    add(`DI device: ${d.label}${d.model.trim() ? ` (${d.model.trim()})` : ''}`, 1, by, [d.channels === 2 ? 'Stereo: 2 DI channels' : 'Mono: 1 DI channel', kind, feeds.length ? `Carries: ${feeds.join(', ')}` : ''].filter(Boolean).join(' · '));
  }
  const loose = p.inputs.filter((i) => i.capture === 'di' && !i.diDeviceId);
  if (loose.length) {
    const one = loose.length === 1;
    add(`DI channel${one ? '' : 's'} with no DI device yet`, loose.length, countInputs(p, loose), `Which DI box carries ${one ? 'it' : 'them'} is to be confirmed: ${loose.map((i) => i.label).join(', ')}`);
  }
  for (const t of Object.keys(s.monitors.devices) as SpDeviceType[]) {
    const n = s.monitors.devices[t];
    if (!n) continue;
    const mine = p.devices.filter((d) => d.type === t);
    const radio = mine.some((d) => d.wireless);
    add(SP_DEVICE_WORD[t], n, s.monitors.devicesBySupplier[t], [mine.map((d) => d.label.trim()).filter(Boolean).join(', '), radio ? 'Wireless: radio frequency coordination needed' : ''].filter(Boolean).join(' · '), false, radio ? 'wireless: radio frequency coordination needed' : '');
  }
  for (const e of p.extras) {
    const by = noSupplier();
    by[e.supplier] = e.qty;
    const label = e.label.trim() || EXTRA_WORD[e.kind];
    if (e.kind === 'backline') {
      // the row says what it is; a row that names several things ("drum kit,
      // bass amplifier, …") has no one quantity
      const item = /^backline\b/i.test(label) ? label : `Backline: ${lower(label)}`;
      add(item, e.qty, by, e.note.trim(), false, e.note.trim());
      if (e.qty === 1 && /,| and /.test(label)) rows[rows.length - 1].qtyText = DASH;
    } else add(label, e.qty, by, e.note.trim(), false, e.note.trim());
  }
  return rows;
}

/** How many of the listed items each supplier brings: the SAME rows the
 *  equipment table prints, added up, so a summary on the screen and the
 *  table in the packet cannot disagree. */
export function spEquipmentSplit(p: SpProject, s: SpSummary = spSummary(p)): SpBySupplier {
  const out = noSupplier();
  for (const r of equipmentRows(p, s)) for (const k of Object.keys(out) as (keyof SpBySupplier)[]) out[k] += r.by[k];
  return out;
}

function equipmentTable(rows: EquipRow[]): SpDocTable {
  const columns = [col('item', 'Item', 3.8), col('qty', 'Qty', 0.8, 'center'), col('band', 'Band', 0.9, 'center'), col('venue', 'Venue', 0.9, 'center'), col('other', 'Other', 0.9, 'center'), col('tbc', 'To be confirmed', 2.1, 'center'), col('notes', 'Notes', 4)];
  return {
    columns,
    rows: rows.map((r) => {
      // a row with no one quantity ("–") says WHO in words, never a count of 1
      const who = supplierCells(r.by);
      if (r.qtyText === DASH) for (const k of Object.keys(who)) if (who[k]) who[k] = 'Yes';
      const row: SpDocRow = { cells: { item: r.item, qty: r.qtyText ?? String(r.qty), ...who, notes: r.notes } };
      if (r.strong) row.strong = true;
      return row;
    }),
    empty: 'No equipment listed yet.',
  };
}

/* ── sections ───────────────────────────────────────────────────────────── */

const para = (text: string, tone?: 'normal' | 'muted' | 'strong'): SpDocBlock => (tone ? { t: 'para', text, tone } : { t: 'para', text });
const h2 = (text: string): SpDocBlock => ({ t: 'heading', level: 2, text });
/** A typed note as paragraphs: every line the band wrote is printed. */
const noteBlocks = (text: string): SpDocBlock[] =>
  text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => para(s));

type Break = SpDocSection['breakBefore'];

function plotSection(p: SpProject, stamp: string, kind: SpPacketKind, generatedAt: number): SpDocSection {
  const compact = kind !== 'full';
  const facts: [string, string][] = [['Band', bandName(p) || NO_BAND]];
  if (p.title.trim()) facts.push(['Title', p.title.trim()]);
  if (p.venue.trim()) facts.push(['Venue', p.venue.trim()]);
  if (p.eventDate.trim()) facts.push(['Date', spDateWords(p.eventDate)]);
  const times = [p.loadIn.trim() ? `Load-in ${p.loadIn.trim()}` : '', p.soundcheck.trim() ? `Soundcheck ${p.soundcheck.trim()}` : '', p.performance.trim() ? `Performance ${p.performance.trim()}` : ''].filter(Boolean);
  if (times.length) facts.push(['Times', times.join(' · ')]);
  const contact = contactLine(p);
  if (contact) facts.push(['Technical contact', contact]);
  const status = stamp
    ? p.status === 'ready'
      ? 'Draft: something must be corrected (see the last section)'
      : 'Draft'
    : `Ready to advance: prepared for discussion with the venue${p.venueConfirmed ? '. The band recorded that the venue confirmed this revision' : ''}`;
  facts.push(['Revision', `${p.revision} · ${status}${p.modifiedAt > 0 ? ` · changed ${spDayWords(p.modifiedAt)}` : ''}`]);
  // what this document is (it used to close the packet, alone on a last sheet)
  const made = spMomentWords(generatedAt);
  facts.push(['This packet', `The band’s request, for discussion: not a confirmation by the venue.${made ? ` Made ${made}.` : ''}`]);

  const blocks: SpDocBlock[] = [{ t: 'facts', rows: facts }, { t: 'plot', plot: spPlotDoc(p, { brief: kind === 'compact', roomy: kind === 'plot' }) }];

  const stageNotes = p.objects.filter((o) => o.note.trim()).map((o) => `${objectLabel(p, o) || 'An object with no name'}: ${o.note.trim()}`);
  // each choir on risers: the riser units it needs, and how close the
  // drawing stands the singers (round 3; venues supply risers from this)
  for (const o of p.objects) if (o.kind === 'choir' && spChoirRiserNote(spChoirOf(o))) stageNotes.push(`${objectLabel(p, o) || 'Choir'}: ${spChoirRiserNote(spChoirOf(o))}`);
  if (stageNotes.length) blocks.push(h2('Notes on the stage'), { t: 'list', items: stageNotes });

  const rows = p.performers.map((pf) => {
    const o = p.objects.find((x) => x.performerId === pf.id && x.kind === 'performer') ?? p.objects.find((x) => x.performerId === pf.id);
    const mixes = spMixesOf(p, pf.id).map((m) => m.code);
    const ownRig = p.devices.some((d) => d.performerId === pf.id && d.selfContained);
    return {
      name: pf.name.trim() || UNNAMED,
      role: pf.role.trim(),
      where: o ? spLocationWord(o, p.stage) : 'Not placed on the stage yet',
      mix: mixes.length ? mixes.join(', ') : ownRig ? 'Band monitor rig' : pf.noMonitor === true ? 'None requested' : 'To be confirmed',
    };
  });
  // The full packet lists the performers under the plot. The compact packet
  // and the plot alone leave the list out: the drawing prints each name with
  // its monitor mix, and the input list names who plays each input.
  if (!compact) {
    const table: SpDocTable = {
      columns: [col('name', 'Performer', 2), col('role', 'Role', 3), col('where', 'Position on the stage', 2.4), col('mix', 'Monitor mix', 2.2)],
      rows: rows.map((r) => ({ cells: { name: r.name, role: r.role, where: r.where, mix: r.mix } })),
      empty: 'No performers yet.',
    };
    blocks.push(h2('Performers'), { t: 'table', table });
  }
  return { id: 'plot', title: 'Stage plot', blocks, breakBefore: 'none' };
}

function inputsSection(p: SpProject, s: SpSummary, breakBefore: Break, compact: boolean): SpDocSection {
  const blocks: SpDocBlock[] = [];
  const h = s.house;
  if (p.inputs.length) {
    const quiet = spPatchRows(p, 'house')
      .filter((r) => r.input.audience === 'monitor-only')
      .map((r) => r.input.label);
    // a zero count is never printed
    const ways: string[] = [];
    if (h.monitorOnly || h.audienceTbc) {
      if (h.audience) ways.push(`${h.audience} for the audience mix`);
      if (h.monitorOnly) ways.push(`${h.monitorOnly} monitor only${quiet.length ? ` (${quiet.join(', ')})` : ''}`);
      if (h.audienceTbc) ways.push(`${h.audienceTbc} with the audience routing to be confirmed`);
    }
    const routing = ways.length ? ways.join(', ') : 'all for the audience mix';
    const first = [`${plural(h.channels, 'input channel')} to the house system: ${routing}.`];
    if (s.band) first.push(`${plural(s.band.channels, 'input channel')} to the band monitor rig.`);
    const second = [`${plural(s.microphones, 'microphone')}.`, s.di.summary];
    if (s.wirelessInputs) second.push(`${plural(s.wirelessInputs, 'wireless receiver output')}: radio frequency coordination needed.`);
    if (s.lineInputs) second.push(`${plural(s.lineInputs, 'direct balanced line output')}.`);
    if (s.customInputs) second.push(`${plural(s.customInputs, 'custom capture path')}.`);
    const groups = SP_CATEGORY_ORDER.filter((c) => h.byCategory[c]).map((c) => `${SP_CATEGORY_WORD[c]} ${h.byCategory[c]}`);
    if (!compact && groups.length > 1) second.push(`House system channels by group: ${groups.join(', ')}.`);
    if (compact) blocks.push(para([...first, ...second].join(' '), 'strong'));
    else blocks.push(para(first.join(' '), 'strong'), para(second.join(' ')));
    blocks.push(para('Channel numbers are the band’s proposed order. The venue may patch in another order. Equipment named here is a preference unless it says REQUIRED.', 'muted'));
  }
  const both = p.inputs.some((i) => i.destination === 'both');
  for (const patch of p.patches) {
    const n = patch.order.length;
    if (patch.id === 'band') {
      blocks.push(h2(`${patch.name}: ${plural(n, 'input channel')}`));
      if (both) blocks.push(para('Inputs in both lists reach the house system and the band monitor rig through a split. Each one is described in the house system list above.', 'muted'));
      blocks.push({ t: 'table', table: bandTable(p) });
    } else {
      if (p.patches.length > 1) blocks.push(h2(`${patch.name}: ${plural(n, 'input channel')}`));
      blocks.push({ t: 'table', table: inputTable(p, patch.id, compact) });
    }
    // Only a channel that IS free is printed as kept free: a reserved number
    // an input sits on is a review question, never "free" on paper.
    const used = new Set(patch.order.map((id) => patch.numbers[id]).filter((x): x is number => x != null));
    const free = patch.reserved.filter((x) => !used.has(x));
    if (free.length) blocks.push(para(`${patch.name}: channels kept free on purpose: ${free.join(', ')}.`, 'muted'));
  }
  // THE PATCH SUMMARY: each stage box, its sockets used and free
  const boxes = spBoxUse(p);
  if (boxes.length) {
    blocks.push(h2('Stage boxes'));
    blocks.push({
      t: 'list',
      items: boxes.map((u) => {
        const by = { band: 'supplied by the band', venue: 'supplied by the venue', other: 'supplied by another provider', tbc: 'who supplies it is to be confirmed' }[u.box.supplier];
        const o = spBoxObject(p, u.box.id);
        // where it stands and which channels it carries: what the crew patches by
        const where = o ? `, ${lower(spLocationWord(o, p.stage))}` : '';
        const chans = spBadgeRuns(u.plugged.map((x) => spBadge(p, x.input.id)));
        const carries = chans.length ? `: channel${u.plugged.length === 1 ? '' : 's'} ${chans.join(', ')} on ${spBoxUseWords(u)}` : `: ${spBoxUseWords(u)}`;
        const extra = [by, u.drawn ? '' : 'not placed on the plot yet'].filter(Boolean).join('; ');
        // the student's own note is its own sentence ("…the band. By the drum riser."),
        // never glued on after a semicolon with its capital letter
        const typed = u.box.note.trim();
        // (round 3) labelled, so the crew reads it as the band's own note
        const note = typed ? ` Note: ${typed.charAt(0).toUpperCase()}${typed.slice(1)}${/[.!?]$/.test(typed) ? '' : '.'}` : '';
        // (round 2) sub-snakes, its returns and its console, only when given
        const more = spBoxMoreWords(p, u);
        return `${spBoxName(u.box)} (${spBoxSizeWords(u.box)})${where}${carries}${more.length ? `; ${more.join('; ')}` : ''}. ${extra.charAt(0).toUpperCase()}${extra.slice(1)}.${note}`;
      }),
    });
    blocks.push(para('Box and socket are the band’s suggestion. On the venue’s own stage boxes, the venue’s patch comes first.', 'muted'));
    // (round 3) what a sub-snake and "via" mean, only when one is listed (learner review)
    const sub = spBoxes(p).find((b) => b.feed && spBox(p, b.feed.boxId));
    if (sub && sub.feed) {
      const main = spBoxName(spBox(p, sub.feed.boxId) as NonNullable<ReturnType<typeof spBox>>);
      blocks.push(para(`${spBoxName(sub)} is a sub-snake: a small box whose cable plugs into ${main}. “${spBoxName(sub)} · 1, via ${main} · ${sub.feed.first}” means socket 1 of ${spBoxName(sub)} arrives on ${main} socket ${sub.feed.first}${sub.retFeed ? `; its returns work the same way (${spBoxName(sub)} · return 1 comes from ${main} · return ${sub.retFeed.first})` : ''}.`, 'muted'));
    }
    const direct = spAllInputsInOrder(p).filter((i) => i.direct).map((i) => i.label);
    if (direct.length) blocks.push(para(`Plugged in at the console directly, not through a stage box: ${joinAnd(direct)}.`, 'muted'));
  }
  const acoustic = p.sources.filter((x) => x.connection === 'none');
  if (acoustic.length) {
    blocks.push(h2('On the stage, with no sound system connection'));
    blocks.push({
      t: 'list',
      items: acoustic.map((x) => {
        const who = spPerformer(p, x.performerId)?.name.trim();
        const why = x.noneReason === 'acoustic' ? 'acoustic' : x.noneReason === 'self-contained' ? 'self-contained' : 'no connection needed';
        return `${x.label}${who ? ` (${who})` : ''}: ${why}${x.locationNote.trim() ? `. ${x.locationNote.trim()}` : ''}`;
      }),
    });
  }
  return { id: 'inputs', title: 'Input list', blocks, breakBefore };
}

function monitorsSection(p: SpProject, s: SpSummary, breakBefore: Break, compact: boolean): SpDocSection {
  const m = s.monitors;
  const blocks: SpDocBlock[] = [];
  const dev = (Object.keys(m.devices) as SpDeviceType[]).filter((t) => m.devices[t] > 0).map((t) => spDeviceCountWord(t, m.devices[t]));
  const wireless = m.wirelessDevices ? `${plural(m.wirelessDevices, 'wireless monitor device')}: radio frequency coordination needed. This packet lists no radio frequencies.` : '';
  // The headline never adds the band's own mixes to what the house is asked
  // for: "feed" would read as something the house sends. No zero count.
  const asked = m.house.mixes ? `Requested from the house console: ${plural(m.house.mixes, 'mix', 'mixes')}, ${plural(m.house.channels, 'audio channel')}.` : 'Nothing is requested from the house console.';
  const head = `${plural(m.all.mixes, 'monitor mix', 'monitor mixes')} (${spMonoStereoWord(m.all.mono, m.all.stereo)}). ${asked}`;
  const apart: string[] = [];
  // The band monitor rig and a personal mixer system are said apart: a
  // venue may own the personal mixer system (as the Monitors screen says).
  const rig = m.byProvider['band-console'];
  const personal = m.byProvider['personal-mixer'];
  if (rig.mixes) apart.push(`Created in the band monitor rig, and not requested from the house console: ${plural(rig.mixes, 'mix', 'mixes')} (${plural(rig.channels, 'audio channel')} inside that rig).`);
  if (personal.mixes) apart.push(`Made on a personal mixer system, and not mixed on the house console: ${plural(personal.mixes, 'mix', 'mixes')} (${plural(personal.channels, 'audio channel')}).`);
  if (m.byProvider.tbc.mixes) apart.push(`For ${plural(m.byProvider.tbc.mixes, 'mix', 'mixes')}, who creates the mix is to be confirmed.`);
  if (compact) {
    // ONE line of totals, then the table: no explaining paragraphs
    if (p.mixes.length) blocks.push(para([head, ...apart, wireless].filter(Boolean).join(' '), 'strong'));
    else if (wireless) blocks.push(para(wireless));
  } else {
    if (p.mixes.length) {
      blocks.push(para(head, 'strong'));
      // the outputs sentence is about the HOUSE console's channels, so it
      // follows the house-console line, before the mixes made elsewhere
      // (it read as part of the personal-mixer line: R2-SP2-10)
      const more: string[] = [];
      if (m.house.channels) more.push(`If each audio channel is carried on its own analog console output, that is ${plural(m.house.channels, 'output')}. The real number depends on how the venue sends the feeds to the stage: to be confirmed with the venue.`);
      more.push(...apart);
      if (more.length) blocks.push(para(more.join(' ')));
    }
    if (dev.length) blocks.push(para(`Monitor devices: ${dev.join(', ')}.${wireless ? ` ${wireless}` : ''}`));
  }

  for (const i of p.inputs.filter((x) => x.cue)) {
    const heard = p.mixes.filter((x) => x.needs[i.id] === 'primary' || x.needs[i.id] === 'supporting').map((x) => x.code);
    const kept = p.mixes.filter((x) => x.needs[i.id] === 'exclude').map((x) => x.code);
    const head =
      i.audience === 'monitor-only'
        ? `${inputName(p, i.id)} is ${MONITOR_ONLY}.`
        : i.audience === 'audience'
          ? i.cueAudienceOk
            ? `${inputName(p, i.id)} is a click or cue that the audience is meant to hear: the band’s choice.`
            : `${inputName(p, i.id)} is a click or cue set to go to the audience mix.`
          : `${inputName(p, i.id)} is a click or cue. Audience mix or monitor only: to be confirmed.`;
    blocks.push(para(`${head}${heard.length ? ` Asked for in ${heard.join(', ')}.` : ''}${kept.length ? ` Must be kept out of ${kept.join(', ')}.` : ''}`, 'strong'));
  }

  blocks.push({ t: 'table', table: compact ? mixTableCompact(p) : mixTable(p) });
  // (round 2) returns given to mixes are a suggestion, as sockets are
  if (withReturns(p) && p.mixes.some((x) => x.ret)) blocks.push(para('Stage box returns are the band’s suggestion. On the venue’s own boxes, the venue decides which return each mix uses.', 'muted'));
  if (p.mixes.length) {
    const under = compact ? [] : ['A mono mix is 1 audio channel and a stereo mix is 2.'];
    if (p.mixes.some((x) => Object.keys(x.needs).length)) under.push('“Primary”, “Supporting”, “Not needed” and “Must exclude” are preferences the band gives before the show, not fader values. The engineer builds the real mix at soundcheck.');
    if (under.length) blocks.push(para(under.join(' '), 'muted'));
  }
  // the compact packet lists each device once: in the mix table above and
  // in the equipment table, not a third time here
  if (!compact && p.devices.length) {
    blocks.push(h2('Monitor devices'));
    const n = p.devices.length;
    const allOwn = p.devices.every((d) => d.selfContained);
    if (allOwn) blocks.push(para(n === 1 ? `This device is ${OWN_RIG}.` : `${n === 2 ? 'Both' : `All ${countWord(n)}`} devices are ${OWN_RIG}.`));
    blocks.push({ t: 'table', table: deviceTable(p, allOwn) });
  }
  if (compact) {
    // what the device table alone would have said is kept, in one line
    const said = p.devices.filter((d) => d.model.trim() || d.note.trim() || (!d.mixId && !d.selfContained)).map((d) => `${d.label.trim() || SP_DEVICE_WORD[d.type]}: ${[d.model.trim(), !d.mixId && !d.selfContained ? 'not on a mix' : '', d.note.trim()].filter(Boolean).join(' · ')}`);
    if (said.length) blocks.push({ t: 'list', items: said });
  }
  const none = p.performers.filter((pf) => pf.noMonitor === true).map((pf) => pf.name.trim() || UNNAMED);
  if (none.length) blocks.push(para(`No monitor requested, on purpose: ${none.join(', ')}.`));
  return { id: 'monitors', title: 'Monitor plan', blocks, breakBefore };
}

function equipmentSection(p: SpProject, s: SpSummary, breakBefore: Break, compact: boolean): SpDocSection {
  const rows = equipmentRows(p, s);
  if (!compact) return { id: 'equipment', title: 'Equipment and who supplies it', blocks: [{ t: 'table', table: equipmentTable(rows) }], breakBefore };
  const table: SpDocTable = {
    columns: [col('item', 'Item', 5), col('qty', 'Qty', 0.8, 'center'), col('by', 'Supplied by', 4)],
    rows: rows.map((r) => {
      // one supplier for all of them: its name alone; otherwise how many each
      const who = (Object.keys(r.by) as (keyof SpBySupplier)[]).filter((k) => r.by[k] > 0);
      const row: SpDocRow = { cells: { item: r.item, qty: r.qtyText ?? String(r.qty), by: who.length === 1 ? SP_SUPPLIER_WORD[who[0]] : spSupplierWords(r.by) } };
      if (r.strong) row.strong = true;
      if (r.say) row.note = r.say.charAt(0).toUpperCase() + r.say.slice(1);
      return row;
    }),
    empty: 'No equipment listed yet.',
  };
  return { id: 'equipment', title: 'Equipment and who supplies it', blocks: [{ t: 'table', table }], breakBefore };
}

/** The most open questions the last section may hold and still run on. */
export const SP_SHORT_NOTES = 4;

function notesSection(p: SpProject, issues: SpIssue[], breakBefore: Break): SpDocSection {
  const blocks: SpDocBlock[] = [];
  if (p.notes.trim()) blocks.push(h2('Notes'), ...noteBlocks(p.notes));
  if (p.accessNotes.trim()) blocks.push(h2('Access and setup'), ...noteBlocks(p.accessNotes));
  const fix = spToCorrect(issues);
  if (fix.length) blocks.push(h2('To correct before this document is ready'), { t: 'list', items: fix });
  const open = spUnresolved(issues);
  // with nothing above it, the list is the section: one heading, not two
  const alone = blocks.length === 0;
  if (!alone) blocks.push(h2('Unresolved: to be confirmed'));
  if (open.length) blocks.push({ t: 'list', items: open });
  else blocks.push(para('No open question is recorded in this revision.'));
  // What the packet is, and when it was made, is said on the FIRST page
  // (plotSection): as the last lines here it sent a compact packet onto a
  // sheet of its own (bug test, 2026-11-13).
  // A last section of a few lines runs on under the equipment table: it is
  // not sent to a page of its own while the page before it has room (a
  // renderer still keeps the heading with its first lines).
  const short = alone && open.length <= SP_SHORT_NOTES;
  return { id: 'notes', title: alone ? 'Unresolved: to be confirmed' : 'Notes and unresolved questions', blocks, breakBefore: short ? 'none' : breakBefore };
}

/* ── the document ───────────────────────────────────────────────────────── */

/** One snapshot → the whole packet as data. Reads the snapshot only.
 *
 *  FULL: every section after the plot starts a new page only when less than
 *  a third of the page is left (`breakBefore: 'auto'`), so a short packet is
 *  not padded with blank paper. COMPACT: the sections run on, the position
 *  column and the monitor device table are left out (the plot and the other
 *  two tables already say it), and the text is never made smaller. */
export function spBuildDoc(s: SpSnapshot): SpDoc {
  const p = s.project;
  const kind = s.options.packet;
  const compact = kind === 'compact';
  const issues = spReview(p);
  const stamp = spStamp(p, issues);
  const band = bandName(p);
  const sections: SpDocSection[] = [plotSection(p, stamp, kind, s.generatedAt)];
  if (kind !== 'plot') {
    const summary = spSummary(p);
    const br: Break = compact ? 'none' : 'auto';
    sections.push(inputsSection(p, summary, br, compact), monitorsSection(p, summary, br, compact), equipmentSection(p, summary, br, compact), notesSection(p, issues, br));
  }
  return {
    // the header names everything the packet holds; with no band name it
    // has no name in it (a made-up one is never printed)
    title: `${band ? `${band} — ` : ''}${kind === 'plot' ? 'Stage plot' : 'Stage plot, input list and monitor plan'}`,
    paper: s.options.paper,
    footer: `${band ? `${band} · ` : ''}Revision ${p.revision}`,
    stamp,
    sections,
    fileName: spFileName(p),
    revision: p.revision,
    generatedAt: s.generatedAt,
  };
}

/* ── the structured text view ───────────────────────────────────────────── */

function tableText(t: SpDocTable): string[] {
  if (!t.rows.length) return [t.empty];
  const out: string[] = [];
  for (const r of t.rows) {
    const cells = t.columns.map((c) => ({ c, v: (r.cells[c.key] ?? '').trim() })).filter((x) => x.v && x.v !== DASH);
    out.push(`- ${cells.map((x) => `${x.c.label}: ${x.v}`).join('; ')}`);
    if (r.note) out.push(`  ${r.note}`);
  }
  return out;
}

/** A plot item's boxed references, in words: ". Input channels 1–6",
 *  ". Monitor mix M3". */
function badgeWords(badges: string[]): string {
  const house = badges.filter((b) => /^\d/.test(b));
  const band = badges.filter((b) => /^B\d/.test(b));
  const open = badges.filter((b) => b === '?');
  const mixes = badges.filter((b) => !house.includes(b) && !band.includes(b) && b !== '?');
  const many = (list: string[]): boolean => list.length > 1 || /–/.test(list[0] ?? '');
  const out: string[] = [];
  if (house.length) out.push(`Input channel${many(house) ? 's' : ''} ${house.join(', ')}`);
  if (band.length) out.push(`Band monitor rig channel${many(band) ? 's' : ''} ${band.join(', ')}`);
  if (open.length) out.push('Input channel not numbered yet');
  if (mixes.length) out.push(`Monitor mix${mixes.length > 1 ? 'es' : ''} ${mixes.join(', ')}`);
  return out.map((x) => `. ${x}`).join('');
}

function plotText(plot: SpDocPlot): string[] {
  const out: string[] = [
    `Stage size: ${plot.sizeNote}.`,
    plot.deck?.shape === 'round'
      ? plot.deck.stage.roundSides === 'clock'
        ? `The drawing, in words (in the round, in clock positions: 12 o’clock is the ${plot.deck.stage.roundRef} side, at the bottom of the drawing):`
        : plot.deck.stage.roundSides === 'numbered'
          ? `The drawing, in words (in the round, by numbered sides: side 1 is the ${plot.deck.stage.roundRef} side, at the bottom of the drawing):`
          : `The drawing, in words (in the round: said from the ${plot.deck.stage.roundRef} side, at the bottom of the drawing):`
      : 'The drawing, in words (upstage is the back of the stage; downstage is the edge nearest the audience):',
  ];
  if (!plot.items.length) out.push('Nothing is placed on the stage yet.');
  // (the drawing lists people last, so they are drawn over a stool; a reader hears them first)
  for (const i of [...plot.items.filter((x) => x.person), ...plot.items.filter((x) => !x.person)]) {
    // (a shaped plot's own space starts at its outer corner: back to the main stage)
    const dk = plot.deck;
    const where = dk ? spLocationWord({ x: (i.at.x - dk.origin.x) / dk.mainW, y: (i.at.y - dk.origin.y) / dk.mainD }, { ...dk.stage, unit: 'ft', dims: 'estimated', grid: false, snap: false }) : spLocationWord({ x: i.at.x / plot.widthM, y: i.at.y / plot.depthM });
    out.push(`- ${spPlotItemName(i) || (i.tag ? `${i.tag} symbol` : 'An object with no name')}: ${lower(where)}${badgeWords(i.badges)}`);
  }
  if (plot.key.length) out.push(`Key: ${plot.key.map((k) => k.name).join('; ')}.`);
  if (plot.viewNote) out.push(`Viewpoint: ${plot.viewNote}`);
  out.push(...plot.legend);
  return out;
}

/** The packet as structured text: every heading, every row, every note, in
 *  reading order. For a screen reader and for copying. */
export function spDocText(d: SpDoc): string {
  const out: string[] = [d.title.toUpperCase()];
  if (d.stamp) out.push(d.stamp);
  out.push(d.footer);
  for (const s of d.sections) {
    out.push('', s.title.toUpperCase());
    for (const b of s.blocks) {
      if (b.t === 'heading') out.push('', `${b.text}:`);
      else if (b.t === 'para') out.push(b.text);
      else if (b.t === 'facts') for (const [k, v] of b.rows) out.push(`${k}: ${v}`);
      else if (b.t === 'list') for (const item of b.items) out.push(`- ${item}`);
      else if (b.t === 'table') out.push(...tableText(b.table));
      else out.push(...plotText(b.plot));
    }
  }
  return out.join('\n');
}

/* ── the PDF file, as bytes ─────────────────────────────────────────────── */

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Bytes as base64 text: how a phone's file system is given a binary file.
 *  Written out here so it is the same on every engine (no `btoa`, no Buffer). */
export function spBase64(bytes: Uint8Array): string {
  const out: string[] = [];
  let chunk = '';
  for (let n = 0; n < bytes.length; n += 3) {
    const a = bytes[n];
    const b = n + 1 < bytes.length ? bytes[n + 1] : 0;
    const c = n + 2 < bytes.length ? bytes[n + 2] : 0;
    chunk += B64[a >> 2] + B64[((a & 3) << 4) | (b >> 4)] + (n + 1 < bytes.length ? B64[((b & 15) << 2) | (c >> 6)] : '=') + (n + 2 < bytes.length ? B64[c & 63] : '=');
    if (chunk.length >= 8192) {
      out.push(chunk);
      chunk = '';
    }
  }
  out.push(chunk);
  return out.join('');
}

/** How many pages a PDF made by spPdf.ts has: read from its page tree
 *  (`/Type /Pages … /Count N`). 0 when the bytes are not such a file. */
export function spPdfPageCount(bytes: Uint8Array): number {
  for (let n = 0; n < bytes.length; n += 4096) {
    let chunk = '';
    const end = Math.min(bytes.length, n + 4096 + 4096);
    for (let k = n; k < end; k += 1) chunk += String.fromCharCode(bytes[k]);
    const m = /\/Type \/Pages\b[^>]*?\/Count (\d+)/.exec(chunk);
    if (m) return Number(m[1]);
  }
  return 0;
}
