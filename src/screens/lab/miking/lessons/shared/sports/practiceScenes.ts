/**
 * THE PRACTICE SCENES — the Placement Studio scenes of Lab 7 part 2 (frame P,
 * venuePlan.ts). Built once by group 2 (lab7-g5); group 3 adds its own
 * (practiceSmall, practiceCrowd) beside these. Pure; tested
 * (test/mikingLab7Sports.test.ts).
 *
 *   practiceField  (B13, B12) the lesson's 30 × 20 m rectangle; comparison
 *                  mark M at (15, −6), outside it; targets A (15, 4),
 *                  B (5, 10), C (15, 18) — plan ranges 10.0 / 18.9 / 24.0 m,
 *                  B 32° left (B13 L118–L135, CONFIRMED by calculation:
 *                  √(10² + 16²) = 18.87 m, atan(10/16) = 32.0°). The 6 m
 *                  offset is the lesson's own "hypothetical training layout,
 *                  not a sport safety rule".
 *   practiceLine   (B14) a straight mock boundary; A, B, C at 2, 5 and 8 m
 *                  inside, M 3 m outside, all on one line perpendicular to the
 *                  boundary → 5, 8 and 11 m (B14 L180, CONFIRMED arithmetic).
 *
 * Every other place (the crew strip's width, the fixed ambience mark E, the
 * camera, the crowd mark, the withdrawal path, the second mic's place on the
 * mock line, the turn arc) is a DRAWING DEFAULT: `placeholder` on its mark,
 * listed in `defaults`, never printed as a dimension. A readout computed from
 * one is said as "calculated from the drawing".
 *
 * Source heights: B13's practice uses "ordinary speech and modest handclaps"
 * with no height — the targets stand at the voice family's standing lip
 * height (1.55 m, a drawing default); B14's handclap is "made at the same
 * height" as the capsule, about 1 m (the lesson's own).
 */
import { p2, type Mark, type P2, type PlanRect, type Target, type TurnArc, type VenueScene } from './venuePlan.ts';

/** The voice family's standing lip height (m) — a drawing default for a
 *  talker's mouth or a clap at chest height (voice/voiceSpec). */
export const SPEECH_H = 1.55;

/* ═════════ practiceField (B13, B12) ═════════ */

export const FIELD_RECT: PlanRect = { x0: 0, y0: 0, x1: 30, y1: 20 };
/** The lesson's marks (B13 L118–L136). */
export const PF = {
  M: p2(15, -6),
  A: p2(15, 4),
  B: p2(5, 10),
  C: p2(15, 18),
  /** The fixed ambience mark E "in the authorized crew strip": no coordinate
   *  in the lesson — a drawing default. */
  E: p2(25, -6),
  /** An "authorized crowd mark" for the background-speech trial: a drawing
   *  default, off the axis to A. */
  K: p2(32.5, 13),
  /** The shotgun's capsule heights the lesson tries (m): about 1.2, then
   *  about 0.6 (B13 L136, L143 — the lesson's own trials). */
  hHigh: 1.2,
  hLow: 0.6,
} as const;
/** The lesson's printed ranges and aims from M, for the tests (m, deg). */
export const PF_PRINTED = { A: { range: 10.0, aim: 0 }, B: { range: 18.9, aim: 32 }, C: { range: 24.0, aim: 0 } } as const;

const PF_TARGETS: Target[] = [
  { id: 'A', label: 'target A (15, 4)', short: 'A', p: PF.A, h: SPEECH_H },
  { id: 'B', label: 'target B (5, 10)', short: 'B', p: PF.B, h: SPEECH_H },
  { id: 'C', label: 'target C (15, 18)', short: 'C', p: PF.C, h: SPEECH_H },
];
const PF_MARKS: Mark[] = [
  { id: 'M', label: 'comparison mark M (15, −6)', short: 'M', p: PF.M, kind: 'mic' },
  { id: 'E', label: 'the fixed ambience mark E', short: 'E', p: PF.E, kind: 'ambience', placeholder: true },
];
/** The crew strip M and E stand in (a drawing default 1.5 m wide). */
export const PF_CREW: PlanRect = { x0: -2, y0: -7, x1: 32, y1: -5.5 };
/** The operator's turn arc at M: 40° either side of straight ahead — a
 *  drawing default wide enough for A, B and C (B is 32° left). */
export const PF_ARC: TurnArc = { at: PF.M, fromDeg: -40, toDeg: 40, reach: 26 };

export const PRACTICE_FIELD: VenueScene = {
  id: 'practiceField',
  label: 'Practice field',
  blurb: 'A 30 × 20 m rectangle on an inactive training field; the comparison mark M 6 m outside it, three targets inside.',
  play: [p2(0, 0), p2(30, 0), p2(30, 20), p2(0, 20)],
  surface: 'grass',
  markings: [{ pts: [p2(0, 0), p2(30, 0), p2(30, 20), p2(0, 20)], closed: true }],
  keepClear: [
    {
      id: 'offset',
      label: 'the 6 m practice offset',
      short: 'KEEP CLEAR',
      poly: [p2(-2, -5.5), p2(32, -5.5), p2(32, 0), p2(-2, 0)],
      basis: 'lesson',
      note: 'The space between the rectangle and the crew strip. The 6 m is this practice’s own layout, not a rule of any sport — it may be made larger.',
    },
  ],
  routes: [
    { id: 'exit', label: 'the withdrawal path', short: 'WAY OUT', pts: [p2(15, -7.4), p2(15, -9.8)], kind: 'exit' },
    { id: 'cable', label: 'the cable route along the crew strip', short: 'CABLE', pts: [p2(-1.5, -7.3), p2(31.5, -7.3)], kind: 'crew' },
  ],
  footprints: [{ id: 'crew', label: 'the crew strip', short: 'CREW STRIP', rect: PF_CREW }],
  cameras: [{ id: 'cam', label: 'a camera position', p: p2(1.5, -6.3), dirDeg: -22, halfDeg: 22, reach: 14 }],
  sectors: [{ id: 'K', label: 'the crowd mark (background speech)', short: 'CROWD', kind: 'crowd', c: PF.K, h: SPEECH_H, poly: [p2(31.5, 11), p2(34.5, 11), p2(34.5, 15), p2(31.5, 15)] }],
  targets: PF_TARGETS,
  marks: PF_MARKS,
  badges: [],
  barriers: [],
  frame: { x0: -3, y0: -10.5, x1: 35.5, y1: 22 },
  defaults: ['crew strip width', 'E', 'crowd mark K', 'camera', 'withdrawal path', 'cable route', 'turn arc', 'source height 1.55 m'],
};

/* ═════════ practiceLine (B14) ═════════ */

/** The mock boundary runs along x at y = 0; the cleared source area is y > 0. */
export const PL = {
  M: p2(0, -3),
  A: p2(0, 2),
  B: p2(0, 5),
  C: p2(0, 8),
  /** A second approved mic position for the overlap trial (B14 L186): no
   *  coordinate in the lesson — a drawing default 4 m along the line. */
  M2: p2(4, -3),
  /** Capsule height for the directional mics and the clap's height (m): the
   *  lesson's "about 1 m above the floor … at the same height" (B14 L182). */
  h: 1.0,
  /** The 30° off-axis trial at B (B14 L183). */
  offAxisTrial: 30,
} as const;
export const PL_PRINTED = { A: 5, B: 8, C: 11 } as const;
/** The outside zone where the mics and observers stay (drawing default). */
export const PL_OUTSIDE: PlanRect = { x0: -6.5, y0: -4.5, x1: 6.5, y1: -0.3 };
export const PL_ARC: TurnArc = { at: PL.M, fromDeg: -45, toDeg: 45, reach: 11.5 };

export const PRACTICE_LINE: VenueScene = {
  id: 'practiceLine',
  label: 'Practice line',
  blurb: 'A straight mock boundary on an inactive dry floor: A, B and C at 2, 5 and 8 m inside it, the mic mark M 3 m outside — all on one line.',
  play: [p2(-6.5, 0), p2(6.5, 0), p2(6.5, 10), p2(-6.5, 10)],
  surface: 'mock',
  markings: [{ pts: [p2(-7, 0), p2(7, 0)] }],
  keepClear: [],
  routes: [{ id: 'walk', label: 'the source participant’s walking route', short: 'WALK', pts: [p2(0.9, 1.2), p2(0.9, 8.8)], kind: 'players' }],
  footprints: [{ id: 'outside', label: 'the outside zone', short: 'OUTSIDE ZONE', rect: PL_OUTSIDE }],
  cameras: [],
  sectors: [],
  targets: [
    { id: 'A', label: 'source point A, 2 m inside', short: 'A', p: PL.A, h: PL.h },
    { id: 'B', label: 'source point B, 5 m inside', short: 'B', p: PL.B, h: PL.h },
    { id: 'C', label: 'source point C, 8 m inside', short: 'C', p: PL.C, h: PL.h },
  ],
  marks: [
    { id: 'M', label: 'the mic mark M, 3 m outside', short: 'M', p: PL.M, kind: 'mic' },
    { id: 'M2', label: 'a second approved mic position', short: 'M2', p: PL.M2, kind: 'mic', placeholder: true },
  ],
  badges: [],
  barriers: [],
  frame: { x0: -7.5, y0: -5.5, x1: 7.5, y1: 10.5 },
  defaults: ['outside zone extent', 'M2', 'walking route', 'turn arc', 'mock area width'],
};

/** A target's plan point by id in a scene (throws for an unknown id: data error). */
export function targetOf(scene: VenueScene, id: string): Target {
  const t = scene.targets.find((q) => q.id === id);
  if (!t) throw new Error(`${scene.id}: no target ${id}`);
  return t;
}
export function markOf(scene: VenueScene, id: string): Mark {
  const m = scene.marks.find((q) => q.id === id);
  if (!m) throw new Error(`${scene.id}: no mark ${id}`);
  return m;
}
/** A point along A → B → C (t = 0 … 2): the walking source of the motion and
 *  handoff trials (B13 L144, B14 L183). */
export function alongTargets(scene: VenueScene, t: number): P2 {
  const ts = scene.targets;
  const k = Math.max(0, Math.min(ts.length - 1 - 1e-9, t));
  const i = Math.floor(k);
  const f = k - i;
  const a = ts[i].p;
  const b = ts[Math.min(ts.length - 1, i + 1)].p;
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

/* ═════════ Lab 7b group 3 (lab7-g6): practiceSmall (B15 = B16) and practiceCrowd (B17) ═════════
 *
 * Both lessons write their coordinates in their own frame; frame P wants the
 * mics OUTSIDE the source area and facing INTO it (+y), so each scene turns
 * the lesson's frame (a proper rotation: distances, angles and left/right are
 * unchanged) and keeps the lesson's own coordinates in every label:
 *
 *   practiceSmall  (B15 L204, B16 L264 — the same layout, ONE scene; B15-01)
 *                  lesson A (0,0), B (0,2), C (0,4) on the source line;
 *                  M1 (2,2), M2 (−2,2) in separate equipment areas; capsule
 *                  1 m, clap 1 m. M1→B 2.00 m, M1→A/C √8 = 2.83 m
 *                  (CONFIRMED arithmetic). The "double range" option puts
 *                  M1 at (4,2) → 4 m to B (B15 L209, B16 L269).
 *                  Turned a quarter turn: P = (lesson y, −lesson x).
 *   practiceCrowd  (B17 L222) lesson A (0,0) action; U1 (−1,2), U2 (0,2),
 *                  U3 (1,2) audience; stereo centre S (0,4), capsules 1.5 m,
 *                  aimed at U2; action mic D (2,0), 1 m, aimed at A; the
 *                  optional closer viewpoint S′ (0,3) (L227: "1 m closer to
 *                  U2"). S→U2 2.0 m, S→U1/U3 √5 = 2.24 m, S→A 4.0 m, D→A
 *                  2.0 m (plan; CONFIRMED arithmetic). Turned half a turn:
 *                  P = (−lesson x, −lesson y).
 *
 * Drawing defaults (`defaults`, `placeholder`, never printed): the source
 * areas' extents, the equipment footprints, the clearance bands, the
 * commentary station, the camera mock view, the audience's mouth height
 * (1.5 m — level with S's capsules, so the plan ranges are the slant ranges),
 * the low and standing source heights of B15's height trial (0.3 m, 1.5 m)
 * and its two capsule heights (0.6 m, 1.2 m — GEOMETRY_PROPOSAL §3, TRIAL).
 */

/** practiceSmall: the lesson's (x, y) → frame P. */
export const smallP = (x: number, y: number): P2 => p2(y, 0 - x); // 0 − x: no negative zero
/** practiceCrowd: the lesson's (x, y) → frame P. */
export const crowdP = (x: number, y: number): P2 => p2(0 - x, 0 - y);

export const PS = {
  A: smallP(0, 0),
  B: smallP(0, 2),
  C: smallP(0, 4),
  M1: smallP(2, 2),
  M2: smallP(-2, 2),
  /** The double-range option: M1 at (4, 2), 4 m from B (B15 L209). */
  M1far: smallP(4, 2),
  /** Capsule and clap height (m): the lessons' own 1 m (B15 L207, B16 L264). */
  h: 1.0,
  /** B15's height trial (drawing defaults, GEOMETRY_PROPOSAL §3): a low
   *  contact on a cushion and a standing talker's mouth; two capsule heights. */
  hLowSrc: 0.3,
  hStandSrc: 1.5,
  hMicLow: 0.6,
  hMicHigh: 1.2,
  /** The 30° aim trial at B (B15 L208, B16 L269). */
  offAxisTrial: 30,
} as const;
/** The lessons' printed plan ranges from M1 (m). */
export const PS_PRINTED = { B: 2.0, A: 2.83, C: 2.83, Bfar: 4.0 } as const;
/** The source area (the walking line and its people) and the equipment areas. */
export const PS_AREA: PlanRect = { x0: -0.8, y0: -0.7, x1: 4.8, y1: 0.7 };
export const PS_EQ1: PlanRect = { x0: 1.2, y0: -4.6, x1: 2.8, y1: -1.3 };
export const PS_EQ2: PlanRect = { x0: 1.2, y0: 1.3, x1: 2.8, y1: 2.8 };
const PS_CLEAR_NOTE = 'Nothing from the equipment areas reaches into the walking path — not a stand leg, a cable loop or a windshield. The practice’s own layout, not a sport’s rule.';

export const PRACTICE_SMALL: VenueScene = {
  id: 'practiceSmall',
  label: 'Practice room',
  blurb: 'A quiet, cleared room: three source points A, B and C 2 m apart on one walking line, and two separate equipment areas M1 and M2, 2 m either side of B.',
  play: [p2(PS_AREA.x0, PS_AREA.y0), p2(PS_AREA.x1, PS_AREA.y0), p2(PS_AREA.x1, PS_AREA.y1), p2(PS_AREA.x0, PS_AREA.y1)],
  surface: 'mock',
  markings: [{ pts: [PS.A, PS.C] }],
  keepClear: [
    { id: 'clear.0', label: 'the walking path’s clearance', short: 'KEEP CLEAR', poly: [p2(-0.8, -1.2), p2(4.8, -1.2), p2(4.8, -0.7), p2(-0.8, -0.7)], basis: 'drawing', note: PS_CLEAR_NOTE },
    { id: 'clear.1', label: 'the walking path’s clearance', short: 'KEEP CLEAR', poly: [p2(-0.8, 0.7), p2(4.8, 0.7), p2(4.8, 1.2), p2(-0.8, 1.2)], basis: 'drawing', note: PS_CLEAR_NOTE },
  ],
  routes: [
    { id: 'walk', label: 'the source participant’s walking line', short: 'WALK', pts: [p2(-0.5, 0.35), p2(4.5, 0.35)], kind: 'players' },
    { id: 'exit', label: 'the way out of the room', short: 'WAY OUT', pts: [p2(-1.4, -4.4), p2(-1.4, 3.0)], kind: 'exit' },
  ],
  footprints: [
    { id: 'eq1', label: 'equipment area M1', short: 'M1 AREA', rect: PS_EQ1 },
    { id: 'eq2', label: 'equipment area M2', short: 'M2 AREA', rect: PS_EQ2 },
  ],
  cameras: [],
  sectors: [],
  targets: [
    { id: 'A', label: 'source point A (0, 0)', short: 'A', p: PS.A, h: PS.h },
    { id: 'B', label: 'source point B (0, 2)', short: 'B', p: PS.B, h: PS.h },
    { id: 'C', label: 'source point C (0, 4)', short: 'C', p: PS.C, h: PS.h },
  ],
  marks: [
    { id: 'M1', label: 'mic mark M1 (2, 2)', short: 'M1', p: PS.M1, kind: 'mic' },
    { id: 'M2', label: 'mic mark M2 (−2, 2)', short: 'M2', p: PS.M2, kind: 'mic' },
  ],
  badges: [],
  barriers: [],
  frame: { x0: -1.9, y0: -5.2, x1: 10.2, y1: 3.4 },
  defaults: ['source area extent', 'equipment area extents', 'clearance bands', 'walking line offset', 'way out', 'low and standing source heights', 'capsule heights 0.6 / 1.2 m'],
};

export const PC = {
  A: crowdP(0, 0),
  U1: crowdP(-1, 2),
  U2: crowdP(0, 2),
  U3: crowdP(1, 2),
  S: crowdP(0, 4),
  /** The optional closer viewpoint, 1 m closer to U2 (B17 L227). */
  Sclose: crowdP(0, 3),
  D: crowdP(2, 0),
  /** The commentary station "at an approved separate station" (B17 L222):
   *  no coordinate in the lesson — a drawing default. */
  K: p2(2.7, -4.2),
  /** Heights (m): S's capsules 1.5 and D 1.0 (the lesson's); the action clap
   *  at D's height; the audience's mouths at S's height (drawing default). */
  hS: 1.5,
  hD: 1.0,
  hA: 1.0,
  hU: 1.5,
} as const;
export const PC_PRINTED = { SU2: 2.0, SU1: 2.24, SA: 4.0, DA: 2.0 } as const;
export const PC_AREA: PlanRect = { x0: -1.6, y0: -2.6, x1: 1.6, y1: 0.6 };
export const PC_PAIR: PlanRect = { x0: -0.7, y0: -4.6, x1: 0.7, y1: -2.8 };
export const PC_ACTION: PlanRect = { x0: -2.7, y0: -0.6, x1: -1.75, y1: 0.6 };
export const PC_STATION: PlanRect = { x0: 2.1, y0: -4.8, x1: 3.3, y1: -3.6 };

export const PRACTICE_CROWD: VenueScene = {
  id: 'practiceCrowd',
  label: 'Mock venue',
  blurb: 'A dry room laid out as a small venue: the action point A, three audience places U1–U3 in front of the stereo centre S, the action mic D beside A, and a separate commentary station.',
  play: [p2(PC_AREA.x0, PC_AREA.y0), p2(PC_AREA.x1, PC_AREA.y0), p2(PC_AREA.x1, PC_AREA.y1), p2(PC_AREA.x0, PC_AREA.y1)],
  surface: 'mock',
  markings: [{ pts: [p2(-1.2, -2), p2(1.2, -2)] }],
  keepClear: [],
  routes: [{ id: 'access', label: 'the access route', short: 'ACCESS', pts: [p2(-3.4, -4.8), p2(-3.4, 1.0)], kind: 'exit' }],
  footprints: [
    { id: 'pair', label: 'the audience pair’s footprint (S, and S′ 1 m closer)', short: 'PAIR AREA', rect: PC_PAIR },
    { id: 'station', label: 'the separate commentary station', short: 'COMMENTARY', rect: PC_STATION },
    { id: 'action', label: 'the action mic’s footprint (D)', short: 'D AREA', rect: PC_ACTION },
  ],
  cameras: [{ id: 'cam', label: 'the camera’s mock view', p: p2(-2.6, -4.3), dirDeg: -32, halfDeg: 16, reach: 5.2 }],
  sectors: [],
  targets: [
    { id: 'A', label: 'the action point A (0, 0)', short: 'A', p: PC.A, h: PC.hA },
    { id: 'U1', label: 'audience place U1 (−1, 2)', short: 'U1', p: PC.U1, h: PC.hU },
    { id: 'U2', label: 'audience place U2 (0, 2)', short: 'U2', p: PC.U2, h: PC.hU },
    { id: 'U3', label: 'audience place U3 (1, 2)', short: 'U3', p: PC.U3, h: PC.hU },
  ],
  marks: [
    { id: 'S', label: 'the stereo centre S (0, 4)', short: 'S', p: PC.S, kind: 'ambience' },
    { id: 'Sc', label: 'the closer viewpoint S′ (0, 3)', short: 'S′', p: PC.Sclose, kind: 'ambience' },
    { id: 'D', label: 'the action mic D (2, 0)', short: 'D', p: PC.D, kind: 'mic' },
    { id: 'K', label: 'the commentary station', short: 'COMM', p: PC.K, kind: 'operator', placeholder: true },
  ],
  badges: [],
  barriers: [],
  frame: { x0: -4.0, y0: -5.4, x1: 8.6, y1: 1.4 },
  defaults: ['source area extent', 'footprints', 'commentary station', 'camera mock view', 'access route', 'audience mouth height 1.5 m', 'action clap height 1.0 m'],
};
