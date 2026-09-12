/**
 * panicMuteAudio — silence EVERYTHING immediately and re-lock the output gate
 * (owner request 2026-07-26: "shaking the phone will immediately mute the phone
 * and put it in silence locked again").
 *
 * Every native output voice (generator / binaural bus / modular voice) fades
 * out on its own 10 ms envelope — super-fast and click-free; the effect chain
 * is reset; any text-to-speech is cut; and disableAudioOutput() returns the app
 * to its muted default so a fresh 5-second hold is required before sound can
 * play again (silence-locked).
 *
 * Safe to call at any time and from anywhere: each native stop is a guarded
 * no-op when that voice is idle or the build predates it.
 */
import * as Speech from 'expo-speech';
import { ApeDsp } from '../../../modules/ape-dsp';
import { disableAudioOutput } from './audioOutputStore';

export function panicMuteAudio(): void {
  // This is the shake-to-mute SAFETY path. A native rejection here must not
  // become an unhandled rejection at the exact moment a safety feature fires —
  // and it must not stop the synchronous silencing below from running.
  void ApeDsp.genStop().catch(() => {});
  void ApeDsp.binStop().catch(() => {});
  void ApeDsp.modStop().catch(() => {});
  ApeDsp.fxReset();
  try {
    Speech.stop();
  } catch {
    /* nothing speaking */
  }
  disableAudioOutput();
}
