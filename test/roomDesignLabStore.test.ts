/**
 * Room Design & Monitoring Lab — the saved-designs store: persistence, the
 * cap, the account wipe, the GENERATION FENCE (a read already in flight when
 * the wipe runs must not put the previous account's rooms back), the guest
 * save-block and the preview rule. AsyncStorage is an in-memory stub.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ASYNC_STORAGE = '@react-native-async-storage/async-storage';
const STUB_URL = 'ape-test:async-storage-roomdesign';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === ASYNC_STORAGE) return { url: STUB_URL, shortCircuit: true };
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
          globalThis.__apeRoomStorage = mem;
          let delay = 0;
          globalThis.__apeRoomDelay = (ms) => { delay = ms; };
          let failWrites = false;
          globalThis.__apeRoomFailWrites = (on) => { failWrites = on; };
          let failReads = false;
          globalThis.__apeRoomFailReads = (on) => { failReads = on; };
          const wait = () => new Promise((r) => setTimeout(r, delay));
          export default {
            async getItem(k) { await wait(); if (failReads) throw new Error('unreadable'); return mem.has(k) ? mem.get(k) : null; },
            async setItem(k, v) { if (failWrites) throw new Error('disk full'); mem.set(k, v); },
            async removeItem(k) { mem.delete(k); },
          };
        `,
      };
    }
    return next(url, context);
  },
});

const store = await import('../src/features/roomdesign/roomDesignStore.ts');
const preview = await import('../src/features/lab/labPreviewStore.ts');
const { defaultDesign } = await import('../src/screens/lab/roomdesign/roomModel.ts');
const mem = (): Map<string, string> => (globalThis as { __apeRoomStorage?: Map<string, string> }).__apeRoomStorage!;
const setDelay = (ms: number) => (globalThis as { __apeRoomDelay?: (ms: number) => void }).__apeRoomDelay!(ms);
const KEY = 'ape:roomdesign:v1';

async function fresh(): Promise<void> {
  mem().clear();
  setDelay(0);
  store.setRoomDesignSaveBlocked(false);
  store.resetLocal();
}
const tick = () => new Promise((r) => setTimeout(r, 2));
async function settled(): Promise<void> {
  store.getRoomDesigns();
  await tick();
  await tick();
}

describe('saved room designs — persistence', () => {
  it('saves under one ape: key and reads back after a cold hydrate', async () => {
    await fresh();
    const d = defaultDesign('metric');
    assert.equal(await store.saveRoomDesign({ ...d, name: 'Studio A' }), true);
    assert.ok(mem().has(KEY), 'the design is on disk under the ape: prefix (so the account sweep removes it)');
    store.resetLocal(); // drop memory, keep storage: a relaunch
    await settled();
    assert.deepEqual(store.getRoomDesigns().map((x) => x.name), ['Studio A']);
  });
  it('replaces by id, lists newest-updated first, deletes', async () => {
    await fresh();
    const a = defaultDesign('metric');
    const b = defaultDesign('metric');
    await store.saveRoomDesign({ ...a, name: 'A', updatedAt: 1 });
    await new Promise((r) => setTimeout(r, 3));
    await store.saveRoomDesign({ ...b, name: 'B' });
    await new Promise((r) => setTimeout(r, 3)); // updatedAt is a millisecond stamp
    await store.saveRoomDesign({ ...a, name: 'A2' });
    const names = store.getRoomDesigns().map((x) => x.name);
    assert.deepEqual(names, ['A2', 'B']);
    store.deleteRoomDesign(b.id);
    await tick();
    assert.deepEqual(store.getRoomDesigns().map((x) => x.name), ['A2']);
    assert.equal(JSON.parse(mem().get(KEY)!).length, 1);
  });
  it('caps the library, oldest-updated first', async () => {
    await fresh();
    for (let i = 0; i < store.MAX_SAVED_DESIGNS + 3; i++) await store.saveRoomDesign({ ...defaultDesign('metric'), name: `d${i}` });
    assert.equal(store.getRoomDesigns().length, store.MAX_SAVED_DESIGNS);
    assert.ok(!store.getRoomDesigns().some((x) => x.name === 'd0'));
  });
  it('drops unusable records instead of crashing', async () => {
    await fresh();
    mem().set(KEY, JSON.stringify([{ id: 'x' }, null, { ...defaultDesign('metric'), name: 'ok' }, 'junk']));
    await settled();
    assert.deepEqual(store.getRoomDesigns().map((x) => x.name), ['ok']);
    mem().set(KEY, '{not json');
    store.resetLocal();
    await settled();
    assert.deepEqual(store.getRoomDesigns(), []);
  });
});

describe('saved room designs — the account wipe and its fence', () => {
  it('resetLocal empties memory so hooks re-render empty', async () => {
    await fresh();
    await store.saveRoomDesign({ ...defaultDesign('metric'), name: 'mine' });
    store.resetLocal();
    assert.deepEqual(store.getRoomDesigns(), []);
  });
  it('a hydrate in flight when the wipe runs never lands the old rooms', async () => {
    await fresh();
    mem().set(KEY, JSON.stringify([{ ...defaultDesign('metric'), name: 'previous account' }]));
    setDelay(10);
    store.getRoomDesigns(); // starts the slow read
    mem().clear(); // the ape:* sweep
    store.resetLocal(); // the registered in-memory reset
    await new Promise((r) => setTimeout(r, 25)); // the old read resolves now…
    assert.deepEqual(store.getRoomDesigns(), [], '…and must be discarded by the generation fence');
    await new Promise((r) => setTimeout(r, 25));
    assert.deepEqual(store.getRoomDesigns(), []);
  });
});

describe('saved room designs — the guest rule and preview', () => {
  it('a save-blocked guest keeps the design in memory for the session but nothing reaches storage', async () => {
    await fresh();
    store.setRoomDesignSaveBlocked(true);
    const ok = await store.saveRoomDesign({ ...defaultDesign('metric'), name: 'guest room' });
    assert.equal(ok, false, 'the caller is told it was not saved');
    assert.equal(store.getRoomDesigns().length, 1, 'kept for this session');
    assert.equal(mem().has(KEY), false, 'never written');
  });
  it('PREVIEW EARNS NOTHING: a members-only preview records nothing at all', async () => {
    await fresh();
    preview.startLabPreview('RoomDesignLab', 'Room Design & Monitoring');
    try {
      const ok = await store.saveRoomDesign({ ...defaultDesign('metric'), name: 'preview' });
      assert.equal(ok, false);
      assert.equal(store.getRoomDesigns().length, 0);
      assert.equal(mem().has(KEY), false);
    } finally {
      preview.endLabPreview();
    }
  });
});

describe('saved room designs — a failed write is reported (toddler pass 1, 2026-10-01)', () => {
  it('resolves false when the device write fails, so the lab never says "Saved on this device"', async () => {
    await fresh();
    const failWrites = (globalThis as { __apeRoomFailWrites?: (on: boolean) => void }).__apeRoomFailWrites!;
    failWrites(true);
    try {
      assert.equal(await store.saveRoomDesign({ ...defaultDesign('metric'), name: 'lost' }), false);
    } finally {
      failWrites(false);
    }
  });
});

describe('saved room designs — read/write failures never lose or fake designs (toddler pass 2, 2026-10-01)', () => {
  const failWrites = (on: boolean) => (globalThis as { __apeRoomFailWrites?: (on: boolean) => void }).__apeRoomFailWrites!(on);
  const failReads = (on: boolean) => (globalThis as { __apeRoomFailReads?: (on: boolean) => void }).__apeRoomFailReads!(on);
  it('a failed write does not leave the design listed as saved', async () => {
    await fresh();
    failWrites(true);
    try {
      await store.saveRoomDesign({ ...defaultDesign('metric'), name: 'ghost' });
    } finally {
      failWrites(false);
    }
    assert.deepEqual(store.getRoomDesigns().map((x) => x.name), []);
  });
  it('an unreadable store is never overwritten by the next save', async () => {
    await fresh();
    assert.equal(await store.saveRoomDesign({ ...defaultDesign('metric'), name: 'keep me' }), true);
    store.resetLocal(); // relaunch
    failReads(true);
    try {
      assert.equal(await store.saveRoomDesign({ ...defaultDesign('metric'), name: 'new' }), false);
    } finally {
      failReads(false);
    }
    store.resetLocal();
    await settled();
    assert.deepEqual(store.getRoomDesigns().map((x) => x.name), ['keep me']);
  });
});

describe('saved room designs — delete and unreadable store (toddler pass 3, 2026-10-01)', () => {
  const failWrites = (on: boolean) => (globalThis as { __apeRoomFailWrites?: (on: boolean) => void }).__apeRoomFailWrites!(on);
  const failReads = (on: boolean) => (globalThis as { __apeRoomFailReads?: (on: boolean) => void }).__apeRoomFailReads!(on);
  it('a delete whose write fails keeps the row (it is still on the device)', async () => {
    await fresh();
    const d = { ...defaultDesign('metric'), name: 'keep' };
    await store.saveRoomDesign(d);
    failWrites(true);
    let ok: boolean;
    try {
      ok = await store.deleteRoomDesign(d.id);
    } finally {
      failWrites(false);
    }
    assert.equal(ok, false);
    assert.deepEqual(store.getRoomDesigns().map((x) => x.name), ['keep']);
  });
  it('a guest can still delete a session design', async () => {
    await fresh();
    store.setRoomDesignSaveBlocked(true);
    const d = { ...defaultDesign('metric'), name: 'session' };
    await store.saveRoomDesign(d);
    assert.equal(await store.deleteRoomDesign(d.id), true);
    assert.deepEqual(store.getRoomDesigns(), []);
  });
  it('an unreadable store is reported as unreadable, not empty', async () => {
    await fresh();
    failReads(true);
    try {
      store.getRoomDesigns();
      await tick();
      await tick();
      assert.equal(store.isRoomDesignStoreUnreadable(), true);
    } finally {
      failReads(false);
    }
    store.resetLocal();
    assert.equal(store.isRoomDesignStoreUnreadable(), false);
  });
});
