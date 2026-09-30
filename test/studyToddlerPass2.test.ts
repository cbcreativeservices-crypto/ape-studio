/**
 * GUARD — study-area fixes from "toddler + cat" bug pass 2 of 2026-09-30 (day).
 *
 * The store races are tested behaviourally: AsyncStorage is replaced by an
 * in-memory fake whose reads can be HELD, so a hydrate can be caught mid-read
 * while the account wipe (`resetLocal`) runs. The screen fixes are
 * source-reading checks — the screens import React Native, which node --test
 * cannot load.
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__AS__ = AS;
g.__AS_HOLD__ = null;

// AsyncStorage whose getItem READS NOW but answers only once
// globalThis.__AS_HOLD__ (when set) resolves — a read already in flight.
const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__AS__;
     export default {
       async getItem(k) { const v = s.has(k) ? s.get(k) : null; const h = globalThis.__AS_HOLD__; if (h) await h; return v; },
       async setItem(k, v) { s.set(k, v); },
       async removeItem(k) { s.delete(k); },
     };`,
  );

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (specifier.endsWith('lib/supabase')) {
      return { url: new URL('./_stub-supabase-rpc.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier === './sync') {
      return { url: new URL('./_stub-sync.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const read = (...p: string[]) => readFileSync(join(process.cwd(), 'src', ...p), 'utf8');
const settle = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
};

/** Hold every AsyncStorage read until the returned release() is called. */
function holdReads(): () => void {
  let release!: () => void;
  g.__AS_HOLD__ = new Promise<void>((r) => (release = r));
  return () => {
    g.__AS_HOLD__ = null;
    release();
  };
}

test('enrollment: a hydrate in flight across resetLocal never restores the previous user', async () => {
  AS.clear();
  AS.set('ape:enrollmentList', JSON.stringify([{ gs: 4242, favorite: true, active: true }]));
  AS.set('ape:enrollmentSeeded5', '1'); // no seeding → no server-sync timer
  const release = holdReads();
  const store = await import('../src/features/enrollment/enrollmentStore.ts');
  store.getEnrollment(); // starts the hydrate; its read is now held
  // Account wipe lands while the read is in flight.
  AS.clear();
  AS.set('ape:enrollmentSeeded5', '1');
  store.resetLocal();
  release();
  await settle();
  assert.ok(!store.getEnrollment().some((e) => e.gs === 4242), "the departed user's list came back");
  await settle();
  assert.ok(!store.getEnrollment().some((e) => e.gs === 4242), 'still clean after the fresh hydrate');
});

test('enrollment: resetLocal re-hydrates for mounted hooks', () => {
  const src = read('features', 'enrollment', 'enrollmentStore.ts');
  const at = src.indexOf('export function resetLocal()');
  const body = src.slice(at, src.indexOf('\n}\n', at));
  assert.match(body, /generation\+\+;/);
  assert.match(body, /if \(listeners\.size > 0\) void hydrate\(\);/);
});

test('deck order: a module-load hydrate in flight across resetLocal does not restore the old deck', async () => {
  AS.clear();
  AS.set('ape:deckOrder', JSON.stringify({ mode: 'custom', order: ['a', 'b'], removed: ['c'] }));
  const release = holdReads();
  const store = await import('../src/features/dashboard/deckOrderStore.ts'); // hydrates at import
  AS.clear();
  store.resetLocal();
  release();
  await settle();
  const p = store.getDeckPrefs();
  assert.equal(p.mode, 'alpha');
  assert.deepEqual(p.removed, []);
});

test('enrolled bundles: a hydrate in flight across resetLocal does not restore old bundles', async () => {
  AS.clear();
  AS.set('ape:enrolledBundles', JSON.stringify([{ key: 'cert:X', kind: 'cert', name: 'X', topics: [1], loaded: true }]));
  const release = holdReads();
  const store = await import('../src/features/enrollment/enrolledBundlesStore.ts');
  store.getBundles();
  AS.clear();
  store.resetLocal();
  release();
  await settle();
  assert.deepEqual(store.getBundles(), []);
});

test('last study location: resetLocal fences an in-flight hydrate', () => {
  const src = read('features', 'study', 'lastStudyLocation.ts');
  assert.match(src, /const gen = generation;/);
  assert.match(src, /if \(gen !== generation\) return;/);
  assert.match(src, /export function resetLocal\(\): void \{\s*generation\+\+;/);
});

test('time trial: a credit call in flight during the wipe does not arm a retry for the next account', async () => {
  mock.timers.enable({ apis: ['setInterval', 'setTimeout', 'Date'] });
  const tt = await import('../src/features/study/timeTrial.ts');
  try {
    let calls = 0;
    let answer!: (v: { data: null; error: { message: string } }) => void;
    g.__RPC__ = () => {
      calls += 1;
      return new Promise((r) => (answer = r));
    };
    tt.startTimeTrial('matching', 'topic-a');
    for (let i = 0; i < tt.TIME_TRIAL_NEEDED; i++) tt.registerTrialAnswer('matching', true, 'topic-a');
    mock.timers.tick(tt.TIME_TRIAL_SECONDS * 1000 + 1000);
    await settle();
    assert.equal(calls, 1, 'credited at 0:00');
    tt.resetTimeTrials(); // sign-out while the call is still out
    answer({ data: null, error: { message: 'JWT expired' } });
    for (let i = 0; i < 20; i++) {
      mock.timers.tick(300_000);
      await settle();
    }
    assert.equal(calls, 1, 'no retry may land under the next account');
  } finally {
    tt.resetTimeTrials();
    mock.timers.reset();
  }
});

test('Celebration: one exit per screen — a double tap cannot reset the shell twice', () => {
  const src = read('screens', 'results', 'CelebrationScreen.tsx');
  assert.match(src, /const leavingRef = useRef\(false\);/);
  assert.match(src, /if \(leavingRef\.current\) return;\s*leavingRef\.current = true;\s*switch \(kind\)/);
});

test('Topic deck: quick ↑/↓ taps build on the order the last tap produced', () => {
  const src = read('screens', 'dashboard', 'TopicDeckSheet.tsx');
  assert.match(src, /prev && prev\.src === active \? \[\.\.\.prev\.ids\] : active\.map/);
  assert.match(src, /lastOrderRef\.current = \{ src: active, ids \};\s*onReorder\(ids\);/);
});

test('Flashcards + Dashboard: their Modals are DimModal hosts, not raw react-native', () => {
  for (const f of [['screens', 'study', 'FlashcardsScreen.tsx'], ['screens', 'dashboard', 'DashboardScreen.tsx']]) {
    const src = read(...f);
    assert.match(src, /import \{ Modal \} from '\.\.\/\.\.\/components\/DimModal';/, f.join('/'));
    const rn = src.match(/import \{[^}]*\} from 'react-native';/g) ?? [];
    assert.ok(!rn.some((l) => /\bModal\b/.test(l)), `${f.join('/')} still imports Modal from react-native`);
    assert.ok(!/<LowLightDim\s*\/>/.test(src), `${f.join('/')} hand-mounts a second wash`);
  }
});

test('Credential wall: a double tap on DOWNLOAD starts one export', () => {
  const src = read('screens', 'achievements', 'CredentialWall.tsx');
  assert.match(src, /if \(!open \|\| exportingRef\.current\) return;\s*exportingRef\.current = true;/);
});
