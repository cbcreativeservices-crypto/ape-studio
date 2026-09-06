/**
 * tunerFrameStore — the live tuner reading, published by the Frequency
 * Counter's tuner mode and read by the CenterLock fullscreen (2026-09-06).
 *
 * Why a store: CenterLock must be an absolute-fill overlay at the SCREEN root
 * (a nested Modal goes black on iOS and an overlay inside the mode's
 * ScrollView would only fill the scroll content), while the pitch values live
 * two components down inside that ScrollView. A tiny external store lets the
 * root render the overlay without threading props through the mode tree.
 * `open` lives here too, so the CENTERLOCK key inside the mode can open the
 * overlay the root owns.
 */
import { useSyncExternalStore } from 'react';

export type TunerFrame = {
  /** Live or held frequency in Hz, or null when there is no stable pitch. */
  freq: number | null;
  /** True when the reading is live and accepted (not a held last-good value). */
  accepted: boolean;
  /** Engine pitch confidence 0–1 (YIN), 0 when nothing is playing. */
  confidence: number;
  /** Input level in dBFS (digital level, never SPL). */
  levelDb: number;
  /** The A4 reference the tuner mode is using. */
  a4: number;
};

type State = { frame: TunerFrame; open: boolean };

let state: State = {
  frame: { freq: null, accepted: false, confidence: 0, levelDb: -120, a4: 440 },
  open: false,
};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function publishTunerFrame(frame: TunerFrame): void {
  const f = state.frame;
  if (
    f.freq === frame.freq &&
    f.accepted === frame.accepted &&
    f.confidence === frame.confidence &&
    f.levelDb === frame.levelDb &&
    f.a4 === frame.a4
  ) {
    return;
  }
  state = { ...state, frame };
  emit();
}

export function openCenterLock(): void {
  if (state.open) return;
  state = { ...state, open: true };
  emit();
}

export function closeCenterLock(): void {
  if (!state.open) return;
  state = { ...state, open: false };
  emit();
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/** One-off read without subscribing (initial values for a parent that must
 *  NOT re-render at frame rate). */
export function readTunerFrame(): TunerFrame {
  return state.frame;
}

export function useTunerFrame(): TunerFrame {
  return useSyncExternalStore(subscribe, () => state.frame, () => state.frame);
}

export function useCenterLockOpen(): boolean {
  return useSyncExternalStore(subscribe, () => state.open, () => state.open);
}
