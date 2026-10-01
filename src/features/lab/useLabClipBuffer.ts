/**
 * useLabClipBuffer — a lab asset as decoded 48 kHz DSP buffers, for a screen.
 *
 *   const clip = useLabClipBuffer('demo_signals', 'piano-chord-1');
 *   clip.status === 'ready' && renderRecorded(clip.buffer, { … });
 *
 * Pass null keys to stay 'idle' (load nothing) — e.g. until the learner picks
 * a recorded source. A key change cancels the old request and starts the new
 * one; unmounting cancels too, so no result lands on a dead screen. A clip
 * already in memory is 'ready' on the first render.
 *
 * Loading is silent: nothing plays, nothing pops up (Low-Light rule). No
 * account is needed — these are public teaching assets.
 */
import { useCallback, useEffect, useState } from 'react';
import { loadLabClipBuffer, peekLabClipBuffer, type LabClipBuffer, type LabClipError } from './labClipBuffer';
import { LabClipError as ClipError, isLabClipError } from './labClipCache';

export type LabClipStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface UseLabClipBuffer {
  status: LabClipStatus;
  buffer: LabClipBuffer | null;
  error: LabClipError | null;
  /** Try again after an error (no-op otherwise). */
  retry: () => void;
}

type State = { key: string | null; status: LabClipStatus; buffer: LabClipBuffer | null; error: LabClipError | null };

function initial(labKey: string | null, assetKey: string | null): State {
  if (!labKey || !assetKey) return { key: null, status: 'idle', buffer: null, error: null };
  const key = `${labKey}/${assetKey}`;
  const hit = peekLabClipBuffer(labKey, assetKey);
  return hit ? { key, status: 'ready', buffer: hit, error: null } : { key, status: 'loading', buffer: null, error: null };
}

export function useLabClipBuffer(labKey: string | null, assetKey: string | null): UseLabClipBuffer {
  const [state, setState] = useState<State>(() => initial(labKey, assetKey));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const start = initial(labKey, assetKey);
    setState(start);
    if (start.status !== 'loading' || !labKey || !assetKey) return;
    const ctl = new AbortController();
    loadLabClipBuffer(labKey, assetKey, { signal: ctl.signal }).then(
      (buffer) => {
        if (!ctl.signal.aborted) setState({ key: start.key, status: 'ready', buffer, error: null });
      },
      (e: unknown) => {
        if (ctl.signal.aborted) return;
        if (isLabClipError(e) && e.code === 'aborted') return;
        // loadLabClipBuffer only rejects with LabClipError; anything else is
        // reported as offline rather than escaping.
        const error = isLabClipError(e) ? e : new ClipError('offline', (e as Error)?.message);
        setState({ key: start.key, status: 'error', buffer: null, error });
      },
    );
    return () => ctl.abort();
  }, [labKey, assetKey, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  // A key change renders once before the effect runs: never hand back the OLD
  // asset's buffer under the new key.
  const key = labKey && assetKey ? `${labKey}/${assetKey}` : null;
  if (state.key !== key) {
    const now = initial(labKey, assetKey);
    return { status: now.status, buffer: now.buffer, error: null, retry };
  }
  return { status: state.status, buffer: state.buffer, error: state.error, retry };
}
