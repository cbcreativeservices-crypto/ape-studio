/**
 * labMembership — the members-only rule, keyed by SCREEN ROUTE, as a PURE
 * derivation over the catalog (no runtime import of labCatalog, so node:test
 * covers it directly — labCatalog itself pulls in the calc registry, which is
 * Metro-only).
 *
 * This is the ONE source of truth the Ear Lab's row locks and the deep-link /
 * pendingLink screen gate (withMembershipPreview) both read, so a lab can never
 * be locked in the list yet open live via `proaudio://labs/<lab>` (the
 * navigation/notifications bug hunt 2026-09-14, finding E1).
 *
 * The rule mirrors EarLabScreen's `leafLocked`: a lab is members-only when its
 * category section is 'training' or the leaf carries `member: true` — UNLESS the
 * category is `alwaysFree` (the Calculator Laboratory). A route is reported
 * members-only only if EVERY catalog occurrence of it is members-only, so a
 * route that is free in any context is never gated for a non-member entitled to
 * it.
 */
import type { LabCategory, LabLeaf } from './labCatalog';

export type RouteMembership = { name: string; memberOnly: boolean };

/** All routed leaves of a category, flattened (families, loose labs, extras).
 *  Inlined rather than importing labCatalog.categoryLeaves so this module stays
 *  free of the calc-registry import chain. */
function leavesOf(cat: LabCategory): LabLeaf[] {
  if (cat.kind === 'hub') return cat.extraLabs ?? [];
  return [...(cat.families ?? []).flatMap((f) => f.labs), ...(cat.labs ?? []), ...(cat.extraLabs ?? [])];
}

/** Build the route → membership map from catalog categories. */
export function computeLabRouteMembership(
  cats: readonly LabCategory[],
): Map<string, RouteMembership> {
  const m = new Map<string, RouteMembership>();
  const note = (route: string | undefined, name: string, memberOnly: boolean) => {
    if (!route) return;
    const prev = m.get(route);
    // memberOnly holds only while EVERY occurrence is members-only.
    m.set(route, { name: prev?.name ?? name, memberOnly: (prev?.memberOnly ?? true) && memberOnly });
  };
  for (const cat of cats) {
    const sectionMember = cat.section === 'training' && !cat.alwaysFree;
    if (cat.kind === 'hub') note(cat.route, cat.name, sectionMember);
    for (const leaf of leavesOf(cat)) {
      note(leaf.route, leaf.name, (sectionMember || !!leaf.member) && !cat.alwaysFree);
    }
  }
  return m;
}
