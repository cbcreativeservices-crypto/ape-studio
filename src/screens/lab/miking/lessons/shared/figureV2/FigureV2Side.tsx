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
import { ColorMatrix, Group, LinearGradient, Mask, Paint, Path, vec } from '@shopify/react-native-skia';
import { Blur } from './detail';
import { LIGHT, lerp, type Pt } from './geom.ts';
import { BELT, HEAD_SKIN, LIP, MAT, SOLE } from './palette.ts';
import { AuthoredHand, Folds, Form, HandV2, Soft, across } from './paint';
import { sidePaths, type ArmPaths, type ShoePaths, type SidePaths, type SkPath } from './paths.ts';
import type { ArmPlan, SidePlan } from './sidePlan.ts';
import { useLook } from './look';

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

export type Torso = { axis: [Pt, Pt]; box: { x: number; y: number; width: number; height: number }; body: SkPath };

/** The shirt's own light (the torso's form gradient and its fall-off) on any path. */
export function ShirtLight({ path, t }: { path: SkPath; t: Torso }) {
  const { MAT, CLOTH } = useLook();
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
  const { MAT } = useLook();
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
          <Blur mm={2.2} />
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

/** The forearm in its sleeve (the cuff is painted on the far and near sides of the wrist: CuffFar, CuffNear). */
function Forearm({ a, P, t }: { a: ArmPlan; P: ArmPaths; t?: Torso }) {
  const { MAT } = useLook();
  if (a.one) {
    // ONE SLEEVE (wave 3): the forearm's own light fades in below the elbow over the
    // same outline — no step, no seam; the outline again where it is the silhouette.
    const e0 = lerp(a.elbow, a.shoulder, 0.12);
    const e1 = lerp(a.elbow, a.wrist, 0.3);
    return (
      <Group>
        <Mask
          mode="alpha"
          mask={
            <Path path={P.foreSleeve}>
              <LinearGradient start={vec(e0.u, e0.v)} end={vec(e1.u, e1.v)} colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']} />
            </Path>
          }
        >
          <Form path={P.foreSleeve} mat={MAT.shirt} axis={a.foreAxis} w={38} rim={5} edge={0} />
        </Mask>
        <Group clip={P.foreSleeve}>
          <Folds path={P.folds} mat={MAT.shirt} opacity={0.5} />
        </Group>
        {t ? (
          <Group clip={t.body} invertClip>
            <Path path={P.foreSleeve} style="stroke" strokeWidth={1} color={MAT.shirt.edge} opacity={0.5} />
          </Group>
        ) : (
          <Path path={P.foreSleeve} style="stroke" strokeWidth={1} color={MAT.shirt.edge} opacity={0.5} />
        )}
      </Group>
    );
  }
  return (
    <Group>
      {/* (an authored hand paints the wrist itself, in its own skin and light) */}
      {P.art ? null : (
        <Form path={P.wristSkin} mat={MAT.skin} axis={a.foreAxis} w={24} rim={3} edge={0.8}>
          <Soft path={P.ulna} color={MAT.skin.rim} opacity={0.35} blur={2} />
        </Form>
      )}
      <Form path={P.foreSleeve} mat={MAT.shirt} axis={a.foreAxis} w={38} rim={5} edge={0.9}>
        <Folds path={P.folds} mat={MAT.shirt} opacity={0.5} />
      </Form>
      {/* (a forearm running away ends in the sleeve's mouth: its cuff lies inside the sleeve, plain) */}
      {a.mouth ? <Form path={P.cuff} mat={MAT.shirt} axis={a.foreAxis} w={38} rim={3} edge={0} /> : null}
    </Group>
  );
}

/**
 * THE CUFF'S OPENING, behind the wrist (owner 2026-11-23, the left cuff: "a
 * gray disk representing the hand going in, but it is behind both edges of the
 * sleeve, not going inside"). Only when the opening is turned toward the
 * viewer: the sleeve's inside, in shadow (darkest under the near rim), and the
 * far half of the rim — its cloth edge, a few mm thick. The wrist is painted
 * next, over both.
 */
function CuffFar({ a, P }: { a: ArmPlan; P: ArmPaths }) {
  const { MAT } = useLook();
  if (!P.toViewer || !P.rimFar) return null;
  const { e, out } = a.opening;
  const near = { u: e.c.u - out.u * e.rx, v: e.c.v - out.v * e.rx };
  const far = { u: e.c.u + out.u * e.rx, v: e.c.v + out.v * e.rx };
  return (
    <Group>
      <Path path={P.opening}>
        <LinearGradient start={vec(near.u, near.v)} end={vec(far.u, far.v)} colors={['#0f1116', '#1d222c', MAT.shirt.form[3]]} positions={[0, 0.55, 1]} />
      </Path>
      <Group clip={P.opening}>
        <Path path={P.rimFar} style="stroke" strokeWidth={4} color={MAT.shirt.form[2]} opacity={0.95} />
      </Group>
      <Path path={P.rimFar} style="stroke" strokeWidth={1} color={MAT.shirt.edge} opacity={0.6} />
    </Group>
  );
}

/**
 * THE CUFF, in front of the wrist: the opaque cloth of the cuff (ending at the
 * near half of the rim; no see-through ring, no ellipse across the sleeve), its
 * seam (the near half), its soft cast shadow on the wrist just beyond the rim
 * (and the wrist darker inside the opening), and the near rim: the cloth's
 * rolled edge, lit, with its thickness. A forearm running away: only the
 * sleeve's mouth — its near edge wrapping round the fist's root.
 */
function CuffNear({ a, P }: { a: ArmPlan; P: ArmPaths }) {
  const { MAT } = useLook();
  const out = a.opening.out;
  const skin = P.art ? P.art.all : P.wristSkin;
  if (a.mouth)
    return (
      <Group>
        {P.art ? (
          <Group clip={P.art.all}>
            <Path path={P.opening} color="#1a0d08" opacity={0.5} transform={[{ translateX: out.u * 6 }, { translateY: out.v * 6 }]}>
              <Blur mm={4} />
            </Path>
          </Group>
        ) : null}
        <Path path={P.rimNear} style="stroke" strokeWidth={7} strokeCap="round" color={MAT.shirt.form[1]} opacity={0.95} />
        <Path path={P.rimNear} style="stroke" strokeWidth={1.6} strokeCap="round" color={MAT.shirt.rim} opacity={0.4} transform={[{ translateX: -out.u * 1.5 }, { translateY: -out.v * 1.5 }]} />
        <Path path={P.rimNear} style="stroke" strokeWidth={1} strokeCap="round" color={MAT.shirt.edge} opacity={0.6} transform={[{ translateX: out.u * 3.5 }, { translateY: out.v * 3.5 }]} />
      </Group>
    );
  return (
    <Group>
      <Group clip={skin}>
        <Group transform={[{ translateX: out.u * 4 - LIGHT.u * 1.5 }, { translateY: out.v * 4 - LIGHT.v * 1.5 }]}>
          <Path path={P.cuffCloth} color={MAT.skin.deep} opacity={0.45}>
            <Blur mm={2.5} />
          </Path>
        </Group>
        {P.toViewer ? (
          <Path path={P.opening} color="#000" opacity={0.2}>
            <Blur mm={3} />
          </Path>
        ) : null}
      </Group>
      <Form path={P.cuffCloth} mat={MAT.shirt} axis={a.foreAxis} w={38} rim={3} edge={0}>
        {/* the cuff's seam round the sleeve: its near half */}
        <Path path={P.seam} style="stroke" strokeWidth={1.2} strokeCap="round" color={MAT.shirt.deep} opacity={0.5} />
        {/* the near rim: the cloth's rolled edge, lit along its thickness */}
        <Path path={P.rimNear} style="stroke" strokeWidth={5} strokeCap="round" color={MAT.shirt.rim} opacity={0.3}>
          <Blur mm={0.8} />
        </Path>
      </Form>
      <Path path={P.cuffEdge ?? P.cuffCloth} style="stroke" strokeWidth={1.1} strokeJoin="round" strokeCap="round" color={MAT.shirt.edge} opacity={0.75} />
    </Group>
  );
}

export function Arm({ a, P, t, stick, cloth, skin, off = false }: { a: ArmPlan; P: ArmPaths; t: Torso; stick?: ReactNode; cloth?: ReactNode; skin?: ReactNode; /** (wave 3, the held arm) not drawn: a step draws that arm holding a mic */ off?: boolean }) {
  const { MAT, CLOTH } = useLook();
  if (off) return null;
  const upper = (
    <Group layer={cloth as never}>
      <UpperSleeve a={a} P={P} t={t} />
    </Group>
  );
  const fore = (
    <Group layer={cloth as never}>
      <Forearm a={a} P={P} t={t} />
    </Group>
  );
  const cuffFar = (
    <Group layer={cloth as never}>
      <CuffFar a={a} P={P} />
    </Group>
  );
  const cuffNear = (
    <Group layer={cloth as never}>
      <CuffNear a={a} P={P} />
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
  // Depth order at the cuff: the far half of its rim and the sleeve's inside,
  // then the wrist and hand coming OUT of the opening over them, then the near
  // half of the rim in front of the wrist. A forearm running away from the
  // viewer is behind its own elbow (the upper sleeve over all); its fist comes
  // out of the sleeve's mouth, the mouth's near edge over the fist's root.
  const sleeveShadow =
    a.away && P.art ? (
      <Group clip={P.art.all}>
        <Group transform={[{ translateX: -LIGHT.u * 5 }, { translateY: -LIGHT.v * 5 }]}>
          <Path path={P.cuff} color="#000" opacity={0.45}>
            <Blur mm={4} />
          </Path>
        </Group>
      </Group>
    ) : null;
  if (a.away && P.behindMouth)
    return (
      <Group>
        {upper}
        {fore}
        {cuffFar}
        {hand}
        {sleeveShadow}
        {/* the arm again over the fist's root, up to the sleeve's mouth: the fist comes out of it */}
        <Group clip={P.behindMouth}>
          {fore}
          {upper}
        </Group>
        {cuffNear}
      </Group>
    );
  return a.away ? (
    <Group>
      {cuffFar}
      {hand}
      {sleeveShadow}
      {fore}
      {cuffNear}
      {upper}
    </Group>
  ) : (
    <Group>
      {upper}
      {fore}
      {cuffFar}
      {hand}
      {cuffNear}
    </Group>
  );
}

/** The trousers' cloth as one garment: the same ramp on seat, thigh, knee and
 *  shin, its lit side held a step below the cloth's brightest so the thigh's
 *  top (facing the light) does not bleach to a different grey than the shin. */
export const CLOTH = { ...MAT.trousers, form: [MAT.trousers.form[1], '#474b53', MAT.trousers.form[2], MAT.trousers.form[3], MAT.trousers.form[4]] };

/** The shin's own cylinder light (a soft blend at the knee). */
function Shin({ path, axis }: { path: SkPath; axis: [Pt, Pt] }) {
  const { CLOTH } = useLook();
  const [s0, e0] = across(axis[0], axis[1], 50);
  return (
    <Path path={path}>
      <LinearGradient start={vec(s0.u, s0.v)} end={vec(e0.u, e0.v)} colors={CLOTH.form} positions={CLOTH.pos} />
      <Blur mm={5} />
    </Path>
  );
}

function Leg({ path, shin, knee, folds, l, shoe }: { path: SkPath; shin: SkPath; knee: SkPath; folds: SkPath; l: SidePlan['legs']['near']; shoe: SkPath }) {
  const { MAT, CLOTH } = useLook();
  return (
    <Group>
      {/* ONE GARMENT (owner 2026-11-23: "pant leg also need similar shading like the rest of the pants
          below"): seat, thigh, knee and shin in the same cloth and the same cylinder light — the thigh
          turning from its lit top to its shadowed underside on the seat, the shin round its own axis */}
      <Form path={path} mat={CLOTH} axis={l.thighAxis} w={70} rim={5}>
        <Shin path={shin} axis={l.shinAxis} />
        <Soft path={knee} color={MAT.trousers.rim} opacity={0.22} blur={6} />
        <Folds path={folds} mat={MAT.trousers} />
      </Form>
      {/* the hem's shadow on the shoe */}
      <Group clip={shoe}>
        <Group clip={path} invertClip>
          <Group transform={[{ translateX: -LIGHT.u * 5 }, { translateY: -LIGHT.v * 5 }]}>
            <Path path={path} color="#000" opacity={0.4}>
              <Blur mm={2.5} />
            </Path>
          </Group>
        </Group>
      </Group>
    </Group>
  );
}

function Shoe({ s }: { s: ShoePaths }) {
  const { MAT } = useLook();
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

function Head({ plan, P, show = 'all' }: { plan: SidePlan; P: SidePaths; show?: 'all' | 'neck' | 'head' }) {
  const { MAT, HEAD_SKIN, LIP } = useLook();
  const h = plan.head;
  const c = lerp({ u: h.box.u0, v: h.box.v0 }, { u: h.box.u1, v: h.box.v1 }, 0.5);
  const R = (h.box.u1 - h.box.u0) / 2;
  const neck = (
    <Form path={P.neck} mat={HEAD_SKIN} round={{ c, r: R }} rim={4} edge={0.8}>
        <Soft path={P.scm} color={MAT.skin.rim} opacity={0.14} blur={4} />
        {/* (half strength, softer edges — owner: "lighten" — the jaw separates from the neck, no streak) */}
        <Path path={P.jawShadow} color={MAT.skin.deep} opacity={0.25}>
          <Blur mm={6.5} />
        </Path>
        <Soft path={P.neckOcclusion} color={MAT.skin.deep} opacity={0.45} blur={4} />
      </Form>
  );
  // (wave 3: a step that turns the head draws the body with its neck ('neck') and the head turned on its own ('head'))
  if (show === 'neck') return <Group>{neck}</Group>;
  return (
    <Group>
      {/* THE NECK: a column, the sternomastoid's form, the jaw's cast shadow, darker into the collar */}
      {/* (the head's own round light, so neck and head meet without a seam; the neck a little in the head's shadow) */}
      {show !== 'head' ? neck : null}
      {/* THE HEAD */}
      <Form path={P.skull} mat={HEAD_SKIN} round={{ c, r: R }} rim={5} edge={0}>
        {/* the front of the face turns away from the light */}
        <Path path={P.skull}>
          <LinearGradient start={vec(h.frontShade.a.u, h.frontShade.a.v)} end={vec(h.frontShade.b.u, h.frontShade.b.v)} colors={['rgba(58,32,22,0.32)', 'rgba(58,32,22,0)']} />
        </Path>
        <Soft path={P.cheekShade} color={MAT.skin.deep} opacity={0.07} blur={7} />
        <Soft path={P.socket} color={MAT.skin.deep} opacity={0.36} blur={4} />
        <Soft path={P.noseSide} color={MAT.skin.deep} opacity={0.14} blur={2.5} />
        {P.lights.map((l, i) => (
          <Soft key={i} path={l} color={MAT.skin.rim} opacity={i === 1 ? 0.3 : i === 0 ? 0.1 : 0.15} blur={i === 1 ? 1.8 : 5} />
        ))}
        <Path path={P.nasolabial} style="stroke" strokeWidth={3} strokeCap="round" color={MAT.skin.deep} opacity={0.14}>
          <Blur mm={1.8} />
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
          <Blur mm={0.7} />
        </Path>
      </Form>
      {/* the mandible over the neck: a crisp edge */}
      <Path path={P.jaw} style="stroke" strokeWidth={1.3} strokeCap="round" color={MAT.skin.edge} opacity={0.55} />
      {/* THE HAIR: one calm dark shape — its soft edge, the clumps along the growth, a sheen along the skull */}
      <Soft path={P.hair} color={MAT.skin.deep} opacity={0.3} blur={2.5} clip={P.skull} />
      <Path path={P.hair}>
        <LinearGradient start={vec(c.u + LIGHT.u * R, c.v + LIGHT.v * R)} end={vec(c.u - LIGHT.u * R, c.v - LIGHT.v * R)} colors={[MAT.hair.form[1], MAT.hair.form[2], MAT.hair.form[3]]} />
        <Blur mm={1.1} />
      </Path>
      <Group clip={P.hair}>
        {P.clumps.map((q, i) => (
          <Group key={i}>
            <Path path={q} color={MAT.hair.form[i % 2 === 0 ? 1 : 3]} opacity={0.2}>
              <Blur mm={2.4} />
            </Path>
            <Path path={q} style="stroke" strokeWidth={0.9} color={MAT.hair.deep} opacity={0.16}>
              <Blur mm={0.6} />
            </Path>
          </Group>
        ))}
        <Path path={P.sheen} style="stroke" strokeWidth={9} strokeCap="round" color={MAT.hair.rim} opacity={0.2}>
          <Blur mm={4} />
        </Path>
      </Group>
      {h.earShows ? (
      <Form path={P.ear} mat={HEAD_SKIN} round={{ c, r: R }} rim={3} edge={0.7}>
        <Path path={P.ear} color={MAT.skin.deep} opacity={0.12} />
        <Path path={P.earBowl} color={MAT.skin.deep} opacity={0.5}>
          <Blur mm={1.4} />
        </Path>
        <Path path={P.earRim} style="stroke" strokeWidth={2.2} strokeCap="round" color={MAT.skin.deep} opacity={0.45} />
        <Path path={P.earFold} style="stroke" strokeWidth={2.4} strokeCap="round" color={MAT.skin.rim} opacity={0.16}>
          <Blur mm={1} />
        </Path>
      </Form>
      ) : null}
    </Group>
  );
}

export type FigureV2SideProps = {
  plan: SidePlan;
  /** The far hand's stick (drawn between its fingers behind and in front). */
  farStick?: ReactNode;
  nearStick?: ReactNode;
  /** (wave 3) 'headless': the body and its neck (a step draws the head turned); 'head': the head alone. */
  part?: 'all' | 'headless' | 'head';
  /** (wave 3, the jacket) a garment over the shirt, each piece in its place in the depth order: the far
   *  sleeve after the far arm, the body after the shirt's collar, the near sleeve after the near arm. */
  over?: { far?: ReactNode; body?: ReactNode; near?: ReactNode };
  /** (wave 3, the held arm) that arm not drawn: a step draws it holding a mic ('both': wave 4, the boom operator) */
  noArm?: 'near' | 'far' | 'both';
};

/** The whole person in profile, far to near. */
export function FigureV2Side({ plan, farStick, nearStick, part = 'all', over, noArm }: FigureV2SideProps) {
  const { MAT } = useLook();
  const P = sidePaths(plan);
  // (wave 3: the head alone, turned by a step; or the body with only its neck)
  if (part === 'head') return <Head plan={plan} P={P} show="head" />;
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
      {/* (wave 3, the held arm: noArm 'far' — a step draws that arm holding a mic) */}
      {noArm === 'far' || noArm === 'both' ? null : (
        <>
      <Arm a={plan.arms.far} P={P.far} t={torso} stick={farStick} cloth={FAR} skin={FAR_SKIN} />
      {/* the far arm passes BEHIND the body: the torso's soft occlusion shadow on it, along the back's edge */}
      {plan.arms.far.behind
        ? [P.far.upper, P.far.foreSleeve].map((q, i) => (
            <Group key={`occ${i}`} clip={q}>
              <Group transform={[{ translateX: -plan.facing * 5 }]}>
                <Soft path={P.shirt} color={MAT.shirt.deep} opacity={0.5} blur={8} />
              </Group>
            </Group>
          ))
        : null}
      {over?.far ?? null}
        </>
      )}
      <Shoe s={P.shoeNear} />
      <Leg path={P.trousersNear} shin={P.shinNear} knee={P.kneeNear} folds={P.legFoldsNear} l={L.near} shoe={P.shoeNear.upper} />
      <Head plan={plan} P={P} show={part === 'headless' ? 'neck' : 'all'} />
      <Group>
        <ShirtLight path={P.shirt} t={torso} />
        <Group clip={P.shirt}>
          <Soft path={P.armShadow} color={MAT.shirt.deep} opacity={0.45} blur={12} />
          <Folds path={P.waistFolds} mat={MAT.shirt} opacity={0.5} />
          <Soft path={P.collarShadow} color={MAT.shirt.deep} opacity={0.5} blur={3} />
        </Group>
        <Path path={P.shirt} style="stroke" strokeWidth={1} color={MAT.shirt.edge} opacity={0.5} />
      </Group>
      {/* THE BELT: a band round the waist in the body's own light (its top lit, its
          lower edge turning away, darker where it rounds away at front and back) */}
      {plan.dress?.tucked === false ? null : (
      <Group>
      <Path path={P.belt}>
        <LinearGradient start={vec(P.belt.getBounds().x, P.belt.getBounds().y)} end={vec(P.belt.getBounds().x, P.belt.getBounds().y + P.belt.getBounds().height)} colors={['#5a4334', '#33251c', '#1a120d']} />
      </Path>
      <Group clip={P.belt}>
        <Path path={P.belt}>
          <LinearGradient start={vec(P.belt.getBounds().x, 0)} end={vec(P.belt.getBounds().x + P.belt.getBounds().width, 0)} colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.45)']} positions={[0, 0.25, 0.7, 1]} />
        </Path>
        <Group transform={[{ translateX: -LIGHT.u * 1.5 }, { translateY: -LIGHT.v * 1.5 }]}>
          <Path path={P.beltTop} style="stroke" strokeWidth={1.4} color="#a3846a" opacity={0.45} />
        </Group>
        <Path path={P.beltLoop} color="#3d2c21" />
        <Path path={P.beltLoop} style="stroke" strokeWidth={0.9} color="#0f0a07" opacity={0.7} />
      </Group>
      <Path path={P.belt} style="stroke" strokeWidth={0.9} color={BELT.edge} opacity={0.8} />
      <Path path={P.buckle}>
        <LinearGradient start={vec(P.buckle.getBounds().x, P.buckle.getBounds().y)} end={vec(P.buckle.getBounds().x + 12, P.buckle.getBounds().y + P.buckle.getBounds().height)} colors={['#d9dce2', '#8b9099', '#4a4e57']} />
      </Path>
      {/* the shirt blousing over the belt, its soft shadow on the belt */}
      <Group clip={P.belt}>
        <Group transform={[{ translateX: -LIGHT.u * 3 }, { translateY: -LIGHT.v * 3 }]}>
          <Path path={P.blouse} color="#000" opacity={0.5}>
            <Blur mm={2.5} />
          </Path>
        </Group>
      </Group>
      <ShirtLight path={P.blouse} t={torso} />
      <Group clip={P.blouse}>
        <Folds path={P.waistFolds} mat={MAT.shirt} opacity={0.5} />
      </Group>
      </Group>
      )}
      {/* (a shirt with a collar: its button placket down the front, a soft seam) */}
      {P.placket ? <Path path={P.placket} style="stroke" strokeWidth={1.2} strokeCap="round" color={MAT.shirt.deep} opacity={0.4} /> : null}
      <Form path={P.collar} mat={MAT.shirt} axis={torso.axis} w={70} rim={0} edge={0.9}>
        {/* the rib's rolled top edge */}
        <Group transform={[{ translateX: LIGHT.u * 3 }, { translateY: LIGHT.v * 3 }]}>
          <Path path={P.collar} style="stroke" strokeWidth={2} color={MAT.shirt.rim} opacity={0.18} />
        </Group>
      </Form>
      {over?.body ?? null}
      <Arm a={plan.arms.near} P={P.near} t={torso} stick={nearStick} off={noArm === 'near' || noArm === 'both'} />
      {noArm === 'near' || noArm === 'both' ? null : over?.near ?? null}
    </Group>
  );
}

/** One arm's hand on its stick, alone (the study page's close-up of a hand:
 *  no drums, no body), drawn exactly as in the figure — the same arm, cuff,
 *  wrist and hand, in the same depth order. */
export function FigureV2HandAlone({ plan, which, stick }: { plan: SidePlan; which: 'near' | 'far'; stick?: ReactNode }) {
  const P = sidePaths(plan);
  const a = plan.arms[which];
  const ap = which === 'near' ? P.near : P.far;
  const sb = P.shirt.getBounds();
  const torso: Torso = { axis: [plan.hip, plan.neck], box: { x: sb.x, y: sb.y, width: sb.width, height: sb.height }, body: P.shirt };
  return <Arm a={a} P={ap} t={torso} stick={stick} />;
}
