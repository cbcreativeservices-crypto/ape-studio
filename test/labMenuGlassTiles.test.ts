/**
 * Owner 2026-09-30: both lab menus use the Audio Tools / calculator glass tile
 * layout — a tile per lab with a subtitle, categories kept as clear headings.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const s = readFileSync('src/screens/lab/EarLabScreen.tsx', 'utf8');

test('each category heading sits above a glass panel of lab tiles', () => {
  assert.match(s, /<CategoryLabel cat=\{cat\} \/>\s*<GlassPanel/);
  assert.match(s, /<GlassTile[\s\S]{0,400}onPress=\{\(\) => openLeaf\(leaf, sec\.key\)\}/);
  assert.match(s, /<Text style=\{styles\.tileSub\} numberOfLines=\{3\}>\{leaf\.blurb\}<\/Text>/);
  assert.match(s, /<GlassTile[\s\S]{0,300}onPress=\{\(\) => openHub\(cat\)\}/);
});

test('no accordion rows remain in the menu render', () => {
  assert.doesNotMatch(s, /<LabRow\b/);
  assert.doesNotMatch(s, /setExpandedKey/);
});
