/**
 * stageplot/stage/stageGeom — the pure geometry between the STAGE (fractions
 * of its width and depth, as the project stores them) and the GLASS (points),
 * for the top-down stage editor. Node-tested, so a drag is proven to land
 * under the finger at every stage shape and zoom, and a name is proven to
 * stay on the picture.
 *
 * The house rule it follows (roomdesign/planGeom.ts, D35): the view lays
 * itself out in GLASS UNITS (the box it is given ÷ StageTextScale) and paints
 * through one viewBox, so every stroke and font grows with FULL SCREEN, and a
 * touch divided by the same scale maps to the same place on the stage.
 *
 *   x: 0 = stage right (the viewer's LEFT) … 1 = stage left
 *   y: 0 = upstage (the top) … 1 = downstage (the audience edge, the bottom)
 * The orientation is fixed: nothing here can mirror a plot.
 *
 * What is in here:
 *   • the fit: the stage, plus whatever stands a little off it, inside the
 *     frame that carries the four direction words; zoom and pan on top
 *   • each object's box on the glass, and the topmost object under a finger
 *     (a small symbol can be grabbed from 22 points away)
 *   • the place a moved object lands (the model's own snap rule, repeated
 *     here so the picture under the finger matches the saved result)
 *   • grid lines that never crowd closer than a finger can read
 *   • where each name and its channel numbers go, clear of the symbols and
 *     of each other, inside the picture
 *
 * Pure: no React, no native modules.
 */
import { spGridStep, spGroupOf, spStageAspect } from '../../../../features/stageplot/spModel.ts';
import { spIsSized, spStageMeters, spSymbol } from '../../../../features/stageplot/spSymbols.ts';
import type { SpId, SpObject, SpProject } from '../../../../features/stageplot/spTypes.ts';
import { overlapArea, pickSpot, type Box } from '../../roomdesign/planLabels.ts';

export type Pt = { x: number; y: number };

/* ── the frame and the fit ──────────────────────────────────────────────── */

/** Glass units kept free round the picture for the four direction words. */
export const STAGE_FRAME = { top: 16, bottom: 19, side: 16 } as const;
/** A symbol can be grabbed from this far away (glass units = points at 1×). */
export const STAGE_MIN_REACH = 22;
export const STAGE_ZOOM_MAX = 4;
/** A symbol is never drawn smaller than this many glass units per meter: on
 *  a wide stage a person would otherwise be a dot. Symbols are drawings of a
 *  kind of thing, not footprints (the screen says so). */
export const STAGE_SYMBOL_MIN = 36;
/** How far off the stage the model lets an object stand (spMoveObject). */
const OFF_MAX = 0.25;

/** The part of stage space the picture must show, in stage fractions. */
export type StageRegion = { x0: number; y0: number; x1: number; y1: number };

/** The stage with a small margin, grown to take in anything that stands off
 *  it (the wings, front of house), so an offstage object is never lost. */
export function stageRegion(objects: readonly Pt[], margin = 0.05): StageRegion {
  let x0 = -margin;
  let y0 = -margin;
  let x1 = 1 + margin;
  let y1 = 1 + margin;
  const pad = 0.08;
  const lim = OFF_MAX + pad;
  for (const o of objects) {
    if (!Number.isFinite(o.x) || !Number.isFinite(o.y)) continue;
    x0 = Math.min(x0, o.x - pad);
    x1 = Math.max(x1, o.x + pad);
    y0 = Math.min(y0, o.y - pad);
    y1 = Math.max(y1, o.y + pad);
  }
  return { x0: Math.max(-lim, x0), y0: Math.max(-lim, y0), x1: Math.min(1 + lim, x1), y1: Math.min(1 + lim, y1) };
}

/** What the user looks at: 1 = the whole stage; above 1 the picture is
 *  centered on (cx, cy), in stage fractions. Never saved: zoom and screen
 *  size do not change a position. */
export type StageView = { zoom: number; cx: number; cy: number };
export const STAGE_VIEW_FIT: StageView = { zoom: 1, cx: 0.5, cy: 0.5 };

export type StageTransform = {
  gw: number;
  gh: number;
  /** Stage width ÷ depth, as drawn. */
  aspect: number;
  zoom: number;
  /** Glass units for the whole stage width, and for its whole depth. */
  kx: number;
  ky: number;
  /** Where the upstage, stage-right corner is on the glass. */
  ox: number;
  oy: number;
  /** The center of the picture, in stage fractions (after clamping). */
  cx: number;
  cy: number;
  region: StageRegion;
  /** The box inside the frame, in glass units. */
  inner: Box;
  toGlass: (p: Pt) => Pt;
  toFrac: (g: Pt) => Pt;
};

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** Fit `region` of a stage of the given shape into a gw × gh glass, inside
 *  the frame; then zoom about the view's center. At zoom 1 the whole region
 *  shows. Zoomed in, the center is held so the picture never slides past the
 *  region's edge (there is nothing out there to see). */
export function stageTransform(aspect: number, gw: number, gh: number, region: StageRegion, view: StageView = STAGE_VIEW_FIT): StageTransform {
  const a = aspect > 0 && Number.isFinite(aspect) ? aspect : 1.6;
  const inner: Box = { x0: STAGE_FRAME.side, y0: STAGE_FRAME.top, x1: Math.max(STAGE_FRAME.side + 20, gw - STAGE_FRAME.side), y1: Math.max(STAGE_FRAME.top + 20, gh - STAGE_FRAME.bottom) };
  const innerW = inner.x1 - inner.x0;
  const innerH = inner.y1 - inner.y0;
  const rx = Math.max(0.2, region.x1 - region.x0);
  const ry = Math.max(0.2, region.y1 - region.y0);
  const zoom = clamp(Number.isFinite(view.zoom) ? view.zoom : 1, 1, STAGE_ZOOM_MAX);
  const kx = Math.min(innerW / rx, (innerH * a) / ry) * zoom;
  const ky = kx / a;
  // half of what shows, in stage fractions
  const hx = innerW / kx / 2;
  const hy = innerH / ky / 2;
  const midX = (region.x0 + region.x1) / 2;
  const midY = (region.y0 + region.y1) / 2;
  const cx = hx * 2 >= rx ? midX : clamp(view.cx, region.x0 + hx, region.x1 - hx);
  const cy = hy * 2 >= ry ? midY : clamp(view.cy, region.y0 + hy, region.y1 - hy);
  const ox = (inner.x0 + inner.x1) / 2 - cx * kx;
  const oy = (inner.y0 + inner.y1) / 2 - cy * ky;
  return {
    gw,
    gh,
    aspect: a,
    zoom,
    kx,
    ky,
    ox,
    oy,
    cx,
    cy,
    region,
    inner,
    toGlass: (p) => ({ x: ox + p.x * kx, y: oy + p.y * ky }),
    toFrac: (g) => ({ x: (g.x - ox) / kx, y: (g.y - oy) / ky }),
  };
}

/** The transform for a project on a glass. */
export function stageTransformFor(p: SpProject, gw: number, gh: number, view: StageView = STAGE_VIEW_FIT, region: StageRegion = stageRegion(p.objects)): StageTransform {
  return stageTransform(spStageAspect(p), gw, gh, region, view);
}

/** Slide the picture by a finger's travel (glass units). The finger carries
 *  the stage with it: dragging right shows what is further to the left. */
export function stagePan(start: StageView, T: StageTransform, dxGlass: number, dyGlass: number): StageView {
  if (T.zoom <= 1) return { ...start, zoom: 1 };
  const next = stageTransform(T.aspect, T.gw, T.gh, T.region, { zoom: T.zoom, cx: start.cx - dxGlass / T.kx, cy: start.cy - dyGlass / T.ky });
  return { zoom: next.zoom, cx: next.cx, cy: next.cy };
}

/** Change the zoom. Coming up from the whole stage, the picture centers on
 *  `focus` (the selected object) when there is one; already zoomed, it keeps
 *  the place the user is looking at. */
export function stageZoomTo(view: StageView, zoom: number, focus?: Pt | null): StageView {
  const z = clamp(Math.round(zoom * 20) / 20, 1, STAGE_ZOOM_MAX);
  if (z <= 1) return STAGE_VIEW_FIT;
  if (view.zoom <= 1 && focus) return { zoom: z, cx: focus.x, cy: focus.y };
  return { zoom: z, cx: view.cx, cy: view.cy };
}

/* ── objects on the glass ───────────────────────────────────────────────── */

/** Glass units per meter for SYMBOLS (people, instruments, stands): the true
 *  scale of the stage, or the legibility floor when that would be smaller. */
export function stageSymbolScale(p: SpProject, T: StageTransform): number {
  return Math.max(T.kx / spStageMeters(p).width, STAGE_SYMBOL_MIN);
}

/** An object's box on the glass: its center, its half width and half depth
 *  (before turning) and its turn in degrees. */
export type StageObjBox = { id: SpId; cx: number; cy: number; hw: number; hh: number; rot: number; sized: boolean };

/** Where an object is on the glass. `at` overrides its saved position (a
 *  drag in progress); `size` overrides a sized object's width and depth (a
 *  resize in progress); `rot` its turn (the fader's preview). */
export function stageObjectBox(p: SpProject, o: SpObject, T: StageTransform, live: { at?: Pt; size?: { w: number; h: number }; rot?: number } = {}): StageObjBox {
  const c = T.toGlass(live.at ?? o);
  const sized = spIsSized(o.kind);
  const rot = live.rot ?? o.rot;
  if (sized) {
    const w = live.size?.w ?? o.w ?? 0.12;
    const h = live.size?.h ?? o.h ?? 0.1;
    return { id: o.id, cx: c.x, cy: c.y, hw: (w * T.kx) / 2, hh: (h * T.ky) / 2, rot, sized };
  }
  const sym = spSymbol(o.kind);
  const u = stageSymbolScale(p, T);
  return { id: o.id, cx: c.x, cy: c.y, hw: (sym.w * u) / 2, hh: (sym.h * u) / 2, rot, sized };
}

/** The order things are painted in: platforms first (a riser lies UNDER what
 *  stands on it), then labeled boxes, then every symbol in the order it was
 *  added. The last one is on top. */
export function stageDrawOrder(objects: readonly SpObject[]): SpObject[] {
  const rank = (o: SpObject): number => (o.kind === 'riser' ? 0 : o.kind === 'generic' ? 1 : 2);
  return objects.map((o, i) => ({ o, i })).sort((a, b) => rank(a.o) - rank(b.o) || a.i - b.i).map((x) => x.o);
}

/** A glass point in the box's own axes (its turn undone). */
function toLocal(b: StageObjBox, gx: number, gy: number): Pt {
  const a = (-b.rot * Math.PI) / 180;
  const dx = gx - b.cx;
  const dy = gy - b.cy;
  return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) };
}

/** How far a glass point is from a box (0 = on it). */
export function stageBoxDistance(b: StageObjBox, gx: number, gy: number): number {
  const l = toLocal(b, gx, gy);
  return Math.hypot(Math.max(0, Math.abs(l.x) - b.hw), Math.max(0, Math.abs(l.y) - b.hh));
}

/** True when a glass point is within reach of a box: on it, or inside the
 *  22-point square a fingertip needs round a small symbol. */
function inReach(b: StageObjBox, gx: number, gy: number, reach: number): boolean {
  const l = toLocal(b, gx, gy);
  return Math.abs(l.x) <= Math.max(b.hw, reach) && Math.abs(l.y) <= Math.max(b.hh, reach);
}

/**
 * The object a finger at (gx, gy) means. `boxes` are in PAINT order (the last
 * is on top). In order:
 *   1. a symbol the finger is ON: the selected one if it is among them,
 *      otherwise the topmost;
 *   2. the selected object, if the finger is within its reach (so what is
 *      selected can always be grabbed again);
 *   3. the nearest symbol within reach (a microphone standing on a riser
 *      wins over the riser under it);
 *   4. a platform or box the finger is on (the topmost), then the nearest
 *      one within reach.
 * Null when the finger is on the bare stage.
 */
export function stageHit(boxes: readonly StageObjBox[], gx: number, gy: number, opts: { selectedId?: SpId | null; reach?: number } = {}): SpId | null {
  const reach = opts.reach ?? STAGE_MIN_REACH;
  const cands = boxes.map((b, i) => ({ b, i, d: stageBoxDistance(b, gx, gy) })).filter((c) => inReach(c.b, gx, gy, reach));
  if (!cands.length) return null;
  const topmost = (list: typeof cands) => list.reduce((best, c) => (c.i > best.i ? c : best));
  const nearest = (list: typeof cands) => list.reduce((best, c) => (c.d < best.d || (c.d === best.d && c.i > best.i) ? c : best));
  const onSymbol = cands.filter((c) => !c.b.sized && c.d === 0);
  if (onSymbol.length) return (onSymbol.find((c) => c.b.id === opts.selectedId) ?? topmost(onSymbol)).b.id;
  const selected = cands.find((c) => c.b.id === opts.selectedId);
  if (selected) return selected.b.id;
  const nearSymbol = cands.filter((c) => !c.b.sized);
  if (nearSymbol.length) return nearest(nearSymbol).b.id;
  const onBox = cands.filter((c) => c.d === 0);
  return (onBox.length ? topmost(onBox) : nearest(cands)).b.id;
}

/** The corners of a box on the glass, turned: upstage-right first, clockwise. */
export function stageBoxCorners(b: StageObjBox, grow = 0): Pt[] {
  const a = (b.rot * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const hw = b.hw + grow;
  const hh = b.hh + grow;
  return [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh],
  ].map(([x, y]) => ({ x: b.cx + x * cos - y * sin, y: b.cy + x * sin + y * cos }));
}

/** The upright box that holds a turned box (for keeping names off it). */
export function stageBoxBounds(b: StageObjBox, grow = 0): Box {
  const a = (b.rot * Math.PI) / 180;
  const ex = Math.abs(b.hw * Math.cos(a)) + Math.abs(b.hh * Math.sin(a)) + grow;
  const ey = Math.abs(b.hw * Math.sin(a)) + Math.abs(b.hh * Math.cos(a)) + grow;
  return { x0: b.cx - ex, y0: b.cy - ey, x1: b.cx + ex, y1: b.cy + ey };
}

/** The point a little way out from the side an object FACES (0° = toward the
 *  audience, down the page): where the selection ring carries its mark. */
export function stageFacingPoint(b: StageObjBox, out = 9): Pt {
  const a = (b.rot * Math.PI) / 180;
  const d = b.hh + out;
  return { x: b.cx - Math.sin(a) * d, y: b.cy + Math.cos(a) * d };
}

/* ── moving and sizing ──────────────────────────────────────────────────── */

/** Where an object dropped at `to` lands: on the grid when snap is on, and
 *  never further than a quarter of the stage off it. This is spMoveObject's
 *  own rule (a test holds the two together), so the object under the finger
 *  is drawn where the saved one will be. */
export function stageSnapPoint(p: SpProject, to: Pt, snap: boolean = p.stage.snap): Pt {
  const step = spGridStep(p);
  const x = snap ? Math.round(to.x / step.x) * step.x : to.x;
  const y = snap ? Math.round(to.y / step.y) * step.y : to.y;
  return { x: clamp(x, -OFF_MAX, 1 + OFF_MAX), y: clamp(y, -OFF_MAX, 1 + OFF_MAX) };
}

/** While `id` is dragged to `to`: where it and everything grouped with it is
 *  drawn (the group keeps its shape, as the model moves it). */
export function stageLivePositions(p: SpProject, id: SpId, to: Pt): Map<SpId, Pt> {
  const out = new Map<SpId, Pt>();
  const o = p.objects.find((x) => x.id === id);
  if (!o) return out;
  const at = stageSnapPoint(p, to);
  const dx = at.x - o.x;
  const dy = at.y - o.y;
  for (const m of spGroupOf(p, id)) out.set(m.id, { x: m.x + dx, y: m.y + dy });
  return out;
}

/** The corner handle of a platform or box: its downstage, stage-left corner. */
export function stageResizeHandle(b: StageObjBox): Pt {
  return stageBoxCorners(b)[2];
}

export const STAGE_SIZE_MIN = 0.04;
export const STAGE_SIZE_MAX = 1.5;

/** The width and depth (stage fractions) of a box whose corner handle is
 *  dragged to a glass point. The center stays where it is; with snap on, the
 *  size moves in whole grid steps. */
export function stageResizeTo(p: SpProject, b: StageObjBox, T: StageTransform, gx: number, gy: number): { w: number; h: number } {
  const l = toLocal(b, gx, gy);
  let w = (Math.abs(l.x) * 2) / T.kx;
  let h = (Math.abs(l.y) * 2) / T.ky;
  if (p.stage.snap) {
    const step = spGridStep(p);
    w = Math.max(step.x, Math.round(w / step.x) * step.x);
    h = Math.max(step.y, Math.round(h / step.y) * step.y);
  }
  return { w: clamp(w, STAGE_SIZE_MIN, STAGE_SIZE_MAX), h: clamp(h, STAGE_SIZE_MIN, STAGE_SIZE_MAX) };
}

/** One nudge, in stage fractions: a grid step with snap on, otherwise one
 *  hundredth of the stage. */
export function stageNudgeStep(p: SpProject): Pt {
  return p.stage.snap ? spGridStep(p) : { x: 0.01, y: 0.01 };
}

/* ── the grid ───────────────────────────────────────────────────────────── */

/** Grid lines on the stage, as glass coordinates. Every n-th line of the
 *  project's grid is drawn, n chosen so two lines are never closer than
 *  `minGap` glass units; `every` says which (1 = every line). */
export function stageGridLines(p: SpProject, T: StageTransform, minGap = 9): { xs: number[]; ys: number[]; every: number } {
  const step = spGridStep(p);
  const gapX = step.x * T.kx;
  const gapY = step.y * T.ky;
  if (!(gapX > 0) || !(gapY > 0)) return { xs: [], ys: [], every: 1 };
  const every = Math.max(1, Math.ceil(minGap / Math.min(gapX, gapY)));
  const xs: number[] = [];
  const ys: number[] = [];
  for (let k = every; k * step.x < 1 - 1e-9; k += every) xs.push(T.ox + k * step.x * T.kx);
  for (let k = every; k * step.y < 1 - 1e-9; k += every) ys.push(T.oy + k * step.y * T.ky);
  return { xs, ys, every };
}

/* ── names and numbers on the stage ─────────────────────────────────────── */

/** Advance per character as a fraction of the font size, for the condensed
 *  face the names are set in (an upper bound, so a box is never too small). */
export const STAGE_CHAR_W = 0.56;
export const STAGE_NAME_FS = 10.5;
export const STAGE_PERSON_FS = 11.5;
export const STAGE_BADGE_FS = 9.5;
const BADGE_PAD = 3.5;
const BADGE_GAP = 3;
const LINE_GAP = 2.5;
const NAME_GAP = 4;

export type StageLabelIn = {
  id: SpId;
  /** The name to print ('' = none). Never shortened. */
  text: string;
  /** Channel numbers and mix codes, each printed in its own small box. */
  badges: readonly string[];
  box: StageObjBox;
  /** A person: the name is set a size larger and placed first. */
  person: boolean;
};

export type StageBadgeOut = { text: string; x: number; y: number; w: number; h: number };
export type StageLabelOut = {
  id: SpId;
  fs: number;
  /** Each line of the name: its anchor point, its baseline, and which part
   *  of the line the anchor is (so the real text, which is a little narrower
   *  than its measured box, still sits against its numbers or its center). */
  lines: { text: string; x: number; y: number; anchor: 'middle' | 'end' }[];
  badges: StageBadgeOut[];
  /** Everything this label covers. */
  box: Box;
};

const textW = (s: string, fs: number): number => s.length * fs * STAGE_CHAR_W;

/** A long name goes on two lines, and a very long one on three, split at
 *  the spaces nearest the even break points. It is never cut and never ends
 *  in "…". (A 60-letter name on one line ran across half the stage.) */
export function stageNameLines(text: string, max = 16): string[] {
  const t = text.trim();
  if (!t) return [];
  if (t.length <= max || !t.includes(' ')) return [t];
  const want = Math.min(3, Math.ceil(t.length / (max + 2)));
  const cuts: number[] = [];
  for (let k = 1; k < Math.max(2, want); k++) {
    const target = (t.length * k) / Math.max(2, want);
    let best = -1;
    for (let i = (cuts[cuts.length - 1] ?? -1) + 1; i < t.length; i++) if (t[i] === ' ' && (best < 0 || Math.abs(i - target) < Math.abs(best - target))) best = i;
    if (best >= 0) cuts.push(best);
  }
  const out: string[] = [];
  let from = 0;
  for (const c of cuts) {
    out.push(t.slice(from, c));
    from = c + 1;
  }
  out.push(t.slice(from));
  return out.filter((line) => line.length > 0);
}

type Block = { w: number; h: number; fs: number; lines: string[]; badgeW: number[]; badgeH: number; lastW: number; rowW: number; rowH: number };

/** A label is its name, one or two lines, with its numbers in small boxes on
 *  the END of the last line (so "Keys [9–10]" is one row, not two). */
function measure(item: StageLabelIn): Block {
  const fs = item.person ? STAGE_PERSON_FS : STAGE_NAME_FS;
  const lines = stageNameLines(item.text);
  const badgeW = item.badges.map((b) => textW(b, STAGE_BADGE_FS) + BADGE_PAD * 2);
  const badgeH = item.badges.length ? STAGE_BADGE_FS + 4 : 0;
  const badgesW = badgeW.reduce((s, w) => s + w, 0) + Math.max(0, badgeW.length - 1) * BADGE_GAP;
  const lastW = lines.length ? textW(lines[lines.length - 1], fs) : 0;
  const rowW = lastW + (lastW && badgesW ? NAME_GAP : 0) + badgesW;
  const rowH = Math.max(lines.length ? fs : 0, badgeH);
  const w = Math.max(rowW, ...lines.slice(0, -1).map((l) => textW(l, fs)));
  const h = Math.max(0, lines.length - 1) * (fs + LINE_GAP) + rowH;
  return { w, h, fs, lines, badgeW, badgeH, lastW, rowW, rowH };
}

/** Lay one measured block with its top-left corner at (x0, y0). */
function layBlock(id: SpId, m: Block, x0: number, y0: number, badges: readonly string[]): StageLabelOut {
  const n = m.lines.length;
  const rowX = x0 + (m.w - m.rowW) / 2;
  const rowY = y0 + Math.max(0, n - 1) * (m.fs + LINE_GAP);
  const lines = m.lines.map((text, k) =>
    k < n - 1
      ? { text, x: x0 + m.w / 2, y: y0 + k * (m.fs + LINE_GAP) + m.fs * 0.82, anchor: 'middle' as const }
      : { text, x: rowX + m.lastW, y: rowY + (m.rowH - m.fs) / 2 + m.fs * 0.82, anchor: 'end' as const },
  );
  const out: StageBadgeOut[] = [];
  let bx = rowX + m.lastW + (m.lastW ? NAME_GAP : 0);
  const by = rowY + (m.rowH - m.badgeH) / 2;
  badges.forEach((text, k) => {
    out.push({ text, x: bx, y: by, w: m.badgeW[k], h: m.badgeH });
    bx += m.badgeW[k] + BADGE_GAP;
  });
  return { id, fs: m.fs, lines, badges: out, box: { x0, y0, x1: x0 + m.w, y1: y0 + m.h } };
}

/**
 * Place every name (with its numbers) beside its symbol. People are placed
 * first, then everything else in paint order. Each label offers its spots in
 * order of preference (under the symbol, over it, beside it, at its corners,
 * then a line further out) and takes the first that is inside the picture
 * and clear of every symbol and of every label placed before it; when none
 * is clear it takes the one that overlaps least. A LABEL YIELDS ITS PLACE,
 * NEVER ITS WORDS: nothing is hidden or shortened to make room.
 *
 * An object that is wholly outside the picture (zoomed in, panned away) has
 * no label and is no obstacle: there is nothing of it to name.
 *
 * The picture is the glass INSIDE the frame that carries the four direction
 * words: a label is always held inside it, so a name is never hidden under a
 * direction word. `keepOut`: more boxes no label should sit on.
 */
export function stageLabels(items: readonly StageLabelIn[], gw: number, gh: number, keepOut: readonly Box[] = []): StageLabelOut[] {
  const taken: Box[] = [...keepOut];
  const glass: Box = { x0: STAGE_FRAME.side, y0: STAGE_FRAME.top, x1: Math.max(STAGE_FRAME.side + 1, gw - STAGE_FRAME.side), y1: Math.max(STAGE_FRAME.top + 1, gh - STAGE_FRAME.bottom) };
  const shown = items.filter((it) => overlapArea(stageBoxBounds(it.box), glass, 0) > 0);
  // symbols are obstacles; platforms are not (a name may sit on a riser)
  for (const it of shown) if (!it.box.sized) taken.push(stageBoxBounds(it.box, -1));
  const order = [...shown.filter((i) => i.person), ...shown.filter((i) => !i.person)].filter((it) => it.text.trim() || it.badges.length);
  const out = new Map<SpId, StageLabelOut>();
  const placeOne = (it: StageLabelIn): void => {
    const others = [...taken];
    for (const [id, l] of out) if (id !== it.id) others.push(l.box);
    const m = measure(it);
    const bb = stageBoxBounds(it.box);
    const cx = it.box.cx;
    const cy = it.box.cy;
    const gap = 3;
    const spots: { x0: number; y0: number }[] = it.box.sized
      ? [
          // a platform carries its name inside one of its corners or edges,
          // then outside
          { x0: bb.x0 + gap, y0: bb.y0 + gap },
          { x0: bb.x1 - m.w - gap, y0: bb.y0 + gap },
          { x0: cx - m.w / 2, y0: bb.y0 + gap },
          { x0: bb.x0 + gap, y0: bb.y1 - m.h - gap },
          { x0: bb.x1 - m.w - gap, y0: bb.y1 - m.h - gap },
          { x0: cx - m.w / 2, y0: bb.y1 - m.h - gap },
          { x0: cx - m.w / 2, y0: bb.y0 - m.h - gap },
          { x0: cx - m.w / 2, y0: bb.y1 + gap },
          { x0: bb.x0 - m.w - gap, y0: bb.y0 },
          { x0: bb.x1 + gap, y0: bb.y0 },
        ]
      : [
          { x0: cx - m.w / 2, y0: bb.y1 + gap },
          { x0: cx - m.w / 2, y0: bb.y0 - m.h - gap },
          { x0: bb.x1 + gap, y0: cy - m.h / 2 },
          { x0: bb.x0 - m.w - gap, y0: cy - m.h / 2 },
          { x0: bb.x1 + gap, y0: bb.y1 - m.h / 2 },
          { x0: bb.x0 - m.w - gap, y0: bb.y1 - m.h / 2 },
          { x0: bb.x1 + gap, y0: bb.y0 - m.h / 2 },
          { x0: bb.x0 - m.w - gap, y0: bb.y0 - m.h / 2 },
          { x0: cx, y0: bb.y1 + gap },
          { x0: cx - m.w, y0: bb.y1 + gap },
          { x0: cx, y0: bb.y0 - m.h - gap },
          { x0: cx - m.w, y0: bb.y0 - m.h - gap },
          { x0: cx - m.w / 2, y0: bb.y1 + gap + m.h + 2 },
          { x0: cx - m.w / 2, y0: bb.y0 - 2 * m.h - gap - 2 },
          { x0: bb.x1 + gap, y0: bb.y1 + gap },
          { x0: bb.x0 - m.w - gap, y0: bb.y1 + gap },
          { x0: bb.x1 + gap, y0: bb.y0 - m.h - gap },
          { x0: bb.x0 - m.w - gap, y0: bb.y0 - m.h - gap },
        ];
    // a spot that hangs off the picture is first slid back onto it
    const cands = spots.map((s) => {
      const x0 = clamp(s.x0, glass.x0 + 1, Math.max(glass.x0 + 1, glass.x1 - m.w - 1));
      const y0 = clamp(s.y0, glass.y0 + 1, Math.max(glass.y0 + 1, glass.y1 - m.h - 1));
      return { x0, y0, boxes: [{ x0, y0, x1: x0 + m.w, y1: y0 + m.h }] as Box[] };
    });
    const pick = pickSpot(cands, others, gw, gh);
    out.set(it.id, layBlock(it.id, m, pick.x0, pick.y0, it.badges));
  };
  for (const it of order) placeOne(it);
  // A LABEL THAT IS CLEAR STAYS WHERE IT IS. Only the labels that still touch
  // another label are placed again (twice at most), each against all the
  // others: one placed early may be standing on the only spot a later one
  // had. So adding or moving one object does not send the other names round
  // their symbols.
  for (let round = 0; round < 2; round++) {
    const clashing = new Set<SpId>();
    const placed = [...out.entries()];
    for (let i = 0; i < placed.length; i++)
      for (let j = i + 1; j < placed.length; j++)
        if (overlapArea(placed[i][1].box, placed[j][1].box, 0) > 0) {
          clashing.add(placed[i][0]);
          clashing.add(placed[j][0]);
        }
    if (!clashing.size) break;
    for (const it of order) if (clashing.has(it.id)) placeOne(it);
  }
  // back in the order given
  return items.map((i) => out.get(i.id)).filter((x): x is StageLabelOut => !!x);
}

/** The area two label boxes share (0 = clear), for tests and for the view's
 *  own checks. */
export const stageLabelClash = (a: Box, b: Box): number => overlapArea(a, b, 0);

/** The boxes the four direction words stand in (the frame). The view prints
 *  the words there; labels keep off them. */
export function stageFrameBoxes(gw: number, gh: number): { top: Box; bottom: Box; left: Box; right: Box } {
  return {
    top: { x0: 0, y0: 0, x1: gw, y1: STAGE_FRAME.top },
    bottom: { x0: 0, y0: gh - STAGE_FRAME.bottom, x1: gw, y1: gh },
    left: { x0: 0, y0: 0, x1: STAGE_FRAME.side, y1: gh },
    right: { x0: gw - STAGE_FRAME.side, y0: 0, x1: gw, y1: gh },
  };
}

/* ── words for a position and a turn ────────────────────────────────────── */

/** Which way an object faces, in stage words (0° = toward the audience;
 *  degrees run clockwise as the plot is seen). */
export function stageFacingWord(rot: number): string {
  const r = ((Math.round(rot) % 360) + 360) % 360;
  if (r === 0) return 'facing the audience';
  if (r === 90) return 'facing stage right';
  if (r === 180) return 'facing upstage';
  if (r === 270) return 'facing stage left';
  if (r < 90) return 'facing the audience, turned toward stage right';
  if (r < 180) return 'facing upstage, turned toward stage right';
  if (r < 270) return 'facing upstage, turned toward stage left';
  return 'facing the audience, turned toward stage left';
}

/** The same in few words, for a readout that has one short line ("185° ·
 *  upstage, toward stage left"): never cut with "…". */
export function stageFacingShort(rot: number): string {
  const r = ((Math.round(rot) % 360) + 360) % 360;
  if (r === 0) return 'facing the audience';
  if (r === 90) return 'facing stage right';
  if (r === 180) return 'facing upstage';
  if (r === 270) return 'facing stage left';
  if (r < 90) return 'audience, toward stage right';
  if (r < 180) return 'upstage, toward stage right';
  if (r < 270) return 'upstage, toward stage left';
  return 'audience, toward stage left';
}

/** The unit a typed position uses: the stage's own unit when its size is
 *  known, otherwise a percentage of the stage. */
export function stagePosUnit(p: SpProject): 'ft' | 'm' | '%' {
  return p.stage.width && p.stage.depth ? p.stage.unit : '%';
}

/** A stage fraction as the number the user types: feet or meters from the
 *  stage-right edge (x) or from the upstage edge (y), or a percentage. */
export function stagePosValue(p: SpProject, axis: 'x' | 'y', frac: number): number {
  const unit = stagePosUnit(p);
  const span = unit === '%' ? 100 : axis === 'x' ? (p.stage.width as number) : (p.stage.depth as number);
  const digits = unit === '%' ? 0 : 1;
  const k = 10 ** digits;
  return Math.round(frac * span * k) / k;
}

/** A typed number back to a stage fraction, held inside the model's reach.
 *  Null when the number is not usable. */
export function stagePosFraction(p: SpProject, axis: 'x' | 'y', value: number | null): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const unit = stagePosUnit(p);
  const span = unit === '%' ? 100 : axis === 'x' ? (p.stage.width as number) : (p.stage.depth as number);
  if (!(span > 0)) return null;
  return clamp(value / span, -OFF_MAX, 1 + OFF_MAX);
}

/** How far a position is from the stage's edges along one axis, WITHOUT a
 *  minus sign: `side` says where it is. `value` is the distance from the
 *  stage-right edge (x) or the upstage edge (y) when it is on the stage, and
 *  the distance PAST the nearer edge when it is off it. */
export function stageEdgeDistance(p: SpProject, axis: 'x' | 'y', frac: number): { value: number; side: 'on' | 'before' | 'after' } {
  const unit = stagePosUnit(p);
  const span = unit === '%' ? 100 : axis === 'x' ? (p.stage.width as number) : (p.stage.depth as number);
  const k = unit === '%' ? 1 : 10;
  const round = (v: number): number => Math.round(v * span * k) / k;
  if (frac < 0) return { value: round(-frac), side: 'before' };
  if (frac > 1) return { value: round(frac - 1), side: 'after' };
  return { value: round(frac), side: 'on' };
}

/** One axis of a position in words. A place off the stage is never printed
 *  as a negative number: "3 ft behind the upstage edge". */
export function stageAxisWords(p: SpProject, axis: 'x' | 'y', frac: number): string {
  const unit = stagePosUnit(p);
  const d = stageEdgeDistance(p, axis, frac);
  const n = unit === '%' ? `${d.value}% of the stage ${axis === 'x' ? 'width' : 'depth'}` : `${d.value} ${unit}`;
  if (axis === 'x') {
    if (d.side === 'before') return `${n} past the stage right edge`;
    if (d.side === 'after') return `${n} past the stage left edge`;
    return unit === '%' ? `${d.value}% of the way across from stage right` : `${n} from the stage right edge`;
  }
  if (d.side === 'before') return `${n} behind the upstage edge`;
  if (d.side === 'after') return `${n} in front of the downstage edge`;
  return unit === '%' ? `${d.value}% of the way down from upstage` : `${n} from the upstage edge`;
}

/** "12.5 ft from the stage right edge, 9 ft from the upstage edge". */
export function stagePosWords(p: SpProject, at: Pt): string {
  return `${stageAxisWords(p, 'x', at.x)}, ${stageAxisWords(p, 'y', at.y)}`;
}

/** "24 ft × 16 ft (estimated)" or "" when the size is not known. */
export function stageSizeWords(p: SpProject): string {
  const { width, depth, unit, dims } = p.stage;
  if (!width || !depth) return '';
  return `${width} ${unit} × ${depth} ${unit} (${dims})`;
}

/** A thin line from a label to its symbol, for a label that had to stand
 *  away from it (a crowded corner). Null when the label is beside its symbol
 *  or on it: then no line is needed to say whose name it is. */
export function stageLabelLeader(label: Box, symbol: Box, near = 8): { x1: number; y1: number; x2: number; y2: number } | null {
  const dx = Math.max(0, symbol.x0 - label.x1, label.x0 - symbol.x1);
  const dy = Math.max(0, symbol.y0 - label.y1, label.y0 - symbol.y1);
  if (Math.hypot(dx, dy) <= near) return null;
  const sx = (symbol.x0 + symbol.x1) / 2;
  const sy = (symbol.y0 + symbol.y1) / 2;
  const lx = (label.x0 + label.x1) / 2;
  const ly = (label.y0 + label.y1) / 2;
  return { x1: clamp(sx, label.x0, label.x1), y1: clamp(sy, label.y0, label.y1), x2: clamp(lx, symbol.x0, symbol.x1), y2: clamp(ly, symbol.y0, symbol.y1) };
}

/** A typed width or depth of a platform back to a stage fraction, held
 *  between the smallest and the largest size a platform may have. */
export function stageSizeFraction(p: SpProject, axis: 'x' | 'y', value: number | null): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  const unit = stagePosUnit(p);
  const span = unit === '%' ? 100 : axis === 'x' ? (p.stage.width as number) : (p.stage.depth as number);
  if (!(span > 0)) return null;
  return clamp(value / span, STAGE_SIZE_MIN, STAGE_SIZE_MAX);
}

/* ── the key under the stage ────────────────────────────────────────────── */

/**
 * THE KEY (owner 2026-11-12: "the key explaining what drawn objects are needs
 * to always be there in the drawing to understand it"). A strip directly
 * under the stage frame, part of the drawing: each KIND of object on this
 * stage, drawn small with the stage's own art, and its name beside it. Never
 * a popup, never behind a switch, never scrolled away.
 *
 * This is its layout, in glass units: the heading KEY at the left, then the
 * cells, wrapping to as many rows as they need. A cell is the art box and the
 * name; a name too long for a whole row goes on two or more lines (it is
 * never cut). The strip's height is what the Stage area adds to the display.
 */
export const STAGE_KEY_FS = 9.5;
/** Advance per character of the key's names, as a fraction of the font size.
 *  The names are the model's fixed list (spPlotKey); set in the condensed
 *  face, the widest of them measures 0.498, so this is an upper bound. */
export const STAGE_KEY_CHAR_W = 0.52;
export const STAGE_KEY_ART = { w: 22, h: 16 } as const;
const KEY_PAD_X = 6;
const KEY_PAD_TOP = 3;
const KEY_PAD_BOTTOM = 3;
const KEY_ROW_H = 18;
const KEY_ROW_GAP = 2;
const KEY_ART_GAP = 4;
const KEY_CELL_GAP = 10;
const KEY_HEADING_W = 28;
const KEY_LINE_H = STAGE_KEY_FS + 1.5;
/** The scale words at the right end of the heading row are set in capitals,
 *  a little spaced: this many glass units per letter is an upper bound. */
const KEY_NOTE_CHAR_W = STAGE_KEY_FS * 0.62;
export const STAGE_KEY_EMPTY = 'Nothing is on the stage yet.';

export type StageKeyCell<K extends string = string> = {
  kind: K;
  name: string;
  row: number;
  /** The cell's box. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** The center of the art box. */
  artCx: number;
  artCy: number;
  /** The name, one line or more: the LEFT edge and the baseline of each. */
  lines: { text: string; x: number; y: number }[];
};

export type StageKeyLayout<K extends string = string> = {
  /** The whole strip's height: what the display grows by. */
  height: number;
  rows: number;
  /** The heading's left edge and baseline. */
  heading: { text: 'KEY'; x: number; y: number };
  cells: StageKeyCell<K>[];
  /** Said in place of the cells when the stage is empty (its left edge and
   *  baseline), so the place of the key is learned from the start. */
  empty: { text: string; x: number; y: number } | null;
  /** The scale words ("NOT TO SCALE", or the stage's size) at the RIGHT end
   *  of the heading row: its right edge and its baseline. Null when none. */
  note: { text: string; x: number; y: number } | null;
};

const keyTextW = (text: string): number => text.length * STAGE_KEY_FS * STAGE_KEY_CHAR_W;

/** A name on as few lines as fit `maxW`, broken at spaces (never cut). A
 *  name longer than `wrapAt` letters is first split in two near its middle,
 *  so a long name makes a narrow, two-line cell. */
function keyNameLines(name: string, maxW: number, wrapAt: number): string[] {
  const fit = (text: string): string[] => {
    if (keyTextW(text) <= maxW) return [text];
    const out: string[] = [];
    let line = '';
    for (const word of text.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (line && keyTextW(next) > maxW) {
        out.push(line);
        line = word;
      } else line = next;
    }
    if (line) out.push(line);
    return out;
  };
  if (name.length > wrapAt && name.includes(' ')) {
    const mid = name.length / 2;
    let best = -1;
    for (let i = 0; i < name.length; i++) if (name[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
    return [...fit(name.slice(0, best)), ...fit(name.slice(best + 1))];
  }
  return fit(name);
}

function keyLayoutWith<K extends string>(entries: readonly { kind: K; name: string }[], gw: number, wrapAt: number, note: string): StageKeyLayout<K> {
  // the heading KEY stands at the left of the first row; the rows under it
  // use the whole width
  const first = KEY_PAD_X + KEY_HEADING_W;
  const right = Math.max(first + 60, gw - KEY_PAD_X);
  const leftOf = (row: number): number => (row === 0 ? first : KEY_PAD_X);
  // the heading row gives its right end to the scale words
  const noteW = note ? Math.min((right - first) / 2, note.length * KEY_NOTE_CHAR_W + KEY_CELL_GAP) : 0;
  const rightOf = (row: number): number => (row === 0 ? right - noteW : right);
  const baseline = (top: number, h: number, n: number, k: number): number => top + (h - n * KEY_LINE_H) / 2 + k * KEY_LINE_H + STAGE_KEY_FS * 0.82;
  // measure every cell against the narrowest row, then fill rows from the left
  const narrow = right - first;
  const measured = entries.map((e) => {
    const lines = keyNameLines(e.name, narrow - STAGE_KEY_ART.w - KEY_ART_GAP, wrapAt);
    const textW = Math.max(...lines.map(keyTextW));
    return { e, lines, w: Math.min(narrow, STAGE_KEY_ART.w + KEY_ART_GAP + textW), h: Math.max(KEY_ROW_H, lines.length * KEY_LINE_H + 3) };
  });
  const rows: (typeof measured)[] = [];
  let used = 0;
  for (const m of measured) {
    const row = rows[rows.length - 1];
    const at = Math.max(0, rows.length - 1);
    const room = rightOf(at) - leftOf(at);
    if (!row || used + KEY_CELL_GAP + m.w > room + 1e-6) {
      rows.push([m]);
      used = m.w;
    } else {
      row.push(m);
      used += KEY_CELL_GAP + m.w;
    }
  }
  const cells: StageKeyCell<K>[] = [];
  let y = KEY_PAD_TOP;
  let headingY = 0;
  rows.forEach((row, r) => {
    const h = Math.max(...row.map((m) => m.h));
    if (r === 0) headingY = baseline(y, h, 1, 0);
    let x = leftOf(r);
    for (const m of row) {
      const textX = x + STAGE_KEY_ART.w + KEY_ART_GAP;
      cells.push({
        kind: m.e.kind,
        name: m.e.name,
        row: r,
        x,
        y,
        w: m.w,
        h,
        artCx: x + STAGE_KEY_ART.w / 2,
        artCy: y + h / 2,
        lines: m.lines.map((text, k) => ({ text, x: textX, y: baseline(y, h, m.lines.length, k) })),
      });
      x += m.w + KEY_CELL_GAP;
    }
    y += h + (r < rows.length - 1 ? KEY_ROW_GAP : 0);
  });
  return { height: y + KEY_PAD_BOTTOM, rows: rows.length, heading: { text: 'KEY', x: KEY_PAD_X, y: headingY }, cells, empty: null, note: note ? { text: note, x: right, y: headingY } : null };
}

/** Ways to set the names, tried in this order: each on one line where it
 *  fits; names longer than 18 letters on two lines ("Wedge monitor (wide
 *  side / faces the performer)"); names longer than 13 on two lines. */
const KEY_WRAPS: readonly number[] = [Number.POSITIVE_INFINITY, 18, 13];

/** `note`: the scale words printed at the right end of the heading row
 *  ("NOT TO SCALE", or the stage's size): see stageScaleNote. */
export function stageKeyLayout<K extends string>(entries: readonly { kind: K; name: string }[], gw: number, note = ''): StageKeyLayout<K> {
  if (!entries.length) {
    const y = KEY_PAD_TOP + (KEY_ROW_H - KEY_LINE_H) / 2 + STAGE_KEY_FS * 0.82;
    const right = Math.max(KEY_PAD_X + KEY_HEADING_W + 60, gw - KEY_PAD_X);
    return {
      height: KEY_PAD_TOP + KEY_ROW_H + KEY_PAD_BOTTOM,
      rows: 1,
      heading: { text: 'KEY', x: KEY_PAD_X, y },
      cells: [],
      empty: { text: STAGE_KEY_EMPTY, x: KEY_PAD_X + KEY_HEADING_W, y },
      note: note ? { text: note, x: right, y } : null,
    };
  }
  // The shortest strip wins (the earlier way, on a tie): the key takes its
  // height from the stage's display, so every row it saves goes to the stage.
  let best = keyLayoutWith(entries, gw, KEY_WRAPS[0], note);
  for (const wrapAt of KEY_WRAPS.slice(1)) {
    const tryIt = keyLayoutWith(entries, gw, wrapAt, note);
    if (tryIt.height < best.height - 1e-6) best = tryIt;
  }
  return best;
}

/** The scale words for the key's heading row: "NOT TO SCALE" when the stage
 *  has no width and depth, otherwise its size and whether that is confirmed
 *  ("24 × 16 ft · ESTIMATED"). Always one or the other: a plot never passes
 *  for a scale drawing by saying nothing. */
export function stageScaleNote(p: SpProject): string {
  const { width, depth, unit, dims } = p.stage;
  if (!width || !depth) return 'NOT TO SCALE';
  return `${width} × ${depth} ${unit} · ${dims.toUpperCase()}`;
}

/** The glass width the Stage area expects before the rack has measured it:
 *  the window less the rack's side padding. Only for telling the rack how
 *  tall the display should be; the drawing lays the key out again for the
 *  width it is really given. */
export const stageGlassWidthGuess = (windowWidth: number): number => Math.max(240, windowWidth - 24);

/** One sentence for a screen reader: "Key: Performer, Drum kit, …". */
export function stageKeyWords(entries: readonly { name: string }[]): string {
  return entries.length ? `Key: ${entries.map((e) => e.name).join(', ')}.` : `Key: ${STAGE_KEY_EMPTY.toLowerCase()}`;
}

/** The scale (glass units per meter) that fits a symbol of w × h meters in
 *  the key's art box, its shape kept. */
export function stageKeyScale(wM: number, hM: number): number {
  return Math.min(STAGE_KEY_ART.w / Math.max(0.05, wM), STAGE_KEY_ART.h / Math.max(0.05, hM));
}
