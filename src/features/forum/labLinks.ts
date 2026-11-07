/**
 * Labs and the forum share ONE key: the lab's catalog name through labKeyOf, so
 * the Ask form's lab link, a lab card and "Discuss this lab" all mean the same
 * lab. The catalog is required when asked for, never at load: it stays out of
 * the start graph and out of any screen that does not need it.
 */
import { labForKey, labKeyOf, labNameForRoute } from './rules.ts';

function leaves() {
  const { LAB_CATEGORIES, categoryLeaves } = require('../../screens/lab/labCatalog') as typeof import('../../screens/lab/labCatalog');
  return LAB_CATEGORIES.flatMap((c) => categoryLeaves(c));
}

/** Every open lab's name, for the Ask form. */
export function labNames(): string[] {
  const names = leaves()
    .filter((l) => l.status !== 'development')
    .map((l) => l.name);
  return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}

/** The lab a screen is, by its route. Null for a route that is not a lab. */
export function labOfRoute(route: string, params?: Record<string, unknown> | null): { key: string; title: string } | null {
  const name = labNameForRoute(leaves(), route, params);
  return name ? { key: labKeyOf(name), title: name } : null;
}

/** Where a lab card opens. Null when that lab is no longer in the catalog. */
export function labTarget(key: string): { route: string; params?: object } | null {
  const leaf = labForKey(leaves(), key);
  return leaf?.route ? { route: leaf.route, params: leaf.params } : null;
}
