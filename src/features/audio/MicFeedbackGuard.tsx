/**
 * MicFeedbackGuard — the mic↔speaker feedback interlock (owner request
 * 2026-07-26). Mounted once at the app root. Whenever the MIC is capturing and
 * the user has NOT flipped the physical override, it cuts the generator
 * (speaker) so the built-in mic can never pick up the built-in speaker and howl
 * ("...auto muted when the phone's mic is on incoming").
 *
 * The override lives in the ONE place the app legitimately needs both at once —
 * the Harmonic Lab LIVE mode (play a reference tone AND measure it) — via
 * FeedbackAllowRow, which the user must physically switch on there.
 */
import { useEffect } from 'react';
import { ApeDsp } from '../../../modules/ape-dsp';
import { useSpeakerFeedbackMuted } from './audioOutputStore';

export function MicFeedbackGuard() {
  const muted = useSpeakerFeedbackMuted();
  useEffect(() => {
    // Mic just went hot without the override → silence the speaker immediately.
    if (muted) void ApeDsp.genStop();
  }, [muted]);
  return null;
}
