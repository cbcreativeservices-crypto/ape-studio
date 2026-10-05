/**
 * HAND-DRUM FAMILY — the shared technical model (charter §2 layer 1–2) for
 * congas, bongos, timbales and the djembe. Pure TypeScript, no React Native:
 * the tests reach it directly.
 *
 * FRAME H (docs/labs/miking/congas/GEOMETRY_PROPOSAL.md): mm; origin on the
 * floor under the midpoint between the drums' head centres (one drum: under
 * its head centre); +x toward the audience (away from the player); +y DOWN;
 * +z to the player's right. The player stands or sits at −x. A height h above
 * the floor is y = −h. A variant that RAISES the drums moves the floor
 * instead (InstrumentModel.floorByVariant), so every head — and every zone
 * measured from a head — keeps one position in every variant.
 *
 * Every drum is an upright (or tilted) single-headed drum with an open lower
 * end: a head (a moving membrane), a shell (one capped cone, the drawing
 * default taper of the geometry files) and a rim a clip mic can clamp to.
 * Heads face up: a head's reference surface has normal (0, −1, 0), so a
 * positive distance is ABOVE the head and a zone's aim "at the head" is down.
 */
import type { Dim, Part, Provenance, ReferenceSurface, RefLine, Rim, Shape3, Vec3, ZoneDraw } from '../../../engine/model/types.ts';

export const IN = 25.4;
export const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
export const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
export const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
/** A DRAWING DEFAULT (geometry files): a value the picture needs that no
 *  source gives — drawn, never a readout, listed in the lesson's unknowns. */
export const drawingDefault = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });

/** Up (the head normal) and down (the aim "at the head"). */
export const UP: Vec3 = { x: 0, y: -1, z: 0 };
export const DOWN: Vec3 = { x: 0, y: 1, z: 0 };

/** One single-headed drum of the family, upright. */
export type HandDrum = {
  id: string;
  /** "conga", "tumba", "macho" … — the word in labels ("the tumba head"). */
  name: string;
  label: string;
  short: string;
  /** Head centre in plan (mm). */
  c: { x: number; z: number };
  /** The head plane, y (mm; −height). */
  headY: number;
  /** Head radius (nominal diameter ÷ 2), mm. */
  R: number;
  /** The shell's lower edge, y, and its outside radius there. */
  bottomY: number;
  rBottom: number;
  /** The rim: how far its top stands above the head plane, and how far it
   *  sits outside the head's edge (drawing defaults). */
  rim: { rise: number; t: number };
  prov: { size: Provenance; height: Provenance; shell: Provenance };
};

export function headCentre(d: HandDrum): Vec3 {
  return { x: d.c.x, y: d.headY, z: d.c.z };
}

/** The head: a thin disc (a frustum 2 mm thick) — a moving part. */
export function headPart(d: HandDrum, role: string, clearance: Dim): Part {
  const shape: Shape3 = { kind: 'frustum', a: { x: d.c.x, y: d.headY + 1, z: d.c.z }, b: { x: d.c.x, y: d.headY - 1, z: d.c.z }, ra: d.R, rb: d.R };
  return { id: `${d.id}.head`, label: `${d.name} head`, short: d.name.toUpperCase(), role, moving: true, clearance, prov: d.prov.size, solid: shape };
}

/** The shell with its rim on top: one capped cone from the rim's top down to
 *  the open lower edge. */
export function shellPart(d: HandDrum, role: string): Part {
  const shape: Shape3 = { kind: 'frustum', a: { x: d.c.x, y: d.headY - d.rim.rise, z: d.c.z }, b: { x: d.c.x, y: d.bottomY, z: d.c.z }, ra: d.R + d.rim.t, rb: d.rBottom };
  return { id: `${d.id}.shell`, label: `${d.name} shell`, short: 'SHELL', role, prov: d.prov.shell, solid: shape };
}

/** The head as a reference surface: distances read ABOVE it. */
export function headSurface(d: HandDrum): ReferenceSurface {
  return { id: d.id, partId: `${d.id}.head`, label: `the ${d.name} head`, point: headCentre(d), normal: UP, minus: { words: 'below', key: 'BELOW' } };
}

/** The drum's centre line (vertical, through the head centre). */
export function axisLine(d: HandDrum): RefLine {
  return { id: `${d.id}.axis`, label: `the ${d.name}’s centre line`, point: headCentre(d), dir: DOWN };
}

/** The rim a clip mount clamps to (its top edge). */
export function rimOf(d: HandDrum): Rim {
  return { c: { x: d.c.x, y: d.headY - d.rim.rise, z: d.c.z }, r: d.R + d.rim.t };
}

/** The rim's top, y. */
export function rimTopY(d: HandDrum): number {
  return d.headY - d.rim.rise;
}

/** The shell's outside radius at height y (straight taper). */
export function shellRadiusAt(d: HandDrum, y: number): number {
  const y0 = d.headY - d.rim.rise;
  const t = Math.max(0, Math.min(1, (y - y0) / (d.bottomY - y0)));
  return d.R + d.rim.t + (d.rBottom - d.R - d.rim.t) * t;
}

/** A box solid (min/max corners sorted). */
export function box(a: Vec3, b: Vec3): Shape3 {
  return { kind: 'box', min: { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), z: Math.min(a.z, b.z) }, max: { x: Math.max(a.x, b.x), y: Math.max(a.y, b.y), z: Math.max(a.z, b.z) } };
}

/** A zone's drawn band ABOVE a head plane: side = an x-span × the height band;
 *  top = the plan region (rect, or round). */
export function drawAbove(headY: number, band: { min: number; max: number }, side: { u0: number; u1: number }, top: ZoneDraw): { side: ZoneDraw; top: ZoneDraw } {
  return { side: { u0: side.u0, u1: side.u1, v0: headY - band.max, v1: headY - band.min }, top };
}

/** Distance of a point from a vertical line through (x, z). */
export function planDist(p: Vec3, x: number, z: number): number {
  return Math.hypot(p.x - x, p.z - z);
}
