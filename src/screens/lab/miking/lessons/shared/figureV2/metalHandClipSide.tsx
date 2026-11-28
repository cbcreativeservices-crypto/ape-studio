/**
 * FIGURE V2 — METAL FAMILY — THE TRIANGLE PLAYER'S LEFT HAND HOLDING THE CLIP, SEEN FROM THE PLAYER'S RIGHT
 * (2026-11-25, family batch "metal"; the earlier review: the posed hand's fingers as separate pieces, the clip
 * floating in front of them).
 *
 * WHAT THE HAND DOES (researched: the triangle hangs from a clip held in the non-playing hand "like you're holding
 * a glass of water or making a C" — Interlochen's percussion director; the common method: the clip's back on the
 * thumb, its front on the middle finger, the index on top to steady it, the ring and little fingers free so they
 * can reach down and damp the triangle; the clip held at about chest height, the line hanging free):
 *   - the hand reaches in from the player's left, its PALM toward this camera, BEHIND the clip;
 *   - the THUMB on the clip's player side (left here): its pad pressing that face, the nail a sliver on its top;
 *   - the INDEX arching over the clip, its tip resting on the clip's top (its nail toward the eye);
 *   - the MIDDLE finger curled round the clip's audience side (right here), its pad pressing that face;
 *   - the RING and LITTLE fingers relaxed and curled, below and beside, free to damp; the line hangs in front of
 *     them;
 *   - the wrist straight, the forearm down toward the elbow at the player's side (into the sleeve).
 *
 * AUTHORED 2-D ART as the approved hands. Paint order: the palm, the little and ring fingers, the first segments of
 * the middle and the index (all BEHIND the clip: layer 'back') → the clip and its line (the lesson) → the middle's
 * and the index's curled ends and the thumb (in FRONT of the clip's edges: layer 'front').
 *
 * Frame: mm in the page's own directions (the side view), the clip's center at the origin (the clip 22 × 34 mm).
 */
import { MetalHand, type MetalHandProps } from './metalHandPaint';
import { E, pts, type MetalHandArt } from './metalHandArt.ts';
import { P } from './geom.ts';
import { METAL_HAND_PLACES } from '../metal/metalHands.ts';

export const METAL_HAND_CLIP_SIDE: MetalHandArt = {
  name: 'clipSide',
  ...METAL_HAND_PLACES.clipSide,
  fill: { c: P(-30, 10), r: 110 },
  pieces: [
    {
      name: 'palm',
      layer: 'back',
      // the forearm (into the sleeve), the wrist, the thenar mound, the web, the knuckle row behind the clip, the
      // little finger's side and the heel back to the wrist
      outline: pts([
        [-133, 166], [-104, 116], [-80, 72], [-79, 50], [-73, 30], [-60, 10], [-42, -6], [-26, -18],
        [-10, -12], [6, 0], [21, 11], [34, 22], [36, 34], [26, 52], [10, 70], [-8, 86], [-28, 97], [-56, 142], [-84, 194],
      ]),
      lights: [E(-62, 36, 9, 16, 0.6), E(20, 34, 5, 12, 0.6), E(-112, 140, 8, 30, 0.5)],
      darks: [E(-18, 30, 14, 18, 0.5), E(-70, 170, 8, 30, 0.5)],
    },
    {
      name: 'little',
      layer: 'back',
      outline: pts([[23, 18], [33, 9], [42, 6], [48, 11], [50, 22], [47, 32], [41, 36], [36, 33], [34, 26], [29, 29]]),
      lights: [E(40, 10, 4, 2, 0.3)],
      darks: [E(42, 33, 4, 2)],
      quiet: [E(26, 22, 6, 6)],
    },
    {
      name: 'ring',
      layer: 'back',
      outline: pts([[8, 5], [19, -7], [31, -16], [40, -17], [46, -10], [47, 3], [43, 14], [36, 19], [32, 12], [25, 9], [17, 14]]),
      lights: [E(30, -12, 7, 2.6, -0.3)],
      darks: [E(40, 14, 5, 2.2, 0.4)],
      quiet: [E(12, 10, 8, 7)],
    },
    {
      name: 'middleBase',
      layer: 'back',
      outline: pts([[-11, -9], [1, -22], [13, -34], [22, -41], [32, -37], [31, -24], [17, -7], [6, 4]]),
      lights: [E(12, -30, 8, 2.6, -0.75)],
      darks: [E(20, -14, 8, 2.4, -0.75)],
      quiet: [E(-2, -2, 9, 8)],
    },
    {
      name: 'indexBase',
      layer: 'back',
      outline: pts([[-28, -19], [-21, -36], [-11, -50], [1, -57], [12, -52], [10, -40], [0, -26], [-9, -12]]),
      lights: [E(-15, -40, 9, 2.6, -1)],
      darks: [E(4, -32, 8, 2.4, -1)],
      quiet: [E(-18, -14, 9, 7)],
    },
    {
      // the middle finger's last two segments, curled round the clip's audience side: the pad on that face
      name: 'middleTip',
      layer: 'front',
      outline: pts([[20, -38], [29, -41], [36.5, -34], [37, -20], [32, -7], [24, 2], [15, 5.5], [10.5, 2], [12, -4], [17, -11], [20, -22]]),
      lights: [E(27, -36, 5, 2.4, 0.3)],
      darks: [E(19, -6, 6, 2.6, -0.6)],
      quiet: [E(22, -38, 6, 3, 0.2)],
    },
    {
      // the index's last two segments arching over the clip, the tip on its top
      name: 'indexTip',
      layer: 'front',
      outline: pts([[-1, -53], [7, -58], [15, -55], [19, -45], [17, -33], [12, -23], [6, -16.5], [0.5, -18], [-1, -27], [2, -40]]),
      lights: [E(5, -54, 5, 2.2, 0.2)],
      darks: [E(4, -21, 4, 2, 0.4)],
      quiet: [E(2, -52, 6, 3, -0.4)],
    },
    {
      // the thumb out of the thenar mound (one form: no line at its root), its pad on the clip's player side
      name: 'thumb',
      layer: 'front',
      outline: pts([
        [-60, 52], [-76, 30], [-72, 12], [-60, -2], [-45, -12], [-31, -16.5], [-19, -15.5], [-11, -11], [-8, -4], [-10.5, 2.5], [-18, 4.5], [-30, 2.5], [-42, 6], [-50, 18], [-54, 34], [-48, 52],
      ]),
      lights: [E(-48, -6, 12, 3, -0.4), E(-68, 22, 4, 9, 0.5)],
      darks: [E(-30, 1, 10, 2.4, 0.05), E(-50, 30, 4, 12, 0.3)],
      quiet: [E(-56, 50, 14, 10)],
    },
  ],
  nails: [
    { piece: 'thumb', c: P(-20, -12.5), len: 11, w: 4.4, rot: 0.2 },
    { piece: 'indexTip', c: P(14.5, -36), len: 10, w: 6.4, rot: 1.75 },
    { piece: 'middleTip', c: P(33, -17), len: 10.5, w: 6.4, rot: 1.95 },
    { piece: 'ring', c: P(44.5, 2), len: 8.5, w: 5.6, rot: 1.6 },
    { piece: 'little', c: P(47.5, 22), len: 7, w: 4.6, rot: 1.6 },
  ],
  creases: [
    // the thumb's base crease round the thenar mound, the palm's lines (faint), the wrist crease
    { piece: 'palm', pts: pts([[-40, -2], [-44, 16], [-50, 38], [-58, 60]]), w: 0.6 },
    { piece: 'palm', pts: pts([[30, 30], [14, 22], [0, 16]]), w: 0.5 },
    { piece: 'palm', pts: pts([[-34, 96], [-55, 82], [-76, 68]]), w: 0.55 },
    // the middle knuckles' creases (where each curled finger bends)
    { piece: 'middleTip', pts: pts([[36, -28], [29, -25], [22, -25]]), w: 0.5 },
    { piece: 'indexTip', pts: pts([[18, -42], [11, -42], [4, -45]]), w: 0.5 },
    { piece: 'thumb', pts: pts([[-44, 5], [-45, -3], [-44, -11]]), w: 0.5 },
  ],
};

export function MetalHandClipSide(p: Omit<MetalHandProps, 'art'>) {
  return <MetalHand art={METAL_HAND_CLIP_SIDE} {...p} />;
}
