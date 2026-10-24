/**
 * SMALL PERCUSSION — an ARM and the HAND that holds the instrument (hands
 * redesign 2026-10-24): the shared Miking hand (hand/anatomy) posed on the
 * object in 3-D, drawn in the lesson's side or top view, with the object
 * painted BETWEEN the fingers that wrap behind it and the parts in front of
 * it (the thumb, the near knuckles). The arm is the family's Arm2D drawn to
 * the grip's own wrist, which the grip keeps as near as it can to the
 * lesson's arm.
 */
import { useMemo, type ReactNode } from 'react';
import { Group } from '@shopify/react-native-skia';
import { armPath, BARE_ARM } from '../players/PlayerFigure';
import { pt } from '../players/playerPose';
import type { HandSkeleton, V3 } from '../players/handModel.ts';
import { AnatomicalHand } from '../hand/anatomy/AnatomicalHand';
import { cylinderCut, towardOf, type Cylinder } from '../hand/anatomy/anatomy.ts';
import { SIDE_VIEW, TOP_VIEW } from './Hand';
import { Arm2D } from './Player';

const proj = (view: 'side' | 'top', p: V3): [number, number] => (view === 'side' ? [p.x, p.y] : [p.x, p.z]);

export type HeldHandProps = {
  view: 'side' | 'top';
  /** The shoulder and elbow of the lesson's arm (frame H). */
  S: V3;
  E: V3;
  sk: HandSkeleton;
  /** What the hand holds, drawn between the hand's far and near parts. */
  held?: ReactNode;
  /** The held object as a cylinder (its axis, radius), for the occlusion plane. */
  cyl?: Cylinder;
  halfLength?: number;
  /** Draw the arm (default true). */
  arm?: boolean;
  /** The arm is painted elsewhere by the art (a far arm behind the body):
   *  not drawn here, but the hand still meets it at the wrist. */
  armElsewhere?: boolean;
  opacity?: number;
};

export function HeldHand({ view, S, E, sk, held, cyl, halfLength = 0, arm = true, armElsewhere = false, opacity = 1 }: HeldHandProps) {
  const V = view === 'side' ? SIDE_VIEW : TOP_VIEW;
  const W = sk.frame.o;
  const s = proj(view, S);
  const e = proj(view, E);
  const w = proj(view, W);
  const fore = Math.atan2(w[1] - e[1], w[0] - e[0]);
  const cut = useMemo(() => (cyl ? cylinderCut(cyl, towardOf(V), halfLength) : undefined), [cyl, V, halfLength]);
  const under = useMemo(() => (arm ? armPath(pt(s[0], s[1]), pt(e[0], e[1]), pt(w[0], w[1]), BARE_ARM) : null), [arm, s[0], s[1], e[0], e[1], w[0], w[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Group opacity={opacity}>
      {arm && !armElsewhere ? <Arm2D s={s} e={e} w={w} /> : null}
      {cut ? <AnatomicalHand sk={sk} view={V} fore={fore} cut={cut} part="behind" under={under} bare /> : null}
      {held}
      <AnatomicalHand sk={sk} view={V} fore={fore} cut={cut} part={cut ? 'front' : 'all'} under={under} bare />
    </Group>
  );
}
