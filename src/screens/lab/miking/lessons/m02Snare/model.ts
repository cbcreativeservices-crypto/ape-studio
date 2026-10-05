/**
 * M02 SNARE DRUM — the technical truth (charter §2 layer 1). Source keys
 * point into docs/labs/miking/snare/SOURCES.md (and kit/, kick/ for shared
 * facts); the geometry follows snare/GEOMETRY_PROPOSAL.md.
 *
 * LESSON FRAME: the KIT frame translated to the snare's batter-head centre
 * S0 (proposal §1): origin S0; +x toward the audience; +y DOWN (into the
 * drum: the snare-side head is at y = depth); +z the drummer's right. The
 * shared kit (lessons/shared/kitPlanModel.ts) places S0; every neighbour is
 * read from the same kit and translated here, so the snare, the hi-hat, the
 * rack tom and the kick sit exactly where every other drum lesson puts them.
 *
 * UNKNOWNS the drawing needs are DRAWING DEFAULTS (`placeholder: true`):
 * the drum family's hoop/lug/wire numbers, the snare's height (640 mm), the
 * stand, the stick's keep-out, the bottom-mic distance (proposal §9). None is
 * a readout reference: distances are read from the head planes and the head
 * edge (nominal radius), as the sources word them ("above rim of top head").
 */
import type { Dim, DocumentedZone, MicPose, Provenance, Vec3 } from '../../engine/model/types.ts';
import { aimVec } from '../../engine/geometry/vec.ts';
import { KIT_CYMBALS, KIT_DRUMS, KIT_FLOOR_Y, toLesson } from '../shared/kitPlanModel.ts';
import { hoopRadii, SNARE_14x55 } from '../shared/drums/drumSpec.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
const dd = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });

/** S0 in the kit frame: the lesson frame's origin. */
export const S0_KIT: Vec3 = KIT_DRUMS.snare.c;
const L = (p: Vec3) => toLesson(S0_KIT, p);

export const SPEC = SNARE_14x55;
export const R = SPEC.d.mm / 2; // 177.8 (nominal; TRIAL as the head edge)
export const DEPTH = SPEC.depth.mm; // 139.7
export const R_IN = R - SPEC.tShell.mm;
export const HOOP = hoopRadii(SPEC);
export const H_UP = SPEC.hoop.above.mm; // 10 (drawing default)

export const SNARE_DIMS = {
  /** The snare's batter height above the floor (proposal §2 h_S0). */
  height: dd(640, 'snare batter-head height above the floor'),
  /** Its floor, in the lesson frame. */
  yFloor: dd(KIT_FLOOR_Y - S0_KIT.y, 'the floor line (the snare’s height above it)'),
  headClear: dd(20, 'batter-head motion and the stick tip above the head (ko.sn.head)'),
  resoClear: dd(10, 'snare-side head motion'),
  wireClear: dd(15, 'snare-wire motion'),
  /** The player's stick sector (proposal §6 ko.sn.stick). */
  stickA0: dd(60, 'the stick and rimshot sector (plan angles)'),
  stickA1: dd(240, 'the stick and rimshot sector (plan angles)'),
  stickUp: dd(400, 'how high the stick travels above the head'),
  stickOut: dd(60, 'how far a rimshot reaches past the head’s edge'),
  /** The stand (proposal §3: "leg spread and basket UNKNOWN"). */
  basketBelow: dd(50, 'snare-stand basket below the snare-side head'),
  legSpread: dd(240, 'snare-stand leg spread'),
  hubAbove: dd(150, 'snare-stand leg hub above the floor'),
  /** Approach (proposal §5: "plan angle θ = −30°, drawing default"). */
  approachDeg: dd(-30, 'where the stand mic comes in from (plan angle)'),
  hihatClear: dd(60, 'hi-hat air-burst ring and cymbal travel'),
  cymbalClear: dd(60, 'cymbal swing'),
} as const;

export const STAND = {
  armsDeg: [30, 150, 270] as const,
  legsDeg: [90, 210, 330] as const,
};

/* ── neighbours from the shared kit, in the lesson frame ── */
export const NEIGHBOURS = {
  hihat: { c: L(KIT_CYMBALS.hihat.c), d: KIT_CYMBALS.hihat.d },
  crash1: { c: L(KIT_CYMBALS.crash1.c), d: KIT_CYMBALS.crash1.d, tiltDeg: KIT_CYMBALS.crash1.tiltDeg },
  tom1: { ...KIT_DRUMS.tom1, c: L(KIT_DRUMS.tom1.c) },
  /** The kick: its axis along x, batter at kit x = 0. */
  kick: { c: L({ x: 0, y: 0, z: 0 }) },
};

/* ── RECOMMENDED STARTING POINTS (lesson table L21–L31, corrections S-01…S-04).
 *  Learner-facing: label, band, tendency, checks. `kind`, `src`, `quote` and
 *  every `prov` are the internal record (owner ruling 2026-10-04). ── */

const DEG = Math.PI / 180;
/** A pose whose front is at plan angle θ (deg), radius r, height y, aimed at
 *  the target point (lesson frame). */
export function poseAt(thetaDeg: number, r: number, y: number, target: Vec3): MicPose {
  const p = { x: r * Math.cos(thetaDeg * DEG), y, z: r * Math.sin(thetaDeg * DEG) };
  const d = { x: target.x - p.x, y: target.y - p.y, z: target.z - p.z };
  const l = Math.hypot(d.x, d.y, d.z);
  const u = { x: d.x / l, y: d.y / l, z: d.z / l };
  // aimVec(az, el) = (−cos az cos el, −sin el, sin az cos el).
  const el = -Math.asin(u.y) / DEG;
  const az = Math.atan2(u.z, -u.x) / DEG;
  return { p, az, el };
}
/** A pose at plan angle θ, radius r, height y, aimed toward the drum's axis
 *  at `tiltDeg` from straight down (+) or straight up (−, a bottom mic). */
export function poseTilted(thetaDeg: number, r: number, y: number, fromVertDeg: number, up = false): MicPose {
  const p = { x: r * Math.cos(thetaDeg * DEG), y, z: r * Math.sin(thetaDeg * DEG) };
  const h = Math.sin(fromVertDeg * DEG);
  const v = Math.cos(fromVertDeg * DEG);
  const inward = { x: -Math.cos(thetaDeg * DEG), z: -Math.sin(thetaDeg * DEG) };
  const u = { x: inward.x * h, y: up ? -v : v, z: inward.z * h };
  const el = -Math.asin(u.y) / DEG;
  const az = Math.atan2(u.z, -u.x) / DEG;
  return { p, az, el };
}

const TH = SNARE_DIMS.approachDeg.mm;
/** From above, a zone runs round the rim on the approach side: clear of the
 *  stick sector (60°–240°) and of the hi-hat (≈ 256°). Drawing only — the
 *  zone test itself is the bands below. */
const arc = (r0: number, r1: number) => ({ cu: 0, cv: 0, r0, r1, a0: -80, a1: 55 });
const DYN_TOP = ['smallDynCard', 'tomDynSuper'];
const rimProv = ill('"above rim": the zone counts over the head’s edge, ±4 cm — the lab’s drawing of "rim"');

export const SNARE_ZONES: DocumentedZone[] = [
  {
    id: 'top.close',
    label: 'Over the rim, close',
    band: 'Start about 2.5–7.5 cm (1–3 in) above the rim, over the edge of the drum, aimed at the head.',
    kind: 'sourced',
    src: 'S-SM57-UG',
    quote: '2.5 to 7.5 cm (1 to 3 in.) above rim of top head of drum. Aim mic at drum head.',
    refSurface: 'rim',
    side: 'outside',
    distance: { min: 25, max: 75 },
    radial: { line: 'edge', min: -40, max: 40, prov: rimProv },
    requires: { micTypeIds: DYN_TOP },
    aimAt: { surface: 'batter', r: R, prov: { kind: 'sourced', src: 'S-SM57-UG', quote: 'Aim mic at drum head.' } },
    drawn: { side: { u0: 90, u1: 222, v0: -H_UP - 75, v1: -H_UP - 25 }, top: arc(R - 40, R + 40) },
    start: poseAt(TH, 170, -H_UP - 50, { x: 98 * Math.cos(TH * DEG), y: 0, z: 98 * Math.sin(TH * DEG) }),
    tendency: 'The most snap from the stick, with plenty of the snare’s crack. How much body and buzz comes with it depends on the drum and where the mic points. Move it and listen.',
    checks: ['Clearance from the stick, rimshots and the hi-hat', 'Hi-hat spill, and where the pattern rejects it', 'The balance of attack and body, on this drum'],
  },
  {
    id: 'top.far',
    label: 'Over the edge, a little farther away',
    band: 'Start about 10–15 cm (4–6 in) above the rim, over the edge, angled toward the centre.',
    kind: 'sourced',
    src: 'S-SM57-ART',
    quote: 'place the mic a good 4 inches away from the snare to ensure you capture the whole drum sound',
    refSurface: 'rim',
    side: 'outside',
    distance: { min: 100, max: 150 },
    bandProv: ill('"a good 4 inches away from the snare": the lab reads it from the rim, 10–15 cm'),
    radial: { line: 'edge', min: -40, max: 60, prov: rimProv },
    requires: { micTypeIds: DYN_TOP },
    aimAt: { surface: 'batter', r: 120, prov: { kind: 'sourced', src: 'S-REC1', quote: 'angled toward the center' } },
    drawn: { side: { u0: 90, u1: 240, v0: -H_UP - 150, v1: -H_UP - 100 }, top: arc(R - 40, R + 60) },
    start: poseAt(TH, 175, -H_UP - 120, { x: 0, y: 0, z: 0 }),
    tendency: 'More of the whole drum — body and buzz along with the crack — and more of the kit around it, too.',
    checks: ['Hi-hat and cymbal spill as the mic moves away', 'Compare with the close position at similar levels'],
  },
  {
    id: 'top.clip',
    label: 'Clamped to the rim',
    band: 'Start with the mic clamped to the rim, about 3–5 cm (1.2–2 in) above the head, angled 30–60° from straight down.',
    kind: 'sourced',
    src: 'SN-904-2019',
    quote: 'Position the microphone on the drum so that it is 3 to 5cm above the drumhead. … The most balanced results are obtained at an angle of 30 to 60°.',
    refSurface: 'batter',
    side: 'outside',
    distance: { min: 30, max: 50 },
    radial: { line: 'edge', min: -60, max: 20, prov: ill('a clamp holds the mic just in over the head; −6 to +2 cm from the edge is the lab’s drawing of it') },
    requires: { micTypeIds: ['clipDynCard'] },
    aim: { maxOffAxis: 60, minOffAxis: 30, prov: { kind: 'sourced', src: 'SN-904-2019', quote: 'an angle of 30 to 60° (read from the p.4 figure: from the head normal)' } },
    drawn: { side: { u0: 100, u1: 200, v0: -50, v1: -30 }, top: arc(R - 60, R + 20) },
    start: poseTilted(TH, 160, -40, 45),
    tendency: 'A close, low-profile view of the head. Changing the angle trades the drum’s fundamental against its overtones — try both ends of the range.',
    checks: ['The clamp fits the hoop and holds under playing', 'The stick and rimshot path', 'The angle, one change at a time'],
  },
  {
    id: 'top.cond',
    label: 'Condenser on the rim, angled at the head',
    band: 'Start the condenser’s head about 4–7.5 cm (1.5–3 in) above the drumhead, angled toward it — never flat to it.',
    kind: 'trial',
    src: 'EW-DM20',
    quote: 'It is suggested that the microphone head be positioned between 1.5 inches and 3 inches above the drumhead. (Keep in mind that the microphone head should never be placed parallel to the drumhead…)',
    refSurface: 'batter',
    side: 'outside',
    distance: { min: 38.1, max: 76.2 },
    radial: { line: 'edge', min: -80, max: 20, prov: ill('a rim mount holds the head in over the drum; −8 to +2 cm from the edge is the lab’s drawing of it') },
    requires: { micTypeIds: ['rimCondenser'] },
    aim: { maxOffAxis: 80, minOffAxis: 10, prov: ill('"never parallel": 10–80° from straight down is the lab’s reading') },
    aimAt: { surface: 'batter', r: R, prov: ill('"angled toward the drumhead"') },
    drawn: { side: { u0: 80, u1: 200, v0: -76, v1: -38 }, top: arc(R - 80, R + 20) },
    start: poseTilted(TH, 150, -55, 45),
    tendency: 'A detailed, discreet close pickup. Condensers vary in how much level they take: check this one’s rating, and the pad if it has one.',
    checks: ['Phantom power for this channel', 'Its rated level against the hardest strokes', 'The gooseneck kept within its bend limit'],
  },
  {
    id: 'bottom',
    label: 'Below, near the bottom rim',
    band: 'Start just below the bottom rim — about 3–8 cm (1–3 in) below the snare-side head — aimed up at the head and wires.',
    kind: 'sourced',
    src: 'S-SM57-UG',
    quote: 'If desired, place a second mic just below rim of bottom head.',
    refSurface: 'snareSide',
    side: 'outside',
    distance: { min: 30, max: 80 },
    bandProv: ill('"just below rim": no distance is given; 3–8 cm below the snare-side head is the lab’s drawing of it'),
    radial: { line: 'edge', min: -60, max: 40, prov: ill('near the bottom rim: −6 to +4 cm from the edge is the lab’s drawing of it') },
    requires: { micTypeIds: DYN_TOP },
    aimAt: { surface: 'snareSide', r: R, prov: ill('aimed up at the snare-side head and the wires') },
    drawn: { side: { u0: 100, u1: 222, v0: DEPTH + 30, v1: DEPTH + 80 }, top: arc(R - 60, R + 40) },
    start: poseAt(TH, 170, DEPTH + 55, { x: 90 * Math.cos(TH * DEG), y: DEPTH, z: 90 * Math.sin(TH * DEG) }),
    tendency: 'More of the wires’ buzz — the “fizz” — and less of the stick. A second perspective to blend, not a whole snare on its own.',
    checks: ['Clear of the wires, the strainer, the stand and the player’s feet', 'Both polarity states with the top mic, in mono'],
  },
  {
    id: 'bottom.clip',
    label: 'Clamped to the bottom rim',
    band: 'Start with the mic clamped to the bottom rim, about 3–8 cm (1–3 in) below the snare-side head, angled up at it.',
    kind: 'sourced',
    src: 'SN-904-2019',
    quote: 'Use of a second e 904 for picking up the bottom of the drumskin and the snares.',
    refSurface: 'snareSide',
    side: 'outside',
    distance: { min: 30, max: 80 },
    bandProv: ill('no distance is given for the bottom clip; 3–8 cm is the lab’s drawing of it'),
    radial: { line: 'edge', min: -60, max: 20, prov: ill('a clamp holds the mic just in under the head') },
    requires: { micTypeIds: ['clipDynCard', 'rimCondenser'] },
    aimAt: { surface: 'snareSide', r: R, prov: ill('aimed up at the snare-side head and the wires') },
    drawn: { side: { u0: 100, u1: 200, v0: DEPTH + 30, v1: DEPTH + 80 }, top: arc(R - 60, R + 20) },
    start: poseTilted(TH, 160, DEPTH + 40, 45, true),
    tendency: 'The wires and the snare-side head, close and out of the way. Blend it under the top mic and check the pair in mono.',
    checks: ['The clamp clear of the strainer and the wires', 'Both polarity states with the top mic, in mono'],
  },
];

/** The rims a clamp can grip: the batter hoop's top edge and the bottom hoop's. */
export const SNARE_RIMS = [
  { id: 'rim.top', label: 'the top rim', c: { x: 0, y: -H_UP, z: 0 }, axis: { x: 0, y: 1, z: 0 }, r: HOOP.rOut },
  { id: 'rim.bottom', label: 'the bottom rim', c: { x: 0, y: DEPTH + H_UP, z: 0 }, axis: { x: 0, y: 1, z: 0 }, r: HOOP.rOut },
];

/** The aim a pose points along (for tests). */
export const aimOf = (p: MicPose) => aimVec(p.az, p.el);
