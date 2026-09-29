/**
 * labVisits — which modules / sections / steps a learner has OPENED, for the
 * labs that bank no credit and kept no progress record at all (owner
 * 2026-09-29: every lab ends with a "what's left" screen, and a lab that
 * remembers nothing cannot say what is left).
 *
 * Deliberately NOT labCompletion: that store is the certificate-credit bridge
 * and fires `mark_lab_complete` — a lab that grants no credit must never be
 * able to reach it. This one only remembers "opened", device-local, and the
 * end screens word it as progress, never as credit.
 *
 * Rules it keeps:
 *   • PREVIEW EARNS NOTHING (owner 2026-09-01) — a members-only preview
 *     records nothing, same guard as markLabUnit.
 *   • Guests (owner 2026-08-12) — the caller passes `persist: false`, so a
 *     guest's visits live for this app session only.
 *   • Nothing is ever removed by a practice run; only the account wipe
 *     (resetLocal, registered in clearLocalAccountData) clears it.
 *
 * Tiny external store, single `ape:labVisits` blob (same pattern as
 * labCompletion).
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLabPreview } from './labPreviewStore';

const STORAGE_KEY = 'ape:labVisits';

let visits: Record<string, Set<string>> = {};
let hydrated = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  const blob: Record<string, string[]> = {};
  for (const [k, set] of Object.entries(visits)) if (set.size) blob[k] = [...set];
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(blob)).catch(() => {});
}

function hydrate(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (!hydrating) {
    hydrating = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw != null) {
          const blob = JSON.parse(raw) as Record<string, unknown>;
          for (const [k, arr] of Object.entries(blob)) {
            if (!Array.isArray(arr)) continue;
            // Merge — a visit recorded before the load resolved is kept.
            const set = visits[k] ?? new Set<string>();
            for (const v of arr) if (typeof v === 'string') set.add(v);
            visits[k] = set;
          }
        }
      } catch {
        // corrupt/absent → nothing visited
      }
      hydrated = true;
      emit();
    })();
  }
  return hydrating;
}

/** Record that a unit of a lab was opened. Idempotent. `persist: false` for a
 *  guest keeps it in memory for this session only. */
export function markLabVisit(labId: string, unitId: string, opts: { persist?: boolean } = {}): void {
  if (getLabPreview().active) return;
  const set = visits[labId] ?? new Set<string>();
  if (set.has(unitId)) return;
  set.add(unitId);
  visits[labId] = set;
  emit();
  if (opts.persist !== false) void hydrate().then(persist);
}

/** Reactive visited set for one lab (a fresh Set per change). */
export function useLabVisits(labId: string): ReadonlySet<string> {
  const read = () => new Set(visits[labId] ?? []);
  const [v, setV] = useState<ReadonlySet<string>>(read);
  useEffect(() => {
    const l = () => setV(read());
    listeners.add(l);
    void hydrate().then(l);
    return () => {
      listeners.delete(l);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labId]);
  return v;
}

/** Account switch: drop the in-memory cache (the key itself is removed by
 *  clearLocalAccountData's `ape:*` sweep). */
export function resetLocal(): void {
  visits = {};
  emit();
}
