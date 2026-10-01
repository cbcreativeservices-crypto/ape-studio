/**
 * Night bug pass 1 (2026-10-01) — shared lab shell / nav / full screen.
 * Source guards for each fix, pinned to the scenario it came from.
 */
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { it } from 'node:test';

const read = (p: string) => readFileSync(p, 'utf8');

it('LabNavBar: Android BACK closes CONTENTS only while the lab is the focused screen', () => {
  // CONTENTS left open + Help (?) or a paywall pushed on top: BACK closed the
  // hidden list instead of the screen on top.
  const src = read('src/screens/lab/kit/LabNavBar.tsx');
  assert.match(src, /const navCtx = useContext\(NavigationContext\);/);
  assert.match(src, /hardwareBackPress', \(\) => \{\s*if \(navCtx && !navCtx\.isFocused\(\)\) return false;\s*setContentsOpen\(false\);/);
});

it('DockTray: an open tray never eats BACK meant for a screen pushed on top, and does not re-register per render', () => {
  const src = read('src/screens/lab/rack/DockTray.tsx');
  assert.match(src, /if \(navCtx && !navCtx\.isFocused\(\)\) return false;\s*onCloseRef\.current\(\);/);
  // onClose is read from a ref, so the host's fresh closure each render does
  // not re-subscribe (which moved the listener to the top of the BACK stack).
  assert.match(src, /\}, \[open, active, navCtx\]\);/);
});

it('PagedLab: the saved place reloads when the guest/signed-in reading changes', () => {
  const src = read('src/screens/lab/kit/PagedLab.tsx');
  assert.match(src, /const isGuest = resolved && entitlement === 'anonymous';/);
  assert.match(src, /\}, \[labId, pagesWithCheck\.length, resolved, isGuest\]\);/);
});

it('PagedLab: START OVER as a guest never removes the device copy, and leaves the end screen', () => {
  const src = read('src/screens/lab/kit/PagedLab.tsx');
  const reset = src.slice(src.indexOf('const doReset = () =>'), src.indexOf('const confirmReset'));
  assert.match(reset, /const skipStore = guestRef\.current \|\| loadedAsGuestRef\.current;/);
  assert.match(reset, /skipStore \? Promise\.resolve\(\) : resetPagedProgress\(labId\)/);
  assert.match(reset, /setEnding\(false\);/);
});

it('StageFullScreen: the zoom step resets on close too, and the dock fold is re-read on open', () => {
  const src = read('src/screens/lab/rack/StageFullScreen.tsx');
  assert.match(src, /useEffect\(\(\) => \{\s*setStepKey\('1'\);\s*\}, \[visible\]\);/);
  assert.match(src, /if \(visible\) setDockFolded\(dockFoldedCache\);/);
});
