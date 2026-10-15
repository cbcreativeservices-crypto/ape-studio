/**
 * Owner rulings 2026-10-14 for the Mixing labs:
 *   #16 a page counts only once its HANDS-ON part is done (its goals at the
 *       foot of the page). NEXT never credits such a page — and never blocks
 *       (labs never block navigation): it still moves on, and the what's-left
 *       screen says plainly why the page is still listed. Banked credit is
 *       never removed.
 *   #17 the Mixing end screen reads CREDITED like every other credit lab.
 * PagedLab and the pages are React — these are source pins on the exact
 * mechanism, plus a walk over every page definition.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

const LABS = {
  beg: ['pagesA', 'pagesB', 'pagesC', 'pagesD'],
  adv: ['pagesAdvA', 'pagesAdvB', 'pagesAdvC', 'pagesAdvD'],
} as const;

describe('#16 every Mixing page is hands-on: it marks ITSELF, NEXT never does', () => {
  for (const [lab, files] of Object.entries(LABS)) {
    it(`${lab}: every PageDef is manualDone, and every page component completes through non-empty goals`, () => {
      let pages = 0;
      for (const f of files) {
        const src = read(`src/screens/lab/mixing/${f}.tsx`);
        const defs = [...src.matchAll(/\{ title: '[^']+', short: '[^']+', Component: (\w+)(, manualDone: true)? \}/g)];
        assert.ok(defs.length > 0, `${f}: no page definitions found`);
        for (const d of defs) {
          pages++;
          assert.ok(d[2], `${f}: ${d[1]} must be manualDone (NEXT must not credit it)`);
          const body = src.slice(src.indexOf(`function ${d[1]}(`));
          const end = body.indexOf('\nfunction ', 10);
          const fn = end > 0 ? body.slice(0, end) : body;
          assert.match(fn, /useVisitGoals\(ctx, goals\)/, `${d[1]}: completes through its goals`);
          assert.match(fn, /const goals = \[\s*\{ label: /, `${d[1]}: has at least one goal`);
        }
      }
      assert.equal(pages, lab === 'beg' ? 16 : 20);
    });
  }
  it('PagedLab: NEXT / FINISH mark only a page that is NOT manualDone, and still advance', () => {
    const shell = read('src/screens/lab/kit/PagedLab.tsx');
    assert.match(shell, /const beforeAdvance = useCallback\(\s*\(from: number\) => \{\s*if \(!pagesWithCheck\[from\]\?\.manualDone\) markDone\(\);\s*\},/);
    // beforeAdvance never returns 'consumed' — navigation is never held.
    const ba = shell.slice(shell.indexOf('const beforeAdvance = useCallback('), shell.indexOf('const nav = useLabNav('));
    assert.doesNotMatch(ba, /consumed/);
  });
  it('a goal-less page can never mark itself on a visit ([].every is true)', () => {
    const kit = read('src/screens/lab/mixing/kit.tsx');
    assert.match(kit, /const all = seen\.current\.length > 0 && seen\.current\.every\(Boolean\);/);
  });
  it('the what’s-left screen says why an un-done hands-on page is still listed', () => {
    const shell = read('src/screens/lab/kit/PagedLab.tsx');
    assert.match(shell, /\{ id: String\(i\), label: p\.title, \.\.\.\(handsOnDetail && p\.manualDone \? \{ detail: handsOnDetail \} : null\) \}/);
    const kit = read('src/screens/lab/mixing/kit.tsx');
    assert.match(kit, /export const HANDS_ON_DETAIL = 'Counts once the goals at the foot of the page are done\. NEXT moves on without counting it\.';/);
    for (const s of ['BeginningMixingLabScreen', 'AdvancedMixingLabScreen']) {
      assert.match(read(`src/screens/lab/mixing/${s}.tsx`), /pageCreditKeys=\{PAGE_KEYS\} handsOnDetail=\{HANDS_ON_DETAIL\} \/>/);
    }
  });
  it('banked credit still reads cleared after START OVER (never removed)', () => {
    const shell = read('src/screens/lab/kit/PagedLab.tsx');
    assert.match(shell, /\(!!pageCreditKeys\[i\] && bankedPageKeys\.has\(pageCreditKeys\[i\]\)\)/);
  });
});

describe('#17 the Mixing end screen reads CREDITED', () => {
  it('a lab with one credit key per page is a CREDIT lab, like creditLabKey labs', () => {
    const shell = read('src/screens/lab/kit/PagedLab.tsx');
    assert.match(shell, /const creditMode: 'credit' \| 'progress' = creditLabKey \|\| pageCreditKeys\.length > 0 \? 'credit' : 'progress';/);
    assert.match(shell, /mode=\{creditMode\}/);
    assert.match(shell, /kind=\{creditMode\}/);
    assert.doesNotMatch(shell, /mode=\{creditLabKey \? 'credit' : 'progress'\}/);
  });
});
