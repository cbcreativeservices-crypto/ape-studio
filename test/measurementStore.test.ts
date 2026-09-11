/**
 * The Saved Measurement Library — persistence, migration, and the account wipe.
 *
 * WHY THESE EXIST: on 2026-09-11 a device pass lost real data. The library was
 * one JSON blob under a single AsyncStorage key; ~20 spectrogram snapshots
 * (~119 KB each) pushed Android's shared AsyncStorage database past the 6 MB
 * ceiling it is built with, every write in the app started failing with
 * SQLITE_FULL, and the saved snapshots were gone after a restart. Storage moved
 * to the app's own SQLite database, and these tests pin the three things that
 * move could plausibly get wrong:
 *
 *   1. an existing library must SURVIVE the migration,
 *   2. the old oversized key must be DELETED — that is what gives an affected
 *      phone its space back, so it heals instead of needing its data cleared,
 *   3. an account switch must still wipe it. The wipe works by removing every
 *      `ape:*` AsyncStorage key, and a SQLite table is invisible to that sweep,
 *      so without an explicit wipe the next account on the device would inherit
 *      the previous one's measurements.
 *
 * LOADER NOTE: this exercises the WEB backend (AsyncStorage), because that is
 * the sibling Node resolves — Metro picks the SQLite one on a phone. Both
 * implement the same row interface, so what is pinned here is the STORE's
 * behaviour against a backend, which is where the migration and wipe logic
 * lives. AsyncStorage itself is replaced with an in-memory stub below.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ASYNC_STORAGE = '@react-native-async-storage/async-storage';
const STUB_URL = 'ape-test:async-storage';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === ASYNC_STORAGE) return { url: STUB_URL, shortCircuit: true };
    // App source imports siblings without an extension so Metro can pick the
    // `.native.ts` variant on a phone; Node needs the extension spelled out.
    // Resolving to the BARE `.ts` here is deliberate — the web/AsyncStorage
    // backend is the one this test drives.
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === STUB_URL) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `
          const mem = new Map();
          globalThis.__apeStorage = mem;
          export default {
            async getItem(k) { return mem.has(k) ? mem.get(k) : null; },
            async setItem(k, v) { mem.set(k, v); },
            async removeItem(k) { mem.delete(k); },
            async getAllKeys() { return [...mem.keys()]; },
            async multiRemove(ks) { for (const k of ks) mem.delete(k); },
          };
        `,
      };
    }
    return next(url, context);
  },
});

const store = await import('../src/features/tools/measure/measurementStore.ts');
const mem = (): Map<string, string> => (globalThis as { __apeStorage?: Map<string, string> }).__apeStorage!;

const LEGACY_KEY = 'ape:toolMeasurements';

/** A record shaped like the real thing. `spectrogram` deliberately: it is the
 *  tool whose grid payloads caused the loss this file exists for, and
 *  sanitize() drops any record whose tool_type is not a live ToolKey. */
function record(id: string, createdAt: string) {
  return {
    id,
    tool_type: 'spectrogram',
    created_at: createdAt,
    title: `Measurement ${id}`,
    notes: '',
    input_device: 'Device microphone',
    calibration_status: 'uncalibrated',
    sample_rate: 48000,
    measurement_settings: {},
    quality_state: 'good',
    warning_flags: [],
    data_payload: { kind: 'spectrogram_snapshot', grid: [[1, 2], [3, 4]] },
  };
}

/** Between cases: empty storage AND drop the store's in-memory cache. */
async function fresh(): Promise<void> {
  mem().clear();
  store.resetLocal();
}

/** hydrate() is private; any read triggers it, and it resolves on a microtask. */
async function settled(): Promise<void> {
  store.getMeasurements();
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
}

describe('measurement library — migrating off the key that filled up', () => {
  it('carries an existing library across', async () => {
    await fresh();
    mem().set(LEGACY_KEY, JSON.stringify([record('a', '2026-09-01T00:00:00.000Z')]));
    await settled();
    const got = store.getMeasurements();
    assert.equal(got.length, 1, 'the saved library must survive the move');
    assert.equal(got[0].id, 'a');
  });

  it('DELETES the old key — this is what gives a full device its space back', async () => {
    await fresh();
    mem().set(LEGACY_KEY, JSON.stringify([record('a', '2026-09-01T00:00:00.000Z')]));
    await settled();
    assert.equal(mem().has(LEGACY_KEY), false, 'the oversized value must be reclaimed, not left behind');
  });

  it('frees the old key even when its contents are unreadable', async () => {
    // The device that hit SQLITE_FULL is exactly the one whose blob may be
    // truncated or unparseable. Records may be unrecoverable; the SPACE is not,
    // and reclaiming it is what unblocks every other feature's writes.
    await fresh();
    mem().set(LEGACY_KEY, '{not valid json');
    await settled();
    assert.equal(mem().has(LEGACY_KEY), false, 'a corrupt blob must still be cleared');
    assert.equal(store.getMeasurements().length, 0);
  });

  it('frees the old key even when READING it throws — the stuck-device case', async () => {
    // This is the device the migration exists to rescue. On Android a value
    // past the ~2 MB CursorWindow throws on getItem, so the records are
    // unrecoverable — but the SPACE is what is blocking every other feature's
    // writes, and a read failure must not be allowed to skip the removal.
    await fresh();
    mem().set(LEGACY_KEY, 'too big to read');
    const store_ = mem();
    const realGet = store_.get.bind(store_);
    store_.get = (k: string) => {
      if (k === LEGACY_KEY) throw new Error('Row too big to fit into CursorWindow');
      return realGet(k);
    };
    try {
      await settled();
    } finally {
      store_.get = realGet;
    }
    assert.equal(
      mem().has(LEGACY_KEY),
      false,
      'a device that cannot READ the old value must still get its space back',
    );
  });

  it('does nothing on a device that never had one', async () => {
    await fresh();
    await settled();
    assert.equal(store.getMeasurements().length, 0);
    assert.equal(mem().has(LEGACY_KEY), false);
  });

  it('runs once — a later save is not re-migrated away', async () => {
    await fresh();
    mem().set(LEGACY_KEY, JSON.stringify([record('a', '2026-09-01T00:00:00.000Z')]));
    await settled();
    store.saveMeasurement(record('b', '2026-09-02T00:00:00.000Z') as never);
    await settled();
    store.resetLocal();
    await settled();
    assert.deepEqual(
      store.getMeasurements().map((m) => m.id).sort(),
      ['a', 'b'],
      'both the migrated and the new record must be there after a reload',
    );
  });
});

describe('measurement library — writes actually persist', () => {
  it('a saved measurement survives a reload', async () => {
    await fresh();
    await settled();
    store.saveMeasurement(record('x', '2026-09-05T00:00:00.000Z') as never);
    await settled();
    store.resetLocal();
    await settled();
    assert.equal(store.getMeasurements().length, 1);
    assert.equal(store.getMeasurements()[0].id, 'x');
  });

  it('a deleted measurement stays deleted', async () => {
    await fresh();
    await settled();
    store.saveMeasurement(record('x', '2026-09-05T00:00:00.000Z') as never);
    store.saveMeasurement(record('y', '2026-09-06T00:00:00.000Z') as never);
    await settled();
    store.deleteMeasurement('x');
    await settled();
    store.resetLocal();
    await settled();
    assert.deepEqual(store.getMeasurements().map((m) => m.id), ['y']);
  });

  it('a renamed measurement keeps its new title after a reload', async () => {
    await fresh();
    await settled();
    store.saveMeasurement(record('x', '2026-09-05T00:00:00.000Z') as never);
    await settled();
    store.updateMeasurement('x', { title: 'Renamed' });
    await settled();
    store.resetLocal();
    await settled();
    assert.equal(store.getMeasurements()[0].title, 'Renamed');
  });
});

describe('measurement library — an account switch must not leak it forward', () => {
  it('clearStoredMeasurements empties the STORAGE, not just the cache', async () => {
    // resetLocal() alone only drops the in-memory copy, and the next read
    // re-hydrates from storage — so a wipe built on it would hand the previous
    // account's measurements straight back.
    await fresh();
    await settled();
    store.saveMeasurement(record('x', '2026-09-05T00:00:00.000Z') as never);
    await settled();

    await store.clearStoredMeasurements();
    await settled();
    assert.equal(store.getMeasurements().length, 0, 'the wipe left records behind');

    store.resetLocal();
    await settled();
    assert.equal(
      store.getMeasurements().length,
      0,
      'records came back after a re-hydrate — the wipe only cleared memory',
    );
  });
});
