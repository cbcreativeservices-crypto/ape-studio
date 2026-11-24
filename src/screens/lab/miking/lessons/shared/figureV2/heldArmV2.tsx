/**
 * FIGURE V2 — THE ARM THAT CARRIES THE MIC HAND (wave 3, step B; the study
 * page first — no lesson draws it yet). The approved sleeve (FigureV2Side.Arm:
 * one shirt sleeve from the shoulder through a real elbow to the cuff, the
 * upper arm and forearm tapering, the cuff's rim over the wrist) on a real
 * three-joint arm: the shoulder of the person, the elbow solved so the arm is
 * anatomically easy (heldHands.heldArmSolve: never above the shoulder, never
 * through the chest, the forearm meeting the handle at the grip model's angle,
 * the wrist straight), and the hand (heldHands.placeGrip) round the mic, its
 * wrist skin one outline with the palm, coming out of the cuff. The person is
 * drawn with that arm switched off (PersonOpts.noArm), so a new body never
 * carries an old arm.
 */
import type { ReactNode } from 'react';
import { ColorMatrix, Group, Paint } from '@shopify/react-native-skia';
import { useFigureScale } from './detail';
import { Arm, FAR_DIM, FAR_SKIN_DIM, type Torso } from './FigureV2Side';
import { ArmLite } from './lite';
import { armPaths } from './paths.ts';
import { armPlan } from './sidePlan.ts';
import type { Pt } from './geom.ts';
import { heldFrame, placeGrip, type HeldArm, type PlacedGrip, type V3 } from './heldHands.ts';
import { HeldHand, gripSilhouette } from './heldHandV2';

const dim = (k: number) => (
  <Paint>
    <ColorMatrix matrix={[k, 0, 0, 0, 0, 0, k, 0, 0, 0, 0, 0, k, 0, 0, 0, 0, 0, 1, 0]} />
  </Paint>
);

export type HeldArmPlan = {
  grip: PlacedGrip;
  arm: ReturnType<typeof armPlan>;
  /** The forearm runs away from the viewer (behind its own elbow). */
  away: boolean;
  /** The cuff's end on the forearm (world): the wrist skin runs from under it into the heel of the hand. */
  cuff3: V3;
  /** The mic lies nearer the viewer than the forearm's end: painted again over the sleeve (outside the hand). */
  micOver: boolean;
};

const sub3 = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add3 = (a: V3, b: V3): V3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const mul3 = (a: V3, k: number): V3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const unit3 = (a: V3): V3 => mul3(a, 1 / (Math.hypot(a.x, a.y, a.z) || 1));
const dot3 = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;

/**
 * The arm's plan for one frame: `sol` the solved arm (heldArmSolve), `aim` the mic's axis, `outward` the arm's
 * own side, `toward` the viewer, `proj` the view's projection, `R` the handle's radius where the hand closes,
 * `shoulder2` the drawn shoulder (the person's own, on the page).
 */
export function heldArmPlan(sol: HeldArm, aim: V3, outward: V3, toward: V3, proj: (p: V3) => Pt, R: number, shoulder2?: Pt, front?: V3): HeldArmPlan {
  const fr = heldFrame(sol.elbow, sol.fist, aim, 'R', outward);
  // the hand once, to find its wrist; then again with the forearm's skin from under the cuff
  const g0 = placeGrip(sol.fist, fr, toward, proj, R);
  const fore = unit3(sub3(g0.wrist3, sol.elbow));
  const cuff3 = sub3(g0.wrist3, mul3(fore, 46));
  const away = dot3(fore, toward) < -0.35;
  const S = shoulder2 ?? proj(sol.shoulder);
  const arm = armPlan(S, proj(sol.elbow), proj(add3(g0.wrist3, mul3(fore, -4))), null, away, null, 0, null, false, { one: true });
  // the wrist's skin starts at the cuff's opening (its near rim is painted over it): never inside the sleeve
  const { e, out } = arm.opening;
  const grip = placeGrip(sol.fist, fr, toward, proj, R, { wristFrom2: { u: e.c.u + out.u * 2, v: e.c.v + out.v * 2 } });
  const micOver = !!front && dot3(sub3(front, cuff3), toward) > 20;
  return { grip, arm, away, cuff3, micOver };
}

/** The arm, the hand and the mic (`mic`, painted where the hand's depth order puts it). `far`: the arm on the
 *  far side of the body (the far side's value step). */
export function HeldArmV2({ plan, torso, mic, far = false }: { plan: HeldArmPlan; torso: Torso; mic: ReactNode; far?: boolean }) {
  const lite = useFigureScale().level === 'lite';
  const P = armPaths(plan.arm, (p) => ({ u: p.x, v: p.y, d: p.z }));
  const hand = <HeldHand h={plan.grip} mic={mic} />;
  if (lite)
    return (
      <Group layer={far ? dim(FAR_DIM) : undefined}>
        <ArmLite a={plan.arm} P={P} stick={hand} />
        {plan.micOver ? (
          <Group clip={gripSilhouette(plan.grip)} invertClip>
            {mic}
          </Group>
        ) : null}
      </Group>
    );
  const over = plan.micOver ? (
    <Group clip={gripSilhouette(plan.grip)} invertClip>
      {mic}
    </Group>
  ) : null;
  return (
    <Group>
      <Arm a={plan.arm} P={P} t={torso} stick={hand} cloth={far ? dim(FAR_DIM) : undefined} skin={far ? dim(FAR_SKIN_DIM) : undefined} />
      {over}
    </Group>
  );
}
