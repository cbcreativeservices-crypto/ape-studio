/**
 * Pattern hunt phase 2, wave 3 — P6 "silent success" (closer G7 of
 * docs/bughunt/PATTERN_CATALOG_2026_10_02.md): a "Saved" / "credited" / "✓"
 * that is shown when the write failed or never ran.
 *
 * The shared piece is the wave-2 safe store's rule — writers answer
 * `Promise<boolean>`, true only when the device accepted the write — carried
 * to the sites that still claimed success off their own bat:
 *
 *   • the eight live tools' "SAVED ✓" (9 handlers): flipped on the next line
 *     whatever saveMeasurement answered — and the two account-switch fences in
 *     the store answered false in SILENCE (the thrown-write path was already
 *     said). Now the badge comes from a true result and both fences report.
 *   • Career Finder beta feedback: "Saved on this device" under the form
 *     whatever happened to the write (`void setItem(…).catch(() => {})`).
 *   • Settings: a save that RECOVERED from a failed read laid only the changed
 *     field over the stored record, while the screen kept showing defaults for
 *     every untouched row. The save answers the written copy; the screen shows it.
 *   • Scenarios: "Your answers are saved on this device" when the device had
 *     refused the queue write (held in memory only). The queue write result
 *     now reaches the report.
 *   • scenarioHomework: an answer whose network call was out when the account
 *     wipe landed was queued under the NEXT account — the queue's generation is
 *     captured at the call.
 *   • masteringProgress: the generation fence drumProgress got in wave 2.
 *   • Quiz / Final Exam: a draft that could not be read at the start is read
 *     once more before the paper goes, and its answers fill the unanswered slots.
 *
 * R2: the behavioural tests were run against copies of scenarioHomework.ts /
 * masteringProgress.ts from before this change and FAILED (the report records
 * it); the source receipts fail against the pre-change screens.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join, relative, sep } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__P6_AS__ = AS;
g.__P6_FAIL_READS__ = false;
g.__P6_FAIL_WRITES__ = false;
g.__P6_HOLD__ = null;
g.__RPC__ = async () => ({ data: null, error: { message: 'offline' } });
(globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;

const STUBS: Record<string, string> = {
  'p6-stub:async-storage': `const s = globalThis.__P6_AS__;
    export default {
      async getItem(k) {
        if (globalThis.__P6_FAIL_READS__) throw new Error('storage read failed');
        const v = s.has(k) ? s.get(k) : null;
        const h = globalThis.__P6_HOLD__; if (h) await h;
        return v;
      },
      async setItem(k, v) { if (globalThis.__P6_FAIL_WRITES__) throw new Error('storage write failed'); s.set(k, String(v)); },
      async removeItem(k) { s.delete(k); },
      async multiRemove(ks) { for (const k of ks) s.delete(k); },
      async getAllKeys() { return [...s.keys()]; },
    };`,
  'p6-stub:supabase': `export const supabase = {
    async rpc(name, args) { return globalThis.__RPC__(name, args); },
    auth: { async getSession() { return { data: { session: null } }; } },
  };`,
  'p6-stub:sync': `export function emitStudyProgress() {}`,
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'p6-stub:async-storage', shortCircuit: true };
    if (/\/lib\/supabase$/.test(specifier)) return { url: 'p6-stub:supabase', shortCircuit: true };
    if (specifier === './sync' && context.parentURL?.includes('scenarioHomework')) return { url: 'p6-stub:sync', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      for (const ext of ['.ts', '.tsx', '/index.ts']) {
        const candidate = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url in STUBS) return { format: 'module', shortCircuit: true, source: STUBS[url] };
    return nextLoad(url, context);
  },
});

const homework = await import('../src/features/study/scenarioHomework.ts');
const queue = await import('../src/features/study/scenarioQueue.ts');
const mastering = await import('../src/screens/lab/mastering/masteringProgress.ts');
const registry = await import('../src/features/storage/localStoreRegistry.ts');

const SRC = fileURLToPath(new URL('../src', import.meta.url));
const read = (p: string) => readFileSync(join(SRC, p), 'utf8').replace(/\r\n/g, '\n');
const settle = async (n = 6) => {
  for (let i = 0; i < n; i++) await new Promise<void>((r) => setImmediate(r));
};
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}
const fresh = () => {
  AS.clear();
  g.__P6_FAIL_READS__ = false;
  g.__P6_FAIL_WRITES__ = false;
  g.__P6_HOLD__ = null;
  queue.resetLocal();
  mastering.setMasteringSaveBlocked(false);
};

// ── scenarioHomework: the generation is captured at the call ────────────────

describe('scenarioHomework — an answer out over the network when the wipe lands is not queued under the next account', () => {
  it('recordScenarioAnswer: the wipe during the RPC drops the answer (false) and queues nothing', async () => {
    fresh();
    const rpc = deferred<{ data: unknown; error: unknown }>();
    g.__RPC__ = () => rpc.promise;
    const p = homework.recordScenarioAnswer('a1', 'q1', 1, true);
    await settle();
    queue.resetLocal(); // the account wipe reaches the queue's store
    rpc.resolve({ data: null, error: { message: 'offline' } });
    assert.equal(await p, false);
    assert.equal(await homework.pendingScenarioCount(), 0, 'the departing learner\'s answer was queued for the next account');
  });
  it('control: without a wipe the failed send is queued and reported kept (true)', async () => {
    fresh();
    g.__RPC__ = async () => ({ data: null, error: { message: 'offline' } });
    assert.equal(await homework.recordScenarioAnswer('a1', 'q1', 1, true), true);
    assert.equal(await homework.pendingScenarioCount(), 1);
  });
  it('a sent answer is true; a queue write the device refused is false (held in memory only)', async () => {
    fresh();
    g.__RPC__ = async () => ({ data: null, error: null });
    assert.equal(await homework.recordScenarioAnswer('a1', 'q1', 1, true), true);
    g.__RPC__ = async () => ({ data: null, error: { message: 'offline' } });
    g.__P6_FAIL_WRITES__ = true;
    assert.equal(await homework.recordScenarioAnswer('a1', 'q2', 1, true), false, 'a refused queue write must not read as kept');
  });
  it('completeScenarioRound: the wipe during the RPC answers saved:false, queued:false and queues nothing', async () => {
    fresh();
    const rpc = deferred<{ data: unknown; error: unknown }>();
    g.__RPC__ = () => rpc.promise;
    const p = homework.completeScenarioRound('a1', 2);
    await settle();
    queue.resetLocal();
    rpc.resolve({ data: 0, error: null });
    assert.deepEqual(await p, { roundsCompleted: 2, saved: false, queued: false });
    assert.equal(await homework.pendingScenarioCount(), 0);
  });
  it('completeScenarioRound: a server miss that the device KEPT says queued:true; a refused queue write says queued:false', async () => {
    fresh();
    g.__RPC__ = async () => ({ data: 0, error: null });
    assert.deepEqual(await homework.completeScenarioRound('a1', 1), { roundsCompleted: 1, saved: false, queued: true });
    fresh();
    g.__P6_FAIL_WRITES__ = true;
    assert.deepEqual(await homework.completeScenarioRound('a1', 1), { roundsCompleted: 1, saved: false, queued: false });
  });
});

// ── masteringProgress: the generation fence ─────────────────────────────────

describe('masteringProgress — a generation fence across the account wipe (P3, the drumProgress rule)', () => {
  const KEY = 'ape:mastering:v1';
  it("an update tapped under the departing account never writes that account's copy back after the wipe", async () => {
    fresh();
    AS.set(KEY, JSON.stringify({ modules: { what: { done: true, answers: {} } }, lastStep: 2 }));
    const hold = deferred<void>();
    g.__P6_HOLD__ = hold.promise;
    const p = mastering.updateMasteringProgress((s) => {
      s.lastStep = 5;
    });
    await settle();
    AS.delete(KEY); // the sweep…
    registry.resetRegisteredLocalStores(); // …then every registered store's reset
    g.__P6_HOLD__ = null;
    hold.resolve();
    const s = await p;
    await settle();
    assert.equal(AS.get(KEY), undefined, "the departing account's mastering record was written back after the wipe");
    assert.equal(mastering.masteringReadFromStore(s), false, 'a wiped-under read is not shown as the stored copy');
  });
  it('a plain update still saves, and a failed read is still never written over (behaviour kept)', async () => {
    fresh();
    AS.set(KEY, JSON.stringify({ modules: {}, lastStep: 2 }));
    await mastering.updateMasteringProgress((s) => {
      s.lastStep = 7;
    });
    assert.equal(JSON.parse(AS.get(KEY)!).lastStep, 7);
    g.__P6_FAIL_READS__ = true;
    await mastering.updateMasteringProgress((s) => {
      s.lastStep = 9;
    });
    assert.equal(JSON.parse(AS.get(KEY)!).lastStep, 7);
  });
  it('is registered with the account wipe and the ledger writer carries the fence', () => {
    const s = read('screens/lab/mastering/masteringProgress.ts');
    assert.match(s, /registerLocalStoreReset\(\(\) => \{\s*generation\+\+;\s*\}\);/);
    const writer = s.slice(s.indexOf('registerSessionCarry<MasteringProgressState>(CARRY_KEY'));
    assert.match(writer, /const gen = generation;[\s\S]*?if \(unreadable\.has\(stored\) \|\| gen !== generation\) return false;/);
  });
});

// ── the screens (React Native — receipts by source) ─────────────────────────

const TOOLS = ['Rt60Screen', 'SplMeterScreen', 'RtaScreen', 'SpectrogramScreen', 'WaveformScreen', 'FrequencyCounterScreen', 'MultiMeterScreen'];

describe('the live tools: SAVED ✓ only from a true saveMeasurement result', () => {
  for (const t of TOOLS) {
    it(`${t}: every save handler gates the badge on the write result`, () => {
      const s = read(`screens/tools/${t}.tsx`);
      const saves = s.match(/void saveMeasurement\(\{/g)?.length ?? 0;
      const gated = s.match(/\}\)\.then\(\(ok\) => \{[^}]*?if \(!ok\) return;\s*setJustSaved\(true\);/g)?.length ?? 0;
      assert.ok(saves > 0, `${t}: has a save`);
      assert.equal(gated, saves, `${t}: a SAVED ✓ is flipped without the write result`);
      assert.doesNotMatch(s, /\}\);\n\s*setJustSaved\(true\);/, `${t}: setJustSaved(true) right after a fire-and-forget save`);
    });
  }
  it('the store SAYS a save refused by an account switch (both fences), not only a thrown write', () => {
    const s = read('features/tools/measure/measurementStore.ts');
    const save = s.slice(s.indexOf('export function saveMeasurement('), s.indexOf('export function updateMeasurement') > 0 ? s.indexOf('export function updateMeasurement') : undefined);
    assert.match(save, /if \(wipesRunning > 0\) \{\s*refusedBySwitch\(\);/);
    assert.match(save, /if \(gen !== generation\) \{\s*refusedBySwitch\(\);\s*return false;/);
    assert.match(save, /const refusedBySwitch = \(\) =>\s*reportSaveFailure\?\.\(/);
  });
});

describe('Career Finder beta feedback: "Saved on this device" only when it was', () => {
  it('the store answers the write (false while the record could not be read, false for a refused write)', () => {
    const s = read('features/careerfinder/store.ts');
    // 2026-10-03: a refused write also raises the shared failed-save notice
    // (unless the caller says it itself) — the answer is unchanged.
    assert.match(s, /function persist\(next: FinderRecord, report = true\): Promise<boolean> \{[\s\S]*?if \(readFailed\) return Promise\.resolve\(false\);\s*return AsyncStorage\.setItem\(KEY, JSON\.stringify\(next\)\)\.then\(\s*\(\) => true,\s*\(\) => \{[\s\S]*?return false;\s*\},?\s*\);/);
    assert.match(s, /export function setCareerFinderFeedback\(answer: FeedbackAnswer, note = '', report = false\): Promise<boolean> \{\s*return act\(/);
    assert.match(s, /function act\(fn: \(\) => Promise<boolean> \| void\): Promise<boolean>/);
  });
  it('the screen words the result', () => {
    const s = read('screens/careerfinder/CareerFinderResultsScreen.tsx');
    assert.match(s, /const \[fbUnsaved, setFbUnsaved\] = useState\(false\);/);
    assert.match(s, /setCareerFinderFeedback\(answer, text\)\.then\(\(ok\) => setFbUnsaved\(!ok\), \(\) => setFbUnsaved\(true\)\)/);
    assert.match(s, /\{fbUnsaved \? 'This device could not save your feedback[^']*' : 'Saved on this device\./);
    assert.match(s, /const keepFeedback = \(answer: FeedbackAnswer, text: string\) =>/);
    assert.equal((s.match(/void keepFeedback\(/g) ?? []).length, 2, 'the answer tap and the note blur both go through it');
  });
});

describe('Settings: a save that recovered from a failed read shows what was written', () => {
  it('saveLocalSettings answers the written copy when it differs from what was asked', () => {
    const s = read('features/settings/store.ts');
    assert.match(s, /export async function saveLocalSettings\(s: LocalSettings, unreadShown\?: LocalSettings\): Promise<LocalSettings \| null> \{/);
    assert.match(s, /s = applyChanges\(parseStored\(raw\), shown, s\);\s*recovered = true;/);
    assert.match(s, /requestLocalNotifSync\(s\);\s*return recovered \? s : null;\s*\}/);
  });
  it('the screen refreshes its local state from it (all three setters)', () => {
    const s = read('screens/settings/SettingsScreen.tsx');
    assert.equal((s.match(/void saveLocalSettings\(next, unreadShown\(\)\)\.then\(\(written\) => \{\s*if \(written\) setLocal\(written\);/g) ?? []).length, 3);
  });
});

describe('Scenarios: "saved on this device" only when the device kept the round', () => {
  const s = read('screens/study/ScenariosScreen.tsx');
  it('the answer and the round results reach the report', () => {
    assert.match(s, /void recordScenarioAnswer\(achievementId, item\.id, activeRound, correct\)\.then\(\(kept\) => \{\s*if \(!kept\) answerUnkeptRef\.current = true;/);
    assert.match(s, /\.then\(\(\{ roundsCompleted, saved, queued \}\) => \{/);
    assert.match(s, /setRoundKept\(saved \|\| \(queued !== false && answersKept\)\);/);
  });
  it('the report has an honest line for a round the device could not keep, and the old line otherwise', () => {
    assert.match(s, /\{roundSaved === false && !roundKept \? \(/);
    assert.match(s, /this device could not keep them for a\s*retry/);
    assert.match(s, /\) : roundSaved === false \? \(\s*<Text style=\{styles\.reportUnsaved\}>\s*Your answers are saved on this device but haven’t reached your account yet\./);
  });
});

describe('Quiz / Final Exam: a draft unreadable at the start is read once more before the paper goes', () => {
  for (const f of ['screens/quiz/QuizScreen.tsx', 'screens/exam/FinalExamScreen.tsx']) {
    it(f, () => {
      const s = read(f);
      assert.match(s, /import \{ clearAttemptDraft, isAttemptDraftUnreadable, loadAttemptDraft, saveAttemptDraft \}/);
      const submit = s.slice(s.indexOf('const doSubmit = useCallback('));
      const retry = submit.indexOf('if (isAttemptDraftUnreadable(payload.attempt_id)) {');
      assert.ok(retry > 0 && retry < submit.indexOf('const submittedAt ='), 'the re-read runs before the paper is built');
      assert.match(submit, /const stored = await loadAttemptDraft\(payload\.attempt_id\);\s*if \(stored\) answers\.current = \{ \.\.\.\(stored\.answers as Record<string, AnswerValue>\), \.\.\.answers\.current \};/);
    });
  }
});

// ── the ratchet (G7) ────────────────────────────────────────────────────────

const SAVED_CLAIM = /SAVED ✓|'Saved|"Saved|Saved on this|saved on this device|Saved to/;
const VOID_WRITE = /void AsyncStorage\.(setItem|multiSet)\(/;

/** Files that render a saved-style claim AND have a fire-and-forget storage
 *  write, each with why the claim is still honest. May only shrink. */
const CLAIM_BESIDE_VOID_WRITE: Record<string, string> = {
  'features/storage/localStore.ts': 'the helper: its doc comment uses the word; the void write is the damaged-blob set-aside, never the value',
  'screens/glossary/GlossaryScreen.tsx': '"Saved on this phone" is an offline-cache COUNT from a read; the void writes are view preferences nobody is told about',
  'screens/tools/SplMeterScreen.tsx': 'the void multiSet is the full-screen brightness preference; SAVED ✓ is gated on saveMeasurement\'s result (tested above)',
};

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

describe('RATCHET G7 — a "Saved" claim comes only from a write result', () => {
  const files = walk(SRC).map((p) => [relative(SRC, p).split(sep).join('/'), readFileSync(p, 'utf8').replace(/\r\n/g, '\n')] as const);
  it('no new file renders a saved claim beside a fire-and-forget storage write', () => {
    const hits = files.filter(([, s]) => SAVED_CLAIM.test(s) && VOID_WRITE.test(s)).map(([f]) => f);
    const fresh = hits.filter((f) => !(f in CLAIM_BESIDE_VOID_WRITE));
    assert.deepEqual(fresh, [], `saved claim beside a void write: ${fresh.join(', ')} — gate the claim on the write result`);
    const stale = Object.keys(CLAIM_BESIDE_VOID_WRITE).filter((f) => !hits.includes(f));
    assert.deepEqual(stale, [], `remove from CLAIM_BESIDE_VOID_WRITE: ${stale.join(', ')}`);
  });
  it('every setJustSaved(true) / setResultSaved(true) in src/ sits behind a write-result check', () => {
    const bad: string[] = [];
    for (const [f, s] of files) {
      const re = /set(JustSaved|ResultSaved)\(true\)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(s))) {
        const before = s.slice(Math.max(0, m.index - 260), m.index);
        if (!/if \(!ok\) return;|if \(ok\)|\.then\(\(ok\) =>/.test(before)) bad.push(`${f}:${s.slice(0, m.index).split('\n').length}`);
      }
    }
    assert.deepEqual(bad, [], `a saved badge flipped without a write result: ${bad.join(', ')}`);
  });
});
