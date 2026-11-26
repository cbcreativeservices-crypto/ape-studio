/**
 * THE SAXOPHONIST IN THE APPROVED LOOK (figure roll-out wave 5, D78,
 * 2026-11-24): soprano, alto, tenor and baritone (A05a–d), standing or seated
 * — the scene from the player's right and from above, the placement studio,
 * the setting plans.
 *
 * Nothing of the posture moves (saxPosture.ts, saxHands.ts): the skeleton,
 * the reed tip at the lips, the strap, the posed hands — the left hand on the
 * upper stack (index, middle, ring on the upper pearls, the thumb on its rest
 * by the octave key), the right on the lower stack (the thumb under the thumb
 * hook), each pad on its pearl. Only the drawing is new (figureV2/familyV2):
 * the cast member, the head with its mouth at the reed tip, the approved
 * sleeves and the posed hands in the approved look.
 *
 * Who plays (cast.ts ROLES): soprano Ana, alto Ruth, tenor the drummer,
 * baritone Kofi; another player of the same horn on a plan, Mei.
 */
import type { Vec3, ViewId } from '../../../engine/model/types.ts';
import { dot, scale, sub } from '../../../engine/geometry/vec.ts';
import { castFor, type CastMember } from '../figureV2/cast';
import { famFrontRegion, famPlan, type FamIn, type FamPlan } from '../figureV2/familyV2';
import type { SkPath } from '../figureV2/paths.ts';
import { reedHandsForPlan, type ReedPlaced } from '../figureV2/reedHandKit';
import { REED_HAND_BACK } from '../figureV2/reedHandBack';
import { REED_HAND_PALM } from '../figureV2/reedHandPalm';
import { saxHands } from './saxHands.ts';
import { pathOf } from './saxSpec.ts';
import { centre, tangent, type SaxPosture } from './saxPosture.ts';
import { TO_VIEWER, depthOf } from './saxDraw.ts';

const ROLE = { soprano: 'sax.soprano', alto: 'sax.alto', tenor: 'sax.tenor', baritone: 'sax.baritone' } as const;
/** The cast member who plays this horn. */
export const saxPlayer = (P: SaxPosture): CastMember => castFor(ROLE[P.row.id as keyof typeof ROLE] ?? 'sax.alto');
/** A plan's neighbor playing the lesson's own horn: another person. */
export const saxSecond = (): CastMember => castFor('sax.second');

/** The horn's depth against the player (the old figure's own rule: the body, the head and the strap always behind
 *  the horn — a soprano held in front of the chest included). */
export function saxHornDepth(P: SaxPosture, view: ViewId): number {
  const S = pathOf(P.row);
  return Math.max(depthOf(view, centre(P, (S.tenon + S.bodyEnd) / 2)), depthOf(view, P.player.chest) + 1.5);
}

/** The hands drawn as the reed family's AUTHORED hands (owner 2026-11-25, figureV2/reedHand*.tsx): the arm ends at its
 *  cuff and SaxScene paints the drawing there (false: the shared posed-hand painter, as before). */
export const SAX_AUTHORED_HANDS = true;

export function saxFamIn(P: SaxPosture, view: ViewId, who?: CastMember, authored = SAX_AUTHORED_HANDS): FamIn {
  const s = P.player;
  const H = saxHands(P);
  const toV = TO_VIEWER[view];
  // the hand over the horn; its far side (a palm round the far side of the body, a thumb behind it) behind it
  const cut = (u: number) => {
    const t = tangent(P, u);
    const n = sub(toV, scale(t, dot(toV, t)));
    const nl = Math.hypot(n.x, n.y, n.z);
    return nl > 0.2 ? { p: centre(P, u), n: scale(n, 1 / nl) } : null;
  };
  return {
    key: `sax|${P.row.id}|${P.kind}`,
    s: { ...s, face: { x: 1, y: 0, z: 0 } },
    view,
    who: who ?? saxPlayer(P),
    seated: P.kind === 'seated',
    floorY: P.floorY,
    seatY: P.chair ? P.chair.seat.min.y : undefined,
    // (the reed tip is the lesson frame's origin: the mouth's front is drawn there)
    lip: { x: 0, y: 0, z: s.head.z } as Vec3,
    arms: {
      L: { sk: H.L.sk, elbow: H.L.elbow, shoulder: s.shoulderL, cut: cut(H.L.u), handElsewhere: authored },
      R: { sk: H.R.sk, elbow: H.R.elbow, shoulder: s.shoulderR, cut: cut(H.R.u), handElsewhere: authored },
    },
  };
}

/** The authored hands on this figure's posed hands (the wrist, the keys and the cuffs the lesson's own). */
export function saxReedHands(P: SaxPosture, fp: FamPlan): ReedPlaced[] {
  const H = saxHands(P);
  return reedHandsForPlan(fp, { back: REED_HAND_BACK, palm: REED_HAND_PALM }, { L: H.L.sk, R: H.R.sk });
}

/** The figure's plan and its parts over the horn (the far forearm, seen from the player's right, behind it). */
export function saxFigure(P: SaxPosture, view: ViewId, who?: CastMember): { fp: FamPlan; region: SkPath | null } {
  const fp = famPlan(saxFamIn(P, view, who));
  return { fp, region: famFrontRegion(fp, saxHornDepth(P, view), { foreBehind: view === 'side' ? ['L'] : [] }) };
}
