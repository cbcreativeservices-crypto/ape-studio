/**
 * Wave 2 of the shared safe store (pattern catalog 2026-10-02, closer A2) —
 * the AUDIO SAFETY and MEASUREMENT stores:
 *
 *   • exposureMonitor (hearing safety): a read that THREW started a fresh day
 *     — dose 0 % — and the 15-second flush wrote it over the stored day, so a
 *     listener at 90 % was told 0 % for good (P1). The settings read was
 *     unfenced across the account wipe, so the departing listener's standard
 *     and reference came back for the next one (P3). updateExposureSettings
 *     answered nothing about whether the change was stored (P6).
 *   • soundSafetyAck (the hearing-damage warning): a load in flight across the
 *     wipe put the departing person's acceptance back, so the next person got
 *     sound with no warning (P3, the UNSAFE direction); an acceptance written
 *     across the wipe did the same; a failed read latched "loaded" and never
 *     read again. The safe direction is kept and pinned: a failed read RE-ASKS.
 *   • calibrationStore: a failed read marked the store hydrated, and the next
 *     CALIBRATE wrote over the stored offset (P1).
 *   • deviceProfile: the crowdsource queue's failed read answered [] — the next
 *     calibration saved a one-row queue over it, and a drain's removal turned
 *     it into removeItem of the whole queue (P1).
 *   • measurementsBackend (web): the same [] — the next save wrote a one-row
 *     library over the whole one; a save that read before the account wipe's
 *     clear wrote the departing rows back after it (P1, P3).
 *   • CenterLockTuner: its presets read swallowed a failure and the next tap
 *     saved `{ recents: [] }`-plus-one over the stored presets (P1) — source
 *     pins (RN screens cannot be imported under node).
 *
 * Every behavioural test below FAILED against the file it replaced (R2,
 * checked by copying the originals aside and back — see the wave 2 report).
 * Driven for real on a fake AsyncStorage whose reads can be made to THROW per
 * key, and whose reads/writes can be HELD mid-flight.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__W2A_AS__ = AS;
g.__W2A_FAIL__ = (_k: string) => false; // which reads THROW
g.__W2A_WFAIL__ = false; // every write THROWS (a full device)
g.__W2A_HOLD__ = null; // a read or write issued while set waits for it

const FAKE_AS = `
  const s = globalThis.__W2A_AS__;
  export default {
    async getItem(k) {
      if (globalThis.__W2A_FAIL__(k)) throw new Error('storage read failed');
      const v = s.has(k) ? s.get(k) : null;   // read NOW, answer after the hold
      const h = globalThis.__W2A_HOLD__; if (h) await h;
      return v;
    },
    async setItem(k, v) {
      const h = globalThis.__W2A_HOLD__; if (h) await h;
      if (globalThis.__W2A_WFAIL__) throw new Error('database or disk is full');
      s.set(k, v);
    },
    async removeItem(k) {
      const h = globalThis.__W2A_HOLD__; if (h) await h;
      if (globalThis.__W2A_WFAIL__) throw new Error('database or disk is full');
      s.delete(k);
    },
    async getAllKeys() { return [...s.keys()]; },
  };`;

const MOCKS: Record<string, string> = {
  '@react-native-async-storage/async-storage': FAKE_AS,
  'react-native': `
    export const Platform = { OS: 'android', Version: 34, constants: { Model: 'Pixel Test' } };
    export const AppState = { currentState: 'active', addEventListener() { return { remove() {} }; } };`,
  'expo-speech': 'export async function isSpeakingAsync() { return false; }',
  'expo-crypto': 'let n = 0; export const randomUUID = () => `uuid-${++n}`;',
  'expo-constants': "export default { expoConfig: { version: '1.0.0' } };",
  // A generator voice at −6 dBFS: with the default 94 dB reference that is an
  // estimated 88 dB at the ear — 1/14400 of the daily dose per second (NIOSH).
  'ape-dsp': `export const ApeDsp = {
    isAvailable: () => true,
    genStatus: () => ({ running: true, effectiveLevelDb: -6 }),
    binStatus: () => null,
    modStatus: () => null,
    getInfo: () => ({ outputRoute: 'headphones' }),
    getMeterFrame: () => null,
  };`,
  useDspEngine: 'export const frameIsLive = () => false;',
  audioOutputStore: 'export const isAudioOutputEnabled = () => true; export const isMicActive = () => false;',
  popupSuppressStore: 'export const areOverlaysSuppressed = () => false;',
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    const base = specifier.split('/').pop() ?? '';
    if (specifier in MOCKS) return { url: `w2a:${specifier}`, shortCircuit: true };
    if (specifier.startsWith('.') && ['ape-dsp', 'useDspEngine', 'audioOutputStore', 'popupSuppressStore'].includes(base)) {
      return { url: `w2a:${base}`, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith('w2a:')) return { format: 'module', shortCircuit: true, source: MOCKS[url.slice(4)] };
    return nextLoad(url, context);
  },
});

const settle = async () => {
  for (let i = 0; i < 30; i++) await Promise.resolve();
  await new Promise<void>((r) => setImmediate(r));
  for (let i = 0; i < 30; i++) await Promise.resolve();
};
function hold(): () => void {
  let release!: () => void;
  g.__W2A_HOLD__ = new Promise<void>((r) => (release = r));
  return () => {
    release();
  };
}
function failReads(pred: (k: string) => boolean): void {
  g.__W2A_FAIL__ = pred;
}
function storageOk(): void {
  g.__W2A_FAIL__ = () => false;
  g.__W2A_WFAIL__ = false;
  g.__W2A_HOLD__ = null;
}
const json = <T>(k: string) => JSON.parse(AS.get(k) ?? 'null') as T;
const src = (rel: string) => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// ── exposureMonitor ─────────────────────────────────────────────────────────

const exposure = await import('../src/features/audio/exposureMonitor.ts');
const dayKey = () => `ape:exposure:v1:day:${exposure.dateKeyOf(new Date())}`;
const SETTINGS = 'ape:exposure:v1:settings';
const storedDay = (dose: number, activeSec: number) => ({
  date: exposure.dateKeyOf(new Date()),
  activeSec,
  dose,
  maxDb: 92,
  energySum: activeSec * Math.pow(10, 9.2),
  routeSec: { headphones: activeSec, bluetooth: 0, speaker: 0, external: 0, environmental: 0, unknown: 0 },
  checkins: 3,
  warnings: 1,
  sessions: [],
  longestSessionSec: activeSec,
});
async function ticks(n: number): Promise<void> {
  for (let i = 0; i < n; i++) {
    mock.timers.tick(1000);
    await settle();
  }
}

test('exposure: a dose READ that failed is never written over the stored day, and the listening is ADDED once a read succeeds (P1, hearing safety)', async (t) => {
  // A mocked clock, so the monitor's 1 s poller runs on it (armed at init).
  mock.timers.enable({ apis: ['setInterval', 'Date'], now: new Date(2026, 9, 2, 12, 0, 0).getTime() });
  t.after(() => mock.timers.reset());
  const DAY = dayKey();
  storageOk();
  AS.clear();
  AS.set(DAY, JSON.stringify(storedDay(0.9, 3600)));
  failReads(() => true);
  exposure.initExposureMonitor(() => {});
  await settle();
  await ticks(20); // twenty seconds of an 88 dB generator, two flushes due
  assert.equal(json<{ dose: number }>(DAY).dose, 0.9, 'the stored 90 % was overwritten by a fresh day');
  const during = exposure.getExposureSnapshot();
  assert.ok(during.todayDose > 0 && during.todayDose < 0.01, 'this run is still tracked while the store is unreadable');
  assert.equal(during.doseUnreadable, true, 'the snapshot says the earlier dose could not be read');

  failReads(() => false);
  await ticks(16); // the next flush reads again, merges, writes
  const after = exposure.getExposureSnapshot();
  assert.equal(after.doseUnreadable, false);
  assert.ok(after.todayDose > 0.9, `the held listening must be ADDED to the stored 90 % (got ${after.todayDose})`);
  const disk = json<{ dose: number; activeSec: number; checkins: number }>(DAY);
  assert.ok(disk.dose > 0.9 && disk.activeSec > 3600, 'the merged day is what is on disk');
  assert.equal(disk.checkins, 3, 'stored check-ins survive the merge');
});

test('exposure: a read in flight across the account wipe never brings the departing listener back (P3)', async () => {
  const DAY = dayKey();
  storageOk();
  AS.clear();
  AS.set(SETTINGS, JSON.stringify({ standard: 'osha5', refSplAt0Dbfs: 101, refCalibrated: true }));
  AS.set(DAY, JSON.stringify(storedDay(0.5, 1800)));
  const releaseA = hold();
  exposure.resetLocal(); // listener A's read starts, and is held
  await settle();
  // The wipe: A's keys are swept, then the stores reset; B's read is quick.
  AS.clear();
  g.__W2A_HOLD__ = null;
  exposure.resetLocal();
  await settle();
  releaseA(); // A's read lands now
  await settle();
  await settle();
  const snap = exposure.getExposureSnapshot();
  assert.equal(snap.settings.standard, 'niosh3', "A's exposure standard came back for B");
  assert.equal(snap.settings.refCalibrated, false, "A's reference calibration came back for B");
  assert.equal(snap.todayDose, 0, "A's dose came back for B");
});

test('exposure: a settings change made while the settings are unreadable is held, never saved over them; it lands on top once read; and it says whether it was stored (P1, P6)', async () => {
  storageOk();
  AS.clear();
  exposure.resetLocal();
  await settle();
  AS.set(SETTINGS, JSON.stringify({ standard: 'osha5', refSplAt0Dbfs: 101, refCalibrated: true }));
  failReads((k) => k === SETTINGS);
  exposure.resetLocal();
  await settle();
  const held = await exposure.updateExposureSettings({ haptics: false });
  assert.equal(json<{ standard: string }>(SETTINGS).standard, 'osha5', 'defaults were saved over the stored standard');
  assert.equal(held, false, 'a change that is not on disk must not resolve true');
  failReads(() => false);
  assert.equal(await exposure.updateExposureSettings({ checkinMinutes: 30 }), true, 'a stored change resolves true');
  const disk = json<{ standard: string; refSplAt0Dbfs: number; haptics: boolean; checkinMinutes: number }>(SETTINGS);
  assert.deepEqual([disk.standard, disk.refSplAt0Dbfs, disk.haptics, disk.checkinMinutes], ['osha5', 101, false, 30]);
  g.__W2A_WFAIL__ = true;
  assert.equal(await exposure.updateExposureSettings({ haptics: true }), false, 'a write the device refused resolves false');
  storageOk();
});

test('exposure: the source keeps the rules (no direct settings write; the flush never writes an unread day)', () => {
  const s = src('features/audio/exposureMonitor.ts');
  assert.match(s, /createLocalStore<ExposureSettings>\(/);
  assert.doesNotMatch(s, /setItem\(SETTINGS_KEY/, 'settings are written by the safe store only');
  assert.match(s, /if \(!hydrated\) \{[\s\S]{0,400}void hydrate\(\);\s*return;\s*\}/, 'persistDay reads again instead of writing over an unread day');
  assert.match(s, /generation\+\+;/);
});

// ── soundSafetyAck ──────────────────────────────────────────────────────────

const ack = await import('../src/features/audio/soundSafetyAck.ts');
const ACK = 'ape:soundSafety:v1';
const accepted = (who: string) => ({ version: ack.SOUND_SAFETY_VERSION, acceptedAt: '2026-10-01T10:00:00.000Z', text: 'the warning', appVersion: '1', userId: who });

test('sound safety: a failed READ re-asks (the safe direction), writes nothing, and the next load reads again', async () => {
  storageOk();
  AS.clear();
  ack.resetSoundSafetyAck();
  AS.set(ACK, JSON.stringify(accepted('A')));
  failReads(() => true);
  assert.equal(await ack.loadSoundSafetyAck(), null);
  assert.equal(ack.isAcknowledged(), false, 'an unread acceptance must not skip the warning');
  assert.equal(json<{ userId: string }>(ACK).userId, 'A', 'the stored record is untouched');
  failReads(() => false);
  await ack.loadSoundSafetyAck();
  assert.equal(ack.isAcknowledged(), true, 'a later successful read must be taken (the failure must not latch "loaded")');
  assert.equal(ack.isSoundSafetyAckUnreadable(), false);
});

test("sound safety: a load in flight across the account wipe never restores the departing person's acceptance (P3, the unsafe direction)", async () => {
  storageOk();
  AS.clear();
  ack.resetSoundSafetyAck();
  AS.set(ACK, JSON.stringify(accepted('A')));
  const release = hold();
  const p = ack.loadSoundSafetyAck();
  await settle();
  AS.clear(); // the sweep
  g.__W2A_HOLD__ = null;
  ack.resetSoundSafetyAck(); // the reset
  release();
  await p;
  await settle();
  assert.equal(ack.isAcknowledged(), false, "B got A's acceptance — sound with no warning");
  assert.equal(ack.acknowledgment(), null);
});

test("sound safety: an acceptance written across the account wipe is not the next person's (P3)", async () => {
  storageOk();
  AS.clear();
  ack.resetSoundSafetyAck();
  const release = hold();
  const p = ack.recordSoundSafetyAck({ text: 'the warning', appVersion: '1', userId: 'A' });
  await settle();
  ack.resetSoundSafetyAck(); // the wipe lands while A's write is out
  g.__W2A_HOLD__ = null;
  release();
  assert.equal(await p, false, 'a write that straddled the wipe must not report success');
  await settle();
  assert.equal(ack.isAcknowledged(), false);
  assert.equal(AS.has(ACK), false, "A's acceptance must not sit on disk for B");
});

test('sound safety: a record that will not parse is still parked under :damaged, and a real acceptance still records', async () => {
  storageOk();
  AS.clear();
  ack.resetSoundSafetyAck();
  AS.set(ACK, '{not json');
  assert.equal(await ack.loadSoundSafetyAck(), null);
  assert.equal(AS.get(`${ACK}:damaged`), '{not json');
  assert.equal(AS.has(ACK), false);
  assert.equal(await ack.recordSoundSafetyAck({ text: 't', appVersion: '1', userId: null }), true);
  assert.equal(ack.isAcknowledged(), true);
  g.__W2A_WFAIL__ = true;
  ack.resetSoundSafetyAck();
  assert.equal(await ack.recordSoundSafetyAck({ text: 't', appVersion: '1', userId: null }), false, 'an unrecorded acceptance did not happen');
  assert.equal(ack.isAcknowledged(), false);
  storageOk();
});

// ── calibrationStore ────────────────────────────────────────────────────────

const cal = await import('../src/features/tools/measure/calibrationStore.ts');
const CAL = 'ape:splCalOffset';

test('calibration: a failed READ is never saved over the stored offset; the CALIBRATE lands on top once a read succeeds (P1)', async () => {
  storageOk();
  AS.clear();
  AS.set(CAL, JSON.stringify({ offsetDb: 96, setAt: '2026-09-01T00:00:00.000Z' }));
  failReads(() => true);
  cal.getSplCalibration();
  await settle();
  const stored = await cal.setSplCalibration(101);
  assert.equal(json<{ offsetDb: number }>(CAL).offsetDb, 96, 'the stored calibration was overwritten after a failed read');
  assert.equal(stored, false, 'a calibration that is not on disk must not resolve true');
  failReads(() => false);
  assert.equal(await cal.setSplCalibration(99), true);
  assert.equal(json<{ offsetDb: number }>(CAL).offsetDb, 99);
  assert.equal(cal.getSplCalibration()?.offsetDb, 99);
});

// ── deviceProfile (crowdsource queue) ───────────────────────────────────────

const dp = await import('../src/features/tools/measure/deviceProfile.ts');
const QUEUE = 'ape:crowdsource:queue';
const contribution = (model: string) =>
  dp.makeContribution({ record: dp.buildCapabilityRecord({ model } as never), offsetDb: 98, nominalStart: 100, referenceQuality: 'calibrator' });

test('crowdsource queue: a failed READ never saves a one-row queue over it, and a drain never removes it (P1)', async () => {
  storageOk();
  AS.clear();
  AS.set('ape:crowdsource:consent', '1');
  const a = contribution('A');
  const b = contribution('B');
  AS.set(QUEUE, JSON.stringify([a, b]));
  failReads((k) => k === QUEUE);
  assert.equal(await dp.queueContribution(contribution('C')), false, 'a contribution not on disk must not report queued');
  assert.equal(json<unknown[]>(QUEUE).length, 2, 'the queue was replaced by a one-row copy');
  await dp.removeQueuedContributions([a.contributionId]);
  assert.equal(json<unknown[]>(QUEUE)?.length, 2, 'a drain over an unread queue removed it');
  assert.deepEqual(await dp.getQueuedContributions(), [], 'nothing is uploaded from an unread queue');
  failReads(() => false);
  await dp.getQueuedContributions();
  await settle();
  const ids = json<{ contributionId: string; deviceKey: { model: string } }[]>(QUEUE).map((c) => c.deviceKey.model);
  assert.deepEqual(ids, ['B', 'C'], 'the held add and removal land on top of the stored queue');
});

// ── measurementsBackend (web) ───────────────────────────────────────────────

const mb = await import('../src/features/tools/measure/measurementsBackend.ts');
const ROWS = 'ape:toolMeasurementRows';
const row = (id: string) => ({ id, created_at: `2026-10-0${id.length}T00:00:00Z`, json: '{}' }) as never;

test('web measurement library: a failed READ never writes a one-row library over the stored one (P1)', async () => {
  storageOk();
  AS.clear();
  AS.set(ROWS, JSON.stringify([row('a'), row('bb')]));
  failReads(() => true);
  await assert.rejects(mb.putRow(row('ccc')), 'a save over an unread library must fail (saveMeasurement then says so)');
  await assert.rejects(mb.deleteRows(['a']));
  assert.equal(json<unknown[]>(ROWS).length, 2, 'the stored library was replaced');
  failReads(() => false);
  await mb.putRow(row('ccc'));
  assert.equal(json<unknown[]>(ROWS).length, 3);
  AS.set(ROWS, '[broken');
  await mb.putRow(row('dddd'));
  assert.equal(AS.get(`${ROWS}:damaged`), '[broken', 'a damaged library is set aside, then saves are allowed');
  assert.equal(json<unknown[]>(ROWS).length, 1);
});

test("web measurement library: a save that read before the account wipe's clear never writes the departing rows back (P3)", async () => {
  storageOk();
  AS.clear();
  AS.set(ROWS, JSON.stringify([row('a'), row('bb')]));
  const release = hold();
  const save = mb.putRow(row('ccc'));
  await settle();
  const clear = mb.clearAllRows();
  g.__W2A_HOLD__ = null;
  release();
  await save.then(
    () => {},
    () => {},
  );
  await clear;
  await settle();
  assert.equal(AS.has(ROWS), false, "the departing account's library came back after the wipe");
});

// ── CenterLockTuner (source pins) ───────────────────────────────────────────

test('CenterLock tuner: its remembered presets live on the shared safe store, and a tap is a mutation of the stored copy', () => {
  const s = src('screens/tools/CenterLockTuner.tsx');
  assert.doesNotMatch(s, /AsyncStorage/, 'no direct storage read or write in the screen');
  assert.match(s, /const prefsStore = createLocalStore<Prefs>\(\{\s*key: PREFS_KEY,/);
  assert.match(s, /if \(!alive \|\| !prefsStore\.isHydrated\(\)\) return;/, 'a failed read applies nothing');
  assert.equal((s.match(/void prefsStore\.mutate\(\(prefs\) =>/g) ?? []).length, 3, 'recents, per-instrument setup and A4 are all mutations');
  assert.doesNotMatch(s, /prefs\.current/, 'no screen-held copy that could be saved over the stored one');
});

test('the Supabase auth adapter stays a plain pass-through (its allowlist reason holds): a failed read is never turned into null', () => {
  const s = src('lib/authStorage.native.ts');
  assert.doesNotMatch(s, /getItem\([^)]*\)\s*\.catch/, 'a swallowed read would sign the user out by itself');
  assert.match(s, /return AsyncStorage\.getItem\(key\);/);
});
