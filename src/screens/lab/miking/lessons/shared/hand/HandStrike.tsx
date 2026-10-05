/**
 * HOW IT SOUNDS for a HAND DRUM (tonbak, tabla): the lesson's own drawing with
 * the order of events laid over it, one event per step — the stroke lands,
 * the head moves (drawn much larger), the air moves (or the bayan's head is
 * pressed), the sound leaves. Discrete overlays chosen by `shown` (an integer
 * that changes a handful of times per play-through): nothing animates per
 * frame and nothing loops (D8). Silent.
 *
 * Everything is in the view's millimetres (u, v) — the same anchors the
 * placement scene uses, passed in by the lesson.
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, DashPathEffect, Group, Path, Skia } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import type { VariantId, ViewBox, ViewId } from '../../../engine/model/types.ts';
import type { LessonArt } from '../../../engine/scene/sceneTypes.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';

type UV = readonly [number, number];
/** A head seen edge-on in this view: its centre, its outward normal (unit,
 *  in the view's plane) and its radius. */
export type StrikeHead = { id: string; c: UV; n: UV; r: number; label: string };
export type StrikeSpec = {
  view: ViewId;
  box: ViewBox;
  heads: readonly StrikeHead[];
  /** Where the strokes land (head id, offset across the head as a fraction of r). */
  strokes: readonly { head: string; at: number; label: string }[];
  /** Step 3: the air inside, from the head toward an opening … */
  air?: { path: readonly UV[]; label: string };
  /** … or a head pressed by the heel of the hand (the bayan). */
  press?: { head: string; at: number; label: string };
  /** Where some sound also leaves (an open end). */
  opening?: { c: UV; n: UV; r: number; label: string };
};

const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const make = () => Skia.Path.Make();
const tOf = (n: UV): UV => [-n[1], n[0]];

function arrowHead(p: ReturnType<typeof make>, tip: UV, dir: UV, s: number) {
  const t = tOf(dir);
  p.moveTo(tip[0] - dir[0] * s + t[0] * s * 0.6, tip[1] - dir[1] * s + t[1] * s * 0.6);
  p.lineTo(tip[0], tip[1]);
  p.lineTo(tip[0] - dir[0] * s - t[0] * s * 0.6, tip[1] - dir[1] * s - t[1] * s * 0.6);
}

export function HandStrike({ w, h, art, variant, spec, shown, accessibilityLabel }: { w: number; h: number; art: LessonArt; variant: VariantId; spec: StrikeSpec; shown: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform(spec.view, spec.box, w, h, 6), [spec.view, spec.box, w, h]);
  const Instrument = art.Instrument;
  const headOf = (id: string) => spec.heads.find((q) => q.id === id) ?? spec.heads[0];
  const g = useMemo(() => {
    const strokes = make();
    const strokeHeads = make();
    for (const s of spec.strokes) {
      const hd = headOf(s.head);
      const t = tOf(hd.n);
      const tip: UV = [hd.c[0] + t[0] * s.at * hd.r + hd.n[0] * 10, hd.c[1] + t[1] * s.at * hd.r + hd.n[1] * 10];
      const L = Math.max(hd.r * 1.1, 170);
      const from: UV = [tip[0] + hd.n[0] * L + t[0] * L * 0.22, tip[1] + hd.n[1] * L + t[1] * L * 0.22];
      strokes.moveTo(from[0], from[1]);
      strokes.lineTo(tip[0], tip[1]);
      const d = Math.hypot(tip[0] - from[0], tip[1] - from[1]) || 1;
      arrowHead(strokeHeads, tip, [(tip[0] - from[0]) / d, (tip[1] - from[1]) / d], 26);
    }
    // The head bowed inward (motion drawn much larger), over its rest line.
    const rest = make();
    const bowed = make();
    for (const hd of spec.heads) {
      const t = tOf(hd.n);
      const a: UV = [hd.c[0] - t[0] * hd.r, hd.c[1] - t[1] * hd.r];
      const b: UV = [hd.c[0] + t[0] * hd.r, hd.c[1] + t[1] * hd.r];
      rest.moveTo(a[0], a[1]);
      rest.lineTo(b[0], b[1]);
      const k = hd.r * 0.42;
      bowed.moveTo(a[0], a[1]);
      bowed.quadTo(hd.c[0] - hd.n[0] * k, hd.c[1] - hd.n[1] * k, b[0], b[1]);
    }
    // Step 3: the air path, or the press.
    const air = make();
    const airHeads = make();
    if (spec.air) {
      const pts = spec.air.path;
      air.moveTo(pts[0][0], pts[0][1]);
      for (const p of pts.slice(1)) air.lineTo(p[0], p[1]);
      const a = pts[pts.length - 2];
      const b = pts[pts.length - 1];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      arrowHead(airHeads, b, [(b[0] - a[0]) / d, (b[1] - a[1]) / d], 30);
    }
    const press = make();
    const pressArrow = make();
    if (spec.press) {
      const hd = headOf(spec.press.head);
      const t = tOf(hd.n);
      const c: UV = [hd.c[0] + t[0] * spec.press.at * hd.r + hd.n[0] * 34, hd.c[1] + t[1] * spec.press.at * hd.r + hd.n[1] * 34];
      // The heel of the hand: a rounded pad lying on the head.
      const ang = Math.atan2(t[1], t[0]);
      press.addRRect(Skia.RRectXY(Skia.XYWHRect(-hd.r * 0.42, -26, hd.r * 0.84, 52), 26, 26));
      press.transform(Skia.Matrix().translate(c[0], c[1]).rotate(ang));
      const from: UV = [c[0] + hd.n[0] * 120, c[1] + hd.n[1] * 120];
      const tip: UV = [c[0] + hd.n[0] * 34, c[1] + hd.n[1] * 34];
      pressArrow.moveTo(from[0], from[1]);
      pressArrow.lineTo(tip[0], tip[1]);
      arrowHead(pressArrow, tip, [-hd.n[0], -hd.n[1]], 24);
    }
    // Step 4: wavefronts leaving each head (and the opening, fainter).
    const waves = make();
    const wavesFaint = make();
    const arc = (p: ReturnType<typeof make>, c: UV, n: UV, R: number, half: number) => {
      const a0 = Math.atan2(n[1], n[0]);
      const N = 24;
      for (let i = 0; i <= N; i++) {
        const a = a0 - half + (2 * half * i) / N;
        const x = c[0] + Math.cos(a) * R;
        const y = c[1] + Math.sin(a) * R;
        if (i === 0) p.moveTo(x, y);
        else p.lineTo(x, y);
      }
    };
    for (const hd of spec.heads) for (const k of [1.25, 1.75, 2.25]) arc(waves, hd.c, hd.n, hd.r * k, 0.95);
    if (spec.opening) for (const k of [1.3, 2.0]) arc(wavesFaint, spec.opening.c, spec.opening.n, spec.opening.r * k + 20, 0.9);
    return { strokes, strokeHeads, rest, bowed, air, airHeads, press, pressArrow, waves, wavesFaint };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec]);
  const labels: StaticLabel[] = [];
  if (shown === 1) {
    // Each label past its arrow's tail, staggered outward so two never collide.
    spec.strokes.forEach((s, i) => {
      const hs = headOf(s.head);
      const t = tOf(hs.n);
      const k = Math.max(hs.r * 1.1, 170) * 1.25 + hs.r * 0.42 * i;
      labels.push({ id: `s-${s.head}-${s.at}`, text: s.label, u: hs.c[0] + t[0] * s.at * hs.r + hs.n[0] * k + t[0] * hs.r * 0.3, v: hs.c[1] + t[1] * s.at * hs.r + hs.n[1] * k + t[1] * hs.r * 0.3, align: 'center', tone: 'amber' });
    });
  }
  if (shown === 2) for (const hd of spec.heads) labels.push({ id: `b-${hd.id}`, text: `${hd.label} MOVES · DRAWN LARGER`, short: 'MOVES', u: hd.c[0] + hd.n[0] * hd.r * 0.9, v: hd.c[1] + hd.n[1] * hd.r * 0.9, align: 'center', tone: 'blue' });
  if (shown === 3 && spec.air) {
    const m = spec.air.path[Math.floor(spec.air.path.length / 2)];
    labels.push({ id: 'air', text: spec.air.label, u: m[0] + 60, v: m[1], align: 'left', tone: 'blue' });
  }
  if (shown === 3 && spec.press) {
    const hd = headOf(spec.press.head);
    labels.push({ id: 'press', text: spec.press.label, u: hd.c[0] + hd.n[0] * 190, v: hd.c[1] + hd.n[1] * 190, align: 'center', tone: 'amber' });
  }
  if (shown >= 4) {
    for (const hd of spec.heads) labels.push({ id: `w-${hd.id}`, text: `SOUND LEAVES THE ${hd.label}`, short: 'SOUND', u: hd.c[0] + hd.n[0] * hd.r * 2.55, v: hd.c[1] + hd.n[1] * hd.r * 2.55, align: 'center', tone: 'blue' });
    if (spec.opening) labels.push({ id: 'w-open', text: spec.opening.label, u: spec.opening.c[0] + spec.opening.n[0] * (spec.opening.r * 2 + 90), v: spec.opening.c[1] + spec.opening.n[1] * (spec.opening.r * 2 + 90), align: 'center', tone: 'blue' });
  }
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Instrument view={spec.view} variant={variant} />
          {shown === 1 ? (
            <>
              <Path path={g.strokes} style="stroke" strokeWidth={14} strokeCap="round" color={AMBER} opacity={0.9} />
              <Path path={g.strokeHeads} style="stroke" strokeWidth={10} strokeCap="round" strokeJoin="round" color={AMBER} />
            </>
          ) : null}
          {shown >= 2 ? (
            <>
              <Path path={g.rest} style="stroke" strokeWidth={3} color="#ffffff" opacity={0.6}>
                <DashPathEffect intervals={[12, 9]} />
              </Path>
              <Path path={g.bowed} style="stroke" strokeWidth={9} strokeCap="round" color={BLUE} opacity={shown === 2 ? 1 : 0.45} />
            </>
          ) : null}
          {shown === 3 && spec.air ? (
            <>
              <Path path={g.air} style="stroke" strokeWidth={8} strokeCap="round" color={BLUE}>
                <DashPathEffect intervals={[22, 14]} />
              </Path>
              <Path path={g.airHeads} style="stroke" strokeWidth={8} strokeCap="round" strokeJoin="round" color={BLUE} />
            </>
          ) : null}
          {shown === 3 && spec.press ? (
            <>
              <Path path={g.press} color={AMBER} opacity={0.45} />
              <Path path={g.press} style="stroke" strokeWidth={4} color={AMBER} />
              <Path path={g.pressArrow} style="stroke" strokeWidth={9} strokeCap="round" strokeJoin="round" color={AMBER} />
            </>
          ) : null}
          {shown >= 4 ? (
            <>
              <Path path={g.waves} style="stroke" strokeWidth={7} strokeCap="round" color={BLUE} opacity={0.85} />
              <Path path={g.wavesFaint} style="stroke" strokeWidth={6} strokeCap="round" color={BLUE} opacity={0.45} />
            </>
          ) : null}
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
