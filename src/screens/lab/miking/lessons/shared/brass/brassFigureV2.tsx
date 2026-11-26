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
import { famFrontRegion, famPlan, famProj, FamilyFigureFrontV2, FamilyFigureV2, type FamIn } from '../figureV2/familyV2';
import type { Group3, Item } from '../bowed/BowedArt';
import type { HornPose } from './brassPosture.ts';
import { BrassHand, brassHandRot, type BrassHandArt } from '../figureV2/brassHandPaint';
import { BRASS_HAND_TRUMPET_VALVE_SIDE } from '../figureV2/brassHandTrumpetValveSide';
import { BRASS_HAND_TRUMPET_VALVE_TOP } from '../figureV2/brassHandTrumpetValveTop';
import { BRASS_HAND_TRUMPET_HOLD_SIDE } from '../figureV2/brassHandTrumpetHoldSide';
import { BRASS_HAND_TRUMPET_HOLD_TOP } from '../figureV2/brassHandTrumpetHoldTop';
import { BRASS_HAND_TROMBONE_SLIDE_SIDE } from '../figureV2/brassHandTromboneSlideSide';
import { BRASS_HAND_TROMBONE_HOLD_SIDE } from '../figureV2/brassHandTromboneHoldSide';
import { BRASS_HAND_TROMBONE_SLIDE_TOP } from '../figureV2/brassHandTromboneSlideTop';
import { BRASS_HAND_TROMBONE_HOLD_TOP } from '../figureV2/brassHandTromboneHoldTop';

/**
 * THE AUTHORED HANDS (owner 2026-11-25, "batches by family"): each hand the learner sees in a default picture is an
 * authored 2-D drawing (figureV2/brassHand*.tsx) placed on the figure's own cuff — the figure's arm ends at its cuff
 * (`handElsewhere`) and the drawing grows out of it, only turned to the picture's forearm. Nothing of the pose moves.
 * `layer`: 'front' — painted over the whole horn; 'behind' — under the horn (its `front` regions painted again over
 * it, under the nearer arm).
 */
type Placed = { art: BrassHandArt; layer: 'front' | 'behind' };
const holdOf = (P: Pick<HornPose, 'spec' | 'slide'>) => (P.slide ? 'slide' : 'valved');
export const BRASS_HAND_ART: Record<string, Placed> = {
  'valved.side.R': { art: BRASS_HAND_TRUMPET_VALVE_SIDE, layer: 'front' },
  'valved.top.R': { art: BRASS_HAND_TRUMPET_VALVE_TOP, layer: 'front' },
  'valved.side.L': { art: BRASS_HAND_TRUMPET_HOLD_SIDE, layer: 'behind' },
  'valved.top.L': { art: BRASS_HAND_TRUMPET_HOLD_TOP, layer: 'behind' },
  'slide.side.R': { art: BRASS_HAND_TROMBONE_SLIDE_SIDE, layer: 'front' },
  'slide.side.L': { art: BRASS_HAND_TROMBONE_HOLD_SIDE, layer: 'behind' },
  'slide.top.R': { art: BRASS_HAND_TROMBONE_SLIDE_TOP, layer: 'behind' },
  'slide.top.L': { art: BRASS_HAND_TROMBONE_HOLD_TOP, layer: 'behind' },
};
/** The authored drawing for a hand of a hold in a view (null: the figure draws it). */
export const brassHandArt = (P: Pick<HornPose, 'spec' | 'slide'>, view: ViewId, side: 'L' | 'R'): Placed | null => BRASS_HAND_ART[`${holdOf(P)}.${view}.${side}`] ?? null;

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
      L: { sk: P.hands.L.sk, elbow: P.hands.L.elbow, shoulder: shoulder('L'), front: front('L'), handElsewhere: !!brassHandArt(P, view, 'L') },
      R: { sk: P.hands.R.sk, elbow: P.hands.R.elbow, shoulder: shoulder('R'), front: front('R'), handElsewhere: !!brassHandArt(P, view, 'R') },
    },
  };
}

/** The authored hands' paint groups for a figure plan: behind the horn, its front regions, in front of the horn. */
export function brassHandGroups(P: HornPose, view: ViewId, fp: ReturnType<typeof famPlan>, lo: number, hi: number): Group3[] {
  const out: Group3[] = [];
  for (const a of fp.arms) {
    const pl = brassHandArt(P, view, a.side);
    if (!pl) continue;
    const at = a.arm.opening.e.c;
    const o = famProj(view)(fp.in.arms[a.side].sk.frame.o);
    const fl = Math.hypot(o.u - a.elbow2.u, o.v - a.elbow2.v) || 1;
    const rot = brassHandRot(pl.art.fore, { u: (o.u - a.elbow2.u) / fl, v: (o.v - a.elbow2.v) / fl });
    const who = fp.in.who;
    const hand = (part: 'all' | 'front') => <BrassHand art={pl.art} at={at} rot={rot} who={who} part={part} />;
    // (keys under 'figureV2…': the person's own new parts)
    if (pl.layer === 'front') out.push({ key: `figureV2Hand${a.side}`, depth: hi + 2, items: [nodeItem(hand('all'))] });
    else {
      out.push({ key: `figureV2Hand${a.side}`, depth: lo - 0.5, items: [nodeItem(hand('all'))] });
      if (pl.art.front?.length) out.push({ key: `figureV2HandFront${a.side}`, depth: hi + 0.5, items: [nodeItem(hand('front'))] });
    }
  }
  return out;
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
    ...brassHandGroups(P, view, fp, lo, hi),
  ];
}
