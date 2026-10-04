/**
 * useMasterPlayback — the Mastering Lab's LISTEN engine: decide → render →
 * listen → compare, at MATCHED LEVEL.
 *
 * The house audio pattern (Ear Training → Mixing lab, mixing/kit.tsx
 * useMixPlayback): real PCM rendered offline in JS, encoded to WAV, played
 * through expo-audio behind the app-wide audio-output gate. This hook is
 * that pattern with a mastering chain in place of the console:
 *
 *   programme  = renderMix(DELIVERED_MIX)            — the client's mix
 *   version    = tilt → width → drive → limiter       — masteringEngine.ts
 *   measure    = peak · true peak (est.) · LUFS (est.) · PLR
 *   match      = every version in a `matchGroup` turned DOWN to the
 *                quietest member's loudness (attenuation only; gain =
 *                quietest LUFS − this LUFS), when `matched` is on.
 *
 * Safety: nothing sounds before requestAudioOutput(); shake-to-mute, the
 * idle lock and backgrounding unwind the transport (useStopWhenSilenced);
 * the sound stops when the lab closes (useStopOnClose) and when another
 * sound lab comes to the front (labOutputOwner). A queued play never starts
 * under another screen or a closed gate.
 */
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { StepHostContext } from './steps';
import { useFocusEffect } from '@react-navigation/native';
import { useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';
import type { Stereo } from '../../../features/ear/earDsp.ts';
import { EarClipPlayer } from '../../../features/ear/earPlayer';
import { useAudioOutputGate } from '../../../features/audio/AudioOutputGate';
import { armFence, startFenced } from '../../../features/audio/startFenced';
import { isAudioOutputEnabled } from '../../../features/audio/audioOutputStore';
import { useStopWhenSilenced } from '../../../features/audio/useStopWhenSilenced';
import { useStopOnClose } from '../../../features/audio/useStopOnBlur';
import { LOOP_S, renderMix } from '../mixing/audio/mixAudio.ts';
import {
  DELIVERED_MIX, DELIVERED_TRIM_DB, applyGain, autoReplayAllowed, matchedGains, measure, overview, renderVersion,
  type MasterProcess, type Measure, type Overview,
} from './masteringEngine';

// The pure pieces live in masteringEngine.ts (testable without Metro);
// re-exported here for the modules that import them from the hook.
export { SAFETY_CEILING_DB, autoReplayAllowed, needsSafetyCeiling, renderVersion, type MasterProcess } from './masteringEngine';

export type MasterVariant = {
  id: string;
  label: string;
  process: MasterProcess;
  /** Versions sharing a group are level-matched to the quietest of them. */
  matchGroup?: string;
};

export type MasterMeasured = Measure & {
  /** The matched-level attenuation applied before playback (dB, ≤ 0). */
  matchDb: number;
  overview: Overview;
  grDb: number[];
  maxGrDb: number;
};

export type MasterPlayback = {
  status: 'idle' | 'rendering' | 'ready';
  /** A PRESSED ▶ could not load its versions (the WAV write or the player
   *  failed — hunt 11, K8): the status line says AUDIO_UNAVAILABLE_MESSAGE
   *  instead of "stopped", as if nothing had been pressed. Cleared by the
   *  next ▶ or ■. A quiet pre-render with nothing queued never sets it. */
  failed: boolean;
  /** A quiet pre-render is under way with nothing queued (perf decisions
   *  2026-10-04): the ▶ surfaces read "Preparing the audio…"; a ▶ pressed now
   *  joins this render and plays when it lands. */
  preparing: boolean;
  play: (id: string) => void;
  stop: () => void;
  active: string | null;
  pending: string | null;
  measured: Record<string, MasterMeasured>;
  /** `measured` belongs to the CURRENT versions (the faders as they are
   *  now). A fader move keeps the last render on the glass until the next
   *  ▶, so the numbers can be an earlier setting's; MATCH alone does not
   *  change them (only the match gains, which are fresh only when
   *  status === 'ready'). */
  current: boolean;
  heard: readonly string[];
  /** 0..1 position of the sounding clip, per frame (a SharedValue — never
   *  React state), for the stage playhead. */
  progress: SharedValue<number>;
};

/** The client's mix, rendered once per app run and shared by every page. */
let programmeCache: Stereo | null = null;
export function programme(): Stereo {
  if (!programmeCache) programmeCache = renderMix(DELIVERED_MIX, DELIVERED_TRIM_DB).stereo;
  return programmeCache;
}
/** The programme only if a LISTEN page has already rendered it — a LEARN
 *  page must never pay for a 10 s render at mount. */
export function programmeIfRendered(): Stereo | null {
  return programmeCache;
}
/** Free the cached render (the lab screen releases it on close). */
export function releaseProgramme(): void {
  programmeCache = null;
}

/**
 * ▶ DRAW MIX (Modules 4 and 6): render the programme for a picture — no
 * sound, no gate. The render is ~10 s of synchronous JS, and it ran INSIDE
 * the press (toddler pass 3): the key gave no sign it was taken, and a second
 * tap queued behind the stall and ran the drawing again. Now the press only
 * marks the key DRAWING (one frame to paint it), the render runs on a timer,
 * a press while one is under way does nothing, and leaving the lab cancels a
 * render that has not started (it would re-fill the cache the lab just
 * released on close).
 */
export function useDrawProgramme(onDrawn: () => void): { drawing: boolean; draw: () => void } {
  const [drawing, setDrawing] = useState(false);
  const busyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDrawnRef = useRef(onDrawn);
  onDrawnRef.current = onDrawn;
  useEffect(
    () => () => {
      if (timerRef.current != null) clearTimeout(timerRef.current);
      timerRef.current = null;
    },
    [],
  );
  // Free again only once the screen has caught up with the drawing (the key
  // is gone by then): a tap queued during the stall lands on a busy flag.
  useEffect(() => {
    if (!drawing) busyRef.current = false;
  }, [drawing]);
  const draw = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    setDrawing(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      try {
        programme();
        onDrawnRef.current();
      } finally {
        setDrawing(false);
      }
    }, 30);
  }, []);
  return { drawing, draw };
}

/** Quiet pre-render after a LISTEN step settles (perf decisions 2026-10-04)
 *  — past the page turn and past the 350 ms replay, so an armed replay
 *  always goes first (the Mixing lab's PRERENDER_MS). */
export const MASTER_PRERENDER_MS = 900;

/**
 * @param listenStep the module step (StepHostContext) whose display plays
 *   these versions. Landing on it pre-renders quietly once the page has
 *   settled; every other step (LEARN, PRACTICE…) never pays for the render.
 */
export function useMasterPlayback(variants: readonly MasterVariant[], matched: boolean, listenStep?: number): MasterPlayback {
  const { requestAudioOutput } = useAudioOutputGate();
  const [status, setStatus] = useState<MasterPlayback['status']>('idle');
  const [active, setActive] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [measured, setMeasured] = useState<Record<string, MasterMeasured>>({});
  const [heard, setHeard] = useState<string[]>([]);
  const playerRef = useRef<EarClipPlayer | null>(null);
  const idsRef = useRef<string[]>([]);
  const pendingRef = useRef<string | null>(null);
  const aliveRef = useRef(true);
  const renderingSigRef = useRef<string | null>(null);
  const renderSeqRef = useRef(0);
  /** The DSP of the last render that could not load yet (a quiet pre-render
   *  with sound still off, or one cancelled by a step change after its DSP):
   *  the next render of the SAME set only loads it. Dropped once loaded. */
  const preparedRef = useRef<{ sig: string; ids: string[]; clips: Stereo[]; measuredNext: Record<string, MasterMeasured> } | null>(null);
  /** The settle-then-replay timer (below). STOP, a ▶ press, a mute and a
   *  leave all cancel it: during its 350 ms window nothing is active or
   *  pending, so the silenced/close paths would otherwise miss it and the
   *  old version would start anyway — or override the version just pressed
   *  (bug pass 2026-10-01). */
  const replayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** The version the armed replay will play. It outlives one effect run: a
   *  fader DRAG changes the set on every tick, and by the second tick
   *  `active` and `pending` were already null, so the replay was forgotten
   *  and a drag silently stopped the sound it promised to replay (night
   *  pass 2, 2026-10-01). Cleared only when the replay fires or is cancelled. */
  const replayIdRef = useRef<string | null>(null);
  const cancelReplay = useCallback(() => {
    if (replayTimerRef.current != null) clearTimeout(replayTimerRef.current);
    replayTimerRef.current = null;
    replayIdRef.current = null;
  }, []);
  const signature = useMemo(() => JSON.stringify({ variants, matched }), [variants, matched]);
  const variantsKey = useMemo(() => JSON.stringify(variants), [variants]);
  const [measuredKey, setMeasuredKey] = useState<string | null>(null);

  // The stage playhead: a SharedValue advanced per frame while a clip sounds.
  const progress = useSharedValue(0);
  const startedAt = useSharedValue(0);
  const frame = useFrameCallback((info) => {
    'worklet';
    const now = info.timestamp;
    if (startedAt.value === 0) startedAt.value = now;
    const p = (now - startedAt.value) / 1000 / LOOP_S;
    progress.value = p >= 1 ? 1 : p;
  }, false);
  const activeRef = useRef<string | null>(null);
  activeRef.current = active;
  useEffect(() => {
    if (active) {
      startedAt.value = 0;
      progress.value = 0;
      frame.setActive(true);
    } else {
      frame.setActive(false);
      progress.value = 0;
    }
  }, [active, frame, progress, startedAt]);

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

  // A new variant set (a fader moved, MATCH toggled): the renders are stale.
  // If a version was sounding, replay the SAME version once the change
  // settles (the mixing lab's "▶ arms the lab" rule) — but ONLY while
  // matched (autoReplayAllowed): unmatched, nothing restarts without a press.
  useEffect(() => {
    const again = autoReplayAllowed(matched, activeRef.current ?? pendingRef.current ?? replayIdRef.current);
    replayIdRef.current = again;
    playerRef.current?.stop();
    setStatus('idle');
    setActive(null);
    setPending(null);
    idsRef.current = [];
    pendingRef.current = null;
    renderSeqRef.current++;
    renderingSigRef.current = null;
    if (!again) return;
    // The fence, armed now and asked when the timer fires (armFence): a mute,
    // a leave, or a stop-all (left the app, another lab) inside the pause
    // means nothing replays.
    const blocked = armFence(() => aliveRef.current && focusedRef.current);
    const t = setTimeout(() => {
      replayTimerRef.current = null;
      replayIdRef.current = null;
      if (blocked()) return;
      pendingRef.current = again;
      setPending(again);
      void renderAllRef.current();
    }, 350);
    replayTimerRef.current = t;
    return () => {
      clearTimeout(t);
      if (replayTimerRef.current === t) replayTimerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `matched` is part of `signature`
  }, [signature]);

  const renderAll = useCallback(async (quiet = false) => {
    if (renderingSigRef.current === signature) return;
    renderingSigRef.current = signature;
    const my = ++renderSeqRef.current;
    const current = () => aliveRef.current && my === renderSeqRef.current;
    try {
      setStatus('rendering');
      // A quiet pre-render says nothing — the learner did not ask for it.
      if (!quiet) AccessibilityInfo.announceForAccessibility?.('Rendering the versions.');
      await new Promise((r) => setTimeout(r, 30));
      if (!current()) return;
      let clips: Stereo[];
      let ids: string[];
      let measuredNext: Record<string, MasterMeasured>;
      const prepared = preparedRef.current;
      if (prepared && prepared.sig === signature) {
        ({ clips, ids, measuredNext } = prepared);
      } else {
        const base = programme();
        await new Promise((r) => setTimeout(r, 0));
        if (!current()) return;
        const out: { id: string; stereo: Stereo; m: Measure; grDb: number[]; maxGrDb: number }[] = [];
        for (const v of variants) {
          const r = renderVersion(base, v.process);
          const m = measure(r.out);
          out.push({ id: v.id, stereo: r.out, m, grDb: r.grDb, maxGrDb: r.maxGrDb });
          await new Promise((r2) => setTimeout(r2, 0));
          if (!current()) return;
        }
        // MATCHED LEVEL: per group, everyone down to the quietest.
        const matchDb: Record<string, number> = {};
        if (matched) {
          const groups = new Map<string, Record<string, number>>();
          for (const v of variants) {
            if (!v.matchGroup) continue;
            const g = groups.get(v.matchGroup) ?? {};
            g[v.id] = out.find((o) => o.id === v.id)!.m.lufs;
            groups.set(v.matchGroup, g);
          }
          for (const g of groups.values()) Object.assign(matchDb, matchedGains(g));
        }
        clips = [];
        measuredNext = {};
        for (const o of out) {
          const g = matchDb[o.id] ?? 0;
          const played = g ? applyGain(o.stereo, g) : o.stereo;
          clips.push(played);
          measuredNext[o.id] = { ...o.m, matchDb: g, overview: overview(played), grDb: o.grDb, maxGrDb: o.maxGrDb };
          await new Promise((r2) => setTimeout(r2, 0));
          if (!current()) return;
        }
        ids = out.map((o) => o.id);
        preparedRef.current = { sig: signature, ids, clips, measuredNext };
      }
      // A quiet pre-render with sound still OFF and nothing queued: the DSP
      // is done and drawn, but nothing touches the audio session before the
      // learner switches sound on (the Drum / Mixing preload rule) — the
      // first ▶ only loads what was prepared here.
      if (pendingRef.current == null && !isAudioOutputEnabled()) {
        setMeasuredKey(JSON.stringify(variants));
        setMeasured(measuredNext);
        setStatus('idle');
        return;
      }
      if (!playerRef.current) {
        playerRef.current = new EarClipPlayer();
        playerRef.current.onEnded = () => {
          if (aliveRef.current) setActive(null);
        };
      }
      const player = playerRef.current;
      // The fence (startFenced): a mute, a leave, or a stop-all during the
      // load means the queued play never fires; the render still lands.
      const fenced = await startFenced({
        start: () => player.load(clips),
        stop: () => {}, // loaded, not sounding: nothing to silence
        isCurrent: current,
      });
      if (!current()) {
        if (playerRef.current !== player) player.dispose();
        return;
      }
      idsRef.current = ids;
      if (preparedRef.current?.sig === signature) preparedRef.current = null;
      setMeasuredKey(JSON.stringify(variants));
      setMeasured(measuredNext);
      setStatus('ready');
      const want = pendingRef.current;
      pendingRef.current = null;
      setPending(null);
      if (fenced.status === 'started' && want && focusedRef.current) {
        const i = idsRef.current.indexOf(want);
        if (i >= 0) {
          player.play(i);
          setActive(want);
          setHeard((h) => (h.includes(want) ? h : [...h, want]));
        }
      }
    } catch {
      // A clip write failing (disk full, cache cleared — EarClipPlayer.load
      // rethrows) used to escape the `void renderAll()` callers as an
      // unhandled rejection and leave the page reading RENDERING forever with
      // the queued play stuck (night pass 2, 2026-10-01). Back to idle: the
      // next ▶ renders afresh.
      if (current()) {
        // A ▶ that was waiting on this render is told (K8, hunt 11): the
        // status line used to fall back to "stopped" without a word. A quiet
        // pre-render with nothing queued stays quiet — the next ▶ retries.
        if (pendingRef.current != null) setFailed(true);
        idsRef.current = [];
        pendingRef.current = null;
        setPending(null);
        setStatus('idle');
      }
    } finally {
      if (my === renderSeqRef.current) renderingSigRef.current = null;
    }
  }, [signature, variants, matched]);
  const renderAllRef = useRef(renderAll);
  renderAllRef.current = renderAll;

  // PRE-RENDER ON THE LISTEN STEP (perf decisions 2026-10-04). The first ▶ of
  // a LISTEN step paid for the programme render (~0.5 s of synchronous JS)
  // and the versions. Once the learner has LANDED on the listening step and
  // the page has settled, the same renderAll runs quietly behind a visible
  // "Preparing the audio…" (`preparing`): a ▶ pressed meanwhile joins it (the
  // double-tap guard returns; the render plays the queued `pendingRef` when it
  // lands); a step change or leaving the lab cancels it (below / aliveRef); a
  // fader or MATCH change retires it (the generation bump above) and re-arms
  // it here. NEVER plays on its own: nothing is queued. Any other step —
  // LEARN, PRACTICE — never pays for it.
  const host = useContext(StepHostContext);
  const hostStep = host?.step;
  useEffect(() => {
    if (listenStep == null || hostStep !== listenStep) return;
    const t = setTimeout(() => {
      if (!aliveRef.current || !focusedRef.current) return;
      if (idsRef.current.length > 0 || renderingSigRef.current !== null) return;
      if (preparedRef.current?.sig === signature && !isAudioOutputEnabled()) return;
      void renderAllRef.current(true);
    }, MASTER_PRERENDER_MS);
    return () => clearTimeout(t);
  }, [signature, hostStep, listenStep]);

  const play = useCallback(
    (id: string) => {
      setFailed(false);
      cancelReplay();
      void (async () => {
        if (!(await requestAudioOutput())) return;
        if (!aliveRef.current || !focusedRef.current) return;
        if (idsRef.current.length === 0) {
          pendingRef.current = id;
          setPending(id);
          void renderAllRef.current();
          return;
        }
        const i = idsRef.current.indexOf(id);
        if (i < 0 || !playerRef.current) return;
        playerRef.current.play(i);
        // ▶ again on the version already sounding restarts the clip from 0,
        // but `active` does not change, so the effect above never re-zeroed
        // the playhead — it ran on out of step with the audio (bug pass
        // 2026-10-01). Re-arm it on every press.
        startedAt.value = 0;
        progress.value = 0;
        setActive(id);
        setHeard((h) => (h.includes(id) ? h : [...h, id]));
      })();
    },
    [requestAudioOutput, cancelReplay, startedAt, progress],
  );

  const stop = useCallback(() => {
    playerRef.current?.stop();
    setActive(null);
  }, []);

  const stopAll = useCallback(() => {
    cancelReplay();
    pendingRef.current = null;
    setPending(null);
    setFailed(false);
    stop();
  }, [stop, cancelReplay]);
  useStopWhenSilenced(active != null || pending != null, stopAll);
  useStopOnClose(stopAll);
  // LEAVING THE DISPLAY STOPS THE SOUND (the Tuning lab's chapter rule): the
  // module stays mounted across its steps, so paging from the LISTEN step to
  // the reading or the PRACTICE deck used to leave a version playing with no
  // ■ STOP on screen. The renders and the measured card survive; only the
  // sound stops. No-op on the first mount (nothing is sounding yet).
  const stepSeen = useRef(hostStep);
  useEffect(() => {
    if (stepSeen.current === hostStep) return;
    stepSeen.current = hostStep;
    stopAll();
    // …and a render still under way (the quiet pre-render, or a ▶ that had
    // not landed) is cancelled: it aborts at its next await. Work its DSP
    // already finished stays in preparedRef for the next ▶ of the same set.
    if (renderingSigRef.current !== null) {
      renderSeqRef.current++;
      renderingSigRef.current = null;
      setStatus(idsRef.current.length > 0 ? 'ready' : 'idle');
    }
  }, [hostStep, stopAll]);

  // ■ STOP is stopAll: a STOP pressed while a version is still rendering
  // must cancel that queued play too, not let it start a moment later.
  return { status, failed, preparing: status === 'rendering' && pending == null, play, stop: stopAll, active, pending, measured, current: measuredKey === variantsKey, heard, progress };
}
