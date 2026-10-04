/**
 * START HERE on Home + the Flashcards tutorial hold — 2026-10-04 (receipt key:
 * homeStartHereCard).
 *
 * TASK 1 (owner 2026-10-04: "home is default, stays where user last left it
 * after they move it"). Start Here was built in code as a PINNED head card on
 * a member's custom Home deck — nobody could move it. Now:
 *  - it is a row of Home Setup's reorder list (always on Home, no Home toggle:
 *    its card is the only way into Start Here — owner 2026-09-29);
 *  - its slot is stored IN the saved Home order (HOME_START_HERE), so it stays
 *    where the learner left it across launches;
 *  - a saved order without it is NOT rewritten: it reads as Start Here at its
 *    default place (right after Career Finder) until the learner's first save;
 *  - an unreadable saved order is never overwritten (the store's refusal);
 *  - guests / non-members keep the code-built default deck (not user-ordered).
 *
 * TASK 2. The 45 s / 5-swipe T2/T3 tutorial could present beside the topic
 * welcome or the T1 intro (two root Modals: iOS refuses the second). It now
 * waits while either is up OR OWED, then waits out the closing fade
 * (rootModalHoldMs / HOST_DISMISS_MS) — deferred, never marked seen, so it is
 * not lost.
 *
 * homeCardsStore is driven for real on a fake AsyncStorage; the screens import
 * React Native, so those are source receipts.
 *
 * R2: every [R2] test FAILED with the HEAD copies of the changed files written
 * back (git show HEAD:<path>), and passes with the changes restored (cmp clean).
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
(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE_HSH__ = disk;

const FAKE = `
const s = globalThis.__FAKE_ASYNC_STORAGE_HSH__;
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
const home = (await import('../src/features/home/homeCardsStore.ts')) as Record<string, any>;
const S: number = home.HOME_START_HERE;
const saved = () => JSON.parse(disk.get('ape:homeCards') ?? 'null');
const read = (p: string) => readFileSync(p, 'utf8');

/** A fresh launch with `list` saved on the device. */
async function launch(list: number[] | null): Promise<void> {
  disk.failReads = false;
  disk.clear();
  if (list) disk.set('ape:homeCards', JSON.stringify(list));
  home.resetLocal();
  void home.getHomeGs();
  await settle();
}
/** The app restarts on the same device (memory dropped, disk kept). */
async function relaunch(): Promise<void> {
  home.resetLocal();
  void home.getHomeGs();
  await settle();
}

const CORES = [3060, 3070, 3081, 4370];
const skip = (gs: number) => CORES.includes(gs);

describe('Task 1 — Start Here is a movable card in the saved Home order', () => {
  it('[R2] a saved order without Start Here reads with it at the default place, and is NOT rewritten', async () => {
    await launch([3060, 11, 22]);
    assert.ok(typeof S === 'number' && S < 0, 'a marker no topic gs can be');
    assert.deepEqual(home.getHomeOrder(), [S, 3060, 11, 22]);
    assert.deepEqual(home.getHomeGs(), [3060, 11, 22], 'the topic view never shows the marker');
    assert.equal(home.startHereAfter(home.getHomeOrder(), skip), null, 'default place: right after Career Finder');
    assert.deepEqual(saved(), [3060, 11, 22], 'reading did not rewrite the stored order');
    // A topic toggle from Enrollments writes the list as it was — no marker forced in.
    home.toggleHome(33);
    await settle();
    assert.deepEqual(saved(), [3060, 11, 22, 33]);
  });

  it('[R2] a Home Setup save stores where the learner left it, and it stays there across launches', async () => {
    await launch([3060, 11, 22]);
    // The sheet saves cores first, then its rows — Start Here dragged below 11.
    assert.equal(await home.setHomeGs([3060, 11, S, 22]), true);
    assert.deepEqual(saved(), [3060, 11, S, 22]);
    await relaunch();
    assert.deepEqual(home.getHomeOrder(), [3060, 11, S, 22]);
    assert.deepEqual(home.getHomeGs(), [3060, 11, 22]);
    assert.equal(home.startHereAfter(home.getHomeOrder(), skip), 11, 'on the deck right after the card it was left below');
    // Moved back to the top row: a saved slot at the front IS the default place.
    assert.equal(await home.setHomeGs([3060, S, 11, 22]), true);
    await relaunch();
    assert.equal(home.startHereAfter(home.getHomeOrder(), skip), null);
  });

  it('[R2] later topic adds and removals keep it in place, like any card', async () => {
    await launch([3060, 11, S, 22]);
    home.toggleHome(44); // added from Enrollments → appended, after Start Here
    home.toggleHome(22); // removed
    await settle();
    assert.deepEqual(saved(), [3060, 11, S, 44]);
    home.removeHome(11); // the card it followed leaves Home → it follows the next one up
    await settle();
    assert.deepEqual(saved(), [3060, S, 44]);
    assert.equal(home.startHereAfter(home.getHomeOrder(), skip), null, 'only a core above it → its default place');
  });

  it('[R2] Start Here never counts toward the 20-card cap and can never be the landing default', async () => {
    const twenty = Array.from({ length: 20 }, (_, i) => i + 1);
    await launch([S, ...twenty]);
    assert.equal(home.getHomeGs().length, 20, 'the 20th topic was not cut to make room for the marker');
    assert.equal(home.homeCardCount(), 20);
    assert.equal(home.toggleHome(99), 'full');
    assert.equal(await home.setHomeGs([...twenty, S]), true);
    assert.deepEqual(saved(), [...twenty, S]);
    await home.setDefaultHomeGs(S);
    assert.equal(home.getDefaultHomeGs(), null, 'Start Here is not a topic, so not a landing default');
  });

  it('[R2] the views hand React the same array until the list changes', async () => {
    await launch([11, S, 22]);
    assert.equal(home.getHomeGs(), home.getHomeGs());
    assert.equal(home.getHomeOrder(), home.getHomeOrder());
  });

  it('three faces: an UNREADABLE saved order is never overwritten by a Home Setup save', async () => {
    disk.failReads = false;
    disk.clear();
    disk.set('ape:homeCards', JSON.stringify([3060, 11, S, 22]));
    home.resetLocal();
    disk.failReads = true;
    void home.getHomeGs(); // the sheet opens — the read throws
    await settle();
    disk.failReads = false;
    // The sheet's draft from the placeholder: Start Here at its default place.
    assert.deepEqual(home.getHomeOrder(), [S]);
    assert.equal(await home.setHomeGs([S, 5]), false, 'refused, and the sheet says "Home not saved"');
    await settle();
    assert.deepEqual(saved(), [3060, 11, S, 22], 'the learner’s placement survived');
  });

  it('[R2] startHereAfter skips the cores the sheet keeps in front, and anything the deck hides', () => {
    assert.equal(home.startHereAfter([S, 11], skip), null);
    assert.equal(home.startHereAfter([3060, S, 11], skip), null);
    assert.equal(home.startHereAfter([11, 3070, S, 22], skip), 11);
    assert.equal(home.startHereAfter([11, 22], skip), null, 'never placed');
  });
});

describe('Task 1 — the screens', () => {
  const deck = read('src/screens/courses/CourseSelectionScreen.tsx');
  const sheet = read('src/screens/enrollment/HomeSetupSheet.tsx');

  it('[R2] the member deck no longer pins Start Here; it is placed from the saved order', () => {
    assert.match(deck, /c\.kind === 'careerFinder',\s*\);/, 'the pinned head ends at Career Finder');
    assert.doesNotMatch(deck, /c\.kind === 'careerFinder' \|\|\s*c\.kind === 'startHere'/);
    assert.match(deck, /const homeOrder = useHomeOrder\(\);/);
    assert.match(deck, /const shAfter = startHereAfter\(\s*homeOrder,/);
    assert.match(deck, /if \(anchor < 0\) return \[\.\.\.fixed, \.\.\.startHere, \.\.\.bundleCards, \.\.\.topicCards, \.\.\.showcase\];/,
      'never placed (or its card gone) → its default place, right after Career Finder');
    assert.match(deck, /\.\.\.topicCards\.slice\(0, anchor \+ 1\),\s*\.\.\.startHere,\s*\.\.\.topicCards\.slice\(anchor \+ 1\),/);
  });

  it('guests and non-members keep the code-built default deck (unchanged)', () => {
    assert.match(deck, /\{ kind: 'careerFinder', id: 'careerFinder' \},[\s\S]{0,400}\{ kind: 'startHere', id: 'startHere' \},/);
    assert.match(deck, /if \(entitlement === 'academy' && \(homeGs\.length > 0 \|\| homeBundleKeys\.length > 0\)\)/);
  });

  it('[R2] Home Setup lists Start Here as a draggable, always-on row and saves its slot', () => {
    assert.match(sheet, /const home = getHomeOrder\(\);/);
    assert.match(sheet, /home\.filter\(\(g\) => g === HOME_START_HERE \|\| enrolledNonCore\.includes\(g\)\)/);
    assert.match(sheet, /const editableOn = order\.filter\(\(g\) => g === HOME_START_HERE \|\| onSet\.has\(g\)\);/);
    assert.match(sheet, /if \(gs === HOME_START_HERE\) \{/);
    assert.match(sheet, /Always on your Home · drag to move it/);
    // Its row drags exactly like a topic row, and has no Home toggle / DEFAULT.
    const row = sheet.slice(sheet.indexOf('if (gs === HOME_START_HERE) {'), sheet.indexOf('const on = onSet.has(gs);'));
    assert.match(row, /\{\.\.\.\(paid \? rowPan\(gs\)\.panHandlers : \{\}\)\}/);
    assert.match(row, /\{\.\.\.\(paid \? rowTouch\(gs\) : \{\}\)\}/);
    assert.doesNotMatch(row, /toggleRow|setDefaultDraft|<Pressable/);
    // The "no topics yet" line still shows with only Start Here in the list.
    assert.match(sheet, /\{enrolledNonCore\.length === 0 \? \(\s*<Text style=\{styles\.empty\}>/);
  });
});

describe('Task 2 — the Flashcards tutorial waits for the welcome and the intro', () => {
  const fc = read('src/screens/study/FlashcardsScreen.tsx');
  const tw = read('src/features/intro/TopicWelcomeSheet.tsx');

  it('[R2] the tutorial is blocked while the intro or the welcome is up or owed, then for the closing fade', () => {
    assert.match(fc, /const \[welcomeOwed, setWelcomeOwed\] = useState\(true\);/, 'owed until the welcome reports in');
    assert.match(fc, /const introsOwed = flashIntro\.owed \|\| welcomeOwed;/);
    assert.match(fc, /setTimeout\(\(\) => setIntrosSettled\(true\), Math\.max\(HOST_DISMISS_MS, rootModalHoldMs\(\)\)\)/);
    assert.match(fc, /const tutorialBlocked =\s*[^;]*\|\| !introsSettled;/);
    assert.match(fc, /onOwedChange=\{setWelcomeOwed\}/);
  });

  it('a blocked tutorial is deferred (not marked seen) and shows once the block lifts (unchanged path)', () => {
    assert.match(fc, /if \(tutorialBlockedRef\.current\) \{[\s\S]{0,200}else setPendingTutorial\(\(cur\) => cur \?\? key\);\s*return;/);
    assert.match(fc, /if \(tutorialBlocked \|\| !pendingTutorial\) return;\s*setPendingTutorial\(null\);\s*showTutorialRef\.current\(pendingTutorial\);/);
  });

  it('[R2] the welcome reports "owed" until its lookup answers on every exit, and while it is due', () => {
    assert.match(tw, /onOwedChange\?: \(owed: boolean\) => void;/);
    assert.match(tw, /\.finally\(\(\) => setLooked\(true\)\);/);
    assert.match(tw, /const owed = enabled && !!topicId && \(!looked \|\| visible\);/);
    assert.match(tw, /onOwedRef\.current\?\.\(owed\);/);
  });
});
