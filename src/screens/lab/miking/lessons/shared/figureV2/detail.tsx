/**
 * FIGURE V2 — LEVEL OF DETAIL BY DRAWN SCALE (wave 1 of D78, 2026-11-23).
 *
 * Two findings drive this module:
 *   • THE HAIR BUG. A mask blur whose sigma, carried through the canvas's
 *     transform, comes out under about half a device pixel does not draw at
 *     all on CanvasKit (the web build): the WHOLE path it is attached to
 *     vanishes, not just its soft edge (bisected on the study page,
 *     `#labpreview/FigureStudy/hairbug`: the hair path with its 1.1 mm blur is
 *     gone at 0.2 pt/mm and drawn at 0.4; without the blur it draws at every
 *     size). The hair's fill carried such a blur, so at lesson sizes the head
 *     showed the skin under it — "bald or blond". Every blur here therefore
 *     goes through `Blur`, which leaves out a blur too small to see (under
 *     ≈ 0.75 device pixel) instead of handing it to the canvas.
 *   • THE COST. Skia redraws the whole canvas every frame while anything in
 *     it moves; at lesson sizes the figure's fine modelling is under a pixel.
 *     Below `LITE_PT_PER_MM` (the drummer under ≈ 400 pt tall) the drummer is
 *     drawn by its LITE components (lite.tsx): the same masses, the same
 *     materials, one gradient fill each, no blur.
 *
 * The scale comes from `FigureScale`, provided INSIDE a canvas (a React
 * context does not cross the Canvas boundary) by the scenes that fit the art:
 * the lesson's figure (InstrumentFigure), the placement scene, the study page.
 * Where nothing provides it (the setting plans' and the band seat's small
 * neighbours, a phantom) the drummer is drawn LITE.
 */
import { createContext, useContext, type ReactNode } from 'react';
import { PixelRatio } from 'react-native';
import { BlurMask } from '@shopify/react-native-skia';

/** The drawn scale: points per millimetre, and an optional forced level. */
export type FigureScaleValue = { ptPerMm: number | null; level?: FigureLevel };
export type FigureLevel = 'full' | 'lite';

/** At or above this scale the full figure is drawn (≈ 0.28 pt/mm: the seated
 *  drummer, ≈ 1450 mm tall, about 400 pt tall). */
export const LITE_PT_PER_MM = 0.28;
/** A blur under this many DEVICE pixels is left out (it would not show; on
 *  CanvasKit it would take its whole path with it). */
export const MIN_BLUR_PX = 0.75;

const Ctx = createContext<FigureScaleValue>({ ptPerMm: null });

/** Provide the drawn scale to the figures under it (inside a Canvas). */
export function FigureScale({ ptPerMm, level, children }: { ptPerMm: number | null; level?: FigureLevel; children: ReactNode }) {
  return <Ctx.Provider value={{ ptPerMm, level }}>{children}</Ctx.Provider>;
}

const dpr = (() => {
  try {
    const r = PixelRatio.get();
    return typeof r === 'number' && r > 0 ? r : 1;
  } catch {
    return 1;
  }
})();

/** The level a scale asks for (no scale known: lite). */
export function levelOf(v: FigureScaleValue | undefined): FigureLevel {
  if (v?.level) return v.level;
  const s = v?.ptPerMm;
  return s != null && s >= LITE_PT_PER_MM ? 'full' : 'lite';
}

/** Whether a blur of `mm` shows at this scale (unknown scale: a lesson's ≈ 0.2 pt/mm). */
export function blurShows(mm: number, v: FigureScaleValue | undefined, pxPerPt = dpr): boolean {
  const s = v?.ptPerMm ?? 0.2;
  return mm * s * pxPerPt >= MIN_BLUR_PX;
}

/** The figure's scale and level here. */
export function useFigureScale(): FigureScaleValue & { level: FigureLevel } {
  const v = (useContext(Ctx) as FigureScaleValue | undefined) ?? { ptPerMm: null };
  return { ...v, level: levelOf(v) };
}

/** A soft edge / soft shadow of `mm` (a mask blur's sigma, in the drawing's
 *  millimetres) — left out where it would be under a device pixel. */
export function Blur({ mm }: { mm: number }) {
  const v = useContext(Ctx) as FigureScaleValue | undefined;
  return blurShows(mm, v) ? <BlurMask blur={mm} style="normal" /> : null;
}
