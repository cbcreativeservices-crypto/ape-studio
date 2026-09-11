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
 * is pinned by test/patchbayEngine.test.ts. ALL COPY NEW — owner ratification
 * pending (docs/APE_PATCHBAY_LAB_COPY_2026_09_10.md).
 */
import { PagedLab } from '../kit/PagedLab';
import { PATCHBAY_PAGES_A } from './pagesA';
import { PATCHBAY_PAGES_B } from './pagesB';
import { PATCHBAY_PAGES_C } from './pagesC';
import { PATCHBAY_PAGES_D } from './pagesD';

const PAGES = [...PATCHBAY_PAGES_A, ...PATCHBAY_PAGES_B, ...PATCHBAY_PAGES_C, ...PATCHBAY_PAGES_D];

export function PatchbayLabScreen() {
  return (
    <PagedLab
      labId="patchbay"
      title="Patchbay Signal Flow & Normalling"
      subtitle="Top is the source. Bottom is the destination. A normal is the path that exists when you do nothing — and patching changes that path."
      pages={PAGES}
    />
  );
}
