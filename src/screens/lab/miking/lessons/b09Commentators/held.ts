/**
 * B09 COMMENTATORS AND ANNOUNCE POSITIONS — the people in the new look (figure
 * V2, wave 3 step B round 2): the commentator (the host's role: Kofi) and the
 * analyst (Mei), seated at the commentary desk; at the open position the
 * commentator's right hand holds the lip ribbon to the mouth.
 */
import { figureV2On } from '../shared/figureV2/figureV2Config';
import { heldConfig, seatedHolder } from '../shared/broadcast/heldPeopleV2';
import { CALLER, SHOULDER_A } from './geometry.ts';

/** The whole lesson in the new look (the seated talkers' family). */
export const V2 = figureV2On('sideDeskTalker');

export const CALLER_HOLDER = seatedHolder('b9.caller', CALLER, SHOULDER_A, 'talker.host');

export const B09_HELD = heldConfig([CALLER_HOLDER], { artOf: (typeId) => (typeId === 'bcLipRibbon' ? 'lipRibbon' : typeId) });
