/**
 * HAND-DRUM FAMILY — HOW IT SOUNDS, drawn (LESSON_JOURNEY §6–§7, membranes).
 *
 *   HandStrikeSequence  one drum cut open down its middle (a SECTION: the
 *                       shell's walls, the hollow inside, the open lower end),
 *                       under a numbered EXPLANATORY OVERLAY revealed by
 *                       `reveal` (1 … 4): ① the hand (or stick) strikes the
 *                       head; ② the head is pushed in; ③ the air inside is
 *                       pushed down the shell toward the open end; ④ sound
 *                       leaves from the head and from the open end.
 *   StrokeMap           the head from above with where the hand or stick
 *                       lands, and how strongly that point drives each of the
 *                       head's first five shapes (strikeShare: the Cymatics /
 *                       Drum Tuning Bessel tables — engine/physics/membrane.ts).
 *
 * HONESTY (the simplifications register, said once on screen):
 *   • the head's outline is the IDEAL membrane's lowest shape, J0(2.405 r/R),
 *     drawn much larger than a real head moves; the rest line stays drawn;
 *   • arrows show the ORDER of events and their direction, never a speed, a
 *     pressure or a level; arcs say WHERE sound leaves, not how much;
 *   • the strike positions are drawing positions for the sourced descriptions
 *     ("near the center", "closer to the edge"); the model ignores the hand's
 *     contact area and time, which is what separates a tone from a slap.
 * Nothing loops (D8): `reveal` is stepped, or played ONCE by the page.
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, Rect, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { HEAD_SHAPES, lowestProfile, shapeAt, shapePeak } from '../../../engine/physics/membrane.ts';
import { strokeShares } from './strokes.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { BRASS, CHROME, FLOOR, GOAT, INK, RAWHIDE, FILM, WOOD } from './handDrumArt';
import type { HandDrum } from './handDrumModel.ts';
import { FIGURE_SKIN } from '../players/PlayerFigure';
import type { StrokeSpec } from './family.ts';

const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const AIR = '#9cc4ff';
type SkPath = ReturnType<typeof Skia.Path.Make>;

/** A section profile: the shell's OUTER radius down its height (head → open end). */
export type Profile = readonly { y: number; r: number }[];
export type SectionSpec = {
  drum: HandDrum;
  profile: Profile;
  wall: number;
  material: 'wood' | 'brass';
  head: 'rawhide' | 'goat' | 'film';
  tool: 'hand' | 'stick';
  /** The floor under it (y), and whether the open end is clear of it. */
  floorY: number;
  open: boolean;
  /** Where the hand / stick lands: a fraction of R from the centre, toward −x (the player). */
  strikeFrac: number;
  /** A shortened view of a tall shell (model y0 … y1 drawn as a `gap` mm break). */
  shorten?: { y0: number; y1: number; gap: number };
};

const N = 40;
const PROF: number[] = Array.from({ length: N + 1 }, (_, i) => lowestProfile(-1 + (2 * i) / N));
export const HEAD_AMP = 34;

function rAt(profile: Profile, y: number): number {
  for (let i = 0; i < profile.length - 1; i++) {
    const a = profile[i];
    const b = profile[i + 1];
    if ((y - a.y) * (y - b.y) <= 0) return a.r + ((b.r - a.r) * (y - a.y)) / (b.y - a.y || 1);
  }
  return profile[profile.length - 1].r;
}

/** The head's line displaced by `amp` mm DOWN (into the drum) in its lowest shape. */
function headLine(cx: number, R: number, y0: number, amp: number): SkPath {
  'worklet';
  const p = Skia.Path.Make();
  for (let i = 0; i <= N; i++) {
    const x = cx - R + (2 * R * i) / N;
    const y = y0 + amp * PROF[i];
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  return p;
}
function headFill(cx: number, R: number, y0: number, amp: number): SkPath {
  'worklet';
  const p = headLine(cx, R, y0, amp);
  p.lineTo(cx + R, y0);
  p.lineTo(cx - R, y0);
  p.close();
  return p;
}
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

/** A flat hand seen from the side, fingers toward +x, the palm's underside at y = 0. */
function handPath(len: number): SkPath {
  const p = Skia.Path.Make();
  const t = len * 0.16;
  p.moveTo(-len * 0.55, -t * 2.6);
  p.cubicTo(-len * 0.3, -t * 1.7, -len * 0.1, -t * 1.25, len * 0.18, -t * 1.05);
  p.cubicTo(len * 0.38, -t * 0.95, len * 0.47, -t * 0.55, len * 0.47, -t * 0.25);
  p.cubicTo(len * 0.47, -t * 0.02, len * 0.4, 0, len * 0.3, 0);
  p.lineTo(-len * 0.18, 0);
  p.cubicTo(-len * 0.4, 0, -len * 0.62, -t * 0.6, -len * 0.75, -t * 1.6);
  p.close();
  return p;
}
/** The striking hand wears the shared figure skin (owner 2026-10-08, HF1). */
const SKIN = FIGURE_SKIN.ramp;

export function buildSection(s: SectionSpec) {
  const d = s.drum;
  const cx = d.c.x;
  const top = s.profile[0].y;
  const botM = s.profile[s.profile.length - 1].y;
  const map = sectionMap(s);
  const bot = map(botM);
  const wallL = Skia.Path.Make();
  const wallR = Skia.Path.Make();
  const steps = 48;
  const ys = Array.from({ length: steps + 1 }, (_, i) => top + ((botM - top) * i) / steps);
  for (const [path, sg] of [
    [wallL, -1],
    [wallR, 1],
  ] as const) {
    ys.forEach((y, i) => (i === 0 ? path.moveTo(cx + sg * rAt(s.profile, y), map(y)) : path.lineTo(cx + sg * rAt(s.profile, y), map(y))));
    for (let i = ys.length - 1; i >= 0; i--) path.lineTo(cx + sg * (rAt(s.profile, ys[i]) - s.wall), map(ys[i]));
    path.close();
  }
  const cavity = Skia.Path.Make();
  ys.forEach((y, i) => (i === 0 ? cavity.moveTo(cx - rAt(s.profile, y) + s.wall, map(y)) : cavity.lineTo(cx - rAt(s.profile, y) + s.wall, map(y))));
  for (let i = ys.length - 1; i >= 0; i--) cavity.lineTo(cx + rAt(s.profile, ys[i]) - s.wall, map(ys[i]));
  cavity.close();
  // The shortened view's break: a band across the drum with zig-zag edges.
  const brk = Skia.Path.Make();
  const brkEdge = Skia.Path.Make();
  if (s.shorten) {
    const y0 = map(s.shorten.y0);
    const y1 = map(s.shorten.y1);
    const w = rAt(s.profile, s.shorten.y0) + 40;
    const zig = (p: SkPath, y: number, first: boolean) => {
      for (let k = 0; k <= 12; k++) {
        const x = cx - w + (2 * w * k) / 12;
        const yy = y + (k % 2 ? -7 : 7);
        if (k === 0 && first) p.moveTo(x, yy);
        else p.lineTo(x, yy);
      }
    };
    zig(brk, y0, true);
    const back: [number, number][] = [];
    for (let k = 12; k >= 0; k--) back.push([cx - w + (2 * w * k) / 12, y1 + (k % 2 ? -7 : 7)]);
    for (const [x, y] of back) brk.lineTo(x, y);
    brk.close();
    zig(brkEdge, y0, true);
    let firstPt = true;
    for (const [x, y] of back.slice().reverse()) {
      if (firstPt) brkEdge.moveTo(x, y);
      else brkEdge.lineTo(x, y);
      firstPt = false;
    }
  }
  const rimL = Skia.Path.Make();
  rimL.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - d.R - d.rim.t, d.headY - d.rim.rise, d.rim.t + s.wall + 4, d.rim.rise + 22), 3, 3));
  rimL.addRRect(Skia.RRectXY(Skia.XYWHRect(cx + d.R - s.wall - 4, d.headY - d.rim.rise, d.rim.t + s.wall + 4, d.rim.rise + 22), 3, 3));
  // ① the strike: where it lands, and the tool's approach.
  const sx = cx - s.strikeFrac * d.R;
  const approach = Skia.Path.Make();
  arrow(approach, sx - 70, d.headY - 230, sx - 6, d.headY - 40, 22);
  // ③ air pushed down the shell, toward (and, if clear, out of) the open end.
  const air = Skia.Path.Make();
  const inner = (y: number) => rAt(s.profile, y) - s.wall;
  const rBot = rAt(s.profile, botM);
  const iBot = inner(botM);
  const ya = d.headY + 60;
  const ybM = botM - 40;
  for (const f of [-0.45, 0, 0.45]) {
    const x0 = cx + f * inner(ya);
    const x1 = cx + f * inner(ybM) * 0.9;
    arrow(air, x0, ya, x1, map(ybM), 22);
  }
  const outBottom = Skia.Path.Make();
  if (s.open) {
    for (const f of [-0.35, 0.35]) arrow(outBottom, cx + f * iBot, bot - 10, cx + f * iBot * 1.4, bot + 70, 20);
  } else {
    // On the floor: the moving air meets the floor and turns sideways.
    arrow(outBottom, cx - 20, bot - 18, cx - iBot + 6, bot - 18, 18);
    arrow(outBottom, cx + 20, bot - 18, cx + iBot - 6, bot - 18, 18);
  }
  // ④ where sound leaves (direction only).
  const fromHead = Skia.Path.Make();
  arcs(fromHead, cx, d.headY, [d.R * 0.9, d.R * 1.35, d.R * 1.8], -160, -20);
  const fromBottom = Skia.Path.Make();
  if (s.open) arcs(fromBottom, cx, bot, [iBot * 1.1, iBot * 1.6], 30, 150);
  else {
    arcs(fromBottom, cx, bot, [rBot * 1.25, rBot * 1.7], -175, -125);
    arcs(fromBottom, cx, bot, [rBot * 1.25, rBot * 1.7], -55, -5);
  }
  const fy = map(s.floorY);
  const floor = Skia.Path.Make();
  floor.addRect(Skia.XYWHRect(cx - 3000, fy, 6000, 600));
  const floorEdge = Skia.Path.Make();
  floorEdge.moveTo(cx - 3000, fy);
  floorEdge.lineTo(cx + 3000, fy);
  const midY = s.shorten ? (map(s.shorten.y0) + map(s.shorten.y1)) / 2 : (top + bot) / 2;
  return { cx, top, bot, rBot, midY, rMid: rAt(s.profile, s.shorten ? s.shorten.y0 : (top + botM) / 2), floorY: fy, wallL, wallR, cavity, brk, brkEdge, rimL, sx, approach, air, outBottom, fromHead, fromBottom, floor, floorEdge, hand: handPath(d.R * 1.15) };
}

/** The shortened view (a drafting convention): the shell between y0 and y1
 *  is drawn as a `gap` mm break, so a tall drum's head stays large. */
export function sectionMap(s: Pick<SectionSpec, 'shorten'>): (y: number) => number {
  const sh = s.shorten;
  if (!sh) return (y) => y;
  return (y) => (y <= sh.y0 ? y : y >= sh.y1 ? y - (sh.y1 - sh.y0) + sh.gap : sh.y0 + ((y - sh.y0) * sh.gap) / (sh.y1 - sh.y0));
}

export type HandStrikeProps = { w: number; h: number; spec: SectionSpec; box: { u0: number; u1: number; v0: number; v1: number }; reveal: SharedValue<number>; shown: number; accessibilityLabel: string; words: { s1: string; s2: string; s3: string; s4a: string; s4b: string } };

const clamp01 = (x: number) => {
  'worklet';
  return Math.max(0, Math.min(1, x));
};

export function HandStrikeSequence({ w, h, spec, box, reveal, shown, accessibilityLabel, words }: HandStrikeProps) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h, box]);
  const g = useMemo(() => buildSection(spec), [spec]);
  const d = spec.drum;
  const op = (i: number) => {
    'worklet';
    const on = clamp01(reveal.value - i);
    return on * (reveal.value >= i + 1.98 ? 0.4 : 1);
  };
  const o1 = useDerivedValue(() => op(0));
  const o3 = useDerivedValue(() => op(2));
  const o4 = useDerivedValue(() => clamp01(reveal.value - 3));
  const amp = useDerivedValue(() => HEAD_AMP * clamp01(reveal.value - 1));
  const line = useDerivedValue(() => headLine(d.c.x, d.R, d.headY, amp.value));
  const fill = useDerivedValue(() => headFill(d.c.x, d.R, d.headY, amp.value));
  // The tool rests on the head at the strike (a pose, not a motion: ① shows the approach).
  const toolY = d.headY - 4;
  const skin = spec.head === 'rawhide' ? RAWHIDE : spec.head === 'goat' ? GOAT : FILM;
  const labels: StaticLabel[] = [];
  if (shown >= 1) labels.push({ id: 's1', text: words.s1, short: '①', u: g.sx - 80, v: d.headY - 250, align: 'right', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 's2', text: words.s2, short: '② HEAD IN', u: d.c.x + d.R + 30, v: d.headY + 12, align: 'left', tone: 'blue' });
  if (shown >= 3) labels.push({ id: 's3', text: words.s3, short: '③ AIR', u: d.c.x + g.rMid + 30, v: g.midY, align: 'left', tone: 'blue' });
  if (shown >= 4) {
    labels.push({ id: 's4a', text: words.s4a, short: '④ TOP', u: d.c.x + d.R * 1.2, v: d.headY - d.R * 1.6, align: 'left', tone: 'blue' });
    labels.push({ id: 's4b', text: words.s4b, short: '④ BOTTOM', u: d.c.x + g.rBot + 40, v: g.bot + (spec.open ? 40 : -60), align: 'left', tone: 'blue' });
  }
  if (spec.shorten) labels.push({ id: 'brk', text: 'SHELL SHORTENED', short: 'SHORTENED', u: d.c.x - g.rMid - 50, v: g.midY, align: 'right', tone: 'illustrative' });
  labels.push({ id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: box.u1 - 20, v: box.v1 - 24, align: 'right', tone: 'illustrative' });
  const mat = spec.material === 'brass' ? BRASS : WOOD;
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Path path={g.floor}>
            <LinearGradient start={vec(0, spec.floorY)} end={vec(0, spec.floorY + 60)} colors={FLOOR} />
          </Path>
          <Path path={g.floorEdge} style="stroke" strokeWidth={2.5} color="#4a4c58" />
          {/* the hollow inside, dim, warm; the cut walls (end grain / metal) */}
          <Path path={g.cavity}>
            <LinearGradient start={vec(0, g.top)} end={vec(0, g.bot)} colors={['#241910', '#140e09', '#070605']} />
          </Path>
          <Path path={g.cavity}>
            <RadialGradient c={vec(d.c.x - d.R * 0.3, g.top + 80)} r={d.R * 2.5} colors={['rgba(255,214,160,0.10)', 'rgba(255,214,160,0)']} />
          </Path>
          {[g.wallL, g.wallR].map((p, i) => (
            <Group key={i}>
              <Path path={p}>
                <LinearGradient start={vec(d.c.x - d.R, 0)} end={vec(d.c.x + d.R, 0)} colors={mat} />
              </Path>
              <Path path={p} style="stroke" strokeWidth={1.2} color={INK} />
            </Group>
          ))}
          {/* the shortened view's break (a drafting convention, labelled) */}
          {spec.shorten ? (
            <>
              <Path path={g.brk} color="#0d0d10" />
              <Path path={g.brkEdge} style="stroke" strokeWidth={2.4} color="#9aa0ab" opacity={0.85} />
            </>
          ) : null}
          <Path path={g.rimL}>
            <LinearGradient start={vec(d.c.x - d.R, 0)} end={vec(d.c.x + d.R, 0)} colors={CHROME} />
          </Path>
          <Path path={g.rimL} style="stroke" strokeWidth={0.9} color={INK} />
          {/* the head at rest (a film drawn thick enough to read) */}
          <Rect x={d.c.x - d.R} y={d.headY - 3} width={d.R * 2} height={6}>
            <LinearGradient start={vec(d.c.x - d.R, 0)} end={vec(d.c.x + d.R, 0)} colors={skin} />
          </Rect>
          {/* ② the head pushed in (its lowest shape, drawn larger) */}
          <Path path={fill} color="rgba(111,168,255,0.28)" />
          <Path path={line} style="stroke" strokeWidth={6} color={BLUE} />
          {/* ① the strike: the hand (or stick) at the strike point, and its approach */}
          <Group opacity={o1}>
            <Path path={g.approach} style="stroke" strokeWidth={7} color={AMBER} strokeCap="round" strokeJoin="round" />
            {spec.tool === 'hand' ? (
              <Group transform={[{ translateX: g.sx }, { translateY: toolY }]}>
                <Path path={g.hand} color="#000" opacity={0.4} transform={[{ translateX: 6 }, { translateY: 6 }]}>
                  <BlurMask blur={6} style="normal" />
                </Path>
                <Path path={g.hand}>
                  <LinearGradient start={vec(-d.R, -d.R * 0.4)} end={vec(d.R * 0.5, 0)} colors={SKIN} />
                </Path>
                <Path path={g.hand} style="stroke" strokeWidth={1.4} color={FIGURE_SKIN.edge} />
              </Group>
            ) : (
              <Group>
                <Path path={stickPath(g.sx, toolY)} style="stroke" strokeWidth={15} strokeCap="round" color="#3a2512" />
                <Path path={stickPath(g.sx, toolY)} style="stroke" strokeWidth={11} strokeCap="round" color="#c9925a" />
                <Path path={stickPath(g.sx, toolY)} style="stroke" strokeWidth={3} strokeCap="round" color="#ffe2ae" opacity={0.6} />
              </Group>
            )}
            <Circle cx={g.sx} cy={d.headY} r={16} style="stroke" strokeWidth={5} color={AMBER} />
          </Group>
          {/* ③ the air inside pushed down, toward the open end */}
          <Group opacity={o3}>
            <Path path={g.air} style="stroke" strokeWidth={6} color={AIR} strokeCap="round" strokeJoin="round">
              <DashPathEffect intervals={[20, 12]} />
            </Path>
            <Path path={g.outBottom} style="stroke" strokeWidth={6} color={AIR} strokeCap="round" strokeJoin="round" />
          </Group>
          {/* ④ where sound leaves (an overlay: direction, not amount) */}
          <Group opacity={o4}>
            <Path path={g.fromHead} style="stroke" strokeWidth={6} color={AIR} opacity={0.9}>
              <DashPathEffect intervals={[24, 14]} />
            </Path>
            <Path path={g.fromBottom} style="stroke" strokeWidth={6} color={AIR} opacity={0.85}>
              <DashPathEffect intervals={[20, 14]} />
            </Path>
          </Group>
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

function stickPath(x: number, y: number): SkPath {
  const p = Skia.Path.Make();
  p.moveTo(x - 300, y - 330);
  p.lineTo(x - 6, y - 8);
  return p;
}

/* ── where the hand or stick lands, and the shapes it drives ── */

export type StrokeMapProps = { w: number; h: number; drum: HandDrum; head: 'rawhide' | 'goat' | 'film'; stroke: StrokeSpec; accessibilityLabel: string; /** Draw to the scale of this (larger) radius, so two drums compare by size. */ scaleR?: number };

export { strokeShares };

const BOX_PAD = 70;

export function StrokeMap({ w, h, drum, head, stroke, accessibilityLabel, scaleR }: StrokeMapProps) {
  const textScale = useStageTextScale();
  const R = drum.R;
  const rr = R + drum.rim.t;
  // The frame is sized by the larger of the set, so a smaller head draws smaller.
  const RB = Math.max(R, scaleR ?? 0);
  const rrB = RB + drum.rim.t;
  // Head on the left, the five shape bars on the right (mm units, one transform).
  const barX0 = rrB + 90;
  const barW = RB * 1.7;
  const box = { u0: -rrB - BOX_PAD, u1: barX0 + barW + 40, v0: -rrB - 60, v1: rrB + 50 };
  const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h, RB]); // eslint-disable-line react-hooks/exhaustive-deps
  const shares = strokeShares(stroke.frac);
  const rowH = (2 * rrB) / HEAD_SHAPES.length;
  const icons = useMemo(() => {
    // Each shape's sign pattern as a tiny disc (blue +, amber −), built once.
    return HEAD_SHAPES.map((sh) => {
      const pos = Skia.Path.Make();
      const neg = Skia.Path.Make();
      const r = rowH * 0.36;
      const pk = shapePeak(sh);
      for (let i = 0; i < 8; i++) {
        for (let k = 0; k < 24; k++) {
          const r0 = i / 8;
          const r1 = (i + 1) / 8;
          const t0 = (k / 24) * 2 * Math.PI;
          const t1 = ((k + 1) / 24) * 2 * Math.PI;
          const v = shapeAt(sh, (r0 + r1) / 2, (t0 + t1) / 2) / pk;
          if (Math.abs(v) < 0.12) continue;
          const p = v > 0 ? pos : neg;
          const pt = (rad: number, t: number) => ({ x: Math.sin(t) * rad * r, y: -Math.cos(t) * rad * r });
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
    });
  }, [rowH]);
  const skin = head === 'rawhide' ? RAWHIDE : head === 'goat' ? GOAT : FILM;
  // The strike point: toward the player (−x, drawn to the LEFT of centre).
  const sx = stroke.frac == null ? -rr - 4 : -stroke.frac * R;
  const handLen = stroke.tool === 'palm' ? R * 0.62 : stroke.tool === 'stick' ? R * 0.12 : R * 0.42;
  const labels: StaticLabel[] = [
    { id: 'title', text: 'HOW STRONGLY THIS SPOT DRIVES EACH SHAPE', short: 'EACH SHAPE', u: barX0, v: -rrB - 30, align: 'left', tone: 'muted' },
    ...HEAD_SHAPES.map((sh, i) => ({ id: `s${i}`, text: `${sh.label} ×${sh.ratio.toFixed(2)}`, short: sh.label, u: barX0 + rowH * 0.9, v: -rrB + rowH * (i + 0.5), align: 'left' as const })),
    { id: 'player', text: '← PLAYER', u: -rrB - 20, v: rrB + 26, align: 'left', tone: 'muted' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Circle cx={10} cy={14} r={rr + 6} color="#000" opacity={0.55}>
            <BlurMask blur={10} style="normal" />
          </Circle>
          <Circle cx={0} cy={0} r={rr}>
            <RadialGradient c={vec(-rr * 0.45, -rr * 0.5)} r={rr * 1.7} colors={CHROME} />
          </Circle>
          <Circle cx={0} cy={0} r={R}>
            <RadialGradient c={vec(-R * 0.35, -R * 0.4)} r={R * 1.55} colors={skin} />
          </Circle>
          <Circle cx={0} cy={0} r={R} style="stroke" strokeWidth={2} color="#5a4326" opacity={0.8} />
          {/* the contact: a palm patch, finger pads, or a stick tip — and the strike ring */}
          {stroke.tool === 'stick' ? (
            <Circle cx={sx} cy={0} r={10} color="#c9925a" />
          ) : (
            <Group transform={[{ translateX: sx }, { translateY: 0 }]}>
              <Path path={contactPath(stroke.tool, handLen)} color="rgba(214,150,104,0.9)" />
              <Path path={contactPath(stroke.tool, handLen)} style="stroke" strokeWidth={2} color="#7a4a2a" />
            </Group>
          )}
          <Circle cx={sx} cy={0} r={18} style="stroke" strokeWidth={5} color={AMBER} />
          {/* the five bars */}
          {shares.map((v, i) => (
            <Group key={i}>
              <Group transform={[{ translateX: barX0 + rowH * 0.4 }, { translateY: -rrB + rowH * (i + 0.5) }]}>
                <Circle cx={0} cy={0} r={rowH * 0.38} color="#e8e2d4" />
                <Path path={icons[i].pos} color="rgba(111,168,255,0.85)" />
                <Path path={icons[i].neg} color="rgba(255,198,77,0.85)" />
                <Circle cx={0} cy={0} r={rowH * 0.38} style="stroke" strokeWidth={1.2} color="#55504a" />
              </Group>
              <Rect x={barX0 + rowH * 0.9} y={-rrB + rowH * (i + 0.62)} width={barW - rowH * 0.9} height={rowH * 0.26} color="#23252b" />
              <Rect x={barX0 + rowH * 0.9} y={-rrB + rowH * (i + 0.62)} width={(barW - rowH * 0.9) * v} height={rowH * 0.26} color={v < 0.05 ? '#ff6b5e' : BLUE} />
            </Group>
          ))}
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/** The contact, seen from above, fingers pointing away from the player (+x). */
function contactPath(tool: StrokeSpec['tool'], len: number): SkPath {
  const p = Skia.Path.Make();
  if (tool === 'palm') {
    p.addOval(Skia.XYWHRect(-len * 0.35, -len * 0.4, len * 0.9, len * 0.8));
  } else if (tool === 'tips') {
    for (let k = -1.5; k <= 1.5; k += 1) p.addOval(Skia.XYWHRect(-len * 0.12, k * len * 0.24 - len * 0.1, len * 0.3, len * 0.2));
  } else {
    for (let k = -1.5; k <= 1.5; k += 1) p.addRRect(Skia.RRectXY(Skia.XYWHRect(-len * 0.5, k * len * 0.24 - len * 0.1, len * 0.85, len * 0.2), len * 0.1, len * 0.1));
  }
  return p;
}
