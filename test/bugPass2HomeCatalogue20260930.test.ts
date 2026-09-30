/**
 * Bug pass 2 of 3 (2026-09-30 day) — HOME & CATALOGUE area ("toddler + cat").
 *
 * homeCardsStore is driven for real (fake AsyncStorage); the screens are
 * source-read, since RN screens do not load under node:test.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const store = new Map<string, string>();
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') {
      return { url: new URL('./_fake-async-storage.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE__ = store;

const home = await import('../src/features/home/homeCardsStore.ts');

const settle = () => new Promise<void>((r) => setImmediate(r));
const saved = () => JSON.parse(store.get('ape:homeCards') ?? '[]') as number[];

test('a write before the saved Home list loads is applied ON TOP of it, not over it', async () => {
  store.clear();
  store.set('ape:homeCards', JSON.stringify([11, 22]));
  home.resetLocal();
  // The Enrollments core-slot effect runs on first mount, before hydrate lands.
  home.ensureHome(33);
  await settle();
  assert.deepEqual(home.getHomeGs(), [11, 22, 33]);
  assert.deepEqual(saved(), [11, 22, 33], 'a partial list was saved over the real one');
});

test('removeHome before hydrate removes from the loaded list', async () => {
  store.clear();
  store.set('ape:homeCards', JSON.stringify([11, 22]));
  home.resetLocal();
  home.removeHome(11);
  await settle();
  assert.deepEqual(home.getHomeGs(), [22]);
  assert.deepEqual(saved(), [22]);
});

test('resetLocal during an in-flight hydrate: the old account list does not come back', async () => {
  store.clear();
  store.set('ape:homeCards', JSON.stringify([11, 22]));
  home.resetLocal();
  home.getHomeGs(); // starts a hydrate that reads [11, 22]
  store.clear(); // account wipe clears storage…
  home.resetLocal(); // …and the in-memory caches
  await settle();
  assert.deepEqual(home.getHomeGs(), []);
  await settle();
  assert.deepEqual(home.getHomeGs(), [], 'the stale hydrate landed after the reset');
});

const src = (p: string) => readFileSync(p, 'utf8');

test('credential + topic popups and the art viewer are DimModal hosts', () => {
  for (const f of [
    'src/screens/awards/CredentialDetailModal.tsx',
    'src/screens/awards/CredentialThumb.tsx',
    'src/screens/curriculum/TopicDetailModal.tsx',
  ]) {
    const s = src(f);
    assert.match(s, /import \{ Modal \} from '\.\.\/\.\.\/components\/DimModal';/, f);
    assert.doesNotMatch(s, /import \{[^}]*\bModal\b[^}]*\} from 'react-native'/, `${f} still uses the raw RN Modal`);
    assert.doesNotMatch(s, /<LowLightDim \/>/, `${f} double-mounts the wash DimModal already provides`);
  }
});

test('Topic popup: a double tap on the enrol box does not enrol-then-remove', () => {
  const s = src('src/screens/curriculum/TopicDetailModal.tsx');
  assert.match(s, /const ACK_REPEAT_MS = \d+;/);
  const i = s.indexOf('lastAckAt.current = now;');
  const j = s.indexOf('if (topic) onEnrollTopic?.(topic.gs);');
  assert.ok(i > 0 && j > i, 'onEnrollTopic must run after the repeat guard');
});

test('Enrollments browse: a double tap on a topic row does not add-then-remove', () => {
  const s = src('src/screens/enrollment/EnrollmentScreen.tsx');
  const i = s.indexOf('lastRowTap.current = { gs, at: now };');
  const j = s.indexOf('toggleTopic(gs);');
  assert.ok(i > 0 && j > i, 'toggleTopic must run after the per-row repeat guard');
  assert.match(s, /lastRowTap\.current\.gs === gs && now - lastRowTap\.current\.at < BULK_REPEAT_MS/);
});
