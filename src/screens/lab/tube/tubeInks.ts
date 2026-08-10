/**
 * Tube element ink code (owner 2026-08-10) — the OFFICIAL color language of the
 * Tube Reference cards, applied to every lab drawing so the interactive
 * animations and the reference images read as one system:
 *
 *   HEATER / FILAMENT  orange   · CATHODE            teal
 *   CONTROL GRID (G1)  blue     · SCREEN GRID (G2)   purple
 *   SUPPRESSOR / BEAM  gold     · PLATE (ANODE)      amber-orange
 *   GLASS              silver   · GETTER             gold label / silver flash
 *
 * NO Skia imports here — the lab screen (which must never touch Skia directly;
 * see skiaGate) and viz.tsx both consume this single source of truth.
 */
/** Mirrors viz.tsx's TubePart union (structural match — viz.tsx is Skia-bearing
 *  and must only load through skiaGate, so the type is declared here too). */
export type TubeInkPart =
  | 'envelope'
  | 'heater'
  | 'cathode'
  | 'grid'
  | 'screen'
  | 'suppressor'
  | 'plate'
  | 'vacuum';

export const TUBE_INK: Record<TubeInkPart, string> = {
  heater: '#ff8a3d',
  cathode: '#3ecfc0',
  grid: '#5b9bd5',
  screen: '#b45bff',
  suppressor: '#e0c060',
  plate: '#f0a030',
  envelope: '#aeb4c0',
  vacuum: '#e8ecf4',
};

/** Supporting tones from the cards. */
export const TUBE_INK_EXTRA = {
  glassEdge: '#8b93a3',
  getterFlashHi: '#c8cdd8',
  getterFlashLo: '#7d8492',
  micaHi: '#d9c9a0',
  micaLo: '#a8916a',
} as const;
