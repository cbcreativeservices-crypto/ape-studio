/**
 * The hand-rolled device writes that swallowed a refusal now TELL the user
 * (owner ruling 2026-10-03: "if it fails the user needs to know"; the owner
 * said yes to this cleanup).
 *
 * failedSaveNotice_20261003 gave createLocalStore the shared, rate-limited
 * notice. This pass sweeps every remaining hand-rolled AsyncStorage write in
 * src/ and classifies it:
 *   (A) the user's own change (a choice, a toggle, progress, notes, a pref):
 *       its failure path raises the shared notice — reportUnhandledSaveFailure()
 *       behind the store's own wipe generation, or armSaveFailureReport()
 *       (fenced by the account-wipe count) where the store has none;
 *   (B) app bookkeeping (caches, seen-flags, telemetry, markers, the wipe):
 *       silent, with a one-line reason at the site and in SILENT below;
 *   (C) a caller that already shows its own message: silent here (one
 *       message per failure, never two), reason in SILENT below.
 *
 * Driven for real on a fake AsyncStorage whose writes can be refused and
 * held. R2: against the pre-change files every "raises the notice" test
 * below fails (nothing reported), and the REPORTED source pins fail.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join, relative, sep } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__FSL_AS__ = AS;
g.__FSL_FAIL__ = false;
g.__FSL_HOLD__ = null;

const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__FSL_AS__;
     async function answer() {
       const fail = globalThis.__FSL_FAIL__; // the device's answer, decided now
       const h = globalThis.__FSL_HOLD__; if (h) await h;
       if (fail) throw new Error('storage write failed');
     }
     export default {
       async getItem(k) { return s.has(k) ? s.get(k) : null; },
       async multiGet(ks) { return ks.map((k) => [k, s.has(k) ? s.get(k) : null]); },
       async getAllKeys() { return [...s.keys()]; },
       async setItem(k, v) { await answer(); s.set(k, v); },
       async removeItem(k) { await answer(); s.delete(k); },
       async multiSet(rows) { await answer(); for (const [k, v] of rows) s.set(k, v); },
       async multiRemove(ks) { await answer(); for (const k of ks) s.delete(k); },
     };`,
  );

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    // The Career Finder index is JSON (Metro imports it bare).
    if (specifier.endsWith('.json')) return { ...nextResolve(specifier, context), importAttributes: { type: 'json' } };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      for (const ext of ['.ts', '.tsx']) {
        const candidate = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
});

const notice = await import('../src/features/storage/saveFailureNotice.ts');
const { resetRegisteredLocalStores } = await import('../src/features/storage/localStoreRegistry.ts');
const amp = await import('../src/features/amp/ampProgress.ts');
const ear = await import('../src/features/ear/earProgress.ts');
const finder = await import('../src/features/careerfinder/store.ts');
const { QUESTIONS } = await import('../src/features/careerfinder/questions.ts');
const drum = await import('../src/screens/lab/drumtuning/drumProgress.ts');
const paged = await import('../src/features/lab/pagedProgress.ts');
const tuning = await import('../src/features/tuning/tuningProgress.ts');
const localProgress = await import('../src/features/study/localProgress.ts');
const { workflowStore } = await import('../src/screens/lab/calc/workflowStore.ts');
const permissions = await import('../src/features/permissions/permissionStore.ts');
const autoOffline = await import('../src/features/glossary/autoOfflinePref.ts');
const bigPicture = await import('../src/features/profile/bigPicturePref.ts');
const lowLight = await import('../src/features/settings/lowLight.ts');
const safety = await import('../src/features/audio/soundSafetyAck.ts');

const settle = async () => {
  for (let i = 0; i < 40; i++) await Promise.resolve();
  await new Promise<void>((r) => setImmediate(r));
  for (let i = 0; i < 40; i++) await Promise.resolve();
};
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

let shown = 0;
/** A fresh session on a phone that REFUSES writes (unless `ok`). */
async function fresh(ok = false) {
  await settle();
  AS.clear();
  g.__FSL_HOLD__ = null;
  g.__FSL_FAIL__ = !ok;
  shown = 0;
  notice.__resetSaveFailureNoticeForTests(() => 1_000_000);
  notice.setSaveFailurePresenter(() => {
    shown++;
  });
}

describe('(A) the user’s own change, refused by the device, raises the shared notice', () => {
  it('Amplifier lab progress (saveAmpProgress)', async () => {
    await fresh();
    await amp.saveAmpProgress({ modules: {} });
    assert.equal(shown, 1, 'a refused lab save was swallowed');
  });

  it('Ear training ladder (saveEarProgress)', async () => {
    await fresh();
    await ear.saveEarProgress({ modules: {}, subBassOk: true });
    assert.equal(shown, 1);
  });

  it('Career Finder: an answer is told; the Results form’s feedback is not (it says "not saved" itself)', async () => {
    await fresh();
    finder.answerQuestion(QUESTIONS[0].id, 3 as never);
    await settle();
    assert.equal(shown, 1, 'a refused answer was swallowed');
    await fresh();
    assert.equal(await finder.setCareerFinderFeedback('yes', 'note'), false);
    assert.equal(shown, 0, 'two messages for one failure');
    assert.equal(await finder.setCareerFinderFeedback('yes', 'note on the way out', true), false);
    assert.equal(shown, 1, 'the save on the way out has no form left to say it');
  });

  it('Drum Tuning progress is told; a tuning note is not (the screen says "not saved"); never across the wipe', async () => {
    await fresh();
    await drum.updateDrumProgress((s) => {
      s.lastStep = 2;
    });
    assert.equal(shown, 1, 'a refused drum update was swallowed');
    await fresh();
    const r = await drum.saveTuningNote({ id: 'n1', savedAt: 1 } as never);
    assert.equal(r.saved, false);
    assert.equal(shown, 0, 'two messages for one failure');
    // In flight when the account wipe lands: the departing account's write.
    await fresh();
    const hold = deferred();
    g.__FSL_HOLD__ = hold.promise;
    const p = drum.updateDrumProgress((s) => {
      s.lastStep = 3;
    });
    await settle();
    resetRegisteredLocalStores();
    hold.resolve();
    await p;
    await settle();
    assert.equal(shown, 0, 'the departing account’s refused write was reported');
  });

  it('a paged lab’s page and its practice reset; the armed fence keeps the wipe silent', async () => {
    await fresh();
    await paged.savePagedProgress('legacyLab', { completed: [0], lastPage: 0, done: false });
    assert.equal(shown, 1);
    await fresh();
    await paged.resetPagedProgress('legacyLab');
    assert.equal(shown, 1, 'a practice reset that did not stick was silent');
    await fresh();
    const hold = deferred();
    g.__FSL_HOLD__ = hold.promise;
    const p = paged.savePagedProgress('legacyLab', { completed: [1], lastPage: 1, done: false });
    await settle();
    resetRegisteredLocalStores();
    hold.resolve();
    await p;
    assert.equal(shown, 0, 'armSaveFailureReport reported across the wipe');
  });

  it('Tuning lab chapters (saveTuningProgress)', async () => {
    await fresh();
    await tuning.saveTuningProgress({ completed: [0], lastChapter: 0, done: false, mathView: false });
    assert.equal(shown, 1);
  });

  it('study progress mirror (saveLocalMethodStates) — the only copy for a guest', async () => {
    await fresh();
    assert.equal(await localProgress.saveLocalMethodStates('ach1', 'flashcards', { t1: 'known' } as never), false);
    assert.equal(shown, 1);
  });

  it('Calc workflows: a ★ and a ▲▼ are told; a SAVE is not (the screen says "failed save" itself)', async () => {
    await fresh();
    assert.deepEqual(await workflowStore.toggleFavorite('wf1'), []);
    assert.equal(shown, 1, 'a ★ that silently did not stick');
    await fresh();
    assert.equal(await workflowStore.saveWorkflow({ id: 'w1', name: 'W', steps: [] } as never), false);
    assert.equal(shown, 0, 'two messages for one failure');
  });

  it('permission prompts: the user’s "never" is told; the Settings reset REJECTS (Settings says so) and raises nothing', async () => {
    await fresh();
    await permissions.setAskMode('camera', 'never');
    assert.equal(shown, 1);
    await fresh();
    await assert.rejects(permissions.resetAskModes());
    assert.equal(shown, 0);
    await fresh(true);
    await permissions.resetAskModes(); // accepted: resolves
  });

  it('device preferences: glossary auto-offline, the big-picture switch, Low-Light (once for its pair of writes)', async () => {
    await fresh();
    await autoOffline.setAutoOffline(false);
    assert.equal(shown, 1);
    await fresh();
    await bigPicture.saveShowBigPicture(true);
    assert.equal(shown, 1);
    await fresh();
    lowLight.setLowLight(!lowLight.getLowLight());
    await settle();
    assert.equal(shown, 1);
  });

  it('the sound-safety ACCEPT the device refused is told (the gate closes and says nothing itself)', async () => {
    await fresh();
    assert.equal(await safety.recordSoundSafetyAck({ text: 't', appVersion: null, userId: null }), false);
    assert.equal(shown, 1);
  });

  it('a write the device ACCEPTED raises nothing', async () => {
    await fresh(true);
    await amp.saveAmpProgress({ modules: {} });
    await permissions.setAskMode('mic', 'always');
    await autoOffline.setAutoOffline(true);
    assert.equal(shown, 0);
  });
});

// ── the ratchet ─────────────────────────────────────────────────────────────

const SRC = fileURLToPath(new URL('../src', import.meta.url));
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

const WRITE = /^(setItem|multiSet|removeItem|multiRemove|mergeItem)$/;
const REPORTS = /reportUnhandledSaveFailure\(|reportRefused\(|armSaveFailureReport\(\)/;
const codeOf = (n: ts.Node) => n.getText().replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
const isFn = (n: ts.Node) => ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isFunctionDeclaration(n) || ts.isMethodDeclaration(n);
function hasThrow(n: ts.Node): boolean {
  let found = false;
  (function v(x: ts.Node) {
    if (found || (x !== n && isFn(x))) return;
    if (ts.isThrowStatement(x)) found = true;
    else ts.forEachChild(x, v);
  })(n);
  return found;
}

type Kind = 'reported' | 'silent' | 'propagates';
/**
 * How a refusal of this write is handled, judged on the AST:
 *   - its own `.catch(h)` / `.then(_, h)` chain, else
 *   - the nearest enclosing `try` whose try-block holds it (crossing a
 *     callback into the call it was passed to, e.g. Promise.all(map(…)) or a
 *     serialized(() => …) wrapper);
 * `reported` when that handler raises the notice, `propagates` when it
 * rethrows or there is none (the caller receives the rejection), `silent`
 * otherwise — including a `void` write with no handler at all.
 */
function judge(call: ts.CallExpression): Kind {
  let n: ts.Node = call;
  for (let hop = 0; hop < 50; hop++) {
    const handlers: ts.Node[] = [];
    for (;;) {
      const pa = n.parent;
      if (pa && ts.isParenthesizedExpression(pa)) {
        n = pa;
        continue;
      }
      if (pa && ts.isPropertyAccessExpression(pa) && pa.expression === n && /^(then|catch|finally)$/.test(pa.name.text) && ts.isCallExpression(pa.parent)) {
        const c = pa.parent;
        if (pa.name.text === 'catch' && c.arguments[0]) handlers.push(c.arguments[0]);
        if (pa.name.text === 'then' && c.arguments[1]) handlers.push(c.arguments[1]);
        n = c;
        continue;
      }
      break;
    }
    if (handlers.length) return handlers.some((h) => REPORTS.test(codeOf(h))) ? 'reported' : 'silent';
    let child: ts.Node = n;
    let p: ts.Node | undefined = n.parent;
    let restarted = false;
    while (p) {
      if (ts.isTryStatement(p) && p.tryBlock === child && p.catchClause) {
        const block = p.catchClause.block;
        if (REPORTS.test(codeOf(block))) return 'reported';
        return hasThrow(block) ? 'propagates' : 'silent';
      }
      if (isFn(p)) {
        if (p.parent && ts.isCallExpression(p.parent) && p.parent.arguments.includes(p as ts.Expression)) {
          n = p.parent;
          restarted = true;
        }
        break;
      }
      child = p;
      p = p.parent;
    }
    if (!restarted) return ts.isVoidExpression(n.parent) || ts.isExpressionStatement(n.parent) ? 'silent' : 'propagates';
  }
  return 'propagates';
}

type Tally = Record<string, Record<Kind, number>>;
function tally(): Tally {
  const out: Tally = {};
  for (const abs of walk(SRC)) {
    const rel = relative(SRC, abs).split(sep).join('/');
    const text = readFileSync(abs, 'utf8');
    if (!text.includes('AsyncStorage')) continue;
    const sf = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, rel.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    (function v(n: ts.Node) {
      if (
        ts.isCallExpression(n) &&
        ts.isPropertyAccessExpression(n.expression) &&
        ts.isIdentifier(n.expression.expression) &&
        n.expression.expression.text === 'AsyncStorage' &&
        WRITE.test(n.expression.name.text)
      ) {
        const t = (out[rel] ??= { reported: 0, silent: 0, propagates: 0 });
        t[judge(n)]++;
      }
      ts.forEachChild(n, v);
    })(sf);
  }
  return out;
}

/**
 * (A) receipts: how many writes in each file now raise the notice on a
 * refusal. Pinned exactly — a reported site turned silent fails here.
 */
const REPORTED: Record<string, number> = {
  'features/amp/ampProgress.ts': 2, // save + the sign-in hand-off
  'features/audio/soundSafetyAck.ts': 1, // the ACCEPT
  'features/careerfinder/store.ts': 1, // persist (answers, ★, resets; feedback only on the way out)
  'features/ear/earProgress.ts': 2, // save + the hand-off
  'features/glossary/autoOfflinePref.ts': 1,
  'features/glossary/deviceKey.ts': 1, // the device-key consent the user granted
  'features/glossary/linksPref.ts': 1,
  'features/lab/labCompletion.ts': 1, // units cleared
  'features/lab/labVisits.ts': 2, // visits + the hand-off
  'features/lab/pagedProgress.ts': 3, // page, hand-off, practice reset
  'features/permissions/permissionStore.ts': 1, // "always" / "never"
  'features/profile/bigPicturePref.ts': 1,
  'features/profile/publicProfile.ts': 1, // profile edits
  'features/roomdesign/roomDesignStore.ts': 1, // the guest's designs carried at sign-in
  'features/settings/lowLight.ts': 2, // the switch (its two keys)
  'features/settings/store.ts': 1, // (2026-10-03, failedSaveNotice)
  'features/storage/localStore.ts': 2, // (the safe store itself)
  'features/study/localProgress.ts': 1, // study progress mirror
  'features/tools/colorModePref.ts': 1,
  'features/tools/measure/deviceProfile.ts': 1, // the crowdsource opt-in answer
  'features/tools/waveColorPref.ts': 2, // pick / clear
  'features/tuning/tuningProgress.ts': 3, // chapters, hand-off, practice reset
  'screens/awards/AwardsScreen.tsx': 2, // the specialization / program-path pick
  'screens/glossary/GlossaryScreen.tsx': 1, // the BEG/ADV speaker switch
  'screens/lab/cableinstall/CableInstallLabScreen.tsx': 1, // step + scores + myths
  'screens/lab/calc/calcPrefs.ts': 1, // section open/closed
  'screens/lab/calc/workflowStore.ts': 1, // saveList: reports for ★ and ▲▼ only (report = true)
  'screens/lab/drumtuning/drumProgress.ts': 1, // progress + hand-off (notes say it on screen)
  'screens/lab/mastering/masteringProgress.ts': 2, // save + the hand-off
  'screens/lab/meter/modules/modMeterC.tsx': 2, // solved questions; the guest sign-in carry (hunt 13)
  'screens/lab/mixing/kit.tsx': 2, // focal point + the hand-off
  'screens/lab/rack/RackUnit.tsx': 1, // hide the display
  'screens/study/FlashcardsScreen.tsx': 4, // hidden cards, sections, media, links
  'screens/tools/SplMeterScreen.tsx': 1, // dimmer level + red latch
};

/**
 * Every write whose refusal stays SILENT, per file, with why: (B) app
 * bookkeeping or (C) a caller that says so itself. Frozen 2026-10-03; it may
 * only SHRINK — a new silent write needs a report or an honest reason here.
 */
const SILENT: Record<string, { count: number; why: string }> = {
  'components/StudyFsOverlay.tsx': { count: 1, why: 'B: the full-screen guide counter the app keeps; a lost count shows the guide once more' },
  'features/account/accountLocalSync.ts': { count: 1, why: 'B: the ape:localUserId identity marker, part of the wipe; a lost one re-checks on the next auth event' },
  'features/account/clearLocalAccountData.ts': { count: 1, why: 'B: the account wipe itself (multiRemove of the departing account’s keys)' },
  'features/account/deviceIdentity.ts': { count: 1, why: 'B: the generated device id; the in-memory id serves this run' },
  'features/assess/attemptDraft.ts': {
    count: 2,
    why: 'B: the crash-recovery COPY of quiz/exam answers (the answers live in memory and go to the server on submit) and its clear after submit; a popup mid timed exam would cost the learner time (judgement call, in the report)',
  },
  'features/audio/exposureMonitor.ts': {
    count: 8,
    why: 'B: the listening record the monitor writes by itself every 15 s, its index, retention pruning and the damaged set-aside (app-measured, not a change the user made); C: the two DELETES (today / history) answer false and the Exposure screen says so',
  },
  'features/audio/soundSafetyAck.ts': { count: 3, why: 'B: the damaged set-aside, and taking back a departing account’s acceptance after the wipe' },
  'features/careerfinder/store.ts': { count: 1, why: 'B: setting a damaged record aside (housekeeping)' },
  'features/celebration/useCredentialCelebration.ts': { count: 2, why: 'B: the app’s known-credentials seen-marker; a lost write costs a repeat celebration, never credit' },
  'features/commercial/EntitlementProvider.tsx': { count: 2, why: 'B: dev-only overrides (__DEV__)' },
  'features/commercial/lastTierCache.ts': { count: 2, why: 'B: a cache of the last confirmed tier, replaced by the next server answer' },
  'features/curriculum/academyStats.ts': { count: 1, why: 'B: an instant-paint cache of a server row' },
  'features/dashboard/api.ts': { count: 2, why: 'B: the resume position the app records as the learner moves (one value, replaced by the next move)' },
  'features/dev/DevVisualIndex.tsx': { count: 1, why: 'B: a dev-only tool that prints its own result line' },
  'features/dev/popupSuppressStore.ts': { count: 1, why: 'B: a dev-only switch' },
  'features/directory/legacyMigration.ts': { count: 1, why: 'B: a migration-done marker; a lost one only offers the carry-over again' },
  'features/finalExam/api.ts': {
    count: 5,
    why: 'B: the exam intent id (resume bookkeeping), its clear, the damaged-queue set-aside; C: writeQueue ANSWERS false and the Final Exam screen says the submission was not kept',
  },
  'features/glossary/deviceKey.ts': { count: 1, why: 'B: clearConsent, a forget-this-device / test path, not a change made in the app' },
  'features/glossary/glossaryCap.ts': { count: 1, why: 'B: the device-local usage meter (the app’s count of lookups)' },
  'features/intro/onboardingFlow.ts': { count: 3, why: 'B: the first-run sampler’s own marks and done-flag; a lost mark only re-offers a sample' },
  'features/intro/ScreenIntroOverlay.tsx': { count: 1, why: 'B: an intro seen-flag; a lost flag shows the intro once more' },
  'features/intro/TopicWelcomeSheet.tsx': { count: 1, why: 'B: the topic-welcome seen-flag; a lost flag shows the welcome once more' },
  'features/lab/amplitudeOrientation.ts': { count: 2, why: 'B: the orientation first-use flag and its replay (the replay already happens in memory; the wipe calls it too)' },
  'features/lab/calcUsage.ts': { count: 1, why: 'B: the device-local calculator usage meter' },
  'features/notifications/localSchedule.ts': { count: 3, why: 'B: the scheduler’s mirror of the Settings switch (Settings itself reports) and its term-batch / term-count caches' },
  'features/onboarding/attractStore.ts': { count: 1, why: 'B: Home’s own attention cues; a lost mark only lets a cue breathe again' },
  'features/permissions/permissionStore.ts': { count: 1, why: 'C: resetAskModes collects the refusal and REJECTS; Settings says "Couldn’t reset permission prompts"' },
  'features/quiz/api.ts': { count: 2, why: 'B: the quiz attempt intent id (resume bookkeeping) and its clear' },
  'features/review/reviewPrompt.ts': { count: 1, why: 'B: the store-review prompt counter (the app’s own)' },
  'features/roomdesign/roomDesignStore.ts': { count: 1, why: 'C: persist() for SAVE and DELETE answers false and the Room Design screens say "not saved" / put the row back' },
  'features/settings/lowLight.ts': { count: 1, why: 'B: touchLowLight, the app’s own last-touched clock, not the user’s change' },
  'features/startHere/firstOpen.ts': { count: 1, why: 'B: the first-open flag the app sets itself' },
  'features/storage/localStore.ts': { count: 3, why: 'B: the safe store’s damaged set-aside and its one-time prepare (migration) write, best-effort with the value in memory' },
  'features/study/localProgress.ts': { count: 1, why: 'B: clearAllLocalMethodStates, part of the account wipe' },
  'features/tools/measure/measurementsBackend.ts': { count: 1, why: 'B: setting a damaged library aside (housekeeping)' },
  'features/tools/measure/measurementStore.ts': { count: 1, why: 'B: freeing the legacy key after the SQLite migration (kept and logged when it fails)' },
  'lib/coachMark.ts': { count: 2, why: 'B: the coach-mark retire counters; a lost count shows the hint once more' },
  'screens/auth/AuthScreen.tsx': { count: 2, why: 'B: inside the Guest Mode total wipe — the finder record carried across it and the no-account identity marker' },
  'screens/awards/AwardsScreen.tsx': { count: 2, why: 'B: the RE-write on every open once the tier resolves (usually the value already stored); the pick’s own write reports' },
  'screens/dashboard/DashboardScreen.tsx': { count: 1, why: 'B: the learn-intro seen-flags' },
  'screens/glossary/GlossaryScreen.tsx': { count: 3, why: 'B: the one-shot return-to-term hand-off the app sets and clears itself' },
  'screens/lab/calc/workflowStore.ts': { count: 4, why: 'B: quarantining damaged rows (housekeeping)' },
  'screens/study/FlashcardsScreen.tsx': { count: 2, why: 'B: the tutorial seen-flag and the full-screen guide counter' },
};

/** Writes with no handler of their own: the rejection reaches the caller. */
const PROPAGATES: Record<string, { count: number; why: string }> = {
  'features/finalExam/api.ts': { count: 1, why: 'clearExamQueue: the account wipe’s clear of the exam queue' },
  'features/intro/onboardingFlow.ts': { count: 1, why: 'resetOnboarding: Help and Settings say "Couldn’t reset hints"' },
  'features/intro/screenIntros.ts': { count: 1, why: 'resetScreenIntros: Help and Settings say "Couldn’t reset hints"' },
  'features/notifications/localSchedule.ts': { count: 2, why: 'the new-terms reminder bookkeeping; the scheduler run catches it' },
  'features/tools/measure/measurementsBackend.ts': { count: 2, why: 'the web library’s row write and clear: measurementStore reports a refused edit and says a refused save itself' },
  'lib/authStorage.native.ts': { count: 4, why: 'the Supabase auth session adapter: supabase-js owns the failure' },
  'lib/coachMark.ts': { count: 1, why: 'resetCoachMarks: Help and Settings say "Couldn’t reset hints"' },
};

const T = tally();

describe('RATCHET — no storage write swallows a refusal without a report or a reason', () => {
  it('every silent write is listed with why (the list only shrinks)', () => {
    const found = Object.fromEntries(Object.entries(T).filter(([, t]) => t.silent > 0).map(([f, t]) => [f, t.silent]));
    const want = Object.fromEntries(Object.entries(SILENT).map(([f, v]) => [f, v.count]));
    assert.deepEqual(found, want, 'a NEW silent storage write (route it to reportUnhandledSaveFailure / armSaveFailureReport, or give its reason) — or one fewer: shrink SILENT');
    for (const [f, v] of Object.entries(SILENT)) assert.ok(v.why.length > 15, `${f}: needs a reason`);
  });

  it('every write that hands its rejection to the caller is listed with why (the list only shrinks)', () => {
    const found = Object.fromEntries(Object.entries(T).filter(([, t]) => t.propagates > 0).map(([f, t]) => [f, t.propagates]));
    const want = Object.fromEntries(Object.entries(PROPAGATES).map(([f, v]) => [f, v.count]));
    assert.deepEqual(found, want);
    for (const [f, v] of Object.entries(PROPAGATES)) assert.ok(v.why.length > 15, `${f}: needs a reason`);
  });

  it('(A) source receipts: the reported writes stay reported', () => {
    const found = Object.fromEntries(Object.entries(T).filter(([, t]) => t.reported > 0).map(([f, t]) => [f, t.reported]));
    assert.deepEqual(found, REPORTED);
  });

  it('the judge itself: a bare .catch(() => {}) is silent, a reporting one is not, a void write with no handler is silent', () => {
    const j = (src: string) => {
      const sf = ts.createSourceFile('x.ts', src, ts.ScriptTarget.Latest, true);
      let k: Kind | null = null;
      (function v(n: ts.Node) {
        if (ts.isCallExpression(n) && n.expression.getText(sf) === 'AsyncStorage.setItem') k = judge(n);
        ts.forEachChild(n, v);
      })(sf);
      return k;
    };
    assert.equal(j(`void AsyncStorage.setItem('k', 'v').catch(() => {});`), 'silent');
    assert.equal(j(`void AsyncStorage.setItem('k', 'v').catch(armSaveFailureReport());`), 'reported');
    assert.equal(j(`void AsyncStorage.setItem('k', 'v');`), 'silent');
    assert.equal(j(`async function f() { try { await AsyncStorage.setItem('k', 'v'); } catch { /* reportUnhandledSaveFailure() */ } }`), 'silent');
    assert.equal(j(`async function f() { try { await AsyncStorage.setItem('k', 'v'); } catch { reportRefused(); } }`), 'reported');
    assert.equal(j(`async function f() { try { await AsyncStorage.setItem('k', 'v'); } catch (e) { throw e; } }`), 'propagates');
    assert.equal(j(`async function f() { await AsyncStorage.setItem('k', 'v'); }`), 'propagates');
    assert.equal(j(`async function f() { try { await Promise.all(ks.map((k) => AsyncStorage.setItem(k, 'v'))); } catch {} }`), 'silent');
  });
});

if (process.env.FSL_DUMP) console.log(JSON.stringify(T, null, 1));
