/**
 * validateLesson — the invariants every lesson must hold (blueprint §3).
 * Returns a list of problems; [] = valid. Used by the tests and by the
 * registry (a lesson that fails is never marked ready). Pure.
 */
import type { Lesson, MicBody, MicType, Dim, PageContent, SourcePageId } from './types.ts';
import { LEGACY_PAGE_IDS, PAGE_IDS } from './types.ts';
import { checkAssembly, compileScene, pinToSurface } from '../geometry/collision.ts';
import { inZone } from '../geometry/zones.ts';
import { journeyPageOf, validateQuickCheck } from '../journey.ts';
import { isRetired, pageOf, quickCheckOf } from '../restructure.ts';

export function micBodyOf(t: MicType): MicBody {
  return { length: t.body.length.mm, radius: t.body.radius.mm, mount: t.mount, surfacePartId: t.surfacePartId, ...(t.clip ? { reach: t.clip.reach.mm } : {}), ...(t.pop ? { pop: { gap: t.pop.gap.mm, r: t.pop.r.mm } } : {}), id: t.id, ...(t.clip?.arm ? { armR: t.clip.arm.mm } : {}), ...(t.body.fore ? { fore: t.body.fore.mm } : {}), ...(t.clip?.style ? { armStyle: t.clip.style } : {}), ...(t.clip?.elbow ? { elbow: { a: t.clip.elbow.a.mm, b: t.clip.elbow.b.mm } } : {}) };
}

export function validateLesson(lesson: Lesson, micTypes: Record<string, MicType>): string[] {
  const out: string[] = [];
  const m = lesson.model;
  const partIds = new Set<string>();
  for (const p of m.parts) {
    if (partIds.has(p.id)) out.push(`duplicate part id ${p.id}`);
    partIds.add(p.id);
  }
  const variantIds = new Set(m.variants.map((v) => v.id));
  if (!variantIds.has(m.defaultVariant)) out.push(`default variant ${m.defaultVariant} is not a variant`);
  for (const v of variantIds) if (!(v in m.ports)) out.push(`variant ${v} has no port entry`);
  for (const r of m.regions) if (!partIds.has(r.partId)) out.push(`region ${r.id}: part ${r.partId} missing`);
  for (const s of m.surfaces) {
    if (!partIds.has(s.partId)) out.push(`surface ${s.id}: part ${s.partId} missing`);
    const l = Math.hypot(s.normal.x, s.normal.y, s.normal.z);
    if (Math.abs(l - 1) > 1e-9) out.push(`surface ${s.id}: normal is not a unit vector`);
  }
  const surfaceIds = new Set(m.surfaces.map((s) => s.id));
  const lineIds = new Set(m.lines.map((l) => l.id));
  for (const id of lesson.micTypeIds) if (!micTypes[id]) out.push(`mic type ${id} missing`);

  // An UNKNOWN dimension may be drawn only as a flagged placeholder.
  const dims: [string, Dim | undefined][] = [['yFloor', m.yFloor], ...m.parts.map((p) => [`${p.id}.clearance`, p.clearance] as [string, Dim | undefined])];
  for (const [name, d] of dims) {
    if (d && d.prov.kind === 'unknown' && !d.placeholder) out.push(`${name}: unknown dimension without the placeholder flag`);
    if (d && d.placeholder && !lesson.unknowns.some((u) => u.dims.includes(name.split('.')[0]) || u.dims.includes(name.replace(/\.clearance$/, '')))) out.push(`${name}: placeholder not listed in unknowns`);
  }

  const zoneIds = new Set<string>();
  for (const z of lesson.zones) {
    if (zoneIds.has(z.id)) out.push(`duplicate zone ${z.id}`);
    zoneIds.add(z.id);
    if (!surfaceIds.has(z.refSurface)) out.push(`zone ${z.id}: surface ${z.refSurface} missing`);
    if (z.radial && !lineIds.has(z.radial.line)) out.push(`zone ${z.id}: line ${z.radial.line} missing`);
    if (!z.src) out.push(`zone ${z.id}: no src`);
    if (!z.quote) out.push(`zone ${z.id}: no quote`);
    if (z.distance.min > z.distance.max) out.push(`zone ${z.id}: min > max`);
    if (z.radial && z.radial.min != null && z.radial.max != null && z.radial.min > z.radial.max) out.push(`zone ${z.id}: radial min > max`);
    if (/\bresult\b/i.test(z.tendency)) out.push(`zone ${z.id}: tendency says "result"`);
    const types = z.requires?.micTypeIds ?? lesson.micTypeIds;
    for (const t of types) if (!micTypes[t]) out.push(`zone ${z.id}: mic type ${t} missing`);
    const t = micTypes[types[0]];
    if (!t) continue;
    if (z.requires?.mount && z.requires.mount !== t.mount) out.push(`zone ${z.id}: first mic type's mount is not ${z.requires.mount}`);
    const body = micBodyOf(t);
    const variants = z.requires?.variant ? [z.requires.variant] : z.requires?.variants ? [...z.requires.variants] : [...variantIds];
    for (const v of variants) if (!variantIds.has(v)) out.push(`zone ${z.id}: variant ${v} is not a variant`);
    for (const v of variants) {
      const scene = compileScene(m, v);
      let pose = z.start;
      if (t.mount === 'surface') {
        const sp = m.parts.find((p) => p.id === t.surfacePartId);
        if (!sp || sp.solid?.kind !== 'box') {
          out.push(`zone ${z.id}: surface part ${t.surfacePartId} is not a box`);
          continue;
        }
        pose = pinToSurface(pose, sp.solid, body, (t.body.width?.mm ?? 0) / 2);
      }
      const hit = checkAssembly(scene, pose, body);
      if (hit) out.push(`zone ${z.id}: start pose collides with ${hit.partId} (${hit.piece}) in variant ${v}`);
      const ok = inZone(z, { scene, surfaces: m.surfaces, lines: m.lines, variant: v, micTypeId: t.id, mount: t.mount }, pose);
      if (!ok) out.push(`zone ${z.id}: start pose is not inside the zone in variant ${v}`);
    }
  }

  // The pages as WRITTEN: the core pages, and either the three source pages
  // the journey builds MEET IT and STARTING SETUPS from, or those two pages.
  const pages = lesson.pages as Partial<Record<SourcePageId, PageContent>>;
  for (const id of PAGE_IDS) if (id !== 'meet' && id !== 'setups' && !pages[id]) out.push(`page ${id} missing`);
  const legacy = LEGACY_PAGE_IDS.every((id) => pages[id]);
  if (!legacy && !(pages.meet && pages.setups)) out.push('pages: neither instrument/sound/setting nor meet/setups');
  const scenIds = new Set<string>();
  for (const s of lesson.scenarios) {
    if (scenIds.has(s.id)) out.push(`duplicate scenario ${s.id}`);
    scenIds.add(s.id);
    if (!s.options.includes(s.correct)) out.push(`scenario ${s.id}: correct is not an option`);
    if (new Set(s.options).size !== s.options.length) out.push(`scenario ${s.id}: duplicate options`);
  }
  for (const s of lesson.symptoms) if (!s.options.includes(s.correct)) out.push(`symptom ${s.id}: correct is not an option`);
  // A page's credited items: scenarios, order tasks and setup tasks.
  const credited: { id: string; page: SourcePageId }[] = [...lesson.scenarios, ...lesson.orderTasks, ...lesson.setupTasks];
  for (const s of lesson.symptoms) {
    for (const o of s.options) if (o !== s.correct && !s.why[o]) out.push(`symptom ${s.id}: no explanation for "${o}"`);
  }
  for (const s of lesson.scenarios) {
    for (const o of s.options) if (o !== s.correct && !s.why[o]) out.push(`scenario ${s.id}: no explanation for "${o}"`);
  }
  for (const t of lesson.setupTasks) if (t.setups.filter((x) => x.ok).length < 2) out.push(`setup task ${t.id}: fewer than two acceptable setups`);
  // Each written page credits only its own items…
  for (const id of Object.keys(pages) as SourcePageId[]) {
    const pg = pages[id];
    if (!pg) continue;
    for (const sid of pg.credit.scenarios) {
      const sc = credited.find((s) => s.id === sid);
      if (!sc) out.push(`page ${id}: credit scenario ${sid} missing`);
      else if (sc.page !== id && !(id === journeyPageOf(sc.page) && (id === 'meet' || id === 'setups'))) out.push(`page ${id}: credit scenario ${sid} belongs to page ${sc.page}`);
    }
  }
  // …and each journey page, as served, credits live items written for it.
  for (const id of PAGE_IDS) {
    for (const sid of pageOf(lesson, id).credit.scenarios) {
      const sc = credited.find((s) => s.id === sid);
      if (!sc) out.push(`journey page ${id}: credit scenario ${sid} missing`);
      else if (journeyPageOf(sc.page) !== id) out.push(`journey page ${id}: credit scenario ${sid} belongs to page ${sc.page}`);
      if (isRetired(lesson.id, sid)) out.push(`journey page ${id}: credits retired item ${sid}`);
    }
  }
  for (const q of validateQuickCheck(quickCheckOf(lesson))) out.push(q);
  if (pages.instrument && (pages.instrument.credit.scenarios.length || pages.instrument.credit.interactive)) out.push('page instrument (ORIENT) must carry no task');
  return out;
}
