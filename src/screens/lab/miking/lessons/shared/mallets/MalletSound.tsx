/**
 * MALLET-BAR FAMILY — HOW IT SOUNDS, drawn (LESSON_JOURNEY §6 stage 2).
 * FULLY SILENT: the physics is shown, never played.
 *
 * Every display is ONE bar and what hangs under it, seen from the keyboard's
 * LOW END (u = z: the player on the left, the audience on the right; v = y),
 * in the same millimetres as the layout (malletSpec.layoutOf):
 *
 *   BarStrike   the four events, revealed by `reveal` (1 … 4): ① the mallet
 *               lands on the middle of the bar; ② the bar bends in its
 *               lowest shape — middle down, ends up — about the two still
 *               points the cord passes through; ③ the air in the tube under
 *               it rings with it (open at the top, closed at the bottom: a
 *               quarter wavelength); ④ sound leaves the bar and the tube's
 *               mouth, up and out. A damper (vibraphone, pedal glockenspiel)
 *               is drawn touching the bar or clear of it (PEDAL).
 *   BarShapes   a PLAIN (uniform) bar in one of its first three shapes, from
 *               the free–free beam (malletSpec BAR_BETA): still points, the
 *               ratio to the lowest, how much a strike point drives it.
 *   TubeAir     the chosen bar's tube at its true proportions: the air's
 *               standing quarter wave — moving most at the open mouth,
 *               pressing most at the closed end — swung by hand.
 *   FanValve    the vibraphone's fan at a tube's mouth, seen along its shaft:
 *               a disc that closes the mouth when flat and opens it edge-on,
 *               twice a turn. Turned by hand, or run for a few seconds by
 *               the page (finite, pausable).
 *
 * HONESTY: motion is drawn far larger than it is (said on each display);
 * arrows give order and direction, never a speed, a pressure or a level; no
 * waveform, no frequency curve. Nothing loops (D8).
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { barPeak, barShape, NODE_FRAC, type Bar, type MalletInst, type Tube } from './malletSpec.ts';
import { INK, LOOK } from './MalletArt';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const AIR = '#9cc4ff';
const FELT = ['#ece4d0', '#c9bea4', '#8f846c'];

export type OneBar = { bar: Bar; tube: Tube | null; inst: MalletInst; damper: boolean; caseBox: boolean };

/** The display's model box around one bar and its tube. */
export function boxOf(o: OneBar): { u0: number; u1: number; v0: number; v1: number } {
  const b = o.bar;
  const bottom = o.tube ? o.tube.yBot : b.yTop + b.t + 120;
  const pad = Math.max(90, b.L * 0.35);
  return { u0: b.z - b.L / 2 - pad, u1: b.z + b.L / 2 + pad, v0: b.yTop - Math.max(230, b.L * 0.55), v1: bottom + 50 };
}

const N = 40;
// Sampled once (plain numbers: safe in worklets).
const SHAPES: number[][] = [0, 1, 2].map((n) => Array.from({ length: N + 1 }, (_, i) => barShape(n, i / N)));
const PEAKS: number[] = [0, 1, 2].map((n) => barPeak(n));
/** The bar's centre line bent in shape n by `amp` mm (+ = middle down). */
const bentBar = (b: Bar, n: number, amp: number): SkPath => {
  'worklet';
  const p = Skia.Path.Make();
  const peak = PEAKS[n];
  const top: number[] = [];
  for (let i = 0; i <= N; i++) top.push(-amp * (SHAPES[n][i] / peak));
  for (let i = 0; i <= N; i++) {
    const u = b.z - b.L / 2 + (b.L * i) / N;
    if (i === 0) p.moveTo(u, b.yTop + top[i]);
    else p.lineTo(u, b.yTop + top[i]);
  }
  for (let i = N; i >= 0; i--) {
    const u = b.z - b.L / 2 + (b.L * i) / N;
    p.lineTo(u, b.yTop + b.t + top[i]);
  }
  p.close();
  return p;
};

function arrow(p: SkPath, x0: number, y0: number, x1: number, y1: number, head: number) {
  p.moveTo(x0, y0);
  p.lineTo(x1, y1);
  const a = Math.atan2(y1 - y0, x1 - x0);
  p.moveTo(x1 - head * Math.cos(a - 0.45), y1 - head * Math.sin(a - 0.45));
  p.lineTo(x1, y1);
  p.lineTo(x1 - head * Math.cos(a + 0.45), y1 - head * Math.sin(a + 0.45));
}

/** The static parts: the tube (or the case's box), the cords, the rail
 *  posts, and the damper. */
function Hardware({ o, damperUp }: { o: OneBar; damperUp: boolean }) {
  const b = o.bar;
  const t = o.tube;
  const look = LOOK[o.inst];
  const parts = useMemo(() => {
    const tube = Skia.Path.Make();
    const hi = Skia.Path.Make();
    const cap = Skia.Path.Make();
    if (t) {
      const r = t.kind === 'helmholtz' ? (t.depth ?? 150) / 2 : t.d / 2;
      tube.addRRect(Skia.RRectXY(Skia.XYWHRect(t.z - r, t.yTop, 2 * r, t.yBot - t.yTop), 6, 6));
      hi.addRect(Skia.XYWHRect(t.z - r * 0.62, t.yTop + 3, r * 0.4, t.yBot - t.yTop - 6));
      cap.addRect(Skia.XYWHRect(t.z - r, t.yBot - 9, 2 * r, 9));
    }
    const box = Skia.Path.Make();
    if (o.caseBox) box.addRRect(Skia.RRectXY(Skia.XYWHRect(b.z - b.L / 2 - 40, b.yTop + b.t + 4, b.L + 80, 70), 6, 6));
    return { tube, hi, cap, box };
  }, [t, o.caseBox, b]);
  const cords = [NODE_FRAC, 1 - NODE_FRAC].map((f) => b.z - b.L / 2 + f * b.L);
  const dz = b.z - b.L / 2 + b.L * 0.93;
  return (
    <>
      {o.caseBox ? (
        <>
          <Path path={parts.box}>
            <LinearGradient start={vec(0, b.yTop)} end={vec(0, b.yTop + 80)} colors={['#a06a3a', '#6e4421', '#3b2410']} />
          </Path>
          <Path path={parts.box} style="stroke" strokeWidth={1.2} color={INK} />
        </>
      ) : null}
      {t ? (
        <>
          <Path path={parts.tube}>
            <LinearGradient start={vec(t.z - t.d / 2, 0)} end={vec(t.z + t.d / 2, 0)} colors={[look.tube[1], look.tube[0], look.tube[1], look.tube[2]]} />
          </Path>
          <Path path={parts.hi} color={look.tubeHi} opacity={0.4} />
          <Path path={parts.cap} color="#000" opacity={0.4} />
          <Path path={parts.tube} style="stroke" strokeWidth={1.2} color={INK} />
        </>
      ) : null}
      {/* Posts under the cords (the bar rests on the cord through its still points). */}
      {cords.map((u) => (
        <Group key={`c${u}`}>
          <Path path={(() => { const p = Skia.Path.Make(); p.addRRect(Skia.RRectXY(Skia.XYWHRect(u - 3, b.yTop + b.t + 2, 6, 26), 2, 2)); return p; })()} color="#9aa0ab" />
          <Circle cx={u} cy={b.yTop + b.t / 2} r={Math.max(2.2, b.t * 0.22)} color="#d8c9a8" />
        </Group>
      ))}
      {o.damper ? (
        <Path path={(() => { const p = Skia.Path.Make(); p.addRRect(Skia.RRectXY(Skia.XYWHRect(dz - 18, b.yTop + b.t + (damperUp ? 0 : 16), 36, 22), 5, 5)); return p; })()}>
          <LinearGradient start={vec(0, b.yTop)} end={vec(0, b.yTop + 40)} colors={FELT} />
        </Path>
      ) : null}
    </>
  );
}

function BarBody({ path, o }: { path: SkPath | SharedValue<SkPath>; o: OneBar }) {
  const look = LOOK[o.inst];
  const b = o.bar;
  return (
    <>
      <Path path={path}>
        <LinearGradient start={vec(0, b.yTop - 6)} end={vec(0, b.yTop + b.t + 6)} colors={look.bar} />
      </Path>
      <Path path={path} style="stroke" strokeWidth={1.1} color={INK} />
    </>
  );
}

/* ── ① – ④ ── */
export function BarStrike({ w, h, o, reveal, shown, damperUp, accessibilityLabel }: { w: number; h: number; o: OneBar; reveal: SharedValue<number>; shown: number; damperUp: boolean; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const box = useMemo(() => boxOf(o), [o]);
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [box, w, h]);
  const b = o.bar;
  const t = o.tube;
  const amp = Math.max(10, b.L * 0.06);
  const look = LOOK[o.inst];
  const headR = o.inst === 'glock' || o.inst === 'xylo' ? 13 : 18;
  const clamp01 = (x: number) => {
    'worklet';
    return Math.max(0, Math.min(1, x));
  };
  const bend = useDerivedValue(() => bentBar(b, 0, amp * clamp01(reveal.value - 1)));
  const o1 = useDerivedValue(() => clamp01(reveal.value));
  const o2 = useDerivedValue(() => clamp01(reveal.value - 1));
  const o3 = useDerivedValue(() => clamp01(reveal.value - 2));
  const o4 = useDerivedValue(() => clamp01(reveal.value - 3));
  const paths = useMemo(() => {
    const mallet = Skia.Path.Make();
    const hx = b.z;
    const hy = b.yTop - headR;
    mallet.moveTo(hx - 190, hy - 210);
    mallet.lineTo(hx, hy);
    const strike = Skia.Path.Make();
    arrow(strike, hx - 70, hy - 120, hx - 12, hy - 22, 18);
    const nodes = Skia.Path.Make();
    for (const f of [NODE_FRAC, 1 - NODE_FRAC]) {
      const u = b.z - b.L / 2 + f * b.L;
      nodes.moveTo(u, b.yTop - 60);
      nodes.lineTo(u, b.yTop + b.t + 34);
    }
    const air = Skia.Path.Make();
    if (t) {
      const r = t.kind === 'helmholtz' ? 40 : t.d / 2;
      arrow(air, t.z, t.yTop + 60, t.z, t.yTop + 8, 14);
      arrow(air, t.z - r * 0.5, t.yTop + 44, t.z - r * 0.5, t.yTop + 12, 10);
      arrow(air, t.z + r * 0.5, t.yTop + 44, t.z + r * 0.5, t.yTop + 12, 10);
    }
    const out = Skia.Path.Make();
    for (const r of [70, 115, 160]) out.addArc(Skia.XYWHRect(b.z - r, b.yTop - r, 2 * r, 2 * r), 205, 130);
    if (t) for (const r of [50, 85]) out.addArc(Skia.XYWHRect(t.z - r - 40, t.yTop - r * 0.4, 2 * r, 2 * r), 120, 60);
    const press = Skia.Path.Make();
    if (t) {
      const r = t.kind === 'helmholtz' ? (t.depth ?? 150) / 2 : t.d / 2;
      press.addRect(Skia.XYWHRect(t.z - r + 3, t.yTop + 3, 2 * r - 6, t.yBot - t.yTop - 6));
    }
    return { mallet, strike, nodes, air, out, press, hx, hy };
  }, [b, t, headR]);

  const labels: StaticLabel[] = [];
  if (shown >= 1) labels.push({ id: 's1', text: '① MALLET LANDS', short: '① STRIKE', u: b.z - 200, v: b.yTop - 230, align: 'center', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 's2', text: '② STILL POINTS — CORDS', short: '② STILL POINTS', u: b.z + b.L / 2 + 20, v: b.yTop - 40, align: 'right', tone: 'blue' });
  if (shown >= 3 && t) labels.push({ id: 's3', text: '③ TUBE AIR RINGS', short: '③ TUBE AIR', u: t.z + (t.kind === 'helmholtz' ? 80 : t.d / 2 + 14), v: (t.yTop + t.yBot) / 2, align: 'left', tone: 'blue' });
  if (shown >= 3 && !t) labels.push({ id: 's3', text: o.caseBox ? '③ THE CASE’S BOX' : '③ NO TUBE', u: b.z, v: b.yTop + b.t + 60, align: 'center', tone: 'blue' });
  if (shown >= 4) labels.push({ id: 's4', text: '④ SOUND LEAVES — UP AND OUT', short: '④ UP AND OUT', u: b.z, v: b.yTop - 175, align: 'center', tone: 'blue' });
  labels.push({ id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: box.u1 - 10, v: box.v1 - 20, align: 'right', tone: 'illustrative' });
  labels.push({ id: 'pl', text: '← PLAYER', u: box.u0 + 10, v: box.v1 - 20, align: 'left', tone: 'muted' });

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Hardware o={o} damperUp={damperUp} />
          {/* ③ the tube's air (a pressure tint, strongest at the closed end) */}
          {t ? (
            <Group opacity={o3}>
              <Path path={paths.press}>
                <LinearGradient start={vec(0, t.yTop)} end={vec(0, t.yBot)} colors={['rgba(111,168,255,0.0)', 'rgba(111,168,255,0.42)']} />
              </Path>
              <Path path={paths.air} style="stroke" strokeWidth={5} color={AIR} strokeCap="round" strokeJoin="round" />
            </Group>
          ) : null}
          {/* The bar at rest (ghost), then bent (②). */}
          <Group opacity={0.28}>
            <BarBody path={bentBar(b, 0, 0)} o={o} />
          </Group>
          <BarBody path={bend} o={o} />
          <Group opacity={o2}>
            <Path path={paths.nodes} style="stroke" strokeWidth={2.2} color={BLUE}>
              <DashPathEffect intervals={[10, 7]} />
            </Path>
          </Group>
          {/* ① the mallet */}
          <Group opacity={o1}>
            <Path path={paths.mallet} style="stroke" strokeWidth={8} strokeCap="round" color={INK} />
            <Path path={paths.mallet} style="stroke" strokeWidth={5.5} strokeCap="round" color={look.mallet.shaft} />
            <Circle cx={paths.hx} cy={paths.hy} r={headR}>
              <RadialGradient c={vec(paths.hx - headR * 0.4, paths.hy - headR * 0.4)} r={headR * 1.5} colors={look.mallet.head} />
            </Circle>
            <Circle cx={paths.hx} cy={paths.hy} r={headR} style="stroke" strokeWidth={1} color={INK} />
            <Path path={paths.strike} style="stroke" strokeWidth={6} color={AMBER} strokeCap="round" strokeJoin="round" />
          </Group>
          {/* ④ where sound leaves (direction, not amount) */}
          <Group opacity={o4}>
            <Path path={paths.out} style="stroke" strokeWidth={5} color={AIR} opacity={0.9}>
              <DashPathEffect intervals={[22, 14]} />
            </Path>
          </Group>
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/* ── the bar's shapes ── */
export function BarShapes({ w, h, o, shape, swing, strike, accessibilityLabel }: { w: number; h: number; o: OneBar; shape: number; swing: number; strike: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  // Only the bar (and its cords): a box around it.
  const b = o.bar;
  const box = useMemo(() => ({ u0: b.z - b.L / 2 - 50, u1: b.z + b.L / 2 + 50, v0: b.yTop - b.L * 0.32, v1: b.yTop + b.t + b.L * 0.3 }), [b]);
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [box, w, h]);
  const amp = b.L * 0.12 * swing;
  const path = useMemo(() => bentBar(b, shape, amp), [b, shape, amp]);
  const rest = useMemo(() => bentBar(b, shape, 0), [b, shape]);
  const nodes = useMemo(() => {
    const p = Skia.Path.Make();
    const s = SHAPES[shape];
    for (let i = 1; i <= N; i++) {
      if (s[i - 1] * s[i] < 0) {
        const f = (i - 1 + s[i - 1] / (s[i - 1] - s[i])) / N;
        const u = b.z - b.L / 2 + f * b.L;
        p.moveTo(u, box.v0 + 20);
        p.lineTo(u, box.v1 - 20);
      }
    }
    return p;
  }, [b, shape, box]);
  const su = b.z - b.L / 2 + strike * b.L;
  const labels: StaticLabel[] = [
    { id: 'st', text: 'STILL', u: b.z - b.L / 2 + 0.03 * b.L, v: box.v0 + 30, align: 'left', tone: 'blue' },
    { id: 'mk', text: 'MALLET', u: su, v: b.yTop - b.L * 0.2, align: 'center', tone: 'amber' },
    { id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: box.u1 - 6, v: box.v1 - 14, align: 'right', tone: 'illustrative' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Path path={nodes} style="stroke" strokeWidth={2} color={BLUE} opacity={0.85}>
            <DashPathEffect intervals={[10, 7]} />
          </Path>
          <Group opacity={0.25}>
            <BarBody path={rest} o={o} />
          </Group>
          <BarBody path={path} o={o} />
          {[NODE_FRAC, 1 - NODE_FRAC].map((f) => (
            <Circle key={`h${f}`} cx={b.z - b.L / 2 + f * b.L} cy={b.yTop + b.t / 2} r={Math.max(2, b.t * 0.22)} color="#d8c9a8" />
          ))}
          <Circle cx={su} cy={b.yTop - b.L * 0.12} r={b.L * 0.025 + 4} style="stroke" strokeWidth={3} color={AMBER} />
          <Path path={(() => { const p = Skia.Path.Make(); arrow(p, su, b.yTop - b.L * 0.17, su, b.yTop - 6, 10); return p; })()} style="stroke" strokeWidth={3} color={AMBER} strokeCap="round" />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/* ── the tube's air ── */
export function TubeAir({ w, h, o, swing, accessibilityLabel }: { w: number; h: number; o: OneBar; swing: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const box = useMemo(() => boxOf(o), [o]);
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [box, w, h]);
  const b = o.bar;
  const t = o.tube;
  const arrows = useMemo(() => {
    const p = Skia.Path.Make();
    if (!t) return p;
    // Air motion along the tube: largest at the open mouth, none at the
    // closed end (a quarter wave: velocity ∝ cos of the depth fraction).
    const n = 5;
    const len = t.yBot - t.yTop;
    for (let i = 0; i < n; i++) {
      const f = (i + 0.5) / n;
      const y = t.yTop + f * len;
      const a = Math.cos((f * Math.PI) / 2) * Math.min(60, len * 0.14) * swing;
      if (Math.abs(a) < 2) continue;
      arrow(p, t.z, y, t.z, y - a, Math.min(12, Math.abs(a) * 0.6));
    }
    return p;
  }, [t, swing]);
  const tint = Math.abs(swing);
  const labels: StaticLabel[] = [];
  if (t) {
    labels.push({ id: 'mouth', text: 'OPEN MOUTH — AIR MOVES MOST', short: 'MOUTH: MOVES MOST', u: t.z + (t.kind === 'helmholtz' ? 90 : t.d / 2 + 12), v: t.yTop + 22, align: 'left', tone: 'blue' });
    labels.push({ id: 'end', text: t.kind === 'helmholtz' ? 'BOX: AIR SPRINGS' : 'CLOSED END — PRESSES MOST', short: t.kind === 'helmholtz' ? 'BOX' : 'CLOSED END', u: t.z + (t.kind === 'helmholtz' ? 90 : t.d / 2 + 12), v: t.yBot - 16, align: 'left', tone: 'blue' });
  }
  labels.push({ id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: box.u0 + 10, v: box.v1 - 20, align: 'left', tone: 'illustrative' });
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Hardware o={o} damperUp={false} />
          {t ? (
            <Path path={(() => { const p = Skia.Path.Make(); const r = t.kind === 'helmholtz' ? (t.depth ?? 150) / 2 : t.d / 2; p.addRect(Skia.XYWHRect(t.z - r + 3, t.yTop + 3, 2 * r - 6, t.yBot - t.yTop - 6)); return p; })()}>
              <LinearGradient start={vec(0, t.yTop)} end={vec(0, t.yBot)} colors={['rgba(111,168,255,0.0)', `rgba(111,168,255,${(0.08 + 0.4 * tint).toFixed(3)})`]} />
            </Path>
          ) : null}
          <Path path={arrows} style="stroke" strokeWidth={5} color={AIR} strokeCap="round" strokeJoin="round" />
          <BarBody path={bentBar(b, 0, Math.max(6, b.L * 0.04) * swing)} o={o} />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/* ── the fan at a tube's mouth (vibraphone) ── */
export function FanValve({ w, h, o, angle, accessibilityLabel }: { w: number; h: number; o: OneBar; angle: SharedValue<number>; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const t = o.tube;
  const b = o.bar;
  // A close-up of the tube's top: the bar above, the mouth, the shaft.
  const box = useMemo(() => (t ? { u0: t.z - 170, u1: t.z + 170, v0: b.yTop - 60, v1: t.yTop + 170 } : boxOf(o)), [t, b, o]);
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [box, w, h]);
  const shaftY = t ? t.yTop + 9 : 0;
  const R = t ? t.d * 0.45 : 20;
  const disc = useDerivedValue(() => {
    const p = Skia.Path.Make();
    if (!t) return p;
    const a = angle.value;
    const dx = Math.cos(a) * R;
    const dy = Math.sin(a) * R;
    p.moveTo(t.z - dx, shaftY - dy);
    p.lineTo(t.z + dx, shaftY + dy);
    return p;
  });
  // How open the mouth is: 1 − |cos a| (flat = closed, edge-on = open).
  const openGlow = useDerivedValue(() => 0.12 + 0.55 * (1 - Math.abs(Math.cos(angle.value))));
  const labels: StaticLabel[] = [
    { id: 'shaft', text: 'SHAFT, END ON', short: 'SHAFT', u: (t ? t.z : 0) - 24, v: shaftY + 30, align: 'right', tone: 'muted' },
    { id: 'disc', text: 'FAN DISC', u: (t ? t.z : 0) + 26, v: shaftY + 30, align: 'left', tone: 'amber' },
    { id: 'tube', text: 'TUBE MOUTH', u: box.u1 - 8, v: t ? t.yTop + 120 : 0, align: 'right', tone: 'blue' },
  ];
  const look = LOOK[o.inst];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          {t ? (
            <>
              <Path path={(() => { const p = Skia.Path.Make(); p.addRect(Skia.XYWHRect(t.z - t.d / 2, t.yTop, t.d, box.v1 - t.yTop + 20)); return p; })()}>
                <LinearGradient start={vec(t.z - t.d / 2, 0)} end={vec(t.z + t.d / 2, 0)} colors={[look.tube[1], look.tube[0], look.tube[1], look.tube[2]]} />
              </Path>
              {/* The mouth glows as the disc turns edge-on (open). */}
              <Group opacity={openGlow}>
                <Path path={(() => { const p = Skia.Path.Make(); p.addOval(Skia.XYWHRect(t.z - t.d * 0.6, t.yTop - 40, t.d * 1.2, 80)); return p; })()} color={AIR}>
                  <BlurMask blur={14} style="normal" />
                </Path>
              </Group>
              <Path path={disc} style="stroke" strokeWidth={7} strokeCap="round" color={INK} />
              <Path path={disc} style="stroke" strokeWidth={4.5} strokeCap="round" color="#d9dde5" />
              <Circle cx={t.z} cy={shaftY} r={7} color="#2a2c32" />
              <Circle cx={t.z} cy={shaftY} r={7} style="stroke" strokeWidth={1.5} color="#9aa0ab" />
            </>
          ) : null}
          <BarBody path={bentBar(b, 0, 0)} o={o} />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
