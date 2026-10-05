/**
 * HOW IT SOUNDS for the bowed family — the drawings (LESSON_JOURNEY §6
 * stage 2, §7 "strings"). FULLY SILENT: the physics is shown, never played.
 *
 *   CrossSection   the instrument cut across at the bridge, seen along the
 *                  strings (u = across, v = down): the arched top with its
 *                  f-hole cuts, the ribs and back, the bass bar under the
 *                  bass foot, the soundpost under the treble foot, the
 *                  bridge and the four strings — and the bow (or the
 *                  finger). Its numbered events are revealed by `reveal`
 *                  (a shared value, stepped or played ONCE): ① the bow
 *                  grips and drags the string (or the finger pulls it);
 *                  ② it slips back (or is released); ③ the string rocks the
 *                  bridge; ④ the bass foot drives the top while the
 *                  soundpost holds the treble side; ⑤ sound leaves the top,
 *                  the back and the f-holes.
 *   StringShapes   the string, bridge to nut, in one ideal shape sin(nπx),
 *                  its still points marked, the bow or finger at its point.
 *   StringMotion   one cycle of the ideal BOWED string (the Helmholtz
 *                  corner on its two parabolas) or PLUCKED string (two
 *                  corners running apart), swung by hand.
 *
 * HONESTY: motion is drawn many times larger than it is; arrows show the
 * ORDER and the direction of events, never a speed, a force or a level; the
 * string is an ideal one (stringModel.ts). Nothing loops (D8).
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { halfWidth, type BowedSpec } from './bowedSpec.ts';
import { helmholtzAt, helmholtzCorner, nodesOf, pluckedAt, shapeAt } from './stringModel.ts';

const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const AIR = '#9cc4ff';
type SkPath = ReturnType<typeof Skia.Path.Make>;

const clamp01 = (x: number) => {
  'worklet';
  return Math.max(0, Math.min(1, x));
};

function arrow(p: SkPath, x0: number, y0: number, x1: number, y1: number, head: number) {
  p.moveTo(x0, y0);
  p.lineTo(x1, y1);
  const a = Math.atan2(y1 - y0, x1 - x0);
  p.moveTo(x1 - head * Math.cos(a - 0.45), y1 - head * Math.sin(a - 0.45));
  p.lineTo(x1, y1);
  p.lineTo(x1 - head * Math.cos(a + 0.45), y1 - head * Math.sin(a + 0.45));
}

/* ── the cross-section, in the section's own mm (u across, v down) ── */

export type Excite = 'bow' | 'pluck';

function sectionGeom(spec: BowedSpec) {
  const W = halfWidth(spec, 0); // the body's half-width at the bridge
  const rib = spec.rib.mm;
  const aT = spec.archTop.mm * 1.6; // the arch drawn a little taller to read
  const aB = Math.max(spec.archBack.mm * 1.6, spec.rib.mm * 0.06);
  const h = spec.bridgeH.mm;
  const bw = spec.bridgeW.mm;
  const t = Math.max(3, rib * 0.035); // plate thickness, drawn
  const topZ = (u: number) => aT * Math.max(0, 1 - (u / W) ** 2) ** 0.7; // height above the rim
  const backZ = (u: number) => -rib - aB * Math.max(0, 1 - (u / W) ** 2) ** 0.7;
  const fy = Math.min(spec.fholeY.mm, W * 0.82);
  const fw = Math.max(5, spec.fholeY.mm * 0.12);
  return { W, rib, aT, aB, h, bw, t, topZ, backZ, fy, fw };
}

export function sectionBox(spec: BowedSpec) {
  const g = sectionGeom(spec);
  return { u0: -g.W * 1.35, u1: g.W * 1.35, v0: -(g.h + g.aT + g.W * 1.0), v1: g.rib + g.aB + g.W * 0.45 };
}

export type SectionProps = { w: number; h: number; spec: BowedSpec; excite: Excite; reveal: SharedValue<number>; shown: number; accessibilityLabel: string };

export function CrossSection({ w, h, spec, excite, reveal, shown, accessibilityLabel }: SectionProps) {
  const g = useMemo(() => sectionGeom(spec), [spec]);
  const box = useMemo(() => sectionBox(spec), [spec]);
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h, box]);
  const { W, rib, h: bh, bw, t, topZ, backZ, fy, fw } = g;
  // Screen v = −z (up is negative).
  const stat = useMemo(() => {
    const N = 60;
    const top = Skia.Path.Make();
    // The top plate as a band, with the two f-hole cuts.
    const cuts = [-fy - fw / 2, -fy + fw / 2, fy - fw / 2, fy + fw / 2];
    const segs: [number, number][] = [
      [-W, cuts[0]],
      [cuts[1], cuts[2]],
      [cuts[3], W],
    ];
    for (const [a, b] of segs) {
      for (let i = 0; i <= N; i++) {
        const u = a + ((b - a) * i) / N;
        if (i === 0) top.moveTo(u, -topZ(u));
        else top.lineTo(u, -topZ(u));
      }
      for (let i = N; i >= 0; i--) {
        const u = a + ((b - a) * i) / N;
        top.lineTo(u, -topZ(u) + t);
      }
      top.close();
    }
    const back = Skia.Path.Make();
    for (let i = 0; i <= N; i++) {
      const u = -W + (2 * W * i) / N;
      if (i === 0) back.moveTo(u, -backZ(u));
      else back.lineTo(u, -backZ(u));
    }
    for (let i = N; i >= 0; i--) {
      const u = -W + (2 * W * i) / N;
      back.lineTo(u, -backZ(u) - t);
    }
    back.close();
    const ribs = Skia.Path.Make();
    ribs.addRect(Skia.XYWHRect(-W - t, 0, t * 1.6, rib));
    ribs.addRect(Skia.XYWHRect(W - t * 0.6, 0, t * 1.6, rib));
    const air = Skia.Path.Make();
    air.moveTo(-W + t, 0);
    for (let i = 0; i <= N; i++) {
      const u = -W + t + ((2 * W - 2 * t) * i) / N;
      air.lineTo(u, -topZ(u) + t);
    }
    for (let i = N; i >= 0; i--) {
      const u = -W + t + ((2 * W - 2 * t) * i) / N;
      air.lineTo(u, -backZ(u) - t);
    }
    air.close();
    // Bass bar (under the bass foot, −u) and the soundpost (under the treble foot).
    const bassU = -bw * 0.32;
    const trebU = bw * 0.32;
    const bar = Skia.Path.Make();
    bar.addRRect(Skia.RRectXY(Skia.XYWHRect(bassU - t * 1.1, -topZ(bassU) + t, t * 2.2, Math.max(6, rib * 0.1)), 2, 2));
    const post = Skia.Path.Make();
    post.addRRect(Skia.RRectXY(Skia.XYWHRect(trebU - t * 0.9, -topZ(trebU) + t, t * 1.8, -backZ(trebU) - t - (-topZ(trebU) + t)), 2, 2));
    return { top, back, ribs, air, bar, post, bassU, trebU };
  }, [W, rib, t, topZ, backZ, fy, fw, bw]);

  // The bridge's face as plain numbers (u, v), and its pivot — the treble
  // foot — so the worklet below only rotates them.
  const BR: [number, number][] = [
    [-0.5, 0],
    [-0.3, 0],
    [-0.2, 0.2],
    [0.2, 0.2],
    [0.3, 0],
    [0.5, 0],
    [0.46, 0.14],
    [0.34, 0.36],
    [0.44, 0.56],
    [0.5, 0.8],
    [0.3, 0.92],
    [0, 1],
    [-0.3, 0.92],
    [-0.5, 0.8],
    [-0.44, 0.56],
    [-0.34, 0.36],
    [-0.46, 0.14],
  ];
  const lift = topZ(0) * 0.9;
  const bridgeU = BR.map(([k]) => k * bw);
  const bridgeV = BR.map(([k, z]) => (z === 0 ? -topZ(k * bw) : -z * bh - lift));
  const pivotU = 0.4 * bw;
  const pivotV = -topZ(0.4 * bw);
  // The top's rest line, and how far each point moves at ④ (the bass side;
  // the treble side, held by the soundpost, hardly).
  const TN = 50;
  const topU: number[] = [];
  const topV: number[] = [];
  const topK: number[] = [];
  for (let i = 0; i <= TN; i++) {
    const u = -W + (2 * W * i) / TN;
    topU.push(u);
    topV.push(-topZ(u));
    topK.push(Math.max(0, 1 - ((u - stat.bassU * 1.4) / (W * 0.95)) ** 2) * (u < stat.trebU ? 1 : 0.15) * rib * 0.16);
  }
  const stringU = [-0.36, -0.12, 0.12, 0.36].map((k) => k * bw);
  const stringV = (u: number) => -(bh + lift) + 0.16 * bh * (u / (bw / 2)) ** 2;
  const played = excite === 'bow' ? 2 : 1; // the bowed string; the plucked one
  const pu0 = stringU[played];
  const pv0 = stringV(pu0);
  const amp = bw * 0.22;

  // Event weights from the reveal (1 … 5).
  const ev = (i: number) => {
    'worklet';
    return clamp01(reveal.value - i);
  };
  const grip = useDerivedValue(() => ev(0) * (1 - ev(1)));
  const slipOn = useDerivedValue(() => ev(1) * (1 - ev(2) * 0.6));
  const rockOn = useDerivedValue(() => ev(2) * (1 - ev(3) * 0.5));
  const footOn = useDerivedValue(() => ev(3) * (1 - ev(4) * 0.5));
  const strU = useDerivedValue(() => pu0 + amp * (ev(0) * 1 - ev(1) * 1.7 + ev(2) * 0.7));
  const bridge = useDerivedValue(() => {
    const rock = -0.12 * ev(2) * (1 - 0.4 * ev(4));
    const c = Math.cos(rock);
    const sn = Math.sin(rock);
    const p = Skia.Path.Make();
    for (let i = 0; i < bridgeU.length; i++) {
      const du = bridgeU[i] - pivotU;
      const dv = bridgeV[i] - pivotV;
      const u = pivotU + du * c - dv * sn;
      const v = pivotV + du * sn + dv * c;
      if (i === 0) p.moveTo(u, v);
      else p.lineTo(u, v);
    }
    p.close();
    return p;
  });
  const topDip = useDerivedValue(() => ev(3));
  const topMoved = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const k = topDip.value;
    for (let i = 0; i < topU.length; i++) {
      const v = topV[i] + k * topK[i];
      if (i === 0) p.moveTo(topU[i], v);
      else p.lineTo(topU[i], v);
    }
    return p;
  });
  const strPos = useDerivedValue(() => vec(strU.value, pv0));
  const leave = useDerivedValue(() => ev(4));
  const o = useMemo(() => {
    const dragA = Skia.Path.Make();
    arrow(dragA, pu0 - amp * 0.2, pv0 - bw * 0.42, pu0 + amp * 1.25, pv0 - bw * 0.42, bw * 0.12);
    const slipA = Skia.Path.Make();
    arrow(slipA, pu0 + amp * 0.9, pv0 + bw * 0.24, pu0 - amp * 0.9, pv0 + bw * 0.24, bw * 0.12);
    const rockA = Skia.Path.Make();
    arrow(rockA, -bw * 0.45, pv0 - bw * 0.2, -bw * 0.75, pv0 - bw * 0.05, bw * 0.1);
    const footA = Skia.Path.Make();
    arrow(footA, stat.bassU, -topZ(stat.bassU) - bw * 0.55, stat.bassU, -topZ(stat.bassU) - bw * 0.1, bw * 0.1);
    const up = Skia.Path.Make();
    for (const r of [W * 0.55, W * 0.75, W * 0.95]) up.addArc(Skia.XYWHRect(-r, -topZ(0) - r * 0.35 - r, 2 * r, 2 * r), 215, 110);
    const down = Skia.Path.Make();
    for (const r of [W * 0.55, W * 0.75, W * 0.95]) down.addArc(Skia.XYWHRect(-r, rib + r * 0.35 - r, 2 * r, 2 * r), 35, 110);
    const breath = Skia.Path.Make();
    for (const sg of [-1, 1]) arrow(breath, sg * fy, -topZ(sg * fy) + 4, sg * fy * 1.05, -topZ(sg * fy) - bw * 0.55, bw * 0.1);
    return { dragA, slipA, rockA, footA, up, down, breath };
  }, [pu0, pv0, amp, bw, W, rib, fy, topZ, stat.bassU]);

  // The bow (or the finger), seen end-on across the strings.
  const bowLen = W * 2.1;
  const bowTilt = -0.12;
  const bu = pu0;
  const bv = pv0 - 3;
  const bdx = bowLen * 0.5 * Math.cos(bowTilt);
  const bdy = bowLen * 0.5 * Math.sin(bowTilt);
  const bowA = useDerivedValue(() => vec(bu - bdx + amp * ev(0) * 1.2, bv - bdy));
  const bowB = useDerivedValue(() => vec(bu + bdx + amp * ev(0) * 1.2, bv + bdy));
  const bowA2 = useDerivedValue(() => vec(bu - bdx + amp * ev(0) * 1.2, bv - bdy - bw * 0.1));
  const bowB2 = useDerivedValue(() => vec(bu + bdx + amp * ev(0) * 1.2, bv + bdy - bw * 0.14));
  const finger = useDerivedValue(() => vec(pu0 + amp * ev(0) * (1 - ev(1)) * 1.1 + bw * 0.08, pv0 - bw * 0.02));
  const pluck = excite === 'pluck';
  const fingerOn = useDerivedValue(() => (pluck ? 1 - ev(1) * 0.85 : 0));

  const labels: StaticLabel[] = [];
  const first = excite === 'bow' ? '① THE BOW GRIPS AND DRAGS THE STRING' : '① THE FINGER PULLS THE STRING';
  const second = excite === 'bow' ? '② IT SLIPS BACK — GRIP, SLIP, EVERY CYCLE' : '② RELEASED, IT SWINGS BACK AND RINGS';
  if (shown >= 1) labels.push({ id: 'e1', text: first, short: excite === 'bow' ? '① GRIP' : '① PULL', u: box.u0 + 12, v: box.v0 + 30, align: 'left', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 'e2', text: second, short: excite === 'bow' ? '② SLIP' : '② RELEASE', u: box.u0 + 12, v: box.v0 + (box.v1 - box.v0) * 0.13, align: 'left', tone: 'amber' });
  if (shown >= 3) labels.push({ id: 'e3', text: '③ THE BRIDGE ROCKS', short: '③ BRIDGE', u: box.u1 - 12, v: pv0 - bw * 0.15, align: 'right', tone: 'blue' });
  if (shown >= 4) labels.push({ id: 'e4', text: '④ THE TOP MOVES; THE SOUNDPOST HOLDS', short: '④ TOP', u: box.u1 - 12, v: -topZ(0) + rib * 0.45, align: 'right', tone: 'blue' });
  if (shown >= 5) labels.push({ id: 'e5', text: '⑤ SOUND LEAVES TOP, BACK, F-HOLES', short: '⑤ SOUND', u: box.u0 + 12, v: box.v1 - 34, align: 'left', tone: 'blue' });
  labels.push({ id: 'post', text: 'SOUNDPOST', u: stat.trebU + t * 3, v: rib * 0.55, align: 'left', tone: 'muted' });
  labels.push({ id: 'bar', text: 'BASS BAR', u: stat.bassU - t * 3, v: rib * 0.22, align: 'right', tone: 'muted' });
  labels.push({ id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: box.u1 - 12, v: box.v1 - 14, align: 'right', tone: 'illustrative' });

  const cuts = [-fy, fy];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Path path={stat.air} color="rgba(111,168,255,0.08)" />
          <Path path={stat.back}>
            <LinearGradient start={vec(-W, 0)} end={vec(W, rib)} colors={['#93461a', '#5a2309', '#2c1003']} />
          </Path>
          <Path path={stat.ribs}>
            <LinearGradient start={vec(-W, 0)} end={vec(W, rib)} colors={['#a3541c', '#6e2c0b', '#3a1604']} />
          </Path>
          <Path path={stat.post}>
            <LinearGradient start={vec(stat.trebU - 5, 0)} end={vec(stat.trebU + 5, rib)} colors={['#f2dcb2', '#c9a46c']} />
          </Path>
          <Path path={stat.top}>
            <LinearGradient start={vec(-W, -topZ(0))} end={vec(W, 0)} colors={['#e3a052', '#b8621f', '#7c3610']} />
          </Path>
          <Path path={stat.bar} color="#c79a5c" />
          <Path path={stat.top} style="stroke" strokeWidth={Math.max(0.8, t * 0.25)} color="#1c0b02" />
          {/* ④ the top's motion (bass side), over the rest shape */}
          <Group opacity={topDip}>
            <Path path={topMoved} style="stroke" strokeWidth={Math.max(2, t * 0.8)} color={BLUE} />
          </Group>
          <Path path={bridge}>
            <LinearGradient start={vec(-bw / 2, -bh)} end={vec(bw / 2, 0)} colors={['#f4e1bb', '#d8b47d', '#a77d47']} />
          </Path>
          <Path path={bridge} style="stroke" strokeWidth={Math.max(0.8, bw * 0.012)} color="#3a2a14" />
          {/* the strings over the bridge; the played one moves */}
          {stringU.map((u, i) =>
            i === played ? null : <Circle key={u} cx={u} cy={stringV(u)} r={Math.max(1.5, bw * (0.035 - i * 0.004))} color="#d7dbe2" />,
          )}
          <Circle c={strPos} r={Math.max(2, bw * 0.04)} color={AMBER} />
          {excite === 'bow' ? (
            <>
              <Line p1={bowA} p2={bowB} color="#f3eedf" strokeWidth={Math.max(1.5, bw * 0.03)} />
              <Line p1={bowA2} p2={bowB2} color="#8a3c14" strokeWidth={Math.max(2, bw * 0.05)} strokeCap="round" />
            </>
          ) : (
            <Group opacity={fingerOn}>
              <Circle c={finger} r={bw * 0.09} color="#c99c7c" />
            </Group>
          )}
          <Group opacity={grip}>
            <Path path={o.dragA} style="stroke" strokeWidth={Math.max(2, bw * 0.035)} color={AMBER} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={slipOn}>
            <Path path={o.slipA} style="stroke" strokeWidth={Math.max(2, bw * 0.035)} color={AMBER} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={rockOn}>
            <Path path={o.rockA} style="stroke" strokeWidth={Math.max(2, bw * 0.035)} color={BLUE} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={footOn}>
            <Path path={o.footA} style="stroke" strokeWidth={Math.max(2, bw * 0.035)} color={BLUE} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={leave}>
            <Path path={o.up} style="stroke" strokeWidth={Math.max(2, bw * 0.03)} color={AIR} opacity={0.9}>
              <DashPathEffect intervals={[bw * 0.16, bw * 0.1]} />
            </Path>
            <Path path={o.down} style="stroke" strokeWidth={Math.max(2, bw * 0.03)} color={AIR} opacity={0.9}>
              <DashPathEffect intervals={[bw * 0.16, bw * 0.1]} />
            </Path>
            <Path path={o.breath} style="stroke" strokeWidth={Math.max(2, bw * 0.03)} color={AIR} strokeCap="round" strokeJoin="round" />
          </Group>
          {cuts.map((u) => (
            <Line key={u} p1={vec(u, -topZ(u) - 2)} p2={vec(u, -topZ(u) + t + 2)} color="#050302" strokeWidth={Math.max(1, fw * 0.6)} />
          ))}
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/* ── the string, bridge (left) to nut (right) ── */

const STRING_BOX = { u0: -60, u1: 1060, v0: -320, v1: 300 };
const SX = (x: number) => x * 1000; // fraction → drawing units
const SY = (y: number) => -y * 220;

function StringEnds() {
  const bridge = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(-34, 70);
    p.lineTo(-10, 70);
    p.lineTo(-4, 0);
    p.lineTo(4, 0);
    p.lineTo(10, 70);
    p.lineTo(34, 70);
    p.lineTo(26, 40);
    p.lineTo(8, -6);
    p.lineTo(-8, -6);
    p.lineTo(-26, 40);
    p.close();
    return p;
  }, []);
  const board = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(520, 14, 520, 26), 6, 6));
    return p;
  }, []);
  return (
    <>
      <Path path={board}>
        <LinearGradient start={vec(520, 14)} end={vec(1040, 40)} colors={['#45403b', '#1b1917', '#090808']} />
      </Path>
      <Path path={bridge}>
        <LinearGradient start={vec(-34, -6)} end={vec(34, 70)} colors={['#f4e1bb', '#d8b47d', '#a77d47']} />
      </Path>
      <Path path={bridge} style="stroke" strokeWidth={2} color="#3a2a14" />
      <Path path={(() => { const p = Skia.Path.Make(); p.addRRect(Skia.RRectXY(Skia.XYWHRect(994, -8, 16, 50), 3, 3)); return p; })()} color="#e8e0cf" />
    </>
  );
}

export type ShapesProps = { w: number; h: number; n: number; swing: number; at: number; excite: Excite; accessibilityLabel: string };

export function StringShapes({ w, h, n, swing, at, excite, accessibilityLabel }: ShapesProps) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', STRING_BOX, w, h, 6), [w, h]);
  const shape = useMemo(() => {
    const p = Skia.Path.Make();
    const N = 200;
    for (let i = 0; i <= N; i++) {
      const x = i / N;
      const y = SY(shapeAt(n, x) * swing * 0.8);
      if (i === 0) p.moveTo(SX(x), y);
      else p.lineTo(SX(x), y);
    }
    return p;
  }, [n, swing]);
  const env = useMemo(() => {
    const p = Skia.Path.Make();
    const N = 200;
    for (const s of [1, -1]) {
      for (let i = 0; i <= N; i++) {
        const x = i / N;
        const y = SY(shapeAt(n, x) * s * 0.8);
        if (i === 0) p.moveTo(SX(x), y);
        else p.lineTo(SX(x), y);
      }
    }
    return p;
  }, [n]);
  const nodes = nodesOf(n);
  const atY = SY(shapeAt(n, at) * swing * 0.8);
  const labels: StaticLabel[] = [
    { id: 'br', text: 'BRIDGE', u: 0, v: 110, align: 'center', tone: 'muted' },
    { id: 'nut', text: 'NUT (OR FINGER)', short: 'NUT', u: 1000, v: 110, align: 'right', tone: 'muted' },
    { id: 'at', text: excite === 'bow' ? 'BOW' : 'FINGER', u: SX(at), v: -290, align: 'center', tone: 'amber' },
    { id: 'ex', text: 'A SIMPLIFIED STRING · MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: 1000, v: 270, align: 'right', tone: 'illustrative' },
  ];
  if (nodes.length) labels.push({ id: 'still', text: nodes.length === 1 ? 'STILL POINT' : 'STILL POINTS', u: SX(nodes[0]), v: 60, align: 'center', tone: 'blue' });
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <StringEnds />
          <Line p1={vec(0, 0)} p2={vec(1000, 0)} color="#5a5f6a" strokeWidth={2}>
            <DashPathEffect intervals={[12, 10]} />
          </Line>
          <Path path={env} style="stroke" strokeWidth={2} color={BLUE} opacity={0.35}>
            <DashPathEffect intervals={[10, 9]} />
          </Path>
          <Path path={shape} style="stroke" strokeWidth={7} color="#d7dbe2" strokeCap="round" />
          {nodes.map((x) => (
            <Circle key={x} cx={SX(x)} cy={0} r={11} style="stroke" strokeWidth={4} color={BLUE} />
          ))}
          <Line p1={vec(SX(at), -260)} p2={vec(SX(at), 240)} color={AMBER} strokeWidth={3} opacity={0.75}>
            <DashPathEffect intervals={[14, 10]} />
          </Line>
          <Circle cx={SX(at)} cy={atY} r={13} color={AMBER} />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

export type MotionProps = { w: number; h: number; phase: number; at: number; excite: Excite; accessibilityLabel: string };

export function StringMotion({ w, h, phase, at, excite, accessibilityLabel }: MotionProps) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', STRING_BOX, w, h, 6), [w, h]);
  const N = 200;
  const shape = useMemo(() => {
    const p = Skia.Path.Make();
    for (let i = 0; i <= N; i++) {
      const x = i / N;
      const y = SY((excite === 'bow' ? helmholtzAt(x, phase) : pluckedAt(x, phase, at)) * 0.9);
      if (i === 0) p.moveTo(SX(x), y);
      else p.lineTo(SX(x), y);
    }
    return p;
  }, [phase, at, excite]);
  const guide = useMemo(() => {
    const p = Skia.Path.Make();
    if (excite === 'bow') {
      // The corner's path: two parabolas, out along one, back along the other.
      for (const s of [1, -1]) {
        for (let i = 0; i <= N; i++) {
          const x = i / N;
          const y = SY(s * 4 * x * (1 - x) * 0.9);
          if (i === 0) p.moveTo(SX(x), y);
          else p.lineTo(SX(x), y);
        }
      }
    } else {
      // The starting triangle.
      p.moveTo(0, 0);
      p.lineTo(SX(at), SY(0.9));
      p.lineTo(SX(1), 0);
    }
    return p;
  }, [excite, at]);
  const c = helmholtzCorner(phase);
  const atY = SY((excite === 'bow' ? helmholtzAt(at, phase) : pluckedAt(at, phase, at)) * 0.9);
  const labels: StaticLabel[] = [
    { id: 'br', text: 'BRIDGE', u: 0, v: 110, align: 'center', tone: 'muted' },
    { id: 'nut', text: 'NUT (OR FINGER)', short: 'NUT', u: 1000, v: 110, align: 'right', tone: 'muted' },
    { id: 'at', text: excite === 'bow' ? 'BOW' : 'PLUCKED HERE', short: excite === 'bow' ? 'BOW' : 'PLUCK', u: SX(at), v: -290, align: 'center', tone: 'amber' },
    { id: 'g', text: excite === 'bow' ? 'THE CORNER’S PATH' : 'WHERE IT STARTED', short: excite === 'bow' ? 'CORNER PATH' : 'START', u: 500, v: excite === 'bow' ? 250 : -240, align: 'center', tone: 'blue' },
    { id: 'ex', text: 'A SIMPLIFIED STRING · MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: 1000, v: 285, align: 'right', tone: 'illustrative' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <StringEnds />
          <Line p1={vec(0, 0)} p2={vec(1000, 0)} color="#5a5f6a" strokeWidth={2}>
            <DashPathEffect intervals={[12, 10]} />
          </Line>
          <Path path={guide} style="stroke" strokeWidth={2.5} color={BLUE} opacity={0.45}>
            <DashPathEffect intervals={[10, 9]} />
          </Path>
          <Path path={shape} style="stroke" strokeWidth={7} color="#d7dbe2" strokeCap="round" strokeJoin="round" />
          {excite === 'bow' && c.x > 0.002 && c.x < 0.998 ? <Circle cx={SX(c.x)} cy={SY(c.h * 0.9)} r={14} style="stroke" strokeWidth={5} color={BLUE} /> : null}
          <Line p1={vec(SX(at), -260)} p2={vec(SX(at), 240)} color={AMBER} strokeWidth={3} opacity={0.75}>
            <DashPathEffect intervals={[14, 10]} />
          </Line>
          <Circle cx={SX(at)} cy={atY} r={13} color={AMBER} />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
