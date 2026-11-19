/**
 * creditLabs — every catalog lab that earns credit, one row per server key
 * (owner 2026-10-29, the Progress LABS tile). Pure: no store, no React, so a
 * node test can read the real list (test/progressLabs_20261029).
 *
 * WHAT COUNTS AS A LAB (owner 2026-10-29): the af_* Audio Fundamentals labs and
 * the whole Training labs in trainingLabKeys (tr_*). Miking / Mixing / Ear
 * Training are credited lesson by lesson, not as one lab, so they are not rows
 * here. The Calculator Lab and Mixing Guides earn no credit.
 */
import { LAB_CATEGORIES, categoryEntries, type LabSection } from '../../screens/lab/labCatalog';
import type { RootStackParamList } from '../../navigation/types';
import { trainingKeyFor } from './trainingLabKeys';

export type CreditLab = {
  key: string;
  name: string;
  section: LabSection;
  route?: keyof RootStackParamList;
  params?: object;
};

let cache: readonly CreditLab[] | null = null;

/** In catalog order, Fundamentals first; the first catalog row for a key wins. */
export function creditLabs(): readonly CreditLab[] {
  if (cache) return cache;
  const out: CreditLab[] = [];
  const seen = new Set<string>();
  const order: LabSection[] = ['fundamentals', 'training'];
  for (const section of order) {
    for (const cat of LAB_CATEGORIES) {
      if (cat.section !== section) continue;
      for (const leaf of categoryEntries(cat)) {
        const key = leaf.key ?? (leaf.route ? trainingKeyFor(leaf.route) : '');
        if (!key || seen.has(key)) continue;
        seen.add(key);
        // A whole Training lab shelved in a Fundamentals group (Room Design & Monitoring sits under
        // Acoustics) earns a Training credit (tr_*), not a Fundamentals one: list it as Training,
        // so the tile never suggests it is part of the universal Fundamentals requirement
        // (owner 2026-11-19 [MD:D70]).
        const rowSection: LabSection = !leaf.key && key.startsWith('tr_') ? 'training' : section;
        out.push({ key, name: leaf.name, section: rowSection, route: leaf.route, params: leaf.params });
      }
    }
  }
  cache = out;
  return out;
}
