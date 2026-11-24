/**
 * FIGURE V2 — A PERSON CLAPPING, IN PROFILE (wave 7 of D78, 2026-11-24; B14's
 * clap source over the boundary mic). The pose is the lesson's own (sports
 * BoundaryArt clapPose: the hands meeting 300 mm in front of the body at the
 * source's height, elbows relaxed a little ahead of the hips, one foot a half
 * step ahead) — nothing measured moves. Only the drawing is new: the approved
 * side figure (PersonSideV2) dressed as the cast member, the hands set as a
 * real clap is made (researched: the palms meet with one hand slightly cupped
 * ACROSS the other — the near hand's fingers point forward and up, its back
 * toward the viewer, the far hand turned flatter, its fingers lying across
 * the near hand's palm and heel; the forearms angled in toward each other).
 * The person faces the mic (−u): the pose is mirrored point for point and
 * drawn facing left, so the light stays the approved upper-left light.
 */
import { memo } from 'react';
import type { PlayerPose, Pt } from '../players/playerPose.ts';
import { PersonSideV2 } from './personV2';
import type { CastMember } from './cast';
import { placeRest, type PlacedHand } from './authoredHands.ts';
import { CLAP_BACK_ART, placeArt } from './backHands.ts';

/** A side pose mirrored about u = 0, facing the other way (the light is the figure's own, not mirrored). */
export function mirrorSidePose(p: PlayerPose): PlayerPose {
  const m = (q: Pt): Pt => ({ u: -q.u, v: q.v });
  const hand = (h: PlayerPose['handR']): PlayerPose['handR'] => ({ ...h, wrist: m(h.wrist), dir: Math.PI - h.dir });
  return {
    ...p,
    facing: -((p.facing ?? 1) >= 0 ? 1 : -1),
    head: { c: m(p.head.c), r: p.head.r },
    neck: m(p.neck),
    shoulderR: m(p.shoulderR),
    shoulderL: m(p.shoulderL),
    elbowR: m(p.elbowR),
    elbowL: m(p.elbowL),
    handR: hand(p.handR),
    handL: hand(p.handL),
    hipR: m(p.hipR),
    hipL: m(p.hipL),
    kneeR: m(p.kneeR),
    kneeL: m(p.kneeL),
    footR: m(p.footR),
    footL: m(p.footL),
  };
}

/** The clap's hands on a side pose facing +u: the near hand's fingers forward and up (about 50° above level), the
 *  far hand flatter (about 34°), crossing it — one hand cupped across the other, the far fingers showing only a
 *  little beyond the near hand (a wider angle fans the far fingertips into a row of bumps; studied at 3×,
 *  2026-11-24). Wrists and elbows unchanged. */
export function clapHands(p: PlayerPose): PlayerPose {
  return { ...p, handR: { ...p.handR, dir: -0.88, kind: 'rest' }, handL: { ...p.handL, dir: -0.6, kind: 'rest' } };
}

const cache = new WeakMap<PlayerPose, PlayerPose>();
/** The clapper's pose as drawn: the clap's hands, mirrored to face −u. */
export function clapperPoseV2(p: PlayerPose): PlayerPose {
  const hit = cache.get(p);
  if (hit) return hit;
  const out = mirrorSidePose(clapHands(p));
  cache.set(p, out);
  return out;
}

/** The two clapping hands placed: each seen from its back, its thumb on TOP (palms facing each other across
 *  the body's midline, so in profile the near hand shows its back with the thumb uppermost, never below). */
export function clapPlaced(q: PlayerPose): { placedR: PlacedHand; placedL: PlacedHand } {
  const up = { u: 0, v: -1 };
  // (Ensembles3, reviewer 2026-11-24: "no thumb; the fingertips a fan of equal round pills") each hand the clap's
  // own drawing (backHands CLAP_BACK_ART): its back to the viewer, the thumb along the top edge, four fingers of
  // different lengths with gaps from the tips — the far hand's fingers showing past the near one as fingers
  return { placedR: placeArt(CLAP_BACK_ART, q.handR.wrist, q.handR.dir, up), placedL: placeArt(CLAP_BACK_ART, q.handL.wrist, q.handL.dir, up) };
}
void placeRest;

/** The clapping person (the old Clapper's place: its group's origin at the old mirror line). */
export const ClapperV2 = memo(function ClapperV2({ pose, who }: { pose: PlayerPose; who: CastMember }) {
  const q = clapperPoseV2(pose);
  return <PersonSideV2 pose={q} who={who} opts={{ rest: 'restSide', ...clapPlaced(q) }} />;
});
