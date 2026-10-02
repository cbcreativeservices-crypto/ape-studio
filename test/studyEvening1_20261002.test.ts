/**
 * STUDY area, evening toddler hunt pass 1 (2026-10-02).
 *
 * Each test below FAILED against the file before its fix (R2: the fixed file
 * was copied aside, the old one restored, this file run, the fix put back).
 *
 *   1. finalExam/api — the quiz twin's wave-2 intent fix never reached the
 *      exam: a read that THREW minted a new client attempt id and wrote it
 *      over the stored one, and a start in flight across the account wipe
 *      wrote the departing user's intent into the next user's storage.
 *   2. enrollmentStore — toggleTopic / toggleFavorite / toggleActive were
 *      queued as TOGGLES: a tap made before the stored list landed (the
 *      screen showed "+") was replayed against the hydrated list and REMOVED
 *      the topic the learner had asked to add.
 *   3. EnrollmentScreen — Field REMOVE ALL stripped topics an enrolled
 *      certificate / program / subject still lists, and incomplete required
 *      co-requisites; bundle REMOVE ALL stripped an incomplete co-requisite
 *      while another credential remained. (Source-pinned: the screen imports
 *      React Native.)
 *   4. credentials/api — fetchMyCredentials resolved the member through the
 *      LENIENT myUserId(), so a users-row read that failed answered "earned
 *      nothing" ([]); useCredentialCelebration's first run stored that as its
 *      baseline and later congratulated every credential already held.
 *   5. curriculumStats — a fallback page that FAILED mid-tally left partial
 *      per-topic term counts, shown short as fact.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__SE1_AS__ = AS;
g.__SE1_FAIL_READS__ = false;
g.__SE1_HOLD__ = null;

const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__SE1_AS__;
     export default {
       async getItem(k) {
         if (globalThis.__SE1_FAIL_READS__) throw new Error('storage read failed');
         const h = globalThis.__SE1_HOLD__; if (h) await h;
         return s.has(k) ? s.get(k) : null;
       },
       async setItem(k, v) { s.set(k, v); },
       async removeItem(k) { s.delete(k); },
       async getAllKeys() { return [...s.keys()]; },
       async multiGet(keys) { return keys.map((k) => [k, s.has(k) ? s.get(k) : null]); },
       async multiRemove(keys) { for (const k of keys) s.delete(k); },
     };`,
  );
const CRYPTO =
  'data:text/javascript,' +
  encodeURIComponent(`let n = 0; export function randomUUID() { n += 1; return 'minted-' + n; }`);
const SUPABASE =
  'data:text/javascript,' +
  encodeURIComponent(`export const supabase = {
    auth: {
      async getSession() { return { data: { session: null }, error: null }; },
      async getUser() { return { data: { user: null }, error: null }; },
    },
    from() { return { select() { return { order: async () => ({ data: null, error: { message: 'denied' } }) }; } }; },
    async rpc(name, args) {
      const h = globalThis.__SE1_RPC__;
      return h ? h(name, args) : { data: null, error: { message: 'no handler' } };
    },
  };`);
const TELEMETRY = 'data:text/javascript,' + encodeURIComponent(`export function trackEvent() {}`);
// The users-row read: the strict variant throws on a failed read, the lenient
// one answers null for it (exactly as for a guest) — the trap.
const MY_USER_ROW =
  'data:text/javascript,' +
  encodeURIComponent(`export async function myUserRowOrThrow() { throw new Error('users row read failed'); }
    export async function myUserRow() { return null; }
    export async function myUserId() { return null; }`);
const REACT =
  'data:text/javascript,' +
  encodeURIComponent(`export function useSyncExternalStore(sub, get) { sub(() => {}); return get(); }
    export default {};`);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (specifier === 'expo-crypto') return { url: CRYPTO, shortCircuit: true };
    if (specifier === 'react') return { url: REACT, shortCircuit: true };
    if (specifier.endsWith('lib/supabase')) return { url: SUPABASE, shortCircuit: true };
    if (specifier.endsWith('telemetry/telemetry')) return { url: TELEMETRY, shortCircuit: true };
    if (specifier.endsWith('account/myUserRow')) return { url: MY_USER_ROW, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const exam = await import('../src/features/finalExam/api.ts');
const enrollment = await import('../src/features/enrollment/enrollmentStore.ts');
const registry = await import('../src/features/storage/localStoreRegistry.ts');
const credentials = await import('../src/features/credentials/api.ts');

const settle = async () => {
  for (let i = 0; i < 40; i++) await Promise.resolve();
  await new Promise<void>((r) => setImmediate(r));
  for (let i = 0; i < 40; i++) await Promise.resolve();
};
function fresh(): void {
  AS.clear();
  g.__SE1_FAIL_READS__ = false;
  g.__SE1_HOLD__ = null;
  g.__SE1_RPC__ = null;
}
function holdReads(): () => void {
  let release!: () => void;
  g.__SE1_HOLD__ = new Promise<void>((r) => (release = r));
  return () => {
    g.__SE1_HOLD__ = null;
    release();
  };
}
const src = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8');

// ── 1. Final Exam intent (graded capstone) ─────────────────────────────────

const examPayload = { attempt_id: 'exam-srv-1', items: [], started_at: '2026-10-02T00:00:00Z', time_limit_seconds: 600 };
const EXAM_KEY = 'ape:finalExamIntent:certificate:cert-a';

test('exam intent: a read that THREW never writes a fresh intent over the stored one', async () => {
  fresh();
  AS.set(EXAM_KEY, 'intent-A');
  const sent: string[] = [];
  g.__SE1_RPC__ = (_n: string, args: { p_client_attempt_id: string }) => {
    sent.push(args.p_client_attempt_id);
    return { data: examPayload, error: null };
  };
  g.__SE1_FAIL_READS__ = true;
  await exam.startFinalExam('certificate', 'cert-a'); // the exam still starts
  assert.equal(AS.get(EXAM_KEY), 'intent-A', 'the stored exam intent was replaced — the sitting in progress lost its resume id');
  g.__SE1_FAIL_READS__ = false;
  await exam.startFinalExam('certificate', 'cert-a');
  assert.equal(sent[1], 'intent-A', 'the next start rejoins the stored attempt');
});

test('exam intent: a start in flight across the account wipe writes nothing for the next user', async () => {
  fresh();
  g.__SE1_RPC__ = () => ({ data: examPayload, error: null });
  const release = holdReads();
  const p = exam.startFinalExam('certificate', 'cert-b');
  await settle();
  AS.clear(); // the sweep…
  registry.resetRegisteredLocalStores(); // …then the reset
  release();
  await p;
  assert.equal(AS.has('ape:finalExamIntent:certificate:cert-b'), false, "the departing user's exam intent was written after the wipe");
});

// ── 2. Enrollment toggles decide their intent from what was shown ──────────

test('enrollment: a "+" tap made before the stored list landed ADDS, never removes', async () => {
  fresh();
  AS.set('ape:enrollmentSeeded5', '1');
  AS.set('ape:enrollmentList', JSON.stringify([{ gs: 3060, favorite: false, active: true }, { gs: 4100, favorite: false, active: true }]));
  enrollment.resetLocal();
  const release = holdReads();
  // Nothing hydrated yet: the screen shows no row for 4200, then 4100 as "+".
  assert.equal(enrollment.getEnrollment().some((e) => e.gs === 4100), false);
  enrollment.toggleTopic(4100); // the learner asked to ADD it
  release();
  await settle();
  const list = enrollment.getEnrollment();
  assert.equal(list.some((e) => e.gs === 4100), true, 'the queued toggle REMOVED the topic the learner tapped to add');
  const stored = JSON.parse(AS.get('ape:enrollmentList') ?? '[]') as { gs: number }[];
  assert.equal(stored.some((e) => e.gs === 4100), true, 'the stored list lost the topic');
});

test('enrollment: a deck toggle replays the SHOWN intent, and a hydrated double tap still nets to nothing', async () => {
  fresh();
  AS.set('ape:enrollmentSeeded5', '1');
  AS.set('ape:enrollmentList', JSON.stringify([{ gs: 4100, favorite: false, active: false }]));
  enrollment.resetLocal();
  await settle();
  enrollment.toggleActive(4100);
  enrollment.toggleActive(4100);
  await settle();
  assert.equal(enrollment.getEnrollment().find((e) => e.gs === 4100)?.active, false, 'a double tap is an on/off pair');
  enrollment.toggleFavorite(4100);
  await settle();
  assert.equal(enrollment.getEnrollment().find((e) => e.gs === 4100)?.favorite, true);
});

// ── 3. REMOVE ALL keeps what the topic row keeps ──────────────────────────

test('Enrollments: Field REMOVE ALL keeps bundle topics and incomplete co-requisites', () => {
  const s = src('screens/enrollment/EnrollmentScreen.tsx');
  const field = s.slice(s.indexOf('const removeWholeField'), s.indexOf('const removeWhole = '));
  assert.ok(field.length > 0, 'removeWholeField not found');
  assert.match(field, /removableOnBundleDrop\(topics, bundles\.map\(\(b\) => b\.topics\)/, 'field removal ignores the enrolled bundles');
  assert.match(field, /coreLockedNow\(gs\)/, 'field removal ignores the co-requisite lock');
  assert.match(field, /notify\(/, 'a REMOVE ALL that keeps topics must say so');
  assert.match(s, /const coreLockedNow = \(gs: number\) => COREQ_TOPIC_GS\.includes\(gs\) && pctFor\(gs\) < 100;/);
});

test('Enrollments: bundle REMOVE ALL keeps an incomplete co-requisite while a credential remains', () => {
  const s = src('screens/enrollment/EnrollmentScreen.tsx');
  const whole = s.slice(s.indexOf('const removeWhole = '), s.indexOf('const removeBundleEntry'));
  assert.match(whole, /isFreeEnrollGs\(gs\) \|\| \(stillCredentialed && coreLockedNow\(gs\)\)/);
  assert.ok(
    whole.indexOf('const stillCredentialed') < whole.indexOf('removableOnBundleDrop(topics'),
    'stillCredentialed must be known before the topics are dropped',
  );
});

// ── 4. A failed identity read is not "earned nothing" ──────────────────────

test('credentials: a users-row read that FAILED rejects instead of answering []', async () => {
  fresh();
  await assert.rejects(
    credentials.fetchMyCredentials(),
    'a failed identity read came back as an empty credential list',
  );
});

// ── 5. A partial term tally is not shown as fact ───────────────────────────

test('curriculum stats: a failed fallback page drops the partial tally', () => {
  const s = src('features/curriculum/curriculumStats.ts');
  const loop = s.slice(s.indexOf('for (let from = 0;'), s.indexOf('if (alive) setStats({ totalTerms: count'));
  assert.match(loop, /if \(error \|\| !data\) \{\s*termsByGs\.clear\(\);\s*break;/, 'a failed page leaves partial counts');
});
