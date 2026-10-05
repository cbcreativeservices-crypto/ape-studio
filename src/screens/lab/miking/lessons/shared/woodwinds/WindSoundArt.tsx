/**
 * HOW IT SOUNDS for the woodwind family — the drawings (LESSON_JOURNEY §6
 * stage 2, §7 "air columns"). FULLY SILENT: the physics is shown, never
 * played. Every figure is the lesson's OWN instrument, turned to be read
 * (windPosture.portraitOf: the same centre line, the same holes), with the
 * physics of windPhysics.ts drawn on it.
 *
 *   BreathToSound  the numbered events, revealed by `reveal` (stepped, or
 *                  played ONCE): ① the breath (a reed: into the mouthpiece;
 *                  a flute: the air jet across the embouchure hole); ② the
 *                  reed opening and closing / the jet flipping in and out of
 *                  the hole; ③ the air column ringing — its pressure drawn
 *                  BESIDE the tube, along the sounding length, still at the
 *                  open end; ④ the sound leaving: the first open hole, the
 *                  bell or foot, a flute's embouchure hole.
 *   NoteMap        one NOTE: the holes closed and open (a simplified
 *                  fingering), the first open hole ringed, the sounding air
 *                  column lit, its standing wave beside the tube (swung by
 *                  hand), and where the sound leaves.
 *   PipeModes      the ideal pipe of this instrument's kind (open both ends,
 *                  closed at the reed, or a cone): resonance n's pressure
 *                  along it, its still points, swung by hand.
 *
 * HONESTY: arrows and arcs show the ORDER and the place of events, never a
 * speed or a level; the standing waves are the ideal pipes' (no end
 * corrections); the fingering is simplified (every hole past the first open
 * one drawn open). Nothing loops (D8).
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import type { ViewBox } from '../../../engine/model/types.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { add, scale } from '../../../engine/geometry/vec.ts';
import { WindBody } from './WindArt';
import { frameAt, samples, type Layout } from './windPosture.ts';
import { endWordOf, holeS, radiusAt, type Bore } from './windSpec.ts';
import { pressure, pressureNodes, type NoteState } from './windPhysics.ts';

const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const AIR = '#9cc4ff';
type SkPath = ReturnType<typeof Skia.Path.Make>;
type P2 = [number, number];
const make = () => Skia.Path.Make();

const clamp01 = (x: number) => {
  'worklet';
  return Math.max(0, Math.min(1, x));
};

/** The 2-D frame of the path at s (side view): the point and the normal on
 *  the ribbon's side. */
function at2(L: Layout, s: number, side: 1 | -1): { c: P2; t: P2; n: P2; r: number } {
  const f = frameAt(L, s);
  const t2: P2 = [f.t.x, f.t.y];
  const l = Math.hypot(t2[0], t2[1]) || 1;
  const t: P2 = [t2[0] / l, t2[1] / l];
  const n: P2 = [-t[1] * side, t[0] * side];
  return { c: [f.p.x, f.p.y], t, n, r: radiusAt(L.spec, s) };
}

/** Concentric arcs leaving point c along direction d (2-D), radii r0…: the
 *  sound leaving a hole or an end. */
function arcs(c: P2, d: P2, r0: number, n = 3, gap = 22, spread = 1): SkPath {
  const p = make();
  const a = Math.atan2(d[1], d[0]);
  for (let i = 0; i < n; i++) {
    const r = r0 + i * gap;
    const rect = Skia.XYWHRect(c[0] - r, c[1] - r, 2 * r, 2 * r);
    p.addArc(rect, ((a - 0.95 * spread) * 180) / Math.PI, (1.9 * spread * 180) / Math.PI);
  }
  return p;
}

function arrow(p: SkPath, a: P2, b: P2, head: number) {
  p.moveTo(a[0], a[1]);
  p.lineTo(b[0], b[1]);
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  p.moveTo(b[0] - head * Math.cos(ang - 0.45), b[1] - head * Math.sin(ang - 0.45));
  p.lineTo(b[0], b[1]);
  p.lineTo(b[0] - head * Math.cos(ang + 0.45), b[1] - head * Math.sin(ang + 0.45));
}

/** The standing wave beside the tube from s0 to s1: its baseline, its
 *  envelope (±|p|) and the curve at this swing; `gap` off the tube. */
function ribbon(L: Layout, bore: Bore, n: number, s0: number, s1: number, swing: number, side: 1 | -1, amp: number, gap: number) {
  const base = make();
  const env: P2[] = [];
  const envLo: P2[] = [];
  const curve = make();
  const ss = samples(L, s0, s1, 6);
  ss.forEach(({ s }, i) => {
    const g = at2(L, s, side);
    const d = g.r + gap + amp;
    const b: P2 = [g.c[0] + g.n[0] * d, g.c[1] + g.n[1] * d];
    const p = pressure(bore, n, s - s0, s1 - s0);
    const q: P2 = [b[0] + g.n[0] * amp * p * swing, b[1] + g.n[1] * amp * p * swing];
    if (i === 0) {
      base.moveTo(b[0], b[1]);
      curve.moveTo(q[0], q[1]);
    } else {
      base.lineTo(b[0], b[1]);
      curve.lineTo(q[0], q[1]);
    }
    env.push([b[0] + g.n[0] * amp * Math.abs(p), b[1] + g.n[1] * amp * Math.abs(p)]);
    envLo.push([b[0] - g.n[0] * amp * Math.abs(p), b[1] - g.n[1] * amp * Math.abs(p)]);
  });
  const band = make();
  [...env, ...envLo.reverse()].forEach(([u, v], i) => (i === 0 ? band.moveTo(u, v) : band.lineTo(u, v)));
  band.close();
  // The still points (pressure nodes) on the baseline.
  const nodes = make();
  const nodeAt: P2[] = [];
  for (const fx of pressureNodes(bore, n)) {
    const s = s0 + fx * (s1 - s0);
    const g = at2(L, s, side);
    const d = g.r + gap + amp;
    const b: P2 = [g.c[0] + g.n[0] * d, g.c[1] + g.n[1] * d];
    nodes.addCircle(b[0], b[1], 5.5);
    nodeAt.push(b);
  }
  return { base, band, curve, nodes, nodeAt };
}

/** The lit band over the sounding part of the bore. */
function airBand(L: Layout, s0: number, s1: number): SkPath {
  const left: P2[] = [];
  const right: P2[] = [];
  for (const { s } of samples(L, s0, s1, 6)) {
    const g = at2(L, s, 1);
    const r = g.r * 0.62;
    left.push([g.c[0] + g.n[0] * r, g.c[1] + g.n[1] * r]);
    right.push([g.c[0] - g.n[0] * r, g.c[1] - g.n[1] * r]);
  }
  const p = make();
  [...left, ...right.reverse()].forEach(([u, v], i) => (i === 0 ? p.moveTo(u, v) : p.lineTo(u, v)));
  p.close();
  return p;
}

/** A hole's 2-D place on the tube's face (the portrait's keys face you). */
function holeAt(L: Layout, k: number): { c: P2; s: number; out: P2 } {
  const s = holeS(L.spec, k);
  const f = frameAt(L, s);
  const q = add(f.p, scale(f.n, radiusAt(L.spec, s)));
  const g = at2(L, s, 1);
  return { c: [q.x, q.y], s, out: g.n };
}
function endAt(L: Layout): { c: P2; d: P2 } {
  const f = frameAt(L, L.spec.end);
  const l = Math.hypot(f.t.x, f.t.y) || 1;
  return { c: [f.p.x, f.p.y], d: [f.t.x / l, f.t.y / l] };
}

export type SoundFigure = { L: Layout; box: ViewBox; side: 1 | -1; subject: string };

/* ── ① – ④: breath to sound ── */
export function BreathToSound({ w, h, fig, st, reveal, shown, accessibilityLabel }: { w: number; h: number; fig: SoundFigure; st: NoteState; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const { L, box, side } = fig;
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h, box]);
  const edge = L.spec.family === 'edge';
  const g = useMemo(() => {
    const p0 = at2(L, 0, side);
    const dirIn: P2 = p0.t;
    // ① the breath: from outside the player's end, inward.
    const breath = make();
    if (edge) {
      // The jet: across the embouchure hole from the lips' side.
      const hc = holeLike(L);
      arrow(breath, [hc.c[0] - hc.out[0] * 70 - 40, hc.c[1] - hc.out[1] * 70], [hc.c[0] + 10, hc.c[1] - hc.out[1] * 4], 14);
    } else arrow(breath, [p0.c[0] - dirIn[0] * 110, p0.c[1] - dirIn[1] * 110], [p0.c[0] - dirIn[0] * 6, p0.c[1] - dirIn[1] * 6], 14);
    // ② the reed / jet moving: two outlines either side of rest.
    const motion = make();
    if (edge) {
      const hc = holeLike(L);
      for (const k of [-1, 1]) {
        motion.moveTo(hc.c[0] - 40, hc.c[1] - hc.out[1] * 8);
        motion.quadTo(hc.c[0], hc.c[1] - hc.out[1] * (8 + k * 10), hc.c[0] + 34, hc.c[1] + hc.out[1] * k * 18);
      }
    } else {
      const s1 = Math.min(40, L.spec.pieces[0].s1 * 0.6);
      const a = at2(L, s1, side);
      for (const k of [-1, 1]) {
        motion.moveTo(a.c[0] - a.n[0] * a.r, a.c[1] - a.n[1] * a.r);
        motion.lineTo(p0.c[0] - p0.n[0] * (p0.r * 0.4 + k * 5), p0.c[1] - p0.n[1] * (p0.r * 0.4 + k * 5));
      }
    }
    // Puffs of air entering the bore (dots).
    const puffs = make();
    for (const s of [16, 34, 52]) {
      const q = at2(L, edge ? s : s + 10, side);
      puffs.addCircle(q.c[0], q.c[1], 3.4);
    }
    const band = airBand(L, edge ? 0 : 6, st.endS);
    const rib = ribbon(L, L.spec.bore, st.n, 0, st.endS, 1, side, 46, 24);
    // ④ the sound leaving.
    const out = make();
    const weak = make();
    if (st.hole > 0) {
      const hc = holeAt(L, st.hole);
      out.addPath(arcs(hc.c, [hc.out[0], hc.out[1]], 22, 3, 20, 0.85));
      const e = endAt(L);
      weak.addPath(arcs(e.c, e.d, 26, 2, 20, 0.7));
    } else {
      const e = endAt(L);
      out.addPath(arcs(e.c, e.d, radiusAt(L.spec, L.spec.end) + 10, 3, 22, 0.75));
    }
    if (edge) {
      const hc = holeLike(L);
      out.addPath(arcs(hc.c, [hc.out[0], hc.out[1]], 20, 3, 18, 0.8));
    }
    return { breath, motion, puffs, band, rib, out, weak };
  }, [L, side, edge, st]);
  const ev = (i: number) => {
    'worklet';
    return clamp01(reveal.value - i);
  };
  const o1 = useDerivedValue(() => ev(0) * (1 - 0.55 * ev(2)));
  const o2 = useDerivedValue(() => ev(1) * (1 - 0.5 * ev(3)));
  const o3 = useDerivedValue(() => ev(2));
  const o4 = useDerivedValue(() => ev(3));
  const labels: StaticLabel[] = useMemo(() => {
    const exitS = st.hole > 0 ? holeAt(L, st.hole).s : L.spec.end;
    const out: StaticLabel[] = [
      labelAway(L, side, 'e1', '1 BREATH', undefined, 0, -150, 'amber'),
      labelAway(L, side, 'e2', edge ? '2 JET FLIPS' : '2 REED OPENS · CLOSES', edge ? '2 JET' : '2 REED', 70, -150, 'amber'),
      labelAt(L, side, 'e3', '3 AIR COLUMN RINGS', '3 AIR COLUMN', st.endS * 0.6, 175, 'blue', false),
      labelAway(L, side, 'e4', '4 SOUND LEAVES', '4 LEAVES', exitS, -140, 'amber'),
    ];
    return out.filter((_, i) => i < shown);
  }, [L, side, edge, st, shown]);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <WindBody L={L} view="side" />
          <Group opacity={o3}>
            <Path path={g.band} color={AIR} opacity={0.45} />
            <Path path={g.rib.band} color={BLUE} opacity={0.22} />
            <Path path={g.rib.base} style="stroke" strokeWidth={1.2} color={BLUE} opacity={0.6}>
              <DashPathEffect intervals={[6, 5]} />
            </Path>
            <Path path={g.rib.curve} style="stroke" strokeWidth={3} color={BLUE} strokeJoin="round" />
            <Path path={g.rib.nodes} color="#ffffff" opacity={0.9} />
          </Group>
          <Group opacity={o1}>
            <Path path={g.breath} style="stroke" strokeWidth={4.5} color={AMBER} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={o2}>
            <Path path={g.motion} style="stroke" strokeWidth={2.6} color={AMBER} strokeCap="round">
              <DashPathEffect intervals={[5, 4]} />
            </Path>
            <Path path={g.puffs} color={AIR} />
          </Group>
          <Group opacity={o4}>
            <Path path={g.out} style="stroke" strokeWidth={3.4} color={AMBER} strokeCap="round" />
            <Path path={g.weak} style="stroke" strokeWidth={2} color={AMBER} strokeCap="round" opacity={0.55} />
          </Group>
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/** A label beside the tube at s, `d` mm out along the ribbon's side (negative:
 *  the other side), aligned away from the tube, with a leader to its edge. */
function labelAt(L: Layout, side: 1 | -1, id: string, text: string, short: string | undefined, s: number, d: number, tone: StaticLabel['tone'], lead = true): StaticLabel {
  const g = at2(L, s, side);
  const sg = Math.sign(d) || 1;
  const n: P2 = [g.n[0] * sg, g.n[1] * sg];
  const p: P2 = [g.c[0] + n[0] * (g.r + Math.abs(d)), g.c[1] + n[1] * (g.r + Math.abs(d))];
  const align: StaticLabel['align'] = n[0] > 0.4 ? 'left' : n[0] < -0.4 ? 'right' : 'center';
  return { id, text, ...(short ? { short } : {}), u: p[0], v: p[1], align, tone, ...(lead ? { at: { u: g.c[0] + n[0] * g.r, v: g.c[1] + n[1] * g.r } } : {}) };
}

/** labelAt, flipped to the tube's other side when that side is clearly
 *  clearer of the instrument — a curved end (an upturned bell) or a folded
 *  tube would otherwise put its label back over the body. */
function labelAway(L: Layout, side: 1 | -1, id: string, text: string, short: string | undefined, s: number, d: number, tone: StaticLabel['tone']): StaticLabel {
  const a = labelAt(L, side, id, text, short, s, d, tone);
  const b = labelAt(L, side, id, text, short, s, -d, tone);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= 60; i++) pts.push(frameAt(L, (L.spec.end * i) / 60).p);
  const clear = (q: StaticLabel) => Math.min(...pts.map((p) => Math.hypot(q.u - p.x, q.v - p.y)));
  return clear(b) > clear(a) * 1.2 ? b : a;
}

/** A flute's embouchure hole in the portrait (its face toward you). */
function holeLike(L: Layout): { c: P2; out: P2 } {
  const f = frameAt(L, 0);
  const q = add(f.p, scale(f.n, radiusAt(L.spec, 0)));
  const g = at2(L, 0, 1);
  return { c: [q.x, q.y], out: g.n };
}

/* ── one note: the holes, the air column, where it leaves ── */
export function NoteMap({ w, h, fig, st, swing, accessibilityLabel }: { w: number; h: number; fig: SoundFigure; st: NoteState; swing: number; accessibilityLabel: string }) {
  const { L, box, side } = fig;
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h, box]);
  const edge = L.spec.family === 'edge';
  const g = useMemo(() => {
    const spec = L.spec;
    const closed = make();
    const open = make();
    for (const hl of spec.holes) {
      const hc = holeAt(L, hl.k);
      const r = 5.2;
      // A simplified fingering: every hole from the far end up to the first
      // open one is open; the rest are closed.
      if (st.hole > 0 && hl.k <= st.hole) open.addCircle(hc.c[0], hc.c[1], r);
      else closed.addCircle(hc.c[0], hc.c[1], r);
    }
    const ring = make();
    let ringAt: P2 | null = null;
    if (st.hole > 0) {
      const hc = holeAt(L, st.hole);
      ring.addCircle(hc.c[0], hc.c[1], 13);
      ringAt = hc.c;
    }
    const band = airBand(L, edge ? 0 : 6, st.endS);
    const rib = ribbon(L, spec.bore, st.n, 0, st.endS, swing, side, 46, 24);
    const out = make();
    const weak = make();
    if (st.hole > 0) {
      const hc = holeAt(L, st.hole);
      out.addPath(arcs(hc.c, hc.out, 22, 3, 20, 0.85));
      const e = endAt(L);
      weak.addPath(arcs(e.c, e.d, radiusAt(spec, spec.end) + 8, 2, 20, 0.7));
    } else {
      const e = endAt(L);
      out.addPath(arcs(e.c, e.d, radiusAt(spec, spec.end) + 10, 3, 22, 0.75));
    }
    if (edge) {
      const hc = holeLike(L);
      out.addPath(arcs(hc.c, hc.out, 20, 3, 18, 0.8));
    }
    return { closed, open, ring, ringAt, band, rib, out, weak };
  }, [L, st, swing, side, edge]);
  const labels: StaticLabel[] = useMemo(() => {
    const out: StaticLabel[] = [labelAt(L, side, 'air', `AIR COLUMN · ${st.n === 1 ? 'LOWEST RESONANCE' : `RESONANCE ${st.n}`}`, 'AIR COLUMN', st.endS * 0.6, 175, 'blue', false)];
    if (st.hole > 0) out.push(labelAway(L, side, 'hole', 'FIRST OPEN HOLE', 'OPEN HOLE', holeAt(L, st.hole).s, -130, 'amber'));
    out.push(labelAway(L, side, 'end', st.hole === 0 ? `ALL CLOSED · THE ${endWordOf(L.spec).toUpperCase()}` : endWordOf(L.spec).toUpperCase(), st.hole === 0 ? endWordOf(L.spec).toUpperCase() : undefined, L.spec.end - 10, -120, st.hole === 0 ? 'amber' : 'muted'));
    if (edge) out.push(labelAt(L, side, 'emb', 'EMBOUCHURE HOLE', 'EMBOUCHURE', 0, -130, 'amber'));
    return out;
  }, [L, st, side, edge]);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <WindBody L={L} view="side" />
          <Path path={g.band} color={AIR} opacity={0.5} />
          <Path path={g.open} color="#050505" />
          <Path path={g.open} style="stroke" strokeWidth={1.4} color={AIR} />
          <Path path={g.ring} style="stroke" strokeWidth={3.2} color={AMBER} />
          <Path path={g.rib.band} color={BLUE} opacity={0.2} />
          <Path path={g.rib.base} style="stroke" strokeWidth={1.2} color={BLUE} opacity={0.6}>
            <DashPathEffect intervals={[6, 5]} />
          </Path>
          <Path path={g.rib.curve} style="stroke" strokeWidth={3} color={BLUE} strokeJoin="round" />
          <Path path={g.rib.nodes} color="#ffffff" opacity={0.9} />
          <Path path={g.out} style="stroke" strokeWidth={3.4} color={AMBER} strokeCap="round" />
          <Path path={g.weak} style="stroke" strokeWidth={2} color={AMBER} strokeCap="round" opacity={0.55} />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/* ── the ideal pipe: resonance n ── */
const PIPE_L = 600;
export function pipeBox(): ViewBox {
  return { u0: -40, u1: PIPE_L + 50, v0: -120, v1: 390 };
}
export function PipeModes({ w, h, bore, n, swing, accessibilityLabel, ends }: { w: number; h: number; bore: Bore; n: number; swing: number; accessibilityLabel: string; ends: { left: string; right: string } }) {
  const textScale = useStageTextScale();
  const box = pipeBox();
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h, box]);
  const cone = bore === 'cone';
  const rAt = (x: number) => (cone ? 8 + (40 * x) / PIPE_L : 34);
  const g = useMemo(() => {
    // The pipe cut open: the far wall's inside, the two cut edges.
    const top: P2[] = [];
    const bot: P2[] = [];
    for (let i = 0; i <= 40; i++) {
      const x = (PIPE_L * i) / 40;
      top.push([x, -rAt(x)]);
      bot.push([x, rAt(x)]);
    }
    const inside = make();
    [...top, ...[...bot].reverse()].forEach(([u, v], i) => (i === 0 ? inside.moveTo(u, v) : inside.lineTo(u, v)));
    inside.close();
    const wallT = make();
    const wallB = make();
    top.forEach(([u, v], i) => (i === 0 ? wallT.moveTo(u, v - 5) : wallT.lineTo(u, v - 5)));
    [...top].reverse().forEach(([u, v]) => wallT.lineTo(u, v));
    wallT.close();
    bot.forEach(([u, v], i) => (i === 0 ? wallB.moveTo(u, v) : wallB.lineTo(u, v)));
    [...bot].reverse().forEach(([u, v]) => wallB.lineTo(u, v + 5));
    wallB.close();
    const cap = make();
    if (bore === 'closed') cap.addRRect(Skia.RRectXY(Skia.XYWHRect(-12, -rAt(0) - 6, 12, 2 * rAt(0) + 12), 3, 3));
    // The pressure along the pipe, as a graph under it (one scale for every n).
    const G0 = 215;
    const A = 110;
    const base = make();
    base.moveTo(0, G0);
    base.lineTo(PIPE_L, G0);
    const curve = make();
    const env: P2[] = [];
    const lo: P2[] = [];
    for (let i = 0; i <= 160; i++) {
      const x = (PIPE_L * i) / 160;
      const p = pressure(bore, n, x, PIPE_L);
      if (i === 0) curve.moveTo(x, G0 - A * p * swing);
      else curve.lineTo(x, G0 - A * p * swing);
      env.push([x, G0 - A * Math.abs(p)]);
      lo.push([x, G0 + A * Math.abs(p)]);
    }
    const band = make();
    [...env, ...lo.reverse()].forEach(([u, v], i) => (i === 0 ? band.moveTo(u, v) : band.lineTo(u, v)));
    band.close();
    const nodes = make();
    const ticks = make();
    for (const fx of pressureNodes(bore, n)) {
      nodes.addCircle(fx * PIPE_L, G0, 6);
      ticks.moveTo(fx * PIPE_L, G0 - 2);
      ticks.lineTo(fx * PIPE_L, rAt(fx * PIPE_L) + 8);
    }
    // Inside the pipe: the air pressed (amber) and thinned (blue) at this swing.
    const press = make();
    const thin = make();
    for (let i = 0; i < 60; i++) {
      const x = (PIPE_L * (i + 0.5)) / 60;
      const p = pressure(bore, n, x, PIPE_L) * swing;
      const r = rAt(x) * 0.8;
      const rect = Skia.XYWHRect(x - PIPE_L / 120, -r, PIPE_L / 60, 2 * r);
      if (p > 0.08) press.addRect(rect);
      else if (p < -0.08) thin.addRect(rect);
    }
    return { inside, wallT, wallB, cap, base, curve, band, nodes, ticks, press, thin, G0 };
  }, [bore, n, swing]); // eslint-disable-line react-hooks/exhaustive-deps
  const labels: StaticLabel[] = [
    { id: 'l', text: ends.left, u: -14, v: -rAt(0) - 26, align: 'left', tone: bore === 'closed' ? 'amber' : 'blue' },
    { id: 'r', text: ends.right, u: PIPE_L + 10, v: -rAt(PIPE_L) - 26, align: 'right', tone: 'blue' },
    { id: 'g', text: 'PRESSURE ALONG THE TUBE', short: 'PRESSURE', u: PIPE_L / 2, v: g.G0 + 140, align: 'center', tone: 'muted' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Path path={g.inside}>
            <LinearGradient start={vec(0, -40)} end={vec(0, 40)} colors={['#0b0d12', '#1a1e27', '#0b0d12']} />
          </Path>
          <Path path={g.press} color={AMBER} opacity={0.26} />
          <Path path={g.thin} color={BLUE} opacity={0.24} />
          <Path path={g.wallT}>
            <LinearGradient start={vec(0, -40)} end={vec(0, -20)} colors={['#c99a62', '#7a5228']} />
          </Path>
          <Path path={g.wallB}>
            <LinearGradient start={vec(0, 20)} end={vec(0, 40)} colors={['#a77a44', '#4a3016']} />
          </Path>
          <Path path={g.cap} color="#2a2a30" />
          <Path path={g.ticks} style="stroke" strokeWidth={1.2} color="#ffffff" opacity={0.35}>
            <DashPathEffect intervals={[4, 4]} />
          </Path>
          <Path path={g.band} color={BLUE} opacity={0.18} />
          <Path path={g.base} style="stroke" strokeWidth={1.2} color={BLUE} opacity={0.6} />
          <Path path={g.curve} style="stroke" strokeWidth={3.2} color={BLUE} strokeJoin="round" />
          <Path path={g.nodes} color="#ffffff" />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

