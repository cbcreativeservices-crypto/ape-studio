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

const memory = new Map<string, unknown>();

/** `${labId}:${pageIndex}` — provided by SsPagedLab around the current page. */
export const PageMemoryKey = createContext<string>('');

export function usePageMemory<T>(name: string, init: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const scope = useContext(PageMemoryKey);
  const key = `${scope}:${name}`;
  const [value, setValue] = useState<T>(() =>
    scope && memory.has(key) ? (memory.get(key) as T) : typeof init === 'function' ? (init as () => T)() : init,
  );
  useEffect(() => {
    if (scope) memory.set(key, value);
  }, [scope, key, value]);
  return [value, setValue];
}
