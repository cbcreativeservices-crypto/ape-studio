/**
 * Patchbay lab — completion units for the R6c lab-credit bridge (owner ruling
 * 2026-09-10: "anything in the Audio Fundamentals container menu is part of
 * the audio fundamentals requisite"). Pure data — imported by the boot-loaded
 * labCompletion store, so NOTHING React/Skia may ever live here.
 *
 * The lab is paged (PagedLab): its completion rule is "every page done", so
 * the unit set is one unit per page (p1..p23). PatchbayLabScreen bridges
 * PagedLab's per-page markDone into markLabUnit, and back-fills units from
 * pagedProgress on mount so a device that already finished pages gets credit.
 * A dev-time check in the screen keeps this count honest against the real
 * page array (the two can't be imported together here without dragging React
 * into the boot store).
 */
export const PATCHBAY_LAB_KEY = 'af_patchbay' as const;

export const PATCHBAY_PAGE_COUNT = 23;

/** One completion unit per page: 'p1' … 'p23'. */
export const PATCHBAY_UNITS: readonly string[] = Array.from(
  { length: PATCHBAY_PAGE_COUNT },
  (_, i) => `p${i + 1}`,
);
