/**
 * 2026-09-30 size pass + glass:
 *  - the Home dot row always fits ONE line (two new cards wrapped it on a
 *    375-wide phone and clipped the card captions);
 *  - card captions are one line (letter-spacing tightens to fit);
 *  - the calculator tiles wear the Audio Tools hub's glass hardware.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dotRowFit } from '../src/screens/courses/cardDims.ts';

test('dot row fits one line at every phone width, house size when there is room', () => {
  for (const w of [320, 360, 375, 390, 430, 834, 1032]) {
    for (const n of [20, 26, 30, 34]) {
      const { size, gap } = dotRowFit(n, w);
      assert.ok(n * size + 11 + (n - 1) * gap <= w - 32 || size === 4, `${n} dots @ ${w}`);
    }
  }
  assert.deepEqual(dotRowFit(10, 390), { size: 7, gap: 6 });
});

test('Home captions render through the one-line Eyebrow', () => {
  const s = readFileSync('src/screens/courses/CourseSelectionScreen.tsx', 'utf8');
  // Only the Eyebrow itself renders the caption style.
  assert.equal((s.match(/styles\.cardAboveText/g) ?? []).length, 1);
  assert.match(s, /numberOfLines=\{1\} adjustsFontSizeToFit minimumFontScale=\{0\.8\}/);
});

test('calculator categories and tiles use the hub glass on the hub panel', () => {
  const s = readFileSync('src/screens/lab/calc/CalcLabScreen.tsx', 'utf8');
  assert.equal((s.match(/<GlassTile/g) ?? []).length, 2);
  assert.equal((s.match(/<GlassPanel/g) ?? []).length, 2);
  const g = readFileSync('src/screens/tools/GlassTile.tsx', 'utf8');
  assert.match(g, /HUB_LIGHT\.specular/);
  assert.match(g, /Haptics\.selectionAsync/);
});
