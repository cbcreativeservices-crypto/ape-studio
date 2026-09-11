/**
 * Patchbay Signal Flow & Normalling Lab (owner brief 2026-09-10) — Phase A:
 * the single vertical pair, thru → normal → full → half, the switching
 * contact, the comparison table, predict-before-patching, and detective
 * mode. Phase B (studio bay, overpatching, processor chain, X-ray depths,
 * phantom safety, design-your-own) lands after the owner's Phase A pass.
 *
 * Every routing claim resolves through engine/patchbay.ts, whose complete
 * truth table (and every authored exercise) is pinned by
 * test/patchbayEngine.test.ts. ALL COPY NEW — owner ratification pending
 * (docs/APE_PATCHBAY_LAB_COPY_2026_09_10.md).
 */
import { PagedLab } from '../kit/PagedLab';
import { PATCHBAY_PAGES_A } from './pagesA';
import { PATCHBAY_PAGES_B } from './pagesB';

const PAGES = [...PATCHBAY_PAGES_A, ...PATCHBAY_PAGES_B];

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
