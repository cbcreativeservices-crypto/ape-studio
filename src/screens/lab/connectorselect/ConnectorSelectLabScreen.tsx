/**
 * Audio Connectors & Cable Selection Lab (owner brief 2026-09-11):
 * seven stations + misconceptions + a randomized final — recognize the
 * connector, separate it from the cable and the signal, select correctly,
 * refuse unsafe connections, and diagnose basic faults.
 *
 * Central lesson (brief, verbatim): "A connector’s shape does not
 * determine the signal, cable construction, level, or protocol."
 *
 * Every connector fact renders from the Cable & Connector Fundamentals
 * Lab's VERIFIED records; the lab's own data layer is validated + pinned
 * by test/connectorSelect.test.ts.
 */
import { useCallback, useEffect } from 'react';
import { PagedLab } from '../kit/PagedLab';
import { CONNECTOR_PAGES_A } from './pagesA';
import { CONNECTOR_PAGES_B } from './pagesB';
import { CONNECTOR_PAGES_C } from './pagesC';
import { CONNECTOR_PAGES_D } from './pagesD';
import { markLabUnit, registerLabUnits } from '../../../features/lab/labCompletion';
import { loadPagedProgress } from '../../../features/lab/pagedProgress';
import { CONNECTOR_SELECT_LAB_KEY, CONNECTOR_SELECT_PAGE_COUNT, CONNECTOR_SELECT_UNITS } from './units';

const PAGES = [...CONNECTOR_PAGES_A, ...CONNECTOR_PAGES_B, ...CONNECTOR_PAGES_C, ...CONNECTOR_PAGES_D];

if (__DEV__ && PAGES.length !== CONNECTOR_SELECT_PAGE_COUNT) {
  // units.ts feeds the boot-loaded completion store (React-free), so it
  // can't import the page arrays — this keeps the two counts honest.
  throw new Error(
    `Connector lab page count drifted: PAGES has ${PAGES.length}, units.ts says ${CONNECTOR_SELECT_PAGE_COUNT}. ` +
      'Update CONNECTOR_SELECT_PAGE_COUNT in src/screens/lab/connectorselect/units.ts.',
  );
}

export function ConnectorSelectLabScreen() {
  // R6c lab-credit bridge (patchbay pattern): register the unit set, then
  // back-fill from pagedProgress so a device that already finished pages
  // banks credit without re-walking. markLabUnit is idempotent and
  // preview-guarded, so replaying every visit is safe.
  useEffect(() => {
    registerLabUnits(CONNECTOR_SELECT_LAB_KEY, CONNECTOR_SELECT_UNITS);
    let alive = true;
    void loadPagedProgress('connector-select').then((p) => {
      if (!alive) return;
      for (const i of p.completed) markLabUnit(CONNECTOR_SELECT_LAB_KEY, `p${i + 1}`);
    });
    return () => {
      alive = false;
    };
  }, []);

  const onPageDone = useCallback((index: number) => {
    markLabUnit(CONNECTOR_SELECT_LAB_KEY, `p${index + 1}`);
  }, []);

  return (
    <PagedLab
      labId="connector-select"
      title="Audio Connectors & Cable Selection"
      subtitle="A connector’s shape does not determine the signal, cable construction, level, or protocol — ask what the equipment expects, what the cable is built as, and whether the connection is safe."
      pages={PAGES}
      onPageDone={onPageDone}
    />
  );
}
