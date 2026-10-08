/**
 * FOLEY PROPS (frame F) — the shared prop models: their sizes, their
 * sounding parts and their KEEP-OUTS (pure; tested). Built once by group 1
 * (lab6-g1) for F03 (props and object handling) and F04 (impacts, liquids
 * and textures). Research: foley_props/GEOMETRY_PROPOSAL.md §1,
 * foley_impacts_liquids/GEOMETRY_PROPOSAL.md §1.
 *
 * NO SOURCE gives a prop's size or a distance to it (F03 L25, F04 L21): every
 * number here is a DRAWING DEFAULT — a common object's size — listed in each
 * lesson's unknowns. Each prop is placed so its SOUNDING PART sits at the
 * origin of frame F (the lessons measure "the source to the capsule").
 *
 * The keep-outs are the safety model (F03 L49 exact: "keep microphones,
 * cables and operators outside door or furniture travel"; F04 L26: "Mark the
 * likely splash footprint with the microphone absent, then set the stand
 * outside it"):
 *   door    the SWING ARC (a quarter of an upright cylinder about the hinge,
 *           radius = the leaf's width) and PINCH ZONES at the hinge and at
 *           the latch edge;
 *   drawer  its travel (a box);
 *   chair   its lift-and-drag path (a box);
 *   basin   the SPLASH ENVELOPE — an ellipse 2.5 × the basin's radius
 *           round it, ILLUSTRATIVE (O-7), and a wet floor under it;
 *   hands   the handling hand's arc (shared arm reach).
 */
import type { Dim, Envelope, Provenance, Vec3 } from '../../../engine/model/types.ts';
import { v3 } from './frameF.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const dd = (mm: number, needed: string): Dim => ({ mm, prov: { kind: 'unknown', needed }, placeholder: true });

export const PROP_DIMS = {
  keyRing: dd(30, 'a key ring’s diameter (30 mm drawn)'),
  key: dd(55, 'a key’s length (55 mm drawn)'),
  keysHeight: dd(1000, 'the keys held at hand level, 1000 mm above the floor (drawn)'),
  paperW: dd(210, 'a sheet of paper, 210 × 297 mm (A4, drawn)'),
  paperL: dd(297, 'a sheet of paper, 210 × 297 mm (A4, drawn)'),
  tableH: dd(750, 'a prop table’s top, 750 mm above the floor (drawn)'),
  doorW: dd(800, 'a Foley door’s leaf, 800 × 2000 mm (drawn)'),
  doorH: dd(2000, 'a Foley door’s leaf, 800 × 2000 mm (drawn)'),
  handleH: dd(1000, 'the door handle 1000 mm above the floor (drawn)'),
  chairSeat: dd(450, 'a chair’s seat, 450 × 450 mm, 450 mm high (drawn)'),
  chairBack: dd(900, 'a chair’s back, 900 mm high (drawn)'),
  blockL: dd(150, 'a padded block, 150 × 100 × 60 mm (drawn)'),
  basinR: dd(200, 'a shallow basin, Ø 400 × 120 mm (drawn)'),
  basinDepth: dd(120, 'a shallow basin, Ø 400 × 120 mm (drawn)'),
  lowTableH: dd(400, 'a stable low table for the basin, 400 mm high (drawn)'),
  splashK: dd(2.5, 'the splash envelope: 2.5 × the basin’s radius, ILLUSTRATIVE (O-7)'),
  boardW: dd(600, 'a fabric-covered board, 600 × 400 mm (drawn)'),
  boardD: dd(400, 'a fabric-covered board, 600 × 400 mm (drawn)'),
} as const;

/* ── THE DOOR on its stand: the leaf closed in the plane x = 0, spanning
 *  z ∈ [0, W] (the latch edge at z = 0, the hinge at z = W), opening toward
 *  the performer (−x). The handle (the origin) is on the latch edge's side. */
export const DOOR = {
  W: PROP_DIMS.doorW.mm,
  H: PROP_DIMS.doorH.mm,
  t: 40,
  /** The handle's offset from the latch edge (drawn). */
  handleZ: 70,
  hinge: (floorY: number): Vec3 => v3(0, floorY - 1000, PROP_DIMS.doorW.mm),
};
/** The door's swing (0 = closed, 1 = open 90° toward the performer): the leaf's free edge. */
export function doorEdge(open: number): { x: number; z: number } {
  const a = -Math.PI / 2 - (open * Math.PI) / 2; // from −z (closed) round to −x (open)
  return { x: Math.cos(a) * DOOR.W, z: DOOR.W + Math.sin(a) * DOOR.W };
}

export function doorKeepOuts(floorY: number, variants: string[]): Envelope[] {
  const top = floorY - DOOR.H;
  const why = ill('the door’s swing and its pinch points — F03 L20 "neither capsule nor cable enters pinch or collision zones"; the sizes are drawing defaults');
  return [
    { id: 'env.swing', label: 'the door’s swing', shape: { kind: 'sector', c: v3(0, 0, DOOR.W), r0: 0, r1: DOOR.W + 30, a0: -Math.PI, a1: -Math.PI / 2, y0: top, y1: floorY }, prov: why, variants },
    { id: 'env.pinchHinge', label: 'the pinch point at the hinge', shape: { kind: 'box', min: v3(-70, top, DOOR.W - 60), max: v3(70, floorY, DOOR.W + 60) }, prov: why, variants },
    { id: 'env.pinchLatch', label: 'the pinch point at the latch edge', shape: { kind: 'box', min: v3(-70, top, -40), max: v3(40, floorY, 40) }, prov: why, variants },
  ];
}

/* ── THE CHAIR: its front-right leg's floor contact at the origin, the seat
 *  toward −x and −z, the performer behind it lifting by the backrest. */
export const CHAIR = { S: PROP_DIMS.chairSeat.mm, back: PROP_DIMS.chairBack.mm, leg: 22 };
export function chairKeepOut(floorY: number, variants: string[]): Envelope {
  return {
    id: 'env.chairPath',
    label: 'the chair’s lift-and-drag path',
    shape: { kind: 'box', min: v3(-CHAIR.S - 60, floorY - CHAIR.back - 250, -CHAIR.S - 400), max: v3(80, floorY, 380) },
    prov: ill('the chair dragged about 40 cm either way and lifted — a drawing default (F03 L23 "protect performer’s lifting path")'),
    variants,
  };
}

/* ── THE BASIN on a low table: the water's surface at the origin. */
export const BASIN = { R: PROP_DIMS.basinR.mm, depth: PROP_DIMS.basinDepth.mm, water: 60 };
export function splashRadius(): number {
  return PROP_DIMS.splashK.mm * BASIN.R;
}
/** The splash envelope: an upright ellipse round the basin (2.5 × its radius, illustrative), from the floor to 400 mm above the water. */
export function splashKeepOut(floorY: number, variants: string[]): Envelope {
  const r = splashRadius();
  return {
    id: 'env.splash',
    label: 'the splash envelope',
    shape: { kind: 'cyl', a: v3(0, floorY, 0), b: v3(0, -400, 0), r },
    prov: ill('2.5 × the basin’s radius, ILLUSTRATIVE (O-7): mark the real splash footprint with the mic absent (F04 L26)'),
    variants,
  };
}

/** A handling hand's arc: a capsule from the shoulder to the prop, its radius the hand plus the prop's sweep. */
export function handArc(id: string, label: string, shoulder: Vec3, hand: Vec3, r: number, variants: string[]): Envelope {
  return { id, label, shape: { kind: 'capsule', a: shoulder, b: hand, r }, prov: ill('the arm and the handled prop’s sweep — a drawing default'), variants };
}
