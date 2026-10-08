/**
 * A10 HARMONICA — where things are (charter §2 layer 2), in the world frame
 * (= the amp's frame C; model.ts). Built from model.ts's numbers so the
 * drawing, the zones and the collision agree.
 *
 * TWO SOURCE PATHS (variants), each framed on its own part of the stage:
 *   acoustic  a stand mic at the acoustic harmonica — the player, the hands
 *             and the harmonica; the starting points are measured from the
 *             harmonica (the hole face, H0) to the mic's front
 *   amp       a mic on the harp amp's speaker — the speaker family's combo,
 *             unchanged, with the speaker module's starting points measured
 *             from the grille cloth (re-based per the research: the lesson's
 *             "2–5 cm from the grille cloth" mixed two reference points;
 *             CORRECTIONS_LOG HM-01)
 * The cupped harp mic is not placed on a stand: it is in the player's hands
 * (the sound page and the setting page show it).
 *
 * Keep-outs: the hands' envelope round the harmonica (open … cupped), the
 * player's head, body and arms, the air space behind the amp.
 */
import type { DocumentedZone, Envelope, InstrumentModel, Part, Provenance, Vec3, Wedge } from '../../engine/model/types.ts';
import { ampModel, withBands, backX } from '../shared/speakers/ampModel.ts';
import { SPEAKER_12 } from '../shared/speakers/speakerModel.ts';
import { SPK_FRONT_ZONES } from '../spk/model.ts';
import { approachPose, sectorPolys, v3 } from '../shared/handGeom.ts';
import { conePolys } from '../shared/metal/metalGeom.ts';
import { HARMONICA } from '../shared/freereed/freeReedSpec.ts';
import { AMP, BODY, FLOOR_Y, H0, HD, HH, HL, STAGE } from './model.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const trial = (note: string): Provenance => ({ kind: 'trial', src: 'LESSON-HM', note });
const N: Vec3 = v3(1, 0, 0);
const RIGHT: Vec3 = v3(0, 0, 1);
const at = (dx: number, dy: number, dz: number): Vec3 => v3(H0.x + dx, H0.y + dy, H0.z + dz);

/* ── the acoustic harmonica and the player ── */
const HAND_R = 75;
const harmonicaParts: Part[] = [
  {
    id: 'hm.harp',
    label: 'harmonica',
    short: 'harmonica',
    role: 'A 10-hole harmonica, about 10 cm long: the player’s lips on the holes, the hands round the back. The sound leaves the back of the cover plates and the ends — into the hands.',
    solid: { kind: 'box', min: at(0, -HH / 2, -HL / 2), max: at(HD, HH / 2, HL / 2) },
    listIn: ['acoustic'],
    prov: HARMONICA.length.prov,
  },
  {
    id: 'hm.head',
    label: 'player’s head',
    short: 'head',
    role: 'The player’s face and lips at the holes. Never close to the mouth with a stand mic — a stand that can swing into the face is never acceptable.',
    solid: { kind: 'capsule', a: v3(BODY.headC.x, BODY.headC.y - 60, BODY.headC.z), b: v3(BODY.headC.x - 10, BODY.headC.y + 40, BODY.headC.z), r: 92 },
    listIn: [],
    prov: BODY.prov,
  },
  {
    id: 'hm.body',
    label: 'player',
    short: 'player',
    role: 'The player, standing — their space comes first.',
    solid: { kind: 'box', min: v3(BODY.backX, H0.y + 70, H0.z - BODY.halfW), max: v3(BODY.chestX, FLOOR_Y, H0.z + BODY.halfW) },
    listIn: [],
    prov: BODY.prov,
  },
  {
    id: 'hm.armR',
    label: 'player’s right arm',
    short: 'arm',
    role: 'The arm up to the hands. It moves as the hands open and close.',
    solid: { kind: 'capsule', a: at(-76, 392, 175), b: at(8, 150, 70), r: 48 },
    listIn: [],
    prov: BODY.prov,
  },
  {
    id: 'hm.armL',
    label: 'player’s left arm',
    short: 'arm',
    role: 'The arm up to the hands.',
    solid: { kind: 'capsule', a: at(-104, 380, -175), b: at(-6, 146, -70), r: 48 },
    listIn: [],
    prov: BODY.prov,
  },
  { id: 'hm.cover', label: 'cover plates', short: 'covers', role: 'Metal covers over the reed plates, open at the back and the ends: the sound leaves through them. Some designs close the sides so all of it goes back toward a cupped mic.', listIn: ['acoustic'], prov: { kind: 'sourced', src: 'HOH-ROCKET', quote: 'Cover plates without side vents direct all the sound towards the microphone' } },
  { id: 'hm.comb', label: 'comb', short: 'comb', role: 'The body between the plates, cut into ten channels — one behind each hole.', listIn: ['acoustic'], prov: HARMONICA.holes.prov },
  { id: 'hm.reeds', label: 'reed plates and reeds', short: 'reeds', role: 'Two plates of brass reeds, twenty reeds in all: in each channel one reed sounds when you blow and one when you draw. The reeds are the sound source.', listIn: ['acoustic'], prov: HARMONICA.reeds.prov },
  { id: 'hm.holes', label: 'holes 1–10', short: 'holes', role: 'Ten holes along the mouth side, low notes at hole 1 (the player’s left) to high at hole 10. The player changes harmonicas to change key.', listIn: ['acoustic'], prov: HARMONICA.holes.prov },
  { id: 'hm.hands', label: 'the hands (the hand chamber)', short: 'hands', role: 'The hands round the back of the harmonica make a chamber the sound passes through. Opening and closing it changes the tone — part of the player’s sound, so record how they hold it.', listIn: ['acoustic'], prov: { kind: 'trial', src: 'LESSON-HM', note: 'the hand chamber is part of the sound (lesson L31); its envelope is a drawing default' } },
];

const envelopes: Envelope[] = [
  {
    id: 'env.hands',
    label: 'the hands and their movement',
    shape: { kind: 'capsule', a: at(30, 0, -22), b: at(30, 0, 22), r: HAND_R },
    prov: ill('the hands’ envelope round the harmonica, open to cupped: 140 × 120 × 120 (a drawing default)'),
  },
];

/* ── the amp: the speaker family's combo, unchanged (frame C) ── */
const AMP_MODEL = ampModel('combo', 'a10-amp', 'harp amp (a combo with one 12 in speaker)', 1000);
const ampParts: Part[] = AMP_MODEL.parts.map((p) => ({ ...p, listIn: ['amp'] }));
const ampEnvelopes: Envelope[] = AMP_MODEL.envelopes.map((e) => ({ ...e, variants: ['amp'] }));

/* ── SUGGESTED STARTING POINTS ── */
const STAND_MICS = ['smallDynCard', 'sdcCard'];

/** Acoustic: the lesson's own trial, 15–30 cm from the harmonica, at mouth
 *  and hand height, just beyond the hands — facing the playing zone, or a
 *  little to the side of the breath stream. */
const ACOUSTIC_ZONES: DocumentedZone[] = [
  {
    id: 'hm.stand',
    label: 'In front of the hands, at mouth height',
    band: 'Start about 15–30 cm (6–12 in) from the harmonica, at mouth and hand height, just beyond where the hands move — facing the playing zone.',
    kind: 'trial',
    src: 'LESSON-HM',
    quote: 'Start with a stand microphone facing the playing zone at about mouth and hand height, just beyond the normal hand movement. A distance around 15–30 cm is a practical trial, not a published harmonica standard.',
    refSurface: 'harp',
    side: 'outside',
    distance: { min: HARMONICA.standMin.mm, max: HARMONICA.standMax.mm },
    cone: { min: 0, max: 20, prov: trial('"facing the playing zone": within the breath cone’s 20° (a drawing default) of the line straight out of the harmonica') },
    box: { min: v3(H0.x, H0.y - 150, H0.z - 400), max: v3(H0.x + 600, H0.y + 150, H0.z + 400), prov: trial('"at about mouth and hand height": ±15 cm of the harmonica’s height (the lab’s band)') },
    aim: { maxOffAxis: 25, prov: ill('facing the hands and the harmonica: within 25° is the lab’s tolerance') },
    requires: { variant: 'acoustic', micTypeIds: STAND_MICS },
    start: { p: at(220, 0, 0), az: 0, el: 0 },
    draw: conePolys(H0, N, null, HARMONICA.standMin.mm, HARMONICA.standMax.mm, 0, 20),
    tendency: 'The harmonica and the air round it, with the hands’ shaping. Closer gives more detail and isolation — and more breath; farther, in a quiet room, a more integrated sound.',
    checks: ['A whole phrase, low and high, at matched monitor level', 'Breath bursts and hand wah', 'The stand clear of the mouth, the hands and any neck holder'],
  },
  {
    id: 'hm.off',
    label: 'A little to the side of the breath stream',
    band: 'Same distance, about 15–30 cm, moved a little off the line straight out of the harmonica — to one side of the breath stream — still aimed at the hands.',
    kind: 'trial',
    src: 'LESSON-HM',
    quote: 'Aim slightly off the breath stream if bursts dominate.',
    refSurface: 'harp',
    side: 'outside',
    distance: { min: HARMONICA.standMin.mm, max: HARMONICA.standMax.mm },
    cone: { min: 20, max: 40, toward: RIGHT, prov: trial('"slightly off the breath stream": just outside the breath cone’s 20° (a drawing default), up to 40° (the lab’s band), on the player’s right') },
    aim: { maxOffAxis: 25, prov: ill('still aimed at the harmonica: within 25° is the lab’s tolerance') },
    requires: { variant: 'acoustic', micTypeIds: STAND_MICS },
    start: approachPose(H0, N, RIGHT, 220, 30),
    draw: sectorPolys(H0, N, RIGHT, HARMONICA.standMin.mm, HARMONICA.standMax.mm, 20, 40),
    tendency: 'Fewer breath bursts and pops reach the capsule; the tone tends to change a little with the angle. Compare it with the straight-on position over a whole phrase.',
    checks: ['Breath and pops against the straight-on position', 'The hand wah still heard', 'Matched level when you compare'],
  },
];

/** The amp: the speaker module's own starting points, unchanged in number
 *  and reference (from the grille cloth), with the harp amp's words. */
const HARP_WORDS: Record<string, { tendency: string; checks: string[] }> = {
  'cab.boundary': { tendency: 'A dependable first listen on a harp amp: the player’s amplified tone with the speaker’s bite. From here, move toward the centre for more bite or outward for a softer top end — one change at a time.', checks: ['The grille is not touched', 'Which speaker is really sounding', 'The level on the player’s loudest phrase'] },
  'cab.centre': { tendency: 'Most often more bite and edge — on a distorted harp tone it can turn harsh. If it does, slide toward the edge, keeping the distance.', checks: ['Harshness on the loudest notes', 'The grille is not touched', 'Low end lifted by the closeness'] },
  'cab.edge': { tendency: 'Most often a softer top end and a rounder tone — a tendency to check on this speaker.', checks: ['The notes still clear in the band', 'That it is still the speaker that sounds', 'The grille is not touched'] },
  'cab.mid': { tendency: 'A softer attack, more of the whole amp and a little of the room. In a quiet studio, a second view to compare with the close one.', checks: ['Spill from the band and the monitors', 'Matched level when you compare', 'The pair in mono with the close mic'] },
  'cab.far': { tendency: 'More of the amp and the room — a studio idea after a reliable close mic, rarely a help on a loud stage.', checks: ['The room is worth hearing', 'Spill from the band', 'The pair in mono with the close mic'] },
};

const AMP_ZONES: DocumentedZone[] = SPK_FRONT_ZONES.filter((z) => z.id in HARP_WORDS).map((z) =>
  withBands(
    {
      ...z,
      id: `hm.amp.${z.id.slice(4)}`,
      quote: `${z.quote} (the speaker module's zone, re-based for the harp amp: a guitar-amp source, measured from the grille cloth — CORRECTIONS_LOG HM-01)`,
      requires: { variant: 'amp', micTypeIds: STAND_MICS },
      tendency: HARP_WORDS[z.id].tendency,
      checks: HARP_WORDS[z.id].checks,
    },
    backX('combo'),
    SPEAKER_12.rCone.mm,
  ),
);

export const A10_ZONES: DocumentedZone[] = [...ACOUSTIC_ZONES, ...AMP_ZONES];

/* ── the views: each source path framed on its own part of the stage ── */
const ACOUSTIC_SIDE = { u0: H0.x - 420, u1: H0.x + 640, v0: H0.y - 380, v1: H0.y + 420 };
const ACOUSTIC_TOP = { u0: H0.x - 420, u1: H0.x + 640, v0: H0.z - 460, v1: H0.z + 460 };

export const A10_MODEL: InstrumentModel = {
  id: 'a10-harmonica',
  name: 'harmonica and the harp amp',
  parts: [...harmonicaParts, ...ampParts],
  regions: [
    { id: 'r.harp', partId: 'hm.harp', label: 'the harmonica', anchor: at(HD + 10, 0, 0), prov: HARMONICA.length.prov, variants: ['acoustic'], note: 'The reeds sound inside; the sound leaves the back of the cover plates and the ends, into the hands.' },
    ...AMP_MODEL.regions.map((r) => ({ ...r, variants: ['amp'] })),
  ],
  surfaces: [
    { id: 'harp', partId: 'hm.harp', label: 'the harmonica', point: H0, normal: N, target: true, variants: ['acoustic'] },
    ...AMP_MODEL.surfaces.map((s) => ({ ...s, variants: ['amp'] })),
  ],
  lines: [
    { id: 'breath', label: 'the breath line', point: H0, dir: N, variants: ['acoustic'], surfaces: ['harp'] },
    ...AMP_MODEL.lines.map((l) => ({ ...l, variants: ['amp'], surfaces: ['grille', 'back'] })),
  ],
  envelopes: [...envelopes, ...ampEnvelopes],
  variants: [
    { id: 'acoustic', label: 'ACOUSTIC · STAND MIC', blurb: 'A stand mic in front of the acoustic harmonica: it hears the harmonica, the hands and the air round them.' },
    { id: 'amp', label: 'HARP AMP · SPEAKER MIC', blurb: 'A mic on the harp amp’s speaker: it hears the amplified system — the cupped harp mic, the amp, its distortion and the speaker.' },
  ],
  defaultVariant: 'acoustic',
  views: AMP_MODEL.views,
  viewsByVariant: {
    acoustic: { side: ACOUSTIC_SIDE, top: ACOUSTIC_TOP },
    amp: AMP_MODEL.views,
  },
  viewTags: { side: 'FROM THE SIDE', top: 'FROM ABOVE' },
  aimAzLimit: 180,
  yFloor: { mm: FLOOR_Y, prov: AMP_MODEL.yFloor.prov, placeholder: true },
  interior: AMP_MODEL.interior,
  ports: { acoustic: null, amp: null },
};

/** The stage monitors (ILLUSTRATIVE positions): a floor wedge downstage of
 *  the player facing back at them; the player's own amp behind them. */
export const A10_WEDGES: Wedge[] = [
  {
    id: 'wedge',
    label: 'a floor wedge downstage, facing back at the player',
    short: 'WEDGE',
    p: v3(STAGE.wedgeX.mm, FLOOR_Y, H0.z),
    lift: 150,
    faces: v3(-1, 0, 0),
    note: 'In front of the player, behind a stand mic that faces the harmonica — the case a pattern’s null can help with.',
    prov: ill('a typical stage layout; no source gives the position'),
  },
  {
    id: 'amp',
    label: 'the harp amp behind the player',
    short: 'HARP AMP',
    p: v3(0, FLOOR_Y, 0),
    lift: FLOOR_Y,
    faces: v3(1, 0, 0),
    glyph: 'none',
    note: 'The player’s own amp, behind and to the side: a mic facing the harmonica has it off to one side, not behind — no pattern’s null reaches it. Distance, the amp’s level and its angle do the work.',
    prov: ill('the amp drawn behind the player and off their axis (a drawing default)'),
  },
];

/** Exposed for the art and the tests. */
export const A10_FRAMES = { ACOUSTIC_SIDE, ACOUSTIC_TOP, AMP_BOX: AMP.box, HAND_R };
