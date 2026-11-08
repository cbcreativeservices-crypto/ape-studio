/**
 * Bug pass 1 (2026-11-08), group "profile": CODE-1-01, -02, -03, -14, -24, -25.
 *
 *  CODE-1-01  A listed member read "private" and could not unlist: the switch
 *             was greyed whenever this phone's form was incomplete.
 *  CODE-1-02  One tap before the Profile load landed dropped the loaded record
 *             and the save laid a one-chip interests list over the stored one.
 *  CODE-1-03  The share went to whatever code was in the field at SHARE time,
 *             not the instructor whose name the popup showed. (privacy)
 *  CODE-1-14  A failed "list me" left the debounced `on: true` sync armed, so
 *             the page could go public under a switch reading OFF.
 *  CODE-1-24  Em dashes in member text (Profile, Employer, website links).
 *  CODE-1-25  CANCEL during the share write did nothing; sharing turned on.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
const CALLS: { on: boolean }[] = [];
/** What the next listing RPCs answer, in order; empty = true. */
const ANSWERS: { ok: boolean; delayMs?: number }[] = [];
g.__BP1P_AS__ = AS;
g.__BP1P_CALLS__ = CALLS;
g.__BP1P_ANSWERS__ = ANSWERS;

const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__BP1P_AS__;
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
     export async function saveMyRegistryName(name) { return { ok: true, name }; }
     export async function setRegistryListing(input) {
       globalThis.__BP1P_CALLS__.push({ on: input.on });
       const a = globalThis.__BP1P_ANSWERS__.shift() ?? { ok: true };
       if (a.delayMs) await new Promise((r) => setTimeout(r, a.delayMs));
       return a.ok;
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

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function between(src: string, start: string, end: string): string {
  const i = src.indexOf(start);
  assert.ok(i >= 0, `missing: ${start}`);
  const j = src.indexOf(end, i + start.length);
  assert.ok(j > i, `missing end after: ${start}`);
  return src.slice(i, j);
}

function fresh() {
  AS.clear();
  CALLS.length = 0;
  ANSWERS.length = 0;
  pp.resetLocal();
}

const listedDraft = () => ({
  ...pp.EMPTY_PUBLIC_PROFILE,
  name: 'sam',
  registryName: 'Sam Reyes',
  bio: 'FOH engineer',
  interests: ['Live Sound'],
  showInRegistry: true,
});

/* ------------------------------ CODE-1-14 -------------------------------- */

test('CODE-1-14: a failed "list me" leaves no publish armed (even without the screen revert)', async () => {
  fresh();
  const on = listedDraft();
  // The switch's own save arms the debounced on:true sync as it flips ON…
  await pp.savePublicProfile(on);
  // …and the switch write itself fails.
  ANSWERS.push({ ok: false });
  assert.equal(await pp.setRegistryVisible(true, on), false);
  await wait(1800);
  assert.deepEqual(
    CALLS.map((c) => c.on),
    [true],
    'a second on:true went out after the failed "list me": the page could go public under OFF',
  );
  pp.resetLocal();
});

test('CODE-1-14: the screen revert (a save that reads not listed) also cancels the pending publish', async () => {
  fresh();
  const on = listedDraft();
  await pp.savePublicProfile(on);
  await pp.savePublicProfile({ ...on, showInRegistry: false });
  await wait(1800);
  assert.deepEqual(CALLS, [], 'an unlisted save left an on:true sync armed');
  pp.resetLocal();
});

test('CODE-1-14: a slow failing "list me" is not raced by the debounced sync', async () => {
  fresh();
  const on = listedDraft();
  await pp.savePublicProfile(on);
  // Out for longer than the 1.5 s debounce, then fails.
  ANSWERS.push({ ok: false, delayMs: 2200 });
  assert.equal(await pp.setRegistryVisible(true, on), false);
  await wait(1800);
  assert.deepEqual(CALLS.map((c) => c.on), [true], 'the debounced sync fired a second on:true during the switch write');
  pp.resetLocal();
});

test('CODE-1-14: a successful "list me" is not re-sent, but a later edit still reaches the page', async () => {
  fresh();
  const on = listedDraft();
  await pp.savePublicProfile(on);
  assert.equal(await pp.setRegistryVisible(true, on), true);
  await wait(1800);
  assert.deepEqual(CALLS.map((c) => c.on), [true], 'the same fields were published twice');
  await pp.savePublicProfile({ ...on, bio: 'FOH + monitors' });
  await wait(1800);
  assert.deepEqual(CALLS.map((c) => c.on), [true, true], 'an edit while listed must still sync');
  pp.resetLocal();
});

/* ------------------------------ CODE-1-01 -------------------------------- */

test('CODE-1-01: LISTED follows the listing, and the switch is held only on the way ON', () => {
  const s = read('src/screens/profile/ProfileScreen.tsx');
  assert.match(s, /const registryActive = pub\.showInRegistry;/);
  assert.match(s, /const needsInfo = !profileComplete && !pub\.showInRegistry;/);
  const sw = between(s, 'label="List me in the Pro Registry"', 'onChange={onRegistryToggle}');
  assert.match(sw, /disabled=\{needsInfo\}/);
  assert.doesNotMatch(sw, /disabled=\{!profileComplete\}/, 'a listed member with an incomplete form could not unlist');
  // "Before I can be listed" / "needed to get listed" only while not listed.
  assert.match(s, /\{needsInfo \? \(\s*<View style=\{styles\.gapBox\}>/);
  assert.match(s, /: needsInfo\s*\? `\$\{missing\.length\} detail\$\{missing\.length === 1 \? '' : 's'\} needed to get listed ›`/);
  assert.match(s, /summary=\{registryActive \? 'LISTED' : needsInfo \? 'needs info' : 'private'\}/);
  assert.match(s, /disabled=\{!needsInfo\}/, 'the strip is a button only while details are needed to list');
});

/* ------------------------------ CODE-1-02 -------------------------------- */

test('CODE-1-02: no edit is taken before the stored profile is applied', () => {
  const s = read('src/screens/profile/ProfileScreen.tsx');
  assert.match(s, /const hydratedRef = useRef\(false\);/);
  for (const head of [
    'const setPubKey = useCallback(<K extends keyof PublicProfile>(key: K, value: PublicProfile[K]) => {',
    'const toggleInterest = useCallback((topic: string) => {',
    'const promotePrimary = useCallback((topic: string) => {',
  ]) {
    const body = between(s, head, 'dirtyRef.current = true;');
    assert.match(body, /if \(!hydratedRef\.current\) return;/, `${head} accepts input before the load lands`);
  }
  const load = between(s, 'void loadPublicProfileChecked()', 'setHydrated(true);');
  assert.match(load, /hydratedRef\.current = true;/);
  // The text fields say so too: read-only until the load lands.
  for (const field of ["setPubKey('name', t)", "setPubKey('email', t)", "setPubKey('bio', t)"]) {
    const at = s.indexOf(`onChangeText={(t) => ${field}}`);
    assert.ok(at > 0, field);
    assert.match(s.slice(at - 80, at), /editable=\{hydrated\}/, `${field} is editable before the load`);
  }
  assert.match(between(s, 'value={pub.registryName}', "setPubKey('registryName', t)"), /editable=\{hydrated\}/);
});

/* --------------------------- CODE-1-03 / -25 ----------------------------- */

test('CODE-1-03: the share goes to the code that was looked up, never the field text at SHARE time', () => {
  const s = read('src/screens/profile/InstructorShareSection.tsx');
  assert.match(s, /type Found = \{ code: string; instructorName: string; school: string \| null \};/);
  const find = between(s, 'const onFind = useLatchedPress(', 'const onShare = useLatchedPress(');
  assert.match(find, /const asked = code;/);
  assert.match(find, /setFound\(\{ code: asked, instructorName: r\.instructorName, school: r\.school \}\)/);
  assert.match(find, /if \(mine !== popupTicket\.current\) return;/, 'a lookup landing after CANCEL / in a later popup must show nothing');
  const share = between(s, 'const onShare = useLatchedPress(', 'const stop = useLatchedPress(');
  assert.match(share, /if \(!found\) return;/);
  assert.match(share, /const code = found\.code;/);
  // The field is locked while a lookup is out.
  assert.match(s, /editable=\{!finding\}/);
});

test('CODE-1-25: while the share is out the button says so and CANCEL / back cannot fake a cancel', () => {
  const s = read('src/screens/profile/InstructorShareSection.tsx');
  assert.match(s, /const SHARING_LABEL = 'SHARING…';/);
  assert.match(s, /\{sharing \? SHARING_LABEL : SHARE_COPY\.share\}/);
  const close = between(s, 'const closePopup = () => {', '};');
  assert.match(close, /if \(sharing\) return;/, 'CANCEL / Android BACK closed the popup while the share went through');
  const cancel = between(s, 'onPress={closePopup}', 'accessibilityLabel="Cancel"');
  assert.match(cancel, /disabled=\{sharing\}/);
  const share = between(s, 'const onShare = useLatchedPress(', 'const stop = useLatchedPress(');
  assert.match(share, /setSharing\(true\);[\s\S]*finally \{\s*setSharing\(false\);/);
});

/* ------------------------------ CODE-1-24 -------------------------------- */

test('CODE-1-24: no em dash left in the profile member text the pass listed', () => {
  const gone: [string, string][] = [
    ['src/screens/profile/ProfileScreen.tsx', 'Show more —'],
    ['src/screens/profile/ProfileScreen.tsx', 'in the app — your studies'],
    ['src/screens/profile/ProfileScreen.tsx', 'load your ID —'],
    ['src/screens/profile/ProfileScreen.tsx', "'LISTED —"],
    ['src/screens/profile/ProfileScreen.tsx', "'PRIVATE —"],
    ['src/screens/profile/ProfileScreen.tsx', 'started yet —'],
    ['src/screens/profile/ProfileScreen.tsx', 'the catalog —'],
    ['src/screens/profile/ProfileScreen.tsx', 'move slowly —'],
    ['src/screens/profile/ProfileScreen.tsx', 'the app closes —'],
    ['src/screens/profile/ProfileScreen.tsx', 'device only —'],
    ['src/screens/profile/ProfileScreen.tsx', 'with the link —'],
    ['src/screens/profile/ProfileScreen.tsx', 'What you work in —'],
    ['src/screens/profile/ProfileScreen.tsx', 'About you line —'],
    ['src/screens/profile/ProfileScreen.tsx', 'button yet —'],
    ['src/screens/profile/EmployerSection.tsx', 'confirmed yet —'],
    ['src/screens/profile/EmployerSection.tsx', 'needed from you —'],
    ['src/screens/profile/EmployerSection.tsx', 'the website —'],
    ['src/features/profile/WebsiteLinks.tsx', 'the website —'],
  ];
  for (const [file, frag] of gone) assert.ok(!read(file).includes(frag), `${file} still says "${frag}"`);
});

/* ------------------- CODE-1-03 follow-up (checker, 2026-11-08) ------------------- */

test('CODE-1-03 follow-up: a reopened popup is usable at once while an old lookup is still out', () => {
  const s = read('src/screens/profile/InstructorShareSection.tsx');
  const open = between(s, 'const openPopup = () => {', 'setPopupOpen(true);');
  assert.match(open, /popupTicket\.current\+\+;/, 'the old answer must still be ignored');
  assert.match(open, /setFinding\(false\);/, 'the field stayed read-only until the old lookup finished');
  assert.match(open, /setFindLatch\(createInFlightLatch\(\)\);/, 'the old lookup still held the FIND latch');
  const find = between(s, 'const onFind = useLatchedPress(', 'const onShare = useLatchedPress(');
  assert.match(find, /\}, findLatch\);/, 'FIND runs on the per-popup latch');
  assert.match(find, /finally \{[\s\S]*if \(mine === popupTicket\.current\) setFinding\(false\);/, 'an old lookup must not clear the new popup busy state');
});

test('CODE-1-03 follow-up: FIND shows a busy state while the lookup is out', () => {
  const s = read('src/screens/profile/InstructorShareSection.tsx');
  assert.match(s, /const FINDING_LABEL = 'FINDING…';/);
  const btn = between(s, 'onPress={onFind}', '</Pressable>');
  assert.match(btn, /disabled=\{finding\}/);
  assert.match(btn, /\{finding \? FINDING_LABEL : SHARE_COPY\.lookUp\}/);
});
