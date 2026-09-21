/**
 * useStopWhenSilenced — put a screen's transport back in step when the APP
 * silences audio out from under it.
 *
 * ⛔ THE BUG THIS EXISTS TO FIX (owner 2026-09-20 bug pass).
 *
 * `panicMuteAudio()` — the shake-to-mute safety gesture — stops every native
 * voice and re-locks the output gate. `disableAudioOutput()` does the same on
 * the idle timeout and on backgrounding. All of that worked. What did not is
 * that NOTHING outside `features/audio/` was listening: `subscribeAudioOutput`
 * and `useAudioOutputEnabled` had zero consumers in `screens/`, so each lab's
 * own `running` flag was never corrected.
 *
 * The result, in all ~17 sounding labs and the Signal Generator: shake the
 * phone and the sound stops, but the transport still reads "Stop", the
 * sounding visuals keep animating, and the keepalive keeps ticking. Because
 * the transport is a toggle, the user then has to press it TWICE — and the
 * second press raises the five-second hold-to-enable popup, because the gate
 * they never knew closed was re-locked underneath them.
 *
 * So the screen looked like it was lying about playing, and the way out of it
 * looked broken too. This hook is the missing half of the gesture.
 *
 * Usage: one line next to the transport state.
 *   useStopWhenSilenced(running, stopTone);
 *
 * `stop` is the screen's OWN stop path, so the visuals, the keepalive and any
 * screen-specific teardown unwind exactly as they do for a real Stop tap. It
 * is called only on a true→false transition of the gate while the screen
 * says it is running, so a screen that is already stopped is never disturbed.
 */
import { useEffect, useRef } from 'react';
import { isAudioOutputEnabled, subscribeAudioOutput } from './audioOutputStore';

export function useStopWhenSilenced(running: boolean, stop: () => void): void {
  const runningRef = useRef(running);
  runningRef.current = running;
  const stopRef = useRef(stop);
  stopRef.current = stop;
  // The gate's last seen value, so we act on the EDGE. The gate is false at
  // launch and false again after every mute, and re-firing `stop` on each
  // unrelated notification would fight a screen that is mid-start.
  const wasEnabled = useRef(isAudioOutputEnabled());

  useEffect(() => {
    const unsubscribe = subscribeAudioOutput(() => {
      const now = isAudioOutputEnabled();
      const fell = wasEnabled.current && !now;
      wasEnabled.current = now;
      if (fell && runningRef.current) stopRef.current();
    });
    return unsubscribe;
  }, []);
}
