/**
 * PagedLab's appended understanding-check page.
 *
 * ⛔ WHY A SOURCE GUARD. Both defects below are LATENT: `UNDERSTANDING_CHECKS`
 * is deliberately empty, so `understandingFor()` returns nothing and the check
 * page is never appended. They fire the day Comp B's first set of questions
 * lands — across all 33 labs that render PagedLab, at once, in a release where
 * nobody was looking at PagedLab. A test that fails now is the only thing that
 * will still be true then.
 *
 * Nothing here can be asserted by rendering: the trigger is content that does
 * not exist yet. So this checks the two lines that have to stay right, the
 * same idiom as test/noRawAlert.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SRC = readFileSync('src/screens/lab/kit/PagedLab.tsx', 'utf8');

test('the navigation units (CONTENTS) and the end screen iterate pagesWithCheck, not pages', () => {
  // The strip's readout says "n / pagesWithCheck.length". If the CONTENTS
  // units or the what's-left rows iterate the original array instead, the
  // appended check has no row: unreachable except by pressing NEXT off the
  // page before it, while the readout claims it is there.
  const badUnits = /const (navUnits|endUnits)[^=]*= pages\.map\(/.test(SRC);
  assert.equal(badUnits, false, 'the units iterate `pages` — they must iterate `pagesWithCheck`');

  assert.match(SRC, /const navUnits: LabNavUnit\[\] = pagesWithCheck\.map\(\(p, i\) =>/, 'CONTENTS must iterate pagesWithCheck');
  assert.match(SRC, /const endUnits: LabEndUnit\[\] = pagesWithCheck\.map\(\(p, i\) =>/, 'the end screen must iterate pagesWithCheck');
  // …and the check row is typed as the CHECK row in both.
  assert.match(SRC, /kind: check && i === pages\.length \? 'check' : 'unit'/);
});

test('the shell navigates through the shared strip only (kit/LabNavBar)', () => {
  assert.match(SRC, /import \{ LabHeader, LabNavBar, LabNavProvider, LabNextButton, useLabNav, type LabNavUnit \} from '\.\/LabNavBar';/);
  assert.match(SRC, /<LabHeader /);
  assert.match(SRC, /<LabNavBar nav=\{nav\} \/>/);
  assert.match(SRC, /<LabNextButton nav=\{nav\} \/>/, 'the in-flow NEXT sits at the end of the reading');
  for (const word of ['‹ BACK', 'CONTINUE ›', 'COMPLETE ✓', 'SKIP AHEAD', 'styles.footer', 'styles.dots', 'listOpen']) {
    assert.equal(SRC.includes(word), false, `PagedLab still carries "${word}"`);
  }
});

test('the check page does not fire onPageDone', () => {
  // Every caller implements onPageDone as markLabUnit(lab, 'p' + (index + 1))
  // against a unit list that ends at its real page count. Firing it for the
  // appended check banks credit under a `p17` / `p24` that no lab registers.
  // The check page marks its own UNDERSTANDING_UNIT, which is the real unit.
  assert.ok(
    /if \(fresh && page < pages\.length\) onPageDone\?\.\(page\)/.test(SRC),
    'markDone must guard onPageDone with `page < pages.length` so the appended check page is excluded',
  );
});

test('the check page still banks its own unit', () => {
  assert.ok(SRC.includes('markLabUnit(labId as never, UNDERSTANDING_UNIT)'), 'the check page must mark UNDERSTANDING_UNIT');
  assert.ok(
    SRC.includes('registerLabUnits(labId as never, [UNDERSTANDING_UNIT])'),
    'the check page must register its unit before marking it, or the total is wrong',
  );
});
