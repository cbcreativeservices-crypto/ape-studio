import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { dockShort } from '../src/screens/lab/miking/engine/rack/dockWords.ts';

// Chaos-toddler + timing hunt 2026-10-08 (docs/bughunt/TODDLER_TIMING_2026_10_08.md):
// Miking Labs 6–7, the Mixing Guides world map, the "bring in a pro" note.

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('toddler/timing 2026-10-08 — Mixing Guides hub', () => {
  const hub = read('src/screens/lab/mixingGuides/MixingGuidesHubScreen.tsx');

  it('T-1: the tile callbacks never depend on the flash (a tap re-rendered all 50 tiles)', () => {
    assert.match(hub, /const onTilePoint = useCallback\([^\n]*flashRef\.current[^\n]*\}, \[\]\);/);
    assert.match(hub, /const onTileHoverOut = useCallback\([^\n]*flashRef\.current[^\n]*, \[\]\);/);
    assert.doesNotMatch(hub, /\[flashId\]|flashId, shownIds/, 'no callback lists flashId as a dependency');
    // The ref and the state move together.
    assert.match(hub, /const setFlash = useCallback\(\(id: string \| null\) => \{ flashRef\.current = id; setFlashId\(id\); \}, \[\]\);/);
  });

  it('T-2: a second tap on the flashing style opens it now (it used to restart the 1.5 s)', () => {
    assert.match(hub, /if \(mapHidden \|\| flashRef\.current === id\) \{ openNow\(id\); return; \}/);
    assert.match(hub, /openTimer\.current = setTimeout\(\(\) => openNow\(id\), SELECT_FLASH_MS\);/);
    // openNow cancels the timer and ends the flash before navigating.
    const body = hub.slice(hub.indexOf('const openNow'), hub.indexOf('const selectGuide'));
    assert.ok(body.indexOf('clearTimeout') < body.indexOf('openGuide(id)'));
    assert.match(body, /setFlash\(null\)/);
  });

  it('T-3: hiding the map mid-flash opens the chosen guide at once', () => {
    assert.match(hub, /onHide=\{hideMap\}/);
    assert.match(hub, /const hideMap = useCallback\(\(\) => \{\s*setMapHidden\(true\);\s*if \(flashRef\.current\) openNow\(flashRef\.current\);/);
  });

  it('T-5: the map caption is not held to the (small, landscape) map width', () => {
    const map = read('src/screens/lab/mixingGuides/GuideWorldMap.tsx');
    assert.match(map, /const captionW = Math\.max\(width, Math\.min\(winW - 32, 560\)\);/);
    assert.match(map, /styles\.captionRow, \{ width: captionW \}/);
  });
});

describe('toddler/timing 2026-10-08 — Miking Labs 6–7 dock words', () => {
  it('T-4: the Lab 6–7 setup names cut on the setup key at 390 wide get a short form', () => {
    // Measured in the web preview at 390×844 (each setup through `&variant=`):
    // these ten were ellipsized on the dock ("WALKING P…"); ≤ 10 characters fit.
    const CUT: [string, string][] = [
      ['f08Passby/geometry.ts', 'WALKING PASS'],
      ['f08Passby/geometry.ts', 'VEHICLE · PAPER PLAN'],
      ['f01Footsteps/geometry.ts', 'HOLLOW WOOD'],
      ['f07Wildlife/geometry.ts', 'FAR AND LOW'],
      ['f13RoomAcoustics/geometry.ts', 'TEST SOURCE · ROOM ONLY'],
      ['f13RoomAcoustics/geometry.ts', 'INSTALLED PA · SYSTEM + ROOM'],
      ['f14SystemMeasurement/geometry.ts', 'VENUE · MAINS, SUB AND FILL'],
      ['f14SystemMeasurement/geometry.ts', 'STUDIO MONITORS'],
      ['b09Commentators/geometry.ts', 'QUIET BOOTH'],
      ['b10Sideline/geometry.ts', 'TWO HANDHELDS'],
    ];
    for (const [file, label] of CUT) {
      const src = read(`src/screens/lab/miking/lessons/${file}`);
      assert.ok(src.includes(`label: '${label}', blurb`), `${file} still names the setup ${label}`);
      const short = dockShort(label);
      assert.ok(short.length <= 9 && short !== label, `${label} → ${short}`);
      // Distinct from every other setup name in the same lesson.
      const siblings = [...src.matchAll(/\{ id: '[A-Za-z0-9]+', label: '([^']+)', blurb/g)].map((m) => m[1]).filter((l) => l !== label);
      for (const o of siblings) assert.notEqual(dockShort(o), short, `${label} and ${o} read the same on the key`);
    }
  });
});
