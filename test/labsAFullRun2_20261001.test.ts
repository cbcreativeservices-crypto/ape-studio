/**
 * Labs A — full-app bug run 2 (2026-10-01 evening). Receipts.
 *
 *  • Every native start in Labs A (genStart / binStart / modStart) now takes
 *    the sound-stop epoch before the start and re-checks it after: with "Mute
 *    audio when I leave the app" OFF, stopAllSound leaves the gate ON and
 *    useStopWhenSilenced only stops a lab that already says it is running —
 *    so a ▶ tapped just before leaving started its tone behind the user.
 *  • SsPagedLab (Sound Systems) re-reads its saved pages when the tier changes
 *    guest ↔ signed-in, as kit/PagedLab does: a signed-in learner whose first
 *    tier read failed stayed on the empty guest copy for the whole visit.
 *  • Production projects: a failed storage READ is no longer shown as "no
 *    projects" / "not on this device", and is not blamed on free space.
 *  • Mixing kit: the import-time focal / priorities reads no longer land over
 *    an account wipe or a choice made meanwhile.
 * R2: every case was run against the pre-fix files and failed.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
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

const read = (p: string) =>
  readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

describe('Labs A: every native start re-checks the sound-stop epoch after it resolves', () => {
  const files: Array<[string, 'gen' | 'bin' | 'mod']> = [
    ['src/screens/lab/OscillatorLabScreen.tsx', 'gen'],
    ['src/screens/lab/NoiseLabScreen.tsx', 'gen'],
    ['src/screens/lab/AutotuneLabScreen.tsx', 'gen'],
    ['src/screens/lab/HarmonographLabScreen.tsx', 'gen'],
    ['src/screens/lab/SignalChainLabScreen.tsx', 'gen'],
    ['src/screens/lab/FxLabScreen.tsx', 'gen'],
    ['src/screens/lab/FmLabScreen.tsx', 'gen'],
    ['src/screens/lab/BassLabScreen.tsx', 'gen'],
    ['src/screens/lab/HarmonicsView.tsx', 'gen'],
    ['src/screens/lab/BinauralLabScreen.tsx', 'bin'],
    ['src/screens/lab/ModularLabScreen.tsx', 'mod'],
  ];
  for (const [f, kind] of files) {
    it(f, () => {
      // Since the start fence (startFenced, 2026-10-02) the epoch capture, the
      // gate re-check and the epoch re-check are the helper's: every native
      // start is its `start`, its `stop` stops that voice, and no start is
      // awaited bare.
      const src = read(f);
      const starts = src.match(new RegExp(`ApeDsp\\.${kind}Start\\(`, 'g'))?.length ?? 0;
      assert.ok(starts > 0, `${f}: has a native ${kind}Start`);
      const fenced = src.match(new RegExp(`startFenced\\(\\{\\s*start: \\(\\) => ApeDsp\\.${kind}Start\\(\\),`, 'g'))?.length ?? 0;
      assert.equal(fenced, starts, `${f}: every ${kind}Start is the fence's start`);
      assert.doesNotMatch(src, new RegExp(`await ApeDsp\\.${kind}Start\\(`), `${f}: a bare native start escapes the fence`);
      let at = -1;
      for (let n = 0; n < starts; n++) {
        at = src.indexOf('startFenced({', at + 1);
        const stop = src.slice(src.indexOf('stop:', at), src.indexOf('isCurrent:', at));
        assert.match(stop, new RegExp(`ApeDsp\\.${kind}Stop\\(\\)`), `${f}: the fence's stop silences the voice`);
      }
      assert.match(src, /import \{[^}]*\bstartFenced\b[^}]*\} from '..\/..\/features\/audio\/startFenced';/);
    });
  }
  it('no top-level lab file with a native start escapes the list', () => {
    const listed = new Set(files.map(([f]) => f));
    const dir = new URL('../src/screens/lab/', import.meta.url);
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.tsx')) continue;
      const f = `src/screens/lab/${name}`;
      if (/ApeDsp\.(gen|bin|mod)Start\(/.test(read(f))) assert.ok(listed.has(f), `${f} starts a native voice and is not fenced`);
    }
  });
});

describe('SsPagedLab re-reads its pages when the tier changes guest ↔ signed-in', () => {
  const s = read('src/screens/lab/soundsystems/SsPagedLab.tsx');
  it('the load effect depends on isGuest (kit/PagedLab parity)', () => {
    assert.match(s, /const isGuest = resolved && entitlement === 'anonymous';/);
    assert.match(s, /\}, \[labId, pagesWithCheck\.length, resolved, isGuest\]\);/);
  });
  it('a signed-in re-load keeps the work the ledger holds for this person', () => {
    assert.match(s, /: withHeldPages\(p, heldPaged\(labId\)\);/);
  });
});

describe('Production projects: a failed READ is not "no projects" and is not "free up space"', async () => {
  const { createProjectStore, newProject } = await import('../src/features/production/projectStore.ts');
  function flakyKv() {
    const m = new Map<string, string>();
    const kv = {
      failReads: false,
      async getItem(k: string) {
        if (kv.failReads) throw new Error('read failed');
        return m.has(k) ? m.get(k)! : null;
      },
      async setItem(k: string, v: string) {
        m.set(k, v);
      },
      async removeItem(k: string) {
        m.delete(k);
      },
    };
    return kv;
  }
  it('tryLoad answers null for an unreadable store, the list otherwise', async () => {
    const kv = flakyKv();
    const st = createProjectStore(kv);
    assert.deepEqual(await st.tryLoad('preprod'), []);
    assert.equal(await st.upsert(newProject('preprod', 'band' as never, 'mine')), true);
    kv.failReads = true;
    assert.equal(await st.tryLoad('preprod'), null);
    kv.failReads = false;
    assert.equal((await st.tryLoad('preprod'))?.length, 1);
  });
  it('the lab home, the exercise and the stage screen read through tryLoad', () => {
    const home = read('src/screens/lab/production/ProductionLabScreen.tsx');
    assert.match(home, /const list = await projectStore\(\)\.tryLoad\(lab\);\s*\n\s*if \(!list\) \{\s*\n\s*setReadFailed\(true\);/);
    const start = home.slice(home.indexOf('const start = useCallback('));
    assert.ok(start.indexOf('tryLoad(lab)') > 0 && start.indexOf('tryLoad(lab)') < start.indexOf('newProject('), 'start checks readability first');
    const act = read('src/screens/lab/production/ProductionActivityScreen.tsx');
    assert.doesNotMatch(act, /projectStore\(\)\.load\(lab\)/);
    assert.match(act, /const all = await projectStore\(\)\.tryLoad\(lab\);\s*\n\s*if \(!all\) \{/);
    const stage = read('src/screens/lab/production/ProductionStageScreen.tsx');
    assert.match(stage, /\.tryLoad\(lab\)/);
    assert.match(stage, /setLoadState\('unreadable'\)/);
  });
});

describe('Mixing kit: the import-time reads never land over a wipe or a newer choice', () => {
  const s = read('src/screens/lab/mixing/kit.tsx');
  it('focal', () => {
    assert.match(s, /if \(v != null && !focalTouched\) \{/);
    const reset = s.slice(s.indexOf('export function resetMixingCommitments'), s.indexOf('export function useFocalChoice'));
    assert.match(reset, /focalTouched = true;/);
    // Wave 2 (2026-10-02): the priorities' wipe is the shared store's new
    // generation — a read or write in flight lands nowhere.
    assert.match(reset, /prioritiesStore\.reset\(\);/);
    assert.match(s, /const set = useCallback\(\(id: string\) => \{\s*\n\s*focalTouched = true;/);
  });
  it('priorities', () => {
    // Wave 2 (2026-10-02): on the shared safe store — no import-time read of
    // its own; a toggle is applied to the HYDRATED list (queued until the
    // read lands), so neither a late read nor a wipe can land over it.
    assert.doesNotMatch(s, /AsyncStorage\.getItem\(PRIORITIES_KEY\)/);
    assert.match(s, /const prioritiesStore = createLocalStore<readonly string\[\]>\(\{\s*key: PRIORITIES_KEY,/);
    assert.match(s, /void prioritiesStore\.mutate\(\(list\) => togglePriority\(list, id, add\)\);/);
  });
});
