/**
 * HOW A SPEAKER MAKES ITS SOUND, drawn (LESSON_JOURNEY §6 stage 2, §7 "voice,
 * speakers, Leslie: the loudspeaker cone"). FULLY SILENT: shown, never played.
 *
 *   ConeSequence  four events on the 1×12 cut open, numbered (an EXPLANATORY
 *                 OVERLAY), revealed by `reveal` (stepped, or played ONCE by
 *                 the page): ① the signal reaches the voice coil; ② the coil
 *                 and the cone move forward together, as one piston (at low
 *                 pitches) — drawn many times larger than it moves; ③ the air
 *                 in front is pushed while the air behind is pulled — the
 *                 same moment, opposite ways; ④ sound leaves the front, and,
 *                 with an open back, the back too, opposite in polarity.
 *   BeamDisplay   the textbook rigid piston in a wall (pistonBeam.ts): how
 *                 wide the speaker spreads its sound at a chosen pitch, and
 *                 where an off-axis mic sits in that spread. A simplified
 *                 picture, said once, with its near-field limit.
 *
 * Arrows show the ORDER and DIRECTION of events, never a speed or a level.
 * Nothing loops (D8).
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, Line, Path, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { CabSection } from './SpeakerArt';
import { cabDraw, speakerSection, type Back } from './cabGeometry.ts';
import { PISTON_A_MM, kaOf, pistonD } from './pistonBeam.ts';

const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const AIR = '#9cc4ff';
const RED = '#ff6b5e';
/** How far the cone is DRAWN to move (mm) — many times its real travel. */
export const CONE_DRAWN_MM = 22;

type SkPath = ReturnType<typeof Skia.Path.Make>;
function arrow(p: SkPath, x0: number, y0: number, x1: number, y1: number, head = 20) {
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

const clamp01 = (x: number) => {
  'worklet';
  return Math.max(0, Math.min(1, x));
};

/** The scene box for the cone sequence (side view of the 1×12, room for arcs). */
export function coneBox(back: Back) {
  const c = cabDraw('1x12', back);
  return { u0: c.box.x0 - (back === 'open' ? 330 : 90), u1: 520, v0: c.box.y0 - 70, v1: c.floorY + 22 };
}

/** The moving parts' outline (cone + dust cap) as plain polylines, sampled
 *  once in JS (worklets may only read plain numbers). */
const OUTLINE: number[][] = (() => {
  const s = speakerSection(12);
  const lines: number[][] = [];
  const n = 20;
  for (const sgn of [-1, 1]) {
    const l: number[] = [];
    for (let i = 0; i <= n; i++) {
      const r = s.rCoil + ((s.rSurroundIn - s.rCoil) * i) / n;
      l.push(s.coneX(r), sgn * r);
    }
    lines.push(l);
  }
  const d: number[] = [];
  const m = 14;
  for (let i = 0; i <= m; i++) {
    const r = -s.rDust + (2 * s.rDust * i) / m;
    d.push(s.dustX(Math.abs(r)), r);
  }
  lines.push(d);
  return lines;
})();

/** That outline displaced by `dx` (mm). */
function movingOutline(dx: number): SkPath {
  'worklet';
  const p = Skia.Path.Make();
  for (let k = 0; k < OUTLINE.length; k++) {
    const l = OUTLINE[k];
    for (let i = 0; i < l.length; i += 2) {
      if (i === 0) p.moveTo(l[i] + dx, l[i + 1]);
      else p.lineTo(l[i] + dx, l[i + 1]);
    }
  }
  return p;
}

export type ConeSequenceProps = { w: number; h: number; back: Back; reveal: SharedValue<number>; shown: number; accessibilityLabel: string };

export function ConeSequence({ w, h, back, reveal, shown, accessibilityLabel }: ConeSequenceProps) {
  const ts = useStageTextScale();
  const box = coneBox(back);
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h, box.u0, box.u1, box.v0, box.v1]); // eslint-disable-line react-hooks/exhaustive-deps
  const c = cabDraw('1x12', back);
  const s = speakerSection(12);
  const ov = useMemo(() => {
    const signal = Skia.Path.Make();
    // The signal arrives at the coil (from the amplifier, through the cable).
    arrow(signal, c.box.x0 + 40, s.rMagnet + 40, s.xMagnetFront - 6, s.rCoil + 6, 18);
    const push = Skia.Path.Make();
    arrow(push, s.dustX(0) + 10, 0, s.dustX(0) + 110, 0, 22);
    const front = Skia.Path.Make();
    for (const y of [-110, 0, 110]) arrow(front, c.grilleX + 24, y, c.grilleX + 150, y, 22);
    const behind = Skia.Path.Make();
    for (const y of [-120, 120]) arrow(behind, s.xMagnetBack - 20, y, s.coneX(80) - 14, y * 0.9, 20);
    const outFront = Skia.Path.Make();
    arcs(outFront, c.grilleX, 0, [180, 250, 320], -38, 38);
    const outBack = Skia.Path.Make();
    arcs(outBack, c.box.x0, 0, [120, 190, 260], 145, 215);
    return { signal, push, front, behind, outFront, outBack };
  }, [back]); // eslint-disable-line react-hooks/exhaustive-deps
  const o1 = useDerivedValue(() => clamp01(reveal.value) * (reveal.value >= 2.98 ? 0.4 : 1));
  const o2 = useDerivedValue(() => clamp01(reveal.value - 1) * (reveal.value >= 3.98 ? 0.45 : 1));
  const o3 = useDerivedValue(() => clamp01(reveal.value - 2));
  const o4 = useDerivedValue(() => clamp01(reveal.value - 3));
  const moved = useDerivedValue(() => movingOutline(CONE_DRAWN_MM * clamp01(reveal.value - 1)));
  const labels: StaticLabel[] = [];
  if (shown >= 1) labels.push({ id: 's1', text: '① SIGNAL → VOICE COIL', short: '① SIGNAL', u: c.box.x0 + 30, v: c.box.y0 - 30, align: 'left', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 's2', text: '② CONE MOVES AS ONE', short: '② CONE', u: c.grilleX + 20, v: -s.rFrame - 26, align: 'left', tone: 'blue' });
  if (shown >= 3) labels.push({ id: 's3', text: '③ PUSH IN FRONT · PULL BEHIND', short: '③ PUSH · PULL', u: c.grilleX + 20, v: c.floorY - 30, align: 'left', tone: 'blue' });
  if (shown >= 4) labels.push({ id: 's4', text: back === 'open' ? '④ OUT THE FRONT — AND THE BACK, OPPOSITE' : '④ OUT THE FRONT · BACK SOUND HELD IN', short: '④ SOUND OUT', u: (box.u0 + box.u1) / 2, v: box.v0 + 24, align: 'center', tone: 'blue' });
  labels.push({ id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: box.u1 - 10, v: c.floorY - 12, align: 'right', tone: 'illustrative' });
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <CabSection kind="1x12" back={back} view="side" showAxis={false} />
          <Group opacity={o1}>
            <Path path={ov.signal} style="stroke" strokeWidth={7} color={AMBER} strokeCap="round" strokeJoin="round" />
            <Circle cx={s.xMagnetFront - 10} cy={0} r={s.rCoil + 10} style="stroke" strokeWidth={5} color={AMBER} />
          </Group>
          <Group opacity={o2}>
            <Path path={moved} style="stroke" strokeWidth={6} color={BLUE} />
            <Path path={ov.push} style="stroke" strokeWidth={7} color={BLUE} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={o3}>
            <Path path={ov.front} style="stroke" strokeWidth={6} color={AIR} strokeCap="round" strokeJoin="round">
              <DashPathEffect intervals={[20, 12]} />
            </Path>
            <Path path={ov.behind} style="stroke" strokeWidth={6} color={RED} strokeCap="round" strokeJoin="round">
              <DashPathEffect intervals={[16, 10]} />
            </Path>
          </Group>
          <Group opacity={o4}>
            <Path path={ov.outFront} style="stroke" strokeWidth={6} color={AIR} opacity={0.9}>
              <DashPathEffect intervals={[24, 14]} />
            </Path>
            {back === 'open' ? (
              <Path path={ov.outBack} style="stroke" strokeWidth={6} color={RED} opacity={0.85}>
                <DashPathEffect intervals={[14, 12]} />
              </Path>
            ) : null}
          </Group>
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={ts} w={w} />
    </View>
  );
}

/* ── the beam: a rigid piston in a wall ── */
let cabEdge: SkPath | null = null;
const CAB_EDGE = () => {
  if (!cabEdge) {
    cabEdge = Skia.Path.Make();
    cabEdge.addRRect(Skia.RRectXY(Skia.XYWHRect(-240, -1000, 220, 2000), 18, 18));
  }
  return cabEdge;
};
export type BeamDisplayProps = { w: number; h: number; fHz: number; micDeg: number; accessibilityLabel: string };

/** The polar spread (front half), the mic's line, and the cabinet edge-on. */
export function BeamDisplay({ w, h, fHz, micDeg, accessibilityLabel }: BeamDisplayProps) {
  const ts = useStageTextScale();
  // Model box in "beam units": the lobe's on-axis radius is 1000.
  const box = { u0: -260, u1: 1100, v0: -1080, v1: 1080 };
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h]); // eslint-disable-line react-hooks/exhaustive-deps
  const ka = kaOf(fHz);
  const lobe = useMemo(() => {
    const p = Skia.Path.Make();
    for (let i = 0; i <= 180; i++) {
      const th = -90 + i;
      const d = pistonD(ka, th) * 1000;
      const x = d * Math.cos((th * Math.PI) / 180);
      const y = -d * Math.sin((th * Math.PI) / 180);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    p.close();
    return p;
  }, [ka]);
  const rings = useMemo(() => {
    const p = Skia.Path.Make();
    for (const f of [0.25, 0.5, 0.75, 1]) p.addArc(Skia.XYWHRect(-1000 * f, -1000 * f, 2000 * f, 2000 * f), -90, 180);
    for (const a of [-60, -30, 30, 60]) {
      p.moveTo(0, 0);
      p.lineTo(1000 * Math.cos((a * Math.PI) / 180), -1000 * Math.sin((a * Math.PI) / 180));
    }
    return p;
  }, []);
  const a = (micDeg * Math.PI) / 180;
  const dMic = pistonD(ka, micDeg) * 1000;
  // The cabinet's front, edge-on, with the cone opening drawn to the beam
  // units' scale only as a mark (the beam is a far-field picture).
  const coneMark = (PISTON_A_MM / 141.5) * 140;
  const labels: StaticLabel[] = [
    { id: 'cab', text: 'SPEAKER', u: -130, v: -coneMark - 50, align: 'center', tone: 'muted' },
    { id: 'axis', text: 'ON AXIS', u: 1060, v: -30, align: 'right', tone: 'illustrative' },
    { id: 'mic', text: 'MIC', u: 1060 * Math.cos(a), v: -1060 * Math.sin(a) - 26, align: 'center', tone: 'amber' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Path path={rings} style="stroke" strokeWidth={3} color="#2e2f38" />
          <Line p1={vec(0, 0)} p2={vec(1060, 0)} color="#4a4c58" strokeWidth={3}>
            <DashPathEffect intervals={[18, 12]} />
          </Line>
          <Path path={lobe} color={BLUE} opacity={0.14} />
          <Path path={lobe} style="stroke" strokeWidth={6} color={BLUE} />
          {/* the cabinet's front, edge-on, and the cone opening */}
          <Path path={CAB_EDGE()} color="#141416" />
          <Line p1={vec(-20, -coneMark)} p2={vec(-20, coneMark)} color="#5a4c40" strokeWidth={14} />
          {/* the mic's line, and where it meets the spread */}
          <Line p1={vec(0, 0)} p2={vec(1060 * Math.cos(a), -1060 * Math.sin(a))} color={AMBER} strokeWidth={4} opacity={0.8}>
            <DashPathEffect intervals={[14, 10]} />
          </Line>
          <Circle cx={dMic * Math.cos(a)} cy={-dMic * Math.sin(a)} r={22} color={AMBER} />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={ts} w={w} />
    </View>
  );
}
