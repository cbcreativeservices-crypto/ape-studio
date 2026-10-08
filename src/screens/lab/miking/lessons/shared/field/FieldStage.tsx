/**
 * A FITTED DRAWING for Lab 6 group 6's own steps (F09's frame line and head
 * turn, F10's site, its rigs and its drills): one Skia canvas fitted to a box
 * in the view's millimetres (fitXform, the engine's rule), labels over it in
 * native text (StaticLabels: never under 9 pt, full words or the short form),
 * and the small marks the steps share — a white DIMENSION with ticks, an
 * amber dashed AIM with an arrowhead, a dashed ray. Accessible: one labelled
 * image (the step passes its words). Static (D8).
 */
import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import { Canvas, DashPathEffect, Group, Path, RoundedRect, Skia } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform, type ViewXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { MikingMicArt } from '../../../../../../features/lab/micDrawings';
import type { ViewBox, ViewId } from '../../../engine/model/types.ts';

export type Pt2 = { u: number; v: number };
const AMBER = '#ffc64d';

/** The fitted transform for a box (exported for tests and labels). */
export function fieldXform(view: ViewId, box: ViewBox, w: number, h: number): ViewXform {
  return fitXform(view, box, w, h, 8);
}

/** A close-up drawn in a corner of the same canvas (the exact shape of a
 *  small rig the site's scale makes a few pixels): its own box and view,
 *  fitted into `at` (a share of the stage: x, y, w, h in 0…1). */
export type FieldInset = { view: ViewId; box: ViewBox; at: { x: number; y: number; w: number; h: number }; draw: (px: number) => ReactNode; labels?: StaticLabel[]; title?: string };

export function FieldStage({ w, h, view, box, a11y, labels, children, inset }: { w: number; h: number; view: ViewId; box: ViewBox; a11y: string; labels: StaticLabel[]; children: (px: number) => ReactNode; inset?: FieldInset | null }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fieldXform(view, box, w, h), [view, w, h, box]);
  // One screen pixel in mm: marks keep their on-screen weight at any scale.
  const px = 1 / xf.s;
  const ir = inset ? { x: inset.at.x * w, y: inset.at.y * h, w: inset.at.w * w, h: inset.at.h * h } : null;
  const ixf = useMemo(() => (inset && ir ? (() => { const f = fitXform(inset.view, inset.box, ir.w, ir.h, 6); return { ...f, ox: f.ox + ir.x, oy: f.oy + ir.y }; })() : null), [inset, ir?.x, ir?.y, ir?.w, ir?.h]); // eslint-disable-line react-hooks/exhaustive-deps
  const panel = useMemo(() => (ir ? Skia.RRectXY(Skia.XYWHRect(ir.x, ir.y, ir.w, ir.h), 8, 8) : null), [ir?.x, ir?.y, ir?.w, ir?.h]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>{children(px)}</Group>
        {inset && ixf && panel ? (
          <Group>
            <RoundedRect x={ir!.x} y={ir!.y} width={ir!.w} height={ir!.h} r={8} color="#0b0c0f" opacity={0.92} />
            <RoundedRect x={ir!.x} y={ir!.y} width={ir!.w} height={ir!.h} r={8} style="stroke" strokeWidth={1.2} color={AMBER} opacity={0.7} />
            <Group clip={panel}>
              <Group transform={[{ translateX: ixf.ox }, { translateY: ixf.oy }, { scale: ixf.s }]}>{inset.draw(1 / ixf.s)}</Group>
            </Group>
          </Group>
        ) : null}
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
      {inset && ixf && inset.labels?.length ? <StaticLabels labels={inset.labels} xf={ixf} scale={textScale} w={w} /> : null}
    </View>
  );
}

/** A white dimension between two points: the line, a tick at each end. */
export function Dim({ a, b, px, color = '#f2f4f8' }: { a: Pt2; b: Pt2; px: number; color?: string }) {
  const p = useMemo(() => {
    const path = Skia.Path.Make();
    path.moveTo(a.u, a.v);
    path.lineTo(b.u, b.v);
    const dx = b.u - a.u;
    const dy = b.v - a.v;
    const l = Math.hypot(dx, dy) || 1;
    const nx = (-dy / l) * 7 * px;
    const ny = (dx / l) * 7 * px;
    for (const q of [a, b]) {
      path.moveTo(q.u - nx, q.v - ny);
      path.lineTo(q.u + nx, q.v + ny);
    }
    return path;
  }, [a.u, a.v, b.u, b.v, px]);
  return (
    <Group>
      <Path path={p} style="stroke" strokeWidth={4.2 * px} color="#000" opacity={0.6} />
      <Path path={p} style="stroke" strokeWidth={2 * px} color={color} />
    </Group>
  );
}

/** An amber dashed aim from a point along a direction, with an arrowhead. */
export function Aim({ from, dir, len, px, color = AMBER }: { from: Pt2; dir: Pt2; len: number; px: number; color?: string }) {
  const p = useMemo(() => {
    const l = Math.hypot(dir.u, dir.v) || 1;
    const ux = dir.u / l;
    const uy = dir.v / l;
    const end = { u: from.u + ux * len, v: from.v + uy * len };
    const line = Skia.Path.Make();
    line.moveTo(from.u, from.v);
    line.lineTo(end.u, end.v);
    const head = Skia.Path.Make();
    const hs = 12 * px;
    head.moveTo(end.u - ux * hs - uy * hs * 0.55, end.v - uy * hs + ux * hs * 0.55);
    head.lineTo(end.u, end.v);
    head.lineTo(end.u - ux * hs + uy * hs * 0.55, end.v - uy * hs - ux * hs * 0.55);
    return { line, head };
  }, [from.u, from.v, dir.u, dir.v, len, px]);
  return (
    <Group>
      <Path path={p.line} style="stroke" strokeWidth={2.4 * px} color={color} opacity={0.95}>
        <DashPathEffect intervals={[9 * px, 6 * px]} />
      </Path>
      <Path path={p.head} style="stroke" strokeWidth={2.4 * px} strokeCap="round" strokeJoin="round" color={color} />
    </Group>
  );
}

/** A straight dashed ray (a sound path, an axis). */
export function Ray({ a, b, px, color = '#8fbcff', width = 2, dash = [10, 7] }: { a: Pt2; b: Pt2; px: number; color?: string; width?: number; dash?: [number, number] }) {
  const p = useMemo(() => {
    const path = Skia.Path.Make();
    path.moveTo(a.u, a.v);
    path.lineTo(b.u, b.v);
    return path;
  }, [a.u, a.v, b.u, b.v]);
  return (
    <Path path={p} style="stroke" strokeWidth={width * px} color={color} opacity={0.9}>
      <DashPathEffect intervals={[dash[0] * px, dash[1] * px]} />
    </Path>
  );
}

/** The view's (u, v) of a frame-V or frame-F point (side: x, y; top: x, z). */
export const uvOf = (view: ViewId, p: { x: number; y: number; z: number }): Pt2 => ({ u: p.x, v: view === 'side' ? p.y : p.z });

/** A mic drawn at its front `p`, aimed along `aim` (3-D, unit), the engine's
 *  rule (PlacementScene.MicGlyph): the body runs back from the front, turned
 *  into the view and foreshortened. */
export function MicAt({ view, p, aim, art, r, len, cross }: { view: ViewId; p: { x: number; y: number; z: number }; aim: { x: number; y: number; z: number }; art: Parameters<typeof MikingMicArt>[0]['art']; r: number; len: number; cross?: number }) {
  const bx = -aim.x;
  const by = view === 'side' ? -aim.y : -aim.z;
  const fore = Math.max(0.12, Math.hypot(bx, by));
  const ang = Math.atan2(by, bx) - Math.PI / 2;
  const o = uvOf(view, p);
  return (
    <Group transform={[{ translateX: o.u }, { translateY: o.v }, { rotate: ang }, { scaleY: fore }]}>
      <MikingMicArt art={art} r={r} len={len} cross={cross ?? r * 2} />
    </Group>
  );
}
