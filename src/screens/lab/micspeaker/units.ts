/**
 * Microphone Principles + Speaker Placement & Coverage — completion units for
 * the R6c lab-credit bridge (Patchbay / Connector Select precedent). Pure data
 * — imported by the boot-loaded labCompletion store, so NOTHING React/Skia may
 * ever live here (both screens pull in Skia viz modules).
 *
 * WHY STATIC: each screen registers the same list at runtime via
 * registerLabUnits, which is enough while it is mounted — but retryUnsent()
 * runs during hydrate() at BOOT, long before any lab screen mounts. Without a
 * static entry, unitsFor() found nothing at that moment and a lab finished
 * offline (or signed-out) was never retried until the learner happened to
 * reopen that lab.
 *
 * The unit id for a section is its `key` — exactly what the screens have always
 * marked (`markLabUnit(key, SECTIONS[sectionIdx].key)`), so these lists must
 * stay key-based and in the same order as the screens' SECTIONS arrays or
 * already-banked progress would be orphaned. Both screens dev-check their
 * SECTIONS keys against the lists below (the two can't be imported together
 * here without dragging React into the boot store).
 */

export const MIC_PRINCIPLES_LAB_KEY = 'af_mic_principles' as const;

/** SECTIONS keys in MicPrinciplesLabScreen.tsx, in order. */
export const MIC_PRINCIPLES_UNITS: readonly string[] = [
  'capsule',
  'polar',
  'distance',
  'proximity',
  'offaxis',
  'stereo',
  'pop',
  'shock',
  'hand',
  'mistakes',
];

export const SPEAKER_COVERAGE_LAB_KEY = 'af_speaker_coverage' as const;

/** SECTIONS keys in SpeakerCoverageLabScreen.tsx, in order. */
export const SPEAKER_COVERAGE_UNITS: readonly string[] = ['top', 'side', 'read'];
