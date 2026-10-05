/**
 * THE SAXOPHONE FAMILY — one parameterised instrument (soprano, alto, tenor,
 * baritone), pure data and pure maths (no React: the tests reach it).
 * Research: docs/labs/miking/alto_sax/SOURCES.md (the family keys, §1
 * radiation physics, §3 dimensions) and alto_sax/GEOMETRY_PROPOSAL.md (the
 * family rows, §3 the tone-hole field and the register selector); the
 * soprano, tenor and baritone folders hold their own rows.
 *
 * THE CENTRE LINE (proposal §1). Each saxophone is a centre-line PATH from
 * the reed tip (u = 0) to the bell rim (u = U), drawn in the instrument's
 * own plane: `a` forward, `b` down, `c` across (toward the camera side). The
 * path is a chain of straight runs and arcs — mouthpiece, neck, body (the
 * tone-hole field), bow (not on the straight soprano) and bell. Every
 * length, radius and angle of the path is a DRAWING DEFAULT (Yamaha's spec
 * pages print no dimensions; SOURCES §3 "UNKNOWN"), sized to the proposal's
 * visible heights (640 / 700 / 860 / 1000 mm) and bell rims (85 / 120 /
 * 140 / 160 mm).
 *
 * THE BORE is conical with a 3° taper (Y-SAX-MECH3: "a conical tube with a
 * three-degree taper", read as the full angle): its outside radius grows by
 * tan 1.5° per millimetre along the path, then the bell flares to its rim.
 *
 * THE TONE HOLES AND THE FIRST OPEN HOLE (SOURCES §1, proposal §3). The
 * lowest note's acoustic length L0 = c ÷ (2 f) (DERIVED: a cone sounds like
 * a pipe open at both ends; c = 343.2 m/s at 20 °C). Each opened hole
 * raises the pitch a semitone — "a pipe that is about 6 % shorter" — so the
 * air column for hole k is L0·2^(−k/12). The holes are DRAWN along the body
 * and the bell (never in the bow) in the same proportions: the semitone rule
 * fitted to the drawn hole field (ILLUSTRATIVE: real holes, cups and
 * chimneys are UNKNOWN). Fingering is simplified: a note opens every hole
 * from the bell end up to its own (UNSW: "open the tone holes, starting
 * from the far end"); the FIRST open hole — the open hole nearest the
 * mouthpiece — acts as the end of the pipe. Above the first register the
 * octave key opens a small vent and the same holes sound an octave higher.
 */

export type SaxId = 'soprano' | 'alto' | 'tenor' | 'baritone';

/** A run of the centre line: straight, or an arc that turns `turn` degrees
 *  (positive = clockwise on screen: forward → down) on radius `r`. `lat` =
 *  how far the line drifts across (c) over the run, mm. */
export type PathSeg = { kind: 'line'; len: number; lat?: number; tag: SegTag } | { kind: 'arc'; turn: number; r: number; lat?: number; tag: SegTag };
export type SegTag = 'mouthpiece' | 'neck' | 'body' | 'bow' | 'bell';

/** Where a value comes from (the internal record; never shown). */
export type SaxProv = 'sourced' | 'derived' | 'trial' | 'default';
export type Num = { v: number; prov: SaxProv; note: string };

export type SaxRow = {
  id: SaxId;
  name: string;
  /** The key it is pitched in (written C sounds this note). */
  key: 'B♭' | 'E♭';
  /** Semitones from the written note to the sounding note. */
  transpose: number;
  /** Written semitones of the lowest note relative to written low B♭3:
   *  0, or −1 for a baritone with the low A key. */
  bottom: number;
  /** The lowest sounding note (DPA-TABLE; the low-A baritone by PHYS-ET). */
  lowest: { name: string; hz: number };
  /** The bell's cut-in, where it starts to act like a megaphone (UNSW-SAX:
   *  soprano and tenor only; null = no figure). */
  bellCutInHz: number | null;
  /** Drawing defaults: the visible height (mouthpiece tip to the lowest
   *  point, standing) and the bell rim's radius. */
  height: Num;
  rimR: Num;
  /** The centre line: the reed tip's heading (deg, from forward toward
   *  down) and its runs. */
  heading0: number;
  segs: readonly PathSeg[];
  /** Outside radii: the mouthpiece's barrel, the neck at the cork, and the
   *  cone's virtual apex distance behind the reed tip (the bore radius is
   *  (u + apex)·tan 1.5°). */
  mpR: number;
  corkR: number;
  apex: number;
  /** How much of the bell run flares (mm before the rim). */
  flare: number;
  /** The player's hold: the instrument plane's turn to the player's right
   *  (deg), its roll (the low end swings right, deg). */
  yaw: number;
  roll: number;
  /** Where the bell and body may swing as the player moves (deg, either way). */
  swing: number;
};

const C_SOUND = 343.2; // m/s, 20 °C (CALC-C)
/** Equal temperament from A4 = 440 Hz (PHYS-ET): midi → Hz. */
export const etHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
/** Written low B♭3 = MIDI 58. */
export const LOW_BB_MIDI = 58;
/** tan 1.5°: the cone's half-angle (a 3° full taper). */
export const TAPER = Math.tan((1.5 * Math.PI) / 180);

const d = (v: number, note: string): Num => ({ v, prov: 'default', note });

export const SOPRANO: SaxRow = {
  id: 'soprano',
  name: 'soprano saxophone',
  key: 'B♭',
  transpose: -2,
  bottom: 0,
  lowest: { name: 'A♭3', hz: etHz(56) },
  bellCutInHz: 2600,
  height: d(640, 'proposal §2 visible length, straight soprano'),
  rimR: d(42.5, 'proposal §2 bell rim Ø 85'),
  // Straight: held down and forward, about 30° from the vertical ("a
  // downward-looking position", Y-HUB-SAX; the angle is a drawing default).
  heading0: 60,
  segs: [
    { kind: 'line', len: 66, tag: 'mouthpiece' },
    { kind: 'line', len: 100, tag: 'neck' },
    { kind: 'line', len: 480, tag: 'body' },
    { kind: 'line', len: 95, tag: 'bell' },
  ],
  mpR: 11,
  corkR: 7,
  apex: 195,
  flare: 95,
  yaw: 0,
  roll: 0,
  swing: 15,
};

export const ALTO: SaxRow = {
  id: 'alto',
  name: 'alto saxophone',
  key: 'E♭',
  transpose: -9,
  bottom: 0,
  lowest: { name: 'D♭3', hz: etHz(49) },
  bellCutInHz: null,
  height: d(700, 'proposal §2 visible height'),
  rimR: d(60, 'proposal §2 bell rim Ø 120'),
  heading0: 38,
  segs: [
    { kind: 'line', len: 78, tag: 'mouthpiece' },
    { kind: 'line', len: 40, tag: 'neck' },
    { kind: 'arc', turn: 52, r: 120, lat: 40, tag: 'neck' },
    { kind: 'arc', turn: 12, r: 260, lat: 20, tag: 'neck' },
    { kind: 'line', len: 445, tag: 'body' },
    { kind: 'arc', turn: -178, r: 46, tag: 'bow' },
    { kind: 'line', len: 300, tag: 'bell' },
  ],
  mpR: 13,
  corkR: 9,
  apex: 228,
  flare: 140,
  yaw: 22,
  roll: 13,
  swing: 10,
};

export const TENOR: SaxRow = {
  id: 'tenor',
  name: 'tenor saxophone',
  key: 'B♭',
  transpose: -14,
  bottom: 0,
  lowest: { name: 'A♭2', hz: etHz(44) },
  bellCutInHz: 1800,
  height: d(860, 'proposal §2 visible height'),
  rimR: d(70, 'proposal §2 bell rim Ø 140'),
  // The tenor's neck rises a little (its hump) before it turns down.
  heading0: 24,
  segs: [
    { kind: 'line', len: 92, tag: 'mouthpiece' },
    { kind: 'line', len: 34, tag: 'neck' },
    { kind: 'arc', turn: -24, r: 170, lat: 20, tag: 'neck' },
    { kind: 'arc', turn: 90, r: 140, lat: 50, tag: 'neck' },
    { kind: 'arc', turn: 12, r: 300, lat: 20, tag: 'neck' },
    { kind: 'line', len: 560, tag: 'body' },
    { kind: 'arc', turn: -178, r: 58, tag: 'bow' },
    { kind: 'line', len: 360, tag: 'bell' },
  ],
  mpR: 15,
  corkR: 11,
  apex: 243,
  flare: 170,
  yaw: 24,
  roll: 15,
  swing: 10,
};

export const BARITONE: SaxRow = {
  id: 'baritone',
  name: 'baritone saxophone',
  key: 'E♭',
  transpose: -21,
  bottom: -1,
  lowest: { name: 'C2', hz: etHz(36) },
  bellCutInHz: null,
  height: { v: 1000, prov: 'default', note: 'proposal §2 (a museum baritone measures app. 96.7 cm overall, MET-BARI TRIAL)' },
  rimR: d(80, 'proposal §2 bell rim Ø 160'),
  // The neck leaves the mouth nearly level, rises into the loop, turns back
  // over the top and comes down on the camera side into the body.
  heading0: -6,
  segs: [
    { kind: 'line', len: 100, tag: 'mouthpiece' },
    { kind: 'line', len: 92, tag: 'neck' },
    { kind: 'arc', turn: -264, r: 56, lat: 120, tag: 'neck' },
    { kind: 'arc', turn: 10, r: 300, tag: 'neck' },
    { kind: 'line', len: 800, tag: 'body' },
    { kind: 'arc', turn: -178, r: 78, tag: 'bow' },
    { kind: 'line', len: 470, tag: 'bell' },
  ],
  mpR: 18,
  corkR: 14,
  apex: 330,
  flare: 220,
  yaw: 24,
  roll: 15,
  swing: 25,
};

export const SAX_ROWS: Record<SaxId, SaxRow> = { soprano: SOPRANO, alto: ALTO, tenor: TENOR, baritone: BARITONE };

/* ── the centre line ── */

export type PathPt = { u: number; a: number; b: number; c: number; heading: number; tag: SegTag };
export type SaxPath = {
  pts: PathPt[];
  /** Total path length, reed tip → bell rim. */
  U: number;
  /** Path stations: the end of the mouthpiece, the neck's tenon (the body
   *  starts), the body's end, the bow's end (the bell starts). */
  mouthEnd: number;
  tenon: number;
  bodyEnd: number;
  bellStart: number;
  /** Where the bell starts to flare. */
  flareStart: number;
};

const DEG = Math.PI / 180;
const STEP = 4;
const cache = new Map<SaxId, SaxPath>();

/** The sampled centre line (every ≈ 4 mm), cached per row. */
export function pathOf(row: SaxRow): SaxPath {
  const hit = cache.get(row.id);
  if (hit) return hit;
  const pts: PathPt[] = [];
  let a = 0;
  let b = 0;
  let c = 0;
  let h = row.heading0;
  let u = 0;
  const marks: Partial<Record<'mouthEnd' | 'tenon' | 'bodyEnd' | 'bellStart', number>> = {};
  pts.push({ u, a, b, c, heading: h, tag: row.segs[0].tag });
  row.segs.forEach((s, i) => {
    const L = s.kind === 'line' ? s.len : (Math.abs(s.turn) * DEG) * s.r;
    const n = Math.max(1, Math.ceil(L / STEP));
    const lat = s.lat ?? 0;
    for (let k = 1; k <= n; k++) {
      const dl = L / n;
      if (s.kind === 'line') {
        a += Math.cos(h * DEG) * dl;
        b += Math.sin(h * DEG) * dl;
      } else {
        const dh = s.turn / n;
        // The chord of the small arc step, along the mid heading.
        const hm = h + dh / 2;
        const chord = 2 * s.r * Math.sin((Math.abs(dh) * DEG) / 2);
        a += Math.cos(hm * DEG) * chord;
        b += Math.sin(hm * DEG) * chord;
        h += dh;
      }
      c += lat / n;
      u += dl;
      pts.push({ u, a, b, c, heading: h, tag: s.tag });
    }
    const next = row.segs[i + 1]?.tag;
    if (s.tag === 'mouthpiece' && next !== 'mouthpiece') marks.mouthEnd = u;
    if (s.tag === 'neck' && next !== 'neck') marks.tenon = u;
    if (s.tag === 'body' && next !== 'body') marks.bodyEnd = u;
    if (next === 'bell' && s.tag !== 'bell') marks.bellStart = u;
  });
  const U = u;
  const out: SaxPath = {
    pts,
    U,
    mouthEnd: marks.mouthEnd ?? 0,
    tenon: marks.tenon ?? 0,
    bodyEnd: marks.bodyEnd ?? U,
    bellStart: marks.bellStart ?? marks.bodyEnd ?? U,
    flareStart: U - row.flare,
  };
  cache.set(row.id, out);
  return out;
}

/** The centre-line point at path distance u (linear between samples). */
export function pointAt(row: SaxRow, u: number): PathPt {
  const P = pathOf(row);
  const t = Math.max(0, Math.min(P.U, u));
  const i = Math.min(P.pts.length - 2, Math.max(0, Math.floor((t / P.U) * (P.pts.length - 1))));
  // Walk to the bracketing samples (the steps are nearly even).
  let j = i;
  while (j > 0 && P.pts[j].u > t) j--;
  while (j < P.pts.length - 2 && P.pts[j + 1].u < t) j++;
  const p0 = P.pts[j];
  const p1 = P.pts[j + 1];
  const f = p1.u > p0.u ? (t - p0.u) / (p1.u - p0.u) : 0;
  return { u: t, a: p0.a + (p1.a - p0.a) * f, b: p0.b + (p1.b - p0.b) * f, c: p0.c + (p1.c - p0.c) * f, heading: p0.heading + (p1.heading - p0.heading) * f, tag: f < 0.5 ? p0.tag : p1.tag };
}

/** The outside radius of the tube at u: the mouthpiece's barrel, the neck
 *  from the cork, the 3° cone, and the bell's flare to its rim. */
export function radiusAt(row: SaxRow, u: number): number {
  const P = pathOf(row);
  if (u < P.mouthEnd) {
    // The tip narrows to the reed and the beak; then the round barrel.
    const tip = Math.min(1, u / 22);
    return row.mpR * (0.55 + 0.45 * tip);
  }
  const cone = (u + row.apex) * TAPER;
  if (u < P.tenon) return Math.max(row.corkR, cone);
  if (u <= P.flareStart) return cone;
  const r0 = (P.flareStart + row.apex) * TAPER;
  const t = (u - P.flareStart) / Math.max(1, P.U - P.flareStart);
  // An exponential-looking flare: slow at first, opening fast at the rim.
  return r0 + (row.rimR.v - r0) * Math.pow(t, 2.6);
}

/* ── the tone holes and the fingering ── */

/** The acoustic length of the lowest note (DERIVED, mm). */
export function lowestAirColumn(row: SaxRow): number {
  return (C_SOUND * 1000) / (2 * row.lowest.hz);
}

/** How many tone holes are drawn: 17, one more with a low A key. */
export function holeCount(row: SaxRow): number {
  return 17 - row.bottom;
}

export type ToneHole = {
  /** 1 = nearest the bell … K = nearest the mouthpiece. */
  k: number;
  /** The air column when this is the first open hole (mm, DERIVED). */
  air: number;
  /** Where it is drawn along the path (mm). */
  u: number;
  /** The hole's radius and its key cup's (drawing defaults, from the bore). */
  r: number;
  cupR: number;
  /** Where it sits on the tube: on the bell, or on the body. */
  on: 'body' | 'bell';
};

const holeCache = new Map<SaxId, ToneHole[]>();

/**
 * The holes, k = 1 … K. Air column L_k = L0·2^(−k/12); the drawn positions
 * keep the same proportions, fitted to the drawn field — the body (a margin
 * below the tenon to a margin above the bow) and the bell (a margin above
 * the bow to a margin below the rim). The bow carries no hole.
 */
export function holesOf(row: SaxRow): ToneHole[] {
  const hit = holeCache.get(row.id);
  if (hit) return hit;
  const P = pathOf(row);
  const K = holeCount(row);
  const L0 = lowestAirColumn(row);
  const air = (k: number) => L0 * Math.pow(2, -k / 12);
  const straight = P.bellStart >= P.bodyEnd - 1 && row.segs.every((s) => s.tag !== 'bow');
  const top = P.tenon + 0.07 * (P.bodyEnd - P.tenon);
  const field: [number, number][] = straight
    ? [[top, P.U - row.rimR.v * 0.75]]
    : [
        [top, P.bodyEnd - 18],
        [P.bellStart + 34, P.U - row.rimR.v * 0.9],
      ];
  const total = field.reduce((s, [x0, x1]) => s + (x1 - x0), 0);
  const at = (f: number): { u: number; on: 'body' | 'bell' } => {
    let rest = f * total;
    for (let i = 0; i < field.length; i++) {
      const [x0, x1] = field[i];
      if (rest <= x1 - x0 || i === field.length - 1) return { u: x0 + Math.min(rest, x1 - x0), on: straight ? (x0 + rest > P.flareStart - 60 ? 'bell' : 'body') : i === 0 ? 'body' : 'bell' };
      rest -= x1 - x0;
    }
    return { u: field[0][0], on: 'body' };
  };
  const out: ToneHole[] = [];
  for (let k = 1; k <= K; k++) {
    // 0 at hole K (nearest the mouthpiece) … 1 at hole 1 (nearest the bell).
    const f = (air(k) - air(K)) / (air(1) - air(K));
    const p = at(f);
    const rb = radiusAt(row, p.u);
    // Sized from the cone (the bell's flare does not widen a hole).
    const rc = (p.u + row.apex) * TAPER;
    const r = Math.max(3.5, Math.min(rb * 0.8, rc * (0.32 + 0.26 * f)));
    out.push({ k, air: air(k), u: p.u, r, cupR: r * 1.32 + 2, on: p.on });
  }
  holeCache.set(row.id, out);
  return out;
}

/* ── notes ── */

const WRITTEN = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'B♭', 'B'];
const SOUNDING = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const nameOf = (midi: number, names: readonly string[]) => `${names[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;

/** The written notes offered: the lowest note up to written high E♭6. */
export const TOP_NOTE = 29;
export function noteRange(row: SaxRow): { lo: number; hi: number } {
  return { lo: row.bottom, hi: TOP_NOTE };
}

export type Fingering = {
  /** Written semitones above low B♭3. */
  s: number;
  written: string;
  sounding: string;
  hz: number;
  register: 1 | 2;
  /** The first open hole (0 = every hole closed: the bell is the end). */
  k: number;
  /** Every open hole, nearest the mouthpiece first. */
  open: number[];
  octaveKey: boolean;
  /** The air column from the reed to the first open hole (mm, DERIVED). */
  air: number;
};

/** The highest first-register note: written C♯5, every hole open. */
export const REGISTER_TOP = 15;

/** A note's simplified fingering and what it sounds (written s → sounding). */
export function fingering(row: SaxRow, s: number): Fingering {
  const r = noteRange(row);
  const n = Math.max(r.lo, Math.min(r.hi, Math.round(s)));
  const register: 1 | 2 = n <= REGISTER_TOP ? 1 : 2;
  const k = (register === 1 ? n : n - 12) - row.bottom;
  const midi = LOW_BB_MIDI + n;
  const L = k === 0 ? lowestAirColumn(row) : holesOf(row)[k - 1].air;
  const open: number[] = [];
  for (let i = k; i >= 1; i--) open.push(i);
  return {
    s: n,
    written: nameOf(midi, WRITTEN),
    sounding: nameOf(midi + row.transpose, SOUNDING),
    hz: etHz(midi + row.transpose),
    register,
    k,
    open,
    octaveKey: register === 2,
    air: L,
  };
}

export type Radiator = { kind: 'hole' | 'bell'; k: number; u: number; strength: 'main' | 'partial' | 'harmonics' };

/**
 * Where the sound leaves for a fingering (SOURCES §1, simplified): below the
 * tone-hole cutoff mostly through the FIRST open hole and the next two open
 * holes past it (weaker); with every key closed, through the bell. The bell
 * also carries the high harmonics of most notes.
 */
export function radiators(row: SaxRow, f: Fingering): Radiator[] {
  const P = pathOf(row);
  const H = holesOf(row);
  if (f.k === 0) return [{ kind: 'bell', k: 0, u: P.U, strength: 'main' }];
  const out: Radiator[] = [{ kind: 'hole', k: f.k, u: H[f.k - 1].u, strength: 'main' }];
  for (const k of [f.k - 1, f.k - 2]) if (k >= 1) out.push({ kind: 'hole', k, u: H[k - 1].u, strength: 'partial' });
  out.push({ kind: 'bell', k: 0, u: P.U, strength: 'harmonics' });
  return out;
}

/** Where most of the sound leaves for a note: the path distance (mm). */
export function radiationPoint(row: SaxRow, s: number): number {
  const f = fingering(row, s);
  return radiators(row, f)[0].u;
}

/**
 * The air column's pressure shape n along a cone open at its far end
 * (simplified: the cone's standing wave sin(nπx)/(nπx), x = 0 at the cone's
 * tip, 1 at the open end). Shape 1 is the note; shape 2 sounds an octave
 * higher (the octave key's register). Pure; amplitude 0…1.
 */
export function coneShape(n: number, x: number): number {
  const t = n * Math.PI * Math.max(1e-6, x);
  return Math.sin(t) / t;
}

/** The still points (pressure nodes) of shape n along the cone, 0…1. */
export function coneNodes(n: number): number[] {
  const out: number[] = [];
  for (let m = 1; m <= n; m++) out.push(m / n);
  return out;
}
