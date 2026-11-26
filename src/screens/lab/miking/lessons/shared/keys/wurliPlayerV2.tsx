/**
 * THE REED PIANO'S PLAYER in the new look (figure V2, wave 3 set 3c of D78,
 * 2026-11-24): Kofi of the cast on the lesson's bench (wurliPlayer.ts: the
 * same seated body, the same bench, keep-outs and pedal), now a real person
 * turned to face the keys (−x) — the current picture was the pianist's figure
 * mirrored, so the side camera (+z) sees the player's LEFT side — at the keys
 * the way a pianist plays (the arms and hands solved exactly as the C11
 * pianist's, piano/pianistPlanV2.keysArm: the forearm level, the wrist level
 * with the knuckles, the fingers curved with one pad on each white key, the
 * thumb along its key near the front). Each hand drawn in the approved hands'
 * language (figureV2/familyHand) out of the approved sleeve's cuff.
 *   side   'behind' — the far (right) arm and hand, then the body; 'front' —
 *          the near (left) arm and hand over the keys;
 *   above  'behind' — the legs, shoulders and head; 'front' — both arms and
 *          hands over the keys.
 * The near foot rests on the sustain pedal where the lesson draws it (on the
 * camera's side of the player: the LEFT foot — see the hand-back).
 */
import { memo } from 'react';
import { BlurMask, Group, Path } from '@shopify/react-native-skia';
import type { V3 } from '../players/handModel.ts';
import type { PlayerPose } from '../players/playerPose.ts';
import { castFor } from '../figureV2/cast';
import { armPlan, sidePlan, type SidePlan } from '../figureV2/sidePlan.ts';
import { personTopPlan } from '../figureV2/topPerson.ts';
import type { TopPlan } from '../figureV2/topPlan.ts';
import { armPaths, sidePaths, type SkPath } from '../figureV2/paths.ts';
import { familyHand, type FamHand } from '../figureV2/familyHand.ts';
import { FamilyHandV2 } from '../figureV2/familyHandV2';
import { PlayerArmV2, PlayerBodyV2, PlayerTopV2, recedeV2 } from '../figureV2/playersV2';
import { Arm, type Torso } from '../figureV2/FigureV2Side';
import { ArmLite } from '../figureV2/lite';
import { topPaths } from '../figureV2/FigureV2Top';
import { FigureScale, levelOf, useFigureScale } from '../figureV2/detail';
import { FigureLook } from '../figureV2/look';
import { P, type Pt } from '../figureV2/geom.ts';
import { BODY } from '../players/playerPose.ts';
import { keysArm, type PianoArm } from '../piano/pianistPlanV2.ts';
import { WURLI_PLAYER_SIDE, WURLI_PLAYER_TOP, WURLI_SEAT_Y } from './wurliPlayer.ts';
import { W } from './wurliModel.ts';

export const WURLI_WHO = castFor('player.wurli');

const SIDE_VIEW = (p: V3) => ({ u: p.x, v: p.y, d: p.z });
const TOP_VIEW = (p: V3) => ({ u: p.x, v: p.z, d: -p.y });

/**
 * (review 2026-11-24, KeysGuitar2: the lesson seats the player ≈ 63 cm behind the key fronts — 19 cm further back
 * than the C11 pianist — so upright arms had to REACH, the elbows well in front of the body. A player sitting
 * back leans in from the hips: the upper body ≈ 45 mm toward the keys (≈ 16° from the hips instead of 10°), the
 * hips, legs, bench, pedal and every keep-out where the lesson has them. Drawing only.)
 * (owner ruling 2026-11-26: the bench and the body moved 100 mm toward the keys instead — wurliPlayer.ts
 * WURLI_SEAT_CLOSER — so the extra lean is gone: the back is the pose's own, ≈ 10° forward from the hips.)
 */
const LEAN = P(0, 0);
const leanUp = (q: Pt): Pt => P(q.u + LEAN.u, q.v + LEAN.v);
const SIDE_POSE: PlayerPose = {
  ...WURLI_PLAYER_SIDE,
  head: { ...WURLI_PLAYER_SIDE.head, c: leanUp(WURLI_PLAYER_SIDE.head.c) },
  neck: leanUp(WURLI_PLAYER_SIDE.neck),
  shoulderR: leanUp(WURLI_PLAYER_SIDE.shoulderR),
  shoulderL: leanUp(WURLI_PLAYER_SIDE.shoulderL),
};
/** From above the same lean: the authored pose turns round its neck, so the upper body moves by the lean as it is
 *  and everything below is moved back by the lean turned into the authored frame (it stays where it was). */
const TOP_POSE: PlayerPose = (() => {
  const p = WURLI_PLAYER_TOP;
  const a = P(LEAN.u, 0);
  const t = -((p.facing ?? 0) - Math.PI / 2);
  const ia = P(a.u * Math.cos(t) - a.v * Math.sin(t), a.u * Math.sin(t) + a.v * Math.cos(t));
  const up = (q: Pt) => P(q.u + a.u, q.v + a.v);
  const low = (q: Pt) => P(q.u + a.u - ia.u, q.v + a.v - ia.v);
  return {
    ...p,
    head: { ...p.head, c: up(p.head.c) },
    neck: up(p.neck),
    shoulderR: up(p.shoulderR),
    shoulderL: up(p.shoulderL),
    elbowR: low(p.elbowR),
    elbowL: low(p.elbowL),
    handR: { ...p.handR, wrist: low(p.handR.wrist) },
    handL: { ...p.handL, wrist: low(p.handL.wrist) },
    hipR: low(p.hipR),
    hipL: low(p.hipL),
    kneeR: low(p.kneeR),
    kneeL: low(p.kneeL),
    footR: low(p.footR),
    footL: low(p.footL),
  };
})();

let arms: { R: PianoArm; L: PianoArm } | null = null;
/** The player's own right and left arms (facing −x: the right shoulder is the far one, −z). */
export function wurliArms(): { R: PianoArm; L: PianoArm } {
  if (arms) return arms;
  const S = SIDE_POSE;
  const one = (side: 'R' | 'L', sh: Pt): PianoArm => {
    const z = side === 'R' ? -BODY.shoulderHalf : BODY.shoulderHalf;
    const now = keysArm({ keyFront: W.keyFrontX, keyTop: W.keyTopY, facing: -1, side, shoulder: { x: sh.u, y: sh.v, z } });
    // (the hands are PARKED, owner 2026-11-26: each keeps the drawing it had before the seat moved — fitted
    // from the shoulder it was fitted from then — and only the arm up to it is the new seat's)
    const was = HAND_FIT_SHOULDER[side];
    const kept = keysArm({ keyFront: W.keyFrontX, keyTop: W.keyTopY, facing: -1, side, shoulder: { x: was.u, y: was.v, z } });
    const o = kept.sk.frame.o;
    const d = { x: o.x - now.elbow.x, y: o.y - now.elbow.y, z: o.z - now.elbow.z };
    const k = 16 / (Math.hypot(d.x, d.y, d.z) || 1);
    return { ...now, sk: kept.sk, pads: kept.pads, cuffEnd: { x: o.x + d.x * k, y: o.y + d.y * k, z: o.z + d.z * k } };
  };
  arms = { R: one('R', S.shoulderL), L: one('L', S.shoulderR) };
  return arms;
}
/** The shoulders the hands were fitted from before the seat moved (the bench 100 mm farther back, the upper
 *  body leaning in 45 mm): the hands keep that fit exactly. */
export const HAND_FIT_SHOULDER = { R: P(517, -1000), L: P(504, -990) } as const;

const handFrom = (a: { opening: { e: { c: Pt }; out: Pt } }) => P(a.opening.e.c.u + a.opening.out.u * 2, a.opening.e.c.v + a.opening.out.v * 2);

type SideBuilt = { plan: SidePlan; near: FamHand; far: FamHand; cuffs: { near: SkPath; far: SkPath } };
let side: SideBuilt | null = null;
export function wurliSideV2(): SideBuilt {
  if (side) return side;
  const A = wurliArms();
  const p2 = (q: V3) => P(q.x, q.y);
  // (the pose's near slot — R — is the player's LEFT arm; the far slot the right)
  const pose: PlayerPose = {
    ...SIDE_POSE,
    elbowR: p2(A.L.elbow),
    elbowL: p2(A.R.elbow),
    handR: { ...SIDE_POSE.handR, wrist: p2(A.L.cuffEnd) },
    handL: { ...SIDE_POSE.handL, wrist: p2(A.R.cuffEnd) },
    // (the far knee drawn a little behind the near one — drawing only — so both legs read; facing −x, behind is +x)
    kneeL: P(WURLI_PLAYER_SIDE.kneeL.u + 50, WURLI_PLAYER_SIDE.kneeL.v),
  };
  const plan = sidePlan(pose, { head: WURLI_WHO.head, body: WURLI_WHO.body, seatV: WURLI_SEAT_Y, nod: 12 });
  const SP = sidePaths(plan);
  side = {
    plan,
    near: familyHand(A.L.sk, SIDE_VIEW, 'wurli|side|L', { from: handFrom(plan.arms.near) }),
    far: familyHand(A.R.sk, SIDE_VIEW, 'wurli|side|R', { from: handFrom(plan.arms.far) }),
    cuffs: { near: SP.near.cuffCloth, far: SP.far.cuffCloth },
  };
  return side;
}

type TopBuilt = { plan: TopPlan; near: FamHand; far: FamHand; cuffs: { near: SkPath; far: SkPath } };
let top: TopBuilt | null = null;
export function wurliTopV2(): TopBuilt {
  if (top) return top;
  const A = wurliArms();
  const base = personTopPlan(TOP_POSE, WURLI_WHO, { desk: true });
  const B = WURLI_WHO.body;
  const armB = B ? { one: true, k: B.shoulder, fore: B.limb } : {};
  const xz = (q: V3): Pt => P(q.x, q.z);
  const arm = (a: PianoArm) => {
    const d = { x: a.cuffEnd.x - a.elbow.x, y: a.cuffEnd.y - a.elbow.y, z: a.cuffEnd.z - a.elbow.z };
    return armPlan(xz(a.shoulder), xz(a.elbow), xz(a.cuffEnd), null, false, null, -d.y / (Math.hypot(d.x, d.y, d.z) || 1), null, true, armB);
  };
  // (from above the plan's `near` is the pose's R side — the player's left here, as in the side view)
  const plan: TopPlan = { ...base, arms: { near: arm(A.L), far: arm(A.R) } };
  top = {
    plan,
    near: familyHand(A.L.sk, TOP_VIEW, 'wurli|top|L', { from: handFrom(plan.arms.near) }),
    far: familyHand(A.R.sk, TOP_VIEW, 'wurli|top|R', { from: handFrom(plan.arms.far) }),
    cuffs: { near: armPaths(plan.arms.near, TOP_VIEW).cuffCloth, far: armPaths(plan.arms.far, TOP_VIEW).cuffCloth },
  };
  return top;
}

function HandOut({ h, cuff }: { h: FamHand; cuff: SkPath }) {
  return (
    <Group clip={cuff} invertClip>
      <FamilyHandV2 h={h} />
    </Group>
  );
}

/** The reed piano's player: `part` 'behind' (drawn before the case) or 'front' (over the keys). */
export const WurliPlayerV2 = memo(function WurliPlayerV2({ view, part, dim = 1 }: { view: 'side' | 'top'; part: 'behind' | 'front'; dim?: number }) {
  if (view === 'side') {
    const b = wurliSideV2();
    if (part === 'behind')
      return (
        <Group>
          <PlayerArmV2 plan={b.plan} who={WURLI_WHO} which="far" dim={dim} stick={<HandOut h={b.far} cuff={b.cuffs.far} />} />
          <PlayerBodyV2 plan={b.plan} who={WURLI_WHO} dim={dim} />
        </Group>
      );
    return <PlayerArmV2 plan={b.plan} who={WURLI_WHO} which="near" dim={dim} stick={<HandOut h={b.near} cuff={b.cuffs.near} />} />;
  }
  const b = wurliTopV2();
  if (part === 'behind') return <PlayerTopV2 plan={b.plan} who={WURLI_WHO} dim={dim} legs />;
  return <TopArms b={b} dim={dim} />;
});

function TopArms({ b, dim }: { b: TopBuilt; dim: number }) {
  const v = useFigureScale();
  const level = levelOf({ ptPerMm: v.ptPerMm, level: v.level });
  const T = topPaths(b.plan);
  const bb = T.torso.getBounds();
  const torso: Torso = { axis: b.plan.torsoAxis, box: { x: bb.x, y: bb.y, width: bb.width, height: bb.height }, body: T.torso };
  const one = (which: 'near' | 'far') => {
    const stick = <HandOut h={b[which]} cuff={b.cuffs[which]} />;
    return level === 'lite' ? <ArmLite a={b.plan.arms[which]} P={T[which]} stick={stick} /> : <Arm a={b.plan.arms[which]} P={T[which]} t={torso} stick={stick} />;
  };
  return (
    <FigureScale ptPerMm={v.ptPerMm} level={level}>
      <FigureLook look={WURLI_WHO.look}>
        <Group layer={recedeV2(dim) as never}>
          {/* (the arms go in UNDER the shoulders: nothing of them is painted inside the shoulders' cloth, and the
              shoulders' soft shadow lies on them at the root) */}
          <Group clip={T.torso} invertClip>
            {one('far')}
            {one('near')}
            {(['far', 'near'] as const).map((w) => (
              <Group key={w} clip={T[w].upper}>
                <Group transform={[{ translateX: 6 }, { translateY: 8 }]}>
                  <Path path={T.torso} color="#000" opacity={0.3}>
                    <BlurMask blur={8} style="normal" />
                  </Path>
                </Group>
              </Group>
            ))}
          </Group>
        </Group>
      </FigureLook>
    </FigureScale>
  );
}
