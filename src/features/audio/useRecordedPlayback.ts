/**
 * useRecordedPlayback — play processed versions of a decoded recording, the
 * useMasterPlayback way (2026-10-01):
 *
 *   const clip = useLabClipBuffer('demo_signals', 'piano-chord-1');
 *   const pb = useRecordedPlayback(clip.buffer, [
 *     { id: 'dry', process: { rmsTargetDb: -20 } },
 *     { id: 'eq',  process: { rmsTargetDb: -20, eq: [{ type: 'peak', freq: 1000, gainDb: 6 }] } },
 *   ]);
 *   <Button onPress={() => pb.play('eq')} />  ·  pb.active === 'eq'
 *
 * render → play: the first ▶ renders every version (renderRecorded) and loads
 * them into ONE EarClipPlayer; later presses play at once. A changed source or
 * process set makes the renders stale — whatever was sounding stops and the
 * next ▶ renders afresh (no unasked restart).
 *
 * Safety, identical to the other sounding labs: nothing sounds before
 * requestAudioOutput(); the gate is asked again at the last moment (a mute can
 * land during the render); shake-to-mute / idle lock / backgrounding unwind
 * the transport (useStopWhenSilenced); the sound stops when the screen closes
 * (useStopOnClose) and the player is disposed on unmount. The −12 dB output
 * ceiling is applied by EarClipPlayer to every player it creates.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { EarClipPlayer } from '../ear/earPlayer';
import type { Buf } from '../ear/earDsp';
import { useAudioOutputGate } from './AudioOutputGate';
import { isAudioOutputEnabled } from './audioOutputStore';
import { useStopWhenSilenced } from './useStopWhenSilenced';
import { useStopOnClose } from './useStopOnBlur';
import { renderRecorded, type RecordedProcess, type RecordedSource } from './renderRecorded';

export type RecordedVariant = { id: string; process: RecordedProcess };

export type RecordedPlayback = {
  status: 'idle' | 'rendering' | 'ready';
  play: (id: string) => void;
  stop: () => void;
  /** The version sounding, or null. */
  active: string | null;
  /** A version queued behind its render, or null. */
  pending: string | null;
};

const breathe = () => new Promise<void>((r) => setTimeout(r, 0));

export function useRecordedPlayback(
  source: (RecordedSource & { assetKey?: string; frames?: number }) | null,
  variants: readonly RecordedVariant[],
): RecordedPlayback {
  const { requestAudioOutput } = useAudioOutputGate();
  const [status, setStatus] = useState<RecordedPlayback['status']>('idle');
  const [active, setActive] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const playerRef = useRef<EarClipPlayer | null>(null);
  const idsRef = useRef<string[]>([]);
  const aliveRef = useRef(true);
  const focusedRef = useRef(true);
  const seqRef = useRef(0);
  const signature = useMemo(() => JSON.stringify(variants), [variants]);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      playerRef.current?.dispose();
      playerRef.current = null;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      return () => {
        focusedRef.current = false;
      };
    }, []),
  );

  // New source or process set: the loaded renders are stale.
  useEffect(() => {
    seqRef.current++;
    playerRef.current?.stop();
    idsRef.current = [];
    setActive(null);
    setPending(null);
    setStatus('idle');
  }, [source, signature]);

  const renderAndPlay = useCallback(
    async (want: string) => {
      if (!source) return;
      const my = ++seqRef.current;
      const current = () => aliveRef.current && my === seqRef.current;
      setStatus('rendering');
      setPending(want);
      try {
        await breathe();
        const bufs: Buf[] = [];
        for (const v of variants) {
          if (!current()) return;
          bufs.push(renderRecorded(source, v.process));
          await breathe(); // one render per tick — never a frozen screen
        }
        if (!current()) return;
        if (!playerRef.current) {
          const p = new EarClipPlayer();
          p.onEnded = () => {
            if (aliveRef.current) setActive(null);
          };
          playerRef.current = p;
        }
        await playerRef.current.load(bufs);
        if (!current()) return;
        idsRef.current = variants.map((v) => v.id);
        setStatus('ready');
        setPending(null);
        const i = idsRef.current.indexOf(want);
        // Last-moment gate + focus check: a mute or a leave during the render
        // means nothing starts.
        if (i >= 0 && focusedRef.current && isAudioOutputEnabled()) {
          playerRef.current.play(i);
          setActive(want);
        }
      } catch {
        // A failed clip write must never wedge the transport on RENDERING.
        if (current()) {
          idsRef.current = [];
          setPending(null);
          setStatus('idle');
        }
      }
    },
    [source, variants],
  );

  const play = useCallback(
    (id: string) => {
      void (async () => {
        if (!(await requestAudioOutput())) return;
        if (!aliveRef.current || !focusedRef.current) return;
        const i = idsRef.current.indexOf(id);
        if (i < 0 || !playerRef.current) {
          void renderAndPlay(id);
          return;
        }
        if (!isAudioOutputEnabled()) return;
        playerRef.current.play(i);
        setActive(id);
      })();
    },
    [requestAudioOutput, renderAndPlay],
  );

  const stop = useCallback(() => {
    // A STOP during a render cancels the queued play too.
    if (pending) seqRef.current++;
    playerRef.current?.stop();
    setActive(null);
    setPending(null);
    if (idsRef.current.length === 0) setStatus('idle');
  }, [pending]);

  useStopWhenSilenced(active != null || pending != null, stop);
  useStopOnClose(stop);

  return { status, play, stop, active, pending };
}
