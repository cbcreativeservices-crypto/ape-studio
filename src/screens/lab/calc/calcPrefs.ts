/**
 * Calculator Lab UI preferences (owner 2026-08-05).
 *
 * The three explanation sections at the bottom of every calculator — WHY THIS
 * MATTERS, PRACTICAL EXAMPLE, COMMON MISTAKES — are collapsible. They default to
 * OPEN, and each user's collapsed choices are remembered across launches (one
 * shared preference across all calculators).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { armSaveFailureReport } from '../../../features/storage/saveFailureNotice';

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
  // Sections the user tapped before the stored read landed (evening hunt 2,
  // 2026-10-02): the late read used to flip them back to the OLD stored state
  // while the tap's own write had already stored the new one — the screen and
  // the next launch disagreed. A tapped section keeps what the tap set.
  const touchedRef = useRef<Set<CalcSection>>(new Set());

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const rows = await AsyncStorage.multiGet([KEYS.why, KEYS.example, KEYS.mistakes]);
        if (!alive) return;
        const map = Object.fromEntries(rows) as Record<string, string | null>;
        const t = touchedRef.current;
        setOpen((o) => ({
          why: t.has('why') ? o.why : map[KEYS.why] !== '0',
          example: t.has('example') ? o.example : map[KEYS.example] !== '0',
          mistakes: t.has('mistakes') ? o.mistakes : map[KEYS.mistakes] !== '0',
        }));
      } catch {
        // storage unavailable (e.g. web/offline) — keep the open-by-default state
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const toggle = useCallback((k: CalcSection) => {
    touchedRef.current.add(k);
    setOpen((o) => {
      const next = { ...o, [k]: !o[k] };
      const reportRefused = armSaveFailureReport(); // the user's tap: a refusal is told
      void AsyncStorage.setItem(KEYS[k], next[k] ? '1' : '0').catch(() => reportRefused());
      return next;
    });
  }, []);

  return { open, toggle };
}
