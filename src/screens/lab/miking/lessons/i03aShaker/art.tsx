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
import { gripCylinder, type Cylinder, type Grip } from '../shared/hand/anatomy/anatomy.ts';
import { HeldHand } from '../shared/smallperc/HeldHand';
import { PlayerSide, PlayerTop } from '../shared/smallperc/Player';
import { ShakerTube } from '../shared/smallperc/objects';
import { P0, v3 } from '../shared/smallperc/geom.ts';
import { HALF, R_SHELL, SHK_DIMS, stateOf, STATES } from './model.ts';

type Pt = readonly [number, number];

/**
 * THE GRIP (hands redesign 2026-10-24, owner: "four fingers drawn as
 * identical parallel sausages lying ON TOP of the shaker, no visible grip"):
 * the shared Miking hand closes round the shell in a POWER GRIP — the shell
 * across the palm at the base of the fingers, the four fingers wrapped round
 * it (their tips on its far side, hidden behind it), the thumb closing round
 * the near side — turned round the shell until its wrist meets the model's
 * wrist (the arm and every keep-out stay as they were).
 *   TOWARD        the shell along x: the fingers wrap it from the right, the
 *                 back of the hand toward the viewer from the side.
 *   SIDE TO SIDE  the shell along z (end-on from the side): the fist round
 *                 its middle, the end cap in front.
 */
const CYL: Record<'toward' | 'side', Cylinder> = {
  toward: { c: P0, axis: STATES.toward.axis, r: R_SHELL, slide: 34 },
  side: { c: P0, axis: STATES.side.axis, r: R_SHELL, slide: 34 },
};
const grips: Partial<Record<'toward' | 'side', Grip>> = {};
export function shakerGrip(id: 'toward' | 'side'): Grip {
  const hit = grips[id];
  if (hit) return hit;
  const a = STATES[id].arm;
  const g =
    id === 'toward'
      ? // The back of the hand toward the player's right (the side view sees it), the shell
        // diagonal across the palm, the thumb lying along its top.
        gripCylinder(CYL.toward, {
          thumbSign: 1,
          wrist: a.W,
          elbow: a.E,
          maxWrist: 65,
          angle: [50, 70],
          back: v3(0, -0.5, 0.9),
          thumb: 'along',
        })
      : // Palm down over the shell, the fingers round its front and under it.
        gripCylinder(CYL.side, {
          thumbSign: 1,
          wrist: a.W,
          elbow: a.E,
          angle: [68, 90],
          back: v3(0.15, -1, 0),
        });
  grips[id] = g;
  return g;
}

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
  const g = shakerGrip(s.id);
  const along = s.id === 'toward';
  const reach = SHK_DIMS.sweep.mm;
  if (view === 'top') {
    return (
      <Group>
        <PlayerTop />
        <MotionMark a={along ? [P0.x - reach - 40, P0.z - 70] : [P0.x + 130, -reach - 40]} b={along ? [P0.x + reach + 40, P0.z - 70] : [P0.x + 130, reach + 40]} />
        <HeldHand view="top" S={a.S} E={a.E} sk={g.sk} cyl={CYL[s.id]} halfLength={HALF} held={<ShakerTube c={[P0.x, P0.z]} angle={along ? 0 : 90} len={len} d={d} />} />
      </Group>
    );
  }
  return (
    <Group>
      <PlayerSide />
      <MotionMark a={along ? [P0.x - reach - 40, P0.y - 110] : [P0.x + 140, P0.y - 120]} b={along ? [P0.x + reach + 40, P0.y - 110] : [P0.x + 140, P0.y - 120]} />
      <HeldHand view="side" S={a.S} E={a.E} sk={g.sk} cyl={CYL[s.id]} halfLength={HALF} held={<ShakerTube c={[P0.x, P0.y]} angle={0} len={len} d={d} endOn={!along} />} />
    </Group>
  );
}

export function shakerLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const s = stateOf(variant);
  const along = s.id === 'toward';
  if (view === 'top') {
    return [
      {
        id: 'shell',
        text: 'SHAKER',
        u: along ? P0.x + HALF + 30 : P0.x + 60,
        v: along ? P0.z + 50 : P0.z + HALF + 40,
        align: along ? 'left' : 'left',
      },
      {
        id: 'motion',
        text: along ? '↔ THE SHAKE' : '↕ THE SHAKE',
        short: '↔',
        u: along ? P0.x : P0.x + 170,
        v: along ? P0.z - 120 : -SHK_DIMS.sweep.mm - 70,
        align: along ? 'center' : 'left',
        tone: 'illustrative',
      },
      {
        id: 'player',
        text: 'PLAYER',
        u: -380,
        v: 300,
        align: 'center',
        tone: 'muted',
      },
    ];
  }
  return [
    {
      id: 'shell',
      text: along ? 'SHAKER' : 'SHAKER (END-ON)',
      short: 'SHAKER',
      u: along ? P0.x + HALF + 24 : P0.x + 50,
      v: along ? P0.y + 50 : P0.y + 70,
      align: 'left',
    },
    {
      id: 'motion',
      text: along ? '↔ THE SHAKE' : '⊙ SHAKEN ACROSS',
      short: '↔',
      u: along ? P0.x : P0.x + 170,
      v: P0.y - 160,
      align: along ? 'center' : 'left',
      tone: 'illustrative',
    },
    {
      id: 'player',
      text: '← PLAYER',
      u: -380,
      v: -900,
      align: 'center',
      tone: 'muted',
      point: { u: -6000, v: -900 },
    },
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

export const SHK_ART: LessonArt = {
  Instrument: ShakerArt,
  labels: shakerLabels,
  hitTest: shakerHitTest,
};
