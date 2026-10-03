/**
 * Toddler hunt 6 (2026-10-03) — TOOLS + AUDIO area.
 *
 *  1. Frequency Counter: this tool skips ToolInfo, so its LEARN and DEMO keys
 *     (two DIFFERENT routes, ToolLearn and ToolDemo) live on its mode list —
 *     with no latch. RN7's StackRouter only folds a second navigate into the
 *     FOCUSED route of the same name, so two fingers on LEARN and DEMO pushed
 *     both screens. ToolInfo got its openOnce for exactly this (toddler
 *     evening 2026-10-02); this sibling was missed.
 *  2. Concept module "SEE IT IN THE TOOLS": the rows open two different routes
 *     (FrequencyCounter for the Hz counter, ToolInfo for the rest), so two
 *     fingers on the last module's list stacked the Frequency Counter and a
 *     tool's info screen. Same openOnce rule.
 *
 * Source pins — RN screens cannot load under node. R2: both fail against
 * HEAD 89f2dd18.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p: string) => readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

const LATCH = /const openOnce = \(go: \(\) => void\) => \{\n\s+const now = Date\.now\(\);\n\s+if \(now - lastOpenRef\.current < 700\) return;/;

test('1. Frequency Counter: LEARN and DEMO share one open-per-navigation latch', () => {
  const src = read('src/screens/tools/FrequencyCounterScreen.tsx');
  assert.match(src, LATCH);
  assert.match(src, /onLearn=\{\(\) => openOnce\(\(\) => navigation\.navigate\('ToolLearn'/);
  assert.match(src, /onDemo=\{\(\) => openOnce\(\(\) => navigation\.navigate\('ToolDemo'/);
  assert.ok(!/on(Learn|Demo)=\{\(\) => navigation\.navigate\(/.test(src), 'a bare navigate skips the latch');
});

test('2. Concept module: the tool rows (two different routes) share one latch', () => {
  const src = read('src/screens/tools/ConceptModuleScreen.tsx');
  assert.match(src, LATCH);
  const rows = src.slice(src.indexOf('SEE IT IN THE TOOLS'));
  assert.match(rows, /onPress=\{\(\) =>[\s\S]*?openOnce\(\(\) =>\s*k === 'hzcounter'\s*\? navigation\.navigate\('FrequencyCounter'\)\s*: navigation\.navigate\('ToolInfo'/);
  assert.ok(!/:\s*navigation\.navigate\('ToolInfo', \{ toolKey: k \}\)\s*\n\s*\}/.test(rows), 'the row navigates outside the latch');
});
