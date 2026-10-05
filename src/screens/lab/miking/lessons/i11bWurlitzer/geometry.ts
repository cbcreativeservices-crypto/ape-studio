/**
 * I11b WURLITZER (REED PIANO) — where things are (charter §2 layer 2), in
 * frame W (shared/keys/wurliModel.ts): origin = the floor under the centre of
 * the keyboard's front edge; +x toward the player (the speakers face the
 * player); +y down; +z toward the treble. The case size, the grille positions
 * and the tilt are DRAWING DEFAULTS (wurlitzer/GEOMETRY_PROPOSAL.md: UNKNOWN —
 * measure a real one); the two 4 × 8 in speakers are sourced.
 */
import { wurliModel, wurliZones } from '../shared/keys/wurliModel.ts';

export const I11B_MODEL = wurliModel('i11b-reed', 'reed piano with two oval speakers in its lid');
export const I11B_ZONES = wurliZones();
