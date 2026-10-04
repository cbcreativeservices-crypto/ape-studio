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
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { EarClipPlayer } from '../../../features/ear/earPlayer';
import { useAudioOutputGate } from '../../../features/audio/AudioOutputGate';
import { startFenced } from '../../../features/audio/startFenced';
import { useStopWhenSilenced } from '../../../features/audio/useStopWhenSilenced';
import { useStopOnClose } from '../../../features/audio/useStopOnBlur';
import { isAudioOutputEnabled } from '../../../features/audio/audioOutputStore';
import { getLabPreview } from '../../../features/lab/labPreviewStore';
import { envelopeDb, overview, sustainT60, toStereo, type Overview, type RenderResult } from './drumEngine';
import { StepHostContext } from './steps';

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
  /** Render (or reuse) the CURRENT settings now and return the measurement —
   *  for a judgement that must not read the picture's debounced, possibly
   *  stale render. */
  measure: () => DrumRendered;
  /** Play the current key (rendering first if the picture is stale).
   *  Resolves true only when the clip actually started sounding. */
  play: () => Promise<boolean>;
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
  /** The newest ▶ press; ■ STOP bumps it too (toddler pass 2). An older press
   *  still in flight never touches `pending` — the newer press or the stop
   *  owns it — and a stop cancels a press at ANY stage, the gate included. */
  const playTokRef = useRef(0);
  /** ▶ loads in flight (perf hunt 2026-10-03): a PRELOAD never starts while
   *  one runs — it would bump `seqRef` and supersede the press's own load, and
   *  the press would fail silently. Counted in `load` itself, so it is exact
   *  whatever ends the press (■, a fader, a failed write). */
  const pressLoadsRef = useRef(0);
  /** The in-flight PRELOAD (below): a ▶ for the same key waits for it rather
   *  than writing the same clip a second time. */
  const preloadRef = useRef<{ key: string; p: Promise<boolean> } | null>(null);

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
      // A ▶ still rendering / loading the OLD settings must not sound when it
      // lands (toddler pass 1): EarClipPlayer.load spans many ticks, a fader
      // moved inside them, and the stale clip then played — after the control
      // change, with the playhead timed from the newer render.
      seqRef.current++;
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

  // PRELOAD THE CLIP (perf hunt 2026-10-03): the picture's render IS the
  // sound, so once the controls have settled and the picture is drawn, the
  // WAV is written and the player loaded ahead of the press — ▶ STRIKE then
  // sounds at once instead of paying the encode + file write + player load on
  // the tap. Silent (no status, no announcement), never plays, and only once
  // the learner has already switched sound on this session (no audio-session
  // change before the gate), never in a preview, never off-screen, never
  // while a press is loading.
  useEffect(() => {
    if (!draw || !rendered || rendered.key !== keyRef.current) return;
    const t = setTimeout(() => preloadRef2.current(), 250);
    return () => clearTimeout(t);
  }, [rendered, draw]);

  const loadBody = useCallback(async (quiet: boolean): Promise<boolean> => {
    // A PRELOAD of this very key is already writing the clip: let it land
    // (or fail) first; the check below then finds it loaded and returns at
    // once. A key change or a ■ in the meantime bumps `seqRef`, which voids
    // the preload exactly as it voids any other load.
    const inflight = preloadRef.current;
    if (!quiet && inflight && inflight.key === keyRef.current) await inflight.p.catch(() => false);
    const my = ++seqRef.current;
    const k = keyRef.current;
    if (loadedKeyRef.current === k && playerRef.current) return true;
    if (!quiet) {
      setStatus('rendering');
      AccessibilityInfo.announceForAccessibility?.('Rendering the drum.');
    }
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
  /** The load; `quiet` = a PRELOAD (no status, no announcement). */
  const load = useCallback(async (quiet = false): Promise<boolean> => {
    if (!quiet) pressLoadsRef.current++;
    try {
      return await loadBody(quiet);
    } finally {
      if (!quiet) pressLoadsRef.current--;
    }
  }, [loadBody]);

  const preload = useCallback(() => {
    if (!aliveRef.current || !focusedRef.current || hiddenRef.current) return;
    if (pressLoadsRef.current > 0) return;
    if (!isAudioOutputEnabled() || getLabPreview().active) return;
    const k = keyRef.current;
    if (loadedKeyRef.current === k && playerRef.current) return;
    if (preloadRef.current?.key === k) return;
    const entry = { key: k, p: load(true).catch(() => false) };
    preloadRef.current = entry;
    void entry.p.then(() => {
      if (preloadRef.current === entry) preloadRef.current = null;
    });
  }, [load]);
  const preloadRef2 = useRef(preload);
  preloadRef2.current = preload;

  const play = useCallback((): Promise<boolean> => {
    const t = ++playTokRef.current;
    const current = () => aliveRef.current && t === playTokRef.current;
    // Resolves TRUE only when the clip actually started (toddler pass 3): a
    // page that counts a press as evidence ("lug tapped") counts it on this,
    // never on the press — a gate refused, a ■, a fader moved mid-render or a
    // failed load all resolve false.
    return (async () => {
      const granted = await requestAudioOutput();
      if (!current()) return false;
      // A denied gate / a lab no longer in front: this press owns `pending`
      // now (an older press may have left it on), so it clears it.
      if (!granted || !focusedRef.current) {
        setPending(false);
        return false;
      }
      setPending(true);
      // The fence (startFenced): a mute, a ■, a fader moved mid-render, or a
      // stop-all (leaving the app with "Mute audio when I leave the app" OFF —
      // the gate stays ON, so a gate check alone missed it) during the load
      // means nothing sounds.
      const fenced = await startFenced({
        start: load,
        stop: () => {}, // loaded, not sounding: nothing to silence
        isCurrent: current,
      });
      // ▶ ▶ fast (toddler pass 2): the FIRST press's load is superseded and
      // used to clear `pending` here while the second press was still
      // rendering — the status flickered to "stopped" and the silence guard
      // saw nothing in flight. The newer press (or a ■) owns it.
      if (!current()) return false;
      setPending(false);
      if (fenced.status !== 'started' || !fenced.value || !focusedRef.current || !playerRef.current) return false;
      const r = renderedRef.current;
      clipSeconds.value = r ? r.result.seconds : 1;
      playerRef.current.play(0);
      // ▶ again on the sounding clip restarts it from 0: re-arm the playhead.
      startedAt.value = 0;
      progress.value = 0;
      setPlaying(true);
      return true;
    })().catch(() => false);
  }, [requestAudioOutput, load, clipSeconds, startedAt, progress]);

  const stop = useCallback(() => {
    seqRef.current++;
    playTokRef.current++;
    playerRef.current?.stop();
    setPending(false);
    setPlaying(false);
    if (loadedKeyRef.current === keyRef.current && playerRef.current) setStatus('ready');
    else setStatus('idle');
  }, []);

  useStopWhenSilenced(playing || pending, stop);
  useStopOnClose(stop);
  // LEAVING THE DISPLAY STOPS THE SOUND (the Mastering / Tuning chapter
  // rule): a chapter stays mounted across its steps, so paging from a HEAR
  // step to the reading or the PRACTICE deck would leave a strike sounding
  // with no display on screen. The render survives; only the sound stops.
  // No-op on the first mount (nothing is sounding yet).
  const host = useContext(StepHostContext);
  const hostStep = host?.step;
  const stepSeen = useRef(hostStep);
  useEffect(() => {
    if (stepSeen.current === hostStep) return;
    stepSeen.current = hostStep;
    stop();
  }, [hostStep, stop]);
  // The what's-left screen covers the chapter (toddler pass 2): the chapter
  // stays mounted underneath so ‹ PREV comes back to it exactly as it was,
  // but nothing may keep sounding behind the end screen.
  const hidden = host?.hidden === true;
  useEffect(() => {
    if (hidden) stop();
  }, [hidden, stop]);
  const hiddenRef = useRef(hidden);
  hiddenRef.current = hidden;

  return useMemo(() => ({ status, measure: renderNow, play, stop, playing, pending, rendered, progress }), [status, renderNow, play, stop, playing, pending, rendered, progress]);
}
