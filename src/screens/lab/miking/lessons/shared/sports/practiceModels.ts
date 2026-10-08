/**
 * The PRACTICE SCENES as engine models (frame P → engine mm by
 * venuePlan.toEngine): the practice field (B13, B12) and the practice line
 * (B14) — the parts, the target surfaces a zone measures to (capsule to the
 * source point), the keep-clear envelope, the views. Built once by group 2
 * (lab7-g5); group 3 builds its own scenes the same way. Pure.
 */
import type { Envelope, InstrumentModel, Part, Provenance, ReferenceSurface, Vec3 } from '../../../engine/model/types.ts';
import { toEngine, type VenueScene } from './venuePlan.ts';
import { PRACTICE_FIELD, PRACTICE_LINE } from './practiceScenes.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

/** A target surface: the source point, its plane facing back toward the line (+z). */
function targetSurface(scene: VenueScene, id: string, prefix: string): ReferenceSurface {
  const t = scene.targets.find((q) => q.id === id)!;
  return { id: `t${id}`, partId: `${prefix}.${id}`, label: `target ${id}`, point: toEngine(t.p, t.h), normal: v3(0, 0, 1), target: true, plus: { words: 'from', key: 'FROM' } };
}

/** Engine model of a practice scene. `src`: the lesson whose layout it is. */
/** Exported for Lab 7 group 3 (B08's venues): any VenueScene as an engine model. */
export function sceneModel(o: { scene: VenueScene; id: string; name: string; prefix: string; variant: { id: string; label: string; blurb: string; phrase: string }; src: string; parts: { id: string; label: string; short: string; role: string; lesson: boolean }[]; views: InstrumentModel['views'] }): InstrumentModel {
  const LESSON: Provenance = { kind: 'trial', src: o.src, note: 'the lesson’s own practice geometry, CONFIRMED by calculation' };
  const DD = ill('a drawing default (the practice scene’s other places)');
  const parts: Part[] = o.parts.map((p) => ({ id: `${o.prefix}.${p.id}`, label: p.label, short: p.short, role: p.role, prov: p.lesson ? LESSON : DD }));
  const envelopes: Envelope[] = o.scene.keepClear.map((k) => {
    const xs = k.poly.map((q) => q.x * 1000);
    const zs = k.poly.map((q) => -q.y * 1000);
    return { id: `env.${k.id}`, label: `${k.label} (keep clear)`, shape: { kind: 'box', min: v3(Math.min(...xs), -2500, Math.min(...zs)), max: v3(Math.max(...xs), 0, Math.max(...zs)) }, prov: LESSON };
  });
  return {
    id: o.id,
    name: o.name,
    parts,
    regions: o.scene.targets.map((t) => ({ id: `r.${t.id}`, partId: `${o.prefix}.${t.id}`, label: `target ${t.id}`, anchor: toEngine(t.p, t.h), prov: LESSON, note: `Ordinary speech and gentle claps at ${t.id}.` })),
    surfaces: [{ id: 'ground', partId: `${o.prefix}.area`, label: 'the ground', point: v3(0, 0, 0), normal: v3(0, -1, 0), plus: { words: 'above', key: 'ABOVE' } }, ...o.scene.targets.map((t) => targetSurface(o.scene, t.id, o.prefix))],
    lines: [{ id: 'line', label: 'the line', point: v3(0, 0, 0), dir: v3(1, 0, 0), words: { plus: 'from the line', minus: 'from the line', keyPlus: 'FROM LINE', keyMinus: 'FROM LINE' } }],
    envelopes,
    variants: [o.variant],
    defaultVariant: o.variant.id,
    views: o.views,
    fitAuthored: { side: true, top: true },
    yFloor: { mm: 0, prov: ill('the ground: the frame’s origin') },
    interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
    ports: { [o.variant.id]: null },
    // A stand mic stands straight under its tail (a zero-length level boom), as F10.
    mountRule: { boom: 'level', fallback: v3(0, 0, 1), length: 0, fixed: true },
    // The mics face into the field or court (−z): aimVec(−90°, 0) = (0, 0, −1).
    aimHome: { az: -90, el: 0 },
    viewTags: { side: 'SIDE · ALONG THE LINE', top: 'TOP · FROM ABOVE' },
    labelMinScale: 0.02,
  };
}

const FIELD_PARTS = [
  { id: 'area', label: 'the practice rectangle (30 × 20 m)', short: 'field', role: 'An inactive, authorized training area: the source assistant walks only inside it; every mic and observer stays outside.', lesson: true },
  { id: 'A', label: 'target A (15, 4) — 10 m straight ahead of M', short: 'A', role: 'The near target: 10.0 m from M, straight ahead. The baseline for every comparison.', lesson: true },
  { id: 'B', label: 'target B (5, 10) — 18.9 m, 32° left', short: 'B', role: 'Farther and off to the left: 18.9 m from M, 32° left of straight ahead.', lesson: true },
  { id: 'C', label: 'target C (15, 18) — 24 m straight ahead', short: 'C', role: 'The far target: 24.0 m from M, straight ahead.', lesson: true },
  { id: 'M', label: 'comparison mark M (15, −6)', short: 'M', role: 'Where the action mics are compared — one at a time: two capsules standing side by side do not share a coordinate.', lesson: true },
  { id: 'E', label: 'the fixed ambience mark E', short: 'E', role: 'A separately approved ambience position in the crew strip: the stable bed under the action mics.', lesson: false },
  { id: 'offset', label: 'the 6 m practice offset (keep clear)', short: 'offset', role: 'Between the rectangle and the crew strip. The 6 m is this practice’s own layout, not a sport’s rule — it may be made larger.', lesson: true },
];

/** The practice field as an engine model (B13, B12). */
export function fieldModel(id: string, src: string): InstrumentModel {
  return sceneModel({
    scene: PRACTICE_FIELD,
    id,
    name: 'a practice field with its comparison mark',
    prefix: 'pf',
    variant: { id: 'field', label: 'PRACTICE FIELD', blurb: 'A 30 × 20 m rectangle on an inactive training field: M 6 m outside it, targets A, B and C inside.', phrase: 'on the practice field' },
    src,
    parts: FIELD_PARTS,
    views: { side: { u0: -3000, u1: 35500, v0: -3200, v1: 400 }, top: { u0: -3000, u1: 35500, v0: -22000, v1: 10500 } },
  });
}

/** The practice line as an engine model (B14). */
export function lineModel(id: string, src: string): InstrumentModel {
  return sceneModel({
    scene: PRACTICE_LINE,
    id,
    name: 'a mock boundary with its mic mark',
    prefix: 'pl',
    variant: { id: 'line', label: 'PRACTICE LINE', blurb: 'A straight mock boundary on an inactive dry floor: A, B and C at 2, 5 and 8 m inside it, the mic mark M 3 m outside.', phrase: 'at the practice line' },
    src,
    parts: [
      { id: 'area', label: 'the cleared inside area', short: 'inside', role: 'Where the source participant walks — only there. No mic, stand or observer inside the line.', lesson: true },
      { id: 'A', label: 'source point A, 2 m inside', short: 'A', role: 'The near point: 5 m from M.', lesson: true },
      { id: 'B', label: 'source point B, 5 m inside', short: 'B', role: 'The middle point: 8 m from M.', lesson: true },
      { id: 'C', label: 'source point C, 8 m inside', short: 'C', role: 'The far point: 11 m from M.', lesson: true },
      { id: 'M', label: 'the mic mark M, 3 m outside', short: 'M', role: 'Where the mics stand, in the outside zone with the observers.', lesson: true },
      { id: 'M2', label: 'a second approved mic position', short: 'M2', role: 'A second approved place for the overlap trial — along the line from M.', lesson: false },
    ],
    views: { side: { u0: -7500, u1: 7500, v0: -2500, v1: 400 }, top: { u0: -7500, u1: 7500, v0: -10500, v1: 5500 } },
  });
}
