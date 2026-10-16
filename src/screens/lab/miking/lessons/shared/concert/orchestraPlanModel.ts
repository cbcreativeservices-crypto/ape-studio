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
 *
 * Collision pass 2026-10-15 (owner: "no collisions or impossible layering in
 * ANY plan"): every piece of furniture the drawing uses lives here, so
 * orchestraFoots() and the drawing read the same numbers. The snare
 * player's music stand stands downstage of the drum (it overlapped two
 * players' spaces); the suspended cymbal clears the snare's legs; the main
 * pair's stand stands downstage of the podium (it stood on the score desk);
 * the PA stands on the deck's downstage corners. STUDIO: no audience, no
 * wedges — a personal headphone mixer at every performer's place (27 chairs,
 * four percussionists and the conductor), each fed back to a distribution
 * point on the side wall (monitoring/cueMix.ts).
 */
import type { Vec3, Wedge } from '../../../engine/model/types.ts';
import { foot, rectAround, rectOfCircle, unionRect, wedgeFoot, type PlanFoot, type PlanRect } from '../planFoot.ts';
import { cueFootprints, type CueRig, type CueStation } from '../monitoring/cueMix.ts';

const IN = 25.4;

export type PlanPt = { u: number; v: number };
export type PlanItemId = 'timpani' | 'bassDrum' | 'snare' | 'tambourine' | 'cymbal' | 'table' | 'brass' | 'winds' | 'strings' | 'conductor' | 'main' | 'audience' | 'pa' | 'hall';
export type OwnInstrument = 'timpani' | 'bassDrum' | 'snare' | 'tambourine';
export type OrchScene = 'kit' | 'stage' | 'studio';

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
  /** A suspended cymbal (clear of the snare stand's legs) and the trap table
   *  (sticks, mallets, small instruments). */
  cymbal: { c: { u: 2820, v: 1480 }, d: 18 * IN },
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

/** One player's chair and music stand (mm from the chair's centre, +v toward
 *  the conductor): the seat, the backrest, the stand's desk and its tripod;
 *  a trombone's bell over the desk in the brass row. */
export const CHAIR = {
  seat: { hw: 210, v0: -210, v1: 190, r: 50 },
  back: { hw: 200, v0: -250, v1: -190, r: 26 },
  desk: { hw: 250, v0: 420, v1: 470, r: 14 },
  /** The stand's tripod: three legs from (0, legV), 170 long. */
  legV: 445,
  legR: 170,
  bell: { du: 130, dv: 330, r: 105 },
} as const;

/** The legs of a tripod at (0, 0), `r` long, the first pointing −v: their
 *  plan extent (the legs at −90°, 30°, 150°). */
export function tripodRect(c: PlanPt, r: number): PlanRect {
  const s = Math.cos(Math.PI / 6) * r;
  return { u0: c.u - s, u1: c.u + s, v0: c.v - r, v1: c.v + r / 2 };
}

/** A percussionist's music stand (desk and tripod): the snare player's, on
 *  the audience side of the drum (the player reads over it toward the
 *  conductor), clear of the cymbal and of every player's space. */
export const PERC_STAND = { hw: 250, hd: 25, legR: 170 } as const;
export const PERC_STANDS = [{ id: 'snareStand', who: 'snarePlayer', at: { u: 2170, v: 1450 } }] as const;

/** The snare on its stand: the drum's hoop (with its lugs) and the stand's
 *  three legs (DrumArt / the drawing's legs, 140 past the drum's radius). */
export const SNARE_STAND = { legOut: 140, legW: 22, hoopOut: 22 } as const;

/** The bass drum's tilting stand: the base rails ±rail across, ±(R + yo)
 *  along; casters at the corners; hoops past the shell. */
export const BASS_STAND = { rail: 330, yo: 90, caster: 40, railW: 46, hoop: 22 } as const;

export const FRONT = {
  conductor: { u: 0, v: 6950, r: 420 },
  /** The score desk, upstage of the conductor and facing them (v from the
   *  podium's upstage edge). */
  scoreDesk: { hw: 300, dv0: -170, dv1: -110 },
  /** The main pair on its tall stand, DOWNSTAGE of the podium (behind the
   *  conductor), its boom reaching up over them: the tripod (legR), the bar
   *  and two pencil mics splayed toward the orchestra. */
  main: { u: 0, v: 7750, spread: 200, legR: 330 },
  /** The PA stacks on the deck's downstage corners, facing the audience. */
  pa: [
    { u: -3600, v: 7670 },
    { u: 3600, v: 7670 },
  ],
  paCab: { hw: 300, hd: 230 },
  /** The audience (stage only): the deck's edge is 60 mm upstage of it. */
  audienceV: 8000,
  audienceArrowsU: [-2600, 0, 2600],
  /** The hall (studio): its walls' centre lines, WALL_T thick. */
  hall: { u0: -4150, u1: 4150, v0: -700, v1: 8150 },
} as const;
export const WALL_T = 90;
/** The studio room's inner wall faces (mm). */
export const STUDIO_ROOM: PlanRect = { u0: FRONT.hall.u0 + WALL_T / 2, u1: FRONT.hall.u1 - WALL_T / 2, v0: FRONT.hall.v0 + WALL_T / 2, v1: FRONT.hall.v1 - WALL_T / 2 };
/** The deck's downstage edge (stage). */
export const DECK_EDGE_V = FRONT.audienceV - 60;

/** The acoustic panels on the studio's side walls (100 deep, 600 long),
 *  between the headphone mix's wall boxes. */
export const PANELS = { depth: 100, len: 600, v0s: [200, 2200, 3500, 4675, 6100, 7300] } as const;
export function panelRects(): { id: string; r: PlanRect }[] {
  const R = STUDIO_ROOM;
  return PANELS.v0s.flatMap((v0, i) => [
    { id: `panelL${i}`, r: { u0: R.u0, u1: R.u0 + PANELS.depth, v0, v1: v0 + PANELS.len } },
    { id: `panelR${i}`, r: { u0: R.u1 - PANELS.depth, u1: R.u1, v0, v1: v0 + PANELS.len } },
  ]);
}

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
/** A timpano's reach past its head (the feet of its legs, TimpaniArt: R + 40
 *  + an 18 mm foot) and its pedal (toward the player, −v). */
export const TIMPANO_REACH = 58;
export const TIMPANO_PEDAL = { gap: 25, len: 230, w: 200 } as const;

/** The plan item under (u, v); `tol` in mm. Small things first. */
export function orchHitTest(u: number, v: number, tol: number, opts: { scene: OrchScene; four: boolean; wedges: readonly { id: string; at: PlanPt }[] }): string | null {
  const near = (c: PlanPt, r: number) => Math.hypot(u - c.u, v - c.v) <= r + tol;
  const wide = opts.scene !== 'kit';
  if (opts.scene === 'stage') for (const w of opts.wedges) if (near(w.at, 330)) return w.id;
  if (opts.scene === 'stage' && FRONT.pa.some((p) => near(p, 420))) return 'pa';
  if (opts.scene === 'stage' && v >= FRONT.audienceV - 120 - tol) return 'audience';
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

/** The percussionists (each a performer with a keep-out space). */
export type PercPlayer = 'timpanist' | 'bassDrummer' | 'snarePlayer' | 'tambourinist';

/** The players' spaces (keep-outs) round each percussionist, as rects. */
export function playerSpaceRects(four: boolean): { who: PercPlayer; r: PlanRect }[] {
  const T = PERC.timpani;
  const span = four ? 1550 : 900;
  const B = PERC.bassDrum;
  return [
    { who: 'timpanist', r: { u0: T.c.u - span, v0: T.player.v - 330, u1: T.c.u + span, v1: T.c.v - 250 } },
    { who: 'bassDrummer', r: { u0: B.player.u - 330, v0: B.player.v - 420, u1: B.c.u - B.depth / 2 - 30, v1: B.player.v + 420 } },
    { who: 'snarePlayer', r: { u0: PERC.snare.player.u - 330, v0: PERC.snare.player.v - 330, u1: PERC.snare.player.u + 330, v1: PERC.snare.c.v - 200 } },
    { who: 'tambourinist', r: { u0: PERC.tambourine.player.u - 330, v0: PERC.tambourine.player.v - 330, u1: PERC.tambourine.player.u + 330, v1: PERC.tambourine.c.v + 150 } },
  ];
}
/** The players' spaces (keep-outs), around each percussionist (plan polygons). */
export function playerSpaces(four: boolean): PlanPt[][] {
  return playerSpaceRects(four).map(({ r }) => [
    { u: r.u0, v: r.v0 },
    { u: r.u1, v: r.v0 },
    { u: r.u1, v: r.v1 },
    { u: r.u0, v: r.v1 },
  ]);
}

/* ── the footprints (test/mikingPlanCollisions_20261015) ── */

/** The performers: every chair is a player, every keep-out a percussionist,
 *  and the podium the conductor. `group`: their footprints' group. */
export type OrchPerformer = { id: string; group: string; head: PlanPt; facing: number };
const DOWN = Math.PI / 2;
export function orchPerformers(): OrchPerformer[] {
  const out: OrchPerformer[] = [];
  const seat = (row: string, us: readonly number[], v: number) => us.forEach((u, i) => out.push({ id: `${row}${i}`, group: `p:${row}${i}`, head: { u, v: v + (CHAIR.seat.v0 + CHAIR.seat.v1) / 2 }, facing: DOWN }));
  seat('brass', ROWS.brass.u, ROWS.brass.v);
  seat('winds', ROWS.winds.u, ROWS.winds.v);
  ROWS.strings.forEach((r, k) => seat(`str${k}_`, r.u, r.v));
  out.push({ id: 'timpanist', group: 'p:timpanist', head: PERC.timpani.player, facing: DOWN });
  out.push({ id: 'bassDrummer', group: 'p:bassDrummer', head: PERC.bassDrum.player, facing: 0 });
  out.push({ id: 'snarePlayer', group: 'p:snarePlayer', head: PERC.snare.player, facing: DOWN });
  out.push({ id: 'tambourinist', group: 'p:tambourinist', head: PERC.tambourine.player, facing: DOWN });
  out.push({ id: 'conductor', group: 'p:conductor', head: { u: FRONT.conductor.u, v: FRONT.conductor.v }, facing: -DOWN });
  return out;
}

/** A row's chairs: seat, back, the stand's desk and tripod, a bell. */
function chairFoots(row: string, us: readonly number[], v: number, bells: boolean): PlanFoot[] {
  const C = CHAIR;
  return us.flatMap((u, i) => {
    const g = `p:${row}${i}`;
    const id = `${row}${i}`;
    const fs = [
      foot(`${id}:seat`, 'chair', { u0: u - C.seat.hw, u1: u + C.seat.hw, v0: v + C.seat.v0, v1: v + C.seat.v1 }, { group: g }),
      foot(`${id}:back`, 'chair', { u0: u - C.back.hw, u1: u + C.back.hw, v0: v + C.back.v0, v1: v + C.back.v1 }, { group: g }),
      foot(`${id}:desk`, 'musicStand', { u0: u - C.desk.hw, u1: u + C.desk.hw, v0: v + C.desk.v0, v1: v + C.desk.v1 }, { group: g }),
      foot(`${id}:stand`, 'musicStand', tripodRect({ u, v: v + C.legV }, C.legR), { group: g }),
    ];
    if (bells) fs.push(foot(`${id}:bell`, 'instrument', rectOfCircle({ u: u + C.bell.du, v: v + C.bell.dv }, C.bell.r), { group: g }));
    return fs;
  });
}

/** The lesson's wedges as drawn on the plan (stage only). */
export function stageWedgesOf(own: OwnInstrument, wedges: readonly Wedge[]): { id: string; at: PlanPt; faces: PlanPt }[] {
  const f = LESSON_FRAMES[own];
  return wedges.filter((w) => w.glyph !== 'none').map((w) => ({ id: w.id, at: toPlan(f, w.p), faces: dirToPlan(f, w.faces) }));
}

/** The percussion's own footprints (drums, stands, the players' spaces). */
function percFoots(four: boolean): PlanFoot[] {
  const out: PlanFoot[] = [];
  const P = TIMPANO_PEDAL;
  for (const d of timpaniShown(four)) {
    const R = d.d / 2;
    out.push(foot(`timpano:${d.id}`, 'instrument', rectOfCircle(d.c, R + TIMPANO_REACH), { group: 'p:timpanist' }));
    out.push(foot(`pedal:${d.id}`, 'instrument', { u0: d.c.u - P.w / 2, u1: d.c.u + P.w / 2, v0: d.c.v - R - P.gap - P.len, v1: d.c.v - R - P.gap }, { group: 'p:timpanist' }));
  }
  const B = PERC.bassDrum;
  const S = BASS_STAND;
  const yo = B.d / 2 + S.yo;
  out.push(foot('bassDrum', 'instrument', { u0: B.c.u - S.rail - S.caster, u1: B.c.u + S.rail + S.caster, v0: B.c.v - yo - S.caster, v1: B.c.v + yo + S.caster }, { group: 'p:bassDrummer' }));
  const sn = PERC.snare;
  const legR = sn.d / 2 + SNARE_STAND.legOut + SNARE_STAND.legW / 2;
  const hoop = sn.d / 2 + SNARE_STAND.hoopOut;
  // the snare stand's legs at 90°, 210°, 330° (one toward the audience)
  out.push(foot('snare', 'instrument', { u0: sn.c.u - Math.cos(Math.PI / 6) * legR, u1: sn.c.u + Math.cos(Math.PI / 6) * legR, v0: sn.c.v - Math.max(hoop, legR / 2), v1: sn.c.v + legR }, { group: 'p:snarePlayer' }));
  for (const st of PERC_STANDS) out.push(foot(st.id, 'musicStand', unionRect([{ u0: st.at.u - PERC_STAND.hw, u1: st.at.u + PERC_STAND.hw, v0: st.at.v - PERC_STAND.hd, v1: st.at.v + PERC_STAND.hd }, tripodRect(st.at, PERC_STAND.legR)]), { group: `p:${st.who}` }));
  const tb = PERC.tambourine;
  const tr = tb.d / 2 + 4 + 30;
  out.push(foot('tambourine', 'instrument', { u0: tb.c.u - tr, u1: tb.c.u + tr, v0: tb.c.v - tr * Math.SQRT1_2, v1: tb.c.v + tr * Math.SQRT1_2 }, { group: 'p:tambourinist' }));
  out.push(foot('cymbal', 'cymbal', rectOfCircle(PERC.cymbal.c, PERC.cymbal.d / 2 + 4)));
  out.push(foot('table', 'table', PERC.table));
  for (const s of playerSpaceRects(four)) out.push(foot(`keep:${s.who}`, 'keepClear', s.r, { group: `p:${s.who}`, zone: true }));
  return out;
}

/** Every object the plan draws, at the wide (stage / studio) view. */
export function orchestraFoots(own: OwnInstrument, scene: 'stage' | 'studio', four: boolean, wedges: readonly Wedge[]): PlanFoot[] {
  const out: PlanFoot[] = [...percFoots(four)];
  out.push(...chairFoots('brass', ROWS.brass.u, ROWS.brass.v, true));
  out.push(...chairFoots('winds', ROWS.winds.u, ROWS.winds.v, false));
  ROWS.strings.forEach((r, k) => out.push(...chairFoots(`str${k}_`, r.u, r.v, false)));
  const c = FRONT.conductor;
  out.push(foot('podium', 'podium', { u0: c.u - c.r, u1: c.u + c.r, v0: c.v - c.r, v1: c.v + c.r }, { group: 'p:conductor' }));
  const sd = FRONT.scoreDesk;
  out.push(foot('scoreDesk', 'musicStand', { u0: c.u - sd.hw, u1: c.u + sd.hw, v0: c.v - c.r + sd.dv0, v1: c.v - c.r + sd.dv1 }, { group: 'p:conductor' }));
  const m = FRONT.main;
  out.push(foot('main', 'micStand', unionRect([tripodRect(m, m.legR), { u0: m.u - m.spread - 90, u1: m.u + m.spread + 90, v0: m.v - 130, v1: m.v + 20 }])));
  if (scene === 'stage') {
    for (const w of stageWedgesOf(own, wedges)) out.push(wedgeFoot({ id: w.id, p: { x: w.at.u, y: 0, z: w.at.v }, faces: { x: w.faces.u, y: 0, z: w.faces.v } }));
    FRONT.pa.forEach((p, i) => out.push(foot(`pa${i}`, 'pa', { u0: p.u - FRONT.paCab.hw, u1: p.u + FRONT.paCab.hw, v0: p.v - FRONT.paCab.hd, v1: p.v + FRONT.paCab.hd })));
  } else {
    for (const p of panelRects()) out.push(foot(p.id, 'panel', p.r));
    for (const rig of orchestraCue(own, four)) out.push(...cueFootprints(rig));
  }
  void rectAround;
  return out;
}

/* ── the studio headphone mix ── */

/** A chair's mixer: beside the seat (410 mm off its centre, on the side away
 *  from the bell / the bow / a flute's footjoint), a little upstage, so its
 *  feed drops behind the row. Brass: the player's right (−u); the others
 *  their left (+u). */
export const CUE_SEAT = { du: 410, dv: -60 } as const;
/** Where each percussionist's and the conductor's mixer stands: behind or
 *  beside them, clear of every player's space. */
export const CUE_AT: Record<PercPlayer | 'conductor', PlanPt> = {
  timpanist: { u: -1500, v: -470 },
  bassDrummer: { u: 560, v: 180 },
  snarePlayer: { u: 2250, v: -165 },
  tambourinist: { u: 3600, v: 400 },
  conductor: { u: 620, v: 6950 },
};

/**
 * The studio's headphone mix: one personal mixer per performer, fed from
 * distribution points on the side walls. Each row splits at its middle: the
 * left half feeds to the left wall, the right half to the right wall, every
 * feed in its own lane behind the row ('row' layout). The timpanist's feed
 * runs straight along the back to the left wall; the other three
 * percussionists' run behind the percussion to the right wall; the
 * conductor's straight to the right wall, where CONTROL ROOM names its box
 * (the open floor beside it holds the words; the other boxes are the same).
 */
export function orchestraCue(own: OwnInstrument, four: boolean): CueRig[] {
  void own;
  void four;
  const perf = new Map(orchPerformers().map((p) => [p.id, p]));
  const st = (id: string, at: PlanPt): CueStation => {
    const p = perf.get(id)!;
    return { id, at, head: p.head, facing: p.facing };
  };
  const room = STUDIO_ROOM;
  const rigs: CueRig[] = [];
  const row = (name: string, us: readonly number[], v: number, side: 1 | -1) => {
    // the chairs left of centre (and a centre chair) feed to the left wall
    const all = us.map((u, i) => ({ u, s: st(`${name}${i}`, { u: u + side * CUE_SEAT.du, v: v + CUE_SEAT.dv }) }));
    const left = all.filter((x) => x.u <= 0).map((x) => x.s);
    const right = all.filter((x) => x.u > 0).map((x) => x.s);
    rigs.push({ id: `${name}L`, room, wall: 'u0', layout: 'row', rowSide: -1, hubAt: 0, hubLabel: null, stations: left });
    rigs.push({ id: `${name}R`, room, wall: 'u1', layout: 'row', rowSide: -1, hubAt: 0, hubLabel: null, stations: right });
  };
  row('brass', ROWS.brass.u, ROWS.brass.v, -1);
  row('winds', ROWS.winds.u, ROWS.winds.v, 1);
  ROWS.strings.forEach((r, k) => row(`str${k}_`, r.u, r.v, 1));
  const T = CUE_AT.timpanist;
  rigs.push({ id: 'timp', room, wall: 'u0', layout: 'wall', hubAt: T.v, hubLabel: null, stations: [st('timpanist', T)] });
  rigs.push({ id: 'perc', room, wall: 'u1', layout: 'row', rowSide: -1, hubAt: 0, hubLabel: null, stations: (['bassDrummer', 'snarePlayer', 'tambourinist'] as const).map((id) => st(id, CUE_AT[id])) });
  rigs.push({ id: 'cond', room, wall: 'u1', layout: 'wall', hubAt: CUE_AT.conductor.v, hubLabel: 'CONTROL ROOM', stations: [st('conductor', CUE_AT.conductor)] });
  return rigs.filter((r) => r.stations.length);
}

/** The performer whose station the lesson names (its own player). */
export function ownPerformer(own: OwnInstrument): PercPlayer {
  return own === 'timpani' ? 'timpanist' : own === 'bassDrum' ? 'bassDrummer' : own === 'snare' ? 'snarePlayer' : 'tambourinist';
}

/** An item's plan rect (its name goes beside it), from the plan's footprints. */
export function orchItemRect(id: string, foots: readonly PlanFoot[]): PlanRect | null {
  const of = (pred: (f: PlanFoot) => boolean) => {
    const xs = foots.filter((f) => !f.zone && pred(f));
    return xs.length ? unionRect(xs) : null;
  };
  switch (id) {
    case 'timpani':
      return of((f) => f.id.startsWith('timpano:'));
    case 'bassDrum':
    case 'snare':
    case 'tambourine':
    case 'cymbal':
    case 'table':
    case 'main':
      return of((f) => f.id === id);
    case 'brass':
    case 'winds':
      return of((f) => f.group?.startsWith(`p:${id}`) === true);
    case 'strings':
      return of((f) => f.group?.startsWith('p:str') === true);
    case 'conductor':
      return of((f) => f.group === 'p:conductor');
    case 'pa':
      return of((f) => f.id === 'pa1');
    case 'hall': {
      const R = STUDIO_ROOM;
      return { u0: R.u0, u1: R.u0 + 300, v0: R.v1 - 600, v1: R.v1 - 300 };
    }
    default:
      return of((f) => f.id === id && f.kind === 'wedge');
  }
}
