/**
 * BUILD 36 FREEZE (TestFlight, iOS 26.6.2, 2026-10-09): ten "Frozen Screen" /
 * "Can't get back to home. Must restart app" reports in one evening, on the
 * Study Dashboard and on the Program / Certificate progress pages.
 *
 * Root cause: a DimModal nested inside another (the credential popup inside the
 * Certificates / Programs chooser, and inside Home's Study Area EXPLORE sheet)
 * is presented by UIKit FROM the outer one. Closing the outer while the inner
 * was still up — STUDY NOW / VIEW PROGRESS / GO TO MY ENROLLMENTS close both in
 * one tap, a one-credential EXPLORE closed the sheet first — makes React
 * Native call `[outerVC dismissViewControllerAnimated:]`, which UIKit applies
 * to the CHILD. The outer, now empty, transparent controller stays over the
 * whole app and swallows every touch. Android closes each Modal on its own.
 *
 * Fix: DimModal holds an outer Modal presented (iOS) until every Modal nested
 * in it has gone, then closes it; a popup button that LEAVES the screen waits
 * for the Modals with useAfterModalsClose.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import ts from 'typescript';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
const DIM = 'src/components/DimModal.tsx';

type Kid = { id: number; parent: number; closingSince: number | null };
async function pure() {
  const src = read(DIM);
  const block = src.slice(src.indexOf('// <nestedClose>'), src.indexOf('// </nestedClose>'));
  assert.ok(block.length > 200, 'the <nestedClose> block exists');
  const js = ts.transpileModule(block, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return (await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)) as {
    nestedKidState: (kids: Kid[], parent: number) => 'open' | 'closing' | 'none';
    holdForNested: (want: boolean, shown: boolean, kid: 'open' | 'closing' | 'none') => boolean;
    modalsSettleWaitMs: (open: number, pending: number, hold: number) => number;
    NESTED_CLOSE_CAP_MS: number;
  };
}

/** The two parts of a function body between `const <name>` and the next `const`. */
function handler(src: string, name: string): string {
  const at = src.indexOf(`const ${name}`);
  assert.ok(at >= 0, `${name} exists`);
  const end = src.indexOf('\n  const ', at + 10);
  return src.slice(at, end > 0 ? end : undefined);
}

describe('a Modal never closes while a Modal inside it is still up (build 36 freeze)', () => {
  it('nested state: open beats closing, other parents are ignored', async () => {
    const { nestedKidState } = await pure();
    assert.equal(nestedKidState([], 1), 'none');
    assert.equal(nestedKidState([{ id: 2, parent: 1, closingSince: null }], 1), 'open');
    assert.equal(nestedKidState([{ id: 2, parent: 1, closingSince: 5 }], 1), 'closing');
    assert.equal(nestedKidState([{ id: 2, parent: 1, closingSince: 5 }, { id: 3, parent: 1, closingSince: null }], 1), 'open');
    assert.equal(nestedKidState([{ id: 2, parent: 9, closingSince: null }], 1), 'none');
  });

  it('the outer is held only while ON SCREEN and a nested one has not gone', async () => {
    const { holdForNested } = await pure();
    // STUDY NOW: both asked to close in one tap — the inner is still registered.
    assert.equal(holdForNested(false, true, 'open'), true);
    // The inner is animating away.
    assert.equal(holdForNested(false, true, 'closing'), true);
    // The inner has gone (iOS onDismiss / the cap): the outer closes now.
    assert.equal(holdForNested(false, true, 'none'), false);
    // Never re-opens a Modal that is already closed, never interferes with an open one.
    assert.equal(holdForNested(false, false, 'open'), false);
    assert.equal(holdForNested(true, true, 'open'), false);
  });

  it('afterModalsClose waits for every Modal and the dismissal window', async () => {
    const { modalsSettleWaitMs, NESTED_CLOSE_CAP_MS } = await pure();
    assert.equal(modalsSettleWaitMs(1, 0, 0), -1);
    assert.equal(modalsSettleWaitMs(0, 1, 0), -1);
    assert.equal(modalsSettleWaitMs(0, 0, 300), 300);
    assert.equal(modalsSettleWaitMs(0, 0, 0), 0);
    assert.ok(NESTED_CLOSE_CAP_MS >= 500 && NESTED_CLOSE_CAP_MS <= 1500, 'cap covers a UIKit dismissal, never strands');
  });

  it('DimModal wires the hold: iOS only, parent id by context, native visible overridden, onDismiss releases', () => {
    const src = read(DIM);
    assert.match(src, /const NESTED_HOLD = Platform\.OS === 'ios';/);
    assert.match(src, /const ParentHost = createContext\(0\);/);
    assert.match(src, /<ParentHost\.Provider value=\{id\}>/);
    // `visible` must come AFTER the spread, or the owner's false wins.
    assert.match(src, /\{\.\.\.rest\}\s*\n\s*visible=\{visible\}/);
    assert.match(src, /onDismiss=\{\(\) => \{[\s\S]{0,200}kidGone\(id\);[\s\S]{0,40}onDismiss\?\.\(\);/);
    assert.match(src, /const visible = !!rest\.visible \|\| \(NESTED_HOLD && holdForNested\(!!rest\.visible, shownRef\.current, kidState\)\);/);
    // A held parent stays an overlay host until it really closes.
    assert.match(src, /const registered = hostsOverlays && visible;/);
  });

  it('Awards chooser: STUDY NOW and VIEW PROGRESS leave only after the Modals have gone', () => {
    const src = read('src/screens/awards/AwardsScreen.tsx');
    assert.match(src, /const afterClose = useAfterModalsClose\(\);/);
    const study = handler(src, 'studyFromDetail');
    assert.match(study, /setDetail\(null\);\s*\n\s*setPicker\(null\);/);
    assert.match(study, /afterClose\(\(\) =>\s*\n?\s*\(navigation as unknown as \{ popTo/);
    const progress = handler(src, 'progressFromDetail');
    assert.match(progress, /afterClose\(\(\) =>\s*\n?\s*navigation\.navigate\('AwardProgress'/);
  });

  it('Home Study Area EXPLORE: every way out closes the popup with the sheet; onward doors wait', () => {
    const src = read('src/screens/courses/StudyAreaExplore.tsx');
    assert.match(src, /const closeAll = \(\) => \{\s*\n\s*setDetail\(null\);\s*\n\s*onClose\(\);/);
    assert.match(src, /const closeDetail = \(\) => \(single \? closeAll\(\) : setDetail\(null\)\);/);
    for (const call of ['onProgress(c)', 'onStudy(c)', 'onEnrollments()']) {
      assert.ok(src.includes(`afterClose(() => ${call})`), `${call} waits for the Modals`);
    }
    // No bare "close the sheet, then navigate" left in the popup handlers.
    assert.doesNotMatch(src, /onClose\(\);\s*\n\s*on(Progress|Study|Enrollments)\(/);
  });

  it('Dashboard: the OVERALL TOPIC PROGRESS label holds at the brand cap (it broke mid-word at Larger Text)', () => {
    const src = read('src/screens/dashboard/DashboardScreen.tsx');
    assert.match(src, /<Text style=\{styles\.pctLabel\} maxFontSizeMultiplier=\{BRAND_MAX_FONT_SCALE\}>OVERALL TOPIC PROGRESS<\/Text>/);
  });
});
