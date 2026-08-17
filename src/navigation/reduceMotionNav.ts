/**
 * useReduceMotionNav — system Reduce Motion preference for the navigators
 * (owner transition standard 2026-08-16): when ON, screen pushes are replaced
 * with a very short fade; the standard's fades stay (already gentle).
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReduceMotionNav(): boolean {
  const [rm, setRm] = useState(false);
  useEffect(() => {
    let live = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (live) setRm(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setRm);
    return () => {
      live = false;
      sub.remove();
    };
  }, []);
  return rm;
}

/**
 * The app's TWO navigation transitions (owner 2026-08-16). Simple governing
 * rule: SWITCHING AREAS FADES, OPENING CONTENT PUSHES.
 *
 *  - fadeThrough: equal-level destinations (bottom-nav areas, Tools hub,
 *    Certificates, Glossary ⇄ Dashboard). ~200ms, nav stays put, no zoom.
 *  - push: opening contained content (menu → lab, lab → lesson, topic → term).
 *    Platform-native horizontal push; back precisely reverses it.
 *
 * No shared-element morphs, zooms, bounces, or card expansions — anywhere.
 */
export const NAV_FADE = { animation: 'fade', animationDuration: 200 } as const;
/** Reduce Motion replacement for the push — a very short fade. */
export const NAV_PUSH_REDUCED = { animation: 'fade', animationDuration: 120 } as const;
