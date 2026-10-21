/**
 * boothStore — THE ONE SHARED BOOTH for the whole DJ Systems Lab session
 * (owner brief 2026-10-18: "build ONE shared two-deck DJ booth model that
 * every screen uses"). A module-scope store (the labCompletion / amplitude
 * orientation pattern: a tiny external store + useSyncExternalStore), so a
 * deck loaded on Screen 5 is still loaded on Screen 6 and a cable patched on
 * Screen 4 is still patched on Screen 9.
 *
 * It is SESSION state, not saved data: it lives as long as the app process
 * and starts again from the screen's own setup next launch (nothing here is
 * the learner's record — credit lives in PagedLab's progress).
 *
 * THE BOOTH CLOCK. Booth time (seconds) runs while any deck plays. Every
 * change is applied at `boothNow()` with the decks re-anchored first
 * (djModel.anchorAt), so a fader moved mid-play never jumps the music. The
 * audio engine (useBoothAudio) may re-anchor the clock to the sound it is
 * actually playing (`syncClock`) — while sound is on, the audio IS the clock.
 */
import { useSyncExternalStore } from 'react';
import { anchorAt, builtBooth, LISTEN_FRESH, type Booth, type Perspective } from '../model/djModel.ts';
import { anyPlaying, stopAll } from '../model/djDeck.ts';

type Listener = () => void;

let state: Booth = builtBooth();
const listeners = new Set<Listener>();

const wall = (): number => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

let running = false;
let baseT = 0;
let baseWall = 0;

/** Booth time now (s). */
export function boothNow(): number {
  return running ? baseT + (wall() - baseWall) / 1000 : baseT;
}

/** Is booth time moving (some deck is playing)? */
export const boothRunning = (): boolean => running;

function setRunning(on: boolean): void {
  const t = boothNow();
  baseT = t;
  baseWall = wall();
  running = on;
}

/** Re-anchor the clock so `boothNow()` reads `t` at this instant (the audio
 *  engine, when a rendered chunk starts sounding). */
export function syncClock(t: number): void {
  baseT = t;
  baseWall = wall();
}

/** The booth's VERSION: one more on every change (ADDITIVE, toddler bug
 *  test 2026-10-19). useBoothAudio stamps each render with the version it
 *  was made from, so a reading can tell whether it already carries the
 *  latest change. */
let version = 0;
export const boothVersion = (): number => version;

/** Was a render stamped `stamp` made from the booth at version `now`? */
export const readingFresh = (stamp: number | null, now: number = version): boolean => stamp != null && stamp === now;

function emit(): void {
  version++;
  for (const l of [...listeners]) l();
}

export function getBooth(): Booth {
  return state;
}

/**
 * Apply a change at booth time now. `f` receives the booth with every deck
 * anchored at `t`, and `t` itself.
 */
export function updateBooth(f: (b: Booth, t: number) => Booth | null): void {
  const t = boothNow();
  const next = f(anchorAt(state, t), t);
  if (!next || next === state) return;
  state = next;
  const on = anyPlaying(next);
  if (on !== running) setRunning(on);
  emit();
}

/** Replace the whole booth (a screen's own setup, a reset). Stops the decks. */
export function setBooth(next: Booth): void {
  const t = boothNow();
  state = stopAll(anchorAt(next, t), t);
  setRunning(false);
  emit();
}

/** STOP ALL: every deck stops; the clock stops. */
export function stopBooth(): void {
  if (!anyPlaying(state)) return;
  updateBooth((b, t) => stopAll(b, t));
}

/** Change the listening perspective — the listen level starts LOW again
 *  (house rule: a fresh low playback level after an output-route change). */
export function setPerspective(p: Perspective): void {
  updateBooth((b) => (b.perspective === p ? b : { ...b, perspective: p, listen: LISTEN_FRESH }));
}

function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useBooth(): Booth {
  return useSyncExternalStore(subscribe, getBooth, getBooth);
}

/** Subscribe outside React (the audio engine). */
export const subscribeBooth = subscribe;
