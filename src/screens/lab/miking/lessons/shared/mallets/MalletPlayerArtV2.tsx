/**
 * THE MALLET-KEYBOARD PLAYER, DRAWN (figure V2, D78; the plan: malletPlayerV2.ts).
 * A cast member behind the keyboard, each hand the approved stick grip
 * (grip.ts) closed on its mallet's shaft and drawn in the approved hands'
 * language from this view (familyHand: the parts beyond the shaft, the shaft,
 * the parts in front of it), each arm the approved sleeve (FigureV2Side.Arm:
 * one sleeve from the shoulder through a bent elbow to the cuff, the wrist's
 * skin out of the cuff's opening). In the picture's depth order:
 *   'body'  the person with the arms off (from the front: PersonFrontV2; from
 *           above: PersonTopV2) — drawn before the keyboard (it hides the legs);
 *   'arms'  both arms and hands with their mallets' shafts — drawn over the
 *           bars (the mallets' heads are the lesson's, drawn after).
 * The person recedes as ONE opaque layer (blended toward the stage's dark).
 */
import { Group, LinearGradient, Paint, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import type { ReactNode } from 'react';
import type { Layout } from './malletSpec.ts';
import { FigureScale, levelOf, useFigureScale } from '../figureV2/detail';
import { Arm, type Torso } from '../figureV2/FigureV2Side';
import { ArmLite } from '../figureV2/lite';
import { armPaths, type SkPath } from '../figureV2/paths.ts';
import { armPlan, type ArmPlan } from '../figureV2/sidePlan.ts';
import { topPaths } from '../figureV2/FigureV2Top';
import { FigureV2Front, FigureV2FrontLite, PersonFrontV2, frontPaths, personFrontPlan } from '../figureV2/FigureV2Front';
import { FULL_HEAD_PT, headPt } from '../figureV2/personV2';
import type { PlayerPose } from '../players/playerPose.ts';
import { FigureLook } from '../figureV2/look';
import { recedeV2 } from '../figureV2/playersV2';
// (KeysGuitar3) the hands are the held grip (MalletGripArmArt, malletGripPlans); the old family-renderer fist is gone
import type { CastMember } from '../figureV2/cast';
import type { Pt } from '../figureV2/geom.ts';
import type { V3 } from '../players/handModel.ts';
import { liftRightFoot, malletBodyPoses, malletGrips, PEDAL_TOP, type MalletPair, type MalletView } from './malletPlayerV2.ts';
import { gripInView, openingOf, playerGripTopPlan, SIDE_VIEW, tiltTo, TOP_VIEW, type GripArm3, type GripTop } from '../figureV2/playersGrip.ts';
import { GripHand, PlayerTopV2 } from '../figureV2/playersV2';
import { unionOf } from '../figureV2/paths.ts';
import type { PlacedGrip } from '../figureV2/heldHands.ts';

const add = (a: V3, b: V3): V3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const mul = (a: V3, k: number): V3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const sub = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const unit = (a: V3): V3 => mul(a, 1 / (Math.hypot(a.x, a.y, a.z) || 1));

const torsoOf = (body: SkPath, axis: [Pt, Pt]): Torso => {
  const b = body.getBounds();
  return { axis, box: { x: b.x, y: b.y, width: b.width, height: b.height }, body };
};

/**
 * THE HELD MALLETS (review 2026-11-24, KeysGuitar3): each hand the approved held grip round its shaft
 * (malletGrips → playersGrip → heldHands placeGrip), each arm one sleeve from the shoulder through the solved
 * elbow to the cuff. From the front (the lesson's 'side'): the front figure without its arms, then these arms;
 * from above: the cast member's top plan with these arms (playerGripTopPlan, as M06 timpani).
 */
export type MalletGripArmPlan = { g: GripArm3; arm: ArmPlan; hand: PlacedGrip; P: ReturnType<typeof armPaths>; overCuff: boolean };
type MalletGripPlans = { grips: GripArm3[]; arms: MalletGripArmPlan[]; torso: Torso; top: GripTop | null; poses: ReturnType<typeof malletBodyPoses> };
const gripCache = new WeakMap<Layout, Map<string, MalletGripPlans>>();
export function malletGripPlans(L: Layout, yF: number, poses: MalletPair, who: CastMember, view: MalletView) {
  let m = gripCache.get(L);
  if (!m) {
    m = new Map();
    gripCache.set(L, m);
  }
  const key = `${who.id}:${view}:${yF}`;
  const hit = m.get(key);
  if (hit) return hit;
  const body = malletBodyPoses(L, yF, poses);
  const grips = malletGrips(L, yF, poses, who.body?.shoulder ?? 1);
  let out: MalletGripPlans;
  if (view === 'top') {
    const top = playerGripTopPlan(body.top, who, grips[0], grips[1]);
    const T = topPaths(top.plan);
    out = { grips, arms: [], torso: torsoOf(T.torso, top.plan.torsoAxis), top, poses: body };
  } else {
    const F = personFrontPlan(body.front, who, {});
    const torso = torsoOf(frontPaths(F).shirt, F.axis);
    const B = who.body;
    const vs = SIDE_VIEW;
    const arms = grips.map((g) => {
      const tilt = tiltTo(g, vs.toward);
      const arm = armPlan(F.arms[g.hand === 'R' ? 0 : 1].shoulder, vs.proj(g.elbow), vs.proj(g.wrist), null, false, null, tilt, null, false, { one: true, ...(B ? { k: B.shoulder, fore: B.limb } : {}) });
      const hand = gripInView(g, vs, openingOf(arm));
      return { g, arm, hand, P: armPaths(arm, (p) => ({ u: p.x, v: p.y, d: p.z })), overCuff: tilt > 0.3 };
    });
    out = { grips, arms, torso, top: null, poses: body };
  }
  m.set(key, out);
  return out;
}

/** A mallet's shaft (a light wooden dowel, ≈ 10 mm) from `a` to `b` (world). */
function Shaft({ a, b, proj, color }: { a: V3; b: V3; proj: (p: V3) => Pt; color: string }) {
  const p = Skia.Path.Make();
  const A = proj(a);
  const B = proj(b);
  p.moveTo(A.u, A.v);
  p.lineTo(B.u, B.v);
  return (
    <Group>
      <Path path={p} style="stroke" strokeWidth={10} strokeCap="round" color="#3b2a17" opacity={0.85} />
      <Path path={p} style="stroke" strokeWidth={8} strokeCap="round" color={color} />
      <Group transform={[{ translateX: -1 }, { translateY: -1.5 }]}>
        <Path path={p} style="stroke" strokeWidth={2.2} strokeCap="round" color="#fff6dc" opacity={0.45} />
      </Group>
    </Group>
  );
}

/** How far the shaft's end lies behind the fist's middle (mm): inside the heel of the palm, never out past it. */
export const BUTT_IN_PALM = 34;

/** One held arm from the front: the sleeve, then the hand round its shaft (GripHand: the parts behind the shaft, the
 *  shaft, the parts in front). A forearm coming toward the viewer: the hand over its cuff; otherwise the heel of the
 *  hand runs on inside the sleeve. */
function MalletGripArmArt({ ap, torso, rod, lite }: { ap: MalletGripArmPlan; torso: Torso; rod: ReactNode; lite: boolean }) {
  // (review 2026-11-24: "round ball shoulder caps on both shoulders") the sleeve GROWS OUT OF THE SHOULDER (BoomV2's
  // shoulderRoot rule, copied: it is private there): off the body nothing of the sleeve's round root above a line
  // across the shoulder; over the body its root fades into the shirt over its first few cm.
  const root = sleeveRoot(ap.arm, torso);
  return (
    <Group>
      {lite ? (
        <Group clip={root.clip}>
          <ArmLite a={ap.arm} P={ap.P} />
        </Group>
      ) : (
        <Group layer={<Paint />}>
          <Arm a={ap.arm} P={ap.P} t={torso} />
          <Path path={root.behindOff} color="black" blendMode="dstOut" />
          <Group clip={torso.body}>
            <Path path={root.plane} blendMode="dstOut">
              <LinearGradient start={vec(root.from.u, root.from.v)} end={vec(root.to.u, root.to.v)} colors={['black', 'rgba(0,0,0,0)']} />
            </Path>
          </Group>
        </Group>
      )}
      <GripHand grip={ap.hand} rod={rod} hide={ap.overCuff ? undefined : unionOf(ap.P.foreSleeve, ap.P.upper)} />
    </Group>
  );
}

/** BoomV2 shoulderRoot (private there), for a hanging arm seen from the front: the half-plane on the arm's side of
 *  a line across the shoulder, square to the upper arm, `back` mm behind the shoulder point. */
const ROOT_FADE = 34;
/** The shoulder's slope from the front, out and down (degrees). */
const SHOULDER_SLOPE = 22;
/** The deltoid's round where the shoulder turns down into the arm (mm). */
const DELTOID_R = 34;
function sleeveRoot(a: ArmPlan, t: Torso, back = 6): { clip: SkPath; behindOff: SkPath; plane: SkPath; from: Pt; to: Pt } {
  const s = a.shoulder;
  // (from the front a hanging arm: the line runs along the shoulder's own slope — the trapezius carried on out and
  // down by SHOULDER_SLOPE — so what stays of the sleeve's round root is the deltoid's curve on the OUTER side,
  // running on from the shirt's shoulder; never a square corner, never a ball above the shoulder line)
  const out = Math.sign(s.u - t.axis[1].u) || 1;
  const sl = (SHOULDER_SLOPE * Math.PI) / 180;
  const n = { u: out * Math.cos(sl), v: Math.sin(sl) };
  // (du: square to that line, toward the arm — downward)
  const du = { u: -n.v * out, v: Math.cos(sl) };
  const far = 5000;
  const o = { u: s.u - du.u * back, v: s.v - du.v * back };
  // (the deltoid's round: where the slope line meets the upper sleeve's outer edge, the corner rounded off by
  // DELTOID_R — the shoulder curves over into the arm)
  const edgeU = a.upper.filter((q) => q.v < s.v + 160).reduce((m, q) => (out > 0 ? Math.max(m, q.u) : Math.min(m, q.u)), s.u);
  const tC = (edgeU - o.u) / (n.u || 1e-6);
  const C = { u: edgeU, v: o.v + n.v * tC };
  const P1 = { u: C.u - n.u * DELTOID_R, v: C.v - n.v * DELTOID_R };
  const P2 = { u: C.u, v: C.v + DELTOID_R * 1.3 };
  const half = Skia.Path.Make();
  half.moveTo(o.u - n.u * far, o.v - n.v * far);
  half.lineTo(P1.u, P1.v);
  half.quadTo(C.u, C.v, P2.u, P2.v);
  half.lineTo(P2.u + out * far, P2.v);
  half.lineTo(P2.u + out * far, P2.v + far);
  half.lineTo(o.u - n.u * far, P2.v + far);
  half.close();
  const plane = Skia.Path.Make();
  plane.addRect(Skia.XYWHRect(s.u - far, s.v - far, 2 * far, 2 * far));
  const behind = Skia.Path.MakeFromOp(plane, half, PathOp.Difference) ?? Skia.Path.Make();
  return {
    clip: Skia.Path.MakeFromOp(half, t.body, PathOp.Union) ?? half,
    behindOff: Skia.Path.MakeFromOp(behind, t.body, PathOp.Difference) ?? behind,
    plane,
    from: o,
    to: { u: o.u + du.u * ROOT_FADE, v: o.v + du.v * ROOT_FADE },
  };
}

/** From the front, the player with the right shoe on the damper pedal's top (liftRightFoot). */
function PedalFront({ pose, who, yF, level, ptPerMm }: { pose: PlayerPose; who: CastMember; yF: number; level: 'full' | 'lite'; ptPerMm: number | null }) {
  const F = liftRightFoot(personFrontPlan(pose, who, {}), pose.kneeR.v, yF, PEDAL_TOP);
  return level === 'lite' ? <FigureV2FrontLite F={F} arms={false} fullHead={headPt(pose, ptPerMm) >= FULL_HEAD_PT} /> : <FigureV2Front F={F} arms={false} />;
}

/**
 * The player. `part` 'body' (before the keyboard) or 'arms' (over the bars, with the shafts); `shaftColor` the
 * lesson's mallet wood; `dim` the person's recession (one opaque layer).
 */
export function MalletPlayerV2({ L, yF, poses, who, view, part, shaftColor, dim = 1 }: { L: Layout; yF: number; poses: MalletPair; who: CastMember; view: MalletView; part: 'body' | 'arms'; shaftColor: string; dim?: number }) {
  const v = useFigureScale();
  const level = levelOf(v);
  const B = malletGripPlans(L, yF, poses, who, view);
  const proj = view === 'top' ? TOP_VIEW.proj : SIDE_VIEW.proj;
  // (the shaft from its end in the heel of the palm to the lesson's head)
  const shaft = (g: GripArm3) => <Shaft a={add(g.fist, mul(g.rod, -BUTT_IN_PALM))} b={poses[g.hand === 'R' ? 0 : 1].head} proj={proj} color={shaftColor} />;
  let body: ReactNode;
  if (part === 'body') {
    body = view === 'side' ? (
      L.row.extras.damper === 'pedal' ? (
        <PedalFront pose={B.poses.front} who={who} yF={yF} level={level} ptPerMm={v.ptPerMm} />
      ) : (
        <PersonFrontV2 pose={B.poses.front} who={who} arms={false} />
      )
    ) : null;
  } else if (view === 'top' && B.top) {
    // (from above the whole player over the keyboard's near rail, as the timpanist: the head over the neck, each
    // hand round its shaft — PlayerTopV2 draws its own recession and scale)
    return <PlayerTopV2 plan={B.top.plan} grips={B.top} who={who} dim={dim} nearStick={shaft(B.grips[0])} farStick={shaft(B.grips[1])} />;
  } else {
    body = (
      <Group>
        {B.arms.map((ap, i) => (
          <MalletGripArmArt key={i} ap={ap} torso={B.torso} rod={shaft(ap.g)} lite={level === 'lite'} />
        ))}
      </Group>
    );
  }
  return (
    <FigureScale ptPerMm={v.ptPerMm} level={level}>
      <FigureLook look={who.look}>
        <Group layer={recedeV2(dim) as never}>{body}</Group>
      </FigureLook>
    </FigureScale>
  );
}
