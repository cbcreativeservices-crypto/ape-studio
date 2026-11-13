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
 *   the output ceiling   the engine applies a −12 dBFS sample-peak ceiling
 *                        itself, last, behind a hard stop at full scale: no
 *                        sample handed to the device is above it (engine/
 *                        gaEngineSource GA_OUTPUT_CEILING)
 *   listening exposure   the engine's MEASURED mix level is reported to the
 *                        register (setFilePlayerLevel), never assumed: the
 *                        LOUDER of the mix and either ear, since a sound in
 *                        one ear only reads 6 dB low in the folded mix
 *   leaving the screen   useStopOnClose; a silenced gate → useStopWhenSilenced
 *   members-only preview no sound and no prompt (getLabPreview().active is
 *                        asked first), as in every lab
 *   the SOUND key        disable() really switches sound off: everything
 *                        stops, the engine's output is shut, and `sound`
 *                        reads 'off' until enable() is asked again. It reads
 *                        'on' only once the fenced start has gone through
 *                        (check E, problem 5), and a mute from outside the
 *                        lab (shake, idle lock, leaving the app) switches it
 *                        OFF the same way: when the gate opens again the lab
 *                        stays silent until the learner presses SOUND
 *                        (check E, problem 10)
 *
 * `sound` is what the screen may honestly say:
 *   off          not asked, or switched   declined     the learner said no
 *                off with the SOUND key
 *   starting     the engine is starting   blocked      the device is holding
 *   on           the engine is running                 audio back — tap again
 *   unavailable  no engine on this device failed       it did not start
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useAudioOutputGate } from '../../../../features/audio/AudioOutputGate';
import { isAudioOutputEnabled, useAudioOutputEnabled } from '../../../../features/audio/audioOutputStore';
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
import { gaSoundStateOf, type GaSoundState } from './gaSoundState';

export type { GaSoundState } from './gaSoundState';

export type GaSoundSession = {
  engine: GaEngine;
  sound: GaSoundState;
  /** Ask for sound (the gate, then the engine). True when it is on. */
  enable: () => Promise<boolean>;
  /** Stop everything that is sounding; the engine stays ready. */
  stopAll: () => void;
  /** The learner switched SOUND off: stop everything, and `sound` reads
   *  'off' until `enable()` is asked again (audit 2, F7). */
  disable: () => void;
  /** Make sure the engine holds these assets. Resolves with the ids that
   *  could NOT be loaded (empty = all there). */
  ensure: (ids: readonly string[]) => Promise<string[]>;
};

export function useGaSound(onStopped?: () => void): GaSoundSession {
  const engine = useMemo(() => new GaEngine(), []);
  const { requestAudioOutput } = useAudioOutputGate();
  const [status, setStatus] = useState<GaEngineStatus>(engine.status);
  const [declined, setDeclined] = useState(false);
  /** The learner has asked for sound, the fenced start went through, and
   *  sound has not been switched off since. */
  const [wanted, setWanted] = useState(false);
  /** A SOUND press is being answered (the gate, the fence, the engine). */
  const [asking, setAsking] = useState(false);
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
      // `rms` is the mix folded to mono: a sound in one ear only reads 6 dB
      // low there. Exposure takes the loudest of the three (audit 2, F16).
      const rms = Math.max(e.rms, e.l, e.r);
      setFilePlayerLevel(player, rms > 1e-6 ? 20 * Math.log10(rms) + SINE_PEAK_OVER_RMS_DB : -Infinity);
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

  const disable = useCallback(() => {
    gen.current++; // a start still in flight is superseded: it will not sound
    setWanted(false);
    setDeclined(false);
    engine.stopAll(0.03);
    // and the engine's output is shut, so nothing asked of it while SOUND is
    // off can reach the device; enable() opens it again
    engine.send({ t: 'silent', on: true });
    onStoppedRef.current?.();
    AccessibilityInfo.announceForAccessibility?.('Sound off.');
  }, [engine]);

  const enable = useCallback(async (): Promise<boolean> => {
    // A members-only preview never sounds: say so before any prompt, not
    // after one that leads nowhere (audit 2, F30).
    if (getLabPreview().active) return false;
    const ok = await requestAudioOutput();
    if (!alive.current) return false;
    setDeclined(!ok);
    if (!ok) return false;
    const mine = ++gen.current;
    setAsking(true);
    const fenced = await startFenced({
      start: () => {
        // open the output disable() shut (ignored by an engine not started yet)
        engine.send({ t: 'silent', on: false });
        return engine.init();
      },
      stop: () => engine.stopAll(0.01),
      isCurrent: () => alive.current && mine === gen.current,
    }).finally(() => {
      if (mine === gen.current) setAsking(false);
    });
    if (fenced.status !== 'started') {
      // Blocked (the notice was declined, a mute or a stop landed during
      // the start): SOUND stays off and the output is shut again. A NEWER
      // press owns the output when this one was superseded: leave it be.
      if (fenced.why !== 'superseded' && alive.current) {
        setWanted(false);
        engine.send({ t: 'silent', on: true });
      }
      return false;
    }
    // only now may SOUND read on (check E, problem 5)
    if (alive.current) setWanted(true);
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

  // The app silenced audio (shake-to-mute, the idle lock, leaving the app):
  // if the gate CLOSED, SOUND is switched off as by the key, so reopening
  // the gate does not bring the lab back on without a press (check E,
  // problem 10). If only every sound was stopped (the gate is still open),
  // it is a ■ STOP.
  const silenced = useCallback(() => {
    if (isAudioOutputEnabled()) stopAll();
    else disable();
  }, [stopAll, disable]);
  const sounding = status === 'running';
  useStopWhenSilenced(sounding || wanted, silenced);
  useStopOnClose(stopAll);

  // SOUND switched off (or never asked for) reads 'off' whatever the engine
  // is doing; a gate that is closed means nothing may sound, whatever the
  // engine says. "No engine on this device" is said either way.
  const sound: GaSoundState = gaSoundStateOf(status, declined, wanted, gateOn, asking);

  return { engine, sound, enable, stopAll, disable, ensure };
}
