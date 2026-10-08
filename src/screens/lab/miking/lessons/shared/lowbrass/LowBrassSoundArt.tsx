/**
 * THE LOW / COILED BRASS FAMILY — HOW IT SOUNDS, drawn (LESSON_JOURNEY §6
 * stage 2, §7 "air columns"). FULLY SILENT: nothing here plays, and nothing
 * loops (D8) — every picture is stepped, or dragged by hand.
 *
 *   BuzzSequence  the family's own scene (LowBrassArt) under a numbered
 *                 EXPLANATORY OVERLAY revealed by `reveal` (1 … n): ① the lips
 *                 buzz in the mouthpiece; ② a pressure pulse runs down the
 *                 coiled tube; ③ at the bell part of it turns back, and the
 *                 to-and-fro sets up the standing wave that holds the note;
 *                 ④ sound leaves from the bell; ⑤ (the horn) the wall behind
 *                 sends it on toward the audience. Arrows show ORDER and
 *                 DIRECTION, never a speed or a level.
 *   AirColumn     the tube unrolled: the IDEAL closed–open pipe's pressure
 *                 shape n (airColumn.ts), its still points, + and − halves,
 *                 swung by hand. Said once: a simplified pipe.
 *   BellSpread    WHERE the sound leaves: arcs all round the bell for the low
 *                 notes, a narrowing cone along its axis for the higher ones —
 *                 the measured brass trend as a picture of where, not how
 *                 much. The horn's version is a plan with the rear WALL: the
 *                 direct and the reflected path to a listener in front, their
 *                 lengths and the delay computed (airColumn.reflection).
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { Vec3, ViewBox } from '../../../engine/model/types.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { add, scale } from '../../../engine/geometry/vec.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { LowBrassScene, prj } from './LowBrassArt';
import { HeadIcon, aboveRotation } from '../../../../../../features/lab/headIcons';
import { basis, type BrassScene } from './lowBrassScene.ts';
import { pipeShape, reflection, spreadHalfAngle, stillPoints, type Register } from './airColumn.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const AMBER = '#ffc64d';
const AIR = '#9cc4ff';
const RED = '#ff7a6b';
const BLUE = '#6fa8ff';

function arrow(p: SkPath, x0: number, y0: number, x1: number, y1: number, head = 26) {
  p.moveTo(x0, y0);
  p.lineTo(x1, y1);
  const a = Math.atan2(y1 - y0, x1 - x0);
  p.moveTo(x1 - head * Math.cos(a - 0.45), y1 - head * Math.sin(a - 0.45));
  p.lineTo(x1, y1);
  p.lineTo(x1 - head * Math.cos(a + 0.45), y1 - head * Math.sin(a + 0.45));
}
/** Arcs round (cx, cy) between angles a0..a1 (deg, screen: 0 = +u, +v down). */
function arcs(p: SkPath, cx: number, cy: number, radii: number[], a0: number, a1: number) {
  for (const r of radii) p.addArc(Skia.XYWHRect(cx - r, cy - r, 2 * r, 2 * r), a0, a1 - a0);
}
const clamp01 = (x: number) => {
  'worklet';
  return Math.max(0, Math.min(1, x));
};

/** A path along projected 3-D points. */
function along(pts: Vec3[], view: 'side' | 'top'): SkPath {
  const p = make();
  pts.forEach((q, i) => {
    const [u, w] = prj(view, q);
    if (i === 0) p.moveTo(u, w);
    else p.lineTo(u, w);
  });
  return p;
}

/** The scene's model box for the side view, with room round the bell. */
export function sceneBox(s: BrassScene, pad = 220): ViewBox {
  const b = s.bell;
  const xs = [s.J.toeR.x, s.chair.back.min.x, b.rim.x - b.R, b.rim.x + b.R, s.J.head.x - s.J.headR];
  const ys = [s.J.head.y - s.J.headR, b.rim.y - b.R, 0];
  return { u0: Math.min(...xs) - pad, u1: Math.max(...xs) + pad, v0: Math.min(...ys) - pad, v1: 40 };
}

/* ── ① – ⑤ ── */
export function BuzzSequence({ w, h, s, reveal, shown, n, wall, accessibilityLabel }: { w: number; h: number; s: BrassScene; reveal: SharedValue<number>; shown: number; n: number; wall: boolean; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const box = useMemo(() => {
    const b = sceneBox(s, 260);
    return wall ? { ...b, u0: b.u0 - 300 } : b;
  }, [s, wall]);
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h, box]);
  const b = s.bell;
  const o = useMemo(() => {
    const lips = s.J.mouth;
    const lead = s.tubes.find((t) => t.id === 'leadpipe')!;
    const coil = s.tubes.find((t) => t.id === 'coil1' || t.id === 'bellBranch')!;
    const runPts = [...lead.pts, ...coil.pts.slice(0, Math.floor(coil.pts.length * (s.spec.id === 'horn' ? 0.8 : 1)))];
    const run = along(runPts, 'side');
    const runArrows = make();
    for (const f of [0.3, 0.62, 0.92]) {
      const i = Math.min(runPts.length - 2, Math.floor(runPts.length * f));
      const [u0, v0] = prj('side', runPts[i]);
      const [u1, v1] = prj('side', runPts[i + 1]);
      const a = Math.atan2(v1 - v0, u1 - u0);
      arrow(runArrows, u1 - 40 * Math.cos(a), v1 - 40 * Math.sin(a), u1, v1, 24);
    }
    // ③ at the bell: a pulse goes out, part of it turns back up the tube.
    const [ru, rv] = prj('side', b.rim);
    const [tu, tv] = prj('side', b.throat);
    const ax = Math.atan2(rv - tv, ru - tu);
    const turn = make();
    const mid = { u: (ru + tu) / 2, v: (rv + tv) / 2 };
    const nx = -Math.sin(ax);
    const ny = Math.cos(ax);
    arrow(turn, mid.u + nx * 34 + Math.cos(ax) * 60, mid.v + ny * 34 + Math.sin(ax) * 60, mid.u + nx * 34 - Math.cos(ax) * 70, mid.v + ny * 34 - Math.sin(ax) * 70, 24);
    // ④ arcs leaving the bell along its axis (in the view).
    const out = make();
    const deg = (ax * 180) / Math.PI;
    arcs(out, ru, rv, [b.R + 70, b.R + 150, b.R + 230], deg - 55, deg + 55);
    // ⑤ the wall behind (the horn) and the reflected way to the audience.
    const wallX = box.u0 + 160;
    const wallP = make();
    wallP.moveTo(wallX, box.v0 + 60);
    wallP.lineTo(wallX, 0);
    const hatch = make();
    for (let y = box.v0 + 80; y < 0; y += 70) {
      hatch.moveTo(wallX, y);
      hatch.lineTo(wallX - 60, y + 50);
    }
    const bounce = make();
    if (wall) {
      const hitY = rv + 60;
      arrow(bounce, ru - 60, rv + 10, wallX + 12, hitY, 22);
      arrow(bounce, wallX + 12, hitY, wallX + 520, hitY - 330, 26);
      arrow(bounce, wallX + 12, hitY, wallX + 560, hitY + 150, 26);
    }
    const marks = [prj('side', lips), prj('side', runPts[Math.floor(runPts.length * 0.5)]), [mid.u + nx * 34, mid.v + ny * 34], [ru + Math.cos(ax) * (b.R + 120), rv + Math.sin(ax) * (b.R + 120)], [wallX + 90, rv - 160]] as [number, number][];
    return { run, runArrows, turn, out, wallP, hatch, bounce, marks, lipsUV: prj('side', lips) };
  }, [s, b, box, wall]);

  // One fade per event (a fixed number of hooks: five events at most).
  const o1 = useDerivedValue(() => clamp01(reveal.value));
  const o2 = useDerivedValue(() => clamp01(reveal.value - 1));
  const o3 = useDerivedValue(() => clamp01(reveal.value - 2));
  const o4 = useDerivedValue(() => clamp01(reveal.value - 3));
  const o5 = useDerivedValue(() => clamp01(reveal.value - 4));
  const dimRun = useDerivedValue(() => (reveal.value >= 3 ? 0.45 : 1) * clamp01(reveal.value - 1));
  const labels: StaticLabel[] = [];
  const word = ['① LIPS BUZZ', '② PULSE RUNS DOWN THE TUBE', '③ PART TURNS BACK AT THE BELL', '④ SOUND LEAVES THE BELL', '⑤ THE WALL SENDS IT ON'];
  const at = o.marks;
  for (let i = 0; i < Math.min(n, shown); i++) {
    const [u, w2] = at[i];
    labels.push({ id: `e${i}`, text: word[i], short: word[i].split(' ')[0], u: i === 0 ? u + 60 : u, v: i === 0 ? w2 - 160 : w2 - 90, align: i === 0 ? 'left' : 'center', tone: i === shown - 1 ? 'amber' : 'muted', at: { u, v: w2 } });
  }
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Floor box={box} />
          <LowBrassScene s={s} view="side" dim={0.9} />
          {/* ① the lips */}
          <Group opacity={o1}>
            <Circle cx={o.lipsUV[0]} cy={o.lipsUV[1]} r={34} color={AMBER} opacity={0.35} />
            <Circle cx={o.lipsUV[0]} cy={o.lipsUV[1]} r={34} style="stroke" strokeWidth={5} color={AMBER} />
          </Group>
          {/* ② down the tube */}
          <Group opacity={dimRun}>
            <Path path={o.run} style="stroke" strokeWidth={10} color={AIR} opacity={0.75} strokeCap="round" strokeJoin="round">
              <DashPathEffect intervals={[26, 18]} />
            </Path>
          </Group>
          <Group opacity={o2}>
            <Path path={o.runArrows} style="stroke" strokeWidth={7} color={AIR} strokeCap="round" />
          </Group>
          {/* ③ part turns back */}
          <Group opacity={o3}>
            <Path path={o.turn} style="stroke" strokeWidth={7} color={RED} strokeCap="round" />
          </Group>
          {/* ④ out of the bell */}
          <Group opacity={o4}>
            <Path path={o.out} style="stroke" strokeWidth={7} color={AMBER} opacity={0.9} strokeCap="round" />
          </Group>
          {/* ⑤ the wall */}
          {wall ? (
            <Group opacity={o5}>
              <Path path={o.wallP} style="stroke" strokeWidth={14} color="#7d818c" />
              <Path path={o.hatch} style="stroke" strokeWidth={4} color="#7d818c" opacity={0.7} />
              <Path path={o.bounce} style="stroke" strokeWidth={7} color={AMBER} strokeCap="round" />
            </Group>
          ) : null}
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

function Floor({ box }: { box: ViewBox }) {
  const p = useMemo(() => {
    const q = make();
    q.addRect(Skia.XYWHRect(box.u0, 0, box.u1 - box.u0, 40));
    return q;
  }, [box]);
  return (
    <Path path={p}>
      <LinearGradient start={vec(0, 0)} end={vec(0, 40)} colors={['#2a2b30', '#121316']} />
    </Path>
  );
}

/* ── the air column, unrolled ── */
const TUBE_L = 1000;
const TUBE_R = 34;
const BELL_L = 260;
const AMP = 120;
/** The unrolled tube's model box (mm of the drawing). */
const COL_BOX: ViewBox = { u0: -150, u1: TUBE_L + 210, v0: -260, v1: 260 };

export function AirColumn({ w, h, n, swing, accessibilityLabel }: { w: number; h: number; n: number; swing: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', COL_BOX, w, h, 6), [w, h]);
  const tube = useMemo(() => {
    // The tube: straight, then a flaring bell over its last BELL_L.
    const top: [number, number][] = [];
    const N = 60;
    for (let i = 0; i <= N; i++) {
      const x = (TUBE_L * i) / N;
      const t = Math.max(0, (x - (TUBE_L - BELL_L)) / BELL_L);
      top.push([x, -(TUBE_R + 150 * Math.pow(t, 3))]);
    }
    const p = make();
    top.forEach(([x, y], i) => (i === 0 ? p.moveTo(x, y) : p.lineTo(x, y)));
    for (let i = top.length - 1; i >= 0; i--) p.lineTo(top[i][0], -top[i][1]);
    p.close();
    const mouth = make();
    mouth.addRRect(Skia.RRectXY(Skia.XYWHRect(-70, -TUBE_R - 18, 80, 2 * TUBE_R + 36), 14, 14));
    return { p, mouth };
  }, []);
  const wave = useMemo(() => {
    const pos = make();
    const neg = make();
    const line = make();
    const N = 160;
    const pts: [number, number][] = [];
    for (let i = 0; i <= N; i++) {
      const x = i / N;
      pts.push([x * TUBE_L, -AMP * swing * pipeShape(n, x)]);
    }
    pts.forEach(([x, y], i) => (i === 0 ? line.moveTo(x, y) : line.lineTo(x, y)));
    // + and − regions (filled between the curve and the rest line).
    const fill = (sign: number, p: SkPath) => {
      let open = false;
      for (let i = 0; i <= N; i++) {
        const [x, y] = pts[i];
        const inSide = sign * -y > 0.5;
        if (inSide && !open) {
          p.moveTo(x, 0);
          open = true;
        }
        if (open) p.lineTo(x, y);
        if (open && (!inSide || i === N)) {
          p.lineTo(x, 0);
          p.close();
          open = false;
        }
      }
    };
    fill(1, pos);
    fill(-1, neg);
    return { pos, neg, line };
  }, [n, swing]);
  const nodes = stillPoints(n);
  const labels: StaticLabel[] = [
    { id: 'lips', text: 'LIPS · MOUTHPIECE', short: 'LIPS', u: -70, v: -150, align: 'left', at: { u: -30, v: -TUBE_R - 18 } },
    { id: 'bell', text: 'BELL (OPEN END)', short: 'BELL', u: TUBE_L + 60, v: -235, align: 'right', at: { u: TUBE_L, v: -TUBE_R - 150 } },
    { id: 'rest', text: 'AT REST', u: TUBE_L * 0.5, v: 210, align: 'center', tone: 'muted' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Path path={tube.p}>
            <LinearGradient start={vec(0, -200)} end={vec(0, 200)} colors={['#f2cf6e', '#c99634', '#8a5f17', '#4a300a']} />
          </Path>
          <Path path={tube.p} color="#0b0c10" opacity={0.72} />
          <Path path={tube.p} style="stroke" strokeWidth={4} color="#c99634" />
          <Path path={tube.mouth}>
            <LinearGradient start={vec(-70, -60)} end={vec(10, 60)} colors={['#ffffff', '#aeb4bd', '#5a606b']} />
          </Path>
          <Path path={wave.pos} color={AMBER} opacity={0.32} />
          <Path path={wave.neg} color={BLUE} opacity={0.32} />
          <Path path={(() => { const q = make(); q.moveTo(0, 0); q.lineTo(TUBE_L, 0); return q; })()} style="stroke" strokeWidth={2.5} color="#9aa1ad" opacity={0.7}>
            <DashPathEffect intervals={[14, 10]} />
          </Path>
          <Path path={wave.line} style="stroke" strokeWidth={6} color={AMBER} strokeCap="round" />
          {nodes.map((x) => (
            <Circle key={x} cx={x * TUBE_L} cy={0} r={14} color="#ffffff" />
          ))}
          <Circle cx={0} cy={0} r={18} style="stroke" strokeWidth={5} color={RED} />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/* ── where it leaves: the bell's spread (side view) ── */
export function BellSpread({ w, h, s, register, accessibilityLabel }: { w: number; h: number; s: BrassScene; register: Register; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const box = useMemo(() => sceneBox(s, 560), [s]);
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h, box]);
  const b = s.bell;
  const p = useMemo(() => spreadArcs(b, register), [b, register]);
  const [ru, rv] = prj('side', b.rim);
  const labels: StaticLabel[] = [{ id: 'reg', text: register === 'low' ? 'LOW NOTES: ALL ROUND' : register === 'mid' ? 'MIDDLE: WIDER IN FRONT OF THE BELL' : 'HIGH OVERTONES: ALONG THE BELL’S AXIS', short: register.toUpperCase(), u: ru, v: rv - b.R - 420, align: 'center', tone: 'amber' }];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Floor box={box} />
          <LowBrassScene s={s} view="side" dim={0.92} />
          <Path path={p} style="stroke" strokeWidth={7} color={AMBER} opacity={0.85} strokeCap="round" />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/** Arcs round the rim: all round for LOW, a cone about the axis otherwise. */
function spreadArcs(b: BrassScene['bell'], register: Register): SkPath {
  const p = make();
  const half = spreadHalfAngle(register);
  const [ru, rv] = prj('side', b.rim);
  const tip = prj('side', add(b.rim, scale(b.axis, 100)));
  const deg = (Math.atan2(tip[1] - rv, tip[0] - ru) * 180) / Math.PI;
  const radii = [b.R + 90, b.R + 190, b.R + 290];
  if (half >= 180) for (const r of radii) p.addCircle(ru, rv, r);
  else arcs(p, ru, rv, radii, deg - half, deg + half);
  return p;
}

/* ── the horn and the wall: a plan ── */
/** The listener in front of the player (an audience seat), lesson frame. */
export const LISTENER: Vec3 = { x: 2200, y: -1150, z: 0 };

export function HornWallPlan({ w, h, s, wallBehind, register, accessibilityLabel }: { w: number; h: number; s: BrassScene; wallBehind: number; register: Register; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const wallX = s.chair.back.min.x - wallBehind;
  const box: ViewBox = useMemo(() => ({ u0: s.chair.back.min.x - 2650, u1: LISTENER.x + 380, v0: -1050, v1: 1150 }), [s]);
  const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h, box]);
  const b = s.bell;
  const r = reflection(b.rim, LISTENER, wallX);
  const paths = useMemo(() => {
    const [bu, bz] = prj('top', b.rim);
    const direct = make();
    direct.moveTo(bu, bz);
    direct.lineTo(LISTENER.x, LISTENER.z);
    const refl = make();
    refl.moveTo(bu, bz);
    refl.lineTo(r.hit.x, r.hit.z);
    refl.lineTo(LISTENER.x, LISTENER.z);
    const reflArrow = make();
    arrow(reflArrow, (r.hit.x + LISTENER.x) / 2 - 200, (r.hit.z + LISTENER.z) / 2 - (LISTENER.z - r.hit.z) * 0.05, (r.hit.x + LISTENER.x) / 2, (r.hit.z + LISTENER.z) / 2, 60);
    const wall = make();
    wall.moveTo(wallX, box.v0 + 120);
    wall.lineTo(wallX, box.v1 - 120);
    const hatch = make();
    for (let z = box.v0 + 140; z < box.v1 - 140; z += 120) {
      hatch.moveTo(wallX, z);
      hatch.lineTo(wallX - 110, z + 90);
    }
    // The bell's spread in plan (a picture of where).
    const spread = make();
    const half = spreadHalfAngle(register);
    const tip = prj('top', add(b.rim, scale(b.axis, 100)));
    const deg = (Math.atan2(tip[1] - bz, tip[0] - bu) * 180) / Math.PI;
    const radii = [b.R + 160, b.R + 360, b.R + 560];
    if (half >= 180) for (const q of radii) spread.addCircle(bu, bz, q);
    else arcs(spread, bu, bz, radii, deg - half, deg + half);
    return { direct, refl, reflArrow, wall, hatch, spread };
  }, [b, r.hit.x, r.hit.z, wallX, box, register]);
  const labels: StaticLabel[] = [
    { id: 'wall', text: `WALL · ${(wallBehind / 1000).toFixed(1)} m BEHIND THE CHAIR`, short: 'WALL', u: wallX + 40, v: box.v0 + 170, align: 'left', tone: 'muted' },
    { id: 'you', text: 'LISTENER IN FRONT', short: 'LISTENER', u: LISTENER.x, v: LISTENER.z + 280, align: 'center', at: { u: LISTENER.x, v: LISTENER.z + 110 } },
    { id: 'refl', text: 'BY THE WALL', u: r.hit.x + 140, v: r.hit.z + 260, align: 'left', tone: 'amber' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Path path={(() => { const q = make(); q.addRect(Skia.XYWHRect(box.u0, box.v0, box.u1 - box.u0, box.v1 - box.v0)); return q; })()}>
            <LinearGradient start={vec(box.u0, box.v0)} end={vec(box.u1, box.v1)} colors={['#1d1e22', '#121316']} />
          </Path>
          <Path path={paths.hatch} style="stroke" strokeWidth={8} color="#7d818c" opacity={0.6} />
          <Path path={paths.wall} style="stroke" strokeWidth={26} color="#8a8f9c" />
          <LowBrassScene s={s} view="top" />
          <Path path={paths.spread} style="stroke" strokeWidth={12} color={AMBER} opacity={0.55} strokeCap="round" />
          <Path path={paths.direct} style="stroke" strokeWidth={10} color="#c9ced8" opacity={0.7}>
            <DashPathEffect intervals={[50, 34]} />
          </Path>
          <Path path={paths.refl} style="stroke" strokeWidth={12} color={AMBER} opacity={0.95} strokeJoin="round" />
          <Path path={paths.reflArrow} style="stroke" strokeWidth={12} color={AMBER} strokeCap="round" />
          {/* The listener: the owner's ABOVE head icon facing the player (−u)
              — head fix 2026-10-08, a lone head in a plan, never a circle. */}
          <HeadIcon view="above" x={LISTENER.x} y={LISTENER.z} size={230} rotation={aboveRotation(-1, 0)} color="#c9ced8" plate minStroke={1.3 / xf.s} />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/** The bell's opening in its own plane (for the tests: the rim's points). */
export function rimPoints(s: BrassScene, n = 24): Vec3[] {
  const [e1, e2] = basis(s.bell.axis, { x: 0, y: -1, z: 0 });
  const out: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI;
    out.push(add(s.bell.rim, add(scale(e1, s.bell.R * Math.cos(a)), scale(e2, s.bell.R * Math.sin(a)))));
  }
  return out;
}
