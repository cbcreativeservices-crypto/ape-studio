/**
 * B03 FIELD REPORTERS AND HANDHELD INTERVIEWS — the people in the new look
 * (figure V2, wave 3 step B round 2): the guest (Mei) and the reporter (Ana),
 * face to face; the reporter's right hand holds the handheld (the shared
 * omni, the cardioid flag), the arm on the far side of their body from the
 * side view.
 *
 * The owner's "chicken wing" (the arm level at shoulder height with the omni at
 * the guest's mouth): the reporter's elbow is dropped as far as the arm allows
 * — the wrist turning up to 18°, the shoulder brought a few cm forward as a real
 * reach does (heldHands.heldArmSolve `drop`). Owner decision (a) — the reporter
 * as they stand or 14 cm nearer — is `B03_REPORTER_STANCE` in geometry.ts.
 */
import { figureV2On } from '../shared/figureV2/figureV2Config';
import { fistAtTail, flagDrawLen as flagLen, flagFistFromFront, heldConfig, isFlagHandheld, standingHolder } from '../shared/broadcast/heldPeopleV2';
import { REPORTER, SHOULDER_REP } from './geometry.ts';

/** The whole lesson in the new look (the standing talkers' family). */
export const V2 = figureV2On('sideStanding');

/** The reporter's reach: the elbow dropped (the wrist up to 18°, the shoulder up to 40 mm forward). */
export const REACH = { wristMax: 18, reach: 40 } as const;
/** (FrontBoom3, review 2026-11-24: "as they stand" the arm read as one straight horizontal rod with no elbow) at full
 *  reach the elbow keeps a soft bend, this many mm below the straight line — the mic, its front, the fist and every
 *  measured point unchanged. */
export const REACH_BEND = 55;

export const REP_HOLDER = standingHolder('b3.reporter', REPORTER, SHOULDER_REP, 'talker.reporter', { drop: REACH, straightBend: REACH_BEND });

/** The cardioid flag drawn longer at its tail (owner decision (b): the same mic as B10's), in the new look only. */
export const flagDrawLen = (typeId: string): number | undefined => (V2 ? flagLen(typeId) : undefined);

export const B03_HELD = heldConfig([REP_HOLDER], {
  // (the omni's tail inside the fist's heel, as the flag's: never a block of handle at the wrist)
  fistFromFront: (typeId) => flagFistFromFront(typeId) ?? (V2 && typeId === 'repOmni' ? fistAtTail(230) : undefined),
  artOf: (typeId) => (isFlagHandheld(typeId) || typeId === 'repOmni' ? 'flagHandheld' : typeId),
});
