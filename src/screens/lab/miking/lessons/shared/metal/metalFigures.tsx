/**
 * SUSPENDED METAL — the vibration-shape pictures (HOW IT SOUNDS, step 2;
 * LESSON_JOURNEY §7). FULLY SILENT: a shape is drawn, never played.
 *
 *   DiscFace  a disc face-on (a gong, a finger cymbal): one shape — or a
 *             weighted mix of shapes (the gong's build-up) — as blue (+,
 *             toward you) and amber (−, away) bands, its still lines dashed
 *             white, the stroke's spot ringed in amber;
 *   BarFace   a bar seen face-on (a hanging chime, or the triangle drawn as
 *             the bar it was bent from, round its own corners): the rod at
 *             rest (faint) and displaced in one shape, motion drawn much
 *             larger than life, its still points marked, the stroke ringed.
 *
 * Both are static for a given SWING (the learner drags it; nothing loops,
 * D8). Text ≥ 9 pt (StaticLabels).
 */
import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, Line, Path, RadialGradient, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import type { ViewBox } from '../../../engine/model/types.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { make, Rod, type SkPath } from './metalArt';

const BLUE_BANDS = ['rgba(111,168,255,0.18)', 'rgba(111,168,255,0.34)', 'rgba(111,168,255,0.52)', 'rgba(111,168,255,0.74)'];
const AMBER_BANDS = ['rgba(255,190,70,0.2)', 'rgba(255,190,70,0.38)', 'rgba(255,190,70,0.58)', 'rgba(255,190,70,0.8)'];
const LEVELS = [0.12, 0.35, 0.6, 0.85];
const AMBER = '#ffc64d';

/** Polar cells of the disc, binned by |value| into the band paths. */
function bands(at: (r: number, t: number) => number, R: number, r0Frac: number, dir: number): { pos: SkPath[]; neg: SkPath[] } {
  const pos = LEVELS.map(() => make());
  const neg = LEVELS.map(() => make());
  const NR = 28;
  const NT = 100;
  // θ is measured from the stroke's direction `dir` (screen radians).
  const pt = (r: number, t: number) => ({ x: Math.cos(dir + t) * r * R, y: Math.sin(dir + t) * r * R });
  for (let i = 0; i < NR; i++) {
    const r0 = r0Frac + ((1 - r0Frac) * i) / NR;
    const r1 = r0Frac + ((1 - r0Frac) * (i + 1)) / NR;
    const rm = (r0 + r1) / 2;
    for (let k = 0; k < NT; k++) {
      const t0 = (k / NT) * 2 * Math.PI;
      const t1 = ((k + 1) / NT) * 2 * Math.PI;
      const v = at(rm, (t0 + t1) / 2);
      const a = Math.abs(v);
      let bin = -1;
      for (let b = LEVELS.length - 1; b >= 0; b--) {
        if (a >= LEVELS[b]) {
          bin = b;
          break;
        }
      }
      if (bin < 0) continue;
      const p = v > 0 ? pos[bin] : neg[bin];
      const a0 = pt(r0, t0);
      const a1 = pt(r1, t0);
      const b1 = pt(r1, t1);
      const b0 = pt(r0, t1);
      p.moveTo(a0.x, a0.y);
      p.lineTo(a1.x, a1.y);
      p.lineTo(b1.x, b1.y);
      p.lineTo(b0.x, b0.y);
      p.close();
    }
  }
  return { pos, neg };
}

export type DiscFaceProps = {
  w: number;
  h: number;
  diameterMm: number;
  /** −1 … 1 at polar (r ∈ [0, 1], θ from the stroke direction), already
   *  scaled by the swing. */
  at: (r: number, theta: number) => number;
  /** Still rings (fractions of R) and still diameters (radians from the
   *  stroke direction), for the dashed lines; omit for a mix. */
  stillRings?: readonly number[];
  stillDiameters?: readonly number[];
  /** The stroke's spot, mm from the centre, and its screen direction. */
  strikeMm: number;
  strikeDir?: number;
  strikeWord: string;
  metal: readonly string[];
  /** A raised boss (a bossed gong) or a centre knot (a finger cymbal's strap). */
  boss?: number;
  knot?: boolean;
  /** Mark the turned rim (a gong). */
  rim?: boolean;
  /** Extra labels in mm. */
  labels?: StaticLabel[];
  accessibilityLabel: string;
  /** Changes when the field changes (memo key). */
  fieldKey: string;
};

export function DiscFace({ w, h, diameterMm, at, stillRings = [], stillDiameters = [], strikeMm, strikeDir = Math.PI * 0.75, strikeWord, metal, boss, knot, rim, labels = [], accessibilityLabel, fieldKey }: DiscFaceProps) {
  const R = diameterMm / 2;
  const textScale = useStageTextScale();
  const box: ViewBox = useMemo(() => ({ u0: -R * 1.18, u1: R * 1.18, v0: -R * 1.12, v1: R * 1.22 }), [R]);
  const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h, box]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const field = useMemo(() => bands(at, R, boss ? Math.min(0.4, boss / R) : 0.04, strikeDir), [fieldKey, R, boss, strikeDir]);
  const still = useMemo(() => {
    const p = make();
    for (const a of stillDiameters) {
      p.moveTo(Math.cos(strikeDir + a) * R, Math.sin(strikeDir + a) * R);
      p.lineTo(-Math.cos(strikeDir + a) * R, -Math.sin(strikeDir + a) * R);
    }
    for (const r of stillRings) p.addCircle(0, 0, r * R);
    return p;
  }, [stillDiameters, stillRings, R, strikeDir]);
  const lathe = useMemo(() => {
    const p = make();
    const step = Math.max(4, R / 40);
    for (let q = step * 2; q < R - 2; q += step) p.addCircle(0, 0, q);
    return p;
  }, [R]);
  const sx = Math.cos(strikeDir) * strikeMm;
  const sy = Math.sin(strikeDir) * strikeMm;
  const all: StaticLabel[] = [{ id: 'strike', text: strikeWord, u: sx + R * 0.09, v: sy + R * 0.02, align: 'left', tone: 'amber' }, ...labels];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Circle cx={R * 0.03} cy={R * 0.05} r={R * 1.01} color="#000" opacity={0.5}>
            <BlurMask blur={R * 0.05} style="normal" />
          </Circle>
          <Circle cx={0} cy={0} r={R}>
            <RadialGradient c={vec(-R * 0.38, -R * 0.42)} r={R * 1.75} colors={[metal[1], metal[2], metal[3], metal[4]]} />
          </Circle>
          {/* Muted under the bands, so blue and amber both read. */}
          <Circle cx={0} cy={0} r={R} color="rgba(10,10,14,0.42)" />
          <Path path={lathe} style="stroke" strokeWidth={R / 300} color="#ffffff" opacity={0.06} />
          {field.pos.map((p, i) => (
            <Path key={`p${i}`} path={p} color={BLUE_BANDS[i]} />
          ))}
          {field.neg.map((p, i) => (
            <Path key={`n${i}`} path={p} color={AMBER_BANDS[i]} />
          ))}
          <Path path={still} style="stroke" strokeWidth={R / 70} color="rgba(8,8,10,0.55)" />
          <Path path={still} style="stroke" strokeWidth={R / 150} color="#ffffff">
            <DashPathEffect intervals={[R / 28, R / 45]} />
          </Path>
          {boss ? (
            <Group>
              <Circle cx={0} cy={0} r={boss}>
                <RadialGradient c={vec(-boss * 0.4, -boss * 0.45)} r={boss * 1.4} colors={[metal[0], metal[1], metal[3]]} />
              </Circle>
              <Circle cx={0} cy={0} r={boss} style="stroke" strokeWidth={R / 160} color={metal[4]} />
              <Circle cx={-boss * 0.35} cy={-boss * 0.38} r={boss * 0.22} color="#ffffff" opacity={0.35}>
                <BlurMask blur={boss * 0.15} style="normal" />
              </Circle>
            </Group>
          ) : null}
          {knot ? <Circle cx={0} cy={0} r={R * 0.1} color="#3a2414" /> : null}
          <Circle cx={0} cy={0} r={R} style="stroke" strokeWidth={rim ? R / 32 : R / 90} color={metal[4]} />
          {rim ? <Circle cx={0} cy={0} r={R * 0.985} style="stroke" strokeWidth={R / 120} color={metal[1]} opacity={0.6} /> : null}
          <Line p1={vec(sx - R * 0.05, sy)} p2={vec(sx + R * 0.05, sy)} color={AMBER} strokeWidth={R / 130} />
          <Circle cx={sx} cy={sy} r={R * 0.06} style="stroke" strokeWidth={R / 80} color={AMBER} />
        </Group>
      </Canvas>
      <StaticLabels labels={all} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/* ═══════════════ the bar ═══════════════ */

/** A bar's centre line as points, with the in-plane normal at each (mm). */
export type BarGeom = { pts: readonly [number, number][]; normals: readonly [number, number][]; s: readonly number[] };

export function straightBar(u: number, v0: number, v1: number, N = 120): BarGeom {
  const pts: [number, number][] = [];
  const normals: [number, number][] = [];
  const s: number[] = [];
  for (let i = 0; i <= N; i++) {
    s.push(i / N);
    pts.push([u, v0 + ((v1 - v0) * i) / N]);
    normals.push([1, 0]);
  }
  return { pts, normals, s };
}

/** A polyline bar (the triangle's rod round its corners), sampled evenly;
 *  the normal is the segment's own (it jumps at a corner). */
export function polyBar(corners: readonly [number, number][], N = 180): BarGeom {
  const lens: number[] = [];
  let total = 0;
  for (let i = 0; i < corners.length - 1; i++) {
    const l = Math.hypot(corners[i + 1][0] - corners[i][0], corners[i + 1][1] - corners[i][1]);
    lens.push(l);
    total += l;
  }
  const pts: [number, number][] = [];
  const normals: [number, number][] = [];
  const s: number[] = [];
  let seg = 0;
  let acc = 0;
  for (let i = 0; i <= N; i++) {
    const d = (total * i) / N;
    while (seg < lens.length - 1 && d > acc + lens[seg]) {
      acc += lens[seg];
      seg++;
    }
    const f = (d - acc) / lens[seg];
    const [a, b] = [corners[seg], corners[seg + 1]];
    const tx = (b[0] - a[0]) / lens[seg];
    const ty = (b[1] - a[1]) / lens[seg];
    pts.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
    normals.push([-ty, tx]);
    s.push(d / total);
  }
  return { pts, normals, s };
}

export type BarFaceProps = {
  w: number;
  h: number;
  box: ViewBox;
  geom: BarGeom;
  rodD: number;
  metal: readonly string[];
  /** −1 … 1 along s ∈ [0, 1] (already × swing). */
  at: (s: number) => number;
  /** Peak drawn displacement, mm (motion drawn larger than life). */
  amp: number;
  nodes: readonly number[];
  strikeS: number;
  strikeWord: string;
  /** Static extras drawn under the bar (clip, filament, rail). */
  under?: ReactNode;
  labels?: StaticLabel[];
  accessibilityLabel: string;
};

function pointAt(g: BarGeom, s: number): { p: [number, number]; n: [number, number] } {
  let i = 0;
  while (i < g.s.length - 2 && g.s[i + 1] < s) i++;
  const f = (s - g.s[i]) / Math.max(1e-9, g.s[i + 1] - g.s[i]);
  return { p: [g.pts[i][0] + (g.pts[i + 1][0] - g.pts[i][0]) * f, g.pts[i][1] + (g.pts[i + 1][1] - g.pts[i][1]) * f], n: g.normals[i] };
}

export function BarFace({ w, h, box, geom, rodD, metal, at, amp, nodes, strikeS, strikeWord, under, labels = [], accessibilityLabel }: BarFaceProps) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h, box]);
  const rest = useMemo(() => {
    const p = make();
    geom.pts.forEach(([u, v], i) => (i === 0 ? p.moveTo(u, v) : p.lineTo(u, v)));
    return p;
  }, [geom]);
  const moved = useMemo(() => {
    const p = make();
    geom.pts.forEach(([u, v], i) => {
      const d = at(geom.s[i]) * amp;
      const q: [number, number] = [u + geom.normals[i][0] * d, v + geom.normals[i][1] * d];
      if (i === 0) p.moveTo(q[0], q[1]);
      else p.lineTo(q[0], q[1]);
    });
    return p;
  }, [geom, at, amp]);
  const dots = nodes.map((s) => pointAt(geom, s));
  const st = pointAt(geom, strikeS);
  // The STROKE word sits outside the bar, on the side its normal points away from the bar's middle.
  const all: StaticLabel[] = [{ id: 'strike', text: strikeWord, u: st.p[0] + rodD * 2.2, v: st.p[1] + rodD * 3.2, align: 'left', tone: 'amber' }, ...labels];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          {under}
          {/* At rest: a faint ghost of the rod, so the shape reads as motion. */}
          <Path path={rest} style="stroke" strokeWidth={rodD} strokeCap="round" strokeJoin="round" color="#8a8f9c" opacity={0.28} />
          <Path path={rest} style="stroke" strokeWidth={rodD * 0.18} color="#c8ccd4" opacity={0.5}>
            <DashPathEffect intervals={[rodD * 1.2, rodD * 0.9]} />
          </Path>
          <Rod path={moved} d={rodD} pal={metal} />
          {dots.map((d, i) => (
            <Group key={i}>
              <Circle cx={d.p[0]} cy={d.p[1]} r={rodD * 0.95} color="rgba(8,8,10,0.75)" />
              <Circle cx={d.p[0]} cy={d.p[1]} r={rodD * 0.6} color="#ffffff" />
            </Group>
          ))}
          <Circle cx={st.p[0]} cy={st.p[1]} r={rodD * 1.45} style="stroke" strokeWidth={rodD * 0.32} color={AMBER} />
        </Group>
      </Canvas>
      <StaticLabels labels={all} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
