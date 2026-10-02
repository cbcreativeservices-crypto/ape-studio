/**
 * LABS B — full-app bug run 1 (2026-10-01 evening). Receipts.
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

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

const store = await import('../src/features/cymatics/patternStore.ts');
const { DEFAULT_PLATE } = await import('../src/features/cymatics/plateModes.ts');

/** A memory kv whose getItem THROWS while `failReads` is set. */
function flakyKv() {
  const m = new Map<string, string>();
  const kv = {
    failReads: false,
    async getItem(k: string) {
      if (kv.failReads) throw new Error('Row too big to fit into CursorWindow');
      return m.has(k) ? m.get(k)! : null;
    },
    async setItem(k: string, v: string) {
      m.set(k, v);
    },
    async removeItem(k: string) {
      m.delete(k);
    },
  };
  return { kv, m };
}

const plateState = () => ({ studio: 'plate' as const, spec: DEFAULT_PLATE, hz: 440, amplitude: 0.5, view: 'sand', multi: 'off', sandCount: 1000, sandSize: 1, friction: 0.5 });

test('cymatics pattern store: a save after a FAILED read never writes over the saved patterns', async () => {
  const { kv } = flakyKv();
  const ps = store.createPatternStore(kv);
  assert.equal(await ps.upsertPattern(store.newPattern(plateState(), 'SIM', 'one')), true);
  assert.equal(await ps.upsertPattern(store.newPattern(plateState(), 'SIM', 'two')), true);
  kv.failReads = true;
  assert.equal(await ps.upsertPattern(store.newPattern(plateState(), 'SIM', 'three')), false, 'the save reports failure');
  assert.equal(await ps.duplicatePattern('nope'), null);
  kv.failReads = false;
  const names = (await ps.loadPatterns()).map((p) => p.name).sort();
  assert.deepEqual(names, ['one', 'two'], 'both saved patterns survive');
});

test('cymatics pattern store: DELETE never wipes every artwork when the artwork list cannot be read', async () => {
  const { kv } = flakyKv();
  const ps = store.createPatternStore(kv);
  const a = store.newPattern(plateState(), 'SIM', 'a');
  const b = store.newPattern(plateState(), 'SIM', 'b');
  await ps.upsertPattern(a);
  await ps.upsertPattern(b);
  assert.equal(await ps.saveArtwork(store.blankArtwork(b.id, 40)), true);
  kv.failReads = true;
  assert.equal(await ps.saveArtwork(store.blankArtwork(a.id, 40)), false);
  assert.equal(await ps.deleteArtwork(b.id), false);
  kv.failReads = false;
  assert.deepEqual((await ps.loadArtworks()).map((x) => x.patternId), [b.id], "b's artwork is still there");
});

test('cymatics experiment ticks: a failed READ is never written back over every other experiment', () => {
  const src = read('src/screens/lab/cymatics/ExperimentWell.tsx');
  const body = src.slice(src.indexOf('async function saveTicks'), src.indexOf('/* ── the sign-in hand-off'));
  assert.ok(!/readAllTicks\(\)/.test(body), 'saveTicks must not read through readAllTicks (it answers {} on a throw)');
  assert.match(body, /getItem\(TICKS_KEY\);\s*\} catch \{\s*return;/);
});

test('Signal Detective: a failed READ of the solved set is never cached as empty or written over', () => {
  const src = read('src/screens/lab/meter/modules/modMeterC.tsx');
  const block = src.slice(src.indexOf('const SOLVED_KEY'), src.indexOf('export function resetLocal'));
  assert.ok(!/catch \{\s*solvedCache = new Set\(\);/.test(block), 'a throw must not cache an empty set');
  assert.match(block, /if \(!stored\) return new Set\(\);/);
  // persist unions with what is stored, and skips an unreadable store / a wipe.
  assert.match(block, /if \(!stored \|\| gen !== solvedGen\) return;/);
  assert.match(block, /new Set\(\[\.\.\.stored, \.\.\.s\]\)/);
  assert.match(src, /export function resetLocal\(\): void \{\s*solvedCache = null;\s*solvedGen\+\+;/);
});

test('cymatics gallery: a DELETE that failed is reported, and the pattern is not closed as deleted', () => {
  const src = read('src/screens/lab/cymatics/GalleryScreen.tsx');
  const body = src.slice(src.indexOf('const doDelete'), src.indexOf('const openInStudio'));
  assert.match(body, /remove\(current\.id\)\.then\(\(ok\) => \{\s*(\/\/[^\n]*\n\s*)*if \(!ok\) \{\s*notify\(/);
});

test('a tone start in flight when every sound is stopped (leave the app, mute-on-leave OFF) never sounds on', () => {
  const files = [
    'src/screens/lab/cymatics/useDriveTone.ts',
    'src/screens/lab/eq/modules/eqAudition.tsx',
    'src/screens/lab/digital/modules/modAnalog.tsx',
    'src/screens/lab/cymatics/modules/modHarmony.tsx',
    'src/screens/lab/foundations/FoundationsCourseScreen.tsx',
    'src/screens/lab/foundations/FoundationsPlaygroundScreen.tsx',
  ];
  for (const f of files) {
    const src = read(f);
    const starts = src.split('await ApeDsp.genStart();').length - 1;
    assert.ok(starts > 0, f);
    const guarded = src.match(/const stopEpoch = getSoundStopEpoch\(\);\s*await ApeDsp\.genStart\(\);/g)?.length ?? 0;
    assert.equal(guarded, starts, `${f}: every genStart captures the sound-stop epoch`);
    const checks = src.match(/if \(getSoundStopEpoch\(\) !== stopEpoch\) \{\s*void ApeDsp\.genStop\(\);/g)?.length ?? 0;
    assert.equal(checks, starts, `${f}: every start re-checks the epoch after the native start, and stops`);
  }
});
