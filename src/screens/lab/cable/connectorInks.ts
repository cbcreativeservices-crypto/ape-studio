/**
 * connectorInks — Skia-FREE diagram ink registry for the Cable & Connector
 * Fundamentals Lab (tubeInks pattern: screen chips and drawings share one
 * color key, and this file never imports the Skia-bearing art modules).
 *
 * GOVERNANCE (R2, 2026-08-12): the blue→green→yellow→orange→red amplitude ramp
 * is RESERVED for level magnitude. These inks are discrete DIAGRAM semantics
 * for pin/conductor roles — they are never a magnitude scale, and they are
 * ALWAYS paired with a text label and/or contact number (never color-alone;
 * accessibility + governance).
 *
 * IMPORTANT DISTINCTION taught in Lesson 7 and never blurred here: these are
 * the app's diagram colors, NOT real-world wiring color codes. Real insulation
 * color codes are REGIONAL, safety-critical facts (e.g. IEC line=brown,
 * neutral=blue, earth=green/yellow; NA hot=black, neutral=white, ground=green)
 * and live in the verified lesson CONTENT as regional data — never inferred
 * from these UI inks.
 */

export type ConnectorInk =
  | 'signalPos' // non-inverting / + / hot audio leg, tip in TS
  | 'signalNeg' // inverting / − / cold audio leg
  | 'shield' // cable shield / screen / sleeve return
  | 'groundEarth' // protective earth / chassis ground
  | 'neutral' // AC neutral (grounded conductor)
  | 'lineHot' // AC line/hot (energized conductor)
  | 'dcPos' // DC +
  | 'dcNeg' // DC − / return
  | 'dataA' // data pair/lane A
  | 'dataB' // data pair/lane B
  | 'clock' // clock / sync
  | 'optical' // light path (fiber core)
  | 'speakerPos' // loudspeaker +
  | 'speakerNeg' // loudspeaker −
  | 'shell' // connector shell / body metal
  | 'insulator'; // dielectric / insulation in cross-sections

/** Diagram ink values — distinct hues on the dark theme, none forming a
 *  magnitude ramp, all AA-legible against #0c0c0c panels. */
export const CONNECTOR_INKS: Record<ConnectorInk, string> = {
  signalPos: '#ffb347', // warm amber-orange — matches the app's accent family
  signalNeg: '#6fa8ff', // clear blue
  shield: '#9aa0ab', // braided-metal gray
  groundEarth: '#3fd977', // green (globally associated with earth/ground)
  neutral: '#e8e8ee', // near-white
  lineHot: '#ff6b5e', // red-orange — energized, danger-adjacent
  dcPos: '#ffd166', // light amber
  dcNeg: '#8fb6ff', // pale blue
  dataA: '#b48ce0', // violet
  dataB: '#66d9d0', // teal
  clock: '#f2e35c', // yellow
  optical: '#7fd4ff', // light-carrying cyan
  speakerPos: '#ff9550', // orange
  speakerNeg: '#7d90a8', // slate
  shell: '#8b8f98', // metal body
  insulator: '#4a4b52', // dark insulation gray
};

/** Human label for each ink — rendered next to any swatch (never color-alone). */
export const CONNECTOR_INK_LABELS: Record<ConnectorInk, string> = {
  signalPos: 'Signal + (non-inverting)',
  signalNeg: 'Signal − (inverting)',
  shield: 'Shield / screen',
  groundEarth: 'Protective earth / ground',
  neutral: 'Neutral',
  lineHot: 'Line / hot',
  dcPos: 'DC +',
  dcNeg: 'DC − / return',
  dataA: 'Data pair A',
  dataB: 'Data pair B',
  clock: 'Clock / sync',
  optical: 'Optical path',
  speakerPos: 'Loudspeaker +',
  speakerNeg: 'Loudspeaker −',
  shell: 'Shell / body',
  insulator: 'Insulation / dielectric',
};
