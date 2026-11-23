/**
 * FIGURE V2 — A PERSON IN PROFILE, DRAWN (the owner's figure realism pass,
 * D78, 2026-11-22). The parts of sidePlan.ts, painted far to near in one
 * light (the drums' key light, upper left):
 *   contact shadows (seat, floor) → the far leg and shoe → the far arm, its
 *   hand round its stick → the near shoe, the trousers (seat and near leg) →
 *   the neck (the jaw's shadow on it) → the head (the face's planes, the eye,
 *   the nose, the lips, the hair, the ear) → the shirt (its light running on
 *   over the shoulder into the sleeve, the near arm's shadow, the folds at
 *   the waist, the belt, the collar with its own shadow) → the near arm, its
 *   hand round its stick.
 * EDGES: crisp where a form turns sharply or lies over another (the jaw over
 * the neck, the cuff over the wrist, a sole on a pedal), soft where a form
 * rolls away (the hair's edge, a lit rim). No black outline.
 * The far side is the same paint a value step down — the far hand the SAME
 * skin a small step down, never another colour.
 * Everything is built once per pose (sidePlan + sidePaths are memoised);
 * nothing is computed per frame.
 */
import type { ReactNode } from 'react';
import { BlurMask, ColorMatrix, Group, LinearGradient, Mask, Paint, Path, vec } from '@shopify/react-native-skia';
import { LIGHT, lerp, type Pt } from './geom.ts';
import { BELT, LIP, MAT, SOLE } from './palette.ts';
import { AuthoredHand, Folds, Form, HandV2, Soft, across } from './paint';
import { sidePaths, type ArmPaths, type ShoePaths, type SidePaths, type SkPath } from './paths.ts';
import type { ArmPlan, SidePlan } from './sidePlan.ts';

/** The far side's value step: clothing a step down, skin only a small step
 *  (the two hands are one person's: test/figureV2Example_20261122). */
export const FAR_DIM = 0.74;
export const FAR_SKIN_DIM = 0.92;
const dimLayer = (k: number) => (
  <Paint>
    <ColorMatrix matrix={[k, 0, 0, 0, 0, 0, k, 0, 0, 0, 0, 0, k, 0, 0, 0, 0, 0, 1, 0]} />
  </Paint>
);
const FAR = dimLayer(FAR_DIM);
const FAR_SKIN = dimLayer(FAR_SKIN_DIM);

type Torso = { axis: [Pt, Pt]; box: { x: number; y: number; width: number; height: number }; body: SkPath };

/** The shirt's own light (the torso's form gradient and its fall-off) on any path. */
function ShirtLight({ path, t }: { path: SkPath; t: Torso }) {
  const [s, e] = across(t.axis[0], t.axis[1], 120);
  const b = t.box;
  return (
    <Group>
      <Path path={path}>
        <LinearGradient start={vec(s.u, s.v)} end={vec(e.u, e.v)} colors={MAT.shirt.form} positions={MAT.shirt.pos} />
      </Path>
      <Path path={path}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.22)']} />
      </Path>
    </Group>
  );
}

/**
 * THE UPPER SLEEVE, ONE CLOTH WITH THE SHIRT (owner: "no shoulder knob",
 * "plug and position interchangeable limbs"): at the shoulder the sleeve
 * wears the shirt's own light, so back, shoulder and arm turn in one
 * gradient; the arm's own round light fades in down the upper arm. Inside the
 * shirt's silhouette it has no outline — only the set-in seam, soft.
 */
function UpperSleeve({ a, P, t }: { a: ArmPlan; P: ArmPaths; t: Torso }) {
  const f0 = lerp(a.shoulder, a.elbow, 0.08);
  const f1 = lerp(a.shoulder, a.elbow, 0.55);
  return (
    <Group>
      <ShirtLight path={P.upper} t={t} />
      <Mask
        mode="alpha"
        mask={
          <Path path={P.upper}>
            <LinearGradient start={vec(f0.u, f0.v)} end={vec(f1.u, f1.v)} colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']} />
          </Path>
        }
      >
        <Form path={P.upper} mat={MAT.shirt} axis={a.upperAxis} w={46} rim={6} edge={0} />
      </Mask>
      <Group clip={P.upper}>
        <Folds path={P.folds} mat={MAT.shirt} opacity={0.55} />
        {/* the set-in seam round the arm's root, and the cloth's slight dip below it */}
        <Path path={P.armhole} style="stroke" strokeWidth={4} strokeCap="round" color={MAT.shirt.deep} opacity={0.16}>
          <BlurMask blur={2.2} style="normal" />
        </Path>
        <Path path={P.armhole} style="stroke" strokeWidth={1} strokeCap="round" color={MAT.shirt.deep} opacity={0.35} />
      </Group>
      {/* an outline only where the sleeve is the figure's silhouette */}
      <Group clip={t.body} invertClip>
        <Path path={P.upper} style="stroke" strokeWidth={1} color={MAT.shirt.edge} opacity={0.5} />
      </Group>
    </Group>
  );
}

/** The forearm in its sleeve, the cuff (crisp over the wrist), the bare wrist and its bone. */
function Forearm({ a, P }: { a: ArmPlan; P: ArmPaths }) {
  return (
    <Group>
      <Form path={P.wristSkin} mat={MAT.skin} axis={a.foreAxis} w={24} rim={3} edge={0.8}>
        <Soft path={P.ulna} color={MAT.skin.rim} opacity={0.35} blur={2} />
      </Form>
      <Form path={P.foreSleeve} mat={MAT.shirt} axis={a.foreAxis} w={38} rim={5} edge={0.9}>
        <Folds path={P.folds} mat={MAT.shirt} opacity={0.5} />
      </Form>
      <Form path={P.cuff} mat={MAT.shirt} axis={a.foreAxis} w={33} rim={3} edge={0}>
        {/* the cuff's seam where it meets the sleeve */}
        <Path path={P.foreSleeve} style="stroke" strokeWidth={1.2} color={MAT.shirt.deep} opacity={0.5} />
      </Form>
      {/* the cuff's edge lies over the wrist: crisp, with its shadow on the skin */}
      <Group clip={P.wristSkin}>
        <Group transform={[{ translateX: -LIGHT.u * 3 }, { translateY: -LIGHT.v * 3 }]}>
          <Path path={P.cuff} color={MAT.skin.deep} opacity={0.4}>
            <BlurMask blur={2} style="normal" />
          </Path>
        </Group>
      </Group>
      <Path path={P.cuff} style="stroke" strokeWidth={1.1} color={MAT.shirt.edge} opacity={0.75} />
    </Group>
  );
}

function Arm({ a, P, t, stick, cloth, skin }: { a: ArmPlan; P: ArmPaths; t: Torso; stick?: ReactNode; cloth?: ReactNode; skin?: ReactNode }) {
  const upper = (
    <Group layer={cloth as never}>
      <UpperSleeve a={a} P={P} t={t} />
    </Group>
  );
  const fore = (
    <Group layer={cloth as never}>
      <Forearm a={a} P={P} />
    </Group>
  );
  const hand = P.art ? (
    <Group layer={skin as never}>
      <AuthoredHand a={P.art} stick={stick} />
    </Group>
  ) : P.hand ? (
    <Group layer={skin as never}>
      <HandV2 hand={P.hand} under={P.wristSkin} stick={stick} />
    </Group>
  ) : (
    (stick ?? null)
  );
  // A forearm running away from the viewer is behind its own elbow: the
  // forearm, the cuff and the hand first, the upper sleeve over them.
  return a.away ? (
    <Group>
      {fore}
      {hand}
      {upper}
    </Group>
  ) : (
    <Group>
      {upper}
      {fore}
      {hand}
    </Group>
  );
}

/** The shin's own cylinder light (a soft blend at the knee). */
function Shin({ path, axis }: { path: SkPath; axis: [Pt, Pt] }) {
  const [s0, e0] = across(axis[0], axis[1], 52);
  return (
    <Path path={path}>
      <LinearGradient start={vec(s0.u, s0.v)} end={vec(e0.u, e0.v)} colors={MAT.trousers.form} positions={MAT.trousers.pos} />
      <BlurMask blur={5} style="normal" />
    </Path>
  );
}

function Leg({ path, shin, knee, folds, l, shoe }: { path: SkPath; shin: SkPath; knee: SkPath; folds: SkPath; l: SidePlan['legs']['near']; shoe: SkPath }) {
  return (
    <Group>
      <Form path={path} mat={MAT.trousers} axis={l.thighAxis} w={82} rim={6}>
        <Shin path={shin} axis={l.shinAxis} />
        <Soft path={knee} color={MAT.trousers.rim} opacity={0.22} blur={6} />
        <Folds path={folds} mat={MAT.trousers} />
      </Form>
      {/* the hem's shadow on the shoe */}
      <Group clip={shoe}>
        <Group clip={path} invertClip>
          <Group transform={[{ translateX: -LIGHT.u * 5 }, { translateY: -LIGHT.v * 5 }]}>
            <Path path={path} color="#000" opacity={0.4}>
              <BlurMask blur={2.5} style="normal" />
            </Path>
          </Group>
        </Group>
      </Group>
    </Group>
  );
}

function Shoe({ s }: { s: ShoePaths }) {
  const b = s.upper.getBounds();
  return (
    <Group>
      <Soft path={s.contact} opacity={0.55} blur={6} />
      <Form path={s.upper} mat={MAT.leather} rim={4} edge={0.9}>
        <Path path={s.laces} style="stroke" strokeWidth={3} strokeCap="round" color={MAT.leather.deep} opacity={0.75} />
        <Group transform={[{ translateX: LIGHT.u * 1.4 }, { translateY: LIGHT.v * 1.4 }]}>
          <Path path={s.laces} style="stroke" strokeWidth={1.4} strokeCap="round" color={MAT.leather.rim} opacity={0.5} />
        </Group>
        {/* the toe box's specular, small */}
        <Path path={s.upper} opacity={0.35}>
          <LinearGradient start={vec(b.x + b.width * 0.55, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['rgba(255,235,215,0)', 'rgba(255,235,215,0.0)', 'rgba(255,235,215,0.35)', 'rgba(255,235,215,0)']} positions={[0, 0.55, 0.72, 0.9]} />
        </Path>
      </Form>
      <Path path={s.sole}>
        <LinearGradient start={vec(b.x, b.y + b.height - 14)} end={vec(b.x, b.y + b.height)} colors={[SOLE.top, SOLE.bottom]} />
      </Path>
      <Path path={s.sole} style="stroke" strokeWidth={0.8} color={SOLE.edge} opacity={0.6} />
    </Group>
  );
}

function Head({ plan, P }: { plan: SidePlan; P: SidePaths }) {
  const h = plan.head;
  const c = lerp({ u: h.box.u0, v: h.box.v0 }, { u: h.box.u1, v: h.box.v1 }, 0.5);
  const R = (h.box.u1 - h.box.u0) / 2;
  return (
    <Group>
      {/* THE NECK: a column, the sternomastoid's form, the jaw's cast shadow, darker into the collar */}
      {/* (the head's own round light, so neck and head meet without a seam; the neck a little in the head's shadow) */}
      <Form path={P.neck} mat={MAT.skin} round={{ c, r: R }} rim={4} edge={0.8}>
        <Soft path={P.scm} color={MAT.skin.rim} opacity={0.14} blur={4} />
        <Path path={P.jawShadow} color={MAT.skin.deep} opacity={0.5}>
          <BlurMask blur={4} style="normal" />
        </Path>
        <Soft path={P.neckOcclusion} color={MAT.skin.deep} opacity={0.45} blur={4} />
      </Form>
      {/* THE HEAD */}
      <Form path={P.skull} mat={MAT.skin} round={{ c, r: R }} rim={5} edge={0}>
        {/* the front of the face turns away from the light */}
        <Path path={P.skull}>
          <LinearGradient start={vec(h.frontShade.a.u, h.frontShade.a.v)} end={vec(h.frontShade.b.u, h.frontShade.b.v)} colors={['rgba(58,32,22,0.32)', 'rgba(58,32,22,0)']} />
        </Path>
        <Soft path={P.cheekShade} color={MAT.skin.deep} opacity={0.12} blur={6} />
        <Soft path={P.socket} color={MAT.skin.deep} opacity={0.36} blur={4} />
        <Soft path={P.noseSide} color={MAT.skin.deep} opacity={0.14} blur={2.5} />
        {P.lights.map((l, i) => (
          <Soft key={i} path={l} color={MAT.skin.rim} opacity={i === 1 ? 0.3 : i === 0 ? 0.1 : 0.15} blur={i === 1 ? 1.8 : 5} />
        ))}
        <Path path={P.nasolabial} style="stroke" strokeWidth={3} strokeCap="round" color={MAT.skin.deep} opacity={0.14}>
          <BlurMask blur={1.8} style="normal" />
        </Path>
        {/* the nostril's wing: its own small form, the crease behind it */}
        <Path path={P.ala} color={MAT.skin.form[1]} opacity={0.2} />
        <Path path={P.alaCrease} style="stroke" strokeWidth={1.5} strokeCap="round" color={MAT.skin.deep} opacity={0.5} />
        <Path path={P.nostril} color={MAT.skin.deep} opacity={0.65} />
        <Path path={P.lips} color={LIP} opacity={0.42} />
        <Path path={P.mouth} style="stroke" strokeWidth={1.5} strokeCap="round" color={MAT.skin.deep} opacity={0.7} />
        <Soft path={P.underLip} color={MAT.skin.deep} opacity={0.35} blur={1.6} />
        {/* the eye: a sliver of the eye under the lowered lid, the iris low and forward */}
        <Path path={P.eye} color="#d6c8bd" opacity={0.62} />
        <Group clip={P.eye}>
          <Path path={P.iris} color="#2c1d16" opacity={0.9} />
        </Group>
        <Path path={P.lid} color={MAT.hair.edge} opacity={0.82} />
        <Path path={P.lidCrease} style="stroke" strokeWidth={1.1} strokeCap="round" color={MAT.skin.deep} opacity={0.42} />
        <Path path={P.brow} color={MAT.hair.form[2]} opacity={0.78}>
          <BlurMask blur={0.7} style="normal" />
        </Path>
      </Form>
      {/* the mandible over the neck: a crisp edge */}
      <Path path={P.jaw} style="stroke" strokeWidth={1.3} strokeCap="round" color={MAT.skin.edge} opacity={0.55} />
      {/* THE HAIR: one calm dark shape — its soft edge, the clumps along the growth, a sheen along the skull */}
      <Soft path={P.hair} color={MAT.skin.deep} opacity={0.3} blur={2.5} clip={P.skull} />
      <Path path={P.hair}>
        <LinearGradient start={vec(c.u + LIGHT.u * R, c.v + LIGHT.v * R)} end={vec(c.u - LIGHT.u * R, c.v - LIGHT.v * R)} colors={[MAT.hair.form[1], MAT.hair.form[2], MAT.hair.form[3]]} />
        <BlurMask blur={1.1} style="normal" />
      </Path>
      <Group clip={P.hair}>
        {P.clumps.map((q, i) => (
          <Group key={i}>
            <Path path={q} color={MAT.hair.form[i % 2 === 0 ? 1 : 3]} opacity={0.2}>
              <BlurMask blur={2.4} style="normal" />
            </Path>
            <Path path={q} style="stroke" strokeWidth={0.9} color={MAT.hair.deep} opacity={0.16}>
              <BlurMask blur={0.6} style="normal" />
            </Path>
          </Group>
        ))}
        <Path path={P.sheen} style="stroke" strokeWidth={9} strokeCap="round" color={MAT.hair.rim} opacity={0.2}>
          <BlurMask blur={4} style="normal" />
        </Path>
      </Group>
      <Form path={P.ear} mat={MAT.skin} round={{ c, r: R }} rim={3} edge={0.7}>
        <Path path={P.ear} color={MAT.skin.deep} opacity={0.12} />
        <Path path={P.earBowl} color={MAT.skin.deep} opacity={0.5}>
          <BlurMask blur={1.4} style="normal" />
        </Path>
        <Path path={P.earRim} style="stroke" strokeWidth={2.2} strokeCap="round" color={MAT.skin.deep} opacity={0.45} />
        <Path path={P.earFold} style="stroke" strokeWidth={2.4} strokeCap="round" color={MAT.skin.rim} opacity={0.16}>
          <BlurMask blur={1} style="normal" />
        </Path>
      </Form>
    </Group>
  );
}

export type FigureV2SideProps = {
  plan: SidePlan;
  /** The far hand's stick (drawn between its fingers behind and in front). */
  farStick?: ReactNode;
  nearStick?: ReactNode;
};

/** The whole person in profile, far to near. */
export function FigureV2Side({ plan, farStick, nearStick }: FigureV2SideProps) {
  const P = sidePaths(plan);
  const L = plan.legs;
  const sb = P.shirt.getBounds();
  const torso: Torso = { axis: [plan.hip, plan.neck], box: { x: sb.x, y: sb.y, width: sb.width, height: sb.height }, body: P.shirt };
  return (
    <Group>
      {P.seatShadow ? <Soft path={P.seatShadow} opacity={0.6} blur={10} /> : null}
      <Group layer={FAR}>
        <Shoe s={P.shoeFar} />
        <Leg path={P.legFar} shin={P.shinFar} knee={P.kneeFar} folds={P.legFoldsFar} l={L.far} shoe={P.shoeFar.upper} />
      </Group>
      <Arm a={plan.arms.far} P={P.far} t={torso} stick={farStick} cloth={FAR} skin={FAR_SKIN} />
      <Shoe s={P.shoeNear} />
      <Leg path={P.trousersNear} shin={P.shinNear} knee={P.kneeNear} folds={P.legFoldsNear} l={L.near} shoe={P.shoeNear.upper} />
      <Head plan={plan} P={P} />
      <Group>
        <ShirtLight path={P.shirt} t={torso} />
        <Group clip={P.shirt}>
          <Soft path={P.armShadow} color={MAT.shirt.deep} opacity={0.45} blur={12} />
          <Folds path={P.waistFolds} mat={MAT.shirt} opacity={0.5} />
          <Soft path={P.collarShadow} color={MAT.shirt.deep} opacity={0.5} blur={3} />
        </Group>
        <Path path={P.shirt} style="stroke" strokeWidth={1} color={MAT.shirt.edge} opacity={0.5} />
      </Group>
      <Path path={P.belt}>
        <LinearGradient start={vec(P.belt.getBounds().x, P.belt.getBounds().y)} end={vec(P.belt.getBounds().x, P.belt.getBounds().y + P.belt.getBounds().height)} colors={[...BELT.form]} />
      </Path>
      <Form path={P.collar} mat={MAT.shirt} axis={torso.axis} w={70} rim={0} edge={0.9}>
        {/* the rib's rolled top edge */}
        <Group transform={[{ translateX: LIGHT.u * 3 }, { translateY: LIGHT.v * 3 }]}>
          <Path path={P.collar} style="stroke" strokeWidth={2} color={MAT.shirt.rim} opacity={0.18} />
        </Group>
      </Form>
      <Arm a={plan.arms.near} P={P.near} t={torso} stick={nearStick} />
    </Group>
  );
}

/** One forearm and hand on its stick, alone (the study page's close-up of a
 *  hand: no drums, no body), in the same paint as in the figure. */
export function FigureV2HandAlone({ plan, which, stick }: { plan: SidePlan; which: 'near' | 'far'; stick?: ReactNode }) {
  const P = sidePaths(plan);
  const a = plan.arms[which];
  const ap = which === 'near' ? P.near : P.far;
  return (
    <Group>
      <Forearm a={a} P={ap} />
      {ap.art ? <AuthoredHand a={ap.art} stick={stick} /> : ap.hand ? <HandV2 hand={ap.hand} under={ap.wristSkin} stick={stick} /> : (stick ?? null)}
    </Group>
  );
}
