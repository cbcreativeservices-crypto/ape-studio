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
 * turns so the next chunk loads while one sounds. A change (a fader, a
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
import { anchorAt } from '../model/djModel';
import { anyPlaying } from '../model/djDeck';
import { renderBooth, TAPS, type BoothRender, type Tap } from '../engine/djRender';
import { boothNow, boothRunning, getBooth, stopBooth, subscribeBooth, syncClock } from './boothStore';

/** What the drawing reads for the meters (one chunk). */
export type MeterFrame = {
  t0: number;
  blocks: number;
  meter: Record<Tap, number[]>;
  hold: Record<Tap, number[]>;
  over: number[];
};

export type BoothAudio = {
  /** idle · rendering (first chunk on its way) · playing (sound) · silent
   *  (running, sound off) · failed (a clip could not load). */
  status: 'idle' | 'rendering' | 'playing' | 'silent' | 'failed';
  /** Booth seconds, per frame. */
  clock: SharedValue<number>;
  meters: SharedValue<MeterFrame | null>;
  /** The latest chunk's render, for the well's words (chunk-rate React state). */
  last: BoothRender | null;
  /** Ask the sound gate (call from a PLAY press). Resolves whether sound is on. */
  requestSound: () => Promise<boolean>;
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
  return { t0: r.t0, blocks: r.meter.ch1.length, meter, hold, over: Array.from(r.busOver) };
}

const breath = () => new Promise<void>((res) => setTimeout(res, 0));

export function useBoothAudio(): BoothAudio {
  const { requestAudioOutput } = useAudioOutputGate();
  const flowMotion = useDecorativeMotion();
  const [status, setStatus] = useState<BoothAudio['status']>('idle');
  const [last, setLast] = useState<BoothRender | null>(null);

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
      const booth = anchorAt(getBooth(), t0);
      const render = renderBooth(booth, t0, dur);
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
        setLast(render);
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
    setStatus('idle');
    resyncClock();
  }, [meters, resyncClock, silencePlayers]);

  const requestSound = useCallback(async (): Promise<boolean> => {
    const ok = await requestAudioOutput();
    if (!aliveRef.current) return false;
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const running = status !== 'idle';
  useStopWhenSilenced(running, stop);
  useStopOnClose(stop);

  const leadSec = useCallback(() => latencyRef.current + 0.06, []);
  return useMemo(() => ({ status, clock, meters, last, requestSound, stop, flowMotion, leadSec }), [status, clock, meters, last, requestSound, stop, flowMotion, leadSec]);
}
