/**
 * Patchbay Signal Flow & Normalling Lab (owner brief 2026-09-10) — complete:
 * Part One (pages 1–13, Phase A device-passed 2026-09-10): the single vertical
 * pair, thru → normal → full → half, the switching contact, the comparison
 * table, predict-before-patching, detective mode. Part Two (pages 14–23,
 * Phase B): the 8-pair studio bay, zero-cables + invisible normals,
 * overpatching, the processor insert/bypass chain, wrong-patch service calls,
 * the directional half-normal variant, T·R·S, phantom-power safety,
 * design-your-own bay, and the 10-scenario proficiency assessment.
 *
 * Every routing claim resolves through engine/patchbay.ts, whose complete
 * truth table (and every authored exercise in scenarios.ts + scenariosB.ts)
 * is pinned by test/patchbayEngine.test.ts. ALL COPY RATIFIED by the owner
 * 2026-09-10 (docs/APE_PATCHBAY_LAB_COPY_2026_09_10.md).
 */
import { useCallback, useEffect } from 'react';
import { PagedLab } from '../kit/PagedLab';
import { PATCHBAY_PAGES_A } from './pagesA';
import { PATCHBAY_PAGES_B } from './pagesB';
import { PATCHBAY_PAGES_C } from './pagesC';
import { PATCHBAY_PAGES_D } from './pagesD';
import { markLabUnit, registerLabUnits } from '../../../features/lab/labCompletion';
import { loadPagedProgress } from '../../../features/lab/pagedProgress';
import { PATCHBAY_LAB_KEY, PATCHBAY_PAGE_COUNT, PATCHBAY_UNITS } from './units';
// Screen Guide (owner 2026-10-31): "this page, explained" — one guide per page,
// plus the what's-left end screen's own (WHERE YOU ARE).
import { PATCHBAY_END_GUIDE, patchbayPageGuide } from './patchbayScreenGuides';

const PAGES = [...PATCHBAY_PAGES_A, ...PATCHBAY_PAGES_B, ...PATCHBAY_PAGES_C, ...PATCHBAY_PAGES_D];

if (__DEV__ && PAGES.length !== PATCHBAY_PAGE_COUNT) {
  // units.ts can't import the page arrays (it feeds the boot-loaded completion
  // store, which must stay React-free) — this keeps the two counts honest.
  throw new Error(
    `Patchbay page count drifted: PAGES has ${PAGES.length}, units.ts says ${PATCHBAY_PAGE_COUNT}. ` +
      'Update PATCHBAY_PAGE_COUNT in src/screens/lab/patchbay/units.ts.',
  );
}

/** Each unfinished row's own "what is missing" line on WHERE YOU ARE (phase 2
 *  end screen, 2026-11-14; SHARED_API S2 §4), keyed by the 0-based page. The
 *  goal-chip names are the page's own. Reading pages (1, 2, 13) have none:
 *  the frame says once how they count. */
const PAGE_DETAIL: Readonly<Record<number, string>> = {
  2: 'Still to do: light SEE THE DEAD END (top jack only), then COMPLETE THE ROUTE (both jacks).',
  3: 'Still to do: answer the UNDERSTANDING CHECK about where a normalled pair sends its signal.',
  4: 'Still to do: slide PLUG INSERTION in to BREAK THE NORMAL, then pull it back out to RESTORE IT.',
  5: 'Still to do: light all four states, A · NOTHING PATCHED to D · BOTH, with TOP JACK and BOTTOM JACK.',
  6: 'Still to do: answer PREDICT BEFORE PATCHING, then patch the TOP jack to see the split.',
  7: 'Still to do: answer the check on which insertion breaks a common half-normal pair.',
  8: 'Still to do: TAP THE MIX with the top jack, then REPLACE THE SOURCE with the bottom one.',
  9: 'Still to do: answer the tuner question under the table.',
  10: 'Still to do: solve all four PREDICT cards.',
  11: 'Still to do: give YOUR VERDICT on all three detective cases.',
  13: 'Still to do: VISIT 4 PAIRS, FIND THE 2 THRU PAIRS and PATCH SOMETHING.',
  14: 'Still to do: turn on SHOW THE INVISIBLE NORMALS and answer the check below the bay.',
  15: 'Still to do: OVERPATCH IT by patching the bottom jack.',
  16: 'Still to do: INSERT THE COMPRESSOR, BYPASS IT AGAIN, and answer the SERVICE CALL.',
  17: 'Still to do: give YOUR DIAGNOSIS on all four service calls.',
  18: 'Still to do: BREAK IT FROM THE TOP, then SEE THE CLASH with the bottom jack.',
  19: 'Still to do: answer the check on what one drawn line really stands for.',
  20: 'Still to do: answer the phantom-power check.',
  21: 'Still to do: choose a wiring for each of the six pairs.',
  22: 'Still to do: solve all ten scenarios.',
};
const pageDetail = (i: number): string | undefined => PAGE_DETAIL[i];

export function PatchbayLabScreen() {
  // R6c lab-credit bridge (owner ruling 2026-09-10). Register the unit set,
  // then back-fill from pagedProgress so a device that already finished pages
  // (the owner's, for one) banks credit without re-walking the lab. markLabUnit
  // is idempotent and preview-guarded, so replaying every visit is safe.
  useEffect(() => {
    registerLabUnits(PATCHBAY_LAB_KEY, PATCHBAY_UNITS);
    let alive = true;
    void loadPagedProgress('patchbay').then((p) => {
      if (!alive) return;
      for (const i of p.completed) markLabUnit(PATCHBAY_LAB_KEY, `p${i + 1}`);
    });
    return () => {
      alive = false;
    };
  }, []);

  const onPageDone = useCallback((index: number) => {
    markLabUnit(PATCHBAY_LAB_KEY, `p${index + 1}`);
  }, []);

  return (
    <PagedLab
      labId="patchbay"
      title="Patchbay Signal Flow & Normalling"
      subtitle="On most bays, top is the source and bottom is the destination. A normal is the path that exists when you do nothing — and patching changes that path."
      pages={PAGES}
      onPageDone={onPageDone}
      creditLabKey={PATCHBAY_LAB_KEY}
      pageDetail={pageDetail}
      handsOnDetail="A page with goals or questions counts once all of them are done; NEXT moves on without counting it."
      // Screen Guide: the ⓘ on every page, and on the what's-left screen.
      pageGuide={patchbayPageGuide}
      endGuide={PATCHBAY_END_GUIDE}
      // A CONCEPT lab (owner rule 2026-10-31): its readouts are routing
      // states (CORD / EMPTY, INTACT / BROKEN, SOURCE / PATCH), never a
      // real-world measurement, and the jack cutaway carries its own
      // CONCEPTUAL MODEL badge — so no accuracy chip; the ⓘ takes its spot.
      accuracy={false}
    />
  );
}
