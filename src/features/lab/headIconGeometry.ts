/**
 * THE HEAD ICONS — geometry (owner art 2026-07-29, head fix 2026-10-08).
 *
 * OWNER RULE (2026-10-08): "The head icons are only to be used when a head is
 * alone. They are not to be used when attached to a body." A listener, a
 * talker, a plan marker, an avatar → these icons. A head on a body → the
 * figure's own skin-silhouette head (figureHead.tsx / PlayerFigure FigureHead),
 * never the icon and never a circle.
 *
 * Two icons, both the owner's supplied art (assets/Head_icon_side.PNG and
 * assets/Head_icon_above.PNG — read only, never edited): minimal LINE ART, ONE
 * uniform stroke, rounded caps and joins, NO fill / shading / gradient, bald,
 * transparent. On our near-black labs the stroke is a light neutral
 * (HEAD_ICON_LINE) with an optional tint riding on it as a state accent; the
 * ONLY fill allowed is the dark readability plate where an icon sits over a
 * busy heat map.
 *
 *   SIDE  (profile) — authored FACING LEFT (the owner: mirror it for right).
 *         Head units; ORIGIN = THE MOUTH (lip line y = 0, front of the lips
 *         x = 0). Crown −35.1 · chin +10.5 · neck base +20.9 · nose tip
 *         x −11.3 · occiput x +32.5. Moved here verbatim from
 *         micspeaker/viz.tsx (buildProfileHead) — no visual change there.
 *   ABOVE — the owner's "above" icon: a big cranium seen from above and in
 *         front, the ears at its widest, the brows, nose and mouth foreshortened
 *         at the CHIN end. Traced from Head_icon_above.PNG (stroke centre-lines
 *         measured from the art, 2026-10-08). Units: crown→chin = 100, ORIGIN =
 *         the middle of that span; the chin end points +y, i.e. the canon person
 *         FACES DOWN THE SCREEN. In a top-down plan the icon is ROTATED to the
 *         way the person faces (owner decision 2026-10-08) — aboveRotation().
 *
 * Pure geometry: no Skia, no react-native-svg. Every builder writes into a
 * PathSink, which an SkPath satisfies (headIcons.tsx) and svgPathSink() turns
 * into an SVG path string (headIconsSvg.tsx). One geometry, two renderers.
 */

export interface PathSink {
  moveTo(x: number, y: number): unknown;
  lineTo(x: number, y: number): unknown;
  cubicTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): unknown;
  close(): unknown;
}

/** The light neutral stroke on our near-black labs (owner spec ~#d7dbe2). */
export const HEAD_ICON_LINE = '#d7dbe2';
/** The ONLY fill the icons may carry: a dark readability plate under the line
 *  art where it sits over a heat-map field. */
export const HEAD_ICON_PLATE = 'rgba(9,10,14,0.62)';

/** SIDE canon, head units (origin = mouth, authored facing LEFT). */
export const SIDE_CANON = {
  crown: -35.1,
  chin: 10.5,
  neckBase: 20.9,
  noseTip: -11.3,
  occiput: 32.5,
  /** crown → chin */
  height: 45.6,
  /** the owner's art: one uniform stroke ≈ 3.4 % of the head height */
  stroke: 1.55,
} as const;

/** ABOVE canon (origin = middle of crown→chin, chin toward +y). */
export const ABOVE_CANON = {
  top: -50,
  bottom: 50,
  /** half width across the ears */
  halfW: 39.7,
  height: 100,
  /** the owner's art: one uniform stroke ≈ 1.9 % of the head height */
  stroke: 1.9,
} as const;

/* ── SIDE (profile) — verbatim from micspeaker/viz.tsx 2026-07-29 ── */

export function appendSideOutline(p: PathSink, s: number): void {
  p.moveTo(16.8 * s, -0.6 * s); // the ramus, just in front of the ear
  p.cubicTo(16.6 * s, 6.4 * s, 15.0 * s, 10.0 * s, 12.0 * s, 11.4 * s); // → gonion
  p.cubicTo(7.0 * s, 13.4 * s, 1.5 * s, 12.6 * s, -3.0 * s, 9.7 * s); // jaw → chin
  p.cubicTo(-4.4 * s, 8.5 * s, -5.6 * s, 7.8 * s, -5.6 * s, 6.7 * s); // chin projects
  p.cubicTo(-5.6 * s, 5.5 * s, -4.0 * s, 5.1 * s, -4.0 * s, 3.5 * s); // …tucks under
  p.cubicTo(-4.2 * s, 2.5 * s, -5.2 * s, 2.3 * s, -5.2 * s, 1.5 * s); // fuller lower lip
  p.cubicTo(-5.2 * s, 0.8 * s, -4.4 * s, 0.5 * s, -3.9 * s, 0.0 * s); // lip notch (= origin plane)
  p.cubicTo(-4.3 * s, -0.7 * s, -4.7 * s, -1.1 * s, -4.9 * s, -1.5 * s); // upper lip
  p.cubicTo(-4.4 * s, -2.5 * s, -3.6 * s, -3.0 * s, -2.6 * s, -3.9 * s); // philtrum
  p.cubicTo(-4.8 * s, -4.3 * s, -6.8 * s, -4.6 * s, -8.6 * s, -5.2 * s); // nose base / wing
  p.cubicTo(-10.3 * s, -5.7 * s, -11.3 * s, -6.5 * s, -11.3 * s, -7.7 * s); // nostril undercut → tip
  p.cubicTo(-11.3 * s, -9.6 * s, -9.3 * s, -11.7 * s, -6.5 * s, -14.7 * s); // straight bridge
  p.cubicTo(-4.5 * s, -16.7 * s, -3.4 * s, -17.5 * s, -3.0 * s, -18.7 * s); // nasion notch
  p.cubicTo(-2.8 * s, -19.7 * s, -4.0 * s, -20.2 * s, -4.0 * s, -21.4 * s); // brow
  p.cubicTo(-4.0 * s, -24.1 * s, -2.4 * s, -27.2 * s, 0.6 * s, -29.9 * s); // forehead slope
  p.cubicTo(3.8 * s, -32.8 * s, 8.2 * s, -34.8 * s, 13.5 * s, -35.1 * s); // crown
  p.cubicTo(21.2 * s, -35.6 * s, 28.0 * s, -31.6 * s, 30.5 * s, -25.3 * s);
  p.cubicTo(32.5 * s, -20.3 * s, 32.1 * s, -14.3 * s, 29.9 * s, -8.9 * s); // FULL at the back
  p.cubicTo(28.4 * s, -5.3 * s, 26.4 * s, -2.3 * s, 25.4 * s, 1.5 * s); // occiput → mastoid
  p.cubicTo(24.6 * s, 4.5 * s, 24.1 * s, 7.7 * s, 23.7 * s, 11.1 * s); // nape
}

/** The side icon's stroked family (outline, neck column, ear, lip line). */
export function buildSideLines(lines: PathSink, s: number): void {
  appendSideOutline(lines, s);
  // Thick squared neck column: two open lines, jaw → base and nape → base.
  lines.moveTo(6.2 * s, 13.2 * s);
  lines.lineTo(7.6 * s, 20.9 * s);
  lines.moveTo(23.7 * s, 11.1 * s);
  lines.lineTo(23.4 * s, 20.9 * s);
  // Ear, mid-skull: outer helix oval…
  lines.moveTo(14.2 * s, -14.7 * s);
  lines.cubicTo(17.6 * s, -16.7 * s, 21.4 * s, -14.9 * s, 21.6 * s, -10.7 * s);
  lines.cubicTo(21.8 * s, -7.3 * s, 19.8 * s, -4.5 * s, 17.2 * s, -3.3 * s);
  lines.cubicTo(15.2 * s, -2.4 * s, 13.6 * s, -3.5 * s, 13.4 * s, -5.7 * s);
  lines.cubicTo(13.2 * s, -8.7 * s, 13.4 * s, -12.1 * s, 14.2 * s, -14.7 * s);
  lines.close();
  // …plus the small inner fold curl.
  lines.moveTo(15.4 * s, -13.3 * s);
  lines.cubicTo(18.6 * s, -13.7 * s, 19.8 * s, -10.9 * s, 18.8 * s, -7.9 * s);
  lines.cubicTo(18.2 * s, -6.1 * s, 16.8 * s, -5.1 * s, 15.6 * s, -5.1 * s);
  // Lip line running back into the face from the notch.
  lines.moveTo(-4.2 * s, 0.1 * s);
  lines.cubicTo(-2.6 * s, 0.8 * s, -0.8 * s, 0.9 * s, 0.6 * s, 0.4 * s);
}

/** Speaking variant: the lip strokes open into a small mouth lens. */
export function buildSideOpenMouth(open: PathSink, s: number): void {
  open.moveTo(-4.4 * s, -0.8 * s);
  open.cubicTo(-2.4 * s, -1.8 * s, -0.4 * s, -1.4 * s, 1.0 * s, -0.3 * s);
  open.cubicTo(-0.4 * s, 1.8 * s, -2.8 * s, 2.0 * s, -4.4 * s, 0.9 * s);
  open.close();
}

/**
 * The owner's side PNG's own FILLED silhouette (head + neck column), in head
 * units with the front of the lips at the origin (2026-10-10, lips-anchor
 * fix): traced from the alpha channel of assets/icons/head-side.png — per
 * 3-px row, the outermost edge on each side — so the dark readability plate
 * sits exactly under the art. (The old plate reused the vector tracing, which
 * missed the PNG's nose and lips and left a gap at the neck.)
 */
const SIDE_PNG_SILHOUETTE: readonly (readonly [number, number])[] = [[18.83, -37.39], [14.59, -36.6], [12.46, -35.8], [10.61, -35.01], [9.28, -34.21], [8.22, -33.42], [7.16, -32.62], [6.36, -31.82], [5.83, -31.03], [5.04, -30.23], [4.51, -29.44], [3.98, -28.64], [3.71, -27.85], [3.18, -27.05], [2.92, -26.26], [2.65, -25.46], [2.39, -24.66], [2.12, -23.87], [2.12, -23.07], [1.59, -22.28], [1.33, -21.48], [1.06, -20.69], [0.8, -19.89], [0.8, -19.09], [1.06, -18.3], [1.33, -17.5], [1.86, -16.71], [2.12, -15.91], [1.59, -15.12], [1.06, -14.32], [0.53, -13.53], [0.0, -12.73], [-0.8, -11.93], [-1.33, -11.14], [-1.86, -10.34], [-2.39, -9.55], [-3.18, -8.75], [-3.45, -7.96], [-3.71, -7.16], [-3.45, -6.36], [-2.65, -5.57], [0.27, -4.77], [0.27, -3.98], [0.0, -3.18], [-0.27, -2.39], [0.0, -1.59], [1.86, -0.8], [3.98, 0.0], [1.33, 0.8], [0.53, 1.59], [0.27, 2.39], [0.53, 3.18], [1.33, 3.98], [2.12, 4.77], [1.86, 5.57], [1.59, 6.36], [1.59, 7.16], [1.86, 7.96], [2.12, 8.75], [2.92, 9.55], [14.32, 10.34], [15.12, 11.14], [15.38, 11.93], [15.65, 12.73], [15.91, 13.53], [15.91, 14.32], [15.91, 15.12], [15.91, 15.91], [15.91, 16.71], [15.91, 17.5], [15.91, 18.3], [15.91, 19.09], [16.44, 19.89], [16.44, 19.89], [36.07, 19.89], [36.07, 19.89], [36.6, 19.09], [36.6, 18.3], [36.33, 17.5], [36.33, 16.71], [36.07, 15.91], [36.07, 15.12], [36.07, 14.32], [35.8, 13.53], [35.8, 12.73], [35.8, 11.93], [35.54, 11.14], [35.54, 10.34], [35.54, 9.55], [35.27, 8.75], [35.27, 7.96], [35.27, 7.16], [35.27, 6.36], [35.27, 5.57], [35.27, 4.77], [35.27, 3.98], [35.54, 3.18], [35.8, 2.39], [36.07, 1.59], [36.33, 0.8], [36.86, 0.0], [37.39, -0.8], [37.92, -1.59], [38.46, -2.39], [38.99, -3.18], [39.52, -3.98], [40.31, -4.77], [40.58, -5.57], [41.11, -6.36], [41.64, -7.16], [41.9, -7.96], [42.43, -8.75], [42.7, -9.55], [42.96, -10.34], [43.23, -11.14], [43.49, -11.93], [43.49, -12.73], [43.76, -13.53], [43.76, -14.32], [43.76, -15.12], [43.76, -15.91], [43.76, -16.71], [43.76, -17.5], [43.76, -18.3], [43.76, -19.09], [43.76, -19.89], [43.49, -20.69], [43.23, -21.48], [43.23, -22.28], [42.96, -23.07], [42.7, -23.87], [42.43, -24.66], [41.9, -25.46], [41.64, -26.26], [41.11, -27.05], [40.58, -27.85], [40.31, -28.64], [39.52, -29.44], [38.99, -30.23], [38.19, -31.03], [37.39, -31.82], [36.6, -32.62], [35.54, -33.42], [34.48, -34.21], [32.89, -35.01], [31.29, -35.8], [28.91, -36.6], [24.93, -37.39]];

/** Readability plate: the PNG's filled silhouette (fill only). */
export function buildSidePlate(plate: PathSink, s: number): void {
  SIDE_PNG_SILHOUETTE.forEach(([x, y], i) => (i === 0 ? plate.moveTo(x * s, y * s) : plate.lineTo(x * s, y * s)));
  plate.close();
}

/* ── ABOVE — traced from the owner's Head_icon_above.PNG ── */

type XY = readonly [number, number];

/** Catmull-Rom through points as cubics (the house smooth()), closed or open. */
export function catmullInto(p: PathSink, pts: readonly XY[], s: number, closed: boolean, tension = 0.5): void {
  const n = pts.length;
  const at = (i: number): XY => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const k = tension / 3;
  p.moveTo(pts[0][0] * s, pts[0][1] * s);
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    p.cubicTo(
      (p1[0] + (p2[0] - p0[0]) * k) * s,
      (p1[1] + (p2[1] - p0[1]) * k) * s,
      (p2[0] - (p3[0] - p1[0]) * k) * s,
      (p2[1] - (p3[1] - p1[1]) * k) * s,
      p2[0] * s,
      p2[1] * s,
    );
  }
  if (closed) p.close();
}

const mirror = (pts: readonly XY[]): XY[] => pts.map(([x, y]) => [-x, y] as XY);

/** Left half of the cranium → jaw → chin, crown first (stroke centre-lines
 *  of the art, crown→chin normalised to 100). */
const ABOVE_LEFT: readonly XY[] = [
  [0, -50],
  [-15.9, -46.7],
  [-25.3, -40.2],
  [-30.1, -33.7],
  [-32.6, -27.1],
  [-33.8, -20.6],
  [-34.1, -13.6],
  [-33.6, -6.4],
  [-32.6, 0.4],
  [-30.4, 7.6],
  [-29.2, 14.3],
  [-27.8, 20.8],
  [-24.8, 27.3],
  [-19.6, 33.9],
  [-14.1, 40.4],
  [-8.6, 46.6],
  [-3.6, 49.6],
];
const ABOVE_SHELL: readonly XY[] = [...ABOVE_LEFT, ...mirror(ABOVE_LEFT.slice(1)).reverse()];
/** Left ear: a loop out from the skull at the widest point and back in. */
const ABOVE_EAR: readonly XY[] = [
  [-34.2, -13.8],
  [-36.8, -13.8],
  [-38.9, -12.4],
  [-39.7, -9.6],
  [-38.6, -5.3],
  [-36.6, -1.0],
  [-34.9, 2.7],
  [-32.9, 4.9],
  [-31.0, 6.2],
];
/** Left brow: a long sweep in from the temple, curling down at the nose. */
const ABOVE_BROW: readonly XY[] = [
  [-22.7, 21.0],
  [-19.2, 23.5],
  [-14.8, 25.4],
  [-9.9, 26.1],
  [-6.6, 27.0],
  [-4.8, 29.4],
  [-4.1, 32.1],
];
/** The nose: two nostril hooks joined under the tip. */
const ABOVE_NOSE_L: readonly XY[] = [
  [-6.4, 36.1],
  [-6.1, 38.5],
  [-3.9, 40.6],
  [0, 42.6],
];
const ABOVE_NOSE: readonly XY[] = [...ABOVE_NOSE_L, ...mirror(ABOVE_NOSE_L.slice(0, -1)).reverse()];
const ABOVE_MOUTH: readonly XY[] = [
  [-4.8, 44.7],
  [0, 45.7],
  [4.8, 44.7],
];

export function buildAboveLines(lines: PathSink, s: number): void {
  catmullInto(lines, ABOVE_SHELL, s, true, 0.55);
  for (const ear of [ABOVE_EAR, mirror(ABOVE_EAR)]) catmullInto(lines, ear, s, false);
  for (const brow of [ABOVE_BROW, mirror(ABOVE_BROW)]) catmullInto(lines, brow, s, false);
  catmullInto(lines, ABOVE_NOSE, s, false);
  catmullInto(lines, ABOVE_MOUTH, s, false);
}

export function buildAbovePlate(plate: PathSink, s: number): void {
  catmullInto(plate, ABOVE_SHELL, s, true, 0.55);
  for (const ear of [ABOVE_EAR, mirror(ABOVE_EAR)]) catmullInto(plate, ear, s, true);
}

/** Rotation (radians) that turns the ABOVE icon (canon: faces +y, down the
 *  screen) to face along (dx, dy) in screen coordinates. */
export function aboveRotation(dx: number, dy: number): number {
  return Math.atan2(dy, dx) - Math.PI / 2;
}

/* ── SVG path strings (unit scale) for the react-native-svg renderer ── */

const f = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
};

/** A PathSink that records an SVG path `d` string. */
export function svgPathSink(): PathSink & { d: () => string } {
  const parts: string[] = [];
  return {
    moveTo: (x, y) => parts.push(`M${f(x)} ${f(y)}`),
    lineTo: (x, y) => parts.push(`L${f(x)} ${f(y)}`),
    cubicTo: (a, b, c, d, x, y) => parts.push(`C${f(a)} ${f(b)} ${f(c)} ${f(d)} ${f(x)} ${f(y)}`),
    close: () => parts.push('Z'),
    d: () => parts.join(''),
  };
}

const svgOf = (build: (p: PathSink, s: number) => void): string => {
  const p = svgPathSink();
  build(p, 1);
  return p.d();
};

/** Unit-scale SVG `d` strings: side icon (head units, origin = mouth, facing
 *  LEFT) and above icon (crown→chin 100, origin = centre, facing +y). */
export const HEAD_SIDE_SVG = {
  lines: svgOf(buildSideLines),
  plate: svgOf(buildSidePlate),
  open: svgOf(buildSideOpenMouth),
} as const;
export const HEAD_ABOVE_SVG = {
  lines: svgOf(buildAboveLines),
  plate: svgOf(buildAbovePlate),
} as const;

export type HeadIconView = 'side' | 'above';

/** The px-per-unit scale that draws an icon `size` px tall (crown→chin). */
export function headIconScale(view: HeadIconView, size: number): number {
  return size / (view === 'side' ? SIDE_CANON.height : ABOVE_CANON.height);
}

/**
 * Append a PLACED icon (positioned, scaled, faced/rotated) into one path —
 * for a row or a crowd of lone heads drawn as ONE stroked path (and,
 * optionally, one plate path) instead of a component per head. `size` =
 * crown→chin in px. Side: (x, y) = the mouth, or with anchor 'neck' the
 * middle of the neck base (to stand an icon on a line). Above: (x, y) = the
 * centre; `rotation` from aboveRotation().
 */
export function appendHeadIcon(
  lines: PathSink,
  plate: PathSink | null,
  view: HeadIconView,
  x: number,
  y: number,
  size: number,
  opts: { facing?: 'left' | 'right'; rotation?: number; anchor?: 'origin' | 'neck' } = {},
): void {
  const s = headIconScale(view, size);
  const m = view === 'side' && (opts.facing ?? 'right') === 'right' ? -1 : 1;
  const r = opts.rotation ?? 0;
  const c = Math.cos(r);
  const sn = Math.sin(r);
  // anchor 'neck': shift so the neck base centre is the origin.
  const ox = view === 'side' && opts.anchor === 'neck' ? -SIDE_NECK[0] * s : 0;
  const oy = view === 'side' && opts.anchor === 'neck' ? -SIDE_NECK[1] * s : 0;
  const T = (px: number, py: number): [number, number] => {
    const lx = m * (px + ox);
    const ly = py + oy;
    return [x + lx * c - ly * sn, y + lx * sn + ly * c];
  };
  const placed = (p: PathSink): PathSink => ({
    moveTo: (a, b) => p.moveTo(...T(a, b)),
    lineTo: (a, b) => p.lineTo(...T(a, b)),
    cubicTo: (a, b, cc, d, e, f2) => p.cubicTo(...T(a, b), ...T(cc, d), ...T(e, f2)),
    close: () => p.close(),
  });
  if (view === 'side') {
    buildSideLines(placed(lines), s);
    if (plate) buildSidePlate(placed(plate), s);
  } else {
    buildAboveLines(placed(lines), s);
    if (plate) buildAbovePlate(placed(plate), s);
  }
}

/** Stroke width (px) of an icon `size` px tall, with a floor. */
export function headIconStroke(view: HeadIconView, size: number, min = 0): number {
  return Math.max(min, (view === 'side' ? SIDE_CANON.stroke : ABOVE_CANON.stroke) * headIconScale(view, size));
}

/** The side icon's anchor offset (head units, before facing) for
 *  anchor 'center': the middle of its full box (nose tip→occiput,
 *  crown→neck base), so a caller can place it by its centre. */
/** Head units per PNG pixel (the side art's crown → neck base, plus one
 *  stroke, spans the canon crown → neck base; unchanged 2026-10-10). */
const SIDE_PX_UNIT = (SIDE_CANON.neckBase - SIDE_CANON.crown + SIDE_CANON.stroke) / (246 - 29);
/**
 * LIPS ANCHOR (2026-10-10): the side origin is the MOUTH — the front of the
 * drawn lips at x = 0, the lip line at y = 0. Measured on the PNG's alpha
 * channel (320 × 283, faces left): the lips' front edge at px x ≈ 91 (upper
 * lip 90, lower 92), the lip line (the notch between them) at px y ≈ 170.
 * Until this fix the PNG was centred on the canon's bounding box instead, so
 * the drawn lips sat 9.6 units in FRONT of the origin and 1.5 below it — a
 * mic, a breath jet or a gap line placed "at the mouth" started inside the
 * face. Only the placement moved; the PNG and its scale are untouched.
 */
const SIDE_LIPS_PX: XY = [91, 170];
const sidePx = (px: number, py: number): XY => [(px - SIDE_LIPS_PX[0]) * SIDE_PX_UNIT, (py - SIDE_LIPS_PX[1]) * SIDE_PX_UNIT];
/** The side art box's centre (PNG art 77..256 × 29..245) — anchor 'center'.
 *  Re-derived from the PNG itself, so centre-placed heads keep their place. */
export const SIDE_CENTER: XY = sidePx((77 + 256) / 2, (29 + 245) / 2);
/** The side icon's neck-base centre (head units, before facing): the PNG's
 *  own neck column (px x 153..226) at its bottom edge (px y 245.5) — anchor
 *  'neck' stands the icon exactly on a floor line. */
export const SIDE_NECK: XY = sidePx((153 + 226) / 2, 245.5);

/**
 * THE OWNER'S PNGs ARE WHAT IS DRAWN (owner 2026-10-10: the vector tracing
 * read as "crazy other versions"). The paths above now only shape the dark
 * readability plates; the visible head is the owner's art itself:
 *   side  → assets/icons/head-side.png  (320×283, faces LEFT, art 77..257 × 29..246)
 *   above → assets/icons/head-above.png (256×320, chin DOWN, art 7..249 × 7..313;
 *           made 2026-10-10 from assets/Head_icon_above.PNG, luminance → alpha)
 * Each box is the whole PNG in head units. Side: scaled so the art's crown →
 * neck base spans the canon's, and placed by the LIPS (2026-10-10 — the front
 * of the drawn lips at the origin; see SIDE_LIPS_PX). Above: art box ↔
 * crown→chin, centred on the origin (measured: art 7..248 × 7..312, centre
 * exactly (128, 160) — no offset).
 */
const ABOVE_PX_UNIT = (ABOVE_CANON.height + ABOVE_CANON.stroke) / (313 - 7);
export const HEAD_PNG_BOX: Record<HeadIconView, { x: number; y: number; w: number; h: number }> = {
  // the whole PNG, placed so its lips land on the origin (SIDE_LIPS_PX)
  side: {
    x: -SIDE_LIPS_PX[0] * SIDE_PX_UNIT,
    y: -SIDE_LIPS_PX[1] * SIDE_PX_UNIT,
    w: 320 * SIDE_PX_UNIT,
    h: 283 * SIDE_PX_UNIT,
  },
  above: { x: -128 * ABOVE_PX_UNIT, y: -160 * ABOVE_PX_UNIT, w: 256 * ABOVE_PX_UNIT, h: 320 * ABOVE_PX_UNIT },
};
