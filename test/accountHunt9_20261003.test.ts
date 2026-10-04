/**
 * ACCOUNT + COMMERCE — hunt 9 (2026-10-03).
 *
 * 1. PRIVACY. A listed member edits their About-you line, then switches the
 *    Registry listing OFF within the 1.5 s listing-sync debounce. The OFF RPC
 *    goes out at once, but `savePublicProfile` only (re)queues the listing
 *    sync while the profile is listed, so the edit's pending sync — holding
 *    the OLD profile with `showInRegistry: true` — was never cancelled. It
 *    fired 1.5 s later as `set_registry_listing(on: true, …)` and put the page
 *    back up, public, under a switch reading off.
 *
 * 2. EmployerSection (correction to hunt 8's focus reload). The reload runs
 *    whenever the last load failed — including when only the APPLICATION read
 *    failed while the employer was verified and the chips were live. Its
 *    interests read then replaced `picked` mid-save with the server's older
 *    list: the chip just tapped went dark while its write landed, and the next
 *    tap in that row wrote the whole list WITHOUT it (silently dropped on the
 *    server). Once the stored choices have been read, the screen's copy is
 *    the source of truth; a reload only fills them in when they never loaded.
 *
 * 3. Profile's "EVERYTHING THE ACADEMY OFFERS" catalogue was read once, at
 *    mount. Profile is a tab and stays mounted, so a failed read kept
 *    "Couldn’t load the catalogue — check your connection and try again" with
 *    nothing to try again until the app was killed (and the enrolled rows
 *    could not open their earn-path screen, which needs the catalogue ids).
 *    A failed read now re-asks when Profile is focused again.
 *
 * Behaviour where the module loads under Node; source-reading for the React
 * Native screens. R2: each test fails on the HEAD files.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
const LISTING_CALLS: { on: boolean }[] = [];
g.__AH9_AS__ = AS;
g.__AH9_LISTING__ = LISTING_CALLS;

const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__AH9_AS__;
     export default {
       async getItem(k) { return s.has(k) ? s.get(k) : null; },
       async setItem(k, v) { s.set(k, v); },
       async removeItem(k) { s.delete(k); },
       async getAllKeys() { return [...s.keys()]; },
     };`,
  );
const FAKE_SUPABASE =
  'data:text/javascript,' +
  encodeURIComponent(
    `export const supabase = {
       auth: { async getSession() { return { data: { session: { user: { id: 'u1' } } } }; } },
       from() { return { select() { return Promise.resolve({ data: null, error: null }); } }; },
       rpc() { return Promise.resolve({ data: null, error: null }); },
     };`,
  );
const FAKE_PROFILE_API =
  'data:text/javascript,' +
  encodeURIComponent(
    `export async function fetchMyRegistryName() { return null; }
     export async function fetchMyRegistryListing() { return { state: 'none' }; }
     export async function saveMyRegistryName() { return true; }
     export async function setRegistryListing(input) {
       globalThis.__AH9_LISTING__.push({ on: input.on });
       return true;
     }`,
  );

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (specifier.endsWith('lib/supabase')) return { url: FAKE_SUPABASE, shortCircuit: true };
    if (specifier === './api' && context.parentURL?.includes('features/profile/')) return { url: FAKE_PROFILE_API, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const pp = await import('../src/features/profile/publicProfile.ts');

/** The text between `start` and the first `end` after it. */
function between(src: string, start: string, end: string): string {
  const i = src.indexOf(start);
  assert.ok(i >= 0, `missing: ${start}`);
  const j = src.indexOf(end, i + start.length);
  assert.ok(j > i, `missing end after: ${start}`);
  return src.slice(i, j);
}

test('registry: switching the listing OFF cancels a pending bio sync, so the page never goes back up', async () => {
  AS.clear();
  LISTING_CALLS.length = 0;
  pp.resetLocal();
  const listed = { ...pp.EMPTY_PUBLIC_PROFILE, registryName: 'Sam Reyes', bio: 'FOH engineer', showInRegistry: true };
  // A keystroke in the About-you line while listed queues the debounced publish.
  await pp.savePublicProfile({ ...listed, bio: 'FOH + monitors' });
  // …and the switch goes OFF inside the debounce, exactly as ProfileScreen does it.
  const off = { ...listed, bio: 'FOH + monitors', showInRegistry: false };
  assert.equal(await pp.setRegistryVisible(false, off), true);
  await pp.savePublicProfile(off);
  // Past the 1.5 s listing debounce.
  await new Promise((r) => setTimeout(r, 1800));
  assert.deepEqual(
    LISTING_CALLS.map((c) => c.on),
    [false],
    'a stale publish (on: true) went out after the listing was switched off',
  );
  pp.resetLocal();
});

test('employer: a focus reload never replaces choices already read (no read-over of an in-flight chip save)', () => {
  const src = read('src/screens/profile/EmployerSection.tsx');
  const load = between(src, 'const load = useCallback(async () => {', '}, []);');
  // setPicked from the server happens only while the stored choices were never read.
  const at = load.indexOf('setPicked(mine)');
  assert.ok(at > 0, 'the load still applies the stored choices');
  const guard = load.slice(Math.max(0, at - 160), at);
  assert.match(guard, /pickedLoaded\.current/, 'setPicked(mine) is gated on the choices never having been read');
  assert.match(load, /pickedLoaded\.current = true/);
});

test('profile: a failed catalogue read is asked again when Profile is focused', () => {
  const src = read('src/screens/profile/ProfileScreen.tsx');
  assert.match(src, /const loadCatalog = useCallback\(/, 'the catalogue read is a reusable load');
  const load = between(src, 'const loadCatalog = useCallback(', '}, []);');
  assert.match(load, /catalogTicket/, 'only the newest catalogue read may land');
  assert.match(load, /catalogFailedRef\.current = /);
  assert.match(
    src,
    /useFocusEffect\(\s*useCallback\(\(\) => \{\s*if \(catalogFailedRef\.current\) loadCatalog\(\);/,
    'a failed catalogue read re-asks on focus',
  );
});
