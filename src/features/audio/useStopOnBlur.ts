/**
 * useStopOnBlur — stop a screen's sound when the screen loses focus (or
 * unmounts), and ONLY then.
 *
 * Owner 2026-09-29, the Bass lab ▶ bug. The pattern every lab used,
 *
 *   useFocusEffect(useCallback(() => () => stop(), [stop]));
 *
 * also runs its CLEANUP whenever `stop` changes identity, because the focus
 * effect re-subscribes. When `stop` depended on anything that changes during
 * a start (the lab-audio hook object, a loading flag, a param), the render
 * the tap itself caused called stop() and cancelled the sound it was starting.
 * The clip was fetched, then silently abandoned, and ▶ never became ■.
 *
 * Here the effect depends on nothing, and the latest `stop` is read from a ref
 * at blur time, so a re-render can never stop the sound.
 *
 * ── useStopOnClose (owner 2026-09-29, later the same day) ───────────────────
 *
 * "Only stop when closed, keep playing when switching screens." Most labs now
 * use useStopOnClose: the sound carries on under a pushed screen or a tab
 * switch and stops when the lab is CLOSED (unmounted). useStopOnBlur is kept
 * for the exceptions (ear-training trials, Harmonics' mic-coupled tone).
 *
 * BOTH claim the output when their screen comes into focus
 * (labOutputOwner.ts): a lab still sounding behind the screen that just came
 * to the front is stopped with its own stop — never two labs at once.
 *
 * Safety is untouched by either: backgrounding, shake-to-mute and the idle
 * lock go through panicMuteAudio / disableAudioOutput, which silence every
 * voice and file player app-wide, and each lab's useStopWhenSilenced unwinds
 * its transport — mounted-and-covered labs included.
 */
import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { claimLabOutput, mayStopOnClose, registerLabSound } from './labOutputOwner';

/** Register `stop` under this SCREEN and claim the output on every focus. */
function useLabOutputClaim(stopRef: { current: () => void }): string {
  const id = useRoute().key;
  useEffect(() => registerLabSound(id, stopRef), [id, stopRef]);
  useFocusEffect(
    useCallback(() => {
      claimLabOutput(id);
    }, [id]),
  );
  return id;
}

export function useStopOnBlur(stop: () => void): void {
  const stopRef = useRef(stop);
  stopRef.current = stop;
  useLabOutputClaim(stopRef);
  useFocusEffect(useCallback(() => () => stopRef.current(), []));
}

/**
 * Stop a screen's sound when the screen CLOSES (unmounts) — not on blur
 * (owner 2026-09-29). Same ref-latest shape as useStopOnBlur, so a re-render
 * can never stop a start. A lab superseded by another lab's claim was already
 * stopped then, and does not stop again on close (that would silence the
 * newer lab's shared generator).
 */
export function useStopOnClose(stop: () => void): void {
  const stopRef = useRef(stop);
  stopRef.current = stop;
  const id = useLabOutputClaim(stopRef);
  const idRef = useRef(id);
  idRef.current = id;
  useEffect(
    () => () => {
      if (mayStopOnClose(idRef.current)) stopRef.current();
    },
    [],
  );
}
