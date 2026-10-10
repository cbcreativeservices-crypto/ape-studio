/**
 * SPORT PLANS — plan outlines of the sports Lab 7 part 2 names, in frame P
 * (venuePlan.ts). Built once by group 2 (lab7-g5): B13 draws the field and
 * diamond sports, B14 the court, racket and ice sports; group 3 adds track,
 * gymnastics, combat, motorsport, equestrian, aquatic and the arena.
 * Pure; tested.
 *
 * OWNER DECISION D7-2 (default): simple plan outlines at the sport's common
 * dimensions. Not one of these dimensions was read from a rulebook in the
 * research pass (BATCH7_RESEARCH_SUMMARY_PART2.md §1: "common, not read
 * today") — every one is a DRAWING DEFAULT, listed in `defaults`, never
 * printed as a number. They show WHERE approval is needed and why: the
 * playing area, the keep-clear space round it, the routes people need, the
 * approved footprints a lesson names, the fixtures nothing may be attached to.
 *
 * The clearances that ARE from the rules read in the research
 * (field_diamond/ and court_ice/ SOURCES.md): no attachments on goals, nets
 * and flagposts (soccer); a perimeter of 5 m where practicable, at least
 * 3.5 m (men) and 3.0 m (women) (rugby union); obstructions at least 2 m from
 * the court (basketball); a free zone of at least 3 m (volleyball, 5 m sides
 * and 6.5 m ends at top events). Owner decision D7-1 (default): they are drawn
 * and said ONLY as "typical clear zone — check your event's rules", with no
 * rulebook named — sport clearances, never mic positions.
 */
import { CLEAR_ZONE_WORDS, bandAround, basketballMarkings, p2, type Badge, type KeepClear, type P2, type PlanRect, type Sector, type VenueScene } from './venuePlan.ts';
import { ARENA_BUILD, type ArenaSportId } from './arenaPlans.ts';

/** Yards and feet in metres (exact, international). */
const YD = 0.9144;
const FT = 0.3048;

export type SportId = 'football' | 'soccer' | 'rugby' | 'baseball' | 'softball' | 'basketball' | 'volleyball' | 'tennis' | 'badminton' | 'hockey' | ArenaSportId;

const rect = (r: PlanRect): P2[] => [p2(r.x0, r.y0), p2(r.x1, r.y0), p2(r.x1, r.y1), p2(r.x0, r.y1)];
const line = (...pts: P2[]) => ({ pts });
/** An arc of radius r about c from a0 to a1 degrees (frame P, from +x toward +y). */
const arc = (c: P2, r: number, a0: number, a1: number, n = 24): P2[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return p2(c.x + r * Math.cos(a), c.y + r * Math.sin(a));
  });
const spot = (c: P2, r = 0.2) => ({ pts: [], circle: { c, r } });

/*
 * MARKINGS at the common published dimensions (metres; drawing defaults, see
 * the header — never printed):
 *   soccer      goal area 5.5 × 18.32, penalty area 16.5 × 40.32, penalty
 *               spot 11, centre circle and penalty arc 9.15, corner arc 1
 *   football    a yard line every 5 yd between the goal lines; goalposts on
 *               the end lines, crossbar 18 ft 6 in (5.64) wide
 *   rugby       22 m lines, 10 m lines and 5 m lines (dashed), posts 5.6 wide
 *   baseball    90 ft paths; foul poles 325 ft (99.1), centre field 400 ft
 *               (121.9); infield arc 95 ft from the pitcher's plate (60 ft
 *               6 in from home), mound Ø 18 ft, home circle Ø 26 ft
 *   softball    60 ft paths; fence 200 ft (61) at the poles, 220 ft (67) in
 *               centre; pitcher's circle r 8 ft; infield arc 60 ft from the
 *               pitcher's plate (43 ft)
 *   basketball  FIBA 28 × 15: three-point line r 6.75 from the basket centre
 *               (1.575 from the end line), 0.9 from the sidelines; key 5.8 ×
 *               4.9; free-throw circle r 1.8; no-charge arc r 1.25;
 *               backboard 1.8 wide, 1.2 in; ring Ø 0.45
 *   tennis      23.77 × 10.97, singles lines 1.37 in, service lines 6.40
 *               from the net, centre service line and centre marks
 *   badminton   13.4 × 6.1, short service 1.98, doubles long service 0.76
 *               in, singles sidelines 0.46 in, centre lines
 *   ice hockey  60 × 30, corner r 8.5, goal lines 4 from the ends (red), blue
 *               lines, red centre line, blue centre circle r 4.5, end-zone
 *               face-off circles r 4.5 (spots 6 out from the goal line, 7
 *               either side of centre), goal crease r 1.8, goal 1.83 wide
 */

function band(id: string, r: PlanRect, w: number, label: string, basis: KeepClear['basis'], note: string): KeepClear[] {
  return bandAround(r, w).map((poly, i) => ({ id: `${id}.${i}`, label, short: 'KEEP CLEAR', poly, basis, note }));
}
const crowd = (id: string, label: string, r: PlanRect, h = 3): Sector => ({ id, label, short: 'CROWD', kind: 'crowd', c: p2((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2), h, poly: rect(r) });
const pa = (id: string, c: P2, h = 8): Sector => ({ id, label: 'a PA loudspeaker', short: 'PA', kind: 'pa', c, h, poly: rect({ x0: c.x - 0.8, y0: c.y - 0.8, x1: c.x + 0.8, y1: c.y + 0.8 }) });

/* ── field and diamond sports (B13) ── */

function soccer(): VenueScene {
  const L = 105;
  const W = 68;
  const f = { x0: 0, y0: 0, x1: L, y1: W };
  const pen = (x: number, dir: 1 | -1) => rect({ x0: Math.min(x, x + dir * 16.5), y0: W / 2 - 20.16, x1: Math.max(x, x + dir * 16.5), y1: W / 2 + 20.16 });
  const goal = (x: number, dir: 1 | -1) => rect({ x0: Math.min(x, x - dir * 2), y0: W / 2 - 3.66, x1: Math.max(x, x - dir * 2), y1: W / 2 + 3.66 });
  const noAttach = (id: string, p: P2, label: string): Badge => ({ id, label, short: 'NO ATTACHING', p, kind: 'noAttach' });
  return {
    id: 'soccer',
    label: 'Soccer',
    blurb: 'Kicks, close challenges and footfalls near the touchline; the middle of the pitch is mostly atmosphere.',
    play: rect(f),
    surface: 'grass',
    markings: [
      { pts: rect(f), closed: true },
      line(p2(L / 2, 0), p2(L / 2, W)),
      { pts: [], circle: { c: p2(L / 2, W / 2), r: 9.15 } },
      spot(p2(L / 2, W / 2)),
      { pts: pen(0, 1), closed: true },
      { pts: pen(L, -1), closed: true },
      { pts: rect({ x0: 0, y0: W / 2 - 9.16, x1: 5.5, y1: W / 2 + 9.16 }), closed: true },
      { pts: rect({ x0: L - 5.5, y0: W / 2 - 9.16, x1: L, y1: W / 2 + 9.16 }), closed: true },
      spot(p2(11, W / 2)),
      spot(p2(L - 11, W / 2)),
      { pts: arc(p2(11, W / 2), 9.15, -53.05, 53.05) },
      { pts: arc(p2(L - 11, W / 2), 9.15, 126.95, 233.05) },
      { pts: arc(p2(0, 0), 1, 0, 90, 6) },
      { pts: arc(p2(L, 0), 1, 90, 180, 6) },
      { pts: arc(p2(L, W), 1, 180, 270, 6) },
      { pts: arc(p2(0, W), 1, 270, 360, 6) },
      { pts: goal(0, 1), closed: true },
      { pts: goal(L, -1), closed: true },
    ],
    keepClear: band('runoff', f, 4, 'the run-off round the pitch', 'drawing', 'Players, assistant referees, ball attendants and warm-ups use it. A mic, a stand or an operator stays out of it.'),
    routes: [
      { id: 'ar', label: 'the assistant referee’s run along the touchline', short: 'OFFICIAL', pts: [p2(2, -1.2), p2(L - 2, -1.2)], kind: 'officials' },
      { id: 'bench', label: 'the team benches and technical areas', short: 'BENCHES', pts: [p2(L / 2 - 14, -2.6), p2(L / 2 + 14, -2.6)], kind: 'bench' },
      { id: 'med', label: 'the medical route onto the pitch', short: 'MEDICAL', pts: [p2(L / 2 + 18, -9), p2(L / 2 + 18, -0.5)], kind: 'medical' },
    ],
    footprints: [
      { id: 'near', label: 'an approved perimeter position, near side', short: 'APPROVED', rect: { x0: 24, y0: -7.5, x1: 30, y1: -5.5 } },
      { id: 'goalL', label: 'an approved position beside the goal area (separately permitted)', short: 'APPROVED', rect: { x0: -7.5, y0: W / 2 + 12, x1: -5.5, y1: W / 2 + 18 } },
      { id: 'far', label: 'an approved perimeter position, far side', short: 'APPROVED', rect: { x0: 70, y0: W + 5.5, x1: 76, y1: W + 7.5 } },
    ],
    cameras: [{ id: 'cam', label: 'the main camera', p: p2(L / 2, -12), dirDeg: 0, halfDeg: 28, reach: 40 }],
    sectors: [crowd('cr.far', 'the crowd, far side', { x0: 6, y0: W + 9, x1: L - 6, y1: W + 15 }), crowd('cr.end', 'the crowd behind a goal', { x0: L + 9, y0: 8, x1: L + 15, y1: W - 8 }), pa('pa1', p2(L / 2, W + 8.5))],
    targets: [],
    marks: [],
    badges: [noAttach('g0', p2(-1, W / 2), 'the goal and its net'), noAttach('g1', p2(L + 1, W / 2), 'the goal and its net'), noAttach('f0', p2(0, 0), 'a corner flagpost'), noAttach('f1', p2(L, W), 'a corner flagpost')],
    barriers: [],
    frame: { x0: -12, y0: -16, x1: L + 12, y1: W + 16 },
    defaults: ['105 × 68 m pitch', 'markings', 'run-off 4 m', 'routes', 'footprints', 'camera', 'crowd', 'PA'],
  };
}

function football(): VenueScene {
  const L = 120 * YD;
  const W = (160 / 3) * YD;
  const f = { x0: 0, y0: 0, x1: L, y1: W };
  const ez = 10 * YD;
  return {
    id: 'football',
    label: 'American football',
    blurb: 'Cadence and calls where permitted, snap and contact, kicks — brief, moving sources; a midfield view is not coverage of the whole field.',
    play: rect(f),
    surface: 'grass',
    markings: [
      { pts: rect(f), closed: true },
      line(p2(ez, 0), p2(ez, W)),
      line(p2(L - ez, 0), p2(L - ez, W)),
      // A yard line every 5 yards between the goal lines (the 50 among them).
      ...Array.from({ length: 19 }, (_, k) => line(p2(ez + (k + 1) * 5 * YD, 0), p2(ez + (k + 1) * 5 * YD, W))),
      // The goalposts on the end lines: the crossbar, 18 ft 6 in wide.
      { ...line(p2(0, W / 2 - 2.82), p2(0, W / 2 + 2.82)), ink: 'yellow' as const },
      { ...line(p2(L, W / 2 - 2.82), p2(L, W / 2 + 2.82)), ink: 'yellow' as const },
    ],
    keepClear: band('side', f, 4, 'the restricted area along the sidelines and end lines', 'drawing', 'The event assigns the clearances and crew lanes; nothing stands inside them.'),
    routes: [
      { id: 'teamN', label: 'the team area and its lane', short: 'TEAM AREA', pts: [p2(L / 2 - 23, -5), p2(L / 2 + 23, -5)], kind: 'bench' },
      { id: 'chain', label: 'the chain crew’s route', short: 'CHAIN CREW', pts: [p2(ez, -1.4), p2(L - ez, -1.4)], kind: 'officials' },
      { id: 'med', label: 'the medical route', short: 'MEDICAL', pts: [p2(L / 2 + 30, -11), p2(L / 2 + 30, -0.5)], kind: 'medical' },
    ],
    footprints: [
      { id: 'crewA', label: 'an assigned crew lane, near sideline', short: 'CREW LANE', rect: { x0: 12, y0: -9, x1: 38, y1: -7.2 } },
      { id: 'end', label: 'an approved end-zone position', short: 'APPROVED', rect: { x0: L + 5.5, y0: W / 2 - 3, x1: L + 7.5, y1: W / 2 + 3 } },
    ],
    cameras: [{ id: 'cam', label: 'the main camera', p: p2(L / 2, -14), dirDeg: 0, halfDeg: 30, reach: 40 }],
    sectors: [crowd('cr.far', 'the crowd, far side', { x0: 8, y0: W + 9, x1: L - 8, y1: W + 15 }), pa('pa1', p2(L / 2, W + 8.5))],
    targets: [],
    marks: [],
    badges: [],
    barriers: [],
    frame: { x0: -12, y0: -18, x1: L + 12, y1: W + 17 },
    defaults: ['120 × 53⅓ yd field', 'end zones', 'sideline restricted area', 'team areas', 'crew lanes', 'camera', 'crowd', 'PA'],
  };
}

function rugby(): VenueScene {
  const L = 100;
  const W = 70;
  const ig = 10;
  const f = { x0: -ig, y0: 0, x1: L + ig, y1: W };
  return {
    id: 'rugby',
    label: 'Rugby union',
    blurb: 'Boot-to-ball, permitted calls, lineouts, scrums and rucks — a cluster of bodies changes what a distant mic can hear.',
    play: rect(f),
    surface: 'grass',
    markings: [
      { pts: rect(f), closed: true },
      line(p2(0, 0), p2(0, W)),
      line(p2(L, 0), p2(L, W)),
      line(p2(L / 2, 0), p2(L / 2, W)),
      line(p2(22, 0), p2(22, W)),
      line(p2(L - 22, 0), p2(L - 22, W)),
      { ...line(p2(L / 2 - 10, 0), p2(L / 2 - 10, W)), dashed: true },
      { ...line(p2(L / 2 + 10, 0), p2(L / 2 + 10, W)), dashed: true },
      { ...line(p2(5, 0), p2(5, W)), dashed: true },
      { ...line(p2(L - 5, 0), p2(L - 5, W)), dashed: true },
      // The posts on the try lines, 5.6 m apart.
      spot(p2(0, W / 2 - 2.8), 0.3),
      spot(p2(0, W / 2 + 2.8), 0.3),
      spot(p2(L, W / 2 - 2.8), 0.3),
      spot(p2(L, W / 2 + 2.8), 0.3),
    ],
    keepClear: band('perim', f, 5, 'the perimeter round the ground', 'rule', `A ${CLEAR_ZONE_WORDS}: about 5 m where it can be, at least 3.5 m for the men’s game and 3 m for the women’s. A ground dimension — not a safe mic distance, and not space a crew may occupy.`),
    routes: [
      { id: 'sub', label: 'the substitution and medical route', short: 'MEDICAL', pts: [p2(L / 2 - 6, -9), p2(L / 2 - 6, -0.5)], kind: 'medical' },
      { id: 'ball', label: 'the ball-retrieval route', short: 'BALL', pts: [p2(-ig + 1, -2.5), p2(L + ig - 1, -2.5)], kind: 'officials' },
    ],
    footprints: [
      { id: 'touch', label: 'an approved touchline position, outside the perimeter', short: 'APPROVED', rect: { x0: 30, y0: -8.5, x1: 36, y1: -6.5 } },
      { id: 'goal', label: 'an approved in-goal-end position, outside the perimeter', short: 'APPROVED', rect: { x0: L + ig + 6.5, y0: W / 2 - 3, x1: L + ig + 8.5, y1: W / 2 + 3 } },
    ],
    cameras: [{ id: 'cam', label: 'the main camera', p: p2(L / 2, -14), dirDeg: 0, halfDeg: 30, reach: 40 }],
    sectors: [crowd('cr.far', 'the crowd, far side', { x0: 0, y0: W + 9, x1: L, y1: W + 15 })],
    targets: [],
    marks: [],
    badges: [
      { id: 'posts0', label: 'the posts and their padding', short: 'APPROVAL ONLY', p: p2(0, W / 2), kind: 'approvalOnly' },
      { id: 'posts1', label: 'the posts and their padding', short: 'APPROVAL ONLY', p: p2(L, W / 2), kind: 'approvalOnly' },
    ],
    barriers: [],
    frame: { x0: -ig - 12, y0: -17, x1: L + ig + 12, y1: W + 17 },
    defaults: ['100 × 70 m field', 'in-goal depth 10 m', 'markings', 'routes', 'footprints', 'camera', 'crowd'],
  };
}

/** A diamond: home plate at the origin, the field into +y, base paths of `path` m. */
function diamond(id: 'baseball' | 'softball', path: number): VenueScene {
  const s = path / Math.SQRT2;
  const home = p2(0, 0);
  const first = p2(s, s);
  const second = p2(0, 2 * s);
  const third = p2(-s, s);
  // The fence: at the foul poles and in centre field (see MARKINGS above).
  const reach = id === 'baseball' ? 99.1 : 61;
  const centre = id === 'baseball' ? 121.9 : 67;
  const foulR = p2(reach / Math.SQRT2, reach / Math.SQRT2);
  const foulL = p2(-reach / Math.SQRT2, reach / Math.SQRT2);
  // The outfield fence from the right-field pole round to the left-field pole.
  const fence: P2[] = Array.from({ length: 25 }, (_, i) => {
    const a = 45 + (90 * i) / 24;
    const k = 1 - Math.abs(a - 90) / 45;
    const r = reach + (centre - reach) * Math.sin((k * Math.PI) / 2);
    return p2(r * Math.cos((a * Math.PI) / 180), r * Math.sin((a * Math.PI) / 180));
  });
  const back = id === 'baseball' ? -16 : -11;
  const out = 6 / Math.SQRT2;
  // Foul territory: outside the foul lines and behind the plate, up to the backstop.
  const live: KeepClear = {
    id: 'foul',
    label: 'foul territory',
    short: 'MAY BE LIVE',
    poly: [home, foulR, p2(foulR.x + out, foulR.y - out), p2(-back + 2, back + 1), p2(back - 2, back + 1), p2(foulL.x - out, foulL.y - out), foulL],
    basis: 'drawing',
    note: 'Foul territory can still be in play: foul balls and throws arrive here. Check the park’s ground rules.',
  };
  return {
    id,
    label: id === 'baseball' ? 'Baseball' : 'Softball',
    blurb: id === 'baseball' ? 'Bat contact, glove transients and selected footfalls; the plate, the bases and the outfield are separate pickup zones.' : 'Name the code first — fast pitch, slow pitch, age group — then test the plate, the bases and the outfield separately.',
    play: [home, ...fence],
    surface: 'diamond',
    markings: [
      { pts: [home, first, second, third], closed: true },
      line(home, foulR),
      line(home, foulL),
      ...(id === 'softball' ? [{ pts: [], circle: { c: p2(0, s), r: 8 * FT } }] : []),
    ],
    keepClear: [live],
    routes: [{ id: 'dug', label: 'the route to the dugout', short: 'DUGOUT', pts: [p2(-s * 0.9, s * 0.55), p2(-s * 1.25, -1)], kind: 'bench' }],
    footprints: [
      { id: 'back', label: 'a protected position behind the backstop screen', short: 'APPROVED', rect: { x0: -4, y0: back - 3, x1: 4, y1: back - 1 } },
      { id: 'well', label: 'an approved camera well', short: 'CAMERA WELL', rect: { x0: s + 6, y0: back + 1.5, x1: s + 10, y1: back + 3.5 } },
    ],
    cameras: [{ id: 'cam', label: 'a camera behind the plate', p: p2(-2.2, back - 2), dirDeg: 0, halfDeg: 18, reach: 24 }],
    sectors: [crowd('cr.home', 'the crowd behind the plate', { x0: -s * 1.4, y0: back - 9, x1: s * 1.4, y1: back - 4 })],
    targets: [],
    marks: [],
    badges: [{ id: 'net', label: 'the backstop netting and fences', short: 'APPROVAL ONLY', p: p2(0, back), kind: 'approvalOnly' }, { id: 'foulB', label: 'foul territory', short: 'LIVE BALL', p: p2(s + 4, 3), kind: 'liveBall' }],
    barriers: [{ id: 'backstop', label: 'the backstop screen', pts: [p2(back * 0.9, back + 4), p2(back * 0.5, back), p2(-back * 0.5, back), p2(-back * 0.9, back + 4)] }],
    frame: { x0: -reach / Math.SQRT2 - 8, y0: back - 11, x1: reach / Math.SQRT2 + 8, y1: centre + 5 },
    defaults: [id === 'baseball' ? '90 ft base paths' : '60 ft base paths', ...(id === 'softball' ? ['pitcher’s circle radius'] : []), 'foul territory', 'backstop distance', 'footprints', 'camera', 'crowd', 'outfield'],
  };
}

/* ── court, racket and ice sports (B14) ── */


function basketball(): VenueScene {
  const L = 28;
  const W = 15;
  const f = { x0: 0, y0: 0, x1: L, y1: W };
  return {
    id: 'basketball',
    label: 'Basketball',
    blurb: 'Bounce, shoes, rim and net — the basket is a repeatable place, the dribble travels the whole floor.',
    play: rect(f),
    surface: 'court',
    markings: basketballMarkings(L, W),
    keepClear: band('lane', f, 2, 'the clear band round the court', 'rule', `A ${CLEAR_ZONE_WORDS}: no obstruction within about 2 m of the court. A clearance, not a crew strip.`),
    routes: [
      { id: 'bench', label: 'the team benches and the substitutes’ route', short: 'BENCH', pts: [p2(L / 2 - 8, -2.8), p2(L / 2 + 8, -2.8)], kind: 'bench' },
      { id: 'table', label: 'the officials’ table', short: 'TABLE', pts: [p2(L / 2 - 2.5, -2.4), p2(L / 2 + 2.5, -2.4)], kind: 'officials' },
    ],
    footprints: [
      { id: 'corner', label: 'an approved corner position beyond the band', short: 'APPROVED', rect: { x0: -4.6, y0: -4.6, x1: -2.6, y1: -2.6 } },
      { id: 'end', label: 'an approved end position beyond the band', short: 'APPROVED', rect: { x0: L + 2.6, y0: W / 2 + 4, x1: L + 4.6, y1: W / 2 + 6 } },
    ],
    cameras: [{ id: 'cam', label: 'the main camera', p: p2(L / 2, -7), dirDeg: 0, halfDeg: 40, reach: 18 }],
    sectors: [crowd('cr.far', 'the crowd, far side', { x0: 1, y0: W + 3.5, x1: L - 1, y1: W + 7 })],
    targets: [],
    marks: [],
    badges: [
      { id: 'b0', label: 'the basket, rim, net and backstop', short: 'APPROVAL ONLY', p: p2(1.2, W / 2), kind: 'approvalOnly' },
      { id: 'b1', label: 'the basket, rim, net and backstop', short: 'APPROVAL ONLY', p: p2(L - 1.2, W / 2), kind: 'approvalOnly' },
    ],
    barriers: [],
    frame: { x0: -6, y0: -9, x1: L + 6, y1: W + 8 },
    defaults: ['28 × 15 m court', 'markings', 'benches', 'officials’ table', 'footprints', 'camera', 'crowd'],
  };
}

function volleyball(): VenueScene {
  const L = 18;
  const W = 9;
  const f = { x0: 0, y0: 0, x1: L, y1: W };
  return {
    id: 'volleyball',
    label: 'Volleyball (indoor)',
    blurb: 'Serve and attack contacts high up; digs, landings and shoes low down — and players chase beyond the court.',
    play: rect(f),
    surface: 'court',
    markings: [{ pts: rect(f), closed: true }, line(p2(L / 2, -0.5), p2(L / 2, W + 0.5)), line(p2(L / 2 - 3, 0), p2(L / 2 - 3, W)), line(p2(L / 2 + 3, 0), p2(L / 2 + 3, W))],
    keepClear: band('fz', f, 3, 'the clear zone round the court', 'rule', `A ${CLEAR_ZONE_WORDS}: at least about 3 m round the court, more at top events (about 5 m at the sides, 6.5 m at the ends), with clear space overhead. Part of the playing area — and players may chase a ball beyond it.`),
    routes: [
      { id: 'sub', label: 'the substitution zone and the libero’s route', short: 'SUBS', pts: [p2(L / 2 - 3, -3.6), p2(L / 2 + 3, -3.6)], kind: 'bench' },
      { id: 'lj', label: 'a line judge’s place', short: 'LINE JUDGE', pts: [p2(-3.4, -3.4), p2(-2.4, -2.4)], kind: 'officials' },
    ],
    footprints: [{ id: 'end', label: 'an approved fixed position beyond the clear zone', short: 'APPROVED', rect: { x0: L + 3.6, y0: W / 2 - 1, x1: L + 5.6, y1: W / 2 + 1 } }],
    cameras: [{ id: 'cam', label: 'the main camera', p: p2(L / 2, -7), dirDeg: 0, halfDeg: 40, reach: 16 }],
    sectors: [crowd('cr.far', 'the crowd, far side', { x0: 0, y0: W + 4.5, x1: L, y1: W + 7.5 })],
    targets: [],
    marks: [],
    badges: [
      { id: 'post0', label: 'a net post and its pad', short: 'APPROVAL ONLY', p: p2(L / 2, -1), kind: 'approvalOnly' },
      { id: 'ref', label: 'the referee’s stand', short: 'APPROVAL ONLY', p: p2(L / 2, W + 1), kind: 'approvalOnly' },
    ],
    barriers: [],
    frame: { x0: -6, y0: -8, x1: L + 7, y1: W + 8.5 },
    defaults: ['18 × 9 m court', 'markings', 'routes', 'footprints', 'camera', 'crowd'],
  };
}

function tennis(): VenueScene {
  const L = 23.77;
  const W = 10.97;
  const f = { x0: 0, y0: 0, x1: L, y1: W };
  const runoff = { x0: -6, y0: -3.5, x1: L + 6, y1: W + 3.5 };
  return {
    id: 'tennis',
    label: 'Tennis',
    blurb: 'Racket contact, bounce and shoes; baseline and net play need different coverage.',
    play: rect(f),
    surface: 'court',
    markings: [
      { pts: rect(f), closed: true },
      line(p2(L / 2, -0.9), p2(L / 2, W + 0.9)),
      line(p2(0, 1.37), p2(L, 1.37)),
      line(p2(0, W - 1.37), p2(L, W - 1.37)),
      line(p2(L / 2 - 6.4, 1.37), p2(L / 2 - 6.4, W - 1.37)),
      line(p2(L / 2 + 6.4, 1.37), p2(L / 2 + 6.4, W - 1.37)),
      line(p2(L / 2 - 6.4, W / 2), p2(L / 2 + 6.4, W / 2)),
      line(p2(0, W / 2), p2(0.1, W / 2)),
      line(p2(L - 0.1, W / 2), p2(L, W / 2)),
    ],
    keepClear: [
      { id: 'ro.0', label: 'the run-off', short: 'KEEP CLEAR', poly: [p2(runoff.x0, runoff.y0), p2(runoff.x1, runoff.y0), p2(runoff.x1, 0), p2(runoff.x0, 0)], basis: 'drawing', note: 'Lateral recovery, deep pursuit, ball persons and the chair: nothing creeps into it.' },
      { id: 'ro.1', label: 'the run-off', short: 'KEEP CLEAR', poly: [p2(runoff.x0, W), p2(runoff.x1, W), p2(runoff.x1, runoff.y1), p2(runoff.x0, runoff.y1)], basis: 'drawing', note: 'Lateral recovery, deep pursuit, ball persons and the chair: nothing creeps into it.' },
      { id: 'ro.2', label: 'the run-off behind the baseline', short: 'KEEP CLEAR', poly: [p2(runoff.x0, 0), p2(0, 0), p2(0, W), p2(runoff.x0, W)], basis: 'drawing', note: 'Deep pursuit behind the baseline.' },
      { id: 'ro.3', label: 'the run-off behind the baseline', short: 'KEEP CLEAR', poly: [p2(L, 0), p2(runoff.x1, 0), p2(runoff.x1, W), p2(L, W)], basis: 'drawing', note: 'Deep pursuit behind the baseline.' },
    ],
    routes: [{ id: 'balls', label: 'the ball persons’ places', short: 'BALL PERSONS', pts: [p2(-5.4, 1), p2(-5.4, W - 1)], kind: 'officials' }],
    footprints: [
      { id: 'behind', label: 'an approved position behind the backstop', short: 'APPROVED', rect: { x0: -8.6, y0: W / 2 - 1, x1: -6.6, y1: W / 2 + 1 } },
      { id: 'side', label: 'an approved position outside the sidestop', short: 'APPROVED', rect: { x0: L / 2 + 4, y0: -6, x1: L / 2 + 6, y1: -4 } },
    ],
    cameras: [{ id: 'cam', label: 'the main camera, high at one end', p: p2(L + 9, W / 2), dirDeg: 90, halfDeg: 25, reach: 30 }],
    sectors: [crowd('cr.side', 'the crowd along the side', { x0: 0, y0: W + 5, x1: L, y1: W + 8 })],
    targets: [],
    marks: [],
    badges: [
      { id: 'post0', label: 'a net post', short: 'APPROVAL ONLY', p: p2(L / 2, -0.9), kind: 'approvalOnly' },
      { id: 'chair', label: 'the umpire’s chair', short: 'APPROVAL ONLY', p: p2(L / 2, W + 1.8), kind: 'approvalOnly' },
    ],
    barriers: [],
    frame: { x0: -10, y0: -7, x1: L + 12, y1: W + 9 },
    defaults: ['23.77 × 10.97 m court', 'markings', 'run-off depth', 'footprints', 'camera', 'crowd'],
  };
}

function badminton(): VenueScene {
  const L = 13.4;
  const W = 6.1;
  const f = { x0: 0, y0: 0, x1: L, y1: W };
  return {
    id: 'badminton',
    label: 'Badminton',
    blurb: 'Racket and shuttle contact, shoes and calls — quiet detail, high overhead contacts and low net exchanges.',
    play: rect(f),
    surface: 'court',
    markings: [
      { pts: rect(f), closed: true },
      line(p2(L / 2, -0.4), p2(L / 2, W + 0.4)),
      line(p2(L / 2 - 1.98, 0), p2(L / 2 - 1.98, W)),
      line(p2(L / 2 + 1.98, 0), p2(L / 2 + 1.98, W)),
      line(p2(0.76, 0), p2(0.76, W)),
      line(p2(L - 0.76, 0), p2(L - 0.76, W)),
      line(p2(0, 0.46), p2(L, 0.46)),
      line(p2(0, W - 0.46), p2(L, W - 0.46)),
      line(p2(0, W / 2), p2(L / 2 - 1.98, W / 2)),
      line(p2(L / 2 + 1.98, W / 2), p2(L, W / 2)),
    ],
    keepClear: band('ro', f, 2, 'the space round the court', 'drawing', 'Racket reach, lunge recovery and the shuttle overhead: keep mics out of all three.'),
    routes: [{ id: 'umpire', label: 'the umpire’s and service judge’s places', short: 'OFFICIALS', pts: [p2(L / 2 - 1.2, -1.4), p2(L / 2 + 1.2, -1.4)], kind: 'officials' }],
    footprints: [{ id: 'end', label: 'an approved perimeter position', short: 'APPROVED', rect: { x0: L + 2.6, y0: W / 2 - 0.8, x1: L + 4.2, y1: W / 2 + 0.8 } }],
    cameras: [{ id: 'cam', label: 'the main camera', p: p2(L / 2, -6), dirDeg: 0, halfDeg: 40, reach: 12 }],
    sectors: [crowd('cr.far', 'the crowd, far side', { x0: 0, y0: W + 3, x1: L, y1: W + 5 })],
    targets: [],
    marks: [],
    badges: [{ id: 'post', label: 'a net post', short: 'APPROVAL ONLY', p: p2(L / 2, -0.4), kind: 'approvalOnly' }],
    barriers: [],
    frame: { x0: -4, y0: -7, x1: L + 5, y1: W + 6 },
    defaults: ['13.4 × 6.1 m court', 'markings', 'space round the court', 'footprints', 'camera', 'crowd'],
  };
}

function hockey(): VenueScene {
  const L = 60;
  const W = 30;
  const r = 8.5;
  const n = 6;
  const pts: P2[] = [];
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= n; i++) {
      const a = ((a0 + (90 * i) / n) * Math.PI) / 180;
      pts.push(p2(cx + r * Math.cos(a), cy + r * Math.sin(a)));
    }
  };
  corner(L - r, r, -90);
  corner(L - r, W - r, 0);
  corner(r, W - r, 90);
  corner(r, r, 180);
  return {
    id: 'hockey',
    label: 'Ice hockey',
    blurb: 'Puck and stick, skate cuts and board impacts — the nearest boards sound close, centre ice does not.',
    play: pts,
    surface: 'ice',
    markings: [
      { ...line(p2(L / 2, 0), p2(L / 2, W)), ink: 'red' as const },
      { ...line(p2(L / 2 - 8.5, 0), p2(L / 2 - 8.5, W)), ink: 'blue' as const },
      { ...line(p2(L / 2 + 8.5, 0), p2(L / 2 + 8.5, W)), ink: 'blue' as const },
      // The goal lines run board to board (the boards' corner arcs meet them 1.3 m in).
      { ...line(p2(4, r - Math.sqrt(r * r - (r - 4) ** 2)), p2(4, W - r + Math.sqrt(r * r - (r - 4) ** 2))), ink: 'red' as const },
      { ...line(p2(L - 4, r - Math.sqrt(r * r - (r - 4) ** 2)), p2(L - 4, W - r + Math.sqrt(r * r - (r - 4) ** 2))), ink: 'red' as const },
      { pts: [], circle: { c: p2(L / 2, W / 2), r: 4.5 }, ink: 'blue' as const },
      // End-zone face-off circles, the goal creases and the goals.
      ...[10, L - 10].flatMap((x) => [W / 2 - 7, W / 2 + 7].map((y) => ({ pts: [], circle: { c: p2(x, y), r: 4.5 }, ink: 'red' as const }))),
      { pts: arc(p2(4, W / 2), 1.8, -90, 90, 12), ink: 'red' as const },
      { pts: arc(p2(L - 4, W / 2), 1.8, 90, 270, 12), ink: 'red' as const },
      { pts: rect({ x0: 3, y0: W / 2 - 0.915, x1: 4, y1: W / 2 + 0.915 }), closed: true, ink: 'red' as const },
      { pts: rect({ x0: L - 4, y0: W / 2 - 0.915, x1: L - 3, y1: W / 2 + 0.915 }), closed: true, ink: 'red' as const },
    ],
    keepClear: [],
    routes: [
      { id: 'bench', label: 'the players’ benches and gates', short: 'BENCH · GATES', pts: [p2(L / 2 - 12, -1.6), p2(L / 2 + 12, -1.6)], kind: 'bench' },
      { id: 'zam', label: 'the resurfacing vehicle’s gate and route', short: 'ICE CREW', pts: [p2(L + 0.3, W / 2), p2(L + 6, W / 2)], kind: 'crew' },
    ],
    footprints: [
      { id: 'end', label: 'an approved fixed position outside the glass, end', short: 'APPROVED', rect: { x0: -3.8, y0: W / 2 + 4, x1: -2, y1: W / 2 + 6 } },
      { id: 'side', label: 'an approved fixed position outside the glass, side', short: 'APPROVED', rect: { x0: 14, y0: W + 2, x1: 16, y1: W + 3.8 } },
    ],
    cameras: [{ id: 'cam', label: 'the main camera', p: p2(L / 2, -9), dirDeg: 0, halfDeg: 36, reach: 30 }],
    sectors: [crowd('cr.far', 'the crowd behind the far glass', { x0: 4, y0: W + 4.5, x1: L - 4, y1: W + 8 })],
    targets: [],
    marks: [],
    badges: [{ id: 'boards', label: 'the boards’ ice-facing surface', short: 'NO HARDWARE', p: p2(20, 0), kind: 'noHardware' }, { id: 'goal', label: 'a goal and its moorings', short: 'APPROVAL ONLY', p: p2(4, W / 2), kind: 'approvalOnly' }],
    barriers: [{ id: 'boards', label: 'the boards and glass', pts: [...pts, pts[0]] }],
    frame: { x0: -6, y0: -12, x1: L + 8, y1: W + 10 },
    defaults: ['60 × 30 m rink', 'corner radius', 'markings', 'benches', 'gates', 'footprints', 'camera', 'crowd'],
  };
}

const BUILD: Record<SportId, () => VenueScene> = {
  football,
  soccer,
  rugby,
  baseball: () => diamond('baseball', 90 * FT),
  softball: () => diamond('softball', 60 * FT),
  basketball,
  volleyball,
  tennis,
  badminton,
  hockey,
  // Lab 7b group 3 (lab7-g6): track, gymnastics, combat, motorsport, equestrian, aquatic, the arena.
  ...ARENA_BUILD,
};
const CACHE: Partial<Record<SportId, VenueScene>> = {};
/** A sport's plan (built once). */
export function sportPlan(id: SportId): VenueScene {
  return (CACHE[id] ??= BUILD[id]());
}
export const FIELD_SPORTS: readonly SportId[] = ['football', 'soccer', 'rugby', 'baseball', 'softball'];
export const COURT_SPORTS: readonly SportId[] = ['basketball', 'volleyball', 'tennis', 'badminton', 'hockey'];

/* ── Lab 7b group 3 (lab7-g6) ── */
export { TRACK_GYM_COMBAT, MOTOR_HORSE_WATER } from './arenaPlans.ts';
/** The hydrophone's still-water container (B16's optional ANOTHER START). */
export const containerPlan = (): VenueScene => (CONTAINER_PLAN ??= ARENA_BUILD.container());
let CONTAINER_PLAN: VenueScene | undefined;
