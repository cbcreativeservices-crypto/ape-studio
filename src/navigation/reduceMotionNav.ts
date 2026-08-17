/**
 * useReduceMotionNav — system Reduce Motion preference for the navigators
 * (owner transition standard 2026-08-16): when ON, screen pushes are replaced
 * with a very short fade; the standard's fades stay (already gentle).
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

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
 *
 * Durations ×1.41 (owner 2026-08-16: "slow new screen transitions by 41%"):
 * fade 200→280ms, reduced-motion fade 120→170ms, iOS push ~350→490ms (via
 * 'simple_push', whose duration IS adjustable — 'default' UIKit push is not;
 * still a horizontal push with native easing + swipe-back). Android's push
 * duration is fixed by the platform (react-native-screens exposes
 * animationDuration on iOS only) — Android keeps the system pace.
 */
export const NAV_FADE = { animation: 'fade', animationDuration: 280 } as const;
/** Reduce Motion replacement for the push — a very short fade. */
export const NAV_PUSH_REDUCED = { animation: 'fade', animationDuration: 170 } as const;
/** The one push spec (opening contained content). */
export const NAV_PUSH =
  Platform.OS === 'ios'
    ? ({ animation: 'simple_push', animationDuration: 490 } as const)
    : ({ animation: 'slide_from_right' } as const);
