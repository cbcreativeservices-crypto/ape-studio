/**
 * Audio Connectors & Cable Selection Lab — completion units for the R6c
 * lab-credit bridge (patchbay precedent; owner ruling 2026-09-10: anything
 * in the Audio Fundamentals container is part of the fundamentals
 * requisite). Pure data — imported by the boot-loaded labCompletion store,
 * so NOTHING React/Skia may ever live here.
 *
 * Server credit: docs/APE_CONNECTOR_SELECT_SEED_2026_09_11.sql WAS RUN —
 * the live `labs` row af_connector_select is dated 2026-09-11 (checked
 * 2026-10-27), so mark_lab_complete accepts it. Before the seed, the
 * lab_not_found guard kept the completion unsent and retried.
 */
export const CONNECTOR_SELECT_LAB_KEY = 'af_connector_select' as const;

export const CONNECTOR_SELECT_PAGE_COUNT = 16;

/** One completion unit per page: 'p1' … 'p16'. */
export const CONNECTOR_SELECT_UNITS: readonly string[] = Array.from(
  { length: CONNECTOR_SELECT_PAGE_COUNT },
  (_, i) => `p${i + 1}`,
);
