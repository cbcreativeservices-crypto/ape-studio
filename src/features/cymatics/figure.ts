/**
 * cymatics/figure — the drawable layers of a pattern (outline, node lines,
 * region fills) in PIXELS, shared by the on-screen figure (react-native-svg),
 * the art board's hit-testing, the compare canvas and the SVG / PDF exports.
 * One place decides what a pattern looks like; every surface draws it.
 */
import { isoLines, labelRegions, polylinesToPath, regionAt, regionBoundary, regionCentroid, rotatePoint, type Polyline, type Pt, type RegionMap } from './contours';
import type { PatternGeometry } from './patternField';
import type { Artwork, RegionFill } from './patternStore';

/** The one grid size every gallery surface labels regions on (region ids in
 *  an Artwork are only meaningful at this N). */
export const ART_N = 96;
/** Padding the on-screen figure keeps inside its box (px). */
export const FIG_PAD = 10;
/** Line weights are authored at this figure width (px); other sizes scale. */
export const LINE_REF_W = 340;

export type FigureFrame = {
  /** Figure box in px (the plate fills it, aspect-correct). */
  ox: number;
  oy: number;
  w: number;
  h: number;
};

/** Fit the pattern's domain into a width×height canvas with padding. */
export function fitFrame(aspect: number, width: number, height: number, pad = 10): FigureFrame {
  const availW = Math.max(1, width - pad * 2);
  const availH = Math.max(1, height - pad * 2);
  const w = Math.min(availW, availH / aspect);
  const h = w * aspect;
  return { ox: (width - w) / 2, oy: (height - h) / 2, w, h };
}

export const toPx = (f: FigureFrame) => (p: Pt): Pt => ({ x: f.ox + p.x * f.w, y: f.oy + p.y * f.w });

/** SVG path data of the object outline (even-odd for holes / rings). */
export function outlinePath(g: PatternGeometry, f: FigureFrame): string {
  const m = toPx(f);
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const o = g.outline;
  if (o.kind === 'circle' || o.kind === 'ring') {
    const c = m({ x: 0.5, y: g.aspect / 2 });
    const r = f.w / 2;
    const circ = (rad: number) => `M${r2(c.x - rad)} ${r2(c.y)}a${r2(rad)} ${r2(rad)} 0 1 0 ${r2(rad * 2)} 0a${r2(rad)} ${r2(rad)} 0 1 0 ${r2(-rad * 2)} 0Z`;
    return o.kind === 'ring' ? circ(r) + circ(r * o.inner) : circ(r);
  }
  if (o.kind === 'rect') {
    const rx = o.rx * f.w;
    const x0 = f.ox;
    const y0 = f.oy;
    const x1 = f.ox + f.w;
    const y1 = f.oy + f.h;
    return `M${r2(x0 + rx)} ${r2(y0)}H${r2(x1 - rx)}Q${r2(x1)} ${r2(y0)} ${r2(x1)} ${r2(y0 + rx)}V${r2(y1 - rx)}Q${r2(x1)} ${r2(y1)} ${r2(x1 - rx)} ${r2(y1)}H${r2(x0 + rx)}Q${r2(x0)} ${r2(y1)} ${r2(x0)} ${r2(y1 - rx)}V${r2(y0 + rx)}Q${r2(x0)} ${r2(y0)} ${r2(x0 + rx)} ${r2(y0)}Z`;
  }
  const polys: Polyline[] = [{ pts: o.outline, closed: true }, ...o.holes.map((h) => ({ pts: h, closed: true }))];
  return polylinesToPath(polys, m);
}

/** Everything derived from the field once per (geometry): nodal lines and the
 *  region map. Cached per geometry object. */
export type FigureAnalysis = { lines: Polyline[]; regions: RegionMap; boundaries: Map<number, Polyline[]> };
const cache = new WeakMap<PatternGeometry, FigureAnalysis>();
export function analyse(g: PatternGeometry): FigureAnalysis {
  let a = cache.get(g);
  if (!a) {
    a = { lines: isoLines(g.field, g.N, g.aspect, 0), regions: labelRegions(g.field, g.N), boundaries: new Map() };
    cache.set(g, a);
  }
  return a;
}
export function boundaryOf(g: PatternGeometry, region: number): Polyline[] {
  const a = analyse(g);
  let b = a.boundaries.get(region);
  if (!b) {
    b = regionBoundary(g.field, g.N, g.aspect, a.regions, region);
    a.boundaries.set(region, b);
  }
  return b;
}

export type FillLayer = { region: number; d: string; color: string; style: 'solid' | 'gradient'; cx: number; cy: number; r: number };
export type FigureLayers = {
  outlineD: string;
  linesD: string;
  fills: FillLayer[];
  frame: FigureFrame;
};

/** The paths of a figure at a frame, with an optional artwork's fills. */
export function figureLayers(g: PatternGeometry, f: FigureFrame, art: Artwork | null): FigureLayers {
  const m = toPx(f);
  const a = analyse(g);
  const fills: FillLayer[] = [];
  if (art && art.N === g.N) {
    for (const fill of art.fills) {
      if (fill.region < 0 || fill.region >= a.regions.count) continue;
      const loops = boundaryOf(g, fill.region);
      const c = m(regionCentroid(a.regions, g.N, g.aspect, fill.region));
      fills.push({ region: fill.region, d: polylinesToPath(loops, m), color: fill.color, style: fill.style, cx: c.x, cy: c.y, r: Math.sqrt(a.regions.size[fill.region] / (g.N * g.N)) * f.w * 0.9 + 4 });
    }
  }
  return { outlineD: outlinePath(g, f), linesD: polylinesToPath(a.lines, m), fills, frame: f };
}

/** The region under a canvas point (px), or −1. */
export function regionAtPx(g: PatternGeometry, f: FigureFrame, x: number, y: number): number {
  const a = analyse(g);
  const dx = (x - f.ox) / f.w;
  const dy = (y - f.oy) / f.w;
  if (dx < 0 || dy < 0 || dx > 1 || dy > g.aspect) return -1;
  return regionAt(a.regions, g.N, g.aspect, dx, dy);
}

/** Apply a fill (or erase with color null) at a region, with the artwork's
 *  rotational symmetry: every region under the rotated tap point gets it too.
 *  Returns the new fills list (never mutates). */
export function applyFill(g: PatternGeometry, art: Artwork, region: number, tap: Pt, fill: Omit<RegionFill, 'region'> | null): RegionFill[] {
  const a = analyse(g);
  const targets = new Set<number>([region]);
  const k = Math.max(1, Math.round(art.symmetry));
  for (let i = 1; i < k; i++) {
    const q = rotatePoint(tap, g.aspect, k, i);
    const r = regionAt(a.regions, g.N, g.aspect, q.x, q.y);
    if (r >= 0) targets.add(r);
  }
  const rest = art.fills.filter((x) => !targets.has(x.region));
  if (!fill) return rest;
  const added: RegionFill[] = [...targets].map((r) => ({ region: r, color: fill.color, style: fill.style }));
  return [...rest, ...added];
}

/** Domain point of a canvas point (for symmetry). */
export function domainPoint(f: FigureFrame, x: number, y: number): Pt {
  return { x: (x - f.ox) / f.w, y: (y - f.oy) / f.w };
}

/** Darken a hex colour toward black by `amount` 0..1 (gradient outer stop). */
export function shade(hex: string, amount: number): string {
  const s = hex.replace('#', '');
  if (s.length !== 6) return hex;
  const c = [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
  const k = 1 - Math.max(0, Math.min(1, amount));
  return `#${c.map((v) => Math.round(v * k).toString(16).padStart(2, '0')).join('')}`;
}
