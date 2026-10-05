/**
 * M11 — a channel plan on the kit: the shared kit, and each channel's mic
 * (the shared mic art) at its starting place with its stand or boom drawn
 * from the engine's own mount geometry (collision.assembly) — so a plan is
 * the same picture the placement pages draw. A highlighted channel is ringed.
 * Static: it changes when the plan changes (nothing moves by itself, D8).
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Circle, Group, Path, Skia } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../rack/stageAspect';
import { MikingMicArt } from '../../../../../features/lab/micDrawings';
import type { MicPose, ViewBox, ViewId, Vec3 } from '../../engine/model/types.ts';
import { aimVec } from '../../engine/geometry/vec.ts';
import { fitXform } from '../../engine/geometry/frame.ts';
import { assembly, compileScene } from '../../engine/geometry/collision.ts';
import { micBodyOf } from '../../engine/model/validate.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import { micType } from '../../data/micTypes';
import { KitSide, KitTop } from '../shared/kitScene/KitSceneArt';
import { M11_MODEL } from './geometry.ts';
import { CHANNELS, type ChannelId } from './plan.ts';

const vOf = (view: ViewId, p: Vec3) => (view === 'side' ? p.y : p.z);
const SCENE = compileScene(M11_MODEL, 'studio');

function micXf(view: ViewId, pose: MicPose) {
  const aim = aimVec(pose.az, pose.el);
  const bx = -aim.x;
  const by = view === 'side' ? -aim.y : -aim.z;
  const fore = Math.max(0.12, Math.hypot(bx, by));
  const ang = Math.atan2(by, bx) - Math.PI / 2;
  return [{ translateX: pose.p.x }, { translateY: vOf(view, pose.p) }, { rotate: ang }, { scaleY: fore }];
}

export function PlanScene({ w, h, view, box, ids, highlight = null, accessibilityLabel }: { w: number; h: number; view: ViewId; box: ViewBox; ids: readonly ChannelId[]; highlight?: ChannelId | null; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform(view, box, w, h, 6), [view, box, w, h]);
  const px = 1 / xf.s;
  const mounts = useMemo(() => {
    const p = Skia.Path.Make();
    for (const id of ids) {
      const c = CHANNELS[id];
      const segs = assembly(SCENE, c.pose, micBodyOf(micType(c.typeId)));
      for (const sg of segs) {
        if (sg.piece === 'body') continue;
        p.moveTo(sg.a.x, vOf(view, sg.a));
        p.lineTo(sg.b.x, vOf(view, sg.b));
      }
    }
    return p;
  }, [ids, view]);
  const labels: StaticLabel[] = ids.map((id) => {
    const c = CHANNELS[id];
    return { id, text: c.short, u: c.pose.p.x, v: vOf(view, c.pose.p) - 14 * px, align: 'center' as const, tone: id === highlight ? ('amber' as const) : ('blue' as const) };
  });
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          {view === 'side' ? <KitSide reach={false} /> : <KitTop reach={false} />}
          <Path path={mounts} style="stroke" strokeWidth={4.5 * px} strokeCap="round" color="#0b0c0f" />
          <Path path={mounts} style="stroke" strokeWidth={2.8 * px} strokeCap="round" color="#6c717c" />
          {ids.map((id) => {
            const c = CHANNELS[id];
            const t = micType(c.typeId);
            return (
              <Group key={id}>
                <Circle cx={c.pose.p.x} cy={vOf(view, c.pose.p)} r={7 * px} color={id === highlight ? '#ffc64d' : '#6fa8ff'} opacity={0.35} />
                <Group transform={micXf(view, c.pose)}>
                  <MikingMicArt art={t.art} r={t.body.radius.mm} len={t.body.length.mm} cross={t.address === 'side' && view === 'side' ? (t.body.width?.mm ?? t.body.radius.mm * 2) : t.body.radius.mm * 2} />
                </Group>
              </Group>
            );
          })}
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
