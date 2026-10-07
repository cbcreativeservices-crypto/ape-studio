/**
 * Mixing Guides — which guides the learner has READ (lab-local progress, like
 * the other training labs: ✓ per guide, "n of 50 read", the what's-left
 * screen). No certificate, no labCompletion call.
 *
 * On the shared safe store (createLocalStore, AGENTS.md): a failed READ is
 * UNREADABLE and never overwritten; a mark made before the read lands is
 * queued; the account wipe reaches it without a registry entry.
 *
 * WHO IS WRITTEN (the host decides from useTier(), every render — the same
 * rule as the Miking Labs' store):
 *   persistAllowed (free / member) → written;
 *   otherwise (unknown / guest)    → held for the sign-in hand-off
 *                                    (holdSessionWork) and shown this session;
 *   a members-only PREVIEW         → nothing at all (PREVIEW EARNS NOTHING).
 *
 * READ ONLY GROWS (owner 2026-09-29: credit is never removed): there is no
 * "unread"; reading a guide again is just reading it.
 */
import { useSyncExternalStore } from 'react';
import { getLabPreview } from '../../../features/lab/labPreviewStore';
import { holdSessionWork, registerSessionCarry } from '../../../features/lab/sessionCarry';
import { createLocalStore } from '../../../features/storage/localStore';
import { EMPTY_READ as EMPTY, isGuideId as isId, mergeGuidesRead, sanitizeGuidesRead, withRead, type GuidesRead } from './readRecord';

export type { GuidesRead } from './readRecord';

export const MIXING_GUIDES_KEY = 'ape:mixingGuides:v1';
const CARRY_KEY = 'mixingGuides';

const store = createLocalStore<GuidesRead>({
  key: MIXING_GUIDES_KEY,
  empty: EMPTY,
  parse: (p) => {
    if (!p || typeof p !== 'object' || Array.isArray(p)) throw new Error('not a mixing-guides record');
    return sanitizeGuidesRead(p);
  },
  onReset: () => setSession(EMPTY()),
});

/* ── this session's reading that is NOT written (a guest / unknown tier) ── */
let session: GuidesRead = EMPTY();
const listeners = new Set<() => void>();
function setSession(next: GuidesRead): void {
  session = next;
  for (const l of [...listeners]) l();
}

let saveBlocked = false;
/** Set by the host every render: !persistAllowed(useTier()). */
export function setGuidesSaveBlocked(blocked: boolean): void {
  saveBlocked = blocked;
}

registerSessionCarry<GuidesRead>(CARRY_KEY, (held) => store.mutate((s) => mergeGuidesRead(s, held)));

/** Mark one guide read: written, held, or (preview) dropped. Resolves true
 *  only when the device took the write ("✓ saved" only from a write result). */
export function markGuideRead(id: string): Promise<boolean> {
  if (!isId(id)) return Promise.resolve(false);
  if (getLabPreview().active) return Promise.resolve(false); // PREVIEW EARNS NOTHING
  if (saveBlocked) {
    setSession(withRead(session, id));
    holdSessionWork<GuidesRead>(CARRY_KEY, (prev) => withRead(prev ?? EMPTY(), id));
    void store.hydrate();
    return Promise.resolve(false);
  }
  return store.mutate((p) => withRead(p, id));
}

/* ── reading ── */
let viewCache: { base: GuidesRead; session: GuidesRead; out: GuidesRead } | null = null;
function view(): GuidesRead {
  const base = store.get();
  if (viewCache && viewCache.base === base && viewCache.session === session) return viewCache.out;
  const out = session.read.length ? mergeGuidesRead(base, session) : base;
  viewCache = { base, session, out };
  return out;
}
function subscribe(l: () => void): () => void {
  listeners.add(l);
  const off = store.subscribe(l);
  return () => {
    listeners.delete(l);
    off();
  };
}
export function getGuidesRead(): GuidesRead {
  return view();
}
export function useGuidesRead(): GuidesRead {
  return useSyncExternalStore(subscribe, view, view);
}
export function hydrateGuidesRead(): Promise<void> {
  return store.hydrate();
}
const unreadableSnap = () => store.isUnreadable();
export function useGuidesUnreadable(): boolean {
  return useSyncExternalStore(store.subscribe, unreadableSnap, unreadableSnap);
}
export function useGuidesHydrated(): boolean {
  return store.useHydrated();
}
/** Tests: drop memory (as the account wipe does). */
export function resetGuidesReadLocal(): void {
  store.reset();
}
