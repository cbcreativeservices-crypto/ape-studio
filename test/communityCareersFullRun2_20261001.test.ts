/**
 * COMMUNITY + CAREERS + AWARDS — full-app bug run 2 (2026-10-01, final run).
 *
 * Each block FAILED against the pre-fix tree (R2: the fixed file copied aside,
 * the old one restored, the test run, the fixed one put back).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { furtherEducation } from '../src/features/careerfinder/educationNote.ts';

// celebrationSeen sits on the shared safe store since wave 2 (2026-10-02),
// which imports its siblings without an extension, as Metro does.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

/** The body of one exported function, up to the next top-level declaration. */
function body(src: string, name: string): string {
  const start = src.indexOf(`export function ${name}(`);
  assert.ok(start >= 0, `${name} exists`);
  const rest = src.slice(start + 1);
  const end = rest.search(/\n(export |function |const |let |\/\*\*)/);
  return rest.slice(0, end < 0 ? undefined : end);
}

describe('E1: COMMON ENTRY POINTS never lists a PE-licence or graduate-degree title', () => {
  type Raw = { t: string; f: number; prep: number; reg?: 1; pe?: 1 };
  const index = JSON.parse(read('src/data/careerIndex.json')) as { enums: { preparation: string[] }; careers: Raw[] };
  const facts = (c: Raw) => ({ regulated: c.reg === 1, professionalEngineer: c.pe === 1, preparation: index.enums.preparation[c.prep] });

  it('the hazard is real: those titles read as the lowest preparation level', () => {
    // careerIndex.preparationLevel: "Master's …" and the PE flag both score 0.
    const lvl0 = (p: string) => !/doctorate|graduate|clinical|law degree|military|credentialing/i.test(p) && !/bachelor's degree common/i.test(p);
    for (const t of ['Acoustical Consultant', 'Music Librarian', 'Audio Archivist']) {
      const c = index.careers.find((x) => x.t === t);
      assert.ok(c, t);
      assert.ok(lvl0(index.enums.preparation[c.prep]), `${t} is level 0`);
      assert.ok(furtherEducation(facts(c)), `${t} needs further education`);
    }
  });

  it('entryPoints filters them out, not only licensed titles', () => {
    const src = body(read('src/features/careerfinder/careerIndex.ts'), 'entryPoints');
    assert.match(src, /\.filter\(\(x\) => !x\.c\.regulated && !furtherEducation\(x\.c\)\)/);
  });
});

describe('S1: Career Finder store — no write lands on an unread record', () => {
  const src = read('src/features/careerfinder/store.ts');

  for (const fn of ['answerQuestion', 'setQuestionIndex', 'completeCareerFinder', 'reopenCareerFinder', 'resetCareerFinder', 'toggleSavedFamily', 'setCareerFinderFeedback']) {
    it(`${fn} waits for the hydrate (act), so it spreads the STORED record`, () => {
      assert.match(body(src, fn), /\bact\(/);
    });
  }

  it('act runs only once hydrated, and drops an action an account switch overtook', () => {
    assert.match(src, /function act\(fn: \(\) => void\): void \{\s*if \(hydrated\) \{\s*fn\(\);\s*return;\s*\}\s*const g = generation;\s*void hydrateCareerFinder\(\)\.then\(\(\) => \{\s*if \(g === generation && hydrated\) fn\(\);/);
  });

  it('a storage read that THREW blocks the write-back of the empty copy', () => {
    assert.match(src, /if \(g === generation\) readFailed = true;/);
    assert.match(body(src, 'resetLocal'), /readFailed = false;/);
    const persist = src.slice(src.indexOf('function persist('), src.indexOf('function act('));
    assert.match(persist, /if \(readFailed\) return;\s*void AsyncStorage\.setItem/);
  });
});

describe('C1: celebrationSeen — a load straddling an account change is not kept', () => {
  it('the departing user’s set does not land after resetCelebrationsSeen', async () => {
    const mod = await import('../src/features/celebration/celebrationSeen.ts');
    const store = AsyncStorage as unknown as { getItem?: (k: string) => Promise<string | null> };
    const before = store.getItem;
    let release!: (v: string) => void;
    store.getItem = () => new Promise<string | null>((r) => { release = r; });
    try {
      mod.__resetCelebrationsSeenForTests();
      const p = mod.loadCelebrationsSeen(); // user A's read goes out…
      mod.resetCelebrationsSeen(); // …sign-out wipes + resets…
      release(JSON.stringify(['topic-A:flashcards-complete'])); // …A's set comes back
      await p;
      assert.equal(mod.hasLoaded(), false, 'the stale read must not mark the store loaded');
      assert.equal(mod.wasSeen('topic-A', 'flashcards-complete'), false, 'A’s history is not the next user’s');
    } finally {
      store.getItem = before;
      mod.__resetCelebrationsSeenForTests();
    }
  });
});

describe('C2: useCredentialCelebration writes nothing for the departing account', () => {
  const src = read('src/features/celebration/useCredentialCelebration.ts');
  it('takes the generation before the read and re-checks it after each await', () => {
    assert.match(src, /const g = celebrationGeneration\(\);[\s\S]*const rows = await fetchMyCredentials\(\);\s*if \(!sameAccount\(\)\) return null;/);
    assert.match(src, /const known = await readKnown\(\);\s*if \(!sameAccount\(\)\) return null;\s*if \(!known\)/);
  });
  it('confirmShown does not re-write the ids after a switch', () => {
    assert.match(src, /confirmShown: \(\) => \{\s*if \(sameAccount\(\)\) void writeKnown/);
  });
  it('the generation is bumped by the reset resetAllLocalStores already calls', () => {
    const seen = read('src/features/celebration/celebrationSeen.ts');
    // Wave 2 (2026-10-02): the record is on the shared safe store, whose
    // reset() bumps the generation `celebrationGeneration` reports.
    assert.match(body(seen, 'resetCelebrationsSeen'), /store\.reset\(\);/);
    assert.match(seen, /export const celebrationGeneration = \(\): number => store\.generation\(\);/);
    assert.match(read('src/features/account/clearLocalAccountData.ts'), /resetCelebrationsSeen\(\);/);
  });
});

describe('H1: the Guest Mode help answer matches the same-session carry ruling', () => {
  const src = read('src/features/help/helpContent.ts');
  it('does not say ALL guest data is cleared on leaving Guest Mode', () => {
    assert.doesNotMatch(src, /is cleared when you leave Guest Mode — create/);
    assert.match(src, /except lab work: sign in or create an account before you close the app/);
  });
});
