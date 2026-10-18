/**
 * gearGeometry — the dimensions and anchors of the booth's other gear (the
 * drawings live in art/gear.tsx), in millimetres. Pure TypeScript, so the
 * cable-clearance test can reach every anchor the room map wires.
 */

/** Closed-back DJ headphones, front view (as worn). */
export const PHONES_W = 200;
export const PHONES_H = 300;
/** Where the headphone cable's straight run ends (local mm, before scale):
 *  the plug's top when it is drawn, the map's cable start when it is not. */
export const PHONES_CABLE_END = { x: 100, y: 246 } as const;

/** A switched eight-outlet power strip (330 × 64). */
export const STRIP_W = 330;
export const STRIP_D = 64;
export const stripOutletX = (i: number): number => 54 + (i - 1) * 34;
/** The same outlet seen MIRRORED (the room map is drawn from behind). */
export const stripOutletXMirrored = (i: number): number => STRIP_W - stripOutletX(i);
export const STRIP_OUTLET_Y = 32;

/** A powered speaker's compact input plate (face-on, 150 × 92). */
export const PLATE_W = 150;
export const PLATE_H = 92;
export const PLATE = { input: { x: 34, y: 52 }, level: { x: 74, y: 50 }, ac: { x: 112, y: 54 }, power: { x: 138, y: 46 } } as const;

/** Powered speaker fronts: 12-inch PA and 8-inch booth monitor. */
export const SPEAKER_W = 365;
export const SPEAKER_H = 600;
export const MONITOR_W = 270;
export const MONITOR_H = 420;
