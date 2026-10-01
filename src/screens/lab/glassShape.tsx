/**
 * GlassShape — FULL SCREEN shows the GLASS picture, zoomed (hard rule D35:
 * everything in the drawing zooms with the step).
 *
 * The Skia stages of the Microphone, Speaker Coverage and Vacuum Tube labs are
 * laid out in fixed points (a tube's bottle is 116 pt wide, the hand panel is
 * 216 pt tall, a mic grille is 8 pt) and painted through one <Group> scaled by
 * StageTextScale — so a stage drawn at (w ÷ scale, h ÷ scale) is the glass
 * drawing exactly, only larger. That only holds if the full-screen box has the
 * GLASS's shape: a free box turned sideways is wide and short, and a drawing
 * laid out 118 pt tall collapses (a tube's electrode stack goes negative).
 *
 * Both instances of a stage render from the same `render(w, h)`: the one on
 * the glass records its size in the section's ref; the one inside the
 * full-screen view reports a shape through StageAspectReport, so the box at
 * every zoom step is the glass × scale.
 *
 * SIDEWAYS the rack squeezes its glass to a strip (a 390-pt-tall window gives
 * a 98-pt glass), and StageTextScale is always `box width ÷ the CURRENT glass
 * width`. So the shape reported is the current glass width (= w ÷ scale) over
 * the TALLEST glass height measured (floored at the smallest real glass): the
 * sideways drawing is as wide as the sideways glass and as tall as the
 * portrait one, objects at glass size, 1× filling the width — never a strip.
 * `fixedH` is for a stage drawn at a fixed height (the hand panel, the
 * shock-mount scene): the shape is then the glass width over that height.
 *
 * Lives beside the labs, not in rack/: it is the fixed-point drawings' rule,
 * not the frame's (StageFit covers width-driven SVG instruments).
 */
import { useContext, useEffect, useRef, type MutableRefObject, type ReactNode } from 'react';
import { StageAspectReport, StageGlassWidth, StageInFullScreen, useStageTextScale } from './rack/stageAspect';

export type GlassSize = { w: number; h: number };

/** The smallest real glass (STAGE_HEIGHTS.S − the 2-pt border): a measured
 *  height under this is the sideways squeeze, not a design height. */
const MIN_GLASS_H = 158;

/** One per section: the glass's last measured size, shared by both instances. */
export function useGlassSize(): MutableRefObject<GlassSize | null> {
  return useRef<GlassSize | null>(null);
}

export function GlassShape({
  w,
  h,
  glass,
  fixedH,
  children,
}: {
  w: number;
  h: number;
  glass: MutableRefObject<GlassSize | null>;
  /** The drawing's own fixed height in glass points (shape = glass width ÷ this). */
  fixedH?: number;
  children: ReactNode;
}) {
  const full = useContext(StageInFullScreen);
  const report = useContext(StageAspectReport);
  const ts = useStageTextScale();
  // The CURRENT glass width: the frame says it outright (2026-10-01); the
  // old `w ÷ ts` is kept for a host that does not, and is exact there.
  const glassWTold = useContext(StageGlassWidth);
  useEffect(() => {
    if (!full) {
      // Keep the tallest glass seen: a sideways pass squeezes it, and the
      // portrait height is the design height the drawings were laid out for.
      const cur = glass.current;
      if (!cur || h >= cur.h) glass.current = { w, h };
      return;
    }
    const g = glass.current;
    if (!g) return;
    const glassWNow = glassWTold > 0 ? glassWTold : w / ts;
    report?.aspect(glassWNow / (fixedH ?? Math.max(MIN_GLASS_H, g.h)), 0);
  }, [full, report, glass, w, h, ts, fixedH, glassWTold]);
  return <>{children}</>;
}
