/**
 * M03 RACK AND FLOOR TOMS — the technical truth (charter §2 layer 1). Source
 * keys point into docs/labs/miking/toms/SOURCES.md (kit/ and snare/ for
 * shared facts); the geometry follows toms/GEOMETRY_PROPOSAL.md.
 *
 * LESSON FRAME = the KIT frame (kit/GEOMETRY_PROPOSAL.md §1): origin the
 * kick's batter-head centre, +x toward the audience, +y DOWN, +z the
 * drummer's right — the lesson covers three drums, so it keeps the kit's
 * own frame and reads every drum from the shared kit.
 *
 * THREE SETUPS (the variants): the RACK PAIR (10 and 12 in, both heads on),
 * the FLOOR TOM (16 in, both heads), and the floor tom with its BOTTOM HEAD
 * OFF — a change to the instrument, only with the player's agreement (toms
 * L13, L39). Rack-tom heights, tilt, the mount and the floor tom's legs are
 * drawing defaults (proposal §2, §9); sizes are sourced.
 */
import type { Dim, DocumentedZone, MicPose, Provenance, Vec3 } from '../../engine/model/types.ts';
import { frameOf, hoopRadii, pointOn, type PlacedDrum } from '../shared/drums/drumSpec.ts';
import { KIT_DRUMS, KIT_FLOOR_Y } from '../shared/kitPlanModel.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
const dd = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });
const DEG = Math.PI / 180;

export const TOM1: PlacedDrum = KIT_DRUMS.tom1;
export const TOM2: PlacedDrum = KIT_DRUMS.tom2;
export const FLOOR: PlacedDrum = KIT_DRUMS.floor;
export const F1 = frameOf(TOM1);
export const F2 = frameOf(TOM2);
export const FF = frameOf(FLOOR);
export const H_UP = TOM2.spec.hoop.above.mm;

export const TOM_DIMS = {
  yFloor: dd(KIT_FLOOR_Y, 'the floor line (the kit’s heights above it)'),
  headClear: dd(20, 'tom head motion and the stick tip above the head'),
  resoClear: dd(10, 'resonant-head motion'),
  cymbalClear: dd(60, 'cymbal swing'),
  stickUp: dd(400, 'how high the sticks travel above a tom'),
  stickOut: dd(60, 'how far a rim hit reaches past a head’s edge'),
  legBox: dd(600, 'the player’s right leg beside the floor tom (height)'),
} as const;

/** The drummer-facing half of each tom: plan angles centred on the throne
 *  direction ±90° (proposal §6 ko.tom.stick, ILLUSTRATIVE). */
export function stickSector(d: PlacedDrum): { a0: number; a1: number } {
  const dir = Math.atan2(-110 - d.c.z, -770 - d.c.x) / DEG; // toward the throne
  return { a0: dir - 90, a1: dir + 90 };
}

/** A pose whose FRONT is at p, aimed at the target point (both in K). */
export function poseToward(p: Vec3, target: Vec3): MicPose {
  const d = { x: target.x - p.x, y: target.y - p.y, z: target.z - p.z };
  const l = Math.hypot(d.x, d.y, d.z);
  const u = { x: d.x / l, y: d.y / l, z: d.z / l };
  return { p, el: -Math.asin(u.y) / DEG, az: Math.atan2(u.z, -u.x) / DEG };
}

/** A point at plan angle θ (the drum's own frame), radius r, height h above
 *  its batter head (along its head normal). */
export const above = (d: PlacedDrum, r: number, thetaDeg: number, h: number) => pointOn(frameOf(d), r, thetaDeg, -h);

/* ── RECOMMENDED STARTING POINTS (lesson table L23–L39; corrections T-01…).
 *  Learner-facing: label, band, tendency, checks. The rest is the internal
 *  record (owner ruling 2026-10-04). ── */
const DYN = ['tomDynSuper', 'smallDynCard'];
const edge = ill('"over the tom": the lab counts ±4 cm about the head’s edge');
const R2 = TOM2.spec.d.mm / 2;
const R1 = TOM1.spec.d.mm / 2;
const RF = FLOOR.spec.d.mm / 2;
const TOP_SRC = { kind: 'sourced' as const, src: 'S-B56A-UG', quote: 'One mic on each tom, or between each pair of toms, 2.5 to 7.5 cm (1 to 3 in.) above drum heads. Aim each microphone at top drum heads.' };

/** A tilted-tom clip pose: the front at (r, θ, h), the axis `deg` from the
 *  head's inward normal, leaning in toward the drum's centre. */
function tiltedToward(d: PlacedDrum, r: number, thetaDeg: number, h: number, deg: number): MicPose {
  const f = frameOf(d);
  const p = above(d, r, thetaDeg, h);
  // Toward the centre in the head plane, and "down" = along the axis.
  const inward = pointOn(f, r - Math.tan(deg * DEG) * h, thetaDeg, 0);
  return poseToward(p, inward);
}

export const TOM_ZONES: DocumentedZone[] = [
  {
    id: 'tom2.top',
    label: 'Over the 12 in tom, near its rim',
    band: 'Start about 2.5–7.5 cm (1–3 in) above the head, over its edge, aimed at the head.',
    kind: 'sourced',
    src: 'S-B56A-UG',
    quote: TOP_SRC.quote,
    refSurface: 'tom2',
    side: 'outside',
    distance: { min: 25, max: 75 },
    radial: { line: 'tom2Edge', min: -40, max: 40, prov: edge },
    requires: { variants: ['rack'], micTypeIds: DYN },
    aimAt: { surface: 'tom2', r: R2, prov: TOP_SRC },
    start: poseToward(above(TOM2, R2 + 8, 15, 50), pointOn(F2, R2 - 75, 15, 0)),
    tendency: 'A full, balanced tom with the stick’s attack. Toward the rim tends to bring more attack and ring; toward the centre more low end — a tendency to check on this drum.',
    checks: ['The sticks’ path over the toms, and the crash above', 'Mount security on the hardest strokes', 'Spill from the other toms and the snare'],
  },
  {
    id: 'tom1.top',
    label: 'Over the 10 in tom, near its rim',
    band: 'Start about 2.5–7.5 cm (1–3 in) above the head, over its edge, aimed at the head.',
    kind: 'sourced',
    src: 'S-B56A-UG',
    quote: TOP_SRC.quote,
    refSurface: 'tom1',
    side: 'outside',
    distance: { min: 25, max: 75 },
    radial: { line: 'tom1Edge', min: -40, max: 40, prov: edge },
    requires: { variants: ['rack'], micTypeIds: DYN },
    aimAt: { surface: 'tom1', r: R1, prov: TOP_SRC },
    start: poseToward(above(TOM1, R1 + 8, -15, 50), pointOn(F1, R1 - 65, -15, 0)),
    tendency: 'The small tom on its own channel: its attack and ring, with the crash and the hi-hat side of the kit nearby.',
    checks: ['The sticks’ path and the crash above', 'Hi-hat and snare spill'],
  },
  {
    id: 'rack.shared',
    label: 'Between the two rack toms (one mic for both)',
    band: 'Start about 2.5–7.5 cm (1–3 in) above the heads, directly between the two toms, aimed down between them.',
    kind: 'sourced',
    src: 'S-B56A-UG',
    quote: TOP_SRC.quote,
    refSurface: 'tom2',
    side: 'outside',
    distance: { min: 25, max: 75 },
    box: { min: { x: 40, y: -2000, z: -185 }, max: { x: 280, y: 2000, z: -85 }, prov: ill('"between each pair of toms": the gap between the two hoops, ±5 cm, is the lab’s drawing of it') },
    requires: { variants: ['rack'], micTypeIds: DYN },
    aim: { maxOffAxis: 60, prov: ill('aimed down between the heads from the audience side: within 60° of the heads’ straight-on line is the lab’s reading') },
    // Over the gap, on the audience side of both toms' stick paths: 5 cm
    // above the 12 in head's plane ((p − c)·n = 50 at x = 260, z = −132),
    // tilted 50° down toward the player so its boom reaches back over the
    // kick and its stand lands in front of the kick's front head.
    start: { p: { x: 260, y: TOM2.c.y - (50 + (260 - TOM2.c.x) * Math.sin(15 * DEG)) / Math.cos(15 * DEG), z: -132 }, az: 0, el: -50 },
    tendency: 'Both toms in one perspective — their balance is set by where the mic sits, not by a fader later. A wider pattern covers both more evenly.',
    checks: ['Both toms at useful, even levels', 'Snare and cymbal spill', 'The sticks’ path over both toms'],
  },
  {
    id: 'tom2.clip',
    label: 'Clamped to the 12 in tom’s rim',
    band: 'Start with the mic clamped to the rim, about 3–5 cm (1.2–2 in) above the head, angled 30–60° from the head’s straight-on line.',
    kind: 'sourced',
    src: 'SN-904-2019',
    quote: 'Position the microphone on the drum so that it is 3 to 5cm above the drumhead. … The most balanced results are obtained at an angle of 30 to 60°.',
    refSurface: 'tom2',
    side: 'outside',
    distance: { min: 30, max: 50 },
    radial: { line: 'tom2Edge', min: -60, max: 20, prov: ill('a clamp holds the mic just in over the head') },
    requires: { variants: ['rack'], micTypeIds: ['clipDynCard'] },
    aim: { maxOffAxis: 60, minOffAxis: 30, prov: { kind: 'sourced', src: 'SN-904-2019', quote: 'an angle of 30 to 60° (from the head normal, read from the figure)' } },
    start: tiltedToward(TOM2, R2 - 15, 15, 40, 45),
    tendency: 'A low, discreet close view. The angle trades fundamental against overtones — try both ends of the range.',
    checks: ['The clamp fits the hoop and holds', 'The sticks’ path', 'The angle, one change at a time'],
  },
  {
    id: 'tom2.cond',
    label: 'Condenser on the rim, angled at the head',
    band: 'Start the condenser’s head about 4–7.5 cm (1.5–3 in) above the drumhead, angled toward it — never flat to it.',
    kind: 'sourced',
    src: 'EW-DM20',
    quote: 'It is suggested that the microphone head be positioned between 1.5 inches and 3 inches above the drumhead. (Keep in mind that the microphone head should never be placed parallel to the drumhead, but should always be at an angle to the drumhead.)',
    refSurface: 'tom2',
    side: 'outside',
    distance: { min: 38.1, max: 76.2 },
    radial: { line: 'tom2Edge', min: -80, max: 20, prov: ill('a rim mount holds the head in over the drum') },
    requires: { variants: ['rack'], micTypeIds: ['rimCondenser'] },
    aim: { maxOffAxis: 80, minOffAxis: 10, prov: ill('"never parallel": 10–80° from the head’s straight-on line is the lab’s reading') },
    aimAt: { surface: 'tom2', r: R2, prov: ill('"angled toward the drumhead"') },
    start: tiltedToward(TOM2, R2 - 30, 15, 55, 45),
    tendency: 'Detail and a discreet mount, with more cymbal in it if it hears them — condensers vary: check its rating and its pattern.',
    checks: ['Phantom power for this channel', 'The gooseneck within its bend limit', 'Cymbal spill'],
  },
  {
    id: 'floor.top',
    label: 'Over the floor tom, near its rim',
    band: 'Start about 2.5–7.5 cm (1–3 in) above the head, over its edge, aimed at the head.',
    kind: 'sourced',
    src: 'S-B56A-UG',
    quote: TOP_SRC.quote,
    refSurface: 'floor',
    side: 'outside',
    distance: { min: 25, max: 75 },
    radial: { line: 'floorEdge', min: -40, max: 40, prov: edge },
    requires: { variants: ['floor', 'open'], micTypeIds: DYN },
    aimAt: { surface: 'floor', r: RF, prov: TOP_SRC },
    start: poseToward(above(FLOOR, RF + 8, 25, 50), pointOn(FF, RF - 95, 25, 0)),
    tendency: 'The floor tom’s weight with its attack. Toward the centre tends to bring more low end; toward the rim more attack — check on this drum.',
    checks: ['The sticks’ path, and the player’s right leg beside the drum', 'The ride above', 'Mount security'],
  },
  {
    id: 'floor.clip',
    label: 'Clamped to the floor tom’s rim',
    band: 'Start with the mic clamped to the rim, about 3–5 cm (1.2–2 in) above the head, angled 30–60° from the head’s straight-on line.',
    kind: 'sourced',
    src: 'SN-904-2019',
    quote: 'Position the microphone on the drum so that it is 3 to 5cm above the drumhead. … The most balanced results are obtained at an angle of 30 to 60°.',
    refSurface: 'floor',
    side: 'outside',
    distance: { min: 30, max: 50 },
    radial: { line: 'floorEdge', min: -60, max: 20, prov: ill('a clamp holds the mic just in over the head') },
    requires: { variants: ['floor', 'open'], micTypeIds: ['clipDynCard'] },
    aim: { maxOffAxis: 60, minOffAxis: 30, prov: { kind: 'sourced', src: 'SN-904-2019', quote: 'an angle of 30 to 60° (from the head normal)' } },
    start: tiltedToward(FLOOR, RF - 15, 25, 40, 45),
    tendency: 'A low-profile close view, clear of stands. The angle trades fundamental against overtones.',
    checks: ['The clamp fits the hoop', 'The sticks’ path and the player’s leg'],
  },
  {
    id: 'floor.bottom',
    label: 'Below the floor tom, on its bottom hoop',
    band: 'Start with a rim-mounted condenser on the bottom hoop, about 3–8 cm (1–3 in) below the resonant head, aimed up at it.',
    kind: 'sourced',
    src: 'EW-DM20',
    quote: 'The RM1 can also be used on the top or bottom of a tom or snare.',
    refSurface: 'floorReso',
    side: 'outside',
    distance: { min: 30, max: 80 },
    bandProv: ill('no distance is given for a bottom mount; 3–8 cm below the head is the lab’s drawing of it'),
    radial: { line: 'floorEdge', min: -60, max: 20, prov: ill('a rim mount holds the mic just in under the head') },
    requires: { variants: ['floor'], micTypeIds: ['rimCondenser'] },
    aimAt: { surface: 'floorReso', r: RF, prov: ill('aimed up at the resonant head') },
    start: tiltedToward({ ...FLOOR, c: pointOn(FF, 0, 0, FF.depth), tiltDeg: 0 }, RF - 20, 30, -45, -40),
    tendency: 'The resonant head’s ring — a different perspective from a snare’s bottom mic, which hears wires. A choice for the whole kit, not a requirement.',
    checks: ['Clear of the legs, the floor and the player’s feet', 'Both polarity states with the top mic, in mono'],
  },
  {
    id: 'floor.inside',
    label: 'Inside the floor tom, its bottom head off',
    band: 'With the bottom head removed (only with the player’s agreement), a mic inside the shell pointing up at the batter head. No distance is suggested: start where it fits, and move it.',
    kind: 'sourced',
    src: 'S-B56A-UG',
    quote: 'On double head toms, you can also remove bottom head and place a mic inside pointing up toward top drum head.',
    refSurface: 'floor',
    side: 'inside',
    distance: { min: -(FLOOR.spec.depth.mm - 40), max: -40 },
    bandProv: ill('the source gives no distance: anywhere inside, 4 cm clear of each end, is the lab’s drawing'),
    requires: { variants: ['open'], micTypeIds: DYN },
    aimAt: { surface: 'floor', r: RF - 20, prov: { kind: 'sourced', src: 'S-B56A-UG', quote: 'pointing up toward top drum head' } },
    start: { p: pointOn(FF, 40, 30, 170), az: 0, el: 89 },
    tendency: 'The most isolation from the rest of the kit (inside, the shell shields the mic) — and a different drum: with its bottom head off, it rings and sounds differently.',
    checks: ['The player agreed to run the drum without its bottom head', 'The boom clear of the legs and the floor', 'Inside the shell, clear of the batter head'],
  },
];

export const TOM_RIMS = [
  { id: 'rim.tom1', label: 'the 10 in rim', ...rim(TOM1, 'top'), variants: ['rack'] },
  { id: 'rim.tom2', label: 'the 12 in rim', ...rim(TOM2, 'top'), variants: ['rack'] },
  { id: 'rim.floor', label: 'the floor tom rim', ...rim(FLOOR, 'top'), variants: ['floor', 'open'] },
  { id: 'rim.floorBottom', label: 'the floor tom’s bottom rim', ...rim(FLOOR, 'bottom'), variants: ['floor'] },
];
function rim(d: PlacedDrum, which: 'top' | 'bottom') {
  const f = frameOf(d);
  const { rOut } = hoopRadii(d.spec);
  const s = which === 'top' ? -d.spec.hoop.above.mm : f.depth + d.spec.hoop.above.mm;
  return { c: { x: f.c.x + s * f.axis.x, y: f.c.y + s * f.axis.y, z: f.c.z + s * f.axis.z }, axis: f.axis, r: rOut };
}
