/**
 * MEET THE SOUND LEVEL METER (ORIENT's "What it is" figure for the survey
 * lessons, F12 and later): the complete meter on its tripod, its foam
 * windscreen over the capsule, the capsule at the method's height above the
 * ground (1.5 m in the highway example, FHWA-FG — drawn as one method's
 * height, not a rule), with a height dimension. Generic, no maker's
 * likeness; the meter's size is a drawing default. Nothing moves.
 */
import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import { Canvas, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { SoundLevelMeter } from '../../../../../../features/lab/micDrawings';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { MEAS_DIMS } from './measureSpec.ts';

const H = 1500;
const BOX = { u0: -900, u1: 900, v0: -1850, v1: 120 };
export const METER_FIGURE_ASPECT = (BOX.u1 - BOX.u0) / (BOX.v1 - BOX.v0);

export function MeterOnTripod({ w, h, label }: { w: number; h: number; label: string }): ReactNode {
  const k = useStageTextScale();
  const xf = useMemo(() => fitXform('side', BOX, w, h, 6), [w, h]);
  const len = MEAS_DIMS.slmLength.mm;
  const r = MEAS_DIMS.slmWidth.mm / 2;
  const p = useMemo(() => {
    const ground = Skia.Path.Make();
    ground.addRect(Skia.XYWHRect(BOX.u0 - 100, 0, BOX.u1 - BOX.u0 + 200, 130));
    const grass = Skia.Path.Make();
    for (let x = BOX.u0; x < BOX.u1; x += 40) {
      grass.moveTo(x, 0);
      grass.lineTo(x + 10, -30 - ((x * 7) % 25));
    }
    // The tripod: a head under the meter, a centre column, three legs (two seen).
    const legs = Skia.Path.Make();
    const head = -H + len + 30;
    legs.moveTo(-14, head);
    legs.lineTo(14, head);
    legs.lineTo(14, -620);
    legs.lineTo(-14, -620);
    legs.close();
    for (const s of [-1, 1]) {
      legs.moveTo(s * 10, -640);
      legs.lineTo(s * 560, 0);
      legs.lineTo(s * 530, 0);
      legs.lineTo(s * -6, -600);
      legs.close();
    }
    const dim = Skia.Path.Make();
    dim.moveTo(-700, 0);
    dim.lineTo(-700, -H);
    dim.moveTo(-760, 0);
    dim.lineTo(-640, 0);
    dim.moveTo(-760, -H);
    dim.lineTo(-640, -H);
    const lead = Skia.Path.Make();
    lead.moveTo(-640, -H);
    lead.lineTo(-90, -H);
    return { ground, grass, legs, dim, lead, head };
  }, [len]);
  const labels: StaticLabel[] = [
    { id: 'ws', text: 'FOAM WINDSCREEN · CAPSULE INSIDE', short: 'WINDSCREEN', u: 120, v: -H - 200, align: 'left', tone: 'amber', at: { u: 60, v: -H - 60 } },
    { id: 'meter', text: 'THE METER: WEIGHTING, AVERAGING, DISPLAY', short: 'THE METER', u: 120, v: -H + 260, align: 'left', tone: 'muted', at: { u: r, v: -H + 220 } },
    { id: 'tri', text: 'TRIPOD', u: 360, v: -420, align: 'left', tone: 'muted' },
    { id: 'h', text: '1.5 M (5 FT) · ONE METHOD’S HEIGHT', short: '1.5 M (5 FT)', u: -680, v: -H / 2, align: 'left', tone: 'blue' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Path path={p.ground}>
            <LinearGradient start={vec(0, 0)} end={vec(0, 130)} colors={['#2c2a24', '#1a1915']} />
          </Path>
          <Path path={p.grass} style="stroke" strokeWidth={9} strokeCap="round" color="#3d5a35" />
          <Path path={p.legs}>
            <LinearGradient start={vec(-500, 0)} end={vec(500, 0)} colors={['#8f949c', '#4a4e55', '#2a2c31']} />
          </Path>
          <Path path={p.legs} style="stroke" strokeWidth={4} color="#08080a" />
          <Group transform={[{ translateY: -H }]}>
            <SoundLevelMeter r={r} len={len} />
          </Group>
          <Path path={p.lead} style="stroke" strokeWidth={3} color="#8fbcff" opacity={0.6} />
          <Path path={p.dim} style="stroke" strokeWidth={5} color="#8fbcff" />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={k} w={w} />
    </View>
  );
}
