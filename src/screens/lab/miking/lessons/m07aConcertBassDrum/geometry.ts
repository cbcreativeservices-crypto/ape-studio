/**
 * M07a CONCERT BASS DRUM — where things are (charter §2 layer 2). Anchors
 * and solids are BUILT from model.ts and the concert spec; the art, the
 * labels, the hit areas and the collision read the same numbers.
 */
import type { InstrumentModel, Part, Provenance, Vec3 } from '../../engine/model/types.ts';
import { CBD_DIMS, D, FLOOR_Y, MID_X, R, SPEC } from './model.ts';

const DEG = Math.PI / 180;
const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const DRAW = ill('a drawing default (concert_bass_drum/GEOMETRY_PROPOSAL.md); no source gives it');

const H = SPEC.hoop;
export const HOOP = { rIn: R + H.gap.mm, rOut: R + H.gap.mm + H.t.mm, h: H.h.mm, inset: H.inset.mm };
/** Hoops along x: the playing hoop stands past the head toward the player. */
export const HOOP_X = { playing: [-H.inset.mm, H.h.mm - H.inset.mm] as const, far: [-D - (H.h.mm - H.inset.mm), -D + H.inset.mm] as const };

const SZ = CBD_DIMS.standHalfZ.mm;
const SX = CBD_DIMS.standHalfX.mm;
/** The tilting stand: uprights at the pivots (either side of the shell, at
 *  the shell's middle), a base frame, four casters (words sourced; sizes
 *  drawing defaults). */
export const STAND = { z: SZ, x0: MID_X - SX, x1: MID_X + SX, railY: FLOOR_Y - 62, casterR: 26 };

/** The mallet as drawn (illustrative): its head on the playing head, a little
 *  below the centre and toward the player's side (−z), the grip by the player.
 *  A concert bass-drum mallet is ≈ 380–430 mm overall (head Ø ≈ 85): drawn
 *  400 mm from the head's centre to the grip end (it was 590 and its end met
 *  the suggested mic's stand: clash sweep 2026-10-10). */
export const MALLET = { head: { x: 44, y: 40, z: -230 }, grip: { x: 393, y: -143, z: -298 }, headR: 42 };
/** Its swing, about the player's forearm (ILLUSTRATIVE). */
const PIVOT: Vec3 = { x: 600, y: -170, z: -230 };
const STRIKE_ANG = Math.atan2(40 - PIVOT.y, 0 - PIVOT.x);

export const CBD_ANCHORS = {
  'cbd.playing.center': { x: 0, y: 0, z: 0 },
  'cbd.far.center': { x: -D, y: 0, z: 0 },
  'cbd.strike': { x: 0, y: 40, z: -230 },
  'cbd.pivotL': { x: MID_X, y: 0, z: -SZ },
  'cbd.pivotR': { x: MID_X, y: 0, z: SZ },
} as const satisfies Record<string, Vec3>;

const casters = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => ({ x: MID_X + sx * SX, z: sz * SZ })));

const parts: Part[] = [
  { id: 'cbd.playing', label: 'playing head', short: 'playing head', role: 'The head the player strikes, on the player’s side. Strike area, mallet and damping are the player’s choices.', moving: true, clearance: CBD_DIMS.headClear, prov: SPEC.d.prov, solid: { kind: 'slab', c: { x: 0, y: 0, z: 0 }, r: R, x0: -0.5, x1: 0.5 } },
  { id: 'cbd.far', label: 'far head', short: 'far head', role: 'The second head, on the far side. The air inside drives it; the player may damp it too.', moving: true, clearance: CBD_DIMS.headClear, prov: SPEC.d.prov, solid: { kind: 'slab', c: { x: 0, y: 0, z: 0 }, r: R, x0: -D - 0.5, x1: -D + 0.5 } },
  { id: 'cbd.shell', label: 'shell', short: 'shell', role: 'The wooden cylinder between the heads: 36 in across and 16 in deep here. With the air inside, it shapes the drum’s long, low ring.', prov: SPEC.depth.prov, solid: { kind: 'tube', c: { x: 0, y: 0, z: 0 }, rIn: R - SPEC.tShell.mm, rOut: R, x0: -D, x1: 0 } },
  { id: 'cbd.hoopP', label: 'playing-side hoop', short: 'hoop', role: 'The hoop holding the playing head. Keep stands and clamps off it.', prov: DRAW, solid: { kind: 'tube', c: { x: 0, y: 0, z: 0 }, rIn: HOOP.rIn, rOut: HOOP.rOut, x0: HOOP_X.playing[0], x1: HOOP_X.playing[1] } },
  { id: 'cbd.hoopF', label: 'far-side hoop', short: 'hoop', role: 'The hoop holding the far head.', prov: DRAW, listIn: [], solid: { kind: 'tube', c: { x: 0, y: 0, z: 0 }, rIn: HOOP.rIn, rOut: HOOP.rOut, x0: HOOP_X.far[0], x1: HOOP_X.far[1] } },
  { id: 'cbd.rods', label: 'tension rods', short: 'rods', role: 'T-handled rods round both heads set their tension. Tuning is the player’s — never re-tune a drum for a mic.', prov: DRAW, solid: { kind: 'tube', c: { x: 0, y: 0, z: 0 }, rIn: R, rOut: R + 44, x0: -D + 14, x1: -14 } },
  { id: 'cbd.stand', label: 'tilting stand', short: 'stand', role: 'The drum hangs on two pivots in a frame on four locking casters; the playing angle is set and locked with wing bolts. Only the percussion crew moves, tilts or unlocks it — never to suit a mic.', prov: { kind: 'sourced', src: 'YMH-CB9-STAND', quote: 'lock all four caster brakes on the stand base casters' }, solid: { kind: 'capsule', a: { x: MID_X, y: 0, z: -SZ }, b: { x: MID_X, y: STAND.railY, z: -SZ }, r: 18 } },
  { id: 'cbd.standR', label: 'tilting stand (far upright)', short: 'stand', role: 'The stand’s other upright and pivot.', prov: DRAW, listIn: [], solid: { kind: 'capsule', a: { x: MID_X, y: 0, z: SZ }, b: { x: MID_X, y: STAND.railY, z: SZ }, r: 18 } },
  ...[-1, 1].map<Part>((sz, i) => ({ id: `cbd.rail${i}`, label: 'stand base', short: 'stand', role: 'The stand’s base rail.', prov: DRAW, listIn: [], solid: { kind: 'box', min: { x: STAND.x0, y: STAND.railY - 16, z: sz * SZ - 22 }, max: { x: STAND.x1, y: STAND.railY + 16, z: sz * SZ + 22 } } })),
  ...casters.map<Part>((c, i) => ({ id: `cbd.caster${i}`, label: 'caster (with brake)', short: 'caster', role: 'A locking caster: all four brakes are locked before anyone plays.', prov: { kind: 'sourced', src: 'YMH-CB9-STAND', quote: 'lock all four caster brakes' }, listIn: [], solid: { kind: 'box', min: { x: c.x - 30, y: FLOOR_Y - 62, z: c.z - 30 }, max: { x: c.x + 30, y: FLOOR_Y, z: c.z + 30 } } })),
  { id: 'cbd.mallet', label: 'mallet', short: 'mallet', role: 'A large felt-headed mallet. The player may change mallets, play rolls, and damp either head with the other hand.', moving: true, prov: ill('mallet size and position: drawing defaults') },
];

export const CBD_MODEL: InstrumentModel = {
  id: 'concertBassDrum36x16',
  name: '36 × 16 in concert bass drum',
  parts,
  regions: [
    { id: 'r.strike', partId: 'cbd.playing', label: 'mallet strike', anchor: CBD_ANCHORS['cbd.strike'], prov: ill('the strike area is the player’s choice; drawn in the middle region'), note: 'The mallet strikes the playing head: the transient — the attack — starts here.' },
    { id: 'r.far', partId: 'cbd.far', label: 'far head', anchor: CBD_ANCHORS['cbd.far.center'], prov: SPEC.d.prov, note: 'The air inside drives the far head: it rings with the playing head and radiates on the far side.' },
    { id: 'r.shell', partId: 'cbd.shell', label: 'shell', anchor: { x: MID_X, y: -R, z: 0 }, prov: SPEC.depth.prov, note: 'Heads, air and shell ring together; tuning and damping shape how long.' },
  ],
  surfaces: [
    { id: 'playing', partId: 'cbd.playing', label: 'the playing head', point: { x: 0, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 }, minus: { words: 'inside the drum from', key: 'INSIDE FROM' } },
    { id: 'far', partId: 'cbd.far', label: 'the far head', point: { x: -D, y: 0, z: 0 }, normal: { x: -1, y: 0, z: 0 }, minus: { words: 'inside the drum from', key: 'INSIDE FROM' } },
  ],
  lines: [{ id: 'axis', label: 'the drum’s axis', point: { x: 0, y: 0, z: 0 }, dir: { x: 1, y: 0, z: 0 } }],
  envelopes: [
    {
      id: 'env.mallet',
      label: 'the mallet’s swing',
      shape: { kind: 'sweep', pivot: PIVOT, r0: 380, r1: Math.hypot(PIVOT.x, 40 - PIVOT.y) + MALLET.headR, a0: STRIKE_ANG, a1: STRIKE_ANG + 50 * DEG, halfW: 110 },
      prov: ill('the player’s mallet arc: drawn from the player’s side of the playing head; no source gives it'),
      clearance: 15,
    },
    {
      id: 'env.damp',
      label: 'the damping hand',
      shape: { kind: 'box', min: { x: 0, y: -R, z: -R }, max: { x: 170, y: R * 0.4, z: -130 } },
      prov: ill('the player’s other hand on the playing head (both heads may be damped); no source gives the reach'),
    },
    {
      id: 'env.dampFar',
      label: 'the damping hand (far head)',
      shape: { kind: 'box', min: { x: -D - 170, y: -R, z: -R }, max: { x: -D, y: R * 0.4, z: -130 } },
      prov: ill('the player may reach round to damp the far head; no source gives the reach'),
    },
    {
      id: 'env.player',
      label: 'the player',
      shape: { kind: 'box', min: { x: 480, y: FLOOR_Y - 1750, z: -760 }, max: { x: 940, y: FLOOR_Y, z: -150 } },
      prov: ill('the player beside the playing head; no source gives a position'),
    },
  ],
  variants: [{ id: 'set', label: 'AS SET UP', blurb: 'Hanging in its tilting stand, the heads vertical, the brakes and wing bolts locked — as the percussion crew set it. The lab never moves the drum.', phrase: 'its stand locked' }],
  defaultVariant: 'set',
  views: {
    side: { u0: -760, u1: 980, v0: -820, v1: FLOOR_Y + 30 },
    top: { u0: -760, u1: 980, v0: -820, v1: 1150 },
  },
  yFloor: CBD_DIMS.centreH,
  interior: { x0: -D, x1: 0, rIn: R - SPEC.tShell.mm, c: { x: 0, y: 0, z: 0 } },
  ports: { set: null },
};
