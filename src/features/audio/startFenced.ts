/**
 * startFenced — the ONE fence every sound start goes through (pattern P4,
 * architectural closer A1, 2026-10-02).
 *
 * A sound start is asynchronous: `await ApeDsp.genStart()`, a signed-URL
 * fetch, a WAV encode + load, `await setAudioModeAsync`. Anything can land
 * inside that await — ■, shake-to-mute, the idle lock, leaving the app with
 * "Mute audio when I leave the app" OFF (stopAllSound: every voice stops but
 * the gate stays ON, so only the sound-stop epoch shows it), or a newer press
 * that now owns the voice. A start that checked the gate only BEFORE its await
 * then sounded on behind the user. About 25 sites each hand-wrote the same
 * three checks and 38 files did not; this helper is those checks, once.
 *
 *   const fenced = await startFenced({
 *     start: () => ApeDsp.genStart(),
 *     stop: () => ApeDsp.genStop(),
 *     isCurrent: () => gen === genRef.current,
 *   });
 *   if (fenced.status !== 'started') return;
 *
 * It captures the sound-stop epoch BEFORE the start, awaits the start, and
 * then — in this order — asks: is the gate still open? is this still the
 * current press? has the epoch moved? The first failing question is the
 * reason; `stop(value, why)` is called with it and 'blocked' is returned.
 * `stop` may decline ONLY for 'superseded', when a NEWER start owns the voice
 * (the superseded-start-silences-the-newer-tone bug of the 09-30 day pass);
 * for 'gate' and 'epoch' nothing legitimately sounds, so it must stop.
 *
 * A throw from `start` propagates untouched (the caller's own catch keeps its
 * AUDIO_UNAVAILABLE_MESSAGE); a throw or rejection from `stop` is swallowed,
 * as panicMute does — a fence must never become an unhandled rejection.
 *
 * armFence() is the same fence for a start deferred by a TIMER rather than an
 * await (the mixing / mastering armed replay): arm it when the timer is set,
 * ask it when the timer fires.
 */
import { getSoundStopEpoch, isAudioOutputEnabled } from './audioOutputStore';

/** Why a start was blocked: the gate closed, a newer press / a stop / a close
 *  superseded it, or every sound was stopped (the epoch moved). */
export type FenceBlock = 'gate' | 'superseded' | 'epoch';

export type FenceResult<T> = { status: 'started'; value: T } | { status: 'blocked'; why: FenceBlock };

/**
 * Arm the fence now; the returned function answers later with the reason the
 * start is blocked, or null when it may sound. Pure reads — safe to call more
 * than once.
 */
export function armFence(isCurrent?: () => boolean): () => FenceBlock | null {
  const epoch = getSoundStopEpoch();
  return () => {
    if (!isAudioOutputEnabled()) return 'gate';
    if (isCurrent && !isCurrent()) return 'superseded';
    if (getSoundStopEpoch() !== epoch) return 'epoch';
    return null;
  };
}

/**
 * Run an asynchronous sound start behind the fence. See the header.
 * @param start     the native / clip start (may be sync; its value is handed
 *                  to `stop` and returned on 'started').
 * @param stop      silence / dispose what `start` produced. Called ONLY when
 *                  blocked, with the reason. May decline for 'superseded'.
 * @param isCurrent the caller's own token check (generation, mounted, focus).
 */
export async function startFenced<T = void>(f: {
  start: () => Promise<T> | T;
  stop: (started: T, why: FenceBlock) => unknown;
  isCurrent?: () => boolean;
}): Promise<FenceResult<T>> {
  const blocked = armFence(f.isCurrent);
  const value = await f.start();
  const why = blocked();
  if (why === null) return { status: 'started', value };
  try {
    void Promise.resolve(f.stop(value, why)).catch(() => {});
  } catch {
    /* the voice is idle or absent — the start is still blocked */
  }
  return { status: 'blocked', why };
}
