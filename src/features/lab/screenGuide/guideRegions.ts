/**
 * Screen-guide regions (owner 2026-10-31: "when showing, try to allow the
 * correct area of the screen below to be still seen so what is being read is
 * relevant").
 *
 * The shared Rack Unit registers the views a guide step talks about — the
 * glass ('display'), the bezel readout strip ('readouts') and the dock
 * ('dock') — and the guide overlay MEASURES them (measureInWindow) at the
 * moment it shows a step, so the card sits away from the area being read
 * about. Nothing is guessed from pixel offsets: the dock rides up under short
 * notes, the glass shrinks on short phones, HIDE DISPLAY removes it.
 *
 * Refs, not rectangles: a rectangle stored at layout time goes stale the
 * moment the well scrolls or a tray opens; a ref is measured when asked.
 * Registration is a stack per key — a screen pushed on top registers last
 * and wins; unmounting it hands the key back to the screen below.
 *
 * Pure module state, no React context: the Rack Unit is shared by every lab
 * and costs nothing here unless a guide asks.
 */
import { useEffect, type RefObject } from 'react';
import type { View } from 'react-native';

export type GuideRegionKey = 'display' | 'readouts' | 'dock';
export type GuideRect = { x: number; y: number; w: number; h: number };

type Entry = { id: number; ref: RefObject<View | null> };
const stacks = new Map<GuideRegionKey, Entry[]>();
let seq = 0;

/** Register a view as a guide region for as long as the caller is mounted. */
export function useGuideRegion(key: GuideRegionKey, ref: RefObject<View | null>): void {
  useEffect(() => {
    const id = ++seq;
    const list = stacks.get(key) ?? [];
    stacks.set(key, [...list, { id, ref }]);
    return () => {
      stacks.set(key, (stacks.get(key) ?? []).filter((e) => e.id !== id));
    };
  }, [key, ref]);
}

/** Window rect of a ref'd view, or null (not mounted, not laid out, zero). */
export function measureView(ref: RefObject<View | null>): Promise<GuideRect | null> {
  const v = ref.current;
  if (!v || typeof v.measureInWindow !== 'function') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      v.measureInWindow((x, y, w, h) => {
        resolve(Number.isFinite(x) && Number.isFinite(y) && w > 0 && h > 0 ? { x, y, w, h } : null);
      });
    } catch {
      resolve(null);
    }
  });
}

/** Window rect of the newest registered view for `key`, or null. */
export function measureGuideRegion(key: GuideRegionKey): Promise<GuideRect | null> {
  const list = stacks.get(key) ?? [];
  const top = list[list.length - 1];
  return top ? measureView(top.ref) : Promise.resolve(null);
}

/** For tests: how many views are registered under a key. */
export function guideRegionCount(key: GuideRegionKey): number {
  return (stacks.get(key) ?? []).length;
}
