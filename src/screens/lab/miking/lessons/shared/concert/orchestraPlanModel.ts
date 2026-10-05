/**
 * THE ORCHESTRA PLAN — where Lab 1's concert instruments sit (LESSON_JOURNEY
 * §8: "a plan at the source's real scale, neighbours as illustrated real
 * objects, the player's space as a keep-out, STAGE / STUDIO variants"). One
 * plan for M06 timpani, M07a concert bass drum, M07b concert snare and M08
 * headed tambourine; each lesson lights its own instrument. Pure; tested.
 *
 * PLAN frame (mm), seen from above: u → across the stage (right on screen),
 * v → toward the conductor and the audience (DOWN on screen: the percussion
 * row sits at the back, at the top, so the picture is wide enough for a
 * phone). SIZES are the lessons' sourced instruments; every POSITION is a
 * DRAWING DEFAULT — a typical concert layout with the percussion at the back
 * (the badge says "a typical layout"). The lesson's own frame maps onto the
 * plan through LESSON_FRAMES (its wedges are drawn there).
 */
import type { Vec3 } from '../../../engine/model/types.ts';

const IN = 25.4;

export type PlanPt = { u: number; v: number };
export type PlanItemId = 'timpani' | 'bassDrum' | 'snare' | 'tambourine' | 'cymbal' | 'table' | 'brass' | 'winds' | 'strings' | 'conductor' | 'main' | 'audience' | 'pa' | 'hall';
export type OwnInstrument = 'timpani' | 'bassDrum' | 'snare' | 'tambourine';

/**
 * A lesson frame on the plan: plan = o + x·ex + z·ez (the lesson's +y is
 * height, not drawn). A player who faces the audience (down) has their
 * right hand toward screen-left, so a lesson's +z (the player's right) is −u.
 */
export type LessonFrame = { o: PlanPt; ex: PlanPt; ez: PlanPt };

/** Percussion (the back of the stage). */
export const PERC = {
  /** The timpani (timpani/GEOMETRY_PROPOSAL.md, international layout): the
   *  29 in on the player's left, the 26 in on the right, 380 mm either side
   *  of the M06 origin; the four-drum set adds 32 in and 23 in outside them
   *  (dx, dz in the M06 frame). */
  timpani: {
    c: { u: -1500, v: 750 },
    drums: [
      { id: 't32', d: 32 * IN, dx: -150, dz: -1210, four: true },
      { id: 't29', d: 29 * IN, dx: 0, dz: -380, four: false },
      { id: 't26', d: 26 * IN, dx: 0, dz: 380, four: false },
      { id: 't23', d: 23 * IN, dx: -150, dz: 1080, four: true },
    ],
    /** The player, upstage of the drums (M06 x = −700). */
    player: { u: -1500, v: 50 },
  },
  /** The concert bass drum, its axis ACROSS the stage (the heads face along
   *  u), the playing head toward −u, its player beyond it. */
  bassDrum: { c: { u: 1250, v: 820 }, d: 36 * IN, depth: 16 * IN, player: { u: 560, v: 820 } },
  /** The concert snare on its stand, its player upstage of it. */
  snare: { c: { u: 2250, v: 900 }, d: 14 * IN, player: { u: 2250, v: 380 } },
  /** The headed tambourine, held by its player (the M08 origin is under the hold). */
  tambourine: { c: { u: 3050, v: 840 }, d: 10 * IN, player: { u: 3050, v: 400 } },
  /** A suspended cymbal and the trap table (sticks, mallets, small instruments). */
  cymbal: { c: { u: 2700, v: 1450 }, d: 18 * IN },
  table: { u0: 3400, u1: 3880, v0: 1180, v1: 1500 },
} as const;

export const LESSON_FRAMES: Readonly<Record<OwnInstrument, LessonFrame>> = {
  timpani: { o: PERC.timpani.c, ex: { u: 0, v: 1 }, ez: { u: -1, v: 0 } },
  bassDrum: { o: { u: PERC.bassDrum.c.u - PERC.bassDrum.depth / 2, v: PERC.bassDrum.c.v }, ex: { u: -1, v: 0 }, ez: { u: 0, v: 1 } },
  snare: { o: PERC.snare.c, ex: { u: 0, v: 1 }, ez: { u: -1, v: 0 } },
  tambourine: { o: PERC.tambourine.c, ex: { u: 0, v: 1 }, ez: { u: -1, v: 0 } },
};

/** The rows in front of the percussion: a brass row, then winds and strings. */
export const ROWS = {
  brass: { v: 2350, u: [-2700, -1800, -900, 0, 900, 1800, 2700] },
  winds: { v: 3650, u: [-2250, -1350, -450, 450, 1350, 2250] },
  strings: [
    { v: 4850, u: [-3150, -2250, -1350, -450, 450, 1350, 2250, 3150] },
    { v: 5900, u: [-2700, -1800, -900, 900, 1800, 2700] },
  ],
} as const;

export const FRONT = {
  conductor: { u: 0, v: 6950, r: 420 },
  /** The main pair on its tall stand, just upstage of the conductor (in plan). */
  main: { u: 0, v: 6550, spread: 200 },
  pa: [
    { u: -3550, v: 7350 },
    { u: 3550, v: 7350 },
  ],
  audienceV: 7900,
  hall: { u0: -4150, u1: 4150, v0: -650, v1: 8150 },
} as const;

/** The scene boxes: the percussion and its neighbours; the whole stage. */
export const ORCH_BOX = {
  ensemble: { u0: -3150, u1: 4050, v0: -420, v1: 2850 },
  wide: { u0: -4250, u1: 4250, v0: -750, v1: 8250 },
} as const;

export function toPlan(f: LessonFrame, p: Vec3): PlanPt {
  return { u: f.o.u + p.x * f.ex.u + p.z * f.ez.u, v: f.o.v + p.x * f.ex.v + p.z * f.ez.v };
}
/** A direction (x, z) in the lesson frame as a plan direction. */
export function dirToPlan(f: LessonFrame, d: Vec3): PlanPt {
  return { u: d.x * f.ex.u + d.z * f.ez.u, v: d.x * f.ex.v + d.z * f.ez.v };
}

/** The timpani drums shown ('four' adds the outer pair), with plan centres. */
export function timpaniShown(four: boolean): { id: string; d: number; c: PlanPt }[] {
  const f = LESSON_FRAMES.timpani;
  return PERC.timpani.drums.filter((d) => four || !d.four).map((d) => ({ id: d.id, d: d.d, c: toPlan(f, { x: d.dx, y: 0, z: d.dz }) }));
}

/** Where an item's label sits (clear of its drawing). */
export function orchLabelAt(id: string, four = false): (PlanPt & { align: 'left' | 'center' | 'right' }) | null {
  const T = PERC.timpani;
  switch (id) {
    case 'timpani':
      return { u: T.c.u, v: T.c.v + (four ? 420 : 520), align: 'center' };
    case 'bassDrum':
      return { u: PERC.bassDrum.c.u, v: PERC.bassDrum.c.v + PERC.bassDrum.d / 2 + 160, align: 'center' };
    case 'snare':
      return { u: PERC.snare.c.u, v: PERC.snare.c.v + 300, align: 'center' };
    case 'tambourine':
      return { u: PERC.tambourine.c.u + 40, v: PERC.tambourine.c.v + 280, align: 'center' };
    case 'cymbal':
      return { u: PERC.cymbal.c.u - 280, v: PERC.cymbal.c.v + 40, align: 'right' };
    case 'table':
      return { u: (PERC.table.u0 + PERC.table.u1) / 2, v: PERC.table.v1 + 160, align: 'center' };
    case 'brass':
      return { u: ROWS.brass.u[0] - 280, v: ROWS.brass.v + 420, align: 'left' };
    case 'winds':
      return { u: ROWS.winds.u[0] - 300, v: ROWS.winds.v + 420, align: 'left' };
    case 'strings':
      return { u: ROWS.strings[0].u[0] - 250, v: ROWS.strings[0].v + 440, align: 'left' };
    case 'conductor':
      return { u: FRONT.conductor.u + FRONT.conductor.r + 120, v: FRONT.conductor.v + 40, align: 'left' };
    case 'main':
      return { u: FRONT.main.u - 520, v: FRONT.main.v, align: 'right' };
    case 'audience':
      return { u: 0, v: FRONT.audienceV + 230, align: 'center' };
    case 'pa':
      return { u: FRONT.pa[1].u - 450, v: FRONT.pa[1].v, align: 'right' };
    case 'hall':
      return { u: FRONT.hall.u0 + 220, v: FRONT.hall.v0 + 260, align: 'left' };
    default:
      return null;
  }
}

/** The plan item under (u, v); `tol` in mm. Small things first. */
export function orchHitTest(u: number, v: number, tol: number, opts: { scene: 'kit' | 'stage' | 'studio'; four: boolean; wedges: readonly { id: string; at: PlanPt }[] }): string | null {
  const near = (c: PlanPt, r: number) => Math.hypot(u - c.u, v - c.v) <= r + tol;
  const wide = opts.scene !== 'kit';
  if (opts.scene === 'stage') for (const w of opts.wedges) if (near(w.at, 330)) return w.id;
  if (opts.scene === 'stage' && FRONT.pa.some((p) => near(p, 420))) return 'pa';
  if (wide && v >= FRONT.audienceV - 120 - tol) return 'audience';
  if (wide && near(FRONT.conductor, FRONT.conductor.r)) return 'conductor';
  if (wide && near(FRONT.main, 360)) return 'main';
  for (const d of timpaniShown(opts.four)) if (near(d.c, d.d / 2 + 40)) return 'timpani';
  const B = PERC.bassDrum;
  if (Math.abs(u - B.c.u) <= B.depth / 2 + 120 + tol && Math.abs(v - B.c.v) <= B.d / 2 + 80 + tol) return 'bassDrum';
  if (near(PERC.snare.c, PERC.snare.d / 2 + 60)) return 'snare';
  if (near(PERC.tambourine.c, 220)) return 'tambourine';
  if (near(PERC.cymbal.c, PERC.cymbal.d / 2)) return 'cymbal';
  const tb = PERC.table;
  if (u >= tb.u0 - tol && u <= tb.u1 + tol && v >= tb.v0 - tol && v <= tb.v1 + tol) return 'table';
  if (Math.abs(v - ROWS.brass.v) <= 420 + tol && u >= ROWS.brass.u[0] - 420 && u <= ROWS.brass.u[ROWS.brass.u.length - 1] + 420) return 'brass';
  if (wide && Math.abs(v - ROWS.winds.v) <= 420 + tol) return 'winds';
  if (wide && ROWS.strings.some((r) => Math.abs(v - r.v) <= 420 + tol)) return 'strings';
  const H = FRONT.hall;
  if (opts.scene === 'studio' && (u <= H.u0 + 160 + tol || u >= H.u1 - 160 - tol || v <= H.v0 + 160 + tol || v >= H.v1 - 160 - tol)) return 'hall';
  return null;
}

/** The players' spaces (keep-outs), around each percussionist (plan polygons). */
export function playerSpaces(four: boolean): PlanPt[][] {
  const T = PERC.timpani;
  const span = four ? 1550 : 900;
  const box = (u0: number, v0: number, u1: number, v1: number): PlanPt[] => [
    { u: u0, v: v0 },
    { u: u1, v: v0 },
    { u: u1, v: v1 },
    { u: u0, v: v1 },
  ];
  return [
    box(T.c.u - span, T.player.v - 330, T.c.u + span, T.c.v - 250),
    box(PERC.bassDrum.player.u - 330, PERC.bassDrum.player.v - 420, PERC.bassDrum.c.u - PERC.bassDrum.depth / 2 - 30, PERC.bassDrum.player.v + 420),
    box(PERC.snare.player.u - 330, PERC.snare.player.v - 330, PERC.snare.player.u + 330, PERC.snare.c.v - 200),
    box(PERC.tambourine.player.u - 330, PERC.tambourine.player.v - 330, PERC.tambourine.player.u + 330, PERC.tambourine.c.v + 150),
  ];
}
