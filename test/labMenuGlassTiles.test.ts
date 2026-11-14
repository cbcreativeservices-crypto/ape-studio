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
  // Lab fix round 1 (2026-11-14; owner: "Begin fixing all bugs found and do
  // obvious ... fixes as you suggested in the report", quick win 12 and the
  // Labs-menu rows of section 7): a lab tile is its own LeafTile (it reads the
  // lab's ✓ from the credit store), still a GlassTile opened with openLeaf,
  // and it shows the short tileBlurb where the full blurb was cut at 3 lines.
  assert.match(s, /<LeafTile[\s\S]{0,400}onPress=\{\(\) => openLeaf\(leaf, sec\.key\)\}/);
  assert.match(s, /function LeafTile\([\s\S]{0,900}<GlassTile[\s\S]{0,200}onPress=\{onPress\}/);
  assert.match(s, /<Text style=\{styles\.tileSub\} numberOfLines=\{3\}>\{leaf\.tileBlurb \?\? leaf\.blurb\}<\/Text>/);
  assert.match(s, /<GlassTile[\s\S]{0,300}onPress=\{\(\) => openHub\(cat\)\}/);
});

test('no accordion rows remain in the menu render', () => {
  assert.doesNotMatch(s, /<LabRow\b/);
  assert.doesNotMatch(s, /setExpandedKey/);
});
