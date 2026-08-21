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
import { AppState, InteractionManager, PermissionsAndroid, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  ApeDsp,
  type BandsFrame,
  type EngineConfig,
  type MeterFrame,
  type PitchFrame,
  type WaveBucket,
} from '../../../../modules/ape-dsp';
import { micReleaseOnBackgroundEnabled } from '../../settings/store';
import { acquireMic, releaseMic, releaseMicNow } from './micSession';
import type { WarningFlag } from '../measure/types';

/** Android runtime mic-permission request (iOS requests it natively inside the
 *  module). Returns true if granted. No-op → true on non-Android. */
async function ensureMicPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    // Perf (rev 22): check first — once granted, skip the request() bridge
    // round-trip that ran on EVERY engine start (every tool open + hub resume).
    if (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)) return true;
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
}, opts?: {
  /** Force a full stop+restart of the shared capture on every start() instead
   *  of adopting a warm stream. The HUB sets this so returning to the tools menu
   *  never adopts a stale/frozen stream (rev 24 frozen-preview fix). Tools omit
   *  it and adopt for the instant open. */
  freshStart?: boolean;
}) {
  const [state, setState] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const freshStartRef = useRef(opts?.freshStart ?? false);
  freshStartRef.current = opts?.freshStart ?? false;
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
      // Warm-session handoff (rev 22): adopt the shared stream if it's already
      // open (instant — no HAL re-open), otherwise it starts once. setMicActive
      // is owned by the session coordinator so the interlock tracks the REAL
      // capture state across the debounced handoff.
      await acquireMic(configRef.current, freshStartRef.current);
      if (gen !== genRef.current) {
        // Torn down while starting — hand the stream back (debounced, so a fast
        // re-acquire by the next screen keeps it warm).
        releaseMic();
        return;
      }
      setState('running');
      stopPolling();
      // Only run the React-state poll if the caller actually wants frames. A
      // lifecycle-only consumer (poll: {}) drives its own low-latency loop off
      // ApeDsp.getMeterFrame() directly (responsiveness rule 2026-07-30) and must
      // NOT eat a 15 Hz whole-screen re-render here.
      const p0 = pollRef.current;
      if (p0.meter || p0.bands || p0.pitch || p0.waveform) {
        timer.current = setInterval(() => {
          const p = pollRef.current;
          setFrames({
            meter: p.meter ? ApeDsp.getMeterFrame() : null,
            bands: p.bands ? ApeDsp.getBandsFrame() : null,
            pitch: p.pitch ? ApeDsp.getPitchFrame() : null,
            waveform: p.waveform ? ApeDsp.getWaveform() : [],
          });
        }, POLL_MS);
      }
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
    releaseMic(); // debounced — a tools screen mounting within the window keeps it warm
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
        releaseMic(); // debounced handoff — the next tools screen keeps it warm
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
      releaseMic();
    },
    [stopPolling],
  );

  return { state, frames, start, stop, lastError, resetPeakHold: ApeDsp.resetPeakHold, resetLeq: () => ApeDsp.resetLeq() };
}

/** Auto-start capture ONCE on mount when the engine is ready (owner 2026-08-01:
 *  opening a tool goes straight to the live tool — the redundant intro/START
 *  screen between the tool-info page and the tool is removed). Fires only while
 *  state is 'idle' and only once, so a deliberate manual STOP (which returns the
 *  state to 'idle') never silently re-arms the mic. No-op for absent / spike /
 *  denied / error — those keep showing the honest EngineGate. */
export function useToolAutoStart(state: EngineState, start: () => void, stop?: () => void): void {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    if (state === 'idle') {
      done.current = true;
      // Perf (rev 22): start AFTER the push transition finishes, not during it.
      // The landing card is already on screen, so this costs no perceived delay;
      // it lets the tool's heavy native ApeDsp.start() run once the screen has
      // painted and any in-flight hub teardown stop() has settled — instead of
      // racing it mid-transition (which serialized the audio HAL open on Android).
      const task = InteractionManager.runAfterInteractions(() => start());
      return () => task.cancel();
    }
    return undefined;
  }, [state, start]);

  // Background release + foreground resume (rev 24), gated on the user setting
  // "Release microphone in the background". TOOLS only — the hub owns its own
  // AppState handling. Only wires when the caller passes `stop` (opts in). The
  // setting is read AT EVENT TIME so toggling it takes effect immediately.
  const stateRef = useRef(state);
  stateRef.current = state;
  const startRef = useRef(start);
  startRef.current = start;
  const stopRef = useRef(stop);
  stopRef.current = stop;
  const releasedForBg = useRef(false);
  useEffect(() => {
    if (!stop) return undefined;
    const sub = AppState.addEventListener('change', (s) => {
      if (!micReleaseOnBackgroundEnabled()) return; // OFF → keep the warm session
      if (s === 'background') {
        // 'inactive' (app-switcher peek, a permission alert) is NOT backgrounding
        // — only a real 'background' releases, so we don't tear down mid-prompt.
        if (stateRef.current === 'running') {
          releasedForBg.current = true;
          stopRef.current?.(); // state → idle + debounced release
          releaseMicNow(); // hard stop now — no hot mic lingering in the background
        }
      } else if (s === 'active' && releasedForBg.current) {
        releasedForBg.current = false;
        startRef.current(); // resume on return — re-acquires (cold, since released)
      }
    });
    return () => sub.remove();
  }, [stop]);
}

/** Map live native conditions → the Phase-2 quality flags (spec §6). The SAME
 *  flags shown live are stored on save, so screen and library always agree. */
export function meterWarningFlags(m: MeterFrame | null): WarningFlag[] {
  if (!m) return [];
  const flags: WarningFlag[] = [];
  if (m.clipRuns > 0) flags.push('input_clipping');
  if (m.processedInput) flags.push('uncalibrated_input'); // OS is filtering the mic
  if (m.bluetoothInput) flags.push('unsupported_input'); // HFP band-limits (spike rule)
  // Continuity: droppedFrames is a monotonic per-capture counter — any dropout
  // this session means the stream overran/stalled and held/integrated values
  // (peak-hold, Leq, exposure) may have spanned a gap (Phase 1 A2). Sticky for
  // the session by design; a fresh capture (restart) clears it.
  if (m.droppedFrames > 0) flags.push('capture_dropout');
  if (m.captureStalled || !m.running) flags.push('engine_inactive');
  return flags;
}
