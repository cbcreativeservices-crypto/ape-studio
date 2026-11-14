/**
 * bezelFirstSight — what the bezel shows a learner ONCE (lab fix round 1,
 * 2026-11-14, section 3 row 7; owner: "Begin fixing all bugs found and do
 * obvious ... fixes as you suggested in the report", suggested order item 8).
 *
 *   • CAPTIONS: a stage's plain-word bezel captions (BezelItem.caption:
 *     "where / how much / how wide / shape") show on the first visit to that
 *     stage. The visit counts as seen when the rack that showed them goes
 *     away, so the whole first visit keeps them.
 *   • THE UNITS CHIP ("Hz? dB? WHAT THEY MEAN ›"): shown until the learner
 *     has opened it once, on this device.
 *
 * One device-local value on the shared safe store (createLocalStore, D47),
 * key `ape:intro:bezelCaptions` — the `ape:intro:*` family, like the screen
 * guide's hint: it survives the account switch and the guest wipe (intro
 * flags "are not work", owner ruling 2026-10-04) and Settings › "Reset
 * onboarding hints" (onScreenIntrosReset) brings both back.
 *
 * A failed READ is UNREADABLE: captions and the chip show (they never block
 * anything) and nothing is written over the stored copy (createLocalStore).
 */
import { useEffect, useSyncExternalStore } from 'react';
import { createLocalStore } from '../../../features/storage/localStore';
import { onScreenIntrosReset } from '../../../features/intro/screenIntros';
export { captionsIdFor } from './bezelRules';

export const BEZEL_FIRST_SIGHT_KEY = 'ape:intro:bezelCaptions';

export type BezelFirstSight = { seen: string[]; units: boolean };

/** Keep the list bounded (one id per lab stage; there are fewer than 400). */
const MAX_IDS = 400;

export function parseBezelFirstSight(parsed: unknown): BezelFirstSight {
  if (parsed == null || typeof parsed !== 'object') throw new Error('bezelFirstSight: not an object');
  const o = parsed as { seen?: unknown; units?: unknown };
  const seen = Array.isArray(o.seen) ? o.seen.filter((x): x is string => typeof x === 'string').slice(-MAX_IDS) : [];
  return { seen, units: o.units === true };
}

const store = createLocalStore<BezelFirstSight>({
  key: BEZEL_FIRST_SIGHT_KEY,
  empty: () => ({ seen: [], units: false }),
  parse: parseBezelFirstSight,
  // Nothing saved until something is seen.
  serialize: (v) => (v.seen.length || v.units ? JSON.stringify(v) : null),
});

onScreenIntrosReset(() => store.reset());

/** Known yet? While the read is out nothing first-sight is drawn (so a seen
 *  caption never flashes in and out); a FAILED read counts as unseen. */
function useKnown(): boolean {
  // `use()` only subscribes; the first mount starts the one read.
  useEffect(() => {
    if (!store.isHydrated()) void store.hydrate();
  }, []);
  const hydrated = store.useHydrated();
  const unreadable = useSyncExternalStore(store.subscribe, store.isUnreadable, store.isUnreadable);
  return hydrated || unreadable;
}

/**
 * Show this stage's captions? Only a recorded visit hides them; the visit is
 * recorded when the rack that showed them goes away (markCaptionsSeen), so
 * they stay up for the whole first visit.
 */
export function useCaptionsUnseen(id: string | null): boolean {
  const v = store.use();
  const known = useKnown();
  if (!id || !known) return false;
  return !v.seen.includes(id);
}

/** The visit that showed `id`'s captions is over: never show them again. */
export function markCaptionsSeen(id: string): Promise<boolean> {
  if (store.get().seen.includes(id)) return Promise.resolve(true);
  return store.mutate((v) => (v.seen.includes(id) ? v : { ...v, seen: [...v.seen, id].slice(-MAX_IDS) }));
}

/** Show the Hz / dB chip? Until the learner has opened it once on this
 *  device (not while the read is still out; a failed read shows it). */
export function useUnitsChipOwed(): boolean {
  const v = store.use();
  const known = useKnown();
  return known && !v.units;
}

export function markUnitsChipSeen(): Promise<boolean> {
  if (store.get().units) return Promise.resolve(true);
  return store.mutate((v) => (v.units ? v : { ...v, units: true }));
}

/** For tests. */
export const __bezelFirstSightStore = store;
