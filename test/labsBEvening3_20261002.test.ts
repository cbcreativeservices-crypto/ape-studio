/**
 * LABS B — evening toddler hunt, pass 3 (2026-10-02). Receipts.
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
const between = (src: string, a: string, b: string) => {
  const i = src.indexOf(a);
  assert.ok(i >= 0, `missing ${a}`);
  const j = src.indexOf(b, i + a.length);
  assert.ok(j > i, `missing ${b} after ${a}`);
  return src.slice(i, j);
};

// 1. Gallery COLOUR ›: the art board opened from the artwork map read once on
//    arrival. Before it landed (or after a failed read) the board was BLANK;
//    ‹ then COLOUR › fast reopened it on the colouring from before the leave
//    flush wrote. Either way the first stroke saved over the stored colouring.
test('pattern store: loadArtwork waits for a save still writing', async () => {
  const kv = store.memoryStore();
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const slow = { ...kv, async setItem(k: string, v: string) { await gate; return kv.setItem(k, v); } };
  const s = store.createPatternStore(slow);
  const art = { ...store.blankArtwork('p1', 96), fills: [{ region: 1, color: '#ff0000', style: 'solid' as const }] };
  const saving = s.saveArtwork(art);
  const reading = s.loadArtwork('p1');
  release();
  assert.equal(await saving, true);
  assert.equal((await reading)?.fills.length, 1, 'the read sees the save queued before it');
});

test('pattern store: an unreadable artwork list rejects instead of reading as "no artwork"', async () => {
  const kv = store.memoryStore();
  const broken = { ...kv, async getItem(): Promise<string | null> { throw new Error('read failed'); } };
  const s = store.createPatternStore(broken);
  await assert.rejects(s.loadArtwork('p1'));
  // Nothing stored is still null.
  assert.equal(await store.createPatternStore(store.memoryStore()).loadArtwork('p1'), null);
});

test('gallery: COLOUR › opens the board only from a fresh read of the pattern artwork', () => {
  const src = read('src/screens/lab/cymatics/GalleryScreen.tsx');
  assert.doesNotMatch(src, /onPress=\{\(\) => setMode\('art'\)\}/, 'no direct jump to the board');
  assert.match(src, /label="Colour ›" selected=\{false\} onPress=\{openArt\}/);
  const open = between(src, 'const openArt = useLatchedPress(async () => {', 'const doDelete');
  assert.match(open, /a = await patternStore\(\)\.loadArtwork\(id\);\s*\} catch \{\s*notify\(/, 'an unreadable artwork is said, the board stays shut');
  assert.match(open, /if \(modeRef\.current !== 'open' \|\| currentIdRef\.current !== id\) return;/);
  assert.ok(open.indexOf("setMode('art')") > open.indexOf('loadArtwork(id)'), 'the board opens after the read');
});

// 2. Gallery DUPLICATE: a copy the device refused (duplicatePattern → null)
//    did nothing at all — no copy, no word.
test('gallery: a refused duplicate is said', () => {
  const src = read('src/screens/lab/cymatics/GalleryScreen.tsx');
  const dup = between(src, 'const doDuplicate = () => {', '.finally(');
  assert.match(dup, /if \(copy\) open\(copy\.id\);\s*else notify\('Not copied'/);
});
