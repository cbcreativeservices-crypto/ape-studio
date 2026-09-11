/**
 * Audio Connectors & Cable Selection Lab — completion units for the R6c
 * lab-credit bridge (patchbay precedent; owner ruling 2026-09-10: anything
 * in the Audio Fundamentals container is part of the fundamentals
 * requisite). Pure data — imported by the boot-loaded labCompletion store,
 * so NOTHING React/Skia may ever live here.
 *
 * Credit stays inert server-side until the owner runs
 * docs/APE_CONNECTOR_SELECT_SEED_2026_09_11.sql (the lab_not_found guard
 * keeps the completion unsent + retried until then).
 */
export const CONNECTOR_SELECT_LAB_KEY = 'af_connector_select' as const;

export const CONNECTOR_SELECT_PAGE_COUNT = 16;

/** One completion unit per page: 'p1' … 'p16'. */
export const CONNECTOR_SELECT_UNITS: readonly string[] = Array.from(
  { length: CONNECTOR_SELECT_PAGE_COUNT },
  (_, i) => `p${i + 1}`,
);
