/**
 * THE HAND-HELD BOOM POLE'S OPERATOR, DRAWN IN THE NEW LOOK (figure V2,
 * builder "Foley3", 2026-11-24; the rig: poleRigV2.ts). The lessons' art
 * passes it as LessonArt.PoleOperator with `poleOperatorOver`: the engine
 * draws its pole from the mic's tail to the hands, then this operator OVER
 * it, in the local frame the engine moves and turns (the rear fist at the
 * origin, facing −u). The operator is a cast member ('operator.boomFoley',
 * never the lesson's performer or walker) holding the pole LOW in front in
 * both hands — the approved sleeves and two-handed power grip (gripArmV2: the
 * pole through each fist, fingers one side, thumb the other; a true left hand
 * on the left arm), the elbows hanging low (poleRigV2.lowElbow) — and the
 * pole's thick rear section with a twist-lock collar where the engine's
 * thinner pole carries on to the mic. In the figure's depth order:
 *   side: the far arm (a value step down), the body, the pole, the near arm;
 *   from above: the body, both arms (the lower hand first), the pole.
 * `pole`: the engine's pole shape (its slope at the hands, the hands' height,
 * the side view mirrored) — the operator is re-solved for it, so both fists
 * stay on the pole as the mic is dragged. The cloth's folds are soft.
 */
import { Fragment, type ReactNode } from 'react';
import { Group, Path, Skia } from '@shopify/react-native-skia';
import type { ViewId } from '../../../engine/model/types.ts';
import { castFor, type CastMember } from '../figureV2/cast';
import { boomArmPlan, viewOf, type BoomArmPlan } from '../figureV2/BoomV2';
import { operatorFrame } from '../figureV2/boomGrip.ts';
import { gripSilhouette } from '../figureV2/heldHandV2';
import { PersonSideV2, PersonTopV2, personPlan } from '../figureV2/personV2';
import { personTopPlan } from '../figureV2/topPerson.ts';
import { sidePaths } from '../figureV2/paths.ts';
import { topPaths } from '../figureV2/FigureV2Top';
import type { Torso } from '../figureV2/FigureV2Side';
import { FigureScale, levelOf, useFigureScale } from '../figureV2/detail';
import { FigureLook } from '../figureV2/look';
import { SoftFolds } from '../figureV2/paint';
import type { Pt } from '../figureV2/geom.ts';
import type { V3 } from '../figureV2/heldHands.ts';
import { GripArmV2, PoleSegV2 } from './gripArmV2';
import { LEVEL_POLE, poleArms, poleRig, type PoleRig, type PoleShape } from './poleRigV2.ts';

export const POLE_OPERATOR_WHO = castFor('operator.boomFoley');

const v3 = (x: number, y: number, z: number): V3 => ({ x, y, z });
const sub = (a: V3, b: V3): V3 => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const add = (a: V3, b: V3): V3 => v3(a.x + b.x, a.y + b.y, a.z + b.z);
const mul = (a: V3, k: number): V3 => v3(a.x * k, a.y * k, a.z * k);
const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const unit = (a: V3): V3 => mul(a, 1 / (Math.hypot(a.x, a.y, a.z) || 1));

/** The rig for a view's pole shape (the person's shoulder build). */
export const poleRigFor = (pole: PoleShape | undefined): PoleRig => poleRig(pole ?? LEVEL_POLE, POLE_OPERATOR_WHO.body?.shoulder ?? 1);

type Plans = { arms: BoomArmPlan[]; torso: Torso; proj: (p: V3) => Pt; poleDir: V3 };
const cache = new WeakMap<PoleRig, Map<string, Plans>>();

/** The operator's arms and torso for a view (memoised per rig, person and view). */
export function polePlans(rig: PoleRig, who: CastMember, view: 'side' | 'top'): Plans {
  let m = cache.get(rig);
  if (!m) {
    m = new Map();
    cache.set(rig, m);
  }
  const key = `${who.id}:${view}`;
  const hit = m.get(key);
  if (hit) return hit;
  const s = rig.flip ? -1 : 1;
  const o = operatorFrame(v3(rig.side.neck.u, rig.side.neck.v, rig.top.neck.v), v3(-s, 0, 0));
  const vs = viewOf(view, o);
  const poleDir = unit(sub(rig.pole.a, rig.pole.b));
  const arms3 = poleArms(rig, who.body?.shoulder ?? 1);
  let torso: Torso;
  let drawn: (a: (typeof arms3)[number]) => { s: Pt; far: boolean };
  if (view === 'side') {
    const plan = personPlan(rig.side, who, {});
    const sh = sidePaths(plan).shirt;
    const b = sh.getBounds();
    torso = { axis: [plan.hip, plan.neck], box: { x: b.x, y: b.y, width: b.width, height: b.height }, body: sh };
    // (the drawn shoulders are the side plan's: the near one is the arm nearer the viewer, +z)
    const L3 = arms3.find((a) => a.side === 'L')!;
    const R3 = arms3.find((a) => a.side === 'R')!;
    const nearSide = dot(sub(sub(L3.shoulder, L3.lift), sub(R3.shoulder, R3.lift)), vs.toward) > 0 ? 'L' : 'R';
    drawn = (a) => (a.side === nearSide ? { s: plan.arms.near.shoulder, far: false } : { s: plan.arms.far.shoulder, far: true });
  } else {
    const plan = personTopPlan(rig.top, who, {});
    const t = topPaths(plan).torso;
    const b = t.getBounds();
    torso = { axis: plan.torsoAxis, box: { x: b.x, y: b.y, width: b.width, height: b.height }, body: t };
    drawn = (a) => ({ s: vs.proj(sub(a.shoulder, a.lift)), far: false });
  }
  const arms = arms3.map((a) => {
    const d = drawn(a);
    // (a shoulder that rose toward a reach carries the sleeve's root with it)
    const l = vs.proj(sub(a.shoulder, a.lift));
    const p = vs.proj(a.shoulder);
    return boomArmPlan(o, a, poleDir, vs, { u: d.s.u + (p.u - l.u), v: d.s.v + (p.v - l.v) }, d.far);
  });
  const out = { arms, torso, proj: vs.proj, poleDir };
  m.set(key, out);
  return out;
}

/** The pole's piece through a fist (inside the hand's own outline only; seen end-on, the piece nearer the
 *  viewer) — BoomV2.BoomArmArt's. */
function PoleInFist({ ap, P }: { ap: BoomArmPlan; P: Plans }) {
  const f = ap.hand.arm.fist;
  return (
    <Group clip={gripSilhouette(ap.hand.grip)}>
      {ap.hand.endOn ? <PoleSegV2 a={f} b={add(f, mul(P.poleDir, 600 * ap.toViewer))} proj={P.proj} /> : <PoleSegV2 a={add(f, mul(P.poleDir, 600))} b={add(f, mul(P.poleDir, -600))} proj={P.proj} />}
    </Group>
  );
}

/** The twist-lock collar at the thick section's end (≈ 40 mm long, a little proud of the tube). */
function Collar({ rig, proj }: { rig: PoleRig; proj: (p: V3) => Pt }) {
  const { at, dir } = rig.collar;
  const A = proj(add(at, mul(dir, -18)));
  const B = proj(add(at, mul(dir, 22)));
  const p = Skia.Path.Make();
  p.moveTo(A.u, A.v);
  p.lineTo(B.u, B.v);
  return (
    <Group>
      <Path path={p} style="stroke" strokeWidth={39} strokeCap="butt" color="#08090b" />
      <Path path={p} style="stroke" strokeWidth={35} strokeCap="butt" color="#2a2c32" />
      <Group transform={[{ translateX: -1.2 }, { translateY: -1.8 }]}>
        <Path path={p} style="stroke" strokeWidth={5} strokeCap="butt" color="#c9ced8" opacity={0.4} />
      </Group>
    </Group>
  );
}

/** The operator over the engine's pole (LessonArt.PoleOperator with poleOperatorOver). */
export function PoleOperatorV2({ view, pole }: { view: ViewId; pole?: PoleShape; hk?: number }) {
  const v = useFigureScale();
  const ptPerMm = v.ptPerMm ?? null;
  const level = levelOf({ ptPerMm, level: v.level });
  const side = view === 'side';
  const rig = poleRigFor(side ? pole : pole ? { ...pole, flip: false } : undefined);
  const who = POLE_OPERATOR_WHO;
  const P = polePlans(rig, who, side ? 'side' : 'top');
  const hands = P.arms.map((a) => gripSilhouette(a.hand.grip)).reduce((acc, p) => {
    const q = acc.copy();
    q.addPath(p);
    return q;
  }, Skia.Path.Make());
  const poleArt = (
    <Group>
      <Group clip={hands} invertClip>
        <PoleSegV2 a={rig.pole.a} b={rig.pole.b} proj={P.proj} />
      </Group>
      <Collar rig={rig} proj={P.proj} />
    </Group>
  );
  const arm = (a: BoomArmPlan, i: number) => <GripArmV2 key={i} ap={a} torso={P.torso} held={<PoleInFist ap={a} P={P} />} />;
  let body: ReactNode;
  if (side) {
    body = (
      <Group>
        {P.arms.filter((a) => a.far).map(arm)}
        <PersonSideV2 pose={rig.side} who={who} opts={{ noArm: 'both' }} />
        {poleArt}
        {P.arms.filter((a) => !a.far).map(arm)}
      </Group>
    );
  } else {
    const order = [...P.arms].sort((p, q) => q.hand.arm.fist.y - p.hand.arm.fist.y);
    body = (
      <Group>
        <PersonTopV2 pose={rig.top} who={who} />
        {order.map(arm)}
        {poleArt}
      </Group>
    );
  }
  return (
    <SoftFolds.Provider value>
      <FigureScale ptPerMm={ptPerMm} level={level}>
        <FigureLook look={who.look}>
          {/* (the engine mirrors a side view whose mic lies toward −x: the rig is authored facing the other way
              and mirrored back here, so the figure itself is never drawn in a mirror) */}
          <Group transform={rig.flip ? [{ scaleX: -1 }] : []}>
            <Fragment>{body}</Fragment>
          </Group>
        </FigureLook>
      </FigureScale>
    </SoftFolds.Provider>
  );
}
