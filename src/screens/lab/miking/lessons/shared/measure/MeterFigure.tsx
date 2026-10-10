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
    // The tripod (art pass 2026-10-10 — it was two flat bars splayed 45° from
    // a bare post): a light aluminium tripod of the usual class, its apex
    // (spider) 1000 mm up, three legs of three telescoping sections (Ø 26,
    // 22, 18 mm) with a lock at each joint and a rubber foot, splayed so the
    // feet stand on a 410 mm radius (legs about 1080 mm, 22° from vertical);
    // a centre column (Ø 22) up to a small pan head under the meter. One leg
    // points at the viewer (seen end-on, straight down the middle), the other
    // two splay left and right (0.87 × 410 mm out).
    const head = -H + len;
    const APEX = -1000;
    const legs = Skia.Path.Make();
    const locks = Skia.Path.Make();
    const feet = Skia.Path.Make();
    const tube = (x0: number, y0: number, x1: number, y1: number, r0: number, r1: number) => {
      const L = Math.hypot(x1 - x0, y1 - y0) || 1;
      const nx = -(y1 - y0) / L;
      const ny = (x1 - x0) / L;
      legs.moveTo(x0 + nx * r0, y0 + ny * r0);
      legs.lineTo(x1 + nx * r1, y1 + ny * r1);
      legs.lineTo(x1 - nx * r1, y1 - ny * r1);
      legs.lineTo(x0 - nx * r0, y0 - ny * r0);
      legs.close();
    };
    for (const [ax, fx] of [
      [-40, -357],
      [40, 357],
      [0, 0],
    ] as const) {
      // Three sections from the spider to the foot, each a little thinner.
      const at = (t: number) => [ax + (fx - ax) * t, APEX + (0 - APEX) * t] as const;
      const cuts = [0, 0.4, 0.72, 0.965];
      const rs = [13, 11, 9];
      for (let i = 0; i < 3; i++) {
        const [x0, y0] = at(cuts[i]);
        const [x1, y1] = at(cuts[i + 1]);
        tube(x0, y0, x1, y1, rs[i], rs[i]);
        if (i < 2) {
          const [lx, ly] = at(cuts[i + 1]);
          locks.addRRect(Skia.RRectXY(Skia.XYWHRect(lx - rs[i] - 5, ly - 22, 2 * rs[i] + 10, 44), 5, 5));
        }
      }
      const [qx, qy] = at(0.965);
      feet.addRRect(Skia.RRectXY(Skia.XYWHRect(qx - 15, qy - 4, 30, -qy + 4), 8, 8));
    }
    // The spider (the legs' hinge casting), the centre column and its lock
    // (the column's lower end hides behind the leg toward the viewer),
    // the pan head with its quick-release plate under the meter.
    legs.addRRect(Skia.RRectXY(Skia.XYWHRect(-62, APEX - 30, 124, 56), 12, 12));
    legs.addRect(Skia.XYWHRect(-11, head + 70, 22, APEX - 30 - head - 70));
    locks.addRRect(Skia.RRectXY(Skia.XYWHRect(-26, APEX - 70, 52, 40), 6, 6));
    locks.addRRect(Skia.RRectXY(Skia.XYWHRect(-34, head + 20, 68, 52), 10, 10));
    locks.addRRect(Skia.RRectXY(Skia.XYWHRect(-44, head, 88, 20), 4, 4));
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
    return { ground, grass, legs, locks, feet, dim, lead, head };
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
            <LinearGradient start={vec(-500, 0)} end={vec(500, 0)} colors={['#b9bec6', '#6e737c', '#3a3d44']} />
          </Path>
          <Path path={p.legs} style="stroke" strokeWidth={3} color="#08080a" />
          <Path path={p.locks} color="#1c1d21" />
          <Path path={p.locks} style="stroke" strokeWidth={2} color="#5a5e66" />
          <Path path={p.feet} color="#121214" />
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
