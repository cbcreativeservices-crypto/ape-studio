/**
 * MEET THE MEASUREMENT MIC (ORIENT's "What it is" figure, LessonArt.figure):
 * the mic drawn large and its chain behind it — the protection grid over
 * the capsule, the preamp, the connector, the cable to the power unit and on
 * to the analyzer — so the learner meets the CHAIN before any number (F11
 * L25–L27). Generic objects; sizes from measureSpec (the 1/2 in capsule from
 * its name, the rest drawing defaults, drawn larger than the bench scene).
 * Labels are part of the picture's words (≥ 9 pt, they grow with full
 * screen). Nothing moves.
 */
import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import { MeasurementMic } from '../../../../../../features/lab/micDrawings';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { ChainBox } from './MeasureArt';
import { CAPSULE, MEAS_DIMS } from './measureSpec.ts';

/** The figure's box (mm, the mic's front at the origin, pointing left). */
const BOX = { u0: -40, u1: 420, v0: -70, v1: 120 };
export const MIC_ANATOMY_ASPECT = (BOX.u1 - BOX.u0) / (BOX.v1 - BOX.v0);

export function MicAnatomy({ w, h, label }: { w: number; h: number; label: string }): ReactNode {
  const k = useStageTextScale();
  const xf = useMemo(() => fitXform('side', BOX, w, h, 6), [w, h]);
  const r = CAPSULE.half.mm / 2;
  const len = MEAS_DIMS.bodyHalf.mm;
  const cable = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(len, 0);
    p.cubicTo(len + 40, 0, len + 30, 60, len + 70, 62);
    p.lineTo(300, 62);
    return p;
  }, [len]);
  const cable2 = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(352, 62);
    p.lineTo(372, 62);
    return p;
  }, []);
  const labels: StaticLabel[] = [
    { id: 'grid', text: 'PROTECTION GRID', u: 4, v: -34, align: 'left', tone: 'amber', at: { u: 4, v: -r } },
    { id: 'cap', text: 'CAPSULE · 1/2 IN', u: 30, v: 32, align: 'left', tone: 'amber', at: { u: 14, v: r } },
    { id: 'pre', text: 'PREAMP', u: 100, v: -30, align: 'center', tone: 'muted', at: { u: 100, v: -r } },
    { id: 'con', text: 'CONNECTOR', u: len - 10, v: -30, align: 'center', tone: 'muted', at: { u: len - 10, v: -r } },
    { id: 'pwr', text: 'POWER', u: 326, v: 102, align: 'center', tone: 'muted' },
    { id: 'an', text: 'ANALYZER', u: 395, v: 102, align: 'center', tone: 'muted' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Path path={cable} style="stroke" strokeWidth={5} strokeCap="round" color="#08080a" />
          <Path path={cable} style="stroke" strokeWidth={3.4} strokeCap="round" color="#2f3238" />
          <Path path={cable2} style="stroke" strokeWidth={3.4} strokeCap="round" color="#2f3238" />
          <ChainBox kind="ccp" x={300} y={44} w={52} h={36} />
          <ChainBox kind="analyzer" x={372} y={40} w={46} h={44} />
          <Group transform={[{ rotate: -Math.PI / 2 }]}>
            <MeasurementMic r={r} len={len} />
          </Group>
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={k} w={w} />
    </View>
  );
}
