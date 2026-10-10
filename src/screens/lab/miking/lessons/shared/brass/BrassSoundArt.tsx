/**
 * HOW IT SOUNDS for the brass family — the drawings (LESSON_JOURNEY §6 stage
 * 2, §7 "air columns"). FULLY SILENT: the physics is shown, never played.
 *
 *   AirColumn      the horn's tube drawn UNWOUND (straight), lips at the
 *                  left, bell at the right. Its numbered events are revealed
 *                  by `reveal` (stepped, or played ONCE): ① the lips buzz
 *                  into the cup; ② a pressure wave runs down the tube; ③ at
 *                  the bell most of it reflects, a standing wave builds and
 *                  the lips lock to it; ④ part of it leaves the bell — the
 *                  lows spreading round, the highs beaming ahead.
 *   TubeLength     how the player changes the tube: the trumpet's valves
 *                  (each brings in a loop; the tube unwound, ideal lengths)
 *                  or the trombone's slide, drawn at a position with its
 *                  crook's seven places as an ENVELOPE (dashed) and the swept
 *                  slide shaded (DERIVED travel, approximate).
 *   BellRadiation  the bell from above with the sound it sends out in one
 *                  band — LOW, MIDDLE, HIGH — as a shape (a simplified
 *                  picture of the measured trend: near-even all round low
 *                  down, the front winning from the middle, a beam along the
 *                  axis up high, narrower for a larger bell). No dB scale.
 *   MuteView       the bell close up with a mute in it: straight, cup,
 *                  Harmon, or a plunger held in front by the left hand.
 *
 * HONESTY: motion and wave sizes are drawn much larger than life; arrows
 * show the ORDER of events, never a speed or a level; the radiation shapes
 * are illustrative. Nothing loops (D8).
 */
import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import { Canvas, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import type { ViewBox } from '../../../engine/model/types.ts';
import { PaintItem } from '../bowed/BowedArt';
import { PROJ, hornGroups } from './BrassArt';
import { bellProfile, bellRadius, SLIDE_POSITIONS, type BrassSpec } from './brassSpec.ts';
import type { HornPose } from './brassPosture.ts';
import { HeadIcon, aboveRotation } from '../../../../../../features/lab/headIcons';
import { lobe, lobeWords, type Band } from './brassSoundMath.ts';

export { lobe, lobeWords, type Band };

const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const AIR = '#9cc4ff';
type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
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

/** One fitted canvas with static labels over it. */
function Stage({ w, h, box, a11y, labels, children }: { w: number; h: number; box: ViewBox; a11y: string; labels: StaticLabel[]; children: ReactNode }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', box, w, h, 8), [w, h, box]);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>{children}</Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/* ── ① – ④: the air column, unwound ── */

/** The unwound horn in its own mm: lips at 0, the tube to the flare, the bell to the rim. */
function columnGeom(spec: BrassSpec) {
  const R = Math.min(230, spec.bell.mm / 2 + 120);
  const tube = 42;
  const x0 = 130; // the cup
  const xF = 760; // the flare starts
  const xR = 980; // the rim
  const rAt = (x: number) => (x <= xF ? tube : tube + (R - tube) * Math.pow((x - xF) / (xR - xF), 3.2));
  return { R, tube, x0, xF, xR, rAt };
}

export function AirColumn({ w, h, spec, reveal, shown, accessibilityLabel }: { w: number; h: number; spec: BrassSpec; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const g = useMemo(() => columnGeom(spec), [spec]);
  const box: ViewBox = { u0: -40, u1: 1320, v0: -360, v1: 360 };
  const ev = (i: number) => {
    'worklet';
    return clamp01(reveal.value - i);
  };
  const buzz = useDerivedValue(() => ev(0) * (1 - ev(1) * 0.55));
  const pulse = useDerivedValue(() => ev(1) * (1 - ev(2)));
  const stand = useDerivedValue(() => ev(2));
  const leave = useDerivedValue(() => ev(3));
  const p = useMemo(() => {
    const { x0, xF, xR, rAt } = g;
    // The tube's walls and the bell (one outline), and the air inside.
    const wall = make();
    const N = 80;
    const xs = Array.from({ length: N + 1 }, (_, i) => x0 + ((xR - x0) * i) / N);
    xs.forEach((x, i) => (i === 0 ? wall.moveTo(x, -rAt(x) - 16) : wall.lineTo(x, -rAt(x) - 16)));
    for (let i = N; i >= 0; i--) wall.lineTo(xs[i], -rAt(xs[i]));
    wall.close();
    xs.forEach((x, i) => (i === 0 ? wall.moveTo(x, rAt(x) + 16) : wall.lineTo(x, rAt(x) + 16)));
    for (let i = N; i >= 0; i--) wall.lineTo(xs[i], rAt(xs[i]));
    wall.close();
    const air = make();
    xs.forEach((x, i) => (i === 0 ? air.moveTo(x, -rAt(x)) : air.lineTo(x, -rAt(x))));
    for (let i = N; i >= 0; i--) air.lineTo(xs[i], rAt(xs[i]));
    air.close();
    const rim = make();
    rim.moveTo(xR, -rAt(xR) - 16);
    rim.lineTo(xR, rAt(xR) + 16);
    // The mouthpiece cup and the lips.
    const cup = make();
    cup.moveTo(x0 - 80, -72);
    cup.cubicTo(x0 - 20, -72, x0 + 8, -44, x0 + 24, -42);
    cup.lineTo(x0 + 24, 42);
    cup.cubicTo(x0 + 8, 44, x0 - 20, 72, x0 - 80, 72);
    cup.close();
    const lipU = make();
    lipU.addRRect(Skia.RRectXY(Skia.XYWHRect(x0 - 140, -62, 70, 54), 26, 26));
    const lipL = make();
    lipL.addRRect(Skia.RRectXY(Skia.XYWHRect(x0 - 140, 8, 70, 54), 26, 26));
    // ① the buzz: breath arrows and puffs into the cup.
    const buzzA = make();
    arrow(buzzA, x0 - 135, -110, x0 - 100, -66, 22);
    for (const k of [0, 1, 2]) {
      buzzA.addCircle(x0 + 50 + k * 44, 0, 13 - k * 3);
    }
    // ② a pressure pulse travelling down the tube.
    const pulseP = make();
    const px = (x0 + xF) * 0.5;
    pulseP.addRRect(Skia.RRectXY(Skia.XYWHRect(px - 45, -g.tube + 2, 90, 2 * g.tube - 4), 10, 10));
    const pulseA = make();
    arrow(pulseA, px + 70, -g.tube - 50, px + 240, -g.tube - 50, 24);
    // ③ the standing wave: the pressure swing along the tube (a simplified
    // closed–open pattern: largest at the lips, near nothing at the bell),
    // and the reflection arrow back from the bell.
    const sw = make();
    const L = xR - x0;
    const n = 4;
    const k = ((2 * n - 1) * Math.PI) / (2 * L);
    for (let i = 0; i <= 160; i++) {
      const x = x0 + (L * i) / 160;
      const a = Math.abs(Math.cos(k * (x - x0))) * Math.min(rAt(x) - 4, g.tube * 0.85 + (x > xF ? (rAt(x) - g.tube) * 0.25 : 0));
      if (i === 0) sw.moveTo(x, -a);
      else sw.lineTo(x, -a);
    }
    for (let i = 160; i >= 0; i--) {
      const x = x0 + (L * i) / 160;
      const a = Math.abs(Math.cos(k * (x - x0))) * Math.min(rAt(x) - 4, g.tube * 0.85 + (x > xF ? (rAt(x) - g.tube) * 0.25 : 0));
      sw.lineTo(x, a);
    }
    sw.close();
    const back = make();
    arrow(back, xF + 20, g.tube + 60, xF - 240, g.tube + 60, 24);
    // ④ sound leaving the bell: wide arcs (the lows) and a forward beam (the highs).
    const lows = make();
    for (const r of [90, 170, 250]) {
      lows.addArc(Skia.XYWHRect(xR - r, -r, 2 * r, 2 * r), -100, 200);
    }
    const beam = make();
    beam.moveTo(xR + 16, -60);
    beam.lineTo(xR + 320, -100);
    beam.lineTo(xR + 320, 100);
    beam.lineTo(xR + 16, 60);
    beam.close();
    return { wall, air, rim, cup, lipU, lipL, buzzA, pulseP, pulseA, sw, back, lows, beam };
  }, [g]);
  const labels: StaticLabel[] = [
    { id: 'lips', text: 'LIPS', u: g.x0 - 105, v: -200, align: 'center', at: { u: g.x0 - 105, v: -62 } },
    { id: 'cup', text: 'CUP', u: g.x0 - 20, v: 190, align: 'center', at: { u: g.x0 - 20, v: 66 } },
    { id: 'tube', text: 'THE TUBE, UNWOUND', short: 'TUBE', u: (g.x0 + g.xF) / 2 - 60, v: -170, align: 'center', tone: 'muted' },
    { id: 'bell', text: 'BELL', u: g.xR - 90, v: -g.R - 70, align: 'center', at: { u: g.xR - 60, v: -g.rAt(g.xR - 60) - 16 } },
    ...(shown >= 2 && shown < 3 ? [{ id: 'pulse', text: 'PRESSURE WAVE →', short: 'WAVE →', u: (g.x0 + g.xF) / 2 + 130, v: -g.tube - 85, align: 'center' as const, tone: 'amber' as const }] : []),
    ...(shown >= 3 ? [{ id: 'stand', text: 'STANDING WAVE', short: 'STANDING', u: (g.x0 + g.xF) / 2, v: g.tube + 105, align: 'center' as const, tone: 'blue' as const }] : []),
    ...(shown >= 4 ? [{ id: 'lo', text: 'LOWS SPREAD', short: 'LOWS', u: g.xR - 40, v: -250, align: 'center' as const, tone: 'blue' as const }, { id: 'hi', text: 'HIGHS BEAM →', short: 'HIGHS →', u: g.xR + 170, v: 110, align: 'center' as const, tone: 'amber' as const }] : []),
  ];
  return (
    <Stage w={w} h={h} box={box} a11y={accessibilityLabel} labels={labels}>
      <Path path={p.air} color="rgba(111,168,255,0.10)" />
      <Group opacity={stand}>
        <Path path={p.sw} color="rgba(111,168,255,0.42)" />
        <Path path={p.sw} style="stroke" strokeWidth={2.5} color={BLUE} />
        <Path path={p.back} style="stroke" strokeWidth={9} color={BLUE} strokeCap="round" strokeJoin="round" />
      </Group>
      <Path path={p.wall}>
        <LinearGradient start={vec(0, -g.R)} end={vec(0, g.R)} colors={['#fff1bf', '#d2a443', '#8f6417', '#d2a443', '#7a5410']} />
      </Path>
      <Path path={p.wall} style="stroke" strokeWidth={3} color="#2c1d04" />
      <Path path={p.rim} style="stroke" strokeWidth={16} color="#ffe9a3" strokeCap="round" />
      <Path path={p.cup}>
        <LinearGradient start={vec(g.x0 - 80, -72)} end={vec(g.x0 + 24, 72)} colors={['#ffffff', '#c9ced6', '#7c828d']} />
      </Path>
      <Path path={p.cup} style="stroke" strokeWidth={1.6} color="#23262c" />
      <Path path={p.lipU}>
        <LinearGradient start={vec(g.x0 - 140, -62)} end={vec(g.x0 - 70, -8)} colors={['#e7b8a0', '#b97d65']} />
      </Path>
      <Path path={p.lipL}>
        <LinearGradient start={vec(g.x0 - 140, 8)} end={vec(g.x0 - 70, 62)} colors={['#e7b8a0', '#9d6550']} />
      </Path>
      <Group opacity={buzz}>
        <Path path={p.buzzA} style="stroke" strokeWidth={9} color={AMBER} strokeCap="round" strokeJoin="round" />
      </Group>
      <Group opacity={pulse}>
        <Path path={p.pulseP} color="rgba(255,198,77,0.55)" />
        <Path path={p.pulseA} style="stroke" strokeWidth={9} color={AMBER} strokeCap="round" strokeJoin="round" />
      </Group>
      <Group opacity={leave}>
        <Path path={p.lows} style="stroke" strokeWidth={8} color={AIR} opacity={0.75} />
        <Path path={p.beam} color="rgba(255,198,77,0.32)" />
        <Path path={p.beam} style="stroke" strokeWidth={3} color={AMBER} />
      </Group>
    </Stage>
  );
}

/* ── the tube's length: valves, or the slide and its envelope ── */

export function SlideEnvelope({ w, h, P, position, accessibilityLabel }: { w: number; h: number; P: HornPose; position: number; accessibilityLabel: string }) {
  const s = P.slide!;
  const box: ViewBox = { u0: -700, u1: 1050, v0: -260, v1: 420 };
  const groups = useMemo(() => hornGroups(P, PROJ.side).sort((a, b) => a.depth - b.depth), [P]);
  const [yU, yL] = s.legs;
  const r0 = (yL - yU) / 2;
  const env = useMemo(() => {
    // The swept outer slide and crook, 1st → 7th, shaded; each crook place dashed.
    const crook0 = s.crook.x - s.s;
    const band = make();
    band.addRRect(Skia.RRectXY(Skia.XYWHRect(s.outerFrom.x - s.s - 6, yU - 18, crook0 + SLIDE_POSITIONS[6] + r0 + 24 - (s.outerFrom.x - s.s - 6), yL - yU + 36), 30, 30));
    const ghosts = make();
    SLIDE_POSITIONS.forEach((t) => {
      const cx = crook0 + t;
      ghosts.addArc(Skia.XYWHRect(cx - r0, yU, 2 * r0, 2 * r0), -90, 180);
    });
    return { band, ghosts, crook0 };
  }, [s, yU, yL, r0]);
  const labels: StaticLabel[] = SLIDE_POSITIONS.map((t, i) => ({ id: `p${i}`, text: `${i + 1}`, u: env.crook0 + t + r0 + 4, v: yL + 60, align: 'center' as const, tone: (i + 1 === position ? 'amber' : 'muted') as StaticLabel['tone'] }));
  labels.push({ id: 'env', text: 'THE SLIDE’S PATH · 1st TO 7th', short: 'SLIDE PATH', u: env.crook0 + SLIDE_POSITIONS[3], v: yU - 120, align: 'center', tone: 'muted', at: { u: env.crook0 + SLIDE_POSITIONS[3], v: yU - 18 } });
  labels.push({ id: 'bell', text: 'BELL', u: -150, v: -200, align: 'center', at: { u: -60, v: -bellRadius(P.spec, -60) } });
  return (
    <Stage w={w} h={h} box={box} a11y={accessibilityLabel} labels={labels}>
      <Path path={env.band} color="rgba(138,143,156,0.16)" />
      <Path path={env.band} style="stroke" strokeWidth={2.5} color="#8a8f9c">
        <DashPathEffect intervals={[14, 10]} />
      </Path>
      {groups.map((g) => (
        <Group key={g.key}>
          {g.items.map((it, i) => (
            <PaintItem key={i} it={it} />
          ))}
        </Group>
      ))}
      <Path path={env.ghosts} style="stroke" strokeWidth={3} color={AMBER} opacity={0.55}>
        <DashPathEffect intervals={[8, 8]} />
      </Path>
    </Stage>
  );
}

/** The trumpet's tube, unwound: the open length, and the loop a valve adds (ideal). */
export function ValveTube({ w, h, P, semis, pressed, accessibilityLabel }: { w: number; h: number; P: HornPose; semis: number; pressed: readonly number[]; accessibilityLabel: string }) {
  const box: ViewBox = { u0: -560, u1: 260, v0: -230, v1: 330 };
  const groups = useMemo(() => hornGroups(P, PROJ.side).sort((a, b) => a.depth - b.depth), [P]);
  const added = Math.pow(2, semis / 12) - 1; // as a share of the open tube
  const bar = useMemo(() => {
    const x0 = -520;
    const L = 600;
    const base = make();
    base.addRRect(Skia.RRectXY(Skia.XYWHRect(x0, 220, L, 26), 13, 13));
    const add = make();
    if (added > 0) add.addRRect(Skia.RRectXY(Skia.XYWHRect(x0 + L, 220, Math.max(8, L * added), 26), 13, 13));
    const glow = make();
    // The valve slides each pressed valve brings in.
    const ids: string[] = pressed.map((k) => (k === 1 ? 'slide1' : k === 2 ? 'slide2' : 'slide3'));
    for (const t of P.tubes.filter((tt) => ids.includes(tt.id))) {
      t.pts.forEach((q, i) => (i === 0 ? glow.moveTo(q.x, q.y) : glow.lineTo(q.x, q.y)));
    }
    return { base, add, glow, x0, L };
  }, [P, added, pressed]);
  const labels: StaticLabel[] = [
    { id: 'open', text: 'THE TUBE, UNWOUND', short: 'TUBE', u: bar.x0 + bar.L / 2, v: 290, align: 'center', tone: 'muted' },
    ...(added > 0 ? [{ id: 'add', text: `+ ${Math.round(added * 100)} %`, u: bar.x0 + bar.L + (bar.L * added) / 2 + 10, v: 180, align: 'center' as const, tone: 'amber' as const }] : []),
    { id: 'valves', text: pressed.length ? `VALVE${pressed.length > 1 ? 'S' : ''} ${pressed.join(' + ')}` : 'NO VALVE PRESSED', short: 'VALVES', u: P.valves[1].c.x, v: -190, align: 'center', tone: pressed.length ? 'amber' : 'muted', at: { u: P.valves[1].button.x, v: P.valves[1].button.y } },
  ];
  return (
    <Stage w={w} h={h} box={box} a11y={accessibilityLabel} labels={labels}>
      {groups.map((g) => (
        <Group key={g.key}>
          {g.items.map((it, i) => (
            <PaintItem key={i} it={it} />
          ))}
        </Group>
      ))}
      <Path path={bar.glow} style="stroke" strokeWidth={16} color={AMBER} opacity={0.55} strokeCap="round" strokeJoin="round" />
      <Path path={bar.base}>
        <LinearGradient start={vec(0, 220)} end={vec(0, 246)} colors={['#fff1bf', '#d2a443', '#7a5410']} />
      </Path>
      <Path path={bar.add} color={AMBER} />
    </Stage>
  );
}

/* ── from the bell: radiation by band (a simplified picture) ── */

export function BellRadiation({ w, h, P, band, deg, accessibilityLabel }: { w: number; h: number; P: HornPose; band: Band; deg: number; accessibilityLabel: string }) {
  const box: ViewBox = { u0: -820, u1: 900, v0: -620, v1: 620 };
  const d = P.spec.bell.mm;
  const horn = useMemo(() => hornGroups(P, PROJ.top).sort((a, b) => a.depth - b.depth), [P]);
  const shapes = useMemo(() => {
    const path = (b: Band, scaleR: number) => {
      const p = make();
      for (let i = 0; i <= 180; i++) {
        const a = (i / 180) * 2 * Math.PI;
        const r = lobe(b, (a * 180) / Math.PI, d) * scaleR;
        const x = r * Math.cos(a);
        const y = r * Math.sin(a);
        if (i === 0) p.moveTo(x, y);
        else p.lineTo(x, y);
      }
      p.close();
      return p;
    };
    return { low: path('low', 520), mid: path('mid', 520), high: path('high', 520) };
  }, [d]);
  const a = (deg * Math.PI) / 180;
  const mic = { x: 600 * Math.cos(a), z: -600 * Math.sin(a) };
  const micP = useMemo(() => {
    const p = make();
    p.moveTo(0, 0);
    p.lineTo(mic.x, mic.z);
    return p;
  }, [mic.x, mic.z]);
  const micBody = useMemo(() => {
    const p = make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(-16, -16, 90, 32), 16, 16));
    return p;
  }, []);
  const col = band === 'low' ? BLUE : band === 'mid' ? '#b9a6ff' : AMBER;
  const fill = band === 'low' ? 'rgba(111,168,255,0.22)' : band === 'mid' ? 'rgba(185,166,255,0.22)' : 'rgba(255,198,77,0.25)';
  const head = P.player.head;
  const labels: StaticLabel[] = [
    { id: 'axis', text: 'BELL’S AXIS →', short: 'AXIS →', u: 700, v: 40, align: 'center', tone: 'muted' },
    { id: 'player', text: 'PLAYER', u: head.x, v: head.z + 180, align: 'center', tone: 'muted' },
    { id: 'mic', text: 'A MIC HERE', short: 'MIC', u: mic.x, v: mic.z - 70, align: 'center', tone: 'amber' },
  ];
  return (
    <Stage w={w} h={h} box={box} a11y={accessibilityLabel} labels={labels}>
      {(['low', 'mid', 'high'] as const).map((b) => (b === band ? null : <Path key={b} path={shapes[b]} style="stroke" strokeWidth={2} color="#8a8f9c" opacity={0.45} />))}
      <Path path={shapes[band]} color={fill} />
      <Path path={shapes[band]} style="stroke" strokeWidth={5} color={col} />
      <Group opacity={0.85}>
        {horn.map((g) => (
          <Group key={g.key}>
            {g.items.map((it, i) => (
              <PaintItem key={i} it={it} />
            ))}
          </Group>
        ))}
      </Group>
      {/* The player at the mouthpiece, from above: no body is drawn here, so
          the head is the owner's ABOVE head icon (head fix 2026-10-08 — a
          lone head), its face toward the horn (+u). The width of a ~230 mm
          head; the stroke kept ≥ ~1 px at this plan's scale. */}
      <HeadIcon view="above" x={head.x} y={head.z} size={P.player.headR * 2.3} rotation={aboveRotation(1, 0)} plate minStroke={6} />
      <Path path={micP} style="stroke" strokeWidth={2.5} color={AMBER} opacity={0.7}>
        <DashPathEffect intervals={[12, 10]} />
      </Path>
      <Group transform={[{ translateX: mic.x }, { translateY: mic.z }, { rotate: Math.atan2(mic.z, mic.x) }]}>
        <Path path={micBody}>
          <LinearGradient start={vec(-16, -16)} end={vec(74, 16)} colors={['#e8ebf0', '#8d939e', '#3b3f47']} />
        </Path>
        <Path path={micBody} style="stroke" strokeWidth={2} color="#0b0c0f" />
      </Group>
    </Stage>
  );
}

/* ── a mute in the bell ── */

export type MuteId = 'open' | 'straight' | 'cup' | 'harmon' | 'plunger';

export function MuteView({ w, h, P, mute, accessibilityLabel }: { w: number; h: number; P: HornPose; mute: MuteId; accessibilityLabel: string }) {
  const spec = P.spec;
  const R = spec.bell.mm / 2;
  const F = spec.flare.mm;
  const box: ViewBox = { u0: -F * 0.95, u1: R * 2.6, v0: -R * 1.75, v1: R * 1.75 };
  // The bell alone, from the side, level (frame H drawn straight: the mute sits on its axis).
  const bell = useMemo(() => {
    const prof = bellProfile(spec, 40);
    const p = make();
    prof.forEach(([x, r], i) => (i === 0 ? p.moveTo(x, -r) : p.lineTo(x, -r)));
    for (let i = prof.length - 1; i >= 0; i--) p.lineTo(prof[i][0], prof[i][1]);
    p.close();
    const rim = make();
    rim.moveTo(0, -R - 2);
    rim.lineTo(0, R + 2);
    const throat = make();
    // The inside of the flare seen through the cut half (the near wall removed).
    prof.forEach(([x, r], i) => (i === 0 ? throat.moveTo(x, -r + 3) : throat.lineTo(x, -r + 3)));
    for (let i = prof.length - 1; i >= 0; i--) throat.lineTo(prof[i][0], prof[i][1] - 3);
    throat.close();
    return { p, rim, throat };
  }, [spec, R]);
  const m = useMemo(() => {
    const body = make();
    const extra = make();
    const corks = make();
    const hand = make();
    const shine = make();
    const k = R / 61.5; // trumpet = 1
    if (mute === 'straight' || mute === 'cup') {
      // A truncated cone from deep in the bell out past the rim (drawing default).
      const xa = -F * 0.55;
      const xb = 60 * k;
      body.moveTo(xa, -bellRadius(spec, xa) * 0.55);
      body.lineTo(xb, -R * 0.78);
      body.lineTo(xb + 10 * k, -R * 0.74);
      body.lineTo(xb + 10 * k, R * 0.74);
      body.lineTo(xb, R * 0.78);
      body.lineTo(xa, bellRadius(spec, xa) * 0.55);
      body.close();
      // Spun aluminium (real-world, trumpet: about 150 mm long, the closed
      // end about dia. 95 mm): a sheen line along the upper flank, the
      // turned edge of the closed end.
      const ra = bellRadius(spec, xa) * 0.55;
      shine.moveTo(xa + 8, -ra * 0.6);
      shine.lineTo(xb - 4 * k, -R * 0.78 * 0.62);
      shine.moveTo(xb + 3 * k, -R * 0.7);
      shine.lineTo(xb + 3 * k, R * 0.7);
      for (const s of [-1, 1]) {
        const x = -F * 0.32;
        const r = bellRadius(spec, x);
        corks.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 22 * k, s > 0 ? r - 9 : -r, 44 * k, 9), 3, 3));
      }
      if (mute === 'cup') {
        // The cup facing back toward the bell, just past the rim.
        extra.moveTo(xb - 8 * k, -R * 0.98);
        extra.cubicTo(xb + 40 * k, -R * 1.05, xb + 52 * k, -R * 0.5, xb + 52 * k, 0);
        extra.cubicTo(xb + 52 * k, R * 0.5, xb + 40 * k, R * 1.05, xb - 8 * k, R * 0.98);
        extra.lineTo(xb + 2 * k, R * 0.92);
        extra.cubicTo(xb + 30 * k, R * 0.85, xb + 38 * k, R * 0.4, xb + 38 * k, 0);
        extra.cubicTo(xb + 38 * k, -R * 0.4, xb + 30 * k, -R * 0.85, xb + 2 * k, -R * 0.92);
        extra.close();
      }
    } else if (mute === 'harmon') {
      // A bulb sealed by a cork ring in the bell, a stem through its centre.
      const xa = -F * 0.3;
      const ra = bellRadius(spec, xa);
      body.moveTo(xa, -ra + 4);
      body.cubicTo(xa + 40 * k, -R * 0.95, 40 * k, -R * 0.95, 60 * k, -R * 0.55);
      body.lineTo(70 * k, -R * 0.2);
      body.lineTo(70 * k, R * 0.2);
      body.lineTo(60 * k, R * 0.55);
      body.cubicTo(40 * k, R * 0.95, xa + 40 * k, R * 0.95, xa, ra - 4);
      body.close();
      corks.addRect(Skia.XYWHRect(xa - 6, -ra, 12, 2 * ra));
      extra.addRect(Skia.XYWHRect(30 * k, -7 * k, 95 * k, 14 * k));
      extra.addOval(Skia.XYWHRect(118 * k, -22 * k, 18 * k, 44 * k));
    } else if (mute === 'plunger') {
      // A rubber cup held in front of the rim by the left hand (drawing default Ø 140 on a trumpet).
      const rc = 70 * k;
      body.moveTo(36 * k, -rc);
      body.cubicTo(70 * k, -rc * 0.9, 84 * k, -rc * 0.4, 84 * k, 0);
      body.cubicTo(84 * k, rc * 0.4, 70 * k, rc * 0.9, 36 * k, rc);
      body.lineTo(30 * k, rc * 0.92);
      body.cubicTo(60 * k, rc * 0.8, 70 * k, rc * 0.35, 70 * k, 0);
      body.cubicTo(70 * k, -rc * 0.35, 60 * k, -rc * 0.8, 30 * k, -rc * 0.92);
      body.close();
      hand.addRRect(Skia.RRectXY(Skia.XYWHRect(80 * k, -34 * k, 70 * k, 68 * k), 30 * k, 30 * k));
      hand.addRRect(Skia.RRectXY(Skia.XYWHRect(140 * k, -18 * k, 90 * k, 36 * k), 18 * k, 18 * k));
    }
    return { body, extra, corks, hand, shine };
  }, [mute, spec, F, R]);
  const metal = mute === 'plunger' ? ['#a3362a', '#6e1f17', '#3a0d09'] : ['#f6f8fb', '#b8bec8', '#6b717c'];
  const labels: StaticLabel[] = [
    { id: 'bell', text: 'BELL', u: -F * 0.5, v: -R * 1.45, align: 'center', at: { u: -F * 0.5, v: -bellRadius(spec, -F * 0.5) } },
    { id: 'rim', text: 'RIM', u: R * 0.2, v: -R * 1.45, align: 'center', at: { u: 0, v: -R } },
    ...(mute !== 'open' ? [{ id: 'mute', text: mute === 'plunger' ? 'PLUNGER · HAND' : `${mute.toUpperCase()} MUTE`, short: 'MUTE', u: R * 1.4, v: R * 1.35, align: 'center' as const, tone: 'amber' as const, at: { u: R * 0.9, v: R * 0.6 } }] : []),
  ];
  return (
    <Stage w={w} h={h} box={box} a11y={accessibilityLabel} labels={labels}>
      <Path path={bell.p}>
        <LinearGradient start={vec(0, -R)} end={vec(0, R)} colors={['#fff3c2', '#f2cc66', '#cf9f38', '#8f6417', '#4f3407']} />
      </Path>
      <Path path={bell.throat} color="rgba(40,26,6,0.55)" />
      <Path path={bell.p} style="stroke" strokeWidth={2} color="#2c1d04" />
      <Path path={bell.rim} style="stroke" strokeWidth={7} color="#ffe9a3" strokeCap="round" />
      {mute !== 'open' ? (
        <>
          <Path path={m.body}>
            <LinearGradient start={vec(0, -R)} end={vec(0, R)} colors={metal} />
          </Path>
          <Path path={m.shine} style="stroke" strokeWidth={2.4} color="#ffffff" opacity={0.7} strokeCap="round" />
          <Path path={m.body} style="stroke" strokeWidth={2} color="#15171b" />
          <Path path={m.extra}>
            <LinearGradient start={vec(0, -R)} end={vec(0, R)} colors={mute === 'cup' ? ['#e9edf2', '#9aa1ad', '#4d535e'] : ['#f6f8fb', '#b8bec8', '#6b717c']} />
          </Path>
          <Path path={m.extra} style="stroke" strokeWidth={1.6} color="#15171b" />
          <Path path={m.corks} color="#b8875a" />
          <Path path={m.hand}>
            <LinearGradient start={vec(0, -40)} end={vec(0, 40)} colors={['#e2bfa3', '#b98d6f', '#7d5a45']} />
          </Path>
        </>
      ) : null}
    </Stage>
  );
}
