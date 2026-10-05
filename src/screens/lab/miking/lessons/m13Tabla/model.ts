/**
 * M13 TABLA — the technical truth (charter §2 layer 1): the pair, the dayan
 * (the smaller, wooden drum; also called dahina or tabla) and the bayan (the
 * larger kettle). Sources: docs/labs/miking/tabla/SOURCES.md (MET-TABLA object
 * extents, S-DUVEL, the lesson's own trials) and GEOMETRY_PROPOSAL.md.
 *
 * Frame H: origin on the floor under the midpoint between the drums; +x
 * toward the audience; +y DOWN (floor y = 0); +z to the player's right. The
 * player sits on the floor at −x. Right-handed layout: the dayan on the
 * player's right (+z), the bayan on the left (−z) — a DRAWING DEFAULT the
 * owner checks on the phone (the lesson: "identify them by instrument, rather
 * than assume that a microphone label such as 'right' always describes the
 * same viewpoint").
 *
 * The black patch (syahi): CENTRED on the dayan, OFF-CENTRE (toward the
 * player) on the bayan, per the lesson and the museum's essay. Head
 * diameters, supports, tilts and the patch sizes are drawing defaults.
 */
import type { Dim, Provenance } from '../../engine/model/types.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const placeholder = (mm: number, needed: string): Dim => ({ mm, prov: { kind: 'unknown', needed }, placeholder: true });
const IN = 25.4;

export const TABLA = {
  dayanH: { mm: 12.25 * IN, prov: src('MET-TABLA', 'Tabla: 12 1/4 × 8 × 8 in. (31.1 × 20.3 × 20.3 cm)') } as Dim,
  dayanW: { mm: 8 * IN, prov: src('MET-TABLA', 'Tabla: 12 1/4 × 8 × 8 in. (31.1 × 20.3 × 20.3 cm)') } as Dim,
  bayanH: { mm: 13.5 * IN, prov: src('MET-TABLA', 'Bhaya: 13 1/2 × 10 1/8 × 10 1/8 in. (34.3 × 25.7 × 25.7 cm)') } as Dim,
  bayanW: { mm: 10.125 * IN, prov: src('MET-TABLA', 'Bhaya: 13 1/2 × 10 1/8 × 10 1/8 in. (34.3 × 25.7 × 25.7 cm)') } as Dim,
  dayanHeadD: placeholder(145, 'the dayan’s head diameter: drawing default 145'),
  bayanHeadD: placeholder(230, 'the bayan’s head diameter: drawing default 230'),
  /** The black patch: a fraction of the head's radius (drawing defaults). */
  dayanPatch: placeholder(0.45, 'the dayan’s black patch radius (fraction of the head’s): drawing default 0.45'),
  bayanPatch: placeholder(0.36, 'the bayan’s black patch radius (fraction of the head’s): drawing default 0.36'),
  /** "off-centre toward the player": 0.2 × the head's radius (drawing default). */
  bayanOffset: placeholder(0.28, 'how far the bayan’s patch sits off-centre, toward the player (fraction of the radius): drawing default 0.28'),
  ringH: placeholder(60, 'the cloth support rings’ height: drawing default 60'),
  dayanTilt: placeholder(15, 'the dayan’s tilt toward the audience: drawing default 15°'),
  bayanTilt: placeholder(10, 'the bayan’s tilt toward the audience: drawing default 10°'),
  dayanZ: placeholder(150, 'the dayan’s place to the player’s right: drawing default 150'),
  bayanZ: placeholder(-170, 'the bayan’s place to the player’s left: drawing default −170'),
} as const;

export type DrumId = 'dayan' | 'bayan';
