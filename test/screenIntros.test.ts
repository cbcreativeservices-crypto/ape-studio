/**
 * Screen intro registry (src/features/intro/screenIntros.ts) — copy honesty.
 *
 * The registry mixes RATIFIED copy (placeholder:false — real users read it)
 * with placeholder drafts (the overlay shows a PLACEHOLDER badge). These tests
 * pin the boundary between the two so neither can silently cross it:
 *  - finalized entries must carry real, non-empty copy with no leftover
 *    "PLACEHOLDER" text (a governance breach if it ships),
 *  - entries still in placeholder state must SAY so in their body, matching
 *    the badge the overlay renders,
 *  - the Settings "reset onboarding hints" sweep clears exactly the
 *    `ape:intro:` namespace and nothing else.
 */
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

// screenIntros imports AsyncStorage at module scope — stub it in-memory.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@react-native-async-storage/async-storage')
      return { url: 'ape-test:async-storage', shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === 'ape-test:async-storage') {
      return {
        format: 'module',
        shortCircuit: true,
        source: `
          const mem = new Map();
          globalThis.__apeStorage = mem;
          export default {
            async getItem(k) { return mem.has(k) ? mem.get(k) : null; },
            async setItem(k, v) { mem.set(k, String(v)); },
            async removeItem(k) { mem.delete(k); },
            async getAllKeys() { return [...mem.keys()]; },
            async multiRemove(ks) { for (const k of ks) mem.delete(k); },
          };
        `,
      };
    }
    return next(url, context);
  },
});

const { SCREEN_INTROS, INTRO_STORAGE_PREFIX, resetScreenIntros } = await import(
  '../src/features/intro/screenIntros.ts'
);

const mem = (): Map<string, string> => (globalThis as { __apeStorage?: Map<string, string> }).__apeStorage!;

const entries = Object.entries(SCREEN_INTROS) as [
  string,
  { title: string; body: string; placeholder?: boolean; button?: string },
][];

test('the registry has entries and every one carries a non-empty title', () => {
  assert.ok(entries.length > 0);
  for (const [key, e] of entries) {
    assert.ok(e.title.trim().length > 0, `${key} has an empty title`);
    assert.ok(e.body.trim().length > 0, `${key} has an empty body`);
  }
});

test('finalized intros (placeholder:false) contain no PLACEHOLDER text anywhere', () => {
  const finalized = entries.filter(([, e]) => e.placeholder === false);
  assert.ok(finalized.length > 0, 'at least some copy has been ratified');
  for (const [key, e] of finalized) {
    for (const field of [e.title, e.body, e.button ?? '']) {
      assert.ok(
        !/placeholder/i.test(field),
        `${key} is marked finalized but still says "PLACEHOLDER" — ratified copy or the flag is lying`,
      );
    }
  }
});

test('entries still in placeholder state say PLACEHOLDER in their body', () => {
  // `placeholder` defaults to TRUE when absent — an entry that omits the flag
  // is a draft and must read as one, matching the overlay's badge.
  const drafts = entries.filter(([, e]) => e.placeholder !== false);
  for (const [key, e] of drafts) {
    assert.ok(
      /PLACEHOLDER/.test(e.body),
      `${key} is a draft (placeholder not false) but its body does not carry the PLACEHOLDER marker`,
    );
  }
});

test('every finalized body is substantial copy, not a stub sentence', () => {
  for (const [key, e] of entries) {
    if (e.placeholder === false) {
      assert.ok(e.body.trim().length >= 80, `${key} finalized body is suspiciously short`);
    }
  }
});

test('resetScreenIntros clears exactly the ape:intro: namespace', async () => {
  mem().clear();
  mem().set(`${INTRO_STORAGE_PREFIX}glossary`, 'seen');
  mem().set(`${INTRO_STORAGE_PREFIX}dashboard`, 'seen');
  mem().set('ape:coach:glossary', '3'); // a coach mark counter must survive
  mem().set('unrelated', 'x');
  await resetScreenIntros();
  assert.equal(mem().has(`${INTRO_STORAGE_PREFIX}glossary`), false);
  assert.equal(mem().has(`${INTRO_STORAGE_PREFIX}dashboard`), false);
  assert.equal(mem().get('ape:coach:glossary'), '3', 'coach counters are not this sweep\'s to clear');
  assert.equal(mem().get('unrelated'), 'x');
});

test('resetScreenIntros is a no-op on empty storage (no throw, no writes)', async () => {
  mem().clear();
  await resetScreenIntros();
  assert.equal(mem().size, 0);
});
