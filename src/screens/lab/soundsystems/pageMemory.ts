/**
 * Sound Systems Lab — per-page working memory for the session.
 *
 * SsPagedLab renders one page at a time, so BACK / CONTINUE unmount the page
 * and a half-built capstone, a routed console or a line check's marks were
 * lost (bug hunt 2026-09-29). `usePageMemory` is `useState` whose value also
 * lands in a module-level map keyed by lab (mode) id + page index + name, so
 * the page comes back as it was left. Session only: nothing is persisted, an
 * app restart starts clean, and saved progress still lives in
 * ape:<labId>:v1 as before.
 */
import { createContext, useContext, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { sessionCarryEpoch } from '../../../features/lab/sessionCarry';

const memory = new Map<string, unknown>();

/**
 * WHOSE working state this is (full run 1, 2026-10-01). The map is
 * module-level, so it outlived a sign-out: the next person to sign in (or a
 * Guest Mode start) re-mounted the previous account's finished capstone,
 * routed console or completed exercise — and those pages complete themselves
 * on mount (markCapstonePassed / markRouteDone / markOperateDone + the page's
 * markDone), crediting the new account with the old one's work. The shared
 * ledger's epoch moves exactly when held work stops belonging to the same
 * person (a sign-out, an account change, a fresh Guest Mode) and NOT when a
 * guest signs in (their own work, carried) — so the map is dropped then.
 */
let memoryEpoch = sessionCarryEpoch();
function liveMemory(): Map<string, unknown> {
  const e = sessionCarryEpoch();
  if (e !== memoryEpoch) {
    memory.clear();
    memoryEpoch = e;
  }
  return memory;
}

/** `${labId}:${pageIndex}` — provided by SsPagedLab around the current page. */
export const PageMemoryKey = createContext<string>('');

/** RESET (bug hunt 2026-09-30): drop every page's working state for these
 *  modes, or a reset capstone / route / line check re-mounted finished and
 *  re-completed itself on the next visit. */
export function clearPageMemory(labIds: readonly string[]): void {
  const mem = liveMemory();
  for (const k of Array.from(mem.keys())) {
    if (labIds.some((id) => k.startsWith(`${id}:`))) mem.delete(k);
  }
}

export function usePageMemory<T>(name: string, init: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const scope = useContext(PageMemoryKey);
  const key = `${scope}:${name}`;
  const [value, setValue] = useState<T>(() => {
    const mem = liveMemory();
    return scope && mem.has(key) ? (mem.get(key) as T) : typeof init === 'function' ? (init as () => T)() : init;
  });
  useEffect(() => {
    if (scope) liveMemory().set(key, value);
  }, [scope, key, value]);
  return [value, setValue];
}
