/**
 * A FIGURE'S HEAD at any drawing scale — Skia (head fix 2026-10-08).
 *
 * ⛔ OWNER RULE 2026-10-08: a head ATTACHED TO A BODY is drawn as part of the
 * figure — the Miking PlayerFigure skin silhouette (skull, ears, the neck into
 * the collar; the same gradient, rim light, core shadow and contour as the
 * hands; neutral, no face) — never the line-art head icon and never a circle.
 *
 * PlayerFigure builds its heads in millimetres (an adult head ≈ 228 mm). The
 * labs outside Miking draw their people in pixels or metres, so this wraps the
 * SAME headFront / headProfile / headAbove + FigureHead in a scale transform:
 * give it the head's centre and its crown→chin height in the caller's units.
 * Skia-only (load from Skia-gated modules); SVG screens use figureHeadSvg.tsx.
 */
import { useMemo } from 'react';
import { Group } from '@shopify/react-native-skia';
import { FigureHead, FigureMass, headAbove, headFront, headProfile } from '../../screens/lab/miking/lessons/shared/players/PlayerFigure';
import { BODY, pt } from '../../screens/lab/miking/lessons/shared/players/playerPose';

/** Head radius in PlayerFigure's units for an adult head (crown→chin ≈ 2.05 r). */
const R_MM = 111;
/** headFront's crown→chin span in head-radius units (−118 … +108 per 110). */
const SPAN = 226 / 110;

export type FigureHeadView = 'front' | 'side' | 'above';

/**
 * The figure head, centred on (cx, cy) in the caller's units, `h` tall
 * (crown→chin). `neckTo` = the caller-unit y the neck runs down to (the
 * collar / the top of the torso); default a short neck. `facing` (side view):
 * +1 = the face toward +x. `minContour` keeps the contour readable when the
 * whole head is only a few pixels tall (in the caller's units).
 */
export function FigureHeadAt({
  view,
  cx,
  cy,
  h,
  neckTo,
  facing = 1,
  rotation = 0,
  minContour = 0.7,
}: {
  view: FigureHeadView;
  cx: number;
  cy: number;
  h: number;
  neckTo?: number;
  facing?: number;
  /** Radians, the 'above' view's heading (0 = the nose toward +y). */
  rotation?: number;
  minContour?: number;
}) {
  const k = h / (SPAN * R_MM); // caller units per mm
  const neckMm = neckTo === undefined ? R_MM * 1.25 : Math.max(R_MM * 0.95, (neckTo - cy) / k);
  const fill = useMemo(() => {
    const c = pt(0, 0);
    if (view === 'front') return headFront(c, R_MM, neckMm).fill;
    if (view === 'side') return headProfile(c, R_MM, neckMm, facing).fill;
    return headAbove(c, R_MM).fill;
  }, [view, neckMm, facing]);
  // FigureHead is FigureMass 'skin' at a 2.6 mm contour; when the whole head
  // is only a few pixels tall the contour keeps a readable floor instead.
  const contour = minContour / k;
  return (
    <Group transform={[{ translateX: cx }, { translateY: cy }, { rotate: rotation }, { scale: k }]}>
      {contour > 2.6 ? <FigureMass path={fill} tone="skin" contour={contour} /> : <FigureHead fill={fill} />}
    </Group>
  );
}

/** An adult head's crown→chin height in metres (BODY.headH). */
export const HEAD_H_M = BODY.headH / 1000;
