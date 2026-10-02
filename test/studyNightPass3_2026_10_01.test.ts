/**
 * GUARD — night bug pass 3 (2026-10-01), study / dashboard / quiz / exam /
 * achievements area. Source-reading checks for fixes that cannot run without a
 * phone.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');

describe('every plain Back is latched to one exit', () => {
  const screens: [string, string[]][] = [
    ['study/FlashcardsScreen.tsx', ['src', 'screens', 'study', 'FlashcardsScreen.tsx']],
    ['study/MatchingScreen.tsx', ['src', 'screens', 'study', 'MatchingScreen.tsx']],
    ['study/FillInBlankScreen.tsx', ['src', 'screens', 'study', 'FillInBlankScreen.tsx']],
    ['achievements/CredentialWall.tsx', ['src', 'screens', 'achievements', 'CredentialWall.tsx']],
    ['achievements/GalleryScreen.tsx', ['src', 'screens', 'achievements', 'GalleryScreen.tsx']],
    ['achievements/TopicsScreen.tsx', ['src', 'screens', 'achievements', 'TopicsScreen.tsx']],
  ];
  for (const [name, p] of screens) {
    it(name, () => {
      const src = read(...p);
      assert.match(src, /const leavingRef = useRef\(false\);/);
      assert.match(src, /if \(leavingRef\.current\) return;\s*leavingRef\.current = true;/);
      // No raw goBack left on a button: the only goBack is inside the latch.
      assert.doesNotMatch(src, /onPress=\{\(\) => (?:\(?navigation(?: as any\))?\)?\.goBack\(\)|safeGoBack\(navigation(?: as any)?\))\}/);
      assert.match(src, /onPress=\{leave\}/);
    });
  }

  it('the study latches are declared before the early returns (rules of hooks)', () => {
    for (const f of ['FlashcardsScreen.tsx', 'MatchingScreen.tsx', 'FillInBlankScreen.tsx']) {
      const src = read('src', 'screens', 'study', f);
      assert.ok(src.indexOf('const leavingRef = useRef(false);') < src.indexOf('  if (error) {'), f);
    }
  });
});

describe('the local progress mirror drops writes that race an account wipe', () => {
  const src = read('src', 'features', 'study', 'localProgress.ts');
  it('save is refused while a clear is running', () => {
    // Shape updated in wave 2 (2026-10-02): the save now merges with the
    // stored row and answers a boolean; the fence is still checked first, and
    // again (with the wipe generation) right before the write.
    const save = src.slice(src.indexOf('export function saveLocalMethodStates('));
    assert.ok(save.length > 200, 'saveLocalMethodStates not found');
    const fence = save.indexOf('if (clearsInFlight > 0) return Promise.resolve(false);');
    assert.ok(fence > 0 && fence < save.indexOf('AsyncStorage.setItem('));
    assert.match(save, /if \(gen !== wipeGeneration \|\| clearsInFlight > 0\) return false;\s*try \{\s*await AsyncStorage\.setItem\(/);
  });
  it('clear raises the fence before listing keys and always lowers it', () => {
    const clear = src.slice(src.indexOf('export async function clearAllLocalMethodStates('));
    assert.ok(clear.indexOf('clearsInFlight++') < clear.indexOf('getAllKeys'));
    assert.match(clear, /finally \{\s*clearsInFlight--;/);
  });
});

describe('enrollment progress never carries a map across accounts', () => {
  const src = read('src', 'features', 'enrollment', 'enrollmentProgress.ts');
  it('an identity change drops the map and refetches', () => {
    assert.match(src, /supabase\.auth\.onAuthStateChange/);
    assert.match(src, /setMap\(new Map\(\)\);\s*setIdentityVersion/);
    assert.match(src, /\[key, exemptVersion, termsExemptVersion, identityVersion\]/);
  });
  it('the anonymous device key is not an identity change', () => {
    assert.match(src, /isRealAccount\(session\) \? \(session\?\.user\?\.id \?\? ''\) : ''/);
  });
  it('it refetches again once the local-mirror wipe announces itself', () => {
    assert.match(src, /onStudyProgress\(\(\) => \{\s*if \(!awaitingWipe\) return;/);
  });
});
