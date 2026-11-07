/**
 * One read with its three faces: loading / UNREADABLE / the answer. "Truly
 * empty" is the answer being an empty list, decided by the screen, and a failed
 * read is never that.
 *
 * A failed REFRESH keeps what is on screen (`stale` says so); only a read that
 * has never answered shows the unreadable face. Answers that arrive after a
 * newer read started, or after the screen left, land nowhere.
 */
import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';
import type { ForumResult } from './types.ts';

export type ForumRead<T> = {
  face: 'loading' | 'unreadable' | 'ready';
  value: T | null;
  /** The words to show on the unreadable face. */
  error: string | null;
  /** The refusal code, so "closed" and "sign in" can differ from "no network". */
  code: string | null;
  /** The last refresh failed; `value` is older than it looks. */
  stale: boolean;
  /** Read again, keeping what is on screen until the answer lands. */
  reload: () => Promise<void>;
  /** Change what is on screen to match a write's answer. */
  patch: (fn: (value: T) => T) => void;
};

export function useForumRead<T>(load: () => Promise<ForumResult<T>>, deps: DependencyList): ForumRead<T> {
  const [state, setState] = useState<{
    face: ForumRead<T>['face'];
    value: T | null;
    error: string | null;
    code: string | null;
    stale: boolean;
  }>({ face: 'loading', value: null, error: null, code: null, stale: false });
  const latest = useRef(load);
  latest.current = load;
  const generation = useRef(0);
  const alive = useRef(true);

  const read = useCallback(async () => {
    const mine = ++generation.current;
    const r = await latest.current();
    if (!alive.current || mine !== generation.current) return;
    setState((s) =>
      r.ok
        ? { face: 'ready', value: r.value, error: null, code: null, stale: false }
        : s.value !== null
          ? { ...s, stale: true }
          : { face: 'unreadable', value: null, error: r.error, code: r.code, stale: false },
    );
  }, []);

  useEffect(() => {
    alive.current = true;
    setState((s) => (s.value === null ? { ...s, face: 'loading', error: null, code: null } : s));
    void read();
    return () => {
      alive.current = false;
    };
    // The caller's deps decide when this is a different read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const patch = useCallback((fn: (value: T) => T) => {
    setState((s) => (s.value === null ? s : { ...s, value: fn(s.value) }));
  }, []);

  return { ...state, reload: read, patch };
}
