/**
 * THE WOODWIND SECTION PLAN — where Lab 3's woodwinds sit (LESSON_JOURNEY
 * §8: "a plan at the source's real scale, neighbours as illustrated real
 * objects, the player's space as a keep-out, STAGE / STUDIO variants"). One
 * plan for every woodwind lesson; each lesson lights its own player. Pure.
 *
 * PLAN frame (mm), seen from above, the lessons' own TOP view: u = x (the
 * players' left, screen right), v = z (toward the conductor and the
 * audience, DOWN the screen). A player at slot (u, v) is the lesson-frame
 * drawing translated there — the same art, the same scale.
 *
 * The layout is the usual one seen from the conductor: flutes front left,
 * oboes front right, clarinets behind the flutes, bassoons behind the oboes;
 * the piccolo at the end of the flutes, the bass clarinet at the end of the
 * clarinets. Every POSITION is a DRAWING DEFAULT (a typical layout).
 */
export type PlanPt = { u: number; v: number };
export type SlotId = 'picc' | 'fl2' | 'fl1' | 'ob1' | 'ob2' | 'bcl' | 'cl2' | 'cl1' | 'bsn1' | 'bsn2';
export type Kind = 'flute' | 'piccolo' | 'clarinet' | 'oboe' | 'bassClarinet' | 'bassoon';

const FRONT = 0;
const BACK = -1250;
export const SLOTS: Readonly<Record<SlotId, { at: PlanPt; kind: Kind; label: string }>> = {
  picc: { at: { u: -2650, v: FRONT }, kind: 'piccolo', label: 'PICCOLO' },
  fl2: { at: { u: -1700, v: FRONT }, kind: 'flute', label: 'FLUTE 2' },
  fl1: { at: { u: -700, v: FRONT }, kind: 'flute', label: 'FLUTE 1' },
  ob1: { at: { u: 700, v: FRONT }, kind: 'oboe', label: 'OBOE 1' },
  ob2: { at: { u: 1600, v: FRONT }, kind: 'oboe', label: 'OBOE 2' },
  bcl: { at: { u: -2500, v: BACK }, kind: 'bassClarinet', label: 'BASS CLARINET' },
  cl2: { at: { u: -1550, v: BACK }, kind: 'clarinet', label: 'CLARINET 2' },
  cl1: { at: { u: -650, v: BACK }, kind: 'clarinet', label: 'CLARINET 1' },
  bsn1: { at: { u: 700, v: BACK }, kind: 'bassoon', label: 'BASSOON 1' },
  bsn2: { at: { u: 1650, v: BACK }, kind: 'bassoon', label: 'BASSOON 2' },
};
/** A shared music stand in front of each pair (between them). */
export const STANDS: readonly { id: string; at: PlanPt; pair: readonly SlotId[] }[] = [
  { id: 'stand.fl', at: { u: -1200, v: FRONT + 760 }, pair: ['fl1', 'fl2'] },
  { id: 'stand.picc', at: { u: -2650, v: FRONT + 760 }, pair: ['picc'] },
  { id: 'stand.ob', at: { u: 1150, v: FRONT + 760 }, pair: ['ob1', 'ob2'] },
  { id: 'stand.cl', at: { u: -1100, v: BACK + 700 }, pair: ['cl1', 'cl2'] },
  { id: 'stand.bcl', at: { u: -2500, v: BACK + 700 }, pair: ['bcl'] },
  { id: 'stand.bsn', at: { u: 1175, v: BACK + 700 }, pair: ['bsn1', 'bsn2'] },
];
export const STAGE = {
  conductor: { u: 0, v: 2500, r: 380 },
  main: { u: 0, v: 1950 },
  pa: [
    { u: -3300, v: 3150 },
    { u: 3300, v: 3150 },
  ],
  audienceV: 3500,
  hall: { u0: -3700, u1: 2900, v0: -2200, v1: 3700 },
} as const;
export const PLAN_BOX = {
  section: { u0: -3500, u1: 2500, v0: -1950, v1: 1250 },
  wide: { u0: -3800, u1: 3000, v0: -2250, v1: 3800 },
} as const;

/** A lesson-frame point (x, z) as a plan point for the slot `own`. */
export function toPlan(own: SlotId, p: { x: number; z: number }): PlanPt {
  const o = SLOTS[own].at;
  return { u: o.u + p.x, v: o.v + p.z };
}

/** The plan object under (u, v); `tol` in mm. The stage's things first. */
export function planHit(u: number, v: number, tol: number, opts: { scene: 'kit' | 'stage' | 'studio'; wedges: readonly { id: string; at: PlanPt }[] }): string | null {
  const near = (c: PlanPt, r: number) => Math.hypot(u - c.u, v - c.v) <= r + tol;
  if (opts.scene === 'stage') {
    for (const w of opts.wedges) if (near(w.at, 360)) return w.id;
    if (STAGE.pa.some((p) => near(p, 420))) return 'pa';
    if (v >= STAGE.audienceV - 150 - tol) return 'audience';
  }
  if (opts.scene !== 'kit' && near(STAGE.conductor, STAGE.conductor.r)) return 'conductor';
  if (opts.scene === 'studio' && near(STAGE.main, 360)) return 'main';
  for (const s of STANDS) if (near(s.at, 230)) return s.id;
  let best: { id: string; d: number } | null = null;
  for (const [id, s] of Object.entries(SLOTS)) {
    // A player's footprint: the chair and body round (0, −120), the
    // instrument out in front or to the side.
    const d = Math.hypot(u - (s.at.u + (s.kind === 'flute' || s.kind === 'piccolo' ? -180 : 0)), v - (s.at.v - 40));
    if (d <= 520 + tol && (!best || d < best.d)) best = { id, d };
  }
  if (best) return best.id;
  const H = STAGE.hall;
  if (opts.scene === 'studio' && (u <= H.u0 + 200 + tol || u >= H.u1 - 200 - tol || v <= H.v0 + 200 + tol || v >= H.v1 - 200 - tol)) return 'room';
  return null;
}
