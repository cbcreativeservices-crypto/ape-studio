/**
 * I11a RHODES (TINE PIANO) — where things are (charter §2 layer 2). The miked
 * source is the AMP the keyboard plays through: the speaker family's 1 × 12
 * combo (outer size from its maker's manual; the speaker's place, the open
 * back, the control panel and the chassis are drawing defaults), in frame C —
 * origin at the speaker's centre on the baffle's front plane, +x toward the
 * mic, +y down, +z to the listener's right. rhodes/GEOMETRY_PROPOSAL.md §1
 * "rig.mono" (the passive 61-key model → one combo).
 */
import { ampModel } from '../shared/speakers/ampModel.ts';
import { rhodesZones } from '../shared/keys/rhodesZones.ts';

export const I11A_MODEL = ampModel('combo', 'i11a-combo', 'combo amp with one 12 in speaker');
export const I11A_ZONES = rhodesZones();
