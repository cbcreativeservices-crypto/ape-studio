/**
 * A refused device-local write is TOLD to the user — once (owner ruling
 * 2026-10-03: "if it fails the user needs to know").
 *
 * The shared safe store (createLocalStore) answers every write with a boolean,
 * and the quick fire-and-forget saves — bookmark/star toggles, Home book
 * toggles, enrolled bundles, deck order, tuner prefs, pace, mixing priorities,
 * cymatics ticks — dropped it: a full phone lost the change in silence. Now a
 * write the DEVICE refuses raises ONE shared, rate-limited notice
 * (src/features/storage/saveFailureNotice.ts) unless the caller opted out with
 * `{ reportFailure: false }` because it says so itself or the write is not the
 * user's change. A write dropped by the account wipe is never reported.
 *
 * Driven for real on a fake AsyncStorage whose writes can be refused and held.
 * R2: against the store before this change the "raises the notice once" and
 * "inherits" tests fail (nothing reports); the ratchet's source receipts fail
 * against the pre-change Settings / measurement / App files.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join, relative, sep } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__FSN_AS__ = AS;
g.__FSN_FAIL_WRITES__ = false;
g.__FSN_WHOLD__ = null;

const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__FSN_AS__;
     export default {
       async getItem(k) { return s.has(k) ? s.get(k) : null; },
       async setItem(k, v) {
         // Decided NOW (the device's answer), delivered after the hold — a
         // write in flight when the account wipe lands.
         const fail = globalThis.__FSN_FAIL_WRITES__;
         const h = globalThis.__FSN_WHOLD__; if (h) await h;
         if (fail) throw new Error('storage write failed');
         s.set(k, v);
       },
       async removeItem(k) { s.delete(k); },
     };`,
  );

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { createLocalStore } = await import('../src/features/storage/localStore.ts');
const notice = await import('../src/features/storage/saveFailureNotice.ts');

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

let clock = 1_000_000;
let shown: { title: string; body: string; dismiss: () => void }[] = [];
let n = 0;
async function fresh() {
  AS.clear();
  g.__FSN_FAIL_WRITES__ = false;
  g.__FSN_WHOLD__ = null;
  clock = 1_000_000;
  shown = [];
  notice.__resetSaveFailureNoticeForTests(() => clock);
  notice.setSaveFailurePresenter((title, body, dismiss) => shown.push({ title, body, dismiss }));
  const store = createLocalStore<string[]>({
    key: `ape:test:fsn:${n++}`,
    empty: () => [],
    parse: (p) => {
      if (!Array.isArray(p)) throw new Error('not a list');
      return p.filter((x): x is string => typeof x === 'string');
    },
  });
  await store.hydrate();
  return store;
}

describe('a refused safe-store write raises the shared notice — once', () => {
  it('a refused write raises the notice once, in the owner’s words', async () => {
    const store = await fresh();
    g.__FSN_FAIL_WRITES__ = true;
    assert.equal(await store.mutate((l) => [...l, 'star']), false);
    assert.equal(shown.length, 1, 'a refused write nobody handled was not told to the user');
    assert.equal(shown[0].title, "Some changes couldn't be saved");
    assert.equal(
      shown[0].body,
      "This phone couldn't save your latest changes, so they may be gone the next time the app opens. Free up some storage space, then try again.",
    );
  });

  it('a second refusal soon after does not raise it again — up, dismissed, or within the quiet window', async () => {
    const store = await fresh();
    g.__FSN_FAIL_WRITES__ = true;
    await store.mutate((l) => [...l, 'a']);
    await store.mutate((l) => [...l, 'b']); // still up
    assert.equal(shown.length, 1);
    clock += 30_000;
    shown[0].dismiss();
    clock += 60_000; // a minute after dismissing
    await store.mutate((l) => [...l, 'c']);
    assert.equal(shown.length, 1, 'mashing a star on a full phone must not be a popup per tap');
    // A NEW burst, well after the quiet window, is told again.
    clock += notice.SAVE_FAILURE_QUIET_MS + 1;
    await store.mutate((l) => [...l, 'd']);
    assert.equal(shown.length, 2);
  });

  it('a write the device ACCEPTED raises nothing', async () => {
    const store = await fresh();
    assert.equal(await store.mutate((l) => [...l, 'ok']), true);
    assert.equal(shown.length, 0);
  });

  it('a caller that says it itself (reportFailure: false) gets nothing from the shared path — set and mutate', async () => {
    const store = await fresh();
    g.__FSN_FAIL_WRITES__ = true;
    assert.equal(await store.set(['x'], { reportFailure: false }), false, 'the caller still gets the false to say it');
    assert.equal(await store.mutate((l) => [...l, 'y'], { reportFailure: false }), false);
    assert.equal(shown.length, 0, 'two messages for one failure');
  });

  it('queued before the read: one write carries both changes; a handled caller among them speaks for it', async () => {
    AS.clear();
    notice.__resetSaveFailureNoticeForTests(() => clock);
    shown = [];
    notice.setSaveFailurePresenter((title, body, dismiss) => shown.push({ title, body, dismiss }));
    const store = createLocalStore<string[]>({ key: `ape:test:fsn:${n++}`, empty: () => [], parse: (p) => p as string[] });
    g.__FSN_FAIL_WRITES__ = true;
    const a = store.mutate((l) => [...l, 'toggle']);
    const b = store.mutate((l) => [...l, 'sheet'], { reportFailure: false });
    assert.deepEqual([await a, await b], [false, false]);
    assert.equal(shown.length, 0);
    // …and with no handled caller in the batch, the batch is reported once.
    const store2 = createLocalStore<string[]>({ key: `ape:test:fsn:${n++}`, empty: () => [], parse: (p) => p as string[] });
    const c = store2.mutate((l) => [...l, 'one']);
    const d = store2.mutate((l) => [...l, 'two']);
    assert.deepEqual([await c, await d], [false, false]);
    assert.equal(shown.length, 1);
  });

  it('a wipe-fenced write raises nothing — dropped before it ran, or refused after the account changed', async () => {
    const store = await fresh();
    g.__FSN_FAIL_WRITES__ = true;
    const dropped = store.mutate((l) => [...l, 'departing']);
    store.reset(); // the account wipe, before the write ran
    assert.equal(await dropped, false);
    await settle();
    assert.equal(shown.length, 0, 'a write the wipe dropped is not a failure the user caused');

    const store2 = await fresh();
    g.__FSN_FAIL_WRITES__ = true;
    const hold = deferred();
    g.__FSN_WHOLD__ = hold.promise;
    const inFlight = store2.mutate((l) => [...l, 'departing']);
    await settle();
    store2.reset(); // the wipe lands while the device is still answering
    hold.resolve();
    assert.equal(await inFlight, false);
    await settle();
    assert.equal(shown.length, 0, 'the departing account’s refused write was reported to the next account');
  });

  it('a failure before the dialog is wired is shown once it is', async () => {
    const store = await fresh();
    notice.__resetSaveFailureNoticeForTests(() => clock);
    g.__FSN_FAIL_WRITES__ = true;
    await store.mutate((l) => [...l, 'early']);
    await store.mutate((l) => [...l, 'early2']);
    notice.setSaveFailurePresenter((title, body, dismiss) => shown.push({ title, body, dismiss }));
    assert.equal(shown.length, 1);
  });
});

// ── the ratchet ─────────────────────────────────────────────────────────────

const SRC = fileURLToPath(new URL('../src', import.meta.url));
const ROOT = fileURLToPath(new URL('..', import.meta.url));
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}
const FILES = walk(SRC).map((p) => [relative(SRC, p).split(sep).join('/'), readFileSync(p, 'utf8').replace(/\r\n/g, '\n')] as const);
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');

/**
 * Files that WRITE AsyncStorage directly (hand-rolled), frozen 2026-10-03.
 * A new device-local store goes on createLocalStore and so inherits the
 * shared failed-save notice; this list may only SHRINK (a file moved onto the
 * safe store must be removed here).
 */
const DIRECT_WRITERS = new Set([
  'components/StudyFsOverlay.tsx',
  'features/account/accountLocalSync.ts',
  'features/account/deviceIdentity.ts',
  'features/amp/ampProgress.ts',
  'features/assess/attemptDraft.ts',
  'features/audio/exposureMonitor.ts',
  'features/audio/soundSafetyAck.ts',
  'features/careerfinder/store.ts',
  'features/celebration/useCredentialCelebration.ts',
  'features/commercial/EntitlementProvider.tsx',
  'features/commercial/lastTierCache.ts',
  'features/curriculum/academyStats.ts',
  'features/dashboard/api.ts',
  'features/dev/popupSuppressStore.ts',
  'features/directory/legacyMigration.ts',
  'features/ear/earProgress.ts',
  'features/finalExam/api.ts',
  'features/glossary/autoOfflinePref.ts',
  'features/glossary/deviceKey.ts',
  'features/glossary/glossaryCap.ts',
  'features/glossary/linksPref.ts',
  'features/intro/ScreenIntroOverlay.tsx',
  'features/intro/TopicWelcomeSheet.tsx',
  'features/intro/onboardingFlow.ts',
  'features/lab/amplitudeOrientation.ts',
  'features/lab/calcUsage.ts',
  'features/lab/labCompletion.ts',
  'features/lab/labVisits.ts',
  'features/lab/pagedProgress.ts',
  'features/notifications/localSchedule.ts',
  'features/onboarding/attractStore.ts',
  'features/permissions/permissionStore.ts',
  'features/profile/bigPicturePref.ts',
  'features/profile/publicProfile.ts',
  'features/quiz/api.ts',
  'features/review/reviewPrompt.ts',
  'features/roomdesign/roomDesignStore.ts',
  'features/settings/lowLight.ts',
  'features/settings/store.ts',
  'features/startHere/firstOpen.ts',
  'features/storage/localStore.ts',
  'features/study/localProgress.ts',
  'features/tools/colorModePref.ts',
  'features/tools/measure/deviceProfile.ts',
  'features/tools/measure/measurementsBackend.ts',
  'features/tools/waveColorPref.ts',
  'features/tuning/tuningProgress.ts',
  'lib/authStorage.native.ts',
  'lib/coachMark.ts',
  'screens/auth/AuthScreen.tsx',
  'screens/awards/AwardsScreen.tsx',
  'screens/dashboard/DashboardScreen.tsx',
  'screens/glossary/GlossaryScreen.tsx',
  'screens/lab/cableinstall/CableInstallLabScreen.tsx',
  'screens/lab/calc/calcPrefs.ts',
  'screens/lab/calc/workflowStore.ts',
  'screens/lab/drumtuning/drumProgress.ts',
  'screens/lab/mastering/masteringProgress.ts',
  'screens/lab/meter/modules/modMeterC.tsx',
  'screens/lab/mixing/kit.tsx',
  'screens/lab/rack/RackUnit.tsx',
  'screens/study/FlashcardsScreen.tsx',
  'screens/tools/SplMeterScreen.tsx',
]);

/** Every `{ reportFailure: false }` in src/, with why the shared notice would
 *  be a second message or not the user's change. May only SHRINK. */
const OPT_OUTS: Record<string, { count: number; why: string }> = {
  'features/home/homeCardsStore.ts': { count: 3, why: 'setHomeGs / setDefaultHomeGs: Home Setup says "Home not saved" itself' },
  'features/tools/measure/calibrationStore.ts': { count: 1, why: 'setSplCalibration: the SPL meter says "Calibration not saved / not cleared"' },
  'features/audio/exposureMonitor.ts': { count: 1, why: 'updateExposureSettings: the Exposure screen says "Setting not saved"' },
  'features/study/scenarioQueue.ts': { count: 3, why: 'queueScenarioCall: the Scenarios report says the device could not keep them; the drain and the wipe’s clear are bookkeeping' },
  'features/tools/measure/deviceProfile.ts': { count: 1, why: 'removeQueuedContributions: bookkeeping after an upload; a leftover row is deduped server-side' },
  'features/soundsystems/progress.ts': { count: 1, why: 'resetSoundSystemsProgress: only the account wipe calls it; the ape:* sweep removes the key' },
  'features/study/scenarioExempt.ts': { count: 1, why: 'a derived cache: a lost marker is found again on the next fetch' },
  'features/study/termsExempt.ts': { count: 1, why: 'a derived cache: a lost marker is found again on the next fetch' },
  'features/celebration/celebrationSeen.ts': { count: 1, why: 'the app’s own seen-marker, not a change the user made' },
  'features/enrollment/enrollmentStore.ts': { count: 1, why: 'the server list adopted on a pristine device: a refusal is re-adopted next launch' },
};

describe('RATCHET — device-local user data inherits the failed-save notice', () => {
  it('no NEW file writes AsyncStorage directly: new stores use createLocalStore (the list only shrinks)', () => {
    const writers = FILES.filter(([, s]) => /AsyncStorage\.(setItem|multiSet|mergeItem)\(/.test(s)).map(([f]) => f);
    const fresh = writers.filter((f) => !DIRECT_WRITERS.has(f));
    assert.deepEqual(fresh, [], `new hand-rolled storage writer(s): ${fresh.join(', ')} — use createLocalStore, which reports a refused write`);
    const stale = [...DIRECT_WRITERS].filter((f) => !writers.includes(f));
    assert.deepEqual(stale, [], `no longer a direct writer — remove from DIRECT_WRITERS: ${stale.join(', ')}`);
  });

  it('every opt-out of the shared notice is listed with its reason (the list only shrinks)', () => {
    const found: Record<string, number> = {};
    for (const [f, s] of FILES) {
      if (f === 'features/storage/localStore.ts' || f === 'features/storage/saveFailureNotice.ts') continue;
      const c = (s.match(/reportFailure: false/g) ?? []).length;
      if (c > 0) found[f] = c;
    }
    const want = Object.fromEntries(Object.entries(OPT_OUTS).map(([f, v]) => [f, v.count]));
    assert.deepEqual(found, want, 'an unlisted (or moved) opt-out: a caller that drops the result must leave reporting on');
    for (const [f, v] of Object.entries(OPT_OUTS)) assert.ok(v.why.length > 10, `${f}: needs a reason`);
  });

  it('the handled opt-outs really are handled by their screens', () => {
    assert.match(read('src/screens/enrollment/HomeSetupSheet.tsx'), /notify\('Home not saved'/);
    assert.match(read('src/screens/tools/SplMeterScreen.tsx'), /'Calibration not saved'/);
    assert.match(read('src/screens/tools/ExposureMonitorScreen.tsx'), /'Setting not saved'/);
    assert.match(read('src/screens/study/ScenariosScreen.tsx'), /recordScenarioAnswer\([^)]*\)\.then\(\(kept\) =>/);
  });

  it('the safe store reports a refused write, fenced by the generation, and never the wipe’s drop', () => {
    const s = read('src/features/storage/localStore.ts');
    assert.match(s, /import \{ reportUnhandledSaveFailure \} from '\.\/saveFailureNotice';/);
    assert.match(s, /\} catch \{[\s\S]{0,200}if \(report && gen === generation\) reportUnhandledSaveFailure\(\);\s*return false;/);
    assert.match(s, /if \(gen !== generation\) return false;/);
  });

  it('hand-rolled writes that only reached the console now reach the user (Settings, a measurement edit)', () => {
    const settings = read('src/features/settings/store.ts');
    assert.match(settings, /console\.warn\('\[settings\] device write failed[\s\S]{0,400}if \(gen === settingsGen\) reportUnhandledSaveFailure\(\);/);
    const meas = read('src/features/tools/measure/measurementStore.ts');
    assert.match(meas, /guard\('update', putRow\(rowOf\(next\)\), \(\) => \{\s*if \(gen === generation\) reportUnhandledSaveFailure\(\);/);
  });

  it('App wires the notice through notify (AppDialog), never a raw Alert', () => {
    const app = read('App.tsx');
    assert.match(app, /setSaveFailurePresenter\(\(title, body, onDismiss\) => notify\(title, body, onDismiss\)\);/);
    assert.doesNotMatch(read('src/features/storage/saveFailureNotice.ts'), /Alert\.alert|from 'react-native'/);
  });
});
