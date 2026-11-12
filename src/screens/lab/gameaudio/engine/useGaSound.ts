/**
 * useGaSound — the Game Audio lab's sound SESSION: one GaEngine for the lab
 * screen, wired into every safety path the app has, so this new kind of
 * player cannot be the one that keeps sounding.
 *
 *   the output gate      enable() asks useAudioOutputGate first, every time
 *   the start fence      the engine start goes through startFenced (a mute
 *                        or a newer press during the start blocks it)
 *   shake-to-mute, the   the engine is registered as a file player
 *   idle lock, sign-in   (features/audio/filePlayers), so stopAllFilePlayers
 *   re-mute              reaches it; its `playing` and level are REAL
 *   the output ceiling   the engine applies −12 dBFS itself, last
 *                        (engine/gaEngineSource GA_OUTPUT_CEILING)
 *   listening exposure   the engine's MEASURED mix level is reported to the
 *                        register (setFilePlayerLevel), never assumed
 *   leaving the screen   useStopOnClose; a silenced gate → useStopWhenSilenced
 *   members-only preview no sound (getLabPreview().active), as in every lab
 *
 * `sound` is what the screen may honestly say:
 *   off          not asked yet            declined     the learner said no
 *   starting     the engine is starting   blocked      the device is holding
 *   on           the engine is running                 audio back — tap again
 *   unavailable  no engine on this device failed       it did not start
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useAudioOutputGate } from '../../../../features/audio/AudioOutputGate';
import { useAudioOutputEnabled } from '../../../../features/audio/audioOutputStore';
import {
  SINE_PEAK_OVER_RMS_DB,
  registerFilePlayer,
  setFilePlayerLevel,
  unregisterFilePlayer,
  type StoppablePlayer,
} from '../../../../features/audio/filePlayers';
import { PLAYBACK_CEILING } from '../../../../features/audio/outputCeiling';
import { startFenced } from '../../../../features/audio/startFenced';
import { useStopOnClose } from '../../../../features/audio/useStopOnBlur';
import { useStopWhenSilenced } from '../../../../features/audio/useStopWhenSilenced';
import { getLabPreview } from '../../../../features/lab/labPreviewStore';
import { runSoon } from '../../../../lib/afterInteractions';
import { gaSound, releaseGaSounds } from '../sounds/gaSoundBank';
import { GaEngine, type GaEngineStatus } from './gaEngine';

export type GaSoundState = 'off' | 'starting' | 'on' | 'blocked' | 'declined' | 'unavailable' | 'failed';

export type GaSoundSession = {
  engine: GaEngine;
  sound: GaSoundState;
  /** Ask for sound (the gate, then the engine). True when it is on. */
  enable: () => Promise<boolean>;
  /** Stop everything that is sounding; the engine stays ready. */
  stopAll: () => void;
  /** Make sure the engine holds these assets. Resolves with the ids that
   *  could NOT be loaded (empty = all there). */
  ensure: (ids: readonly string[]) => Promise<string[]>;
};

const stateOf = (s: GaEngineStatus, declined: boolean): GaSoundState =>
  declined ? 'declined' : s === 'running' ? 'on' : s === 'starting' ? 'starting' : s === 'blocked' ? 'blocked' : s === 'unavailable' ? 'unavailable' : s === 'failed' ? 'failed' : 'off';

export function useGaSound(onStopped?: () => void): GaSoundSession {
  const engine = useMemo(() => new GaEngine(), []);
  const { requestAudioOutput } = useAudioOutputGate();
  const [status, setStatus] = useState<GaEngineStatus>(engine.status);
  const [declined, setDeclined] = useState(false);
  const gateOn = useAudioOutputEnabled();
  const alive = useRef(true);
  const gen = useRef(0);
  const onStoppedRef = useRef(onStopped);
  onStoppedRef.current = onStopped;

  useEffect(() => engine.onStatus(() => setStatus(engine.status)), [engine]);

  // The engine as the safety register sees it: stoppable, and honest about
  // whether it is sounding and how loud.
  useEffect(() => {
    const player: StoppablePlayer = {
      pause: () => {
        engine.stopAll(0.02);
        onStoppedRef.current?.();
      },
      get playing() {
        return engine.status === 'running' && engine.level.voices > 0;
      },
      volume: PLAYBACK_CEILING,
      muted: false,
      isLoaded: true,
      isBuffering: false,
    };
    registerFilePlayer(player);
    const off = engine.subscribe((e) => {
      if (e.e !== 'level') return;
      setFilePlayerLevel(player, e.rms > 1e-6 ? 20 * Math.log10(e.rms) + SINE_PEAK_OVER_RMS_DB : -Infinity);
    });
    return () => {
      off();
      unregisterFilePlayer(player);
    };
  }, [engine]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      gen.current++;
      releaseGaSounds();
    };
  }, []);

  const stopAll = useCallback(() => {
    gen.current++;
    engine.stopAll(0.03);
    onStoppedRef.current?.();
  }, [engine]);

  const enable = useCallback(async (): Promise<boolean> => {
    const ok = await requestAudioOutput();
    if (!alive.current) return false;
    setDeclined(!ok);
    if (!ok || getLabPreview().active) return false;
    const mine = ++gen.current;
    const fenced = await startFenced({
      start: () => engine.init(),
      stop: () => engine.stopAll(0.01),
      isCurrent: () => alive.current && mine === gen.current,
    });
    if (fenced.status !== 'started') return false;
    if (fenced.value === 'blocked') {
      // a tap is in hand: ask the device once more
      engine.resume();
    }
    const on = engine.status === 'running';
    if (on) AccessibilityInfo.announceForAccessibility?.('Sound on.');
    return on;
  }, [engine, requestAudioOutput]);

  const ensure = useCallback(
    async (ids: readonly string[]): Promise<string[]> => {
      const missing: string[] = [];
      for (const id of ids) {
        if (engine.has(id)) continue;
        // one asset per macrotask: building a sound is real work, and a tap
        // must be able to land between two of them
        await new Promise<void>((r) => runSoon(r));
        if (!alive.current) return [...ids];
        const s = gaSound(id);
        if (!s) {
          missing.push(id);
          continue;
        }
        const ok = await engine.load(id, s.sr, s.ch);
        if (!ok) missing.push(id);
      }
      return missing;
    },
    [engine],
  );

  const sounding = status === 'running';
  useStopWhenSilenced(sounding, stopAll);
  useStopOnClose(stopAll);

  // A gate that is closed means nothing may sound, whatever the engine says.
  const sound: GaSoundState = !gateOn && status === 'running' ? 'off' : stateOf(status, declined);

  return { engine, sound, enable, stopAll, ensure };
}
