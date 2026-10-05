/**
 * Path helpers and the palette for Lab 1's concert lessons (M06–M08). Build-
 * time only (paths are made once per drawing and cached by the caller). The
 * colours are the house tokens and the shared drum family's material ramps
 * (drums/DrumArt.tsx), lit from the upper left.
 */
import { Skia } from '@shopify/react-native-skia';

export type SkPath = ReturnType<typeof Skia.Path.Make>;

export const AMBER = '#ffc64d';
export const BLUE = '#6fa8ff';
export const AIR = '#9cc4ff';
export const GREY = '#8a8f9c';
export const INK = '#08080a';
export const CHROME = ['#3a3d45', '#eef1f6', '#9aa0ab', '#4a4e57', '#c8ccd4'];
export const CHROME_V = ['#f2f4f8', '#9aa0ab', '#4a4e57', '#c8ccd4'];
export const CHROME_DARK = '#2a2c32';
export const PLY = ['#4a2a12', '#b98548', '#d9a766', '#9c6631', '#c48f52', '#8a5426', '#5c3417'];
export const PLY_LINE = '#2b170a';
export const CAVITY = ['#0a0806', '#241910', '#33251a', '#2a1e14', '#140e09', '#070605'];
export const LACQUER = ['#3a2210', '#9c6631', '#e2b679', '#c48f52', '#7a4a20', '#2f1b0a'];
export const HOOP_CUT = ['#3a220e', '#9a6430', '#c48a4c', '#7a4a20', '#2f1b0a'];
export const HOOP_FAR = ['#1d1108', '#4a2c13', '#5e3a1b', '#2a180b'];
export const HEAD_COATED = ['#fbf8f0', '#ece5d5', '#d6ccb7'];
export const HEAD_CALF = ['#f3e7c9', '#e2cfa3', '#c6ad7c'];
/** Copper (a timpani kettle), lit from the upper left. */
export const COPPER = ['#4a1c0c', '#b5562a', '#f0a070', '#d07a44', '#8a3a18', '#3a140a'];
export const COPPER_POS = [0, 0.14, 0.32, 0.55, 0.82, 1];
export const FELT = ['#fffaf0', '#e7dfcb', '#a99f88'];
export const FLOOR = ['#202128', '#141519', '#0b0b0e'];
export const BRONZE = ['#f6d58f', '#d2a04a', '#9a6a24', '#5e3e12'];
export const WOOD_LIGHT = ['#e9c48a', '#c48f52', '#8a5426'];

export const make = () => Skia.Path.Make();
export function rect(p: SkPath, x0: number, y0: number, x1: number, y1: number): SkPath {
  p.addRect(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)));
  return p;
}
export function rrect(p: SkPath, x0: number, y0: number, x1: number, y1: number, r: number): SkPath {
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)), r, r));
  return p;
}
export function seg(p: SkPath, a: number, b: number, c: number, d: number): SkPath {
  p.moveTo(a, b);
  p.lineTo(c, d);
  return p;
}
export function oval(p: SkPath, cx: number, cy: number, rx: number, ry: number): SkPath {
  p.addOval(Skia.XYWHRect(cx - rx, cy - ry, rx * 2, ry * 2));
  return p;
}
/** A line with an open arrowhead at its end (an overlay mark). */
export function arrow(p: SkPath, x0: number, y0: number, x1: number, y1: number, head = 22): SkPath {
  p.moveTo(x0, y0);
  p.lineTo(x1, y1);
  const a = Math.atan2(y1 - y0, x1 - x0);
  p.moveTo(x1 - head * Math.cos(a - 0.45), y1 - head * Math.sin(a - 0.45));
  p.lineTo(x1, y1);
  p.lineTo(x1 - head * Math.cos(a + 0.45), y1 - head * Math.sin(a + 0.45));
  return p;
}
/** Concentric arcs (radiation marks: WHERE sound leaves, never how much). */
export function arcs(p: SkPath, cx: number, cy: number, radii: readonly number[], a0: number, a1: number): SkPath {
  for (const r of radii) p.addArc(Skia.XYWHRect(cx - r, cy - r, 2 * r, 2 * r), a0, a1 - a0);
  return p;
}
/** A closed polygon from points. */
export function poly(pts: readonly { x: number; y: number }[]): SkPath {
  const p = make();
  pts.forEach((q, i) => (i === 0 ? p.moveTo(q.x, q.y) : p.lineTo(q.x, q.y)));
  p.close();
  return p;
}
/** A tripod's legs from a hub (plan or side), n legs from angle `phase`. */
export function legs(p: SkPath, cx: number, cy: number, r0: number, r1: number, n: number, phase: number): SkPath {
  for (let k = 0; k < n; k++) {
    const a = phase + (k / n) * 2 * Math.PI;
    p.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    p.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
  }
  return p;
}
