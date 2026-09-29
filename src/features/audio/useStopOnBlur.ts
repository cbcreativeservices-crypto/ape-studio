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
 */
import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export function useStopOnBlur(stop: () => void): void {
  const stopRef = useRef(stop);
  stopRef.current = stop;
  useFocusEffect(useCallback(() => () => stopRef.current(), []));
}
