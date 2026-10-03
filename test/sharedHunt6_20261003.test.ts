/**
 * SHARED area, hunt 6 (2026-10-03) — receipts.
 *
 * 1. ShareTermSheet's "use selected" failure path (adding a bookmarks /
 *    custom / recent / related list to a glossary share). Copy pass 4b
 *    (2026-09-20) wrote the notice for a sheet that stayed OPEN: "The terms
 *    you already selected are still here — try adding them again." The
 *    2026-09-22 Android fix then made the path CLOSE the sheet first (a
 *    notice over an open sheet is drawn underneath it) — which drops every
 *    staged term (GlossaryScreen's onClose nulls the payload; reopening
 *    stages only the one term). The notice kept saying they were still there.
 *
 * R2: fails on HEAD 89f2dd18 (the HEAD file put in place, run, restored).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

describe('ShareTermSheet — a failed list add closes the sheet and says so truthfully', () => {
  const s = read('src/components/ShareTermSheet.tsx');
  const start = s.indexOf('const useSelected = () => {');
  assert.ok(start >= 0, 'useSelected not found');
  const body = s.slice(start, s.indexOf('const removeStaged', start));

  it('still closes the sheet before the notice (the Android layering fix stands)', () => {
    const c = body.indexOf('.catch(() => {');
    assert.ok(c >= 0);
    const tail = body.slice(c);
    assert.ok(tail.indexOf('onClose();') >= 0 && tail.indexOf('onClose();') < tail.indexOf('notify('), 'onClose before notify');
  });

  it('never claims the staged terms are "still here" once the sheet is closed', () => {
    const n = body.indexOf("notify(\n          'Some terms weren");
    assert.ok(n >= 0, 'the failure notice');
    const call = body.slice(n, body.indexOf(');', n));
    assert.doesNotMatch(call, /still here/);
    assert.match(call, /share was closed and nothing was sent/);
  });
});
