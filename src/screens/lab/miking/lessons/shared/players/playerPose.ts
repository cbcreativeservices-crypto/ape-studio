/**
 * THE SHARED PLAYER — a pose (pure; no React, so the tests reach it).
 *
 * A player is drawn from a SKELETON in the view's own millimetres (u, v —
 * the same plane and transform as the instrument): head, the base of the
 * neck, both shoulders, elbows and hands, the hips, knees and feet. The
 * drawing (PlayerFigure.tsx) puts true-sized body masses on those joints —
 * an adult's proportions, the same for a ukulele as for a bass — so the
 * figure is never scaled to the instrument; the frame crops it instead.
 *
 * SIDES: R / L are the PLAYER's right and left. Seen from the front, the
 * player's right is on the viewer's left.
 *
 * WHO SUPPLIES THE JOINTS: the instrument family, from its MODEL's envelopes
 * (the guitars: guitarPlayer.ts from guitarModel.playerFit) — so the hands
 * sit inside the keep-outs the mic is stopped by, and the drawing, the hit
 * areas and the collision solids agree. Every joint is a drawing default:
 * no source gives a player's geometry (acoustic_guitar/GEOMETRY_PROPOSAL.md §5).
 */

export type Pt = { u: number; v: number };

/** What a hand is doing (its drawn shape). */
export type HandKind =
  /** A loose fist holding a pick, over the strings (front view). */
  | 'pick'
  /** Fingers arched over a fingerboard, the thumb behind the neck. */
  | 'fret'
  /** A hand resting on a steel bar across the strings (lap style). */
  | 'bar'
  /** Seen from above: a hand over the strings. */
  | 'above'
  /** Relaxed, open. */
  | 'rest'
  /** A loose fist round a stick (a drummer's grip; the stick is the caller's). */
  | 'grip'
  /** Fingers curved down onto keys (a pianist's hand, seen from the side). */
  | 'keys';

export type Hand = {
  /** The wrist joint. */
  wrist: Pt;
  /** The direction the hand points (radians, in the view: 0 = +u). */
  dir: number;
  kind: HandKind;
  /** 'fret' / 'bar': the fingerboard the fingers lie across — its centre
   *  line v, its half-width, and the fret spaces (u) the fingertips stop. */
  board?: { v: number; half: number; tips: number[] };
};

/** 'side': in profile (added 2026-10-05 for the pianist and the drummer);
 *  R joints are the NEAR side, L the far side; `facing` says which way. */
export type PlayerView = 'front' | 'above' | 'side';
/** 'floor': seated cross-legged on the floor (barefoot: no shoes drawn). */
export type PlayerPosture = 'seated' | 'standing' | 'lap' | 'floor';

export type PlayerPose = {
  view: PlayerView;
  posture: PlayerPosture;
  head: { c: Pt; r: number };
  /** The base of the neck (the collar). */
  neck: Pt;
  shoulderR: Pt;
  shoulderL: Pt;
  elbowR: Pt;
  elbowL: Pt;
  handR: Hand;
  handL: Hand;
  hipR: Pt;
  hipL: Pt;
  kneeR: Pt;
  kneeL: Pt;
  footR: Pt;
  footL: Pt;
  /** The floor's v (front views); null from above. */
  floor: number | null;
  /** A strap over the left shoulder to this point (a standing player). */
  strapTo?: Pt | null;
  /** 'side' view: the way the player faces along u (default +1, toward +u).
   *  'above' view: the direction the chest faces, radians (default +v). */
  facing?: number;
};

/** True adult proportions (mm): the drawing's widths, a drawing default. */
export const BODY = {
  headW: 156,
  headH: 228,
  neckW: 104,
  shoulderHalf: 188,
  chestHalf: 172,
  waistHalf: 150,
  hipHalf: 176,
  upperArmR: 50,
  elbowR: 41,
  wristR: 30,
  thighR: 82,
  kneeR: 60,
  ankleR: 38,
  handLen: 185,
  handW: 86,
} as const;

export const pt = (u: number, v: number): Pt => ({ u, v });
export const dist = (a: Pt, b: Pt) => Math.hypot(b.u - a.u, b.v - a.v);
export const lerp = (a: Pt, b: Pt, t: number): Pt => ({ u: a.u + (b.u - a.u) * t, v: a.v + (b.v - a.v) * t });
export const angleOf = (a: Pt, b: Pt) => Math.atan2(b.v - a.v, b.u - a.u);

/** A joint `len` from `a` toward `b` (or `b` itself when nearer). */
export function toward(a: Pt, b: Pt, len: number): Pt {
  const d = dist(a, b);
  if (d <= len || d < 1e-6) return b;
  return lerp(a, b, len / d);
}
