/**
 * M01 KICK — HOW IT SOUNDS, drawn (LESSON_JOURNEY §6 stage 2). The kick's own
 * side cutaway (art.tsx, unchanged) under an EXPLANATORY OVERLAY built from
 * the same anchors (geometry.ts), in millimetres of the side view.
 *
 *   StrikeSequence   the four events, numbered, revealed by `reveal` (1 … 4):
 *                    ① the beater's swing to the strike point; ② the batter
 *                    head bowed in; ③ the air pushing the front head out (and,
 *                    ported, air leaving the port); ④ where sound leaves.
 *   CoupledHeads     the two heads' lowest shape coupled through the enclosed
 *                    air (the Drum Tuning Lab's two-head model): TOGETHER (the
 *                    lower of the pair: both heads move the same way, the air
 *                    is carried along) or OPPOSED (the higher: both move
 *                    inward or outward together, squeezing / easing the air).
 *
 * HONESTY (simplifications register, kick/SOURCES and the badge):
 *   • the head outline is the IDEAL membrane's lowest shape, J0(2.405 r/R)
 *     (engine/physics/membrane.ts), EXAGGERATED tens of times — a real head
 *     moves far less; the rest position stays drawn;
 *   • arrows show the ORDER of events and their direction, never a speed, a
 *     pressure or a level; the radiation arcs say WHERE sound leaves, not how
 *     much;
 *   • the coupled pair is drawn with equal head motion (an ideal, symmetric
 *     pair); a real drum's two heads differ.
 * Nothing loops (D8): `reveal` is stepped, or played ONCE by the page.
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, Path, Rect, Skia } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { useStageTextScale } from '../../../rack/stageAspect';
import type { VariantId } from '../../engine/model/types.ts';
import { fitXform } from '../../engine/geometry/frame.ts';
import { lowestProfile } from '../../engine/physics/membrane.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import { KickArt } from './art';
import { KICK_ANCHORS, KICK_GEOM as G, portOpening } from './geometry.ts';

const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const AIR = '#9cc4ff';
/** Exaggeration of the drawn head motion (mm at the centre). */
export const BATTER_AMP = 55;
export const FRONT_AMP = 40;
/** The scene's model box (side view): the drum, the pedal, and room for the arcs. */
export const SOUND_BOX = { u0: -430, u1: 790, v0: -335, v1: G.yFloor + 20 };

type SkPath = ReturnType<typeof Skia.Path.Make>;

/* ── the head profile, sampled once (plain numbers: safe in worklets) ── */
const N = 48;
const PROFILE: number[] = Array.from({ length: N + 1 }, (_, i) => lowestProfile(-1 + (2 * i) / N));

/** A head's outline displaced by `amp` mm along +x, at plane x = x0. */
function headPath(x0: number, amp: number): SkPath {
  'worklet';
  const p = Skia.Path.Make();
  for (let i = 0; i <= N; i++) {
    const y = -G.R + (2 * G.R * i) / N;
    const x = x0 + amp * PROFILE[i];
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  return p;
}
/** The sliver between the rest plane and the displaced outline (a fill). */
function headFill(x0: number, amp: number): SkPath {
  'worklet';
  const p = headPath(x0, amp);
  p.lineTo(x0, G.R);
  p.lineTo(x0, -G.R);
  p.close();
  return p;
}

function arrow(p: SkPath, x0: number, y0: number, x1: number, y1: number, head = 22) {
  p.moveTo(x0, y0);
  p.lineTo(x1, y1);
  const a = Math.atan2(y1 - y0, x1 - x0);
  p.moveTo(x1 - head * Math.cos(a - 0.45), y1 - head * Math.sin(a - 0.45));
  p.lineTo(x1, y1);
  p.lineTo(x1 - head * Math.cos(a + 0.45), y1 - head * Math.sin(a + 0.45));
}
function arcs(p: SkPath, cx: number, cy: number, radii: number[], a0: number, a1: number) {
  for (const r of radii) p.addArc(Skia.XYWHRect(cx - r, cy - r, 2 * r, 2 * r), a0, a1 - a0);
}

/* ── overlay paths, built once ── */
let built: null | { swing: SkPath; strike: SkPath; air: SkPath; port: SkPath; toAudience: SkPath; toPlayer: SkPath; fromPort: SkPath; pushB: SkPath; pushR: SkPath } = null;
function overlay() {
  if (built) return built;
  const b = G.beater;
  const swing = Skia.Path.Make();
  const steps = 18;
  for (let i = 0; i <= steps; i++) {
    const a = b.restAngle + ((b.strikeAngle - b.restAngle) * i) / steps;
    const x = b.axle.x + b.len * Math.cos(a);
    const y = b.axle.y + b.len * Math.sin(a);
    if (i === 0) swing.moveTo(x, y);
    else swing.lineTo(x, y);
  }
  const end = { x: b.axle.x + b.len * Math.cos(b.strikeAngle), y: b.axle.y + b.len * Math.sin(b.strikeAngle) };
  const pre = { x: b.axle.x + b.len * Math.cos(b.strikeAngle - 0.12), y: b.axle.y + b.len * Math.sin(b.strikeAngle - 0.12) };
  const strike = Skia.Path.Make();
  arrow(strike, pre.x, pre.y, end.x, end.y, 24);
  const air = Skia.Path.Make();
  for (const y of [-165, -40, 85]) arrow(air, 120, y, 345, y, 26);
  const port = Skia.Path.Make();
  const po = portOpening('side');
  const pc = (po.lo + po.hi) / 2;
  arrow(port, G.L - 40, pc, G.L + 150, pc, 26);
  const toAudience = Skia.Path.Make();
  arcs(toAudience, G.L, -60, [150, 215, 280], -42, 30);
  const toPlayer = Skia.Path.Make();
  arcs(toPlayer, 0, -60, [215, 280], 196, 238);
  const fromPort = Skia.Path.Make();
  arcs(fromPort, G.L + 10, pc, [95, 140], -28, 28);
  const pushB = Skia.Path.Make();
  arrow(pushB, -10, 0, 95, 0, 22);
  const pushR = Skia.Path.Make();
  arrow(pushR, G.L + 10, 0, G.L + 110, 0, 22);
  built = { swing, strike, air, port, toAudience, toPlayer, fromPort, pushB, pushR };
  return built;
}

const clamp01 = (x: number) => {
  'worklet';
  return Math.max(0, Math.min(1, x));
};

/* ── ① – ④ ── */
export type StrikeSequenceProps = { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string };

export function StrikeSequence({ w, h, variant, reveal, shown, accessibilityLabel }: StrikeSequenceProps) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', SOUND_BOX, w, h, 6), [w, h]);
  const o = overlay();
  const ported = variant === 'ported';
  // Each event fades in as `reveal` passes it; earlier ones dim (signalling).
  const op = (i: number) => {
    'worklet';
    const on = clamp01(reveal.value - i);
    return on * (reveal.value >= i + 1.98 ? 0.4 : 1);
  };
  const o1 = useDerivedValue(() => op(0));
  const o2 = useDerivedValue(() => op(1));
  const o3 = useDerivedValue(() => op(2));
  const o4 = useDerivedValue(() => clamp01(reveal.value - 3));
  const bAmp = useDerivedValue(() => BATTER_AMP * clamp01(reveal.value - 1));
  const rAmp = useDerivedValue(() => FRONT_AMP * clamp01(reveal.value - 2));
  const bLine = useDerivedValue(() => headPath(0, bAmp.value));
  const bFill = useDerivedValue(() => headFill(0, bAmp.value));
  const rLine = useDerivedValue(() => headPath(G.L, rAmp.value));
  const rFill = useDerivedValue(() => headFill(G.L, rAmp.value));
  const headOn = useDerivedValue(() => clamp01(reveal.value - 1));
  const frontOn = useDerivedValue(() => clamp01(reveal.value - 2));
  const strikeAt = KICK_ANCHORS['pedal.beater.strike'];
  const po = portOpening('side');

  const labels: StaticLabel[] = [];
  if (shown >= 1) labels.push({ id: 's1', text: '① STRIKE', u: -250, v: -95, align: 'center', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 's2', text: '② HEAD PUSHED IN', short: '② HEAD IN', u: 30, v: -G.hoopOut - 30, align: 'left', tone: 'blue' });
  if (shown >= 3) labels.push({ id: 's3', text: '③ AIR PUSHES FRONT HEAD', short: '③ AIR → FRONT', u: G.L / 2, v: -215, align: 'center', tone: 'blue' });
  if (shown >= 3 && ported) labels.push({ id: 'p3', text: 'AIR OUT OF PORT', short: 'PORT AIR', u: G.L + 160, v: po.hi + 40, align: 'left', tone: 'blue' });
  if (shown >= 4) {
    labels.push({ id: 's4a', text: '④ TO THE AUDIENCE', short: '④ AUDIENCE', u: G.L + 295, v: -265, align: 'right', tone: 'blue' });
    labels.push({ id: 's4b', text: 'TO THE PLAYER', short: 'PLAYER', u: -260, v: -300, align: 'center', tone: 'blue' });
  }
  labels.push({ id: 'ex', text: 'MOTION EXAGGERATED', short: 'EXAGGERATED', u: SOUND_BOX.u1 - 20, v: G.yFloor - 18, align: 'right', tone: 'illustrative' });

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <KickArt view="side" variant={variant} />
          {/* ① the beater's swing (an envelope: the pedal is ILLUSTRATIVE) */}
          <Group opacity={o1}>
            <Path path={o.swing} style="stroke" strokeWidth={7} color={AMBER} strokeCap="round">
              <DashPathEffect intervals={[18, 12]} />
            </Path>
            <Path path={o.strike} style="stroke" strokeWidth={8} color={AMBER} strokeCap="round" strokeJoin="round" />
            <Circle cx={strikeAt.x} cy={strikeAt.y} r={26} style="stroke" strokeWidth={6} color={AMBER} />
          </Group>
          {/* ② the batter head bowed in (rest plane still drawn by the art) */}
          <Group opacity={headOn}>
            <Path path={bFill} color="rgba(111,168,255,0.28)" />
            <Path path={bLine} style="stroke" strokeWidth={8} color={BLUE} />
          </Group>
          <Group opacity={o2}>
            <Path path={o.pushB} style="stroke" strokeWidth={8} color={BLUE} strokeCap="round" strokeJoin="round" />
          </Group>
          {/* ③ the air, the front head, the port */}
          <Group opacity={o3}>
            <Path path={o.air} style="stroke" strokeWidth={7} color={AIR} strokeCap="round" strokeJoin="round">
              <DashPathEffect intervals={[22, 14]} />
            </Path>
            <Path path={o.pushR} style="stroke" strokeWidth={8} color={BLUE} strokeCap="round" strokeJoin="round" />
            {ported ? <Path path={o.port} style="stroke" strokeWidth={8} color={AIR} strokeCap="round" strokeJoin="round" /> : null}
          </Group>
          <Group opacity={frontOn}>
            <Path path={rFill} color="rgba(111,168,255,0.28)" />
            <Path path={rLine} style="stroke" strokeWidth={8} color={BLUE} />
          </Group>
          {/* ④ where sound leaves (an overlay: direction, not amount) */}
          <Group opacity={o4}>
            <Path path={o.toAudience} style="stroke" strokeWidth={6} color={AIR} opacity={0.9}>
              <DashPathEffect intervals={[26, 16]} />
            </Path>
            <Path path={o.toPlayer} style="stroke" strokeWidth={6} color={AIR} opacity={0.75}>
              <DashPathEffect intervals={[26, 16]} />
            </Path>
            {ported ? (
              <Path path={o.fromPort} style="stroke" strokeWidth={6} color={AIR} opacity={0.9}>
                <DashPathEffect intervals={[20, 14]} />
              </Path>
            ) : null}
          </Group>
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/* ── two heads, one air ── */
export type CoupledHeadsProps = { w: number; h: number; variant: VariantId; mode: 'together' | 'opposed'; swing: number; accessibilityLabel: string };

export function CoupledHeads({ w, h, variant, mode, swing, accessibilityLabel }: CoupledHeadsProps) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', SOUND_BOX, w, h, 6), [w, h]);
  // +x is toward the audience. TOGETHER: both heads move the same way in
  // space. OPPOSED: the batter moves +x while the front moves −x (both in).
  const b = BATTER_AMP * swing;
  const r = (mode === 'together' ? 1 : -1) * FRONT_AMP * swing;
  const paths = useMemo(() => ({ bLine: headPath(0, b), bFill: headFill(0, b), rLine: headPath(G.L, r), rFill: headFill(G.L, r) }), [b, r]);
  // Squeezed air (OPPOSED only): a tint inside the shell whose strength
  // follows |swing| — denser blue when both heads are in, lighter when out.
  const squeeze = mode === 'opposed' ? swing : 0;
  const tint = squeeze > 0 ? `rgba(111,168,255,${(0.32 * squeeze).toFixed(3)})` : `rgba(232,234,238,${(0.12 * -squeeze).toFixed(3)})`;
  const labels: StaticLabel[] = [
    { id: 'b', text: swing === 0 ? 'BATTER · AT REST' : swing > 0 ? 'BATTER → IN' : 'BATTER ← OUT', short: 'BATTER', u: 20, v: -G.hoopOut - 30, align: 'left', tone: 'blue' },
    { id: 'r', text: r === 0 ? 'FRONT · AT REST' : r > 0 ? 'FRONT → OUT' : 'FRONT ← IN', short: 'FRONT', u: G.L + 60, v: -G.hoopOut - 30, align: 'left', tone: 'blue' },
    { id: 'air', text: mode === 'together' ? 'AIR CARRIED ALONG' : squeeze > 0.05 ? 'AIR SQUEEZED' : squeeze < -0.05 ? 'AIR EASED' : 'AIR AT REST', short: 'AIR', u: G.L / 2, v: -150, align: 'center', tone: 'blue' },
    { id: 'ex', text: 'MOTION EXAGGERATED', short: 'EXAGGERATED', u: SOUND_BOX.u1 - 20, v: G.yFloor - 18, align: 'right', tone: 'illustrative' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <KickArt view="side" variant={variant} />
          <Rect x={12} y={-G.rIn + 8} width={G.L - 24} height={2 * G.rIn - 16} color={tint} />
          <Path path={paths.bFill} color="rgba(111,168,255,0.28)" />
          <Path path={paths.bLine} style="stroke" strokeWidth={8} color={BLUE} />
          <Path path={paths.rFill} color="rgba(111,168,255,0.28)" />
          <Path path={paths.rLine} style="stroke" strokeWidth={8} color={BLUE} />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
