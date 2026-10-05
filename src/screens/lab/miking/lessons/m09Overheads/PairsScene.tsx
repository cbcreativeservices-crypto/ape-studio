/**
 * M09 — a stereo pair over the kit (the two-overheads page, step 2): the
 * kit in one view, the pair's two capsules drawn with the shared mic art at
 * their poses, each with its simplified pattern slice (white dashed: shape,
 * not range), and dashed paths from the chosen source to each capsule. Static:
 * it changes only when the learner changes the technique, the angle or the
 * source (no gesture, nothing moves by itself — D8).
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, Line, Path, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../rack/stageAspect';
import { MikingMicArt } from '../../../../../features/lab/micDrawings';
import type { ViewBox, ViewId, Vec3 } from '../../engine/model/types.ts';
import { aimVec, angleBetween } from '../../engine/geometry/vec.ts';
import { fitXform } from '../../engine/geometry/frame.ts';
import { gain } from '../../engine/physics/polar.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import { micType } from '../../data/micTypes';
import { KitSide, KitTop } from '../shared/kitScene/KitSceneArt';
import type { Capsule, Pair } from './pairs.ts';

const IDEAL = '#e8eaee';
const AMBER = '#ffc64d';
const LOBE_R = 150;

/** The view box for a pair: the two capsules and the source, padded, at
 *  least 1.2 m wide, inside the kit's own box (a close pair is drawn close
 *  up, so its 17 cm reads). */
export function pairBox(view: ViewId, kit: ViewBox, pair: Pair, source: Vec3): ViewBox {
  const pts = [pair.a.pose.p, pair.b.pose.p, source];
  const us = pts.map((q) => q.x);
  const vs = pts.map((q) => vOf(view, q));
  let u0 = Math.min(...us) - 380;
  let u1 = Math.max(...us) + 380;
  let v0 = Math.min(...vs) - 380;
  let v1 = Math.max(...vs) + 380;
  const grow = (a: number, b: number, min: number) => (b - a >= min ? [a, b] : [(a + b) / 2 - min / 2, (a + b) / 2 + min / 2]);
  [u0, u1] = grow(u0, u1, 1200);
  [v0, v1] = grow(v0, v1, 900);
  return { u0: Math.max(kit.u0, u0), u1: Math.min(kit.u1, u1), v0: Math.max(kit.v0, v0), v1: Math.min(kit.v1, v1) };
}
const vOf = (view: ViewId, p: Vec3) => (view === 'side' ? p.y : p.z);

/** The mic art's transform for a pose in a view (the placement scene's rule). */
function micXf(view: ViewId, c: Capsule) {
  const aim = aimVec(c.pose.az, c.pose.el);
  const bx = -aim.x;
  const by = view === 'side' ? -aim.y : -aim.z;
  const fore = Math.max(0.12, Math.hypot(bx, by));
  const ang = Math.atan2(by, bx) - Math.PI / 2;
  return [{ translateX: c.pose.p.x }, { translateY: vOf(view, c.pose.p) }, { rotate: ang }, { scaleY: fore }];
}

function lobe(view: ViewId, c: Capsule) {
  const p = Skia.Path.Make();
  const aim = aimVec(c.pose.az, c.pose.el);
  const cu = c.pose.p.x;
  const cv = vOf(view, c.pose.p);
  for (let i = 0; i <= 90; i++) {
    const phi = (i / 90) * Math.PI * 2;
    const d = view === 'side' ? { x: Math.cos(phi), y: Math.sin(phi), z: 0 } : { x: Math.cos(phi), y: 0, z: Math.sin(phi) };
    const g = Math.abs(gain(c.pattern, angleBetween(aim, d))) * LOBE_R;
    const u = cu + g * Math.cos(phi);
    const v = cv + g * Math.sin(phi);
    if (i === 0) p.moveTo(u, v);
    else p.lineTo(u, v);
  }
  p.close();
  return p;
}

export function PairsScene({ w, h, view, box, pair, typeId, source, accessibilityLabel, labels = [] }: { w: number; h: number; view: ViewId; box: ViewBox; pair: Pair; typeId: string; source: Vec3; accessibilityLabel: string; labels?: StaticLabel[] }) {
  const textScale = useStageTextScale();
  const fit = useMemo(() => pairBox(view, box, pair, source), [view, box, pair, source]);
  const xf = useMemo(() => fitXform(view, fit, w, h, 6), [view, fit, w, h]);
  const px = 1 / xf.s;
  const t = micType(typeId);
  const lobes = useMemo(() => [lobe(view, pair.a), lobe(view, pair.b)], [view, pair]);
  const caps = [pair.a, pair.b];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          {view === 'side' ? <KitSide /> : <KitTop />}
          {caps.map((c, i) => (
            <Line key={`path${i}`} p1={vec(source.x, vOf(view, source))} p2={vec(c.pose.p.x, vOf(view, c.pose.p))} color={AMBER} strokeWidth={1.6 * px} opacity={0.85}>
              <DashPathEffect intervals={[6 * px, 4 * px]} />
            </Line>
          ))}
          <Circle cx={source.x} cy={vOf(view, source)} r={4.5 * px} color={AMBER} />
          {lobes.map((p, i) => (
            <Group key={`lobe${i}`}>
              <Path path={p} color={IDEAL} opacity={0.07} />
              <Path path={p} style="stroke" strokeWidth={1.4 * px} color={IDEAL} opacity={0.8}>
                <DashPathEffect intervals={[4 * px, 3 * px]} />
              </Path>
            </Group>
          ))}
          {caps.map((c, i) => (
            <Group key={`mic${i}`} transform={micXf(view, c)}>
              <MikingMicArt art={t.art} r={t.body.radius.mm} len={t.body.length.mm} cross={t.body.radius.mm * 2} />
            </Group>
          ))}
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
