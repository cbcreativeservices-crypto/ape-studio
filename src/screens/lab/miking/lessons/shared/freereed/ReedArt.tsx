/**
 * THE FREE REED, drawn (HOW IT SOUNDS for Lab 3's harmonica and accordion):
 *
 *   ReedSequence  one reed cut open — the air's chamber above, the brass
 *                 plate with its slot, the reed riveted at one end — stepped
 *                 through the reed's swing (reedModel.PUFF_STEPS): the air
 *                 arrives, pushes the reed down through the slot (a puff),
 *                 the reed springs back up through it, and keeps swinging,
 *                 so the air leaves in puffs. The ORDER of events, never their
 *                 speed or size: the motion is drawn far larger than life.
 *   ReedShapes    the reed from the side in one vibration shape of an IDEAL
 *                 clamped-free bar (reedModel.reedShape), swung by hand:
 *                 blue where it moves up, amber where it moves down, white
 *                 marks at its still points, the rest position dashed.
 *
 * Brass lit from the upper left with a rim highlight; the chamber a dark cut
 * body. Static (D8): the pictures change only on a step, a pick or a drag.
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { BRASS } from '../metal/metalArt';
import { PUFF_STEPS, REED_RATIOS, reedNodes, reedShape } from './reedModel.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const BLUE = '#6fa8ff';
const AMBER = '#ffc64d';
const AIR = '#9fd4ff';

/* the diagram's own millimetres (a picture, not a measurement) */
const BOX = { u0: 0, u1: 250, v0: 4, v1: 170 };
const PLATE = { u0: 8, u1: 242, v0: 80, v1: 88 };
const SLOT = { u0: 74, u1: 206 };
const RIVET = 64;
const TIP = 200;
const SWING = 44;

/** The reed's centre line, displaced: tip > 0 = down through the slot. */
function reedLine(tip: number, mode = 0): { u: number; v: number }[] {
  const out: { u: number; v: number }[] = [];
  for (let i = 0; i <= 40; i++) {
    const xi = i / 40;
    out.push({ u: RIVET + xi * (TIP - RIVET), v: (PLATE.v0 + PLATE.v1) / 2 - 1 + tip * SWING * reedShape(mode, xi) });
  }
  return out;
}

/** A thin tongue along a line: its outline, `t` thick. */
function tongue(line: { u: number; v: number }[], t: number): SkPath {
  const p = make();
  const top = line.map((q) => [q.u, q.v - t / 2] as const);
  const bot = line.map((q) => [q.u, q.v + t / 2] as const).reverse();
  p.moveTo(top[0][0], top[0][1]);
  for (const [u, v] of top.slice(1)) p.lineTo(u, v);
  for (const [u, v] of bot) p.lineTo(u, v);
  p.close();
  return p;
}

function arrow(u0: number, v0: number, u1: number, v1: number, head = 7): SkPath {
  const p = make();
  p.moveTo(u0, v0);
  p.lineTo(u1, v1);
  const a = Math.atan2(v1 - v0, u1 - u0);
  p.moveTo(u1 - head * Math.cos(a - 0.45), v1 - head * Math.sin(a - 0.45));
  p.lineTo(u1, v1);
  p.lineTo(u1 - head * Math.cos(a + 0.45), v1 - head * Math.sin(a + 0.45));
  return p;
}

/** The plate with its slot cut through (two bars either side of the slot). */
function PlateArt() {
  const left = make();
  left.addRRect(Skia.RRectXY(Skia.XYWHRect(PLATE.u0, PLATE.v0, SLOT.u0 - PLATE.u0, PLATE.v1 - PLATE.v0), 1.5, 1.5));
  const right = make();
  right.addRRect(Skia.RRectXY(Skia.XYWHRect(SLOT.u1, PLATE.v0, PLATE.u1 - SLOT.u1, PLATE.v1 - PLATE.v0), 1.5, 1.5));
  return (
    <Group>
      {[left, right].map((p, i) => (
        <Group key={i}>
          <Path path={p}>
            <LinearGradient start={vec(0, PLATE.v0)} end={vec(0, PLATE.v1)} colors={[BRASS[0], BRASS[2], BRASS[4]]} />
          </Path>
          <Path path={p} style="stroke" strokeWidth={0.8} color={BRASS[4]} />
        </Group>
      ))}
    </Group>
  );
}

/** The chamber above the plate (a comb channel or a reed cell), cut open. */
function ChamberArt({ voice }: { voice: 'harmonica' | 'accordion' }) {
  const wall = make();
  // The roof and the back wall of the chamber; the inlet open at the left.
  wall.addRRect(Skia.RRectXY(Skia.XYWHRect(30, 18, 212, 10), 3, 3));
  wall.addRRect(Skia.RRectXY(Skia.XYWHRect(232, 18, 10, 62), 3, 3));
  const fill = make();
  fill.addRect(Skia.XYWHRect(8, 28, 224, 52));
  return (
    <Group>
      <Path path={fill} color="#0d1016" />
      <Path path={wall}>
        <LinearGradient start={vec(30, 18)} end={vec(242, 80)} colors={voice === 'harmonica' ? ['#7c6a55', '#4a3c2c', '#2a2118'] : ['#5b4f45', '#3a312a', '#211b16']} />
      </Path>
      <Path path={wall} style="stroke" strokeWidth={0.8} color="#16120d" />
    </Group>
  );
}

export function ReedSequence({ w, h, shown, voice, accessibilityLabel }: { w: number; h: number; shown: number; voice: 'harmonica' | 'accordion'; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', BOX, w, h, 6), [w, h]);
  const k = Math.max(1, Math.min(PUFF_STEPS.length, shown));
  const st = PUFF_STEPS[k - 1];
  const reed = tongue(reedLine(st.tip), 5);
  const ghostA = k === 4 ? tongue(reedLine(-0.8), 5) : null;
  const rest = make();
  rest.moveTo(RIVET, (PLATE.v0 + PLATE.v1) / 2 - 1);
  rest.lineTo(TIP, (PLATE.v0 + PLATE.v1) / 2 - 1);
  const airIn = [arrow(4, 44, 54, 44), arrow(4, 60, 54, 60)];
  const press = [arrow(110, 36, 110, 66), arrow(150, 36, 150, 66)];
  // Puffs below the slot, drifting down and out (blurred blobs).
  const puffs = Array.from({ length: st.puffs }, (_, i) => ({ u: 168 - i * 24 + (i % 2) * 8, v: 112 + i * 9, r: 9 + i * 1.5, o: 0.55 - i * 0.09 }));
  const arcs = make();
  if (st.sound) for (let i = 0; i < 3; i++) arcs.addArc(Skia.XYWHRect(150 - 30 - i * 22, 118 - 22 - i * 16, 60 + i * 44, 44 + i * 32), 20, 140);
  const labels: StaticLabel[] = [
    { id: 'air', text: voice === 'harmonica' ? 'BREATH IN' : 'AIR FROM THE BELLOWS', short: 'AIR', u: 10, v: 34, align: 'left', tone: 'blue' },
    { id: 'plate', text: 'PLATE', u: 238, v: 100, align: 'right', tone: 'muted' },
    { id: 'reed', text: 'REED', u: RIVET + 4, v: 70, align: 'left', tone: 'muted' },
    { id: 'slot', text: st.open ? 'SLOT OPEN' : 'SLOT CLOSED', u: 12, v: 104, align: 'left', tone: st.open ? 'amber' : 'muted' },
    ...(st.puffs ? [{ id: 'puff', text: st.sound ? 'PUFFS = THE SOUND' : 'A PUFF OF AIR', short: 'PUFF', u: 12, v: 160, align: 'left' as const, tone: 'amber' as const }] : []),
  ];
  return (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <ChamberArt voice={voice} />
          {airIn.map((p, i) => (
            <Path key={`in${i}`} path={p} style="stroke" strokeWidth={2.2} strokeCap="round" color={AIR} opacity={0.85} />
          ))}
          {k === 1 ? press.map((p, i) => <Path key={`pr${i}`} path={p} style="stroke" strokeWidth={2} strokeCap="round" color={AIR} opacity={0.6} />) : null}
          <PlateArt />
          <Path path={rest} style="stroke" strokeWidth={1} color="#cfd4dc" opacity={0.5}>
            <DashPathEffect intervals={[4, 3]} />
          </Path>
          {ghostA ? <Path path={ghostA} color={BRASS[1]} opacity={0.28} /> : null}
          <Path path={reed}>
            <LinearGradient start={vec(RIVET, 70)} end={vec(TIP, 100)} colors={[BRASS[0], BRASS[1], BRASS[3]]} />
          </Path>
          <Path path={reed} style="stroke" strokeWidth={0.6} color={BRASS[4]} />
          <Circle cx={RIVET} cy={PLATE.v0 - 2.5} r={5}>
            <RadialGradient c={vec(RIVET - 2, PLATE.v0 - 5)} r={7} colors={[BRASS[0], BRASS[2], BRASS[4]]} />
          </Circle>
          {st.open ? (
            <Path path={arrow(140, 70, 140 + (st.tip > 0 ? 12 : -10), 112, 6)} style="stroke" strokeWidth={2.4} strokeCap="round" color={AIR} opacity={0.9} />
          ) : null}
          {puffs.map((q, i) => (
            <Circle key={`pf${i}`} cx={q.u} cy={q.v} r={q.r} color={AIR} opacity={q.o}>
              <BlurMask blur={3.5} style="normal" />
            </Circle>
          ))}
          {st.sound ? <Path path={arcs} style="stroke" strokeWidth={1.6} color={AMBER} opacity={0.75} /> : null}
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

const SHAPE_BOX = { u0: 0, u1: 250, v0: 28, v1: 140 };

export function ReedShapes({ w, h, mode, swing, accessibilityLabel }: { w: number; h: number; mode: number; swing: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', SHAPE_BOX, w, h, 6), [w, h]);
  const amp = 0.62 * swing;
  const line = reedLine(amp, mode);
  const nodes = mode > 0 ? reedNodes(mode) : [];
  const mid = (PLATE.v0 + PLATE.v1) / 2 - 1;
  // Colour each stretch by which way it moves (blue up = toward −v here).
  const segs: { path: SkPath; up: boolean }[] = [];
  for (let i = 0; i < line.length - 1; i++) {
    const s = reedShape(mode, (i + 0.5) / (line.length - 1));
    const p = make();
    p.moveTo(line[i].u, line[i].v);
    p.lineTo(line[i + 1].u, line[i + 1].v);
    segs.push({ path: p, up: s * amp < 0 });
  }
  const ghost = reedLine(-amp, mode);
  const gp = make();
  gp.moveTo(ghost[0].u, ghost[0].v);
  for (const q of ghost.slice(1)) gp.lineTo(q.u, q.v);
  const rest = make();
  rest.moveTo(RIVET, mid);
  rest.lineTo(TIP, mid);
  const block = make();
  block.addRRect(Skia.RRectXY(Skia.XYWHRect(14, mid - 18, 46, 36), 4, 4));
  const labels: StaticLabel[] = [
    { id: 'clamp', text: 'HELD (RIVETED)', short: 'HELD', u: 37, v: mid + 34, align: 'center', tone: 'muted' },
    { id: 'tip', text: 'MOVING TIP', u: TIP, v: mid + 40, align: 'center', tone: 'muted' },
    { id: 'ratio', text: `SHAPE ${mode + 1} · ×${REED_RATIOS[mode].toFixed(2)} THE LOWEST`, short: `×${REED_RATIOS[mode].toFixed(2)}`, u: 125, v: 40, align: 'center', tone: 'amber' },
    ...nodes.map((x, i) => ({ id: `n${i}`, text: 'STILL', u: RIVET + x * (TIP - RIVET), v: mid - 30, align: 'center' as const, tone: 'muted' as const })),
  ];
  return (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Path path={block}>
            <LinearGradient start={vec(14, mid - 18)} end={vec(60, mid + 18)} colors={[BRASS[1], BRASS[2], BRASS[4]]} />
          </Path>
          <Path path={rest} style="stroke" strokeWidth={1.2} color="#cfd4dc" opacity={0.55}>
            <DashPathEffect intervals={[4, 3]} />
          </Path>
          <Path path={gp} style="stroke" strokeWidth={3.2} strokeCap="round" color="#cfd4dc" opacity={0.18} />
          {segs.map((s, i) => (
            <Path key={i} path={s.path} style="stroke" strokeWidth={4.2} strokeCap="round" color={Math.abs(amp) < 0.02 ? BRASS[1] : s.up ? BLUE : AMBER} />
          ))}
          <Circle cx={RIVET} cy={mid} r={4.5}>
            <RadialGradient c={vec(RIVET - 1.5, mid - 1.5)} r={6} colors={[BRASS[0], BRASS[2], BRASS[4]]} />
          </Circle>
          {nodes.map((x, i) => (
            <Path key={`nd${i}`} path={(() => { const p = make(); const u = RIVET + x * (TIP - RIVET); p.moveTo(u, mid - 18); p.lineTo(u, mid + 18); return p; })()} style="stroke" strokeWidth={1.6} color="#ffffff" opacity={0.85}>
              <DashPathEffect intervals={[3, 3]} />
            </Path>
          ))}
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

export const REED_SEQ_ASPECT = (BOX.u1 - BOX.u0) / (BOX.v1 - BOX.v0);
export const REED_SHAPE_ASPECT = (SHAPE_BOX.u1 - SHAPE_BOX.u0) / (SHAPE_BOX.v1 - SHAPE_BOX.v0);
