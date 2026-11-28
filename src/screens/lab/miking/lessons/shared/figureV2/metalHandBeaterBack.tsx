/**
 * FIGURE V2 — METAL FAMILY — THE TRIANGLE PLAYER'S RIGHT HAND ON THE BEATER, SEEN FROM THE BACK OF THE HAND
 * (from the player's right; 2026-11-25, family batch "metal"; the earlier review: the posed hand's four fingers as
 * separate pills, the beater along the outside of the fist).
 *
 * WHAT THE HAND DOES (researched: the steel beater is held lightly near its end like a stick — the fulcrum between
 * the PAD OF THE THUMB and the side of the INDEX finger at its middle joint, the other fingers curled loosely round
 * it, the butt end inside the hand toward the heel; the stroke comes from the wrist and the fingers, the beater
 * rising from the hand to meet the triangle's base from the player's side):
 *   - the back of the right hand toward the camera, the forearm level from the left (into the sleeve);
 *   - the THUMB along the top of the hand, its pad pressing the beater where it leaves the hand, its nail on top;
 *   - the beater leaving the fist BETWEEN the thumb's pad (above) and the index's bend (below), rising about 37°
 *     above the forearm's line (the hand's own drawing does not paint the beater: the lesson draws it, and the
 *     whole hand is painted over it, so the beater is seen only where it leaves the hand);
 *   - the four fingers curled under it: from this side only their bends along the fist's front edge (ONE row,
 *     each a little smaller and set back, the index the largest) and the big knuckles as low swells on the back.
 *
 * AUTHORED 2-D ART as the approved hands (the same build as the approved mallet hand, malletHandBack.tsx, which is
 * frozen: its shaft runs 15° BELOW the forearm, which a triangle beater striking upward cannot). Frame: mm in the
 * page's own directions, the fulcrum at the origin, the beater leaving toward the upper right (BEATER_BACK_DIR).
 */
import { MetalHand, type MetalHandProps } from './metalHandPaint';
import { E, pts, type MetalHandArt } from './metalHandArt.ts';
import { P, type Pt } from './geom.ts';
import { BEATER_BACK_DIR, METAL_HAND_PLACES } from '../metal/metalHands.ts';

/** The hand's own axis (wrist → knuckles) and its thumb side (up), page directions. */
const h = P(0.96, 0.28);
const t = P(0.28, -0.96);
/** A point `a` mm along the hand's axis from the fulcrum and `d` mm toward its thumb side. */
const H = (a: number, d: number): Pt => P(a * h.u + d * t.u, a * h.v + d * t.v);
const Hs = (xs: readonly (readonly [number, number])[]) => xs.map(([a, d]) => H(a, d));
/** An ellipse placed in the hand's frame (its long axis along the hand when `along`). */
const HE = (a: number, d: number, ra: number, rd: number, extra = 0) => {
  const c = H(a, d);
  return E(c.u, c.v, ra, rd, Math.atan2(h.v, h.u) + extra);
};

export { BEATER_BACK_DIR };

export const METAL_HAND_BEATER_BACK: MetalHandArt = {
  name: 'beaterBack',
  ...METAL_HAND_PLACES.beaterBack,
  fill: { c: H(-40, -6), r: 90 },
  pieces: [
    {
      // the forearm (into the sleeve), the wrist, the back of the hand, the fist's front edge (the four bends, one
      // row), the little finger's underside and the hand's lower edge back to the wrist
      name: 'hand',
      layer: 'front',
      outline: [
        ...Hs([[-200, 20], [-130, 21], [-92, 21], [-76, 24], [-62, 29], [-52, 32]]),
        // (the thumb's base along the top: the thumb piece is painted over it)
        ...Hs([[-40, 31], [-26, 27], [-12, 18], [-2, 9], [3, 3.5]]),
        // the index's bend just under the beater, the largest
        ...Hs([[6.5, -1.5], [8, -7], [7.5, -12.5], [5, -16.5], [2.5, -17.5]]),
        // the middle finger's bend
        ...Hs([[4, -19], [5, -24], [4, -29], [1.5, -31.5], [-1, -32]]),
        // the ring finger's bend
        ...Hs([[0.5, -33.5], [0.5, -38], [-1, -42], [-4, -44], [-6, -44.5]]),
        // the little finger's bend, the smallest, and its underside back toward its knuckle
        ...Hs([[-5, -46], [-5.5, -50], [-8, -53], [-13, -55], [-20, -55.5], [-30, -54.5]]),
        // the hand's lower edge (the little-finger side) back to the wrist, the wrist bone a hint
        ...Hs([[-44, -50.5], [-58, -45], [-72, -39], [-84, -36.5], [-100, -36], [-130, -36], [-200, -35]]),
      ],
      lights: [
        // the back of the hand's broad plane, lit toward its upper edge; the wrist's top
        HE(-46, 4, 22, 14), HE(-120, 6, 40, 6),
        // the big knuckles: four low swells in a slanting row (index and middle the largest)
        // (broad and soft: low swells, never pale dots)
        HE(-24, -3, 8, 5), HE(-28, -16, 7.5, 4.8), HE(-33, -29, 6.5, 4.4), HE(-38, -41, 5.5, 4),
        // each curled finger lit along its upper side, back from its bend (a band, not a dot)
        HE(-7, -5, 10, 2.4), HE(-9, -20, 9, 2.2), HE(-12, -34, 8, 2), HE(-15, -46, 7, 1.8),
      ],
      darks: [
        // the hand's lower edge turning away; the forearm's underside
        HE(-40, -47, 24, 3.2), HE(-130, -30, 60, 4),
        // the valleys between the knuckles, and each finger's lower side turning into the crease below it
        HE(-22, -9.5, 3.4, 1.6), HE(-27, -23, 3.2, 1.6), HE(-33, -35.5, 3, 1.4),
        HE(-2, -15, 7, 1.8), HE(-4, -29.5, 6.5, 1.7), HE(-7, -42.5, 6, 1.6),
      ],
    },
    {
      // the thumb along the top of the hand: out of the hand's top edge as one form (no line at its root), its base
      // joint a rounded swell, a soft bend at its last joint, the pad on the beater at the fulcrum, the tip just past
      name: 'thumb',
      layer: 'front',
      outline: Hs([
        [-64, 27], [-52, 33], [-40, 37], [-30, 37.5], [-18, 34.5], [-8, 30.5], [2, 26], [10, 20.5], [14, 14.5], [14.5, 9], [11, 5.5],
        [4, 4], [-4, 4], [-14, 6], [-26, 9.5], [-38, 14], [-50, 19], [-60, 23],
      ]),
      lights: [HE(-30, 33, 10, 2.6), HE(0, 22, 8, 2.4, -0.4), HE(-42, 34, 6, 3)],
      darks: [HE(-16, 8, 16, 2.2), HE(8, 7, 5, 1.8, -0.4)],
      quiet: [E(H(-60, 24).u, H(-60, 24).v, 10, 8)],
    },
  ],
  nails: [{ piece: 'thumb', c: H(5, 19.5), len: 11, w: 6.6, rot: Math.atan2(h.v, h.u) - 0.42 }],
  creases: [
    // the short creases between neighboring bends: clear at the front edge, fading back toward the knuckles
    { piece: 'hand', pts: Hs([[2.5, -17.5], [-5, -15.5], [-12, -13]]), w: 0.75 },
    { piece: 'hand', pts: Hs([[-1, -32], [-8, -30.5], [-15, -28.5]]), w: 0.75 },
    { piece: 'hand', pts: Hs([[-6, -44.5], [-12, -43.5], [-18, -42]]), w: 0.7 },
    // the thumb's underside running back over the hand from the grip (one soft line)
    { piece: 'hand', pts: Hs([[3, 3.5], [-10, 5.5], [-24, 9], [-38, 13.5]]), w: 0.8 },
    // the thumb's last joint (its top)
    { piece: 'thumb', pts: Hs([[-6, 30.5], [-7, 26], [-6, 21]]), w: 0.5 },
  ],
};

export function MetalHandBeaterBack(p: Omit<MetalHandProps, 'art'>) {
  return <MetalHand art={METAL_HAND_BEATER_BACK} {...p} />;
}
