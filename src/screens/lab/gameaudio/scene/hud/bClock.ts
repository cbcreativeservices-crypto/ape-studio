/**
 * bClock — the two things the hudB strips share that are not drawing:
 *
 *   useBMemo()    the tracker's memo (bModel.bTrack), fed EVERY scene change.
 *                 One module-scope subscription to the scene store, started
 *                 by the first strip that mounts: a strip that mounts later
 *                 (FULL SCREEN draws a second copy) reads the same history.
 *   useBNow()     ONE frame clock for a strip, anchored to the model's time
 *                 (gaStore.gaNow, the clock `state.t` is stamped from). It
 *                 runs only while something in the strip is moving, and it
 *                 obeys the decorative-motion gate: with motion reduced the
 *                 strip is redrawn in steps (and on every state change), so
 *                 the same information is shown still.
 *
 * Read-only on the model: nothing here dispatches.
 */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useDecorativeMotion } from '../../../../../features/settings/decorativeMotion';
import { gaGet, gaNow, gaSubscribe } from '../../model/gaStore';
import type { GaState } from '../../model/gaModel';
import { bTrack, bTrackInit, type BMemo } from './bModel';

let seen: GaState | null = null;
let memo: BMemo | null = null;
const listeners = new Set<() => void>();

function onScene(): void {
  const next = gaGet();
  if (next === seen) return;
  const before = memo;
  memo = seen && memo ? bTrack(memo, seen, next) : bTrackInit(next);
  seen = next;
  if (memo !== before) for (const l of [...listeners]) l();
}
let started = false;
function start(): void {
  if (started) return;
  started = true;
  // kept for the life of the app: one function call per scene change
  gaSubscribe(onScene);
  onScene();
}
function subscribe(l: () => void): () => void {
  start();
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
function get(): BMemo {
  start();
  // a scene change this module has not been told of yet (subscription order)
  if (gaGet() !== seen) onScene();
  return memo as BMemo;
}

/** The tracker's memo for the scene as it is now. */
export const useBMemo = (): BMemo => useSyncExternalStore(subscribe, get, get);

/**
 * The scene's time, for a strip that moves between state changes. While
 * `active` it is advanced once per frame (requestAnimationFrame) and the
 * strip re-renders with it; with motion reduced it is advanced every `stepS`
 * seconds instead (the strip then holds its steps). When not active it is the
 * time of the last render. Returns [scene seconds, smooth].
 *
 * Why a re-render and not a shared value: on the web build a Skia canvas did
 * not repaint for a shared value written from this clock (seen 2026-11-13:
 * the play line and the line fill stood still between state changes). A
 * strip is a few dozen nodes, so a re-render per frame is cheap, and it runs
 * only while something in that strip is moving.
 */
export function useBNow(active: boolean, stepS = 0.15): [number, boolean] {
  const motion = useDecorativeMotion();
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (!motion) {
      const id = setInterval(() => setTick((n) => n + 1), stepS * 1000);
      return () => clearInterval(id);
    }
    let raf = requestAnimationFrame(function frame() {
      setTick((n) => n + 1);
      raf = requestAnimationFrame(frame);
    });
    return () => cancelAnimationFrame(raf);
  }, [active, motion, stepS]);
  return [gaNow(), motion];
}
