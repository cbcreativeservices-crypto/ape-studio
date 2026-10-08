/**
 * M06 TIMPANI — the technical truth (charter §2 layer 1). Keys point into
 * docs/labs/miking/timpani/SOURCES.md. Frame (timpani/GEOMETRY_PROPOSAL.md):
 * origin ON THE FLOOR under the midpoint of the pair's head centres; +x
 * toward the conductor (away from the player); +y DOWN (the floor is y = 0,
 * the heads are at y = −h); +z the player's right. International layout:
 * the larger (lower) drum on the player's left (−z).
 *
 * UNKNOWN facts the drawing needs are PLACEHOLDERS (`placeholder: true`):
 * drawn, never a readout reference, listed in the lesson's unknowns. Owner
 * ruling 2026-10-04: `src`, `quote`, `prov` and the unknowns are internal.
 */
import type { Dim, DocumentedZone, Provenance, Vec3 } from '../../engine/model/types.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
const placeholder = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });

const IN = 25.4;

export type TimpanoId = 't32' | 't29' | 't26' | 't23';
export type Timpano = { id: TimpanoId; inch: number; d: Dim; c: Vec3; four: boolean };

export const TIMP_DIMS = {
  /** Head height above the floor: UNKNOWN (proposal drawing default 760). */
  headH: placeholder(760, 'timpani head height above the floor'),
  /** Centre spacing of the pair: drawing default ±380 (rim gap 61.5 mm). */
  pairZ: placeholder(380, 'centre spacing of the two drums'),
  /** "about 1 m (3'4") above the skin height" — the shared spot. */
  spotH: { mm: 1000, prov: src('DECCA', 'a single microphone between them at about 1 m (3\'4") above the skin height') } as Dim,
  /** The mallets' reach above the heads on the player's side (ILLUSTRATIVE). */
  malletH: { mm: 420, prov: ill('no source gives the mallets’ reach above the head') } as Dim,
  malletOut: { mm: 200, prov: ill('the mallets’ reach past the rim on the player’s side: no source gives it') } as Dim,
  headClear: { mm: 8, prov: ill('head excursion: no source gives a number') } as Dim,
} as const;

const H = TIMP_DIMS.headH.mm;
export const HEAD_Y = -H;

/** The drums (timpani/GEOMETRY_PROPOSAL.md; 32 and 23 in: drawing-default arc). */
export const TIMPANI: readonly Timpano[] = [
  { id: 't32', inch: 32, d: { mm: 32 * IN, prov: src('YMH-TIMP-SEL', 'followed by 23-inch and 32-inch sizes') }, c: { x: -150, y: HEAD_Y, z: -1210 }, four: true },
  { id: 't29', inch: 29, d: { mm: 29 * IN, prov: src('YMH-TIMP-SEL', 'We recommend selecting a 26-inch and 29-inch size first') }, c: { x: 0, y: HEAD_Y, z: -TIMP_DIMS.pairZ.mm }, four: false },
  { id: 't26', inch: 26, d: { mm: 26 * IN, prov: src('YMH-TIMP-SEL', 'We recommend selecting a 26-inch and 29-inch size first') }, c: { x: 0, y: HEAD_Y, z: TIMP_DIMS.pairZ.mm }, four: false },
  { id: 't23', inch: 23, d: { mm: 23 * IN, prov: src('YMH-TIMP-SEL', 'followed by 23-inch and 32-inch sizes') }, c: { x: -150, y: HEAD_Y, z: 1080 }, four: true },
];
export const drumOf = (id: TimpanoId): Timpano => TIMPANI.find((t) => t.id === id)!;
export const R29 = drumOf('t29').d.mm / 2;
export const R26 = drumOf('t26').d.mm / 2;

/** The middle of the rim gap between two drums (on the line joining their centres). */
export function gapMid(a: Timpano, b: Timpano): Vec3 {
  const dx = b.c.x - a.c.x;
  const dz = b.c.z - a.c.z;
  const L = Math.hypot(dx, dz);
  const ra = a.d.mm / 2;
  const rb = b.d.mm / 2;
  const t = (ra + (L - ra - rb) / 2) / L;
  return { x: a.c.x + dx * t, y: HEAD_Y, z: a.c.z + dz * t };
}
export const GAP_PAIR = gapMid(drumOf('t29'), drumOf('t26'));
export const GAP_LOW = gapMid(drumOf('t32'), drumOf('t29'));
export const GAP_HIGH = gapMid(drumOf('t26'), drumOf('t23'));

/** The strike point: "about one-third of the radius from the hoop", on the
 *  player's side (YMH-TIMP-STRIKE) — r = 2R/3 from the centre, toward −x. */
export function strikePoint(t: Timpano): Vec3 {
  return { x: t.c.x - ((t.d.mm / 2) * 2) / 3, y: HEAD_Y, z: t.c.z };
}

const SPOT = TIMP_DIMS.spotH.mm;
const BOTH = ['orchSdc', 'smallDynCard'];
const pairZone = (id: string, label: string, mid: Vec3, variant: 'two' | 'four', which: string): DocumentedZone => ({
  id,
  label,
  band: `Start about 1 m (3 ft 3 in) above the heads, between ${which}, then change the height and angle for an even balance of both.`,
  kind: 'sourced',
  src: 'DECCA',
  quote: variant === 'two' ? 'a single microphone between them at about 1 m (3\'4") above the skin height' : 'one microphone between two drums will be needed',
  refSurface: 'heads',
  side: 'outside',
  distance: { min: SPOT - 150, max: SPOT + 150 },
  bandProv: ill('"about 1 m": ±15 cm is the lab’s drawing tolerance (proposal)'),
  box: { min: { x: -300, y: -5000, z: mid.z - 260 }, max: { x: 300, y: 0, z: mid.z + 260 }, prov: ill('"between them": within 30 cm across and 26 cm along of the gap’s middle (drawing default)') },
  aim: { maxOffAxis: 60, prov: ill('the source gives no aim; the lab counts a mic looking down within 60° of straight down') },
  requires: { variant, micTypeIds: BOTH },
  drawn: { side: { u0: -300, u1: 300, v0: HEAD_Y - SPOT - 150, v1: HEAD_Y - SPOT + 150 }, top: { u0: -300, u1: 300, v0: mid.z - 260, v1: mid.z + 260 } },
  start: { p: { x: 0, y: HEAD_Y - SPOT, z: mid.z }, az: 0, el: -50 },
  tendency: 'Some extra attack and definition for both drums, added to what the main pickup already gives. Check both drums, every mallet, every pedal change: one drum should not win just because it is nearer.',
  checks: ['The mallets’ whole reach and the player’s sightline to the conductor', 'Both drums, soft and loud, and every pedal change', 'Overhead obstructions and the stand’s stability'],
});

/* ── SUGGESTED STARTING POINTS (lesson L17-L28; corrections TP-01..TP-03). ── */
export const TIMP_ZONES: DocumentedZone[] = [
  pairZone('tp.pair', 'One mic between the two drums, high above', GAP_PAIR, 'two', 'the two drums'),
  pairZone('tp.pairLow', 'Over the left pair (the two larger drums)', GAP_LOW, 'four', 'the two larger drums'),
  pairZone('tp.pairHigh', 'Over the right pair (the two smaller drums)', GAP_HIGH, 'four', 'the two smaller drums'),
  {
    id: 'tp.near',
    label: 'Closer, on the conductor’s side of one drum',
    band: 'Start outside the mallets’ reach on the conductor’s side of a drum, a little above its rim, aimed down at the head — no set distance: move it and listen.',
    kind: 'trial',
    src: 'LESSON-TIMP',
    quote: 'try a directional mic outside the player\'s strike zone, aimed toward the vibrating head without hovering over the normal mallet landing area',
    refSurface: 'heads',
    side: 'outside',
    distance: { min: 150, max: 600 },
    bandProv: ill('no number in the lesson: 15–60 cm above the head is the lab’s drawing of "a little above"'),
    radial: { line: 'rim29', min: 0, max: 320, prov: ill('outside the rim on the conductor’s side: the lab’s drawing') },
    box: { min: { x: 0, y: -5000, z: -800 }, max: { x: 1000, y: 0, z: 40 }, prov: ill('the conductor’s side of the 29 in drum (away from the mallets)') },
    aimAt: { surface: 'head29', r: R29 * 0.9, prov: ill('"aimed toward the vibrating head": the axis meets the head') },
    requires: { micTypeIds: BOTH },
    drawn: { side: { u0: R29, u1: R29 + 320, v0: HEAD_Y - 600, v1: HEAD_Y - 150 }, top: { u0: R29, u1: R29 + 320, v0: -TIMP_DIMS.pairZ.mm - 260, v1: -TIMP_DIMS.pairZ.mm + 260 } },
    start: { p: { x: R29 + 100, y: HEAD_Y - 300, z: -TIMP_DIMS.pairZ.mm }, az: 0, el: -33 },
    tendency: 'More of one drum’s attack and of a smaller part of its large head, less room — it may not carry the note’s full bloom you hear from farther away.',
    checks: ['The mallets and the player’s arms, through the whole passage', 'The note’s bloom against the attack', 'How it sits with the main pickup'],
  },
];
