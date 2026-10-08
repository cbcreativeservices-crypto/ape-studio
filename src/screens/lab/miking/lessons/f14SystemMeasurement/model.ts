/**
 * F14 LOUDSPEAKER AND SOUND SYSTEM MEASUREMENT — the suggested starting
 * points (charter §2 layer 1). Source keys: measurement_mics/SOURCES.md §0;
 * the lesson's claims: loudspeaker_measurement/SOURCES.md. Frame: F14
 * geometry.ts (the floor at y = 0 in every scene).
 *
 * BENCH (a test loudspeaker):
 *   ls.axis    on the reference axis at a logged radius — drawn at 2 m (the
 *              proposal's drawing default), aimed as the calibration file says
 *   ls.off     the same radius, about 30° to one side (the angle grid
 *              0/15/30/45/60° is a drawing default)
 *   ls.near    a near-field point a couple of centimetres from the woofer's
 *              cone (the gap a drawing default), never touching it
 * VENUE (the shared seat plan):
 *   vn.mid / vn.front / vn.rear   the start, middle and end of the left
 *              main's coverage at a seated ear height (1.2 m, MEYER-MAPP) —
 *              practice wording, not attributed (correction G5-01)
 *   vn.overlap  a seat where the main and the front fill both arrive
 *   vn.edge     the edge of the main's coverage, near the centre aisle
 *   vn.stand    the standing area, at a standing ear height (1.7 m, MEYER-MAPP)
 * STUDIO (a pair of monitors):
 *   st.listen   the working listening position, the left monitor alone
 *   st.near     a head position 30 cm to the side (drawing default)
 *   st.back     half a metre back (drawing default)
 *
 * The method sets the real counts, radii and angles (F14 L85: "no universal
 * mic count, radius, angle grid"); every band here is a drawing default.
 */
import type { DocumentedZone, MicPose, Vec3 } from '../../engine/model/types.ts';
import { aimAt, ill, src } from '../shared/measure/measureModel.ts';
import { FILL, MAIN_L, seatPoint, VENUE } from '../shared/measure/venue.ts';
import { LISTEN, MON_L, REF14, WOOFER14 } from './geometry.ts';

const DEG = Math.PI / 180;
const toward = (p: Vec3, q: Vec3): MicPose => ({ p, ...aimAt(p, q) });
const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const band = (p: Vec3, ref: Vec3, half: number) => ({ min: Math.round(dist(p, ref) - half), max: Math.round(dist(p, ref) + half) });
const FF = ['measFF', 'measQuarter'];
const ON_FILE = { maxOffAxis: 5, prov: ill('"aim it in the orientation that file specifies" (F14 L6): within 5° of the reference point is the lab’s tolerance') };
const SEATED = { line: 'floor', min: 1100, max: 1300, prov: src('MEYER-MAPP', '1.2 m (~4 ft.) for seated audience') };
const STANDING = { line: 'floor', min: 1600, max: 1800, prov: src('MEYER-MAPP', '1.7 m (~5.6 ft.) for standing audience') };
const SEAT_BOX = (p: Vec3) => ({ min: { x: p.x - 350, y: -5000, z: p.z - 400 }, max: { x: p.x + 350, y: 5000, z: p.z + 400 }, prov: ill('round the drawn seat (drawing default)') });
const SEAT_DRAW = (p: Vec3, h: number) => ({ side: { u0: p.x - 350, u1: p.x + 350, v0: -h - 100, v1: -h + 100 }, top: { u0: p.x - 350, u1: p.x + 350, v0: p.z - 400, v1: p.z + 400 } });

export const F14_START = {
  axis: { x: 2000, y: REF14.y, z: 0 },
  off: { x: 2000 * Math.cos(30 * DEG), y: REF14.y, z: 2000 * Math.sin(30 * DEG) },
  near: { x: 32, y: WOOFER14.y, z: 0 },
  mid: seatPoint(VENUE.rows[5], -3600),
  front: seatPoint(VENUE.rows[1], -3600),
  rear: seatPoint(VENUE.rows[9], -3600),
  overlap: seatPoint(VENUE.rows[1], -900),
  edge: seatPoint(VENUE.rows[5], -900),
  stand: seatPoint(13000, -3600, true),
  listen: LISTEN,
  near30: { x: LISTEN.x, y: LISTEN.y, z: 300 },
  back: { x: LISTEN.x + 500, y: LISTEN.y, z: 0 },
} as const;

const S = F14_START;

export const F14_ZONES: DocumentedZone[] = [
  /* ── the bench ── */
  {
    id: 'ls.axis',
    label: 'On the reference axis, at a logged radius',
    band: 'Start on the loudspeaker’s reference axis at the radius your method names — this drawing uses 2 m (6.6 ft) — the mic aimed as its calibration file says, and the radius written down.',
    kind: 'trial',
    src: 'F14-LESSON',
    quote: 'Place the capsule at a documented distance and angle relative to a stated speaker reference axis (F14 L12)',
    bandProv: ill('drawing default: radius 2 m ± 5 cm (loudspeaker_measurement/GEOMETRY_PROPOSAL.md §2)'),
    refSurface: 'ref',
    side: 'either',
    distance: { min: 1950, max: 2050 },
    radial: { line: 'axis', max: 50, prov: ill('on the axis: within 5 cm is the lab’s tolerance') },
    requires: { variant: 'bench', micTypeIds: FF },
    aim: ON_FILE,
    start: toward(S.axis, REF14),
    tendency: 'The loudspeaker on its reference axis, in this room, at this radius: the trace every off-axis reading is compared with. Return here to check it repeats.',
    checks: ['The radius and the axis written down', 'The source state and the drive level fixed', 'You and the stand out of the path'],
  },
  {
    id: 'ls.off',
    label: 'Off the axis, same radius',
    band: 'Try the same radius swung about 30° to one side — the method names its own angles — the mic still aimed at the reference point, and the angle written down.',
    kind: 'trial',
    src: 'F14-LESSON',
    quote: 'Hold radius and source state fixed while changing horizontal or vertical angle (F14 L12)',
    bandProv: ill('drawing default: 30° (25–35°) at 2 m ± 5 cm; the angle grid 0/15/30/45/60° is the proposal’s drawing default'),
    refSurface: 'ref',
    side: 'either',
    distance: { min: 1950, max: 2050 },
    cone: { min: 25, max: 35, toward: { x: 0, y: 0, z: 1 }, prov: ill('25–35° off the reference axis, on one side') },
    drawn: { side: { u0: 1630, u1: 1820, v0: REF14.y - 100, v1: REF14.y + 100 }, top: { cu: 0, cv: 0, r0: 1950, r1: 2050, a0: 25, a1: 35 } },
    box: { min: { x: -5000, y: REF14.y - 100, z: -5000 }, max: { x: 5000, y: REF14.y + 100, z: 5000 }, prov: ill('at the reference height: within 10 cm') },
    requires: { variant: 'bench', micTypeIds: FF },
    aim: ON_FILE,
    start: toward(S.off, REF14),
    tendency: 'The loudspeaker’s sound to the side, at the same radius and drive: a change from the axis trace belongs to the angle — unless the room’s paths dominate it.',
    checks: ['Only the angle changed', 'The same radius, height and drive', 'Room reflections checked before calling it directivity'],
  },
  {
    id: 'ls.near',
    label: 'Close to the woofer’s cone',
    band: 'Try the capsule a couple of centimetres in front of the woofer’s dust cap — never touching the cone, the grille or the port — and log the gap.',
    kind: 'trial',
    src: 'F14-LESSON',
    quote: 'place the capsule close to the chosen radiator … avoid contact with the cone, grille, vent or electrical parts, and log the offset (F14 L18)',
    bandProv: ill('drawing default: 2–4.5 cm from the baffle, the cap standing about 1.4 cm proud (loudspeaker_measurement/GEOMETRY_PROPOSAL.md §2: gap 10 mm drawing default)'),
    refSurface: 'woofer',
    side: 'either',
    distance: { min: 20, max: 45 },
    radial: { line: 'wooferAxis', max: 25, prov: ill('on the woofer’s centre: within 2.5 cm') },
    requires: { variant: 'bench', micTypeIds: ['measQuarter', 'measFF'] },
    aim: { maxOffAxis: 10, prov: ill('pointed at the cone: within 10°') },
    start: toward(S.near, WOOFER14),
    tendency: 'The woofer far louder than the room — and far louder than the tweeter and the port. A check on one radiator, not the cabinet’s far-field response.',
    checks: ['Nothing touches the cone, grille or port', 'The gap written down', 'The port and the tweeter missed — say so'],
  },
  /* ── the venue ── */
  {
    id: 'vn.mid',
    label: 'Mid-coverage seat, the left main alone',
    band: 'Start at a seat in the middle of the left main’s coverage, the mic at a seated ear height — about 1.2 m (4 ft) — the left main playing alone.',
    kind: 'sourced',
    src: 'MEYER-MAPP',
    quote: 'mic heights "1.2 m (~4 ft.) for seated audience"; F14 L15 "Sample normal ear-height positions across front, middle, rear"',
    bandProv: ill('the seat is a drawing default; the distance band is ±0.6 m round it'),
    refSurface: 'mainL',
    side: 'either',
    distance: band(S.mid, MAIN_L, 600),
    radial: SEATED,
    box: SEAT_BOX(S.mid),
    drawn: SEAT_DRAW(S.mid, 1200),
    requires: { variant: 'venue', micTypeIds: FF },
    start: toward(S.mid, MAIN_L),
    tendency: 'The installed main and the room as this seat hears them — one point of the area, not the whole of it.',
    checks: ['The active source named; the others muted', 'Height, seat and aim written down', 'The mic routed to the analyzer only'],
  },
  {
    id: 'vn.front',
    label: 'Start of coverage: a front seat',
    band: 'Then a seat near the front of the same main’s coverage, the same height and set-up, the main and its settings unchanged.',
    kind: 'sourced',
    src: 'MEYER-MAPP',
    quote: 'place mics "in logical order, e.g., front to back"; seated 1.2 m',
    bandProv: ill('the seat is a drawing default; the distance band is ±0.6 m round it'),
    refSurface: 'mainL',
    side: 'either',
    distance: band(S.front, MAIN_L, 600),
    radial: SEATED,
    box: SEAT_BOX(S.front),
    drawn: SEAT_DRAW(S.front, 1200),
    requires: { variant: 'venue', micTypeIds: FF },
    start: toward(S.front, MAIN_L),
    tendency: 'Nearer the main and lower against it: louder, and often brighter or duller as the seat falls toward the edge of its vertical coverage.',
    checks: ['The same main and settings as the mid seat', 'Seats measured front to back, in order', 'Each trace stored on its own'],
  },
  {
    id: 'vn.rear',
    label: 'End of coverage: a rear seat',
    band: 'And a seat near the back of its coverage, the same height and set-up — a deep room may need more than one.',
    kind: 'sourced',
    src: 'MEYER-MAPP',
    quote: 'F14 L24 practice: sample every listener region whose performance matters (the "beginning, middle and end" wording not found at the cited page — correction G5-01)',
    bandProv: ill('the seat is a drawing default; the distance band is ±0.6 m round it'),
    refSurface: 'mainL',
    side: 'either',
    distance: band(S.rear, MAIN_L, 600),
    radial: SEATED,
    box: SEAT_BOX(S.rear),
    drawn: SEAT_DRAW(S.rear, 1200),
    requires: { variant: 'venue', micTypeIds: FF },
    start: toward(S.rear, MAIN_L),
    tendency: 'Farther from the main: quieter, and more of the room in the trace. How the coverage holds up at the back.',
    checks: ['The same set-up as the front and mid seats', 'Level compared with the others', 'Unsampled regions named'],
  },
  {
    id: 'vn.overlap',
    label: 'Where the main and the front fill meet',
    band: 'Try a seat in the first rows near the aisle, where the front fill and the left main both arrive — measure each alone, then both together, the mic at a seated ear height.',
    kind: 'trial',
    src: 'F14-LESSON',
    quote: 'Check each subsystem alone across its intended seats, then overlap positions with intended sources active (F14 L41)',
    bandProv: ill('the overlap seat is a drawing default; the distance band is ±0.5 m from the fill'),
    refSurface: 'fill',
    side: 'either',
    distance: band(S.overlap, FILL, 500),
    radial: SEATED,
    box: SEAT_BOX(S.overlap),
    drawn: SEAT_DRAW(S.overlap, 1200),
    requires: { variant: 'venue', micTypeIds: FF },
    start: toward(S.overlap, FILL),
    tendency: 'Two arrivals a few milliseconds apart: their sum has dips that move with every seat. An alignment chosen here changes at the next seat.',
    checks: ['Each source alone first, then both', 'Arrival and phase recorded before any change', 'No gain or delay changed silently'],
  },
  {
    id: 'vn.edge',
    label: 'Edge of coverage, near the aisle',
    band: 'Try a seat mid-room near the centre aisle — the edge of the left main’s coverage — at a seated ear height.',
    kind: 'trial',
    src: 'F14-LESSON',
    quote: 'point-source and fill checks include main axes and overlap or edge-of-coverage regions (F14 L24)',
    bandProv: ill('the edge seat is a drawing default; the distance band is ±0.6 m round it'),
    refSurface: 'mainL',
    side: 'either',
    distance: band(S.edge, MAIN_L, 600),
    radial: SEATED,
    box: SEAT_BOX(S.edge),
    drawn: SEAT_DRAW(S.edge, 1200),
    requires: { variant: 'venue', micTypeIds: FF },
    start: toward(S.edge, MAIN_L),
    tendency: 'Off the main’s axis: the highs fall away first. Where the right main’s coverage begins, the two overlap.',
    checks: ['The other main muted for the first trace', 'Compared with the mid seat, band by band', 'The edge kept in the set, not averaged away'],
  },
  {
    id: 'vn.stand',
    label: 'The standing area',
    band: 'Where the audience stands, raise the mic to a standing ear height — about 1.7 m (5.6 ft).',
    kind: 'sourced',
    src: 'MEYER-MAPP',
    quote: 'mic heights "1.7 m (~5.6 ft.) for standing audience"',
    bandProv: ill('the standing spot is a drawing default; the distance band is ±0.6 m round it'),
    refSurface: 'mainL',
    side: 'either',
    distance: band(S.stand, MAIN_L, 600),
    radial: STANDING,
    box: SEAT_BOX(S.stand),
    drawn: SEAT_DRAW(S.stand, 1700),
    requires: { variant: 'venue', micTypeIds: FF },
    start: toward(S.stand, MAIN_L),
    tendency: 'The back of the room at the height a standing listener’s ears are: a different seat in all but name.',
    checks: ['The height written down', 'The stand out of the walkway', 'Cables secured where people walk'],
  },
  /* ── the studio ── */
  {
    id: 'st.listen',
    label: 'The listening position, the left monitor alone',
    band: 'Start where your head is when you work, at a seated ear height, the left monitor playing alone — then the right one alone.',
    kind: 'trial',
    src: 'F14-LESSON',
    quote: 'Measure left and right separately at the working listening position (F14 L39)',
    bandProv: ill('drawing default: the listening position at the triangle’s point, ±10 cm; ±5 cm from the drawn distance'),
    refSurface: 'monL',
    side: 'either',
    distance: band(S.listen, MON_L, 50),
    radial: SEATED,
    box: { min: { x: LISTEN.x - 100, y: -5000, z: -100 }, max: { x: LISTEN.x + 100, y: 5000, z: 100 }, prov: ill('the listening position ±10 cm (drawing default)') },
    drawn: { side: { u0: LISTEN.x - 100, u1: LISTEN.x + 100, v0: -1300, v1: -1100 }, top: { u0: LISTEN.x - 100, u1: LISTEN.x + 100, v0: -100, v1: 100 } },
    requires: { variant: 'studio', micTypeIds: FF },
    start: toward(S.listen, MON_L),
    tendency: 'The monitor, the desk’s reflection and the room’s lows as your working position hears them — one point, not the whole of the place you sit.',
    checks: ['One monitor at a time', 'Monitor level and settings written down', 'The mic aimed as its file says'],
  },
  {
    id: 'st.near',
    label: 'A head position 30 cm to the side',
    band: 'Then move the mic about 30 cm (1 ft) to one side, the same height — where your head also goes.',
    kind: 'trial',
    src: 'F14-LESSON',
    quote: 'then nearby head positions; compare height, desk/floor reflections and bass variation (F14 L39)',
    bandProv: ill('drawing default: 30 cm (22–38 cm) to the side; the distance band ±5 cm'),
    refSurface: 'monL',
    side: 'either',
    distance: band(S.near30, MON_L, 50),
    radial: SEATED,
    box: { min: { x: LISTEN.x - 100, y: -5000, z: 220 }, max: { x: LISTEN.x + 100, y: 5000, z: 380 }, prov: ill('30 cm to the side ±8 cm (drawing default)') },
    drawn: { side: { u0: LISTEN.x - 100, u1: LISTEN.x + 100, v0: -1300, v1: -1100 }, top: { u0: LISTEN.x - 100, u1: LISTEN.x + 100, v0: 220, v1: 380 } },
    requires: { variant: 'studio', micTypeIds: FF },
    start: toward(S.near30, MON_L),
    tendency: 'A small move with a big difference in places: a dip at one chair can be a peak a head’s width away. Flat at one point proves little.',
    checks: ['Only the position changed', 'The same monitor and level', 'Both traces kept side by side'],
  },
  {
    id: 'st.back',
    label: 'Half a metre back',
    band: 'Try the mic about 50 cm (20 in) behind the listening position, the same height: the lows change most.',
    kind: 'trial',
    src: 'F14-LESSON',
    quote: 'bass variation; one exact chair location can hide a severe neighboring null or peak (F14 L39)',
    bandProv: ill('drawing default: 50 cm behind, ±6 cm; the distance band ±5 cm'),
    refSurface: 'monL',
    side: 'either',
    distance: band(S.back, MON_L, 50),
    radial: SEATED,
    box: { min: { x: S.back.x - 60, y: -5000, z: -100 }, max: { x: S.back.x + 60, y: 5000, z: 100 }, prov: ill('50 cm behind ±6 cm (drawing default)') },
    drawn: { side: { u0: S.back.x - 60, u1: S.back.x + 60, v0: -1300, v1: -1100 }, top: { u0: S.back.x - 60, u1: S.back.x + 60, v0: -100, v1: 100 } },
    requires: { variant: 'studio', micTypeIds: FF },
    start: toward(S.back, MON_L),
    tendency: 'The room’s lows rearranged: a bass peak or dip moves with half a metre. Compare before blaming the monitor.',
    checks: ['Only the distance changed', 'The lows compared, not just the overall level', 'The room’s state the same'],
  },
];
