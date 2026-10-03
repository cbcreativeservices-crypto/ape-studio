/**
 * LABS B — hunt 4 (2026-10-03). Receipts.
 *
 * Cymatics gallery: a pattern list the device could not READ (getItem threw)
 * came back as `[]`, and the gallery said "NOTHING SAVED YET" over every
 * saved pattern — the failed read reported as an empty library. The empty
 * stand-in is now tagged (patternsUnreadable) and the gallery says the
 * patterns could not be read (the Room Design STORE_UNREADABLE rule).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const store = await import('../src/features/cymatics/patternStore.ts');
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('pattern store: an unreadable list is told apart from an empty one', async () => {
  const broken = {
    getItem: async (): Promise<string | null> => {
      throw new Error('row too big');
    },
    setItem: async () => {},
    removeItem: async () => {},
  };
  const bad = await store.createPatternStore(broken).loadPatterns();
  assert.deepEqual(bad, [], 'still an empty list for every caller that only reads');
  assert.equal((store as { patternsUnreadable?: (l: unknown[]) => boolean }).patternsUnreadable?.(bad), true, 'a failed read is marked');
  const empty = await store.createPatternStore(store.memoryStore()).loadPatterns();
  assert.equal((store as { patternsUnreadable?: (l: unknown[]) => boolean }).patternsUnreadable?.(empty), false, 'a truly empty library is not');
});

test('gallery: an unreadable library never reads "NOTHING SAVED YET"', () => {
  const s = read('src/screens/lab/cymatics/GalleryScreen.tsx');
  const at = s.indexOf('NOTHING SAVED YET');
  assert.ok(at > 0);
  const before = s.slice(s.indexOf('{patterns === null ? ('), at);
  assert.match(before, /patternsUnreadable\(patterns\)/, 'the unreadable branch comes before the empty one');
  assert.match(s, /could not be read from this device just now/);
});
