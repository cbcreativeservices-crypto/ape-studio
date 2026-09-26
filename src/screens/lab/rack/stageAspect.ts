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
