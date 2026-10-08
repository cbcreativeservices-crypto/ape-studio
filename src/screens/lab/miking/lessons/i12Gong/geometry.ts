/**
 * I12 GONG — where things are (charter §2 layer 2), frame G (model.ts). Built
 * from model.ts's numbers, per gong (variant), so the drawing, the zones and
 * the collision agree.
 *
 *   face   the struck face, a plane at the dome's front, normal +x: the
 *          starting points' distances are "capsule to gong surface at rest"
 *          (the lesson's own definition)
 *   axis   the line straight out of the face's centre: the readout's
 *          "off the centre line"
 *   swing  the face's free swing (fore and aft, and a little turn) + 100 mm:
 *          nothing goes in it — the gong must hang freely of everything
 */
import type { DocumentedZone, Envelope, InstrumentModel, Part, Provenance, Vec3 } from '../../engine/model/types.ts';
import { aimTo, approachPose, sub, v3 } from '../shared/handGeom.ts';
import { conePolys } from '../shared/metal/metalGeom.ts';
import { C0, CY, diameterOf, frameW, GONG, PLAYER, radiusOf, strikePoint } from './model.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const trial = (note: string): Provenance => ({ kind: 'trial', src: 'LESSON-GONG', note });
export const N: Vec3 = v3(1, 0, 0);
const DOME = GONG.dome.mm;
const RIM = GONG.rim.mm;
const BOSS_H = GONG.bossH.mm;
const VARIANTS = ['tamtam', 'bossed'] as const;
const sfx = (v: string) => (v === 'bossed' ? 'B' : '');

/** The frame's top bar height, per gong (the gong hangs below it on cords). */
export const topBarY = (v: string) => CY - frameW(v) / 2;

function frameParts(v: string): Part[] {
  const W = frameW(v) / 2;
  const top = topBarY(v);
  const s = sfx(v);
  const F = GONG.feet.mm / 2;
  const r = GONG.post.mm / 2;
  const prov = ill('a frame stand of the rated type: its sizes are drawing defaults');
  return [
    { id: `gg.frame${s}`, label: 'frame stand', short: 'frame', role: 'A square frame stand the gong hangs in, swinging freely. It must be stable and rated for the gong — check its locks and feet with the owner or the venue’s crew. Nothing is clamped to it for a mic without their approval.', solid: { kind: 'capsule', a: v3(0, top, -W), b: v3(0, top, W), r }, variants: [v], prov },
    { id: `gg.postL${s}`, label: 'frame post', short: 'post', role: 'One of the frame’s uprights.', solid: { kind: 'capsule', a: v3(0, -20, -W), b: v3(0, top, -W), r }, variants: [v], listIn: [], prov },
    { id: `gg.postR${s}`, label: 'frame post', short: 'post', role: 'One of the frame’s uprights.', solid: { kind: 'capsule', a: v3(0, -20, W), b: v3(0, top, W), r }, variants: [v], listIn: [], prov },
    { id: `gg.footL${s}`, label: 'frame foot', short: 'foot', role: 'A foot of the frame.', solid: { kind: 'capsule', a: v3(-F, -20, -W), b: v3(F, -20, -W), r }, variants: [v], listIn: [], prov },
    { id: `gg.footR${s}`, label: 'frame foot', short: 'foot', role: 'A foot of the frame.', solid: { kind: 'capsule', a: v3(-F, -20, W), b: v3(F, -20, W), r }, variants: [v], listIn: [], prov },
  ];
}

const parts: Part[] = [
  { id: 'gg.face', label: 'face (tam-tam)', short: 'face', role: 'The broad face of a large orchestral tam-tam — no boss. Struck a little off centre with a soft mallet, it swells after the stroke into a broad, complex bloom rather than one clear note.', solid: { kind: 'cyl', a: v3(-RIM, CY, 0), b: v3(DOME, CY, 0), r: radiusOf('tamtam') }, variants: ['tamtam'], moving: true, prov: GONG.tamtamD.prov },
  { id: 'gg.faceB', label: 'face (bossed gong)', short: 'face', role: 'The face round the raised boss. Struck near the boss, it brings out a thicker mix of tones.', solid: { kind: 'cyl', a: v3(-RIM, CY, 0), b: v3(DOME, CY, 0), r: radiusOf('bossed') }, variants: ['bossed'], moving: true, prov: GONG.bossedD.prov },
  { id: 'gg.boss', label: 'boss', short: 'boss', role: 'The raised centre of a bossed gong — the part meant to be struck, for a more pitch-centred sound.', solid: { kind: 'cyl', a: v3(DOME, CY, 0), b: v3(BOSS_H, CY, 0), r: GONG.bossD.mm / 2 }, variants: ['bossed'], moving: true, prov: { kind: 'sourced', src: 'SONVO', quote: 'They have a rather large protrusion in the middle that is meant to be struck' } },
  { id: 'gg.rim', label: 'turned rim', short: 'rim', role: 'The edge, turned back into a flange. The cords pass through holes in it, so the gong hangs freely.', prov: ill('the rim’s depth is a drawing default') },
  { id: 'gg.cords', label: 'suspension cords', short: 'cords', role: 'Cords — gut is common — from the frame to holes in the rim. The gong should swing freely forward, back and to the sides without touching the stand. Inspect them before playing; the gong and its suspension are the owner’s.', prov: { kind: 'sourced', src: 'PAI-SUP', quote: 'Each Gong should be suspended so that it may swing freely forward, back, and to the sides without touching the stand.' } },
  ...VARIANTS.flatMap(frameParts),
  { id: 'gg.mallet', label: 'mallet', short: 'mallet', role: 'A soft, heavy mallet. Its size, weight and covering — and where it lands — change the sound; the whole arc, with the follow-through, is the player’s space.', prov: { kind: 'sourced', src: 'PAI-GONG', quote: 'The sound of these gongs can be influenced and varied through the nature of the stroke, as well as the size, weight, and composition of the mallets.' } },
];

/** The face's swept volume as it swings, + 100 mm (a solid cylinder along x). */
function swingEnv(v: 'tamtam' | 'bossed'): Envelope {
  const front = (v === 'bossed' ? BOSS_H : DOME) + GONG.swing.mm + 100;
  return { id: `env.swing${sfx(v)}`, label: 'the gong’s swing', shape: { kind: 'cyl', a: v3(-RIM - GONG.swing.mm - 100, CY, 0), b: v3(front, CY, 0), r: radiusOf(v) + 100 }, prov: ill('the swing (±80 mm at the rim, drawing default) plus 100 mm'), variants: [v] };
}
function malletEnv(v: 'tamtam' | 'bossed'): Envelope {
  const sp = strikePoint(v);
  return { id: `env.mallet${sfx(v)}`, label: 'the mallet’s arc', shape: { kind: 'capsule', a: v3(PLAYER.x + 20, -1460, PLAYER.z + 70), b: v3(sp.x + 60, sp.y + 40, sp.z), r: 120 }, prov: ill('the mallet from the shoulder to the strike point, plus follow-through: a drawing default'), variants: [v] };
}
const envelopes: Envelope[] = [
  swingEnv('tamtam'),
  swingEnv('bossed'),
  malletEnv('tamtam'),
  malletEnv('bossed'),
  { id: 'env.player', label: 'the player', shape: { kind: 'box', min: v3(PLAYER.x - 160, -1850, PLAYER.z - 230), max: v3(PLAYER.x + 170, 0, PLAYER.z + 200) }, prov: ill('a standing player beside the struck face: a drawing default') },
];

/* ── SUGGESTED STARTING POINTS: the lesson's own trials (internal kind
 *    'trial'): A in front, 60–120 cm; B closer, 30–60 cm, offset to a clear
 *    outer part of the face; D a room mic; a bossed gong's boss view. ── */
const BOTH = ['sdcCard', 'smallDynCard'];
const FACE: Vec3 = v3(DOME, CY, 0);
const AWAY: Vec3 = v3(0, 0, 1); // across, away from the player
const pose = (p: Vec3, at: Vec3) => ({ p, ...aimTo(p, at) });

function zoneB(v: 'tamtam' | 'bossed'): DocumentedZone {
  const R = radiusOf(v);
  const p = v3(450, CY - 0.1 * R, 0.75 * R);
  return {
    id: `gg.B.${v}`,
    label: 'Closer, off to a clear outer part',
    band: 'Try about 30–60 cm (1–2 ft) from the face, offset to a clear outer part of it — away from the player — aimed toward where it is played. Never against the gong.',
    kind: 'trial',
    src: 'LESSON-GONG',
    quote: 'Try 30–60 cm (1–2 ft) from the face, offset to a clear outer portion of the face and aimed toward the played region. Do not put the capsule against the gong.',
    refSurface: 'face',
    side: 'outside',
    distance: { min: 300, max: 600 },
    radial: { line: 'axis', min: 0.6 * R, max: 0.9 * R, prov: trial('"a clear outer portion of the face": 0.6–0.9 of the radius off the centre line') },
    box: { min: v3(-5000, -5000, 50), max: v3(5000, 0, 5000), prov: ill('the side away from the player and the mallet') },
    drawn: { side: { u0: DOME + 300, u1: DOME + 600, v0: CY - 0.9 * R, v1: CY + 0.9 * R }, top: { u0: DOME + 300, u1: DOME + 600, v0: 50, v1: 0.9 * R } },
    aimAt: { surface: 'face', r: 0.6 * R, prov: ill('"aimed toward the played region": the axis meets the face within 0.6 R of its centre') },
    requires: { variant: v, micTypeIds: BOTH },
    start: pose(p, strikePoint(v)),
    tendency: 'More direct sound and more level before feedback — and more of the local attack, the swing’s variation and an uneven mix of tones. Compare it with the front view at a similar level.',
    checks: ['Well outside the swing and the mallet', 'The same passage at a similar level', 'One local area dominating'],
  };
}

export const GONG_ZONES: DocumentedZone[] = [
  {
    id: 'gg.A',
    label: 'In front, facing the broad face',
    band: 'Start about 60–120 cm (2–4 ft) in front of the face, facing it, at about the height where it is played — the stand outside the mallet’s path.',
    kind: 'trial',
    src: 'LESSON-GONG',
    quote: 'Try 60–120 cm (2–4 ft) in front, facing the broad radiating surface at a height around the area being played. Place the stand outside the mallet path.',
    refSurface: 'face',
    side: 'outside',
    distance: { min: 600, max: 1200 },
    radial: { line: 'axis', max: 260, prov: trial('"in front, facing the broad radiating surface": within 26 cm of the centre line') },
    drawn: { side: { u0: DOME + 600, u1: DOME + 1200, v0: CY - 260, v1: CY + 260 }, top: { u0: DOME + 600, u1: DOME + 1200, v0: -260, v1: 260 } },
    aim: { maxOffAxis: 25, prov: ill('facing the face: within 25° is the lab’s tolerance') },
    requires: { micTypeIds: BOTH },
    start: { p: v3(900, CY, 150), az: 0, el: 0 },
    tendency: 'A useful overall view of the gong. Back away for more bloom and room; come closer for more presence. Listen for one local area of the face taking over.',
    checks: ['The whole rise and decay, soft and strong', 'The stand outside the mallet path', 'Room sound against presence'],
  },
  zoneB('tamtam'),
  zoneB('bossed'),
  {
    id: 'gg.boss',
    label: 'Toward the boss, from a safe offset',
    band: 'For a bossed gong, try about 30–60 cm (1–2 ft) from the boss, off to one side of it, aimed at it — and compare with the broader front view.',
    kind: 'trial',
    src: 'LESSON-GONG',
    quote: 'For a pitched bossed gong … Aim a microphone toward the boss from a safe offset and compare a broader front position. A very close center position may exaggerate mallet impact',
    refSurface: 'boss',
    side: 'outside',
    distance: { min: 300, max: 600 },
    cone: { min: 20, max: 50, toward: AWAY, prov: trial('"from a safe offset": 20–50° off the boss’s line, away from the player') },
    aim: { maxOffAxis: 20, prov: ill('aimed at the boss: within 20° is the lab’s tolerance') },
    requires: { variant: 'bossed', micTypeIds: BOTH },
    start: approachPose(v3(BOSS_H, CY, 0), N, AWAY, 420, 32),
    draw: conePolys(v3(BOSS_H, CY, 0), N, AWAY, 300, 600, 20, 50),
    tendency: 'More of the boss’s main tone — and, very close, more mallet impact; that is not automatically the most faithful pitch. Compare with the broader front view.',
    checks: ['The player’s chosen stroke, heard acoustically first', 'Mallet impact against the tone', 'The broad front view, compared'],
  },
  {
    id: 'gg.D',
    label: 'A room mic, farther out',
    band: 'With a front mic working first, try a second mic farther into a good-sounding room, secure and clear of traffic — in this drawing about 1.8–2.6 m (6–8½ ft) out.',
    kind: 'trial',
    src: 'LESSON-GONG',
    quote: 'Establish A or B first, then place a second mic or pair farther into a good-sounding room, securely and clear of traffic.',
    refSurface: 'face',
    side: 'outside',
    distance: { min: 1800, max: 2600 },
    radial: { line: 'axis', max: 700, prov: trial('farther into the room, roughly on the face’s line: the lab’s drawing') },
    drawn: { side: { u0: DOME + 1800, u1: DOME + 2600, v0: CY - 700, v1: CY + 700 }, top: { u0: DOME + 1800, u1: DOME + 2600, v0: -700, v1: 700 } },
    aim: { maxOffAxis: 30, prov: ill('aimed back at the gong: within 30° is the lab’s tolerance') },
    requires: { micTypeIds: BOTH },
    start: pose(v3(2200, CY - 150, 250), C0),
    tendency: 'The bloom and the decay in the room, under independent control. Combined with the front mic, the arrival times change the tone — check the pair in mono; live, spill and feedback limit it.',
    checks: ['The front mic working on its own first', 'The pair in mono through the whole decay', 'Secure, and clear of traffic'],
  },
];

export const GONG_MODEL: InstrumentModel = {
  id: 'gong',
  name: 'gong in its frame (32 in tam-tam or 18 in bossed gong)',
  parts,
  regions: [
    { id: 'r.face', partId: 'gg.cords', label: 'the face’s centre', anchor: C0, prov: GONG.tamtamD.prov, note: 'The face radiates from front and back as it rings.' },
    { id: 'r.upper', partId: 'gg.cords', label: 'the upper face', anchor: v3(0, CY - 150, 0), prov: GONG.tamtamD.prov, note: 'Another part of the face: every part of the gong reaches two mics at its own times.' },
  ],
  surfaces: [
    { id: 'face', partId: 'gg.cords', label: 'the face', point: FACE, normal: N },
    { id: 'boss', partId: 'gg.boss', label: 'the boss', point: v3(BOSS_H, CY, 0), normal: N, target: true, variants: ['bossed'] },
  ],
  lines: [{ id: 'axis', label: 'the face’s centre line', point: C0, dir: N }],
  envelopes,
  variants: [
    { id: 'tamtam', label: 'TAM-TAM', blurb: 'A large orchestral tam-tam: no boss, a broad face. It swells after the stroke into a complex bloom rather than one clear note.' },
    { id: 'bossed', label: 'BOSSED GONG', blurb: 'A gong with a raised central boss, struck on or near it for a more pitch-centred sound. Identify which gong you have before choosing a mic approach.' },
  ],
  defaultVariant: 'tamtam',
  views: {
    side: { u0: -800, u1: 2800, v0: -2300, v1: 100 },
    top: { u0: -800, u1: 2800, v0: -1300, v1: 1300 },
  },
  viewTags: { side: 'FROM THE SIDE · EDGE-ON', top: 'FROM ABOVE' },
  yFloor: { mm: 0, prov: ill('frame G: the floor is y = 0') },
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  ports: { tamtam: null, bossed: null },
};

/** For the art and the tests. */
export const SIZES = { D: diameterOf, R: radiusOf, W: frameW };
export const STRIKE_DIR = (v: string) => sub(strikePoint(v), C0);
