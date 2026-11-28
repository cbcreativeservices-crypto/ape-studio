/**
 * FIGURE V2 — METAL FAMILY — THE DANCER'S RIGHT HAND WEARING FINGER CYMBALS (ZILLS), SEEN FROM THE PLAYER'S RIGHT:
 * THE LITTLE-FINGER EDGE TOWARD THE CAMERA (2026-11-25, family batch "metal"; the earlier review: "dance finger
 * cymbals drawn as closed fists").
 *
 * WHAT THE HAND DOES (the same playing as metalHandZillPalm, seen from the side: a cymbal on the THUMB and one on
 * the MIDDLE finger, each on the pad, held by an elastic over the finger; the pads close so the rims meet; the
 * other fingers relaxed): the hand raised before the shoulder, the PALM toward the audience (right here), the
 * fingers up. From the player's right we see the hand's little-finger edge:
 *   - the LITTLE finger nearest, up and relaxed, its nail on its back edge (left); the RING and INDEX tips just
 *     showing above and behind it, each a different length;
 *   - the MIDDLE finger bent forward at its knuckles toward the audience, its last segments hooked down, the pad
 *     (right) carrying the lower cymbal, its nail on the back of the hook;
 *   - the THUMB rising forward from the mound on the palm's side, its tip up and forward, the pad carrying the
 *     upper cymbal (the thumbnail a sliver on its far top);
 *   - the wrist straight, the forearm down toward the elbow (into the sleeve).
 * The whole hand lies behind the cymbals (the lesson paints them over it, the elastic over the thumb and finger).
 *
 * AUTHORED 2-D ART as the approved hands. Frame: mm in the page's own directions (the side view), the thumb's tip
 * at the origin (where the upper cymbal sits).
 */
import { MetalHand, type MetalHandProps } from './metalHandPaint';
import { E, pts, type MetalHandArt } from './metalHandArt.ts';
import { P } from './geom.ts';
import { METAL_HAND_PLACES } from '../metal/metalHands.ts';

export const METAL_HAND_ZILL_EDGE: MetalHandArt = {
  name: 'zillEdge',
  ...METAL_HAND_PLACES.zillEdge,
  fill: { c: P(-26, 70), r: 110 },
  pieces: [
    {
      // the index's and the ring's tips just showing behind the little finger (the far side: a step darker)
      name: 'farFingers',
      layer: 'back',
      outline: pts([[-46, 60], [-47, 30], [-46, 4], [-43, -10], [-37, -15], [-31, -12], [-28.5, 0], [-24, -6], [-18.5, -4], [-17, 10], [-18, 40], [-20, 62]]),
      lights: [E(-41, 0, 2.6, 12)],
      darks: [E(-26, 20, 8, 30), E(-30, 2, 2, 8)],
    },
    {
      // the palm and the back of the hand in profile, the wrist and the forearm (into the sleeve); the palm's side
      // (right) rounded over the heel, the back (left) nearly straight
      name: 'palm',
      layer: 'back',
      // (the wrist bent back — the hand raised, palm forward, the forearm rising from the elbow in front of the
      // body: the forearm leaves the wrist down toward the player, one straight form to the elbow)
      outline: pts([
        [-134, 282], [-112, 254], [-86, 220], [-62, 188], [-49, 166], [-45, 148], [-47, 120], [-49, 92], [-49, 66], [-44, 56],
        [-30, 52], [-18, 56], [-12, 68], [-9, 86], [-9, 106], [-11, 128], [-13, 148], [-14, 166], [-20, 186], [-36, 214], [-58, 248], [-78, 280],
      ]),
      lights: [E(-44, 110, 3.6, 40), E(-84, 226, 34, 5, 2.21)],
      darks: [E(-14, 110, 4, 30), E(-50, 226, 34, 5, 2.21), E(-30, 150, 16, 4)],
    },
    {
      // the little finger, nearest: up from the hand's edge, a little bent at its middle joint
      name: 'little',
      layer: 'back',
      outline: pts([[-48, 66], [-49.5, 44], [-49, 26], [-46.5, 14], [-42, 9.5], [-37, 11.5], [-35, 22], [-34.5, 40], [-33.5, 60]]),
      lights: [E(-46, 34, 2.4, 16)],
      darks: [E(-36, 38, 2.2, 18)],
      quiet: [E(-41, 62, 10, 6)],
    },
    {
      // the thumb (on the far side of the hand: behind the middle finger), rising forward out of the mound on the
      // palm's side (one form: no line at its root), short and thick, its tip up and a little forward
      name: 'thumb',
      layer: 'back',
      outline: pts([
        [-17, 118], [-15, 98], [-12.5, 78], [-11.5, 58], [-10, 38], [-8, 20], [-6.5, 6], [-3, -2], [2, -3.5], [6, 0], [7.5, 8], [8, 22], [7.5, 40], [5, 60], [0, 80], [-5, 98], [-9, 116],
      ]),
      lights: [E(-8, 50, 2.6, 22, 0.05), E(-1, 8, 2.4, 7)],
      darks: [E(4, 54, 2.4, 22, 0.05), E(-12, 104, 5, 10)],
      quiet: [E(-13, 116, 9, 12)],
    },
    {
      // the middle finger (nearer than the thumb), bent forward at its knuckles, its last two segments hooked down
      // toward the cymbal
      name: 'middle',
      layer: 'back',
      outline: pts([
        [-36, 60], [-35, 42], [-30, 27], [-22, 17], [-12, 13.5], [-2, 16], [5, 23], [8, 32], [8.5, 41], [5, 46.5], [-0.5, 46], [-3, 38], [-6, 31], [-12, 29], [-19, 35], [-23, 47], [-24, 60],
      ]),
      lights: [E(-24, 20, 8, 2.6, -0.5), E(2, 20, 4, 2.2, 0.6)],
      darks: [E(-14, 33, 7, 2.6, -0.4), E(4, 44, 3, 1.6)],
      quiet: [E(-30, 58, 9, 6)],
    },
  ],
  nails: [
    { piece: 'little', c: P(-46.5, 18), len: 9, w: 3.6, rot: Math.PI / 2 + 0.12 },
    { piece: 'farFingers', c: P(-43.5, -4), len: 8, w: 3, rot: Math.PI / 2 + 0.1 },
    { piece: 'middle', c: P(-3, 17.5), len: 10, w: 5, rot: 0.25 },
    { piece: 'thumb', c: P(-4, 4), len: 8.5, w: 3.4, rot: Math.PI / 2 - 0.25 },
  ],
  creases: [
    // the little finger's middle joint, the middle finger's middle joint (its bend), the wrist
    { piece: 'little', pts: pts([[-34.5, 36], [-38, 37], [-41, 36]]), w: 0.45 },
    { piece: 'middle', pts: pts([[-10, 29.5], [-12, 22], [-12, 15]]), w: 0.5 },
    { piece: 'palm', pts: pts([[-10, 150], [-20, 152], [-30, 151]]), w: 0.5 },
    { piece: 'thumb', pts: pts([[7.5, 30], [0, 31], [-8, 30]]), w: 0.45 },
  ],
};

export function MetalHandZillEdge(p: Omit<MetalHandProps, 'art'>) {
  return <MetalHand art={METAL_HAND_ZILL_EDGE} {...p} />;
}
