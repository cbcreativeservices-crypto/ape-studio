/**
 * ACCOUNT + COMMERCE — hunt 11 (2026-10-04).
 *
 * 1. myUserRowOrThrow — the STRICT users-row read — took an expired token on a
 *    dead connection (`{ session: null, error: AuthRetryableFetchError }`,
 *    session still stored) as "no session" and answered null: the guest
 *    answer. Its callers exist precisely to refuse that: the Trophy Case drew
 *    "0 / 166" and every topic locked, fetchMyCredentials answered "earned
 *    nothing" (and the celebration baseline then recorded nothing), and a
 *    printed certificate read "Academy Member". Catalog K1.
 *
 * 2. SettingsScreen — the hunt-6 `unreadShown` fix was undone by an
 *    OVERTAKEN load: a tap before the load lands saves (defaults + tap) with
 *    `unreadShown`, the load then answers that save's copy (`lastWritten`,
 *    not yet recovered) and the screen marked itself LOADED; the next tap,
 *    before the first save's read came back, wrote defaults + two taps WHOLE
 *    over every stored setting (reminders, haptics, a11y). Catalog K2.
 *
 * R2: tests marked [R2] FAILED with src/features/account/myUserRow.ts and
 * src/screens/settings/SettingsScreen.tsx as at HEAD 784bb36f (copied aside,
 * `git show HEAD:` written back, run, restored, cmp clean).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, any>;
g.__DEV__ = false;

const STUBS: Record<string, string> = {
  'ape-h11:sb': `
    const C = () => globalThis.__H11__;
    function builder() {
      const b = {
        select() { return b; },
        eq() { return b; },
        maybeSingle() { C().usersReads++; return Promise.resolve({ data: { id: 'app-1' }, error: null }); },
      };
      return b;
    }
    export const supabase = { auth: { getSession: () => C().session() }, from: builder };
  `,
};
registerHooks({
  resolve(specifier, context, next) {
    if (/(^|\/)lib\/supabase$/.test(specifier)) return { url: 'ape-h11:sb', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL?.startsWith('file:')) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url in STUBS) return { format: 'module', source: STUBS[url], shortCircuit: true };
    return next(url, context);
  },
});

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

function ctl(answer: unknown) {
  const c = { usersReads: 0, session: () => Promise.resolve(answer) };
  g.__H11__ = c;
  return c;
}

const myRow = await import('../src/features/account/myUserRow.ts');

test('[R2] 1 · strict users-row read: an offline refresh (AuthRetryableFetchError) THROWS, never answers "no account"', async () => {
  const c = ctl({ data: { session: null }, error: { name: 'AuthRetryableFetchError', message: 'Failed to fetch' } });
  await assert.rejects(() => myRow.myUserRowOrThrow('id'), 'an unknown session was answered as a guest (null)');
  assert.equal(c.usersReads, 0);
});

test('1 · control: a real "no session" (and a dead refresh token) still answers null', async () => {
  ctl({ data: { session: null }, error: null });
  assert.equal(await myRow.myUserRowOrThrow('id'), null);
  ctl({ data: { session: null }, error: { name: 'AuthApiError', message: 'Invalid Refresh Token' } });
  assert.equal(await myRow.myUserRowOrThrow('id'), null);
});

test('1 · control: a signed-in read still returns the row', async () => {
  ctl({ data: { session: { user: { id: 'auth-1' } } }, error: null });
  assert.deepEqual(await myRow.myUserRowOrThrow<{ id: string }>('id'), { id: 'app-1' });
});

test('[R2] 2 · Settings: a load overtaken by a tap never marks the screen loaded; a recovered save does', () => {
  const s = read('src/screens/settings/SettingsScreen.tsx');
  const reload = s.slice(s.indexOf('const reloadPrefs = useCallback'), s.indexOf('useEffect(() => {\n    void reloadPrefs();'));
  assert.match(reload, /const savesBefore = savesMade\.current;\s*const loaded = await loadLocalSettings\(\);/);
  assert.match(reload, /if \(savesMade\.current === savesBefore\) showStored\(loaded\);/, 'an overtaken load still marks the screen loaded');
  // Every save from the screen counts itself, and a recovered copy (the stored
  // record) is what marks the screen loaded.
  const saves = s.match(/void saveLocalSettings\(next, unreadShown\(\)\)/g) ?? [];
  assert.equal(saves.length, 3);
  assert.equal((s.match(/savesMade\.current \+= 1;\s*(?:\/\/[^\n]*\s*)?void saveLocalSettings\(next, unreadShown\(\)\)/g) ?? []).length, 3);
  assert.equal((s.match(/if \(written\) showStored\(written\);/g) ?? []).length, 3);
  assert.doesNotMatch(s, /if \(written\) setLocal\(written\)/);
});

test('2 · control: the store answers an overtaken load with the save\'s copy (why the screen must not trust it)', () => {
  const st = read('src/features/settings/store.ts');
  const load = st.slice(st.indexOf('export async function loadLocalSettings'), st.indexOf('export async function saveLocalSettings'));
  assert.match(load, /if \(gen !== settingsGen\) return lastWritten \?\? DEFAULT_LOCAL_SETTINGS;/);
});
