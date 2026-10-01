/**
 * Night bug pass 3 (2026-10-01) — shared surfaces: PagedLab carry-over,
 * AppDialog hold, DimModal web box, coach marks, exposure check-in.
 * Source guards pinned to the scenario each fix came from.
 */
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { it } from 'node:test';

const read = (p: string) => readFileSync(p, 'utf8');

it('PagedLab: guest marks carry over only for the SAME identity (never across a sign-out / sign-in)', () => {
  const src = read('src/screens/lab/kit/PagedLab.tsx');
  assert.match(src, /supabase\.auth\.onAuthStateChange\(\(_event, session\) => \{/);
  assert.match(src, /else if \(id !== carryIdentityRef\.current\) carryIdentityRef\.current = null;/);
  assert.match(src, /return \(\) => data\.subscription\.unsubscribe\(\);/);
  const load = src.slice(src.indexOf('void loadPagedProgress(labId).then'), src.indexOf('const persist = useCallback'));
  assert.match(
    load,
    /const sameIdentity = carryIdentityRef\.current != null && carryIdentityRef\.current === identityRef\.current;\s*const carried = loadedAsGuestRef\.current && !guestRef\.current && sameIdentity/,
  );
  // The guest load records who was signed in; set AFTER the carry is read.
  const carriedAt = load.indexOf('const carried =');
  const recordAt = load.indexOf('carryIdentityRef.current = guestRef.current ? identityRef.current : null;');
  assert.ok(carriedAt > 0 && recordAt > carriedAt);
});

it('AppDialog: a request during a hand-off hold queues, and a repeat of a queued one is dropped', () => {
  const dlg = read('src/components/AppDialog.tsx');
  const show = dlg.slice(dlg.indexOf('export function showAppDialog'), dlg.indexOf('export function clearAppDialogs'));
  assert.match(show, /if \(\(current && sameDialog\(current, req\)\) \|\| queue\.some\(\(q\) => sameDialog\(q, req\)\)\) return;/);
  assert.match(show, /if \(drainHeldUntil > Date\.now\(\)\) \{\s*queue\.push\(req\);\s*drainQueue\(\);\s*return;/);
  // drainQueue always re-arms itself while held, so the queue always releases.
  assert.match(dlg, /if \(wait > 0\) \{\s*setTimeout\(drainQueue, wait\);\s*return;/);
});

it('DimModal web box: no unwrapped first frame (children mounted twice on first opening)', () => {
  const src = read('src/components/DimModal.tsx');
  assert.match(src, /return active \? \(box \?\? readWebBox\(\)\) : null;/);
});

it('useCoachMark: a retire() during the storage read keeps the hint hidden', () => {
  const src = read('src/lib/coachMark.ts');
  assert.match(src, /if \(opens\.current < MAX_OPENS && !qualified\.current\) setVisible\(true\);/);
});

it('ExposureCheckin: an interrupted slide-out does not clear the check-in that interrupted it', () => {
  const src = read('src/features/audio/ExposureCheckin.tsx');
  assert.match(src, /\.start\(\(\{ finished \}\) => \{\s*if \(finished\) setShow\(null\);\s*\}\);/);
  assert.doesNotMatch(src, /\.start\(\(\) =>\s*setShow\(null\),?\s*\)/);
});
