/**
 * onboardingSampling — transient "first-run sampling in progress" flag.
 *
 * During the first-run sampler loop (onboarding plan §2.1) the user opens real
 * destinations (glossary / learning / tools) to try them out. While that is
 * happening we must SUPPRESS those screens' normal educational surfaces — screen
 * intros, learning-intro sheets, coach marks, and the amplitude orientation —
 * so the sample feels clean. We must NOT suppress anything technically required
 * or safety/consent/entitlement related (mic permission, EngineGate, paywall,
 * safety warnings); those live on separate code paths and are left untouched.
 *
 * This is IN-MEMORY only (never persisted): sampling is a live session state
 * that must reset on relaunch. The permanent "onboarding complete" and the
 * "visited" set live separately in onboardingFlow.ts.
 *
 * Same tiny hand-rolled external-store pattern as popupSuppressStore.
 */
import { useEffect, useState } from 'react';

let sampling = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** Current value (sync). */
export function isSamplingActive(): boolean {
  return sampling;
}

/** Enter/leave the sampler loop. Set true when the sampler opens a destination,
 *  false when the loop ends (user reaches Home) or is cancelled. */
export function setSamplingActive(v: boolean): void {
  if (sampling === v) return;
  sampling = v;
  emit();
}

/** Live view — re-renders on change. */
export function useSamplingActive(): boolean {
  const [snap, setSnap] = useState<boolean>(sampling);
  useEffect(() => {
    const l = () => setSnap(sampling);
    listeners.add(l);
    l(); // sync to current value on mount
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snap;
}
