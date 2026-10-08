import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

// Owner 2026-10-08: "turning the phone sideways in the new labs is not allowing
// the screen to go landscape". The app locks phones to portrait at boot, so the
// lab full screen (StageFullScreen — every rack and expandable figure) must lift
// the lock while it is up and restore portrait when it closes.
describe('lab full screen turns with the phone', () => {
  const src = readFileSync(new URL('../src/screens/lab/rack/StageFullScreen.tsx', import.meta.url), 'utf8');
  it('lifts the portrait lock while visible (imperative + route option)', () => {
    assert.match(src, /if \(!visible\) return;\s*unlockOrientation\(\);\s*navigation\?\.setOptions\(\{ orientation: 'default' \}\);/);
  });
  it('restores portrait on close and on unmount', () => {
    assert.match(src, /return \(\) => \{\s*lockPortrait\(\);\s*navigation\?\.setOptions\(\{ orientation: restingOrientation\('portrait'\) \}\);/);
  });
  it('works outside a navigator (web previews) — context, not useNavigation', () => {
    assert.match(src, /useContext\(NavigationContext\)/);
    assert.doesNotMatch(src, /useNavigation\(/);
  });
});
