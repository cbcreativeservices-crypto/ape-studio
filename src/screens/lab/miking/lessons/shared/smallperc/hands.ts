/**
 * SMALL-PERCUSSION FAMILY — the HANDS, as pure 2-D geometry (tested; the
 * drawing is Hand.tsx). A hand is built in its LOCAL frame — the wrist at the
 * origin, +x along the hand toward the fingers, +y toward the PALM side — from
 * typical adult proportions (a 180 mm hand: drawing defaults, never shown as
 * a measurement), then placed in a view by `placeHand` (origin, angle, scale,
 * mirror).
 *
 * Four grips cover the family:
 *   profileFist  a fist seen ALONG what it holds (a stick, a shaker, a handle
 *                seen end-on): the fingers wrap round the held circle, the
 *                thumb over the top — the classic side view of a grip.
 *   dorsalFist   the back of the hand round something held ACROSS the view
 *                (it passes behind the hand): knuckles, the folded fingers,
 *                the thumb along it.
 *   openHand     a flat hand, fingers together and slightly curved — the slap
 *                on a cajón's plate, a palm meeting a tambourine.
 *   cradle       palm up, fingers curled UP round what rests in it — the
 *                supported clave over its hollow, an egg in a cupped hand.
 *
 * Fingers are tapered tubes along smooth centre lines; each tube's outline is
 * computed here so the drawing only fills and strokes paths.
 */

export type Pt = readonly [number, number];

/** One finger (or the thumb): its centre line and its widths at base and tip. */
export type FingerGeo = { pts: Pt[]; w0: number; w1: number; nail: boolean; /** 0 = farthest from the viewer. */ layer: number; tip: Pt; tipDir: Pt };
export type HandGeo = {
  /** The hand's body (back of the hand and palm) as a closed outline. */
  body: Pt[];
  fingers: FingerGeo[];
  thumb: FingerGeo;
  /** Knuckle and crease marks (open polylines). */
  creases: Pt[][];
  /** Where the held object's centre sits (local), for the art's check. */
  hold: Pt | null;
  /** The four knuckles (local), for the dorsal highlights. */
  knuckles: Pt[];
};

const D = Math.PI / 180;
const pol = (c: Pt, r: number, deg: number): Pt => [c[0] + r * Math.cos(deg * D), c[1] + r * Math.sin(deg * D)];
/** Points along an arc about c (deg, y down: 0 = +x, 90 = +y). */
function arcPts(c: Pt, r: number, a0: number, a1: number, n = 10): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) out.push(pol(c, r, a0 + ((a1 - a0) * i) / n));
  return out;
}
function finger(pts: Pt[], w0: number, w1: number, layer: number, nail = true): FingerGeo {
  const a = pts[pts.length - 2];
  const b = pts[pts.length - 1];
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return { pts, w0, w1, nail, layer, tip: b, tipDir: [(b[0] - a[0]) / l, (b[1] - a[1]) / l] };
}

/** Finger proportions (index, middle, ring, little): the three phalanges'
 *  lengths and the base width (typical adult proportions, drawing defaults). */
const FINGERS = [
  { seg: [46, 27, 22], w: 18.5 },
  { seg: [50, 31, 24], w: 19 },
  { seg: [47, 29, 23], w: 18 },
  { seg: [37, 22, 20], w: 16 },
] as const;
const lenOf = (k: number) => FINGERS[k].seg[0] + FINGERS[k].seg[1] + FINGERS[k].seg[2];

/**
 * The joints of a finger WRAPPED round a circle (centre c, radius R to the
 * finger's centre line): each phalanx is a straight chord tangent to that
 * circle, so the finger reads as three bones with knuckles, not a ring.
 * `a0` is the knuckle's angle (deg, y down: −90 = straight above the centre).
 */
function wrapChain(c: Pt, R: number, segs: readonly number[], a0: number, maxSweep = 230): Pt[] {
  let a = a0;
  const pts: Pt[] = [];
  // The knuckle sits a little outside the circle (the first chord's end).
  const rho0 = Math.sqrt(R * R + (segs[0] / 2) ** 2);
  pts.push(pol(c, rho0, a));
  let swept = 0;
  for (let i = 0; i < segs.length; i++) {
    const L = segs[i];
    const da = (2 * Math.atan(L / (2 * R))) / D;
    const next = i + 1 < segs.length ? segs[i + 1] : L;
    const rho = Math.sqrt(R * R + ((L + next) / 4) ** 2);
    a += Math.min(da, maxSweep - swept);
    swept += da;
    pts.push(pol(c, rho, a));
    if (swept >= maxSweep) break;
  }
  return pts;
}

/**
 * A fist seen along what it holds — a stick, a shaker or a handle end-on: a
 * circle of radius `r` (mm), its centre at `hold`. The near (index) finger and
 * the three behind it wrap round the circle bone by bone; the thumb crosses
 * over the index finger's middle bone. Seen from the thumb side.
 */
export function profileFist(r: number): HandGeo {
  // The held circle sits under the front of the hand, in the curl.
  const c: Pt = [86 + r * 0.25, 10 + r * 0.35];
  const fingers: FingerGeo[] = [];
  // Little (farthest) to index (nearest): each set a little back and lower,
  // so the folded fingers behind the index finger show as a stepped edge.
  const order = [3, 2, 1, 0];
  order.forEach((k, layer) => {
    const f = FINGERS[k];
    const behind = 3 - layer;
    const R = r + f.w * 0.5 + 0.5;
    const cc: Pt = [c[0] - behind * 4.5, c[1] + behind * 3.2];
    const chain = wrapChain(cc, R, f.seg, -108 + behind * 3, 200);
    fingers.push(finger(chain, f.w, f.w * 0.84, layer, false));
  });
  // The thumb: from the thenar pad, forward along the bottom of the curl, its
  // tip over the index finger's middle bone at the front.
  const idx = fingers[3].pts;
  const thumbPts: Pt[] = [
    [40, 22 + r * 0.3],
    [64, c[1] + r + 13],
    pol(c, r + 15, 104),
    pol(c, r + 13, 66),
  ];
  const thumb = finger(thumbPts, 25, 19, 5, true);
  // The hand's body: wrist, the back of the hand rising to the knuckles, down
  // behind the folded fingers, the palm under the curl, the thenar pad, back
  // to the wrist.
  const k0 = idx[0];
  const body: Pt[] = [
    [-6, -23],
    [18, -27],
    [48, k0[1] - 3],
    [k0[0] - 6, k0[1] - 8],
    [k0[0] + 8, k0[1] - 1],
    [c[0] + r * 0.5, c[1]],
    [c[0], c[1] + r + 6],
    [c[0] - r - 12, c[1] + r + 12],
    [40, c[1] + r + 20],
    [16, 33],
    [-6, 25],
  ];
  const creases: Pt[][] = [
    [[k0[0] - 26, k0[1] + 2], [k0[0] - 12, k0[1] - 1]],
    [[24, -17], [38, -19]],
  ];
  const knuckles: Pt[] = fingers.map((f) => f.pts[0]);
  return { body, fingers, thumb, creases, hold: c, knuckles };
}

/**
 * The back of a fist round something held ACROSS the view (behind the hand):
 * the wrist, the back of the hand widening to the knuckle row, four folded
 * fingers seen from behind (foreshortened as they turn away round the held
 * object), and the thumb along the object at the near edge.
 */
export function dorsalFist(): HandGeo {
  const kx = 84;
  const half = 44;
  const fingers: FingerGeo[] = [];
  // Index … little across the knuckle row (y): packed side by side, each
  // folded finger seen from behind as a short rounded block past its knuckle.
  const ys = [-29, -10, 9, 27];
  ys.forEach((y, i) => {
    const f = FINGERS[i];
    const fold = [22, 25, 23, 17][i];
    // Drawn little first, so each nearer finger overlaps the next.
    fingers.push(finger([[kx - 8, y], [kx + fold * 0.55, y + 0.5], [kx + fold, y + 1.5]], f.w + 4, f.w + 1, 3 - i, false));
  });
  // The thumb: from the base of the palm along the near (index) edge,
  // forward over the index finger's fold.
  const thumb = finger([[24, -half + 8], [52, -half - 2], [82, -half - 4], [100, -half + 4]], 25, 19, 6, true);
  const body: Pt[] = [
    [-4, -26],
    [30, -half + 2],
    [kx - 4, -half + 6],
    [kx + 4, -16],
    [kx + 6, 16],
    [kx - 4, half - 4],
    [44, half + 2],
    [-4, 26],
  ];
  const creases: Pt[][] = [
    [[kx - 12, -20], [kx - 12, -2]],
    [[kx - 12, 2], [kx - 12, 22]],
    [[34, -14], [52, -12]],
  ];
  const knuckles: Pt[] = ys.map((y) => [kx - 2, y] as Pt);
  return { body, fingers, thumb, creases, hold: [kx + 10, 0], knuckles };
}

/** A flat hand, fingers together and gently curved toward the palm by `curl`
 *  degrees in all (0 = straight). Seen from the side (thumb side up). */
export function openHand(curl = 12): HandGeo {
  const fingers: FingerGeo[] = [];
  [3, 2, 1, 0].forEach((k, layer) => {
    const f = FINGERS[k];
    const y0 = 2 - layer * 1.5;
    const base: Pt = [92, y0];
    const pts: Pt[] = [base];
    let a = 0;
    let p = base;
    for (const s of f.seg) {
      a += curl / 3;
      p = [p[0] + s * Math.cos(a * D), p[1] + s * Math.sin(a * D)];
      pts.push(p);
    }
    fingers.push(finger(pts, f.w, f.w * 0.8, layer, layer === 3));
  });
  const thumb = finger([[30, -14], [62, -24], [92, -26], [116, -22]], 24, 18, 5, true);
  const body: Pt[] = [
    [-4, -22],
    [40, -20],
    [92, -10],
    [98, 4],
    [92, 14],
    [40, 22],
    [-4, 24],
  ];
  const creases: Pt[][] = [[[88, -6], [88, 10]]];
  return { body, fingers, thumb, creases, hold: null, knuckles: [[92, 0]] };
}

/**
 * Palm up, the fingers curled UP round something resting in the hand (a
 * circle of radius `r`, its centre returned in `hold`): the supporting hand
 * of the claves, a hand cupping an egg. `curl` (deg) is how far round the
 * fingers come (about 110 for the clave's "resonating chamber").
 */
export function cradle(r: number, curl = 110): HandGeo {
  const c: Pt = [96, -(r + 14)];
  const fingers: FingerGeo[] = [];
  [3, 2, 1, 0].forEach((k, layer) => {
    const f = FINGERS[k];
    const R = r + 10 + layer * 1.2;
    const start = 150 - layer * 4;
    const end = start - Math.min(curl, (lenOf(k) / R) / D);
    const knuckle: Pt = [c[0] - R * 0.95, c[1] + R * 0.55 + 6];
    fingers.push(finger([knuckle, ...arcPts(c, R, start, end, 10)], f.w, f.w * 0.8, layer, layer === 3));
  });
  const thumb = finger([[34, -8], [60, -22], [80, -34]], 24, 19, 5, true);
  const body: Pt[] = [
    [-4, -22],
    [36, -14],
    [c[0] - r - 8, c[1] + r * 0.4],
    [c[0] - r * 0.2, c[1] + r + 12],
    [c[0] + r * 0.4, c[1] + r + 18],
    [70, 26],
    [-4, 24],
  ];
  const creases: Pt[][] = [[[46, 4], [66, 2]]];
  return { body, fingers, thumb, creases, hold: c, knuckles: [] };
}

/* ── placing a hand in a view ── */

export type Placement = { at: Pt; angle: number; scale?: number; mirror?: boolean };
export function placePt(p: Pt, pl: Placement): Pt {
  const s = pl.scale ?? 1;
  const y = pl.mirror ? -p[1] : p[1];
  const a = pl.angle * D;
  return [pl.at[0] + s * (p[0] * Math.cos(a) - y * Math.sin(a)), pl.at[1] + s * (p[0] * Math.sin(a) + y * Math.cos(a))];
}
/** The local point that lands on `target` with this angle/scale/mirror: the
 *  wrist position that puts a hand's hold (its grip centre) on an object. */
export function wristFor(hold: Pt, target: Pt, angle: number, scale = 1, mirror = false): Pt {
  const p = placePt(hold, { at: [0, 0], angle, scale, mirror });
  return [target[0] - p[0], target[1] - p[1]];
}

/** The placement that puts this hand's wrist on `wrist` and its grip centre
 *  (`hold`) on `grip` (view mm): the drawing follows the model's arm. The
 *  scale stays close to 1 when the model's wrist–grip distance is the hand's. */
export function placeBetween(g: HandGeo, wrist: Pt, grip: Pt, mirror = false): Placement {
  const h = g.hold ?? [90, 0];
  const hy = mirror ? -h[1] : h[1];
  const want = Math.atan2(grip[1] - wrist[1], grip[0] - wrist[0]);
  const have = Math.atan2(hy, h[0]);
  const scale = Math.hypot(grip[0] - wrist[0], grip[1] - wrist[1]) / (Math.hypot(h[0], h[1]) || 1);
  return { at: wrist, angle: (want - have) / D, scale: Math.max(0.8, Math.min(1.2, scale)), mirror };
}

/* ── tapered tubes (the fingers' outlines) ── */

/** The closed outline of a tube along `pts`, width w0 → w1, round at both ends. */
export function tubeOutline(pts: Pt[], w0: number, w1: number): Pt[] {
  const n = pts.length;
  if (n < 2) return [];
  // Cumulative length → width taper.
  const L: number[] = [0];
  for (let i = 1; i < n; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = L[n - 1] || 1;
  const left: Pt[] = [];
  const right: Pt[] = [];
  const dirs: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    dirs.push([(b[0] - a[0]) / l, (b[1] - a[1]) / l]);
  }
  for (let i = 0; i < n; i++) {
    const w = (w0 + (w1 - w0) * (L[i] / total)) / 2;
    const d = dirs[i];
    left.push([pts[i][0] - d[1] * w, pts[i][1] + d[0] * w]);
    right.push([pts[i][0] + d[1] * w, pts[i][1] - d[0] * w]);
  }
  // Round caps: a half circle at the tip (from left to right) and at the base.
  const cap = (c: Pt, d: Pt, w: number, forward: boolean): Pt[] => {
    const out: Pt[] = [];
    const base = Math.atan2(d[1], d[0]);
    for (let k = 1; k < 8; k++) {
      const t = forward ? base + Math.PI / 2 - (Math.PI * k) / 8 : base - Math.PI / 2 - (Math.PI * k) / 8;
      out.push([c[0] + Math.cos(t) * w, c[1] + Math.sin(t) * w]);
    }
    return out;
  };
  return [...left, ...cap(pts[n - 1], dirs[n - 1], w1 / 2, true), ...right.reverse(), ...cap(pts[0], dirs[0], w0 / 2, false)];
}

/** A nail at a finger's tip (a small rounded quad on the back of the tip). */
export function nailOutline(f: FingerGeo, side: 1 | -1 = -1): Pt[] {
  const [tx, ty] = f.tip;
  const [dx, dy] = f.tipDir;
  const nx = -dy * side;
  const ny = dx * side;
  const w = f.w1 * 0.36;
  const back = f.w1 * 0.9;
  const off = f.w1 * 0.16;
  const c: Pt = [tx - dx * back * 0.45 + nx * off, ty - dy * back * 0.45 + ny * off];
  const out: Pt[] = [];
  for (let k = 0; k <= 12; k++) {
    const t = (k / 12) * 2 * Math.PI;
    const u = Math.cos(t) * back * 0.42;
    const v = Math.sin(t) * w;
    out.push([c[0] + dx * u + -dy * v, c[1] + dy * u + dx * v]);
  }
  return out;
}

/** A smooth closed (or open) curve through `pts` as an SVG path string
 *  (Catmull–Rom turned into cubic Béziers): the drawing's outlines, so a
 *  finger reads as a rounded form, not a polygon. */
export function smoothPathD(pts: readonly Pt[], closed = true, tension = 0.5): string {
  const n = pts.length;
  if (n < 2) return '';
  const f = (x: number) => (Math.round(x * 100) / 100).toString();
  const at = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const k = tension / 3;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return closed ? `${d}Z` : d;
}

/** Every point of a hand (body, fingers, thumb) placed in a view — for the
 *  art's hit tests and the tests' "the hand wraps the object" checks. */
export function placedOutline(g: HandGeo, pl: Placement): Pt[] {
  const pts: Pt[] = [...g.body];
  for (const f of [...g.fingers, g.thumb]) pts.push(...tubeOutline(f.pts, f.w0, f.w1));
  return pts.map((p) => placePt(p, pl));
}
