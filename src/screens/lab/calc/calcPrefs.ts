/**
 * Calculator Lab UI preferences (owner 2026-08-05).
 *
 * The three explanation sections at the bottom of every calculator — WHY THIS
 * MATTERS, PRACTICAL EXAMPLE, COMMON MISTAKES — are collapsible. They default to
 * OPEN, and each user's collapsed choices are remembered across launches (one
 * shared preference across all calculators).
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CalcSection = 'why' | 'example' | 'mistakes';

const KEYS: Record<CalcSection, string> = {
  why: 'ape:calc:sec:why',
  example: 'ape:calc:sec:example',
  mistakes: 'ape:calc:sec:mistakes',
};

/** Open-state (default true) for each explanation section, persisted per user. */
export function useCalcSectionOpen(): {
  open: Record<CalcSection, boolean>;
  toggle: (k: CalcSection) => void;
} {
  const [open, setOpen] = useState<Record<CalcSection, boolean>>({ why: true, example: true, mistakes: true });

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const rows = await AsyncStorage.multiGet([KEYS.why, KEYS.example, KEYS.mistakes]);
        if (!alive) return;
        const map = Object.fromEntries(rows) as Record<string, string | null>;
        setOpen({
          why: map[KEYS.why] !== '0',
          example: map[KEYS.example] !== '0',
          mistakes: map[KEYS.mistakes] !== '0',
        });
      } catch {
        // storage unavailable (e.g. web/offline) — keep the open-by-default state
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const toggle = useCallback((k: CalcSection) => {
    setOpen((o) => {
      const next = { ...o, [k]: !o[k] };
      void AsyncStorage.setItem(KEYS[k], next[k] ? '1' : '0').catch(() => {});
      return next;
    });
  }, []);

  return { open, toggle };
}
