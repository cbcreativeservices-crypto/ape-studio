/**
 * DECORATIVE MOTION — the one gate every decorative loop reads
 * (pattern hunt P10b, owner ruling 2026-10-02: "favor consistency and
 * learning outcomes").
 *
 * Two kinds of looping motion live in this app, and the owner ruled on both:
 *
 *  • DECORATIVE loops — glows, shimmers, sweeps, attention pulses, flickering
 *    lamps, tuner chevrons, the SPL gold sweep, hub previews. They stop when
 *    "Reduce animations" is on (the app toggle OR the phone's setting) AND
 *    when Low-Light Production Mode is on: in that mode nothing on screen may
 *    draw attention to itself unbidden. A stored Low-Light value that could
 *    not be READ counts as on, exactly as it does for overlays
 *    (`useLowLightSuppresses`).
 *
 *  • LESSON DISPLAYS, user-started — the Harmonograph drawing, an oscilloscope
 *    trace, the wave pulse, the mic cutaway, a playhead under sounding audio.
 *    The moving image IS the lesson and the learner started it, so neither
 *    setting stops it. They do NOT read this gate; each is listed with its
 *    reason in test/patternP10b_20261002.test.ts.
 *
 * Both halves are SUBSCRIBED: Settings is a modal, so the screen behind it
 * stays mounted and never re-renders on the toggle unless something tells it
 * to. A per-render `animationsAllowed()` read missed the switch until the
 * screen happened to re-render (wave 3 found six of those; wave 4 the rest).
 *
 * Small on purpose: two existing subscriptions ANDed. Both hooks are called
 * on every render (never short-circuited — popupSuppressStore explains the
 * white screen that a conditional hook caused).
 */
import { animationsAllowed, useAnimationsAllowed } from './a11y';
import { getLowLight, isLowLightUnreadable, useLowLightSuppresses } from './lowLight';

/** Synchronous read for non-React code (and one-shot reads inside effects). */
export function decorativeMotionAllowed(): boolean {
  return animationsAllowed() && !getLowLight() && !isLowLightUnreadable();
}

/**
 * Should a DECORATIVE loop run right now? False under reduced motion (app or
 * OS) and in Low-Light Production Mode. Re-renders the caller when either
 * flips, so a mounted loop stops the moment Settings closes.
 */
export function useDecorativeMotion(): boolean {
  const motionOk = useAnimationsAllowed();
  const lowLight = useLowLightSuppresses();
  return motionOk && !lowLight;
}
