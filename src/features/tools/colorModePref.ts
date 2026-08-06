/**
 * Shared "show levels in colour" preference for the audio tools that carry a
 * [COLORS] toggle (owner 2026-08-05, item 7).
 *
 * Rule: the FIRST time ever (no stored value) the tools default to COLOUR mode
 * ON. After that the user's last choice is remembered across launches. One
 * shared key means the preference is consistent across every tool that has the
 * toggle (Waveform, RTA, Signal Generator, …).
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ape:tools:colorMode';

/** [colorOn, setColorOn] — persisted; defaults ON until the user changes it. */
export function useColorModePref(): [boolean, (v: boolean) => void] {
  const [on, setOn] = useState(true); // first-ever = colour ON (no stored value yet)
  useEffect(() => {
    let alive = true;
    void (async () => {
      const raw = await AsyncStorage.getItem(KEY);
      if (alive && raw != null) setOn(raw === '1');
    })();
    return () => {
      alive = false;
    };
  }, []);
  const set = useCallback((v: boolean) => {
    setOn(v);
    void AsyncStorage.setItem(KEY, v ? '1' : '0');
  }, []);
  return [on, set];
}
