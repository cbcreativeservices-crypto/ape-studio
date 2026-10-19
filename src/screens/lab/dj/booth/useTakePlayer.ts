/**
 * useTakePlayer — PLAY BACK the recorder's take (screen 21's playback
 * verification): the captured samples themselves, through the same
 * EarClipPlayer path and behind the same sound gate and fence as the booth
 * (requestAudioOutput → startFenced), at the lab's LISTEN level and through
 * the protective limiter. The booth stops first: one sound at a time.
 *
 * `pos` (a SharedValue, seconds into the take) drives the take lane's
 * playhead on the UI thread; with sound off the playhead still runs, so the
 * check can be made by eye — the lab says the ear is the real test.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { EarClipPlayer } from '../../../../features/ear/earPlayer';
import { useAudioOutputGate } from '../../../../features/audio/AudioOutputGate';
import { startFenced } from '../../../../features/audio/startFenced';
import { isAudioOutputEnabled } from '../../../../features/audio/audioOutputStore';
import { useStopOnClose } from '../../../../features/audio/useStopOnBlur';
import { useStopWhenSilenced } from '../../../../features/audio/useStopWhenSilenced';
import { getLabPreview } from '../../../../features/lab/labPreviewStore';
import { dbToLin, protectiveLimitInPlace } from '../engine/djDsp';
import { listenDb } from '../model/djModel';
import { getBooth } from './boothStore';
import type { TakeView } from './takeStore';

export type TakePlayer = { playing: boolean; finished: boolean; play: (t: TakeView) => void; stop: () => void; pos: SharedValue<number> };

export function useTakePlayer(stopBooth: () => void): TakePlayer {
  const { requestAudioOutput } = useAudioOutputGate();
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const pos = useSharedValue(0);
  const startTs = useSharedValue(0);
  const len = useSharedValue(0);
  const seq = useSharedValue(0);
  const seen = useSharedValue(-1);
  const playerRef = useRef<EarClipPlayer | null>(null);
  const genRef = useRef(0);
  const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frame = useFrameCallback((info) => {
    'worklet';
    if (seq.value !== seen.value) {
      seen.value = seq.value;
      startTs.value = info.timestamp;
    }
    const p = (info.timestamp - startTs.value) / 1000;
    pos.value = p > len.value ? len.value : p;
  }, false);

  const stop = useCallback(() => {
    genRef.current++;
    if (endTimer.current) clearTimeout(endTimer.current);
    playerRef.current?.stop();
    frame.setActive(false);
    setPlaying(false);
  }, [frame]);

  const play = useCallback(
    (t: TakeView) => {
      stopBooth();
      const gen = ++genRef.current;
      setFinished(false);
      void (async () => {
        const ok = await requestAudioOutput();
        if (gen !== genRef.current) return;
        // the take, at the lab's LISTEN level, behind the protective limiter
        const g = dbToLin(listenDb(getBooth().listen));
        const l = new Float32Array(t.l.length);
        const r = new Float32Array(t.r.length);
        for (let i = 0; i < l.length; i++) {
          l[i] = t.l[i] * g;
          r[i] = t.r[i] * g;
        }
        protectiveLimitInPlace(l, r);
        const sound = ok && isAudioOutputEnabled() && !getLabPreview().active;
        if (sound) {
          if (!playerRef.current) playerRef.current = new EarClipPlayer();
          const p = playerRef.current;
          const res = await startFenced({ start: () => p.load([{ l, r }]), stop: () => p.stop(), isCurrent: () => gen === genRef.current });
          if (res.status !== 'started' || gen !== genRef.current) return;
          p.play(0);
        }
        len.value = t.seconds;
        seq.value = seq.value + 1;
        frame.setActive(true);
        setPlaying(true);
        endTimer.current = setTimeout(() => {
          if (gen !== genRef.current) return;
          frame.setActive(false);
          pos.value = t.seconds;
          setPlaying(false);
          setFinished(true);
        }, t.seconds * 1000 + 150);
      })();
    },
    [frame, len, pos, requestAudioOutput, seq, stopBooth],
  );

  useEffect(
    () => () => {
      genRef.current++;
      if (endTimer.current) clearTimeout(endTimer.current);
      playerRef.current?.stop();
      playerRef.current?.dispose();
      playerRef.current = null;
    },
    [],
  );
  useStopWhenSilenced(playing, stop);
  useStopOnClose(stop);
  return { playing, finished, play, stop, pos };
}
