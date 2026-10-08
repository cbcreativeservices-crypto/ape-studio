import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { MIXING_GUIDE_INDEX } from '../src/screens/lab/mixingGuides/data/index.ts';
import { COUNTRY_LABEL, STYLE_COUNTRIES, countryList } from '../src/screens/lab/mixingGuides/data/styleCountries.ts';
import { COUNTRIES, OUTLINE_D, WORLD_VIEWBOX } from '../src/screens/lab/mixingGuides/data/worldMap.ts';

// The Mixing Guides world map (owner 2026-10-07/08): pinned above the 50 styles;
// a hover, a finger on a card, or the card nearest the top while dragging fills
// that style's countries.
describe('Mixing Guides world map', () => {
  it('every one of the 50 styles has at least one country, and every country has a shape and a label', () => {
    assert.equal(MIXING_GUIDE_INDEX.length, 50);
    for (const g of MIXING_GUIDE_INDEX) {
      const codes = STYLE_COUNTRIES[g.id];
      assert.ok(codes && codes.length > 0, `${g.id} has no countries`);
      for (const c of codes) {
        assert.ok(COUNTRIES[c], `${g.id}: no shape for ${c}`);
        assert.ok(COUNTRY_LABEL[c], `${g.id}: no label for ${c}`);
        assert.match(COUNTRIES[c].d, /^m/, `${c} path starts with a move`);
      }
    }
    assert.deepEqual(Object.keys(STYLE_COUNTRIES).sort(), MIXING_GUIDE_INDEX.map((g) => g.id).sort(), 'no stray style ids');
  });

  it('the frame is the owner outline’s, and Australia is the mainland (not the merged reef islands)', () => {
    assert.equal(WORLD_VIEWBOX, '0 0 1117.51 544.04');
    assert.ok(OUTLINE_D.length > 50_000, 'the owner outline is present');
    assert.equal(COUNTRIES['036'].name, 'Australia');
    assert.equal(COUNTRIES['036'].small, false);
    for (const tiny of ['388', '591', '630', '422', '344']) assert.equal(COUNTRIES[tiny].small, true, `${tiny} gets a locator ring`);
  });

  it('the caption names the countries in words', () => {
    assert.equal(countryList('pop'), 'United States and United Kingdom');
    assert.equal(countryList('reggae'), 'Jamaica');
    assert.equal(countryList('classical-orchestral'), 'Austria, Germany, France and Italy');
  });

  it('the hub pins the map above the list and lights it from hover, touch and drag', () => {
    const hub = readFileSync(new URL('../src/screens/lab/mixingGuides/MixingGuidesHubScreen.tsx', import.meta.url), 'utf8');
    assert.ok(hub.indexOf('<GuideWorldMap') < hub.indexOf('<ScrollView'), 'map sits above (outside) the scrolling list');
    assert.match(hub, /onTouchStart=\{\(\) => onPoint\(g\.id\)\}/);
    assert.match(hub, /onHoverIn=\{\(\) => onPoint\(g\.id\)\}/);
    assert.match(hub, /onScrollBeginDrag=\{onDragStart\}/);
    // Owner 2026-10-08: a swipe follows the card under the finger; a deliberate
    // tap selects — the countries flash 1 s (was 1.5 s), then the guide opens.
    // Owner 2026-10-08 (later): ONLY the pressed card is lit — held for the whole
    // drag (no switching as cards slide under the finger), cleared on lift and on return.
    assert.match(hub, /onTouchStart=\{onFinger\}/, 'the card the finger lands on is selected');
    assert.doesNotMatch(hub, /onTouchMove=\{onFinger\}/, 'a scroll never switches to another card');
    assert.match(hub, /onTouchEnd=\{onFingerEnd\}/, 'lifting the finger clears the map (or opens a still tap)');
    // Owner 2026-10-08: taps were sometimes ignored (a few px of movement made the
    // list cancel the press) — the list recognises a still tap itself, and a
    // repeat for the same card within 450 ms counts once.
    assert.match(hub, /Math\.abs\(pageX - d\.x\) < 10 && Math\.abs\(pageY - d\.y\) < 10 && Date\.now\(\) - d\.t < 700/);
    assert.match(hub, /lastSelect\.current\.id === id && now - lastSelect\.current\.t < 450/);
    assert.match(hub, /onScrollEndDrag=\{onFingerUp\}/);
    assert.doesNotMatch(hub, /onTouchCancel=/, 'Android cancels on scroll — never clear on cancel');
    assert.match(hub, /Coming back to the list: no country is lit/);
    assert.match(hub, /onOpen=\{selectGuide\}/, 'a tap selects: flash, then open');
    assert.match(hub, /SELECT_FLASH_MS = 1000/, 'the flash lasts 1 s');
    // (hunt 2026-10-08: a second tap on the flashing style also opens at once.)
    assert.match(hub, /if \(mapHidden \|\| flashRef\.current === id\) \{ openNow\(id\); return; \}/, 'map hidden: opens at once');
    const map = readFileSync(new URL('../src/screens/lab/mixingGuides/GuideWorldMap.tsx', import.meta.url), 'utf8');
    assert.match(map, /useDecorativeMotion\(\)/, 'reduced motion swaps instantly');
    assert.match(map, /accessibilityLiveRegion="polite"/, 'the caption is read');
  });
});
