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
// Screen Guide (owner 2026-10-31): one "this page, explained" guide per page,
// plus the what's-left screen's own (endGuide, titled WHERE YOU ARE).
import { CONNECTOR_SELECT_END_GUIDE, connectorSelectPageGuide } from './connectorSelectScreenGuides';

const PAGES = [...CONNECTOR_PAGES_A, ...CONNECTOR_PAGES_B, ...CONNECTOR_PAGES_C, ...CONNECTOR_PAGES_D];

if (__DEV__ && PAGES.length !== CONNECTOR_SELECT_PAGE_COUNT) {
  // units.ts feeds the boot-loaded completion store (React-free), so it
  // can't import the page arrays — this keeps the two counts honest.
  throw new Error(
    `Connector lab page count drifted: PAGES has ${PAGES.length}, units.ts says ${CONNECTOR_SELECT_PAGE_COUNT}. ` +
      'Update CONNECTOR_SELECT_PAGE_COUNT in src/screens/lab/connectorselect/units.ts.',
  );
}

/** Each unfinished row's own "what is missing" line (phase 2 end screen,
 *  2026-11-14; SHARED_API S2 §4), keyed by the 0-based page, in the words of
 *  that page's own goal pills. */
const PAGE_DETAIL: Readonly<Record<number, string>> = {
  0: 'Still to do: tap all 8 cable parts and open all 4 questions.',
  1: 'Still to do: view both jobs of the plug and pass the check.',
  2: 'Still to do: open 4 connector cards on the analog bench.',
  3: 'Still to do: open 3 connector cards on the loudspeaker bench.',
  4: 'Still to do: open four cards, the MIDI card among them.',
  5: 'Still to do: match every job on 3 connector families.',
  6: 'Still to do: declare and solve all 3 connections.',
  7: 'Still to do: view all 8 constructions and pass the check.',
  8: 'Still to do: connect every stage system on the page correctly.',
  9: 'Still to do: connect every monitor and power system on the page correctly.',
  10: 'Still to do: connect every source and data system on the page correctly.',
  11: 'Still to do: diagnose all 4 cables on the tester.',
  12: 'Still to do: diagnose every cable in the fault finder.',
  13: 'Still to do: acknowledge all 9 rules (I WILL WORK THIS WAY).',
  14: 'Still to do: settle all 9 myths.',
  15: 'Still to do: pass the job, with every safety call right.',
};
const pageDetail = (i: number): string | undefined => PAGE_DETAIL[i];

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
      creditLabKey={CONNECTOR_SELECT_LAB_KEY}
      pageDetail={pageDetail}
      handsOnDetail="A page counts once all its goal pills are lit; NEXT moves on without counting it."
      pageGuide={connectorSelectPageGuide}
      endGuide={CONNECTOR_SELECT_END_GUIDE}
      // ACCURACY CHIP RULE (owner 2026-10-31): the measurement note stays only
      // on live-mic tools and labs showing real-world measurement numbers.
      // This is a CONCEPT lab (identification, selection, a simulated
      // continuity tester — nothing measured), so the note leaves every page
      // and the header ⓘ guide key stands in its place.
      accuracy={false}
    />
  );
}
