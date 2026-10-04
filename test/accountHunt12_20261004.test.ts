/**
 * ACCOUNT + COMMERCE — hunt 12 (2026-10-04).
 *
 * 1. REGISTRY NAME (K2: a server push must never send an unread stand-in).
 *    `loadPublicProfileChecked` noted a FAILED server read of registry_name as
 *    "the server holds null". savePublicProfile queues the name sync on every
 *    keystroke in ANY field, so the next edit (the private email box, the bio)
 *    pushed the DEVICE copy — possibly older than the server's, changed on
 *    another phone — over the name printed on certificates and shown by the
 *    QR verifier. After a failed read only a name the person edits is sent.
 *
 * 2. REGISTRY LISTING (same class, PRIVACY). After a FAILED listing read the
 *    switch shows the device draft (flagged unverified). savePublicProfile
 *    queues `set_registry_listing(on: true)` on every keystroke while that
 *    draft says listed, so one keystroke in the private email box put a page
 *    unlisted from another phone back up, public. Now an unread draft is
 *    never published unedited; an edit to the published fields still is.
 *
 * 3. SessionExpiryGuard (K1: an unknown session is not "signed out"). Its
 *    boot read took `{ session: null, error: AuthRetryableFetchError }` (a
 *    member's expired token on a dead connection, session still stored) as
 *    "no account": `wasRealAccount` stayed false, INITIAL_SESSION carried no
 *    session to correct it, and when the stored refresh token was then found
 *    dead the SIGNED_OUT left the member stranded on a protected screen. An
 *    unknown boot read now asks the device's account marker (accountLocalSync)
 *    whose session it is.
 *
 * R2: the three receipts (name "does not push", listing "does not
 * re-publish", SessionExpiryGuard) FAILED with publicProfile.ts,
 * SessionExpiryGuard.tsx and accountLocalSync.ts as at HEAD c0debb14 (copied
 * aside, `git show HEAD:` written back, run, restored, cmp clean). The other
 * three pin behaviour that must NOT change and pass on both.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
const NAME_WRITES: string[] = [];
const LISTING_CALLS: { on: boolean; bio?: string }[] = [];
const H12 = {
  nameRead: (): Promise<string | null> => Promise.resolve(null),
  listingRead: (): Promise<unknown> => Promise.resolve({ state: 'none' }),
};
g.__AH12_LISTING__ = LISTING_CALLS;
g.__AH12_AS__ = AS;
g.__AH12_NAMES__ = NAME_WRITES;
g.__AH12__ = H12;

const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__AH12_AS__;
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
    `export function fetchMyRegistryName() { return globalThis.__AH12__.nameRead(); }
     export function fetchMyRegistryListing() { return globalThis.__AH12__.listingRead(); }
     export async function saveMyRegistryName(name) { globalThis.__AH12_NAMES__.push(name); return true; }
     export async function setRegistryListing(input) {
       globalThis.__AH12_LISTING__.push({ on: input.on, bio: input.bio });
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

/** Past the 1.2 s registry-name debounce. */
const pastNameDebounce = () => new Promise((r) => setTimeout(r, 1500));

test('registry name: after a FAILED server read, an edit to another field does not push the device copy', async () => {
  AS.clear();
  NAME_WRITES.length = 0;
  pp.resetLocal();
  // This phone last saw "Sam R."; the account has since been renamed elsewhere.
  AS.set('ape:publicProfile', JSON.stringify({ ...pp.EMPTY_PUBLIC_PROFILE, registryName: 'Sam R.' }));
  H12.nameRead = () => Promise.reject(new Error('users row session unreadable'));
  const { profile } = await pp.loadPublicProfileChecked();
  assert.equal(profile.registryName, 'Sam R.', 'the device copy still stands on screen');
  // A keystroke in the private email box.
  await pp.savePublicProfile({ ...profile, email: 'sam@example.com' });
  await pastNameDebounce();
  assert.deepEqual(NAME_WRITES, [], 'the unread device name was written over the server copy');
  pp.resetLocal();
});

test('registry name: after a failed read, a name the person EDITS is still sent', async () => {
  AS.clear();
  NAME_WRITES.length = 0;
  pp.resetLocal();
  AS.set('ape:publicProfile', JSON.stringify({ ...pp.EMPTY_PUBLIC_PROFILE, registryName: 'Sam R.' }));
  H12.nameRead = () => Promise.reject(new Error('users row read timeout'));
  const { profile } = await pp.loadPublicProfileChecked();
  await pp.savePublicProfile({ ...profile, registryName: 'Sam Reyes' });
  await pastNameDebounce();
  assert.deepEqual(NAME_WRITES, ['Sam Reyes']);
  pp.resetLocal();
});

test('registry name: a read that ANSWERED "no name" still lets the device name sync up (unchanged)', async () => {
  AS.clear();
  NAME_WRITES.length = 0;
  pp.resetLocal();
  AS.set('ape:publicProfile', JSON.stringify({ ...pp.EMPTY_PUBLIC_PROFILE, registryName: 'Sam R.' }));
  H12.nameRead = () => Promise.resolve(null);
  const { profile } = await pp.loadPublicProfileChecked();
  await pp.savePublicProfile({ ...profile, email: 'sam@example.com' });
  await pastNameDebounce();
  assert.deepEqual(NAME_WRITES, ['Sam R.']);
  pp.resetLocal();
});

/** Past the 1.5 s listing-sync debounce. */
const pastListingDebounce = () => new Promise((r) => setTimeout(r, 1800));

test('registry listing: after a FAILED read, a keystroke in the email box does not re-publish the draft', async () => {
  AS.clear();
  LISTING_CALLS.length = 0;
  pp.resetLocal();
  // The draft on this phone still says "listed"; the page was unlisted elsewhere.
  AS.set('ape:publicProfile', JSON.stringify({ ...pp.EMPTY_PUBLIC_PROFILE, bio: 'FOH engineer', showInRegistry: true }));
  H12.nameRead = () => Promise.resolve(null);
  H12.listingRead = () => Promise.resolve({ state: 'unavailable' });
  const { profile } = await pp.loadPublicProfileChecked();
  assert.equal(pp.isRegistryStateKnown(), false);
  await pp.savePublicProfile({ ...profile, email: 'sam@example.com' });
  await pastListingDebounce();
  assert.deepEqual(LISTING_CALLS, [], 'an unverified draft was published (set_registry_listing on: true)');
  pp.resetLocal();
});

test('registry listing: after a failed read, an EDIT to the published bio is still sent', async () => {
  AS.clear();
  LISTING_CALLS.length = 0;
  pp.resetLocal();
  AS.set('ape:publicProfile', JSON.stringify({ ...pp.EMPTY_PUBLIC_PROFILE, bio: 'FOH engineer', showInRegistry: true }));
  H12.listingRead = () => Promise.resolve({ state: 'unavailable' });
  const { profile } = await pp.loadPublicProfileChecked();
  await pp.savePublicProfile({ ...profile, bio: 'FOH + monitors' });
  await pastListingDebounce();
  assert.deepEqual(LISTING_CALLS, [{ on: true, bio: 'FOH + monitors' }]);
  H12.listingRead = () => Promise.resolve({ state: 'none' });
  pp.resetLocal();
});

test('SessionExpiryGuard: an unknown boot read asks the device account marker instead of assuming a guest', () => {
  const src = code(read('src/features/account/SessionExpiryGuard.tsx'));
  // The boot read must tell "stalled / unreachable" from "signed out".
  assert.match(src, /safeSessionResult\(supabase\.auth\.getSession\(\), 'SessionExpiryGuard'\)/);
  assert.doesNotMatch(src, /\bsafeSession\(/, 'the boot read cannot tell an unknown session from none');
  // timedOut consults the marker; a session seen on an auth event wins.
  assert.match(src, /if \(!timedOut\) \{\s*wasRealAccount\.current = isRealAccount\(data\.session\);/);
  assert.match(src, /const marker = await readDeviceAccountMarker\(\);\s*if \(!sessionSeen\.current\) wasRealAccount\.current = !!marker;/);
  assert.match(src, /if \(session\) \{\s*sessionSeen\.current = true;\s*wasRealAccount\.current = isRealAccount\(session\);/);
  // The marker read is read-only and never throws.
  const sync = code(read('src/features/account/accountLocalSync.ts'));
  assert.match(
    sync,
    /export async function readDeviceAccountMarker\(\): Promise<string \| null> \{\s*try \{\s*return await AsyncStorage\.getItem\(LOCAL_USER_ID_KEY\);\s*\} catch \{\s*return null;\s*\}\s*\}/,
  );
});
