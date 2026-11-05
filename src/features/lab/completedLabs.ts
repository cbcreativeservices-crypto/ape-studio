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
 *
 * THE SERVER'S RECORD COUNTS TOO (bug test 2026-11-05, item 4): on a new phone
 * the device holds nothing until the server's lab record comes back, so an
 * empty list is only "none yet" once that read has answered. While it is out
 * the face is loading; if it failed, or never answers, unreadable with a retry.
 * Labs the device already knows are shown either way.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  hydrateLabCompletion,
  retryLabServerCredit,
  useLabCompletionUnreadable,
  useLabKeysDone,
  useLabServerCreditRead,
  type LabServerRead,
} from './labCompletion';
import { creditLabs, type CreditLab } from './creditLabs';

export type { CreditLab } from './creditLabs';

export type CompletedLabs =
  | { status: 'loading' }
  | { status: 'unreadable' }
  | { status: 'ready'; labs: CreditLab[] };

/** Past the client's own request budget (FETCH_DEADLINE_MS, 30 s): the sign-in
 *  answer or the server read has stalled, so loading stops and Retry shows. */
export const SERVER_READ_STALL_MS = 35000;

/** Which face to show (pure; pinned by test/progressLabs_20261029). */
export function completedLabsFace(unreadable: boolean, loaded: boolean, labs: CreditLab[], server: LabServerRead): CompletedLabs {
  if (unreadable) return { status: 'unreadable' };
  if (!loaded) return { status: 'loading' };
  // Only an EMPTY list waits on the server: what the device knows is real.
  if (labs.length === 0 && server === 'failed') return { status: 'unreadable' };
  if (labs.length === 0 && server === 'pending') return { status: 'loading' };
  return { status: 'ready', labs };
}

/** The learner's completed labs, live. `retry` reads the device record and the
 *  server's record again (after an unreadable read). */
export function useCompletedLabs(): { state: CompletedLabs; retry: () => void } {
  const all = creditLabs();
  const keys = useMemo(() => all.map((l) => l.key), [all]);
  const done = useLabKeysDone(keys);
  const unreadable = useLabCompletionUnreadable();
  const server = useLabServerCreditRead();
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
  // A read that never answers is treated as failed, so loading always ends.
  const [stalled, setStalled] = useState(false);
  useEffect(() => {
    setStalled(false);
    if (server !== 'pending') return;
    const timer = setTimeout(() => setStalled(true), SERVER_READ_STALL_MS);
    return () => clearTimeout(timer);
  }, [server, attempt]);
  const labs = useMemo(() => all.filter((l) => done.has(l.key)), [all, done]);
  const retry = () => {
    setAttempt((n) => n + 1);
    void retryLabServerCredit();
  };
  return { state: completedLabsFace(unreadable, loaded, labs, stalled ? 'failed' : server), retry };
}
