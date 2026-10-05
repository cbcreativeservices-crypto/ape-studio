/**
 * A11 ACCORDION — the technical truth (charter §2 layer 1): where the
 * instrument's parts are, as numbers with their provenance
 * (docs/labs/miking/accordion/SOURCES.md, GEOMETRY_PROPOSAL.md). The
 * learner sees starting points only (owner ruling 2026-10-04).
 *
 * FRAME A (the proposal's, in the engine's hand): origin A0 = the centre of
 * the treble grille (on the treble box's front face); +x out of the
 * player's chest toward the audience; +y DOWN; +z to the PLAYER'S RIGHT —
 * the engine's convention (the side view looks from the player's right).
 * The proposal's +z points the other way (toward the bass side, the
 * player's left): the same frame mirrored, no dimension changed.
 *
 * TWO MOVING SIDES. The treble box is fixed to the player's right side and
 * chest; the BASS box (the player's left) moves with the bellows — out on a
 * pull, in on a push — and the bellows fan open, the bottom more than the
 * top (lesson L7, L42 "the lower bellows arc"). The variants are three
 * moments of that cycle: CLOSED, HALF OPEN, FULLY OPEN. Every size is a
 * drawing default except the key and button counts (sourced).
 */
import type { Provenance, Vec3 } from '../../engine/model/types.ts';
import { ACCORDION } from '../shared/freereed/freeReedSpec.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });

/** The floor: the grille's centre at its drawing-default height. */
export const FLOOR_Y = ACCORDION.grilleHt.mm;
export const A0: Vec3 = { x: 0, y: 0, z: 0 };

/** The treble box (fixed): x from the chest to the front, y, z (the keyboard on its +z face). */
export const TREBLE = {
  x0: -ACCORDION.trebleD.mm,
  x1: 0,
  y0: -220,
  y1: -220 + ACCORDION.trebleH.mm,
  z0: -70,
  z1: -70 + ACCORDION.trebleW.mm,
  prov: ill('the treble box placed round the grille’s centre (drawing defaults)'),
} as const;
/** The treble grille on the front face, round A0. */
export const GRILLE = { y0: -ACCORDION.grilleH.mm / 2, y1: ACCORDION.grilleH.mm / 2, z0: -ACCORDION.grilleW.mm / 2, z1: ACCORDION.grilleW.mm / 2 } as const;
/** The keyboard's strip on the treble box's outer (+z) face: front part. */
export const KEYS = { x0: TREBLE.x0 + 40, x1: TREBLE.x1 - 6, y0: TREBLE.y0 + 30, y1: TREBLE.y1 - 20 } as const;

export type Bellows = 'in' | 'mid' | 'out';
export const BELLOWS_STATES: readonly { id: Bellows; label: string; blurb: string; top: number; bottom: number }[] = [
  { id: 'in', label: 'BELLOWS CLOSED', blurb: 'Pushed in: the bass side close to the treble side.', top: ACCORDION.bellowsClosed.mm, bottom: ACCORDION.bellowsClosed.mm },
  { id: 'mid', label: 'BELLOWS HALF OPEN', blurb: 'Part-way through a pull: the bass side has moved out, the bottom of the bellows more than the top.', top: 175, bottom: 350 },
  { id: 'out', label: 'BELLOWS FULLY OPEN', blurb: 'At the end of a long pull: the bass side at its farthest, the bellows fanned open at the bottom.', top: 264, bottom: ACCORDION.bellowsMax.mm },
];
export const stateOf = (v: string) => BELLOWS_STATES.find((s) => s.id === v) ?? BELLOWS_STATES[1];

/**
 * The bass box for a bellows state: its inner face runs from the top
 * (opening `top`) to the bottom (opening `bottom`) — a fan of angle θ — and
 * the box stands 140 mm outward of that face, square to it. In the side's
 * plane (z, y). Returns the four corners (inner top, inner bottom, outer
 * bottom, outer top), θ (degrees) and the bounding box.
 */
export function bassBox(v: string) {
  const s = stateOf(v);
  return bassBoxAt(s.top, s.bottom);
}

/** The bass box for any opening (top and bottom, mm): the sound page's
 *  BELLOWS fader moves through the cycle continuously. */
export function bassBoxAt(top: number, bottom: number) {
  const s = { top, bottom };
  const H = TREBLE.y1 - TREBLE.y0;
  const W = ACCORDION.bassW.mm;
  const th = Math.atan2(s.bottom - s.top, H);
  const zIt = TREBLE.z0 - s.top;
  const zIb = TREBLE.z0 - s.bottom;
  const n = { z: -Math.cos(th), y: -Math.sin(th) };
  const it = { z: zIt, y: TREBLE.y0 };
  const ib = { z: zIb, y: TREBLE.y1 };
  const ob = { z: ib.z + n.z * W, y: ib.y + n.y * W };
  const ot = { z: it.z + n.z * W, y: it.y + n.y * W };
  const zs = [it.z, ib.z, ob.z, ot.z];
  const ys = [it.y, ib.y, ob.y, ot.y];
  return {
    it,
    ib,
    ob,
    ot,
    deg: (th * 180) / Math.PI,
    /** The outer face's centre: the bass outlets (drawn there; positions unknown). */
    outlets: { z: (ob.z + ot.z) / 2, y: (ob.y + ot.y) / 2 },
    box: { z0: Math.min(...zs), z1: Math.max(...zs), y0: Math.min(...ys), y1: Math.max(...ys) },
  };
}

/** The bass side at its FULL opening — the bellows-side starting point is
 *  measured from here, so the stand stays outside the whole travel. */
export const BASS_FULL = bassBox('out').box.z0;
/** The left hand under the strap rides on the bass box's outer face: a margin. */
export const HAND_MARGIN = 60;

/** The player's body, standing behind the accordion (drawing defaults). */
export const BODY = {
  chestX: TREBLE.x0,
  backX: TREBLE.x0 - 250,
  headC: { x: TREBLE.x0 - 70, y: -460, z: 0 },
  shoulderY: -300,
  halfW: 200,
  prov: ill('a standing adult’s proportions round the drawn player (a drawing default)'),
} as const;
