/**
 * I06c BAR CHIMES — where things are (charter §2 layer 2), frame H
 * (model.ts). Built from model.ts's numbers.
 *
 *   P0      the row's centre at the bars' mean mid-height
 *   END_L/R the long and short ends (the optional end mics)
 *   The main starting points face the row's LENGTH from the audience side
 *   (+x), at a height that sees the bars, not only the rail.
 */
import type { DocumentedZone, Envelope, InstrumentModel, Part, Provenance, Vec3 } from '../../engine/model/types.ts';
import { approachPose, v3 } from '../shared/handGeom.ts';
import { conePolys } from '../shared/metal/metalGeom.ts';
import { BAR_TOP, BC, END_L, END_R, P0, RAIL_Y } from './model.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const trial = (note: string): Provenance => ({ kind: 'trial', src: 'LESSON-BC', note });
export const N: Vec3 = v3(1, 0, 0);
const UP: Vec3 = v3(0, -1, 0);
const HALF = BC.rail.mm / 2;
/** The stand: a post beside the rail's short end, an arm over to the rail. */
export const STAND = { z: HALF + 40, r: 12 };

const swingX = BC.longest.mm * Math.sin((BC.swingDeg.mm * Math.PI) / 180);

const parts: Part[] = [
  { id: 'bc.rail', label: 'rail (wooden mantle)', short: 'rail', role: 'The wooden rail the bars hang from — about 30–40 cm long. A damper bar can be fitted along it on some models.', solid: { kind: 'box', min: v3(-BC.railDepth.mm / 2, RAIL_Y - BC.railH.mm / 2, -HALF), max: v3(BC.railDepth.mm / 2, RAIL_Y + BC.railH.mm / 2, HALF) }, prov: BC.rail.prov },
  { id: 'bc.bars', label: 'bars (graduated)', short: 'bars', role: 'Metal bars of graduated length, each hung on its own filament: the long ones lower in pitch, the short ones higher. Each rings on after the hand passes.', solid: { kind: 'box', min: v3(-12, BAR_TOP, -HALF + 4), max: v3(12, BAR_TOP + BC.longest.mm, HALF - 4) }, moving: true, prov: { kind: 'sourced', src: 'PAS-ECV02', quote: 'A mark tree is made of graduated metal cylinders that are hung from a single piece of wood.' } },
  { id: 'bc.filament', label: 'filaments', short: 'filaments', role: 'A strong thread from the rail to each bar, so every bar swings and rings freely. Check them — a loose bar can fall.', prov: { kind: 'sourced', src: 'GROVER-MT35', quote: 'Each individual bar is secured to the mantle with a super-strong filament.' } },
  { id: 'bc.stand', label: 'stand and clamp', short: 'stand', role: 'The stand and clamp that hold the rail. Use hardware rated for it — and listen for clanks or buzzes from the clamp under the sweep.', solid: { kind: 'capsule', a: v3(0, 0, STAND.z), b: v3(0, RAIL_Y, STAND.z), r: STAND.r }, prov: ill('a stand beside the rail’s short end: a drawing default') },
  { id: 'bc.hand', label: 'the sweeping hand', short: 'hand', role: 'The player’s hand moves fluidly through the bars along the row, in one direction or both — or strikes a single bar. Its whole path is the player’s space.', prov: { kind: 'sourced', src: 'PAS-ECV02', quote: 'played by moving one’s hand through the cylinders in a fluid motion' } },
];

const envelopes: Envelope[] = [
  { id: 'env.player', label: 'the player', shape: { kind: 'box', min: v3(-560, -1800, -290), max: v3(-240, 0, 290) }, prov: ill('a standing player: chest front at x = −250 (the family’s drawing default)') },
  { id: 'env.swing', label: 'the swinging bars and the sweep', shape: { kind: 'box', min: v3(-swingX - 50, BAR_TOP - 20, -HALF - 60), max: v3(swingX + 50, BAR_TOP + BC.longest.mm + 50, HALF + 20) }, prov: ill('every bar swinging ±20° on its filament, plus 50 mm: drawing defaults') },
  { id: 'env.hand', label: 'the sweeping hand', shape: { kind: 'box', min: v3(-300, P0.y - 110, -HALF - 90), max: v3(70, P0.y + 110, HALF + 30) }, prov: ill('the hand’s path along the row, plus a margin: a drawing default') },
];

/* ── SUGGESTED STARTING POINTS: the lesson's own trials (internal kind
 *    'trial'), 40–80 cm from the row's centre, facing its length; optional
 *    end mics outside the swing. ── */
const BOTH = ['sdcCard', 'smallDynCard'];

export const BC_ZONES: DocumentedZone[] = [
  {
    id: 'bc.A',
    label: 'In front of the row, facing its length',
    band: 'Start about 40–60 cm (16–24 in) from the middle of the row, in front of it, facing its whole length — at a height that sees the bars, not only the rail.',
    kind: 'trial',
    src: 'LESSON-BC',
    quote: 'try a stand-mounted cardioid condenser or another suitable mic roughly 40–80 cm (16–32 in) from the center of the row, facing its length, at a height that captures the bars rather than only the wooden rail',
    refSurface: 'row',
    side: 'outside',
    distance: { min: 400, max: 600 },
    cone: { min: 0, max: 30, prov: trial('"facing its length": within 30° of the line straight out of the row, toward the audience') },
    aim: { maxOffAxis: 20, prov: ill('aimed at the middle of the row: within 20° is the lab’s tolerance') },
    requires: { micTypeIds: BOTH },
    start: approachPose(P0, N, UP, 500, 8),
    draw: conePolys(P0, N, null, 400, 600, 0, 30),
    tendency: 'The whole sweep, first bar to last, with the attacks clear and less of the room. Listen for one end of the row coming up louder than the other.',
    checks: ['The sweep in both directions', 'The first and the last bars', 'Clanks from the rail or the clamp'],
  },
  {
    id: 'bc.B',
    label: 'Farther back, for the shimmer',
    band: 'Try about 60–80 cm (24–32 in) from the middle of the row, from the same side — a more even view of a wide row.',
    kind: 'trial',
    src: 'LESSON-BC',
    quote: 'A direct or close position can favor attacks and isolation; a wider view may integrate the sweep and decay if the room cooperates.',
    refSurface: 'row',
    side: 'outside',
    distance: { min: 600, max: 800 },
    cone: { min: 0, max: 30, prov: trial('the same view, farther back') },
    aim: { maxOffAxis: 20, prov: ill('aimed at the middle of the row: within 20° is the lab’s tolerance') },
    requires: { micTypeIds: BOTH },
    start: approachPose(P0, N, UP, 700, 8),
    draw: conePolys(P0, N, null, 600, 800, 0, 30),
    tendency: 'The sweep and the overlapping decays blended, with more of the room — and a more even row. Less isolation from louder neighbours.',
    checks: ['Matched level when you compare', 'The tail after the sweep', 'Spill from louder neighbours'],
  },
  {
    id: 'bc.endL',
    label: 'Beyond the long end (one of a pair)',
    band: 'As one of two end mics, try a mic beyond the long end of the row, outside the swing — in this drawing about 30–50 cm (12–20 in) from the end bars.',
    kind: 'trial',
    src: 'LESSON-BC',
    quote: 'A separate mic at each end is an option for a deliberately wide or difficult setup, but raises open-mic count, spill and combined-mic complexity.',
    refSurface: 'endL',
    side: 'outside',
    distance: { min: 300, max: 500 },
    cone: { min: 0, max: 40, toward: N, prov: trial('beyond the end, outside the swing: within 40° of the row’s line, toward the audience — the lab’s drawing') },
    aim: { maxOffAxis: 25, prov: ill('aimed back along the row: within 25° is the lab’s tolerance') },
    requires: { micTypeIds: BOTH },
    start: approachPose(END_L, v3(0, 0, -1), N, 380, 25),
    draw: conePolys(END_L, v3(0, 0, -1), N, 300, 500, 0, 40),
    tendency: 'More of the long, lower bars and the start of a rising sweep. On its own it gives an uneven row — it is one half of a deliberately wide pair.',
    checks: ['Its partner at the other end', 'The pair in mono', 'The stand outside the swing and the hand'],
  },
  {
    id: 'bc.endR',
    label: 'Beyond the short end (one of a pair)',
    band: 'As the other end mic, try a mic beyond the short end, outside the swing and clear of the stand — in this drawing about 30–50 cm (12–20 in) away.',
    kind: 'trial',
    src: 'LESSON-BC',
    quote: 'A separate mic at each end is an option for a deliberately wide or difficult setup',
    refSurface: 'endR',
    side: 'outside',
    distance: { min: 300, max: 500 },
    cone: { min: 0, max: 40, toward: N, prov: trial('beyond the end, outside the swing: the lab’s drawing') },
    aim: { maxOffAxis: 25, prov: ill('aimed back along the row: within 25° is the lab’s tolerance') },
    requires: { micTypeIds: BOTH },
    start: approachPose(END_R, v3(0, 0, 1), N, 380, 30),
    draw: conePolys(END_R, v3(0, 0, 1), N, 300, 500, 0, 40),
    tendency: 'More of the short, higher bars and the end of a rising sweep. With its partner it can give a wide image — check it in mono.',
    checks: ['Its partner at the other end', 'The pair in mono', 'Clear of the stand and its clamp'],
  },
];

export const BC_MODEL: InstrumentModel = {
  id: 'barChimes27',
  name: '27-bar chimes (mark tree)',
  parts,
  regions: [
    { id: 'r.long', partId: 'bc.bars', label: 'the long bars', anchor: END_L, prov: BC.longest.prov, note: 'The long, lower bars at one end of the row.' },
    { id: 'r.mid', partId: 'bc.bars', label: 'the middle of the row', anchor: P0, prov: BC.rail.prov, note: 'The middle of the row.' },
    { id: 'r.short', partId: 'bc.bars', label: 'the short bars', anchor: END_R, prov: BC.shortest.prov, note: 'The short, higher bars at the other end.' },
  ],
  surfaces: [
    { id: 'row', partId: 'bc.bars', label: 'the middle of the row', point: P0, normal: N, target: true },
    { id: 'endL', partId: 'bc.bars', label: 'the long end of the row', point: END_L, normal: v3(0, 0, -1), target: true },
    { id: 'endR', partId: 'bc.bars', label: 'the short end of the row', point: END_R, normal: v3(0, 0, 1), target: true },
  ],
  lines: [{ id: 'face', label: 'the line straight out of the row', point: P0, dir: N }],
  envelopes,
  variants: [
    { id: 'single', label: 'SINGLE ROW', blurb: 'One straight row of graduated bars on a wooden rail — 27 here.' },
    { id: 'double', label: 'DOUBLE ROW', blurb: 'Two staggered rows on the same rail — 60 bars here: a denser shimmer, and a wider source to cover evenly.' },
  ],
  defaultVariant: 'single',
  views: {
    side: { u0: -620, u1: 1000, v0: -1700, v1: -760 },
    top: { u0: -620, u1: 1000, v0: -760, v1: 760 },
  },
  viewTags: { side: 'FROM THE SIDE · END-ON', top: 'FROM ABOVE' },
  yFloor: { mm: 0, prov: ill('frame H: the floor is y = 0') },
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  ports: { single: null, double: null },
};
