/**
 * THE BRASS PLAYER IN THE APPROVED LOOK (figure roll-out wave 5, D78,
 * 2026-11-24): trumpet and flugelhorn (A01), tenor and bass trombone (A02) —
 * the scene from the player's right and from above, the placement studio and
 * the setting plans.
 *
 * Nothing of the posture moves (brassPosture.ts): the standing skeleton, the
 * lips on the mouthpiece and the posed hands — trumpet: the right index,
 * middle and ring pads on the three valve buttons, the little finger on the
 * hook, the thumb under the leadpipe between the 1st and 2nd valves; the left
 * hand round the valve casings, the thumb at the 1st slide's saddle; trombone:
 * the left index on the inner slide at the receiver, the thumb round the bell
 * brace (bass: on the F trigger), the right thumb behind the outer slide's
 * brace with index and middle round its front. Only the drawing is new
 * (figureV2/familyV2.tsx): the cast member who plays it, the head drawn with
 * its mouth on the mouthpiece, the approved sleeves and the posed hands in the
 * approved look.
 *
 * Who plays (cast.ts ROLES): trumpet and flugelhorn Ruth, the trombones the
 * drummer; another player of the same horn on a plan, Kofi.
 */
import type { ReactElement } from 'react';
import { Skia } from '@shopify/react-native-skia';
import type { ViewId, Vec3 } from '../../../engine/model/types.ts';
import { castFor, type CastMember } from '../figureV2/cast';
import { famFrontRegion, famPlan, FamilyFigureFrontV2, FamilyFigureV2, type FamIn } from '../figureV2/familyV2';
import type { Group3, Item } from '../bowed/BowedArt';
import type { HornPose } from './brassPosture.ts';

/** The cast member who plays this horn. */
export const brassPlayer = (P: Pick<HornPose, 'spec'>): CastMember => castFor(P.spec.id === 'trumpet' || P.spec.id === 'flugelhorn' ? 'brass.trumpet' : 'brass.trombone');
/** A plan's neighbor playing the lesson's own horn: another person. */
export const brassSecond = (): CastMember => castFor('brass.second');

const EMPTY = Skia.Path.Make();
const nodeItem = (node: ReactElement): Item => ({ path: EMPTY, box: { u0: 0, v0: 0, u1: 0, v1: 0 }, node });
const depthOf = (view: ViewId, p: Vec3) => (view === 'side' ? p.z : -p.y);

/** The horn's own depth against the player: the mean of its tubes' centre lines. */
export function hornDepth(P: HornPose, view: ViewId): number {
  let s = 0;
  let n = 0;
  for (const t of P.tubes)
    for (const p of t.pts) {
      s += depthOf(view, p);
      n++;
    }
  return n ? s / n : 0;
}

/** The figure's input. A hand lies over the horn as the old figure laid it: from the player's right the
 *  trumpet's left hand is behind the valve block, the trombone's just behind the slide's tubes; from above,
 *  a hand over the horn's height lies over it. */
export function brassFamIn(P: HornPose, view: ViewId, who?: CastMember): FamIn {
  const inst = hornDepth(P, view);
  const front = (side: 'L' | 'R') => {
    if (view === 'side') return side === 'R';
    return depthOf(view, P.hands[side].sk.frame.o) + 25 > inst;
  };
  const shoulder = (side: 'L' | 'R') => (side === 'L' ? P.player.shoulderL : P.player.shoulderR);
  return {
    key: `brass|${P.spec.id}|${P.slide ? P.slide.s.toFixed(2) : 'v'}`,
    s: P.player,
    view,
    who: who ?? brassPlayer(P),
    seated: false,
    floorY: P.floorY,
    lip: P.lips,
    arms: {
      L: { sk: P.hands.L.sk, elbow: P.hands.L.elbow, shoulder: shoulder('L'), front: front('L') },
      R: { sk: P.hands.R.sk, elbow: P.hands.R.elbow, shoulder: shoulder('R'), front: front('R') },
    },
  };
}

/** The player's paint groups: the person whole under the whole horn, and again over it where its parts are
 *  nearer the viewer than the horn. */
export function brassFigureGroups(P: HornPose, view: ViewId, horn: Group3[], who?: CastMember): Group3[] {
  const fi = brassFamIn(P, view, who);
  const fp = famPlan(fi);
  const inst = hornDepth(P, view);
  const region = famFrontRegion(fp, inst);
  const lo = horn.length ? Math.min(...horn.map((g) => g.depth)) : inst;
  const hi = horn.length ? Math.max(...horn.map((g) => g.depth)) : inst;
  return [
    { key: 'figureV2', depth: lo - 1, items: [nodeItem(<FamilyFigureV2 fp={fp} />)] },
    { key: 'figureV2Front', depth: hi + 1, items: [nodeItem(<FamilyFigureFrontV2 fp={fp} region={region} />)] },
  ];
}
