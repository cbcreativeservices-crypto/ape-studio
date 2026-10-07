/**
 * StageAspectReport — how a stage tells the FULL SCREEN view what it is.
 *
 *  - StageFit (a drawing of fixed aspect) calls `aspect(a, pad)`: the
 *    full-screen canvas at every zoom is then exactly the drawing's shape.
 *  - StageBox (a view-built stage: lists, bus columns) calls `fixed()`: its
 *    text does not grow with the box, so it gets no FULL SCREEN button.
 *  - A drawing that paints the whole (w, h) itself (PowerRack, ChainMeter,
 *    PowerBand, a Skia canvas) reports nothing and zooms as a plain box.
 * Null outside a rack that opted into FULL SCREEN.
 *
 * Shared by every lab since 2026-09-25 (moved out of Sound Systems for the
 * eleven-lab legibility pass).
 */
import { createContext, useContext } from 'react';

export type StageReport = { aspect: (aspect: number, pad: number) => void; fixed: () => void };

export const StageAspectReport = createContext<StageReport | null>(null);

/**
 * StageTextScale — how much bigger the stage is drawn than on the glass.
 *
 * ⚠️ THE SKIA TRAP. A Skia `<Canvas>` scales its picture with the box it is
 * given, but the React Native `<Text>` labels laid OVER it (wall names, dB
 * scales, tick numbers) are authored in points and stay that size — so in
 * FULL SCREEN the room grows and its labels do not. Multiply every overlay
 * label's fontSize by this value: 1 on the glass, `rendered width ÷ glass
 * width` inside the full-screen view. SVG text needs nothing — it scales
 * with its viewBox.
 */
export const StageTextScale = createContext(1);
export const useStageTextScale = (): number => useContext(StageTextScale);

/**
 * StageGlassWidth — the width the stage has on the glass right now, as the
 * full-screen view was told it (`glassW`); 0 where unknown (on the glass).
 * StageTextScale is floored at 1 (2026-10-01: labels never under their glass
 * size), so `w ÷ textScale` no longer recovers the glass width where the
 * full-screen drawing is narrower than the glass — a rule that needs the
 * real glass width (GlassShape) reads it here instead.
 */
export const StageGlassWidth = createContext(0);

/**
 * StageInFullScreen — true inside the FULL SCREEN view, false on the glass.
 * TitledStage reads it (owner 2026-09-29): the item's name prints above the
 * drawing in full screen always, but on the glass only where it costs the
 * drawing nothing — a header that shrank a height-limited plan pushed its
 * labels under the 9 pt floor.
 */
export const StageInFullScreen = createContext(false);

/**
 * StageZoom — the full-screen zoom STEP the drawing is shown at (1 on the
 * glass and at 1×; 1.5, 2, 3 or FIT's factor). StageTextScale grows with the
 * step, so words keep their size relative to the drawing; a drawing that
 * wants its labels to stay put while the picture grows — so that more of
 * them fit as the learner zooms in (the Miking Labs' level-of-detail labels,
 * owner 2026-10-06) — divides by this. Additive: nothing reads it unless it
 * asks.
 */
export const StageZoom = createContext(1);
export const useStageZoom = (): number => useContext(StageZoom);
