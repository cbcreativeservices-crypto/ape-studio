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
import { spMoveLimits, spShapeBounds, spShapeFacingWords, spShapeGridSegments, spShapeOf } from '../../../../features/stageplot/spShape.ts';
import { spIsSized, spStageMeters, spSymbol } from '../../../../features/stageplot/spSymbols.ts';
import type { SpId, SpObject, SpProject } from '../../../../features/stageplot/spTypes.ts';
import { overlapArea, type Box } from '../../roomdesign/planLabels.ts';

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
export function stageRegion(objects: readonly Pt[], margin = 0.05, floor: StageRegion = { x0: 0, y0: 0, x1: 1, y1: 1 }): StageRegion {
  // `floor`: the shape's own floor (a thrust's tongue, the wings: spShapeBounds)
  let x0 = floor.x0 - margin;
  let y0 = floor.y0 - margin;
  let x1 = floor.x1 + margin;
  let y1 = floor.y1 + margin;
  const pad = 0.08;
  const lim = OFF_MAX + pad;
  for (const o of objects) {
    if (!Number.isFinite(o.x) || !Number.isFinite(o.y)) continue;
    x0 = Math.min(x0, o.x - pad);
    x1 = Math.max(x1, o.x + pad);
    y0 = Math.min(y0, o.y - pad);
    y1 = Math.max(y1, o.y + pad);
  }
  return { x0: Math.max(floor.x0 - lim, x0), y0: Math.max(floor.y0 - lim, y0), x1: Math.min(floor.x1 + lim, x1), y1: Math.min(floor.y1 + lim, y1) };
}

/** The region for a project: its shape's floor and what stands off it. */
export const stageRegionFor = (p: SpProject, objects: readonly Pt[] = p.objects): StageRegion => stageRegion(objects, 0.05, spShapeBounds(p.stage));

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
export function stageTransformFor(p: SpProject, gw: number, gh: number, view: StageView = STAGE_VIEW_FIT, region: StageRegion = stageRegionFor(p)): StageTransform {
  return stageTransform(spStageAspect(p), gw, gh, region, view);
}

/** Slide the picture by a finger's travel (glass units). The finger carries
 *  the stage with it: dragging right shows what is further to the left. */
export function stagePan(start: StageView, T: StageTransform, dxGlass: number, dyGlass: number): StageView {
  if (T.zoom <= 1) return { ...start, zoom: 1 };
  const next = stageTransform(T.aspect, T.gw, T.gh, T.region, { zoom: T.zoom, cx: start.cx - dxGlass / T.kx, cy: start.cy - dyGlass / T.ky });
  return { zoom: next.zoom, cx: next.cx, cy: next.cy };
}

/** The zoom at which the stage fills the HEIGHT of a glass that is taller
 *  than the stage needs (FULL SCREEN with the phone upright): there the
 *  whole-stage zoom leaves the stage a narrow band with dark above and below.
 *  1 when the glass is already filled (a wide glass, a phone on its side). */
export function stageFillZoom(aspect: number, gw: number, gh: number, region: StageRegion): number {
  const fit = stageTransform(aspect, gw, gh, region);
  const innerH = fit.inner.y1 - fit.inner.y0;
  const ry = Math.max(0.2, region.y1 - region.y0);
  const z = innerH / (ry * fit.ky);
  return z > 1.12 ? Math.min(STAGE_ZOOM_MAX, Math.round(z * 20) / 20) : 1;
}

/** The glass height (glass units) that the WHOLE stage needs at 1× when the
 *  width is what limits it: the frame and the stage at its own shape. FULL
 *  SCREEN with the phone upright lays the stage out at this height, at the
 *  top, with the key right under it; the glass below is left for the dock's
 *  trays (bug test S2-10 and S2-12: a fill zoom cut performers off the
 *  sides, and an open tray covered the stage in the middle of the glass). */
export function stageNaturalHeight(aspect: number, gw: number, region: StageRegion): number {
  const a = aspect > 0 && Number.isFinite(aspect) ? aspect : 1.6;
  const innerW = Math.max(20, gw - STAGE_FRAME.side * 2);
  const rx = Math.max(0.2, region.x1 - region.x0);
  const ry = Math.max(0.2, region.y1 - region.y0);
  return STAGE_FRAME.top + STAGE_FRAME.bottom + (innerW * ry) / (rx * a);
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

/** The size (meters) of what the SCREEN draws for a kind: the print symbol's
 *  footprint, except where the on-screen art is another shape. The figure is
 *  drawn 0.72 m across the shoulders and 0.42 m front to back; a microphone
 *  on its tripod, with its boom, is 0.74 m long. The selection frame, the hit
 *  box and the room a name keeps clear are all this box, so a frame never
 *  cuts through the art it is round. */
const ART_SIZE: Partial<Record<SpObject['kind'], { w: number; h: number }>> = {
  performer: { w: 0.72, h: 0.42 },
  'vocal-mic': { w: 0.5, h: 0.74 },
  'mic-stand': { w: 0.5, h: 0.74 },
};
export function stageArtSize(kind: SpObject['kind']): { w: number; h: number } {
  const sym = spSymbol(kind);
  return ART_SIZE[kind] ?? { w: sym.w, h: sym.h };
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
  const size = stageArtSize(o.kind);
  const u = stageSymbolScale(p, T);
  return { id: o.id, cx: c.x, cy: c.y, hw: (size.w * u) / 2, hh: (size.h * u) / 2, rot, sized };
}

const INSTRUMENT_KINDS: readonly SpObject['kind'][] = [
  ...(['drum-kit', 'percussion', 'congas', 'timbales', 'bongo', 'guitar-amp', 'bass-amp', 'keyboard', 'piano', 'acoustic-guitar', 'horn', 'playback', 'rack', 'stage-box', 'power', 'chair', 'music-stand'] as const),
  // the kinds added for more diverse music (2026-11-13): under the performers,
  // so a cellist is seen on the chair and a drummer at the e-kit
  ...(['choir', 'e-drums', 'cajon', 'djembe', 'tabla', 'steel-pan', 'vibraphone', 'upright-bass', 'grand-piano', 'electric-piano', 'keyboard-rig', 'organ', 'leslie', 'violin', 'cello', 'harp', 'banjo', 'mandolin', 'accordion', 'saxophone', 'trombone', 'dj'] as const),
];

/** The order things are painted in: platforms first (a riser lies UNDER what
 *  stands on it), then labeled boxes, then instruments and furniture, then
 *  the PERFORMERS (a drummer is seen at the kit, not hidden under its
 *  largest drum), then what stands in front of a performer: microphones, DI
 *  boxes and monitors. Inside each layer, the order they were added in. The
 *  last one is on top. */
export function stageDrawOrder(objects: readonly SpObject[]): SpObject[] {
  const rank = (o: SpObject): number => (o.kind === 'riser' ? 0 : o.kind === 'generic' ? 1 : INSTRUMENT_KINDS.includes(o.kind) ? 2 : o.kind === 'performer' ? 3 : 4);
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
  const lim = spMoveLimits(p.stage);
  return { x: clamp(x, lim.x0, lim.x1), y: clamp(y, lim.y0, lim.y1) };
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
/** A platform is never larger than the stage it stands on (bug test S2-09:
 *  a riser 150 % of the stage was drawn past both edges). */
export const STAGE_SIZE_MAX = 1;

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

/** The grid of a stage that is not a rectangle, as one SVG path on the glass:
 *  the snap grid's lines inside the shape (the tongue, the wings, inside the
 *  circle), never closer than `minGap` glass units. '' for a rectangle (its
 *  grid is stageGridLines). */
export function stageShapeGridPath(p: SpProject, T: StageTransform, minGap = 9): string {
  if (spShapeOf(p.stage) === 'rect') return '';
  const step = spGridStep(p);
  const gap = Math.min(step.x * T.kx, step.y * T.ky);
  if (!(gap > 0)) return '';
  const every = Math.max(1, Math.ceil(minGap / gap));
  return spShapeGridSegments(p.stage, step, every)
    .map(([x1, y1, x2, y2]) => {
      const a = T.toGlass({ x: x1, y: y1 });
      const b = T.toGlass({ x: x2, y: y2 });
      return `M${a.x.toFixed(2)} ${a.y.toFixed(2)}L${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
    })
    .join('');
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
  /** A person: the name is set a size larger and placed first. A person's
   *  name is never left out. */
  person: boolean;
  /** The selected object: its name is never left out either, and it stands
   *  clear of the selection frame. */
  selected?: boolean;
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

/** The area two boxes share, with `pad` of air round the first. Two boxes
 *  that only TOUCH share nothing: objects stand on a grid, so an edge of a
 *  label often lies exactly on an edge of a neighbor's art, and the rounding
 *  of that sum must not read as "over it". */
const shared = (a: Box, b: Box, pad: number): number => {
  const v = overlapArea(a, b, pad);
  return v > 0.01 ? v : 0;
};

/** How far apart the centers of two boxes are. */
const centerGap = (a: Box, b: Box): number => Math.hypot((a.x0 + a.x1) / 2 - (b.x0 + b.x1) / 2, (a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2);

export type StageLabelPlan = {
  labels: StageLabelOut[];
  /** The objects whose NAME is not shown at this size (their numbers and mix
   *  codes, when they have any, still are). Empty when every name fits. */
  dropped: SpId[];
  /** The performers (and the selection) shown by NAME ALONE at this size:
   *  the name fits where the name with its mix code did not. */
  bare: SpId[];
  /** Equipment whose channel numbers or mix codes are NOT shown at this size:
   *  no place for them kept off a performer's name (R2-SP1-02). */
  numbersOut: SpId[];
  /** Performers (and the selection) whose name touches another label at
   *  this size: the screen never says "every performer is named" while one
   *  is (R2-SP1-02). */
  crowded: SpId[];
};

/** How far from its symbol a label may stand, nearest first (glass units). */
const LABEL_STEPS: readonly number[] = [0, 5, 11, 18, 26, 35];
/** A label this close to its symbol stands AGAINST it: no leader is drawn
 *  (stageLabelLeader's `near`), and it is read with the symbol it touches. */
const LABEL_AGAINST = 8;
/** A performer's NAME ALONE (its mix code left out) and every other label
 *  keep at least twice this apart (glass units; each box is grown by it): a
 *  code set just after a name reads as that name's own ("Marisol M6" was
 *  Marisol beside Wedge 9's code, bug test S2-03). Other labels keep the
 *  usual 1 (2 apart). */
const LABEL_APART_BARE = 4;

type Spot = { x0: number; y0: number; box: Box };

/**
 * Place every name (with its numbers) beside its symbol.
 *
 * THE RULES A PLACE MUST KEEP (visual review 2, 2026-11-12):
 *   1. A label is never over another object's art.
 *   2. A label's nearest object is its own: its center is not nearer to
 *      another symbol's center than to the center of the one it names. A
 *      label may stand away from its symbol under this rule, with a leader
 *      line that says whose it is. Where no such place is free, a label may
 *      still stand AGAINST its own symbol (touching distance: a large
 *      symbol's label is nearer to a small neighbor's center by nature, and
 *      it is read with the symbol it touches). It never stands away from
 *      its symbol AND nearer to another one: that reads as the other's name.
 *   3. Two labels never overlap, and a label keeps off another label's
 *      leader line.
 *   4. A platform's name (a riser) is only ever inside its own box or
 *      directly under it.
 *   5. A label is inside the picture, clear of the four direction words.
 * So moving one object can never send another object's name onto a third.
 *
 * WHEN NO PLACE KEEPS THE RULES (a crowded stage at a small zoom), in the
 * house's order "a cropped readout drops its label, never its number":
 *   • a piece of EQUIPMENT drops its NAME and keeps its channel numbers and
 *     mix codes: a small box that fits where the whole row did not, or, when
 *     even that has no clear place, the numbers printed ON its own symbol
 *     (where they cannot be read as another object's). With no number to
 *     keep, it shows nothing. The name comes back as the user zooms in.
 *     `dropped` lists them, so the screen can say so.
 *   • a PERFORMER, and the selected object, always keep their names. When
 *     the name with its mix code has no place, the name alone is tried (the
 *     code is still on the monitor it belongs to); then any free place, with
 *     a leader; then the place that breaks the rules least.
 *   • a PLATFORM's name is left out when neither its own box nor the strip
 *     under it has room (the key names the dashed outline).
 * People are placed first, then everything else in paint order. A label that
 * had to stand away from its symbol gets a leader (stageLabelLeader).
 *
 * An object that is wholly outside the picture (zoomed in, panned away) has
 * no label and is no obstacle. One that is all but outside it (its center
 * past the edge, and less than a third of it showing) has no label either:
 * there is no room beside what is not there, and its name comes back as the
 * drawing slides. What does show of it is still art a name keeps off.
 * `keepOut`: more boxes no label may sit on.
 */
export function stageLabelPlan(items: readonly StageLabelIn[], gw: number, gh: number, keepOut: readonly Box[] = []): StageLabelPlan {
  const glass: Box = { x0: STAGE_FRAME.side, y0: STAGE_FRAME.top, x1: Math.max(STAGE_FRAME.side + 1, gw - STAGE_FRAME.side), y1: Math.max(STAGE_FRAME.top + 1, gh - STAGE_FRAME.bottom) };
  const shown = items.filter((it) => shared(stageBoxBounds(it.box), glass, 0) > 0);
  // every symbol's art (a platform is not art a name must keep off: a name
  // may sit on a riser's deck)
  const art = shown.filter((it) => !it.box.sized).map((it) => ({ id: it.id, box: stageBoxBounds(it.box) }));  const placed: { id: SpId; box: Box }[] = [];
  const leaders: Box[] = [];
  const out = new Map<SpId, StageLabelOut>();
  const dropped: SpId[] = [];
  const bare: SpId[] = [];
  const numbersOut: SpId[] = [];

  const hold = (x0: number, y0: number, m: Block): Spot => {
    // a place that hangs off the picture is first slid back onto it
    const x = clamp(x0, glass.x0 + 1, Math.max(glass.x0 + 1, glass.x1 - m.w - 1));
    const y = clamp(y0, glass.y0 + 1, Math.max(glass.y0 + 1, glass.y1 - m.h - 1));
    return { x0: x, y0: y, box: { x0: x, y0: y, x1: x + m.w, y1: y + m.h } };
  };

  /** Every place a block of this size may be offered, nearest first. */
  const spotsFor = (it: StageLabelIn, m: Block): Spot[] => {
    const bb = stageBoxBounds(it.box, it.selected ? 5 : 0);
    const cx = it.box.cx;
    const cy = it.box.cy;
    const raw: [number, number][] = [];
    if (it.box.sized) {
      const g = 3;
      const own = stageBoxBounds(it.box);
      // inside its own box: the corners and edges; then directly under it
      // (under its selection frame, when it is selected)
      for (const y0 of [own.y0 + g, own.y1 - m.h - g, cy - m.h / 2]) for (const x0 of [own.x0 + g, own.x1 - m.w - g, cx - m.w / 2]) raw.push([x0, y0]);
      for (const x0 of [cx - m.w / 2, own.x0, own.x1 - m.w]) raw.push([x0, bb.y1 + g]);
    } else {
      for (const d of LABEL_STEPS) {
        const g = 3 + d;
        const under = bb.y1 + g;
        const over = bb.y0 - m.h - g;
        const right = bb.x1 + g;
        const left = bb.x0 - m.w - g;
        raw.push([cx - m.w / 2, under], [cx - m.w / 2, over], [right, cy - m.h / 2], [left, cy - m.h / 2]);
        raw.push([cx, under], [cx - m.w, under], [cx, over], [cx - m.w, over]);
        raw.push([cx - m.w / 4, under], [cx - (m.w * 3) / 4, under], [cx - m.w / 4, over], [cx - (m.w * 3) / 4, over]);
        raw.push([right, bb.y1 - m.h / 2], [left, bb.y1 - m.h / 2], [right, bb.y0 - m.h / 2], [left, bb.y0 - m.h / 2]);
        raw.push([right, under], [left, under], [right, over], [left, over]);
      }
    }
    return raw.map(([x0, y0]) => hold(x0, y0, m));
  };

  /** What a place breaks: 0 = it keeps every rule. `nearest: false` leaves
   *  rule 2 out (a performer's name in a crowd). */
  const faults = (it: StageLabelIn, box: Box, nearest = true, apart = false): number => {
    let cost = 0;
    for (const k of keepOut) cost += shared(box, k, 0) * 6;
    for (const pl of placed) if (pl.id !== it.id) cost += shared(box, pl.box, apart || bare.includes(pl.id) ? LABEL_APART_BARE : 1) * 6;
    for (const l of leaders) cost += shared(box, l, 0) * 2;
    const own = art.find((a) => a.id === it.id);
    const ownGap = own ? centerGap(box, own.box) : 0;
    let nearer = false;
    for (const a of art) {
      const over = shared(box, a.box, 0);
      if (over > 0) cost += a.id === it.id ? over + 1 : over * 8 + 20;
      // nearer to another symbol than to its own (a platform's name is
      // judged by rule 4 alone: what stands on it is nearer by nature)
      else if (a.id !== it.id && own && centerGap(box, a.box) < ownGap - 1e-6) nearer = true;
    }
    if (nearer && nearest) cost += 30;
    // a label that stands away from its symbol has a leader: the line may
    // not run through another label or another symbol
    const lead = own ? stageLabelLeader(box, own.box) : null;
    if (lead) {
      const n = Math.max(1, Math.ceil(Math.hypot(lead.x2 - lead.x1, lead.y2 - lead.y1) / 3));
      for (let k = 1; k < n; k++) {
        const x = lead.x1 + ((lead.x2 - lead.x1) * k) / n;
        const y = lead.y1 + ((lead.y2 - lead.y1) * k) / n;
        const hits = (q: Box): boolean => x >= q.x0 && x <= q.x1 && y >= q.y0 && y <= q.y1;
        if (placed.some((pl) => pl.id !== it.id && hits(pl.box)) || art.some((a) => a.id !== it.id && hits(a.box))) cost += 6;
      }
    }
    return cost;
  };

  const first = (it: StageLabelIn, spots: readonly Spot[], nearest = true, apart = false): Spot | null => {
    for (const sp of spots) if (faults(it, sp.box, nearest, apart) === 0) return sp;
    return null;
  };
  /** The place that breaks the rules least (the earliest, on a tie). */
  const leastBad = (it: StageLabelIn, spots: readonly Spot[]): Spot => {
    let best = spots[0];
    let bestCost = Number.POSITIVE_INFINITY;
    spots.forEach((sp, k) => {
      const c = faults(it, sp.box) + k * 0.25;
      if (c < bestCost) {
        best = sp;
        bestCost = c;
      }
    });
    return best;
  };
  const put = (it: StageLabelIn, m: Block, sp: Spot, badges: readonly string[]): void => {
    const lab = layBlock(it.id, m, sp.x0, sp.y0, badges);
    out.set(it.id, lab);
    placed.push({ id: it.id, box: lab.box });
    // a label that stands away from its symbol is joined to it by a leader:
    // later labels keep off that line
    const own = art.find((a) => a.id === it.id);
    const lead = own ? stageLabelLeader(lab.box, own.box) : null;
    if (lead) {
      const n = Math.max(1, Math.ceil(Math.hypot(lead.x2 - lead.x1, lead.y2 - lead.y1) / 4));
      for (let k = 0; k <= n; k++) {
        const x = lead.x1 + ((lead.x2 - lead.x1) * k) / n;
        const y = lead.y1 + ((lead.y2 - lead.y1) * k) / n;
        leaders.push({ x0: x - 1.5, y0: y - 1.5, x1: x + 1.5, y1: y + 1.5 });
      }
    }
  };

  const keeps = (it: StageLabelIn): boolean => it.person || !!it.selected;
  /** Enough of it is in the picture to be named there. */
  const inView = (it: StageLabelIn): boolean => {
    if (it.box.cx >= glass.x0 && it.box.cx <= glass.x1 && it.box.cy >= glass.y0 && it.box.cy <= glass.y1) return true;
    const b = stageBoxBounds(it.box);
    return shared(b, glass, 0) >= (b.x1 - b.x0) * (b.y1 - b.y0) * 0.3;
  };
  const order = [...shown.filter(keeps), ...shown.filter((i) => !keeps(i))].filter((it) => (it.text.trim() || it.badges.length) && inView(it));
  /** The places that stand against the symbol itself (a platform's places
   *  are all its own). */
  const against = (it: StageLabelIn, spots: readonly Spot[]): Spot[] => {
    const own = art.find((a) => a.id === it.id);
    if (!own) return [...spots];
    return spots.filter((sp) => Math.hypot(Math.max(0, own.box.x0 - sp.box.x1, sp.box.x0 - own.box.x1), Math.max(0, own.box.y0 - sp.box.y1, sp.box.y0 - own.box.y1)) <= LABEL_AGAINST + 0.01);
  };
  for (const it of order) {
    const full = measure(it);
    const spots = spotsFor(it, full);
    // rule 2 first (near or far); then a free place against its own symbol
    const whole = first(it, spots) ?? first(it, against(it, spots), false);
    if (whole) {
      put(it, full, whole, it.badges);
      continue;
    }
    if (keeps(it)) {
      // a person and the selection keep their names: the name alone beside
      // them, then any free place, then the least bad place
      if (it.badges.length && it.text.trim()) {
        const nameOnly = measure({ ...it, badges: [] });
        const nameSpots = spotsFor(it, nameOnly);
        // the name alone keeps clear of every other label (LABEL_APART_BARE)
        const alone = first(it, nameSpots, true, true) ?? first(it, against(it, nameSpots), false, true) ?? first(it, nameSpots) ?? first(it, against(it, nameSpots), false);
        const far = alone ? null : first(it, spots, false);
        if (far) {
          put(it, full, far, it.badges);
          continue;
        }
        bare.push(it.id);
        put(it, nameOnly, alone ?? first(it, nameSpots, false) ?? leastBad(it, nameSpots), []);
      } else put(it, full, first(it, spots, false) ?? leastBad(it, spots), it.badges);
      continue;
    }
    // equipment: the NAME goes, the numbers stay
    if (it.text.trim()) dropped.push(it.id);
    if (!it.badges.length) continue;
    const nums = measure({ ...it, text: '' });
    const numSpots = spotsFor(it, nums);
    // …beside the symbol when a place keeps the rules, otherwise ON it
    const onIt = hold(it.box.cx - nums.w / 2, it.box.cy - nums.h / 2, nums);
    const offArt = !art.some((a) => a.id !== it.id && shared(onIt.box, a.box, 0) > 0);
    // on its own symbol, clear of every label and well clear of a name shown
    // alone (S2-03); then any place that keeps the hard rules; then on its
    // own symbol touching nothing; only then the least bad place
    const onItApart = offArt && !placed.some((pl) => shared(onIt.box, pl.box, bare.includes(pl.id) ? LABEL_APART_BARE : 0) > 0);
    const onItClear = offArt && !placed.some((pl) => shared(onIt.box, pl.box, 0) > 0);
    const spot = first(it, numSpots) ?? first(it, against(it, numSpots), false) ?? (onItApart ? onIt : (first(it, numSpots, false) ?? (onItClear ? onIt : null)));
    if (spot) {
      put(it, nums, spot, it.badges);
      continue;
    }
    // LAST: the numbers on their OWN symbol, even over other art, as long as
    // they cover no performer's name. Otherwise they are left out and
    // counted: a badge on a name made "Marisol" read "…isol" (R2-SP1-02).
    const people = new Set(order.filter(keeps).map((x) => x.id));
    if (!placed.some((pl) => people.has(pl.id) && shared(onIt.box, pl.box, 0) > 0)) put(it, nums, onIt, it.badges);
    else numbersOut.push(it.id);
  }
  const labels = items.map((i) => out.get(i.id)).filter((x): x is StageLabelOut => !!x);
  const keepIds = new Set(items.filter((i) => keeps(i)).map((i) => i.id));
  // (closer than 4 units counts: the drawn letters reach a little past the
  // measured box, and two names that close read as touching on a phone)
  const crowded = labels.filter((l) => keepIds.has(l.id) && labels.some((o) => o.id !== l.id && shared(l.box, o.box, 2) > 0)).map((l) => l.id);
  return { labels, dropped, bare, numbersOut, crowded };
}

/** The labels alone (see stageLabelPlan). */
export function stageLabels(items: readonly StageLabelIn[], gw: number, gh: number, keepOut: readonly Box[] = []): StageLabelOut[] {
  return stageLabelPlan(items, gw, gh, keepOut).labels;
}

/** The area two label boxes share (0 = clear), for tests and for the view's
 *  own checks. */
export const stageLabelClash = (a: Box, b: Box): number => shared(a, b, 0);

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
export function stageFacingWord(rot: number, stage?: SpProject['stage']): string {
  // in the round there is no single audience side: said from the reference
  const round = spShapeFacingWords(rot, stage);
  if (round) return round.full;
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
export function stageFacingShort(rot: number, stage?: SpProject['stage']): string {
  const round = spShapeFacingWords(rot, stage);
  if (round) return round.short;
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
  // one decimal in every unit: a typed 45.5 % reads back as 45.5, as the
  // field's hint promises ("kept exactly as typed")
  const k = 10;
  return Math.round(frac * span * k) / k;
}

/** What happened to a typed position or size, in words, when it was not
 *  taken as typed ('' when it was). `taken` is the fraction the edit uses. */
export function stageTypedWords(p: SpProject, axis: 'x' | 'y', what: 'position' | 'size', typed: number | null, taken: number | null): string {
  const unit = stagePosUnit(p);
  const unitWord = unit === '%' ? ` % of the stage ${axis === 'x' ? 'width' : 'depth'}` : ` ${unit}`;
  if (typed == null || !Number.isFinite(typed)) return what === 'size' ? 'Not read as a size, so nothing changed. Type a number above 0, like 20.' : 'Not read as a number, so nothing changed. Type a number, like 40.';
  if (taken == null) return what === 'size' ? 'A size must be above 0, so nothing changed.' : 'Not read as a number, so nothing changed.';
  const back = stagePosValue(p, axis, taken);
  if (Math.abs(back - typed) < 0.051) return '';
  if (what === 'size') return `A platform cannot be larger than the stage, so it was set to ${back}${unitWord}, the stage’s full ${axis === 'x' ? 'width' : 'depth'}.`;
  return `An object can stand at most a quarter of the stage off it, so it was set to ${back}${unitWord}.`;
}

/** A typed number back to a stage fraction, held inside the model's reach.
 *  Null when the number is not usable. */
export function stagePosFraction(p: SpProject, axis: 'x' | 'y', value: number | null): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const unit = stagePosUnit(p);
  const span = unit === '%' ? 100 : axis === 'x' ? (p.stage.width as number) : (p.stage.depth as number);
  if (!(span > 0)) return null;
  const lim = spMoveLimits(p.stage);
  return clamp(value / span, axis === 'x' ? lim.x0 : lim.y0, axis === 'x' ? lim.x1 : lim.y1);
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

/** A name split at its spaces into `n` lines of about the same length
 *  (never cut; fewer lines when it has fewer words). */
function keyBalanced(name: string, n: number): string[] {
  const cuts: number[] = [];
  for (let k = 1; k < n; k++) {
    const target = (name.length * k) / n;
    let best = -1;
    for (let i = (cuts[cuts.length - 1] ?? -1) + 1; i < name.length; i++) if (name[i] === ' ' && (best < 0 || Math.abs(i - target) < Math.abs(best - target))) best = i;
    if (best >= 0) cuts.push(best);
  }
  const out: string[] = [];
  let from = 0;
  for (const c of cuts) {
    out.push(name.slice(from, c));
    from = c + 1;
  }
  out.push(name.slice(from));
  return out.filter((line) => line.length > 0);
}

/** A name on as few lines as fit `maxW`, broken at spaces (never cut). A
 *  name wider than `wrapW` is first split into two or three lines of about
 *  the same length, so a long name makes a narrow cell of two or three lines
 *  ("Wedge monitor / (speaker side faces / the performer)"). */
function keyNameLines(name: string, maxW: number, wrapW: number): string[] {
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
  const n = Math.min(3, Math.max(1, Math.ceil(keyTextW(name) / wrapW)));
  return (n > 1 && name.includes(' ') ? keyBalanced(name, n) : [name]).flatMap(fit);
}

function keyLayoutWith<K extends string>(entries: readonly { kind: K; name: string }[], gw: number, wrapW: number, note: string): StageKeyLayout<K> {
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
    const lines = keyNameLines(e.name, narrow - STAGE_KEY_ART.w - KEY_ART_GAP, wrapW);
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
 *  fits; then no line wider than this many glass units (a long name on two
 *  or three lines of about the same length). */
const KEY_WRAPS: readonly number[] = [Number.POSITIVE_INFINITY, 135, 110, 95, 80];

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
  for (const wrapW of KEY_WRAPS.slice(1)) {
    const tryIt = keyLayoutWith(entries, gw, wrapW, note);
    if (tryIt.height < best.height - 1e-6) best = tryIt;
  }
  return best;
}

/** THE STAGE KEEPS ITS ROOM (bug test S1-01, 2026-11-13). The key is part
 *  of the drawing, always, but it may take at most this share of the
 *  display's height: on a short phone with many kinds on the stage it took
 *  two thirds of it and left the stage a strip. Past the share, the key's
 *  strip SCROLLS inside the display (it is never cut, never a popup). */
export const STAGE_KEY_SHARE = 0.3;
/** …and never less than this (glass units): its heading row and one row of
 *  kinds, so it can always be read and scrolled. */
export const STAGE_KEY_MIN_SHOWN = 2 * KEY_ROW_H + KEY_ROW_GAP + KEY_PAD_TOP + KEY_PAD_BOTTOM;

/** Split the display (glass units) between the stage and its key: the key
 *  its whole height when that fits in its share, otherwise its share, and
 *  then it scrolls. */
export function stageKeySplit(displayH: number, keyH: number): { stage: number; key: number; scrolls: boolean } {
  const cap = Math.max(STAGE_KEY_MIN_SHOWN, displayH * STAGE_KEY_SHARE);
  // a key only a little over its share is shown whole: a strip that scrolls
  // by a few points only hides a line behind its own "more" tag
  const key = keyH <= cap * 1.12 ? keyH : cap;
  return { stage: Math.max(0, displayH - key), key, scrolls: keyH > key + 0.5 };
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
