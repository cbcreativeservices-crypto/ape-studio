/**
 * GUARD — study-area fixes from "toddler + cat" bug pass 1 of 2026-09-30 (day).
 *
 * The time-trial credit retry is tested behaviourally (the module loads under
 * node with its Supabase / AsyncStorage / sync imports stubbed). The screen
 * fixes are source-reading checks: the screens import React Native, which
 * node --test cannot load.
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE__ = new Map<string, string>();
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('lib/supabase')) {
      return { url: new URL('./_stub-supabase-rpc.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier === './sync') {
      return { url: new URL('./_stub-sync.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier === '@react-native-async-storage/async-storage') {
      return { url: new URL('./_fake-async-storage.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const read = (...p: string[]) => readFileSync(join(process.cwd(), 'src', ...p), 'utf8');

const { startTimeTrial, registerTrialAnswer, resetTimeTrials, TIME_TRIAL_NEEDED, TIME_TRIAL_SECONDS } = await import(
  '../src/features/study/timeTrial.ts'
);

const settle = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

/** Run one PASSED trial to 0:00 with every credit call answered by `reply`. */
async function passTrial(reply: (n: number) => { error: unknown }): Promise<{ calls: () => number }> {
  let calls = 0;
  (globalThis as Record<string, unknown>).__RPC__ = (name: string) => {
    assert.equal(name, 'credit_time_trial');
    calls += 1;
    return { data: null, ...reply(calls) };
  };
  startTimeTrial('matching', 'topic-a');
  for (let i = 0; i < TIME_TRIAL_NEEDED; i++) registerTrialAnswer('matching', true, 'topic-a');
  mock.timers.tick(TIME_TRIAL_SECONDS * 1000 + 1000);
  await settle();
  return { calls: () => calls };
}

test('time trial: a pass whose credit call fails is retried until it lands', async () => {
  mock.timers.enable({ apis: ['setInterval', 'setTimeout', 'Date'] });
  try {
    const t = await passTrial((n) => ({ error: n < 3 ? { message: 'fetch failed' } : null }));
    assert.equal(t.calls(), 1, 'credited once at 0:00');
    mock.timers.tick(5_000);
    await settle();
    assert.equal(t.calls(), 2, 'first retry');
    mock.timers.tick(15_000);
    await settle();
    assert.equal(t.calls(), 3, 'second retry lands');
    mock.timers.tick(10 * 60_000);
    await settle();
    assert.equal(t.calls(), 3, 'nothing more once it has landed');
  } finally {
    resetTimeTrials();
    mock.timers.reset();
  }
});

test('time trial: retries are bounded', async () => {
  mock.timers.enable({ apis: ['setInterval', 'setTimeout', 'Date'] });
  try {
    const t = await passTrial(() => ({ error: { message: 'not_enrolled' } }));
    for (let i = 0; i < 20; i++) {
      mock.timers.tick(300_000);
      await settle();
    }
    assert.ok(t.calls() <= 6, `expected a bounded number of attempts, got ${t.calls()}`);
  } finally {
    resetTimeTrials();
    mock.timers.reset();
  }
});

test('time trial: an account wipe cancels a pending credit retry', async () => {
  mock.timers.enable({ apis: ['setInterval', 'setTimeout', 'Date'] });
  try {
    const t = await passTrial(() => ({ error: { message: 'fetch failed' } }));
    assert.equal(t.calls(), 1);
    resetTimeTrials(); // sign-out / account switch
    for (let i = 0; i < 20; i++) {
      mock.timers.tick(300_000);
      await settle();
    }
    assert.equal(t.calls(), 1, 'a retry must never land under the next account');
  } finally {
    resetTimeTrials();
    mock.timers.reset();
  }
});

test('Dashboard: offline-replay notices only when focused and not in Low-Light', () => {
  const src = read('screens', 'dashboard', 'DashboardScreen.tsx');
  assert.match(
    src,
    /const replayOk = !popupOpenRef\.current && navigation\.isFocused\(\) && !areOverlaysSuppressed\(\);/,
  );
});

test('Dashboard: the credential celebration never auto-opens in Low-Light', () => {
  const src = read('screens', 'dashboard', 'DashboardScreen.tsx');
  const at = src.indexOf('void checkCredentials()');
  const gate = src.lastIndexOf('if (areOverlaysSuppressed()) return undefined;', at);
  assert.ok(at > 0 && gate > 0 && at - gate < 600, 'the check must bail before it runs in Low-Light');
  const nav = src.indexOf("navigate('Celebration'", at);
  const late = src.indexOf('areOverlaysSuppressed()', at);
  assert.ok(late > at && late < nav, 're-checked when the read answers, before navigating');
});

test('Flashcards: Android BACK closes the FILTERS popup / linked term before leaving', () => {
  const src = read('screens', 'study', 'FlashcardsScreen.tsx');
  assert.match(src, /BackHandler\.addEventListener\('hardwareBackPress'/);
  // closeLinkedTerm (night pass 1, 2026-10-01) = setLinkedTerm(null) + cancel
  // any in-flight list fetch so it cannot reopen the viewer.
  assert.match(src, /if \(linkedTerm\) closeLinkedTerm\(\);\s*else setFiltersOpen\(false\);\s*return true;/);
  // A hook — it must sit above the early returns.
  assert.ok(src.indexOf("BackHandler.addEventListener('hardwareBackPress'") < src.indexOf('if (error) {'));
});

test('Trophy Gallery + Topics: a failed refetch keeps the trophies on screen', () => {
  const gallery = read('screens', 'achievements', 'GalleryScreen.tsx');
  assert.match(gallery, /if \(entriesRef\.current && entriesRef\.current\.length > 0\) return;\s*setEntries\(\[\]\);/);
  const topics = read('screens', 'achievements', 'TopicsScreen.tsx');
  assert.match(topics, /if \(fieldsRef\.current && fieldsRef\.current\.length > 0\) return;\s*setFields\(\[\]\);/);
});

test('Quiz: a stale "Submit failed" OK does not pop the Results that replaced it', () => {
  const src = read('screens', 'quiz', 'QuizScreen.tsx');
  const at = src.indexOf("'Submit failed',");
  const guard = src.indexOf('if (mountedRef.current) safeGoBack(navigation);', at);
  assert.ok(at > 0 && guard > at && guard - at < 1200);
});

test("Scenarios: only the latest round's save reply sets the saved flag", () => {
  const src = read('screens', 'study', 'ScenariosScreen.tsx');
  assert.match(src, /const token = \+\+roundSaveTokenRef\.current;/);
  // Wave 3 (2026-10-02): the same token also gates the "kept on this device" flag.
  assert.match(src, /if \(token === roundSaveTokenRef\.current\) \{\s*setRoundSaved\(saved\);/);
});
