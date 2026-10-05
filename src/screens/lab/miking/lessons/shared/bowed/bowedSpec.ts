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
  /** The fingerboard's free end (0.45 × stop, proposal §3). */
  fbEndX: number;
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
    fbEndX: 0.45 * s.stop.mm,
    contactX: (s.contact[0] + s.contact[1]) / 2,
    contactHalf: (s.contact[1] - s.contact[0]) / 2,
  };
}

/**
 * The body's HALF-WIDTH at frame-B x (mm): a lower bout, a C-shaped waist
 * between two corners, an upper bout — through the three sourced widths at
 * the row's stations (drawing defaults). 0 outside the body.
 */
export function halfWidth(s: BowedSpec, x: number): number {
  const st = stationsOf(s);
  const L = s.body.mm;
  const u = (x - st.tailX) / L; // 0 at the tail end, 1 at the neck edge
  if (u < 0 || u > 1) return 0;
  const Wl = s.lower.mm / 2;
  const Wm = s.middle.mm / 2;
  const Wu = s.upper.mm / 2;
  const { lower: sl, waist: sw, upper: su } = s.stations;
  const c1 = sl + 0.6 * (sw - sl); // lower corner
  const c2 = sw + 0.45 * (su - sw); // upper corner
  // The corners: each bout runs out to a point a little proud of where the
  // C-bout begins (the step reads as the corner's tip).
  const wc1 = 0.72 * Wl;
  const wc2 = 0.77 * Wu;
  const tab = 0.012; // the corner's length along the body (fraction)
  if (u <= sl) return Wl * Math.sqrt(Math.max(0, 1 - ((sl - u) / sl) ** 2));
  if (u <= c1) return Wl * (1 - 0.18 * ((u - sl) / (c1 - sl)) ** 2);
  if (u <= c1 + tab) return Wl * 0.82 + (wc1 - Wl * 0.82) * ((u - c1) / tab);
  if (u <= c2 - tab) {
    // The C: exactly the middle width at the waist, meeting each corner.
    if (u <= sw) return Wm + (wc1 - Wm) * ((sw - u) / (sw - c1 - tab)) ** 2;
    return Wm + (wc2 - Wm) * ((u - sw) / (c2 - tab - sw)) ** 2;
  }
  if (u <= c2) return wc2 + (Wu * 0.86 - wc2) * ((u - (c2 - tab)) / tab);
  if (u <= su) return Wu * (1 - 0.14 * ((su - u) / (su - c2)) ** 2);
  // Above the upper bout: round shoulders (violin), or sloping (bass).
  const t = (u - su) / (1 - su);
  const round = Wu * Math.sqrt(Math.max(0, 1 - t * t));
  const sloped = Wu * (1 - t) ** 0.8 + 0.12 * Wu * t;
  return round * (1 - s.shoulderSlope) + sloped * s.shoulderSlope;
}

/** The outline as points (x, y) round the body, from the tail on the −y side. */
export function outline(s: BowedSpec, n = 120): [number, number][] {
  const st = stationsOf(s);
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const x = st.tailX + ((st.neckX - st.tailX) * i) / n;
    pts.push([x, -halfWidth(s, x)]);
  }
  for (let i = n; i >= 0; i--) {
    const x = st.tailX + ((st.neckX - st.tailX) * i) / n;
    pts.push([x, halfWidth(s, x)]);
  }
  return pts;
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
