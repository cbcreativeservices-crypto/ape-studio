/**
 * Audio Foundations Course — completion units for the R6c lab-credit bridge
 * (Patchbay / Connector Select precedent). Pure data — imported by the
 * boot-loaded labCompletion store, so NOTHING React/Skia may ever live here.
 *
 * WHY STATIC: FoundationsCourseScreen registers the same list at runtime via
 * registerLabUnits, which is enough while the screen is mounted — but
 * retryUnsent() runs during hydrate() at BOOT, long before any lab screen
 * mounts. Without a static entry, unitsFor('af_foundations') found nothing at
 * that moment and a course finished offline (or signed-out) was never retried
 * until the learner happened to reopen the course.
 *
 * The unit id for a step is its INDEX as a string ('0'…'13') — that is what the
 * screen has always marked (`markLabUnit('af_foundations', String(step))`), so
 * this list must stay index-based or already-banked progress would be orphaned.
 * FoundationsCourseScreen dev-checks STEPS.length against the count below (the
 * two can't be imported together here without dragging React into the boot
 * store).
 */
export const FOUNDATIONS_LAB_KEY = 'af_foundations' as const;

/** STEPS.length in FoundationsCourseScreen.tsx (modules m1…m14). */
export const FOUNDATIONS_STEP_COUNT = 14;

/** One completion unit per step, keyed by index: '0' … '13'. */
export const FOUNDATIONS_UNITS: readonly string[] = Array.from(
  { length: FOUNDATIONS_STEP_COUNT },
  (_, i) => String(i),
);
