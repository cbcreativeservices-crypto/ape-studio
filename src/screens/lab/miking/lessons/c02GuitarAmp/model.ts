/**
 * C02 ELECTRIC GUITAR AND GUITAR AMPLIFIERS — the technical truth (charter §2
 * layer 1). The suggested starting points live in the speaker family's
 * shared/speakers/ampZones.ts (GUITAR_ZONES + the open-back zone), because the
 * steel lesson (C04) mics the same kind of combo with the same research; this
 * file names the lesson's choices.
 *
 * Sources: docs/labs/miking/electric_guitar_amp/SOURCES.md (S-MILLS, SN-906,
 * S-PGA27, S-SM57-UG, S-RHYTHM, FEN-65DR-MAN, OSHA) and GEOMETRY_PROPOSAL.md.
 * Corrections applied: CORRECTIONS_LOG.md EG-01 … EG-09.
 */
/** Stand mics this lesson offers; every one can try every front zone. */
export const C02_MICS = ['instDynCard', 'sdcCard', 'kickDynCard'] as const;
/** The worked example and the PLACE step's start. */
export const C02_WORKED = 'eg.boundary';
export const C02_PLACE_START = 'eg.close';
