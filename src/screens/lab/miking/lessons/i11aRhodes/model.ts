/**
 * I11a RHODES (TINE PIANO) — the technical truth (charter §2 layer 1): the
 * lesson's choices. The suggested starting points live in
 * shared/keys/rhodesZones.ts (on the speaker family's combo); the instrument
 * facts in shared/keys/keysSpec.ts.
 *
 * Sources: docs/labs/miking/rhodes/SOURCES.md (RH-MK8, RH-MK8-UG, RH-S61,
 * RH-SM79, S-GTR) and speaker_leslie/SOURCES.md (S-MILLS, S-PGA27,
 * S-SM57-UG); GEOMETRY_PROPOSAL.md "rig.mono". Corrections applied:
 * CORRECTIONS_LOG.md RH-01 … RH-08.
 */
/** Stand mics this lesson offers; every one can try every front zone. */
export const I11A_MICS = ['instDynCard', 'sdcCard'] as const;
/** The worked example and the PLACE step's start. */
export const I11A_WORKED = 'rh.boundary';
export const I11A_PLACE_START = 'rh.close';
