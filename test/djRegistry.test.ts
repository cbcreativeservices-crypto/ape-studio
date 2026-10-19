/**
 * DJ Systems Lab, Stage 2b — the page registry and the OPTIONAL-PATH
 * completion rule (src/screens/lab/dj/pages/registry.ts, kit/labEnd.ts).
 *
 * Pages are numbered by id, not position, so the numbers — and the optional
 * paths 16–18 — read right on a branch without 13–18 and once they arrive.
 * Required completion = every screen but 16–18; an optional page is listed
 * under its own heading on the what's-left screen, never counted, never
 * keeping the lab from LAB COMPLETE; a lab without optional units reads
 * exactly as before.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DJ_COVERS, DJ_OPTIONAL_NUMBERS, isOptionalNo, numberPages, requiredDone } from '../src/screens/lab/dj/pages/registry.ts';
import { endLead, whatsLeft, type LabEndUnit } from '../src/screens/lab/kit/labEnd.ts';

const ROOT = join(import.meta.dirname, '..');

describe('numbering by id', () => {
  const pages = Array.from({ length: 24 }, (_, i) => ({ id: `P${String(i + 1).padStart(2, '0')}` }));
  const p = (n: number) => pages[n - 1];
  it('this branch: 1–12, then 19–24 (declared)', () => {
    const here = [...pages.slice(0, 12), ...pages.slice(18)];
    assert.deepEqual(numberPages(here, new Map([[p(19), 19]])), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 19, 20, 21, 22, 23, 24]);
  });
  it('after the merge: 13–18 slot in and number themselves', () => {
    assert.deepEqual(numberPages(pages, new Map([[p(19), 19]])), Array.from({ length: 24 }, (_, i) => i + 1));
  });
  it('the registry in pages/index declares the number after the gap', () => {
    const idx = readFileSync(join(ROOT, 'src/screens/lab/dj/pages/index.ts'), 'utf8');
    assert.match(idx, /\/\/ 13–18: built on branch dj-lab \(merged later\)/);
    assert.match(idx, /numberPages\(DJ_PAGES, new Map<PageDef, number>\(\[\[P19, 19\]\]\)\)/);
  });
});

describe('the optional equipment paths', () => {
  it('are 16, 17 and 18 — laptop and interfaces, vinyl and phono, digital vinyl', () => {
    assert.deepEqual([...DJ_OPTIONAL_NUMBERS], [16, 17, 18]);
    assert.ok(isOptionalNo(17) && !isOptionalNo(15) && !isOptionalNo(19));
  });
  it('required completion = 1–15 and 19–24', () => {
    const nums = Array.from({ length: 24 }, (_, i) => i + 1);
    const doneAllButOptional = (i: number) => !isOptionalNo(nums[i]);
    assert.equal(requiredDone(nums, doneAllButOptional), true);
    assert.equal(requiredDone(nums, (i) => nums[i] !== 19), false);
    // on this branch (no 13–18) the same rule needs 1–12 and 19–24
    const here = [...nums.slice(0, 12), ...nums.slice(18)];
    assert.equal(requiredDone(here, () => true), true);
  });
  it('what this lab covers: a line for every outline screen', () => {
    for (let n = 1; n <= 24; n++) assert.ok((DJ_COVERS[n] ?? '').length > 20, `screen ${n}`);
  });
  it('the shell passes the rule by outline number, and the lab never blocks', () => {
    const shell = readFileSync(join(ROOT, 'src/screens/lab/dj/DJSystemsLabScreen.tsx'), 'utf8');
    assert.match(shell, /optionalPage=\{optionalPage\}/);
    assert.match(shell, /isOptionalNo\(DJ_PAGE_NO\[i\]/);
  });
});

describe('the what’s-left screen with optional units', () => {
  const units: LabEndUnit[] = [
    { id: '0', label: 'One' },
    { id: '1', label: 'Two (optional)', optional: true },
    { id: '2', label: 'Three' },
  ];
  it('an optional unit not done never holds LAB COMPLETE and is not counted', () => {
    const w = whatsLeft(units, new Set(['0', '2']));
    assert.equal(w.complete, true);
    assert.equal(w.total, 2);
    assert.deepEqual(w.left.map((r) => r.id), []);
    assert.deepEqual(w.optionalLeft.map((r) => r.id), ['1']);
  });
  it('a required unit left still reads as left, numbered in lab order', () => {
    const w = whatsLeft(units, new Set(['0']));
    assert.equal(w.complete, false);
    assert.deepEqual(w.left.map((r) => [r.id, r.num]), [['2', 3]]);
    assert.match(endLead(w, { mode: 'progress', noun: 'page' }), /^1 page of 2 not done yet/);
  });
  it('a lab with no optional units reads exactly as before', () => {
    const plain: LabEndUnit[] = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }];
    const w = whatsLeft(plain, new Set(['a']));
    assert.equal(w.total, 2);
    assert.equal(w.complete, false);
    assert.deepEqual(w.optionalLeft, []);
  });
});
