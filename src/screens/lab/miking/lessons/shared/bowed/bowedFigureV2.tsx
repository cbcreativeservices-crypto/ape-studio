/**
 * THE BOWED PLAYER IN THE APPROVED LOOK (figure roll-out wave 5, D78,
 * 2026-11-24): violin, viola, cello and double bass — the lessons C09a, C09b,
 * C09c, C06a and C06b, every picture that draws the player (the scene in
 * side view and from above, the placement studio, the setting plans).
 *
 * Nothing of the posture moves: the skeleton (posture.ts), the bow as drawn
 * and the posed hands (bowedHands.ts: the stopping hand in first position,
 * each pad on its string at its stop, the thumb on the neck's flank or its
 * back; the bow hold at the frog, the thumb bent under the stick opposite the
 * middle finger, the little finger on top — or, cello and bass, a rounder
 * hand; the bass's pizzicato hand) are the ones the hit areas, keep-outs and
 * tests already read. Only the drawing is new (figureV2/familyV2.tsx): the
 * cast member who plays it, the approved sleeves and the posed hands in the
 * approved look.
 *
 * Who plays (cast.ts ROLES): violin Ana, viola Ruth, cello Kofi, bass Mei.
 */
import type { ReactElement } from 'react';
import { Group, Path, Skia, type SkPath } from '@shopify/react-native-skia';
import { Blur } from '../figureV2/detail';
import { familyHandSilhouette } from '../figureV2/familyHandV2';
import type { ViewId } from '../../../engine/model/types.ts';
import { castFor, type CastMember, type RoleKey } from '../figureV2/cast';
import { famFrontRegion, famPlan, FamilyFigureFrontV2, FamilyFigureV2, type FamIn } from '../figureV2/familyV2';
import type { DrawnHands } from './bowedHands.ts';
import type { Posture } from './posture.ts';
import type { Group3, Item } from './BowedArt';

const ROLE: Record<string, RoleKey> = { violin: 'bowed.violin', viola: 'bowed.viola', cello: 'bowed.cello', bass: 'bowed.bass' };

/** The cast member who plays this instrument. */
export const bowedPlayer = (P: Pick<Posture, 'spec'>) => castFor(ROLE[P.spec.id] ?? 'bowed.violin');
/** A setting plan's neighbor who plays the lesson's own instrument (a second violin beside the violinist): another person. */
export const bowedSecond = () => castFor('bowed.second');

const EMPTY = Skia.Path.Make();
const nodeItem = (node: ReactElement): Item => ({ path: EMPTY, box: { u0: 0, v0: 0, u1: 0, v1: 0 }, node });

/** The figure's input for a posture as drawn. */
export function bowedFamIn(P: Posture, D: DrawnHands, view: ViewId, bowed: boolean, cut: (axis: { p: { x: number; y: number; z: number }; d: { x: number; y: number; z: number } }) => { p: { x: number; y: number; z: number }; n: { x: number; y: number; z: number } } | undefined, who?: CastMember): FamIn | null {
  if (!D.R) return null;
  const pl = P.player;
  return {
    key: `bowed|${P.spec.id}|${P.kind}|${P.chair ? 'seat' : 'stand'}|${bowed ? 'bow' : 'pluck'}`,
    s: pl,
    view,
    who: who ?? bowedPlayer(P),
    seated: !!P.chair,
    floorY: P.floorY,
    seatY: P.chair ? P.chair.seat.min.y : undefined,
    arms: {
      L: { sk: D.L.sk, elbow: D.L.elbow, shoulder: D.L.shoulder, cut: cut(D.L.axis) ?? null },
      R: { sk: D.R.sk, elbow: D.R.elbow, shoulder: D.R.shoulder, cut: cut(D.R.axis) ?? null },
    },
  };
}

/**
 * The player's paint groups for a view: the person whole just behind the instrument, and again over it where
 * the old figure's own depth rule put a part in front (the stopping hand's forearm, seen from the player's side,
 * stays behind the neck as before).
 */
export function bowedFigureGroups(fi: FamIn, view: ViewId, instDepth: number, occ: { L?: SkPath } = {}): Group3[] {
  const fp = famPlan(fi);
  // (the stopping hand passing BEHIND the neck — its palm on the far side, the finger arches coming over the
  // fingerboard: the neck's soft contact shadow on the hand along the neck's edges, so the heel and the arches read
  // as one hand going behind it, never pieces cut off by the neck's line)
  const stop = fp.arms.find((a) => a.side === 'L');
  const behind = stop ? familyHandSilhouette(stop.hand, 'behind') : null;
  const contact =
    occ.L && behind ? (
      <Group clip={behind}>
        <Group transform={[{ translateX: 3 }, { translateY: 4 }]}>
          <Path path={occ.L} color="#1a0d06" opacity={0.7}>
            <Blur mm={7} />
          </Path>
        </Group>
      </Group>
    ) : null;
  // (seen from the player's right the head and neck are nearer than the instrument: the violin's chin rest under
  // the LEFT jaw, the cello's and the bass's neck passing beside the LEFT ear — never across the face)
  const region = famFrontRegion(fp, instDepth, { foreBehind: view === 'side' ? ['L'] : [], headFront: view === 'side' });
  return [
    { key: 'figureV2', depth: instDepth - 0.75, items: [nodeItem(<FamilyFigureV2 fp={fp} />)] },
    ...(contact ? [{ key: 'figureV2Contact', depth: instDepth - 0.5, items: [nodeItem(contact)] }] : []),
    { key: 'figureV2Front', depth: instDepth + 1e6, items: [nodeItem(<FamilyFigureFrontV2 fp={fp} region={region} />)] },
  ];
}
