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
import { stopAllFilePlayers } from './filePlayers';

export function panicMuteAudio(): void {
  // FILE PLAYBACK FIRST (2026-09-17). Until this line existed, shaking the
  // phone stopped every native voice and left an ear-training clip, a tuning
  // reference or a mix stem playing to its end - the one thing most likely to
  // be loud, and the thing the safety warning names. It is first and it is
  // synchronous: no await stands between the gesture and the silence.
  stopAllFilePlayers();
  // This is the shake-to-mute SAFETY path. A native rejection here must not
  // become an unhandled rejection at the exact moment a safety feature fires —
  // and it must not stop the synchronous silencing below from running.
  //
  // …and a SYNCHRONOUS native throw must not either (bug hunt 2026-09-30,
  // pass 2): fxReset() is a plain sync native call, and a throw from it (or
  // from a native stop before its promise exists) skipped everything below —
  // disableAudioOutput() included, so the shake "muted" and left the gate on.
  const quiet = (f: () => unknown) => {
    try {
      void Promise.resolve(f()).catch(() => {});
    } catch {
      /* this voice is idle or absent — the others still stop */
    }
  };
  quiet(() => ApeDsp.genStop());
  quiet(() => ApeDsp.binStop());
  quiet(() => ApeDsp.modStop());
  quiet(() => ApeDsp.fxReset());
  try {
    // Speech.stop() returns a Promise: the try alone caught nothing async,
    // so a native rejection surfaced unhandled on the safety path (bug hunt
    // 2026-09-30, pass 2).
    void Promise.resolve(Speech.stop()).catch(() => {});
  } catch {
    /* nothing speaking */
  }
  disableAudioOutput();
}
