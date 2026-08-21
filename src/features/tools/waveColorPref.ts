/**
 * Custom waveform-trace colour preference (owner rev 24 — Academy members can
 * set the Waveform Viewer's flat trace colour to a colour of their choice).
 * Persisted per device; `null` = the tool's default trace colour. Mirrors
 * `useColorModePref`. Applies to the FLAT trace (COLORS/MIDI-gradient off).
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

/** Generic per-tool custom-colour pref: [color|null, setColor] — persisted at
 *  `key`; null = the tool's default. Each tool passes its own key so colours are
 *  independent (owner rule 2026-08-20 — customization is member-gated). */
export function useToolColorPref(key: string): [string | null, (c: string | null) => void] {
  const [color, setColor] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void (async () => {
      const raw = await AsyncStorage.getItem(key);
      if (alive && raw) setColor(raw);
    })();
    return () => {
      alive = false;
    };
  }, [key]);
  const set = useCallback(
    (c: string | null) => {
      setColor(c);
      if (c) void AsyncStorage.setItem(key, c);
      else void AsyncStorage.removeItem(key);
    },
    [key],
  );
  return [color, set];
}

/** Waveform trace colour (the first consumer). */
export function useWaveColorPref(): [string | null, (c: string | null) => void] {
  return useToolColorPref('ape:tools:waveColor');
}
