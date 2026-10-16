/**
 * I02 CAJÓN — the seated player as the SHARED FIGURE (players/PlayerFigure;
 * art fix round 3, 2026-10-16: the lesson's own body — a darker sleeve block
 * laid over the upper arm, a capsule thigh, a sack torso, an egg head on a
 * long neck — was graded "plugged-on parts"). One continuous silhouette, the
 * same masses every family draws, on the SAME joints the keep-outs use
 * (model.ts SEAT and each state's arms), so the drawing, the hit areas and
 * the collision solids agree. Pure (no React): the tests reach it.
 *
 * SIDE   facing the plate (+x), astride the top, leaning over it; the right
 *        hand at a top corner of the plate (the slap), the left lower at the
 *        middle (the bass), fingers down over the plate's face.
 * ABOVE  chest toward +x, the forearms reaching down to the plate between
 *        the knees (the hands themselves lie on the plate's vertical face and
 *        are drawn by the art as the back of the hand, foreshortened).
 * Every joint is a drawing default (proposal Frame J).
 */
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import { pt, type PlayerPose } from '../shared/players/playerPose.ts';
import { SEAT, stateOf } from './model.ts';

const cache = new Map<string, PlayerPose>();

export function cajonPose(view: ViewId, variant: VariantId): PlayerPose {
  const key = `${view}|${variant}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const s = stateOf(variant);
  let pose: PlayerPose;
  if (view === 'side') {
    const dirOf = (a: { W: { x: number; y: number }; G: { x: number; y: number } }) => Math.atan2(a.G.y - a.W.y, a.G.x - a.W.x);
    pose = {
      view: 'side',
      posture: 'seated',
      facing: 1,
      head: { c: pt(SEAT.head.x, SEAT.head.y), r: 100 },
      neck: pt(SEAT.shoulder.x + 8, SEAT.shoulder.y - 40),
      shoulderR: pt(SEAT.shoulder.x, SEAT.shoulder.y),
      shoulderL: pt(SEAT.shoulder.x - 14, SEAT.shoulder.y - 10),
      elbowR: pt(s.R.E.x, s.R.E.y),
      elbowL: pt(s.L.E.x, s.L.E.y),
      handR: { wrist: pt(s.R.W.x, s.R.W.y), dir: dirOf(s.R), kind: 'rest' },
      handL: { wrist: pt(s.L.W.x, s.L.W.y), dir: dirOf(s.L), kind: 'rest' },
      hipR: pt(SEAT.hip.x, SEAT.hip.y),
      hipL: pt(SEAT.hip.x - 10, SEAT.hip.y - 4),
      kneeR: pt(SEAT.knee.x, SEAT.knee.y),
      kneeL: pt(SEAT.knee.x - 24, SEAT.knee.y - 10),
      footR: pt(SEAT.ankle.x + 20, 0),
      footL: pt(SEAT.ankle.x - 8, 0),
      floor: 0,
    };
  } else {
    // Authored chest toward +v round the neck, turned to face +x (`facing`
    // 0): authored (right, fwd) lands at world (neck.x + fwd, z = right) —
    // the player's right is +z, as the arms' z in model.ts.
    const n = pt(SEAT.shoulder.x - 20, 0);
    const L = (right: number, fwd: number) => pt(n.u - right, n.v + fwd);
    const W = (q: { x: number; z: number }) => L(q.z, q.x - n.u);
    pose = {
      view: 'above',
      posture: 'seated',
      facing: 0,
      head: { c: L(0, SEAT.head.x - n.u), r: 96 },
      neck: n,
      shoulderR: L(SEAT.shoulderZ, 0),
      shoulderL: L(-SEAT.shoulderZ, 0),
      // The elbows a little out from the body and ahead of the shoulders, over
      // the thighs (the 3-D solve in model.ts sends them back past the
      // shoulder when projected from above).
      elbowR: L(SEAT.shoulderZ + 50, 130),
      elbowL: L(-SEAT.shoulderZ - 50, 130),
      handR: { wrist: W(s.R.W), dir: Math.PI / 2, kind: 'rest' },
      handL: { wrist: W(s.L.W), dir: Math.PI / 2, kind: 'rest' },
      hipR: L(SEAT.hipZ, SEAT.hip.x - n.u),
      hipL: L(-SEAT.hipZ, SEAT.hip.x - n.u),
      kneeR: L(SEAT.kneeZ, SEAT.knee.x - n.u),
      kneeL: L(-SEAT.kneeZ, SEAT.knee.x - n.u),
      footR: L(SEAT.ankleZ, SEAT.toe.x - n.u - 40),
      footL: L(-SEAT.ankleZ, SEAT.toe.x - n.u - 40),
      floor: null,
    };
  }
  cache.set(key, pose);
  return pose;
}
