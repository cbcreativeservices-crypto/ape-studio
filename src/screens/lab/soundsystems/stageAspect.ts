/**
 * StageAspectReport — how a stage tells the FULL SCREEN view what it is.
 *
 *  - StageFit (a drawing of fixed aspect) calls `aspect(a, pad)`: the
 *    full-screen canvas at every zoom is then exactly the drawing's shape.
 *  - StageBox (a view-built stage: lists, bus columns) calls `fixed()`: its
 *    text does not grow with the box, so it gets no FULL SCREEN button.
 *  - A drawing that paints the whole (w, h) itself (PowerRack, ChainMeter,
 *    PowerBand) reports nothing and zooms as a plain box.
 * Null outside the Sound Systems layout.
 */
import { createContext } from 'react';

export type StageReport = { aspect: (aspect: number, pad: number) => void; fixed: () => void };

export const StageAspectReport = createContext<StageReport | null>(null);
