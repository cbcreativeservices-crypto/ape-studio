/**
 * HOW IT SOUNDS for the saxophone family — the pictures (LESSON_JOURNEY §6
 * stage 2, §7 "air columns"). FULLY SILENT: nothing here plays a sound.
 *
 *   SaxBreath      breath to sound, in four numbered events on the horn
 *                  face-on: the reed opens and closes the mouthpiece; a
 *                  pressure pulse runs down the cone; at the FIRST OPEN HOLE
 *                  it turns back (the air column ends there); sound leaves the
 *                  first open hole and the open holes past it, and the bell
 *                  carries the high harmonics. The order of events, not their
 *                  speed. `reveal` (1 … 4) is stepped, or played ONCE.
 *   SaxFingering   one fingering at a time (the learner's NOTE): closed cups
 *                  seated, open cups lifted, the air column bracketed from the
 *                  reed to the first open hole, the radiating holes and the
 *                  bell ringed — strong, weaker, faint. The octave key's vent
 *                  lights in the second register.
 *   ConeShapes     the air column straightened out: the cone from its tip to
 *                  its open end, and the pressure along it in shape 1 (the
 *                  note) or shape 2 (an octave up), swung by hand. The octave
 *                  vent sits at shape 2's still point.
 *
 * Rings are drawn, never animated (D8): the radiation is a picture of where
 * the sound leaves, not of a level ("a simplified picture").
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import type { Vec3, ViewBox } from '../../../engine/model/types.ts';
import { coneNodes, coneShape, fingering, holesOf, pathOf, radiators, radiusAt, type SaxRow } from './saxSpec.ts';
import { centre, onTube, tubeDir } from './saxPosture.ts';
import { SaxInstrument, portraitOf } from './SaxArt';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const AMBER = '#ffc64d';
const GLOW = '#7fd4ff';
const make = () => Skia.Path.Make();

/** The horn face-on, framed tight (no label columns). */
export function hornBox(row: SaxRow, padL = 140, padR = 160): ViewBox {
  const P = portraitOf(row);
  const S = pathOf(row);
  let u0 = Infinity;
  let u1 = -Infinity;
  let v0 = Infinity;
  let v1 = -Infinity;
  for (let u = 0; u <= S.U; u += 10) {
    const c = centre(P, u);
    const r = radiusAt(row, u) + 30;
    u0 = Math.min(u0, c.x - r);
    u1 = Math.max(u1, c.x + r);
    v0 = Math.min(v0, c.y - r);
    v1 = Math.max(v1, c.y + r);
  }
  return { u0: u0 - padL, u1: u1 + padR, v0: v0 - 60, v1: v1 + 50 };
}

/** Concentric radiation arcs round a point, opening along `dir` (2-D). */
function rings(c: [number, number], dir: [number, number], r0: number, n: number, gap: number, spread = 1.1): SkPath {
  const p = make();
  const a0 = Math.atan2(dir[1], dir[0]);
  for (let i = 0; i < n; i++) {
    const r = r0 + i * gap;
    const rect = Skia.XYWHRect(c[0] - r, c[1] - r, 2 * r, 2 * r);
    p.addArc(rect, ((a0 - spread) * 180) / Math.PI, (2 * spread * 180) / Math.PI);
  }
  return p;
}

const uv = (p: Vec3): [number, number] => [p.x, p.y];

/** The air column's bracket: a dashed line along the tube, reed → u. */
function columnPath(row: SaxRow, uEnd: number): SkPath {
  const P = portraitOf(row);
  const p = make();
  for (let u = 0; u <= uEnd; u += 6) {
    const q = onTube(P, u, 180, 20);
    if (u === 0) p.moveTo(q.x, q.y);
    else p.lineTo(q.x, q.y);
  }
  return p;
}

/** The radiation for a fingering: paths for strong, weaker and faint rings. */
function radiationPaths(row: SaxRow, s: number) {
  const P = portraitOf(row);
  const f = fingering(row, s);
  const rad = radiators(row, f);
  const strong = make();
  const weak = make();
  const faint = make();
  for (const r of rad) {
    if (r.kind === 'bell') {
      const S = pathOf(row);
      const c = centre(P, S.U);
      const a = centre(P, S.U - 8);
      const d: [number, number] = [c.x - a.x, c.y - a.y];
      const l = Math.hypot(d[0], d[1]) || 1;
      const ring = rings(uv(c), [d[0] / l, d[1] / l], row.rimR.v * 0.7, r.strength === 'main' ? 4 : 3, row.rimR.v * 0.42, 0.95);
      (r.strength === 'main' ? strong : faint).addPath(ring);
    } else {
      const h = holesOf(row)[r.k - 1];
      const ang = -10;
      const c = onTube(P, h.u, ang, 4);
      const m = tubeDir(P, h.u, ang);
      const ring = rings(uv(c), [m.x, m.y], h.cupR * 0.9, r.strength === 'main' ? 4 : 2, h.cupR * 0.75 + 8, 1.0);
      (r.strength === 'main' ? strong : weak).addPath(ring);
    }
  }
  return { f, strong, weak, faint };
}

function hornXf(row: SaxRow, w: number, h: number, box: ViewBox) {
  return fitXform('side', box, w, h, 4);
}

/* ── breath to sound ── */

export function SaxBreath({ w, h, row, reveal, shown, s, accessibilityLabel }: { w: number; h: number; row: SaxRow; reveal: SharedValue<number>; shown: number; s: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const box = useMemo(() => hornBox(row), [row]);
  const xf = useMemo(() => hornXf(row, w, h, box), [row, w, h, box]);
  const P = useMemo(() => portraitOf(row), [row]);
  const f = useMemo(() => fingering(row, s), [row, s]);
  const uHole = f.k === 0 ? pathOf(row).U : holesOf(row)[f.k - 1].u;
  // The pulse's path, sampled (plain data for the worklet).
  const track = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i <= 60; i++) {
      const c = centre(P, (uHole * i) / 60);
      out.push({ x: c.x, y: c.y });
    }
    return out;
  }, [P, uHole]);
  const pulseR = Math.max(10, row.mpR * 1.1);
  const pulse = useDerivedValue(() => {
    const t = Math.max(0, Math.min(1, reveal.value - 2));
    const k = t * (track.length - 1);
    const i = Math.min(track.length - 2, Math.floor(k));
    const fr = k - i;
    return { x: track[i].x + (track[i + 1].x - track[i].x) * fr, y: track[i].y + (track[i + 1].y - track[i].y) * fr, on: reveal.value >= 2 && reveal.value < 3.02 ? 1 : 0 };
  });
  const pcx = useDerivedValue(() => pulse.value.x);
  const pcy = useDerivedValue(() => pulse.value.y);
  const pOn = useDerivedValue(() => pulse.value.on * 0.9);
  const rad = useMemo(() => radiationPaths(row, s), [row, s]);
  const column = useMemo(() => columnPath(row, uHole), [row, uHole]);
  const holeC = f.k === 0 ? centre(P, pathOf(row).U) : onTube(P, uHole, -10, 4);
  const reed = centre(P, 6);
  const L = (10 - xf.ox) / xf.s;
  const R = (w - 10 - xf.ox) / xf.s;
  const labels: StaticLabel[] = [];
  if (shown >= 1) labels.push({ id: 'reed', text: shown === 1 ? 'THE REED OPENS AND CLOSES' : 'REED', short: 'REED', u: L, v: reed.y - 60, align: 'left', tone: 'amber', at: { u: reed.x, v: reed.y } });
  if (shown >= 3) labels.push({ id: 'end', text: f.k === 0 ? 'THE AIR COLUMN ENDS AT THE BELL' : 'THE AIR COLUMN ENDS HERE', short: 'IT ENDS HERE', u: R, v: box.v0 + 50, align: 'right', tone: 'amber', at: { u: holeC.x, v: holeC.y } });
  if (shown >= 4) {
    const S = pathOf(row);
    const bc = centre(P, S.U);
    labels.push({ id: 'bell', text: 'BELL · HIGH HARMONICS', short: 'BELL', u: R, v: box.v1 - 60, align: 'right', tone: 'blue', at: { u: bc.x, v: bc.y } });
  }
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <SaxInstrument P={P} view="side" f={f} />
          {shown >= 1 ? (
            <Circle cx={reed.x} cy={reed.y} r={row.mpR * 2.4} opacity={shown === 1 ? 0.95 : 0.45}>
              <RadialGradient c={vec(reed.x, reed.y)} r={row.mpR * 2.4} colors={['rgba(255,198,77,0.95)', 'rgba(255,198,77,0)']} />
            </Circle>
          ) : null}
          {shown >= 3 ? (
            <Path path={column} style="stroke" strokeWidth={4} color={AMBER} opacity={0.9}>
              <DashPathEffect intervals={[14, 9]} />
            </Path>
          ) : null}
          <Circle cx={pcx} cy={pcy} r={pulseR} opacity={pOn} color={AMBER}>
            <BlurMask blur={pulseR * 0.6} style="normal" />
          </Circle>
          {shown >= 3 ? (
            <Circle cx={holeC.x} cy={holeC.y} r={pulseR * 1.6} opacity={0.8}>
              <RadialGradient c={vec(holeC.x, holeC.y)} r={pulseR * 1.6} colors={['rgba(255,198,77,0.9)', 'rgba(255,198,77,0)']} />
            </Circle>
          ) : null}
          {shown >= 4 ? (
            <>
              <Path path={rad.strong} style="stroke" strokeWidth={4.5} strokeCap="round" color={GLOW} opacity={0.95} />
              <Path path={rad.weak} style="stroke" strokeWidth={3} strokeCap="round" color={GLOW} opacity={0.55} />
              <Path path={rad.faint} style="stroke" strokeWidth={2.5} strokeCap="round" color={GLOW} opacity={0.4}>
                <DashPathEffect intervals={[10, 8]} />
              </Path>
            </>
          ) : null}
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/* ── one fingering ── */

export function SaxFingering({ w, h, row, s, accessibilityLabel }: { w: number; h: number; row: SaxRow; s: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const box = useMemo(() => hornBox(row), [row]);
  const xf = useMemo(() => hornXf(row, w, h, box), [row, w, h, box]);
  const P = useMemo(() => portraitOf(row), [row]);
  const rad = useMemo(() => radiationPaths(row, s), [row, s]);
  const f = rad.f;
  const S = pathOf(row);
  const uEnd = f.k === 0 ? S.U : holesOf(row)[f.k - 1].u;
  const column = useMemo(() => columnPath(row, uEnd), [row, uEnd]);
  const end = f.k === 0 ? centre(P, S.U) : onTube(P, uEnd, -10, 4);
  const octU = S.mouthEnd + (S.tenon - S.mouthEnd) * 0.36;
  const oct = onTube(P, octU, 4, 6);
  const bell = centre(P, S.U);
  const L = (10 - xf.ox) / xf.s;
  const R = (w - 10 - xf.ox) / xf.s;
  const labels: StaticLabel[] = [
    { id: 'end', text: f.k === 0 ? 'EVERY KEY CLOSED · THE BELL' : `FIRST OPEN HOLE · ${f.k}`, short: f.k === 0 ? 'THE BELL' : `HOLE ${f.k}`, u: R, v: box.v0 + 50, align: 'right', tone: 'amber', at: { u: end.x, v: end.y } },
    { id: 'col', text: `AIR COLUMN ≈ ${Math.round(f.air / 10)} CM`, short: `≈ ${Math.round(f.air / 10)} CM`, u: L, v: centre(P, uEnd * 0.5).y + 40, align: 'left', tone: 'amber', at: { u: onTube(P, uEnd * 0.5, 180, 20).x, v: onTube(P, uEnd * 0.5, 180, 20).y } },
  ];
  if (f.k > 0) labels.push({ id: 'bell', text: 'BELL · HIGH HARMONICS', short: 'BELL', u: R, v: box.v1 - 60, align: 'right', tone: 'blue', at: { u: bell.x, v: bell.y } });
  if (f.octaveKey) labels.push({ id: 'oct', text: 'OCTAVE KEY OPEN', short: 'OCTAVE', u: L, v: box.v0 + 50, align: 'left', tone: 'amber', at: { u: oct.x, v: oct.y } });
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <SaxInstrument P={P} view="side" f={f} />
          <Path path={column} style="stroke" strokeWidth={4} color={AMBER} opacity={0.85}>
            <DashPathEffect intervals={[14, 9]} />
          </Path>
          <Circle cx={end.x} cy={end.y} r={26} opacity={0.75}>
            <RadialGradient c={vec(end.x, end.y)} r={26} colors={['rgba(255,198,77,0.9)', 'rgba(255,198,77,0)']} />
          </Circle>
          {f.octaveKey ? (
            <Circle cx={oct.x} cy={oct.y} r={22} opacity={0.8}>
              <RadialGradient c={vec(oct.x, oct.y)} r={22} colors={['rgba(255,198,77,0.95)', 'rgba(255,198,77,0)']} />
            </Circle>
          ) : null}
          <Path path={rad.strong} style="stroke" strokeWidth={4.5} strokeCap="round" color={GLOW} opacity={0.95} />
          <Path path={rad.weak} style="stroke" strokeWidth={3} strokeCap="round" color={GLOW} opacity={0.55} />
          <Path path={rad.faint} style="stroke" strokeWidth={2.5} strokeCap="round" color={GLOW} opacity={0.4}>
            <DashPathEffect intervals={[10, 8]} />
          </Path>
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/* ── the air column straightened out ── */

export function ConeShapes({ w, h, n, swing, accessibilityLabel }: { w: number; h: number; n: 1 | 2; swing: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  // A unit diagram (mm-like units): the cone from x 0 (its tip, at the
  // reed) to 1000 (its open end), half-height 80 at the open end.
  const box: ViewBox = { u0: -60, u1: 1060, v0: -260, v1: 330 };
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h]);
  const geo = useMemo(() => {
    const cone = make();
    cone.moveTo(0, 210);
    cone.lineTo(1000, 130);
    cone.lineTo(1000, 290);
    cone.close();
    const axis = make();
    axis.moveTo(0, 0);
    axis.lineTo(1000, 0);
    const curve = make();
    const fill = make();
    fill.moveTo(0, 0);
    for (let i = 0; i <= 200; i++) {
      const x = i / 200;
      const y = -coneShape(n, x) * 200 * swing;
      if (i === 0) curve.moveTo(x * 1000, y);
      else curve.lineTo(x * 1000, y);
      fill.lineTo(x * 1000, y);
    }
    fill.lineTo(1000, 0);
    fill.close();
    const env = make();
    for (const sgn of [1, -1]) {
      for (let i = 0; i <= 200; i++) {
        const x = i / 200;
        const y = -sgn * Math.abs(coneShape(n, x)) * 200;
        if (i === 0) env.moveTo(x * 1000, y);
        else env.lineTo(x * 1000, y);
      }
    }
    return { cone, axis, curve, fill, env };
  }, [n, swing]);
  const nodes = coneNodes(n);
  const vent = n === 2 ? 500 : null;
  const labels: StaticLabel[] = [
    { id: 'tip', text: 'REED END', u: 0, v: 300, align: 'left', tone: 'muted' },
    { id: 'open', text: 'OPEN END (FIRST OPEN HOLE)', short: 'OPEN END', u: 1000, v: 318, align: 'right', tone: 'muted' },
    { id: 'p', text: 'AIR PRESSURE', u: 0, v: -235, align: 'left', tone: 'amber' },
  ];
  if (vent) labels.push({ id: 'vent', text: 'OCTAVE VENT · STILL POINT', short: 'VENT', u: vent, v: 120, align: 'center', tone: 'amber', at: { u: vent, v: 170 } });
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          {/* the cone, brass, from the reed end to the open end */}
          <Path path={geo.cone}>
            <LinearGradient start={vec(0, 130)} end={vec(0, 290)} colors={['#fbe7a6', '#d5a645', '#7a5113']} />
          </Path>
          <Path path={geo.cone} style="stroke" strokeWidth={3} color="#2a1903" />
          <Path path={geo.axis} style="stroke" strokeWidth={2} color="#6b7080">
            <DashPathEffect intervals={[12, 10]} />
          </Path>
          <Path path={geo.env} style="stroke" strokeWidth={2} color="#8a8f9c" opacity={0.6}>
            <DashPathEffect intervals={[8, 8]} />
          </Path>
          <Path path={geo.fill} color={AMBER} opacity={0.22} />
          <Path path={geo.curve} style="stroke" strokeWidth={5} strokeCap="round" color={AMBER} />
          {nodes.map((x) => (
            <Circle key={x} cx={x * 1000} cy={0} r={11} color="#ff6b5e" />
          ))}
          {vent ? (
            <>
              <Circle cx={vent} cy={170} r={16} color="#140c03" />
              <Circle cx={vent} cy={170} r={16} style="stroke" strokeWidth={4} color={AMBER} />
            </>
          ) : null}
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
