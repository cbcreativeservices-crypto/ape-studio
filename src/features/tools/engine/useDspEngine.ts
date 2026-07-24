/**
 * useDspEngine — shared lifecycle + polling for the live measurement tools
 * (engine build 2026-07-23). Wraps modules/ape-dsp:
 *  - starts capture on mount-with-consent (explicit user START — spec §18:
 *    never run DSP the user didn't start), stops on unmount/blur,
 *  - polls the requested frames at ≤20 Hz (spike bridge rule: ≤30 Hz),
 *  - maps native conditions onto the Phase-2 measurement-quality flags so
 *    every live screen surfaces the SAME plain-language warnings (spec §6)
 *    that get stored on save.
 *
 * Engine gating: `state` distinguishes module-absent / spike-build (v1, no
 * engine) / ready — callers render the honest EngineGate states, never
 * simulate (measurement-tools §1.7).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  ApeDsp,
  type BandsFrame,
  type EngineConfig,
  type MeterFrame,
  type PitchFrame,
  type WaveBucket,
} from '../../../../modules/ape-dsp';
import type { WarningFlag } from '../measure/types';

/** Android runtime mic-permission request (iOS requests it natively inside the
 *  module). Returns true if granted. No-op → true on non-Android. */
async function ensureMicPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    return res === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export type EngineState =
  | 'absent' // module not in this build (web/Android/old client)
  | 'spike' // Spike-0 build: capture exists, engine does not — needs new build
  | 'idle' // engine ready, capture not started
  | 'starting'
  | 'running'
  | 'denied' // mic permission refused
  | 'error';

export type DspPoll = {
  meter: MeterFrame | null;
  bands: BandsFrame | null;
  pitch: PitchFrame | null;
  waveform: WaveBucket[];
};

const POLL_MS = 66; // ~15 Hz — well inside the ≤30 Hz bridge rule

export function useDspEngine(config: EngineConfig, poll: {
  meter?: boolean;
  bands?: boolean;
  pitch?: boolean;
  waveform?: boolean;
}) {
  const [state, setState] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const [frames, setFrames] = useState<DspPoll>({ meter: null, bands: null, pitch: null, waveform: [] });
  const [lastError, setLastError] = useState('');
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef(poll);
  pollRef.current = poll;
  // Live config ref (review 2026-07-23): START must push the CURRENT config,
  // not the one captured when the callback was created.
  const configRef = useRef(config);
  configRef.current = config;
  // Generation counter (review 2026-07-23): invalidates an in-flight start()
  // when the screen stops/blur/unmounts before the native promise resolves —
  // otherwise the poll interval leaks past teardown.
  const genRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  const start = useCallback(async () => {
    if (state === 'absent' || state === 'spike') return;
    const gen = ++genRef.current;
    setState('starting');
    try {
      // Android: request RECORD_AUDIO before capture (iOS requests natively).
      if (!(await ensureMicPermission())) {
        if (gen === genRef.current) setState('denied');
        return;
      }
      if (gen !== genRef.current) return;
      ApeDsp.setEngineConfig(configRef.current);
      await ApeDsp.start();
      if (gen !== genRef.current) {
        // Torn down while starting — close the native ordering hole too.
        void ApeDsp.stop();
        return;
      }
      setState('running');
      stopPolling();
      timer.current = setInterval(() => {
        const p = pollRef.current;
        setFrames({
          meter: p.meter ? ApeDsp.getMeterFrame() : null,
          bands: p.bands ? ApeDsp.getBandsFrame() : null,
          pitch: p.pitch ? ApeDsp.getPitchFrame() : null,
          waveform: p.waveform ? ApeDsp.getWaveform() : [],
        });
      }, POLL_MS);
    } catch (e) {
      if (gen !== genRef.current) return;
      const msg = e instanceof Error ? e.message : String(e);
      setLastError(msg);
      setState(/denied|access is off/i.test(msg) ? 'denied' : 'error');
    }
  }, [state, stopPolling]);

  const stop = useCallback(() => {
    genRef.current++;
    stopPolling();
    void ApeDsp.stop();
    setState((s) => (s === 'running' || s === 'starting' ? 'idle' : s));
  }, [stopPolling]);

  // Teardown on BLUR and unmount (review 2026-07-23): live screens sit on the
  // root stack, so a pushed screen (e.g. the library) keeps them mounted — the
  // mic must not stay hot behind another screen (spec §18 + privacy copy).
  // State returns to 'idle' so refocus shows the explicit-START affordance
  // (never auto-restarts — integrity rule).
  useFocusEffect(
    useCallback(
      () => () => {
        genRef.current++;
        stopPolling();
        void ApeDsp.stop();
        setState((s) => (s === 'running' || s === 'starting' ? 'idle' : s));
      },
      [stopPolling],
    ),
  );

  // Belt-and-suspenders unmount teardown (also covers non-navigator hosts).
  useEffect(
    () => () => {
      genRef.current++;
      stopPolling();
      void ApeDsp.stop();
    },
    [stopPolling],
  );

  return { state, frames, start, stop, lastError, resetPeakHold: ApeDsp.resetPeakHold, resetLeq: () => ApeDsp.resetLeq() };
}

/** Map live native conditions → the Phase-2 quality flags (spec §6). The SAME
 *  flags shown live are stored on save, so screen and library always agree. */
export function meterWarningFlags(m: MeterFrame | null): WarningFlag[] {
  if (!m) return [];
  const flags: WarningFlag[] = [];
  if (m.clipRuns > 0) flags.push('input_clipping');
  if (m.processedInput) flags.push('uncalibrated_input'); // OS is filtering the mic
  if (m.bluetoothInput) flags.push('unsupported_input'); // HFP band-limits (spike rule)
  if (m.captureStalled || !m.running) flags.push('engine_inactive');
  return flags;
}
