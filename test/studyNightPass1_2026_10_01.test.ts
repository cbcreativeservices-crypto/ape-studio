/**
 * GUARD — night bug pass 1 (2026-10-01), study / dashboard / quiz / exam area.
 * Source-reading checks for timing fixes that cannot run without a phone.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');

describe('ensureStudyTopic survives an account wipe mid-hydrate', () => {
  const store = read('src', 'features', 'enrollment', 'enrollmentStore.ts');
  const body = store.slice(store.indexOf('export async function ensureStudyTopic'));
  it('captures the generation before awaiting and bails if it moved or never hydrated', () => {
    const genAt = body.indexOf('const gen = generation;');
    const hydrateAt = body.indexOf('await hydrate();');
    const fenceAt = body.indexOf('if (gen !== generation || !store.isHydrated()) return;');
    const addAt = body.indexOf('addTopics([gs])');
    assert.ok(genAt > 0 && hydrateAt > genAt && fenceAt > hydrateAt && addAt > fenceAt);
  });
});

describe('hydrating stores carry a generation fence', () => {
  for (const f of ['scenarioExempt.ts', 'termsExempt.ts']) {
    it(f, () => {
      // The fence moved into the shared safe store (2026-10-02, closer A2):
      // its hydrate captures the generation before the read and lands nothing
      // — not the set, not `hydrated` — once reset() has moved it
      // (test/localStore.test.ts, "P3: an account reset while the read is in
      // flight"). The store must be on it and keep no hand-rolled read.
      const s = read('src', 'features', 'study', f);
      assert.match(s, /createLocalStore</);
      assert.match(s, /export function resetLocal\(\): void \{\s*store\.reset\(\);/);
      assert.doesNotMatch(s, /AsyncStorage\.getItem\(/);
    });
  }
  it('paceStore.ts', () => {
    const s = read('src', 'features', 'study', 'paceStore.ts');
    assert.match(s, /export function resetLocal\(\): void \{\s*generation\+\+;/);
    const h = s.slice(s.indexOf('async function hydrate('), s.indexOf('export function usePaceSettings'));
    assert.match(h, /if \(gen !== generation\) return;/);
  });
});

describe('Dashboard: no Modal over a screen that came forward', () => {
  const dash = read('src', 'screens', 'dashboard', 'DashboardScreen.tsx');
  it('the credential celebration waits while one of the screen\'s popups is open', () => {
    const at = dash.indexOf('void checkCredentials().then((c) => {');
    const body = dash.slice(at, dash.indexOf("navigate('Celebration'", at));
    assert.match(body, /if \(popupOpenRef\.current\) return;/);
  });
});

describe('one exit per screen', () => {
  it('TrophyScreen Back is latched', () => {
    const s = read('src', 'screens', 'results', 'TrophyScreen.tsx');
    assert.match(s, /const exit = \(\) => \{\s*if \(leavingRef\.current\) return;\s*leavingRef\.current = true;/);
  });
  it('FinalExamResult Retake / View on Profile / Done are latched', () => {
    const s = read('src', 'screens', 'exam', 'FinalExamResultScreen.tsx');
    assert.match(s, /onPress=\{leaveOnce\(\(\) => \(navigation as any\)\.replace\('FinalExam'/);
    assert.match(s, /onPress=\{leaveOnce\(\(\) => \(navigation as any\)\.popTo\('Main'/);
    assert.match(s, /onPress=\{leaveOnce\(\(\) => navigation\.goBack\(\)\)\}/);
  });
});

describe('FinalExam "Submit failed" OK never fires goBack from a replaced screen', () => {
  it('guards on mountedRef like the quiz twin', () => {
    const s = read('src', 'screens', 'exam', 'FinalExamScreen.tsx');
    const at = s.indexOf("notify('Submit failed'");
    assert.ok(at > 0);
    assert.match(s.slice(at, at + 260), /if \(mountedRef\.current\) navigation\.goBack\(\);/);
  });
});

describe('Flashcards linked-term viewer: newest request wins', () => {
  const s = read('src', 'screens', 'study', 'FlashcardsScreen.tsx');
  it('a slow fetch cannot replace a newer term or reopen a closed viewer', () => {
    assert.match(s, /if \(it && req === openTermReqRef\.current\) setLinkedTerm\(it\);/);
    assert.match(s, /const closeLinkedTerm = useCallback\(\(\) => \{\s*openTermReqRef\.current\+\+;\s*setLinkedTerm\(null\);/);
    assert.doesNotMatch(s, /onClose=\{\(\) => setLinkedTerm\(null\)\}/);
  });
});
