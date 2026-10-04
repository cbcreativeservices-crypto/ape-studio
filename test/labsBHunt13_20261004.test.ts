/**
 * LABS B — hunt 13 (2026-10-04, final overnight). Receipts.
 *
 * 1. Cymatics gallery guest carry (hunt 12's carryIn): a pattern deleted
 *    after the sign-in came BACK. The ledger refuses a guestOnly hold once
 *    the account is settled — removals too — so the deleted row stayed in
 *    what was held, and the writer put it back whenever it ran after the
 *    delete (a re-flush of a carry whose write had failed, or a delete that
 *    reached the write chain before the carry did).
 * 2. Same writer: an unreadable ARTWORK list held back the carried PATTERNS
 *    even when no colouring was held — the guest's saved patterns were never
 *    written to the account.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

/** An in-memory AsyncStorage for the stores that import it directly. */
const kvMap = new Map<string, string>();
(globalThis as unknown as { __h13Kv: Map<string, string> }).__h13Kv = kvMap;
(globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;
const AS_STUB = `const m = globalThis.__h13Kv; export default {
  getItem: async (k) => (m.has(k) ? m.get(k) : null),
  setItem: async (k, v) => { m.set(k, v); },
  removeItem: async (k) => { m.delete(k); },
};`;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'h13-stub:async-storage', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'h13-stub:async-storage') return { format: 'module', shortCircuit: true, source: AS_STUB };
    return nextLoad(url, context);
  },
});

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
/** Comments out, so a receipt reads code only. */
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const plate = { studio: 'plate', hz: 440, amplitude: 0.3, view: 'particles', multi: 'off', sandCount: 3000, sandSize: 0.45, friction: 0.4 };

async function guestGallery() {
  const carry = await import('../src/features/lab/sessionCarry.ts');
  const store = await import('../src/features/cymatics/patternStore.ts');
  const { DEFAULT_PLATE } = await import('../src/features/cymatics/plateModes.ts');
  carry.__resetSessionCarryForTests();
  carry.noteSessionIdentity(''); // a guest launch (every auth event is settled, as accountLocalSync does)
  await carry.settleSessionCarry();
  const guestDevice = store.createPatternStore(store.memoryStore());
  const p = store.newPattern({ ...plate, spec: DEFAULT_PLATE } as never, 'SIMULATION', 'Guest plate');
  assert.equal(await guestDevice.upsertPattern(p), true);
  assert.equal(await guestDevice.saveArtwork({ ...store.blankArtwork(p.id, 40), fills: [{ region: 1, color: '#ff0000', style: 'solid' }] }), true);
  const held = carry.peekSessionWork<{ patterns: { id: string }[]; artwork: { patternId: string }[] }>('cymatics:gallery');
  assert.ok(held);
  return { carry, store, p, held: held as never };
}

test('Cymatics carry: a pattern deleted after the carry is never written back by a re-run', async () => {
  const { carry, store, p, held } = await guestGallery();
  // The guest signs in: the wipe left an empty device, the carry lands.
  carry.noteSessionIdentity('uid-1');
  const account = store.createPatternStore(store.memoryStore());
  assert.equal(await account.carryIn(held), true);
  assert.deepEqual((await account.loadPatterns()).map((x) => x.id), [p.id]);
  await carry.settleSessionCarry();
  // The account deletes it — the ledger no longer takes a guestOnly change,
  // so the deleted row is still among what is held…
  assert.equal(await account.deletePattern(p.id), true);
  const still = carry.peekSessionWork<{ patterns: { id: string }[] }>('cymatics:gallery');
  assert.deepEqual(still!.patterns.map((x) => x.id), [p.id]);
  // …and the writer runs again with it (a later flush).
  assert.equal(await account.carryIn(still as never), true);
  assert.deepEqual((await account.loadPatterns()).map((x) => x.id), [], 'the deleted pattern stays deleted');
  assert.equal((await account.loadArtworks()).length, 0, 'and so does its colouring');
  carry.__resetSessionCarryForTests();
});

test('Cymatics carry: a delete that reaches the write chain before the carry is honoured', async () => {
  const { carry, store, p, held } = await guestGallery();
  carry.noteSessionIdentity('uid-2');
  await carry.settleSessionCarry();
  const account = store.createPatternStore(store.memoryStore());
  // DELETE tapped on the gallery's pre-wipe row, queued ahead of the carry.
  assert.equal(await account.deletePattern(p.id), true);
  assert.equal(await account.carryIn(held), true);
  assert.deepEqual((await account.loadPatterns()).map((x) => x.id), []);
  carry.__resetSessionCarryForTests();
});

test('Cymatics carry: a cleared colouring is not put back, a re-coloured one is', async () => {
  const { carry, store, p, held } = await guestGallery();
  carry.noteSessionIdentity('uid-3');
  const account = store.createPatternStore(store.memoryStore());
  assert.equal(await account.carryIn(held), true);
  await carry.settleSessionCarry();
  assert.equal(await account.deleteArtwork(p.id), true);
  assert.equal(await account.carryIn(held), true);
  assert.equal((await account.loadArtworks()).length, 0, 'the cleared colouring stays cleared');
  assert.equal(await account.saveArtwork(store.blankArtwork(p.id, 40)), true);
  assert.equal((await account.loadArtworks()).length, 1);
  carry.__resetSessionCarryForTests();
});

test('Cymatics carry: an unreadable artwork list does not hold back patterns when no colouring is carried', async () => {
  const carry = await import('../src/features/lab/sessionCarry.ts');
  const store = await import('../src/features/cymatics/patternStore.ts');
  const { DEFAULT_PLATE } = await import('../src/features/cymatics/plateModes.ts');
  carry.__resetSessionCarryForTests();
  const p = store.newPattern({ ...plate, spec: DEFAULT_PLATE } as never, 'SIMULATION', 'Uncoloured');
  const mem = store.memoryStore();
  const kv = {
    getItem: (k: string) => (k === store.PATTERN_KEYS.artwork ? Promise.reject(new Error('row too big')) : mem.getItem(k)),
    setItem: (k: string, v: string) => mem.setItem(k, v),
    removeItem: (k: string) => mem.removeItem(k),
  };
  const account = store.createPatternStore(kv);
  assert.equal(await account.carryIn({ patterns: [p], artwork: [] }), true);
  assert.deepEqual((await account.loadPatterns()).map((x) => x.id), [p.id]);
  // …but a held colouring is never merged over an unreadable list.
  assert.equal(await account.carryIn({ patterns: [], artwork: [store.blankArtwork(p.id, 40)] }), false);
});

test('Signal Detective: a guest solve is held for the sign-in and unioned back after the wipe', () => {
  const s = code(read('src/screens/lab/meter/modules/modMeterC.tsx'));
  const on = s.slice(s.indexOf('const onSolved = () => {'), s.indexOf('const goCase = '));
  assert.match(on, /holdSolved\(`\$\{idx\}-\$\{step\}`\);/, 'every solve is offered to the ledger');
  const hold = s.slice(s.indexOf('function holdSolved('));
  assert.match(hold.slice(0, 300), /holdSessionWork<string\[\]>\(CARRY_KEY,[\s\S]*\{ guestOnly: true \}\)/);
  const w = s.slice(s.indexOf('registerSessionCarry<string[]>(CARRY_KEY'), s.indexOf('function holdSolved('));
  assert.match(w, /const stored = await readSolved\(\);\s*if \(gen !== solvedGen \|\| !stored\) return false;/, 'never over an unreadable set, never across a wipe');
  assert.match(w, /new Set\(\[\.\.\.stored, \.\.\.held\]\)/, 'a union');
  assert.match(w, /reportUnhandledSaveFailure\(\)/, 'a refused carry is told');
});

test('Room Design carry: a carried design the account deleted is not written back by a later hold', async () => {
  const carry = await import('../src/features/lab/sessionCarry.ts');
  const room = await import('../src/features/roomdesign/roomDesignStore.ts');
  const { defaultDesign } = await import('../src/screens/lab/roomdesign/roomModel.ts');
  const tick = async () => {
    for (let i = 0; i < 8; i++) await new Promise((r) => setTimeout(r, 0));
  };
  const ids = () => ((JSON.parse(kvMap.get('ape:roomdesign:v1') ?? '[]') as { id: string }[]).map((d) => d.id)).sort();
  carry.__resetSessionCarryForTests();
  kvMap.clear();
  room.resetLocal();
  carry.noteSessionIdentity(''); // a guest launch (each auth event is settled, as accountLocalSync does)
  await carry.settleSessionCarry();
  room.setRoomDesignSaveBlocked(true);
  assert.equal(room.holdRoomDesignForSession({ ...defaultDesign(), id: 'd1', name: 'Guest room' }), true);
  // Sign-in: the ledger learns the account, the device is wiped, the carry lands.
  carry.noteSessionIdentity('u1');
  for (const k of [...kvMap.keys()]) if (k.startsWith('ape:')) kvMap.delete(k);
  room.resetLocal();
  await carry.settleSessionCarry();
  await tick();
  assert.deepEqual(ids(), ['d1']);
  // The member deletes it.
  room.setRoomDesignSaveBlocked(false);
  assert.equal(await room.deleteRoomDesign('d1'), true);
  assert.deepEqual(ids(), []);
  // Later the membership read fails (the lab treats them as a guest) and a
  // SAVE is held: the ledger writes everything it holds again.
  room.setRoomDesignSaveBlocked(true);
  assert.equal(room.holdRoomDesignForSession({ ...defaultDesign(), id: 'd2', name: 'Second room' }), true);
  await tick();
  assert.deepEqual(ids(), ['d2'], 'the deleted design stays deleted; the new one is carried');
  // Saved again (the same id), it is carried again.
  assert.equal(room.holdRoomDesignForSession({ ...defaultDesign(), id: 'd1', name: 'Guest room again' }), true);
  await tick();
  assert.deepEqual(ids(), ['d1', 'd2']);
  carry.__resetSessionCarryForTests();
});
