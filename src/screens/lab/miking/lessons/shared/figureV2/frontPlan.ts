/**
 * FIGURE V2 — THE PERSON SEEN FROM THE FRONT, PLANNED (wave 4 of D78, the
 * shared figure from the front; 2026-11-24). Pure: no React, no Skia.
 *
 * From a 'front' PlayerPose (u = −z: the person's right on the viewer's left;
 * v = y, down) this lays out the control points of every drawn part in the
 * view's millimetres, in the approved look of the side view (sidePlan.ts) and
 * the cast's builds (cast.ts):
 *   • the HEAD face-on to adult proportions (the eye line half way down the
 *     head, the eyes one eye-width apart, the nose's wings about as wide as the
 *     gap between the eyes, the mouth's corners under the pupils, the ears
 *     between the brow line and the nose's base), the face's planes as soft
 *     lights and shades (the forehead, the brow's shadow over the sockets, the
 *     cheekbone, the side of the nose turning from the light, the shadow under
 *     the lower lip, the chin's light), the jaw's line and its shadow on the
 *     neck;
 *   • the person's HAIR from the front (the drummer's short cut, a close crop,
 *     a bob over the ears, hair pulled back to a ponytail or a bun);
 *   • the SHIRT on the body: the trapezius sloping from the neck to the
 *     shoulder, ONE sleeve from the shoulder to the cuff (the deltoid a gentle
 *     swell inside the silhouette, the armhole only a soft seam, a soft elbow),
 *     the chest, the waist, a crew neck or a shirt collar with its placket,
 *     tucked at a belt or hanging loose over the hips;
 *   • TROUSERS as one garment (the seat block and the two legs, the legs
 *     parting below the crotch — nothing drawn there but the cloth), a crease
 *     down each leg, the break over the shoe; SHOES seen toe-on;
 *   • the hands at rest (frontHands.ts): hanging at the side (the thumb's
 *     side toward the viewer) or, seated, lying on the thigh behind the knee;
 *   • the JACKET (the approved cast dress variant, jacketPlan.ts, seen from
 *     the front): the same cloth a little outside the shirt, squarer
 *     shoulders, the lapels and the collar turned back in a V to the one
 *     button with the shirt showing in the V, the hem below the seat, a hip
 *     flap on each side and the breast welt on the wearer's left, each sleeve
 *     ending SHIRT_CUFF_SHOWS short of the shirt's cuff.
 * The light is the drums' key light from the upper left (the viewer's left).
 */
import type { PlayerPose } from '../players/playerPose.ts';
import { pt } from '../players/playerPose.ts';
import { add, dist, limbOutline, lerp, mul, P, sub, unit, type Poly, type Pt } from './geom.ts';
import type { Ellipse, BodyBuild, HairStyle, HeadStyle } from './sidePlan.ts';
import { lens } from './sidePlan.ts';
import { SHIRT_CUFF_SHOWS, BUTTON_T } from './jacketPlan.ts';
import type { PlacedHand } from './authoredHands.ts';
import { placeFrontRest } from './frontHands.ts';
import { TORSO_FRONT } from '../broadcast/standing.ts';

/* ── the poses: standing (the body-worn layout's own figure) and seated ── */

/** A standing person from the front: the body-worn layout's figure (standing.ts TORSO_FRONT). */
export const FRONT_STANDING: PlayerPose = TORSO_FRONT;

/** A person seated on a chair (seat ≈ 450 mm), seen from the front: the body above the hips as standing,
 *  lowered onto the seat; the thighs toward the viewer (the knees just below the hips in the picture),
 *  the shins down to the floor, the hands resting on the thighs behind the knees. Drawing defaults. */
export const FRONT_SEATED: PlayerPose = (() => {
  const T = TORSO_FRONT;
  const floor0 = T.floor ?? 1550;
  const hipV = floor0 - 470;
  const d = hipV - T.hipR.v;
  const m = (q: Pt) => pt(q.u, q.v + d);
  // (seen from a standing person's eye, a little above: the thighs show foreshortened from the hip crease to
  // the knees, the knees' fronts about 120 mm below the hips in the picture)
  const kneeV = hipV + 120;
  // (the feet are as far forward as the knees: they sit as much lower in the picture — the shins full length)
  const floor = floor0 + 116;
  return {
    ...T,
    posture: 'seated',
    head: { c: m(T.head.c), r: T.head.r },
    neck: m(T.neck),
    shoulderR: m(T.shoulderR),
    shoulderL: m(T.shoulderL),
    // the upper arms hang a little forward, the forearms reaching forward and down to the knees
    elbowR: pt(-204, T.elbowR.v + d - 70),
    elbowL: pt(204, T.elbowL.v + d - 70),
    // (the fingers hang over the front of the knee, turned a little toward the middle, as the forearm runs)
    handR: { wrist: pt(-128, kneeV - 104), dir: Math.PI / 2 - 0.1, kind: 'rest' },
    handL: { wrist: pt(128, kneeV - 104), dir: Math.PI / 2 + 0.1, kind: 'rest' },
    hipR: pt(T.hipR.u, hipV),
    hipL: pt(T.hipL.u, hipV),
    kneeR: pt(-120, kneeV),
    kneeL: pt(120, kneeV),
    footR: pt(-126, floor),
    footL: pt(126, floor),
    floor,
  };
})();

/* ── the plan's types ── */

export type FrontHead = {
  skull: Poly;
  /** The ears (each closed; none when the hair covers them) and their inner fold (open). */
  ears: Poly[];
  earFolds: Poly[];
  /** Each ear's middle (the person's right, then left) — also where the hair hides them (a headset hangs there). */
  earsAt: Pt[];
  hair: Poly;
  /** (FrontBoom3, optional) the gathered hair behind the head (a ponytail's edge, a bun's), drawn behind the head,
   *  the neck and the shirt. */
  hairBack?: Poly[];
  /** The hair's strands and parting (lens shapes and open lines). */
  clumps: Poly[];
  part: Poly | null;
  sheen: Poly;
  neck: Poly;
  jawShadow: Poly;
  jaw: Poly;
  scm: Poly[];
  brows: Poly[];
  eyes: Poly[];
  irises: Ellipse[];
  lids: Poly[];
  lidCreases: Poly[];
  sockets: Ellipse[];
  noseShade: Poly;
  noseBridge: Ellipse;
  noseTip: Ellipse;
  alae: Ellipse[];
  nostrils: Ellipse[];
  underNose: Ellipse;
  nasolabial: Poly[];
  upperLip: Poly;
  lowerLip: Poly;
  mouth: Poly;
  underLip: Ellipse;
  chinLight: Ellipse;
  /** The face's soft lights: the forehead, the lit cheekbone, the brow ridge. */
  lights: Ellipse[];
  /** The face's planes as soft forms: darks (the brow ridge's shadow, the temples, under the cheekbones, the
   *  sides turning from the light, the philtrum's sides) and lights (the cheekbone, the brow, the nose's bridge). */
  forms: { dark: Ellipse[]; light: Ellipse[] };
  /** The shadow side of the face (the viewer's right half), from the profile's middle out. */
  shadeSide: Poly;
  c: Pt;
  r: number;
  earShows: boolean;
  /** Points the tests read. */
  eyeL: Pt;
  eyeR: Pt;
  mouthC: Pt;
  chin: Pt;
  crown: Pt;
};

export type FrontArm = {
  side: 1 | -1;
  shoulder: Pt;
  elbow: Pt;
  wrist: Pt;
  /** ONE sleeve, the trapezius's end to the cuff (closed). */
  sleeve: Poly;
  /** The set-in seam round the arm's root (open, soft). */
  armhole: Poly;
  cuff: Poly;
  /** The cuff's near rim (open) and its seam toward the elbow (open). */
  cuffRim: Poly;
  cuffSeam: Poly;
  wristSkin: Poly;
  folds: Poly[];
  upperAxis: [Pt, Pt];
  foreAxis: [Pt, Pt];
  hand: PlacedHand;
};

export type FrontLeg = {
  side: 1 | -1;
  /** The trouser leg (closed): standing, hip → knee → hem; seated, the shin from under the knee to the hem. */
  outline: Poly;
  axis: [Pt, Pt];
  /** (seated) the thigh's end toward the viewer and the knee (closed). */
  thigh: Poly | null;
  knee: Ellipse | null;
  /** The pressed crease down the leg's front (open). */
  crease: Poly;
  folds: Poly[];
  kneeLight: Ellipse;
};

export type FrontShoe = { upper: Poly; sole: Poly; toeLight: Ellipse; contact: Ellipse; axis: [Pt, Pt] };

export type FrontJacket = {
  /** The two fronts (each closed, from the shoulder to the hem; the painter unites them). */
  body: Poly[];
  /** The lapels and the collar turned back (closed, one each side) and their cut edges (open). */
  faces: Poly[];
  cutEdges: Poly[];
  /** The two rolls (the fold of each lapel, open), the button, the pockets (open lines), the hem's edge. */
  rolls: Poly[];
  notches: Poly[];
  button: Ellipse;
  pockets: Poly[];
  hem: Poly;
  folds: Poly[];
  sleeves: { outline: Poly; endRim: Poly; folds: Poly[]; upperAxis: [Pt, Pt]; foreAxis: [Pt, Pt] }[];
  axis: [Pt, Pt];
};

export type FrontPlan = {
  seated: boolean;
  head: FrontHead;
  /** The shirt's body (closed: the neckline at the top). */
  shirt: Poly;
  collar: Poly[];
  collarKind: 'crew' | 'shirt';
  placket: Poly | null;
  buttons: Pt[];
  tucked: boolean;
  belt: Poly | null;
  buckle: Poly | null;
  blouse: Poly | null;
  shirtFolds: Poly[];
  /** The trousers' seat block (closed) — with the legs, one garment. */
  seat: Poly;
  legs: FrontLeg[];
  /** The soft shade where the legs part below the crotch (closed). */
  legGap: Poly | null;
  /** (FrontBoom3, optional) the fly's stitched seam (open), standing. */
  flySeam?: Poly | null;
  shoes: FrontShoe[];
  arms: FrontArm[];
  jacket: FrontJacket | null;
  /** The torso's axis (hips' midpoint → the neck's base). */
  axis: [Pt, Pt];
  /** The shoulders' line and the belt's height (the tests read them). */
  shoulderW: number;
  hipV: number;
  nbV: number;
};

export type FrontOpts = {
  /** Where the middle of the mouth must be drawn (a talker's lip point): the head is placed on it. */
  lip?: Pt;
  jacket?: boolean;
  /** The person's hair and face, build and dress (cast.ts). */
  head?: HeadStyle;
  body?: BodyBuild;
  woman?: boolean;
  /** (FrontBoom4, owner 2026-11-24: "pants are extra wide on front view") both arms raised (the boom operator):
   *  nothing hangs beside the hips, so the trousers' top follows the belt and the hips — the waistband under the
   *  belt, the hips' natural curve, the thighs tapering to the knee — never the wide hidden tops the hanging arms
   *  of the standing figure cover. Off (the default): the approved standing figure, unchanged. */
  armsUp?: boolean;
};

/* ── helpers ── */

type XY = readonly (readonly [number, number])[];
/** A right half (x ≥ 0, from the top of the middle line round to its bottom) closed into the whole shape. */
function sym(right: XY): XY {
  const out: [number, number][] = right.map(([x, y]) => [x, y]);
  for (let i = right.length - 2; i >= 1; i--) out.push([-right[i][0], right[i][1]]);
  return out;
}
const mirrorX = (xs: XY): XY => xs.map(([x, y]) => [-x, y] as const);
/** A slightly irregular edge (deterministic): midpoints nudged in and out. */
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

/* ── the head, face-on (authored with y DOWN, x to the viewer's right, round the head's centre) ── */

const SKULL_R: XY = [
  [0, -122], [24, -120], [44, -114], [58, -104], [68, -90], [73, -74], [75.5, -58], [75.5, -42], [74.5, -27], [72.5, -13], // the cranium to the temple
  [71.5, 0], [70.5, 11], // the cheekbone
  [67.6, 25], [63.6, 39], [58.6, 52], [53, 62], // the cheek to the jaw's angle
  [45, 74], [35.5, 85], [24, 94], [12.5, 100.5], [0, 103], // the jaw to the chin
];
/** The jaw's line (open), from the angle to the chin, both sides. */
const JAW_R: XY = [[55, 58], [47, 72], [36.5, 84.5], [24.5, 94], [12.5, 100.5], [0, 103]];
// (the ear from the front: about 10-12 mm beyond the head's side, mostly its upper rim, lying back along the
// skull - the top a little farther out than the lobe; its root hidden by the cheek, its top by the hair's edge)
const EAR_R: XY = [[70, -27], [75.6, -28], [80.6, -24], [83, -15], [82.6, -2], [80.8, 10], [78.4, 21], [75, 29.6], [71.6, 33.4], [69, 30]];
const EAR_FOLD_R: XY = [[76.6, -21], [79.4, -12], [79.2, 1], [77.4, 13], [74.6, 22]];
// the eye (the viewer's right eye: x > 0), open and level
const EYE_R: XY = [[16.8, -7.4], [21.5, -11.2], [28.5, -13.5], [35.5, -13.4], [41.6, -11.4], [46, -8.4], [46.6, -7.6], [42.6, -5.4], [35.8, -4.2], [28.4, -4.4], [21.6, -5.6]];
// the upper lid's dark edge (a lash line, a sliver)
const LID_OPEN_R: XY = [[16.6, -7.6], [21.4, -11.6], [28.4, -14], [35.6, -13.9], [41.8, -11.8], [46.6, -7.8], [45.2, -8.2], [41.2, -10.4], [35.4, -12.2], [28.6, -12.3], [21.8, -10.2], [17.4, -7.2]];
// (a woman's lash line: a little heavier, sweeping out past the eye's outer corner in a short soft flick)
const LID_LASH_R: XY = [[16.6, -7.6], [21.4, -11.9], [28.4, -14.4], [35.6, -14.3], [41.8, -12.4], [46.6, -9.2], [50.2, -11.4], [48.2, -9.4], [45.4, -7.4], [41.2, -9.6], [35.4, -11.3], [28.6, -11.4], [21.8, -9.4], [17.4, -6.9]];
// (the drummer's lowered lid: over the upper half of the eye, looking down)
const LID_DOWN_R: XY = [[16.6, -7.6], [21.4, -11.6], [28.4, -14], [35.6, -13.9], [41.8, -11.8], [46.6, -7.8], [45, -7.2], [40.6, -8.2], [34.6, -8.8], [28.6, -8.6], [22.2, -7.6], [17.4, -6.8]];
const CREASE_R: XY = [[18.6, -13.4], [25, -17], [33, -18.4], [40.6, -17.2], [46.4, -13]];
const BROW_R: XY = [[12, -24.6], [19, -28.4], [29, -30.6], [39.6, -30.2], [47.4, -27.6], [52.4, -23.4], [50.6, -22.8], [45, -25.2], [38.8, -26.6], [29.2, -27], [20, -25.2], [13.2, -22.2]];
const BROW_FINE_R: XY = [[13.6, -25.2], [21, -29.6], [31, -31.6], [40.8, -30.8], [48.2, -27.6], [52.4, -23.6], [50.8, -23.2], [46, -25.8], [39.8, -27.8], [30.8, -28.4], [21.4, -26.8], [14.6, -23.4]];
/** The middle of the mouth (local y): a talker's lip point lands here. */
const MOUTH_Y = 61;
const UPPER_LIP: XY = [[-24.4, 60.6], [-17, 58], [-9.6, 55.2], [-4.2, 54], [0, 55.6], [4.2, 54], [9.6, 55.2], [17, 58], [24.4, 60.6], [12, 61], [0, 61.6], [-12, 61]];
const LOWER_LIP: XY = [[-24.4, 60.6], [-12, 61], [0, 61.6], [12, 61], [24.4, 60.6], [19.6, 63.8], [10.4, 67.8], [0, 69.2], [-10.4, 67.8], [-19.6, 63.8]];
const MOUTH: XY = [[-24.4, 60.6], [-12, 61.2], [0, 61.8], [12, 61.2], [24.4, 60.6]];
// the shadow side of the nose: from the root beside the bridge down to the wing (the viewer's right)
const NOSE_SHADE: XY = [[4.4, -16], [8.6, -6], [11, 8], [13.4, 22], [15.2, 31], [12, 36], [7, 30], [5.6, 16], [4.2, 0], [3, -12]];
// the face's shadow side (the viewer's right half), soft
const SHADE_SIDE_R: XY = [[30, -120], [76, -60], [78, 10], [60, 60], [30, 98], [12, 104], [20, 60], [44, 10], [46, -40], [22, -100]];

/** The hair face-on, by style (closed; x to the viewer's right). */
/**
 * (FrontBoom3, review 2026-11-24: "Ana: a short cap of hair, reads as a man"; "Mei: helmet hair, no bun visible")
 * The gathered hair BEHIND the head, where it shows past the head's and the neck's outline (drawn behind the head,
 * the neck and the shirt): Ana's low ponytail falling a little to her left, its edge beside the neck onto the
 * shoulder; the edge of Mei's bun beside the back of her head above the ear. Local units as the hair's.
 */
function hairBehind(style: HairStyle): XY[] {
  if (style === 'pony')
    return [[[34, 40], [52, 36], [70, 48], [80, 74], [84, 110], [86, 150], [84, 186], [76, 206], [64, 210], [56, 196], [54, 160], [50, 120], [42, 84], [34, 60]]];
  if (style === 'bun') return [[[40, -70], [64, -80], [88, -76], [102, -60], [107, -38], [103, -16], [92, -4], [74, 0], [54, -6], [42, -24], [36, -48]]];
  return [];
}

function hairShape(style: HairStyle): { hair: XY; clumps: [readonly [number, number], readonly [number, number], number, number][]; part: XY | null; earShows: boolean } {
  if (style === 'bob') {
    // a chin-length bob, parted on the person's right (the viewer's left), the front swept across the
    // forehead to the other temple; straight past the ears (covered) to the jaw, the ends turned under
    const hair: XY = [
      [-30, -128], [-6, -140], [26, -139], [54, -130], [76, -112], [89, -88], [94, -58], [95, -24], [94, 12], [92, 46], [88, 74], [82, 92], [74, 99], [66, 97], [62, 88],
      [63, 62], [65.6, 34], [67.4, 6], [68, -20], [66, -42], [60, -58], [50, -66], [36, -70], [20, -74], [6, -80], [-8, -88], [-20, -96],
      [-26, -98], [-34, -90], [-46, -80], [-57, -66], [-64, -46], [-67, -20], [-67.6, 8], [-66, 36], [-63.6, 62], [-62.4, 88], [-66, 97], [-74, 99], [-82, 92], [-88, 74], [-92, 46], [-94, 12], [-95, -24], [-93, -58], [-86, -90], [-70, -114], [-52, -126],
    ];
    return {
      hair,
      clumps: [
        [[-26, -126], [58, -66], 18, 4],
        [[-20, -124], [26, -78], 12, 2],
        [[-30, -122], [-62, -60], 14, -3],
        [[-70, -96], [-80, 90], 16, -3],
        [[62, -96], [80, 90], 16, 3],
        [[-84, -20], [-78, 92], 6, -1],
        [[84, -20], [78, 92], 6, 1],
      ],
      part: [[-28, -132], [-26, -110], [-24, -98]],
      earShows: false,
    };
  }
  if (style === 'pony') {
    // (Ana) pulled back to a low ponytail: a fuller, rounder mass over the crown, the hair a little full at the
    // temples where it is drawn back over the top of the ears, a LOW, soft, rounded hairline with no parting;
    // the tail hangs behind the nape — hidden from the front
    // (2026-11-24: more of the gathered hair's mass above and beside the skull — pulled back, it still stands
    // proud of the head and sweeps down over the tops of the ears)
    // (the crown a full dome, never a flat-topped cut; the strands drawn sweeping BACK from the hairline toward
    // the crown, where the hair is gathered — not out from the parting like a short cut)
    const R: XY = [[0, -147], [31, -144], [57, -134], [76, -116], [88, -93], [93, -66], [92.6, -42], [88.4, -21], [80, -8],
      [72.6, -16], [71, -34], [67.4, -52], [60, -64], [48, -73], [34, -78.6], [18, -81.2], [0, -82]];
    return {
      hair: sym(R),
      clumps: [
        [[-48, -75], [-12, -140], 11, -2],
        [[48, -75], [12, -140], 11, 2],
        [[-72, -48], [-40, -132], 10, -3],
        [[72, -48], [40, -132], 10, 3],
        [[-20, -82], [-4, -142], 8, -1],
        [[20, -82], [4, -142], 8, 1],
      ],
      part: null,
      earShows: true,
    };
  }
  if (style === 'bun') {
    // (Mei) pulled back SLEEK to a low bun: the hair close over the skull, a HIGHER hairline with a little
    // widow's dip at the centre and a centre parting; the knot sits behind the head at the top of the ears —
    // hidden from the front
    // (FrontBoom3: "a smooth helmet" — the hair stands a little off the skull, fuller over the crown and at the
    // temples where it is drawn back over the tops of the ears, its strands sweeping back toward the bun)
    const R: XY = [[0, -134], [30, -131], [54, -121], [71, -104], [81, -82], [85, -58], [85, -36], [82, -20], [76.4, -14],
      [71.6, -22], [70.6, -40], [66, -58], [57, -72], [44, -82], [30, -87], [15, -89.6], [5, -88.4], [0, -85.4]];
    return {
      hair: sym(R),
      clumps: [
        [[-6, -88], [-58, -122], 10, -2],
        [[6, -88], [58, -122], 10, 2],
        [[-26, -86], [-72, -96], 8, -2],
        [[26, -86], [72, -96], 8, 2],
        [[-44, -80], [-82, -36], 8, -2],
        [[44, -80], [82, -36], 8, 2],
      ],
      part: [[0, -128], [0, -108], [0, -88]],
      earShows: true,
    };
  }
  if (style === 'crop') {
    const R: XY = [[0, -127], [30, -124], [52, -116], [67, -101], [76, -82], [79.6, -60], [80, -38], [78.6, -18], [76.6, -2], [75.4, 6], [72, 8],
      [71, -4], [71.4, -20], [70.6, -40], [64, -58], [52, -70], [36, -76], [18, -78], [0, -79]];
    return { hair: sym(R), clumps: [[[-40, -118], [-74, -50], 6, -1], [[40, -118], [74, -50], 6, 1], [[-12, -124], [-30, -84], 6, 1], [[12, -124], [30, -84], 6, -1]], part: null, earShows: true };
  }
  // 'short' (the drummer's): fuller over the crown, a temple recession, a sideburn to the middle of the ear
  const R: XY = [[0, -136], [32, -133], [56, -123], [72, -107], [81, -87], [85, -64], [85, -42], [82.6, -22], [78.6, -4], [76.6, 8], [72.4, 11],
    [70.6, 0], [71, -16], [70.2, -34], [64, -52], [54, -64], [44, -72], [30, -77], [14, -78.6], [0, -79]];
  return {
    hair: sym(R),
    clumps: [
      [[-6, -134], [-58, -88], 16, -3],
      [[6, -134], [56, -90], 16, 3],
      [[-30, -128], [-80, -50], 14, -3],
      [[30, -128], [80, -50], 14, 3],
      [[-10, -120], [-22, -84], 12, 2],
      [[12, -118], [26, -84], 12, -2],
    ],
    part: null,
    earShows: true,
  };
}

/**
 * EACH PERSON'S FACE FROM THE FRONT, read from their approved profile and build (sidePlan's hair sets and
 * face styles, cast.ts): the face's width at the cranium, the cheekbones, the jaw's angle and the chin; the
 * neck; the brows' weight, height and arch; the eyes' size and spacing; the nose's width; the lips' fullness
 * and the mouth's width - all within natural limits (an eye about a fifth of the face's width, the nose's
 * base about one eye, the mouth about one and a half). Keyed by the person's hair (one style per person).
 */
/**
 * (FrontBoom3, review 2026-11-24: "identical faces … one face template, only color differs"; "a mannequin face with
 * small features on a long blank face"; "long thin neck") each person now also has their own JAW SHAPE (`sq`: 0 a
 * tapering oval to 1 a square jaw with a broad chin), their own EYE (`eyeH` its opening, `lid` how much upper lid
 * shows, `tilt` its outer corner up or down), the lower face's length (`low`), the nose's length and tip (`noseL`,
 * `tip`); the features a little larger on every face, and every neck of a natural width.
 */
type FaceFront = { cran: number; cheek: number; jaw: number; chin: number; neck: number; brow: number; browArch: number; browY: number; eyeW: number; eyeGap: number; nose: number; mouth: number; lip: number; sq: number; eyeH: number; lid: number; tilt: number; low: number; noseL: number; tip: number };
const FACES: Record<HairStyle, FaceFront> = {
  // the drummer: a man's long rectangular face, a square jaw and a broad chin, straight heavy brows, the
  // lowered lids, a long straight nose, a full neck
  short: { cran: 1, cheek: 1, jaw: 1.08, chin: 1.25, neck: 58, brow: 1.3, browArch: -1, browY: 1, eyeW: 1.04, eyeGap: 31.6, nose: 1.02, mouth: 1.02, lip: 0.92, sq: 0.85, eyeH: 0.9, lid: 1, tilt: 0, low: 1.04, noseL: 1.06, tip: 0.95 },
  // Kofi: the broadest face and the squarest jaw, a heavy straight brow, wide-set eyes, a broad rounded nose,
  // full lips, the widest neck
  crop: { cran: 1.04, cheek: 1.07, jaw: 1.14, chin: 1.2, neck: 64, brow: 1.45, browArch: -1.5, browY: 1.5, eyeW: 1.06, eyeGap: 33.4, nose: 1.3, mouth: 1.1, lip: 1.4, sq: 1, eyeH: 1, lid: 0.9, tilt: -0.5, low: 1, noseL: 0.96, tip: 1.3 },
  // Ruth: a narrow oval face, a narrow pointed chin, fine high-arched brows, round open eyes, a fine
  // straight nose with a small tip
  bob: { cran: 0.97, cheek: 0.96, jaw: 0.88, chin: 0.78, neck: 49, brow: 0.8, browArch: 2.6, browY: -1.5, eyeW: 1.1, eyeGap: 31, nose: 0.84, mouth: 0.98, lip: 1.12, sq: 0.1, eyeH: 1.2, lid: 0.6, tilt: 0.3, low: 1.02, noseL: 1.02, tip: 0.8 },
  // Ana: a broad, ROUND face (full cheeks, a short rounded chin), large almond eyes tilted up at the outer
  // corner, gently arched brows, a soft broad nose, full lips
  pony: { cran: 1.03, cheek: 1.06, jaw: 0.96, chin: 0.9, neck: 48, brow: 1.0, browArch: 1.6, browY: -0.5, eyeW: 1.16, eyeGap: 32.4, nose: 1.0, mouth: 1.04, lip: 1.45, sq: 0.25, eyeH: 1.1, lid: 0.7, tilt: 1.4, low: 0.93, noseL: 0.92, tip: 1.1 },
  // Mei: a heart-shaped face — the cheekbones its widest part, a small neat chin — fine arched brows set high,
  // narrower eyes with less lid showing, a small nose
  bun: { cran: 0.96, cheek: 1.02, jaw: 0.88, chin: 0.8, neck: 47, brow: 0.78, browArch: 1.8, browY: -2.5, eyeW: 1.06, eyeGap: 31.6, nose: 0.88, mouth: 0.96, lip: 1.15, sq: 0.15, eyeH: 0.78, lid: 0.35, tilt: 0.9, low: 0.95, noseL: 0.9, tip: 0.9 },
};
/** The jaw's square variant (blended in by `sq`): a broader angle and a flatter, broader chin. */
const SKULL_SQ: XY = [
  [0, -122], [24, -120], [44, -114], [58, -104], [68, -90], [73, -74], [75.5, -58], [75.5, -42], [74.5, -27], [72.5, -13],
  [71.5, 0], [70.5, 11],
  [68.6, 25], [66.6, 39], [63.6, 52], [60, 64],
  [54, 78], [45, 89], [34, 97], [19, 102], [0, 103.5],
];
const JAW_SQ: XY = [[59, 62], [54, 77], [45, 89], [34, 97], [19, 102], [0, 103.5]];
const blendXY = (a: XY, b: XY, t: number): XY => a.map(([x, y], i) => [x + (b[i][0] - x) * t, y + (b[i][1] - y) * t] as const);

function headFront(c0: Pt, r: number, style: HeadStyle, woman: boolean, lip?: Pt): FrontHead {
  const k = r / 110;
  const f = FACES[style.hair] ?? FACES.short;
  // (the lower face's own length: everything below the eyes' line scaled by `low` — the lip point stays the mouth)
  const ly = (y: number) => (y > 0 ? y * f.low : y);
  const c = lip ? P(lip.u, lip.v - ly(MOUTH_Y) * k) : c0;
  const F = (x: number, y: number) => P(c.u + x * k, c.v + ly(y) * k);
  const M = (xs: XY): Poly => xs.map(([x, y]) => F(x, y));
  const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: F(x, y), rx: rx * k, ry: ry * k, rot });
  // the face's width down its length: the cranium, the cheekbones, the jaw's angle, the chin
  const tab: [number, number][] = [[-130, f.cran], [-34, f.cran], [8, f.cheek], [58, f.jaw], [92, f.chin], [110, f.chin]];
  const wAt = (y: number) => {
    if (y <= tab[0][0]) return tab[0][1];
    for (let i = 1; i < tab.length; i++) if (y <= tab[i][0]) return tab[i - 1][1] + ((tab[i][1] - tab[i - 1][1]) * (y - tab[i - 1][0])) / (tab[i][0] - tab[i - 1][0]);
    return tab[tab.length - 1][1];
  };
  const shape = (xs: XY): XY => xs.map(([x, y]) => [x * wAt(y), y] as const);
  const skull = M(shape(sym(blendXY(SKULL_R, SKULL_SQ, f.sq))));
  const hs = hairShape(style.hair);
  const nw = f.neck;
  // the eyes: each scaled round its own centre, the pair spaced as the person's
  // (each person's own eye: its opening `eyeH`, the outer corner tilted up by `tilt` mm)
  const eyeAt = (xs: XY, side: 1 | -1): XY => xs.map(([x, y]) => [side * (f.eyeGap + (x - 31.6) * f.eyeW), -8.6 + (y + 8.6) * f.eyeW * f.eyeH - f.tilt * ((x - 31.6) / 15)] as const);
  // (the lid's crease: how much upper lid shows above the lashes)
  const creaseAt = (xs: XY, side: 1 | -1): XY => eyeAt(xs.map(([x, y]) => [x, -12 + (y + 12) * (0.4 + 0.6 * f.lid)] as const), side);
  const lidXY = style.face === 'drummer' ? LID_DOWN_R : woman ? LID_LASH_R : LID_OPEN_R;
  const irisY = style.face === 'drummer' ? -7.2 : -8.6;
  // the brows: their weight (thickness round their middle line), their arch and height
  const browOf = (side: 1 | -1): XY => {
    const B = style.face === 'fine' ? BROW_FINE_R : BROW_R;
    return B.map(([x, y], i) => {
      const j = B.length - 1 - i;
      const cy = (B[i][1] + B[j][1]) / 2;
      const arch = -f.browArch * Math.sin(Math.PI * Math.max(0, Math.min(1, (x - 12) / 41)));
      return [side * (f.eyeGap + (x - 31.6) * f.eyeW), cy + (y - cy) * f.brow + arch + f.browY] as const;
    });
  };
  const nose = (xs: XY): XY => xs.map(([x, y]) => [x * f.nose, y > 0 ? y * f.noseL : y] as const);
  const ny = (y: number) => (y > 0 ? y * f.noseL : y);
  const lipY = (xs: XY, upper: boolean): XY =>
    xs.map(([x, y]) => {
      const x2 = x * f.mouth;
      if (upper && y < 60.6) return [x2, 60.6 - (60.6 - y) * f.lip] as const;
      if (!upper && y > 61.7) return [x2, 61.7 + (y - 61.7) * f.lip] as const;
      return [x2, y] as const;
    });
  // (FrontBoom3: "big flat ears" — the ear lies back: only about 7 mm of its rim beyond the head's side)
  const ear = (xs: XY): XY => xs.map(([x, y]) => [(70 + (x - 70) * 0.72) * wAt(y), y] as const);
  const JAW = blendXY(JAW_R, JAW_SQ, f.sq);
  const jawLine = shape([...mirrorX(JAW)].reverse().concat(JAW.slice(1)));
  return {
    skull,
    ears: hs.earShows ? [M(mirrorX(ear(EAR_R))), M(ear(EAR_R))] : [],
    earFolds: hs.earShows ? [M(mirrorX(ear(EAR_FOLD_R))), M(ear(EAR_FOLD_R))] : [],
    earsAt: [F(-78 * wAt(2), 2), F(78 * wAt(2), 2)],
    hair: jag(M(hs.hair.map(([x, y]) => [x * (y > -34 ? wAt(Math.min(y, 20)) : f.cran), y] as const)), 1.1 * k),
    hairBack: hairBehind(style.hair).map((xs) => jag(M(xs.map(([x, y]) => [x * f.cran, y] as const)), 0.8 * k)),
    clumps: hs.clumps.map(([a, b, w, bow]) => lens(F(a[0] * f.cran, a[1]), F(b[0] * f.cran, b[1]), w * k, bow * k)),
    part: hs.part ? M(hs.part) : null,
    sheen: [F(-62 * f.cran, -96), F(-46 * f.cran, -114), F(-24, -124), F(0, -127)],
    neck: [F(-nw, 40), F(nw, 40), F(nw + 0.5, 90), F(nw + 2, 140), F(nw + 9, 176), F(nw + 12, 214), F(-nw - 12, 214), F(-nw - 9, 176), F(-nw - 2, 140), F(-nw - 0.5, 90)],
    jawShadow: M(shape([[-54, 62], [-36, 86], [-14, 101], [0, 104], [14, 101], [36, 86], [54, 62], [50, 84], [34, 106], [14, 120], [0, 123], [-14, 120], [-34, 106], [-50, 84]])),
    jaw: M(jawLine),
    scm: [
      [F(-nw + 6, 74), F(-nw + 14, 112), F(-22, 150), F(-10, 168)],
      [F(nw - 6, 74), F(nw - 14, 112), F(22, 150), F(10, 168)],
    ],
    brows: [M(browOf(-1)), M(browOf(1))],
    eyes: [M(eyeAt(EYE_R, -1)), M(eyeAt(EYE_R, 1))],
    irises: [E(-f.eyeGap, irisY, 5.8 * f.eyeW, 5.8 * f.eyeW), E(f.eyeGap, irisY, 5.8 * f.eyeW, 5.8 * f.eyeW)],
    lids: [M(eyeAt(lidXY, -1)), M(eyeAt(lidXY, 1))],
    lidCreases: [M(creaseAt(CREASE_R, -1)), M(creaseAt(CREASE_R, 1))],
    sockets: [E(-f.eyeGap + 1, -13, 21, 12), E(f.eyeGap - 1, -13, 21, 12)],
    noseShade: M(nose(NOSE_SHADE)),
    noseBridge: E(-2.4, 4, 3.4, 20),
    noseTip: E(-1.6, ny(31), 8.6 * f.nose * f.tip, 7 * f.tip),
    alae: [E(-14 * f.nose, ny(37.4), 6.6 * f.nose * f.tip, 5.6, -0.3), E(14 * f.nose, ny(37.4), 6.6 * f.nose * f.tip, 5.6, 0.3)],
    nostrils: [E(-7.6 * f.nose, ny(42.2), 3.8 * f.nose, 2, 0.25), E(7.6 * f.nose, ny(42.2), 3.8 * f.nose, 2, -0.25)],
    underNose: E(0, ny(46), 15 * f.nose, 3.6),
    nasolabial: [
      [F(-17 * f.nose, ny(42)), F(-22 * f.mouth, 50), F(-26.6 * f.mouth, 59)],
      [F(17 * f.nose, ny(42)), F(22 * f.mouth, 50), F(26.6 * f.mouth, 59)],
    ],
    upperLip: M(lipY(woman ? UPPER_LIP.map(([x, y]) => [x, y < 58 ? y - 1.6 : y] as const) : UPPER_LIP, true)),
    lowerLip: M(lipY(woman ? LOWER_LIP.map(([x, y]) => [x, y > 62 ? y + 2.2 : y] as const) : LOWER_LIP, false)),
    mouth: M(lipY(MOUTH, true)),
    underLip: E(0, 72 + 1.6 * f.lip, 12 * f.mouth, 3.4),
    chinLight: E(-3, 92, 12 * f.chin, 6),
    lights: [E(-24, -74, 24, 15, 0.2), E(-46 * f.cheek, 6, 15, 8, 0.25), E(-f.eyeGap, -29, 12, 3, 0)],
    forms: {
      // the planes that make a face: the brow ridge's shadow over each socket, the temples turning away, the
      // hollow under each cheekbone, the sides of the face turning from the light, the philtrum's sides
      dark: [
        E(-f.eyeGap, -17, 18, 5.5), E(f.eyeGap, -17, 18, 5.5),
        E(-64 * f.cran, -46, 10, 22), E(64 * f.cran, -46, 10, 22),
        E(-50 * f.cheek, 30, 9, 15, 0.2), E(50 * f.cheek, 30, 9, 15, -0.2),
        E(-62 * f.cheek, 10, 7, 26), E(62 * f.cheek, 10, 7, 26),
        E(-10, 50, 4, 6), E(10, 50, 4, 6),
      ],
      light: [E(-52 * f.cheek, 10, 12, 6, 0.3), E(0, -46, 16, 10), E(-1, 16, 3.6, 14)],
    },
    shadeSide: M(shape(SHADE_SIDE_R)),
    c,
    r,
    earShows: hs.earShows,
    eyeL: F(-f.eyeGap, -8.6),
    eyeR: F(f.eyeGap, -8.6),
    mouthC: F(0, MOUTH_Y),
    chin: F(0, 103),
    crown: F(0, -122),
  };
}

/* ── the body ── */

const DEFAULT_BUILD: BodyBuild = { chest: 1, back: 1, waist: 1, hip: 1, shoulder: 1, limb: 1, tucked: true, collar: 'crew' };

const planCache = new WeakMap<PlayerPose, Map<string, FrontPlan>>();

/** The front-view plan for a pose and a person (memoised per pose and options). */
export function frontPlan(pose: PlayerPose, o: FrontOpts = {}): FrontPlan {
  let m = planCache.get(pose);
  if (!m) {
    m = new Map();
    planCache.set(pose, m);
  }
  const key = JSON.stringify(o);
  const hit = m.get(key);
  if (hit) return hit;
  const plan = build(pose, o);
  m.set(key, plan);
  return plan;
}

function build(pose: PlayerPose, o: FrontOpts): FrontPlan {
  const seated = pose.posture !== 'standing';
  const B0 = o.body ?? DEFAULT_BUILD;
  // (a seated person: the shirt tucked, as the side view draws it)
  const B: BodyBuild = seated && !B0.tucked ? { ...B0, tucked: true } : B0;
  const woman = !!o.woman;
  const head = headFront(pose.head.c, pose.head.r, o.head ?? { hair: 'short', face: 'drummer' }, woman, o.lip);
  const k = pose.head.r / 110;
  const cx = (pose.shoulderR.u + pose.shoulderL.u) / 2;
  // THE NECK'S BASE: about 60 mm of neck shows below the jaw in front (an adult in a shirt)
  const nbV = head.c.v + (103 + 58) * k;
  const hipMid = lerp(pose.hipR, pose.hipL, 0.5);
  const D = hipMid.v - nbV;
  const at = (x: number, y: number) => P(cx + x, nbV + y);
  // (FrontBoom3: "a long thin neck" — every neck of a natural width, the neckline round it)
  const nw = (woman ? 49 : 57) * k;
  const nwc = nw + 4;
  // (2026-11-24, coordinator: "Ana reads as a young man" — a man and a woman told apart by their build from
  // the front as well as by the face: her shoulders narrower and her waist in, her hips the widest; his
  // shoulders broader, his chest the widest, little waist and narrow hips — never one rectangular slab)
  const shx = (Math.abs(pose.shoulderL.u - pose.shoulderR.u) / 2) * (0.6 + 0.4 * B.shoulder) * (woman ? 0.9 : 1.03);
  const c = B.chest;
  const w = B.waist;
  const h = B.hip;
  // the torso's half-width down its length (y below the neck's base)
  const halfAt = (y: number): number => {
    // (untucked, the shirt hangs nearly straight from the chest to its hem — it does not follow the waist
    // in, nor flare like a skirt — a little outside the hips: the side view's rule; a woman's shirt is cut
    // in at the waist, so even loose it follows her waist a little)
    const loose = !B.tucked;
    const tab: [number, number][] = woman
      ? [
          [70, shx - 14],
          [140, 148 * c],
          [210, 146 * c],
          [290, loose ? 140 * (c + w) / 2 : 134 * (c + w) / 2],
          [D * 0.62, loose ? 134 * w : 124 * w],
          [D - 78, loose ? 150 * (w + h) / 2 : 146 * (w + h) / 2],
          [D - 30, loose ? 168 * h : 166 * h],
          [D + 40, loose ? 174 * h : 172 * h],
          [D + 90, loose ? 175 * h : 173 * h],
        ]
      : [
          [70, shx - 12],
          [140, 160 * c],
          [210, 162 * c],
          [290, loose ? 158 * (c + w) / 2 : 154 * (c + w) / 2],
          [D * 0.62, loose ? 154 * w : 146 * w],
          [D - 78, loose ? 156 * (w + h) / 2 : 150 * (w + h) / 2],
          [D - 30, loose ? 160 * h : 156 * h],
          [D + 40, loose ? 163 * h : 160 * h],
          [D + 90, loose ? 164 * h : 161 * h],
        ];
    if (y <= tab[0][0]) return tab[0][1];
    for (let i = 1; i < tab.length; i++)
      if (y <= tab[i][0]) {
        const t = (y - tab[i - 1][0]) / (tab[i][0] - tab[i - 1][0]);
        return tab[i - 1][1] + (tab[i][1] - tab[i - 1][1]) * t;
      }
    return tab[tab.length - 1][1];
  };

  /* the collar and the neckline */
  const crew = B.collar === 'crew';
  // the neckline (the shirt's top edge, the person's right to left): a crew neck a soft U, a shirt's
  // open collar a short V (the top button undone)
  const neckline: Poly = crew
    ? [at(-nwc + 1, -12), at(-nwc * 0.7, -1), at(-nwc * 0.36, 7), at(0, 9.6), at(nwc * 0.36, 7), at(nwc * 0.7, -1), at(nwc - 1, -12)]
    : [at(-nwc + 2, -16), at(-nwc * 0.5, 2), at(-12, 20), at(0, 34), at(12, 20), at(nwc * 0.5, 2), at(nwc - 2, -16)];
  const collar: Poly[] = crew
    ? [[at(-nwc - 13, -16), at(-nwc * 0.74, 7), at(-nwc * 0.38, 20), at(0, 25), at(nwc * 0.38, 20), at(nwc * 0.74, 7), at(nwc + 13, -16), at(nwc - 1, -13), at(nwc * 0.7, -1), at(nwc * 0.36, 7), at(0, 9.6), at(-nwc * 0.36, 7), at(-nwc * 0.7, -1), at(-nwc + 1, -13)]]
    : [-1, 1].map((s) => {
        // a collar leaf lying on the shoulder and chest: its stand round the neck, its point toward the chest
        const S = (x: number, y: number) => at(s * x, y);
        return [S(nwc - 3, -26), S(nwc + 16, -18), S(nwc + 30, -4), S(nwc + 30, 10), S(46, 44), S(40, 48), S(14, 26), S(5, 16), S(nwc * 0.5, 1), S(nwc - 1, -16)];
      });
  const placket: Poly | null = crew ? null : [at(0, 34), at(0, D * 0.5), at(0, B.tucked ? D - 80 : D + 78)];
  const buttons: Pt[] = crew ? [] : [70, 160, 250, 340, 430].filter((y) => y < (B.tucked ? D - 90 : D + 60)).map((y) => at(0, y));

  /* the shirt's body */
  const bottom = B.tucked ? D - 50 : D + 80;
  const sideYs = [140, 210, 290, D * 0.62, D - 78, ...(B.tucked ? [bottom] : [D - 30, D + 40, D + 76])];
  const right: Poly = [
    at(nwc - 1, -12), // the neckline's end at the neck
    // (FrontBoom3: "sloping coat-hanger shoulders" — the trapezius a short gentle slope off the neck, then the
    // shoulder's level top out to its round corner)
    at(nwc + 20, -6), at(nwc + 46, 2), at((nwc + shx) / 2 + 22, 14), at(shx - 18, 27), // the trapezius
    at(shx, 46), at(shx + 4, 64), // under the sleeve's root
    ...sideYs.map((y) => at(halfAt(y), y)),
  ];
  // (the hem's corner only softly rounded: a cut corner left a dark notch where the hem meets the trousers)
  const hemR: Poly = B.tucked ? [] : [at(halfAt(D + 76) - 5, D + 83), at(halfAt(D + 76) * 0.5, D + 85)];
  const shirtR = [...right, ...hemR];
  const shirt: Poly = [...neckline.slice(Math.floor(neckline.length / 2)), ...shirtR.slice(1), ...(B.tucked ? [at(0, bottom)] : [at(0, D + 85)]), ...[...shirtR.slice(1)].reverse().map((q) => P(2 * cx - q.u, q.v)), ...neckline.slice(0, Math.floor(neckline.length / 2))];
  const beltTop = D - 80;
  const beltBot = D - 46;
  const bw = (y: number) => halfAt(y) + 2;
  const belt: Poly | null = B.tucked ? [at(-bw(beltTop), beltTop + 3), at(-bw(beltTop) * 0.5, beltTop + 6), at(0, beltTop + 7), at(bw(beltTop) * 0.5, beltTop + 6), at(bw(beltTop), beltTop + 3), at(bw(beltBot), beltBot + 3), at(bw(beltBot) * 0.5, beltBot + 6), at(0, beltBot + 7), at(-bw(beltBot) * 0.5, beltBot + 6), at(-bw(beltBot), beltBot + 3)] : null;
  const buckle: Poly | null = B.tucked ? [at(-19, beltTop + 4), at(19, beltTop + 4), at(19, beltBot + 9), at(-19, beltBot + 9)] : null;
  const bl = (y: number) => halfAt(y) + 1;
  const blouse: Poly | null = B.tucked
    ? [at(-bl(beltTop - 24), beltTop - 24), at(0, beltTop - 20), at(bl(beltTop - 24), beltTop - 24), at(bl(beltTop) + 1, beltTop + 7), at(bl(beltTop) * 0.6, beltTop + 10), at(bl(beltTop) * 0.2, beltTop + 8.5), at(-bl(beltTop) * 0.2, beltTop + 10), at(-bl(beltTop) * 0.6, beltTop + 8.5), at(-bl(beltTop) - 1, beltTop + 7)]
    : null;
  const shirtFolds: Poly[] = [
    lens(at(-halfAt(D * 0.62) + 10, D * 0.6), at(-60, D * 0.78), 6, -3),
    lens(at(halfAt(D * 0.62) - 10, D * 0.6), at(64, D * 0.8), 6, 3),
    ...(B.tucked ? [lens(at(-90, beltTop - 30), at(-30, beltTop - 14), 5, 2), lens(at(40, beltTop - 14), at(100, beltTop - 30), 5, -2)] : [lens(at(-120, D + 20), at(-110, D + 78), 5, -2), lens(at(116, D + 18), at(104, D + 78), 5, 2)]),
  ];

  /* the trousers */
  const floor = pose.floor ?? pose.footR.v;
  const hipX = (Math.abs(pose.hipL.u - pose.hipR.u) / 2) * (1 + (h - 1) * 0.5) * (woman ? 1 : 0.95);
  // (the seat as wide as the shirt's own hips over it — a man's narrower, a woman's the widest part of her)
  const sh = (woman ? 1 : 0.93) * h;
  // (armsUp) the trousers' top as the hips are: the waistband just under the belt, the hips' curve widest at the
  // hip joint, each leg's top inside it (its axis moved in so the leg still reaches the middle line at the crotch)
  const up = !!o.armsUp && !seated;
  const hipXd = up ? Math.min(hipX, (156 * sh - 8) / 2) : hipX;
  const seatUp: Poly | null = up
    ? (() => {
        // (the hips' curve widest a little below the belt; below it the seat's side lies on the thigh's own edge, so
        // the seat's lower corner never stands out beside the leg)
        const r: Pt[] = [at(halfAt(D - 70) + 3, D - 70), at(159 * sh, D - 24), at(165 * sh, D + 24), at(164 * sh, D + 78), at(126 * sh, D + 104), at(50, D + 118)];
        // (the right side top → crotch, the crotch, the left side crotch → top; the waistband closes it)
        return [...r, at(0, D + 128), ...r.map((q) => P(2 * cx - q.u, q.v)).reverse()];
      })()
    : null;
  const seat: Poly = seatUp
    ? seatUp
    : seated
    ? [at(-152 * sh, D - 70), at(152 * sh, D - 70), at(166 * sh, D - 36), at(172 * sh, D - 2), at(166 * sh, D + 30), at(140 * sh, D + 48), at(0, D + 56), at(-140 * sh, D + 48), at(-166 * sh, D + 30), at(-172 * sh, D - 2), at(-166 * sh, D - 36)]
    : // (the hips keep their width down to below an untucked hem — no dark notch of background beside them)
      // (its lower edge runs down into the crotch — never a flat bottom edge between the thighs)
      [at(-158 * sh, D - 70), at(158 * sh, D - 70), at(170 * sh, D - 24), at(176 * sh, D + 24), at(172 * sh, D + 78), at(126 * sh, D + 104), at(50, D + 118), at(0, D + 128), at(-50, D + 118), at(-126 * sh, D + 104), at(-172 * sh, D + 78), at(-176 * sh, D + 24), at(-170 * sh, D - 24)];
  const legs: FrontLeg[] = [];
  const kl = B.limb;
  for (const s of [-1, 1] as const) {
    const knee = s < 0 ? pose.kneeR : pose.kneeL;
    const foot = s < 0 ? pose.footR : pose.footL;
    const ankle = P(foot.u, floor - 60);
    if (!seated) {
      const H = P(cx + s * hipXd, hipMid.v - 30);
      const pts = [H, lerp(H, knee, 0.5), knee, lerp(knee, ankle, 0.45), ankle];
      // (FrontBoom3, review 2026-11-24: "two separate tubes hanging from a belt with a dark gap from crotch to floor";
      // "a box between the thighs") the hips and thighs FILL the trousers: at the top each leg reaches the middle
      // line, so the two meet at the crotch as one garment, and they part only gradually down the thigh
      const midT = lerp(H, knee, 0.5);
      // (armsUp) the thigh tapers from the hip to the knee — no wider than the hips over it
      const rs = up
        ? [Math.max(80 * h, Math.abs(H.u - cx) + 8), Math.max(70 * kl, Math.abs(midT.u - cx) - 18), 62 * kl, 58 * kl, 53]
        : [Math.max(88 * h, Math.abs(H.u - cx) + 8), Math.max(78 * kl, Math.abs(midT.u - cx) - 10), 62 * kl, 58 * kl, 53];
      const outline = limbOutline(pts, rs, { capStart: false, capEnd: false });
      legs.push({
        side: s,
        outline,
        axis: [H, ankle],
        thigh: null,
        knee: null,
        crease: [lerp(H, knee, 0.35), knee, lerp(knee, ankle, 0.6), P(ankle.u, ankle.v - 6)],
        folds: [
          lens(P(knee.u - s * 40, knee.v + 24), P(knee.u + s * 30, knee.v + 10), 5, 2),
          lens(P(ankle.u - s * 44, ankle.v - 40), P(ankle.u + s * 40, ankle.v - 30), 5, -2),
          lens(P(ankle.u - s * 30, ankle.v - 16), P(ankle.u + s * 46, ankle.v - 8), 4, 2),
        ],
        kneeLight: { c: P(knee.u - 8, knee.v - 6), rx: 26, ry: 34, rot: 0 },
      });
    } else {
      // SEATED (seen from a standing person's eye): the thigh foreshortened from the hip crease under the belt
      // to the knee — its top toward the light — the knee's rounded front at its end; the shin hangs from
      // behind the knee to the shoe
      const K = knee;
      const T = hipMid.v - 52;
      const hw = 1 + (h - 1) * 0.6;
      const X = (x: number) => cx + s * x;
      // (one rounded mass from the hip to the knee — its outer side tapering in a smooth curve to the knee's
      // round front, no corner at the hip, no tooth at the knee; owner 2026-11-24 review)
      const kx = Math.abs(K.u - cx);
      const ow = (woman ? 1 : 0.93) * hw;
      // (FrontBoom3, review 2026-11-24: "a light-gray box between the thighs"; "knees are round blobs on shin
      // posts with a hard step") the thighs meet at the middle (one garment, the crotch between them), and the
      // shin starts under the knee at the knee's own width, so thigh, knee and shin read as ONE leg
      const thigh: Poly = [
        P(X(1), T + 2), P(X(60 * ow), T - 3), P(X(116 * ow), T - 1), P(X(152 * ow), T + 8), P(X(166 * ow), T + 28), P(X(166 * ow), T + 52),
        P(X((166 * ow + kx + 54 * kl) / 2 + 4), (T + 52 + K.v - 20) / 2), P(X(kx + 54 * kl), K.v - 20), P(X(kx + 50 * kl), K.v + 6), P(X(kx + 36 * kl), K.v + 30), P(X(kx + 14 * kl), K.v + 43), P(X(kx - 12 * kl), K.v + 44), P(X(kx - 34 * kl), K.v + 31),
        P(X(kx - 48 * kl), K.v + 8), P(X(kx - 52 * kl), K.v - 20), P(X(Math.min(30, kx - 52 * kl)), T + 70), P(X(1), T + 40),
      ];
      const top = P(K.u + s * 1, K.v - 4);
      const pts = [top, lerp(top, ankle, 0.4), ankle];
      const outline = limbOutline(pts, [52 * kl, 55 * kl, 53], { capStart: false, capEnd: false });
      legs.push({
        side: s,
        outline,
        axis: [top, ankle],
        thigh,
        knee: { c: P(K.u - 6, K.v + 10), rx: 44 * kl, ry: 30 * kl, rot: 0 },
        crease: [P(K.u + s * 2, K.v + 60), lerp(top, ankle, 0.5), P(ankle.u, ankle.v - 6)],
        folds: [lens(P(ankle.u - s * 44, ankle.v - 40), P(ankle.u + s * 40, ankle.v - 30), 5, -2), lens(P(ankle.u - s * 30, ankle.v - 16), P(ankle.u + s * 46, ankle.v - 8), 4, 2)],
        kneeLight: { c: P(X(110 * hw) - 10, T + 40), rx: 60, ry: 30, rot: 0 },
      });
    }
  }
  // (FrontBoom3, review 2026-11-24: "trousers are one garment with a fly seam") the fly's stitched seam: from under
  // the belt down the front a little off the middle, turning in to the middle above the crotch — plain tailoring
  const flySeam: Poly | null = seated ? null : [at(14, D - 44), at(15, D + 10), at(13, D + 46), at(6, D + 66), at(0, D + 74)];
  // (the soft shade where the legs part — starting well below the crotch, where the thighs separate)
  const legGap: Poly | null = seated ? null : [at(-10, D + 200), at(10, D + 200), at(30, D + 360), at(-30, D + 360)];

  /* the shoes, toe-on (turned out a little: more of the outer side shows) */
  const SHOE: XY = [[-46, 0], [-50.6, -9], [-50, -25], [-44, -40], [-32, -52], [-14, -59], [6, -60], [24, -56], [38, -47], [48, -33], [52.6, -17], [52.8, -6], [50, 0]];
  const SOLE: XY = [[-48, -11], [52.4, -11], [53, -5], [50.4, 0], [-46, 0], [-50, -5]];
  const shoes: FrontShoe[] = ([-1, 1] as const).map((s) => {
    const f = s < 0 ? pose.footR : pose.footL;
    const S = (x: number, y: number) => P(f.u + s * x, floor + y);
    const top = [S(-30, -60), S(-34, -76), S(30, -78), S(36, -60)];
    return {
      upper: [...SHOE.map(([x, y]) => S(x, y)).slice(0, 5), ...top.slice(1, 3), ...SHOE.map(([x, y]) => S(x, y)).slice(8)],
      sole: SOLE.map(([x, y]) => S(x, y)),
      toeLight: { c: S(-6, -48), rx: 22, ry: 7, rot: 0 },
      contact: { c: S(4, 2), rx: 64, ry: 8, rot: 0 },
      axis: [S(-50, -30), S(52, -30)] as [Pt, Pt],
    };
  });

  /* the arms */
  const arms: FrontArm[] = ([-1, 1] as const).map((s) => {
    const sh = s < 0 ? pose.shoulderR : pose.shoulderL;
    const el = s < 0 ? pose.elbowR : pose.elbowL;
    const hd = s < 0 ? pose.handR : pose.handL;
    const dS = s * (cx + s * shx - sh.u); // the drawn shoulder's move outward (+) or in (−)
    const S = P(cx + s * shx, sh.v);
    // (the hanging hand stays clear of the hips and thighs: it rests beside them)
    const clearU = seated ? 0 : Math.max(halfAt(D + 10), 158 * h) + 30;
    const E0 = P(el.u + s * dS * 0.7, el.v);
    const wu = seated ? hd.wrist.u : s * Math.max(Math.abs(hd.wrist.u + s * dS * 0.6 - cx), clearU) + cx;
    const W = P(wu, hd.wrist.v);
    // (a woman's arm hangs with the elbow in against the waist and the forearm angled out round the hips —
    // her carrying angle; a man's elbow and wrist more nearly in one line)
    const E = seated ? E0 : woman ? P(s * Math.max(Math.abs(E0.u - cx), halfAt(E0.v - nbV) + 34) + cx, E0.v) : P(s * Math.max(Math.abs(E0.u - cx), Math.abs(W.u - cx) - 10) + cx, E0.v);
    const df = unit(sub(W, E));
    const foreLen = dist(E, W);
    const cuffA = sub(W, mul(df, Math.min(40, foreLen * 0.3)));
    const cuffB = sub(W, mul(df, 14));
    const kk = B.shoulder;
    const eR = 40 * kl;
    // ONE SLEEVE: from the trapezius's end over the deltoid's gentle swell, down the arm to the cuff
    const outer = (p: Pt, r: number) => P(p.u + s * r, p.v);
    const inner = (p: Pt, r: number) => P(p.u - s * r, p.v);
    const mid1 = lerp(S, E, 0.36);
    const mid2 = lerp(S, E, 0.74);
    const fm = lerp(E, cuffA, 0.5);
    // (the shoulder flows on from the trapezius: the deltoid a gentle swell, widest about a third of the way
    // down the upper arm — never a ball above the shoulder's line)
    const outerSide: Poly = [
      P(S.u - s * 30, S.v - 28), // on the trapezius, where the sleeve's line begins
      P(S.u - s * 4, S.v - 19 * kk),
      P(S.u + s * 18 * kk, S.v - 10),
      P(S.u + s * 32 * kk, S.v + 4),
      P(S.u + s * 39 * kk, S.v + 26),
      outer(lerp(S, mid1, 0.62), 41 * kk),
      outer(mid1, 40.5 * kk),
      outer(mid2, (39.5 * (kk + kl)) / 2),
      outer(E, eR - 1),
      outer(fm, (eR + 33) / 2),
      outer(cuffA, 33),
    ];
    const innerSide: Poly = [inner(cuffA, 33), inner(fm, (eR + 33) / 2 - 1), inner(E, eR - 3), inner(mid2, 37 * kl), inner(mid1, 39 * kk), P(S.u - s * 44, S.v + 40), P(S.u - s * 44, S.v + 2)];
    const sleeve: Poly = [...outerSide, ...innerSide];
    const armhole: Poly = [P(S.u - s * 20, S.v - 24), P(S.u - s * 14, S.v + 6), P(S.u - s * 20, S.v + 40), P(S.u - s * 34, S.v + 74), P(S.u - s * 42, S.v + 96)];
    const cuff: Poly = [inner(sub(cuffA, mul(df, 3)), 34), outer(sub(cuffA, mul(df, 3)), 34), outer(cuffB, 33.5), P(cuffB.u + df.u * 2.5, cuffB.v + df.v * 2.5), inner(cuffB, 33.5)];
    const cuffRim: Poly = [inner(cuffB, 33.5), P(cuffB.u + df.u * 2.5, cuffB.v + df.v * 2.5), outer(cuffB, 33.5)];
    const cuffSeam: Poly = [inner(sub(cuffA, mul(df, 1)), 33.6), P(cuffA.u + df.u * 1.5, cuffA.v + df.v * 1.5), outer(sub(cuffA, mul(df, 1)), 33.6)];
    const wristSkin = limbOutline([sub(cuffB, mul(df, 8)), add(W, mul(df, 6))], [24.5, 22], { capStart: false, capEnd: false });
    const dir = seated ? hd.dir : Math.atan2(df.v, df.u);
    const hand = seated ? placeFrontRest('lapFront', W, dir, P(-s, 0)) : placeFrontRest('hangFront', W, dir, P(-s, 0));
    const folds: Poly[] = [
      lens(outer(lerp(E, mid2, 0.4), 30), inner(lerp(E, mid2, 0.25), 24), 4.5, 2),
      lens(inner(E, 30), outer(lerp(E, fm, 0.3), 18), 4, -2),
      lens(outer(sub(cuffA, mul(df, 12)), 26), inner(sub(cuffA, mul(df, 18)), 24), 4, 2),
    ];
    return { side: s, shoulder: S, elbow: E, wrist: W, sleeve, armhole, cuff, cuffRim, cuffSeam, wristSkin, folds, upperAxis: [S, E] as [Pt, Pt], foreAxis: [E, W] as [Pt, Pt], hand };
  });

  /* the jacket */
  let jacket: FrontJacket | null = null;
  if (o.jacket) {
    const Ez = 9; // the cloth's ease over the shirt
    const yB = D - BUTTON_T * (D + 8); // the button, at about the bottom of the breastbone
    const hemY = seated ? D + 10 : D + 178;
    const jw = (y: number) => halfAt(Math.min(y, D + 90)) + Ez + (y > D - 60 ? 4 : 0);
    const panel = (s: 1 | -1): Poly => {
      const S = (x: number, y: number) => at(s * x, y);
      // the roll (front fold) from the button up to the neck; the front edge below the button curving
      // apart to the hem; the hem; the side; the shoulder, squarer than the shirt's
      return [
        S(nwc - 2, -14),
        S(nwc + 26, -6), S(nwc + 56, 7), S(shx - 14, 26), S(shx + 10, 36), S(shx + 20, 56),
        ...[150, 230, D * 0.62, D - 40, D + 60, D + 140].filter((y) => y < hemY - 24).map((y) => S(jw(y) + (y === 150 ? 2 : 0), y)),
        S(jw(Math.min(hemY - 22, D + 90)), hemY - 22),
        S(jw(D + 90) - 14, hemY), S(70, hemY + 2), S(34, hemY - 10),
        S(14, seated ? hemY - 20 : yB + 140), S(4, yB + 40), S(1, yB),
        // the roll line up to the neck: the V's side
        S(10, yB - 60), S(22, yB - 120), S(nwc * 0.7 + 4, 40), S(nwc - 2, 4), S(nwc - 2, -14),
      ];
    };
    const body = [panel(-1), panel(1)];
    const faces: Poly[] = [];
    const cutEdges: Poly[] = [];
    const rolls: Poly[] = [];
    const notches: Poly[] = [];
    for (const s of [-1, 1] as const) {
      const S = (x: number, y: number) => at(s * x, y);
      const roll: Poly = [S(1, yB), S(10, yB - 60), S(22, yB - 120), S(nwc * 0.7 + 4, 40), S(nwc - 2, 4), S(nwc - 2, -14)];
      // the lapel's cut edge from the button out to its point, the notch, the collar's edge round to the neck
      const cut: Poly = [S(4, yB - 8), S(26, yB - 62), S(52, yB - 118), S(74, 72), S(86, 58), S(70, 52), S(74, 40), S(nwc + 30, -2), S(nwc + 18, -16), S(nwc + 2, -20)];
      faces.push([...roll, ...[...cut].reverse()]);
      cutEdges.push(cut);
      rolls.push(roll);
      notches.push([S(86, 58), S(70, 52), S(74, 40), S(80, 50)]);
    }
    const pockets: Poly[] = seated
      ? [[at(70, 150), at(128, 142)]]
      : [
          [at(-150, D + 60), at(-62, D + 64), at(-60, D + 90), at(-148, D + 86)],
          [at(62, D + 64), at(150, D + 60), at(148, D + 86), at(60, D + 90)],
          [at(70, 150), at(128, 142)],
        ];
    const sleeves = arms.map((a) => {
      const s = a.side;
      const df = unit(sub(a.wrist, a.elbow));
      // (the shirt's cuff ends 14 mm short of the wrist: the jacket's sleeve ends SHIRT_CUFF_SHOWS short of that)
      const end = sub(a.wrist, mul(df, 14 + SHIRT_CUFF_SHOWS));
      const S = a.shoulder;
      const E = a.elbow;
      const kk = B.shoulder;
      const outer = (p: Pt, r: number) => P(p.u + s * r, p.v);
      const inner = (p: Pt, r: number) => P(p.u - s * r, p.v);
      const mid1 = lerp(S, E, 0.36);
      const mid2 = lerp(S, E, 0.74);
      const fm = lerp(E, end, 0.5);
      const eR = 40 * kl + 6;
      const endR = 38;
      // (squarer than the shirt's: a flatter line over the shoulder to the sleeve's head, then straight down)
      const outline: Poly = [
        P(S.u - s * 30, S.v - 34),
        P(S.u - s * 4, S.v - 27 * kk),
        P(S.u + s * 22 * kk, S.v - 22),
        P(S.u + s * 40 * kk, S.v - 12),
        P(S.u + s * 47 * kk, S.v + 8),
        outer(lerp(S, mid1, 0.62), 47.5 * kk),
        outer(mid1, 47 * kk),
        outer(mid2, (46 * (kk + kl)) / 2),
        outer(E, eR),
        outer(fm, (eR + endR) / 2),
        outer(end, endR),
        P(end.u + df.u * 2, end.v + df.v * 2),
        inner(end, endR),
        inner(fm, (eR + endR) / 2 - 1),
        inner(E, eR - 2),
        inner(mid2, 43 * kl),
        inner(mid1, 45 * kk),
        P(S.u - s * 50, S.v + 40),
        P(S.u - s * 50, S.v + 2),
      ];
      return {
        outline,
        endRim: [inner(end, endR), P(end.u + df.u * 2, end.v + df.v * 2), outer(end, endR)],
        folds: [lens(outer(lerp(E, mid2, 0.4), 34), inner(lerp(E, mid2, 0.25), 28), 5, 2), lens(inner(E, 34), outer(lerp(E, fm, 0.3), 22), 4.5, -2)],
        upperAxis: [S, E] as [Pt, Pt],
        foreAxis: [E, a.wrist] as [Pt, Pt],
      };
    });
    jacket = {
      body,
      faces,
      cutEdges,
      rolls,
      notches,
      button: { c: at(0, yB + 2), rx: 8.5, ry: 8.5, rot: 0 },
      pockets,
      hem: [at(-jw(D + 90) + 14, hemY), at(-70, hemY + 2), at(-34, hemY - 10), at(-14, seated ? hemY - 20 : yB + 140)],
      folds: [lens(at(-30, yB + 6), at(-120, yB + 40), 6, 3), lens(at(30, yB + 6), at(120, yB + 40), 6, -3), lens(at(-60, yB - 40), at(-130, 150), 6, -2)],
      sleeves,
      axis: [hipMid, at(0, 0)],
    };
  }

  return {
    seated,
    head,
    shirt,
    collar,
    collarKind: crew ? 'crew' : 'shirt',
    placket,
    buttons,
    tucked: B.tucked,
    belt,
    buckle,
    blouse,
    shirtFolds,
    seat,
    legs,
    legGap,
    flySeam,
    shoes,
    arms,
    jacket,
    axis: [hipMid, at(0, 0)],
    shoulderW: shx * 2,
    hipV: hipMid.v,
    nbV,
  };
}
