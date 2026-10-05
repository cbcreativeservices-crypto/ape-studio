/**
 * C10 HARP — HOW IT SOUNDS, drawn (LESSON_JOURNEY §6 stage 2, §7 strings):
 * the harp's own side view (art.tsx) under an EXPLANATORY OVERLAY, one string
 * lit, in millimetres of frame H.
 *
 *   ① the finger pulls the string aside (it bends at the finger: two straight
 *     lengths); ② it lets go — the string swings (drawn as the two extremes
 *     of its lowest shape); ③ where the string is anchored it pulls on the
 *     soundboard, and the board bows (drawn larger); ④ sound leaves from the
 *     board's face and, as air from inside the box, through the holes in its
 *     back; ⑤ the harpist's hand stops the string.
 *
 * HONESTY (simplifications register): a plucked harp string swings mostly
 * ACROSS the row of strings; here its swing is drawn in the picture's plane
 * so it can be seen (the badge says so). Every motion is drawn many times
 * larger; arrows show the order and the direction, never a speed or a level.
 * One value, `reveal` (1 … 5), drives every part; nothing loops (D8).
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, DashPathEffect, Group, Path, Skia } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { useStageTextScale } from '../../../rack/stageAspect';
import type { VariantId } from '../../engine/model/types.ts';
import { fitXform } from '../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import { HarpSide } from './art';
import { harpGeom } from './harpSpec.ts';

const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const AIR = '#9cc4ff';
type SkPath = ReturnType<typeof Skia.Path.Make>;

const AMP = 70;
const BOARD_AMP = 26;

const clamp01 = (x: number) => {
  'worklet';
  return Math.max(0, Math.min(1, x));
};

function arrow(p: SkPath, x0: number, y0: number, x1: number, y1: number, head = 28) {
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

type Built = { box: { u0: number; u1: number; v0: number; v1: number }; i: number; x: number; y0: number; y1: number; o: Record<string, SkPath>; b0: [number, number]; b1: [number, number]; n: [number, number] };
const cache = new Map<string, Built>();
function build(lever: boolean): Built {
  const key = lever ? 'l' : 'p';
  const hit = cache.get(key);
  if (hit) return hit;
  const g = harpGeom(lever);
  const k = g.scale;
  const i = Math.floor(g.strings.length * 0.3);
  const s = g.strings[i];
  const mid = (s.y0 + s.y1) / 2;
  const o: Record<string, SkPath> = {};
  o.pull = Skia.Path.Make();
  arrow(o.pull, s.x - 40 * k, mid, s.x - AMP - 70 * k, mid);
  o.release = Skia.Path.Make();
  arrow(o.release, s.x - AMP - 40 * k, mid - 60 * k, s.x + 30 * k, mid - 60 * k);
  o.toBoard = Skia.Path.Make();
  arrow(o.toBoard, s.x + 60 * k, s.y0 - 220 * k, s.x + 6 * k, s.y0 - 30 * k);
  const bm = g.boardAt(0.5);
  o.front = Skia.Path.Make();
  const fa = (Math.atan2(g.n[1], g.n[0]) * 180) / Math.PI;
  arcs(o.front, bm[0] + g.n[0] * 200 * k, bm[1] + g.n[1] * 200 * k, [160 * k, 240 * k, 320 * k], fa - 40, fa + 40);
  const hole = g.holes[1].c;
  o.back = Skia.Path.Make();
  arcs(o.back, hole[0], hole[1], [110 * k, 170 * k], fa + 180 - 35, fa + 180 + 35);
  o.hand = Skia.Path.Make();
  o.hand.addOval(Skia.XYWHRect(s.x - 70 * k, mid - 70 * k, 120 * k, 140 * k));
  o.stop = Skia.Path.Make();
  arrow(o.stop, s.x - 220 * k, mid + 160 * k, s.x - 60 * k, mid + 40 * k, 24);
  const box = { u0: -1050, u1: Math.max(700 * k, 400), v0: g.crown.top - 120, v1: 60 };
  const out: Built = { box, i, x: s.x, y0: s.y0, y1: s.y1, o, b0: [g.b0[0], g.b0[1]], b1: [g.b1[0], g.b1[1]], n: [g.n[0], g.n[1]] };
  cache.set(key, out);
  return out;
}

/** The lit string at reveal r: bent at the finger (①), swinging (② – ④), straight (⑤). */
function stringPath(x: number, y0: number, y1: number, r: number, sign: number): SkPath {
  'worklet';
  const p = Skia.Path.Make();
  const n = 32;
  const pulled = r < 2 ? 1 : 0;
  const swing = r < 2 ? 0 : r < 4.5 ? Math.min(1, (r - 2) * 3) : Math.max(0, 1 - (r - 4.5) * 2);
  for (let j = 0; j <= n; j++) {
    const f = j / n;
    const y = y0 + (y1 - y0) * f;
    const tri = f < 0.5 ? f * 2 : (1 - f) * 2;
    const dx = -AMP * (pulled * tri + sign * swing * Math.sin(Math.PI * f));
    if (j === 0) p.moveTo(x + dx, y);
    else p.lineTo(x + dx, y);
  }
  return p;
}
function boardPath(b0: [number, number], b1: [number, number], n: [number, number], a: number): SkPath {
  'worklet';
  const p = Skia.Path.Make();
  const m = 24;
  for (let j = 0; j <= m; j++) {
    const f = j / m;
    const d = a * Math.sin(Math.PI * f);
    const x = b0[0] + (b1[0] - b0[0]) * f + n[0] * d;
    const y = b0[1] + (b1[1] - b0[1]) * f + n[1] * d;
    if (j === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  return p;
}

export function HarpPluckSequence({ w, h, variant, reveal, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const lever = variant === 'lever';
  const B = build(lever);
  const xf = useMemo(() => fitXform('side', B.box, w, h, 6), [B.box, w, h]);
  const sA = useDerivedValue(() => stringPath(B.x, B.y0, B.y1, reveal.value, 1));
  const sB = useDerivedValue(() => stringPath(B.x, B.y0, B.y1, reveal.value, -1));
  const sBOn = useDerivedValue(() => (reveal.value >= 2 && reveal.value < 4.9 ? 0.5 : 0));
  const bd = useDerivedValue(() => {
    const r = reveal.value;
    const a = r < 2.7 ? 0 : r < 4.5 ? Math.min(1, (r - 2.7) * 3) : Math.max(0, 1 - (r - 4.5) * 2);
    return boardPath(B.b0, B.b1, B.n, BOARD_AMP * a);
  });
  const bOn = useDerivedValue(() => (reveal.value >= 2.7 && reveal.value < 4.95 ? 1 : 0));
  const op = (i: number) => {
    'worklet';
    const on = clamp01(reveal.value - i);
    return on * (reveal.value >= i + 1.98 ? 0.35 : 1);
  };
  const o1 = useDerivedValue(() => op(0));
  const o2 = useDerivedValue(() => (reveal.value < 4.5 ? op(1) : 0));
  const o3 = useDerivedValue(() => (reveal.value < 4.5 ? op(2) : 0));
  const o4 = useDerivedValue(() => (reveal.value < 4.6 ? clamp01(reveal.value - 3) : 0.3));
  const o5 = useDerivedValue(() => clamp01((reveal.value - 4.5) * 2));
  const mid = (B.y0 + B.y1) / 2;
  const labels: StaticLabel[] = [];
  const at = { u: B.box.u0 + 40, v: B.box.v0 + 90 };
  if (shown === 1) labels.push({ id: 'e1', text: '① THE FINGER PULLS IT ASIDE', short: '① PULL', ...at, align: 'left', tone: 'amber' });
  if (shown === 2) labels.push({ id: 'e2', text: '② LET GO · IT SWINGS', short: '② SWINGS', ...at, align: 'left', tone: 'amber' });
  if (shown === 3) labels.push({ id: 'e3', text: '③ IT PULLS ON THE SOUNDBOARD', short: '③ ON THE BOARD', ...at, align: 'left', tone: 'blue' });
  if (shown === 4) labels.push({ id: 'e4', text: '④ OUT OF THE BOARD · OUT OF THE HOLES', short: '④ SOUND LEAVES', ...at, align: 'left', tone: 'blue' });
  if (shown === 5) labels.push({ id: 'e5', text: '⑤ A HAND STOPS IT', short: '⑤ STOPPED', ...at, align: 'left', tone: 'amber' });
  labels.push({ id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: B.box.u1 - 20, v: B.box.v1 - 30, align: 'right', tone: 'illustrative' });
  labels.push({ id: 'str', text: 'ONE STRING', u: B.x + 40, v: mid - 200, align: 'left', tone: 'blue' });
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <HarpSide variant={variant} dim={0.75} />
          <Group opacity={sBOn}>
            <Path path={sB} style="stroke" strokeWidth={6} color={BLUE} />
          </Group>
          <Path path={sA} style="stroke" strokeWidth={9} color={BLUE} />
          <Group opacity={bOn}>
            <Path path={bd} style="stroke" strokeWidth={10} color={BLUE} />
          </Group>
          <Group opacity={o1}>
            <Path path={B.o.pull} style="stroke" strokeWidth={9} color={AMBER} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={o2}>
            <Path path={B.o.release} style="stroke" strokeWidth={9} color={AMBER} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={o3}>
            <Path path={B.o.toBoard} style="stroke" strokeWidth={9} color={BLUE} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={o4}>
            <Path path={B.o.front} style="stroke" strokeWidth={8} color={AIR}>
              <DashPathEffect intervals={[26, 16]} />
            </Path>
            <Path path={B.o.back} style="stroke" strokeWidth={8} color={AIR}>
              <DashPathEffect intervals={[20, 14]} />
            </Path>
          </Group>
          <Group opacity={o5}>
            <Path path={B.o.hand} color="#7b6858" />
            <Path path={B.o.stop} style="stroke" strokeWidth={9} color={AMBER} strokeCap="round" strokeJoin="round" />
          </Group>
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/** WHERE IT LEAVES: the harp with the direction of its sound for one option. */
export function HarpRadiation({ w, h, variant, option, accessibilityLabel }: { w: number; h: number; variant: VariantId; option: string; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const lever = variant === 'lever';
  const B = build(lever);
  const g = harpGeom(lever);
  const box = useMemo(() => ({ u0: B.box.u0, u1: option === 'room' ? 2600 : B.box.u1, v0: B.box.v0, v1: B.box.v1 }), [B.box, option]);
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [box, w, h]);
  const k = g.scale;
  const paths = useMemo(() => {
    const p = Skia.Path.Make();
    const q = Skia.Path.Make();
    const bm = g.boardAt(0.5);
    if (option === 'board' || option === 'room') {
      for (const f of [0.25, 0.5, 0.75]) {
        const b = g.boardAt(f);
        arrow(p, b[0] + g.n[0] * 30, b[1] + g.n[1] * 30, b[0] + g.n[0] * 420 * k, b[1] + g.n[1] * 420 * k);
      }
    }
    if (option === 'holes' || option === 'room') {
      for (const hl of g.holes.slice(0, 4)) arrow(q, hl.c[0] - g.n[0] * 20, hl.c[1] - g.n[1] * 20, hl.c[0] - g.n[0] * 260 * k, hl.c[1] - g.n[1] * 260 * k, 22);
    }
    const room = Skia.Path.Make();
    if (option === 'room') arcs(room, bm[0], bm[1], [1200, 1700, 2200], -45, 20);
    return { p, q, room };
  }, [g, option, k]);
  const labels: StaticLabel[] = [
    { id: 'front', text: 'FROM THE BOARD’S FACE', short: 'BOARD', u: g.boardAt(0.8)[0] + 200 * k, v: g.boardAt(0.8)[1] - 200 * k, align: 'left', tone: option === 'holes' ? 'muted' : 'blue' },
    { id: 'back', text: 'OUT OF THE HOLES', short: 'HOLES', u: g.holes[0].c[0] - 300 * k, v: g.holes[0].c[1] + 80, align: 'center', tone: option === 'board' ? 'muted' : 'blue' },
  ];
  if (option === 'room') labels.push({ id: 'room', text: 'ABOUT 2–3 M: IT BLENDS', short: '2–3 M', u: 2300, v: -1500, align: 'right', tone: 'blue' });
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <HarpSide variant={variant} dim={0.85} />
          <Path path={paths.p} style="stroke" strokeWidth={10} strokeCap="round" strokeJoin="round" color={AIR} />
          <Path path={paths.q} style="stroke" strokeWidth={9} strokeCap="round" strokeJoin="round" color={AIR} opacity={0.85}>
            <DashPathEffect intervals={[22, 14]} />
          </Path>
          <Path path={paths.room} style="stroke" strokeWidth={9} color={AIR} opacity={0.7}>
            <DashPathEffect intervals={[34, 20]} />
          </Path>
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
