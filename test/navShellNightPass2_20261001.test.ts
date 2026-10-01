/**
 * Night bug pass 2 (2026-10-01) — shared lab shell / nav / dialogs / full
 * screen. Source guards for each fix, pinned to the scenario it came from.
 */
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { it } from 'node:test';

const read = (p: string) => readFileSync(p, 'utf8');

it('LabHeader ‹ and LabEndScreen DONE share ONE leave window (‹ + DONE popped two screens)', () => {
  const bar = read('src/screens/lab/kit/LabNavBar.tsx');
  assert.match(bar, /let lastLeaveAt = 0;\s*export function claimLabLeave\(\): boolean \{/);
  assert.match(bar, /const leave = \(\) => \{\s*if \(!claimLabLeave\(\)\) return;\s*navigation\.goBack\(\);/);
  const end = read('src/screens/lab/kit/LabEndScreen.tsx');
  assert.match(end, /import \{ LabNextButton, claimLabLeave \} from '\.\/LabNavBar';/);
  assert.match(end, /if \(!claimLabLeave\(\)\) return;\s*onDone\(\);/);
  assert.doesNotMatch(end, /doneAt/);
});

it('AppDialog: a queued dialog waits out an afterDialogCloses hand-off (Paywall blocked on iOS)', () => {
  const dlg = read('src/components/AppDialog.tsx');
  assert.match(dlg, /export function holdAppDialogQueue\(ms: number\): void \{/);
  const drain = dlg.slice(dlg.indexOf('function drainQueue'), dlg.indexOf('function resolve'));
  assert.match(drain, /if \(current\) return;/);
  assert.match(drain, /const wait = drainHeldUntil - Date\.now\(\);\s*if \(wait > 0\) \{\s*setTimeout\(drainQueue, wait\);/);
  assert.match(dlg, /if \(!current\) drainQueue\(\);/);
  const confirm = read('src/lib/confirm.ts');
  assert.match(confirm, /holdAppDialogQueue\(HOST_DISMISS_MS \* 2\);\s*setTimeout\(fn, HOST_DISMISS_MS\);/);
});

it('DimModal web box follows a panned visual viewport', () => {
  const src = read('src/components/DimModal.tsx');
  assert.match(src, /const x = Math\.round\(vv\?\.offsetLeft \?\? 0\);/);
  assert.match(src, /vv\?\.addEventListener\('scroll', update\);/);
  assert.match(src, /vv\?\.removeEventListener\('scroll', update\);/);
  assert.match(src, /left: webBox\.x, top: webBox\.y/);
});

it('StageFullScreen: a FIT step a rotation removed lights 1×, not nothing', () => {
  const src = read('src/screens/lab/rack/StageFullScreen.tsx');
  assert.match(src, /const on = s\.key === shownKey;/);
  assert.match(src, /key=\{`v\$\{shownKey\}`\}/);
});

it('gear fader / pot release the page scroll-lock if unmounted mid-drag', () => {
  const src = read('src/screens/lab/kit/gear.tsx');
  assert.match(src, /function useOwnedScrollLock\(\)/);
  assert.match(src, /if \(held\.current\) ctxRef\.current\?\.\(false\);/);
  assert.equal((src.match(/const lockRef = useOwnedScrollLock\(\);/g) ?? []).length, 2);
  assert.doesNotMatch(src, /const lockRef = useRef\(ctxLock\);/);
});

it('PagedLab: a new page never inherits a frozen scroller', () => {
  const src = read('src/screens/lab/kit/PagedLab.tsx');
  assert.match(src, /useEffect\(\(\) => setDragLocked\(false\), \[page, ending\]\);/);
});

it('PagedLab: guest → signed-in mid-visit carries the on-screen marks into the real copy', () => {
  const src = read('src/screens/lab/kit/PagedLab.tsx');
  const load = src.slice(src.indexOf('void loadPagedProgress(labId).then'), src.indexOf('const persist = useCallback'));
  // Read BEFORE loadedAsGuestRef is overwritten, merged like pre-load taps.
  const carriedAt = load.indexOf('const carried = loadedAsGuestRef.current && !guestRef.current');
  const reassignAt = load.indexOf('loadedAsGuestRef.current = guestRef.current;');
  assert.ok(carriedAt > 0 && carriedAt < reassignAt);
  assert.match(load, /for \(const i of carried\) pre\.done\.add\(i\);/);
  // …and every save is still guarded against a guest-loaded copy.
  const saves = src.match(/void savePagedProgress\(/g) ?? [];
  const guarded = src.match(/!loadedAsGuestRef\.current\) void savePagedProgress\(/g) ?? [];
  assert.equal(guarded.length, saves.length);
});
