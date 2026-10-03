/**
 * HOME + SHELL — toddler HUNT 7 (2026-10-03).
 *
 * 1. A member's users-row read that FAILED was reported as "this account has
 *    no users row". `fetchEnrollmentDashboard` retries `myUserRow()` once for
 *    a real account session, and `myUserRow()` answers null on ANY failure
 *    (a getUser() stall, a bounded-client timeout, a PostgREST error) — so a
 *    one-off blip threw `user_not_found`. The Dashboard maps that to its
 *    STRANDED-SESSION self-heal: it reloads as a guest (allowMissingUser),
 *    paints every topic at zero progress with "your account setup isn't
 *    finished … or sign out", and caches it — on a SILENT refresh too, over
 *    the member's good on-screen dashboard (the inner catch converts the
 *    error before the outer "keep the data" rule can see it). The retry now
 *    uses `myUserRowOrThrow`: a failed read THROWS (the Dashboard keeps its
 *    data, or offers Retry), and only a read that ANSWERED "no row" is
 *    `user_not_found`.
 *
 * 2. Start Here's signal-path drawings kept animating while COVERED. Start
 *    Here stays mounted under WORDS and under every lab / tool / glossary it
 *    opens, and three of its pages (Lesson 2 path, Lesson 4 parts, the lab's
 *    "follow the signal") drew <SignalPathArt> with its default
 *    `running = true`: a reanimated repeat loop on the UI thread for as long
 *    as the screen sat underneath — the AttractCue class fixed in final round
 *    C. Every other display on the screen already takes env.focused.
 *
 * 3. The Dashboard took a session read that did not answer (a stall, or an
 *    unreachable token refresh) as "guest" — see the receipt below.
 *
 * R2: each receipt FAILED against its file as it was at HEAD c2864ab1
 * (src/features/dashboard/api.ts, src/screens/startHere/pages.tsx,
 * src/screens/dashboard/DashboardScreen.tsx — copied
 * aside, the old file written back, run, the fix restored, cmp clean).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

type Mode = 'usersFail' | 'usersMissing' | 'guest' | 'sessionRejects';
const ctl = { mode: 'usersFail' as Mode };
(globalThis as Record<string, unknown>).__H7_DASH_CTL__ = ctl;

// A Supabase stand-in: every builder method chains; awaiting it answers per
// table. `users` follows the mode; everything else answers with good data.
const FAKE_SUPABASE = `
const ctl = globalThis.__H7_DASH_CTL__;
function answer(table) {
  if (table === 'users') {
    if (ctl.mode === 'usersFail') return { data: null, error: { message: 'users read timed out' } };
    return { data: null, error: null };
  }
  if (table === 'achievements') {
    return { data: [{ id: 'a1', sequence_in_course: 1, name: 'Topic A', applicable_methods: [], is_prerequisite: false, icon_url: null, global_sequence: 3060 }], error: null };
  }
  return { data: [], error: null };
}
function builder(table) {
  const b = {
    select() { return b; }, eq() { return b; }, in() { return b; }, order() { return b; }, range() { return b; },
    maybeSingle() { return Promise.resolve(answer(table)); },
    then(res, rej) { return Promise.resolve(answer(table)).then(res, rej); },
  };
  return b;
}
const session = () => (ctl.mode === 'guest' ? null : { user: { id: 'auth-1', is_anonymous: false } });
export const supabase = {
  auth: {
    async getUser() {
      // getUser() is a network read; the failing case stalls/fails it too.
      if (ctl.mode === 'usersFail' || ctl.mode === 'sessionRejects') return { data: { user: null }, error: { message: 'network' } };
      return { data: { user: session()?.user ?? null }, error: null };
    },
    async getSession() {
      if (ctl.mode === 'sessionRejects') throw new Error('secure store read failed');
      return { data: { session: session() }, error: null };
    },
  },
  from(table) { return builder(table); },
  async rpc() { return { data: [{ achievement_id: 'a1', n: 12 }], error: null }; },
};`;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (/(^|\/)lib\/supabase(\.ts)?$/.test(specifier)) {
      return { url: `data:text/javascript,${encodeURIComponent(FAKE_SUPABASE)}`, shortCircuit: true };
    }
    if (specifier === '@react-native-async-storage/async-storage') {
      return { url: `data:text/javascript,${encodeURIComponent('export default { async getItem() { return null; }, async setItem() {} };')}`, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const api = await import('../src/features/dashboard/api.ts');

test('[R2] a FAILED users-row read for a signed-in member is not reported as user_not_found', async () => {
  ctl.mode = 'usersFail';
  await assert.rejects(
    () => api.fetchEnrollmentDashboard([3060]),
    (e: Error) => e.message !== 'user_not_found',
    'a network blip on the users row became "no account row" — the Dashboard then reloads the member as a guest at zero progress with the account-setup banner',
  );
  // The stranded-session fallback (allowMissingUser) must not turn the same
  // failed read into an authoritative empty-progress dashboard either.
  await assert.rejects(
    () => api.fetchEnrollmentDashboard([3060], { allowMissingUser: true }),
    'the stranded fallback painted zero progress over a failed account read',
  );
});

test('[R2] a session read that did not answer is not taken as a guest (no zero-progress dashboard)', async () => {
  ctl.mode = 'sessionRejects';
  await assert.rejects(
    () => api.fetchEnrollmentDashboard([3060], { allowMissingUser: true }),
    /session_unreadable/,
    'an unreadable session was read as "guest" and the member got an empty-progress dashboard',
  );
});

test('a read that ANSWERED "no row" is still user_not_found (the stranded-session self-heal)', async () => {
  ctl.mode = 'usersMissing';
  await assert.rejects(() => api.fetchEnrollmentDashboard([3060]), /user_not_found/);
  const d = await api.fetchEnrollmentDashboard([3060], { allowMissingUser: true });
  assert.equal(d.userId, 'local');
  assert.equal(d.topics.length, 1);
});

test('a true guest (no session) keeps the empty-progress path', async () => {
  ctl.mode = 'guest';
  const d = await api.fetchEnrollmentDashboard([3060]);
  assert.equal(d.userId, 'local');
  assert.equal(d.topics.length, 1);
});

test('[R2] every Start Here signal-path drawing stops while the screen is covered', () => {
  const src = readFileSync(new URL('../src/screens/startHere/pages.tsx', import.meta.url), 'utf8');
  const uses = [...src.matchAll(/<SignalPathArt\b([\s\S]*?)\/>/g)];
  assert.ok(uses.length >= 4, 'the SignalPathArt uses moved — re-point this receipt');
  for (const [whole, props] of uses) {
    assert.match(
      props,
      /\brunning=\{/,
      `a SignalPathArt runs its loop with the default running=true — it keeps animating under a covering screen:
${whole.slice(0, 120)}`,
    );
  }
});

test('[R2] the Dashboard never decides "guest" from a session read that did not answer', () => {
  // 3. A stalled getSession() (or an expired token whose refresh could not
  //    reach the server) came back from safeSession as "no session", and the
  //    load painted a MEMBER as a guest: zero progress, the red "progress
  //    isn't saved — create one" notice, and the result CACHED — over the good
  //    dashboard on a silent refresh too. The load now reads the session with
  //    safeSessionResult and treats an unknown identity as a FAILED load (the
  //    outer catch keeps the data on screen; a cold screen offers Retry).
  const src = readFileSync(new URL('../src/screens/dashboard/DashboardScreen.tsx', import.meta.url), 'utf8');
  const start = src.indexOf('const load = useCallback(async () => {');
  assert.ok(start >= 0, 'Dashboard load() moved — re-point this receipt');
  const body = src.slice(start, src.indexOf('setGuest(isGuest)', start));
  assert.match(body, /safeSessionResult\(\s*supabase\.auth\.getSession\(\)/, 'the Dashboard session read cannot tell a stall from signed-out');
  assert.match(body, /if \(\w+\) throw new Error\('session_unreadable'\)/, 'an unanswered session read is still taken as "guest"');
  assert.ok(body.indexOf("throw new Error('session_unreadable')") < body.indexOf('const isGuest'), 'the guest decision is made before the unknown read is refused');
});
