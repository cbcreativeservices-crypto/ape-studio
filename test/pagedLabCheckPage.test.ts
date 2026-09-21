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

test('the dots and the page list iterate pagesWithCheck, not pages', () => {
  // The header counter says "n OF pagesWithCheck.length". If the dots and the
  // list iterate the original array instead, the appended check has no dot and
  // no row: unreachable except by pressing CONTINUE off the page before it,
  // while the header claims it is there.
  const badDots = /\{pages\.map\(\(_, i\) =>/.test(SRC);
  assert.equal(badDots, false, 'the dot row iterates `pages` — it must iterate `pagesWithCheck`');

  const badList = /\{pages\.map\(\(p, i\) => \{/.test(SRC);
  assert.equal(badList, false, 'the page list iterates `pages` — it must iterate `pagesWithCheck`');

  assert.ok(SRC.includes('pagesWithCheck.map((_, i)'), 'the dot row must iterate pagesWithCheck');
  assert.ok(SRC.includes('pagesWithCheck.map((p, i)'), 'the page list must iterate pagesWithCheck');
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
