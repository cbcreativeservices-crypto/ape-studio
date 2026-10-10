/**
 * THE BOWED-STRING FAMILY — violin, viola, cello, double bass (charter §2
 * layer 1). One parameter row each, in FRAME B (docs/labs/miking/violin/
 * GEOMETRY_PROPOSAL.md §1–§3, the family's frame):
 *
 *   origin B0 = the bridge's centre line on the top plate (where the bridge
 *   feet line crosses the instrument's centre line), at the top surface;
 *   +x along the centre line toward the neck and scroll; +y across the top
 *   toward the HIGHEST string (E on the violin, A on viola and cello, G on
 *   the bass); +z out of the top (the front). Millimetres.
 *
 * Every number is a `Dim` with its provenance (the INTERNAL record — the
 * learner never sees a source): the Met's museum instruments for body
 * sizes (violin/SOURCES.md §b, used as TRIAL sizes for modern instruments),
 * the bass bow (MET-DBBOW) and bass bow hair (Met 503222), the lowest notes
 * by equal temperament (PHYS-ET). Everything the drawing needs that no
 * source gives — stop, bridge height and width, arching, the fingerboard,
 * the bow lengths of the violin, viola and cello, the station of each bout
 * along the body — is a DRAWING DEFAULT (`placeholder: true`) from the
 * proposal where it gives one, and listed in each lesson's `unknowns`.
 *
 * Pure: no React, no Skia. The art (BowedArt.tsx), the solids (posture.ts)
 * and the tests all read these numbers.
 */
import type { Dim, Provenance } from '../../../engine/model/types.ts';

export type BowedId = 'violin' | 'viola' | 'cello' | 'bass';

const met = (src: string, quote: string): Provenance => ({ kind: 'trial', src, note: `${quote} (a museum instrument, used as a modern size)` });
const T = (mm: number, src: string, quote: string): Dim => ({ mm, prov: met(src, quote) });
const S = (mm: number, src: string, quote: string): Dim => ({ mm, prov: { kind: 'sourced', src, quote } });
/** A drawing default: no source gives it (proposal value where it has one). */
export const dd = (mm: number, needed: string): Dim => ({ mm, prov: { kind: 'unknown', needed }, placeholder: true });
const D = (mm: number, how: string): Dim => ({ mm, prov: { kind: 'illustrative', reason: how } });

export type BowedSpec = {
  id: BowedId;
  name: string;
  /** Body length (top plate, end to end). */
  body: Dim;
  /** Tail end of the body to the scroll's tip. */
  overall: Dim;
  /** Bout widths (full widths). */
  lower: Dim;
  middle: Dim;
  upper: Dim;
  /** Rib height (the sides). */
  rib: Dim;
  /** Body's neck edge to the bridge line. */
  stop: Dim;
  /** Vibrating string length (bridge to nut). */
  string: Dim;
  bridgeH: Dim;
  bridgeW: Dim;
  /** The f-holes: their centre-line offset across the top, and their x span. */
  fholeY: Dim;
  fholeX: [number, number];
  /** The tailpiece's x span. */
  tailpiece: [number, number];
  archTop: Dim;
  archBack: Dim;
  /** Fingerboard width at the nut and at its free end. */
  fbNut: Dim;
  fbEnd: Dim;
  /** Endpin out-length (cello and bass), and the collar below the tail. */
  endpin?: Dim;
  collar?: Dim;
  /** The bow: its length, and (the bass) its hair. */
  bow: Dim;
  bowHair?: Dim;
  /** Where the bow meets the strings, from the bridge (frame B x). */
  contact: [number, number];
  /** The lowest open string. */
  lowest: { note: string; hz: number };
  /** String names, from the lowest (−y) to the highest (+y). */
  strings: readonly [string, string, string, string];
  /** Stations along the body (fractions from the tail end) of the lower
   *  bout's widest point, the waist and the upper bout's widest point. */
  stations: { lower: number; waist: number; upper: number };
  /** The bass's sloping shoulders (viol corners): 0 = violin shoulders. */
  shoulderSlope: number;
};

/** Equal temperament from A4 = 440 Hz (PHYS-ET). */
export const et = (semisFromA4: number) => 440 * Math.pow(2, semisFromA4 / 12);

export const VIOLIN: BowedSpec = {
  id: 'violin',
  name: 'violin',
  body: T(358, 'MET-PIQUE', 'Body L.: 35.8 cm'),
  overall: T(590, 'MET-PIQUE', 'Total L.: 59.0 cm'),
  lower: T(203, 'MET-FRANC', 'Width: 8 in. (20.3 cm), read as the lower bout'),
  middle: dd(110, 'violin middle-bout width (proposal §2 drawing default)'),
  upper: dd(165, 'violin upper-bout width (proposal §2 drawing default)'),
  rib: T(30, 'MET-FRANC', 'Depth (at lower bout): 1 3/16 in. (3 cm)'),
  stop: dd(195, 'violin stop (body neck edge to bridge)'),
  string: dd(328, 'violin vibrating string length'),
  bridgeH: dd(33, 'violin bridge height'),
  bridgeW: dd(41, 'violin bridge width'),
  fholeY: dd(48, 'violin f-hole offset across the top'),
  fholeX: [-45, 40],
  tailpiece: [-150, -45],
  archTop: dd(15, 'violin top arching height'),
  archBack: dd(14, 'violin back arching height'),
  fbNut: dd(24, 'violin fingerboard width at the nut'),
  fbEnd: dd(42, 'violin fingerboard width at its end'),
  bow: dd(750, 'violin bow length'),
  contact: [10, 49],
  lowest: { note: 'G3', hz: et(-14) },
  strings: ['G', 'D', 'A', 'E'],
  stations: { lower: 0.25, waist: 0.49, upper: 0.79 },
  shoulderSlope: 0,
};

export const VIOLA: BowedSpec = {
  id: 'viola',
  name: 'viola',
  body: T(388, 'MET-BANKS', 'Body L. 38.8 cm'),
  overall: dd(660, 'viola overall length (proposal §2 drawing default)'),
  lower: T(229.5, 'MET-BANKS', 'lower bout 22.95 cm'),
  middle: T(132, 'MET-BANKS', 'centre bout 13.2 cm'),
  upper: T(185, 'MET-BANKS', 'upper bout 18.5 cm'),
  rib: T(35, 'MET-BANKS', 'rib H 3.5 cm'),
  stop: dd(215, 'viola stop (body neck edge to bridge)'),
  string: T(352, 'MET-BANKS', 'vibrating string L. 35.2 cm'),
  bridgeH: dd(36, 'viola bridge height'),
  bridgeW: dd(45, 'viola bridge width'),
  fholeY: dd(55, 'viola f-hole offset across the top'),
  fholeX: [-50, 44],
  tailpiece: [-160, -50],
  archTop: dd(16, 'viola top arching height'),
  archBack: dd(15, 'viola back arching height'),
  fbNut: dd(25, 'viola fingerboard width at the nut'),
  fbEnd: dd(45, 'viola fingerboard width at its end'),
  bow: dd(740, 'viola bow length'),
  contact: [10, 54],
  lowest: { note: 'C3', hz: et(-21) },
  strings: ['C', 'G', 'D', 'A'],
  stations: { lower: 0.25, waist: 0.49, upper: 0.79 },
  shoulderSlope: 0,
};

export const CELLO: BowedSpec = {
  id: 'cello',
  name: 'cello',
  body: T(755, 'MET-VUILL', 'Body L.: 75.5 cm'),
  overall: T(1240, 'MET-VC-AT', 'Total L.: 124 cm incl. retracted endpin'),
  lower: T(439, 'MET-VUILL', 'Lower bouts: 43.9 cm'),
  middle: T(236, 'MET-VUILL', 'Middle bouts: 23.6 cm'),
  upper: T(342, 'MET-VUILL', 'Upper bouts: 34.2 cm'),
  rib: dd(120, 'cello rib height'),
  stop: dd(400, 'cello stop (body neck edge to bridge)'),
  string: dd(690, 'cello vibrating string length'),
  bridgeH: dd(90, 'cello bridge height'),
  bridgeW: dd(90, 'cello bridge width'),
  fholeY: dd(110, 'cello f-hole offset across the top'),
  fholeX: [-95, 84],
  tailpiece: [-330, -110],
  archTop: dd(26, 'cello top arching height'),
  archBack: dd(24, 'cello back arching height'),
  fbNut: dd(32, 'cello fingerboard width at the nut'),
  fbEnd: dd(64, 'cello fingerboard width at its end'),
  endpin: dd(300, 'cello endpin out-length'),
  collar: dd(40, 'cello endpin collar below the tail (inside the 124 cm total)'),
  bow: dd(715, 'cello bow length'),
  contact: [10, 100],
  lowest: { note: 'C2', hz: et(-33) },
  strings: ['C', 'G', 'D', 'A'],
  stations: { lower: 0.25, waist: 0.49, upper: 0.79 },
  shoulderSlope: 0,
};

export const BASS: BowedSpec = {
  id: 'bass',
  name: 'double bass',
  body: T(1162, 'MET-EBERLE', 'body 116.2'),
  overall: T(1966, 'MET-EBERLE', 'Total 196.6 cm'),
  lower: T(700, 'MET-EBERLE', 'bouts … 70 (lower)'),
  middle: T(366, 'MET-EBERLE', 'bouts … 36.6 (middle)'),
  upper: T(545, 'MET-EBERLE', 'bouts 54.5 (upper)'),
  rib: T(220, 'MET-EBERLE', 'ribs 20.7 / 22.4 / 22 (the lower rib drawn all round)'),
  stop: dd(665, 'bass stop (body neck edge to bridge)'),
  string: T(1115, 'MET-EBERLE', 'string length 111.5'),
  bridgeH: dd(160, 'bass bridge height'),
  bridgeW: dd(160, 'bass bridge width'),
  fholeY: dd(170, 'bass f-hole offset across the top'),
  fholeX: [-150, 132],
  tailpiece: [-460, -170],
  archTop: dd(30, 'bass top arching height'),
  archBack: dd(0, 'bass back (drawn flat, the usual bass back)'),
  fbNut: dd(44, 'bass fingerboard width at the nut'),
  fbEnd: dd(100, 'bass fingerboard width at its end'),
  endpin: dd(250, 'bass endpin out-length'),
  collar: dd(30, 'bass endpin collar below the tail'),
  bow: S(749, 'MET-DBBOW', 'L. 74.9 cm (29-1/2 in.)'),
  bowHair: S(485, 'MET-503222', 'L. of hair 48.5 cm'),
  contact: [40, 170],
  lowest: { note: 'E1', hz: et(-41) },
  strings: ['E', 'A', 'D', 'G'],
  stations: { lower: 0.26, waist: 0.5, upper: 0.8 },
  shoulderSlope: 0.85,
};

export const BOWED: Record<BowedId, BowedSpec> = { violin: VIOLIN, viola: VIOLA, cello: CELLO, bass: BASS };

/* ── frame-B stations, DERIVED from the row ── */

export type Stations = {
  /** The body's tail end and neck edge (x). */
  tailX: number;
  neckX: number;
  /** The nut (string length from the bridge) and the scroll's tip. */
  nutX: number;
  scrollX: number;
  /** The fingerboard's free end: a fraction of the stop from the bridge —
   *  violin and viola 0.29 (a 270 mm board on a 130 mm neck ends ~55 mm
   *  from the bridge), cello 0.26, bass 0.36 (art pass 2026-10-10; was
   *  0.45 × stop, proposal §3, which drew every board ~40% short). */
  fbEndX: number;
  /** Where the left hand's usual travel ends toward the bridge (0.45 × stop,
   *  proposal §3): the hand path's end and the fingerboard's collision
   *  solid, kept where the lessons were built when the DRAWN fingerboard
   *  grew to its true length (2026-10-10) — the suggested starting points
   *  were placed against these. */
  handEndX: number;
  /** The contact (bowing) point's centre and half-travel along x. */
  contactX: number;
  contactHalf: number;
};

export function stationsOf(s: BowedSpec): Stations {
  const tailX = -(s.body.mm - s.stop.mm);
  const neckX = s.stop.mm;
  // The cello's 124 cm includes the retracted endpin's collar below the tail.
  const scrollX = tailX + s.overall.mm - (s.id === 'cello' ? s.collar?.mm ?? 0 : 0);
  return {
    tailX,
    neckX,
    nutX: s.string.mm,
    scrollX,
    fbEndX: (s.id === 'cello' ? 0.26 : s.id === 'bass' ? 0.36 : 0.29) * s.stop.mm,
    handEndX: 0.45 * s.stop.mm,
    contactX: (s.contact[0] + s.contact[1]) / 2,
    contactHalf: (s.contact[1] - s.contact[0]) / 2,
  };
}

/**
 * THE OUTLINE as a luthier's pattern (art pass 2026-10-10). One template
 * per form, in mm of a 356 mm violin body (u from the tail block along the
 * centre line, w the half-width), traced through its key points:
 *   the lower bout, widest 103 at u 85, running in to the LOWER CORNER, a
 *   point aimed along the body toward the neck (tip at u 143, w 79); the
 *   corner's inner edge turning back into the C-BOUT, narrowest 55.5 at
 *   u 178; the UPPER CORNER (tip u 214, w 77) pointed back toward the tail;
 *   the upper bout, widest 84 at u 268, closing round to the neck block —
 *   or, the double bass's viol form, widest just past its corner and
 *   running down SLOPING SHOULDERS to a broad neck block.
 * Each instrument maps the template onto its own row: the stations by a
 * piecewise-linear stretch along the body (lower, waist, upper), the widths
 * by a scale that holds the lower bout to the corner, blends to the middle
 * width at the waist and to the upper bout at the upper corner — so the
 * lower, middle and upper widths are exactly the row's. Smooth runs are
 * Catmull-Rom through the key points; the corner tips stay sharp.
 * The corners overhang the C along the body, so the outline is not a
 * function of x there: `outline` gives the true path; `halfWidth` the outer
 * envelope (what the hit tests and the clearances need).
 */
type Pattern = { pts: [number, number][]; env: (u: number) => number };
const patternCache = new Map<string, Pattern>();
type Q = readonly [number, number];
const TPL_L = 356;
const TPL_LOWER: readonly Q[] = [[0, 0], [3, 32], [12, 62], [30, 86], [56, 100], [85, 103], [114, 98], [132, 88], [143, 79]];
const TPL_C: readonly Q[] = [[143, 79], [137, 72], [141, 64], [152, 58], [178, 55.5], [203, 58.5], [213, 63], [219, 70], [214, 77]];
const TPL_UPPER_ROUND: readonly Q[] = [[214, 77], [224, 80.5], [242, 83], [268, 84], [300, 80], [326, 66], [345, 42], [354, 18], [356, 0]];
const TPL_UPPER_VIOL: readonly Q[] = [[214, 77], [222, 80], [236, 82], [250, 82.5], [272, 78.5], [300, 65], [326, 47], [345, 33], [353, 24], [356, 12], [356, 0]];

/** A Catmull-Rom run through `pts` (the ends held), `n` steps a span. */
function catmull(pts: readonly Q[], n = 10): [number, number][] {
  const P = [pts[0], ...pts, pts[pts.length - 1]];
  const out: [number, number][] = [];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (j: 0 | 1) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
      out.push([f(0), f(1)]);
    }
  }
  out.push([pts[pts.length - 1][0], pts[pts.length - 1][1]]);
  return out;
}

/** Piecewise-linear through knots (x ascending). */
function lerpKnots(knots: readonly Q[], x: number): number {
  if (x <= knots[0][0]) return knots[0][1];
  for (let i = 0; i < knots.length - 1; i++) {
    const [x0, y0] = knots[i];
    const [x1, y1] = knots[i + 1];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / Math.max(1e-9, x1 - x0);
  }
  return knots[knots.length - 1][1];
}

function patternOf(s: BowedSpec): Pattern {
  const key = `${s.id}|${s.body.mm}|${s.lower.mm}|${s.middle.mm}|${s.upper.mm}|${s.stations.lower}|${s.stations.waist}|${s.stations.upper}|${s.shoulderSlope}`;
  const hit = patternCache.get(key);
  if (hit) return hit;
  const viol = s.shoulderSlope > 0.5;
  const upper = viol ? TPL_UPPER_VIOL : TPL_UPPER_ROUND;
  const upMax = viol ? 82.5 : 84;
  const upAt = viol ? 250 : 268;
  // Template u → the row's fraction of the body (its three stations).
  const uMap: readonly Q[] = [[0, 0], [85, s.stations.lower], [178, s.stations.waist], [upAt, s.stations.upper], [TPL_L, 1]];
  // Template w → mm: the lower bout's scale to the lower corner, the middle's at the waist, the upper's from the upper corner.
  const fl = s.lower.mm / 2 / 103;
  const fm = s.middle.mm / 2 / 55.5;
  const fu = s.upper.mm / 2 / upMax;
  const wMap: readonly Q[] = [[0, fl], [143, fl], [178, fm], [214, fu], [TPL_L, fu]];
  // The C's own scale reads the middle width at the waist exactly; at the
  // corners each side keeps its bout's scale (so the points stay sharp).
  const side = [...catmull(TPL_LOWER).slice(0, -1), ...catmull(TPL_C).slice(0, -1), ...catmull(upper)].map(([u, w]) => [lerpKnots(uMap, u), w * lerpKnots(wMap, u)] as [number, number]);
  const env = (u: number): number => {
    if (u < 0 || u > 1) return 0;
    let m = 0;
    for (let i = 0; i < side.length - 1; i++) {
      const [u0, y0] = side[i];
      const [u1, y1] = side[i + 1];
      if ((u0 <= u && u <= u1) || (u1 <= u && u <= u0)) {
        const t = u1 === u0 ? 1 : (u - u0) / (u1 - u0);
        m = Math.max(m, y0 + (y1 - y0) * t);
      }
    }
    return m;
  };
  const st = stationsOf(s);
  const L = s.body.mm;
  const pts: [number, number][] = [...side.map(([u, y]) => [st.tailX + u * L, -y] as [number, number]), ...[...side].reverse().map(([u, y]) => [st.tailX + u * L, y] as [number, number])];
  const p = { pts, env };
  patternCache.set(key, p);
  return p;
}

/**
 * The body's HALF-WIDTH at frame-B x (mm): the outer envelope of the
 * pattern (the corner points included). 0 outside the body.
 */
export function halfWidth(s: BowedSpec, x: number): number {
  const st = stationsOf(s);
  return patternOf(s).env((x - st.tailX) / s.body.mm);
}

/** The outline as points (x, y) round the body, from the tail on the −y
 *  side: the pattern's true path, its corner points included (`n` is kept
 *  for the callers; the pattern sets its own resolution). */
export function outline(s: BowedSpec, _n = 120): [number, number][] {
  return patternOf(s).pts;
}

/** Height of the top's surface above the rib edge on the centre line (z),
 *  a smooth arch (drawing default), 0 at both ends of the body. */
export function archAt(s: BowedSpec, x: number, y = 0): number {
  const st = stationsOf(s);
  const u = (x - st.tailX) / s.body.mm;
  if (u <= 0 || u >= 1) return 0;
  const w = halfWidth(s, x);
  const across = w > 0 ? Math.max(0, 1 - (y / w) ** 2) : 0;
  return s.archTop.mm * Math.pow(Math.sin(Math.PI * u), 0.55) * Math.pow(across, 0.7);
}

/** The strings' height above the top's rim plane (z) at frame-B x: from the
 *  bridge top (x = 0) down to the fingerboard at the nut; behind the bridge
 *  down to the tailpiece. Drawing default slopes. */
export function stringZ(s: BowedSpec, x: number): number {
  const st = stationsOf(s);
  const h = s.bridgeH.mm;
  if (x >= 0) {
    const zNut = h * 0.55;
    return h + ((zNut - h) * Math.min(x, st.nutX)) / st.nutX;
  }
  const zTail = h * 0.42;
  const t = Math.min(1, -x / -s.tailpiece[1]);
  return h + (zTail - h) * t;
}

/** The fingerboard's top surface (z) under the strings (a little below them). */
export function fingerboardZ(s: BowedSpec, x: number): number {
  return stringZ(s, x) - s.bridgeH.mm * 0.12;
}

/** Fingerboard half-width at x (from the nut to its free end). */
export function fbHalf(s: BowedSpec, x: number): number {
  const st = stationsOf(s);
  const t = Math.max(0, Math.min(1, (st.nutX - x) / (st.nutX - st.fbEndX)));
  return (s.fbNut.mm + (s.fbEnd.mm - s.fbNut.mm) * t) / 2;
}

/** The four strings' offsets across (y) at x: spread over the fingerboard,
 *  wider at the bridge. Lowest string first (−y). */
export function stringYs(s: BowedSpec, x: number): number[] {
  const st = stationsOf(s);
  const atBridge = s.bridgeW.mm * 0.36;
  const atNut = s.fbNut.mm * 0.36;
  const behind = s.bridgeW.mm * 0.3;
  const half = x >= 0 ? atBridge + ((atNut - atBridge) * Math.min(x, st.nutX)) / st.nutX : behind;
  return [-half, -half / 3, half / 3, half];
}

/** The family's illustrative clearances (no source gives one). */
export const CLEAR = {
  /** Around a moving string, the bridge and the instrument's top. */
  body: D(4, 'a small margin round the instrument (the lab’s)'),
};
