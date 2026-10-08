/**
 * THE HEAD ICONS — Skia renderer (head fix 2026-10-08). The geometry, the
 * owner's rules and the canon live in headIconGeometry.ts; react-native-svg
 * screens use headIconsSvg.tsx (same geometry, no Skia).
 *
 * ⛔ OWNER RULE 2026-10-08: only for a head ALONE (a listener, a talker, a plan
 * marker). A head on a body is the figure's skin-silhouette head
 * (figureHead.tsx → PlayerFigure FigureHead), never this icon, never a circle.
 *
 * Skia-only: load it only from modules that are themselves Skia-gated.
 */
import { useMemo } from 'react';
import { BlurMask, Group, Path, Skia } from '@shopify/react-native-skia';
import {
  ABOVE_CANON,
  HEAD_ICON_LINE,
  HEAD_ICON_PLATE,
  SIDE_CANON,
  SIDE_CENTER,
  SIDE_NECK,
  appendHeadIcon,
  buildAboveLines,
  buildAbovePlate,
  buildSideLines,
  buildSideOpenMouth,
  buildSidePlate,
  headIconScale,
  type HeadIconView,
} from './headIconGeometry';

export {
  ABOVE_CANON,
  HEAD_ICON_LINE,
  HEAD_ICON_PLATE,
  SIDE_CANON,
  aboveRotation,
  appendHeadIcon,
  headIconScale,
  headIconStroke,
  type HeadIconView,
} from './headIconGeometry';

type SkPath = ReturnType<typeof Skia.Path.Make>;

export type HeadIconParts = { lines: SkPath; plate: SkPath; open: SkPath | null };

/** The icon's paths at `s` px per unit (built once per scale; call in useMemo). */
export function buildHeadIcon(view: HeadIconView, s: number): HeadIconParts {
  const lines = Skia.Path.Make();
  const plate = Skia.Path.Make();
  if (view === 'side') {
    const open = Skia.Path.Make();
    buildSideLines(lines, s);
    buildSidePlate(plate, s);
    buildSideOpenMouth(open, s);
    return { lines, plate, open };
  }
  buildAboveLines(lines, s);
  buildAbovePlate(plate, s);
  return { lines, plate, open: null };
}

export type HeadIconProps = {
  view: HeadIconView;
  /** Anchor point: side = the MOUTH (or the box centre with anchor 'center',
   *  or the middle of the neck base with anchor 'neck', to stand it on a line);
   *  above = the middle of crown→chin. */
  x: number;
  y: number;
  /** Crown→chin height in px … */
  size?: number;
  /** …or px per canon unit directly (the micspeaker canon scale). */
  scale?: number;
  /** SIDE: which way the face looks (authored LEFT; 'right' mirrors it). */
  facing?: 'left' | 'right';
  /** Radians. SIDE: a tilt. ABOVE: the heading — aboveRotation(dx, dy) turns
   *  the canon (facing down the screen) toward (dx, dy). */
  rotation?: number;
  /** SIDE only: place by the mouth (default) or by the box centre. */
  anchor?: 'origin' | 'center' | 'neck';
  /** State accent riding on the stroke. */
  tint?: string;
  tintOpacity?: number;
  /** Dark interior — ONLY where the icon sits over a heat map. */
  plate?: boolean;
  glow?: boolean;
  /** SIDE: the mouth open (a talker). */
  speaking?: boolean;
  /** Stroke floor in px, so a small icon never thins to nothing. */
  minStroke?: number;
  /** Overall stroke colour (default the light neutral). */
  color?: string;
  opacity?: number;
};

export function HeadIcon({
  view,
  x,
  y,
  size,
  scale,
  facing = 'right',
  rotation = 0,
  anchor = 'origin',
  tint,
  tintOpacity = 0.34,
  plate,
  glow,
  speaking,
  minStroke = 0,
  color = HEAD_ICON_LINE,
  opacity = 1,
}: HeadIconProps) {
  const s = scale ?? headIconScale(view, size ?? 24);
  const parts = useMemo(() => buildHeadIcon(view, s), [view, s]);
  const lw = Math.max(minStroke, (view === 'side' ? SIDE_CANON.stroke : ABOVE_CANON.stroke) * s);
  const transform =
    view === 'side'
      ? [
          { translateX: x },
          { translateY: y },
          { rotate: rotation },
          { scaleX: facing === 'right' ? -1 : 1 },
          ...(anchor === 'center' ? [{ translateX: -SIDE_CENTER[0] * s }, { translateY: -SIDE_CENTER[1] * s }] : []),
          ...(anchor === 'neck' ? [{ translateX: -SIDE_NECK[0] * s }, { translateY: -SIDE_NECK[1] * s }] : []),
        ]
      : [{ translateX: x }, { translateY: y }, { rotate: rotation }];
  return (
    <Group transform={transform} opacity={opacity}>
      {plate ? <Path path={parts.plate} color={HEAD_ICON_PLATE} /> : null}
      {glow && tint ? (
        <Path path={parts.lines} color={tint} style="stroke" strokeWidth={lw * 3.4} strokeCap="round" strokeJoin="round" opacity={0.3}>
          <BlurMask blur={3 * s} style="normal" />
        </Path>
      ) : null}
      <Path path={parts.lines} color={color} style="stroke" strokeWidth={lw} strokeCap="round" strokeJoin="round" />
      {tint ? (
        <Path path={parts.lines} color={tint} style="stroke" strokeWidth={lw} strokeCap="round" strokeJoin="round" opacity={tintOpacity} />
      ) : null}
      {speaking && parts.open ? (
        <Path path={parts.open} color={color} style="stroke" strokeWidth={lw} strokeCap="round" strokeJoin="round" />
      ) : null}
    </Group>
  );
}

/** Many PLACED icons as ONE stroked path (+ one plate path) — a row of
 *  listeners, an audience — built once (module cache or useMemo). */
export function makeHeadIconPaths(
  view: HeadIconView,
  size: number,
  at: readonly { x: number; y: number; rotation?: number; facing?: 'left' | 'right'; anchor?: 'origin' | 'neck' }[],
): { lines: SkPath; plate: SkPath } {
  const lines = Skia.Path.Make();
  const plate = Skia.Path.Make();
  for (const a of at) appendHeadIcon(lines, plate, view, a.x, a.y, size, { rotation: a.rotation, facing: a.facing, anchor: a.anchor });
  return { lines, plate };
}

/** Draw paths from makeHeadIconPaths: the plate (optional), then the one
 *  uniform stroke with round caps and joins. */
export function HeadIconPaths({
  lines,
  plate,
  strokeWidth,
  color = HEAD_ICON_LINE,
  opacity = 1,
}: {
  lines: SkPath;
  plate?: SkPath | null;
  strokeWidth: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <Group opacity={opacity}>
      {plate ? <Path path={plate} color={HEAD_ICON_PLATE} /> : null}
      <Path path={lines} color={color} style="stroke" strokeWidth={strokeWidth} strokeCap="round" strokeJoin="round" />
    </Group>
  );
}
