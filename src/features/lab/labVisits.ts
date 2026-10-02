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
 *     guest's visits are not written while they are a guest. They are held
 *     by the shared ledger (sessionCarry) and written to the account the
 *     guest signs in to in the same app session (owner ruling 2026-10-01).
 *   • Nothing is ever removed by a practice run; only the account wipe
 *     (resetLocal, registered in clearLocalAccountData) clears it.
 *
 * Tiny external store, single `ape:labVisits` blob (same pattern as
 * labCompletion).
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLabPreview } from './labPreviewStore';
import { holdSessionWork, registerSessionCarry } from './sessionCarry';

const STORAGE_KEY = 'ape:labVisits';

let visits: Record<string, Set<string>> = {};
let hydrated = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function blobOf(): Record<string, string[]> {
  const blob: Record<string, string[]> = {};
  for (const [k, set] of Object.entries(visits)) if (set.size) blob[k] = [...set];
  return blob;
}

function persist() {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(blobOf())).catch(() => {});
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
  // A guest's visit is held for the sign-in hand-off (written there, never
  // here). Held before the in-memory check: a visit the store already shows
  // (restored, or seen earlier) is still this session's work.
  if (opts.persist === false) holdSessionWork<HeldVisits>(CARRY_KEY, (prev) => withHeldVisit(prev, labId, unitId));
  const set = visits[labId] ?? new Set<string>();
  if (set.has(unitId)) return;
  set.add(unitId);
  visits[labId] = set;
  emit();
  if (opts.persist !== false) void hydrate().then(persist);
}

type HeldVisits = Record<string, string[]>;
const CARRY_KEY = 'labVisits';

/** Pure: `prev` plus one visit (a fresh object). */
export function withHeldVisit(prev: HeldVisits | undefined, labId: string, unitId: string): HeldVisits {
  const list = prev?.[labId] ?? [];
  return list.includes(unitId) ? { ...prev } : { ...prev, [labId]: [...list, unitId] };
}

// The ledger's writer: the held visits join the account's visits and are
// written (the sign-in wipe cleared this store's memory, so they are added
// back, then persisted).
registerSessionCarry<HeldVisits>(CARRY_KEY, async (held) => {
  await hydrate();
  // What is on the device joins too (never written over a copy that could
  // not be read).
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
  try {
    const disk = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    for (const [k, arr] of Object.entries(disk)) {
      if (!Array.isArray(arr)) continue;
      const set = visits[k] ?? new Set<string>();
      for (const v of arr) if (typeof v === 'string') set.add(v);
      visits[k] = set;
    }
  } catch {
    /* damaged → the memory copy stands */
  }
  for (const [labId, units] of Object.entries(held)) {
    const set = visits[labId] ?? new Set<string>();
    for (const u of units) set.add(u);
    visits[labId] = set;
  }
  emit();
  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(blobOf())).then(
    () => true,
    () => false,
  );
});

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
