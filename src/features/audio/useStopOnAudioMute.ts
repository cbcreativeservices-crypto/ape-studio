/**
 * useStopOnAudioMute — drop a lab's transport when something else silenced it.
 *
 * ── THE LIE THIS EXISTS TO STOP ─────────────────────────────────────────────
 *
 * `panicMuteAudio()` calls `ApeDsp.genStop()` + `disableAudioOutput()` from
 * three places the learner did not press: backgrounding the app, shake-to-mute,
 * and the twenty-minute idle auto-mute. It notifies every `audioOutputStore`
 * listener — and NOT ONE LAB SUBSCRIBED.
 *
 * So the generator stopped and the lab's own `running` stayed true. Come back
 * from the Home screen, or shake the phone, and the lab still showed STOP /
 * "sounding" over silence, the keepalive interval kept ticking, and dragging
 * the frequency fader called `genSet(...)` into a dead generator. Recovery
 * meant pressing STOP, then PLAY, then passing the five-second audio hold
 * again — for a state the learner never asked for and had no way to read.
 *
 * `WaveformScreen` names this exact class of defect as forbidden: "a lit meter
 * over a dead mic claims to be live." A lit transport over a stopped generator
 * is the same claim.
 *
 * ── WHY A HOOK AND NOT TWELVE COPIES ───────────────────────────────────────
 *
 * Twelve labs own a `running` flag. A rule that has to be remembered twelve
 * times is a rule that will be wrong in the thirteenth lab somebody writes.
 * One line per lab, one place to fix.
 *
 * ⛔ IT ONLY EVER TURNS `running` OFF. Re-enabling output does not resume a
 *    tone — the learner presses PLAY. Anything else would have the app start
 *    making noise on its own when it comes back from the background, which is
 *    precisely what the panic mute is for.
 */
import { useEffect } from 'react';
import { useAudioOutputEnabled } from './audioOutputStore';

export function useStopOnAudioMute(setRunning: (v: false) => void): void {
  const outputOn = useAudioOutputEnabled();
  useEffect(() => {
    if (!outputOn) setRunning(false);
    // `setRunning` is a useState setter or a stable callback in every current
    // caller; listing it keeps the lint rule honest without re-running.
  }, [outputOn, setRunning]);
}
