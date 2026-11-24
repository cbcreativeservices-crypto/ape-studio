/**
 * F02 CLOTHING AND BODY MOVEMENT — the Foley artist in the new look (figure
 * V2, builder "Foley3", 2026-11-24). The artist is Mei of the cast (role
 * 'foley.performer', as F01 and F03–F05), on the lesson's own 3-D bodies
 * (geometry.ts HOLDER, WEARER: every joint below the shoulders, the jacket's
 * place, the gesture envelope unchanged).
 *
 *   HELD / LIVE  both hands closed round the jacket's gathered shoulders —
 *                the approved power grip (heldHands, as the boom operator's
 *                two hands, BoomV2/boomGrip: the leather through each fist,
 *                the fingers round its far side, the thumb round the near
 *                side the other way; a true left hand on the left arm), the
 *                backs of the hands turned out, the palms toward each other
 *                across the jacket, the elbows bent out and down; the jacket
 *                hanging between the arms: from the side the far arm, then
 *                the jacket, then the body, then the near arm.
 *   WORN         walking in place in the jacket (the approved cast jacket,
 *                jacketPlan / jacketV2, in leather brown over her rust shirt),
 *                the arms swinging past its front; from above the jacket over
 *                the shoulders, the arms hanging under them.
 * The cloth's folds are SOFT (paint.SoftFolds).
 */
import type { ReactNode } from 'react';
import { Group, Path, LinearGradient, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import { FigureV2Side } from '../shared/figureV2/FigureV2Side';
import { SideLite } from '../shared/figureV2/lite';
import { sidePaths } from '../shared/figureV2/paths.ts';
import { Blur, FigureScale, levelOf, useFigureScale } from '../shared/figureV2/detail';
import { FigureLook } from '../shared/figureV2/look';
import { SoftFolds } from '../shared/figureV2/paint';
import { FULL_HEAD_PT, PersonSideV2, PersonTopV2, personShapes, personTopCovers } from '../shared/figureV2/personV2';
import type { SidePlan } from '../shared/figureV2/sidePlan.ts';
import type { CastMember } from '../shared/figureV2/cast';
import { jacketSidePlan } from '../shared/figureV2/jacketPlan.ts';
import { Far, JacketSideBody, JacketSideBodyLite, JacketSleeve, JacketSleeveLite, coverOf, jacketSidePaths } from '../shared/figureV2/jacketV2';
import type { Material } from '../shared/figureV2/palette.ts';
import { inPoly, P, type Pt } from '../shared/figureV2/geom.ts';
import { FOLEY_PERFORMER, foleySidePlan, type FoleySpec } from '../shared/foley/foleyV2.ts';
import { sidePose, topPose } from '../shared/foley/performer.ts';
import { boomArmPlan, viewOf, type BoomArmPlan } from '../shared/figureV2/BoomV2';
import { operatorFrame, type BoomArm3 } from '../shared/figureV2/boomGrip.ts';
import { GripArmV2, gripSilhouette } from '../shared/fieldmics/gripArmV2';
import type { Torso } from '../shared/figureV2/FigureV2Side';
import { personPlan } from '../shared/figureV2/personV2';
import { personTopPlan } from '../shared/figureV2/topPerson.ts';
import { topPaths } from '../shared/figureV2/FigureV2Top';
import { PlayerTopV2 } from '../shared/figureV2/playersV2';
import { headOverNeck } from '../shared/figureV2/playersGrip.ts';
import { FLOOR, HOLDER, JACKET, WEARER } from './geometry.ts';

/** The leather of the worn jacket (the lesson's own leather, art.tsx LEATHER, as a cloth material). */
export const LEATHER_JACKET: Material = { form: ['#93603a', '#74482a', '#56331c', '#331d10', '#442817'], pos: [0, 0.2, 0.52, 0.8, 1], rim: '#c89a6e', edge: '#1c0f06', deep: '#140a04' };
/** Mei in the leather jacket: the same person, her jacket's tone the leather's. */
export const WEARER_WHO: CastMember = { ...FOLEY_PERFORMER, look: { ...FOLEY_PERFORMER.look, JACKET: LEATHER_JACKET } };

/** Where each fist closes on the jacket's gathered shoulder: ≈ 75 mm on along the forearm from the wrist. */
function fistAt(side: 'R' | 'L') {
  const el = side === 'R' ? HOLDER.elR : HOLDER.elL;
  const wr = side === 'R' ? HOLDER.wrR : HOLDER.wrL;
  const d = { x: wr.x - el.x, y: wr.y - el.y, z: wr.z - el.z };
  const l = Math.hypot(d.x, d.y, d.z) || 1;
  return { x: wr.x + (d.x / l) * 75, y: wr.y + (d.y / l) * 75, z: wr.z + (d.z / l) * 75 };
}
const FIST_R = fistAt('R');
const FIST_L = fistAt('L');
/** The gathered leather runs up and down through each fist (the jacket hanging out of the little-finger side). */
const GATHER_DIR = { x: 0, y: -1, z: 0 };
/** WORN: walking in place, the arms swinging empty past the jacket's front (F01's walk): the near foot
 *  forward at the heel strike, the far foot lifted behind. */
export const WORN_SPEC: FoleySpec = {
  R: { kind: 'swing' },
  L: { kind: 'swing' },
  soleR: { ball: P(WEARER.ftR.x, FLOOR - 100 * Math.sin(0.12)), slope: 0.12 },
  soleL: { ball: P(WEARER.ftL.x, FLOOR - 25 - 120 * Math.sin(0.2)), slope: -0.2 },
};

export const wornSide = () => foleySidePlan(WEARER, WORN_SPEC);
const HELD_SIDE_POSE = sidePose(HOLDER);
const HELD_TOP_POSE = topPose(HOLDER);

/** The holder's two arms on the jacket, for a view (memoised): the body's own shoulders, the elbows solved out
 *  and down (boomGrip.boomElbow), each hand the approved power grip round the gather. */
const heldCache = new Map<string, { arms: BoomArmPlan[]; torso: Torso }>();
export function heldArms(view: 'side' | 'top') {
  const hit = heldCache.get(view);
  if (hit) return hit;
  const who = FOLEY_PERFORMER;
  const o = operatorFrame(HOLDER.neck, { x: 1, y: 0, z: 0 });
  const vs = viewOf(view, o);
  // (the lesson's own elbows: hanging below and behind the hands, a little out — a jacket held at the chest,
  // not a pole overhead; boomGrip's elbow solve would wing them out)
  // (review 2026-11-24: from above "staple arms" — out from the shoulder, then forward at a right angle: the
  // elbow drawn a little further forward, lower and in, under the shoulder's line, so the upper arm hangs and
  // the arm runs on as one curve to the fist; the fists, the jacket and the envelope unchanged)
  const settle = (e: { x: number; y: number; z: number }) => ({ x: e.x + 40, y: e.y + 20, z: e.z * 0.9 });
  const arms3: BoomArm3[] = [
    { side: 'L', shoulder: HOLDER.shL, elbow: settle(HOLDER.elL), fist: FIST_L, reach: 0.8 },
    { side: 'R', shoulder: HOLDER.shR, elbow: settle(HOLDER.elR), fist: FIST_R, reach: 0.8 },
  ];
  let torso: Torso;
  let drawn: (side: 'L' | 'R', s3: { x: number; y: number; z: number }) => { s: Pt; far: boolean };
  if (view === 'side') {
    const plan = personPlan(HELD_SIDE_POSE, who, {});
    const sh = sidePaths(plan).shirt;
    const b = sh.getBounds();
    torso = { axis: [plan.hip, plan.neck], box: { x: b.x, y: b.y, width: b.width, height: b.height }, body: sh };
    // (facing +x, the near side is the right)
    drawn = (side) => (side === 'R' ? { s: plan.arms.near.shoulder, far: false } : { s: plan.arms.far.shoulder, far: true });
  } else {
    const plan = personTopPlan(HELD_TOP_POSE, who, {});
    const t = topPaths(plan).torso;
    const b = t.getBounds();
    torso = { axis: plan.torsoAxis, box: { x: b.x, y: b.y, width: b.width, height: b.height }, body: t };
    drawn = (_side, s3) => ({ s: vs.proj(s3), far: false });
  }
  const arms = arms3.map((a) => {
    const d = drawn(a.side, a.shoulder);
    return boomArmPlan(o, a, GATHER_DIR, vs, d.s, d.far);
  });
  const out = { arms, torso };
  heldCache.set(view, out);
  return out;
}
const WORN_TOP_POSE = topPose(WEARER);
let heldTopPlan: ReturnType<typeof personTopPlan> | null = null;
/** The holder from above without arms (drawn held, below), the head over the neck. */
const HELD_TOP_PLAN = () => (heldTopPlan ??= headOverNeck(personTopPlan(HELD_TOP_POSE, FOLEY_PERFORMER, {})));

/** The gathered leather inside a fist (side: a soft roll running up and down through it; from above: its end,
 *  a rounded fold), only within the hand's own outline — outside it the jacket's drawing shows. */
function Gather({ ap, view }: { ap: BoomArmPlan; view: 'side' | 'top' }) {
  const f = ap.hand.arm.fist;
  const at = view === 'side' ? { x: f.x, y: f.y } : { x: f.x, y: f.z };
  const p = Skia.Path.Make();
  if (view === 'side') {
    p.moveTo(at.x - 15, at.y - 90);
    p.cubicTo(at.x - 22, at.y - 30, at.x - 21, at.y + 30, at.x - 16, at.y + 90);
    p.lineTo(at.x + 18, at.y + 90);
    p.cubicTo(at.x + 22, at.y + 30, at.x + 21, at.y - 30, at.x + 15, at.y - 90);
    p.close();
  } else {
    // (from above: the gathered shoulder seen end-on inside the fist — its end only; round it the jacket's
    // cloth bunches, drawn on the jacket (Bunch))
    p.addOval(Skia.XYWHRect(at.x - 16, at.y - 12, 32, 24));
  }
  return (
    <Group clip={gripSilhouette(ap.hand.grip)}>
      <Path path={p}>
        <LinearGradient start={vec(at.x - 20, at.y - 20)} end={vec(at.x + 22, at.y + 20)} colors={['#7a4c2c', '#56331c', '#2e190b']} />
      </Path>
    </Group>
  );
}

/** The held jacket's outline from above, about (art.tsx HeldJacket's top body): the bunching stays on it. */
const JACKET_TOP_CLIP = (() => {
  const p = Skia.Path.Make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(-78, -JACKET.across - 15, 148, 2 * JACKET.across + 30), 70, 70));
  return p;
})();

/** From above: the jacket's leather bunched where a fist closes on it — a soft shadow under the hand and a few
 *  short folds running from it into the jacket (drawn on the jacket, before the arms). */
function Bunch({ ap }: { ap: BoomArmPlan }) {
  const f = ap.hand.arm.fist;
  const s = f.z > 0 ? -1 : 1;
  const shade = Skia.Path.Make();
  shade.addOval(Skia.XYWHRect(f.x - 70, f.z - 55, 140, 110));
  const folds = Skia.Path.Make();
  for (const [dx, dz] of [
    [-50, 70],
    [-8, 95],
    [40, 75],
  ]) {
    folds.moveTo(f.x + dx * 0.35, f.z + s * 30);
    folds.quadTo(f.x + dx * 0.8, f.z + s * dz * 0.6, f.x + dx, f.z + s * dz);
  }
  return (
    <Group>
      <Path path={shade} color="#1c0f06" opacity={0.45}>
        <Blur mm={14} />
      </Path>
      <Path path={folds} style="stroke" strokeWidth={9} strokeCap="round" color="#1f1006" opacity={0.35}>
        <Blur mm={3} />
      </Path>
    </Group>
  );
}

/** One held arm, its fist round the gather. */
function HeldArm({ ap, torso, view }: { ap: BoomArmPlan; torso: Torso; view: 'side' | 'top' }) {
  // (from above the gather's end inside the fist read as a hole: there the bunched jacket round the fist says it)
  return <GripArmV2 ap={ap} torso={torso} held={view === 'side' ? <Gather ap={ap} view={view} /> : null} />;
}

/** The figure's scale and level for the held arms drawn outside the person's own drawing (as BoomOperatorV2). */
function Scaled({ children }: { children: ReactNode }) {
  const v = useFigureScale();
  const ptPerMm = v.ptPerMm ?? null;
  const level = levelOf({ ptPerMm, level: v.level });
  return (
    <FigureScale ptPerMm={ptPerMm} level={level}>
      <FigureLook look={FOLEY_PERFORMER.look}>{children}</FigureLook>
    </FigureScale>
  );
}

/** HELD from the side: the far arm, the jacket, the body (arms off), the near arm. */
function HeldSide({ jacket }: { jacket: ReactNode }) {
  const H = heldArms('side');
  const far = H.arms.filter((a) => a.far);
  const near = H.arms.filter((a) => !a.far);
  return (
    <Scaled>
      {far.map((a, i) => (
        <HeldArm key={`f${i}`} ap={a} torso={H.torso} view="side" />
      ))}
      {jacket}
      <PersonSideV2 pose={HELD_SIDE_POSE} who={FOLEY_PERFORMER} opts={{ noArm: 'both' }} />
      {near.map((a, i) => (
        <HeldArm key={`n${i}`} ap={a} torso={H.torso} view="side" />
      ))}
    </Scaled>
  );
}

/** HELD from above: the jacket, the body, both arms over it (the lower hand first). */
function HeldTop({ jacket }: { jacket: ReactNode }) {
  const H = heldArms('top');
  const order = [...H.arms].sort((p, q) => q.hand.arm.fist.y - p.hand.arm.fist.y);
  return (
    <Scaled>
      {jacket}
      {jacket
        ? order.map((a, i) => (
            <Group key={`b${i}`} clip={JACKET_TOP_CLIP}>
              <Bunch ap={a} />
            </Group>
          ))
        : null}
      {/* (review 2026-11-24: from above "the nose a beak spike" — the head over the neck, only the nose's tip past
          the brow; the arms are the held ones below) */}
      <PlayerTopV2 plan={HELD_TOP_PLAN()} who={FOLEY_PERFORMER} />
      {order.map((a, i) => (
        <HeldArm key={i} ap={a} torso={H.torso} view="top" />
      ))}
    </Scaled>
  );
}

/** The person in profile with pieces slotted into the depth order (FigureV2Side's `over`). */
function SideWith({ plan, who, over, farStick, nearStick }: { plan: SidePlan; who: CastMember; over?: { far?: ReactNode; body?: ReactNode; near?: ReactNode }; farStick?: ReactNode; nearStick?: ReactNode }) {
  const v = useFigureScale();
  const ptPerMm = v.ptPerMm ?? null;
  const level = levelOf({ ptPerMm, level: v.level });
  const headPt = (ptPerMm ?? 0) * (plan.head.box.v1 - plan.head.box.v0);
  return (
    <FigureScale ptPerMm={ptPerMm} level={level}>
      <FigureLook look={who.look}>
        {level === 'lite' ? (
          <SideLite
            plan={plan}
            P={sidePaths(plan)}
            over={over}
            farStick={farStick}
            nearStick={nearStick}
            fullHead={
              headPt >= FULL_HEAD_PT ? (
                <FigureScale ptPerMm={ptPerMm} level="full">
                  <FigureV2Side plan={plan} part="head" />
                </FigureScale>
              ) : undefined
            }
          />
        ) : (
          <FigureV2Side plan={plan} over={over} farStick={farStick} nearStick={nearStick} />
        )}
      </FigureLook>
    </FigureScale>
  );
}

/** The worn jacket's pieces for the walking plan (personV2's jacket, on this plan). */
function wornJacket(plan: SidePlan, lite: boolean) {
  const J = jacketSidePlan(plan, WEARER_WHO.body, true);
  const JP = jacketSidePaths(J);
  const Pp = sidePaths(plan);
  const b = JP.body.getBounds();
  const box = { x: b.x, y: b.y, width: b.width, height: b.height };
  if (lite)
    return {
      far: (
        <Far>
          <JacketSleeveLite s={J.sleeves.far} P={JP.far} />
        </Far>
      ),
      body: <JacketSideBodyLite J={J} />,
      near: <JacketSleeveLite s={J.sleeves.near} P={JP.near} />,
    };
  return {
    far: (
      <Far>
        <JacketSleeve s={J.sleeves.far} P={JP.far} axis={J.axis} bodyBox={box} body={JP.body} cuff={Pp.far.cuffCloth} behind={plan.arms.far.behind ? { dx: -plan.facing * 5 } : undefined} />
      </Far>
    ),
    body: <JacketSideBody J={J} shirt={Pp.shirt} />,
    near: <JacketSleeve s={J.sleeves.near} P={JP.near} axis={J.axis} bodyBox={box} body={JP.body} cuff={Pp.near.cuffCloth} cover={coverOf(Pp.near.upper, JP.body)} />,
  };
}

function WornSide() {
  const v = useFigureScale();
  const lite = levelOf({ ptPerMm: v.ptPerMm ?? null, level: v.level }) === 'lite';
  const plan = wornSide();
  return <SideWith plan={plan} who={WEARER_WHO} over={wornJacket(plan, lite)} />;
}

/**
 * The artist in the new look, in the lesson's own depth order. `jacket`: the held jacket's drawing (art.tsx
 * HeldJacket) for the view, slotted between the far arm and the body (side) or under the arms (from above).
 */
export function ClothingPersonV2({ view, variant, jacket }: { view: ViewId; variant: VariantId; jacket: ReactNode }) {
  const worn = variant === 'worn';
  if (view === 'top') {
    return (
      <SoftFolds.Provider value>
        {worn ? (
          <PersonTopV2 pose={WORN_TOP_POSE} who={WEARER_WHO} opts={{ jacket: true }} />
        ) : (
          <HeldTop jacket={jacket} />
        )}
      </SoftFolds.Provider>
    );
  }
  return (
    <SoftFolds.Provider value>
      {worn ? (
        <WornSide />
      ) : (
        <HeldSide jacket={jacket} />
      )}
    </SoftFolds.Provider>
  );
}

/** Every outline the new artist paints in a view (labels and taps keep to them). */
/** A held arm's outlines: the sleeve, the cuff, the wrist, and the fist (a generous round). */
function armShapes(ap: BoomArmPlan, view: 'side' | 'top'): Pt[][] {
  const a = ap.arm;
  const f = ap.hand.arm.fist;
  const c = view === 'side' ? P(f.x, f.y) : P(f.x, f.z);
  const fist: Pt[] = Array.from({ length: 16 }, (_, i) => P(c.u + 62 * Math.cos((i / 16) * 2 * Math.PI), c.v + 62 * Math.sin((i / 16) * 2 * Math.PI)));
  return [a.upper, a.foreSleeve, a.cuff, a.wristSkin, fist];
}

export function clothingShapesV2(view: ViewId, variant: VariantId): Pt[][] {
  if (view !== 'side') return [];
  if (variant !== 'worn') {
    // (the body without its pose's arms: the held arms are drawn in their place)
    const plan = personPlan(HELD_SIDE_POSE, FOLEY_PERFORMER, {});
    const body = [plan.shirt, plan.head.skull, plan.head.hair, plan.head.neck, plan.legs.near.outline, plan.legs.near.lower, plan.legs.far.outline, plan.legs.far.lower, plan.shoes.near.upper, plan.shoes.far.upper];
    return [...body, ...heldArms('side').arms.flatMap((a) => armShapes(a, 'side'))];
  }
  const plan = wornSide();
  const shapes = personShapes(plan);
  const J = jacketSidePlan(plan, WEARER_WHO.body, true);
  shapes.push(J.body, J.sleeves.near.outline, J.sleeves.far.outline);
  return shapes;
}

/** Whether the new artist covers (u, v) within `tol` (mm). */
export function clothingCoversV2(view: ViewId, variant: VariantId, u: number, v: number, tol: number): boolean {
  if (view === 'top') {
    if (variant === 'worn') return personTopCovers(WORN_TOP_POSE, WEARER_WHO, { jacket: true }, u, v, tol);
    return topCovers(u, v, tol);
  }
  const shapes = clothingShapesV2(view, variant);
  const pts = tol > 0 ? [P(u, v), P(u - tol, v), P(u + tol, v), P(u, v - tol), P(u, v + tol)] : [P(u, v)];
  return pts.some((q) => shapes.some((sh) => inPoly(q, sh)));
}

/** From above, holding: the shoulders, head and both arms with their fists. */
function topCovers(u: number, v: number, tol: number): boolean {
  const plan = personTopPlan(HELD_TOP_POSE, FOLEY_PERFORMER, {});
  const shapes = [plan.torso, plan.head.skull, plan.head.hair, ...heldArms('top').arms.flatMap((a) => armShapes(a, 'top'))];
  const pts = tol > 0 ? [P(u, v), P(u - tol, v), P(u + tol, v), P(u, v - tol), P(u, v + tol)] : [P(u, v)];
  return pts.some((q) => shapes.some((sh) => inPoly(q, sh)));
}
