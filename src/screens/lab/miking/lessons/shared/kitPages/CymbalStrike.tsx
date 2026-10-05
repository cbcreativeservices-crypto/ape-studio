/**
 * HOW A CYMBAL MAKES ITS SOUND — the strike sequence, drawn (LESSON_JOURNEY
 * §6 stage 2, the cymbal family): a 16 in crash cut through the stick's line,
 * on its felts, under an EXPLANATORY OVERLAY revealed by `reveal` (1 … 4):
 *   ① the stick meets the bow;  ② the plate bends under it;
 *   ③ waves run out to the edge — the whole plate rings, and it rocks on its
 *      felts (the swing a mic keeps clear of);  ④ sound leaves BOTH faces —
 *      up toward the overheads and down toward the drums.
 *
 * HONESTY (the badge says it once): the bend and the ringing are drawn tens of
 * times larger than they are; the ringing outline is the plate model's lowest
 * shape across one diameter (cymbals/cymbalModes.ts); arrows give the ORDER
 * and the direction of events, never a speed or a level. Nothing loops (D8):
 * `reveal` is stepped, or played ONCE by the page.
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { CymbalSide } from '../cymbals/CymbalArt';
import { CRASH_16, surfaceHeight } from '../cymbals/cymbalSpec.ts';
import { CYMBAL_SHAPES, cymbalShapeAt, cymbalShapePeak } from '../cymbals/cymbalModes.ts';

const AMBER = '#ffc64d';
const AIR = '#9cc4ff';
const SPEC = CRASH_16;
const R = SPEC.d.mm / 2;
/** Drawn a little thicker here than in the kit scenes, so the bend reads. */
const T = SPEC.drawT.mm * 1.5;
/** Drawn motion (mm), exaggerated: the bend under the stick, the ringing. */
export const BEND_AMP = 26;
export const RING_AMP = 20;
export const ROCK_DEG = 4;
/** The stick's spot: on the bow, toward the player (−x). */
export const STRIKE_X = -0.58 * R;
export const STRIKE_BOX = { u0: -R - 150, u1: R + 90, v0: -300, v1: R * 0.8 };

/* ── the profile and the two displacement fields, sampled once ── */
const N = 64;
const XS: number[] = Array.from({ length: N + 1 }, (_, i) => -R + (2 * R * i) / N);
const TOP: number[] = XS.map((x) => -surfaceHeight(SPEC, x));
const BEND: number[] = XS.map((x) => {
  const g = Math.exp(-(((x - STRIKE_X) / (0.3 * R)) ** 2));
  const hold = 1 - Math.exp(-((x / (0.22 * R)) ** 2)); // the felts hold the centre
  return g * hold;
});
const RING: number[] = (() => {
  const sh = CYMBAL_SHAPES[0];
  const pk = cymbalShapePeak(sh);
  return XS.map((x) => cymbalShapeAt(sh, Math.abs(x) / R, x < 0 ? Math.PI : 0) / pk);
})();

type SkPath = ReturnType<typeof Skia.Path.Make>;

/** The plate's outline displaced by bend and ring (mm, +y down), rocked. */
function platePath(bend: number, ring: number, rockDeg: number): SkPath {
  'worklet';
  const p = Skia.Path.Make();
  const a = (rockDeg * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const pt = (i: number, off: number) => {
    const x = XS[i];
    const y = TOP[i] + off + bend * BEND[i] + ring * RING[i];
    return { x: x * ca - y * sa, y: x * sa + y * ca };
  };
  for (let i = 0; i <= N; i++) {
    const q = pt(i, 0);
    if (i === 0) p.moveTo(q.x, q.y);
    else p.lineTo(q.x, q.y);
  }
  for (let i = N; i >= 0; i--) {
    const q = pt(i, T);
    p.lineTo(q.x, q.y);
  }
  p.close();
  return p;
}

function restOutline(): SkPath {
  const p = Skia.Path.Make();
  for (let i = 0; i <= N; i++) {
    if (i === 0) p.moveTo(XS[i], TOP[i]);
    else p.lineTo(XS[i], TOP[i]);
  }
  return p;
}

const clamp01 = (v: number) => {
  'worklet';
  return v < 0 ? 0 : v > 1 ? 1 : v;
};

export type CymbalStrikeProps = { w: number; h: number; reveal: SharedValue<number>; shown: number; accessibilityLabel: string };

export function CymbalStrike({ w, h, reveal, shown, accessibilityLabel }: CymbalStrikeProps) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', STRIKE_BOX, w, h, 6), [w, h]);
  const statics = useMemo(() => {
    const rest = restOutline();
    // The stick: from the upper left, its tip on the bow at the strike.
    const tipY = -surfaceHeight(SPEC, STRIKE_X);
    const stick = Skia.Path.Make();
    stick.moveTo(STRIKE_X - 130, tipY - 210);
    stick.lineTo(STRIKE_X - 6, tipY - 9);
    const tip = Skia.Path.Make();
    tip.addOval(Skia.XYWHRect(STRIKE_X - 12, tipY - 16, 16, 14));
    // ③ curved arrows at the edges: the plate rocks on its felts.
    const rock = Skia.Path.Make();
    for (const s of [-1, 1]) {
      const x = s * (R + 24);
      rock.moveTo(x, -34);
      rock.quadTo(x + s * 16, 0, x, 34);
      rock.moveTo(x - 7, 26);
      rock.lineTo(x, 34);
      rock.lineTo(x + s * 8, 24);
    }
    // ④ radiation arcs above and below the plate.
    const up = Skia.Path.Make();
    const down = Skia.Path.Make();
    for (const k of [1, 2, 3]) {
      const r = R * (0.32 + 0.2 * k);
      up.addArc(Skia.XYWHRect(-r, -r - 30, 2 * r, 2 * r), 215, 110);
      down.addArc(Skia.XYWHRect(-r, -r + 40, 2 * r, 2 * r), 35, 110);
    }
    return { rest, stick, tip, rock, up, down, tipY };
  }, []);
  const plate = useDerivedValue(() => {
    const v = reveal.value;
    const bend = BEND_AMP * clamp01(v - 1) * (1 - clamp01(v - 2));
    const ring = RING_AMP * clamp01(v - 2);
    return platePath(bend, ring, ROCK_DEG * clamp01(v - 2));
  });
  const restOn = useDerivedValue(() => clamp01(reveal.value - 1) * 0.9);
  const stickOn = useDerivedValue(() => (reveal.value >= 1.98 ? 0.35 : 1));
  const rockOn = useDerivedValue(() => clamp01(reveal.value - 2) * (reveal.value >= 3.98 ? 0.45 : 1));
  const arcsOn = useDerivedValue(() => clamp01(reveal.value - 3));
  const labels: StaticLabel[] = [
    { id: 'e1', text: '1 · STICK ON THE BOW', short: '1 · STICK', u: STRIKE_X - 100, v: statics.tipY - 252, align: 'center', tone: shown === 1 ? 'amber' : 'muted' },
  ];
  if (shown >= 2) labels.push({ id: 'e2', text: '2 · THE PLATE BENDS', short: '2 · BENDS', u: STRIKE_X, v: statics.tipY + 76, align: 'center', tone: shown === 2 ? 'amber' : 'muted' });
  if (shown >= 3) labels.push({ id: 'e3', text: '3 · RINGS AND ROCKS', short: '3 · RINGS', u: R + 40, v: -60, align: 'right', tone: shown === 3 ? 'amber' : 'muted' });
  if (shown >= 4) {
    labels.push({ id: 'e4a', text: '4 · UP, TO THE OVERHEADS', short: '4 · UP', u: 0, v: -R * 0.86, align: 'center', tone: 'amber' });
    labels.push({ id: 'e4b', text: 'AND DOWN, TO THE DRUMS', short: 'AND DOWN', u: 0, v: R * 0.72, align: 'center', tone: 'amber' });
  }
  labels.push({ id: 'felts', text: 'FELTS', u: 36, v: -SPEC.rise.mm - 30, align: 'left', tone: 'muted' });
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          {/* the stand's tilter, felts and wing nut (the plate is drawn below) */}
          <CymbalSide spec={SPEC} cx={0} cy={0} tiltDeg={0} plate={false} />
          {/* the plate in motion (bronze), over the rest outline (dashed) */}
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
          </Group>
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
