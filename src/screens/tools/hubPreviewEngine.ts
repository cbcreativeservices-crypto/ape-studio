/**
 * hubPreviewEngine — ONE shared mic/DSP session + ONE shared tick for the
 * Tools & Analysis menu's live tile previews (owner order 2026-08-19: the hub
 * initializes the mic itself so the five live cards react immediately — an
 * explicit owner exemption to the spec §18 "user starts DSP" default; the
 * simulated cards never touch the engine).
 *
 * Architecture (dense-screen render rule 2026-08-15 + bridge rule ≤30 Hz):
 *   one useDspEngine lifecycle owner (this hook, mounted by ToolsHubScreen)
 *   → one 80 ms (~12.5 Hz) setInterval reading the synchronous JSI getters
 *   → a tiny external store the five mini renderers subscribe to
 *   (useSyncExternalStore), so a tick re-renders ONLY the minis, never the
 *   whole hub screen. NEVER one engine hook per tile: ApeDsp has no session
 *   refcount — any instance's teardown would kill capture for all of them.
 *
 * Lifecycle: capture force-stops on hub blur/unmount (useDspEngine built-in),
 * on app background (AppState), and explicitly right before a tile navigates
 * (stopForNavigation — deterministic handoff so the opened tool's own
 * useToolAutoStart never races the hub teardown). It resumes automatically on
 * refocus/foreground. 'denied' never re-prompts: resume only fires from
 * 'idle', so a refused mic leaves the cards in their static resting state
 * (the tools' own EngineGate remains the recovery surface).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import {
  ApeDsp,
  type BandsFrame,
  type EngineConfig,
  type MeterFrame,
  type PitchFrame,
  type SpectrumMeta,
  type WaveBucket,
} from '../../../modules/ape-dsp';
import { useDspEngine } from '../../features/tools/engine/useDspEngine';

/** ~12.5 Hz shared tick — inside the user-approved 12–24 fps preview band and
 *  the ≤30 Hz bridge rule (native frames refresh ~20 Hz; faster reads repeat). */
export const HUB_TICK_MS = 80;
/** Spectrogram pushes a column every 2nd tick (160 ms ≈ 6.3 col/s — matches the
 *  MultiMeter mini's ~5.5 col/s cadence). */
const SPECTRO_EVERY = 2;
export const SPECTRO_COLS = 46; // ≈7.4 s of history at 160 ms/col
export const SPECTRO_ROWS = 24; // log rows 50 Hz–16 kHz, low freq = row 0
const SPECTRO_F_MIN = 50;
const SPECTRO_F_MAX = 16000;
/** Fixed absolute color window (owner 2026-08-14): 0 dBFS anchor, 60 dB range —
 *  never re-anchored to the live signal, matching SpectrogramScreen's default. */
const SPECTRO_FLOOR_DB = -60;
const SPECTRO_RANGE_DB = 60;

/** One spectrogram column: t01 level per row (0 silence → 1 = 0 dBFS). */
export type HubSpectroCol = number[];

/** Newest waveform buckets the previews consume (3 s window) — the facade
 *  decode is capped here instead of materializing the whole native ring. */
export const HUB_WAVE_BUCKETS = 60;

export type HubPreviewData = {
  tick: number;
  meter: MeterFrame | null;
  bands: BandsFrame | null;
  /** Live YIN pitch (freq/confidence/voiced/levelDb) — drives the real-time
   *  tuner mini. */
  pitch: PitchFrame | null;
  /** Raw waveform ring, NEWEST-FIRST (ApeDsp.getWaveform contract). */
  wave: WaveBucket[];
  /** Rolling spectrogram history, oldest → newest. Reference changes only when
   *  a column lands, so raster rebuilds stay at ~6 Hz. */
  spectroCols: HubSpectroCol[];
};

const EMPTY: HubPreviewData = { tick: 0, meter: null, bands: null, pitch: null, wave: [], spectroCols: [] };

let data: HubPreviewData = EMPTY;
const subs = new Set<() => void>();

export function getHubPreview(): HubPreviewData {
  return data;
}
export function subscribeHubPreview(fn: () => void): () => void {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}
function emit(next: HubPreviewData) {
  data = next;
  subs.forEach((fn) => fn());
}

/** One engine config serving every live mini (MultiMeter's proven combo): the
 *  8192 FFT keeps all 31 third-octave bands resolvable, spectrumEnabled feeds
 *  both the bands frame and the raw spectrum, waveform feeds the scopes.
 *  Module-level so the reference is stable (useDspEngine start() closes over it). */
const HUB_ENGINE_CFG: EngineConfig = {
  fftSize: 8192,
  fraction: 3,
  spectrumEnabled: true,
  waveformEnabled: true,
  pitchEnabled: true, // real-time tuner mini
  bandAvgAlpha: 0.8,
};

/** Per-(sampleRate,fftSize,bins) row → FFT-bin ranges for the mini spectrogram
 *  (SpectrogramScreen's buildRowBins idiom at preview resolution). */
let rowBinsKey = '';
let rowBins: { lo: number; hi: number }[] = [];
function ensureRowBins(meta: SpectrumMeta): { lo: number; hi: number }[] {
  const key = `${meta.sampleRate}/${meta.fftSize}/${meta.bins}`;
  if (key === rowBinsKey) return rowBins;
  const hzPerBin = meta.sampleRate / meta.fftSize;
  const out: { lo: number; hi: number }[] = [];
  for (let r = 0; r < SPECTRO_ROWS; r++) {
    const f0 = SPECTRO_F_MIN * Math.pow(SPECTRO_F_MAX / SPECTRO_F_MIN, r / SPECTRO_ROWS);
    const f1 = SPECTRO_F_MIN * Math.pow(SPECTRO_F_MAX / SPECTRO_F_MIN, (r + 1) / SPECTRO_ROWS);
    // Edge semantics match the full SpectrogramScreen (ceil low edge so a row
    // never borrows energy from below it; degenerate rows collapse to the
    // nearest real bin) — the mini must never show energy the real tool won't.
    let lo = Math.max(1, Math.ceil(f0 / hzPerBin));
    let hi = Math.min(meta.bins - 1, Math.floor(f1 / hzPerBin));
    if (hi < lo) {
      const center = Math.max(1, Math.min(meta.bins - 1, Math.round(((f0 + f1) / 2) / hzPerBin)));
      lo = center;
      hi = center;
    }
    out.push({ lo, hi });
  }
  rowBinsKey = key;
  rowBins = out;
  return out;
}

export type HubPreview = {
  /** True while frames are flowing — live minis mount only then. */
  engineLive: boolean;
  /** Hub focused + app foregrounded — the simulated cards animate only then. */
  active: boolean;
  /** Call right before navigating into a tool: deterministic mic handoff. */
  stopForNavigation: () => void;
};

/** Dev guard: the module store assumes ONE mounted hub (ApeDsp itself is a
 *  refcount-free singleton, so two hubs would kill each other's capture). */
let hubMountCount = 0;

export function useHubPreviewEngine(): HubPreview {
  const isFocused = useIsFocused();
  // 'inactive' (iOS permission alert, call banner, app-switcher peek) is NOT
  // backgrounding — treating it as such would tear the session down mid-prompt.
  const [appActive, setAppActive] = useState(AppState.currentState !== 'background');
  // Lifecycle-only consumer (poll: {}) — we run our own shared tick below.
  const { state, start, stop } = useDspEngine(HUB_ENGINE_CFG, {});
  const navLockRef = useRef(false);
  // One dead-capture recovery attempt per focus session (watchdog below).
  const deadRetryRef = useRef(false);

  useEffect(() => {
    hubMountCount++;
    if (__DEV__ && hubMountCount > 1) {
      console.warn('[hubPreviewEngine] Two ToolsHub instances mounted — the shared mic session cannot serve both.');
    }
    return () => {
      hubMountCount--;
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setAppActive(s !== 'background'));
    return () => sub.remove();
  }, []);

  // Backgrounding releases the mic (spec §18 spirit); foreground resumes below.
  // Gated on 'running': never kill an in-flight 'starting' (the OS permission
  // dialog itself moves AppState — stopping mid-prompt would both swallow the
  // 'denied' result and re-prompt in a loop), and never fire the GLOBAL
  // ApeDsp.stop() while a pushed tool owns the session (hub is 'idle' then).
  useEffect(() => {
    if (!appActive && state === 'running') stop();
  }, [appActive, state, stop]);

  // Regaining focus clears the locks so previews resume on return.
  useFocusEffect(
    useCallback(() => {
      navLockRef.current = false;
      deadRetryRef.current = false;
      return undefined;
    }, []),
  );

  // Auto-start on entry + auto-resume on refocus/foreground (owner 2026-08-19).
  // Fires ONLY from 'idle', so a denied/absent/spike/error engine never loops
  // the OS permission prompt — those states rest on the static artwork. The
  // small defer lets a popped tool screen's deferred unmount teardown (its
  // global ApeDsp.stop() at pop-animation end) land BEFORE our start, instead
  // of after it (which would leave us 'running' on a dead session).
  useEffect(() => {
    if (!(isFocused && appActive && state === 'idle' && !navLockRef.current)) return undefined;
    const t = setTimeout(() => start(), 400);
    return () => clearTimeout(t);
  }, [isFocused, appActive, state, start]);

  const stopForNavigation = useCallback(() => {
    navLockRef.current = true;
    stop();
  }, [stop]);

  const running = state === 'running';
  const live = running && isFocused && appActive;

  // The ONE shared tick. Gated on focus + foreground so nothing polls or
  // re-renders behind a pushed tool screen (the DosimeterChip lesson).
  useEffect(() => {
    if (!live) return undefined;
    let tick = 0;
    let lastSpectroSeq = -1;
    let stalledTicks = 0;
    let cols: HubSpectroCol[] = [];
    const id = setInterval(() => {
      tick++;
      // Dead-capture watchdog (§1.7 — never present frozen frames as live):
      // an externally killed session (a popped tool's late global stop, a call
      // that didn't resume) leaves us 'running' with stalled frames. Recover
      // once per focus by cycling stop → auto-resume; if capture stays dead,
      // lock and rest on the static artwork.
      const wd = ApeDsp.getMeterFrame();
      if (wd && (!wd.running || wd.captureStalled)) stalledTicks++;
      else stalledTicks = 0;
      if (stalledTicks > 12) {
        if (!deadRetryRef.current) {
          deadRetryRef.current = true;
          stop();
          return;
        }
        if (stalledTicks > 60) {
          navLockRef.current = true;
          stop();
          return;
        }
      }
      let spectroCols = data.spectroCols;
      if (tick % SPECTRO_EVERY === 0) {
        const meta = ApeDsp.getSpectrumMeta();
        const spec = ApeDsp.getSpectrum();
        if (meta && meta.bins > 0 && spec.length >= meta.bins && meta.sequence !== lastSpectroSeq) {
          lastSpectroSeq = meta.sequence;
          const bins = ensureRowBins(meta);
          const col: number[] = new Array(SPECTRO_ROWS);
          for (let r = 0; r < SPECTRO_ROWS; r++) {
            const { lo, hi } = bins[r];
            let vMax = -200;
            for (let b = lo; b <= hi; b++) if (spec[b] > vMax) vMax = spec[b];
            const t = (vMax - SPECTRO_FLOOR_DB) / SPECTRO_RANGE_DB;
            col[r] = t <= 0 ? 0 : t >= 1 ? 1 : t;
          }
          cols = cols.length >= SPECTRO_COLS ? [...cols.slice(1), col] : [...cols, col];
          spectroCols = cols;
        }
      }
      emit({
        tick,
        meter: wd,
        bands: ApeDsp.getBandsFrame(),
        pitch: ApeDsp.getPitchFrame(),
        wave: ApeDsp.getWaveform(HUB_WAVE_BUCKETS),
        spectroCols,
      });
    }, HUB_TICK_MS);
    return () => {
      clearInterval(id);
      emit(EMPTY); // fresh history next session — no stale spectrogram ghosts
    };
  }, [live, stop]);

  return { engineLive: live, active: isFocused && appActive, stopForNavigation };
}
