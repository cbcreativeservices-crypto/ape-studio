/**
 * useBoothAudio — the DJ Systems Lab's sound AND its one clock.
 *
 * The house audio pattern (Mixing / Drum Tuning): the booth's real signal
 * path is rendered offline in JS (engine/djRender.renderBooth), encoded to
 * WAV and played through EarClipPlayer behind the app-wide sound gate
 * (requestAudioOutput → startFenced). Nothing sounds before the gate says
 * yes; shake-to-mute, the idle lock and backgrounding unwind it
 * (useStopWhenSilenced); leaving the screen stops it (useStopOnClose and the
 * unmount).
 *
 * CHUNKS. While any deck plays, the booth is rendered in chunks of booth
 * time — a SHORT one (3 s) right after a start or a change, then 8 s ones,
 * each prepared ahead and started when the last one ends. Two players take
 * turns so the next chunk loads while one sounds. Each chunk continues the
 * last one's filter and meter state (djRender `carryAt`), so a join never
 * clicks and the meters never dip. A change (a fader, a
 * cable, a deck button) re-renders from a moment just ahead of now, so the
 * sound catches up with the controls within a render's time.
 *
 * ONE CLOCK. `clock` (a SharedValue, booth seconds) drives every moving part
 * of the drawing — platters, jog rings, waveform scroll, meters, cable glow —
 * on the UI thread from a frame callback. While sound plays, the clock is
 * re-anchored to the chunk that is ACTUALLY sounding (the audio is the clock);
 * with sound off the booth still runs, silently, and the meters still show
 * the model (they measure the booth, not the phone).
 *
 * METERS. Each chunk's meter taps (10 ms blocks, ballistics applied in the
 * render) go to the UI thread as one SharedValue; the drawing reads the
 * block under the clock. No per-frame React state anywhere.
 *
 * DECORATIVE vs LESSON motion: the platters, rings, scroll and meters ARE the
 * lesson (the learner started the decks) and run under reduced motion; the
 * cable signal-flow pulse is decoration and follows useDecorativeMotion()
 * (`flowMotion`).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { EarClipPlayer } from '../../../../features/ear/earPlayer';
import { useAudioOutputGate } from '../../../../features/audio/AudioOutputGate';
import { startFenced } from '../../../../features/audio/startFenced';
import { useStopWhenSilenced } from '../../../../features/audio/useStopWhenSilenced';
import { useStopOnClose } from '../../../../features/audio/useStopOnBlur';
import { isAudioOutputEnabled } from '../../../../features/audio/audioOutputStore';
import { getLabPreview } from '../../../../features/lab/labPreviewStore';
import { useDecorativeMotion } from '../../../../features/settings/decorativeMotion';
import { anchorAt, type Booth } from '../model/djModel';
import { anyPlaying } from '../model/djDeck';
import { carryAt, renderBooth, TAPS, type BoothRender, type Tap } from '../engine/djRender';
import { boothNow, boothRunning, boothVersion, getBooth, readingFresh, stopBooth, subscribeBooth, syncClock } from './boothStore';
import { closeOpenTake } from './takeStore';

/** What the drawing reads for the meters (one chunk). */
export type MeterFrame = {
  t0: number;
  blocks: number;
  meter: Record<Tap, number[]>;
  hold: Record<Tap, number[]>;
  over: number[];
  /** ADDITIVE (Stage 2b): the event rig's own taps (mic, recorder, sub) and
   *  the talkover dip per block (`duck`, dB) — present only when the
   *  screen renders with the event renderer. */
  ext?: { meter: Record<string, number[]>; hold: Record<string, number[]>; duck: number[]; speech: number[] };
};

/** ADDITIVE (Stage 2b): a screen may render its booth through another
 *  renderer built ON renderBooth (engine/djEventRender), and hear about
 *  each chunk the moment it starts sounding (the recorder's take). */
export type BoothAudioOpts = {
  render?: (b: Booth, t0: number, seconds: number, prev: BoothRender | null) => BoothRender;
  onChunk?: (r: BoothRender) => void;
};

export type BoothAudio = {
  /** idle · rendering (first chunk on its way) · playing (sound) · silent
   *  (running, sound off) · failed (a clip could not load). */
  status: 'idle' | 'rendering' | 'playing' | 'silent' | 'failed';
  /** Booth seconds, per frame. */
  clock: SharedValue<number>;
  meters: SharedValue<MeterFrame | null>;
  /** The latest chunk's render, for the well's words (chunk-rate React state).
   *  null while the booth is stopped (a stopped readout reads "—"). */
  last: BoothRender | null;
  /** ADDITIVE (toddler bug test 2026-10-19): the booth version `last` was
   *  rendered from (boothStore.boothVersion), and whether that is the booth
   *  as it is NOW. A reading from before the latest change is stale: it
   *  stays `last` until the next chunk starts sounding. */
  lastStamp: number | null;
  lastFresh: boolean;
  /** Ask the sound gate (call from a PLAY press). Resolves whether sound is
   *  on. Once the learner has said no on this screen, a PLAY press does not
   *  ask again (the booth runs silently); `force` (a TURN SOUND ON press) does. */
  requestSound: (force?: boolean) => Promise<boolean>;
  /** The learner closed the sound warning without turning sound on. */
  soundDeclined: boolean;
  /** STOP ALL: decks and sound. */
  stop: () => void;
  /** The decorative signal-flow pulse may run. */
  flowMotion: boolean;
  /** Seconds from a change to its sound (the measured render latency): a
   *  sampler hit is placed this far ahead so it sounds from its start. */
  leadSec: () => number;
};

const FIRST_CHUNK_S = 3;
const CHUNK_S = 8;

type Chunk = { t0: number; dur: number; render: BoothRender; player: number };

function frameOf(r: BoothRender): MeterFrame {
  const meter = {} as Record<Tap, number[]>;
  const hold = {} as Record<Tap, number[]>;
  for (const t of TAPS) {
    meter[t] = Array.from(r.meter[t]);
    hold[t] = Array.from(r.hold[t]);
  }
  const out: MeterFrame = { t0: r.t0, blocks: r.meter.ch1.length, meter, hold, over: Array.from(r.busOver) };
  const ext = (r as BoothRender & { ext?: { meter: Record<string, Float32Array>; hold: Record<string, Float32Array>; duckDb: Float32Array; speech: Uint8Array } }).ext;
  if (ext) {
    const em: Record<string, number[]> = {};
    const eh: Record<string, number[]> = {};
    for (const k of Object.keys(ext.meter)) {
      em[k] = Array.from(ext.meter[k]);
      eh[k] = Array.from(ext.hold[k]);
    }
    out.ext = { meter: em, hold: eh, duck: Array.from(ext.duckDb), speech: Array.from(ext.speech) };
  }
  return out;
}

const breath = () => new Promise<void>((res) => setTimeout(res, 0));

export function useBoothAudio(opts?: BoothAudioOpts): BoothAudio {
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const { requestAudioOutput } = useAudioOutputGate();
  const flowMotion = useDecorativeMotion();
  const [status, setStatus] = useState<BoothAudio['status']>('idle');
  const [lastRec, setLastRec] = useState<{ render: BoothRender; stamp: number } | null>(null);
  const last = lastRec?.render ?? null;
  const lastStamp = lastRec?.stamp ?? null;

  const clock = useSharedValue(boothNow());
  const meters = useSharedValue<MeterFrame | null>(null);
  const anchorT = useSharedValue(boothNow());
  const anchorSeq = useSharedValue(0);
  const seenSeq = useSharedValue(-1);
  const startTs = useSharedValue(0);
  const seqRef = useRef(0);
  const frame = useFrameCallback((info) => {
    'worklet';
    if (anchorSeq.value !== seenSeq.value) {
      seenSeq.value = anchorSeq.value;
      startTs.value = info.timestamp;
    }
    clock.value = anchorT.value + (info.timestamp - startTs.value) / 1000;
  }, false);

  /** Hand the UI thread the JS clock (now), and run or freeze it. */
  const resyncClock = useCallback(() => {
    anchorT.value = boothNow();
    anchorSeq.value = ++seqRef.current;
    if (boothRunning()) frame.setActive(true);
    else {
      frame.setActive(false);
      clock.value = boothNow();
    }
  }, [anchorT, anchorSeq, clock, frame]);

  const aliveRef = useRef(true);
  const soundRef = useRef(false);
  const playersRef = useRef<[EarClipPlayer | null, EarClipPlayer | null]>([null, null]);
  const genRef = useRef(0);
  const currentRef = useRef<Chunk | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  /** Seconds a chunk takes from "render" to "sounding" (measured, padded). */
  const latencyRef = useRef(Platform.OS === 'web' ? 0.25 : 0.9);
  const nextPlayerRef = useRef(0);

  const clearTimers = () => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  };
  const later = (ms: number, fn: () => void) => {
    timersRef.current.push(setTimeout(fn, Math.max(0, ms)));
  };

  const silencePlayers = useCallback(() => {
    for (const p of playersRef.current) p?.stop();
  }, []);

  const player = (k: number): EarClipPlayer => {
    let p = playersRef.current[k];
    if (!p) {
      p = new EarClipPlayer();
      playersRef.current[k] = p;
    }
    return p;
  };

  /** Render the chunk starting at booth time `t0` and start it on time. */
  const runChunk = useCallback(
    async (gen: number, t0: number, dur: number): Promise<void> => {
      const began = Date.now();
      await breath();
      if (!aliveRef.current || gen !== genRef.current) return;
      const stamp = boothVersion();
      const booth = anchorAt(getBooth(), t0);
      // continue the stream: a contiguous chunk carries every filter memory
      // and meter; a re-render inside the sounding chunk carries the meters
      const custom = optsRef.current?.render;
      const render = custom ? custom(booth, t0, dur, currentRef.current?.render ?? null) : renderBooth(booth, t0, dur, carryAt(currentRef.current?.render ?? null, t0));
      if (!aliveRef.current || gen !== genRef.current) return;
      const wantSound = soundRef.current && isAudioOutputEnabled() && !getLabPreview().active;
      const k = nextPlayerRef.current;
      if (wantSound) {
        try {
          const fenced = await startFenced({
            start: () => player(k).load([render.playback]),
            stop: () => player(k).stop(),
            isCurrent: () => aliveRef.current && gen === genRef.current,
          });
          if (fenced.status !== 'started') return;
        } catch {
          if (aliveRef.current && gen === genRef.current) setStatus('failed');
          return;
        }
      }
      if (!aliveRef.current || gen !== genRef.current) return;
      const took = (Date.now() - began) / 1000;
      latencyRef.current = Math.min(4, Math.max(0.15, latencyRef.current * 0.6 + took * 1.25 * 0.4));
      const start = () => {
        if (!aliveRef.current || gen !== genRef.current) return;
        if (wantSound) {
          player(k).play(0);
          playersRef.current[1 - k]?.stop();
          nextPlayerRef.current = 1 - k;
        }
        // The audio is the clock: booth time reads t0 as this chunk sounds.
        syncClock(t0);
        resyncClock();
        currentRef.current = { t0, dur, render, player: k };
        meters.value = frameOf(render);
        optsRef.current?.onChunk?.(render);
        setLastRec({ render, stamp });
        setStatus(wantSound ? 'playing' : 'silent');
        // Prepare the next chunk to start exactly as this one ends.
        const lead = latencyRef.current + 0.35;
        later((dur - lead) * 1000, () => {
          if (!aliveRef.current || gen !== genRef.current || !anyPlaying(getBooth())) return;
          void runChunk(gen, t0 + dur, CHUNK_S);
        });
      };
      const wait = (t0 - boothNow()) * 1000;
      if (wait > 4) later(wait, start);
      else start();
    },
    [meters, resyncClock],
  );

  /** (Re)start the chunk chain from a moment just ahead of now. */
  const restart = useCallback(() => {
    clearTimers();
    const gen = ++genRef.current;
    if (!anyPlaying(getBooth())) {
      silencePlayers();
      currentRef.current = null;
      meters.value = null;
      setLastRec(null);
      setStatus('idle');
      resyncClock();
      return;
    }
    resyncClock();
    if (!currentRef.current) setStatus('rendering');
    const t0 = boothNow() + latencyRef.current;
    void runChunk(gen, t0, FIRST_CHUNK_S);
  }, [meters, resyncClock, runChunk, silencePlayers]);

  // Every booth change re-renders (coalesced: a fader drag pays once).
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    const off = subscribeBooth(() => {
      if (t) clearTimeout(t);
      // A start/stop answers at once; a control change waits a beat.
      t = setTimeout(restart, 60);
      if (!boothRunning()) resyncClock();
    });
    return () => {
      off();
      if (t) clearTimeout(t);
    };
  }, [restart, resyncClock]);

  const stop = useCallback(() => {
    clearTimers();
    genRef.current++;
    silencePlayers();
    stopBooth();
    currentRef.current = null;
    meters.value = null;
    setLastRec(null);
    setStatus('idle');
    resyncClock();
  }, [meters, resyncClock, silencePlayers]);

  const [soundDeclined, setSoundDeclined] = useState(false);
  const declinedRef = useRef(false);
  const requestSound = useCallback(async (force = false): Promise<boolean> => {
    if (declinedRef.current && !force && !isAudioOutputEnabled()) return false;
    const ok = await requestAudioOutput();
    if (!aliveRef.current) return false;
    declinedRef.current = !ok;
    setSoundDeclined(!ok);
    const was = soundRef.current;
    soundRef.current = ok && !getLabPreview().active;
    if (soundRef.current && !was) AccessibilityInfo.announceForAccessibility?.('Sound on.');
    if (soundRef.current !== was && anyPlaying(getBooth())) restart();
    return soundRef.current;
  }, [requestAudioOutput, restart]);

  useEffect(() => {
    aliveRef.current = true;
    resyncClock();
    return () => {
      aliveRef.current = false;
      clearTimers();
      genRef.current++;
      for (const p of playersRef.current) {
        p?.stop();
        p?.dispose();
      }
      playersRef.current = [null, null];
      // Leaving the screen stops the booth (the house rule: no sound without
      // its display); the decks keep their places for the next screen.
      stopBooth();
      // ...and a take still recording ends here: the next screen's chunks
      // must never write into it (toddler bug test 2026-10-19).
      closeOpenTake(boothNow());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const running = status !== 'idle';
  useStopWhenSilenced(running, stop);
  useStopOnClose(stop);

  const leadSec = useCallback(() => latencyRef.current + 0.06, []);
  // read on every render of the screen (it re-renders on each booth change)
  const lastFresh = readingFresh(lastStamp, boothVersion());
  return useMemo(
    () => ({ status, clock, meters, last, lastStamp, lastFresh, requestSound, soundDeclined, stop, flowMotion, leadSec }),
    [status, clock, meters, last, lastStamp, lastFresh, requestSound, soundDeclined, stop, flowMotion, leadSec],
  );
}
