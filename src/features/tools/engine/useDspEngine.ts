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
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import {
  ApeDsp,
  type BandsFrame,
  type DspInfo,
  type EngineConfig,
  type MeterFrame,
  type PitchFrame,
  type WaveBucket,
} from '../../../../modules/ape-dsp';
import { micReleaseOnBackgroundEnabled } from '../../settings/store';
import { acquireMic, micAcquireSeq, releaseMic, releaseMicNow } from './micSession';
import { releaseOnSupersede } from './startSupersede';
import { markMicAcquire } from '../devTiming';
import type { WarningFlag } from '../measure/types';

/** Android runtime mic-permission request (iOS requests it natively inside the
 *  module). Returns true if granted. No-op → true on non-Android. */
/** True while the Android RECORD_AUDIO system dialog is up. That dialog pauses
 *  the activity, so AppState reports 'background' — and the tools' background
 *  release (which also releases in 'starting') tore the start down, discarded
 *  the Deny, and re-prompted on 'active': two prompts for one Deny. */
let micPermissionPromptOpen = false;
export function isMicPermissionPromptOpen(): boolean {
  return micPermissionPromptOpen;
}

async function ensureMicPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    // Perf (rev 22): check first — once granted, skip the request() bridge
    // round-trip that ran on EVERY engine start (every tool open + hub resume).
    if (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)) return true;
    micPermissionPromptOpen = true;
    try {
      const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      return res === PermissionsAndroid.RESULTS.GRANTED;
    } finally {
      micPermissionPromptOpen = false;
    }
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
  // Double START / STOP→START while the HAL is still opening (bug hunt
  // 2026-09-29). `latestStartRef` is the generation of the most recent start()
  // — a superseded start only hands the stream back when no NEWER start owns
  // it (releaseOnSupersede). `inFlightRef` lets a second START that lands while
  // the first is still opening join it instead of spawning a rival.
  const latestStartRef = useRef(0);
  const inFlightRef = useRef<{ gen: number; promise: Promise<void> } | null>(null);

  const stopPolling = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  const start = useCallback(async () => {
    if (state === 'absent' || state === 'spike') return;
    // A start is already opening and nothing has superseded it — join it.
    const pending = inFlightRef.current;
    if (pending && pending.gen === genRef.current) return pending.promise;
    const gen = ++genRef.current;
    latestStartRef.current = gen;
    let settle: () => void = () => {};
    inFlightRef.current = { gen, promise: new Promise<void>((r) => (settle = r)) };
    setState('starting');
    // Watchdog (QA night 2026-09-01 — the launch-triage "spinner trap" class):
    // if the permission prompt or mic open never settles, 'starting' froze
    // forever with no TRY AGAIN. 12s clears the slow first phone opens the
    // warm-session work documented (5-10s cold). Firing bumps the generation,
    // so a zombie start that later resolves hands the stream back cleanly.
    const watchdog = setTimeout(() => {
      if (gen === genRef.current) {
        genRef.current++;
        setLastError('Microphone start timed out — a permission prompt may be waiting, or another app is holding the microphone.');
        setState((s) => (s === 'starting' ? 'error' : s));
      }
    }, 12000);
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
      // Dev timing (owner 2026-09-05): warm adopt should be ~0 ms; a cold HAL
      // open is the documented 5-10 s — the Metro line says which one happened.
      const acquireAt = Date.now();
      const acquiring = acquireMic(configRef.current, freshStartRef.current);
      const mySeq = micAcquireSeq(); // read synchronously — see micAcquireSeq
      await acquiring;
      markMicAcquire(freshStartRef.current ? 'hub (fresh start)' : 'tool (adopt or start)', acquireAt, 'capture live');
      if (gen !== genRef.current) {
        // Torn down while starting — hand the stream back (debounced, so a fast
        // re-acquire by the next screen keeps it warm).
        //
        // ⚠️ This return resolves NO state, which is what stranded the tool on
        // "Starting…" forever (owner device pass 2026-09-11): the `finally`
        // below then cleared the 12 s watchdog, so the one rescue built for
        // exactly this symptom was disarmed by the path that caused it. The
        // guarantee now lives in `finally` — every return leaves a resolved
        // state — so nothing here needs to set it, but nothing may remove that
        // guarantee either.
        //
        // …but ONLY when a stop/blur/unmount/watchdog superseded it. When a
        // NEWER start did, that start owns the shared stream: releasing here
        // armed the 1.5 s debounce after its acquire had cancelled the last
        // one, and doStop() then killed the mic under a 'running' screen (bug
        // hunt 2026-09-29).
        //
        // …and not when ANOTHER screen acquired after us (the hub torn down by
        // stopForNavigation, its cold start joined by the opened tool): that
        // screen owns the stream now, and our release would kill it.
        if (micAcquireSeq() !== mySeq) return;
        if (releaseOnSupersede(gen, latestStartRef.current)) releaseMic();
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
    } finally {
      clearTimeout(watchdog);
      if (inFlightRef.current?.gen === gen) inFlightRef.current = null;
      settle();
      // THE GUARANTEE: no return path may leave the engine sitting on
      // 'starting' once the watchdog is gone. Every branch above either
      // resolved the state itself ('running' / 'denied' / 'error') — in which
      // case this is a no-op, because the functional updater sees the value
      // that branch queued — or bailed out early without resolving anything,
      // which is the case this catches.
      //
      // 'idle' is the honest landing: capture is not running and the engine is
      // ready, so the screen can offer START. It must NOT be 'error' — nothing
      // failed; the start was simply superseded by a stop, blur or unmount.
      //
      // A start superseded by a NEWER start leaves the state alone — that
      // start's 'starting' is live, not stranded (bug hunt 2026-09-29).
      if (latestStartRef.current === gen) setState((s) => (s === 'starting' ? 'idle' : s));
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
  //
  // ⛔ []-DEPS, NOT [stopPolling] (pattern hunt P12, 2026-10-02). A cleanup-only
  // effect re-runs its cleanup whenever a dep changes identity — the dead Bass ▶
  // shape (b2660894): the render a start causes would tear that start down and
  // release the mic. `stopPolling` is []-stable today, so this never fired, but
  // one added dep on it would have brought the bug back here silently. The
  // teardown only touches refs and the setter, so it needs no deps at all.
  useFocusEffect(
    useCallback(
      () => () => {
        genRef.current++;
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        releaseMic(); // debounced handoff — the next tools screen keeps it warm
        setState((s) => (s === 'running' || s === 'starting' ? 'idle' : s));
      },
      [],
    ),
  );

  // Belt-and-suspenders unmount teardown (also covers non-navigator hosts).
  useEffect(
    () => () => {
      genRef.current++;
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
      releaseMic();
    },
    [],
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
  /** Has this mount ever actually reached a live capture? This is the whole
   *  basis for telling the two 'idle' states apart below. */
  const ranOnce = useRef(false);
  /** Bounded re-arms. Without a cap, a start that is torn down every time would
   *  spin: idle → re-arm → start → torn down → idle … A tool that cannot get
   *  going after a few tries should sit on START and let the user decide, not
   *  hammer the audio HAL. */
  const rearms = useRef(0);
  /** Released by the background handler below; cleared on return. */
  const releasedForBg = useRef(false);
  const MAX_REARMS = 3;
  /** Live view of `state` for the focus callbacks, which are created once. */
  const liveState = useRef(state);
  liveState.current = state;
  /**
   * ⛔ THE TOOL WAS LIVE WHEN THE SCREEN LOST FOCUS, SO BRING IT BACK.
   *
   * useDspEngine's own blur cleanup drops the state to 'idle', and the
   * one-shot above refuses to re-arm after a real run — deliberately, so a
   * manual STOP can never silently reopen the mic. The two rules together
   * meant that ANY push-and-return killed the tool for good: open the
   * Waveform Viewer, tap VIEW SAVED MEASUREMENTS, come back, and the screen
   * sat on "Starting the oscilloscope…" with no control of any kind, because
   * its whole viewer unmounts when nothing is running (owner 2026-09-20 bug
   * pass). The Frequency Counter did the same.
   *
   * Focus is what tells the two identical-looking 'idle's apart. A manual
   * STOP happens while the screen is FOCUSED, so it never sets this flag; an
   * involuntary blur teardown always does. That is a fact about the gesture,
   * not a guess about intent, which is why it is safe to act on.
   *
   * This is the same promise the background handler below already makes —
   * release on leaving, resume on return — just for navigation rather than
   * for the Home button.
   */
  const resumeOnFocus = useRef(false);
  const [resumeTick, setResumeTick] = useState(0);
  useFocusEffect(
    useCallback(() => {
      if (resumeOnFocus.current) {
        resumeOnFocus.current = false;
        done.current = false; // let the hardened one-shot below fire again
        rearms.current = 0;
        setResumeTick((t) => t + 1); // …and make its effect re-run
      }
      return () => {
        // Only an involuntary teardown. Idle here means the user stopped it.
        if (liveState.current === 'running' || liveState.current === 'starting') {
          resumeOnFocus.current = true;
        }
      };
    }, []),
  );

  useEffect(() => {
    if (state === 'running') {
      ranOnce.current = true;
      rearms.current = 0; // a real run clears the budget for this mount
      return;
    }
    // Re-arm the one-shot ONLY when a start was superseded before it ever ran
    // (owner device pass 2026-09-11: the spectrogram sat on "Starting…" because
    // the latch had fired, the start was torn down mid-acquire, and nothing
    // could start it again).
    //
    // ⚠️ NEVER re-arm after a run. A deliberate STOP also returns the state to
    // 'idle', and silently re-opening the mic there would break the integrity
    // rule that DSP only runs when the user started it. `ranOnce` is what keeps
    // those two identical-looking 'idle's apart.
    // …and NEVER while released for the background: Home pressed during the
    // first 'starting' dropped the state to 'idle' here, the one-shot re-armed,
    // and start() re-opened the mic in the background moments after the
    // release (Android keeps the JS thread running). The 'active' handler
    // below resumes on return.
    if (state === 'idle' && done.current && !ranOnce.current && rearms.current < MAX_REARMS && !releasedForBg.current) {
      rearms.current += 1;
      done.current = false;
    }
  }, [state]);

  /**
   * ⛔ NEVER AUTO-START BEHIND ANOTHER SCREEN (night pass 2026-10-01).
   *
   * A push that lands while the FIRST start is still opening (the 5–10 s cold
   * Android open) blurs the screen: the blur teardown drops the state to
   * 'idle', and because that start never ran, the re-arm above unlatched the
   * one-shot — so this effect scheduled start() straight away and opened the
   * mic behind the pushed screen, where no blur cleanup would ever close it
   * (spec §18: the mic must not stay hot behind another screen). Held until
   * focus returns; the focus effect above then re-runs it.
   */
  const focused = useIsFocused();
  useEffect(() => {
    if (done.current) return;
    if (!focused) return undefined;
    if (state === 'idle') {
      // Perf (rev 22): start AFTER the push transition finishes, not during it.
      // The landing card is already on screen, so this costs no perceived delay;
      // it lets the tool's heavy native ApeDsp.start() run once the screen has
      // painted and any in-flight hub teardown stop() has settled — instead of
      // racing it mid-transition (which serialized the audio HAL open on Android).
      //
      // QA night 2026-09-01, two hardenings:
      //  • `done` latches only when start() actually FIRES — it used to latch
      //    on schedule, so a cleanup that cancelled the task (state/start
      //    identity churn in the same frame) parked the tool on "Starting…"
      //    with start() never called.
      //  • 1.5s fallback timer: a long-held interaction handle (the hub's
      //    continuous Skia preview loops) can defer runAfterInteractions
      //    indefinitely — the reproduced forever-spinner. The fallback fires
      //    start() anyway; the transition is long over by then.
      const fire = () => {
        if (!done.current) {
          done.current = true;
          start();
        }
      };
      const task = InteractionManager.runAfterInteractions(fire);
      const fallback = setTimeout(fire, 1500);
      return () => {
        task.cancel();
        clearTimeout(fallback);
      };
    }
    return undefined;
  }, [state, start, resumeTick, focused]);

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
  useEffect(() => {
    if (!stop) return undefined;
    const sub = AppState.addEventListener('change', (s) => {
      if (!micReleaseOnBackgroundEnabled()) return; // OFF → keep the warm session
      if (s === 'background') {
        if (micPermissionPromptOpen) return; // the permission dialog, not the user leaving
        // 'inactive' (app-switcher peek, a permission alert) is NOT backgrounding
        // — only a real 'background' releases, so we don't tear down mid-prompt.
        /**
         * ⛔ 'starting' RELEASES TOO (owner 2026-09-20 bug pass).
         *
         * This used to require 'running', so pressing Home during the start
         * window left the capture open in the background with the OS mic
         * indicator lit — on the DEFAULT setting, whose own description
         * promises "the mic stops immediately". On Android that window is the
         * documented 5–10 s cold HAL open, so first entry hits it easily, and
         * nothing else could close it: the screen never blurs, so its focus
         * cleanup does not run either.
         *
         * Releasing mid-acquire is safe — stop() bumps the generation counter,
         * so the in-flight acquireMic hands its stream straight back.
         */
        if (stateRef.current === 'running' || stateRef.current === 'starting') {
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

/**
 * Background mic release for a MANUAL-start capture (pattern hunt P20,
 * 2026-10-02) — the same promise useToolAutoStart's handler keeps for the
 * tools, for hosts that do not auto-start (HarmonicsView's LIVE mode).
 *
 * Without it the setting "Release microphone in the background" did nothing
 * there: Home does not blur the screen, so useDspEngine's blur teardown never
 * ran and the OS mic indicator stayed lit with the app out of sight.
 *
 * Releases from 'running' AND 'starting' (micReleasedOnBackground guard), skips
 * the Android permission dialog, reads the setting at event time, and never
 * resumes on return: a manual-start screen waits for the user's START
 * (integrity rule — the mic only opens when the user started it).
 */
export function useReleaseMicOnBackground(state: EngineState, stop: () => void): void {
  const stateRef = useRef(state);
  stateRef.current = state;
  const stopRef = useRef(stop);
  stopRef.current = stop;
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'background') return;
      if (!micReleaseOnBackgroundEnabled()) return; // OFF → keep the warm session
      if (micPermissionPromptOpen) return; // the permission dialog, not the user leaving
      if (stateRef.current === 'running' || stateRef.current === 'starting') {
        stopRef.current(); // state → idle + debounced release
        releaseMicNow(); // hard stop now — no hot mic lingering in the background
      }
    });
    return () => sub.remove();
  }, []);
}

/**
 * Is this frame from a mic that is actually capturing?
 *
 * ⛔ THE GUARD THAT COULD NEVER FIRE (owner 2026-09-20 bug pass).
 *
 * Several screens defended against a dead mic by testing `getMeterFrame()`
 * for null — but neither bridge can return one on an engine build: Android
 * builds its map from a DoubleArray(18) even with no handle, and iOS returns
 * a non-optional dictionary. So when capture really died — an iOS
 * interruption, a route change, another app taking the mic — frames kept
 * arriving, carrying `running: false` / `captureStalled: true` and a frozen
 * `sequence`, and nothing looked at any of them. The SPL meter went on
 * showing a plausible level, PEAK, PEAK HOLD and Leq off a mic that had
 * stopped, which is the precise failure the no-fake-meters rule exists to
 * prevent.
 *
 * This is the SAME verdict the hub watchdog and micSession already use,
 * exported once so a screen cannot invent a third version of it.
 */
export function frameIsLive(m: MeterFrame | null | undefined): m is MeterFrame {
  return !!m && m.running && !m.captureStalled;
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

/** Startup capture-health flags (Phase 1 C1) from the session info surface —
 *  separate from the per-frame meter flags because the probe is session-level.
 *  Only fires once the ~0.5 s probe has completed (probeReady). */
export function healthWarningFlags(info: DspInfo | null): WarningFlag[] {
  if (info?.health?.probeReady && info.health.inputStuck) return ['dead_input'];
  return [];
}
