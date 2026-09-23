/**
 * useLabAudio — drop-in hook for a lab screen to play lab audio assets
 * (batch-1 wiring, 2026-09-15). Wraps LabAudioPlayer + the app-wide audio gate.
 *
 *   const { play, stop, active, loading } = useLabAudio();
 *   // in a note button:
 *   <Pressable onPress={() => play('bass_fretboard', 'bass-e-open-1')} />
 *
 * One player per hook instance, disposed on unmount. Every play() first asks the
 * app-wide audio-output gate (requestAudioOutput) — no lab sound is produced
 * before the learner has enabled audio output — then fetches the signed URL and
 * streams it. `active` is the asset_key currently sounding (drive ▶/■ off it);
 * `loading` is true between the tap and audio start (the signed-URL fetch).
 *
 * ⛔ BEFORE YOU WIRE THIS INTO A LAB: IT HAS NO SILENCE PATH.
 *
 * As of 2026-09-22 this hook has ZERO callers, so what follows is a trap laid
 * for whoever uses it first rather than a live bug.
 *
 * It carries neither `useStopWhenSilenced` nor a blur stop. `panicMuteAudio()`
 * really does call `stopAllFilePlayers()`, so shake-to-mute, backgrounding and
 * the hearing-safety cutout will all silence the CLIP — while `active` stays
 * lit, leaving the lab's ▶/■ showing playing over silence and needing two
 * presses to restart. That exact class has been fixed three times in this
 * codebase already (filePlayers, the lab transports, the Cymatics sweeps).
 *
 * The first caller must add, alongside its own transport state:
 *
 *   useStopWhenSilenced(active != null, stop);
 *
 * and stop on blur. Do it in the same commit as the wiring, not after — an
 * `active` flag that outlives its audio is exactly the "display claims to be
 * live" failure the tools rule exists to prevent.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioOutputGate } from '../audio/AudioOutputGate';
import { LabAudioPlayer } from './LabAudioPlayer';
import type { LabAudioReason } from './labAudio';

/** play() outcome. 'ok' + the fetch reasons, plus 'blocked' when the learner
 *  declined the audio-output gate (nothing played, and it is not an error). */
export type LabAudioPlayResult = LabAudioReason | 'blocked';

export interface UseLabAudio {
  /** Gate → fetch signed URL → stream. Returns 'ok' on success. */
  play: (labKey: string, assetKey: string) => Promise<LabAudioPlayResult>;
  /** Stop playback (also cancels an in-flight play). */
  stop: () => void;
  /** asset_key currently sounding, or null. */
  active: string | null;
  /** true between the tap and audio start (signed-URL fetch in flight). */
  loading: boolean;
  /** Outcome of the last play() — for surfacing a "not available / check
   *  connection" state; null before the first attempt. */
  lastResult: LabAudioPlayResult | null;
}

export function useLabAudio(): UseLabAudio {
  const { requestAudioOutput } = useAudioOutputGate();
  const playerRef = useRef<LabAudioPlayer | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<LabAudioPlayResult | null>(null);

  useEffect(() => {
    const p = new LabAudioPlayer();
    p.onEnded = () => setActive(null);
    playerRef.current = p;
    return () => {
      p.dispose();
      playerRef.current = null;
    };
  }, []);

  const play = useCallback(
    async (labKey: string, assetKey: string): Promise<LabAudioPlayResult> => {
      const p = playerRef.current;
      if (!p) return 'network';
      // App-wide audio gate — shows the enable-audio popup on first use and
      // resolves true immediately once enabled. Declined → play nothing.
      const ok = await requestAudioOutput();
      if (!ok) {
        setLastResult('blocked');
        return 'blocked';
      }
      setLoading(true);
      // try/finally: a throw between these lines left the lab's play button
      // stuck on its loading state for the life of the screen.
      let reason: Awaited<ReturnType<typeof p.play>>;
      try {
        reason = await p.play(labKey, assetKey);
      } finally {
        setLoading(false);
      }
      setLastResult(reason);
      setActive(p.active);
      return reason;
    },
    [requestAudioOutput],
  );

  const stop = useCallback(() => {
    playerRef.current?.stop();
    setActive(null);
  }, []);

  return { play, stop, active, loading, lastResult };
}
