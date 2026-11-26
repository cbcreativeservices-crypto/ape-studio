/**
 * THE WOODWIND PLAYER IN THE APPROVED LOOK (figure roll-out wave 5, D78,
 * 2026-11-24): flute (A06), piccolo (A07), clarinet and bass clarinet (A08a,
 * A08b), oboe and bassoon (A09a, A09b) — the scene face-on and from above,
 * the placement studio, the ORIENT figure with its player, and the
 * ten-player section plan.
 *
 * Nothing of the posture moves (windPosture.ts, windHands.ts): the body, the
 * lips at the embouchure or the reed, the posed hands with each pad on its
 * hole or key and each thumb where the technique puts it (the clarinet's and
 * oboe's right thumb under its rest, the flute's left thumb on the B-flat key,
 * the bassoon's thumbs on the back of the boot and wing joints). Only the
 * drawing is new (figureV2/familyV2): the body from the front or above in the
 * cast member's look, the approved sleeves, the posed hands in the approved
 * look.
 *
 * Who plays (cast.ts ROLES): the lesson's own player is its section seat's
 * person; in the section plan each row of five has five different people.
 */
import type { ViewId } from '../../../engine/model/types.ts';
import { dot, len, norm, scale, sub } from '../../../engine/geometry/vec.ts';
import { CAST, castFor, type CastId, type CastMember } from '../figureV2/cast';
import { famFrontRegion, famPlan, type FamIn, type FamPlan } from '../figureV2/familyV2';
import type { SkPath } from '../figureV2/paths.ts';
import { reedHandsForPlan, type ReedPlaced } from '../figureV2/reedHandKit';
import { REED_HAND_BACK } from '../figureV2/reedHandBack';
import { REED_HAND_PALM } from '../figureV2/reedHandPalm';
import { frameAt, type Layout } from './windPosture.ts';
import { windHands } from './windHands.ts';

const ROLE = { flute: 'wind.flute', piccolo: 'wind.piccolo', clarinet: 'wind.clarinet', bassClarinet: 'wind.bassClarinet', oboe: 'wind.oboe', bassoon: 'wind.bassoon' } as const;
/** The cast member who plays this instrument in its own lesson. */
export const windPlayer = (L: Pick<Layout, 'spec'>): CastMember => castFor(ROLE[L.spec.id as keyof typeof ROLE] ?? 'wind.flute');

/** The section plan's seats: each row's five players five different people (the lesson's own seat is its role's). */
export const WIND_SEATS: Readonly<Record<string, CastId>> = { picc: 'drummer', fl2: 'ruth', fl1: 'ana', ob1: 'mei', ob2: 'kofi', bcl: 'kofi', cl2: 'mei', cl1: 'ruth', bsn1: 'drummer', bsn2: 'ana' };
export const windSeatPlayer = (slot: string): CastMember | undefined => (WIND_SEATS[slot] ? CAST[WIND_SEATS[slot]] : undefined);

const TO_VIEWER = { side: { x: 0, y: 0, z: 1 }, top: { x: 0, y: -1, z: 0 } } as const;

/** The figure's input: the engine's 'side' view of a woodwind is the player face-on. */
/** The hands drawn as the reed family's AUTHORED hands (owner 2026-11-25, figureV2/reedHand*.tsx): the arm ends at its
 *  cuff and WindScene paints the drawing there (false: the shared posed-hand painter, as before). */
export const WIND_AUTHORED_HANDS = true;

/** The authored hands on this figure's posed hands (the wrist, the keys and the cuffs the lesson's own). */
export function windReedHands(L: Layout, fp: FamPlan): ReedPlaced[] {
  const H = windHands(L);
  return reedHandsForPlan(fp, { back: REED_HAND_BACK, palm: REED_HAND_PALM }, { L: H.L.sk, R: H.R.sk });
}

export function windFamIn(L: Layout, view: ViewId, who?: CastMember, authored = WIND_AUTHORED_HANDS): FamIn {
  const B = L.body;
  const H = windHands(L);
  const toV = TO_VIEWER[view];
  // the instrument's plane through the tube at the hand: what lies behind it (a palm under the tube, a thumb on
  // its back) goes behind the instrument
  const cut = (sAt: number) => {
    const f = frameAt(L, sAt);
    const nc = sub(toV, scale(f.t, dot(toV, f.t)));
    return len(nc) > 0.2 ? { p: f.p, n: norm(nc) } : null;
  };
  const toward = { x: 0, y: 0, z: 1 };
  return {
    key: `wind|${L.spec.id}|${B.posture}`,
    s: {
      head: B.head.c,
      headR: B.head.r,
      face: toward,
      neck: B.neck,
      pelvis: { x: (B.hipL.x + B.hipR.x) / 2, y: (B.hipL.y + B.hipR.y) / 2, z: (B.hipL.z + B.hipR.z) / 2 },
      shoulderL: B.shoulderL,
      shoulderR: B.shoulderR,
      hipL: B.hipL,
      hipR: B.hipR,
      kneeL: B.kneeL,
      kneeR: B.kneeR,
      ankleL: B.ankleL,
      ankleR: B.ankleR,
      toeL: B.toeL,
      toeR: B.toeR,
    },
    view: view === 'side' ? 'front' : 'top',
    who: who ?? windPlayer(L),
    seated: B.posture === 'seated',
    floorY: B.floorY,
    seatY: L.chair ? L.chair.seat.min.y : undefined,
    lip: L.lips ?? { x: 0, y: 0, z: 0 },
    arms: {
      L: { sk: H.L.sk, elbow: H.L.elbow, shoulder: B.shoulderL, cut: cut(H.L.s), handElsewhere: authored },
      R: { sk: H.R.sk, elbow: H.R.elbow, shoulder: B.shoulderR, cut: cut(H.R.s), handElsewhere: authored },
    },
  };
}

/** The figure's plan and its parts over the instrument: the old order put the near arm and the hands' front
 *  parts over it, the body behind it. */
export function windFigure(L: Layout, view: ViewId, who?: CastMember): { fp: FamPlan; region: SkPath | null } {
  const fp = famPlan(windFamIn(L, view, who));
  // (everything of the body is behind the instrument; the arms and the hands' front layers lie over it)
  const inst = Math.max(fp.depth.head, fp.depth.chest, fp.depth.legNear, fp.depth.legFar) + 1;
  return { fp, region: famFrontRegion(fp, inst) };
}
