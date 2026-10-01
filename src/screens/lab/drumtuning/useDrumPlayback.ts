/**
 * useDrumPlayback — the Drum Tuning Lab's HEAR engine: render → draw →
 * play, all offline.
 *
 * The house audio pattern (Ear Training → Mixing → Mastering,
 * mastering/useMasterPlayback): real PCM rendered offline in JS
 * (drumEngine.renderStrike / renderTap), encoded to WAV, played through
 * expo-audio behind the app-wide audio-output gate. Nothing sounds before
 * requestAudioOutput(); shake-to-mute, the idle lock and backgrounding
 * unwind the transport (useStopWhenSilenced); the sound stops when the lab
 * closes (useStopOnClose) and when another sound lab comes to the front
 * (labOutputOwner).
 *
 * THE PICTURE FOLLOWS THE CONTROLS (owner hard rule: every control makes
 * a visible change): with `draw` on, a change of `key` re-renders the
 * buffer after a short settle (no sound, no gate) so the waveform, the
 * envelope and the sustain readout on the glass are the real render of
 * the CURRENT settings; ▶ then plays exactly what is drawn. Nothing ever
 * replays by itself after a control change — a press is a press.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { EarClipPlayer } from '../../../features/ear/earPlayer';
import { useAudioOutputGate } from '../../../features/audio/AudioOutputGate';
import { isAudioOutputEnabled } from '../../../features/audio/audioOutputStore';
import { useStopWhenSilenced } from '../../../features/audio/useStopWhenSilenced';
import { useStopOnClose } from '../../../features/audio/useStopOnBlur';
import { envelopeDb, overview, sustainT60, toStereo, type Overview, type RenderResult } from './drumEngine';

export type DrumRendered = {
  key: string;
  result: RenderResult;
  overview: Overview;
  /** RMS envelope, dB re the loudest 10 ms block. */
  envDb: number[];
  /** T60 estimate, seconds. */
  t60: number;
};

export type DrumPlayback = {
  status: 'idle' | 'rendering' | 'ready';
  /** Play the current key (rendering first if the picture is stale). */
  play: () => void;
  stop: () => void;
  playing: boolean;
  pending: boolean;
  rendered: DrumRendered | null;
  /** 0..1 position of the sounding clip, per frame (a SharedValue — never
   *  React state), for the playhead and the vibration view. */
  progress: SharedValue<number>;
};

export function measureRender(key: string, result: RenderResult): DrumRendered {
  return { key, result, overview: overview(toStereo(result.mono), 160), envDb: envelopeDb(result.mono, 10), t60: sustainT60(result.mono) };
}

/**
 * @param key   a string that changes whenever the sound would change.
 * @param make  the pure render for the current settings.
 * @param draw  render on every key change (for a page whose glass draws the
 *              buffer); off = render only on ▶ (lug taps).
 */
export function useDrumPlayback(key: string, make: () => RenderResult, draw = true): DrumPlayback {
  const { requestAudioOutput } = useAudioOutputGate();
  const [status, setStatus] = useState<DrumPlayback['status']>('idle');
  const [playing, setPlaying] = useState(false);
  const [pending, setPending] = useState(false);
  const [rendered, setRendered] = useState<DrumRendered | null>(null);
  const playerRef = useRef<EarClipPlayer | null>(null);
  /** The key the player's loaded clip was rendered from. */
  const loadedKeyRef = useRef<string | null>(null);
  const renderedRef = useRef<DrumRendered | null>(null);
  renderedRef.current = rendered;
  const makeRef = useRef(make);
  makeRef.current = make;
  const keyRef = useRef(key);
  keyRef.current = key;
  const aliveRef = useRef(true);
  const seqRef = useRef(0);

  // The playhead.
  const progress = useSharedValue(0);
  const startedAt = useSharedValue(0);
  const clipSeconds = useSharedValue(1);
  const frame = useFrameCallback((info) => {
    'worklet';
    const now = info.timestamp;
    if (startedAt.value === 0) startedAt.value = now;
    const p = (now - startedAt.value) / 1000 / clipSeconds.value;
    progress.value = p >= 1 ? 1 : p;
  }, false);
  useEffect(() => {
    if (playing) {
      startedAt.value = 0;
      progress.value = 0;
      frame.setActive(true);
    } else {
      frame.setActive(false);
      progress.value = 0;
    }
  }, [playing, frame, progress, startedAt]);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      playerRef.current?.stop();
      playerRef.current?.dispose();
      playerRef.current = null;
    };
  }, []);

  const focusedRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      return () => {
        focusedRef.current = false;
      };
    }, []),
  );

  /** Render the current key for the picture (no sound). */
  const renderNow = useCallback((): DrumRendered => {
    const k = keyRef.current;
    const cur = renderedRef.current;
    if (cur && cur.key === k) return cur;
    const r = measureRender(k, makeRef.current());
    renderedRef.current = r;
    if (aliveRef.current) setRendered(r);
    return r;
  }, []);

  // A control moved: the loaded clip is stale; the picture re-renders after
  // a short settle (a drag fires many keys — only the last one pays).
  useEffect(() => {
    if (loadedKeyRef.current !== key) {
      playerRef.current?.stop();
      setPlaying(false);
      setPending(false);
      setStatus('idle');
    }
    if (!draw) return;
    const t = setTimeout(() => {
      if (!aliveRef.current) return;
      renderNow();
    }, 120);
    return () => clearTimeout(t);
  }, [key, draw, renderNow]);

  const load = useCallback(async (): Promise<boolean> => {
    const my = ++seqRef.current;
    const k = keyRef.current;
    if (loadedKeyRef.current === k && playerRef.current) return true;
    setStatus('rendering');
    AccessibilityInfo.announceForAccessibility?.('Rendering the drum.');
    await new Promise((r) => setTimeout(r, 0));
    if (!aliveRef.current || my !== seqRef.current) return false;
    const r = renderNow();
    if (!playerRef.current) {
      playerRef.current = new EarClipPlayer();
      playerRef.current.onEnded = () => {
        if (aliveRef.current) setPlaying(false);
      };
    }
    const player = playerRef.current;
    try {
      await player.load([toStereo(r.result.mono)]);
    } catch {
      if (aliveRef.current && my === seqRef.current) setStatus('idle');
      return false;
    }
    if (!aliveRef.current || my !== seqRef.current) return false;
    loadedKeyRef.current = k;
    setStatus('ready');
    return true;
  }, [renderNow]);

  const play = useCallback(() => {
    void (async () => {
      if (!(await requestAudioOutput())) return;
      if (!aliveRef.current || !focusedRef.current) return;
      setPending(true);
      const ok = await load();
      if (!aliveRef.current) return;
      setPending(false);
      if (!ok || !focusedRef.current || !isAudioOutputEnabled() || !playerRef.current) return;
      const r = renderedRef.current;
      clipSeconds.value = r ? r.result.seconds : 1;
      playerRef.current.play(0);
      // ▶ again on the sounding clip restarts it from 0: re-arm the playhead.
      startedAt.value = 0;
      progress.value = 0;
      setPlaying(true);
    })();
  }, [requestAudioOutput, load, clipSeconds, startedAt, progress]);

  const stop = useCallback(() => {
    seqRef.current++;
    playerRef.current?.stop();
    setPending(false);
    setPlaying(false);
    if (loadedKeyRef.current === keyRef.current && playerRef.current) setStatus('ready');
    else setStatus('idle');
  }, []);

  useStopWhenSilenced(playing || pending, stop);
  useStopOnClose(stop);

  return useMemo(() => ({ status, play, stop, playing, pending, rendered, progress }), [status, play, stop, playing, pending, rendered, progress]);
}
