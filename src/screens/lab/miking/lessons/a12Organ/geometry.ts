/**
 * A12 ACOUSTIC PIPE ORGAN — where things are (charter §2 layer 2), frame O
 * (model.ts). The organ's case and console, the nave's walls, and the
 * keep-outs the lesson's safety layer asks for: the aisles, the side
 * passages and the exits stay clear (a stand's foot may not stand in them),
 * the case and its pipes are never touched, nothing hangs from the organ.
 * Floor stands only — an elevated or suspended mic is a venue's installation
 * by competent people, said in words, never dragged.
 *
 * The starting points are a CASE STUDY (one search's result, with numbers)
 * and two PRACTICES without numbers (a pair over the congregation aimed at
 * the main ranks; a spot in front of one division) whose bands are the
 * drawing's own: the pew area, a stand's height, the division's width.
 */
import type { DocumentedZone, Envelope, InstrumentModel, Part, Provenance, Vec3, Wedge } from '../../engine/model/types.ts';
import { aimTo, v3 } from '../shared/handGeom.ts';
import { CASE, CONSOLE, DIVISIONS, divisionPoint, NAVE, ORGAN, PA, STUDY } from './model.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const N: Vec3 = v3(1, 0, 0);
/** The main ranks' centre (the Great's middle, in the façade). */
export const RANKS: Vec3 = v3(0, -5000, 0);

const wall = (id: string, z0: number, z1: number): Part => ({ id, label: 'side wall', short: 'wall', role: '', solid: { kind: 'box', min: v3(-3000, NAVE.top, z0), max: v3(NAVE.x1, 0, z1) }, listIn: [], prov: ill('the nave is a drawing default') });

const parts: Part[] = [
  {
    id: 'org.case',
    label: 'organ case',
    short: 'case',
    role: 'The main case: its front pipes (the façade) and, behind and above them, the divisions. Never touch pipes, shutters, panels, wiring or the blower — and never hang anything from the case or its ornament.',
    solid: { kind: 'box', min: v3(CASE.x0, CASE.top, -CASE.zHalf), max: v3(CASE.x1, 0, CASE.zHalf) },
    prov: ORGAN.caseW.prov,
  },
  { id: 'org.great', label: 'Great division', short: 'Great', role: DIVISIONS.great.note, prov: ill('a stylised layout') },
  { id: 'org.swell', label: 'Swell division (behind shutters)', short: 'Swell', role: DIVISIONS.swell.note, prov: ill('a stylised layout') },
  { id: 'org.pedal', label: 'Pedal towers', short: 'Pedal', role: `${DIVISIONS.pedal.note} The 16′ and 32′ labels name a pitch, not always a pipe’s real length.`, prov: src('OHS-PIPES', 'is labeled as an 8\' stop. If that pipe is a stopped flute, however, the physical length of the pipe is only 4\'.') },
  { id: 'org.positive', label: 'Positive division', short: 'Positive', role: DIVISIONS.positive.note, prov: ill('a stylised layout') },
  {
    id: 'org.console',
    label: 'console',
    short: 'console',
    role: 'The organist’s keyboards, pedals and stops, in the chancel. Keep stands and cables clear of the console, the organist and their way in and out.',
    solid: { kind: 'box', min: v3(CONSOLE.x0, -CONSOLE.h, CONSOLE.z0), max: v3(CONSOLE.x1, 0, CONSOLE.z1) },
    prov: ill('a detached console in the chancel: a drawing default'),
  },
  { id: 'org.antiphonal', label: 'antiphonal division (rear gallery)', short: 'antiphonal', role: 'Some organs have a division far from the main case — here on the rear gallery. A spot on the main case cannot hear it; the main pair may.', listIn: [], prov: src('S-HOW', 'located on opposite sides of the worship facility, as is the case with antiphonal ranks') },
  wall('org.wallL', -NAVE.zHalf - 300, -NAVE.zHalf),
  wall('org.wallR', NAVE.zHalf, NAVE.zHalf + 300),
  ...([-1, 1] as const).map((s) => ({
    id: s < 0 ? 'org.paL' : 'org.paR',
    label: 'PA loudspeaker',
    short: 'PA',
    role: 'A column loudspeaker on the chancel arch, facing the congregation: room mics hear it too.',
    solid: { kind: 'box' as const, min: v3(PA.x - 150, -PA.h1, s * PA.z - 150), max: v3(PA.x + 150, -PA.h0, s * PA.z + 150) },
    variants: ['service'],
    listIn: [],
    prov: ill('a typical position for a church’s PA: a drawing default'),
  })),
];

const keepOut = (id: string, label: string, z0: number, z1: number, x0 = 6000, x1 = NAVE.x1): Envelope => ({ id, label, shape: { kind: 'box', min: v3(x0, -2100, z0), max: v3(x1, 0, z1) }, prov: ill('aisles, passages and exits kept clear (lesson L40): a drawing default') });
const envelopes: Envelope[] = [
  keepOut('env.aisleL', 'the left aisle (keep clear)', -ORGAN.aisleZ1.mm, -ORGAN.aisleZ0.mm),
  keepOut('env.aisleR', 'the right aisle (keep clear)', ORGAN.aisleZ0.mm, ORGAN.aisleZ1.mm),
  keepOut('env.sideL', 'the left passage and exits (keep clear)', -NAVE.zHalf, -ORGAN.sideZ.mm, 0),
  keepOut('env.sideR', 'the right passage and exits (keep clear)', ORGAN.sideZ.mm, NAVE.zHalf, 0),
  { id: 'env.organist', label: 'the organist at the console', shape: { kind: 'box', min: v3(CONSOLE.x1, -1800, CONSOLE.z0 - 200), max: v3(CONSOLE.x1 + 900, 0, CONSOLE.z1 + 200) }, prov: ill('the organist and the bench behind the console: a drawing default') },
];

/* ── RECOMMENDED STARTING POINTS ── */
const MICS = ['sdcCard', 'sdc'];
const pose = (p: Vec3, at: Vec3) => ({ p, ...aimTo(p, at) });
const GREAT = divisionPoint('great');

export const A12_ZONES: DocumentedZone[] = [
  {
    id: 'org.listen',
    label: 'Where one search ended: the fourth pew',
    band: 'One reported search, after many moves, ended about 10.7 m (35 ft) from that organ’s pipework, about 2.4 m (8 ft) up, midway between the side walls. A case study — walk and listen in your own room.',
    kind: 'sourced',
    src: 'NEU-ORGAN',
    quote: 'the fourth pew back, which is about 35 feet from the pipework; approximately eight feet off the floor; midway between the side walls (a case study, not a distance for other organs)',
    refSurface: 'facade',
    side: 'outside',
    distance: { min: 9500, max: 11800 },
    bandProv: ill('about 35 ft (10.7 m) with the lab’s ±1.2 m'),
    box: { min: v3(0, -3100, -1200), max: v3(NAVE.x1, -1800, 1200), prov: ill('about 8 ft up and midway: the lab’s band round the case study') },
    aim: { maxOffAxis: 30, prov: ill('facing the organ: within 30° is the lab’s tolerance') },
    requires: { micTypeIds: MICS },
    start: pose(STUDY, RANKS),
    drawn: { side: { u0: 9500, u1: 11800, v0: -3100, v1: -1800 }, top: { u0: 9500, u1: 11800, v0: -1200, v1: 1200 } },
    tendency: 'A balance of the organ’s divisions and the room’s decay at one listening position — but the low pedal notes can change a lot over a short move. Walk, listen and compare nearby safe positions.',
    checks: ['Soft stops, a bright reed, full organ', 'The lowest pedal notes, a step either way', 'Room decay against attack'],
  },
  {
    id: 'org.cong',
    label: 'A main pair over the congregation',
    band: 'In the body of the room, over the congregation, aimed at the main ranks — on a safe floor stand at a modest height, never in an aisle. No single distance: compare positions along and across the pews.',
    kind: 'sourced',
    src: 'S-HOW',
    quote: 'one or two (for stereo) microphones can be positioned in the body of the worship facility, over the congregation, and aimed toward the main organ ranks',
    refSurface: 'facade',
    side: 'outside',
    distance: { min: ORGAN.firstPew.mm, max: 18000 },
    bandProv: ill('the drawing’s pew area, from the first pew to 18 m, at 1.5–3.5 m (a stand’s modest height): drawing defaults'),
    box: { min: v3(0, -3500, -ORGAN.sideZ.mm + 200), max: v3(NAVE.x1, -1500, ORGAN.sideZ.mm - 200), prov: ill('over the pews, at a modest stand height: drawing defaults') },
    aimAt: { surface: 'ranks', r: 4000, prov: ill('"aimed toward the main organ ranks": the axis meets the case within 4 m of its middle') },
    requires: { micTypeIds: MICS },
    start: pose(v3(13600, -2600, 1500), RANKS),
    drawn: { side: { u0: ORGAN.firstPew.mm, u1: 18000, v0: -3500, v1: -1500 }, top: { u0: ORGAN.firstPew.mm, u1: 18000, v0: -ORGAN.sideZ.mm + 200, v1: ORGAN.sideZ.mm - 200 } },
    tendency: 'The listener’s perspective: the divisions blended with the room. Closer tends to clearer attacks; farther, more room and decay. The pair is the organ’s main sound — spots only add to it.',
    checks: ['All divisions, the pedal and the room decay', 'A coherent stereo image, and the mono sum', 'Noise: ventilation, traffic, the congregation'],
  },
  {
    id: 'org.div',
    label: 'A spot in front of one division',
    band: 'For independent control or a less ambient sound: in front of one division, far enough to hear more than one pipe (in this drawing about 3–6 m from the case), close enough to help separation.',
    kind: 'trial',
    src: 'S-HOW',
    quote: 'microphones closer to each main pipe location when independent organ control or a less ambient sound is required (no distance given: the lesson’s "far enough from an outlet to hear more than one pipe … close enough to improve separation")',
    refSurface: 'facade',
    side: 'outside',
    distance: { min: 3000, max: 6000 },
    bandProv: ill('one to two of the drawn Great’s widths out (3.2 m): a drawing default — no universal distance exists'),
    box: { min: v3(0, -4200, -1600), max: v3(NAVE.x1, -1800, 1600), prov: ill('in front of the Great, at a floor stand’s height') },
    aimAt: { surface: 'great', r: 1700, prov: ill('aimed at the Great: the axis meets the case within the division’s half-width') },
    requires: { micTypeIds: MICS },
    start: pose(v3(4300, -3000, 300), GREAT),
    drawn: { side: { u0: 3000, u1: 6000, v0: -4200, v1: -1800 }, top: { u0: 3000, u1: 6000, v0: -1600, v1: 1600 } },
    tendency: 'More of one division and less of the room, choir and PA — but a narrower view: it can omit a remote or antiphonal division, and hear the blower, the action or the shutters. Bring it up only under the main pair.',
    checks: ['It alone, with the relevant stops', 'Blower, action and shutter noise', 'Under the main pair, in mono'],
  },
];

export const A12_MODEL: InstrumentModel = {
  id: 'a12-organ',
  name: 'acoustic pipe organ in its room',
  parts,
  regions: [
    { id: 'r.great', partId: 'org.great', label: 'the Great', anchor: GREAT, prov: ill('a stylised layout'), note: DIVISIONS.great.note },
    { id: 'r.swell', partId: 'org.swell', label: 'the Swell', anchor: divisionPoint('swell'), prov: ill('a stylised layout'), note: DIVISIONS.swell.note },
    { id: 'r.pedal', partId: 'org.pedal', label: 'a Pedal tower', anchor: divisionPoint('pedal', 1), prov: ill('a stylised layout'), note: DIVISIONS.pedal.note },
    { id: 'r.positive', partId: 'org.positive', label: 'the Positive', anchor: divisionPoint('positive'), prov: ill('a stylised layout'), note: DIVISIONS.positive.note },
  ],
  surfaces: [
    { id: 'facade', partId: 'org.case', label: 'the organ’s façade', point: v3(0, -5000, 0), normal: N },
    { id: 'ranks', partId: 'org.great', label: 'the main ranks', point: RANKS, normal: N },
    { id: 'great', partId: 'org.great', label: 'the Great', point: GREAT, normal: N },
  ],
  lines: [{ id: 'axis', label: 'the case’s centre line', point: RANKS, dir: N, surfaces: ['facade', 'ranks', 'great'] }],
  envelopes,
  variants: [
    { id: 'recording', label: 'EMPTY ROOM', blurb: 'A recording session: the room empty and quiet, no PA on.' },
    { id: 'service', label: 'SERVICE', blurb: 'A service with a stream and a PA: the congregation in the pews, the PA loudspeakers on, the aisles and exits in use.' },
  ],
  defaultVariant: 'recording',
  // A room-sized scene fits at ~0.02 on a phone: print its few room labels there too.
  labelMinScale: 0.015,
  views: {
    side: { u0: -2800, u1: 16800, v0: -11000, v1: 400 },
    top: { u0: -2800, u1: 16800, v0: -7800, v1: 7800 },
  },
  viewTags: { side: 'FROM THE SIDE · THE NAVE CUT ALONG', top: 'FROM ABOVE · THE NAVE' },
  aimAzLimit: 180,
  yFloor: { mm: 0, prov: ill('frame O: the nave’s floor is y = 0') },
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  ports: { recording: null, service: null },
};

export const A12_WEDGES: Wedge[] = ([1, -1] as const).map((s) => ({
  id: s > 0 ? 'paR' : 'paL',
  label: `the PA loudspeaker on the ${s > 0 ? 'right' : 'left'} of the chancel arch`,
  short: s > 0 ? 'PA RIGHT' : 'PA LEFT',
  p: v3(PA.x, 0, s * PA.z),
  lift: (PA.h0 + PA.h1) / 2,
  faces: v3(1, 0, -0.25 * s),
  glyph: 'none' as const,
  note: s > 0 ? 'Up on the arch, behind and above a spot mic that faces the organ — a pattern’s rejection can be aimed toward it.' : 'The same on the other side: one mic’s null cannot face both at once. Level and routing do the rest.',
  prov: ill('a typical position for a church’s PA: a drawing default'),
}));
