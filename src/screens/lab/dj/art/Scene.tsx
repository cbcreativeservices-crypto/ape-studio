/**
 * Scene — one Skia canvas showing a FRAME of millimetre-authored drawings,
 * fitted to the glass (w × h) by one transform, with plain labels (the calm
 * Miking style: words in clear space, a dot on the part and a hairline
 * leader). Every lab stage is a Scene: the booth (BoothStage), the rear
 * panels, the system map, the equipment catalogue. FULL SCREEN hands it a
 * bigger (w, h) — every anchor and label stays aligned at every size, and the
 * labels grow with the picture (D35: everything zooms).
 *
 * LABEL LAYOUT (visual review 2026-10-18, finding 11): a label never covers a
 * control. The scene is told where the controls are (`obstacles`: the parts'
 * own boxes, the same boxes the halos use) and where the bodies are (`soft`);
 * each label tries its asked-for place, then eight sides at growing
 * distances, then the glass's margins, and keeps the best by a score —
 * overlap with a control, with another label or leader, a leader that
 * crosses more than one control, and length. A label too wide for its place
 * wraps to two lines; it is never cut.
 *
 * React context does not cross into the Skia reconciler, so the motion clock
 * and the scene fonts are provided again INSIDE the canvas.
 */
import { useContext, useEffect, useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Circle, Group, Line, LinearGradient, Rect, Skia, vec } from '@shopify/react-native-skia';
import { colors, fonts } from '../../../../theme/tokens';
import { StageAspectReport, useStageTextScale } from '../../rack/stageAspect';
import { fitView, type Box, type Pt } from '../geometry/boothGeometry';
import { MotionContext, type BoothMotion } from './motion';
import { SceneFontsProvider } from './sceneText';
import { DjZoomContext, zoomedXf } from './djZoom';

export type Callout = {
  id: string;
  text: string;
  /** The part, in scene mm. */
  at: Pt;
  /** Where the words would like to sit, in points from the part. */
  dx: number;
  dy: number;
  tone?: 'amber' | 'plain' | 'blue' | 'red' | 'green';
  /** ADDITIVE (2026-10-19): the label's lines, broken by the caller and
   *  each kept whole (a two-line label where a one-line one has no room). */
  lines?: readonly string[];
};

export type Xf = { s: number; ox: number; oy: number };

const TONE = { amber: colors.amber, plain: colors.textPrimary, blue: '#8fbcff', red: '#ff8a7e', green: '#7dff9f' } as const;
const EDGE = { amber: 'rgba(255,198,77,0.75)', plain: 'rgba(255,255,255,0.55)', blue: 'rgba(143,188,255,0.75)', red: 'rgba(255,138,126,0.8)', green: 'rgba(125,255,159,0.75)' } as const;

export function Scene({ w, h, frame, motion, callouts = [], obstacles, soft, screenOverlay, a11y, children, pad = 6, fit, aspect, labelsOutsideFit = false, focus, printed }: {
  w: number;
  h: number;
  frame: Box;
  motion: BoothMotion;
  callouts?: readonly Callout[];
  /** Controls (scene mm): no label sits on one. */
  obstacles?: readonly Box[];
  /** Device bodies (scene mm): labels prefer the space round them. */
  soft?: readonly Box[];
  screenOverlay?: (w: number, h: number, xf: Xf, k: number) => ReactNode;
  a11y: string;
  children: ReactNode;
  pad?: number;
  /** The part of the glass (points) the frame is fitted into — a stage that
   *  shares the glass with a plot keeps its drawing out of the plot's area
   *  (and its labels too). */
  fit?: { x: number; y: number; w: number; h: number };
  /** The whole composition's width ÷ height, for FULL SCREEN (the canvas at
   *  every zoom is then the drawing's own shape, with no empty band). The
   *  frame's own aspect when there is no `fit`; `false` reports nothing. */
  aspect?: number | false;
  /** The glass outside `fit` is free space (not a plot): labels may use it. */
  labelsOutsideFit?: boolean;
  /** ADDITIVE (visual review 2026-10-18 #22): the part (scene mm) a FULL
   *  SCREEN zoom opens on — the part the lesson is about. Default: the first
   *  callout's part, else the frame's centre. */
  focus?: Box;
  /** ADDITIVE (grade 2026-10-19, Screen 7): printed panel legends (scene mm,
   *  with their type size in mm). Each is a label obstacle only once the zoom
   *  renders it legible (≥ 9 pt, the size at which sceneText draws it), so a
   *  close look never hides a legend under a callout while the 1× view keeps
   *  its room. */
  printed?: readonly (Box & { size: number })[];
}) {
  // The drawing grows by the full-screen zoom; its words grow too (D35),
  // but by the square root, so a closer look shows more drawing, not just
  // bigger labels over the same parts.
  const kz = useStageTextScale();
  // In the DJ rack's full screen the gear zooms by `dz.z` inside a window
  // whose plots stay pinned (art/djZoom); the words grow by its square root.
  const dz = useContext(DjZoomContext);
  const zoomed = dz.z > 1;
  const k = Math.sqrt(Math.max(1, kz * dz.z));
  const report = useContext(StageAspectReport);
  const shape = aspect === false ? null : aspect ?? (fit ? null : frame.w / frame.h);
  const shapeKey = shape == null ? 0 : Math.round(shape * 1000) / 1000;
  useEffect(() => {
    if (shapeKey > 0) report?.aspect(shapeKey, 0);
  }, [report, shapeKey]);
  const c0 = callouts[0]?.at;
  const fx = focus ? focus.x + focus.w / 2 : c0 ? c0.x : frame.x + frame.w / 2;
  const fy = focus ? focus.y + focus.h / 2 : c0 ? c0.y : frame.y + frame.h / 2;
  const xf = useMemo(() => {
    const f = fit ?? { x: 0, y: 0, w, h };
    const v = fitView(frame, f.w, f.h, pad);
    const base = { s: v.s, ox: v.ox + f.x, oy: v.oy + f.y };
    if (!zoomed) return base;
    const zx = zoomedXf(base, f, frame, { x: fx, y: fy }, dz.z, dz.pan);
    if (dz.limits) dz.limits.current = zx.limits;
    return zx.xf;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, w, h, pad, fit?.x, fit?.y, fit?.w, fit?.h, zoomed, dz.z, dz.pan.x, dz.pan.y, fx, fy]);
  // zoomed, only the labels of parts inside the gear's region are placed
  const shown = useMemo(() => {
    if (!zoomed) return callouts;
    const f = fit ?? { x: 0, y: 0, w, h };
    return callouts.filter((c) => {
      const px = xf.ox + c.at.x * xf.s;
      const py = xf.oy + c.at.y * xf.s;
      return px >= f.x + 4 && px <= f.x + f.w - 4 && py >= f.y + 4 && py <= f.y + f.h - 4;
    });
  }, [zoomed, callouts, xf, fit?.x, fit?.y, fit?.w, fit?.h, w, h]);
  const { s, ox, oy } = xf;
  const boxes = useMemo(
    () => {
      const legible = printed ? printed.filter((p) => p.size * s >= 9 - 1e-3) : [];
      const hard = legible.length ? [...(obstacles ?? []), ...legible] : obstacles ?? [];
      return layoutCallouts(shown, xf, w, h, k, hard, soft ?? [], labelsOutsideFit ? undefined : fit);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shown, ox, oy, s, w, h, k, obstacles, soft, fit?.x, fit?.y, fit?.w, fit?.h, labelsOutsideFit, printed],
  );
  const fs = 10 * k;
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
        <Rect x={0} y={0} width={w} height={h}>
          <LinearGradient start={vec(0, 0)} end={vec(0, h)} colors={['#0e0f13', '#08080a']} />
        </Rect>
        <MotionContext.Provider value={motion}>
          <SceneFontsProvider s={s} textScale={k}>
            <Group clip={fit ? Skia.XYWHRect(fit.x, fit.y, fit.w, fit.h) : undefined}>
              <Group transform={[{ translateX: ox }, { translateY: oy }, { scale: s }]}>{children}</Group>
            </Group>
          </SceneFontsProvider>
          {/* screen-space overlays (plots, panels) draw at 1 pt per unit */}
          {screenOverlay ? <SceneFontsProvider s={1} textScale={kz}>{screenOverlay(w, h, xf, kz)}</SceneFontsProvider> : null}
        </MotionContext.Provider>
        {boxes.map((b) =>
          b.leader ? (
            <Group key={`l${b.c.id}`}>
              <Line p1={vec(b.px, b.py)} p2={vec(b.leader.x, b.leader.y)} color="rgba(0,0,0,0.6)" strokeWidth={2.4 * Math.min(k, 2)} />
              <Line p1={vec(b.px, b.py)} p2={vec(b.leader.x, b.leader.y)} color={EDGE[b.c.tone ?? 'amber']} strokeWidth={Math.min(k, 2)} />
              <Circle cx={b.px} cy={b.py} r={2.6 * Math.min(k, 2)} color="rgba(0,0,0,0.7)" />
              <Circle cx={b.px} cy={b.py} r={1.8 * Math.min(k, 2)} color={TONE[b.c.tone ?? 'amber']} />
            </Group>
          ) : null,
        )}
      </Canvas>
      {boxes.map((b) => (
        <View key={b.c.id} pointerEvents="none" style={[styles.callout, { left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: 4 * k }]}>
          <Text
            style={[styles.calloutText, { color: TONE[b.c.tone ?? 'amber'], fontSize: fs, lineHeight: LINE * k, letterSpacing: 0.6 * k }]}
            numberOfLines={b.lines.length}
            allowFontScaling={false}
          >
            {b.lines.join('\n')}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* ── label layout (pure) ──────────────────────────────────────────────── */

const LINE = 12.5;
type R = { x0: number; y0: number; x1: number; y1: number };

/** Words' width (pt) in the label face (Oswald Medium) at 10 pt × k,
 *  letter-spaced 0.6 — per-glyph widths, so a long name is never cut. */
export function textWidthPt(t: string, k = 1): number {
  let em = 0;
  for (const c of t) em += 'MW'.includes(c) ? 0.74 : ' .,:;·\'’|!I1()'.includes(c) ? 0.3 : c === '↔' || c === '→' ? 0.9 : 0.55;
  return em * 10 * k + t.length * 0.6 * k;
}

/** Split a label into one or two lines that fit `maxW`. */
export function wrapLabel(t: string, maxW: number, k = 1): string[] {
  if (textWidthPt(t, k) <= maxW) return [t];
  const words = t.split(' ');
  if (words.length < 2) return [t];
  let best: string[] = [t];
  let bestW = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const ww = Math.max(textWidthPt(a, k), textWidthPt(b, k));
    if (ww < bestW) {
      bestW = ww;
      best = [a, b];
    }
  }
  return best;
}

const area = (a: R, b: R) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
const inside = (p: { x: number; y: number }, r: R) => p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1;
function segHits(ax: number, ay: number, bx: number, by: number, r: R): boolean {
  const n = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) / 3));
  for (let i = 1; i < n; i++) {
    const x = ax + ((bx - ax) * i) / n;
    const y = ay + ((by - ay) * i) / n;
    if (x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1) return true;
  }
  return false;
}
function segsCross(a: [number, number, number, number], b: [number, number, number, number]): boolean {
  const d = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) => (qx - px) * (ry - py) - (qy - py) * (rx - px);
  const d1 = d(b[0], b[1], b[2], b[3], a[0], a[1]);
  const d2 = d(b[0], b[1], b[2], b[3], a[2], a[3]);
  const d3 = d(a[0], a[1], a[2], a[3], b[0], b[1]);
  const d4 = d(a[0], a[1], a[2], a[3], b[2], b[3]);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

export type PlacedLabel = { c: Callout; px: number; py: number; x: number; y: number; w: number; h: number; lines: string[]; leader: { x: number; y: number } | null; score: number };

/**
 * Place every label (in the order given: the first ones are the primary
 * names and win the best spots). Pure, so a test can reach it.
 */
export function layoutCallouts(
  cs: readonly Callout[],
  xf: Xf,
  w: number,
  h: number,
  k: number,
  obstacles: readonly Box[],
  soft: readonly Box[],
  fit?: { x: number; y: number; w: number; h: number },
): PlacedLabel[] {
  const toR = (b: Box, grow = 0): R => ({ x0: xf.ox + b.x * xf.s - grow, y0: xf.oy + b.y * xf.s - grow, x1: xf.ox + (b.x + b.w) * xf.s + grow, y1: xf.oy + (b.y + b.h) * xf.s + grow });
  const hard = obstacles.map((b) => toR(b, 2 * k));
  const softR = soft.map((b) => toR(b));
  // the glass outside the fit region holds the page's plots: keep off them
  if (fit) {
    if (fit.y > 1) hard.push({ x0: 0, y0: 0, x1: w, y1: fit.y });
    if (fit.y + fit.h < h - 1) hard.push({ x0: 0, y0: fit.y + fit.h, x1: w, y1: h });
    if (fit.x > 1) hard.push({ x0: 0, y0: fit.y, x1: fit.x, y1: fit.y + fit.h });
    if (fit.x + fit.w < w - 1) hard.push({ x0: fit.x + fit.w, y0: fit.y, x1: w, y1: fit.y + fit.h });
  }
  const placed: PlacedLabel[] = [];
  const leaders: [number, number, number, number][] = [];
  const padX = 4 * k;
  const lineH = LINE * k;
  const maxW = Math.min(150 * k, w * 0.46);
  const m = 3 * k;
  for (const c of cs) {
    const px = xf.ox + c.at.x * xf.s;
    const py = xf.oy + c.at.y * xf.s;
    const lines = c.lines ? [...c.lines] : wrapLabel(c.text, maxW - padX * 2, k);
    const bw = Math.ceil(Math.max(...lines.map((l) => textWidthPt(l, k))) + padX * 2);
    const bh = Math.ceil(lines.length * lineH + 4 * k);
    const cands: { x: number; y: number; pref: number }[] = [];
    // the asked-for place first
    {
      const qx = px + c.dx * k;
      const qy = py + c.dy * k;
      cands.push({ x: c.dx < 0 ? qx - bw : c.dx > 0 ? qx : qx - bw / 2, y: qy - bh / 2, pref: -30 });
    }
    for (const d of [10, 18, 28, 42, 60, 84, 112].map((v) => v * k)) {
      const dd = d * 0.72;
      cands.push(
        { x: px + d, y: py - bh / 2, pref: 0 },
        { x: px - d - bw, y: py - bh / 2, pref: 0 },
        { x: px - bw / 2, y: py - d - bh, pref: 0 },
        { x: px - bw / 2, y: py + d, pref: 0 },
        { x: px + dd, y: py - dd - bh, pref: 2 },
        { x: px - dd - bw, y: py - dd - bh, pref: 2 },
        { x: px + dd, y: py + dd, pref: 2 },
        { x: px - dd - bw, y: py + dd, pref: 2 },
      );
    }
    // the glass's margins, level with the part and a row either side
    for (const dy of [0, -1.3, 1.3, -2.6, 2.6]) {
      cands.push({ x: m, y: py - bh / 2 + dy * bh, pref: 8 }, { x: w - m - bw, y: py - bh / 2 + dy * bh, pref: 8 });
    }
    let best: PlacedLabel | null = null;
    for (const cd of cands) {
      const x = Math.max(m, Math.min(w - bw - m, cd.x));
      const y = Math.max(m, Math.min(h - bh - m, cd.y));
      const r: R = { x0: x, y0: y, x1: x + bw, y1: y + bh };
      const A = bw * bh;
      let score = cd.pref + (Math.abs(x - cd.x) + Math.abs(y - cd.y)) * 0.5;
      for (const o of hard) score += (area(r, o) / A) * 900;
      for (const o of softR) score += (area(r, o) / A) * 30;
      for (const p of placed) if (area(r, { x0: p.x - 2 * k, y0: p.y - 2 * k, x1: p.x + p.w + 2 * k, y1: p.y + p.h + 2 * k }) > 0) score += 4000;
      for (const l of leaders) if (segHits(l[0], l[1], l[2], l[3], r)) score += 700;
      // the leader: from the part to the nearest point of the box
      const lx = Math.max(r.x0, Math.min(r.x1, px));
      const ly = Math.max(r.y0, Math.min(r.y1, py));
      const len = Math.hypot(lx - px, ly - py);
      const hasLeader = len > 5 * k;
      if (hasLeader) {
        let crossed = 0;
        for (const o of hard) if (!inside({ x: px, y: py }, o) && segHits(px, py, lx, ly, o)) crossed += 1;
        score += crossed <= 1 ? crossed * 70 : 70 + (crossed - 1) * 400;
        for (const l of leaders) if (segsCross(l, [px, py, lx, ly])) score += 260;
        for (const p of placed) if (segHits(px, py, lx, ly, { x0: p.x, y0: p.y, x1: p.x + p.w, y1: p.y + p.h })) score += 600;
        score += len * 0.55;
      }
      if (!best || score < best.score) best = { c, px, py, x, y, w: bw, h: bh, lines, leader: hasLeader ? { x: lx, y: ly } : null, score };
    }
    placed.push(best!);
    if (best!.leader) leaders.push([px, py, best!.leader.x, best!.leader.y]);
  }
  return placed;
}

const styles = StyleSheet.create({
  callout: { position: 'absolute', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(8,8,10,0.55)' },
  calloutText: {
    fontFamily: fonts.oswaldMedium,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
});
