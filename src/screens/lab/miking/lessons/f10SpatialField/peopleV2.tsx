/**
 * F10 SPATIAL FIELD PICKUP — the people in the new look (figure V2, builder
 * "Foley3", 2026-11-24), on the lesson's own poses (scene.tsx: the street
 * singer and the event's performer facing back toward the listener, the walker
 * crossing toward the viewer, the listener from above) — every joint, every
 * label's place and every rig where it was:
 *   the singer / performer  Ana (the voice family's singer), in profile with
 *                           her mouth on the lesson's mouth point, hands at
 *                           rest; from above the approved standing top view;
 *   the walker              Kofi, face-on from the side (he walks toward the
 *                           viewer, mid-stride: the approved front view on the
 *                           lesson's stride), from above walking down the plan;
 *   the listener            Mei from above at the listener's point — and the
 *                           same head on the in-ear and playback pictures.
 * A person further off stays OPAQUE (blended toward the dark, playersV2
 * recedeV2), never see-through.
 */
import { Group } from '@shopify/react-native-skia';
import type { ViewId } from '../../engine/model/types.ts';
import { pt, type PlayerPose } from '../shared/players/playerPose.ts';
import { TORSO_FRONT } from '../shared/broadcast/standing.ts';
import { castFor } from '../shared/figureV2/cast';
import { PersonSideV2, personCovers, personTopCovers } from '../shared/figureV2/personV2';
import { StandingTopV2 } from '../shared/figureV2/playersV2';
import { headOverNeck } from '../shared/figureV2/playersGrip.ts';
import { PersonFrontV2, personFrontPlan } from '../shared/figureV2/FigureV2Front';
import { personTopPlan } from '../shared/figureV2/topPerson.ts';
import { recedeV2 } from '../shared/figureV2/playersV2';
import { inPoly, P, type Pt } from '../shared/figureV2/geom.ts';
import { operatorTop } from '../shared/measure/measureModel.ts';

export const SINGER_WHO = castFor('spatial.singer');
export const WALKER_WHO = castFor('spatial.walker');
export const LISTENER_WHO = castFor('spatial.listener');

/** The singer's options: her mouth on the pose's own mouth point (the lips), hands at rest at the sides. */
const singerOpts = (mouth: { x: number; y: number }) => ({ lip: { u: mouth.x, v: mouth.y }, rest: 'restSide' as const });

/** The singer (or performer) facing back toward the listener: profile or from above. */
export function SingerV2({ view, poses, mouth, dim = 0.92 }: { view: ViewId; poses: { side: PlayerPose; top: PlayerPose }; mouth: { x: number; y: number }; dim?: number }) {
  // (review 2026-11-24: from above the head sat at the front edge, the face poking out — StandingTopV2)
  return <Group layer={recedeV2(dim) as never}>{view === 'side' ? <PersonSideV2 pose={poses.side} who={SINGER_WHO} opts={singerOpts(mouth)} /> : <StandingTopV2 pose={poses.top} who={SINGER_WHO} />}</Group>;
}

/**
 * The walker face-on, on the approved front figure's own skeleton (TORSO_FRONT: its shoulders where the front
 * plan's trapezius and sleeves expect them — the old walker's shoulders, 26 mm under the neck, made the new
 * sleeves bulge above the shoulder line), placed at the walker's x on the ground, a little of the stride kept
 * in the arms: the left forearm swung forward (the hand higher). (The front figure stands its two feet on one
 * floor line: the old drawing's stride had both feet on the ground too.)
 */
const frontCache = new Map<number, PlayerPose>();
export function walkerFront(x: number): PlayerPose {
  const hit = frontCache.get(x);
  if (hit) return hit;
  const T = TORSO_FRONT;
  const dv = -(T.floor ?? 0);
  const m = (q: { u: number; v: number }, du = 0, dvv = 0) => pt(x + q.u + du, q.v + dv + dvv);
  const pose: PlayerPose = {
    ...T,
    head: { c: m(T.head.c), r: T.head.r },
    neck: m(T.neck),
    shoulderR: m(T.shoulderR),
    shoulderL: m(T.shoulderL),
    elbowR: m(T.elbowR, -4, -4),
    elbowL: m(T.elbowL, -2, -24),
    handR: { ...T.handR, wrist: m(T.handR.wrist, -6, -10) },
    handL: { ...T.handL, wrist: m(T.handL.wrist, -14, -70), dir: T.handL.dir + 0.12 },
    hipR: m(T.hipR),
    hipL: m(T.hipL),
    kneeR: m(T.kneeR),
    kneeL: m(T.kneeL),
    footR: m(T.footR),
    footL: m(T.footL),
    floor: 0,
  };
  frontCache.set(x, pose);
  return pose;
}

/** The walker: face-on from the side (walking toward the viewer), from above walking down the plan. */
export function WalkerV2({ view, poses, dim = 0.8 }: { view: ViewId; poses: { side: PlayerPose; top: PlayerPose }; dim?: number }) {
  return <Group layer={recedeV2(dim) as never}>{view === 'side' ? <PersonFrontV2 pose={walkerFront(poses.side.neck.u)} who={WALKER_WHO} /> : <StandingTopV2 pose={poses.top} who={WALKER_WHO} />}</Group>;
}

/** The listener from above, standing at the listener's point. */
export function ListenerTopV2({ pose, dim = 0.8 }: { pose: PlayerPose; dim?: number }) {
  return (
    <Group layer={recedeV2(dim) as never}>
      <StandingTopV2 pose={pose} who={LISTENER_WHO} />
    </Group>
  );
}

const ptsOf = (u: number, v: number, tol: number): Pt[] => (tol > 0 ? [P(u, v), P(u - tol, v), P(u + tol, v), P(u, v - tol), P(u, v + tol)] : [P(u, v)]);

/** Whether the singer, as drawn, covers (u, v) within `tol`. */
export function singerCoversV2(view: ViewId, poses: { side: PlayerPose; top: PlayerPose }, mouth: { x: number; y: number }, u: number, v: number, tol: number): boolean {
  return view === 'side' ? personCovers(poses.side, SINGER_WHO, singerOpts(mouth), u, v, tol) : personTopCovers(poses.top, SINGER_WHO, {}, u, v, tol);
}

/** Whether the walker, as drawn, covers (u, v) within `tol`. */
export function walkerCoversV2(view: ViewId, poses: { side: PlayerPose; top: PlayerPose }, u: number, v: number, tol: number): boolean {
  if (view === 'top') return personTopCovers(poses.top, WALKER_WHO, {}, u, v, tol);
  const F = personFrontPlan(walkerFront(poses.side.neck.u), WALKER_WHO);
  const shapes: Pt[][] = [F.shirt, F.seat, F.head.skull, F.head.hair, F.head.neck, ...F.legs.map((l) => l.outline), ...F.shoes.map((s) => s.upper), ...F.arms.flatMap((a) => [a.sleeve, a.cuff, a.wristSkin, ...a.hand.parts.map((q) => q.placed)])];
  return ptsOf(u, v, tol).some((q) => shapes.some((sh) => inPoly(q, sh)));
}

/* ── the head alone from above (the in-ear wearer, the playback listener) ── */

/** The head from above, placed so its ears sit where the picture needs them: the ears' middle at `mid`, the
 *  ears `half` mm either side of it across `axis` (0: the ears along ±v, the face toward +u; π/2: the ears
 *  along ±u, the face toward −v), the person's own head drawn at the scale that puts them there. */
const HEAD_POSE = operatorTop(0, 0, 1);
function headFit(face: number) {
  // (the head as StandingTopV2 draws it: over the neck)
  const plan = headOverNeck(personTopPlan(HEAD_POSE, LISTENER_WHO, {}));
  const c = plan.head.ears.map((e) => P(e.reduce((s, q) => s + q.u, 0) / e.length, e.reduce((s, q) => s + q.v, 0) / e.length));
  const mid = P((c[0].u + c[1].u) / 2, (c[0].v + c[1].v) / 2);
  const half = Math.hypot(c[0].u - c[1].u, c[0].v - c[1].v) / 2;
  return { mid, half, face };
}
const FIT = headFit(0);
/** (tests) the drawn head's ears, unscaled: their middle and half-spacing. */
export const HEAD_EARS = { mid: FIT.mid, half: FIT.half };

export function ListenerHeadV2({ mid, half, face }: { mid: Pt; half: number; /** the way the face points (radians, 0 = +u) */ face: number }) {
  const k = half / FIT.half;
  return (
    <Group transform={[{ translateX: mid.u }, { translateY: mid.v }, { rotate: face }, { scale: k }, { translateX: -FIT.mid.u }, { translateY: -FIT.mid.v }]}>
      <StandingTopV2 pose={HEAD_POSE} who={LISTENER_WHO} head="only" />
    </Group>
  );
}
