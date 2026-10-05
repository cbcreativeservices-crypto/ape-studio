/**
 * C04 PEDAL STEEL AND LAP STEEL — where things are (charter §2 layer 2). The
 * miked source is the AMPLIFIER: the electric-guitar lesson's combo and
 * starting points, reused unchanged (pedal_steel/GEOMETRY_PROPOSAL.md: "reuse
 * electric_guitar_amp … unchanged"; the steel amp's own manual is
 * unreachable). The instrument is drawn (shared/electric/SteelArt.tsx) only to
 * name its parts and place the player's keep-clear space.
 */
import { ampModel } from '../shared/speakers/ampModel.ts';
import { zonesFor } from '../shared/speakers/ampZones.ts';

export const C04_MODEL = ampModel('combo', 'c04-combo', '1 × 12 in combo for the steel');
export const C04_ZONES = zonesFor('combo', 'guitar');
