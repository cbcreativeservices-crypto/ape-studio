/**
 * FIGURE V2 — METAL FAMILY — THE DANCER'S LEFT HAND WEARING FINGER CYMBALS (ZILLS), SEEN FROM THE PALM SIDE
 * (2026-11-25, family batch "metal"; the earlier review: "dance finger cymbals drawn as closed fists").
 *
 * WHAT THE HAND DOES (researched: dance zills are worn as a pair on each hand, one on the THUMB and one on the
 * MIDDLE finger, each held on by an elastic through the cymbal's slot over the finger just behind the nail, the
 * cymbal on the pad; the sound is made by bringing the thumb's pad and the middle finger's pad together so the two
 * rims meet; the index, ring and little fingers stay relaxed and out of the way; the wrist is loose):
 *   - the hand raised before the shoulder, the PALM toward the audience, the fingers up, tipped a little toward the
 *     body's middle (the lesson's drawing);
 *   - the THUMB opposed across the front of the palm, its pad toward the middle finger, its tip carrying the upper
 *     cymbal (the thumbnail seen as a sliver on its outer edge);
 *   - the MIDDLE finger bent forward at its knuckles toward the thumb, its last two segments curled toward the
 *     audience, so its back and its NAIL face the eye; its pad carries the lower cymbal — the pose just before the
 *     two pads close and the rims meet;
 *   - the INDEX, RING and LITTLE fingers up and relaxed, gently curved, a little apart, each a different length;
 *   - the wrist straight, the forearm on down toward the elbow (into the sleeve).
 * Drawn as the LEFT hand (the dancer's left: screen right from the audience); `mirror` gives the right, re-lit.
 *
 * AUTHORED 2-D ART as the approved hands: hand-placed points (mm) drawn as smooth closed curves, one skin light,
 * soft lights and shades, a thin soft outline, very few lines. Paint order: the palm (with its forearm), the
 * little, ring and index fingers, the middle finger's first segment, its curled end (in front), the thumb (nearest).
 * The whole hand lies BEHIND the cymbals (the lesson paints them over it, the elastic over the thumb and finger).
 *
 * Frame: mm, the thumb's tip at the origin (where the upper cymbal sits), +x right, +y down, the fingers UP.
 * The lesson turns it by ZILL_PALM_TURN so the middle fingertip lands on the lower cymbal.
 */
import { MetalHand, type MetalHandProps } from './metalHandPaint';
import { E, pts, type MetalHandArt } from './metalHandArt.ts';
import { P } from './geom.ts';
import { METAL_HAND_PLACES } from '../metal/metalHands.ts';

/** Where the middle finger's curled tip is (it carries the lower cymbal), from the thumb's tip. */
export const ZILL_PALM_MIDDLE_TIP = P(10, 42);

export const METAL_HAND_ZILL_PALM: MetalHandArt = {
  name: 'zillPalm',
  ...METAL_HAND_PLACES.zillPalm,
  fill: { c: P(18, 90), r: 120 },
  pieces: [
    {
      name: 'palm',
      layer: 'back',
      // the forearm (into the sleeve), the wrist, the thenar mound bulging out on the thumb's side, the index's
      // knuckle, the top of the palm under the fingers, the little finger's knuckle, the heel on the little side
      outline: pts([
        [-9, 270], [-8, 222], [-6, 182], [-5, 152],
        [-10, 136], [-18, 118], [-23, 98], [-21, 80], [-15, 64], [-11, 54],
        [-2, 47], [9, 45], [18, 42], [28, 44], [39, 47], [50, 52], [59, 57], [66, 63],
        [70, 76], [70, 94], [67, 113], [61, 131], [53, 148],
        [55, 182], [57, 222], [59, 270],
      ]),
      lights: [E(-12, 106, 10, 22, 0.15), E(60, 98, 7, 24, -0.08), E(2, 210, 9, 40)],
      darks: [E(26, 92, 15, 20), E(48, 210, 9, 45), E(24, 62, 22, 4)],
    },
    {
      name: 'little',
      layer: 'back',
      outline: pts([[52, 66], [52.5, 44], [54, 26], [56.5, 13], [60, 7.5], [64, 8], [66.5, 13], [68, 26], [69, 46], [70, 66]]),
      lights: [E(56, 34, 2.2, 16)],
      darks: [E(67, 40, 2, 18)],
      quiet: [E(61, 64, 12, 6)],
    },
    {
      name: 'ring',
      layer: 'back',
      outline: pts([[31, 58], [30, 34], [30.5, 12], [32, -4], [35, -13], [39.5, -16], [44, -13], [46.5, -3], [47.5, 14], [48.5, 36], [49, 58]]),
      lights: [E(34.5, 16, 2.6, 22)],
      darks: [E(46, 20, 2.2, 22)],
      quiet: [E(40, 56, 13, 6)],
    },
    {
      name: 'index',
      layer: 'back',
      outline: pts([[-13, 60], [-14.5, 36], [-15.5, 14], [-15, -2], [-12, -11], [-7.5, -14], [-3, -11], [-0.5, -2], [1.5, 14], [4, 36], [6, 58]]),
      lights: [E(-11.5, 14, 2.6, 22, 0.04)],
      darks: [E(3, 22, 2.2, 22, 0.05)],
      quiet: [E(-4, 58, 13, 6)],
    },
    {
      // the middle finger's first segment, foreshortened as it bends forward toward the thumb
      name: 'middleBase',
      layer: 'back',
      outline: pts([[8, 54], [8, 36], [9.5, 22], [13, 14], [18, 11.5], [23, 13], [26.5, 20], [28, 34], [28.5, 54]]),
      lights: [E(11.5, 30, 2.5, 13)],
      darks: [E(26, 32, 2.2, 14)],
      quiet: [E(18, 52, 13, 6)],
    },
    {
      // its last two segments curled toward the audience: the middle knuckle's rounded top, then the back of the
      // last segment and its nail facing the eye, the tip low over the top of the palm
      name: 'middleCurl',
      layer: 'back',
      outline: pts([[8.5, 24], [11, 15.5], [16, 11.5], [21, 11.5], [25.5, 15], [28, 22], [28, 31], [26, 40], [22, 47], [17, 50], [12, 48.5], [8.5, 42], [7.5, 33]]),
      lights: [E(13.5, 21, 4, 6, -0.3)],
      darks: [E(25, 36, 3, 10, 0.25), E(17, 49, 5, 1.8)],
      quiet: [E(18, 13, 9, 3)],
    },
    {
      // the thumb, opposed across the front of the palm toward the middle finger: out of the thenar mound as one
      // form (no outline at its root), thickest of the digits, its base joint swelling on the outer side, a slight
      // bend at its last joint, the tip turned in toward the middle finger
      name: 'thumb',
      layer: 'back',
      outline: pts([
        [-13, 140], [-23, 118], [-29.5, 98], [-31.5, 80], [-29, 62], [-24, 48], [-18.5, 35], [-12.5, 22], [-7, 11], [-2, 3], [3, -2.5], [8.5, -2.5], [12, 1.5], [13, 7.5],
        [11, 13], [7, 20], [3, 30], [-0.5, 42], [-3.5, 56], [-4.5, 72], [-1.5, 92], [5, 114], [13, 132], [17, 140],
      ]),
      lights: [E(-23, 74, 4, 17, 0.12), E(-9, 22, 3, 12, 0.5), E(-16, 118, 7, 13, 0.4)],
      darks: [E(5, 26, 2.6, 12, 0.45), E(-2, 80, 3.4, 20, -0.05)],
      quiet: [E(6, 132, 18, 34)],
    },
  ],
  nails: [
    // the middle finger's nail (its back toward the eye: it is curled forward)
    { piece: 'middleCurl', c: P(17.5, 39), len: 11, w: 9, rot: Math.PI / 2 + 0.12 },
    // the thumbnail seen as a sliver on its outer edge near the tip
    { piece: 'thumb', c: P(-2.5, 6.5), len: 10, w: 4, rot: -1.0 },
  ],
  creases: [
    // the thumb's base crease round the thenar mound and the palm's upper line, faint
    { piece: 'palm', pts: pts([[-6, 66], [-1, 86], [5, 110], [10, 130]]), w: 0.7 },
    { piece: 'palm', pts: pts([[64, 78], [48, 71], [32, 69]]), w: 0.55 },
    // the wrist crease
    { piece: 'palm', pts: pts([[44, 150], [28, 152], [10, 150]]), w: 0.55 },
    // the finger creases at the middle joints (pad side), short and fading out to the side
    { piece: 'index', pts: pts([[-9, 29], [-3, 30], [2, 29]]), w: 0.45 },
    { piece: 'ring', pts: pts([[36, 25], [41, 26], [46, 25]]), w: 0.45 },
    { piece: 'little', pts: pts([[57, 36], [62, 37], [66, 36]]), w: 0.45 },
    // the curled middle finger's last knuckle seen from its back
    { piece: 'middleCurl', pts: pts([[11, 29], [18, 28], [25, 29]]), w: 0.5 },
    // the thumb's last joint (its inner side)
    { piece: 'thumb', pts: pts([[5, 26], [-1, 25], [-8, 22]]), w: 0.55 },
  ],
};

export function MetalHandZillPalm(p: Omit<MetalHandProps, 'art'>) {
  return <MetalHand art={METAL_HAND_ZILL_PALM} {...p} />;
}
