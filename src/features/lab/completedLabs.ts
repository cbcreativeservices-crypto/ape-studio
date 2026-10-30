/**
 * completedLabs — the learner's completed labs, for the Progress LABS tile and
 * its list (owner 2026-10-29: "add a LABS container beside TOPICS … labs
 * completed and which ones").
 *
 * NO TOTAL (owner 2026-10-29): "not everyone is enrolled in all or intends to
 * do all so then the 'out of' sounds intimidating and defeating". What the
 * learner HAS done — a count and the names — never "N of 50".
 *
 * The record is the existing lab-credit store (labCompletion: isLabDone =
 * server-confirmed OR complete on this device). Nothing new is stored. A
 * failed device read is UNREADABLE, never "no labs done" (AGENTS.md: three
 * faces — loading / unreadable / truly empty).
 */
import { useEffect, useMemo, useState } from 'react';
import { hydrateLabCompletion, useLabCompletionUnreadable, useLabKeysDone } from './labCompletion';
import { creditLabs, type CreditLab } from './creditLabs';

export type { CreditLab } from './creditLabs';

export type CompletedLabs =
  | { status: 'loading' }
  | { status: 'unreadable' }
  | { status: 'ready'; labs: CreditLab[] };

/** Which face to show (pure; pinned by test/progressLabs_20261029). */
export function completedLabsFace(unreadable: boolean, loaded: boolean, labs: CreditLab[]): CompletedLabs {
  if (unreadable) return { status: 'unreadable' };
  if (!loaded) return { status: 'loading' };
  return { status: 'ready', labs };
}

/** The learner's completed labs, live. `retry` reads the device record again
 *  (after an unreadable read). */
export function useCompletedLabs(): { state: CompletedLabs; retry: () => void } {
  const all = creditLabs();
  const keys = useMemo(() => all.map((l) => l.key), [all]);
  const done = useLabKeysDone(keys);
  const unreadable = useLabCompletionUnreadable();
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    // Resolves on a failed read too — `unreadable` then says so.
    void hydrateLabCompletion().then(() => {
      if (live) setLoaded(true);
    });
    return () => {
      live = false;
    };
  }, [attempt]);
  const labs = useMemo(() => all.filter((l) => done.has(l.key)), [all, done]);
  return { state: completedLabsFace(unreadable, loaded, labs), retry: () => setAttempt((n) => n + 1) };
}
