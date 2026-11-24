/**
 * I12 GONG — the player in the approved look (figure roll-out, D78,
 * 2026-11-24; shared/metal/metalFigureV2). Pure.
 *
 * Standing beside the gong where model.ts puts the player (playerAt: in front
 * of the face's plane, out beside the frame), turned toward it (facing 75° off
 * the audience's way, the gong on the front right), a heavy felt mallet in the
 * RIGHT hand: a relaxed full grip near the end of the handle (the hand closes
 * 45 mm in from the end, the approved stick grip: the fingers round one side of
 * the handle, the thumb's pad on the other), the arm reaching with the elbow
 * softly bent (model.ts: "a player strikes from about an arm and a mallet
 * away"), the head on its spot a little off center. The left arm hangs.
 * Because the player turns to the gong: from the audience the player is seen in
 * profile, from the side camera almost face-on.
 *
 * Who plays (cast.ts ROLES 'metal.gong'): Ana.
 */
import { v3, type V3 } from '../shared/players/handModel.ts';
import { gripMetalArm, hangArm, IDENT, metalFig, reachBack, standing, TO_FRONT, type MetalFig, type MetalView, type RodLook } from '../shared/metal/metalFigureV2.ts';
import { CY, GONG, MALLET_REACH, playerAt, strikePoint } from './model.ts';

/** The mallet's wooden handle as art.tsx draws it (22 mm, WOOD[1] inside WOOD[3]). */
const HANDLE_LOOK: RodLook = { d: 22, color: '#b77d43', edge: '#4a2a10' };

const MH = GONG.malletHead.mm / 2;
const FU = (z: number) => -z;

/** The player for one gong (the neck over playerAt, facing 75° from +x toward +z). */
export const gongBody = (variant: string) => {
  const p = playerAt(variant);
  return standing({ x0: p.x, z0: p.z, yaw: 75, nod: 12 });
};

/** The mallet as each view draws it: the hand's end (`grip`) and the head's centre, in 3-D. */
export function malletOf(view: MetalView, variant: string): { grip: V3; head: V3 } {
  const sp = strikePoint(variant);
  const grip3 = v3(sp.x + MALLET_REACH.out, CY - MALLET_REACH.up, sp.z - MALLET_REACH.across);
  if (view !== 'front') return { grip: grip3, head: v3(sp.x + MH, sp.y, sp.z) };
  // from the audience (art.tsx frontMallet): the head a little off its spot, the handle 330 across and 100 up
  const headAt: [number, number] = [FU(sp.z) + MH * 0.6, sp.y + MH * 0.2];
  const grip: [number, number] = [headAt[0] + MALLET_REACH.across, CY - MALLET_REACH.up];
  return { grip: v3(grip3.x, grip[1], -grip[0]), head: v3(sp.x + MH, headAt[1], -headAt[0]) };
}

/** The player for one view of one gong. */
export function gongFig(view: MetalView, variant: string): MetalFig {
  return metalFig(`gong|${variant}|${view}`, view, () => {
    const b = gongBody(variant);
    const { grip, head } = malletOf(view, variant);
    const l = Math.hypot(head.x - grip.x, head.y - grip.y, head.z - grip.z);
    const k = 45 / l;
    const fulcrum = v3(grip.x + (head.x - grip.x) * k, grip.y + (head.y - grip.y) * k, grip.z + (head.z - grip.z) * k);
    // (review 2: the handle passes THROUGH the closed hand — the approved held grip, as M06 timpani)
    // (at arm's length: the hand's line carries the forearm on — the wrist back toward the shoulder)
    const R = gripMetalArm(b, 'R', fulcrum, head, grip, reachBack(b, fulcrum, head), HANDLE_LOOK, { ulnar: 12 });
    const L = hangArm(b, 'L', view === 'top');
    // (turned to the gong: from the side camera the person faces it — the face-on figure; from the audience, in profile)
    if (view === 'side') return { b, L, R, m: IDENT, fv: 'front' };
    if (view === 'front') return { b, L, R, m: TO_FRONT, fv: 'side' };
    return { b, L, R };
  });
}
