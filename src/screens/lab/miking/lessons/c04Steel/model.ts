/**
 * C04 PEDAL STEEL AND LAP STEEL — the technical truth (charter §2 layer 1).
 * The amp's starting points are the guitar amp's (shared/speakers/ampZones.ts:
 * the research confirms them as general amp practice, "not steel-specific").
 * Sources: docs/labs/miking/pedal_steel/SOURCES.md (SGF-MAP for the part
 * names; the steel amp's manual PV-NASH is unreachable, so no model-specific
 * claim is kept) and electric_guitar_amp/SOURCES.md. Corrections: PS-01 … PS-06.
 */
export const C04_MICS = ['instDynCard', 'sdcCard', 'kickDynCard'] as const;
export const C04_WORKED = 'eg.boundary';
export const C04_PLACE_START = 'eg.close';
