/**
 * DEV STUDY — THE ARM THAT CARRIES THE MIC HAND (figure V2 wave 3, step B;
 * owner GO 2026-11-24, "Mic hand passes"). The whole person of the cast with
 * the held arm (figureV2/heldArmV2: the approved sleeve on a solved arm, the
 * passed hand round the lesson's own mic), at the start, the middle and the end
 * of each move, side and from above:
 *   B10  the reporter's flag mic from their own mouth to the guest's;
 *   B03  the shared omni from between the two to the guest's mouth;
 *   B09  the seated commentator's lip ribbon, at the mouth and eased back.
 * And the two owner decisions still open, side by side: (a) B03 at the guest's
 * mouth with the reporter where they stand vs about 14 cm nearer the guest;
 * (b) the flag mic's handle drawn longer at the tail vs as it is today.
 * Study pages only: no lesson draws this yet; every measured point and printed
 * number is the lesson's own (the zones' starting places).
 */
import { Group } from '@shopify/react-native-skia';
import { aimVec } from '../screens/lab/miking/engine/geometry/vec';
import { heldFist } from '../screens/lab/miking/engine/geometry/arm';
import { B03_ZONES } from '../screens/lab/miking/lessons/b03FieldReporter/model';
import { REPORTER as R03, SHOULDER_REP as S03 } from '../screens/lab/miking/lessons/b03FieldReporter/geometry';
import { B10_ZONES } from '../screens/lab/miking/lessons/b10Sideline/model';
import { REPORTER as R10, SHOULDER_REP as S10 } from '../screens/lab/miking/lessons/b10Sideline/geometry';
import { B09_ZONES } from '../screens/lab/miking/lessons/b09Commentators/model';
import { CALLER, SHOULDER_A } from '../screens/lab/miking/lessons/b09Commentators/geometry';
import { standPoses, type Stander } from '../screens/lab/miking/lessons/shared/broadcast/standing';
import { talkerPose } from '../screens/lab/miking/lessons/shared/broadcast/BroadcastArt';
import { SEAT_Y, type Talker } from '../screens/lab/miking/lessons/shared/broadcast/talkerPose';
import { castFor, type CastMember } from '../screens/lab/miking/lessons/shared/figureV2/cast';
import { FigureLook } from '../screens/lab/miking/lessons/shared/figureV2/look';
import { PersonSideV2, PersonTopV2, personPlan, type PersonOpts } from '../screens/lab/miking/lessons/shared/figureV2/personV2';
import { personTopPlan, type PersonTopOpts } from '../screens/lab/miking/lessons/shared/figureV2/topPerson';
import { sidePaths } from '../screens/lab/miking/lessons/shared/figureV2/paths';
import { topPaths } from '../screens/lab/miking/lessons/shared/figureV2/FigureV2Top';
import type { Torso } from '../screens/lab/miking/lessons/shared/figureV2/FigureV2Side';
import { heldArmSolve, type HeldArm, type V3 } from '../screens/lab/miking/lessons/shared/figureV2/heldHands';
import { HeldArmV2, heldArmPlan } from '../screens/lab/miking/lessons/shared/figureV2/heldArmV2';
import type { PlayerPose } from '../screens/lab/miking/lessons/shared/players/playerPose';
import { FLAG, FLAG_BOTTOM, LIP, MicAt, REP_OMNI, TOWARD, gripR, proj, type Mic } from './heldStudy';

export type ArmCaseId = 'b10' | 'b3' | 'b9';
export type ArmOpt = { /** (a) the reporter about 14 cm nearer the guest */ stepIn?: boolean; /** (b) the flag mic drawn as today (not longer at the tail) */ flagToday?: boolean };
export const STEP_IN_MM = 140;

type Zone = { id: string; start: { p: V3; az: number; el: number } };
const CASES: Record<ArmCaseId, { title: string; move: string; zones: readonly Zone[]; from: string; to: string; ease?: number; t: Talker; shoulder: V3; mic: Mic; who: CastMember; seated: boolean }> = {
  b10: { title: 'B10 · the reporter’s flag mic', move: 'from the reporter’s own mouth to the guest’s', zones: B10_ZONES as never, from: 'b10.reporter', to: 'b10.hand', t: R10, shoulder: S10, mic: FLAG, who: castFor('talker.reporter'), seated: false },
  b3: { title: 'B03 · the shared omni', move: 'from between the two to the guest’s mouth', zones: B03_ZONES as never, from: 'b3.shared', to: 'b3.handoffOmni', t: R03, shoulder: S03, mic: REP_OMNI, who: castFor('talker.reporter'), seated: false },
  b9: { title: 'B09 · the seated commentator’s lip ribbon', move: 'at the mouth, then eased 14 mm back (the band’s far end)', zones: B09_ZONES as never, from: 'b9.lip', to: 'b9.lip', ease: 14, t: CALLER, shoulder: SHOULDER_A, mic: LIP, who: castFor('talker.host'), seated: true },
};
export const ARM_CASES = Object.keys(CASES) as ArmCaseId[];
export const armCaseTitle = (id: ArmCaseId) => `${CASES[id].title} — ${CASES[id].move}`;

const add3 = (a: V3, b: V3): V3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const mul3 = (a: V3, k: number): V3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const unit3 = (a: V3): V3 => mul3(a, 1 / (Math.hypot(a.x, a.y, a.z) || 1));
const lerp3 = (a: V3, b: V3, k: number): V3 => add3(mul3(a, 1 - k), mul3(b, k));

export type ArmFrame = {
  id: ArmCaseId;
  k: number;
  front: V3;
  aim: V3;
  mic: Mic;
  fist: V3;
  shoulder: V3;
  outward: V3;
  sol: HeldArm;
  talker: Talker;
};

/** One frame of a move (k: 0 start, 0.5 middle, 1 end). */
export function armFrame(id: ArmCaseId, k: number, o: ArmOpt = {}): ArmFrame {
  const c = CASES[id];
  const za = c.zones.find((q) => q.id === c.from)!.start;
  const zb = c.zones.find((q) => q.id === c.to)!.start;
  const aA = aimVec(za.az, za.el);
  const aB = aimVec(zb.az, zb.el);
  const pB = c.ease ? add3(zb.p, mul3(aB, -c.ease)) : zb.p;
  const front = lerp3(za.p, pB, k);
  const aim = unit3(lerp3(aA, aB, k));
  const longer = !!c.mic.drawLen && !o.flagToday;
  const mic: Mic = longer ? c.mic : { ...c.mic, drawLen: undefined };
  const fist = longer ? add3(front, mul3(aim, -(FLAG_BOTTOM + 47.5))) : heldFist(add3(front, mul3(aim, -c.mic.len)), aim);
  const dx = o.stepIn ? c.t.facing * STEP_IN_MM : 0;
  const talker: Talker = { ...c.t, lip: { ...c.t.lip, x: c.t.lip.x + dx } };
  const shoulder = { ...c.shoulder, x: c.shoulder.x + dx };
  const outward = { x: 0, y: 0, z: Math.sign(shoulder.z - talker.lip.z) || 1 };
  return { id, k, front, aim, mic, fist, shoulder, outward, sol: heldArmSolve(shoulder, fist, aim, outward), talker };
}

const box = (p: { getBounds: () => { x: number; y: number; width: number; height: number } }) => {
  const b = p.getBounds();
  return { x: b.x, y: b.y, width: b.width, height: b.height };
};

/** The person with the held arm and the mic, as the view sees it. */
export function ArmScene({ f, view }: { f: ArmFrame; view: 'side' | 'top' }) {
  const c = CASES[f.id];
  const toward = TOWARD[view];
  const P = (p: V3) => proj(view, p);
  // the arm on the far side of the body from this view (the reporter's right, from the side): painted first
  const far = view === 'side' && (f.shoulder.z - f.talker.lip.z) * toward.z < 0;
  // (a mic upright under a view from above is seen end-on: its flag's top and the grille, as the hand study)
  const endOn = view === 'top' && Math.hypot(f.aim.x, f.aim.z) < 0.35;
  const mic = <MicAt g={{ front: f.front, aim: f.aim, mic: f.mic }} view={view} endOn={endOn} />;
  if (view === 'side') {
    const pose: PlayerPose = c.seated ? talkerPose('side', f.talker) : standPoses(f.talker as Stander).side;
    const opts: PersonOpts = { ...(c.seated ? { lip: { u: f.talker.lip.x, v: f.talker.lip.y }, rest: 'restFlat' as const, seatV: SEAT_Y + f.talker.lip.y } : { rest: 'restSide' as const }), noArm: far ? 'far' : 'near' };
    const plan = personPlan(pose, c.who, opts);
    const shirt = sidePaths(plan).shirt;
    const torso: Torso = { axis: [plan.hip, plan.neck], box: box(shirt), body: shirt };
    const arm = heldArmPlan(f.sol, f.aim, f.outward, toward, P, gripR(f.mic), (far ? plan.arms.far : plan.arms.near).shoulder, f.front);
    const person = <PersonSideV2 pose={pose} who={c.who} opts={opts} />;
    const held = (
      <FigureLook look={c.who.look}>
        <HeldArmV2 plan={arm} torso={torso} mic={mic} far={far} />
      </FigureLook>
    );
    return <Group>{far ? [<Group key="a">{held}</Group>, <Group key="p">{person}</Group>] : [<Group key="p">{person}</Group>, <Group key="a">{held}</Group>]}</Group>;
  }
  const pose: PlayerPose = c.seated ? talkerPose('top', f.talker) : standPoses(f.talker as Stander).top;
  const opts: PersonTopOpts = c.seated ? { desk: true, noArm: 'near' } : {};
  const plan = personTopPlan(pose, c.who, opts);
  const T = topPaths(plan);
  const torso: Torso = { axis: plan.torsoAxis, box: box(T.torso), body: T.torso };
  const arm = heldArmPlan(f.sol, f.aim, f.outward, toward, P, gripR(f.mic), plan.arms.near.shoulder, f.front);
  return (
    <Group>
      {c.seated ? <PersonTopV2 pose={pose} who={c.who} opts={opts} part="lower" /> : null}
      <FigureLook look={c.who.look}>
        <HeldArmV2 plan={arm} torso={torso} mic={mic} />
      </FigureLook>
      <PersonTopV2 pose={pose} who={c.who} opts={opts} part={c.seated ? 'upper' : 'all'} />
    </Group>
  );
}

/** Where to centre a picture of the frame: `whole` the person and the arm, else the wrist and cuff. */
export function armCentre(f: ArmFrame, view: 'side' | 'top', what: 'whole' | 'wrist'): { u: number; v: number } {
  const P = (p: V3) => proj(view, p);
  if (what === 'wrist') {
    const e = P(f.sol.elbow);
    const q = P(f.fist);
    return { u: e.u * 0.35 + q.u * 0.65, v: e.v * 0.35 + q.v * 0.65 };
  }
  const s = P(f.shoulder);
  const q = P(f.front);
  return { u: (s.u + q.u) / 2, v: (s.v + q.v) / 2 + (view === 'side' ? 120 : 0) };
}
