/**
 * FIGURE V2 — THE KIT DRUMMER FROM ABOVE, PAINTED (wave 1 of D78; the plan:
 * topPlan.ts). The approved side view's materials and rules, seen from above:
 * one shirt (ShirtLight) on the shoulders and the sleeves; the side view's arm
 * (FigureV2Side.Arm: the far rim and the inside, the wrist and hand, the near
 * rim; the authored hand on its stick); the head's own skin ramp (HEAD_SKIN)
 * under the hair; the trousers as one cloth (CLOTH); the shoes in leather.
 *
 * Two layers, as the kit scene draws the drummer from above: `legs` (under
 * the drums: the shins, the thighs and the shoes) and `upper` (over them: the
 * arms with their sticks, the shoulders and back, the head). Paths are built
 * once per plan (topPaths); nothing is computed per frame.
 */
import { memo, type ReactNode } from 'react';
import { Group, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import { Blur } from './detail';
import { LIGHT, P, type Pt } from './geom.ts';
import { HEAD_SKIN, MAT, SOLE } from './palette.ts';
import { Folds, Form, Soft } from './paint';
import { armPaths, ellipsePath, smoothClosed, smoothOpen, type ArmPaths, type SkPath } from './paths.ts';
import type { TopPlan } from './topPlan.ts';
import { Arm, CLOTH, ShirtLight, type Torso } from './FigureV2Side';
import { useLook } from './look';

export type TopPaths = {
  torso: SkPath;
  blades: SkPath;
  skull: SkPath;
  ears: SkPath[];
  nose: SkPath;
  hair: SkPath;
  clumps: SkPath[];
  sheen: SkPath;
  near: ArmPaths;
  far: ArmPaths;
  thighs: SkPath[];
  shins: SkPath[];
  knees: SkPath[];
  shoes: { upper: SkPath; sole: SkPath; laces: SkPath }[];
};

const VIEW = (p: { x: number; y: number; z: number }) => ({ u: p.x, v: p.z, d: -p.y });
const cache = new WeakMap<TopPlan, TopPaths>();
/** The plan's paths, built once per plan. */
export function topPaths(plan: TopPlan): TopPaths {
  const hit = cache.get(plan);
  if (hit) return hit;
  const out: TopPaths = {
    torso: smoothClosed(plan.torso, 0.5),
    blades: smoothClosed(plan.blades, 0.5),
    skull: smoothClosed(plan.head.skull, 0.55),
    ears: plan.head.ears.map((e) => smoothOpen(e)),
    nose: smoothClosed(plan.head.nose, 0.5),
    hair: smoothClosed(plan.head.hair, 0.5),
    clumps: plan.head.clumps.map((q) => smoothClosed(q, 0.5)),
    sheen: ellipsePath(plan.head.sheen),
    near: armPaths(plan.arms.near, VIEW),
    far: armPaths(plan.arms.far, VIEW),
    thighs: plan.legs.thighs.map((q) => smoothClosed(q, 0.5)),
    shins: plan.legs.shins.map((q) => smoothClosed(q, 0.5)),
    knees: plan.legs.knees.map(ellipsePath),
    shoes: plan.shoes.map((s) => ({ upper: smoothClosed(s.upper, 0.5), sole: smoothClosed(s.sole, 0.5), laces: smoothOpen(s.laces) })),
  };
  cache.set(plan, out);
  return out;
}

/** The legs from above (under the drums): the shoes, the shins, the thighs and knees — one cloth. */
export const DrummerTopLegsV2 = memo(function DrummerTopLegsV2({ plan }: { plan: TopPlan }) {
  const { MAT, CLOTH } = useLook();
  const T = topPaths(plan);
  return (
    <Group>
      {T.shoes.map((s, i) => {
        const b = s.upper.getBounds();
        return (
          <Group key={`shoe${i}`}>
            <Path path={s.sole} color={SOLE.bottom} />
            <Path path={s.sole} style="stroke" strokeWidth={1} color={SOLE.edge} opacity={0.6} />
            <Form path={s.upper} mat={MAT.leather} round={{ c: P(b.x + b.width / 2, b.y + b.height / 2), r: Math.max(b.width, b.height) / 2 }} rim={4} edge={0.9}>
              <Path path={s.laces} style="stroke" strokeWidth={5} strokeCap="round" color={MAT.leather.deep} opacity={0.6} />
            </Form>
          </Group>
        );
      })}
      {T.shins.map((p, i) => (
        <Form key={`shin${i}`} path={p} mat={CLOTH} axis={plan.legs.thighAxes[i]} w={50} rim={4} edge={0.9} />
      ))}
      {T.thighs.map((p, i) => (
        <Form key={`thigh${i}`} path={p} mat={CLOTH} axis={plan.legs.thighAxes[i]} w={70} rim={5} edge={0.9}>
          <Soft path={T.knees[i]} color={MAT.trousers.rim} opacity={0.22} blur={6} />
        </Form>
      ))}
    </Group>
  );
});

export function HeadTop({ plan, T }: { plan: TopPlan; T: TopPaths }) {
  const { MAT, HEAD_SKIN } = useLook();
  const c = plan.head.c;
  return (
    <Group>
      {/* the head's soft shadow on the shoulders under it (the light from the upper left) */}
      <Group clip={T.torso}>
        <Group transform={[{ translateX: -LIGHT.u * 16 }, { translateY: -LIGHT.v * 16 }]}>
          <Soft path={T.skull} color={MAT.shirt.deep} opacity={0.45} blur={10} />
        </Group>
      </Group>
      <Form path={T.skull} mat={HEAD_SKIN} round={{ c, r: 110 }} rim={4} edge={0.8} />
      {T.ears.map((e, i) => (
        <Path key={`ear${i}`} path={e} style="stroke" strokeWidth={9} strokeCap="round" color={HEAD_SKIN.form[2]} />
      ))}
      <Form path={T.nose} mat={HEAD_SKIN} round={{ c, r: 110 }} rim={2} edge={0.8} />
      {/* THE HAIR: one calm dark shape over the crown, the forehead and the nose in front of it */}
      <Soft path={T.hair} color={MAT.skin.deep} opacity={0.3} blur={2.5} clip={T.skull} />
      <Path path={T.hair}>
        <LinearGradient start={vec(c.u + LIGHT.u * 110, c.v + LIGHT.v * 110)} end={vec(c.u - LIGHT.u * 110, c.v - LIGHT.v * 110)} colors={[MAT.hair.form[1], MAT.hair.form[2], MAT.hair.form[3]]} />
        <Blur mm={1.1} />
      </Path>
      <Group clip={T.hair}>
        {T.clumps.map((q, i) => (
          <Path key={`cl${i}`} path={q} color={MAT.hair.form[i % 2 === 0 ? 1 : 3]} opacity={0.2}>
            <Blur mm={2.4} />
          </Path>
        ))}
        <Path path={T.sheen} color={MAT.hair.rim} opacity={0.16}>
          <Blur mm={8} />
        </Path>
      </Group>
    </Group>
  );
}

/** The upper body from above (over the drums): each arm with its stick (the
 *  far, then the near — the right hand crosses over to the hats), the
 *  shoulders and back over the arms' roots, the head over all. */
export const DrummerTopUpperV2 = memo(function DrummerTopUpperV2({ plan, farStick, nearStick }: { plan: TopPlan; farStick?: ReactNode; nearStick?: ReactNode }) {
  const { MAT } = useLook();
  const T = topPaths(plan);
  const b = T.torso.getBounds();
  const torso: Torso = { axis: plan.torsoAxis, box: { x: b.x, y: b.y, width: b.width, height: b.height }, body: T.torso };
  return (
    <Group>
      <Arm a={plan.arms.far} P={T.far} t={torso} stick={farStick} />
      <Arm a={plan.arms.near} P={T.near} t={torso} stick={nearStick} />
      <ShirtLight path={T.torso} t={torso} />
      <Group clip={T.torso}>
        <Folds path={T.blades} mat={MAT.shirt} opacity={0.5} />
      </Group>
      <Path path={T.torso} style="stroke" strokeWidth={1} color={MAT.shirt.edge} opacity={0.5} />
      <HeadTop plan={plan} T={T} />
    </Group>
  );
});

/** (for the tests: the points the plan's shapes are made of) */
export const topShapes = (plan: TopPlan): Pt[][] => [plan.torso, plan.head.skull, plan.head.hair, ...plan.legs.thighs, ...plan.shoes.map((s) => s.sole)];
