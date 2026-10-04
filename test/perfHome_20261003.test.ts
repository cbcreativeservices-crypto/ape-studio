/**
 * PERFORMANCE HUNT — AREA 1, HOME + SHELL (2026-10-03).
 *
 * 1. The Study tab's data read was a five-round-trip WATERFALL
 *    (`fetchEnrollmentDashboard`: users row → method configs → topics →
 *    term counts → progress), paid on every Study-tab open, every focus and
 *    every flushed study write. The topic lookup (public content) now goes out
 *    alongside the users row, and the term counts and the progress reads go
 *    out together. The method configs deliberately still wait for the users
 *    row (no anon grant + the cold-start auth race).
 * 2. A cold Study tab ran its first load TWICE: the enrollment effect started
 *    one at mount, the deferred focus load started a second after the
 *    transition, and newest-wins discarded the first — the spinner sat for
 *    the transition plus a whole fetch. A load that began after the focus now
 *    answers the focus.
 * 3. Home warmed its card art into React Native's image cache, which the card
 *    (expo-image) never reads: every card downloaded twice. The warm-up now
 *    fills expo-image's memory + disk cache.
 * 4. Every carousel settle re-rendered every card (extraData carries the
 *    centred index). The card is memoised with stable callbacks.
 * 5. A signed-in launch starts the Home art warm-up during Splash's hold.
 *
 * R2: every receipt FAILED against HEAD 4201f49f (each file copied aside, the
 * HEAD file written back, this file run, the fix restored, cmp clean).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// ── 1. the Dashboard read, timed against a Supabase stand-in ─────────────────
type Ev = { what: string; at: number; phase: 'start' | 'end' };
const log: Ev[] = [];
(globalThis as Record<string, unknown>).__PERF_HOME_LOG__ = log;

// Every read takes 25 ms and logs when it is SENT and when it ANSWERS. Builders
// are lazy like supabase-js: nothing is sent until `.then`.
const FAKE_SUPABASE = `
const log = globalThis.__PERF_HOME_LOG__;
const t0 = Date.now();
const LAT = 25;
function timed(what, value) {
  log.push({ what, at: Date.now() - t0, phase: 'start' });
  return new Promise((r) => setTimeout(() => { log.push({ what, at: Date.now() - t0, phase: 'end' }); r(value); }, LAT));
}
function answer(table) {
  if (table === 'users') return { data: { id: 'u1', nickname: null }, error: null };
  if (table === 'achievements') {
    return { data: [{ id: 'a1', sequence_in_course: 1, name: 'Topic A', applicable_methods: [], is_prerequisite: false, icon_url: null, global_sequence: 3060 }], error: null };
  }
  return { data: [], error: null };
}
function builder(table) {
  let sent = null;
  const send = () => (sent ??= timed(table, answer(table)));
  const b = {
    select() { return b; }, eq() { return b; }, in() { return b; }, order() { return b; }, range() { return b; },
    maybeSingle() { return send(); },
    then(res, rej) { return send().then(res, rej); },
  };
  return b;
}
export const supabase = {
  auth: {
    async getUser() { return timed('getUser', { data: { user: { id: 'auth-1', is_anonymous: false } }, error: null }); },
    async getSession() { return { data: { session: { user: { id: 'auth-1', is_anonymous: false } } }, error: null }; },
  },
  from(table) { return builder(table); },
  rpc() { return timed('rpc', { data: [{ achievement_id: 'a1', n: 12 }], error: null }); },
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

const at = (what: string, phase: 'start' | 'end') => {
  const e = log.find((x) => x.what === what && x.phase === phase);
  assert.ok(e, `${what} ${phase} was never logged`);
  return e.at;
};

test('[R2] the Dashboard read is no longer a five-round-trip waterfall', async () => {
  const api = await import('../src/features/dashboard/api.ts');
  log.length = 0;
  const d = await api.fetchEnrollmentDashboard([3060]);
  // Same answer as before.
  assert.equal(d.userId, 'u1');
  assert.equal(d.topics.length, 1);
  assert.equal(d.itemCountByTopic.get('a1'), 12);

  // The topic lookup goes out BEFORE the users row has answered.
  assert.ok(
    at('achievements', 'start') < at('users', 'end'),
    'the gs → topic lookup still waits for the users row',
  );
  // The progress reads go out BEFORE the term counts have answered.
  assert.ok(
    at('student_achievement_progress', 'start') < at('rpc', 'end'),
    'the progress reads still wait for the term counts',
  );
  assert.ok(at('student_method_progress', 'start') < at('rpc', 'end'));
});

test('the method configs still wait for the account read (cold-start auth race)', () => {
  // study_methods has no anon grant; sent before the session settles, a member
  // could be answered as anon and get NO configs. Pinned by ORDER, not time.
  const start = log.find((x) => x.what === 'study_methods' && x.phase === 'start');
  const usersEnd = log.find((x) => x.what === 'users' && x.phase === 'end');
  assert.ok(start && usersEnd);
  assert.ok(log.indexOf(start) > log.indexOf(usersEnd), 'study_methods went out before the users row answered');
});

test('errors keep their old order: a started read is awaited where it used to run', () => {
  const src = strip(read('src/features/dashboard/api.ts'));
  const fn = src.slice(src.indexOf('export async function fetchEnrollmentDashboard'));
  // An unreached read can never become an unhandled rejection.
  assert.match(fn, /started\.catch\(\(\) => \{\}\)/);
  // Counts first, then progress — the order a failure used to surface in.
  assert.ok(fn.indexOf('await countsP') > 0 && fn.indexOf('await countsP') < fn.indexOf('await progressP'));
  assert.ok(fn.indexOf('await achP') > fn.indexOf("from('study_methods')"));
});

// ── 2. the first Study-tab focus does not re-run the mount load ─────────────
test('[R2] a load begun after the focus answers it (no discarded first load)', () => {
  const src = strip(read('src/screens/dashboard/DashboardScreen.tsx'));
  assert.match(src, /const ticketAtFocus = loadTicketRef\.current;/);
  assert.match(
    src,
    /InteractionManager\.runAfterInteractions\(\(\) => \{\s*if \(loadTicketRef\.current !== ticketAtFocus\) return;\s*void load\(\);\s*\}\)/,
  );
  // newest-wins itself is untouched.
  assert.match(src, /const ticket = \+\+loadTicketRef\.current;/);
});

// ── 3. the card-art warm-up fills the cache the card reads ──────────────────
test('[R2] Home warms its art through expo-image (memory-disk), not RN Image.prefetch', () => {
  const home = strip(read('src/screens/courses/CourseSelectionScreen.tsx'));
  const warm = home.slice(home.indexOf('function warmCardArt'), home.indexOf('const SHIMMER_EVERY_MS'));
  assert.ok(warm.length > 0);
  assert.doesNotMatch(warm, /Image\.prefetch/, 'the warm-up still fills React Native\'s cache, which CardArt never reads');
  assert.match(warm, /prefetchCardArt\(u\)/);
  const pf = strip(read('src/features/home/cardArtPrefetch.ts'));
  assert.match(pf, /EXPO_IMAGE\.prefetch\(uri, 'memory-disk'\)/);
  // The same native gate as CardArt, so an old dev client keeps the RN path.
  assert.match(pf, /requireOptionalNativeModule\('ExpoImage'\)/);
  assert.match(read('src/components/CardArt.tsx'), /cachePolicy="memory-disk"/);
});

// ── 4. one swipe does not re-render every card ──────────────────────────────
test('[R2] the carousel card is memoised and gets stable callbacks', () => {
  const home = strip(read('src/screens/courses/CourseSelectionScreen.tsx'));
  assert.match(home, /const MemoCourseCardView = memo\(CourseCardView\);/);
  assert.match(home, /<MemoCourseCardView\s/);
  assert.doesNotMatch(home, /<CourseCardView\s/);
  assert.doesNotMatch(home, /onLockedPress=\{\(\) =>/, 'an inline closure defeats the memo on every render');
  assert.match(home, /const openUpgrade = useCallback\(\(\) => setUpgradeOpen\(true\), \[\]\);/);
});

// ── 5. Splash warms Home during its hold, for a signed-in launch only ───────
test('[R2] Splash starts the Home art warm-up once the session read says Main', () => {
  const splash = strip(read('src/screens/SplashScreen.tsx'));
  assert.match(splash, /import \{ warmCardArt \} from '\.\/courses\/CourseSelectionScreen';/);
  assert.match(splash, /if \(!cancelled && splashBase\(read\) === 'Main'\) warmCardArt\(\);/);
  // The 2.5 s hold itself is the owner's and is unchanged.
  assert.match(splash, /\}, 2500\);/);
});
