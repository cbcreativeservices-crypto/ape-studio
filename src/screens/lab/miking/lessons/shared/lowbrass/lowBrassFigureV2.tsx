/**
 * THE LOW BRASS PLAYER IN THE APPROVED LOOK (figure roll-out wave 5, D78,
 * 2026-11-24): horn (A03), tuba (A04a), euphonium (A04b) — every picture that
 * draws the seated player (the scene from the player's right and from above,
 * the placement studio, the portrait, the sound pages, the setting plans).
 *
 * Nothing of the scene moves (lowBrassScene.ts, lowBrassHands.ts): the seated
 * skeleton, the lips on the mouthpiece, the posed hands — the horn's left
 * fingers on the levers, the little finger in its hook, the thumb on the thumb
 * valve, the right hand cupped in the bell (back of the hand against the far
 * wall, seen only through the opening); the tuba's and euphonium's right
 * fingers arched onto the pistons, the thumb in its ring, the left hand on the
 * bell branch or the side valve. Only the drawing is new (figureV2/familyV2):
 * the cast member, the head with its mouth on the mouthpiece, the approved
 * sleeves and the posed hands in the approved look. The chair is unchanged.
 *
 * Who plays (cast.ts ROLES): horn Ana, tuba Kofi, euphonium Mei; another player
 * of the same instrument on a plan, the drummer.
 */
import type { ReactNode } from 'react';
import type { Vec3, ViewId } from '../../../engine/model/types.ts';
import { castFor, type CastMember } from '../figureV2/cast';
import { famFrontRegion, famPlan, famProj, FamilyFigureFrontV2, FamilyFigureV2, type FamIn, type FamPlan } from '../figureV2/familyV2';
import { familyHand } from '../figureV2/familyHand.ts';
import { FamilyHandV2 } from '../figureV2/familyHandV2';
import { FigureLook } from '../figureV2/look';
import type { BrassScene } from './lowBrassScene.ts';
import { lowBrassHands } from './lowBrassHands';

const ROLE = { horn: 'lowbrass.horn', tuba: 'lowbrass.tuba', euph: 'lowbrass.euph' } as const;
/** The cast member who plays this instrument. */
export const lowBrassPlayer = (s: Pick<BrassScene, 'spec'>): CastMember => castFor(ROLE[s.spec.id as keyof typeof ROLE] ?? 'lowbrass.tuba');
/** A plan's neighbor playing the lesson's own instrument: another person. */
export const lowBrassSecond = (): CastMember => castFor('lowbrass.second');

const depthOf = (view: ViewId, p: Vec3) => (view === 'side' ? p.z : -p.y);

/** The instrument's own depth against the player: the mean of its tubes' centre lines. */
export function lowBrassDepth(s: BrassScene, view: ViewId): number {
  let t = 0;
  let n = 0;
  for (const tb of s.tubes)
    for (const p of tb.pts) {
      t += depthOf(view, p);
      n++;
    }
  return n ? t / n : depthOf(view, s.centre);
}

export function lowBrassFamIn(s: BrassScene, view: ViewId, who?: CastMember): FamIn {
  const J = s.J;
  const H = lowBrassHands(s);
  const inst = lowBrassDepth(s, view);
  // a hand lies over the instrument where the old figure laid it (its depth, the hand's own +25)
  const front = (side: 'L' | 'R') => depthOf(view, H[side].sk.frame.o) + 25 > inst;
  return {
    key: `lowbrass|${s.spec.id}|${s.orient}`,
    s: { head: J.head, headR: J.headR, face: { x: 1, y: 0, z: 0 }, neck: J.neck, chest: J.chest, pelvis: J.pelvis, shoulderL: J.shoulderL, shoulderR: J.shoulderR, hipL: J.hipL, hipR: J.hipR, kneeL: J.kneeL, kneeR: J.kneeR, ankleL: J.ankleL, ankleR: J.ankleR, toeL: J.toeL, toeR: J.toeR },
    view,
    who: who ?? lowBrassPlayer(s),
    seated: true,
    floorY: 0,
    seatY: s.chair.seat.min.y,
    lip: J.mouth,
    arms: {
      L: { sk: H.L.sk, elbow: H.L.elbow, shoulder: H.L.shoulder, front: front('L') },
      R: { sk: H.R.sk, elbow: H.R.elbow, shoulder: H.R.shoulder, front: front('R'), handElsewhere: !!s.bellHand },
    },
  };
}

type Item = { key: string; depth: number; node: ReactNode };

/** The player's paint items: the person whole under the whole instrument, and again over it where its parts are
 *  nearer the viewer. `lo` / `hi`: the instrument's own items' depth range. */
export function lowBrassFigureItems(s: BrassScene, view: ViewId, lo: number, hi: number, who?: CastMember): { items: Item[]; fp: FamPlan } {
  const fp = famPlan(lowBrassFamIn(s, view, who));
  const region = famFrontRegion(fp, lowBrassDepth(s, view));
  return {
    fp,
    items: [
      { key: 'figureV2', depth: lo - 1, node: <FamilyFigureV2 key="figureV2" fp={fp} /> },
      { key: 'figureV2Front', depth: hi + 1, node: <FamilyFigureFrontV2 key="figureV2Front" fp={fp} region={region} /> },
    ],
  };
}

/** The horn's right hand in the bell, in the approved look (the bell clips it to its opening). */
export function BellHandV2({ s, view, who }: { s: BrassScene; view: ViewId; who?: CastMember }) {
  const H = lowBrassHands(s);
  const h = familyHand(H.R.sk, famProj(view), `lowbrass|${s.spec.id}|${s.orient}|${view}|bell`, {});
  return (
    <FigureLook look={(who ?? lowBrassPlayer(s)).look}>
      <FamilyHandV2 h={h} />
    </FigureLook>
  );
}
