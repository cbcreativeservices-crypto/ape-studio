/**
 * roomDesignStore — the device-local SAVED ROOM DESIGNS of the Room Design &
 * Monitoring Lab (owner spec 2026-10-01: "save room designs and compare
 * 'before' with a revised setup").
 *
 * The house external-store idiom (labCompletion / soundsystems/progress /
 * measurementStore): a module list + listeners + hydrate/commit + a hook,
 * one `ape:`-prefixed AsyncStorage key so the account wipe's `ape:*` sweep
 * removes it, `resetLocal()` registered in clearLocalAccountData so the
 * in-memory copy goes with it, and a GENERATION FENCE so a hydrate that was
 * already reading when the wipe ran cannot put the previous account's designs
 * back on screen (the fence every per-account store gained on 2026-09-30).
 *
 * Rules it keeps:
 *   • GUESTS DESIGN BUT NOTHING IS SAVED (house guest rule, owner 2026-08-12):
 *     the host sets `setRoomDesignSaveBlocked(true)` for a signed-out guest or
 *     a members-only preview; a save then lands in memory for this session
 *     only, and the lab says so plainly. The host waits for the entitlement
 *     to resolve before it decides, so a signed-in member is never treated as
 *     a guest in the first paint — and a guest-loaded copy is never written.
 *   • PREVIEW EARNS NOTHING (owner 2026-09-01) — a preview records nothing.
 *   • A design is small (a few KB of plain JSON); the list is capped so it
 *     can never grow into the AsyncStorage ceiling the measurement library hit.
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLabPreview } from '../lab/labPreviewStore';
import type { RoomDesign } from '../../screens/lab/roomdesign/roomModel';

const STORAGE_KEY = 'ape:roomdesign:v1';
/** Practical cap — oldest-updated drops first past this. */
export const MAX_SAVED_DESIGNS = 24;

let list: RoomDesign[] = [];
let hydrated = false;
let hydrating: Promise<void> | null = null;
let generation = 0;
let saveBlocked = false;
/** The last read THREW (unreadable, not damaged). Told apart from an empty
 *  store so the lab never says "no saved designs" over designs it could not
 *  read, and renders stop re-reading (toddler pass 3, 2026-10-01). */
let readFailed = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** Drop unusable records so a corrupt or version-skewed blob can never crash
 *  the lab (house per-record sanitize). */
function sanitize(parsed: unknown): RoomDesign[] {
  if (!Array.isArray(parsed)) return [];
  return (parsed as RoomDesign[]).filter(
    (d) =>
      d != null &&
      typeof d.id === 'string' &&
      typeof d.name === 'string' &&
      d.room != null &&
      Array.isArray(d.room.vertices) &&
      d.room.vertices.length >= 3 &&
      Array.isArray(d.layouts) &&
      d.layouts.length > 0 &&
      Array.isArray(d.treatment),
  );
}

function hydrate(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (!hydrating) {
    const gen = generation;
    hydrating = (async () => {
      let next: RoomDesign[] = [];
      let raw: string | null;
      try {
        raw = await AsyncStorage.getItem(STORAGE_KEY);
      } catch {
        // The device could not be READ (not a damaged blob): stay
        // un-hydrated so no save writes a short list over the designs on
        // disk; the next call reads again.
        if (gen === generation) {
          hydrating = null;
          readFailed = true;
          emit();
        }
        return;
      }
      try {
        if (raw != null) next = sanitize(JSON.parse(raw));
      } catch {
        next = []; // damaged → start empty; the next write repairs the key
      }
      if (gen !== generation) return; // wiped mid-read — the next hydrate reads the cleared store
      list = next;
      hydrated = true;
      readFailed = false;
      emit();
    })();
  }
  return hydrating;
}

/** Resolves true only when the write landed (toddler pass 1, 2026-10-01: a
 *  failed write used to report "Saved on this device"). */
function persist(): Promise<boolean> {
  if (saveBlocked) return Promise.resolve(false); // a guest's designs live for this session only
  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list)).then(
    () => true,
    (e: unknown) => {
      console.warn('[roomdesign] save FAILED — the designs on screen are not persisted:', e);
      return false;
    },
  );
}

/** Set by the lab's host on every render: true for a signed-out guest or a
 *  members-only preview. The host only decides once the entitlement has
 *  resolved. */
export function setRoomDesignSaveBlocked(blocked: boolean): void {
  saveBlocked = blocked;
}

export function isRoomDesignSaveBlocked(): boolean {
  return saveBlocked;
}

/** Newest-updated first. */
export function getRoomDesigns(): RoomDesign[] {
  // After a failed read only an action (save / delete) or a fresh mount
  // retries — a render must not, or the emit above would loop.
  if (!readFailed) void hydrate();
  return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Save (insert or replace by id). Resolves true when the design will still
 *  be there after a relaunch; false for a guest / preview (kept in memory). */
export function saveRoomDesign(design: RoomDesign): Promise<boolean> {
  if (getLabPreview().active) return Promise.resolve(false);
  // Fenced like the hydrate (bug pass 2026-10-01): a save tapped just before
  // an account switch waited on the hydrate, then landed AFTER the wipe and
  // wrote the previous account's design into the next account's empty key.
  const gen = generation;
  return hydrate().then(() => {
    if (gen !== generation || !hydrated) return false; // unreadable: never overwrite what is on disk
    const stamped = { ...design, updatedAt: Date.now() };
    const next = [...list.filter((d) => d.id !== stamped.id), stamped];
    next.sort((a, b) => a.updatedAt - b.updatedAt);
    while (next.length > MAX_SAVED_DESIGNS) next.shift();
    const prev = list;
    list = next;
    emit();
    if (saveBlocked) return false; // a guest's copy lives in memory for the session
    return persist().then((ok) => {
      // A failed write leaves the list as it is ON DISK — not one that lists
      // the design under SAVED DESIGNS until the next relaunch.
      if (!ok && list === next) {
        list = prev;
        emit();
      }
      return ok;
    });
  });
}

/** True while the saved designs could not be read from the device. */
export function isRoomDesignStoreUnreadable(): boolean {
  return readFailed;
}

/** Resolves true when the design is gone from the device too. A failed write
 *  puts the row back (toddler pass 3: it vanished, then returned on relaunch). */
export function deleteRoomDesign(id: string): Promise<boolean> {
  const gen = generation;
  return hydrate().then(() => {
    if (gen !== generation || !hydrated) return false; // wiped meanwhile, or unreadable
    if (!list.some((d) => d.id === id)) return true;
    const prev = list;
    const next = list.filter((d) => d.id !== id);
    list = next;
    emit();
    if (saveBlocked) return true; // a guest's session copy: nothing on disk to remove
    return persist().then((ok) => {
      if (!ok && list === next) {
        list = prev;
        emit();
      }
      return ok;
    });
  });
}

/** Account switch / wipe: drop the in-memory copy (the key itself is removed
 *  by clearLocalAccountData's `ape:*` sweep) and fence any in-flight read. */
export function resetLocal(): void {
  generation++;
  list = [];
  hydrated = false;
  hydrating = null;
  readFailed = false;
  emit();
}

/** Reactive list — hydrates on first use. */
export function useRoomDesigns(): RoomDesign[] {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    readFailed = false; // a fresh mount retries an unreadable store once
    void hydrate();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return getRoomDesigns();
}
