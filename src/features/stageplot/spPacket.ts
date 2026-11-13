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
  SP_PRIORITY_WORD,
  SP_PROVIDER_WORD,
  SP_STAND_WORD,
  SP_SUPPLIER_WORD,
  SP_VENUE_FEED_WORD,
} from './spCatalog.ts';
import { spAllInputsInOrder, spBadge, spDeviceCountWord, spInputSupplier, spMixesOf, spPatchRows, spSummary, spSupplierWords, type SpBySupplier, type SpSummary } from './spDerive.ts';
import type { SpDoc, SpDocBlock, SpDocColumn, SpDocKeyItem, SpDocPlot, SpDocPlotItem, SpDocRow, SpDocSection, SpDocTable } from './spDocTypes.ts';
import { spEdit, spFreeze, spInputLocation, spLocationWord, spMix, spObjectOfInput, spPerformer } from './spModel.ts';
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
export const SP_PAPER_WORD = { letter: 'US Letter', a4: 'A4' } as const;

const bandName = (p: SpProject): string => p.band.trim() || 'Untitled band';

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

const sameContent = (a: SpProject, b: SpProject): boolean => JSON.stringify({ ...a, modifiedAt: 0, frozenRevision: 0 }) === JSON.stringify({ ...b, modifiedAt: 0, frozenRevision: 0 });

/** What a finished export does to the project (pass it to the editor's
 *  `apply`). The revision that was shared is frozen, so the next real edit
 *  moves the revision on. No other field changes.
 *
 *  If the project was edited WHILE the export was being made, those edits
 *  are not in the pages that went out: they are moved to the next revision
 *  here, so the number that was shared keeps meaning what was shared. */
export function spAfterExport(current: SpProject, snap: SpSnapshot): SpProject {
  const sent = snap.project;
  if (current.id !== sent.id || current.revision !== sent.revision) return current;
  if (sameContent(current, sent)) return current.frozenRevision >= current.revision ? current : spFreeze(current);
  return spEdit(spFreeze(current), () => undefined);
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
 *  project has no event date (handoff §7). */
export function spFileName(p: SpProject): string {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(p.eventDate.trim()) ? `${p.eventDate.trim()}_` : '';
  return `${fileWord(p.band) || 'Band'}_StagePlot_${date}Rev${String(p.revision).padStart(2, '0')}.pdf`;
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
  const c = spShownContact(p);
  const reach = [c.email, c.phone].filter(Boolean).join(' or ');
  const contact = c.name ? `${c.name}${reach ? ` (${reach})` : ''}` : reach ? `us at ${reach}` : 'us';
  const band = bandName(p);
  return {
    subject: `${band}: stage plot, input list and monitor plan${event ? ` for ${event}` : ''} (revision ${p.revision})`,
    body: `Attached is our stage plot, input list, and monitor plan${event ? ` for ${event}` : ''}. The packet identifies what we bring and what we are requesting from the venue. Please confirm any substitutions or unresolved details with ${contact}. Revision ${p.revision}. Thank you.`,
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
 *  same words are not repeated at the start of every line. */
export function spUnresolved(issues: SpIssue[]): string[] {
  const out: string[] = [];
  for (const i of issues) {
    if (i.level !== 'open' && i.level !== 'ask') continue;
    const text = i.text.replace(/^To be confirmed — /, '');
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

/** The tallest this plot is drawn, in points. */
export function spPlotMaxH(plot: { items?: readonly { person: boolean }[] }): number {
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

/** Points per meter for a plot drawn `width` points wide. With the plot's
 *  `items` it applies the small-stage rule (`spPlotMaxH`). */
export function spPlotScale(plot: Pick<SpDocPlot, 'widthM' | 'depthM' | 'marginM'> & { items?: readonly { person: boolean }[] }, width: number): number {
  return Math.min((width - SP_PLOT_SIDE * 2) / (plot.widthM + plot.marginM * 2), spPlotMaxH(plot) / (plot.depthM + plot.marginM * 2));
}

type Box = { x0: number; y0: number; x1: number; y1: number };

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
  else if (!label && o.deviceId) {
    const d = p.devices.find((x) => x.id === o.deviceId);
    label = d ? d.label.trim() || SP_DEVICE_WORD[d.type] : '';
  }
  const size = o.sizeNote.trim();
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

/** The stage plot as data: every stage object, placed, with the name printed
 *  beside it and its references (input channels, monitor mixes). */
export function spPlotDoc(p: SpProject, brief = false): SpDocPlot {
  const st = spStageMeters(p);

  // which symbol each input is shown at: the same answer "Locate on stage" gives
  const inputsAt = new Map<SpId, string[]>();
  for (const i of spAllInputsInOrder(p)) {
    const o = spObjectOfInput(p, i.id);
    if (!o) continue;
    inputsAt.set(o.id, [...(inputsAt.get(o.id) ?? []), spBadge(p, i.id)]);
  }

  type Draft = SpDocPlotItem & { box: Box; sized: boolean };
  // sized kinds (risers, labeled boxes) first: they are drawn under the rest
  const objects = [...p.objects].sort((a, b) => Number(spIsSized(b.kind)) - Number(spIsSized(a.kind)));
  const drafts: Draft[] = objects.map((o) => {
    const b = spObjectBoxM(p, o);
    const at = { x: b.cx, y: b.cy };
    const shapes = spPlacedShapes(p, o);
    const badges = spBadgeRuns(inputsAt.get(o.id) ?? []);
    const mixCodes: string[] = [];
    if (o.performerId) for (const m of spMixesOf(p, o.performerId)) mixCodes.push(m.code);
    if (o.deviceId) {
      const d = p.devices.find((x) => x.id === o.deviceId);
      const m = d ? spMix(p, d.mixId) : undefined;
      if (m) mixCodes.push(m.code);
    }
    for (const c of mixCodes) if (c && !badges.includes(c)) badges.push(c);
    return { id: o.id, shapes, tag: spSymbol(o.kind).tag, at, label: objectLabel(p, o), labelAt: at, badges, person: o.kind === 'performer', box: shapesBox(shapes, at), sized: spIsSized(o.kind) };
  });

  // Where each name goes: under its symbol, unless that place is taken; then
  // above, to one side, or a little farther off. A riser's name goes INSIDE
  // its box. Worked out at the printed size, so every renderer puts the name
  // in the same place.
  let symbolOver = 0;
  for (const d of drafts) symbolOver = Math.max(symbolOver, -d.box.x0, d.box.x1 - st.width, -d.box.y0, d.box.y1 - st.depth);
  const symbolMargin = Math.max(0.6, Math.round((symbolOver + 0.15) * 100) / 100);
  let marginM = symbolMargin;
  for (let pass = 0; pass < 4; pass += 1) {
    const k = spPlotScale({ widthM: st.width, depthM: st.depth, marginM, items: drafts }, SP_PLOT_NOMINAL_W);
    const gap = 3 / k;
    const taken: Box[] = [];
    // the part of the page the drawing has: a name is kept inside it
    const page: Box = { x0: -marginM, y0: -marginM, x1: st.width + marginM, y1: st.depth + marginM };
    const stageBox: Box = { x0: 0, y0: 0, x1: st.width, y1: st.depth };
    // people first, then the platforms, then the longest names: a short name
    // fits almost anywhere
    const order = [...drafts].sort((a, b) => Number(b.person) - Number(a.person) || Number(b.sized) - Number(a.sized) || spLabelBlock(b).w - spLabelBlock(a).w);
    for (const d of order) {
      const size = spLabelBlock(d);
      const w = size.w / k;
      const h = size.h / k;
      if (!size.h) {
        d.labelAt = { x: d.at.x, y: d.box.y1 + gap };
        continue;
      }
      const b = d.box;
      const cx = d.at.x;
      const cy = d.at.y;
      // each spot is the row's left edge and top
      const around: [number, number][] = [
        [cx - w / 2, b.y1 + gap],
        [cx - w / 2, b.y0 - gap - h],
        [b.x1 + gap, cy - h / 2],
        [b.x0 - gap - w, cy - h / 2],
        [b.x1 + gap, b.y1 - h],
        [b.x0 - gap - w, b.y1 - h],
        [b.x1 + gap, b.y0],
        [b.x0 - gap - w, b.y0],
        [cx, b.y1 + gap],
        [cx - w, b.y1 + gap],
        [cx, b.y0 - gap - h],
        [cx - w, b.y0 - gap - h],
        [cx - w / 2, b.y1 + gap * 2 + h],
        [cx - w / 2, b.y0 - gap * 2 - h * 2],
        // the four corners, clear of the symbol on both sides
        [b.x1 + gap, b.y1 + gap],
        [b.x0 - gap - w, b.y1 + gap],
        [b.x1 + gap, b.y0 - gap - h],
        [b.x0 - gap - w, b.y0 - gap - h],
      ];
      // a platform that is big enough carries its name inside, in a corner
      const fits = d.sized && w + gap * 2 <= b.x1 - b.x0 && h + gap * 2 <= b.y1 - b.y0;
      const inside: [number, number][] = fits
        ? [
            [b.x0 + gap, b.y0 + gap],
            [b.x1 - gap - w, b.y0 + gap],
            [b.x0 + gap, b.y1 - gap - h],
            [b.x1 - gap - w, b.y1 - gap - h],
            [cx - w / 2, b.y0 + gap],
            [cx - w / 2, b.y1 - gap - h],
          ]
        : [];
      const spots = [...inside, ...around];
      let best = spots[0];
      let bestCost = Infinity;
      spots.forEach((s, n) => {
        // a row that would reach past the drawing is moved back inside, as
        // the renderers do, so the spot is judged where it will be drawn
        if (w < page.x1 - page.x0) s[0] = Math.max(page.x0, Math.min(page.x1 - w, s[0]));
        s[1] = Math.max(page.y0, Math.min(page.y1 - h, s[1]));
        const box: Box = { x0: s[0], y0: s[1], x1: s[0] + w, y1: s[1] + h };
        const area = w * h;
        // the first spot is the usual one; a spot is worse the more of the
        // row lies over another name (worst), over a symbol, or off the page.
        // A place outside its own platform is a last resort.
        let cost = n * 0.03 + (inside.length && n >= inside.length ? 1.5 : 0);
        cost += 3 * (1 - overlap(box, page) / area);
        // a name half on the stage and half off it has the outline through it
        const on = overlap(box, stageBox) / area;
        if (on > 0.02 && on < 0.98) cost += 1;
        // two names keep a small gap between them, so one does not run into the next
        const padded: Box = { x0: box.x0 - gap, y0: box.y0 - gap / 2, x1: box.x1 + gap, y1: box.y1 + gap / 2 };
        for (const t of taken) {
          const o = overlap(padded, t);
          if (o > 0) cost += 2 + (4 * o) / area;
        }
        for (const other of drafts) if (other !== d && !other.sized) cost += ((other.person ? 4 : 3) * overlap(box, other.box)) / area;
        if (cost < bestCost) {
          bestCost = cost;
          best = s;
        }
      });
      taken.push({ x0: best[0], y0: best[1], x1: best[0] + w, y1: best[1] + h });
      d.labelAt = { x: best[0] + size.labelW / k / 2, y: best[1] };
    }
    // room around the stage, so anything off the stage (and its name) shows.
    // Names may ask for a little more room than the symbols, never without
    // limit: a renderer moves a name that still reaches the edge back inside.
    let over = 0;
    for (const b of taken) over = Math.max(over, -b.x0, b.x1 - st.width, -b.y0, b.y1 - st.depth);
    const need = Math.min(symbolMargin + 0.6, Math.max(symbolMargin, Math.round((over + 0.05) * 100) / 100));
    if (need <= marginM + 0.01) break;
    marginM = need;
  }

  const items: SpDocPlotItem[] = drafts.map((d) => ({ id: d.id, shapes: d.shapes, tag: d.tag, at: d.at, label: d.label, labelAt: d.labelAt, badges: d.badges, person: d.person }));
  const grid = printedGrid(p, st.width, st.toScale);
  const unit = p.stage.unit;
  const sizeNote = st.toScale ? `${num(p.stage.width ?? 0)} ${unit} × ${num(p.stage.depth ?? 0)} ${unit} (${p.stage.dims})` : 'Not to scale';

  // What the drawing means, in words. `brief` (the compact packet) says the
  // same things in fewer words and as one entry, to keep a small act's
  // packet on one sheet; nothing a reader needs is left out.
  const badges = items.flatMap((i) => i.badges);
  const quiet = spAllInputsInOrder(p)
    .filter((i) => i.audience === 'monitor-only')
    .map((i) => inputName(p, i.id));
  const tags = [...new Set(items.map((i) => i.tag).filter((x) => TAG_WORDS[x]))].map((x) => TAG_WORDS[x]);
  const offstage = p.objects.some((o) => o.x < 0 || o.x > 1 || o.y < 0 || o.y > 1);
  const legend: string[] = [];
  legend.push(
    brief
      ? 'Seen from the audience: the audience is at the bottom, and stage right is on the left of this drawing.'
      : 'Seen from the audience: the audience is at the bottom. Stage right and stage left are the performers’ own right and left, so stage right is on the left of this drawing.',
  );
  if (badges.length) {
    const lines = [brief ? 'A number in a box is an input channel. A code in a rounded box, such as M1, is a monitor mix.' : 'A number in a box is an input channel in the input list. A code in a rounded box, such as M1, is a monitor mix.'];
    if (badges.some((b) => /^B\d/.test(b))) lines.push('A number with B is a channel of the band monitor rig.');
    legend.push(lines.join(' '));
  }
  // an exclusion is visible on every export, the plot alone included
  if (quiet.length) legend.push(`${joinAnd(quiet)} ${quiet.length === 1 ? 'is' : 'are'} monitor only: kept out of the audience mix.`);
  if (tags.length) legend.push(`${tags.join('. ')}.`);
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

  return { widthM: st.width, depthM: st.depth, toScale: st.toScale, sizeNote, marginM, gridM: grid.stepM, items, viewNote: p.viewNote.trim(), legend: said, key };
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

/** What captures the sound, in as few words as say it. Only what differs
 *  from the usual is printed: the priority when it is not "preferred", the
 *  connector when it is not an XLR on a microphone, DI or wireless row, and
 *  phantom power when it is required, must not be applied, or is still to
 *  be confirmed by someone other than the venue (the venue is not asked
 *  about its own microphones). */
function captureCell(p: SpProject, i: SpInput): string {
  const word = SP_CAPTURE_WORD[i.capture];
  const eq = i.equipment.trim();
  const parts: string[] = [eq && eq.toLowerCase() !== word.toLowerCase() ? `${word}: ${eq}` : word];
  if (i.priority === 'required') parts.push('REQUIRED');
  else if (i.priority === 'flexible') parts.push(lower(SP_PRIORITY_WORD.flexible));
  const connector = i.connector.trim();
  const usual = /^xlr$/i.test(connector) && (i.capture === 'mic' || i.capture === 'di' || i.capture === 'wireless');
  if (connector && !usual) parts.push(connector);
  if (i.level.trim()) parts.push(i.level.trim());
  if (i.phantom === 'required') parts.push('phantom power required');
  else if (i.phantom === 'do-not-apply') parts.push('phantom power: do not apply');
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

/** Where an input is, in the list: its PERFORMER's own position, so one
 *  person is never given two positions in one packet; an input with no
 *  performer is where its own symbol is. */
function whoCell(p: SpProject, i: SpInput, performerName: string, sourceLabel: string, compact: boolean): string {
  const source = p.sources.find((s) => s.id === i.sourceId);
  const note = source?.locationNote.trim() ?? '';
  const pf = spPerformer(p, source?.performerId ?? null);
  if (pf) {
    const o = p.objects.find((x) => x.performerId === pf.id && x.kind === 'performer') ?? p.objects.find((x) => x.performerId === pf.id);
    return [performerName || pf.name.trim() || UNNAMED, compact ? '' : o ? spLocationWord(o) : 'Not placed on the stage yet', note].filter(Boolean).join(' · ');
  }
  const where = spInputLocation(p, i.id) || (source?.offstage ? 'Off the stage' : 'Not placed on the stage yet');
  return [sourceLabel && sourceLabel !== i.label ? sourceLabel : '', where, note].filter(Boolean).join(' · ');
}

/** The house list (and any list that is not the band's own rig): one row for
 *  each input, with everything the house needs to plug it in. */
function inputTable(p: SpProject, patchId: 'house' | 'band', compact: boolean): SpDocTable {
  const rows = spPatchRows(p, patchId);
  const withVenue = rows.some((r) => r.venue.trim());
  const columns: SpDocColumn[] = [
    col('ch', 'Ch', 0.7, 'center'),
    col('input', 'Input', 2.2),
    compact ? col('who', 'Performer', 1.8) : col('who', 'Performer and position', 2.6),
    col('capture', 'Capture and equipment', compact ? 3.6 : 3.2),
    col('stand', 'Stand', 1.6),
    col('supplier', 'Supplied by', 1.9),
    col('audience', 'Audience mix', 2),
  ];
  if (withVenue) columns.push(col('venue', 'Venue channel', 2));
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
    const row: SpDocRow = { cells };
    if (i.priority === 'required' || i.audience === 'monitor-only') row.strong = true;
    const note = inputNote(i);
    if (note) row.note = note;
    return row;
  });
  return { columns, rows: docRows, empty: 'No inputs yet.' };
}

/** The band's own rig: four columns. An input that is also in the house list
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
      : [captureCell(p, i), i.stand === 'none' ? '' : standCell(i), `Supplied by: ${supplierCell(p, i)}`, i.audience === 'monitor-only' ? MONITOR_ONLY : '', r.venue.trim() ? `Venue channel: ${r.venue.trim()}` : '', inputNote(i)];
    const row: SpDocRow = { cells: { ch: r.number != null ? String(r.number) : DASH, input: i.label, house: inHouse ? (n != null ? String(n) : DASH) : 'Band rig only', notes: own.filter(Boolean).join(' · ') } };
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
function mixTableCompact(p: SpProject): SpDocTable {
  const columns = [col('mix', 'Mix', 2.2), col('who', 'For', 1.8), col('format', 'Format and delivery', 2.9), col('by', 'Who creates it', 2.4), col('devices', 'Devices', 3.3)];
  const rows: SpDocRow[] = p.mixes.map((m) => {
    const who = m.recipients.map((id) => spPerformer(p, id)?.name.trim() || UNNAMED).join(', ') || (m.delivery === 'drum-fill' || m.delivery === 'sidefill' ? 'The stage' : 'Nobody yet');
    const devices = p.devices.filter((d) => d.mixId === m.id).map((d) => `${d.label.trim() || SP_DEVICE_WORD[d.type]} (${SP_SUPPLIER_WORD[d.supplier]})`);
    const own = m.provider === 'band-console' || m.provider === 'personal-mixer';
    const row: SpDocRow = {
      cells: {
        mix: [m.code, m.name.trim()].filter(Boolean).join(' '),
        who,
        format: `${m.format === 'stereo' ? 'Stereo' : 'Mono'}, ${lower(SP_DELIVERY_WORD[m.delivery])}`,
        by: own ? `${SP_PROVIDER_WORD[m.provider]}. The venue provides: ${lower(SP_VENUE_FEED_WORD[m.venueFeed])}` : SP_PROVIDER_WORD[m.provider],
        devices: [devices.join('; '), m.outputs.trim() ? `Requested outputs: ${m.outputs.trim()}` : ''].filter(Boolean).join('. '),
      },
    };
    const note = [m.instructions.length ? `Asked to hear: ${m.instructions.join('; ')}` : '', mixNote(p, m)].filter(Boolean).join(' · ');
    if (note) row.note = note;
    return row;
  });
  return { columns, rows, empty: 'No monitor mixes yet.' };
}

function mixTable(p: SpProject): SpDocTable {
  const columns = [col('mix', 'Mix', 2), col('who', 'For', 2), col('format', 'Format', 1.1), col('by', 'Who creates it', 2.2), col('delivery', 'Delivery and devices', 3), col('asks', 'Asked to hear', 2.7)];
  const rows: SpDocRow[] = p.mixes.map((m) => {
    const who = m.recipients.map((id) => spPerformer(p, id)?.name.trim() || UNNAMED).join(', ') || (m.delivery === 'drum-fill' || m.delivery === 'sidefill' ? 'The stage' : 'Nobody yet');
    const devices = p.devices.filter((d) => d.mixId === m.id).map((d) => `${d.label.trim() || SP_DEVICE_WORD[d.type]} (${SP_SUPPLIER_WORD[d.supplier]})`);
    const delivery = [SP_DELIVERY_WORD[m.delivery], devices.join('; '), m.outputs.trim() ? `Requested outputs: ${m.outputs.trim()}` : ''].filter(Boolean).join('. ');
    const feed = `The venue provides: ${lower(SP_VENUE_FEED_WORD[m.venueFeed])}`;
    const by =
      m.provider === 'band-console'
        ? `${SP_PROVIDER_WORD[m.provider]} (the band’s own rig). ${feed}`
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
    const note = mixNote(p, m);
    if (note) row.note = note;
    return row;
  });
  return { columns, rows, empty: 'No monitor mixes yet.' };
}

function deviceTable(p: SpProject): SpDocTable {
  const columns = [col('device', 'Device', 2.6), col('type', 'Type', 2.4), col('mix', 'Mix', 1.6), col('who', 'Used by', 1.8), col('supplier', 'Supplied by', 1.6), col('notes', 'Notes', 3)];
  const rows: SpDocRow[] = p.devices.map((d) => {
    const m = spMix(p, d.mixId);
    const notes = [d.model.trim(), d.wireless ? 'Wireless: coordination required' : '', d.selfContained ? 'Part of the band’s own rig: nothing asked of the venue’s monitor system' : '', d.note.trim()].filter(Boolean).join(' · ');
    return {
      cells: {
        device: d.label.trim() || SP_DEVICE_WORD[d.type],
        type: SP_DEVICE_WORD[d.type],
        mix: m ? m.code : d.selfContained ? 'Band’s own rig' : 'Not on a mix',
        who: spPerformer(p, d.performerId)?.name.trim() ?? '',
        supplier: SP_SUPPLIER_WORD[d.supplier],
        notes,
      },
    };
  });
  return { columns, rows, empty: 'No monitor devices listed yet.' };
}

const EXTRA_WORD: Record<SpProject['extras'][number]['kind'], string> = { 'stage-box': 'Stage box', split: 'Split', backline: 'Backline', riser: 'Riser', power: 'Power location', other: 'Other item' };

type EquipRow = { item: string; qty: number; by: SpBySupplier; notes: string; strong: boolean; say: string };

/** Every listed item once, with who supplies how many. `say` is the part of
 *  its notes that must also be printed in the compact form. */
function equipmentRows(p: SpProject, s: SpSummary): EquipRow[] {
  const rows: EquipRow[] = [];
  const add = (item: string, qty: number, by: SpBySupplier, notes: string, strong = false, say = '') => rows.push({ item, qty, by, notes, strong, say });
  for (const kind of ['mic', 'wireless'] as const) {
    for (const l of kind === 'mic' ? s.microphoneLines : s.wirelessLines) {
      const notes = [
        l.required ? `${l.required} REQUIRED` : '',
        kind === 'wireless' ? 'Coordination required' : '',
        l.alternatives.length ? `Acceptable alternatives (not extra items): ${l.alternatives.join('; ')}` : '',
      ]
        .filter(Boolean)
        .join(' · ');
      add(`${SP_CAPTURE_WORD[kind]}: ${l.name}`, l.qty, l.bySupplier, notes, l.required > 0, [l.required ? `${l.required} REQUIRED` : '', kind === 'wireless' ? 'coordination required' : ''].filter(Boolean).join(', '));
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
    const feeds = p.inputs.filter((i) => i.diDeviceId === d.id).map((i) => i.label);
    const by = noSupplier();
    by[d.supplier] = 1;
    add(`DI device: ${d.label}${d.model.trim() ? ` (${d.model.trim()})` : ''}`, 1, by, [d.channels === 2 ? 'Stereo: 2 DI channels' : 'Mono: 1 DI channel', kind, feeds.length ? `For ${feeds.join(', ')}` : ''].filter(Boolean).join(' · '));
  }
  const loose = p.inputs.filter((i) => i.capture === 'di' && !i.diDeviceId);
  if (loose.length) add('DI channels with no DI device chosen', loose.length, countInputs(p, loose), `Device arrangement to be confirmed: ${loose.map((i) => i.label).join(', ')}`);
  for (const t of Object.keys(s.monitors.devices) as SpDeviceType[]) {
    const n = s.monitors.devices[t];
    if (!n) continue;
    const mine = p.devices.filter((d) => d.type === t);
    const radio = mine.some((d) => d.wireless);
    add(SP_DEVICE_WORD[t], n, s.monitors.devicesBySupplier[t], [mine.map((d) => d.label.trim()).filter(Boolean).join(', '), radio ? 'Wireless: coordination required' : ''].filter(Boolean).join(' · '), false, radio ? 'wireless: coordination required' : '');
  }
  for (const e of p.extras) {
    const by = noSupplier();
    by[e.supplier] = e.qty;
    add(e.label.trim() || EXTRA_WORD[e.kind], e.qty, by, e.note.trim(), false, e.note.trim());
  }
  return rows;
}

function equipmentTable(rows: EquipRow[]): SpDocTable {
  const columns = [col('item', 'Item', 3.8), col('qty', 'Qty', 0.8, 'center'), col('band', 'Band', 0.9, 'center'), col('venue', 'Venue', 0.9, 'center'), col('other', 'Other', 0.9, 'center'), col('tbc', 'To be confirmed', 2.1, 'center'), col('notes', 'Notes', 4)];
  return {
    columns,
    rows: rows.map((r) => {
      const row: SpDocRow = { cells: { item: r.item, qty: String(r.qty), ...supplierCells(r.by), notes: r.notes } };
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

function plotSection(p: SpProject, stamp: string, kind: SpPacketKind): SpDocSection {
  const compact = kind !== 'full';
  const facts: [string, string][] = [['Band', bandName(p)]];
  if (p.title.trim()) facts.push(['Stage plot', p.title.trim()]);
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

  const blocks: SpDocBlock[] = [{ t: 'facts', rows: facts }, { t: 'plot', plot: spPlotDoc(p, kind === 'compact') }];

  const stageNotes = p.objects.filter((o) => o.note.trim()).map((o) => `${objectLabel(p, o) || 'An object with no name'}: ${o.note.trim()}`);
  if (stageNotes.length) blocks.push(h2('Notes on the stage'), { t: 'list', items: stageNotes });

  const rows = p.performers.map((pf) => {
    const o = p.objects.find((x) => x.performerId === pf.id && x.kind === 'performer') ?? p.objects.find((x) => x.performerId === pf.id);
    const mixes = spMixesOf(p, pf.id).map((m) => m.code);
    const ownRig = p.devices.some((d) => d.performerId === pf.id && d.selfContained);
    return {
      name: pf.name.trim() || UNNAMED,
      role: pf.role.trim(),
      where: o ? spLocationWord(o) : 'Not placed on the stage yet',
      mix: mixes.length ? mixes.join(', ') : ownRig ? 'Band’s own rig' : pf.noMonitor === true ? 'None requested' : 'To be confirmed',
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
    const routing = h.monitorOnly || h.audienceTbc ? `${h.audience} for the audience mix, ${h.monitorOnly} monitor only${quiet.length ? ` (${quiet.join(', ')})` : ''}${h.audienceTbc ? `, ${h.audienceTbc} with the audience routing to be confirmed` : ''}` : 'all for the audience mix';
    const first = [`${plural(h.channels, 'input channel')} to the house system: ${routing}.`];
    if (s.band) first.push(`${plural(s.band.channels, 'input channel')} to the band monitor rig.`);
    const second = [`${plural(s.microphones, 'microphone')}.`, s.di.summary];
    if (s.wirelessInputs) second.push(`${plural(s.wirelessInputs, 'wireless receiver output')}: coordination required.`);
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
    if (patch.reserved.length) blocks.push(para(`${patch.name}: channels kept free on purpose: ${patch.reserved.join(', ')}.`, 'muted'));
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
  const wireless = m.wirelessDevices ? `${plural(m.wirelessDevices, 'wireless monitor device')}: coordination required. This packet lists no radio frequencies.` : '';
  // The headline never adds the band's own mixes to what the house is asked
  // for: "feed" would read as something the house sends.
  const head = `${plural(m.all.mixes, 'monitor mix', 'monitor mixes')} (${m.all.mono} mono, ${m.all.stereo} stereo). Asked of the house console: ${plural(m.house.mixes, 'mix', 'mixes')}, ${plural(m.house.channels, 'audio channel')}.`;
  const apart: string[] = [];
  if (m.bandOwned.mixes) apart.push(`Created in the band’s own rig, and not asked of the house console: ${plural(m.bandOwned.mixes, 'mix', 'mixes')} (${plural(m.bandOwned.channels, 'audio channel')} inside that rig).`);
  if (m.byProvider.tbc.mixes) apart.push(`For ${plural(m.byProvider.tbc.mixes, 'mix', 'mixes')}, who creates the mix is to be confirmed.`);
  if (compact) {
    // ONE line of totals, then the table: no explaining paragraphs
    if (p.mixes.length) blocks.push(para([head, ...apart, wireless].filter(Boolean).join(' '), 'strong'));
    else if (wireless) blocks.push(para(wireless));
  } else {
    if (p.mixes.length) {
      blocks.push(para(head, 'strong'));
      const more = [...apart];
      if (m.house.channels) more.push(`If each audio channel is carried on its own analog console output, that is ${plural(m.house.channels, 'output')}. The real number depends on how the venue sends the feeds to the stage: to be confirmed with the venue.`);
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
  if (p.mixes.length) {
    const under = compact ? [] : ['A mono mix is 1 audio channel and a stereo mix is 2.'];
    if (p.mixes.some((x) => Object.keys(x.needs).length)) under.push('“Primary”, “Supporting”, “Not needed” and “Must exclude” are preferences the band gives before the show, not fader values. The engineer builds the real mix at soundcheck.');
    if (under.length) blocks.push(para(under.join(' '), 'muted'));
  }
  // the compact packet lists each device once: in the mix table above and
  // in the equipment table, not a third time here
  if (!compact && p.devices.length) blocks.push(h2('Monitor devices'), { t: 'table', table: deviceTable(p) });
  else if (compact) {
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
      const row: SpDocRow = { cells: { item: r.item, qty: String(r.qty), by: who.length === 1 ? SP_SUPPLIER_WORD[who[0]] : spSupplierWords(r.by) } };
      if (r.strong) row.strong = true;
      if (r.say) row.note = r.say.charAt(0).toUpperCase() + r.say.slice(1);
      return row;
    }),
    empty: 'No equipment listed yet.',
  };
  return { id: 'equipment', title: 'Equipment and who supplies it', blocks: [{ t: 'table', table }], breakBefore };
}

function notesSection(p: SpProject, issues: SpIssue[], generatedAt: number, breakBefore: Break): SpDocSection {
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
  const made = spMomentWords(generatedAt);
  blocks.push(para(`This packet records what the band is requesting, for discussion with the venue. It is not a confirmation by the venue.${made ? ` Made ${made}.` : ''}`, 'muted'));
  return { id: 'notes', title: alone ? 'Unresolved: to be confirmed' : 'Notes and unresolved questions', blocks, breakBefore };
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
  const sections: SpDocSection[] = [plotSection(p, stamp, kind)];
  if (kind !== 'plot') {
    const summary = spSummary(p);
    const br: Break = compact ? 'none' : 'auto';
    sections.push(inputsSection(p, summary, br, compact), monitorsSection(p, summary, br, compact), equipmentSection(p, summary, br, compact), notesSection(p, issues, s.generatedAt, br));
  }
  return {
    title: `${band} — ${kind === 'plot' ? 'Stage plot' : 'Stage plot and input list'}`,
    paper: s.options.paper,
    footer: `${band} · Revision ${p.revision}`,
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

function plotText(plot: SpDocPlot): string[] {
  const out: string[] = [`Stage size: ${plot.sizeNote}.`, 'The drawing, in words (upstage is the back of the stage; downstage is the edge nearest the audience):'];
  if (!plot.items.length) out.push('Nothing is placed on the stage yet.');
  for (const i of plot.items) {
    const where = spLocationWord({ x: i.at.x / plot.widthM, y: i.at.y / plot.depthM });
    out.push(`- ${i.label || (i.tag ? `${i.tag} symbol` : 'An object with no name')}: ${where}${i.badges.length ? `. References: ${i.badges.join(', ')}` : ''}`);
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
