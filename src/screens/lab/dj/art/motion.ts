/**
 * motion — what the booth drawing reads every frame, from the ONE clock
 * (useBoothAudio.clock). React context so each device drawing can reach it.
 * Every value here is a SharedValue/derived value on the UI thread — never
 * per-frame React state.
 */
import { createContext, useContext } from 'react';
import { useDerivedValue, useSharedValue, type SharedValue } from 'react-native-reanimated';
import type { MeterFrame } from '../booth/useBoothAudio';
import type { Tap } from '../engine/djRender';
import type { DeckState } from '../model/djModel';

export type BoothMotion = {
  clock: SharedValue<number>;
  meters: SharedValue<MeterFrame | null>;
};

export const MotionContext = createContext<BoothMotion | null>(null);

/** A still clock for drawings shown outside a running booth (Screen 2's
 *  catalogue, thumbnails). */
export function useStillMotion(): BoothMotion {
  const clock = useSharedValue(0);
  const meters = useSharedValue<MeterFrame | null>(null);
  return { clock, meters };
}

export function useMotion(): BoothMotion {
  const m = useContext(MotionContext);
  if (!m) throw new Error('MotionContext missing');
  return m;
}

/** A meter tap's displayed level (dBFS) under the clock; the floor when the
 *  booth is not running. */
export function useTapDb(tap: Tap, which: 'meter' | 'hold' = 'meter') {
  const { clock, meters } = useMotion();
  return useDerivedValue(() => {
    const m = meters.value;
    if (!m) return -60;
    let k = Math.floor((clock.value - m.t0) / 0.01);
    if (k < 0) k = 0;
    if (k >= m.blocks) k = m.blocks - 1;
    return m[which][tap][k];
  });
}

/** 1 while the mix bus clipped within the last 1.5 s (the BUS OVER light). */
export function useBusOver() {
  const { clock, meters } = useMotion();
  return useDerivedValue((): number => {
    const m = meters.value;
    if (!m) return 0;
    let k = Math.floor((clock.value - m.t0) / 0.01);
    if (k >= m.blocks) k = m.blocks - 1;
    for (let i = Math.max(0, k - 150); i <= k; i++) if (m.over[i]) return 1;
    return 0;
  });
}

/**
 * A deck's track position (s) per frame — the same formula as
 * djTime.advance (rate = 1 + pitch/100; a loop wraps), evaluated on the UI
 * thread from the deck's anchored state.
 */
export function useDeckPos(d: DeckState) {
  const { clock } = useMotion();
  const pos0 = d.posSec;
  const at = d.at;
  const rate = 1 + d.pitch / 100;
  const playing = d.playing && !!d.track;
  const ls = d.loop ? d.loop.startSec : -1;
  const ll = d.loop ? d.loop.lengthSec : 0;
  return useDerivedValue(() => {
    if (!playing) return pos0;
    const dt = clock.value - at;
    const t = pos0 + (dt > 0 ? dt : 0) * rate;
    if (ll <= 0) return t;
    const end = ls + ll;
    if (pos0 >= end || t < end) return t;
    return ls + ((t - ls) % ll);
  });
}

/** Platter / jog-ring angle (radians): 33⅓ rpm × the tempo rate, the true
 *  speed of a turntable platter (and of a player's jog display at its
 *  default). */
export function useSpinAngle(d: DeckState, rpm = 100 / 3) {
  const { clock } = useMotion();
  const rate = 1 + d.pitch / 100;
  const playing = d.playing && !!d.track;
  const at = d.at;
  // the angle at the anchor, continuous across changes: derived from track time
  const base = (d.posSec / 60) * rpm * 2 * Math.PI;
  return useDerivedValue(() => {
    if (!playing) return base;
    const dt = clock.value - at;
    return base + ((dt > 0 ? dt : 0) * rate * rpm * 2 * Math.PI) / 60;
  });
}
