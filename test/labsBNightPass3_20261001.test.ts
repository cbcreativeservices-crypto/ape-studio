/**
 * Labs B (amp · tuning · ear · room design · production · mixing) — night
 * bug pass 3, 2026-10-01. Source guards; the reasoning sits in the comment
 * beside each fix in the source.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('mixing playback: the armed replay survives a fader drag (replayIdRef)', () => {
  const s = read('src/screens/lab/mixing/kit.tsx');
  assert.match(s, /const again = activeRef\.current \?\? pendingRef\.current \?\? replayIdRef\.current;\s*replayIdRef\.current = again;/);
  // Cleared when the timer fires…
  assert.match(s, /setTimeout\(\(\) => \{\s*replayTimerRef\.current = null;\s*replayIdRef\.current = null;/);
  // …and cancelled by a ▶ press and by stop/mute/close.
  assert.match(s, /\(id: string\) => \{\s*cancelReplay\(\);/);
  assert.match(s, /const stopAll = useCallback\(\(\) => \{\s*cancelReplay\(\);/);
});

test('mixing playback: a failed render returns to idle instead of sticking on RENDERING', () => {
  const s = read('src/screens/lab/mixing/kit.tsx');
  const body = s.slice(s.indexOf('const renderAll = useCallback'), s.indexOf('const renderAllRef = useRef(renderAll)'));
  assert.match(body, /\} catch \{[\s\S]*?if \(current\(\)\) \{\s*idsRef\.current = \[\];\s*pendingRef\.current = null;\s*setPending\(null\);\s*setStatus\('idle'\);/);
});

test('room design: a signed-in PREVIEW is never told "you are not signed in"', () => {
  const host = read('src/screens/lab/roomdesign/RoomDesignLabScreen.tsx');
  assert.match(host, /const preview = resolved && guest && entitlement !== 'anonymous';/);
  for (const f of ['modIntro', 'modExplore', 'modReview']) {
    const s = read(`src/screens/lab/roomdesign/modules/${f}.tsx`);
    assert.match(s, /preview/, `${f} branches on preview`);
    assert.match(s, /part of membership/, `${f} has the preview wording`);
  }
  // The guest wording is still there for a signed-out guest.
  assert.match(read('src/screens/lab/roomdesign/modules/modReview.tsx'), /You are not signed in, so designs are not saved yet\./);
});

test('tuning progress: a failed storage READ is never written back over the chapters', () => {
  const s = read('src/features/tuning/tuningProgress.ts');
  assert.match(s, /\} catch \{\s*storage\.readFailed = true;/);
  assert.match(s, /raw = await AsyncStorage\.getItem\(KEY\);\s*storage\.readFailed = false;/);
  const save = s.slice(s.indexOf('export async function saveTuningProgress'));
  assert.ok(save.indexOf('if (storage.readFailed) return;') >= 0 && save.indexOf('if (storage.readFailed) return;') < save.indexOf('AsyncStorage.setItem'));
});

test('ear progress: a failed storage READ is never written back over the ladders', () => {
  const s = read('src/features/ear/earProgress.ts');
  const load = s.slice(s.indexOf('export async function loadEarProgress'), s.indexOf('export async function saveEarProgress'));
  assert.match(load, /raw = await AsyncStorage\.getItem\(KEY\);\s*\} catch \{[\s\S]*?blockedLoads\.add\(s\);\s*return s;/);
});
