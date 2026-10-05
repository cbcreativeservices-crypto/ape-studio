/**
 * SMALL-PERCUSSION FAMILY — one helper that assembles a hand-percussion
 * InstrumentModel from a lesson's own parts and STATES (pure; tested). Every
 * state brings: the instrument's parts (solids), its motion envelope E, the
 * player's arms (shoulder → elbow → wrist → grip), the reference point the
 * lesson measures from, and the CLEARANCE line round E. The standing body,
 * the floor and the level boom are the family's. Frame H (geom.ts).
 */
import type { Envelope, InstrumentModel, Part, Provenance, RadiatingRegion, ReferenceSurface, RefLine, Variant, Vec3, ViewBox } from '../../../engine/model/types.ts';
import { armEnvelopes, clearLine, ill, LEVEL_BOOM, standingBody, targetSurface, v3, type Arm } from './geom.ts';

export type StateSpec = {
  variant: Variant;
  parts: Part[];
  /** The instrument's own motion envelope E: a capsule (a–b, radius r). */
  motion: { a: Vec3; b: Vec3; r: number; label: string; prov: Provenance };
  arms: { id: string; label: string; arm: Arm; sweep?: number }[];
  /** The point the lesson's distances are measured from (a TARGET). */
  ref: { id: string; partId: string; label: string; point: Vec3; normal: Vec3 };
  /** Extra reference surfaces (a slot, a port, a strike spot). */
  surfaces?: ReferenceSurface[];
  regions?: RadiatingRegion[];
  /** Extra keep-outs (a stand, a table, the neighbouring hand). */
  envelopes?: Envelope[];
};

export function smallPercModel(o: {
  id: string;
  name: string;
  states: StateSpec[];
  views: { side: ViewBox; top: ViewBox };
  viewsByVariant?: InstrumentModel['viewsByVariant'];
  /** Extra parts every state shares (a table, a stand). */
  shared?: Part[];
  body?: boolean;
}): InstrumentModel {
  const parts: Part[] = [...(o.shared ?? [])];
  const envelopes: Envelope[] = [];
  const surfaces: ReferenceSurface[] = [];
  const lines: RefLine[] = [];
  const regions: RadiatingRegion[] = [];
  for (const s of o.states) {
    const v = s.variant.id;
    for (const p of s.parts) parts.push({ ...p, variants: p.variants ?? [v] });
    envelopes.push({ id: `env.motion.${v}`, label: s.motion.label, shape: { kind: 'capsule', a: s.motion.a, b: s.motion.b, r: s.motion.r }, prov: s.motion.prov, variants: [v] });
    for (const a of s.arms) envelopes.push(...armEnvelopes(`env.${a.id}.${v}`, a.label, a.arm, [v], a.sweep ?? 0));
    for (const e of s.envelopes ?? []) envelopes.push({ ...e, variants: e.variants ?? [v] });
    surfaces.push(targetSurface(s.ref.id, s.ref.partId, s.ref.label, s.ref.point, s.ref.normal, [v]));
    for (const x of s.surfaces ?? []) surfaces.push({ ...x, variants: x.variants ?? [v] });
    lines.push(clearLine(`clear.${v}`, s.motion.label, s.motion.a, s.motion.b, s.motion.r, [v]));
    for (const r of s.regions ?? []) regions.push({ ...r, variants: r.variants ?? [v] });
  }
  if (o.body !== false) envelopes.push(standingBody());
  const variants = o.states.map((s) => s.variant);
  return {
    id: o.id,
    name: o.name,
    parts,
    regions,
    surfaces,
    lines,
    envelopes,
    variants,
    defaultVariant: variants[0].id,
    views: o.views,
    ...(o.viewsByVariant ? { viewsByVariant: o.viewsByVariant } : {}),
    viewTags: { side: 'SIDE', top: 'FROM ABOVE' },
    yFloor: { mm: 0, prov: ill('the floor is the frame’s origin') },
    // No inside: these instruments have no interior a mic can enter.
    interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
    ports: Object.fromEntries(variants.map((v) => [v.id, null])),
    mountRule: LEVEL_BOOM,
  };
}
