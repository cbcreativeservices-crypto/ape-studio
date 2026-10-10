/**
 * THE REED PIANO (I11b) — where things are (charter §2 layer 2), in FRAME W
 * (keysSpec.ts): origin = the floor under the centre of the keyboard's front
 * edge; +x toward the PLAYER; +y DOWN; +z toward the treble. Pure; tested.
 *
 * The miked source is the BASS-SIDE oval speaker in the lid's front slope
 * (z = −260), facing the player and tilted 20° up — every position here is a
 * DRAWING DEFAULT (wurlitzer/GEOMETRY_PROPOSAL.md: case size and grille
 * positions UNKNOWN; measure a real one). Speaker count and size are sourced.
 *
 * The hard part, drawn as it is: the grilles face the PLAYER. A close mic
 * lives in the narrow gap between the lid, the player's hands over the keys
 * and their forearms — hatched keep-clear envelopes (ILLUSTRATIVE, no source
 * gives a clearance). The lid itself is never touched or clamped (lesson rule).
 */
import type { Dim, DocumentedZone, Envelope, InstrumentModel, MicPose, Part, Provenance, Shape3, Vec3, ViewBox, Wedge } from '../../../engine/model/types.ts';
import { OVAL_SPOTS, SPEAKER_OVAL_4x8 as OV, WURLI } from './keysSpec.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const DEG = Math.PI / 180;
const IN = 25.4;

/* ── the layout (drawing defaults, from keysSpec.WURLI) ── */
const T = WURLI.spkTilt.mm * DEG;
export const W = {
  keyTopY: -WURLI.keyTop.mm,
  keyBottomY: -WURLI.keyTop.mm + 22,
  keyFrontX: 0,
  slipX: 18,
  caseBackX: 18 - WURLI.d.mm,
  caseBottomY: -WURLI.keyTop.mm + 80,
  caseTopY: -WURLI.keyTop.mm + 80 - WURLI.h.mm,
  halfW: WURLI.w.mm / 2,
  /** The lid's front face: from its foot (just above the keys) up and back at the tilt. */
  faceFootX: -WURLI.lidSetback.mm,
  faceFootY: -WURLI.keyTop.mm - 5,
  tilt: T,
  /** Unit normal of the lid's front face (toward the player, tilted up). */
  n: { x: Math.cos(T), y: -Math.sin(T), z: 0 } as Vec3,
  /** Up the face (in the side section). */
  up: { x: -Math.sin(T), y: -Math.cos(T), z: 0 } as Vec3,
  spkZ: WURLI.spkZ.mm,
  legX: [-40, 18 - WURLI.d.mm + 40] as const,
  legZ: WURLI.legZ.mm,
} as const;

/** x of the lid's face at height y (y-down; the foot and above). */
export function faceX(y: number): number {
  const h = Math.max(0, W.faceFootY - y);
  return W.faceFootX - h * Math.tan(W.tilt);
}
/** The face's length along the slope, and the top corner. */
export const FACE_LEN = (W.faceFootY - W.caseTopY) / Math.cos(W.tilt);
export const FACE_TOP = { x: faceX(W.caseTopY), y: W.caseTopY };

/** A speaker's centre on the face (z = ±spkZ): half-way up the slope. */
export function speakerCentre(side: 'bass' | 'treble'): Vec3 {
  const s = FACE_LEN / 2;
  return { x: W.faceFootX + W.up.x * s, y: W.faceFootY + W.up.y * s, z: side === 'bass' ? -W.spkZ : W.spkZ };
}
export const C_BASS = speakerCentre('bass');
export const C_TREBLE = speakerCentre('treble');

/** A point in a speaker's own terms: `d` out along the normal, `s` up the face, `t` along z. */
export function onSpeaker(c: Vec3, d: number, s: number, t: number): Vec3 {
  return { x: c.x + W.n.x * d + W.up.x * s, y: c.y + W.n.y * d + W.up.y * s, z: c.z + t };
}

/** The pose that faces the grille squarely from `d` out (el = −tilt). */
export function facingPose(c: Vec3, d: number, s = 0, t = 0, az = 0): MicPose {
  return { p: onSpeaker(c, d, s, t), az, el: -WURLI.spkTilt.mm };
}

/* ── the oval speaker in its own section (local: d along the normal, r across) ── */
export const OVAL_SECTION = {
  /** The flange sits against the inside of the lid panel. */
  dFlange: -WURLI.lidPanel.mm,
  dApex: -WURLI.lidPanel.mm - 58 * OV.kDepth,
  dMagnetFront: -WURLI.lidPanel.mm - 97 * OV.kDepth,
  dMagnetBack: -WURLI.lidPanel.mm - 135 * OV.kDepth,
  rMagnet: 78 * OV.kDepth,
} as const;

/* ── the solids ── */
const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Shape3 => ({ kind: 'box', min: { x: Math.min(x0, x1), y: Math.min(y0, y1), z: Math.min(z0, z1) }, max: { x: Math.max(x0, x1), y: Math.max(y0, y1), z: Math.max(z0, z1) } });

/** The lid as solids: one block behind the slope, and thin steps that follow
 *  the slope (each step stands at most ≈ 5 mm proud of the true face). */
export const LID_STEPS = 10;
function lidSolids(): Shape3[] {
  const out: Shape3[] = [box(W.caseBackX, W.caseTopY, -W.halfW, FACE_TOP.x, W.faceFootY, W.halfW)];
  const dy = (W.faceFootY - W.caseTopY) / LID_STEPS;
  for (let k = 0; k < LID_STEPS; k++) {
    const y0 = W.caseTopY + k * dy;
    const y1 = y0 + dy;
    out.push(box(FACE_TOP.x - 1, y0, -W.halfW, faceX(y1), y1, W.halfW));
  }
  return out;
}

const caseProv = WURLI.w.prov;

function parts(): Part[] {
  const lid = lidSolids();
  const out: Part[] = [
    { id: 'wur.lid', label: 'lid', short: 'lid', role: 'The plastic lid over the action. On the later model the two speakers are screwed to it, so the lid becomes the speakers’ baffle — and a loose speaker can rattle. Never clamp or lean anything on it.', solid: lid[0], clearance: { mm: 5, prov: ill('keep the mic off the lid: 5 mm is the lab’s margin (no source gives one)') }, prov: WURLI.mountProv },
    ...lid.slice(1).map((s, i): Part => ({ id: `wur.lid.${i + 1}`, label: 'lid', short: 'lid', role: 'The lid’s front slope.', solid: s, clearance: { mm: 5, prov: ill('the lab’s margin') }, listIn: [], prov: caseProv })),
    { id: 'wur.grille', label: 'speaker grille', short: 'grille', role: 'The slotted front of the lid in front of each speaker. Two grilles, two small oval speakers — find the one that sounds best from outside, without lifting the lid.', prov: WURLI.countProv },
    { id: 'wur.cone', label: 'oval speaker (4 × 8 in)', short: 'speaker', role: 'A small oval speaker behind each grille, facing the player. Its cone pushes the air toward the player: this is what the mic hears.', prov: OV.major.prov },
    { id: 'wur.dust', label: 'dust cap', short: 'dust cap', role: 'The dome in the middle of the oval cone, over the voice coil.', prov: OV.depthProv },
    { id: 'wur.keys', label: 'keys', short: 'keys', role: 'The player’s hands work here. A mic and its stand stay clear of the keys’ travel and of the hands.', solid: box(W.faceFootX, W.keyTopY, -W.halfW + 40, W.keyFrontX, W.keyBottomY, W.halfW - 40), prov: WURLI.keyLen.prov },
    { id: 'wur.case', label: 'case', short: 'case', role: 'The instrument’s case: the action, the reeds, the pickup and the amplifier live inside. It stays closed during miking.', solid: box(W.caseBackX, W.keyBottomY, -W.halfW, W.slipX, W.caseBottomY, W.halfW), prov: caseProv },
    { id: 'wur.action', label: 'case', short: 'case', role: 'The action under the lid.', solid: box(W.caseBackX, W.faceFootY, -W.halfW, W.faceFootX, W.keyBottomY, W.halfW), listIn: [], prov: caseProv },
    { id: 'wur.cheekL', label: 'case end', short: 'end', role: 'The end of the case.', solid: box(W.caseBackX, W.keyTopY - 40, -W.halfW, W.slipX, W.keyBottomY, -W.halfW + 40), listIn: [], prov: caseProv },
    { id: 'wur.cheekR', label: 'case end', short: 'end', role: 'The end of the case.', solid: box(W.caseBackX, W.keyTopY - 40, W.halfW - 40, W.slipX, W.keyBottomY, W.halfW), listIn: [], prov: caseProv },
  ];
  let k = 0;
  for (const x of W.legX)
    for (const sg of [-1, 1]) {
      out.push({ id: `wur.leg${k}`, label: 'leg', short: 'leg', role: 'One of the instrument’s four legs.', solid: { kind: 'cyl', a: { x, y: W.caseBottomY, z: sg * W.legZ }, b: { x, y: 0, z: sg * W.legZ }, r: 14 }, ...(k > 0 ? { listIn: [] } : {}), prov: WURLI.legZ.prov });
      k++;
    }
  return out;
}

/* ── the player (ILLUSTRATIVE keep-clear envelopes) ── */
const PLAYER_PROV = ill('a seated player at a typical distance; no source gives the player’s envelope (GEOMETRY_PROPOSAL: ILLUSTRATIVE)');
export const PLAYER = {
  hip: { x: 610, y: -520 },
  shoulder: { x: 590, y: -1000 },
  head: { x: 585, y: -1150, r: 100 },
  elbow: { x: 400, y: -870, z: 210 },
  hand: { x: -40, y: -770, z: 170 },
  knee: { x: 190, y: -585, z: 130 },
  foot: { x: 170, y: -40, z: 130 },
  pedal: { x0: 160, x1: 300, z0: 50, z1: 150, h: 60 },
} as const;

function envelopes(): Envelope[] {
  const P = PLAYER;
  const cap = (id: string, label: string, a: Vec3, b: Vec3, r: number): Envelope => ({ id, label, shape: { kind: 'frustum', a, b, ra: r, rb: r }, prov: PLAYER_PROV });
  return [
    { id: 'ko.hands', label: 'the player’s hands over the keys', shape: box(-110, W.keyTopY - 70, -W.halfW + 40, 30, W.keyTopY, W.halfW - 40), prov: PLAYER_PROV },
    cap('ko.torso', 'the player', { x: P.hip.x, y: P.hip.y, z: 0 }, { x: P.shoulder.x, y: P.shoulder.y, z: 0 }, 175),
    cap('ko.head', 'the player', { x: P.head.x, y: P.head.y + 40, z: 0 }, { x: P.head.x, y: P.head.y - 40, z: 0 }, P.head.r),
    cap('ko.armL', 'the player’s forearm', { x: P.elbow.x, y: P.elbow.y, z: -P.elbow.z }, { x: P.hand.x, y: P.hand.y, z: -P.hand.z }, 55),
    cap('ko.armR', 'the player’s forearm', { x: P.elbow.x, y: P.elbow.y, z: P.elbow.z }, { x: P.hand.x, y: P.hand.y, z: P.hand.z }, 55),
    cap('ko.thighL', 'the player’s knees', { x: P.hip.x, y: P.hip.y - 20, z: -P.knee.z }, { x: P.knee.x, y: P.knee.y, z: -P.knee.z }, 75),
    cap('ko.thighR', 'the player’s knees', { x: P.hip.x, y: P.hip.y - 20, z: P.knee.z }, { x: P.knee.x, y: P.knee.y, z: P.knee.z }, 75),
    cap('ko.shinL', 'the player’s legs', { x: P.knee.x, y: P.knee.y, z: -P.knee.z }, { x: P.foot.x, y: P.foot.y, z: -P.knee.z }, 60),
    cap('ko.shinR', 'the player’s legs and the sustain pedal', { x: P.knee.x, y: P.knee.y, z: P.knee.z }, { x: P.foot.x, y: P.foot.y, z: P.knee.z }, 60),
    { id: 'ko.pedal', label: 'the sustain pedal', shape: box(P.pedal.x0, -P.pedal.h, P.pedal.z0, P.pedal.x1, 0, P.pedal.z1), prov: PLAYER_PROV },
  ];
}

/* ── the views ── */
export const WURLI_VIEWS: { side: ViewBox; top: ViewBox } = {
  side: { u0: -1420, u1: 860, v0: -1330, v1: 30 },
  top: { u0: -1420, u1: 860, v0: -640, v1: 640 },
};

export function wurliModel(id: string, name: string): InstrumentModel {
  return {
    id,
    name,
    parts: parts(),
    regions: [
      { id: 'r.cone', partId: 'wur.cone', label: 'front of the cone', anchor: onSpeaker(C_BASS, OVAL_SECTION.dApex * 0.5, 0, 0), prov: OV.depthProv, note: 'The front of the oval cone pushes the air toward the player: the sound the mic hears.' },
      { id: 'r.cone2', partId: 'wur.cone', label: 'the other speaker', anchor: onSpeaker(C_TREBLE, OVAL_SECTION.dApex * 0.5, 0, 0), prov: OV.depthProv, note: 'The second speaker, at the other end of the lid.' },
    ],
    surfaces: [
      { id: 'grille', partId: 'wur.grille', label: 'the grille (bass side)', point: C_BASS, normal: W.n },
      { id: 'grille2', partId: 'wur.grille', label: 'the other grille', point: C_TREBLE, normal: W.n },
      { id: 'back', partId: 'wur.case', label: 'the back of the case', point: { x: W.caseBackX, y: (W.caseTopY + W.caseBottomY) / 2, z: 0 }, normal: { x: -1, y: 0, z: 0 } },
    ],
    lines: [
      { id: 'axis', label: 'the speaker’s axis', point: C_BASS, dir: W.n, surfaces: ['grille'] },
      { id: 'axis2', label: 'the other speaker’s axis', point: C_TREBLE, dir: W.n, surfaces: ['grille2'] },
      { id: 'mid', label: 'the case’s centre line', point: { x: 0, y: (W.caseTopY + W.caseBottomY) / 2, z: 0 }, dir: { x: 1, y: 0, z: 0 }, surfaces: ['back'] },
    ],
    envelopes: envelopes(),
    variants: [{ id: 'lid', label: 'SPEAKERS IN THE LID', blurb: 'The later model: the two oval speakers are screwed to the lid, which becomes their baffle.' }],
    defaultVariant: 'lid',
    views: WURLI_VIEWS,
    viewTags: { side: 'SIDE · CUT THROUGH THE BASS-SIDE SPEAKER', top: 'TOP · CUT AT THE SPEAKERS’ HEIGHT' },
    aimAzLimit: 180,
    yFloor: { mm: 0, prov: { kind: 'unknown', needed: 'the instrument stands on its own legs: key-top height a drawing default (720)' }, placeholder: true },
    interior: { x0: W.caseBackX + 20, x1: FACE_TOP.x, rIn: 60, c: { x: 0, y: (W.caseTopY + W.faceFootY) / 2, z: 0 } },
    ports: { lid: null },
    // The stand's route (owner 2026-10-10: the stand stood in the player's
    // lap — the pole through the thigh, the boom across the forearm, the
    // tripod on the sustain pedal). From the mic's tail the boom rises clear
    // above the lid and comes back over it, past the case's back, then along
    // the back to the BASS end; the stand drops at the case's back bass
    // corner — away from the player's knees and pedal, and from the side it
    // stands behind the instrument, never through it. The mics, their aims
    // and every zone are unchanged — only the hardware's path (ILLUSTRATIVE).
    boomRoute: {
      lid: {
        legs: [
          { dir: { x: 0, y: -1, z: 0 }, past: -W.caseTopY + 150 },
          { dir: { x: -1, y: 0, z: 0 }, past: -W.caseBackX + 250 },
          { dir: { x: 0, y: 0, z: -1 }, past: W.halfW },
        ],
      },
    },
  };
}

/* ── the suggested starting points ── */
const AIM_SQUARE = { maxOffAxis: 20, prov: ill('"aimed at the speaker": ±20° of the grille’s normal is the lab’s tolerance') };
/** "An inch away, off-center and at a slight angle": 1 in = 25.4 mm (the
 *  research's number); the band round it is the lab's. */
const CLOSE = { min: 20, max: 40 };
const TOL = 15;

/** The drawn bands: a section through the speaker axis in each view. */
function bands(c: Vec3, dist: { min: number; max: number }, r0: number, r1: number) {
  const side = (s0: number, s1: number) => ({ poly: [[0, 0], [0, 0], [0, 0], [0, 0]].map((_, i) => { const d = i === 0 || i === 3 ? dist.min : dist.max; const s = i < 2 ? s0 : s1; const p = onSpeaker(c, d, s, 0); return [p.x, p.y] as const; }) });
  const top = (t0: number, t1: number) => ({ poly: [[0, 0], [0, 0], [0, 0], [0, 0]].map((_, i) => { const d = i === 0 || i === 3 ? dist.min : dist.max; const t = i < 2 ? t0 : t1; const p = onSpeaker(c, d, 0, t); return [p.x, p.z] as const; }) });
  const pieces = (f: (a: number, b: number) => { poly: (readonly [number, number])[] }) => (r0 <= 0 ? [f(-r1, r1)] : [f(-r1, -r0), f(r0, r1)]);
  return { side: pieces(side), top: pieces(top) };
}

export function wurliZones(): DocumentedZone[] {
  const zones: DocumentedZone[] = [
    {
      id: 'wur.close',
      label: 'Close, off-centre, at a slight angle',
      band: 'Start about 2.5 cm (1 in) from the grille, off the speaker’s centre along its long side, turned a little toward the centre.',
      kind: 'sourced',
      src: 'TF-REC',
      quote: 'use the same close area dynamic mic approach that you would with a guitar amp. An inch away, off-center and at a slight angle will do nicely. Reposition the mic until you find the sweet spot.',
      refSurface: 'grille',
      side: 'outside',
      distance: CLOSE,
      bandProv: ill('1 in (25.4 mm) is the research’s number; 2–4 cm round it is the lab’s band'),
      radial: { line: 'axis', min: OVAL_SPOTS.off - TOL, max: OVAL_SPOTS.off + TOL, prov: ill('"off-center": about half the oval’s long semi-axis (50.8 mm) ± 15 mm — a drawing default') },
      aim: { maxOffAxis: 30, minOffAxis: 5, prov: ill('"at a slight angle": 5–30° off the grille’s normal is the lab’s tolerance') },
      start: facingPose(C_BASS, 30, 0, -OVAL_SPOTS.off, 15),
      tendency: 'A focused first listen: the reeds’ bark and the small speaker’s own character, with little of the room. From here, move a little and listen — the sweet spot is found by ear.',
      checks: ['Clear of the lid, the keys and the player’s hands', 'Click and key noise on soft notes', 'The tremolo pulse on a held chord'],
    },
    {
      id: 'wur.centre',
      label: 'Close, on the speaker’s centre',
      band: 'Start about 2.5 cm (1 in) from the grille, on the centre of the speaker, facing it.',
      kind: 'sourced',
      src: 'S-GTR',
      quote: 'the closer the mic is to the speaker’s center, the more brightness you’ll get (general amp guidance; the small oval speaker may behave differently — test)',
      refSurface: 'grille',
      side: 'outside',
      distance: CLOSE,
      bandProv: ill('the close band shared with the off-centre start'),
      radial: { line: 'axis', max: TOL, prov: ill('"the speaker’s center": within 15 mm of the axis is the lab’s tolerance') },
      aim: AIM_SQUARE,
      start: facingPose(C_BASS, 30, 0, 0, 12),
      tendency: 'Most often the brightest, most direct spot — more attack and more click. A tendency to check on this small speaker.',
      checks: ['Brittle highs or click', 'The lid and keys clear', 'Matched level when you compare'],
    },
    {
      id: 'wur.out',
      label: 'Close, toward the outer end of the speaker',
      band: 'Start about 2.5 cm (1 in) from the grille, over the outer end of the oval, facing it.',
      kind: 'sourced',
      src: 'S-GTR',
      quote: 'Moving the mic outward away from the center of the speaker will give you more bass. / moving it toward the edge adds warmth and bass',
      refSurface: 'grille',
      side: 'outside',
      distance: CLOSE,
      bandProv: ill('the close band shared with the off-centre start'),
      radial: { line: 'axis', min: OVAL_SPOTS.out - TOL, max: OVAL_SPOTS.out + TOL, prov: ill('"toward the edge": 10 mm (scaled) inside the oval’s surround along its long axis ± 15 mm — a drawing default') },
      aim: AIM_SQUARE,
      start: facingPose(C_BASS, 30, 0, -OVAL_SPOTS.out),
      tendency: 'Most often rounder and warmer, with more body — and less click. Check the notes still speak in the band.',
      checks: ['Note definition in the full mix', 'Still in front of the speaker', 'The case end clear'],
    },
    {
      id: 'wur.other',
      label: 'Close to the other grille',
      band: 'The same close start on the second speaker, at the other end of the lid — to compare the two.',
      kind: 'trial',
      src: 'TF-REC',
      quote: 'Reposition the mic until you find the sweet spot (the lesson: "Compare left and right speaker locations")',
      refSurface: 'grille2',
      side: 'outside',
      distance: CLOSE,
      bandProv: ill('the close band, on the other speaker'),
      radial: { line: 'axis2', max: OVAL_SPOTS.off + TOL, prov: ill('in front of the other speaker’s centre: within the off-centre band of its axis') },
      aim: { maxOffAxis: 30, prov: ill('facing the other grille: ±30° is the lab’s tolerance') },
      start: facingPose(C_TREBLE, 30, 0, 0, -15),
      tendency: 'The same instrument through its other speaker: the two can differ a little. Compare at matched level, and keep the one that sounds best.',
      checks: ['Matched level when you compare', 'Clear of the right hand and the pedal foot', 'Which speaker really sounds better'],
    },
    {
      id: 'wur.farther',
      label: 'A little farther from the grille',
      band: 'Try about 5–15 cm (2–6 in) from the grille, in front of the speaker — where grille hardware gets in the way, or for a rounder sound.',
      kind: 'trial',
      src: 'S-GTR',
      quote: 'move back deliberately for more amp and room (general amp guidance; the lesson: "Test a slightly greater distance if grille hardware blocks the view or a lid vibrates the stand")',
      refSurface: 'grille',
      side: 'outside',
      distance: { min: 2 * IN, max: 6 * IN },
      bandProv: { kind: 'unknown', needed: '"a slightly greater distance": no number in the research; 5–15 cm is a drawing default' },
      radial: { line: 'axis', max: OV.aCone, prov: ill('in front of the speaker: within the oval cone’s long semi-axis of its axis') },
      aim: { maxOffAxis: 30, prov: ill('facing the speaker: ±30° is the lab’s tolerance') },
      start: facingPose(C_BASS, 100, 0, 0, 15),
      tendency: 'A rounder, less clicky sound with a little more of the case and the room. On a loud stage it also hears more of the band.',
      checks: ['The player’s forearms clear', 'Spill from the drums and wedges', 'Gain before feedback live'],
    },
    {
      id: 'wur.room',
      label: 'Farther away, for the instrument and the room',
      band: 'In a good room, try about 60–90 cm (2–3 ft) from the back of the case, at about the lid’s height — usually as a second mic under the close one.',
      kind: 'trial',
      src: 'S-SM57-UG',
      quote: '60 to 90 cm (2 to 3 ft.) back from speaker (a cabinet’s room row; for a piano whose speakers face the player the side and distance are a drawing default)',
      refSurface: 'back',
      side: 'outside',
      distance: { min: 600, max: 900 },
      bandProv: { kind: 'unknown', needed: 'a room-mic position for a reed piano: none in the research; 60–90 cm from the case back is a drawing default' },
      box: { min: { x: -2000, y: W.caseTopY - 220, z: -400 }, max: { x: 0, y: W.caseBottomY, z: 400 }, prov: ill('about the lid’s height and within the case’s width: the lab’s band') },
      aim: { maxOffAxis: 30, prov: ill('facing the instrument: ±30° is the lab’s tolerance') },
      start: { p: { x: W.caseBackX - 750, y: W.caseTopY - 40, z: 0 }, az: 180, el: 0 },
      tendency: 'The whole instrument and the room together — the speakers face the player, so this hears more case and room than speaker. Studio only, when the room helps; blend it under the close mic and check in mono.',
      checks: ['The room is worth hearing', 'Key and pedal noise', 'The pair in mono with the close mic'],
    },
  ];
  return zones.map((z) => {
    if (z.refSurface === 'back') {
      const x0 = W.caseBackX - z.distance.max;
      const x1 = W.caseBackX - z.distance.min;
      const b = z.box!;
      const rect = (v0: number, v1: number) => [{ poly: [[x0, v0], [x1, v0], [x1, v1], [x0, v1]] as const }];
      return { ...z, draw: { side: rect(b.min.y, b.max.y), top: rect(b.min.z, b.max.z) } };
    }
    const c = z.refSurface === 'grille2' ? C_TREBLE : C_BASS;
    const r0 = z.radial?.min ?? 0;
    const r1 = z.radial?.max ?? OV.aCone;
    return { ...z, draw: bands(c, z.distance, r0, r1) };
  });
}

/** Wedges where a stage often puts them (ILLUSTRATIVE), frame W. */
export function wurliWedges(): Wedge[] {
  const f = (x: number, z: number) => {
    const l = Math.hypot(x, z);
    return { x: x / l, y: 0, z: z / l };
  };
  return [
    { id: 'keysWedge', label: 'the player’s wedge, on the floor beside them, facing them', short: 'WEDGE', p: { x: 1150, y: 0, z: -600 }, lift: 150, faces: f(600 - 1150, 600), note: 'It sits by the player and faces them — behind a mic that faces the grille, where a cardioid rejects most.', prov: ill('a typical stage layout; no source gives the position') },
    { id: 'sideFill', label: 'a side-fill monitor at the side of the stage', short: 'SIDE FILL', p: { x: 0, y: 0, z: -1700 }, lift: 150, faces: { x: 0, y: 0, z: 1 }, note: 'It sits off to the side, about ninety degrees off the mic’s axis: no cardioid null reaches it. Distance and level do the work there.', prov: ill('a typical stage layout; no source gives the position') },
  ];
}

/** Placeholders this model draws with (for the lesson's unknowns). */
export const WURLI_PLACEHOLDERS: readonly Dim[] = [WURLI.w, WURLI.d, WURLI.h, WURLI.keyTop, WURLI.keyLen, WURLI.lidSetback, WURLI.spkZ, WURLI.spkTilt, WURLI.lidPanel, WURLI.legZ];
