/**
 * FIGURE V2 — THE PERSON SEEN FROM BEHIND, PLANNED (wave 6 of D78, the
 * ensembles: a conductor or a chorister seen from the hall's far side, the
 * section seen from behind; 2026-11-24). Pure: no React, no Skia.
 *
 * A pose seen from BEHIND (u: the person's RIGHT on the viewer's RIGHT; v = y,
 * down). The body's masses are the approved front view's (frontPlan.ts, read
 * only): a body's silhouette is the same from the front and from behind, so
 * the front plan is laid out for the pose mirrored and its outlines mirrored
 * back — the same five people, the same builds, the same garments. What a
 * viewer behind sees is planned here:
 *   • the BACK OF THE HEAD: the hair over the crown and down to the nape, per
 *     person — the drummer's short cut and Kofi's crop tapering to the nape
 *     with the ears showing; Ruth's bob falling straight to the jaw over the
 *     ears, its ends turned under; Ana's hair drawn back to a low ponytail, the
 *     tie behind the head at the top of the ears and the tail hanging over the
 *     nape; Mei's sleek hair drawn to a round bun at the back of the head at the
 *     top of the ears. The ears' backs (their roots behind the skull), the back
 *     of the neck with its central furrow, and the hair's shadow on the nape;
 *   • the SHIRT'S BACK: the back neckline (higher than the front's), a crew
 *     neck's rib or a shirt collar's stand and leaf turned down round the neck,
 *     the shoulder seams just inside the top line, a dress shirt's yoke seam,
 *     the shoulder blades' light, the belt's back with its loops (no buckle);
 *   • the TROUSERS' BACK: the seat seam, two welt pockets, the soft fold where
 *     the seat meets the legs, the creases, the cloth gathering behind the
 *     knees, the hem over the heel; the SHOES' HEELS: the counter, its back
 *     seam, the heel block;
 *   • the JACKET'S BACK: one back panel, its collar standing round the neck
 *     with the shirt collar a strip above it, the side seams, the center seam
 *     ending in a center VENT, the sleeves;
 *   • the HANDS hanging at the sides seen from behind: their little-finger
 *     edge with a strip of palm (backHands.ts) — the thumb is on the far side.
 * The light is the same key light from the upper LEFT OF THE PICTURE (which is
 * the person's left side seen from behind): every value is painted from the
 * picture's light, never a mirrored front.
 */
import type { PlayerPose } from '../players/playerPose.ts';
import { pt } from '../players/playerPose.ts';
import { add, lerp, mul, P, sub, unit, type Poly, type Pt } from './geom.ts';
import type { Ellipse, HairStyle, HeadStyle, BodyBuild } from './sidePlan.ts';
import { lens } from './sidePlan.ts';
import { frontPlan, FRONT_STANDING, type FrontPlan } from './frontPlan.ts';
import type { PlacedHand } from './authoredHands.ts';
import { placeBackRest } from './backHands.ts';

/* ── the pose ── */

/** A pose mirrored left to right about its shoulders' middle (the hands' directions with it). */
export function mirrorPose(p: PlayerPose): PlayerPose {
  const cx = (p.shoulderR.u + p.shoulderL.u) / 2;
  const m = (q: Pt) => pt(2 * cx - q.u, q.v);
  const hand = (h: PlayerPose['handR']): PlayerPose['handR'] => ({ ...h, wrist: m(h.wrist), dir: Math.PI - h.dir });
  return {
    ...p,
    head: { c: m(p.head.c), r: p.head.r },
    neck: m(p.neck),
    shoulderR: m(p.shoulderR),
    shoulderL: m(p.shoulderL),
    elbowR: m(p.elbowR),
    elbowL: m(p.elbowL),
    handR: hand(p.handR),
    handL: hand(p.handL),
    hipR: m(p.hipR),
    hipL: m(p.hipL),
    kneeR: m(p.kneeR),
    kneeL: m(p.kneeL),
    footR: m(p.footR),
    footL: m(p.footL),
  };
}

/** A standing person seen from behind: the front view's standing figure, the person's right on the viewer's right. */
export const BACK_STANDING: PlayerPose = mirrorPose(FRONT_STANDING);

/* ── the plan's types ── */

export type BackHead = {
  skull: Poly;
  /** The ears (closed; none when the hair covers them) and the crease where each ear's back meets the head (open). */
  ears: Poly[];
  earRoots: Poly[];
  hair: Poly;
  /** The hair's strands (lens shapes) and, pulled-back styles, the lines drawn toward the tie or the bun (open). */
  clumps: Poly[];
  combLines: Poly[];
  sheen: Poly;
  /** The tail of a ponytail (closed), its tie; a bun (closed) and its turns (open). */
  tail: Poly | null;
  /** The tail's strands (lens shapes). */
  tailClumps: Poly[];
  tie: Ellipse | null;
  bun: Poly | null;
  bunTurns: Poly[];
  /** A bob's ends turned under: the soft shade along its lower edge (closed). */
  ends: Poly | null;
  /** The back of the neck (closed), its central furrow (open), its lit column, the hair's shadow on the nape. */
  neck: Poly;
  furrow: Poly;
  neckLight: Ellipse;
  napeShadow: Poly;
  c: Pt;
  r: number;
  earShows: boolean;
  style: HairStyle;
  /** Points the tests read: the crown, the nape's hairline (its lowest point at the middle), the bun's or the tie's middle. */
  crown: Pt;
  nape: Pt;
  knot: Pt | null;
};

export type BackArm = {
  side: 1 | -1;
  shoulder: Pt;
  elbow: Pt;
  wrist: Pt;
  sleeve: Poly;
  armhole: Poly;
  cuff: Poly;
  cuffRim: Poly;
  cuffSeam: Poly;
  folds: Poly[];
  /** The point of the elbow (the olecranon under the cloth): a soft light. */
  elbowLight: Ellipse;
  upperAxis: [Pt, Pt];
  foreAxis: [Pt, Pt];
  hand: PlacedHand;
};

export type BackLeg = { side: 1 | -1; outline: Poly; axis: [Pt, Pt]; crease: Poly; folds: Poly[]; calfLight: Ellipse };
export type BackShoe = { upper: Poly; heel: Poly; seam: Poly; heelLight: Ellipse; contact: Ellipse; axis: [Pt, Pt] };

export type BackJacket = {
  body: Poly;
  collar: Poly;
  /** The center seam from the collar to the vent (open), the vent's edge to the hem (open), the vent's stitched top
   *  (open), the side seams (open), the hem (open). */
  seam: Poly;
  vent: Poly;
  ventTop: Poly;
  sideSeams: Poly[];
  hem: Poly;
  folds: Poly[];
  sleeves: { outline: Poly; endRim: Poly; folds: Poly[]; upperAxis: [Pt, Pt]; foreAxis: [Pt, Pt] }[];
  /** Where the vent opens (its top) and the hem's middle (the tests read them). */
  ventAt: Pt;
  hemAt: Pt;
};

export type BackPlan = {
  head: BackHead;
  shirt: Poly;
  /** A crew neck's rib round the back neckline, or a shirt collar's stand and leaf (closed); its top fold (open). */
  collar: Poly;
  collarTop: Poly;
  collarKind: 'crew' | 'shirt';
  shoulderSeams: Poly[];
  /** A dress shirt's yoke seam across the shoulder blades (open; clipped to the shirt), its box pleat (open). */
  yoke: Poly | null;
  pleat: Poly[];
  blades: Ellipse[];
  spine: Poly;
  tucked: boolean;
  belt: Poly | null;
  loops: Poly[];
  blouse: Poly | null;
  shirtFolds: Poly[];
  seat: Poly;
  seatSeam: Poly;
  pockets: Poly[];
  seatFold: Poly;
  legs: BackLeg[];
  legGap: Poly | null;
  shoes: BackShoe[];
  arms: BackArm[];
  jacket: BackJacket | null;
  axis: [Pt, Pt];
  shoulderW: number;
  hipV: number;
  nbV: number;
  /** The front plan the masses came from (the tests compare). */
  front: FrontPlan;
};

export type BackOpts = { jacket?: boolean; head?: HeadStyle; body?: BodyBuild; woman?: boolean };

/* ── helpers ── */

type XY = readonly (readonly [number, number])[];
function sym(right: XY): XY {
  const out: [number, number][] = right.map(([x, y]) => [x, y]);
  for (let i = right.length - 2; i >= 1; i--) out.push([-right[i][0], right[i][1]]);
  return out;
}
function jag(ps: Poly, amp: number): Poly {
  const out: Poly = [];
  for (let i = 0; i < ps.length; i++) {
    out.push(ps[i]);
    if (i < ps.length - 1) {
      const d = sub(ps[i + 1], ps[i]);
      const l = Math.hypot(d.u, d.v) || 1;
      const s = (i % 3 === 0 ? 1 : i % 3 === 1 ? -0.6 : 0.4) * amp;
      out.push(add(lerp(ps[i], ps[i + 1], 0.5), P((-d.v / l) * s, (d.u / l) * s)));
    }
  }
  return out;
}

/* ── the head from behind (authored with y DOWN round the head's center, x to the viewer's right) ── */

type HairBack = {
  hair: XY;
  clumps: [readonly [number, number], readonly [number, number], number, number][];
  comb: XY[];
  tail?: XY;
  tie?: [number, number, number, number];
  tieClumps?: [readonly [number, number], readonly [number, number], number, number][];
  bun?: { c: [number, number]; rx: number; ry: number };
  ends?: XY;
  earShows: boolean;
  nape: number;
};

/** The hair from behind, by style (the same people as frontPlan's hairShape and sidePlan's HAIR_SETS). */
function hairBack(style: HairStyle): HairBack {
  if (style === 'bob') {
    // straight past the ears (covered) to the jaw line, fuller over the crown; the ends turned under, the lower
    // edge soft and a little uneven (as the side view's)
    const R: XY = [[0, -144], [30, -141], [56, -131], [76, -114], [88, -92], [94.6, -64], [96.6, -30], [96.6, 6], [94.6, 40], [90.4, 66], [84, 84], [75, 94.6], [64, 99.6], [50, 97.6], [36, 100.8], [20, 97.4], [8, 100], [0, 98.4]];
    return {
      hair: sym(R),
      clumps: [
        [[-6, -138], [-60, -40], 20, -4],
        [[6, -138], [60, -40], 20, 4],
        [[-40, -128], [-84, 40], 18, -4],
        [[40, -128], [84, 40], 18, 4],
        [[-16, -110], [-34, 96], 18, -2],
        [[16, -110], [34, 96], 18, 2],
        [[-70, -40], [-82, 94], 12, -2],
        [[70, -40], [82, 94], 12, 2],
        [[0, -96], [-4, 96], 12, 1],
      ],
      // the strands falling from the crown, fanning out and straight down to the ends
      comb: [
        [[-4, -132], [-30, -60], [-44, 20], [-50, 92]],
        [[4, -132], [30, -60], [44, 20], [50, 92]],
        [[-10, -128], [-58, -70], [-74, 4], [-78, 86]],
        [[10, -128], [58, -70], [74, 4], [78, 86]],
        [[0, -130], [-10, -40], [-18, 40], [-20, 94]],
        [[2, -130], [12, -40], [20, 40], [22, 94]],
      ],
      ends: [[-88, 70], [-60, 84], [-30, 86], [0, 85], [30, 86], [60, 84], [88, 70], [84, 84], [75, 94.6], [64, 99.6], [50, 97.6], [36, 100.8], [20, 97.4], [8, 100], [0, 98.4], [-8, 100], [-20, 97.4], [-36, 100.8], [-50, 97.6], [-64, 99.6], [-75, 94.6], [-84, 84]],
      earShows: false,
      nape: 100,
    };
  }
  if (style === 'pony') {
    // (Ana) drawn back smooth over the skull and over the top of the ears to a tie behind the head at the top
    // of the ears; below the tie the nape's hair is drawn up too (a soft hairline), the tail hanging over it
    const R: XY = [[0, -134], [30, -131], [55, -121], [73, -103], [83, -80], [86.6, -56], [86.4, -36], [83.4, -21], [78, -12], [72, 2], [67, 18], [59, 33], [47, 44], [33, 50], [18, 52], [8, 53.6], [0, 52]];
    return {
      hair: sym(R),
      clumps: [[[-8, -128], [-6, -22], 14, -2], [[8, -128], [6, -22], 14, 2], [[-70, -40], [-16, -10], 10, 3], [[70, -40], [16, -10], 10, -3]],
      comb: [
        [[-30, -130], [-20, -70], [-12, -20]],
        [[30, -130], [20, -70], [12, -20]],
        [[-62, -112], [-40, -56], [-16, -14]],
        [[62, -112], [40, -56], [16, -14]],
        [[-82, -64], [-52, -32], [-18, -8]],
        [[82, -64], [52, -32], [18, -8]],
        [[-66, 18], [-40, 6], [-16, -2]],
        [[66, 18], [40, 6], [16, -2]],
      ],
      // the tail: gathered at the tie, a little fuller below it, hanging over the nape and tapering to soft ends
      tail: [[-14, -12], [-5, -16], [6, -16], [15, -11], [22, 4], [27, 26], [28.6, 50], [26, 74], [20, 92], [14, 104], [8, 108], [4, 114], [-1, 109], [-6, 115], [-10, 106], [-17, 96], [-24, 76], [-28, 52], [-27.6, 26], [-22, 4]],
      tieClumps: [[[-8, -2], [-12, 100], 9, -2], [[6, -2], [12, 98], 9, 2], [[-1, 0], [-2, 108], 7, 1], [[-16, 10], [-20, 80], 6, -1]],
      tie: [0, -7, 15, 4.4],
      earShows: true,
      nape: 52,
    };
  }
  if (style === 'bun') {
    // (Mei) sleek over the skull to a round bun at the back of the head at the top of the ears; a higher,
    // tidy nape
    const R: XY = [[0, -128], [28, -125], [50, -116], [66, -100], [75, -80], [79, -58], [79.4, -38], [77.4, -24], [73.4, -14], [69.6, 0], [65, 16], [57, 31], [46, 42], [32, 48], [16, 50.6], [0, 50]];
    return {
      hair: sym(R),
      clumps: [[[-10, -122], [-8, -34], 10, -2], [[10, -122], [8, -34], 10, 2]],
      comb: [
        [[-24, -124], [-20, -76], [-14, -32]],
        [[24, -124], [20, -76], [14, -32]],
        [[-56, -106], [-42, -64], [-26, -26]],
        [[56, -106], [42, -64], [26, -26]],
        [[-78, -52], [-52, -26], [-30, -10]],
        [[78, -52], [52, -26], [30, -10]],
        [[-62, 24], [-44, 18], [-28, 14]],
        [[62, 24], [44, 18], [28, 14]],
      ],
      bun: { c: [0, -4], rx: 37, ry: 31 },
      earShows: true,
      nape: 50,
    };
  }
  if (style === 'crop') {
    // (Kofi) close-cropped: a thin layer hugging the skull (the skull's own round shape shows through it), the
    // sides taken in close above the ears, the nape's hairline higher than the drummer's — a shallow curve that
    // thins into the skin (the painter fades its last mm), never a cut edge
    const R: XY = [[0, -123], [29, -120.6], [50, -112.6], [64, -98], [72.6, -80], [76, -59], [76.4, -40], [75, -24], [71.6, -12], [66.6, 0], [61.6, 12], [54, 23], [44, 31], [32, 36], [20, 39], [9, 41.2], [0, 42.4]];
    return {
      hair: sym(R),
      clumps: [
        [[-6, -118], [-44, -44], 5, -1],
        [[8, -116], [46, -44], 5, 1],
        [[-26, -98], [-56, 8], 5, -1],
        [[26, -98], [56, 8], 5, 1],
        [[-2, -92], [-4, 30], 5, 0],
        [[-46, -80], [-66, -6], 4, -1],
        [[46, -80], [66, -6], 4, 1],
      ],
      comb: [],
      earShows: true,
      nape: 42,
    };
  }
  // 'short' (the drummer's): a fuller, longer cut than Kofi's crop — volume over the crown standing off the skull,
  // the hair falling in loose locks from a crown whorl, over the tops of the ears' backs, and lower at the nape:
  // the hairline ends in soft uneven tufts that thin into the skin (the painter fades them), never a cut edge
  const R: XY = [[0, -143], [34, -140], [60, -129], [78, -111], [88, -89], [92.6, -64], [92.6, -40], [90, -20], [85.6, -4], [80, 10], [74, 26], [66.6, 40], [58, 50], [50, 56.6], [43, 61.6], [36, 60.8], [28, 65.6], [20, 64.8], [11, 68.6], [4, 67.8], [0, 69]];
  return {
    hair: sym(R),
    clumps: [
      [[4, -116], [-60, -86], 17, -4],
      [[4, -116], [64, -84], 17, 4],
      [[0, -114], [-70, -8], 16, -5],
      [[6, -114], [72, -6], 16, 5],
      [[2, -110], [-26, 60], 15, 3],
      [[6, -110], [30, 60], 15, -3],
      [[-40, -70], [-80, 24], 12, -3],
      [[42, -70], [82, 26], 12, 3],
      [[-12, -60], [-46, 56], 11, 2],
      [[14, -60], [48, 56], 11, -2],
    ],
    // the locks falling from the crown's whorl, curving out and down (a little wave)
    comb: [
      [[2, -112], [-22, -84], [-40, -36], [-38, 20], [-46, 58]],
      [[6, -112], [30, -82], [46, -34], [44, 22], [50, 56]],
      [[0, -110], [-50, -96], [-74, -56], [-82, -10]],
      [[8, -110], [56, -94], [78, -54], [86, -8]],
      [[4, -108], [-2, -60], [6, -10], [-2, 40], [4, 64]],
    ],
    earShows: true,
    nape: 70,
  };
}

function headBack(front: FrontPlan, cx: number, style: HeadStyle, woman: boolean): BackHead {
  const M = (q: Pt) => P(2 * cx - q.u, q.v);
  const fh = front.head;
  const c = M(fh.c);
  const r = fh.r;
  const k = r / 110;
  const F = (x: number, y: number) => P(c.u + x * k, c.v + y * k);
  const MP = (xs: XY): Poly => xs.map(([x, y]) => F(x, y));
  const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: F(x, y), rx: rx * k, ry: ry * k, rot });
  const hb = hairBack(style.hair);
  // (Ensembles3) Kofi's neck the broadest (his side view's), the drummer's slimmer — the two men differ from behind
  const nw = (woman ? 43 : 47) + (style.hair === 'crop' ? 8 : 0);
  // the back of the neck: from under the skull, broadening into the trapezius at the collar
  const neck = MP([[-nw, 20], [nw, 20], [nw + 1.5, 70], [nw + 4, 112], [nw + 10, 140], [nw + 22, 160], [nw + 34, 178], [nw + 44, 214], [-nw - 44, 214], [-nw - 34, 178], [-nw - 22, 160], [-nw - 10, 140], [-nw - 4, 112], [-nw - 1.5, 70]]);
  const tail = hb.tail ? MP(hb.tail) : null;
  const bun = hb.bun ? (() => {
    const b = hb.bun;
    const pts: XY = Array.from({ length: 20 }, (_, i) => {
      const a = (i / 20) * Math.PI * 2;
      // (a round knot, a little flatter at its bottom where it sits on the nape's hair)
      const ry = Math.sin(a) > 0 ? b.ry * 0.92 : b.ry;
      return [b.c[0] + Math.cos(a) * b.rx, b.c[1] + Math.sin(a) * ry] as const;
    });
    return jag(MP(pts), 0.9 * k);
  })() : null;
  const bunTurns: Poly[] = hb.bun
    ? [
        MP([[-28, -18], [-12, -28], [8, -28], [25, -18], [30, -2], [22, 14]]),
        MP([[-30, 4], [-22, 18], [-4, 23], [14, 17], [19, 3], [10, -11], [-7, -13], [-16, -4]]),
        MP([[-10, -6], [-3, 5], [7, 2]]),
      ]
    : [];
  return {
    skull: front.head.skull.map(M),
    ears: fh.ears.map((e) => e.map(M)),
    earRoots: fh.earFolds.map((e) => e.map(M)),
    hair: jag(MP(hb.hair), 1.1 * k),
    clumps: hb.clumps.map(([a, b, w, bow]) => lens(F(a[0], a[1]), F(b[0], b[1]), w * k, bow * k)),
    tailClumps: (hb.tieClumps ?? []).map(([a, b, w, bow]) => lens(F(a[0], a[1]), F(b[0], b[1]), w * k, bow * k)),
    combLines: hb.comb.map((l) => MP(l)),
    sheen: MP(style.hair === 'bob' ? [[-74, -96], [-56, -116], [-30, -132], [-6, -138]] : [[-62, -96], [-46, -114], [-24, -124], [0, -127]]),
    tail,
    tie: hb.tie ? E(hb.tie[0], hb.tie[1], hb.tie[2], hb.tie[3]) : null,
    bun,
    bunTurns,
    ends: hb.ends ? MP(hb.ends) : null,
    neck,
    furrow: MP([[0, hb.nape - 4], [0.6, hb.nape + 30], [0, hb.nape + 62]]),
    neckLight: E(-nw * 0.5, hb.nape + 44, 13, 34, 0),
    napeShadow: MP([[-nw - 6, hb.nape - 14], [nw + 6, hb.nape - 14], [nw + 4, hb.nape + 12], [0, hb.nape + 18], [-nw - 4, hb.nape + 12]]),
    c,
    r,
    earShows: hb.earShows,
    style: style.hair,
    crown: F(4, -112),
    nape: F(0, hb.nape),
    knot: hb.bun ? F(hb.bun.c[0], hb.bun.c[1]) : hb.tie ? F(hb.tie[0], hb.tie[1]) : null,
  };
}

/* ── the body ── */

const mirrorCache = new WeakMap<PlayerPose, PlayerPose>();
const planCache = new WeakMap<PlayerPose, Map<string, BackPlan>>();

/** The back-view plan for a pose (seen from behind) and a person (memoised per pose and options). */
export function backPlan(pose: PlayerPose, o: BackOpts = {}): BackPlan {
  let m = planCache.get(pose);
  if (!m) {
    m = new Map();
    planCache.set(pose, m);
  }
  const key = JSON.stringify(o);
  const hit = m.get(key);
  if (hit) return hit;
  let fp = mirrorCache.get(pose);
  if (!fp) {
    fp = mirrorPose(pose);
    mirrorCache.set(pose, fp);
  }
  const plan = build(pose, fp, o);
  m.set(key, plan);
  return plan;
}

/** Drop a polygon's run of points matching `drop` (one run, possibly wrapping) and start after it. */
function cutRun(poly: Poly, drop: (q: Pt) => boolean): Poly {
  const n = poly.length;
  const keep = poly.map((q) => !drop(q));
  let i0 = -1;
  for (let i = 0; i < n; i++) if (keep[i] && !keep[(i - 1 + n) % n]) i0 = i;
  if (i0 < 0) return poly;
  const out: Poly = [];
  for (let j = 0; j < n; j++) {
    const i = (i0 + j) % n;
    if (keep[i]) out.push(poly[i]);
  }
  return out;
}

function build(pose: PlayerPose, fp: PlayerPose, o: BackOpts): BackPlan {
  const F = frontPlan(fp, { ...(o.head ? { head: o.head } : {}), ...(o.body ? { body: o.body } : {}), ...(o.woman ? { woman: true } : {}), ...(o.jacket ? { jacket: true } : {}) });
  const cx = (pose.shoulderR.u + pose.shoulderL.u) / 2;
  const M = (q: Pt) => P(2 * cx - q.u, q.v);
  const MP = (ps: readonly Pt[]): Poly => ps.map(M);
  const woman = !!o.woman;
  const style = o.head ?? { hair: 'short', face: 'drummer' };
  const head = headBack(F, cx, style, woman);
  const k = fp.head.r / 110;
  const nbV = F.nbV;
  const D = F.hipV - nbV;
  const at = (x: number, y: number) => P(cx + x, nbV + y);
  const nwc = (woman ? 43 : 49) * k + 4;
  const shx = F.shoulderW / 2;
  const crew = F.collarKind === 'crew';
  const B = o.body;

  /* the shirt's back: the front's sides and hem, its neckline replaced by the back's (higher, a gentle curve) */
  const sides = cutRun(MP(F.shirt), (q) => Math.abs(q.u - cx) < nwc + 10 && q.v < nbV + 40);
  const backNeck: Poly = [at(-(nwc - 1), -12), at(-nwc * 0.62, -8.4), at(-nwc * 0.3, -6.6), at(0, -6), at(nwc * 0.3, -6.6), at(nwc * 0.62, -8.4), at(nwc - 1, -12)];
  const last = sides[sides.length - 1];
  const shirt: Poly = [...sides, ...(last.u < cx ? backNeck : [...backNeck].reverse())];
  const collar: Poly = crew
    ? [at(-(nwc + 1), -13), at(-nwc * 0.6, -9.2), at(0, -7.2), at(nwc * 0.6, -9.2), at(nwc + 1, -13), at(nwc + 4, -3), at(nwc * 0.62, 1.6), at(0, 3.4), at(-nwc * 0.62, 1.6), at(-(nwc + 4), -3)]
    : [at(-(nwc - 1), -36), at(-nwc * 0.5, -41.4), at(0, -43), at(nwc * 0.5, -41.4), at(nwc - 1, -36), at(nwc + 12, -15), at(nwc + 18, -6), at(nwc * 0.62, 0.6), at(0, 3), at(-nwc * 0.62, 0.6), at(-(nwc + 18), -6), at(-(nwc + 12), -15)];
  const collarTop: Poly = crew ? [at(-(nwc + 1), -12.4), at(-nwc * 0.6, -8.6), at(0, -6.6), at(nwc * 0.6, -8.6), at(nwc + 1, -12.4)] : [at(-(nwc - 1), -35.4), at(-nwc * 0.5, -40.8), at(0, -42.4), at(nwc * 0.5, -40.8), at(nwc - 1, -35.4)];
  const shoulderSeams: Poly[] = ([-1, 1] as const).map((s) => [at(s * (nwc + (crew ? 6 : 16)), crew ? -8 : -6), at(s * (nwc + 40), 6), at(s * ((nwc + shx) / 2 + 20), 20), at(s * (shx - 22), 33)]);
  const tucked = F.tucked;
  const yoke: Poly | null = crew ? null : [at(-shx - 20, 96), at(-shx * 0.5, 100), at(0, 102), at(shx * 0.5, 100), at(shx + 20, 96)];
  const pleat: Poly[] = crew ? [] : [[at(-9, 102), at(-9.6, 150)], [at(9, 102), at(9.6, 150)]];
  const blades: Ellipse[] = [{ c: at(-78, 120), rx: 58 * (B?.back ?? 1), ry: 72, rot: 0.12 }, { c: at(78, 120), rx: 58 * (B?.back ?? 1), ry: 72, rot: -0.12 }];
  const spine: Poly = [at(0, 30), at(0.6, D * 0.4), at(0, D * 0.75)];
  const beltTop = D - 80;
  const beltBot = D - 46;
  const belt = F.belt ? MP(F.belt) : null;
  const loops: Poly[] = belt
    ? [0, -0.56, 0.56].map((f) => {
        const x = f * 150 * (B?.waist ?? 1);
        return [at(x - 5, beltTop + 1), at(x + 5, beltTop + 1), at(x + 5, beltBot + 10), at(x - 5, beltBot + 10)];
      })
    : [];
  const blouse = F.blouse ? MP(F.blouse) : null;
  const shirtFolds = F.shirtFolds.map(MP);

  /* the trousers' back */
  const seat = MP(F.seat);
  const seatSeam: Poly = [at(0, beltBot + 6), at(0.8, D + 30), at(0, D + 92)];
  const pockets: Poly[] = [
    [at(-128, D - 22), at(-52, D - 16)],
    [at(52, D - 16), at(128, D - 22)],
  ];
  // the soft fold where the seat meets the legs (one shallow curve across, the cloth's shade — nothing else)
  const seatFold: Poly = [at(-150, D + 80), at(-80, D + 98), at(-20, D + 96), at(0, D + 86), at(20, D + 96), at(80, D + 98), at(150, D + 80), at(150, D + 104), at(80, D + 122), at(0, D + 112), at(-80, D + 122), at(-150, D + 104)];
  const legs: BackLeg[] = F.legs.map((l) => {
    const s = -l.side as 1 | -1;
    const ax = MP(l.axis) as [Pt, Pt];
    const knee = lerp(ax[0], ax[1], 0.5);
    const ankle = ax[1];
    return {
      side: s,
      outline: MP(l.outline),
      axis: ax,
      crease: MP(l.crease),
      folds: [
        // the cloth gathering behind the knee: shallow folds across the leg
        lens(P(knee.u - 42, knee.v - 6), P(knee.u + 38, knee.v - 14), 5, 2),
        lens(P(knee.u - 36, knee.v + 16), P(knee.u + 40, knee.v + 10), 4.5, -2),
        lens(P(ankle.u - s * 44, ankle.v - 40), P(ankle.u + s * 40, ankle.v - 30), 5, -2),
        lens(P(ankle.u - s * 30, ankle.v - 16), P(ankle.u + s * 46, ankle.v - 8), 4, 2),
      ],
      calfLight: { c: P(knee.u - 12, lerp(knee, ankle, 0.36).v), rx: 24, ry: 70, rot: 0 },
    };
  });
  const legGap = F.legGap ? MP(F.legGap) : null;

  /* the shoes from behind: the heel counter, its back seam, the heel block; the forefoot's sides past the heel */
  const floor = fp.floor ?? fp.footR.v;
  const SHOE: XY = [[-44, 0], [-47.4, -7], [-45.6, -15], [-39, -21], [-36.6, -32], [-35.6, -46], [-32, -58], [-24, -66], [0, -69], [24, -66], [32, -58], [35.6, -46], [36.6, -32], [39, -21], [45.6, -15], [47.4, -7], [44, 0]];
  const HEEL: XY = [[-32, 0], [-33.6, -10], [-33.6, -21], [33.6, -21], [33.6, -10], [32, 0]];
  const shoes: BackShoe[] = ([fp.footR, fp.footL] as const).map((f0, i) => {
    const f = M(f0);
    const s = i === 0 ? 1 : -1; // (the right shoe on the viewer's right: turned out a little, its outer side shows more)
    const S = (x: number, y: number) => P(f.u + s * x * (x > 0 ? 1.04 : 0.96), floor + y);
    return {
      upper: SHOE.map(([x, y]) => S(x, y)),
      heel: HEEL.map(([x, y]) => S(x, y)),
      seam: [S(0, -64), S(0, -40), S(0, -22)],
      heelLight: { c: S(-12, -44), rx: 10, ry: 16, rot: 0 },
      contact: { c: S(0, 2), rx: 58, ry: 8, rot: 0 },
      axis: [S(-40, -30), S(40, -30)] as [Pt, Pt],
    };
  });

  /* the arms: the front's sleeves (the same cloth from behind), each hand from behind */
  const arms: BackArm[] = F.arms.map((a) => {
    const s = -a.side as 1 | -1;
    const W = M(a.wrist);
    const E = M(a.elbow);
    const S = M(a.shoulder);
    const df = unit(sub(W, E));
    const dir = Math.atan2(df.v, df.u);
    const hand = placeBackRest(W, dir, P(Math.sign(cx - W.u) || -s, 0));
    return {
      side: s,
      shoulder: S,
      elbow: E,
      wrist: W,
      sleeve: MP(a.sleeve),
      armhole: MP(a.armhole),
      cuff: MP(a.cuff),
      cuffRim: MP(a.cuffRim),
      cuffSeam: MP(a.cuffSeam),
      folds: a.folds.map(MP),
      elbowLight: { c: add(E, mul(df, -6)), rx: 13, ry: 20, rot: 0 },
      upperAxis: [S, E],
      foreAxis: [E, W],
      hand,
    };
  });

  /* the jacket's back */
  let jacket: BackJacket | null = null;
  if (F.jacket) {
    const J = F.jacket;
    // each front panel from the neck over the shoulder and down the side to the hem's corner: the back's outline
    const half = (p: Poly): Poly => {
      const maxV = Math.max(...p.map((q) => q.v));
      const end = p.findIndex((q) => q.v >= maxV - 3);
      return p.slice(0, end + 1);
    };
    const A = MP(half(J.body[0]));
    const Bh = MP(half(J.body[1]));
    const hemY = Math.max(...A.map((q) => q.v));
    const hemC = P(cx, hemY + 3);
    const body: Poly = [...A, hemC, ...[...Bh].reverse(), at(nwc * 0.5, -22), at(0, -24), at(-nwc * 0.5, -22)];
    const ventTopY = hemY - 210;
    const jc: Poly = [at(-(nwc + 2), -27), at(-nwc * 0.5, -31), at(0, -32), at(nwc * 0.5, -31), at(nwc + 2, -27), at(nwc + 22, -10), at(nwc + 30, 0), at(nwc * 0.7, 12), at(0, 17), at(-nwc * 0.7, 12), at(-(nwc + 30), 0), at(-(nwc + 22), -10)];
    const sideSeams: Poly[] = ([-1, 1] as const).map((s) => [at(s * (shx - 4), 120), at(s * (shx - 30), 230), at(s * (shx - 42), D - 20), at(s * (shx - 38), hemY - nbV - 6)]);
    jacket = {
      body,
      collar: jc,
      seam: [at(0, 17), at(0.8, (ventTopY - nbV) * 0.5), at(0, ventTopY - nbV)],
      vent: [at(2.4, ventTopY - nbV + 2), at(2.6, (ventTopY + hemY) / 2 - nbV), at(2.2, hemY - nbV + 2)],
      ventTop: [at(0, ventTopY - nbV), at(5, ventTopY - nbV + 6), at(10, ventTopY - nbV + 9)],
      sideSeams,
      hem: [at(-shx, hemY - nbV - 2), at(-shx * 0.5, hemY - nbV + 1), at(0, hemY - nbV + 3), at(shx * 0.5, hemY - nbV + 1), at(shx, hemY - nbV - 2)],
      folds: [lens(at(-40, 40), at(-130, 110), 6, 3), lens(at(40, 40), at(130, 110), 6, -3), lens(at(-60, D - 60), at(-30, D + 30), 6, 2), lens(at(60, D - 60), at(30, D + 30), 6, -2)],
      sleeves: J.sleeves.map((q) => ({ outline: MP(q.outline), endRim: MP(q.endRim), folds: q.folds.map(MP), upperAxis: MP(q.upperAxis) as [Pt, Pt], foreAxis: MP(q.foreAxis) as [Pt, Pt] })),
      ventAt: P(cx, ventTopY),
      hemAt: hemC,
    };
  }

  return {
    head,
    shirt,
    collar,
    collarTop,
    collarKind: crew ? 'crew' : 'shirt',
    shoulderSeams,
    yoke,
    pleat,
    blades,
    spine,
    tucked,
    belt,
    loops,
    blouse,
    shirtFolds,
    seat,
    seatSeam,
    pockets,
    seatFold,
    legs,
    legGap,
    shoes,
    arms,
    jacket,
    axis: [M(F.axis[0]), M(F.axis[1])],
    shoulderW: F.shoulderW,
    hipV: F.hipV,
    nbV,
    front: F,
  };
}
