/**
 * Wave 2 of the shared-safe-store sweep (pattern catalog 2026-10-02, closer
 * A2): the account / assess / quiz / study stores and the study-side screens.
 *
 * Each store is driven for real on a fake AsyncStorage whose reads can be
 * made to THROW or be HELD mid-flight. Every behavioural test below FAILED
 * against the hand-rolled file it replaced (R2: the originals were copied
 * aside, put back, this file run, then the new files restored):
 *
 *   • deviceIdentity: a read that threw MINTED A NEW install id and wrote it
 *     over the stored one (single-device login saw a new device for good).
 *   • attemptDraft: a read that threw answered "no draft"; the next answer
 *     wrote a one-answer draft over the stored answers.
 *   • quiz api: a read that threw minted a new client attempt id and wrote it
 *     over the stored one (the attempt in progress could never be rejoined);
 *     an intent write in flight across the account wipe landed afterwards.
 *   • localProgress: a save replaced the mirrored row whole (a failed resume
 *     read, or Scenarios, which never reads it, wrote a thinner copy over it).
 *   • scenarioQueue: a read that threw answered [] — the next enqueue wrote
 *     one call over every queued call; a drain kept sending the departing
 *     user's calls after the wipe.
 *   • paceStore: a read that threw left the defaults, and a toggle wrote them
 *     over the chosen pace; a setter before the read landed did the same.
 *   • lastStudyLocation: a read that threw left "nothing recorded" for the
 *     whole run (no retry).
 *
 * The screens import React Native, which node --test cannot load: their
 * storage fixes are pinned by source below.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__W2S_AS__ = AS;
g.__W2S_FAIL_READS__ = false;
g.__W2S_HOLD__ = null;
g.__W2S_WRITES__ = 0;

const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__W2S_AS__;
     export default {
       async getItem(k) {
         if (globalThis.__W2S_FAIL_READS__) throw new Error('storage read failed');
         const v = s.has(k) ? s.get(k) : null;
         const h = globalThis.__W2S_HOLD__; if (h) await h;
         return v;
       },
       async setItem(k, v) { globalThis.__W2S_WRITES__++; s.set(k, v); },
       async removeItem(k) { globalThis.__W2S_WRITES__++; s.delete(k); },
       async getAllKeys() { return [...s.keys()]; },
       async multiGet(keys) {
         if (globalThis.__W2S_FAIL_READS__) throw new Error('storage read failed');
         return keys.map((k) => [k, s.has(k) ? s.get(k) : null]);
       },
       async multiRemove(keys) { for (const k of keys) s.delete(k); },
     };`,
  );
const CRYPTO =
  'data:text/javascript,' +
  encodeURIComponent(`let n = 0; export function randomUUID() { n += 1; return 'minted-' + n; }`);
const SUPABASE =
  'data:text/javascript,' +
  encodeURIComponent(`export const supabase = {
    auth: { async getSession() { return { data: { session: null }, error: null }; } },
    async rpc(name, args) {
      const h = globalThis.__W2S_RPC__;
      return h ? h(name, args) : { data: null, error: { message: 'no handler' } };
    },
  };`);
const TELEMETRY = 'data:text/javascript,' + encodeURIComponent(`export function trackEvent() {}`);
// Hooks run outside React here: a store's use() is "subscribe, then read".
const REACT =
  'data:text/javascript,' +
  encodeURIComponent(`export function useSyncExternalStore(sub, get) { sub(() => {}); return get(); }
    export function useCallback(fn) { return fn; }
    export default {};`);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (specifier === 'expo-crypto') return { url: CRYPTO, shortCircuit: true };
    if (specifier === 'react') return { url: REACT, shortCircuit: true };
    if (specifier.endsWith('lib/supabase')) return { url: SUPABASE, shortCircuit: true };
    if (specifier.endsWith('telemetry/telemetry')) return { url: TELEMETRY, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const identity = await import('../src/features/account/deviceIdentity.ts');
const singleDevice = await import('../src/features/account/singleDevice.ts');
const draft = await import('../src/features/assess/attemptDraft.ts');
const quiz = await import('../src/features/quiz/api.ts');
const mirror = await import('../src/features/study/localProgress.ts');
const scenarios = await import('../src/features/study/scenarioQueue.ts');
const pace = await import('../src/features/study/paceStore.ts');
const lastLoc = await import('../src/features/study/lastStudyLocation.ts');
const registry = await import('../src/features/storage/localStoreRegistry.ts');
// Optional-called so the R2 run against the hand-rolled files reaches the
// assertion that names the bug, not a missing export.
const resetScenarioQueue = () => (scenarios as { resetLocal?: () => void }).resetLocal?.();
const draftUnreadable = (id: string) =>
  (draft as { isAttemptDraftUnreadable?: (id: string) => boolean }).isAttemptDraftUnreadable?.(id);

const settle = async () => {
  for (let i = 0; i < 40; i++) await Promise.resolve();
  await new Promise<void>((r) => setImmediate(r));
  for (let i = 0; i < 40; i++) await Promise.resolve();
};
function fresh(): void {
  AS.clear();
  g.__W2S_FAIL_READS__ = false;
  g.__W2S_HOLD__ = null;
  g.__W2S_WRITES__ = 0;
  g.__W2S_RPC__ = null;
}
function holdReads(): () => void {
  let release!: () => void;
  g.__W2S_HOLD__ = new Promise<void>((r) => (release = r));
  return () => {
    g.__W2S_HOLD__ = null;
    release();
  };
}
const json = (k: string) => JSON.parse(AS.get(k) ?? 'null') as unknown;
const src = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8');

// ── deviceIdentity (HIGH) ─────────────────────────────────────────────────

test('device id: a read that THREW never mints a new id over the stored one, and never reads as displaced', async () => {
  fresh();
  AS.set('ape:deviceId', 'install-A');
  g.__W2S_FAIL_READS__ = true;
  await assert.rejects(identity.getDeviceId(), identity.DeviceIdUnreadable);
  assert.equal(AS.get('ape:deviceId'), 'install-A', 'a fresh id was written over the install id');
  assert.equal(g.__W2S_WRITES__, 0, 'nothing may be written after a failed read');
  // The foreground guard: the server names another device, ours is unknown.
  g.__W2S_RPC__ = (name: string) => (name === 'get_active_device' ? { data: 'install-B', error: null } : { data: null, error: null });
  assert.equal(await singleDevice.isDisplaced(), false, 'an unreadable id must never sign this device out');
  // The next call reads again and gets the real id.
  g.__W2S_FAIL_READS__ = false;
  assert.equal(await identity.getDeviceId(), 'install-A');
});

// ── attemptDraft (HIGH, graded work) ──────────────────────────────────────

test('exam draft: a read that THREW is never saved over, and later saves MERGE onto the stored answers', async () => {
  fresh();
  const k = 'ape:attemptDraft:att-1';
  AS.set(k, JSON.stringify({ answers: { '0': 'a', '1': 'b', '2': 'c' }, qIdx: 3 }));
  g.__W2S_FAIL_READS__ = true;
  assert.equal(await draft.loadAttemptDraft('att-1'), null, 'the screen starts fresh');
  // The learner answers question one again while storage is still failing.
  const early = await draft.saveAttemptDraft('att-1', { answers: { '0': 'z' }, qIdx: 1 });
  await settle();
  assert.deepEqual(json(k), { answers: { '0': 'a', '1': 'b', '2': 'c' }, qIdx: 3 }, 'a one-answer draft was written over the stored answers');
  assert.equal(early, false, 'the save did not land and must not say so');
  assert.equal(draftUnreadable('att-1'), true);
  // Storage comes back: the next save keeps every stored answer, newest wins per slot.
  g.__W2S_FAIL_READS__ = false;
  assert.equal(await draft.saveAttemptDraft('att-1', { answers: { '0': 'z', '1': 'y' }, qIdx: 2 }), true);
  assert.deepEqual(json(k), { answers: { '0': 'z', '1': 'y', '2': 'c' }, qIdx: 3 });
  // Corrected (evening hunt 2, 2026-10-02): the merged save does NOT clear the
  // screen's "started blind" flag — its in-memory answers still lack slot 2,
  // so the submit's re-read must still run. A load that succeeds clears it.
  assert.equal(draftUnreadable('att-1'), true);
  assert.deepEqual(await draft.loadAttemptDraft('att-1'), { answers: { '0': 'z', '1': 'y', '2': 'c' }, qIdx: 3 });
  assert.equal(draftUnreadable('att-1'), false);
});

test('exam draft: a readable attempt still saves whole, and the clear lands after a queued save', async () => {
  fresh();
  const k = 'ape:attemptDraft:att-2';
  assert.equal(await draft.loadAttemptDraft('att-2'), null);
  void draft.saveAttemptDraft('att-2', { answers: { '0': 'a' }, qIdx: 1 });
  await draft.clearAttemptDraft('att-2');
  await settle();
  assert.equal(AS.has(k), false, 'a save queued before the clear re-created the draft after it');
});

// ── quiz api (HIGH, graded work) ──────────────────────────────────────────

const payload = { attempt_id: 'srv-1', is_practice: false, questions: [], started_at: '2026-10-02T00:00:00Z', time_limit_seconds: 600 };

test('quiz intent: a read that THREW never writes a fresh intent over the stored one', async () => {
  fresh();
  AS.set('ape:quizIntent:topic-a', 'intent-A');
  const sent: unknown[] = [];
  g.__W2S_RPC__ = (_n: string, args: { p_client_attempt_id: string }) => {
    sent.push(args.p_client_attempt_id);
    return { data: payload, error: null };
  };
  g.__W2S_FAIL_READS__ = true;
  await quiz.startQuizAttempt('topic-a'); // the attempt still starts
  assert.equal(AS.get('ape:quizIntent:topic-a'), 'intent-A', 'the stored intent was replaced — the attempt in progress is lost');
  g.__W2S_FAIL_READS__ = false;
  await quiz.startQuizAttempt('topic-a');
  assert.equal(sent[1], 'intent-A', 'the next launch rejoins the stored attempt');
});

test('quiz intent: a start in flight across the account wipe writes nothing for the next user (P3)', async () => {
  fresh();
  g.__W2S_RPC__ = () => ({ data: payload, error: null });
  const release = holdReads();
  const p = quiz.startQuizAttempt('topic-b');
  await settle();
  AS.clear(); // the sweep…
  registry.resetRegisteredLocalStores(); // …then the reset
  release();
  await p;
  assert.equal(AS.has('ape:quizIntent:topic-b'), false, "the departing user's intent was written after the wipe");
});

// ── localProgress (HIGH, study credit mirror) ─────────────────────────────

test('progress mirror: a save MERGES with the stored row (never regresses), and writes nothing when the row cannot be read', async () => {
  fresh();
  const k = 'ape:localMethod:topic-a:scenarios';
  AS.set(k, JSON.stringify({ t1: { known: true, views: 3 } }));
  // Scenarios saves only this session's answers — it never reads the mirror.
  assert.equal(await mirror.saveLocalMethodStates('topic-a', 'scenarios', { t2: { attempts: 1, correct: 1 } }), true);
  const merged = json(k) as Record<string, { known?: boolean; views?: number; attempts?: number }>;
  assert.equal(merged.t1?.known, true, 'the stored row was replaced by one session');
  assert.equal(merged.t1?.views, 3);
  assert.equal(merged.t2?.attempts, 1);
  g.__W2S_FAIL_READS__ = true;
  const before = AS.get(k);
  assert.equal(await mirror.saveLocalMethodStates('topic-a', 'scenarios', { t3: { views: 1 } }), false);
  assert.equal(AS.get(k), before, 'a row that could not be read was written over');
});

test('progress mirror: a save whose read is in flight across the wipe lands nowhere (P3)', async () => {
  fresh();
  const release = holdReads();
  const p = mirror.saveLocalMethodStates('topic-a', 'matching', { t1: { views: 1 } });
  await settle();
  const wipe = mirror.clearAllLocalMethodStates();
  release();
  await wipe;
  assert.equal(await p, false);
  assert.equal(AS.has('ape:localMethod:topic-a:matching'), false, "the departing user's row came back after the wipe");
});

// ── scenarioQueue (HIGH, graded work that replays) ────────────────────────

const ans = (q: string) => ({ kind: 'answer' as const, achievementId: 'a1', questionId: q, round: 1, correct: true, at: 1 });

test('scenario queue: a read that THREW never writes over the queued calls, and nothing is sent ahead of them', async () => {
  fresh();
  resetScenarioQueue();
  AS.set('ape:scenarioQueue', JSON.stringify([ans('q1'), ans('q2')]));
  g.__W2S_FAIL_READS__ = true;
  assert.equal(await scenarios.queueScenarioCall(ans('q3')), false, 'not on the device yet — must not claim it');
  const sent: string[] = [];
  const send = async (i: { questionId?: string }) => {
    sent.push(i.questionId ?? '?');
    return true;
  };
  assert.ok((await scenarios.drainScenarioQueue(send as never)) >= 1, 'an unreadable queue is never "nothing pending"');
  assert.ok((await scenarios.pendingScenarioCount()) >= 1);
  assert.deepEqual(sent, [], 'nothing may be sent while stored calls cannot be seen');
  assert.deepEqual((json('ape:scenarioQueue') as { questionId: string }[]).map((i) => i.questionId), ['q1', 'q2'], 'the stored queue was overwritten');
  // Storage returns: the held call joins the END of the stored queue, in order.
  g.__W2S_FAIL_READS__ = false;
  assert.equal(await scenarios.drainScenarioQueue(send as never), 0);
  assert.deepEqual(sent, ['q1', 'q2', 'q3']);
  assert.equal(AS.has('ape:scenarioQueue'), false);
});

test('scenario queue: a drain stops sending once the account wipe lands mid-drain (P3)', async () => {
  fresh();
  resetScenarioQueue();
  await scenarios.queueScenarioCall(ans('theirs-1'));
  await scenarios.queueScenarioCall(ans('theirs-2'));
  const sent: string[] = [];
  await scenarios.drainScenarioQueue((async (i: { questionId: string }) => {
    sent.push(i.questionId);
    if (sent.length === 1) {
      AS.clear();
      await scenarios.clearScenarioQueue(); // sign-out while the first send is out
    }
    return true;
  }) as never);
  await settle();
  assert.deepEqual(sent, ['theirs-1'], "the departing user's queued call was sent under the next session");
  assert.equal(await scenarios.pendingScenarioCount(), 0);
});

// ── paceStore (MEDIUM) ────────────────────────────────────────────────────

test('pace settings: a read that THREW never writes the defaults over the chosen pace', async () => {
  fresh();
  pace.resetLocal();
  AS.set('ape:pace:matching', JSON.stringify({ enabled: false, preset: 'x2' }));
  g.__W2S_FAIL_READS__ = true;
  pace.usePaceSettings('matching').setEnabled(true);
  await settle();
  assert.deepEqual(json('ape:pace:matching'), { enabled: false, preset: 'x2' }, 'quiz pace was written over the chosen 2× time');
  g.__W2S_FAIL_READS__ = false;
  pace.usePaceSettings('matching'); // the next observation reads again
  await settle();
  assert.deepEqual(json('ape:pace:matching'), { enabled: true, preset: 'x2' }, 'the toggle lands on the stored record');
  assert.deepEqual(pace.usePaceSettings('matching').settings, { enabled: true, preset: 'x2' });
});

test('pace settings: a setter before the read lands is applied to the stored record (P2)', async () => {
  fresh();
  pace.resetLocal();
  AS.set('ape:pace:fill_in_blank', JSON.stringify({ enabled: true, preset: 'x2' }));
  const release = holdReads();
  pace.usePaceSettings('fill_in_blank').setPreset('x3');
  release();
  await settle();
  assert.deepEqual(json('ape:pace:fill_in_blank'), { enabled: true, preset: 'x3' }, 'the early setter switched the timer off');
});

// ── lastStudyLocation (LOW) ───────────────────────────────────────────────

test('last study location: a read that THREW is retried, not "nothing recorded" for the rest of the run', async () => {
  fresh();
  lastLoc.resetLocal();
  AS.set('ape:lastStudyLoc', JSON.stringify({ kind: 'dashboard' }));
  g.__W2S_FAIL_READS__ = true;
  assert.equal(lastLoc.useLastStudyLocation(), null);
  await settle();
  g.__W2S_FAIL_READS__ = false;
  lastLoc.useLastStudyLocation(); // the banner mounts again
  await settle();
  assert.deepEqual(lastLoc.getLastStudyLocation(), { kind: 'dashboard' });
});

test('last study location: a read in flight across the wipe never brings the previous user back (P3)', async () => {
  fresh();
  lastLoc.resetLocal();
  AS.set('ape:lastStudyLoc', JSON.stringify({ kind: 'dashboard' }));
  const release = holdReads();
  lastLoc.getLastStudyLocation();
  AS.clear();
  lastLoc.resetLocal();
  release();
  await settle();
  assert.equal(lastLoc.getLastStudyLocation(), null);
});

// ── the screens (source receipts: React Native cannot load under node) ───

test('Flashcards: one failed pref read no longer fails the topic, and a failed hidden-list read turns its writes off', () => {
  const s = src('screens/study/FlashcardsScreen.tsx');
  assert.match(s, /AsyncStorage\.getItem\(hiddenKey\(achievementId\)\)\.catch\(\(\) => \{\s*if \(alive\) hiddenReadFailed\.current = true;/);
  for (const key of ['SECTIONS_KEY', 'SHOW_MEDIA_KEY', 'SHOW_LINKS_KEY']) {
    assert.match(s, new RegExp(`AsyncStorage\\.getItem\\(${key}\\)\\.catch\\(\\(\\) => null\\)`), key);
  }
  assert.match(s, /const persistHidden = useCallback\(\s*\(next: Set<string>\) => \{\s*if \(hiddenReadFailed\.current\) return;/);
  assert.match(s, /if \(!fsGuideReadFailed\.current\) \{\s*void AsyncStorage\.setItem\('ape:fcFsGuide'/);
});

test('Dashboard: the intro "seen" set is written as a union with the stored set, never over a set it could not read', () => {
  const s = src('screens/dashboard/DashboardScreen.tsx');
  const persist = s.slice(s.indexOf('const persistIntroSeen = useCallback('));
  assert.ok(persist.indexOf("await AsyncStorage.getItem('ape:learnIntrosSeen')") < persist.indexOf("AsyncStorage.setItem('ape:learnIntrosSeen'"));
  assert.match(persist, /\} catch \{\s*return; \/\/ read failed/);
  assert.match(s, /setIntroSeen\(\(prev\) => new Set\(\[\.\.\.\(a as string\[\]\), \.\.\.prev\]\)\)/);
  // The only writer of the key is persistIntroSeen.
  assert.equal(s.split("AsyncStorage.setItem('ape:learnIntrosSeen'").length - 1, 1);
});

test('Awards: a pick is written only from a pick — the unread copy is never written back', () => {
  const s = src('screens/awards/AwardsScreen.tsx');
  assert.match(s, /if \(specCert\) void AsyncStorage\.setItem\(SPEC_CERT_KEY, specCert\)/);
  assert.match(s, /if \(programPath\) void AsyncStorage\.setItem\(PROGRAM_PATH_KEY, programPath\)/);
});

test('Auth: an unreadable install id skips the takeover prompt and the claim (fails open)', () => {
  const s = src('screens/auth/AuthScreen.tsx');
  assert.match(s, /getDeviceId\(\)\.catch\(\(\) => null\)\]\);\s*if \(mine === null\) \{\s*proceed\(\);\s*return;/);
  assert.match(s, /AsyncStorage\.getItem\(DEV_ENTITLEMENT_KEY\)\.catch\(\(\) => null\)/);
});
