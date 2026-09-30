/** Owner 2026-09-30: the tile panels (calculators + both lab menus) carry the
 *  Audio Tools hub's aged-metal texture. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('GlassPanel paints the seeded panel texture with per-panel SVG ids', () => {
  const g = readFileSync('src/screens/tools/GlassTile.tsx', 'utf8');
  assert.match(g, /<View style=\{\[styles\.panel, style\]\}>\s*<PanelTexture \/>/);
  assert.match(g, /const rnd = seeded\(0x9e3779b9\);/);
  assert.match(g, /const uid = useId\(\)/);
  for (const part of ['blotches', 'scuffs', 'scratches', 'specks']) assert.match(g, new RegExp(`tex\.${part}\.map`));
});
