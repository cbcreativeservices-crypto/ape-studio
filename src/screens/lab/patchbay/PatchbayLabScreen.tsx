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

const PAGES = [...PATCHBAY_PAGES_A, ...PATCHBAY_PAGES_B, ...PATCHBAY_PAGES_C, ...PATCHBAY_PAGES_D];

if (__DEV__ && PAGES.length !== PATCHBAY_PAGE_COUNT) {
  // units.ts can't import the page arrays (it feeds the boot-loaded completion
  // store, which must stay React-free) — this keeps the two counts honest.
  throw new Error(
    `Patchbay page count drifted: PAGES has ${PAGES.length}, units.ts says ${PATCHBAY_PAGE_COUNT}. ` +
      'Update PATCHBAY_PAGE_COUNT in src/screens/lab/patchbay/units.ts.',
  );
}

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
      subtitle="Top is the source. Bottom is the destination. A normal is the path that exists when you do nothing — and patching changes that path."
      pages={PAGES}
      onPageDone={onPageDone}
    />
  );
}
