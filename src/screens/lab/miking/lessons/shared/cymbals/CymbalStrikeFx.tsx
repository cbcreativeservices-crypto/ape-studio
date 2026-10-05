/**
 * HOW A CYMBAL MAKES ITS SOUND, for any cymbal of the family (the Lab 2
 * lessons): the kit lessons' strike sequence (kitPages/CymbalStrike.tsx,
 * a 16 in crash) generalised to the lesson's own plate — a splash, a ride,
 * the China's cup and lip, either way up, or the hi-hats' PAIR. The plate is
 * cut through the stick's line on its felts, under an EXPLANATORY OVERLAY
 * revealed by `reveal` (1 … 4):
 *   ① the stick meets the plate;  ② the plate bends under it;
 *   ③ it rings (the plate model's lowest shape across one diameter) and rocks
 *      on its felts — a closed pair rings only briefly, pressed together;
 *   ④ sound leaves both faces (a pair: out of the gap, sideways too).
 *
 * HONESTY (said once by the badge): the bend and the ringing are drawn tens
 * of times larger than they are; the arrows give the ORDER and direction of
 * events, never a speed or a level. Nothing loops (D8): `reveal` is stepped,
 * or played ONCE by the page.
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { MountStack } from './CymbalKitArt';
import { surfaceHeight, type CymbalSpec } from './cymbalSpec.ts';
import { CYMBAL_SHAPES, cymbalShapeAt, cymbalShapePeak } from './cymbalModes.ts';
import { chinaHeight } from './cymbalFx.ts';

const AMBER = '#ffc64d';
const AIR = '#9cc4ff';
const N = 64;

type SkPath = ReturnType<typeof Skia.Path.Make>;

export type StrikeFxProps = {
  w: number;
  h: number;
  spec: CymbalSpec;
  profile: 'bow' | 'china';
  inverted: boolean;
  /** The hi-hats: the bottom cymbal `gap` mm under the top one (null: one plate). */
  pairGap: number | null;
  /** The stick's spot, a fraction of the radius, toward the player (−x). */
  rFrac: number;
  /** 0..1: how much the plate rings at ③ (a closed pair is held: little). */
  ringScale: number;
  reveal: SharedValue<number>;
  shown: number;
  marks: readonly [string, string, string, string, string];
  accessibilityLabel: string;
};

const clamp01 = (v: number) => {
  'worklet';
  return v < 0 ? 0 : v > 1 ? 1 : v;
};

function sample(spec: CymbalSpec, profile: 'bow' | 'china', inverted: boolean, rFrac: number) {
  const R = spec.d.mm / 2;
  const xs = Array.from({ length: N + 1 }, (_, i) => -R + (2 * R * i) / N);
  const hFn = profile === 'china' ? chinaHeight : (r: number) => surfaceHeight(spec, r);
  const top = xs.map((x) => (inverted ? 1 : -1) * hFn(x));
  const sx = -rFrac * R;
  const bend = xs.map((x) => Math.exp(-(((x - sx) / (0.3 * R)) ** 2)) * (1 - Math.exp(-((x / (0.22 * R)) ** 2))));
  const sh = CYMBAL_SHAPES[0];
  const pk = cymbalShapePeak(sh);
  const ring = xs.map((x) => cymbalShapeAt(sh, Math.abs(x) / R, x < 0 ? Math.PI : 0) / pk);
  return { xs, top, bend, ring, R, sx, tipY: top[Math.round(((sx + R) / (2 * R)) * N)] };
}

/** The plate displaced by bend and ring (mm, +y down), rocked. */
function platePath(xs: number[], top: number[], bendF: number[], ringF: number[], T: number, bend: number, ring: number, rockDeg: number, dy: number): SkPath {
  'worklet';
  const p = Skia.Path.Make();
  const a = (rockDeg * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  for (let i = 0; i <= N; i++) {
    const x = xs[i];
    const y = top[i] + bend * bendF[i] + ring * ringF[i];
    const qx = x * ca - y * sa;
    const qy = x * sa + y * ca + dy;
    if (i === 0) p.moveTo(qx, qy);
    else p.lineTo(qx, qy);
  }
  for (let i = N; i >= 0; i--) {
    const x = xs[i];
    const y = top[i] + T + bend * bendF[i] + ring * ringF[i];
    p.lineTo(x * ca - y * sa, x * sa + y * ca + dy);
  }
  p.close();
  return p;
}

export function CymbalStrikeFx({ w, h, spec, profile, inverted, pairGap, rFrac, ringScale, reveal, shown, marks, accessibilityLabel }: StrikeFxProps) {
  const textScale = useStageTextScale();
  const S = useMemo(() => sample(spec, profile, inverted, rFrac), [spec, profile, inverted, rFrac]);
  const R = S.R;
  const T = Math.max(3, spec.drawT.mm * 1.5);
  const box = useMemo(() => ({ u0: -R - 150, u1: R + 100, v0: -Math.max(260, R * 1.1), v1: Math.max(200, R * 0.9) + (pairGap ?? 0) }), [R, pairGap]);
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h, box]);
  // Drawn motion (mm), exaggerated, scaled to the plate.
  const BEND = R * 0.13;
  const RING = R * 0.1 * ringScale;
  const ROCK = 4 * ringScale;
  const pair = pairGap != null;
  const statics = useMemo(() => {
    const rest = Skia.Path.Make();
    S.xs.forEach((x, i) => (i === 0 ? rest.moveTo(x, S.top[i]) : rest.lineTo(x, S.top[i])));
    const stick = Skia.Path.Make();
    stick.moveTo(S.sx - 130, S.tipY - 210);
    stick.lineTo(S.sx - 6, S.tipY - 9);
    const tip = Skia.Path.Make();
    tip.addOval(Skia.XYWHRect(S.sx - 12, S.tipY - 16, 16, 14));
    const rock = Skia.Path.Make();
    for (const s of [-1, 1]) {
      const x = s * (R + 24);
      rock.moveTo(x, -34);
      rock.quadTo(x + s * 16, 0, x, 34);
      rock.moveTo(x - 7, 26);
      rock.lineTo(x, 34);
      rock.lineTo(x + s * 8, 24);
    }
    const up = Skia.Path.Make();
    const down = Skia.Path.Make();
    const side = Skia.Path.Make();
    for (const k of [1, 2, 3]) {
      const r = R * (0.32 + 0.2 * k);
      up.addArc(Skia.XYWHRect(-r, -r - 30, 2 * r, 2 * r), 215, 110);
      down.addArc(Skia.XYWHRect(-r, -r + 40 + (pairGap ?? 0), 2 * r, 2 * r), 35, 110);
      if (pair) {
        const q = 40 + 30 * k;
        side.addArc(Skia.XYWHRect(-R - q, -q * 0.6 + (pairGap ?? 0) / 2, 2 * q, 1.2 * q), 150, 60);
        side.addArc(Skia.XYWHRect(R - q, -q * 0.6 + (pairGap ?? 0) / 2, 2 * q, 1.2 * q), -30, 60);
      }
    }
    // The hi-hats' bottom cymbal (inverted, still on the seat).
    const bottom = Skia.Path.Make();
    if (pair) {
      S.xs.forEach((x, i) => {
        const y = (pairGap ?? 0) + surfaceHeight(spec, x);
        if (i === 0) bottom.moveTo(x, y);
        else bottom.lineTo(x, y);
      });
      for (let i = N; i >= 0; i--) bottom.lineTo(S.xs[i], (pairGap ?? 0) + surfaceHeight(spec, S.xs[i]) - T);
      bottom.close();
    }
    // The hi-hats' pull rod and clutch (the family's drawing defaults).
    const rod = Skia.Path.Make();
    const clutch = Skia.Path.Make();
    if (pair) {
      const top = S.top[N / 2];
      rod.moveTo(0, top - 120);
      rod.lineTo(0, (pairGap ?? 0) + spec.rise.mm + 90);
      clutch.addRRect(Skia.RRectXY(Skia.XYWHRect(-13, top - 78, 26, 58), 5, 5));
      clutch.addRRect(Skia.RRectXY(Skia.XYWHRect(-19, top - 12, 38, 10), 2, 2));
      clutch.addRRect(Skia.RRectXY(Skia.XYWHRect(-22, (pairGap ?? 0) + spec.rise.mm, 44, 26), 6, 6));
    }
    return { rest, stick, tip, rock, up, down, side, bottom, rod, clutch };
  }, [S, R, pairGap, pair, spec, T]);
  const plate = useDerivedValue(() => {
    const v = reveal.value;
    const b = BEND * clamp01(v - 1) * (1 - clamp01(v - 2));
    const r = RING * clamp01(v - 2);
    return platePath(S.xs, S.top, S.bend, S.ring, T, b, r, ROCK * clamp01(v - 2), 0);
  });
  const restOn = useDerivedValue(() => clamp01(reveal.value - 1) * 0.9);
  const stickOn = useDerivedValue(() => (reveal.value >= 1.98 ? 0.35 : 1));
  const rockOn = useDerivedValue(() => clamp01(reveal.value - 2) * (reveal.value >= 3.98 ? 0.45 : 1) * (ringScale > 0.4 ? 1 : 0.35));
  const arcsOn = useDerivedValue(() => clamp01(reveal.value - 3));
  // The mount: the felts on the plate's top at the centre.
  const topAt0 = S.top[N / 2];
  const seat = topAt0 + T;
  const labels: StaticLabel[] = [{ id: 'e1', text: marks[0], short: marks[0].split(' · ')[0], u: S.sx - 100, v: S.tipY - 252, align: 'center', tone: shown === 1 ? 'amber' : 'muted' }];
  if (shown >= 2) labels.push({ id: 'e2', text: marks[1], short: marks[1].split(' · ')[0], u: S.sx, v: S.tipY + 70 + (pairGap ?? 0), align: 'center', tone: shown === 2 ? 'amber' : 'muted' });
  if (shown >= 3) labels.push({ id: 'e3', text: marks[2], short: marks[2].split(' · ')[0], u: R + 40, v: -64, align: 'right', tone: shown === 3 ? 'amber' : 'muted' });
  if (shown >= 4) {
    labels.push({ id: 'e4a', text: marks[3], short: marks[3].split(',')[0], u: 0, v: -R * 0.86 - 10, align: 'center', tone: 'amber' });
    labels.push({ id: 'e4b', text: marks[4], short: marks[4].split(',')[0], u: 0, v: R * 0.72 + (pairGap ?? 0), align: 'center', tone: 'amber' });
  }
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          {pair ? null : <MountStack seat={seat} top={topAt0} />}
          {pair ? (
            <Group>
              <Path path={statics.rod} style="stroke" strokeWidth={7} strokeCap="round" color="#c6cad4" />
              <Path path={statics.clutch}>
                <LinearGradient start={vec(-22, 0)} end={vec(22, 0)} colors={['#3a3d45', '#eef1f6', '#9aa0ab', '#4a4e57']} />
              </Path>
              <Path path={statics.bottom}>
                <LinearGradient start={vec(-R, 0)} end={vec(R, 30)} colors={['#e9c98a', '#c39548', '#8f6524', '#5a3c12']} />
              </Path>
              <Path path={statics.bottom} style="stroke" strokeWidth={1} color="#5e3e12" />
            </Group>
          ) : null}
          <Path path={plate}>
            <LinearGradient start={vec(-R, -40)} end={vec(R, 20)} colors={['#fbe3a6', '#e2b25c', '#b9852f', '#80561a', '#4f3410']} positions={[0, 0.22, 0.5, 0.78, 1]} />
          </Path>
          <Path path={plate} style="stroke" strokeWidth={1} color="#5e3e12" />
          <Path path={statics.rest} style="stroke" strokeWidth={2} color="#e8eaee" opacity={restOn}>
            <DashPathEffect intervals={[8, 6]} />
          </Path>
          <Group opacity={stickOn}>
            <Path path={statics.stick} style="stroke" strokeWidth={13} strokeCap="round" color="#3b2a17" />
            <Path path={statics.stick} style="stroke" strokeWidth={9} strokeCap="round" color="#d8b07a" />
            <Path path={statics.tip} color="#e9cf9f" />
          </Group>
          <Group opacity={rockOn}>
            <Path path={statics.rock} style="stroke" strokeWidth={4} strokeCap="round" strokeJoin="round" color={AMBER} />
          </Group>
          <Group opacity={arcsOn}>
            <Path path={statics.up} style="stroke" strokeWidth={4} strokeCap="round" color={AIR} />
            <Path path={statics.down} style="stroke" strokeWidth={4} strokeCap="round" color={AIR} opacity={0.75} />
            {pair ? <Path path={statics.side} style="stroke" strokeWidth={4} strokeCap="round" color={AIR} /> : null}
          </Group>
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
