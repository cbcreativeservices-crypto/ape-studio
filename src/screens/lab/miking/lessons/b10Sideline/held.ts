/**
 * B10 SIDELINE AND POST-EVENT INTERVIEWS — the people in the new look (figure
 * V2, wave 3 step B round 2): the guest (Mei) and the reporter (Ana), each a
 * possible holder of a flag handheld (the reporter's right hand on the
 * sideline, each their own with two handhelds).
 *
 * OWNER DECISION (b), still open: the flag handheld's handle drawn about 5 cm
 * longer at the tail — ONE line flips it: `FLAG_HANDLE_TAIL` in
 * shared/broadcast/heldPeopleV2.tsx (re-exported here as `B10_FLAG_TAIL`).
 */
import { figureV2On } from '../shared/figureV2/figureV2Config';
import { FLAG_HANDLE_TAIL, flagDrawLen as flagLen, flagFistFromFront, heldConfig, isFlagHandheld, standingHolder } from '../shared/broadcast/heldPeopleV2';
import { GUEST, REPORTER, SHOULDER_GUEST, SHOULDER_REP } from './geometry.ts';

/** The whole lesson in the new look (the standing talkers' family). */
export const V2 = figureV2On('sideStanding');

/** Owner decision (b) — see heldPeopleV2.FLAG_HANDLE_TAIL. */
export const B10_FLAG_TAIL = FLAG_HANDLE_TAIL;

/** The mic drawn longer at its tail (the engine's LessonArt.micDrawLen and the tool steps), in the new look only. */
export const flagDrawLen = (typeId: string): number | undefined => (V2 ? flagLen(typeId) : undefined);

/** From the side the faint reporter's head is drawn with no face (skull, hair, ear), so only the guest's face reads
 *  where the two profiles lie over each other (layout L7C and every point unchanged). */
export const B10_FAINT_PLAIN = true;

/** The reporter: from the side they stand right behind the guest - drawn faint over the guest (owner L7C), their
 *  held arm a value step down, coming out from behind the guest. */
export const REP_HOLDER = standingHolder('b10.reporter', REPORTER, SHOULDER_REP, 'talker.reporter', { behindSide: true });
/** The guest with their own handheld (TWO HANDHELDS). */
export const GUEST_HOLDER = standingHolder('b10.guest', GUEST, SHOULDER_GUEST, 'talker.guest');

export const B10_HELD = {
  ...heldConfig([REP_HOLDER, GUEST_HOLDER], {
    fistFromFront: flagFistFromFront,
    artOf: (typeId) => (isFlagHandheld(typeId) ? 'flagHandheld' : typeId),
  }),
  // (2026-11-24, FrontAndBoom) the boom's pose too: the operator's hands follow the pole's line as it is dragged
  carry: ['locBoomSgCap', 'locBoomSg'],
};
