/**
 * Custom waveform-trace colour preference (owner rev 24 — Academy members can
 * set the Waveform Viewer's flat trace colour to a colour of their choice).
 * Persisted per device; `null` = the tool's default trace colour. Mirrors
 * `useColorModePref`. Applies to the FLAT trace (COLORS/MIDI-gradient off).
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ape:tools:waveColor';

/** Curated palette shown in the picker (first is the app default teal). */
export const WAVE_COLOR_SWATCHES = [
  '#5fd9c4', // default teal
  '#4fd07f', // green
  '#a6e22e', // lime
  '#ffd35e', // amber
  '#f0863a', // orange
  '#ff5a48', // red
  '#ff7ab6', // pink
  '#c77dff', // purple
  '#8fb6ff', // blue
  '#4dd0e1', // cyan
  '#e6e7ea', // white
  '#9aa0aa', // grey
] as const;

/** [color|null, setColor] — persisted; null = tool default. */
export function useWaveColorPref(): [string | null, (c: string | null) => void] {
  const [color, setColor] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void (async () => {
      const raw = await AsyncStorage.getItem(KEY);
      if (alive && raw) setColor(raw);
    })();
    return () => {
      alive = false;
    };
  }, []);
  const set = useCallback((c: string | null) => {
    setColor(c);
    if (c) void AsyncStorage.setItem(KEY, c);
    else void AsyncStorage.removeItem(KEY);
  }, []);
  return [color, set];
}
