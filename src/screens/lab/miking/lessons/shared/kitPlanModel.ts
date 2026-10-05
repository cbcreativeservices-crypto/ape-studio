/**
 * THE KIT PLAN — where a drum sits (LESSON_JOURNEY §6 stage 3, §8). Shared by
 * Lab 1's drum lessons: each lesson highlights its own drum. Pure; tested.
 *
 * Frame: the kick's TOP view (geometry.ts) — u = x (mm, +x toward the
 * audience, the batter head at 0), v = z (mm, +z the drummer's right).
 *
 * PROVENANCE: every POSITION here is ILLUSTRATIVE — a typical right-handed
 * layout, drawn so the picture makes sense; no source gives a kit's layout
 * (left-handed players mirror it). Drum SIZES are common nominal sizes, the
 * same ones the Drum Tuning Lab draws (14 in snare, 12 in rack tom, 16 in
 * floor tom); the cymbal is a 14 in hi-hat. The two monitors are the
 * lesson's own (lesson.live.wedges), so the Studio-or-live page later shows
 * the same stage.
 */
const IN = 25.4;

export type PlanDrum = { id: string; c: { u: number; v: number }; r: number; lugs: number; legs?: number; above?: boolean };
export type PlanKit = {
  throne: { c: { u: number; v: number }; r: number };
  snare: PlanDrum;
  rackTom: PlanDrum;
  floorTom: PlanDrum;
  hihat: { c: { u: number; v: number }; r: number; pedal: { u0: number; u1: number; v: number; halfW: number } };
  /** The player's space: the throne, the legs and both pedals (ILLUSTRATIVE). */
  playerSpace: { u: number; v: number }[];
  audienceU: number;
  /** Room walls (studio), as u/v extents. */
  room: { u0: number; u1: number; v0: number; v1: number };
};

export const KIT_PLAN: PlanKit = {
  throne: { c: { u: -770, v: -110 }, r: 175 },
  snare: { id: 'snare', c: { u: -390, v: -330 }, r: 7 * IN, lugs: 10 },
  rackTom: { id: 'tom', c: { u: 140, v: -150 }, r: 6 * IN, lugs: 6, above: true },
  floorTom: { id: 'floor', c: { u: -360, v: 380 }, r: 8 * IN, lugs: 8, legs: 3 },
  hihat: { c: { u: -470, v: -650 }, r: 7 * IN, pedal: { u0: -760, u1: -500, v: -590, halfW: 45 } },
  playerSpace: [
    { u: -1000, v: -420 },
    { u: -720, v: -640 },
    { u: -470, v: -560 },
    { u: -360, v: -60 },
    { u: -110, v: -60 },
    { u: -110, v: 70 },
    { u: -560, v: 230 },
    { u: -1000, v: 230 },
  ],
  audienceU: 1640,
  room: { u0: -1120, u1: 1720, v0: -820, v1: 930 },
};

/** The scene boxes (plan): the kit alone, and the kit on a stage / in a room. */
export const PLAN_BOX = {
  kit: { u0: -1050, u1: 650, v0: -880, v1: 720 },
  wide: { u0: -1150, u1: 1760, v0: -860, v1: 1150 },
} as const;

/** Distance from a point to a polygon's inside (≤ 0 inside), for the tap test. */
function inPoly(pts: { u: number; v: number }[], u: number, v: number): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i];
    const b = pts[j];
    if (a.v > v !== b.v > v && u < ((b.u - a.u) * (v - a.v)) / (b.v - a.v) + a.u) inside = !inside;
  }
  return inside;
}

export type PlanHitCtx = {
  kick: { u0: number; u1: number; halfW: number };
  pedal: { u0: number; u1: number; halfW: number };
  wedges: { id: string; u: number; v: number }[];
  scene: 'kit' | 'stage' | 'studio';
};

/** The item under a plan point (mm); `tol` in mm. Order: the small things first. */
export function planHitTest(ctx: PlanHitCtx, u: number, v: number, tol: number): string | null {
  const K = KIT_PLAN;
  const near = (c: { u: number; v: number }, r: number) => Math.hypot(u - c.u, v - c.v) <= r + tol;
  if (ctx.scene === 'stage') for (const w of ctx.wedges) if (Math.abs(u - w.u) <= 300 + tol && Math.abs(v - w.v) <= 300 + tol) return w.id;
  if (ctx.scene === 'stage' && u >= K.audienceU - 260 - tol) return 'audience';
  if (u >= ctx.pedal.u0 - tol && u <= ctx.pedal.u1 + tol && Math.abs(v) <= ctx.pedal.halfW + tol) return 'pedal';
  if (near(K.hihat.c, K.hihat.r)) return 'hihat';
  if (u >= K.hihat.pedal.u0 - tol && u <= K.hihat.pedal.u1 && Math.abs(v - K.hihat.pedal.v) <= K.hihat.pedal.halfW + tol) return 'hihat';
  if (near(K.rackTom.c, K.rackTom.r)) return 'tom';
  if (near(K.snare.c, K.snare.r)) return 'snare';
  if (near(K.floorTom.c, K.floorTom.r)) return 'floor';
  if (near(K.throne.c, K.throne.r)) return 'throne';
  if (u >= ctx.kick.u0 - tol && u <= ctx.kick.u1 + tol && Math.abs(v) <= ctx.kick.halfW + tol) return 'kick';
  if (inPoly(K.playerSpace, u, v)) return 'throne';
  if (ctx.scene === 'studio' && (u <= K.room.u0 + 60 + tol || u >= K.room.u1 - 60 - tol || v <= K.room.v0 + 60 + tol || v >= K.room.v1 - 60 - tol)) return 'room';
  return null;
}
