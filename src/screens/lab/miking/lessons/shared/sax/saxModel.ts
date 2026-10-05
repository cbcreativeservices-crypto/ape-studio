/**
 * THE SAXOPHONE IN THE ENGINE (charter §2 layer 2): the solids, the moving
 * parts, the reference surfaces, the bell rim a clip grips and the bell's
 * swing — all compiled from one posture (saxPosture.ts), so the drawing,
 * the collisions, the zones and the readouts agree.
 *
 * SOLIDS (alto_sax/GEOMETRY_PROPOSAL.md §5, all ILLUSTRATIVE): the tube as a
 * chain of capsules from the reed tip to the bell rim, each fattened by the
 * keywork that stands off it (key cups, rods and guards: 16 mm on the body,
 * 12 on the bell — "the key/rod/pad/guard/neck-cork no-mount list"); the
 * neck strap; the player's head, torso, arms and legs; the HANDS on the
 * key stacks (moving: the fingers work the keys all the time); the chair
 * when seated.
 *
 * THE BELL'S SWING (an envelope): as the player moves, the bell swings
 * (±10° alto and tenor, ±15° the straight soprano, which pivots at the
 * mouth; the player's turn ±20°, ±25° on the baritone — proposal §5, the
 * soprano and baritone proposals). It is drawn ONLY when a mic comes close
 * (Envelope.approach): a stand's base or tube stays out of the space under
 * and round the bell that the horn sweeps.
 *
 * Pure: plain data.
 */
import type { Dim, Envelope, InstrumentModel, Part, Provenance, ReferenceSurface, RefLine, Rim, Shape3, Vec3, ViewBox } from '../../../engine/model/types.ts';
import { add, norm, sub } from '../../../engine/geometry/vec.ts';
import { pathOf, radiusAt } from './saxSpec.ts';
import { anchorsOf, centre, type SaxPosture } from './saxPosture.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const PLAYER = ill('the player’s body: a drawing default (no source gives a player’s geometry)');
const SIZE = ill('saxophone sizes: drawing defaults (alto_sax/SOURCES.md §3 — no maker prints dimensions)');
const cap = (a: Vec3, b: Vec3, r: number): Shape3 => ({ kind: 'capsule', a, b, r });

/** The keywork's stand-off from the tube (ILLUSTRATIVE), and the lab's
 *  clearance round the instrument. */
export const KEY_STANDOFF = { neck: 6, body: 16, bow: 10, bell: 12 } as const;
export const SAX_CLEAR: Dim = { mm: 8, prov: ill('a small keep-off round the instrument (the lab’s; no source gives one)') };
/** How close a mic must come before the bell's swing is drawn (mm). */
export const SWING_APPROACH = 220;

export type SaxModelOpts = {
  id: string;
  name: string;
  views: { side: ViewBox; top: ViewBox };
  variants: InstrumentModel['variants'];
  /** Extra surfaces a lesson measures from. */
  surfaces?: ReferenceSurface[];
};

/** Toward the audience, a little to the player's right (the way the horn faces). */
export const FORWARD: Vec3 = norm({ x: 1, y: 0, z: 0.25 });
export const midpoint = (a: Vec3, b: Vec3): Vec3 => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 });
/** "Up", made square to an axis (above a bell that points down and forward). */
export function upAcross(axis: Vec3): Vec3 {
  const up = { x: 0, y: -1, z: 0 };
  const k = up.x * axis.x + up.y * axis.y + up.z * axis.z;
  return norm(sub(up, { x: axis.x * k, y: axis.y * k, z: axis.z * k }));
}
/** The player's right ear (beside the head, a little behind its centre). */
export function earR(P: SaxPosture): Vec3 {
  return add(P.player.head, { x: -12, y: 6, z: P.player.headR * 0.86 });
}

/** A run of the tube as capsules every `step` mm, between path stations. */
function tubeRun(P: SaxPosture, u0: number, u1: number, step: number, extra: number, flat = false): Shape3[] {
  const out: Shape3[] = [];
  const n = Math.max(1, Math.ceil((u1 - u0) / step));
  for (let i = 0; i < n; i++) {
    const a = u0 + ((u1 - u0) * i) / n;
    const b = u0 + ((u1 - u0) * (i + 1)) / n;
    // The bell flares: flat-ended cone pieces, so nothing stands past the rim.
    if (flat) out.push({ kind: 'frustum', a: centre(P, a), b: centre(P, b), ra: radiusAt(P.row, a) + extra, rb: radiusAt(P.row, b) + extra });
    else out.push(cap(centre(P, a), centre(P, b), Math.max(radiusAt(P.row, a), radiusAt(P.row, b)) + extra));
  }
  return out;
}

/** One listed part and its unlisted twins (one solid each). */
function partChain(id: string, label: string, short: string, role: string, shapes: Shape3[], extra: Partial<Part> = {}): Part[] {
  return shapes.map((s, i) => ({ id: i === 0 ? id : `${id}${i}`, label, short, role, prov: SIZE, clearance: SAX_CLEAR, solid: s, ...(i === 0 ? {} : { listIn: [] }), ...extra }));
}

/** The sector of the bell's swing round the player's upright axis. */
export function swingShape(P: SaxPosture): Shape3 {
  const A = anchorsOf(P);
  const c = { x: P.player.pelvis.x, y: 0, z: P.player.pelvis.z };
  const toBell = sub(A.rimC, c);
  const r = Math.hypot(toBell.x, toBell.z);
  const ang = Math.atan2(toBell.z, toBell.x);
  const sw = (P.row.swing * Math.PI) / 180;
  // From a little below the bell's lowest edge (a close mic above or beside
  // the rim stays out of it) down to the floor.
  const below = Math.max(A.rimC.y + A.rimR * 0.35, A.bottom.y - 40);
  return { kind: 'sector', c, r0: Math.max(80, r - A.rimR - 90), r1: r + A.rimR + 110, a0: ang - sw, a1: ang + sw, y0: below + 140, y1: P.floorY };
}

/** The parts list, the envelopes and the surfaces of one posture. */
export function saxModel(P: SaxPosture, o: SaxModelOpts): InstrumentModel {
  const row = P.row;
  const S = pathOf(row);
  const A = anchorsOf(P);
  const pl = P.player;
  const parts: Part[] = [
    ...partChain('sx.mouthpiece', 'mouthpiece, reed and ligature', 'mouthpiece', 'The player’s lips seal round the mouthpiece; the cane reed, held on by the metal ligature, vibrates against it and sets the air inside going. Breath and reed noise start here.', [cap(centre(P, 0), centre(P, S.mouthEnd), row.mpR + 2)]),
    ...partChain('sx.neck', row.id === 'soprano' ? 'neck' : 'neck (crook)', 'neck', row.id === 'baritone' ? 'The curved neck, with the baritone’s loop, joins the mouthpiece to the body. The octave key’s small vent is on it.' : 'The curved tube that joins the mouthpiece to the body. The octave key’s small vent is on it.', tubeRun(P, S.mouthEnd, S.tenon, 40, KEY_STANDOFF.neck)),
    ...partChain('sx.body', 'body and keywork', 'body', 'The conical brass body carries the tone holes and the keys that open and close them — pads, rods, pearl touches and guards. Nothing clamps here: a clip goes on the bell rim only.', tubeRun(P, S.tenon, S.bodyEnd, 50, KEY_STANDOFF.body)),
  ];
  if (S.bellStart > S.bodyEnd + 1) parts.push(...partChain('sx.bow', 'bow', 'bow', 'The U-shaped bend at the bottom that turns the tube back up into the bell. Most of the low keys’ guards sit near it.', tubeRun(P, S.bodyEnd, S.bellStart, 30, KEY_STANDOFF.bow)));
  parts.push(
    ...partChain('sx.bell', 'bell', 'bell', row.id === 'soprano' ? 'The flared end. On the straight soprano it points down and forward, along the body — not up. The lowest notes, and the high harmonics of most notes, leave here.' : 'The flared end, curving up and forward. The lowest notes, and the high harmonics of most notes, leave here. A clip made for it grips its rim.', tubeRun(P, S.bellStart, S.U, 24, KEY_STANDOFF.bell, true)),
  );
  parts.push(
    { id: 'sx.holes', label: 'tone holes', short: 'tone holes', role: 'The holes along the body and the bell. A note opens the holes from the bell end up to the first open hole, where the air column acts as if the tube ended — the next page shows it.', prov: ill('hole positions: the semitone rule fitted to the drawn body (proposal §3)') },
    { id: 'sx.keys', label: 'keys and pads', short: 'keys', role: 'Pads on hinged cups seal the holes; rods and levers link them to the pearl touches under the fingers. Close up, a mic hears them click and thump.', prov: SIZE },
    { id: 'sx.octave', label: 'octave key', short: 'octave key', role: 'The thumb opens a small vent near the top of the air column, and the same fingering sounds an octave higher.', prov: SIZE },
    { id: 'sx.strap', label: row.id === 'baritone' ? 'the harness strap' : 'the neck strap', short: 'strap', role: row.id === 'baritone' ? 'A harness carries the baritone’s weight from the shoulders to the ring on the back of the body. Keep cables away from it.' : 'Carries the weight from the back of the player’s neck to the ring on the back of the body. Keep cables away from it.', prov: PLAYER, solid: cap(P.strap.from, P.strap.to, 8) },
    { id: 'sx.head', label: 'the player’s head', short: 'head', role: 'The player’s head — and their breath. A mic in front of the face hears breath and the mouthpiece, not the horn.', prov: PLAYER, solid: cap(pl.head, pl.head, pl.headR) },
    { id: 'sx.player', label: 'the player', short: 'player', role: 'The player stands or sits with the horn on a strap — the alto and tenor beside the right thigh, the baritone at the hip, the soprano held in front. They move with the music.', prov: PLAYER, solid: cap(pl.pelvis, pl.neck, 150) },
    { id: 'sx.shoulders', label: 'the player', short: 'player', role: 'Shoulders.', prov: PLAYER, listIn: [], solid: cap(pl.shoulderL, pl.shoulderR, 62) },
    { id: 'sx.handR', label: 'the hands on the keys', short: 'hands', role: 'Both hands work the keys all the time — the left on the upper stack, the right on the lower. A capsule or a gooseneck anywhere the fingers reach is in the wrong place.', moving: true, prov: PLAYER, solid: cap(pl.wristR, pl.handR, 52) },
    { id: 'sx.handL', label: 'the hands on the keys', short: 'hands', role: 'The left hand on the upper stack.', moving: true, prov: PLAYER, listIn: [], solid: cap(pl.wristL, pl.handL, 52) },
    { id: 'sx.armR1', label: 'the player’s arms', short: 'arms', role: 'The right arm reaches round the near side of the horn to the lower stack.', prov: PLAYER, solid: cap(pl.shoulderR, pl.elbowR, 52) },
    { id: 'sx.armR2', label: 'the player’s arms', short: 'arms', role: 'The right forearm.', prov: PLAYER, listIn: [], solid: cap(pl.elbowR, pl.wristR, 44) },
    { id: 'sx.armL1', label: 'the player’s arms', short: 'arms', role: 'The left arm.', prov: PLAYER, listIn: [], solid: cap(pl.shoulderL, pl.elbowL, 52) },
    { id: 'sx.armL2', label: 'the player’s arms', short: 'arms', role: 'The left forearm.', prov: PLAYER, listIn: [], solid: cap(pl.elbowL, pl.wristL, 44) },
  );
  for (const [k, a, b, r] of [
    ['thighL', pl.hipL, pl.kneeL, 76],
    ['thighR', pl.hipR, pl.kneeR, 76],
    ['shinL', pl.kneeL, pl.ankleL, 56],
    ['shinR', pl.kneeR, pl.ankleR, 56],
    ['footL', pl.ankleL, pl.toeL, 44],
    ['footR', pl.ankleR, pl.toeR, 44],
  ] as const) {
    parts.push({ id: `sx.${k}`, label: 'the player’s legs and feet', short: 'legs', role: 'The player’s legs and feet. Keep stand bases and cables clear of them.', prov: PLAYER, listIn: k === 'thighR' ? undefined : [], solid: cap(a, b, r) });
  }
  if (P.chair) {
    parts.push({ id: 'sx.chair', label: 'the chair', short: 'chair', role: 'A firm chair without arms. The horn hangs beside it, clear of the seat.', prov: PLAYER, solid: { kind: 'box', min: P.chair.seat.min, max: P.chair.seat.max } });
    P.chair.legs.forEach(([a, b], i) => parts.push({ id: `sx.chairLeg${i}`, label: 'the chair', short: 'chair', role: 'A chair leg.', prov: PLAYER, listIn: [], solid: cap(a, b, 14) }));
  }

  const envelopes: Envelope[] = [
    {
      id: 'env.swing',
      label: 'the bell’s swing as the player moves',
      shape: swingShape(P),
      prov: ill(`the swing ±${row.swing}° about the player (proposal §5 drawing default)`),
      approach: SWING_APPROACH,
    },
  ];

  /* reference surfaces (targets: a distance is read capsule to point) and the line */
  const surfaces: ReferenceSurface[] = [
    { id: 'bell', partId: 'sx.bell', label: 'the bell', point: A.rimC, normal: A.bellAxis, target: true },
    { id: 'bellFront', partId: 'sx.bell', label: 'the bell', point: A.rimC, normal: FORWARD, target: true },
    { id: 'bellTop', partId: 'sx.bell', label: 'the bell', point: A.rimC, normal: upAcross(A.bellAxis), target: true },
    { id: 'holes', partId: 'sx.holes', label: 'the tone holes', point: A.holesC, normal: A.holesN, target: true },
    { id: 'third', partId: 'sx.body', label: 'a third of the way up the horn', point: A.third, normal: FORWARD, target: true },
    { id: 'between', partId: 'sx.body', label: 'between the bell and the left-hand keys', point: midpoint(A.rimC, A.upperKeys), normal: FORWARD, target: true },
    { id: 'upper', partId: 'sx.keys', label: 'the upper keys', point: A.upperKeys, normal: A.holesN, target: true },
    { id: 'top', partId: 'sx.neck', label: 'the top of the horn', point: A.top, normal: FORWARD, target: true },
    { id: 'ear', partId: 'sx.head', label: 'the player’s right ear', point: earR(P), normal: norm({ x: -0.5, y: -1, z: 0.6 }), target: true },
    ...(o.surfaces ?? []),
  ];
  const lines: RefLine[] = [{ id: 'bellAxis', label: 'the bell’s axis', point: A.rimC, dir: A.bellAxis }];
  const rims: Rim[] = [{ id: 'bellRim', label: 'the bell rim', c: A.rimC, axis: A.bellAxis, r: A.rimR }];
  const far = add(A.reed, { x: -2000, y: -2000, z: -2000 });
  return {
    id: o.id,
    name: o.name,
    parts,
    regions: [
      { id: 'r.bell', partId: 'sx.bell', label: 'the bell', anchor: A.rimC, prov: ill('the rim’s centre'), note: 'The lowest notes leave here, and the high harmonics of most notes. A mic aimed into the bell hears the brightest, most direct part of the sound.' },
      { id: 'r.holes', partId: 'sx.holes', label: 'the open tone holes', anchor: A.holesC, prov: ill('the middle of the drawn hole field'), note: 'Most notes leave mainly through the first open tone hole and the open holes just past it — so the place the sound leaves moves along the body as the notes change.' },
      { id: 'r.reed', partId: 'sx.mouthpiece', label: 'the reed and the player’s breath', anchor: A.reed, prov: ill('the reed tip'), note: 'The reed starts each note; breath and reed noise come from here and the player’s mouth.' },
      { id: 'r.keys', partId: 'sx.keys', label: 'the keys and pads', anchor: A.lowerKeys, prov: ill('the lower stack'), note: 'Key clicks and pad thumps come from the keywork — loudest to a mic close to the stacks.' },
    ],
    surfaces,
    lines,
    envelopes,
    variants: o.variants,
    defaultVariant: o.variants[0].id,
    views: o.views,
    aimAzLimit: 180,
    yFloor: { mm: P.floorY, prov: { kind: 'unknown', needed: 'the horn’s height above the floor (a posture drawing default)' }, placeholder: true },
    // Nothing is "inside" a saxophone for a mic: a degenerate interior far away.
    interior: { x0: 0, x1: 1, rIn: 1, c: far },
    rims,
    ports: Object.fromEntries(o.variants.map((v) => [v.id, null])),
    // A stand's boom runs level, away from the mic's tail — toward the
    // audience when the mic points straight down into a bell.
    mountRule: { boom: 'level', fallback: { x: 1, y: 0, z: 0 }, length: 320 },
  };
}
