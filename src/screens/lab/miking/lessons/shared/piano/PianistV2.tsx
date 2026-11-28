/**
 * THE PIANIST, DRAWN (figure V2, set 3c of D78; the plan: pianistPlanV2.ts). A cast
 * member on the lesson's bench: the approved body (seated, side view and from
 * above), each arm the approved sleeve ending just past the hand's own wrist
 * crease, and each hand the posed 3-D hand on its keys drawn in the approved
 * hands' language (familyHand: one silhouette out of the cuff's opening, the
 * thumb grown from its mound, one finger one shape), painted in the arm's own
 * depth order (through the arm's hand slot) and outside the cuff's cloth.
 */
import { memo } from 'react';
import { Group } from '@shopify/react-native-skia';
import type { V3 } from '../players/handModel.ts';
import { castFor, type CastMember } from '../figureV2/cast';
import { sidePlan, armPlan, type SidePlan } from '../figureV2/sidePlan.ts';
import { personTopPlan } from '../figureV2/topPerson.ts';
import type { TopPlan } from '../figureV2/topPlan.ts';
import { sidePaths, armPaths, type SkPath } from '../figureV2/paths.ts';
import { familyHand, type FamHand } from '../figureV2/familyHand.ts';
import { FamilyHandV2 } from '../figureV2/familyHandV2';
import { PlayerSideV2, PlayerTopV2 } from '../figureV2/playersV2';
import { P, type Pt } from '../figureV2/geom.ts';
import { pianist3, type PianoArm } from './pianistPlanV2.ts';
import { pianistAt } from './pianoSpec.ts';

export const PIANIST_WHO: CastMember = castFor('player.piano');

const SIDE_VIEW = (p: V3) => ({ u: p.x, v: p.y, d: p.z });
const TOP_VIEW = (p: V3) => ({ u: p.x, v: p.z, d: -p.y });

type Built = { plan: SidePlan | TopPlan; hands: { near: FamHand; far: FamHand }; cuffs: { near: SkPath; far: SkPath } };
const cache = new Map<string, Built>();

const handOf = (a: PianoArm, view: typeof SIDE_VIEW, opening: { e: { c: Pt }; out: Pt }, key: string) =>
  familyHand(a.sk, view, key, { from: P(opening.e.c.u + opening.out.u * 2, opening.e.c.v + opening.out.v * 2) });

/** The pianist's plans and hands for one view (memoised). */
export function pianistBuilt(xKey: number, pedalX: number, view: 'side' | 'top', who: CastMember = PIANIST_WHO, lip?: { x: number; y: number }): Built {
  const key = `${xKey}:${pedalX}:${view}:${who.id}:${lip ? `${lip.x},${lip.y}` : '-'}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const p3 = pianist3(xKey, pedalX);
  let out: Built;
  if (view === 'side') {
    const pn = p3.side;
    const plan = sidePlan(pn, { head: who.head, body: who.body, seatV: pianistAt(xKey, pedalX).bench.y, nod: 12, ...(lip ? { lip: P(lip.x, lip.y) } : {}), soleR: { ball: P(p3.ball.u, p3.ball.v), slope: p3.footSlope } });
    const P2 = sidePaths(plan);
    const near = handOf(p3.R, SIDE_VIEW, plan.arms.near.opening, `piano|side|R|${key}`);
    const far = handOf(p3.L, SIDE_VIEW, plan.arms.far.opening, `piano|side|L|${key}`);
    out = { plan, hands: { near, far }, cuffs: { near: P2.near.cuffCloth, far: P2.far.cuffCloth } };
  } else {
    const base = personTopPlan(p3.top, who, { desk: true });
    const B = who.body;
    const armB = B ? { one: true, k: B.shoulder, fore: B.limb } : {};
    const xz = (q: V3): Pt => P(q.x, q.z);
    const rise = (a: PianoArm) => {
      const d = { x: a.cuffEnd.x - a.elbow.x, y: a.cuffEnd.y - a.elbow.y, z: a.cuffEnd.z - a.elbow.z };
      return -d.y / (Math.hypot(d.x, d.y, d.z) || 1);
    };
    const arm = (a: PianoArm) => armPlan(xz(a.shoulder), xz(a.elbow), xz(a.cuffEnd), null, false, null, rise(a), null, true, armB);
    const plan: TopPlan = { ...base, arms: { near: arm(p3.R), far: arm(p3.L) } };
    const near = handOf(p3.R, TOP_VIEW, plan.arms.near.opening, `piano|top|R|${key}`);
    const far = handOf(p3.L, TOP_VIEW, plan.arms.far.opening, `piano|top|L|${key}`);
    out = { plan, hands: { near, far }, cuffs: { near: armPaths(plan.arms.near, TOP_VIEW).cuffCloth, far: armPaths(plan.arms.far, TOP_VIEW).cuffCloth } };
  }
  cache.set(key, out);
  return out;
}

/** A hand painted outside its cuff's cloth (the wrist's skin comes out of the opening). */
function Hand({ h, cuff }: { h: FamHand; cuff: SkPath }) {
  return (
    <Group clip={cuff} invertClip>
      <FamilyHandV2 h={h} />
    </Group>
  );
}

/** The pianist on the bench (the bench is the lesson's, drawn by the caller). */
export const PianistV2 = memo(function PianistV2({ view, xKey, pedalX, dim = 1, legs = true, who = PIANIST_WHO, lip }: { view: 'side' | 'top'; xKey: number; pedalX: number; dim?: number; /** (from above) the legs under the keybed */ legs?: boolean; /** (a singer at the piano, E07) the lesson's singer */ who?: CastMember; /** (E07) where the lesson measures the singer's lips (side view): the mouth is drawn there */ lip?: { x: number; y: number } }) {
  const b = pianistBuilt(xKey, pedalX, view, who, lip);
  const nearHand = <Hand h={b.hands.near} cuff={b.cuffs.near} />;
  const farHand = <Hand h={b.hands.far} cuff={b.cuffs.far} />;
  if (view === 'side') return <PlayerSideV2 plan={b.plan as SidePlan} who={who} dim={dim} nearStick={nearHand} farStick={farHand} />;
  return <PlayerTopV2 plan={b.plan as TopPlan} who={who} dim={dim} legs={legs} bareArms nearStick={nearHand} farStick={farHand} />;
});

/** From above, the hands and forearms again OVER the keyboard (the piano's plan, drawn after the pianist,
 *  covers the keys the hands lie on): the pianist clipped to the keyboard's strip, from just before the key
 *  fronts. */
export function PianistHandsOverV2({ xKey, pedalX, dim = 1, who = PIANIST_WHO }: { xKey: number; pedalX: number; dim?: number; who?: CastMember }) {
  return (
    <Group clip={{ x: xKey - 40, y: -3000, width: 400, height: 6000 }}>
      <PianistV2 view="top" xKey={xKey} pedalX={pedalX} dim={dim} legs={false} who={who} />
    </Group>
  );
}
