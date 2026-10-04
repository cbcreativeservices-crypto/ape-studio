/**
 * LABS B — hunt 8 (2026-10-03). Receipts.
 *
 * 1. Cymatics Pattern Gallery, EXPORT panel: on a device without the share /
 *    save / print / PDF modules the footer read "SHARE · SAVE need not
 *    available on this device." — a copy pass (ae74ccb1) replaced "the next
 *    app build" but kept the verb, so the line read as "need not" (i.e. "are
 *    not required"), the opposite of what it means. It now reads "… are not
 *    available on this device" ("is" for one).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('Cymatics ExportPanel: the missing-exports line is grammatical ("are/is not available"), never "need not available"', () => {
  const src = read('src/screens/lab/cymatics/ExportPanel.tsx');
  assert.doesNotMatch(src, /'needs?'\s*\}\s*not available/, 'the "need not available" wording is gone');
  assert.match(src, /missing\.length > 1 \? 'are' : 'is'\} not available on this device\./);
});
