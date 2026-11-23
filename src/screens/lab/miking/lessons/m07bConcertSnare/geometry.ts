/**
 * M07b CONCERT SNARE — where things are (charter §2 layer 2). The drum's
 * solids come from the shared family (drumSolids); the stand, the snares and
 * the player's spaces are built here from model.ts. The art and the labels
 * read only these anchors.
 */
import type { InstrumentModel, Part, Provenance, Vec3 } from '../../engine/model/types.ts';
import { drumSolids, type PlacedDrum } from '../shared/drums/drumSpec.ts';
import { CSN_DIMS, D, FLOOR_Y, HOOP, R, RIM_Y, SPEC } from './model.ts';

const DEG = Math.PI / 180;
const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const DRAW = ill('a drawing default (concert_snare/GEOMETRY_PROPOSAL.md); no source gives it');

export const DRUM: PlacedDrum = { spec: SPEC, c: { x: 0, y: 0, z: 0 }, tiltDeg: 0 };
const S = drumSolids(DRUM);
const W = SPEC.wires!;

/** The stand (a concert-height tripod with a basket): drawing defaults. */
export const STAND = {
  hubY: D + SPEC.hoop.above.mm + 50,
  basketY: D + SPEC.hoop.above.mm,
  legsHubY: FLOOR_Y - 150,
  legR: 240,
  /** Plan angles of the basket arms and the legs (from +x toward +z). */
  armsDeg: [90, 210, 330] as const,
  legsDeg: [90, 210, 330] as const,
};

/** The snares under the snare-side head: on, or released (dropped). */
export function snaresY(on: boolean): number {
  return D + 2.5 + (on ? 0 : W.dropOff.mm);
}

export const CSN_ANCHORS = {
  'csn.batter.center': { x: 0, y: 0, z: 0 },
  'csn.snareHead.center': { x: 0, y: D, z: 0 },
  /** Where the sticks usually land in the drawing: a little toward the
   *  player from the centre (a drawing default; the lesson gives none). */
  'csn.stick.strike': { x: -45, y: 0, z: 0 },
  'csn.strainer': { x: -(R + 16), y: D * 0.5, z: 0 },
} as const satisfies Record<string, Vec3>;

/**
 * THE STICKS, posed in 3D so the side and top views are two views of the
 * same two sticks (owner 2026-11-22, on the steep stick of the parts page,
 * "drumstickhasunrealisticangle": "It should look like normal stick tech.
 * usage"). Matched grip on a concert snare, the player standing on the −x
 * side: each hand holds its 406 mm (16 in) stick about a third of the way up
 * from the butt (125 mm of butt behind the hand, 281 mm to the bead). From
 * above the two sticks make a 64° V pointing at the playing spot, the beads
 * side by side 36 mm apart. The LEFT stick (−z) is at the stroke: its bead on
 * the head a little toward the player from the centre, the stick 12° to the
 * head, the hand about 6 cm above the head. The RIGHT stick (+z) is raised
 * the way a wrist raises it: the same hand position as its stroke (the mirror
 * of the left), the stick turned about the hand until the tip is 30° up.
 * Drawing defaults (no source gives a pose).
 */
export const CSN_STICK = {
  len: 406,
  /** Butt behind the hand (mm). */
  butt: 125,
  /** Stroke angle to the head, and the raised stick's tip angle (°). */
  strokeDeg: 12,
  raisedDeg: 30,
  /** Each stick's angle out from the −x axis, from above (the V is twice it). */
  planDeg: 32,
  /** Where the striking bead lands, and half the gap between the beads. */
  bead: { x: -50, y: -5, z: 18 },
} as const;

export type StickPose3 = { butt: Vec3; hand: Vec3; bead: Vec3 };

/** One stick, for the hand on side `zs` (−1 left, +1 right), its tip `deg`
 *  above the horizontal (−strokeDeg is the stroke: the bead on the head).
 *  The hand is where the STROKE puts it, so a raised stick turns about it. */
export function csnStick(zs: -1 | 1, deg: number): StickPose3 {
  const S = CSN_STICK;
  const az = S.planDeg * DEG;
  const e0 = S.strokeDeg * DEG;
  const front = S.len - S.butt;
  const bead0 = { x: S.bead.x, y: S.bead.y, z: zs * S.bead.z };
  // From the hand toward the bead at the stroke: forward (+x), down (+y), in.
  const hand: Vec3 = { x: bead0.x - front * Math.cos(e0) * Math.cos(az), y: bead0.y - front * Math.sin(e0), z: bead0.z + zs * front * Math.cos(e0) * Math.sin(az) };
  // From the hand toward the tip, the tip `deg` above the horizontal (+y is down).
  const e = deg * DEG;
  const t = { x: Math.cos(e) * Math.cos(az), y: -Math.sin(e), z: -zs * Math.cos(e) * Math.sin(az) };
  const bead: Vec3 = { x: hand.x + front * t.x, y: hand.y + front * t.y, z: hand.z + front * t.z };
  const butt: Vec3 = { x: hand.x - S.butt * t.x, y: hand.y - S.butt * t.y, z: hand.z - S.butt * t.z };
  return { butt, hand, bead };
}

/** As drawn: [0] the left stick at the stroke, [1] the right stick raised. */
export const CSN_STICKS: readonly StickPose3[] = [csnStick(-1, -CSN_STICK.strokeDeg), csnStick(1, CSN_STICK.raisedDeg)];

const legEnd = (deg: number): Vec3 =>({ x: Math.cos(deg * DEG) * STAND.legR, y: FLOOR_Y, z: Math.sin(deg * DEG) * STAND.legR });
const armEnd = (deg: number): Vec3 => ({ x: Math.cos(deg * DEG) * HOOP.rOut, y: STAND.basketY, z: Math.sin(deg * DEG) * HOOP.rOut });

const parts: Part[] = [
  { id: 'csn.batter', label: 'batter head', short: 'batter', role: 'The head the sticks strike, on top. Rolls, accents and the softest strokes all start here.', moving: true, clearance: CSN_DIMS.headClear, prov: SPEC.d.prov, solid: S.batter },
  { id: 'csn.snareHead', label: 'snare-side head', short: 'snare head', role: 'The thin bottom head. The air inside drives it against the snares, which is where the buzz comes from.', moving: true, clearance: CSN_DIMS.headClear, prov: SPEC.d.prov, solid: S.reso! },
  { id: 'csn.shell', label: 'shell', short: 'shell', role: 'The cylinder between the heads. With the heads, the tuning and any muffling, it shapes the drum’s ring.', prov: SPEC.depth.prov, solid: S.shell },
  { id: 'csn.hoop', label: 'top rim (hoop)', short: 'rim', role: 'The rim holding the batter head, here a steel triple-flange hoop. Close mics are placed relative to it — and must stay off it.', prov: SPEC.hoop.t.prov, solid: S.hoopTop },
  { id: 'csn.hoopB', label: 'bottom rim (hoop)', short: 'bottom rim', role: 'The rim holding the snare-side head. A bottom mic sits just below it.', prov: SPEC.hoop.t.prov, solid: S.hoopBottom! },
  { id: 'csn.lugs', label: 'lugs and tension rods (10 per head)', short: 'lugs', role: 'Tension rods tune the drum — ten per head on this one. Tuning is the player’s choice: ask, and do not re-tune a player’s drum yourself to suit a mic.', prov: SPEC.rods.n.prov, solid: S.lugs },
  {
    id: 'csn.snaresOn',
    label: 'snares (on)',
    short: 'snares',
    role: 'Strands of cable, wire or gut pressed against the snare-side head (fourteen drawn here); the number and material vary by drum. Their response is part of the concert snare’s color, not noise.',
    prov: W.strands.prov,
    variants: ['on'],
    solid: { kind: 'box', min: { x: -W.length.mm / 2, y: snaresY(true), z: -W.width.mm / 2 }, max: { x: W.length.mm / 2, y: snaresY(true) + 3.4, z: W.width.mm / 2 } },
  },
  {
    id: 'csn.snaresOff',
    label: 'snares (off)',
    short: 'snares',
    role: 'Released by the throw-off: the snares hang just clear of the head and the drum rings like a small tom. Players switch them during a piece.',
    prov: W.strands.prov,
    variants: ['off'],
    solid: { kind: 'box', min: { x: -W.length.mm / 2, y: snaresY(false), z: -W.width.mm / 2 }, max: { x: W.length.mm / 2, y: snaresY(false) + 3.4, z: W.width.mm / 2 } },
  },
  { id: 'csn.strainer', label: 'throw-off (strainer)', short: 'throw-off', role: 'The lever that puts the snares on or off — on the player’s side here. Keep mics and cables clear of it: the player reaches for it mid-piece.', prov: DRAW, solid: { kind: 'box', min: { x: -(R + 32), y: D * 0.2, z: -16 }, max: { x: -R, y: D * 0.8, z: 16 } } },
  { id: 'csn.butt', label: 'butt plate', short: 'butt', role: 'Where the snares’ other end is fixed, opposite the throw-off.', prov: DRAW, solid: { kind: 'box', min: { x: R, y: D * 0.5, z: -11 }, max: { x: R + 22, y: D * 0.9, z: 11 } } },
  {
    id: 'csn.stand',
    label: 'concert snare stand',
    short: 'stand',
    role: 'A concert-height stand with a basket gripping the bottom rim. Its legs and post take the floor space under the drum.',
    prov: DRAW,
    solid: { kind: 'capsule', a: { x: 0, y: STAND.hubY, z: 0 }, b: { x: 0, y: STAND.legsHubY, z: 0 }, r: 14 },
  },
  ...STAND.legsDeg.map<Part>((deg, i) => ({ id: `csn.leg${i}`, label: 'stand leg', short: 'stand leg', role: 'One of the stand’s three legs.', prov: DRAW, listIn: [], solid: { kind: 'capsule', a: { x: 0, y: STAND.legsHubY, z: 0 }, b: legEnd(deg), r: 10 } })),
  ...STAND.armsDeg.map<Part>((deg, i) => ({ id: `csn.arm${i}`, label: 'basket arm', short: 'basket', role: 'An arm of the basket that grips the bottom rim.', prov: DRAW, listIn: [], solid: { kind: 'capsule', a: { x: 0, y: STAND.hubY, z: 0 }, b: armEnd(deg), r: 6 } })),
];

export const CSN_MODEL: InstrumentModel = {
  id: 'concertSnare14x65',
  name: '14 × 6½ in concert snare drum',
  parts,
  regions: [
    { id: 'r.stick', partId: 'csn.batter', label: 'stick strike', anchor: CSN_ANCHORS['csn.stick.strike'], prov: DRAW, note: 'The sticks strike the batter head: the attack of every stroke and roll starts here.' },
    { id: 'r.snares', partId: 'csn.snareHead', label: 'snares', anchor: CSN_ANCHORS['csn.snareHead.center'], prov: W.strands.prov, note: 'The snare-side head slaps the snares: their buzz radiates mostly downward and out to the sides.', variants: ['on'] },
    { id: 'r.shell', partId: 'csn.shell', label: 'shell', anchor: { x: R, y: D / 2, z: 0 }, prov: SPEC.depth.prov, note: 'Both heads, the air inside and the shell ring together; the shell, tuning and muffling shape how long.' },
  ],
  surfaces: [
    { id: 'batter', partId: 'csn.batter', label: 'the batter head', point: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: -1, z: 0 }, plus: { words: 'above', key: 'ABOVE' }, minus: { words: 'below', key: 'BELOW' } },
    { id: 'rim', partId: 'csn.hoop', label: 'the rim', point: { x: 0, y: RIM_Y, z: 0 }, normal: { x: 0, y: -1, z: 0 }, plus: { words: 'above', key: 'ABOVE' }, minus: { words: 'below', key: 'BELOW' } },
    { id: 'snareHead', partId: 'csn.snareHead', label: 'the snare-side head', point: { x: 0, y: D, z: 0 }, normal: { x: 0, y: 1, z: 0 }, plus: { words: 'below', key: 'BELOW' }, minus: { words: 'above', key: 'ABOVE' } },
  ],
  lines: [
    { id: 'rim', label: 'the rim edge', point: { x: 0, y: 0, z: 0 }, dir: { x: 0, y: 1, z: 0 }, offset: R, words: { plus: 'out from', minus: 'in from', keyPlus: 'OUT FROM RIM', keyMinus: 'IN FROM RIM' } },
  ],
  envelopes: [
    {
      id: 'env.sticks',
      label: 'the sticks’ reach',
      shape: { kind: 'sector', c: { x: 0, y: 0, z: 0 }, r0: 0, r1: CSN_DIMS.stickR.mm, a0: 0.6 * Math.PI, a1: 1.4 * Math.PI, y0: -CSN_DIMS.stickH.mm, y1: 0 },
      prov: CSN_DIMS.stickH.prov,
      clearance: 15,
    },
    // The standing player, matched to the sticks' natural pose (owner
    // 2026-11-22, "normal stick tech. usage"): the hands about 28 cm behind
    // the beads (CSN_STICKS), the forearms running back about a forearm's
    // length to the elbows at the player's sides, the body about 39 cm behind
    // the near rim. (It stood 14 cm behind the rim, full height, when the
    // sticks came down steeply from above the rim.)
    {
      id: 'env.player',
      label: 'the player',
      shape: { kind: 'box', min: { x: -900, y: FLOOR_Y - 1750, z: -320 }, max: { x: -570, y: FLOOR_Y, z: 320 } },
      prov: ill('a standing player behind the drum; no source gives a position'),
    },
    {
      id: 'env.forearms',
      label: 'the player’s forearms and hands',
      shape: { kind: 'box', min: { x: -570, y: -230, z: -320 }, max: { x: -250, y: 30, z: 320 } },
      prov: ill('from the hands on the sticks back to the elbows at the player’s sides; no source gives a position'),
    },
  ],
  variants: [
    { id: 'on', label: 'SNARES ON', blurb: 'The snares pressed against the bottom head: the concert snare’s usual sound.', phrase: 'the snares on' },
    { id: 'off', label: 'SNARES OFF', blurb: 'The throw-off released: the snares hang clear and the drum rings like a small tom. Players switch during a piece.', phrase: 'the snares off' },
  ],
  defaultVariant: 'on',
  views: {
    // The stand runs on below the frame to the floor (drawn, not framed):
    // framing the floor left the drum a speck at phone size.
    side: { u0: -700, u1: 640, v0: -480, v1: 440 },
    top: { u0: -700, u1: 640, v0: -460, v1: 460 },
  },
  yFloor: CSN_DIMS.batterH,
  interior: { x0: 0, x1: D, rIn: R - SPEC.tShell.mm, c: { x: 0, y: 0, z: 0 }, axis: { x: 0, y: 1, z: 0 } },
  ports: { on: null, off: null },
};
