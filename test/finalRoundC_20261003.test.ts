/**
 * FINAL FIX ROUND C (2026-10-03) — owner recommendations under "favor
 * consistency and learning outcomes" (D48). One receipt per item.
 *
 *  1. Home Setup: a draft built from an UNREAD Home list is never saved, even
 *     if the list is read while the sheet is open (isHomeListHydrated).
 *  2. AttractText / AttractRing hold still while Home is covered (useIsFocused).
 *  3. LabReviewButton tells a guest the truth about credit (reviewCreditLine).
 *  4. LabPreviewOverlay's 350 ms endLabPreview is one cancellable timer.
 *  5. useGuestWording: tier 'unknown' reads account 'checking' (guestWordingOf).
 *  6. Study full screen: the shake line says shake yields to the mute.
 *  7. Frequency Counter Light Pulse: 'checking' says "One moment".
 *  8. Signal Generator: a late cap unlock after unmount never reaches the DSP.
 *  9. SPL meter: "Calibration not saved" says what happens in each case.
 * 10. No dead `Alert` import in Exposure Monitor / Signal Generator.
 * 11. Cable Install: a change dropped over a failed restore read is SAID once.
 * 12. Flashcards "My Custom List" reads the starred list AFTER it hydrates.
 *
 * Receipt: every test below FAILED against the HEAD (786b880c) files — each
 * edited file copied aside, `git show HEAD:<path>` written back, this file
 * run, the copies restored and checked with cmp.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

class FlakyMap extends Map<string, string> {
  failReads = false;
  override has(k: string): boolean {
    if (this.failReads) throw new Error('storage read failed');
    return super.has(k);
  }
}
const disk = new FlakyMap();
(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE_RC__ = disk;

const FAKE = `
const s = globalThis.__FAKE_ASYNC_STORAGE_RC__;
const get = (k) => (s.has(k) ? s.get(k) : null);
export default {
  async getItem(k) { return get(k); },
  async multiGet(ks) { return ks.map((k) => [k, get(k)]); },
  async setItem(k, v) { s.set(k, v); },
  async multiSet(kvs) { for (const [k, v] of kvs) s.set(k, v); },
  async removeItem(k) { s.delete(k); },
  async multiRemove(ks) { for (const k of ks) s.delete(k); },
};`;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') {
      return { url: `data:text/javascript,${encodeURIComponent(FAKE)}`, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const settle = async () => {
  for (let i = 0; i < 8; i++) await new Promise<void>((r) => setImmediate(r));
};
const read = (rel: string) => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
type Mod = Record<string, unknown>;
const fn = (m: Mod, name: string) => {
  assert.equal(typeof m[name], 'function', `${name} is exported`);
  return m[name] as (...a: unknown[]) => unknown;
};

describe('1. Home Setup — a draft from an unread list is never saved', () => {
  it('the store says whether the list has been READ', async () => {
    const home = (await import('../src/features/home/homeCardsStore.ts')) as unknown as Mod;
    disk.failReads = false;
    disk.clear();
    disk.set('ape:homeCards', JSON.stringify([11, 22]));
    (home.resetLocal as () => void)();
    const hydrated = fn(home, 'isHomeListHydrated');
    disk.failReads = true;
    void (home.getHomeGs as () => number[])(); // the sheet opens — the read throws
    await settle();
    assert.equal(hydrated(), false, 'unread: the draft would be the empty placeholder');
    disk.failReads = false;
    // The refused save reads again (hunt 6) — the list lands while the sheet is still open.
    assert.equal(await (home.setHomeGs as (g: number[]) => Promise<boolean>)([]), false);
    await settle();
    assert.equal(hydrated(), true);
    assert.deepEqual((home.getHomeGs as () => number[])(), [11, 22]);
  });
  it('the sheet captures it when the draft is built and refuses SAVE on a stale draft', () => {
    const s = read('screens/enrollment/HomeSetupSheet.tsx');
    const open = s.slice(s.indexOf('// (Re)build the draft each time the sheet opens'), s.indexOf('}, [visible]);', s.indexOf('// (Re)build the draft')));
    assert.match(open, /draftFromReadList\.current = isHomeListHydrated\(\);\s*const home = getHomeGs\(\);/);
    const save = s.slice(s.indexOf('const save = () =>'), s.indexOf('// ── Long-press-hold-then-drag'));
    assert.match(save, /const fromRead = draftFromReadList\.current;/);
    assert.match(save, /const list = fromRead \? setHomeGs\(\[\.\.\.cores, \.\.\.editableOn\]\) : Promise\.resolve\(false\);/);
    assert.match(save, /const def = fromRead \? setDefaultHomeGs\(defaultDraft\) : Promise\.resolve\(false\);/);
    assert.match(save, /notify\('Home not saved'/, 'the existing honest notice says the refusal');
  });
});

describe('2. AttractCue — still while Home is covered', () => {
  it('both cues add focus to the motion condition', () => {
    const s = read('features/onboarding/AttractCue.tsx');
    assert.match(s, /import \{ useIsFocused \} from '@react-navigation\/native';/);
    assert.equal((s.match(/const motion = active && !suppressed && allowed && focused;/g) ?? []).length, 2);
    assert.equal((s.match(/const focused = useIsFocused\(\);/g) ?? []).length, 2);
  });
});

const labEnd = (await import('../src/screens/lab/kit/labEnd.ts')) as unknown as Mod;
const tier = (await import('../src/features/commercial/tier.ts')) as unknown as Mod;

describe('3. LabReviewButton — a guest is not promised credit', () => {
  it('the line, in the labs’ end-screen words', () => {
    const line = fn(labEnd, 'reviewCreditLine');
    assert.equal(line({ guest: false }), null, 'a member keeps the plain credit line');
    const g = String(line({ guest: true, carry: true }));
    assert.match(g, /^You are not signed in/);
    assert.match(g, /kept for this session only/);
    assert.match(g, /sign in before you close the app/);
    assert.equal(line({ guest: true, carry: false }), 'You are not signed in, so nothing here is saved.');
    assert.match(String(line({ guest: true, preview: true })), /members-only preview, so nothing here is saved or credited/);
    assert.equal(line({ guest: false, account: 'checking' }), 'Still checking your account.');
  });
  it('the button words from useGuestWording + the preview + the carry window', () => {
    const s = read('features/lab/LabReviewButton.tsx');
    assert.match(s, /const wording = useGuestWording\(\);/);
    assert.match(s, /reviewCreditLine\(\{ guest: wording\.guest, preview, carry: sessionCarryOpen\(\), account: wording\.account \}\)/);
    assert.match(s, /\{credit \?\? 'This lab counts toward your Audio Fundamentals credit\.'\}/);
    assert.match(s, /\{credit \?\? 'It counts toward your Audio Fundamentals credit\.'\}/);
  });
});

describe('4. LabPreviewOverlay — one cancellable clear', () => {
  it('the timer lives in a ref, cleared on re-arm and unmount, and only ends a preview being LEFT', () => {
    const s = read('features/lab/LabPreviewOverlay.tsx');
    assert.doesNotMatch(s, /setTimeout\(endLabPreview, 350\)/);
    assert.match(s, /const endTimer = useRef<ReturnType<typeof setTimeout> \| null>\(null\);/);
    assert.match(s, /const armEnd = \(\) => \{\s*if \(endTimer\.current\) clearTimeout\(endTimer\.current\);/);
    assert.match(s, /if \(getLabPreview\(\)\.leaving\) endLabPreview\(\);/);
    assert.match(s, /useEffect\(\(\) => \(\) => \{\s*if \(endTimer\.current\) clearTimeout\(endTimer\.current\);/);
    assert.equal((s.match(/armEnd\(\);/g) ?? []).length, 2, 'Close and See plans both arm it');
  });
});

describe('5. useGuestWording — unknown tier is "checking", never "saved"', () => {
  it('guestWordingOf', () => {
    const of = fn(tier, 'guestWordingOf');
    assert.deepEqual(of('unknown', false, false), { guest: false, account: 'checking' });
    assert.deepEqual(of('guest', true, false), { guest: true });
    assert.deepEqual(of('preview', false, false), { guest: true });
    assert.deepEqual(of('guest', false, false), { guest: false, account: 'checking' });
    assert.deepEqual(of('guest', false, true), { guest: false, account: 'unconfirmed' });
    assert.deepEqual(of('member', true, false), { guest: false });
    assert.deepEqual(of('free', true, false), { guest: false });
  });
  it('the hook uses it; Sound Systems no longer says "saved" while checking', () => {
    assert.match(read('features/commercial/useTier.ts'), /return guestWordingOf\(useTier\(\), tierKnown, tierReadFailed\);/);
    const ss = read('screens/lab/soundsystems/SoundSystemsLabScreen.tsx');
    const i = ss.indexOf(': wording.account // tier not read yet');
    assert.ok(i > 0 && i < ss.indexOf("'Everything you have done is saved."), 'the account branch comes before "saved"');
  });
});

describe('6. Study full screen — the shake line is honest', () => {
  it('says shake is off while sound is on (useShake yieldToMute)', () => {
    const s = read('components/StudyFsOverlay.tsx');
    assert.match(s, /useShake\(onShakePrev, visible, \{ yieldToMute: true \}\);/);
    assert.doesNotMatch(s, />Shake to go back a question</);
    assert.match(s, />Shake to go back a question \(off while sound is on — shake mutes it first\)</);
  });
});

describe('7. Frequency Counter — Light Pulse while checking', () => {
  it('says "One moment", like the calc runner', () => {
    const s = read('screens/tools/FrequencyCounterScreen.tsx');
    const pick = s.slice(s.indexOf('const pickMode = (m: Mode) => {'), s.indexOf('setMode(m);', s.indexOf('const pickMode')));
    assert.match(pick, /else notify\('One moment', 'Still checking your account\. Try again in a moment\.'\);/);
  });
});

describe('8. Signal Generator — no cap unlock after teardown', () => {
  it('the confirm returns before genUnlockCap when unmounted', () => {
    const s = read('screens/tools/SignalGenScreen.tsx');
    assert.match(s, /capPromptOpen\.current = false;\s*(?:\/\/[^\n]*\n\s*)*if \(!mountedRef\.current\) return;\s*ApeDsp\.genUnlockCap\(\);/);
  });
});

describe('9. SPL meter — the "not saved" notice matches what happens', () => {
  it('the store says when its copy is unreadable', async () => {
    disk.failReads = false;
    disk.clear();
    disk.set('ape:splCalOffset', JSON.stringify({ offsetDb: 90, setAt: '' }));
    const cal = (await import('../src/features/tools/measure/calibrationStore.ts?rc9')) as unknown as Mod;
    const unreadable = fn(cal, 'isSplCalibrationUnreadable');
    disk.failReads = true;
    const ok = await (cal.setSplCalibration as (n: number) => Promise<boolean>)(101);
    assert.equal(ok, false);
    assert.equal(unreadable(), true, 'held, not failed');
    disk.failReads = false;
    assert.equal(await (cal.setSplCalibration as (n: number) => Promise<boolean>)(101), true, 'the next action reads, then writes');
    assert.equal(unreadable(), false);
  });
  it('two bodies; neither promises "uncalibrated" on restart', () => {
    const s = read('screens/tools/SplMeterScreen.tsx');
    const commit = s.slice(s.indexOf('const commitCalibration = useCallback'), s.indexOf('const clearCalibration = useCallback'));
    assert.match(commit, /isSplCalibrationUnreadable\(\)\s*\?\s*'This device could not read its saved calibration just now\./);
    assert.doesNotMatch(commit, /will read uncalibrated when you close the app/);
    assert.equal((commit.match(/goes back to its previous calibration \(or none\)/g) ?? []).length, 2);
  });
});

describe('10. No dead Alert import', () => {
  it('Exposure Monitor and Signal Generator', () => {
    for (const f of ['screens/tools/ExposureMonitorScreen.tsx', 'screens/tools/SignalGenScreen.tsx']) {
      assert.doesNotMatch(read(f), /import \{[^}]*\bAlert\b[^}]*\} from 'react-native';/, f);
    }
  });
});

describe('11. Cable Install — a change over a failed read is said once', () => {
  it('persist reports once when the change altered something; credit untouched', () => {
    const s = read('screens/lab/cableinstall/CableInstallLabScreen.tsx');
    assert.match(s, /import \{ armSaveFailureReport, reportUnhandledSaveFailure \} from '\.\.\/\.\.\/\.\.\/features\/storage\/saveFailureNotice';/);
    const persist = s.slice(s.indexOf('const persist = useCallback('), s.indexOf('}, []);', s.indexOf('const persist = useCallback(')));
    assert.match(persist, /if \(readRef\.current === 'failed'\) \{/);
    assert.match(persist, /const changed = nextStep !== INTRO_STEP \|\| Object\.keys\(nextDims\)\.length > 0 \|\| nextMyths\.length > 0 \|\| repeatedRef\.current;/);
    assert.match(persist, /if \(changed && !unreadToldRef\.current\) \{\s*unreadToldRef\.current = true;\s*reportUnhandledSaveFailure\(\);\s*\}\s*return;/);
    assert.doesNotMatch(persist, /multiSet[\s\S]*failed/, 'nothing is written over the unread copy');
    assert.doesNotMatch(persist, /markLabUnit\(/, 'credit is not touched here');
    assert.match(s, /unreadToldRef\.current = false;[^\n]*\n\s*readRef\.current = 'pending';/, 'once per read');
  });
});

describe('12. Flashcards "My Custom List" — read after hydration', () => {
  it('readTermList resolves the STORED list on a cold start, and rejects a failed read', async () => {
    disk.failReads = false;
    disk.clear();
    disk.set('ape:notifyTerms', JSON.stringify(['a', 'b']));
    const cold = (await import('../src/features/flags/flaggedStore.ts?rc12a')) as unknown as Mod;
    const r = fn(cold, 'readTermList');
    assert.deepEqual([...((await r('starred')) as Set<string>)].sort(), ['a', 'b']);
    const bad = (await import('../src/features/flags/flaggedStore.ts?rc12b')) as unknown as Mod;
    disk.failReads = true;
    await assert.rejects(fn(bad, 'readTermList')('starred') as Promise<unknown>);
    disk.failReads = false;
  });
  it('the deck awaits it', () => {
    const s = read('screens/study/FlashcardsScreen.tsx');
    assert.match(s, /flaggedMode \? readTermList\('starred'\)\.then\(\(ids\) => fetchGlossaryItemsByIds\(\[\.\.\.ids\]\)\)/);
    assert.doesNotMatch(s, /getTermList\('starred'\)/);
  });
});
