/**
 * homeCardsStore — the paid user's chosen HOME (Course Select) screen topic
 * cards (user request 2026-07-22). An ordered list of topic gs; Glossary and
 * Audio Tools are ALWAYS on Home and locked (never stored here). Hard cap of
 * HOME_MAX (20) user cards. Device-local, persisted; same external-store pattern
 * as the other stores.
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const HOME_MAX = 20;
const KEY = 'ape:homeCards';
const BKEY = 'ape:homeBundles';
const DKEY = 'ape:homeDefaultGs';

let list: number[] = []; // topic gs on Home
let bundleList: string[] = []; // bundle keys on Home (cert:/program: keys)
let defaultGs: number | null = null; // topic the Home carousel opens on (user 2026-07-24)
let hydrated = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function persist() {
  void AsyncStorage.setItem(KEY, JSON.stringify(list));
}
function persistBundles() {
  void AsyncStorage.setItem(BKEY, JSON.stringify(bundleList));
}
function persistDefault() {
  void AsyncStorage.setItem(DKEY, defaultGs == null ? '' : String(defaultGs));
}

/** Total Home cards (topics + bundles) — the 20-cap counts both. */
export function homeCardCount(): number {
  return list.length + bundleList.length;
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (!hydrating) {
    hydrating = (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const p = JSON.parse(raw);
          if (Array.isArray(p)) list = [...new Set(p.filter((g) => typeof g === 'number'))].slice(0, HOME_MAX);
        }
        const rawB = await AsyncStorage.getItem(BKEY);
        if (rawB) {
          const pb = JSON.parse(rawB);
          if (Array.isArray(pb)) bundleList = [...new Set(pb.filter((k) => typeof k === 'string'))];
        }
        const rawD = await AsyncStorage.getItem(DKEY);
        const dg = rawD ? parseInt(rawD, 10) : NaN;
        defaultGs = Number.isFinite(dg) && list.includes(dg) ? dg : null;
      } catch {
        // start empty
      }
      hydrated = true;
      emit();
    })();
  }
  return hydrating;
}

export function getHomeGs(): number[] {
  void hydrate();
  return list;
}

/** Commit a new ordered list (deduped, capped). Used by the Home Setup sheet's
 *  Save action. */
export function setHomeGs(gs: number[]): void {
  list = [...new Set(gs)].slice(0, HOME_MAX);
  if (defaultGs != null && !list.includes(defaultGs)) {
    defaultGs = null;
    persistDefault();
  }
  persist();
  emit();
}

export function isOnHome(gs: number): boolean {
  void hydrate();
  return list.includes(gs);
}

/** Toggle a single topic on/off Home (per-card book toggle, user request
 *  2026-07-22). Returns 'full' without adding when already at HOME_MAX. */
export function toggleHome(gs: number): 'added' | 'removed' | 'full' {
  if (list.includes(gs)) {
    list = list.filter((g) => g !== gs);
    if (defaultGs === gs) {
      defaultGs = null;
      persistDefault();
    }
    persist();
    emit();
    return 'removed';
  }
  if (homeCardCount() >= HOME_MAX) return 'full';
  list = [...list, gs];
  persist();
  emit();
  return 'added';
}

/** Ensure a topic is on Home (add if absent, respecting the cap). Returns false
 *  if the cap blocked it. Used to auto-reserve the required core courses' Home
 *  slots (user request 2026-07-22). */
export function ensureHome(gs: number): boolean {
  if (list.includes(gs)) return true;
  if (homeCardCount() >= HOME_MAX) return false;
  list = [...list, gs];
  persist();
  emit();
  return true;
}

/** Remove a topic from Home if present (e.g. a core course, once completed,
 *  auto-frees its reserved slot — user request 2026-07-22). */
export function removeHome(gs: number): void {
  if (!list.includes(gs)) return;
  list = list.filter((g) => g !== gs);
  if (defaultGs === gs) {
    defaultGs = null;
    persistDefault();
  }
  persist();
  emit();
}

/* ---- Bundle (cert/program) Home cards (user request 2026-07-22) ---- */

export function isBundleOnHome(key: string): boolean {
  void hydrate();
  return bundleList.includes(key);
}

/** Toggle a cert/program bundle card on/off Home (counts toward HOME_MAX). */
export function toggleHomeBundle(key: string): 'added' | 'removed' | 'full' {
  if (bundleList.includes(key)) {
    bundleList = bundleList.filter((k) => k !== key);
    persistBundles();
    emit();
    return 'removed';
  }
  if (homeCardCount() >= HOME_MAX) return 'full';
  bundleList = [...bundleList, key];
  persistBundles();
  emit();
  return 'added';
}

/** Drop a bundle from Home (e.g. when it's removed from the registry). */
export function removeHomeBundle(key: string): void {
  if (!bundleList.includes(key)) return;
  bundleList = bundleList.filter((k) => k !== key);
  persistBundles();
  emit();
}

export function useHomeBundles(): string[] {
  const [snap, setSnap] = useState<string[]>(bundleList);
  useEffect(() => {
    const l = () => setSnap(bundleList);
    listeners.add(l);
    void hydrate().then(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snap;
}

/** Live view of the Home topic list. */
export function useHomeGs(): number[] {
  const [snap, setSnap] = useState<number[]>(list);
  useEffect(() => {
    const l = () => setSnap(list);
    listeners.add(l);
    void hydrate().then(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snap;
}

/** Reset ALL in-memory caches (account wipe / user switch — clearLocalAccountData).
 *  Clears the topic list, bundle list, default-landing gs, and hydrated flags,
 *  then emits so every live hook (useHomeGs / useHomeBundles / useDefaultHomeGs)
 *  re-renders empty; the next read re-hydrates from the (cleared) storage. */
export function resetLocal(): void {
  list = [];
  bundleList = [];
  defaultGs = null;
  hydrated = false;
  hydrating = null;
  emit();
}

/* ---- Default landing card (user request 2026-07-24) ----
 * The Home (Course Select) carousel opens on this topic's card. null = no
 * explicit choice → the carousel opens on Glossary (its prior default). Always
 * one of the Home topics, or null. */

export function getDefaultHomeGs(): number | null {
  void hydrate();
  return defaultGs;
}

/** Set (or clear, with null) the default landing card. A gs that isn't a current
 *  Home topic is ignored (stored as null). */
export function setDefaultHomeGs(gs: number | null): void {
  defaultGs = gs != null && list.includes(gs) ? gs : null;
  persistDefault();
  emit();
}

/** Live view of the default landing topic gs (null = none). */
export function useDefaultHomeGs(): number | null {
  const [snap, setSnap] = useState<number | null>(defaultGs);
  useEffect(() => {
    const l = () => setSnap(defaultGs);
    listeners.add(l);
    void hydrate().then(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snap;
}
