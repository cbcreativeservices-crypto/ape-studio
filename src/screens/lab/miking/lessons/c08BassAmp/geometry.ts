/**
 * C08 ELECTRIC BASS, FRETTED AND FRETLESS — where things are (charter §2
 * layer 2). The miked source is the BASS CABINET of the speaker family
 * (4 × 10 in + a horn; outer box from its maker's sheet; the driver and horn
 * layout, the 10 in sizes and the head on top are drawing defaults), in frame
 * C on the lower-right woofer. Research: docs/labs/miking/electric_bass_amp/.
 */
import { ampModel } from '../shared/speakers/ampModel.ts';
import { zonesFor } from '../shared/speakers/ampZones.ts';

/** The view reaches 1150 mm out, for the farther zone (60–100 cm). */
export const C08_MODEL = ampModel('bass', 'c08-bass', 'bass cabinet, 4 × 10 in + horn, head on top', 1150);
export const C08_ZONES = zonesFor('bass', 'bass');
