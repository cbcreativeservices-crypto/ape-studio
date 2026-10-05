/**
 * C02 ELECTRIC GUITAR AND GUITAR AMPLIFIERS — where things are (charter §2
 * layer 2). The miked source is the AMP: a 1 × 12 combo (outer size from
 * its maker's manual; the speaker's place, the open back, the control panel
 * and the chassis are drawing defaults), in frame C — origin at the speaker's
 * centre on the baffle's front plane, +x toward the mic, +y down, +z to the
 * listener's right. Research: docs/labs/miking/electric_guitar_amp/.
 */
import { ampModel } from '../shared/speakers/ampModel.ts';
import { zonesFor } from '../shared/speakers/ampZones.ts';

export const C02_MODEL = ampModel('combo', 'c02-combo', '1 × 12 in guitar combo');
export const C02_ZONES = zonesFor('combo', 'guitar');
