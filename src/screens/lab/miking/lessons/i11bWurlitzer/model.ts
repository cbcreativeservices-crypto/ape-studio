/**
 * I11b WURLITZER (REED PIANO) — the technical truth (charter §2 layer 1): the
 * lesson's choices. The suggested starting points and the instrument in
 * frame W live in shared/keys/wurliModel.ts; the facts in shared/keys/
 * keysSpec.ts (the 4 × 8 in oval speaker is the speaker family's one new
 * driver).
 *
 * Sources: docs/labs/miking/wurlitzer/SOURCES.md (VV-200A, TF-DIFF, TF-REC,
 * VV-REEDS, WUR-SM) and rhodes/SOURCES.md (S-GTR); GEOMETRY_PROPOSAL.md
 * (frame W; case size UNKNOWN → the drawing default). Corrections applied:
 * CORRECTIONS_LOG.md WU-01 … WU-08.
 */
export const I11B_MICS = ['instDynCard', 'sdcCard'] as const;
/** The worked example (the research's close method) and the PLACE step's start. */
export const I11B_WORKED = 'wur.close';
export const I11B_PLACE_START = 'wur.centre';
