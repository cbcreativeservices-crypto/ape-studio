/**
 * M09 DRUM OVERHEADS — the technical truth (charter §2 layer 1). Every
 * number has a provenance; keys point into docs/labs/miking/overheads/
 * SOURCES.md. Geometry: overheads/GEOMETRY_PROPOSAL.md §1–§2 (computed there;
 * recomputed here from the shared kit and pinned by test/mikingModelM09.test.ts).
 * Frame: the KIT frame K (kit/GEOMETRY_PROPOSAL.md §1).
 *
 * The suggested starting points are written in the starting-points voice
 * (owner ruling 2026-10-04): `label`, `band`, `tendency`, `checks` are what the
 * learner reads; `kind`, `src`, `quote` and every `prov` are the INTERNAL
 * record. No name of a person or a maker reaches the learner: the two-mic
 * method built on equal snare distance is "the floor-tom method" (a mic over
 * the snare and one beside the floor tom), the 32-inch method is "the
 * shoulder method".
 */
import type { DocumentedZone, Provenance, Vec3 } from '../../engine/model/types.ts';
import { KIT_DRUMS } from '../shared/kitPlanModel.ts';
import { FT_C, FT_RIM_H, KIT_CENTRE, O, S0, aimToward, distMm, heightOf } from '../shared/kitScene/kitSceneModel.ts';

export { aimToward };

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });

const IN = 25.4;
/** 40 in = 1016 mm; 4 ft = 1219.2 mm; 6 in = 152.4 mm; 32 in = 812.8 mm; 1 ft = 304.8 mm (conversions). */
export const OH = {
  gjMain: 40 * IN,
  gjHigh: 48 * IN,
  gjSideAboveRim: 6 * IN,
  spaced: 48 * IN,
  shoulderMethod: 32 * IN,
  monoAboveHead: 12 * IN,
  ortfSpacing: 170,
  ortfAngle: 110,
  xyAngle: 90,
  xyAngleMax: 135,
} as const;

/* ── the computed positions (overheads/GEOMETRY_PROPOSAL.md §2) ── */

/** The snare's radius: the "aimed at the snare" test lands within it. */
export const SNARE_R = KIT_DRUMS.snare.spec.d.mm / 2;

/** Floor-tom method, the mic above: S0 + 40 in straight up. */
export const GJ_MAIN: Vec3 = { x: S0.x, y: S0.y - OH.gjMain, z: S0.z };
/** …and the "4 ft above the kit" account: S0 + 4 ft up. */
export const GJ_MAIN_HIGH: Vec3 = { x: S0.x, y: S0.y - OH.gjHigh, z: S0.z };
/**
 * Floor-tom method, the side mic: 6 in above the floor-tom rim, at the same
 * 40 in from S0, on the plan line from S0 through the floor tom's centre
 * (proposal §2.7: (−347.5, −492.0, 675.1), 92.1 mm beyond the rim).
 */
export const GJ_SIDE: Vec3 = (() => {
  const h = FT_RIM_H + OH.gjSideAboveRim;
  const dy = h - heightOf(S0);
  const plan = Math.sqrt(OH.gjMain * OH.gjMain - dy * dy);
  const ux = FT_C.x - S0.x;
  const uz = FT_C.z - S0.z;
  const ul = Math.hypot(ux, uz);
  return { x: S0.x + (ux / ul) * plan, y: S0.y - dy, z: S0.z + (uz / ul) * plan };
})();

/** Spaced pair (A/B): each capsule 4 ft from S0, vertical, at the drawing's
 *  plan points 240 mm in front of the snare and ±600 mm across. */
export const AB_HAT: Vec3 = (() => {
  const plan = Math.hypot(-150 - S0.x, -930 - S0.z);
  const up = Math.sqrt(OH.spaced * OH.spaced - plan * plan);
  return { x: -150, y: S0.y - up, z: -930 };
})();
export const AB_RIDE: Vec3 = { x: -150, y: AB_HAT.y, z: 270 };

/** One mic over the kit's centre, 1 ft above the drummer's head (h 1300, a
 *  drawing default) — the start pose sits 20 mm higher, still inside its band,
 *  clear of the sticks' reach (the reach is a drawing default too). */
export const MONO: Vec3 = { x: KIT_CENTRE.x, y: S0.y + heightOf(S0) - (1300 + OH.monoAboveHead), z: KIT_CENTRE.z };
export const MONO_START: Vec3 = { ...MONO, y: MONO.y - 20 };

/**
 * The shoulder method: mic A 32 in straight above S0, aimed down; mic B on
 * the sphere 32 in about S0 and equally far from the kick reference (O) as
 * A, nearest the drawing's right shoulder (proposal §2.6: (−823.3, −966.3,
 * −25.7)). Shown on the two-overheads page only: in this drawing B lands
 * about 20 cm from the player's shoulder, inside the sticks' reach.
 */
export const RM_A: Vec3 = { x: S0.x, y: S0.y - OH.shoulderMethod, z: S0.z };
export const RM_B: Vec3 = (() => {
  // Solve on a grid of the circle {|B − S0| = r} ∩ {|B − O| = |A − O|}: the
  // intersection of two spheres is a circle; pick the point nearest the shoulder.
  const r = OH.shoulderMethod;
  const dA = distMm(RM_A, O);
  const sh = { x: -700, y: 290.4 - 1150, z: 90 };
  // Circle: centre on the line S0→O, at t from S0 (two-sphere intersection).
  const d = distMm(S0, O);
  const t = (d * d + r * r - dA * dA) / (2 * d);
  const rc = Math.sqrt(Math.max(0, r * r - t * t));
  const ax = { x: (O.x - S0.x) / d, y: (O.y - S0.y) / d, z: (O.z - S0.z) / d };
  const c = { x: S0.x + ax.x * t, y: S0.y + ax.y * t, z: S0.z + ax.z * t };
  // Two unit vectors perpendicular to ax.
  const helper = Math.abs(ax.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const dot = helper.x * ax.x + helper.y * ax.y + helper.z * ax.z;
  let u = { x: helper.x - ax.x * dot, y: helper.y - ax.y * dot, z: helper.z - ax.z * dot };
  const ul = Math.hypot(u.x, u.y, u.z);
  u = { x: u.x / ul, y: u.y / ul, z: u.z / ul };
  const v = { x: ax.y * u.z - ax.z * u.y, y: ax.z * u.x - ax.x * u.z, z: ax.x * u.y - ax.y * u.x };
  let best = c;
  let bd = Infinity;
  for (let k = 0; k < 3600; k++) {
    const a = (k / 3600) * 2 * Math.PI;
    const p = { x: c.x + rc * (Math.cos(a) * u.x + Math.sin(a) * v.x), y: c.y + rc * (Math.cos(a) * u.y + Math.sin(a) * v.y), z: c.z + rc * (Math.cos(a) * u.z + Math.sin(a) * v.z) };
    const dd = distMm(p, sh);
    if (dd < bd) {
      bd = dd;
      best = p;
    }
  }
  return best;
})();

/** X/Y and ORTF: the pair's centre over the snare at the mono height
 *  (proposal §2.2–2.3, a drawing default). */
export const PAIR_CENTRE: Vec3 = { x: S0.x, y: MONO.y, z: S0.z };

/* ── SUGGESTED STARTING POINTS ── */

const OH_TYPES = ['ohPencil', 'ohLdc'];
const AIM_SNARE = { surface: 'snare', r: SNARE_R, prov: ill('"pointed at a particular spot on the drum" / "pointing to the centre of the snare": the lab counts any aim that lands on the snare head') };
const GJ_MAIN_AIM = aimToward(GJ_MAIN, S0);
const GJ_SIDE_AIM = aimToward(GJ_SIDE, S0);

/** Plan-view rectangles for drawing a zone (u = x, v = z; side: v = y). */
function drawnBox(c: Vec3, rPlan: number, h0: number, h1: number): DocumentedZone['drawn'] {
  return { side: { u0: c.x - rPlan, u1: c.x + rPlan, v0: S0.y - h1, v1: S0.y - h0 }, top: { u0: c.x - rPlan, u1: c.x + rPlan, v0: c.z - rPlan, v1: c.z + rPlan } };
}

export const M09_ZONES: DocumentedZone[] = [
  {
    id: 'oh.gj.main',
    label: 'Directly over the snare, aimed at it',
    band: 'Start about 1 m (40 in) above the snare’s centre, aimed down at it. About 1.2 m (4 ft) is another place to begin.',
    kind: 'sourced',
    src: 'RM-GJ',
    quote: 'The first overhead mic, a condenser, goes directly over the snare drum, at a height of about 40", and pointed at a particular spot on the drum. (MT-GJ: "around 4 feet (122cm) above the kit, pointing to the centre of the snare drum")',
    refSurface: 'snare',
    side: 'either',
    distance: { min: OH.gjMain - 100, max: OH.gjHigh + 100 },
    bandProv: ill('two accounts, 40 in over the snare and 4 ft above the kit: the band spans both, ± 10 cm (the lab’s tolerance)'),
    radial: { line: 'snareLine', max: 100, prov: ill('"directly over the snare": within 10 cm of its centre line is the lab’s tolerance') },
    requires: { micTypeIds: OH_TYPES },
    aimAt: AIM_SNARE,
    drawn: drawnBox(S0, 100, OH.gjMain - 100, OH.gjHigh + 100),
    start: { p: GJ_MAIN, az: GJ_MAIN_AIM.az, el: GJ_MAIN_AIM.el },
    tendency: 'A whole-kit picture centred on the snare. Higher tends to bring in more cymbals and more of the room; lower, more drums and less room. Compare by ear on this kit.',
    checks: ['The sticks’ highest point and the cymbals’ swing', 'The ceiling, the lights and a counterweighted boom', 'Whether this mic alone gives a useful kit balance'],
  },
  {
    id: 'oh.gj.side',
    label: 'Beside the floor tom, the same distance from the snare',
    band: 'Start about 15 cm (6 in) above the floor-tom rim, just beyond the drum and outside the player’s reach, aimed across the kit at the snare — the same distance from the snare’s centre as the mic above it.',
    kind: 'sourced',
    src: 'MT-GJ',
    quote: 'The second mic is placed adjacent to the floor tom tom, around 6 inches (15cm) above its rim, firing across the kit towards the hi-hat. These two mics should be equidistant from the centre of the snare drum (RM-GJ: "it should be the same distance from the target spot on the snare drum as the first overhead")',
    refSurface: 'ftRim',
    side: 'either',
    distance: { min: OH.gjSideAboveRim - 75, max: OH.gjSideAboveRim + 75 },
    bandProv: ill('"around 6 inches above its rim": ± 7.5 cm is the lab’s tolerance'),
    near: { point: S0, min: OH.gjMain - 100, max: OH.gjHigh + 100, prov: src('RM-GJ', 'the critical thing is that the distance from the drum should be identical to that of the first mic') },
    requires: { micTypeIds: OH_TYPES },
    aimAt: AIM_SNARE,
    box: { min: { x: -900, y: -2000, z: FT_C.z + KIT_DRUMS.floor.spec.d.mm / 2 }, max: { x: 200, y: 300, z: 2000 }, prov: ill('"adjacent to the floor tom": beyond the floor tom’s rim, on the floor-tom side of the kit') },
    drawn: {
      side: { u0: GJ_SIDE.x - 160, u1: GJ_SIDE.x + 160, v0: GJ_SIDE.y - 75, v1: GJ_SIDE.y + 75 },
      top: { u0: GJ_SIDE.x - 160, u1: GJ_SIDE.x + 160, v0: GJ_SIDE.z - 60, v1: GJ_SIDE.z + 260 },
    },
    start: { p: GJ_SIDE, az: GJ_SIDE_AIM.az, el: GJ_SIDE_AIM.el },
    tendency: 'A side view across the kit: the floor tom and the ride come closer, the hi-hat sits across the kit. With the mic above, matching the two snare distances tends to keep the snare solid and central.',
    checks: ['Outside the drummer’s reach and the floor tom’s rim', 'The same distance to the snare’s centre as the mic above — measure it', 'Floor tom and ride against the hi-hat'],
  },
  {
    id: 'oh.ab.hat',
    label: 'Spaced pair: the hi-hat-side mic',
    band: 'Start about 1.2 m (4 ft) from the snare’s centre, over the hi-hat side of the kit, pointing straight down — the same distance from the snare as its partner.',
    kind: 'sourced',
    src: 'AX-DPE8',
    quote: 'keep the snare as the focal point and move the mics into various left and right positions equal distance from the snare; 4 feet is a good starting point. For best results, keep the mics in a vertical position',
    refSurface: 'snare',
    side: 'either',
    distance: { min: 700, max: 1400 },
    bandProv: ill('above the cymbals and below the drawing’s top: the height band is the lab’s'),
    near: { point: S0, min: OH.spaced - 100, max: OH.spaced + 100, prov: src('AX-DPE8', '4 feet is a good starting point') },
    requires: { micTypeIds: OH_TYPES },
    aim: { maxOffAxis: 20, prov: ill('"keep the mics in a vertical position": within 20° of straight down is the lab’s tolerance') },
    box: { min: { x: -1300, y: -2000, z: -1200 }, max: { x: 900, y: 300, z: S0.z - 200 }, prov: ill('the hi-hat side of the snare') },
    drawn: { side: { u0: AB_HAT.x - 160, u1: AB_HAT.x + 160, v0: AB_HAT.y - 110, v1: AB_HAT.y + 110 }, top: { u0: AB_HAT.x - 160, u1: AB_HAT.x + 160, v0: AB_HAT.z - 160, v1: AB_HAT.z + 160 } },
    start: { p: AB_HAT, az: 0, el: -90 },
    tendency: 'Width and a wider view of the kit. Arrival times differ for every source but the snare, so listen to the pair in mono as well as in stereo.',
    checks: ['The same distance to the snare as its partner', 'Above the crashes’ swing', 'The pair in mono, not only in stereo'],
  },
  {
    id: 'oh.ab.ride',
    label: 'Spaced pair: the ride-side mic',
    band: 'Start about 1.2 m (4 ft) from the snare’s centre, over the ride side of the kit, pointing straight down — the same distance from the snare as its partner.',
    kind: 'sourced',
    src: 'AX-DPE8',
    quote: 'keep the snare as the focal point and move the mics into various left and right positions equal distance from the snare; 4 feet is a good starting point. For best results, keep the mics in a vertical position',
    refSurface: 'snare',
    side: 'either',
    distance: { min: 700, max: 1400 },
    bandProv: ill('above the cymbals and below the drawing’s top: the height band is the lab’s'),
    near: { point: S0, min: OH.spaced - 100, max: OH.spaced + 100, prov: src('AX-DPE8', '4 feet is a good starting point') },
    requires: { micTypeIds: OH_TYPES },
    aim: { maxOffAxis: 20, prov: ill('"keep the mics in a vertical position": within 20° of straight down is the lab’s tolerance') },
    box: { min: { x: -1300, y: -2000, z: S0.z + 200 }, max: { x: 900, y: 300, z: 1200 }, prov: ill('the ride side of the snare') },
    drawn: { side: { u0: AB_RIDE.x - 160, u1: AB_RIDE.x + 160, v0: AB_RIDE.y - 110, v1: AB_RIDE.y + 110 }, top: { u0: AB_RIDE.x - 160, u1: AB_RIDE.x + 160, v0: AB_RIDE.z - 160, v1: AB_RIDE.z + 160 } },
    start: { p: AB_RIDE, az: 0, el: -90 },
    tendency: 'Width and the ride side of the kit. Check its distance to the snare against its partner, then hear the pair in mono.',
    checks: ['The same distance to the snare as its partner', 'Above the ride’s and the crash’s swing', 'The pair in mono, not only in stereo'],
  },
  {
    id: 'oh.mono',
    label: 'One mic over the middle of the kit',
    band: 'Start about 30 cm (1 ft) above the drummer’s head, over the middle of the kit, aimed down — an example to check against the player, not a clearance rule.',
    kind: 'sourced',
    src: 'S-LIVE',
    quote: 'One microphone over center of drum set, about 1 foot above drummer’s head (Position A)',
    refSurface: 'snare',
    side: 'either',
    distance: { min: heightOf(MONO) - heightOf(S0) - 120, max: heightOf(MONO) - heightOf(S0) + 160 },
    bandProv: ill('"about 1 foot above the drummer’s head": the head height is a drawing default (1.3 m); −12 / +16 cm is the lab’s tolerance'),
    radial: { line: 'kitLine', max: 130, prov: ill('"over center of drum set": the kit’s centre is the midpoint of the kick and the snare (a drawing default); 13 cm is the lab’s tolerance') },
    requires: { micTypeIds: OH_TYPES },
    aim: { maxOffAxis: 30, prov: ill('aimed down at the kit: within 30° of straight down is the lab’s tolerance') },
    drawn: { side: { u0: MONO.x - 130, u1: MONO.x + 130, v0: MONO.y - 160, v1: MONO.y + 120 }, top: { u0: MONO.x - 130, u1: MONO.x + 130, v0: MONO.z - 130, v1: MONO.z + 130 } },
    start: { p: MONO_START, az: 0, el: -90 },
    tendency: 'The whole kit and some of the room in one channel — no stereo width. Height, front–back position and aim set the balance; for cymbals only, a low cut is a common idea to try.',
    checks: ['The player’s height and movement, not a fixed number', 'The sticks’ reach and the cymbals’ swing', 'What this one channel needs to add'],
  },
];
