/**
 * Chaos-toddler hunt 2026-10-07 — Mixing Guides, the member Labs menu tiles,
 * the store-build release gates and the membership gating of every Miking /
 * Mixing route (docs/bughunt/TODDLER_2026_10_07_mixing-menus.md).
 *
 * This file runs WITHOUT EXPO_PUBLIC_MIKING_PREVIEW and without __DEV__ — the
 * state of a store build — so it can prove the tiles are really gone there.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

delete process.env.EXPO_PUBLIC_MIKING_PREVIEW;
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const HUB = read('src/screens/lab/mixingGuides/MixingGuidesHubScreen.tsx');
const GUIDE = read('src/screens/lab/mixingGuides/MixingGuideScreen.tsx');

type Leaf = { name: string; route?: string };
type Cat = { id: string; labs?: Leaf[]; families?: { labs: Leaf[] }[] };
const CAT = (await import('../src/screens/lab/labCatalog.ts')) as unknown as {
  LAB_CATEGORIES: Cat[];
  isMemberOnlyLabRoute: (r: string) => boolean;
  mikingVisible: () => boolean;
  mixingGuidesVisible: () => boolean;
};

describe('store build (no __DEV__, no preview switch): Miking + Mixing are public (owner 2026-10-09, 62 labs)', () => {
  it('both gates are open', () => {
    assert.equal(CAT.mikingVisible(), true);
    assert.equal(CAT.mixingGuidesVisible(), true);
  });
  it('the Miking family tiles and the Mixing Guides tile are in the catalog', () => {
    const routes = CAT.LAB_CATEGORIES.flatMap((c) => [...(c.labs ?? []), ...(c.families ?? []).flatMap((f) => f.labs)]).map((l) => l.route);
    for (const r of ['MikingHub', 'MixingGuides']) assert.ok(routes.includes(r), r);
    const instruments = CAT.LAB_CATEGORIES.find((c) => c.id === 'instruments')!;
    assert.ok((instruments.families ?? []).length > 0, 'the Miking Labs family heading is there');
  });
  it('every Miking / Mixing route is still members-only', () => {
    for (const r of ['MikingHub', 'MikingLesson', 'MixingGuides', 'MixingGuide']) assert.equal(CAT.isMemberOnlyLabRoute(r), true, r);
  });
});

describe('round 1', () => {
  it('R1-1 a members-only preview gets words, not a dead MARK AS READ', () => {
    assert.match(GUIDE, /const inPreview = useLabPreview\(\)\.active;/);
    assert.match(GUIDE, /\) : inPreview \? \(\s*<Text style=\{styles\.previewNote\}>Members-only preview — reading here is not recorded\.<\/Text>/);
  });
  it('R1-2 hub: the 50 tiles stay mounted (memoised, hidden when filtered) and the grid follows the field deferred', () => {
    assert.match(HUB, /const HubTile = memo\(function HubTile/);
    assert.match(HUB, /\{MIXING_GUIDE_INDEX\.map\(\(g\) => \(\s*<HubTile key=\{g\.id\}/);
    assert.doesNotMatch(HUB, /\{shown\.map\(/);
    assert.match(HUB, /useDeferredValue\(query\)/);
  });
  it('R1-3 guide: sections are memoised with a stable toggle', () => {
    assert.match(GUIDE, /const Section = memo\(function Section/);
    assert.match(GUIDE, /const toggle = useCallback\(/);
    assert.match(GUIDE, /onToggle=\{toggle\}/);
  });
});
