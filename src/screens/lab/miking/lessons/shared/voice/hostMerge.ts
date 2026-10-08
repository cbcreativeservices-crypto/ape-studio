/**
 * ONE LESSON, SEVERAL HOSTS (Lab 5): a singer behind a guitar, a singer at a
 * piano, a band — each variant is a whole scene from an existing family
 * (the guitar family's seated player, the piano lesson's grand and pianist),
 * in that family's own frame. `mergeHosts` puts them in one InstrumentModel:
 * every part, surface, line, region, envelope and rim of a host is kept for
 * ITS variant only (re-tagged), each variant keeps its own views, floor,
 * boom route and inset, and nothing is renamed — so the families' art, hit
 * tests and labels keep working on their own ids. `retagZones` does the
 * same for a host lesson's suggested starting points (their validated
 * start poses are unchanged; validateLesson re-checks them in the merged
 * model). Pure.
 *
 * Model-level fields that cannot be per variant (the aim's home and swing,
 * the authored-fit views, the mount rule) are the caller's.
 */
import type { DocumentedZone, InstrumentModel, Variant, VariantId, ViewBox, ViewId } from '../../../engine/model/types.ts';
import { viewsOf } from '../../../engine/model/types.ts';

export type Host = {
  /** The variant id in the merged lesson. */
  variant: VariantId;
  /** Its label and blurb on the variant chooser. */
  info: Variant;
  model: InstrumentModel;
  /** The host model's own variant this one is (default: the same id). */
  from?: VariantId;
};

const inFrom = (vs: readonly VariantId[] | undefined, from: VariantId) => !vs || vs.includes(from);

export function mergeHosts(hosts: readonly Host[], o: Pick<InstrumentModel, 'id' | 'name'> & Partial<Pick<InstrumentModel, 'aimHome' | 'aimAzLimit' | 'fitAuthored' | 'labelMinScale' | 'viewTags'>>): InstrumentModel {
  const parts: InstrumentModel['parts'] = [];
  const regions: InstrumentModel['regions'] = [];
  const surfaces: InstrumentModel['surfaces'] = [];
  const lines: InstrumentModel['lines'] = [];
  const envelopes: InstrumentModel['envelopes'] = [];
  const rims: NonNullable<InstrumentModel['rims']> = [];
  const viewsByVariant: NonNullable<InstrumentModel['viewsByVariant']> = {};
  const yFloorByVariant: NonNullable<InstrumentModel['yFloorByVariant']> = {};
  const boomRoute: NonNullable<InstrumentModel['boomRoute']> = {};
  const insetAt: Record<VariantId, 'top' | 'bottom'> = {};
  const insetKeepClear: NonNullable<InstrumentModel['insetKeepClear']> = {};
  const ports: InstrumentModel['ports'] = {};
  const seen = new Set<string>();
  const unique = (kind: string, id: string) => {
    const k = `${kind}:${id}`;
    if (seen.has(k)) throw new Error(`mergeHosts: ${kind} ${id} appears in two hosts`);
    seen.add(k);
  };
  for (const h of hosts) {
    const from = h.from ?? h.variant;
    const only = [h.variant];
    const m = h.model;
    for (const p of m.parts) if (inFrom(p.variants, from)) (unique('part', p.id), parts.push({ ...p, variants: only, ...(p.listIn ? { listIn: p.listIn.includes(from) ? only : [] } : {}) }));
    for (const r of m.regions) if (inFrom(r.variants, from)) (unique('region', r.id), regions.push({ ...r, variants: only }));
    for (const s of m.surfaces) if (inFrom(s.variants, from)) (unique('surface', s.id), surfaces.push({ ...s, variants: only }));
    for (const l of m.lines) if (inFrom(l.variants, from)) (unique('line', l.id), lines.push({ ...l, variants: only }));
    for (const e of m.envelopes) if (inFrom(e.variants, from)) (unique('envelope', e.id), envelopes.push({ ...e, variants: only }));
    for (const r of m.rims ?? []) if (inFrom(r.variants, from)) (unique('rim', r.id), rims.push({ ...r, variants: only }));
    viewsByVariant[h.variant] = viewsOf(m, from);
    yFloorByVariant[h.variant] = m.floorByVariant?.[from] ?? m.yFloorByVariant?.[from] ?? m.yFloor.mm;
    const route = m.boomRoute?.[from];
    if (route) boomRoute[h.variant] = route;
    const at = typeof m.insetAt === 'string' ? m.insetAt : m.insetAt?.[from];
    if (at) insetAt[h.variant] = at;
    const keep = m.insetKeepClear?.[from];
    if (keep) insetKeepClear[h.variant] = keep;
    ports[h.variant] = null;
  }
  const first = hosts[0];
  return {
    id: o.id,
    name: o.name,
    parts,
    regions,
    surfaces,
    lines,
    envelopes,
    variants: hosts.map((h) => h.info),
    defaultVariant: first.variant,
    views: viewsByVariant[first.variant] as Partial<Record<ViewId, ViewBox>>,
    viewsByVariant,
    yFloor: first.model.yFloor,
    yFloorByVariant,
    // No host's "inside" carries across frames: nothing counts as inside.
    interior: { x0: 0, x1: 0, rIn: 0, c: { x: 0, y: 0, z: 0 } },
    rims,
    ports,
    boomRoute,
    insetAt,
    insetKeepClear,
    ...(o.aimHome ? { aimHome: o.aimHome } : {}),
    ...(o.aimAzLimit ? { aimAzLimit: o.aimAzLimit } : {}),
    ...(o.fitAuthored ? { fitAuthored: o.fitAuthored } : {}),
    ...(o.labelMinScale ? { labelMinScale: o.labelMinScale } : {}),
    ...(o.viewTags ? { viewTags: o.viewTags } : {}),
  };
}

/** A host lesson's zones for one of its variants, re-tagged to the merged
 *  variant (ids and start poses unchanged unless `rename` says). */
export function retagZones(zones: readonly DocumentedZone[], from: VariantId, to: VariantId, rename?: (id: string) => string): DocumentedZone[] {
  return zones
    .filter((z) => {
      const rq = z.requires;
      if (!rq) return true;
      if (rq.variant) return rq.variant === from;
      if (rq.variants) return rq.variants.includes(from);
      return true;
    })
    .map((z) => {
      const { variants: _v, variant: _w, ...rest } = z.requires ?? {};
      return { ...z, id: rename ? rename(z.id) : z.id, requires: { ...rest, variant: to } };
    });
}
