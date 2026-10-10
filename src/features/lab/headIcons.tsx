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
import { Blur, ColorMatrix, Group, Image as SkImageNode, Path, Skia, type SkImage } from '@shopify/react-native-skia';
import { useSafeSkiaImage } from '../../lib/skiaSafeAssets';
import {
  HEAD_ICON_LINE,
  HEAD_ICON_PLATE,
  HEAD_PNG_BOX,
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
  const image = useHeadPng(view);
  void speaking; void minStroke; // the owner's PNG is drawn as-is (2026-10-10)
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
      {glow && tint ? <HeadPng image={image} view={view} s={s} color={tint} opacity={0.3} blur={3 * s} /> : null}
      <HeadPng image={image} view={view} s={s} color={color} />
      {tint ? <HeadPng image={image} view={view} s={s} color={tint} opacity={tintOpacity} /> : null}
    </Group>
  );
}

/* ── THE OWNER'S PNGs (owner 2026-10-10) ──────────────────────────────────
 * The visible head is the owner's own art, never a redrawn vector. The
 * geometry above only shapes the dark readability plates. */
const HEAD_PNG = {
  side: require('../../../assets/icons/head-side.png'),
  above: require('../../../assets/icons/head-above.png'),
} as const;

/** The owner's head PNG for a view, decoded once per mount (null while loading). */
export function useHeadPng(view: HeadIconView): SkImage | null {
  return useSafeSkiaImage(HEAD_PNG[view]);
}

/** Recolour every pixel to `hex`, keeping the art's own alpha. */
function tintMatrix(hex: string): number[] | null {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [0, 0, 0, 0, r, 0, 0, 0, 0, g, 0, 0, 0, 0, b, 0, 0, 0, 1, 0];
}

/** One head PNG in head units × `s`, in the caller's (already placed) frame. */
function HeadPng({ image, view, s, color, opacity = 1, blur }: { image: SkImage | null; view: HeadIconView; s: number; color?: string; opacity?: number; blur?: number }) {
  if (!image) return null;
  const box = HEAD_PNG_BOX[view];
  const m = color && color.toLowerCase() !== HEAD_ICON_LINE ? tintMatrix(color) : null;
  return (
    <SkImageNode image={image} x={box.x * s} y={box.y * s} width={box.w * s} height={box.h * s} fit="fill" opacity={opacity}>
      {m ? <ColorMatrix matrix={m} /> : null}
      {blur ? <Blur blur={blur} /> : null}
    </SkImageNode>
  );
}

type HeadPlacement = { x: number; y: number; rotation?: number; facing?: 'left' | 'right'; anchor?: 'origin' | 'neck' };

/** Many PLACED icons — a row of listeners, an audience — built once (module
 *  cache or useMemo): ONE plate path plus each head's placement, drawn by
 *  HeadIconPaths as the owner's PNG. */
export function makeHeadIconPaths(
  view: HeadIconView,
  size: number,
  at: readonly HeadPlacement[],
): { plate: SkPath; view: HeadIconView; size: number; at: readonly HeadPlacement[] } {
  const lines = Skia.Path.Make(); // stroke geometry is no longer drawn
  const plate = Skia.Path.Make();
  for (const a of at) appendHeadIcon(lines, plate, view, a.x, a.y, size, { rotation: a.rotation, facing: a.facing, anchor: a.anchor });
  return { plate, view, size, at };
}

/** Draw a set from makeHeadIconPaths: the plate (optional), then the owner's
 *  PNG at every placement. */
export function HeadIconPaths({
  heads,
  plate = true,
  color = HEAD_ICON_LINE,
  opacity = 1,
}: {
  heads: ReturnType<typeof makeHeadIconPaths>;
  plate?: boolean;
  color?: string;
  opacity?: number;
}) {
  return (
    <Group opacity={opacity}>
      {plate ? <Path path={heads.plate} color={HEAD_ICON_PLATE} /> : null}
      <HeadPngRow view={heads.view} size={heads.size} at={heads.at} color={color} />
    </Group>
  );
}

/** The same placement appendHeadIcon uses, as a Skia transform. */
export function headTransform(view: HeadIconView, a: HeadPlacement, s: number) {
  const neck = view === 'side' && a.anchor === 'neck';
  return [
    { translateX: a.x },
    { translateY: a.y },
    { rotate: a.rotation ?? 0 },
    ...(view === 'side' ? [{ scaleX: (a.facing ?? 'right') === 'right' ? -1 : 1 }] : []),
    ...(neck ? [{ translateX: -SIDE_NECK[0] * s }, { translateY: -SIDE_NECK[1] * s }] : []),
  ];
}

/** A row of the owner's PNG heads at given placements (no plate path) — for
 *  callers that build their own plates. */
export function HeadPngRow({ view, size, at, color, opacity = 1 }: { view: HeadIconView; size: number; at: readonly HeadPlacement[]; color?: string; opacity?: number }) {
  const image = useHeadPng(view);
  const s = headIconScale(view, size);
  return (
    <Group opacity={opacity}>
      {at.map((a, i) => (
        <Group key={i} transform={headTransform(view, a, s)}>
          <HeadPng image={image} view={view} s={s} color={color} />
        </Group>
      ))}
    </Group>
  );
}
