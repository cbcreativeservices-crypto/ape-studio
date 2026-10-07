/**
 * The Mixing Guides read record — pure (node-tested); the store is
 * readProgress.ts. Reading only ever grows (credit is never removed).
 */
export type GuidesRead = { v: 1; read: string[] };

export const EMPTY_READ = (): GuidesRead => ({ v: 1, read: [] });
export const isGuideId = (x: unknown): x is string => typeof x === 'string' && /^[a-z0-9-]{1,48}$/.test(x);

/** Pure: a clean record from anything (bad entries dropped, never thrown on). */
export function sanitizeGuidesRead(raw: unknown): GuidesRead {
  const read = (raw as { read?: unknown } | null)?.read;
  return { v: 1, read: Array.isArray(read) ? [...new Set(read.filter(isGuideId))] : [] };
}

/** Pure: stored ∪ held — reading only ever grows. */
export function mergeGuidesRead(a: GuidesRead, b: GuidesRead): GuidesRead {
  return { v: 1, read: [...new Set([...a.read, ...b.read])] };
}

/** Pure: the record with one more guide read (the same object when it already is). */
export function withRead(p: GuidesRead, id: string): GuidesRead {
  return p.read.includes(id) ? p : { v: 1, read: [...p.read, id] };
}

