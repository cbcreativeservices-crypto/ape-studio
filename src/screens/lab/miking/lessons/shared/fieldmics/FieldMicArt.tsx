/**
 * FIELD MICS — the drawings other Lab 6 / Lab 7 lessons import (built once by
 * group 1, lab6-g1). EXPORT NAMES (keep them): ShotgunArt, ShockMountArt,
 * PoleBoomArt, PoleOperatorArt; `shotgunLobe` is in ./shotgunLobe.ts.
 *
 *   ShotgunArt       the short shotgun in its shock mount (features/lab/
 *                    micDrawings ShotgunMic — the one drawing the placement
 *                    scene uses), placed at a point and an angle: the CAPSULE
 *                    at (x, y), the tube toward `angleDeg` (0° = +u).
 *   ShockMountArt    the cradle alone (a ring on elastic cords in a frame).
 *   PoleOperatorArt  the boom operator (the shared player figure) holding a
 *                    pole in both hands, in the local frame the placement
 *                    scene expects (LessonArt.PoleOperator): the pole's end in
 *                    the rear hand at the origin, the body behind it along
 *                    +u, facing −u (toward the mic); side view: the floor at
 *                    v = 0, the hands at chest height (POLE_HANDS_H).
 *   PoleBoomArt      a whole static pole rig for figures: the operator, the
 *                    pole and the shotgun at its tip.
 * Drawing defaults (collision.ts POLE_*): a 2 m pole, the hands 1.4 m up.
 * Static (D8).
 */
import { useMemo } from 'react';
import { Group, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import { ShotgunMic } from '../../../../../../features/lab/micDrawings';
import type { ViewId } from '../../../engine/model/types.ts';
import { POLE_HANDS_H } from '../../../engine/geometry/collision.ts';
import { PlayerBehind, PlayerInFront } from '../players/PlayerFigure';
import { make, rrect } from '../concert/paths.ts';
import { sidePose, standing, topPose } from '../foley/performer.ts';
import { v3 } from '../foley/frameF.ts';
import { SHOTGUN_BODY } from './fieldMics.ts';

const R = SHOTGUN_BODY.radius.mm;
const LEN = SHOTGUN_BODY.length.mm;
const FORE = SHOTGUN_BODY.fore.mm;

/** The short shotgun, its capsule at (x, y), pointing toward `angleDeg` (0° = +u, y down). */
export function ShotgunArt({ x, y, angleDeg, scale = 1, mount = true }: { x: number; y: number; angleDeg: number; scale?: number; mount?: boolean }) {
  // micDrawings' local frame: the front toward −y, the body toward +y.
  const rot = ((angleDeg + 90) * Math.PI) / 180;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: rot }, { scale }]}>
      <ShotgunMic r={R} len={LEN} fore={FORE} mount={mount} />
    </Group>
  );
}

/** The shock mount alone (a cradle for a pencil-shaped mic), centred at (x, y). */
export function ShockMountArt({ x, y, r = R, angleDeg = 0 }: { x: number; y: number; r?: number; angleDeg?: number }) {
  const g = useMemo(() => {
    const frame = make();
    rrect(frame, -r * 2.7, -r * 0.55, r * 2.7, r * 0.55, r * 0.5);
    rrect(frame, -r * 0.45, r * 0.4, r * 0.45, r * 3.2, r * 0.3);
    const ring = make();
    rrect(ring, -r * 1.12, -r * 0.32, r * 1.12, r * 0.32, r * 0.2);
    const cords = make();
    for (const s of [-1, 1]) {
      cords.moveTo(s * r * 1.02, -r * 0.9);
      cords.lineTo(s * r * 2.5, -r * 0.15);
      cords.moveTo(s * r * 1.02, r * 0.9);
      cords.lineTo(s * r * 2.5, r * 0.15);
    }
    return { frame, ring, cords };
  }, [r]);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (angleDeg * Math.PI) / 180 }]}>
      <Path path={g.frame}>
        <LinearGradient start={vec(-r, 0)} end={vec(r, 0)} colors={['#5b5f69', '#2a2c32', '#121317']} />
      </Path>
      <Path path={g.cords} style="stroke" strokeWidth={Math.max(0.5, r * 0.16)} strokeCap="round" color="#c9a24a" opacity={0.9} />
      <Path path={g.ring} color="#2a2c32" />
    </Group>
  );
}

/* The operator, authored facing +u with the body behind (−u) and mirrored. */
const OP = standing({
  floorY: 0,
  x: -320,
  stepR: 120,
  stepL: -110,
  wrR: v3(-30, -POLE_HANDS_H, 90),
  elR: v3(-230, -1180, 170),
  wrL: v3(200, -POLE_HANDS_H - 110, -60),
  elL: v3(-60, -1290, -150),
  kindR: 'grip',
  kindL: 'grip',
});
const OP_SIDE = sidePose(OP);
const OP_TOP = topPose(OP);

export function PoleOperatorArt({ view }: { view: ViewId }) {
  const pose = view === 'side' ? OP_SIDE : OP_TOP;
  return (
    <Group transform={[{ scaleX: -1 }]}>
      <PlayerBehind pose={pose} />
      <PlayerInFront pose={pose} />
    </Group>
  );
}

/**
 * A static pole rig for figures (side view only): the operator standing with
 * the floor at `floorY` and the hands at `hands`, the pole to `tip`, the
 * shotgun at the tip aimed at `aim`.
 */
export function PoleBoomArt({ floorY, hands, tip, aim }: { floorY: number; hands: { x: number; y: number }; tip: { x: number; y: number }; aim: { x: number; y: number } }) {
  const pole = useMemo(() => {
    const p = make();
    p.moveTo(hands.x, hands.y);
    p.lineTo(tip.x, tip.y);
    return p;
  }, [hands.x, hands.y, tip.x, tip.y]);
  const toward = (Math.atan2(aim.y - tip.y, aim.x - tip.x) * 180) / Math.PI;
  const flip = tip.x < hands.x ? 1 : -1;
  return (
    <Group>
      <Group transform={[{ translateX: hands.x }, { translateY: floorY }, { scaleX: flip }]}>
        <PoleOperatorArt view="side" />
      </Group>
      <Path path={pole} style="stroke" strokeWidth={22} strokeCap="round" color="#060608" />
      <Path path={pole} style="stroke" strokeWidth={18} strokeCap="round" color="#2b2e35" />
      <ShotgunArt x={tip.x + Math.cos((toward * Math.PI) / 180) * 60} y={tip.y + Math.sin((toward * Math.PI) / 180) * 60} angleDeg={toward} />
    </Group>
  );
}
