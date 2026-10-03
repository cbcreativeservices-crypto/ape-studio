/**
 * Custom waveform-trace colour preference (owner rev 24; open to EVERY tier
 * since 2026-09-13 — see docs/APE_GOVERNANCE_DECISIONS_2026_09_13.md R1).
 * Persisted per device; `null` = the tool's default trace colour. Mirrors
 * `useColorModePref`. Applies to the FLAT trace (COLORS/MIDI-gradient off).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { armSaveFailureReport } from '../storage/saveFailureNotice';

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
 *  independent.
 *
 *  EVERY tool colour runs through here — waveform trace, RTA bars, tuner
 *  in-tune colour, LED level and LED average — so the one line at the bottom
 *  decided whether ANY of them applied. It used to return `null` for a
 *  non-member, which is why opening the colour wheel to everyone (R1) was not
 *  enough on its own: a free user could pick a colour, watch it save, and see
 *  nothing change. Ungating the door without ungating the room. */
export function useToolColorPref(key: string): [string | null, (c: string | null) => void] {
  const [color, setColor] = useState<string | null>(null);
  // A pick landing before the stored value was read must win (toddler pass 3
  // 2026-09-30) — the late read used to put the OLD colour back over it.
  const touched = useRef(false);
  useEffect(() => {
    let alive = true;
    touched.current = false;
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (alive && !touched.current && raw) setColor(raw);
      })
      .catch(() => {}); // unreadable → keep the default
    return () => {
      alive = false;
    };
  }, [key]);
  const set = useCallback(
    (c: string | null) => {
      touched.current = true;
      setColor(c);
      const reportRefused = armSaveFailureReport(); // the user's pick: a refusal is told
      if (c) void AsyncStorage.setItem(key, c).catch(() => reportRefused());
      else void AsyncStorage.removeItem(key).catch(() => reportRefused());
    },
    [key],
  );
  // The stored choice ALWAYS applies now (R1, 2026-09-13). This used to drop
  // the colour on a lapse, which also made the entitlement provider's boot
  // state a rendering concern — a member's saved colour was thrown away on the
  // first paint of every tool and snapped back once the server read landed.
  // With no tier to consult there is nothing to race.
  return [color, set];
}

/** Waveform trace colour (the first consumer). */
export function useWaveColorPref(): [string | null, (c: string | null) => void] {
  return useToolColorPref('ape:tools:waveColor');
}
