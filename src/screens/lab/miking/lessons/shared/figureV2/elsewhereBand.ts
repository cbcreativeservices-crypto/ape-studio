/**
 * FIGURE V2 — the standing guitarist and bassist from above (wave 7 of D78,
 * 2026-11-24), in the old plan player's frame (BacklinePlan.PlanPlayerTop:
 * the head at the origin, facing +u, the player's left toward −v; the guitar
 * worn edge-on, its top at u ≈ 158–163, the neck running to −v). The hands sit
 * where the old figure's did: the fretting hand on the neck, the picking hand
 * over the strings in front of the top. Pure: no React, no Skia.
 */
import { P } from './geom.ts';
import type { TopPlayer } from './elsewhereTop';

/** The neck 18 mm behind the head's center (the cast's standing top view). */
const NECK = P(-18, 0);

const player = (nut: number, bass: boolean): TopPlayer => ({
  neck: NECK,
  facing: 0,
  // the picking hand: the forearm over the instrument's upper edge, the hand hanging in front of the strings —
  // from above its back with the fingers curled under it (a guitarist's loose fist round the pick; a
  // bassist's plucking fingers, more foreshortened: the hand hangs lower)
  // (Ensembles3, reviewer: "the thumb a separate upright capsule beside a fist with a row of knuckle bumps") the
  // picking hand is the approved relaxed hand from above (restTop: one hand, the thumb growing from its mound),
  // its back up, the fingers loosely curled toward the strings, carrying on the forearm's line
  R: { elbow: P(60, 235), at: P(168, bass ? 70 : 100), along: P(0.42, -0.91), thumb: -1, kind: 'rest' },
  // the fretting hand: the elbow low at the side, the fist closed round the neck (thumb behind it)
  L: { elbow: P(40, -250), at: P(150, nut - 20), along: P(0, -1), thumb: -1, sx: 0.8 },
});

export const BAND_TOP_PLAYERS = {
  guitar: player(-430, false),
  bass: player(-520, true),
} as const;
