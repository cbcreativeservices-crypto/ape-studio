/**
 * I03a HANDHELD SHAKER — the look (charter §2 layer 3), drawn ONLY from the
 * states in model.ts (the shell's axis, the right arm's shoulder, elbow, wrist
 * and grip), in millimetres of the view's (u, v): side u = x, v = y; top
 * u = x, v = z.
 *
 *   SIDE  the player from the right; the right arm reaches forward; the
 *         shell is seen along its length (TOWARD) — the back of the hand
 *         round it — or end-on (SIDE TO SIDE), the fist wrapped round it.
 *   TOP   from above: the shoulders and head, the arm, the back of the hand
 *         over the shell.
 * The motion is drawn as a pale double arrow along the shake (an idea of
 * WHERE it moves, never how far a real player goes). Nothing moves (D8).
 */
import { useMemo } from 'react';
import { DashPathEffect, Group, Path } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { arrow, make } from '../shared/concert/paths.ts';
import { Hand } from '../shared/smallperc/Hand';
import { dorsalFist, placeBetween, profileFist, type Pt } from '../shared/smallperc/hands.ts';
import { Arm2D, PlayerSide, PlayerTop } from '../shared/smallperc/Player';
import { ShakerTube } from '../shared/smallperc/objects';
import { P0 } from '../shared/smallperc/geom.ts';
import { HALF, R_SHELL, SHK_DIMS, stateOf } from './model.ts';

const FIST = profileFist(R_SHELL);
const BACK = dorsalFist();
const side = (p: { x: number; y: number }): Pt => [p.x, p.y];
const top = (p: { x: number; z: number }): Pt => [p.x, p.z];

/** A pale double arrow along the shake (drawn larger than a real stroke's
 *  detail; it says WHERE, not how far). */
function MotionMark({ a, b }: { a: Pt; b: Pt }) {
  const p = useMemo(() => {
    const q = make();
    arrow(q, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, a[0], a[1], 18);
    arrow(q, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, b[0], b[1], 18);
    return q;
  }, [a, b]);
  return (
    <Path path={p} style="stroke" strokeWidth={5} strokeCap="round" strokeJoin="round" color="#ffc64d" opacity={0.75}>
      <DashPathEffect intervals={[16, 10]} />
    </Path>
  );
}

export function ShakerArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const s = stateOf(variant);
  const a = s.arm;
  const len = SHK_DIMS.len.mm;
  const d = SHK_DIMS.d.mm;
  if (view === 'top') {
    const along = s.id === 'toward';
    const pl = placeBetween(BACK, top(a.W), top(a.G));
    const reach = SHK_DIMS.sweep.mm;
    return (
      <Group>
        <PlayerTop />
        <MotionMark a={along ? [P0.x - reach - 40, P0.z - 70] : [P0.x + 130, -reach - 40]} b={along ? [P0.x + reach + 40, P0.z - 70] : [P0.x + 130, reach + 40]} />
        <Arm2D s={top(a.S)} e={top(a.E)} w={top(a.W)} />
        <Hand geo={BACK} pl={pl} heldBehind held={<ShakerTube c={top(P0)} angle={along ? 0 : 90} len={len} d={d} />} />
      </Group>
    );
  }
  const along = s.id === 'toward';
  const reach = SHK_DIMS.sweep.mm;
  return (
    <Group>
      <PlayerSide />
      <MotionMark a={along ? [P0.x - reach - 40, P0.y - 110] : [P0.x + 140, P0.y - 120]} b={along ? [P0.x + reach + 40, P0.y - 110] : [P0.x + 140, P0.y - 120]} />
      <Arm2D s={side(a.S)} e={side(a.E)} w={side(a.W)} />
      {along ? (
        <Hand geo={BACK} pl={placeBetween(BACK, side(a.W), side(a.G))} heldBehind held={<ShakerTube c={side(P0)} angle={0} len={len} d={d} />} />
      ) : (
        <Hand geo={FIST} pl={placeBetween(FIST, side(a.W), side(a.G))} farThumb held={<ShakerTube c={side(P0)} angle={0} len={len} d={d} endOn />} />
      )}
    </Group>
  );
}

export function shakerLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const s = stateOf(variant);
  const along = s.id === 'toward';
  if (view === 'top') {
    return [
      { id: 'shell', text: 'SHAKER', u: along ? P0.x + HALF + 30 : P0.x + 60, v: along ? P0.z + 50 : P0.z + HALF + 40, align: along ? 'left' : 'left' },
      { id: 'motion', text: along ? '↔ THE SHAKE' : '↕ THE SHAKE', short: '↔', u: along ? P0.x : P0.x + 170, v: along ? P0.z - 120 : -SHK_DIMS.sweep.mm - 70, align: along ? 'center' : 'left', tone: 'illustrative' },
      { id: 'player', text: 'PLAYER', u: -380, v: 300, align: 'center', tone: 'muted' },
    ];
  }
  return [
    { id: 'shell', text: along ? 'SHAKER' : 'SHAKER (END-ON)', short: 'SHAKER', u: along ? P0.x + HALF + 24 : P0.x + 50, v: along ? P0.y + 50 : P0.y + 70, align: 'left' },
    { id: 'motion', text: along ? '↔ THE SHAKE' : '⊙ SHAKEN ACROSS', short: '↔', u: along ? P0.x : P0.x + 170, v: P0.y - 160, align: along ? 'center' : 'left', tone: 'illustrative' },
    { id: 'player', text: '← PLAYER', u: -380, v: -900, align: 'center', tone: 'muted' },
  ];
}

export function shakerHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const s = stateOf(variant);
  const id = s.id;
  const along = id === 'toward' || view === 'top';
  const cu = P0.x;
  const cv = view === 'side' ? P0.y : P0.z;
  // The tube's axis in this view: along u (TOWARD, or from above when it lies
  // across) — or end-on from the side.
  if (view === 'side' && id === 'side') return Math.hypot(u - cu, v - cv) <= R_SHELL + tol ? `shk.shell.${id}` : null;
  const horizontal = view === 'side' || id === 'toward';
  const t = horizontal ? u - cu : v - cv;
  const q = horizontal ? v - cv : u - cu;
  if (!along && !horizontal) return null;
  if (Math.abs(t) > HALF + tol || Math.abs(q) > R_SHELL + tol) return null;
  if (Math.abs(t) > HALF - 12) return `shk.caps.${id}`;
  if (Math.abs(q) < R_SHELL * 0.55) return `shk.fill.${id}`;
  return `shk.shell.${id}`;
}

export const SHK_ART: LessonArt = { Instrument: ShakerArt, labels: shakerLabels, hitTest: shakerHitTest };
